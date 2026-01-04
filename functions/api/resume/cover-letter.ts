/**
 * Cover Letter Generation - Cloudflare Worker Endpoint
 *
 * Generates a tailored cover letter based on resume and job description/role.
 * Costs an extra credit (tracked separately).
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { z } from 'zod';
import { authorizeTokenFeature } from '../../lib/auth-middleware';
import { resumeLog } from '../../lib/logger';

// Request schema
const CoverLetterRequestSchema = z.object({
  resume: z.object({
    name: z.string(),
    summary: z.string().optional(),
    experiences: z.array(
      z.object({
        company: z.string(),
        title: z.string(),
        startDate: z.string(),
        endDate: z.string().optional(),
        bullets: z.array(z.string()),
      })
    ),
    skills: z.array(z.string()),
  }),
  // Either job description OR occupation data (not both required)
  jobDescription: z.string().optional(),
  occupationTitle: z.string().optional(),
  occupationData: z
    .object({
      skills: z.array(z.object({ name: z.string() })),
      tasks: z.array(z.string()),
    })
    .optional(),
  // Target details
  targetCompany: z.string(),
  targetRole: z.string(),
  hiringManagerName: z.string().optional(),
  // Style preferences
  tone: z
    .enum(['professional', 'enthusiastic', 'formal', 'conversational'])
    .default('professional'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  // Points to emphasize
  keyPoints: z.array(z.string()).optional(),
});

// Response type
interface CoverLetterResponse {
  coverLetter: string;
  sections: {
    opening: string;
    body: string[];
    closing: string;
  };
  keywordsUsed: string[];
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
    resourceName: 'cover_letter_generation',
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
    const parsed = CoverLetterRequestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: parsed.error.issues }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const {
      resume,
      jobDescription,
      occupationTitle,
      occupationData,
      targetCompany,
      targetRole,
      hiringManagerName,
      tone,
      length,
      keyPoints,
    } = parsed.data;

    // Determine length in words
    const lengthGuide = {
      short: '150-200 words, 2-3 paragraphs',
      medium: '250-350 words, 3-4 paragraphs',
      long: '400-500 words, 4-5 paragraphs',
    };

    // Build context from either JD or occupation data
    let roleContext = '';
    if (jobDescription) {
      roleContext = `JOB DESCRIPTION:\n${jobDescription}`;
    } else if (occupationTitle && occupationData) {
      roleContext = `TARGET ROLE: ${occupationTitle}
KEY SKILLS: ${occupationData.skills
        .slice(0, 10)
        .map((s) => s.name)
        .join(', ')}
TYPICAL RESPONSIBILITIES: ${occupationData.tasks.slice(0, 5).join('; ')}`;
    }

    // Build Claude prompt
    const systemPrompt = `You are an expert cover letter writer who creates compelling, personalized cover letters that get interviews.

CRITICAL RULES:
1. Be authentic - reflect the candidate's actual experience
2. Be specific - use concrete examples from the resume
3. Be concise - respect the reader's time
4. Be confident but not arrogant
5. Address specific requirements from the role
6. Show enthusiasm for THIS company and THIS role
7. Include a clear call to action

TONE: ${tone}
LENGTH: ${lengthGuide[length]}`;

    const userPrompt = `Write a cover letter for this candidate applying to ${targetRole} at ${targetCompany}.

${hiringManagerName ? `Address it to: ${hiringManagerName}` : 'Use a general greeting if no name provided.'}

CANDIDATE'S RESUME:
Name: ${resume.name}
Summary: ${resume.summary || 'Not provided'}

Recent Experience:
${resume.experiences
  .slice(0, 3)
  .map(
    (exp) => `
• ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})
  Key achievements: ${exp.bullets.slice(0, 3).join('; ')}
`
  )
  .join('\n')}

Skills: ${resume.skills.slice(0, 15).join(', ')}

${roleContext}

${keyPoints && keyPoints.length > 0 ? `POINTS TO EMPHASIZE:\n${keyPoints.map((p) => `• ${p}`).join('\n')}` : ''}

Provide your response in this exact JSON format:
{
  "coverLetter": "Full cover letter text with proper formatting and paragraphs",
  "sections": {
    "opening": "First paragraph - hook and connection to company",
    "body": ["Second paragraph - relevant experience", "Third paragraph - skills match (if needed)"],
    "closing": "Final paragraph - call to action"
  },
  "keywordsUsed": ["list", "of", "keywords", "from", "role", "used", "in", "letter"]
}`;

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
        max_tokens: 1500,
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
    let result: {
      coverLetter: string;
      sections: { opening: string; body: string[]; closing: string };
      keywordsUsed?: string[];
    };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      result = JSON.parse(jsonMatch[0]);
    } catch (e) {
      resumeLog.error('Failed to parse Claude response:', content);
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build response
    const response: CoverLetterResponse = {
      coverLetter: result.coverLetter,
      sections: result.sections,
      keywordsUsed: result.keywordsUsed || [],
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
    resumeLog.error('Cover letter generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
