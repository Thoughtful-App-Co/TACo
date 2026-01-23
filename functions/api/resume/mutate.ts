/**
 * Resume Mutation API - Cloudflare Worker
 *
 * Tailors resumes to specific job descriptions using AI.
 *
 * Flow:
 * 1. Receive resume + job description
 * 2. Extract keywords locally (free)
 * 3. Analyze gaps (free)
 * 4. Use Claude to rewrite bullets and summary (paid)
 * 5. Return mutations with before/after
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Anthropic } from '@anthropic-ai/sdk';
import { z } from 'zod';
import { authorizeTokenFeature } from '../../lib/auth-middleware';
import { resumeLog } from '../../lib/logger';

interface Env {
  ANTHROPIC_API_KEY: string;
  JWT_SECRET: string;
  AUTH_DB: any; // D1Database from Cloudflare runtime
  BILLING_DB: any; // D1Database from Cloudflare runtime
}

// ============================================================================
// REQUEST/RESPONSE SCHEMAS
// ============================================================================

const MutationRequestSchema = z.object({
  // Master resume data
  masterResume: z.object({
    summary: z.string().optional(),
    experiences: z.array(
      z.object({
        id: z.string(),
        company: z.string(),
        title: z.string(),
        bullets: z.array(z.string()),
        skills: z.array(z.string()).optional(),
      })
    ),
    skills: z.array(z.string()),
    extractedKeywords: z
      .object({
        skills: z.array(z.string()),
        knowledge: z.array(z.string()),
        tools: z.array(z.string()),
      })
      .optional(),
  }),

  // Job description (user pastes this)
  jobDescription: z.string().min(100, 'Job description too short'),

  // Optional context
  targetCompany: z.string().optional(),
  targetRole: z.string().optional(),

  // User preferences
  preferences: z
    .object({
      tone: z.enum(['professional', 'technical', 'executive', 'casual']).default('professional'),
      length: z.enum(['concise', 'detailed']).default('concise'),
      emphasize: z.array(z.string()).optional(),
      deemphasize: z.array(z.string()).optional(),
    })
    .optional(),
});

type MutationRequest = z.infer<typeof MutationRequestSchema>;

interface MutationResponse {
  success: boolean;

  // Analysis results (from local processing)
  analysis: {
    jdKeywords: {
      skills: string[];
      knowledge: string[];
      tools: string[];
      requirements: string[];
    };
    matchedKeywords: string[];
    missingKeywords: string[];
    matchScoreBefore: number;
    matchScoreAfter: number;
  };

  // The mutations (from Claude)
  mutations: {
    summary: {
      original: string | null;
      mutated: string;
      reason: string;
    } | null;
    experiences: {
      experienceId: string;
      bullets: {
        original: string;
        mutated: string;
        keywordsAdded: string[];
        reason: string;
      }[];
    }[];
    skillsReordered: string[];
    skillsToAdd: string[];
  };

  // Metadata
  processingTime: number;
  aiTokensUsed: number;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const startTime = Date.now();

  // SECURITY: Validate authentication, check subscription, and deduct token
  const authResult = await authorizeTokenFeature(request, env, {
    requiredProducts: ['tenure_extras'],
    tokenCost: 2,
    resourceName: 'resume_mutation',
  });

  if (!authResult.success) {
    return authResult.response;
  }

  const { auth, newTokenBalance } = authResult;

  // Use environment API key (no more BYOK support - security risk)
  const apiKey = env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: 'API key not configured',
        code: 'MISSING_API_KEY',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse and validate request
    const body = await request.json().catch(() => ({}));
    const validation = MutationRequestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          code: 'VALIDATION_ERROR',
          details: validation.error.errors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const mutationRequest = validation.data;

    // Step 1: Extract keywords from JD (would use our services, but they're client-side)
    // For now, we'll do basic extraction in the worker
    const jdKeywords = await extractKeywordsSimple(mutationRequest.jobDescription);

    // Step 2: Match against resume keywords
    const resumeKeywords = {
      skills: mutationRequest.masterResume.extractedKeywords?.skills || [],
      knowledge: mutationRequest.masterResume.extractedKeywords?.knowledge || [],
      tools: mutationRequest.masterResume.extractedKeywords?.tools || [],
    };

    const matchedKeywords = findMatches(jdKeywords, resumeKeywords);
    const missingKeywords = findMissing(jdKeywords, resumeKeywords);

    // Calculate match score before
    const totalJDKeywords = [...jdKeywords.skills, ...jdKeywords.knowledge, ...jdKeywords.tools]
      .length;
    const matchScoreBefore =
      totalJDKeywords > 0 ? Math.round((matchedKeywords.length / totalJDKeywords) * 100) : 0;

    // Step 3: Use Claude to mutate resume
    const anthropic = new Anthropic({ apiKey });
    let totalTokens = 0;

    // Mutate summary
    const summaryMutation = await mutateSummary(
      anthropic,
      mutationRequest.masterResume.summary || null,
      missingKeywords,
      mutationRequest.targetRole,
      mutationRequest.targetCompany,
      mutationRequest.preferences?.tone || 'professional'
    );
    totalTokens += summaryMutation.tokensUsed;

    // Mutate experience bullets
    const experienceMutations: { experienceId: string; bullets: any[] }[] = [];
    for (const exp of mutationRequest.masterResume.experiences) {
      const bulletMutations = await mutateExperienceBullets(
        anthropic,
        exp,
        missingKeywords,
        mutationRequest.targetRole,
        mutationRequest.preferences?.tone || 'professional',
        mutationRequest.preferences?.length || 'concise'
      );
      totalTokens += bulletMutations.tokensUsed;

      experienceMutations.push({
        experienceId: exp.id,
        bullets: bulletMutations.bullets,
      });
    }

    // Reorder skills (simple: JD keywords first, then others)
    const skillsReordered = reorderSkills(mutationRequest.masterResume.skills, [
      ...jdKeywords.skills,
      ...jdKeywords.tools,
    ]);

    // Suggest skills to add (from missing keywords)
    const skillsToAdd = missingKeywords.slice(0, 5);

    // Calculate match score after (estimate)
    const matchScoreAfter = Math.min(matchScoreBefore + 20, 95); // Conservative estimate

    const processingTime = Date.now() - startTime;

    const response: MutationResponse = {
      success: true,
      analysis: {
        jdKeywords: {
          skills: jdKeywords.skills,
          knowledge: jdKeywords.knowledge,
          tools: jdKeywords.tools,
          requirements: jdKeywords.requirements,
        },
        matchedKeywords,
        missingKeywords,
        matchScoreBefore,
        matchScoreAfter,
      },
      mutations: {
        summary: summaryMutation.mutation,
        experiences: experienceMutations,
        skillsReordered,
        skillsToAdd,
      },
      processingTime,
      aiTokensUsed: totalTokens,
    };

    return new Response(
      JSON.stringify({
        ...response,
        tokenBalance: newTokenBalance === -1 ? 'unlimited' : newTokenBalance,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    resumeLog.error('Mutation error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to mutate resume',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Simple keyword extraction (basic version for worker)
 */
async function extractKeywordsSimple(text: string) {
  const lower = text.toLowerCase();

  // Basic pattern matching for common skill/knowledge terms
  const skills: string[] = [];
  const knowledge: string[] = [];
  const tools: string[] = [];
  const requirements: string[] = [];

  // Extract common patterns
  const words = text.match(/\b\w+\b/g) || [];
  const uniqueWords = [...new Set(words.map((w) => w.toLowerCase()))];

  // Simple categorization (would use our full service client-side)
  for (const word of uniqueWords) {
    if (word.length < 3) continue;

    // Requirements
    if (/years?|degree|bachelor|master|phd|certification/i.test(word)) {
      requirements.push(word);
    }
    // Tools (common software/equipment terms)
    else if (/software|system|platform|tool|crm|erp|ehr|emr/i.test(word)) {
      tools.push(word);
    }
    // Skills/knowledge (everything else that looks important)
    else if (word.length > 4) {
      skills.push(word);
    }
  }

  return {
    skills: skills.slice(0, 20),
    knowledge: knowledge.slice(0, 10),
    tools: tools.slice(0, 15),
    requirements: requirements.slice(0, 5),
  };
}

/**
 * Find matched keywords between JD and resume
 */
function findMatches(jdKeywords: any, resumeKeywords: any): string[] {
  const allJD = [...jdKeywords.skills, ...jdKeywords.knowledge, ...jdKeywords.tools];
  const allResume = [
    ...resumeKeywords.skills,
    ...resumeKeywords.knowledge,
    ...resumeKeywords.tools,
  ];

  const matched: string[] = [];
  for (const jdKw of allJD) {
    for (const resumeKw of allResume) {
      if (
        jdKw.toLowerCase() === resumeKw.toLowerCase() ||
        jdKw.toLowerCase().includes(resumeKw.toLowerCase()) ||
        resumeKw.toLowerCase().includes(jdKw.toLowerCase())
      ) {
        matched.push(jdKw);
        break;
      }
    }
  }

  return [...new Set(matched)];
}

/**
 * Find missing keywords
 */
function findMissing(jdKeywords: any, resumeKeywords: any): string[] {
  const matched = findMatches(jdKeywords, resumeKeywords);
  const allJD = [...jdKeywords.skills, ...jdKeywords.knowledge, ...jdKeywords.tools];
  return allJD.filter((kw) => !matched.includes(kw)).slice(0, 10);
}

/**
 * Reorder skills to prioritize JD keywords
 */
function reorderSkills(resumeSkills: string[], jdKeywords: string[]): string[] {
  const jdSet = new Set(jdKeywords.map((k) => k.toLowerCase()));
  const matched: string[] = [];
  const unmatched: string[] = [];

  for (const skill of resumeSkills) {
    if (jdSet.has(skill.toLowerCase())) {
      matched.push(skill);
    } else {
      unmatched.push(skill);
    }
  }

  return [...matched, ...unmatched];
}

/**
 * Mutate summary using Claude
 */
async function mutateSummary(
  anthropic: Anthropic,
  originalSummary: string | null,
  missingKeywords: string[],
  targetRole?: string,
  targetCompany?: string,
  tone: string = 'professional'
): Promise<{ mutation: any; tokensUsed: number }> {
  if (missingKeywords.length === 0 && originalSummary) {
    return {
      mutation: null,
      tokensUsed: 0,
    };
  }

  const prompt = `You are a professional resume writer. Generate a compelling professional summary.

CONTEXT:
${targetRole ? `Target Role: ${targetRole}` : ''}
${targetCompany ? `Target Company: ${targetCompany}` : ''}
${originalSummary ? `Current Summary: ${originalSummary}` : 'No existing summary'}

KEYWORDS TO INCORPORATE (naturally):
${missingKeywords.slice(0, 5).join(', ')}

TONE: ${tone}

RULES:
1. Write 2-3 sentences maximum
2. Incorporate keywords naturally - NO keyword stuffing
3. Focus on achievements and value proposition
4. Match the ${tone} tone
5. Be specific and quantifiable where possible

Return ONLY valid JSON in this format:
{
  "summary": "The new professional summary here",
  "reason": "Brief explanation of changes made"
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Invalid response format');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      mutation: {
        original: originalSummary,
        mutated: parsed.summary,
        reason: parsed.reason,
      },
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    };
  } catch (error) {
    resumeLog.error('Summary mutation error:', error);
    return { mutation: null, tokensUsed: 0 };
  }
}

/**
 * Mutate experience bullets using Claude
 */
async function mutateExperienceBullets(
  anthropic: Anthropic,
  experience: any,
  missingKeywords: string[],
  targetRole?: string,
  tone: string = 'professional',
  length: string = 'concise'
): Promise<{ bullets: any[]; tokensUsed: number }> {
  const bulletsToMutate = experience.bullets.slice(0, 3); // Only mutate top 3 bullets
  const keywordsForThisExp = missingKeywords.slice(0, 3);

  if (keywordsForThisExp.length === 0) {
    return {
      bullets: bulletsToMutate.map((b) => ({
        original: b,
        mutated: b,
        keywordsAdded: [],
        reason: 'No keywords needed',
      })),
      tokensUsed: 0,
    };
  }

  const prompt = `You are a professional resume writer. Rewrite these experience bullets to incorporate target keywords.

EXPERIENCE CONTEXT:
Company: ${experience.company}
Title: ${experience.title}
${targetRole ? `Target Role: ${targetRole}` : ''}

ORIGINAL BULLETS:
${bulletsToMutate.map((b, i) => `${i + 1}. ${b}`).join('\n')}

KEYWORDS TO INCORPORATE (if naturally applicable):
${keywordsForThisExp.join(', ')}

TONE: ${tone}
LENGTH: ${length}

RULES:
1. NEVER fabricate achievements or experience
2. Only reframe/reword existing accomplishments
3. Incorporate keywords naturally - NO keyword stuffing
4. Maintain truthfulness and integrity
5. Start with action verbs
6. Include metrics/results where present
7. ${length === 'concise' ? 'Keep bullets brief (1 line)' : 'Expand with detail (1-2 lines)'}

Return ONLY valid JSON array in this format:
[
  {
    "original": "original bullet text",
    "mutated": "rewritten bullet with keywords",
    "keywordsAdded": ["keyword1", "keyword2"],
    "reason": "brief explanation"
  }
]`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Invalid response format');
    }

    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      bullets: parsed,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    };
  } catch (error) {
    resumeLog.error('Bullet mutation error:', error);
    return {
      bullets: bulletsToMutate.map((b) => ({
        original: b,
        mutated: b,
        keywordsAdded: [],
        reason: 'Mutation failed',
      })),
      tokensUsed: 0,
    };
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
