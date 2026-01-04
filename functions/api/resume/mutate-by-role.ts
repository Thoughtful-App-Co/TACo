/**
 * Resume Mutation by Role - Cloudflare Worker Endpoint
 *
 * Different from /api/resume/mutate (JD-based):
 * - Uses O*NET occupation data instead of job description
 * - Transforms resume to match role archetype
 * - Emphasizes skills/experience relevant to the role
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { z } from 'zod';
import { authorizeTokenFeature } from '../../lib/auth-middleware';
import { resumeLog } from '../../lib/logger';

// Request schema
const MutateByRoleRequestSchema = z.object({
  resume: z.object({
    name: z.string(),
    summary: z.string().optional(),
    experiences: z.array(
      z.object({
        id: z.string(),
        company: z.string(),
        title: z.string(),
        startDate: z.string(),
        endDate: z.string().optional(),
        bullets: z.array(z.string()),
      })
    ),
    skills: z.array(z.string()),
  }),
  occupationCode: z.string(),
  occupationTitle: z.string(),
  occupationData: z.object({
    skills: z.array(
      z.object({
        name: z.string(),
        level: z.number(),
        importance: z.number(),
      })
    ),
    knowledge: z.array(
      z.object({
        name: z.string(),
        level: z.number(),
        importance: z.number(),
      })
    ),
    abilities: z.array(
      z.object({
        name: z.string(),
        level: z.number(),
        importance: z.number(),
      })
    ),
    technologies: z.array(z.string()),
    tasks: z.array(z.string()),
  }),
  tone: z.enum(['professional', 'technical', 'executive', 'casual']).default('professional'),
  length: z.enum(['concise', 'detailed']).default('concise'),
});

// Response types
interface RoleMutationResponse {
  analysis: {
    roleTitle: string;
    roleCode: string;
    requiredSkills: string[];
    requiredKnowledge: string[];
    matchedSkills: string[];
    missingSkills: string[];
    matchScoreBefore: number;
    matchScoreAfter: number;
  };
  mutations: {
    originalSummary?: string;
    suggestedSummary?: string;
    bulletChanges: {
      experienceId: string;
      original: string;
      suggested: string;
      relevanceScore: number;
    }[];
    skillsToAdd: string[];
    skillsReordered: string[];
  };
  metadata: {
    model: string;
    processingTime: number;
    tokensUsed: {
      prompt: number;
      completion: number;
      total: number;
    };
  };
}

interface Env {
  ANTHROPIC_API_KEY: string;
  JWT_SECRET: string;
  AUTH_DB: any;
  BILLING_DB: any;
}

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  // SECURITY: Validate authentication, check subscription, and deduct token
  const authResult = await authorizeTokenFeature(request, env, {
    requiredProducts: ['tenure_extras'],
    tokenCost: 1,
    resourceName: 'resume_mutation_by_role',
  });

  if (!authResult.success) {
    return authResult.response;
  }

  const { newTokenBalance } = authResult;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const startTime = Date.now();

  try {
    const body = await request.json();
    const parsed = MutateByRoleRequestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: parsed.error.issues }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { resume, occupationCode, occupationTitle, occupationData, tone, length } = parsed.data;

    // Extract top skills and knowledge from O*NET data (sorted by importance)
    const topSkills = occupationData.skills
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10)
      .map((s) => s.name);

    const topKnowledge = occupationData.knowledge
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 8)
      .map((k) => k.name);

    const topTechnologies = occupationData.technologies.slice(0, 10);
    const typicalTasks = occupationData.tasks.slice(0, 5);

    // Calculate initial match score
    const resumeSkillsLower = resume.skills.map((s) => s.toLowerCase());
    const requiredSkillsLower = [...topSkills, ...topTechnologies].map((s) => s.toLowerCase());
    const matchedSkills = requiredSkillsLower.filter((skill) =>
      resumeSkillsLower.some((rs) => rs.includes(skill) || skill.includes(rs))
    );
    const matchScoreBefore = Math.round((matchedSkills.length / requiredSkillsLower.length) * 100);

    // Build Claude prompt for role-based mutation
    const systemPrompt = `You are an expert resume writer specializing in optimizing resumes for specific career roles.

Your task is to transform a resume to better align with the ${occupationTitle} role archetype based on O*NET occupation data.

CRITICAL RULES:
1. NEVER invent experience - only reframe existing accomplishments
2. Emphasize skills and experiences that align with the role requirements
3. Use industry-standard terminology for this occupation
4. Highlight transferable skills when direct experience is limited
5. Maintain authenticity while optimizing for the role

ROLE REQUIREMENTS FROM O*NET:
- Key Skills: ${topSkills.join(', ')}
- Knowledge Areas: ${topKnowledge.join(', ')}
- Technologies: ${topTechnologies.join(', ')}
- Typical Tasks: ${typicalTasks.join('; ')}

TONE: ${tone}
LENGTH: ${length}`;

    const userPrompt = `Transform this resume to better align with the ${occupationTitle} role:

CURRENT RESUME:
Name: ${resume.name}
Summary: ${resume.summary || 'No summary provided'}

Experience:
${resume.experiences
  .map(
    (exp) => `
[${exp.id}] ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})
Bullets:
${exp.bullets.map((b, i) => `  ${i + 1}. ${b}`).join('\n')}
`
  )
  .join('\n')}

Current Skills: ${resume.skills.join(', ')}

Provide your response in this exact JSON format:
{
  "suggestedSummary": "2-3 sentence summary optimized for ${occupationTitle} role",
  "bulletChanges": [
    {
      "experienceId": "experience ID",
      "original": "original bullet text",
      "suggested": "rewritten bullet emphasizing role-relevant skills",
      "relevanceScore": 0.0-1.0
    }
  ],
  "skillsToAdd": ["skills from requirements not in current resume but supported by experience"],
  "skillsReordered": ["ordered list of all skills prioritized for this role"]
}

Only include bullets that benefit from rewriting. Focus on the most impactful changes.`;

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      resumeLog.error('Claude API error:', errorText);
      return new Response(JSON.stringify({ error: 'AI service error', details: errorText }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const claudeData = (await claudeResponse.json()) as any;
    const content = claudeData.content[0]?.text || '';

    // Parse Claude's JSON response
    let mutations: {
      suggestedSummary?: string;
      bulletChanges?: {
        experienceId: string;
        original: string;
        suggested: string;
        relevanceScore: number;
      }[];
      skillsToAdd?: string[];
      skillsReordered?: string[];
    };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      mutations = JSON.parse(jsonMatch[0]);
    } catch (e) {
      resumeLog.error('Failed to parse Claude response:', content);
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate improved match score
    const newSkills = [...resume.skills, ...(mutations.skillsToAdd || [])];
    const newSkillsLower = newSkills.map((s) => s.toLowerCase());
    const newMatchedSkills = requiredSkillsLower.filter((skill) =>
      newSkillsLower.some((rs) => rs.includes(skill) || skill.includes(rs))
    );
    const matchScoreAfter = Math.round(
      (newMatchedSkills.length / requiredSkillsLower.length) * 100
    );

    // Build response
    const response: RoleMutationResponse = {
      analysis: {
        roleTitle: occupationTitle,
        roleCode: occupationCode,
        requiredSkills: topSkills,
        requiredKnowledge: topKnowledge,
        matchedSkills: matchedSkills,
        missingSkills: requiredSkillsLower.filter((s) => !matchedSkills.includes(s)),
        matchScoreBefore,
        matchScoreAfter,
      },
      mutations: {
        originalSummary: resume.summary,
        suggestedSummary: mutations.suggestedSummary,
        bulletChanges: mutations.bulletChanges || [],
        skillsToAdd: mutations.skillsToAdd || [],
        skillsReordered: mutations.skillsReordered || resume.skills,
      },
      metadata: {
        model: 'claude-3-5-haiku-20241022',
        processingTime: Date.now() - startTime,
        tokensUsed: {
          prompt: claudeData.usage?.input_tokens || 0,
          completion: claudeData.usage?.output_tokens || 0,
          total: (claudeData.usage?.input_tokens || 0) + (claudeData.usage?.output_tokens || 0),
        },
      },
    };

    return new Response(
      JSON.stringify({
        ...response,
        tokenBalance: newTokenBalance === -1 ? 'unlimited' : newTokenBalance,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    resumeLog.error('Role mutation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
