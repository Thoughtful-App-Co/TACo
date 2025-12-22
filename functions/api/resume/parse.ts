/**
 * Resume Parser API - Claude-powered resume parsing
 *
 * Cloudflare Pages Function for /api/resume/parse
 * Parses resumes using Claude AI to extract structured data
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Anthropic } from '@anthropic-ai/sdk';

interface Env {
  ANTHROPIC_API_KEY: string;
}

interface ParseRequest {
  content: string;
  contentType: 'text' | 'pdf' | 'docx';
  fileName?: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  console.log('[Resume Parser] Request received');

  if (!env.ANTHROPIC_API_KEY) {
    console.error('[Resume Parser] Missing API key');
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const anthropic = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
  });

  try {
    const body: ParseRequest = await request.json();
    const { content, contentType, fileName } = body;

    console.log('[Resume Parser] Parsing resume:', {
      contentType,
      fileName,
      contentLength: content.length,
    });

    // Validate input
    if (!content || content.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Resume content is empty' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (content.length > 50000) {
      return new Response(JSON.stringify({ error: 'Resume content too large (max 50KB)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extract text from base64 if PDF/DOCX
    let resumeText = content;
    if (contentType === 'pdf' || contentType === 'docx') {
      // For now, we'll assume the content is already extracted text
      // In production, you'd use pdf-parse or mammoth here
      if (content.startsWith('data:')) {
        // Base64 encoded - would need server-side extraction
        return new Response(
          JSON.stringify({
            error: 'Binary file parsing not yet implemented. Please paste text instead.',
          }),
          {
            status: 501,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Call Claude to parse the resume
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0.3, // Lower temperature for more consistent parsing
      messages: [
        {
          role: 'user',
          content: `You are a resume parsing expert. Parse the following resume and extract structured information.

RESUME TEXT:
${resumeText}

Extract and return a JSON object with the following structure (ensure all fields are present, use empty arrays if no data found):

{
  "parsed": {
    "summary": "Professional summary or objective statement (string or null)",
    "experience": [
      {
        "id": "unique-id",
        "company": "Company Name",
        "title": "Job Title",
        "location": "City, State",
        "locationType": "remote|hybrid|onsite (or null)",
        "startDate": "2020-01-01T00:00:00.000Z (ISO 8601)",
        "endDate": "2023-12-31T00:00:00.000Z (ISO 8601, null if current)",
        "description": "Brief role description",
        "skills": ["skill1", "skill2"],
        "achievements": ["achievement 1", "achievement 2"],
        "bulletPoints": ["• Bullet point 1", "• Bullet point 2"]
      }
    ],
    "education": [
      {
        "id": "unique-id",
        "institution": "University Name",
        "degree": "Bachelor of Science",
        "field": "Computer Science",
        "graduationDate": "2020-05-01T00:00:00.000Z (ISO 8601, null if in progress)",
        "gpa": 3.8
      }
    ],
    "skills": ["JavaScript", "Python", "React", "etc"],
    "certifications": ["AWS Certified", "PMP", "etc"],
    "projects": [
      {
        "id": "unique-id",
        "name": "Project Name",
        "description": "What it does",
        "role": "lead|contributor|owner|collaborator",
        "technologies": ["tech1", "tech2"],
        "highlights": ["highlight 1", "highlight 2"],
        "canShowPublicly": true
      }
    ],
    "awards": ["Award 1", "Award 2"],
    "languages": ["English (Native)", "Spanish (Fluent)"]
  },
  "keywords": {
    "technical": ["programming languages", "frameworks", "tools"],
    "soft": ["leadership", "communication", "problem-solving"],
    "industry": ["finance", "healthcare", "tech"],
    "tools": ["Jira", "Git", "Docker"]
  },
  "extractedText": "Full cleaned text of resume",
  "confidence": 85
}

IMPORTANT:
- Generate unique IDs using format: "exp-1", "edu-1", "proj-1", etc.
- Parse dates carefully and convert to ISO 8601 format
- Infer location type (remote/hybrid/onsite) from context clues
- Extract quantifiable achievements separately (e.g., "increased sales by 30%")
- Categorize keywords by type
- Return confidence score (0-100) based on how well-structured the resume is
- Ensure all required fields exist, use null or empty arrays as appropriate
- Return ONLY valid JSON, no additional text`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : null;

    if (!responseText) {
      throw new Error('No text content in AI response');
    }

    console.log('[Resume Parser] Raw AI response:', responseText.substring(0, 200));

    // Parse and validate response
    let parsedData: any;
    try {
      // Claude might wrap JSON in markdown code blocks
      const jsonMatch =
        responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
        responseText.match(/```\n?([\s\S]*?)\n?```/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;

      parsedData = JSON.parse(jsonText.trim());
    } catch (parseError) {
      console.error('[Resume Parser] JSON parse error:', parseError);
      console.error('[Resume Parser] Raw response:', responseText);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate structure
    if (!parsedData.parsed || !parsedData.keywords) {
      throw new Error('Invalid response structure from AI');
    }

    console.log('[Resume Parser] Successfully parsed:', {
      experienceCount: parsedData.parsed.experience?.length || 0,
      educationCount: parsedData.parsed.education?.length || 0,
      skillsCount: parsedData.parsed.skills?.length || 0,
      confidence: parsedData.confidence,
    });

    return new Response(
      JSON.stringify({
        success: true,
        ...parsedData,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('[Resume Parser] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Resume parsing failed',
        parsed: {
          experience: [],
          education: [],
          skills: [],
          certifications: [],
        },
        keywords: {
          technical: [],
          soft: [],
          industry: [],
          tools: [],
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
