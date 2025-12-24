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
      // In production, you'd use pdfjs-dist or mammoth here
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
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0.1, // Very low temperature for consistent JSON output
      system:
        'You are a precise resume parsing assistant. You MUST respond with ONLY valid JSON. Do not include any explanatory text, markdown formatting, or code blocks. Output raw JSON only.',
      messages: [
        {
          role: 'user',
          content: `Parse the following resume and return ONLY a valid JSON object (no markdown, no code blocks, no explanatory text).

RESUME TEXT:
${resumeText}

Return a JSON object with this EXACT structure:

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

CRITICAL REQUIREMENTS:
1. Return ONLY the JSON object - no explanations, no markdown, no code blocks
2. Generate unique IDs using format: "exp-1", "edu-1", "proj-1", etc.
3. Parse dates carefully and convert to ISO 8601 format
4. Infer location type (remote/hybrid/onsite) from context clues
5. Extract quantifiable achievements separately (e.g., "increased sales by 30%")
6. Categorize keywords by type
7. Return confidence score (0-100) based on how well-structured the resume is
8. Ensure all required fields exist, use null or empty arrays as appropriate
9. Output must be parseable by JSON.parse() - test it mentally before responding
10. Start your response with { and end with } - nothing else`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : null;

    if (!responseText) {
      throw new Error('No text content in AI response');
    }

    console.log(
      '[Resume Parser] Raw AI response (first 500 chars):',
      responseText.substring(0, 500)
    );
    console.log(
      '[Resume Parser] Raw AI response (last 500 chars):',
      responseText.substring(Math.max(0, responseText.length - 500))
    );
    console.log('[Resume Parser] Total response length:', responseText.length);

    // Parse and validate response
    let parsedData: any;
    try {
      let jsonText = responseText.trim();

      // Remove markdown code blocks if present
      const jsonMatch =
        jsonText.match(/```json\s*\n?([\s\S]*?)\n?```/) ||
        jsonText.match(/```\s*\n?([\s\S]*?)\n?```/);

      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
        console.log('[Resume Parser] Extracted JSON from code block');
      }

      // Remove any leading/trailing text before { or after }
      const jsonStart = jsonText.indexOf('{');
      const jsonEnd = jsonText.lastIndexOf('}');

      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
        console.log('[Resume Parser] Extracted JSON between braces');
      }

      console.log('[Resume Parser] Attempting to parse JSON, length:', jsonText.length);
      console.log('[Resume Parser] JSON preview (first 300 chars):', jsonText.substring(0, 300));

      parsedData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[Resume Parser] JSON parse error:', parseError);
      console.error('[Resume Parser] Full raw response:', responseText);
      console.error('[Resume Parser] Response type:', typeof responseText);
      console.error('[Resume Parser] Response starts with:', responseText.substring(0, 100));
      console.error(
        '[Resume Parser] Response ends with:',
        responseText.substring(responseText.length - 100)
      );

      // Try to save the problematic response for debugging
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to parse AI response as JSON',
          debugInfo: {
            parseError: parseError instanceof Error ? parseError.message : String(parseError),
            responseLength: responseText.length,
            responsePreview: responseText.substring(0, 500),
            responseSuffix: responseText.substring(Math.max(0, responseText.length - 200)),
          },
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
