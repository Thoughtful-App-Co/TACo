/**
 * Paper Trail - News API
 * Cloudflare Pages Function for /api/news
 * Server-side news aggregation - YOUR service, YOUR API key
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

interface Env {
  GUARDIAN_API_KEY: string;
}

interface GuardianArticle {
  id: string;
  webTitle: string;
  webUrl: string;
  webPublicationDate: string;
  fields?: {
    trailText?: string;
    thumbnail?: string;
    byline?: string;
  };
  sectionName?: string;
}

interface NormalizedArticle {
  id: string;
  title: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  publishedAt: string;
  source: { id: string | null; name: string };
  author: string | null;
  provider: string;
  fetchedAt: string;
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function normalizeGuardian(articles: GuardianArticle[]): NormalizedArticle[] {
  const now = new Date().toISOString();
  return articles.map((a) => ({
    id: hashString(a.webUrl),
    title: a.webTitle,
    description: a.fields?.trailText || null,
    url: a.webUrl,
    imageUrl: a.fields?.thumbnail || null,
    publishedAt: a.webPublicationDate,
    source: { id: 'guardian', name: a.sectionName || 'The Guardian' },
    author: a.fields?.byline || null,
    provider: 'guardian',
    fetchedAt: now,
  }));
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Check for API key
  if (!env.GUARDIAN_API_KEY) {
    console.error('[PaperTrail] GUARDIAN_API_KEY not configured');
    return new Response(JSON.stringify({ error: 'News service not configured' }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  try {
    // Parse query params
    const query = url.searchParams.get('q') || '';
    const section = url.searchParams.get('section') || '';
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    // Build Guardian API URL
    const params = new URLSearchParams({
      'api-key': env.GUARDIAN_API_KEY,
      'show-fields': 'trailText,thumbnail,byline',
      'page-size': String(Math.min(limit, 50)),
      'order-by': 'newest',
    });

    if (query) params.set('q', query);
    if (section) params.set('section', section);

    const guardianUrl = `https://content.guardianapis.com/search?${params}`;
    console.log('[PaperTrail] Fetching from Guardian API');

    const response = await fetch(guardianUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PaperTrail] Guardian API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Failed to fetch news' }), {
        status: 502,
        headers: corsHeaders,
      });
    }

    const data = await response.json();
    const articles = normalizeGuardian(data.response?.results || []);

    return new Response(
      JSON.stringify({
        articles,
        total: data.response?.total || 0,
        currentPage: data.response?.currentPage || 1,
        pages: data.response?.pages || 1,
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('[PaperTrail] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
