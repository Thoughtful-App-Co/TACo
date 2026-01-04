/**
 * Cloudflare Worker for scraping job postings and extracting structured data
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Anthropic } from '@anthropic-ai/sdk';
import { z } from 'zod';
import { tasksLog } from '../../lib/logger';

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
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.string().optional(),
  salaryPeriod: z.enum(['hourly', 'annual']).optional(),
  description: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  niceToHave: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
});

type ScrapedJob = z.infer<typeof ScrapedJobSchema>;

// Schema.org JobPosting structured data interface
interface JobPostingJsonLd {
  '@type'?: string;
  title?: string;
  description?: string;
  datePosted?: string;
  validThrough?: string;
  employmentType?: string | string[];
  hiringOrganization?: {
    '@type'?: string;
    name?: string;
    sameAs?: string;
    logo?: string;
  };
  jobLocation?: {
    '@type'?: string;
    address?: {
      '@type'?: string;
      streetAddress?: string;
      addressLocality?: string;
      addressRegion?: string;
      postalCode?: string;
      addressCountry?: string;
    };
  };
  jobLocationType?: string;
  baseSalary?: {
    '@type'?: string;
    currency?: string;
    value?: {
      '@type'?: string;
      value?: number;
      minValue?: number;
      maxValue?: number;
      unitText?: string;
    };
  };
  applicantLocationRequirements?: {
    '@type'?: string;
    name?: string;
  };
  qualifications?: string;
  responsibilities?: string;
  skills?: string;
  benefits?: string;
}

// Meta tags extracted from page
interface MetaTags {
  ogTitle?: string;
  ogDescription?: string;
  ogSiteName?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  description?: string;
  title?: string;
}

// Browser-like headers to avoid bot detection
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
  DNT: '1',
};

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
    tasksLog.info('Request received for URL:', url);

    // Fetch the job posting page
    let pageContent: string;
    try {
      const response = await fetch(url, {
        headers: BROWSER_HEADERS,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }

      pageContent = await response.text();
      tasksLog.debug('Fetched page, content length:', pageContent.length);
    } catch (fetchError) {
      tasksLog.debug('Fetch error:', fetchError instanceof Error ? fetchError.message : fetchError);
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

    // Extract JSON-LD structured data (most reliable source)
    const jsonLdData = extractJsonLd(pageContent);
    tasksLog.debug(
      'JSON-LD data found:',
      !!jsonLdData,
      jsonLdData ? JSON.stringify(jsonLdData).slice(0, 200) + '...' : 'none'
    );

    // Extract meta tags
    const metaTags = extractMetaTags(pageContent);
    tasksLog.debug(
      'Meta tags found:',
      Object.keys(metaTags)
        .filter((k) => metaTags[k as keyof MetaTags])
        .join(', ') || 'none'
    );

    // Extract text content from HTML with better structure preservation
    const textContent = extractTextFromHtml(pageContent);
    tasksLog.debug(
      'Extracted text length:',
      textContent.length,
      'First 200 chars:',
      textContent.slice(0, 200)
    );

    // If the page is too short, it might be a login wall or error
    if (textContent.length < 200 && !jsonLdData) {
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

    // Truncate content if too long (keep first ~12k chars to leave room for JSON-LD)
    const truncatedContent = textContent.slice(0, 12000);

    // Build context with all available data
    let additionalContext = '';

    if (jsonLdData) {
      additionalContext += `\n\n=== STRUCTURED DATA (JSON-LD) ===\nThis is highly reliable structured data extracted from the page:\n${JSON.stringify(jsonLdData, null, 2)}\n`;
    }

    if (metaTags.ogTitle || metaTags.ogDescription || metaTags.description) {
      additionalContext += `\n\n=== META TAGS ===\n`;
      if (metaTags.ogTitle) additionalContext += `OG Title: ${metaTags.ogTitle}\n`;
      if (metaTags.ogDescription)
        additionalContext += `OG Description: ${metaTags.ogDescription}\n`;
      if (metaTags.ogSiteName) additionalContext += `Site Name: ${metaTags.ogSiteName}\n`;
      if (metaTags.description) additionalContext += `Meta Description: ${metaTags.description}\n`;
    }

    tasksLog.debug('Calling Claude API with', truncatedContent.length, 'chars of content');
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      temperature: 0.1,
      system: `You are an expert at extracting structured job posting information from webpage content. 
Extract key details accurately and comprehensively. If something is not clearly present, omit it rather than guessing.

For salary information, be especially careful to:
- Extract the minimum and maximum values as numbers (no currency symbols or commas)
- Identify the currency (USD, EUR, GBP, etc.)
- Determine if it's hourly or annual pay
- If only one salary number is given, use it for both min and max
- Convert "k" notation to full numbers (e.g., "120k" = 120000)

Prioritize structured data (JSON-LD) when available as it's the most reliable source.`,
      messages: [
        {
          role: 'user',
          content: `Extract job posting details from this webpage content.
${additionalContext}

=== PAGE TEXT CONTENT ===
${truncatedContent}

Return a JSON object with these fields (omit any that aren't clearly present):
{
  "companyName": "The company name",
  "roleName": "The job title/role",
  "location": "Job location (city, state, country)",
  "locationType": "remote" | "hybrid" | "onsite",
  "salary": "Human-readable salary string (e.g., '$100,000 - $150,000/year')",
  "salaryMin": 100000,
  "salaryMax": 150000,
  "salaryCurrency": "USD",
  "salaryPeriod": "hourly" | "annual",
  "description": "Brief job description (2-3 sentences summarizing the role)",
  "requirements": ["Required skill 1", "Required skill 2", ...],
  "niceToHave": ["Nice to have skill 1", ...],
  "benefits": ["Benefit 1", "Benefit 2", ...]
}

Important notes:
- salaryMin and salaryMax should be numbers without currency symbols
- If salary is hourly, set salaryPeriod to "hourly"; if annual/yearly, set to "annual"
- Only return valid JSON, no other text.`,
        },
      ],
    });

    // Extract the response content
    const messageContent = response.content[0];
    if (!('text' in messageContent)) {
      throw new Error('Invalid API response format');
    }
    tasksLog.debug('Claude response:', messageContent.text.slice(0, 500));

    // Parse the JSON response
    let scrapedData: ScrapedJob;
    try {
      const jsonMatch = messageContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      scrapedData = JSON.parse(jsonMatch[0]);
      tasksLog.debug('Parsed data:', JSON.stringify(scrapedData, null, 2));
    } catch (parseError) {
      tasksLog.debug('Parse error:', parseError instanceof Error ? parseError.message : parseError);
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

    // If we have JSON-LD data, supplement missing fields
    if (jsonLdData) {
      scrapedData = supplementFromJsonLd(scrapedData, jsonLdData);
    }

    return new Response(JSON.stringify(scrapedData), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    tasksLog.error(
      'Job scraping error:',
      error instanceof Error ? error.message : error,
      error instanceof Error ? error.stack : ''
    );

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
 * Extract JSON-LD structured data from HTML
 * Looks for Schema.org JobPosting data
 */
function extractJsonLd(html: string): JobPostingJsonLd | null {
  const jsonLdPattern =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = jsonLdPattern.exec(html)) !== null) {
    try {
      const jsonContent = match[1].trim();
      const parsed = JSON.parse(jsonContent);

      // Handle both single objects and arrays
      const items = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of items) {
        // Check if it's a JobPosting
        if (item['@type'] === 'JobPosting') {
          return item as JobPostingJsonLd;
        }

        // Check @graph array (common in some implementations)
        if (item['@graph'] && Array.isArray(item['@graph'])) {
          for (const graphItem of item['@graph']) {
            if (graphItem['@type'] === 'JobPosting') {
              return graphItem as JobPostingJsonLd;
            }
          }
        }
      }
    } catch {
      // Continue to next script tag if parsing fails
      continue;
    }
  }

  return null;
}

/**
 * Extract meta tags from HTML
 */
function extractMetaTags(html: string): MetaTags {
  const meta: MetaTags = {};

  // Extract Open Graph tags
  const ogTitleMatch = html.match(
    /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i
  );
  if (ogTitleMatch) meta.ogTitle = decodeHtmlEntities(ogTitleMatch[1]);

  const ogDescMatch = html.match(
    /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i
  );
  if (ogDescMatch) meta.ogDescription = decodeHtmlEntities(ogDescMatch[1]);

  const ogSiteMatch = html.match(
    /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i
  );
  if (ogSiteMatch) meta.ogSiteName = decodeHtmlEntities(ogSiteMatch[1]);

  const ogImageMatch = html.match(
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
  );
  if (ogImageMatch) meta.ogImage = decodeHtmlEntities(ogImageMatch[1]);

  // Extract Twitter tags
  const twitterTitleMatch = html.match(
    /<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i
  );
  if (twitterTitleMatch) meta.twitterTitle = decodeHtmlEntities(twitterTitleMatch[1]);

  const twitterDescMatch = html.match(
    /<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i
  );
  if (twitterDescMatch) meta.twitterDescription = decodeHtmlEntities(twitterDescMatch[1]);

  // Extract standard meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (descMatch) meta.description = decodeHtmlEntities(descMatch[1]);

  // Extract title tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) meta.title = decodeHtmlEntities(titleMatch[1].trim());

  return meta;
}

/**
 * Supplement scraped data with JSON-LD data
 */
function supplementFromJsonLd(scraped: ScrapedJob, jsonLd: JobPostingJsonLd): ScrapedJob {
  const result = { ...scraped };

  // Company name
  if (!result.companyName && jsonLd.hiringOrganization?.name) {
    result.companyName = jsonLd.hiringOrganization.name;
  }

  // Role name
  if (!result.roleName && jsonLd.title) {
    result.roleName = jsonLd.title;
  }

  // Location
  if (!result.location && jsonLd.jobLocation?.address) {
    const addr = jsonLd.jobLocation.address;
    const parts = [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean);
    if (parts.length > 0) {
      result.location = parts.join(', ');
    }
  }

  // Location type
  if (!result.locationType && jsonLd.jobLocationType) {
    const locType = jsonLd.jobLocationType.toLowerCase();
    if (locType.includes('remote') || locType === 'telecommute') {
      result.locationType = 'remote';
    } else if (locType.includes('hybrid')) {
      result.locationType = 'hybrid';
    }
  }

  // Salary from JSON-LD
  if (jsonLd.baseSalary?.value) {
    const salaryValue = jsonLd.baseSalary.value;

    if (!result.salaryCurrency && jsonLd.baseSalary.currency) {
      result.salaryCurrency = jsonLd.baseSalary.currency;
    }

    if (salaryValue.minValue !== undefined && !result.salaryMin) {
      result.salaryMin = salaryValue.minValue;
    }

    if (salaryValue.maxValue !== undefined && !result.salaryMax) {
      result.salaryMax = salaryValue.maxValue;
    }

    if (salaryValue.value !== undefined && !result.salaryMin && !result.salaryMax) {
      result.salaryMin = salaryValue.value;
      result.salaryMax = salaryValue.value;
    }

    if (salaryValue.unitText && !result.salaryPeriod) {
      const unit = salaryValue.unitText.toLowerCase();
      if (unit.includes('hour')) {
        result.salaryPeriod = 'hourly';
      } else if (unit.includes('year') || unit.includes('annual')) {
        result.salaryPeriod = 'annual';
      }
    }
  }

  return result;
}

/**
 * Enhanced HTML to text extraction
 * Preserves structure with headings, lists, and proper whitespace
 */
function extractTextFromHtml(html: string): string {
  let text = html;

  // Remove script and style elements
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  text = text.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // Remove hidden elements
  text = text.replace(
    /<[^>]*(?:hidden|display:\s*none|visibility:\s*hidden)[^>]*>[\s\S]*?<\/[^>]+>/gi,
    ''
  );

  // Convert headings to emphasized text
  text = text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n=== $1 ===\n\n');
  text = text.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n== $1 ==\n\n');
  text = text.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n= $1 =\n\n');
  text = text.replace(/<h[456][^>]*>([\s\S]*?)<\/h[456]>/gi, '\n\n$1\n\n');

  // Convert list items to bullet points
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n  • $1');

  // Convert ordered list items (simplified - just uses bullets)
  text = text.replace(/<ol[^>]*>/gi, '\n');
  text = text.replace(/<\/ol>/gi, '\n');
  text = text.replace(/<ul[^>]*>/gi, '\n');
  text = text.replace(/<\/ul>/gi, '\n');

  // Convert paragraphs and divs to newlines
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<p[^>]*>/gi, '');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<div[^>]*>/gi, '');

  // Convert line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Convert table elements
  text = text.replace(/<\/tr>/gi, '\n');
  text = text.replace(/<\/td>/gi, ' | ');
  text = text.replace(/<\/th>/gi, ' | ');
  text = text.replace(/<tr[^>]*>/gi, '');
  text = text.replace(/<t[dh][^>]*>/gi, '');
  text = text.replace(/<\/?table[^>]*>/gi, '\n');
  text = text.replace(/<\/?t(head|body|foot)[^>]*>/gi, '');

  // Convert definition lists
  text = text.replace(/<dt[^>]*>([\s\S]*?)<\/dt>/gi, '\n$1: ');
  text = text.replace(/<dd[^>]*>([\s\S]*?)<\/dd>/gi, '$1\n');
  text = text.replace(/<\/?dl[^>]*>/gi, '\n');

  // Handle links - keep text
  text = text.replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1');

  // Handle strong/bold and em/italic
  text = text.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/(strong|b)>/gi, '**$2**');
  text = text.replace(/<(em|i)[^>]*>([\s\S]*?)<\/(em|i)>/gi, '_$2_');

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  text = decodeHtmlEntities(text);

  // Normalize whitespace
  // Replace multiple spaces with single space
  text = text.replace(/[ \t]+/g, ' ');
  // Replace more than 2 consecutive newlines with 2 newlines
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
  // Trim lines
  text = text
    .split('\n')
    .map((line) => line.trim())
    .join('\n');
  // Remove leading/trailing whitespace
  text = text.trim();

  return text;
}

/**
 * Decode common HTML entities
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&apos;': "'",
    '&cent;': '¢',
    '&pound;': '£',
    '&yen;': '¥',
    '&euro;': '€',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
    '&mdash;': '—',
    '&ndash;': '–',
    '&bull;': '•',
    '&hellip;': '...',
    '&lsquo;': '\u2018',
    '&rsquo;': '\u2019',
    '&ldquo;': '\u201C',
    '&rdquo;': '\u201D',
  };

  let result = text;

  for (const [entity, replacement] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'gi'), replacement);
  }

  // Handle numeric entities
  result = result.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  result = result.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  return result;
}
