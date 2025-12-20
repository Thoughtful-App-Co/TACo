/**
 * Cloudflare Worker for scraping job postings and extracting structured data
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Anthropic } from '@anthropic-ai/sdk';
import { z } from 'zod';

interface Env {
  ANTHROPIC_API_KEY: string;
}

// Input validation schema
const RequestSchema = z.object({
  url: z.string().url('Invalid URL provided'),
});

// Output schema for scraped job data
const ScrapedJobSchema = z.object({
  companyName: z.string().optional(),
  roleName: z.string().optional(),
  location: z.string().optional(),
  locationType: z.enum(['remote', 'hybrid', 'onsite']).optional(),
  salary: z.string().optional(),
  description: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  niceToHave: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
});

type ScrapedJob = z.infer<typeof ScrapedJobSchema>;

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // Check for API key
  const apiKeyFromHeader = request.headers.get('X-API-Key');
  const apiKey = apiKeyFromHeader || env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: 'API key not configured. Please set up your API key in settings.',
        code: 'MISSING_API_KEY',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Parse and validate request body
    const body = await request.json().catch(() => ({}));

    const validation = RequestSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          code: 'VALIDATION_ERROR',
          details: validation.error.errors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { url } = validation.data;

    // Fetch the job posting page
    let pageContent: string;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }

      pageContent = await response.text();
    } catch (fetchError) {
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch job posting',
          code: 'FETCH_ERROR',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract text content from HTML (basic extraction)
    const textContent = extractTextFromHtml(pageContent);

    // If the page is too short, it might be a login wall or error
    if (textContent.length < 200) {
      return new Response(
        JSON.stringify({
          error:
            'Could not extract job content. The page may require login or have dynamic content.',
          code: 'EXTRACTION_ERROR',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Use Claude to extract structured job data
    const anthropic = new Anthropic({ apiKey });

    // Truncate content if too long (keep first ~15k chars)
    const truncatedContent = textContent.slice(0, 15000);

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      temperature: 0.1,
      system: `You are an expert at extracting structured job posting information from webpage text. 
Extract key details accurately. If something is not found, omit it rather than guessing.`,
      messages: [
        {
          role: 'user',
          content: `Extract job posting details from this webpage content:

${truncatedContent}

Return a JSON object with these fields (omit any that aren't clearly present):
{
  "companyName": "The company name",
  "roleName": "The job title/role",
  "location": "Job location (city, state, country)",
  "locationType": "remote" | "hybrid" | "onsite",
  "salary": "Salary range if mentioned",
  "description": "Brief job description (2-3 sentences)",
  "requirements": ["Required skill 1", "Required skill 2", ...],
  "niceToHave": ["Nice to have skill 1", ...],
  "benefits": ["Benefit 1", "Benefit 2", ...]
}

Only return valid JSON, no other text.`,
        },
      ],
    });

    // Extract the response content
    const messageContent = response.content[0];
    if (!('text' in messageContent)) {
      throw new Error('Invalid API response format');
    }

    // Parse the JSON response
    let scrapedData: ScrapedJob;
    try {
      const jsonMatch = messageContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      scrapedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          error: 'Failed to parse extracted data',
          code: 'PARSE_ERROR',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify(scrapedData), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Job scraping error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to scrape job posting',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Basic HTML to text extraction
 * Removes script/style tags and extracts visible text
 */
function extractTextFromHtml(html: string): string {
  // Remove script and style elements
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, ' ');

  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&#x27;/g, "'");
  text = text.replace(/&#x2F;/g, '/');

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}
