/**
 * Paper Trail - News API
 * Cloudflare Pages Function for /api/news
 * Server-side news aggregation - YOUR service, YOUR API keys + RSS feeds
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

interface Env {
  GUARDIAN_API_KEY?: string;
  GNEWS_API_KEY?: string;
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

// =============================================================================
// RSS FEEDS - No API keys needed
// =============================================================================

const RSS_FEEDS = [
  // Tech news
  { url: 'https://hnrss.org/frontpage', name: 'Hacker News', id: 'hackernews' },
  { url: 'https://techcrunch.com/feed/', name: 'TechCrunch', id: 'techcrunch' },
  { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge', id: 'theverge' },
  { url: 'https://arstechnica.com/feed/', name: 'Ars Technica', id: 'arstechnica' },

  // General news
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World', id: 'bbc' },
  {
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    name: 'NY Times World',
    id: 'nytimes',
  },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera', id: 'aljazeera' },
  { url: 'https://feeds.reuters.com/reuters/topNews', name: 'Reuters', id: 'reuters' },

  // Science & tech
  { url: 'https://www.nature.com/nature.rss', name: 'Nature', id: 'nature' },
  {
    url: 'https://www.science.org/action/showFeed?type=etoc&feed=rss&jc=science',
    name: 'Science',
    id: 'science',
  },

  // Business
  { url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', name: 'WSJ World', id: 'wsj' },
  { url: 'https://www.ft.com/?format=rss', name: 'Financial Times', id: 'ft' },
] as const;

// =============================================================================
// UTILITIES
// =============================================================================

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Simple XML/RSS parser (works for most RSS/Atom feeds)
function parseRSS(xml: string, feedInfo: { name: string; id: string }): NormalizedArticle[] {
  const now = new Date().toISOString();
  const articles: NormalizedArticle[] = [];

  // Match item/entry tags
  const itemRegex = /<(item|entry)[^>]*>([\s\S]*?)<\/(item|entry)>/gi;
  const items = xml.matchAll(itemRegex);

  for (const match of items) {
    const itemXml = match[2];

    // Extract fields (handles both RSS and Atom)
    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link') || extractAttr(itemXml, 'link', 'href');
    const description =
      extractTag(itemXml, 'description') ||
      extractTag(itemXml, 'summary') ||
      extractTag(itemXml, 'content:encoded');
    const pubDate =
      extractTag(itemXml, 'pubDate') ||
      extractTag(itemXml, 'published') ||
      extractTag(itemXml, 'updated');
    const author = extractTag(itemXml, 'author') || extractTag(itemXml, 'dc:creator');
    const imageUrl =
      extractTag(itemXml, 'media:thumbnail') ||
      extractAttr(itemXml, 'media:thumbnail', 'url') ||
      extractTag(itemXml, 'enclosure');

    if (title && link) {
      articles.push({
        id: hashString(link),
        title: cleanXML(title),
        description: description ? cleanXML(description).substring(0, 300) : null,
        url: link.trim(),
        imageUrl: imageUrl || null,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : now,
        source: { id: feedInfo.id, name: feedInfo.name },
        author: author ? cleanXML(author) : null,
        provider: 'rss',
        fetchedAt: now,
      });
    }
  }

  return articles;
}

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function extractAttr(xml: string, tag: string, attr: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function cleanXML(str: string): string {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// =============================================================================
// GUARDIAN API
// =============================================================================

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

async function fetchGuardian(
  env: Env,
  query: string,
  section: string,
  limit: number
): Promise<NormalizedArticle[]> {
  if (!env.GUARDIAN_API_KEY) {
    console.log('[PaperTrail] Guardian API key not configured, skipping');
    return [];
  }

  const params = new URLSearchParams({
    'api-key': env.GUARDIAN_API_KEY,
    'show-fields': 'trailText,thumbnail,byline',
    'page-size': String(Math.min(limit, 50)),
    'order-by': 'newest',
  });

  if (query) params.set('q', query);
  if (section) params.set('section', section);

  const url = `https://content.guardianapis.com/search?${params}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('[PaperTrail] Guardian API error:', response.status);
      return [];
    }

    const data = await response.json();
    return normalizeGuardian(data.response?.results || []);
  } catch (error) {
    console.error('[PaperTrail] Guardian fetch error:', error);
    return [];
  }
}

// =============================================================================
// GNEWS API
// =============================================================================

interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

function normalizeGNews(articles: GNewsArticle[]): NormalizedArticle[] {
  const now = new Date().toISOString();
  return articles.map((a) => ({
    id: hashString(a.url),
    title: a.title,
    description: a.description || null,
    url: a.url,
    imageUrl: a.image || null,
    publishedAt: a.publishedAt,
    source: { id: null, name: a.source.name },
    author: null,
    provider: 'gnews',
    fetchedAt: now,
  }));
}

async function fetchGNews(env: Env, query: string, limit: number): Promise<NormalizedArticle[]> {
  if (!env.GNEWS_API_KEY) {
    console.log('[PaperTrail] GNews API key not configured, skipping');
    return [];
  }

  const params = new URLSearchParams({
    apikey: env.GNEWS_API_KEY,
    lang: 'en',
    max: String(Math.min(limit, 10)), // GNews free tier is 100/day, be conservative
    sortby: 'publishedAt',
  });

  if (query) params.set('q', query);

  const url = `https://gnews.io/api/v4/top-headlines?${params}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('[PaperTrail] GNews API error:', response.status);
      return [];
    }

    const data = await response.json();
    return normalizeGNews(data.articles || []);
  } catch (error) {
    console.error('[PaperTrail] GNews fetch error:', error);
    return [];
  }
}

// =============================================================================
// RSS AGGREGATION
// =============================================================================

async function fetchRSSFeeds(limit: number): Promise<NormalizedArticle[]> {
  const feedsToFetch = RSS_FEEDS.slice(0, 6); // Fetch 6 feeds in parallel

  const results = await Promise.allSettled(
    feedsToFetch.map(async (feed) => {
      try {
        const response = await fetch(feed.url, {
          headers: { 'User-Agent': 'PaperTrail/1.0' },
        });

        if (!response.ok) {
          console.error(`[PaperTrail] RSS fetch failed: ${feed.name}`, response.status);
          return [];
        }

        const xml = await response.text();
        return parseRSS(xml, { name: feed.name, id: feed.id });
      } catch (error) {
        console.error(`[PaperTrail] RSS error: ${feed.name}`, error);
        return [];
      }
    })
  );

  const articles = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => (r as PromiseFulfilledResult<NormalizedArticle[]>).value);

  // Deduplicate by URL and sort by date
  const seen = new Set<string>();
  const unique = articles.filter((a) => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });

  return unique
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}

// =============================================================================
// REQUEST HANDLER
// =============================================================================

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    // Parse query params
    const query = url.searchParams.get('q') || '';
    const section = url.searchParams.get('section') || '';
    const limit = parseInt(url.searchParams.get('limit') || '40', 10);

    console.log('[PaperTrail] Fetching from multiple sources');

    // Fetch from Guardian, GNews (if configured), and RSS feeds in parallel
    const [guardianArticles, gnewsArticles, rssArticles] = await Promise.all([
      fetchGuardian(env, query, section, Math.floor(limit / 3)),
      fetchGNews(env, query, Math.floor(limit / 3)),
      fetchRSSFeeds(Math.floor(limit / 3)),
    ]);

    // Combine and deduplicate
    const allArticles = [...guardianArticles, ...gnewsArticles, ...rssArticles];
    const seen = new Set<string>();
    const unique = allArticles.filter((a) => {
      if (seen.has(a.url)) return false;
      seen.add(a.url);
      return true;
    });

    // Sort by published date and limit
    const articles = unique
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, limit);

    console.log(
      `[PaperTrail] Aggregated ${articles.length} articles from ${new Set(articles.map((a) => a.provider)).size} providers`
    );

    return new Response(
      JSON.stringify({
        articles,
        total: articles.length,
        currentPage: 1,
        pages: 1,
        sources: Array.from(new Set(articles.map((a) => a.source.name))),
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
