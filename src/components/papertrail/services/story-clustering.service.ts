/**
 * Paper Trail - Story Clustering Service
 *
 * THE CORE VALUE OF PAPER TRAIL:
 * Groups similar articles into "stories" and uses AI to:
 * 1. Generate unified summaries
 * 2. Detect narrative changes over time
 * 3. Create automatic changelogs
 *
 * This transforms chronological articles into non-linear living stories.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import {
  Article,
  StoryCluster,
  ChangelogEntry,
  ChangeType,
} from '../../../schemas/papertrail.schema';
import { ApiConfigService } from './api-config.service';
import { logger } from '../../../lib/logger';

const CLUSTERS_KEY = 'papertrail-story-clusters';

// =============================================================================
// CLUSTERING ALGORITHM
// =============================================================================

/**
 * Simple similarity score between two articles based on:
 * - Title overlap (most important)
 * - Description overlap
 * - Time proximity (stories cluster over days, not months)
 */
function calculateSimilarity(a1: Article, a2: Article): number {
  const title1 = a1.title.toLowerCase();
  const title2 = a2.title.toLowerCase();
  const desc1 = (a1.description || '').toLowerCase();
  const desc2 = (a2.description || '').toLowerCase();

  // Extract significant words (ignore stop words)
  const getWords = (text: string) => {
    return text
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .filter(
        (w) =>
          ![
            'this',
            'that',
            'with',
            'from',
            'have',
            'been',
            'will',
            'were',
            'what',
            'when',
            'where',
            'which',
          ].includes(w)
      );
  };

  const words1 = new Set(getWords(title1 + ' ' + desc1));
  const words2 = new Set(getWords(title2 + ' ' + desc2));

  // Jaccard similarity for words
  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  const wordSimilarity = intersection.size / union.size;

  // Time proximity (articles within 7 days are more likely related)
  const time1 = new Date(a1.publishedAt).getTime();
  const time2 = new Date(a2.publishedAt).getTime();
  const daysDiff = Math.abs(time1 - time2) / (1000 * 60 * 60 * 24);
  const timeSimilarity = daysDiff < 7 ? 1 - daysDiff / 7 : 0;

  // Weighted score
  return wordSimilarity * 0.8 + timeSimilarity * 0.2;
}

/**
 * Cluster articles using simple greedy algorithm
 * More sophisticated: could use DBSCAN or hierarchical clustering
 */
function clusterArticles(articles: Article[]): Article[][] {
  const SIMILARITY_THRESHOLD = 0.3; // Articles need 30% similarity to cluster
  const clusters: Article[][] = [];
  const assigned = new Set<string>();

  for (const article of articles) {
    if (assigned.has(article.id)) continue;

    const cluster = [article];
    assigned.add(article.id);

    // Find similar articles
    for (const other of articles) {
      if (assigned.has(other.id)) continue;

      const similarity = calculateSimilarity(article, other);
      if (similarity >= SIMILARITY_THRESHOLD) {
        cluster.push(other);
        assigned.add(other.id);
      }
    }

    clusters.push(cluster);
  }

  return clusters;
}

// =============================================================================
// AI SUMMARIZATION
// =============================================================================

/**
 * Generate a unified summary for a cluster of articles using AI
 */
async function summarizeCluster(
  articles: Article[],
  config: { baseUrl: string; apiKey: string; model: string }
): Promise<{
  title: string;
  summary: string;
  topics: string[];
  significance: 'low' | 'medium' | 'high';
}> {
  const articlesText = articles
    .map((a, i) => `[${i + 1}] ${a.source.name}: "${a.title}"\n${a.description || ''}`)
    .join('\n\n');

  const prompt = `Analyze these ${articles.length} news articles that are about the same story:

${articlesText}

Provide a JSON response with:
{
  "title": "A concise title for this story (under 80 chars)",
  "summary": "A 2-3 sentence summary capturing the key narrative",
  "topics": ["topic1", "topic2", "topic3"],
  "significance": "low|medium|high"
}

Only return valid JSON, no other text.`;

  try {
    const isAnthropic = config.baseUrl.includes('anthropic');

    if (isAnthropic) {
      const response = await fetch(`${config.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) throw new Error(`AI API error: ${response.status}`);

      const data = await response.json();
      const content = data.content?.[0]?.text || '{}';
      return JSON.parse(content);
    } else {
      // OpenAI-compatible
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1024,
        }),
      });

      if (!response.ok) throw new Error(`AI API error: ${response.status}`);

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      return JSON.parse(content);
    }
  } catch (error) {
    logger.news.error('AI summarization failed:', error);
    // Fallback to simple summarization
    return {
      title: articles[0].title.substring(0, 80),
      summary: articles[0].description || articles[0].title,
      topics: [],
      significance: 'low',
    };
  }
}

// =============================================================================
// CHANGELOG GENERATION
// =============================================================================

/**
 * Detect changes between old and new article clusters using AI
 */
async function detectChanges(
  oldCluster: StoryCluster,
  newArticles: Article[],
  config: { baseUrl: string; apiKey: string; model: string }
): Promise<ChangelogEntry[]> {
  const oldText = `Previous summary:\n"${oldCluster.summary}"`;
  const newText = newArticles
    .map((a) => `${a.source.name}: "${a.title}"\n${a.description || ''}`)
    .join('\n\n');

  const prompt = `You are tracking how a news story evolves over time.

OLD NARRATIVE:
${oldText}

NEW ARTICLES:
${newText}

Detect if there are any:
- Updates (new developments)
- Corrections (factual fixes)
- Clarifications (added context)
- Retractions (story withdrawn)

Return JSON array of changes:
[{
  "field": "content",
  "changeType": "update|correction|clarification|retraction|development",
  "previousValue": "what was said before",
  "newValue": "what changed",
  "significance": "minor|moderate|major"
}]

If no significant changes, return []. Only return valid JSON.`;

  try {
    const isAnthropic = config.baseUrl.includes('anthropic');

    if (isAnthropic) {
      const response = await fetch(`${config.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) throw new Error(`AI API error: ${response.status}`);

      const data = await response.json();
      const content = data.content?.[0]?.text || '[]';
      const changes = JSON.parse(content);

      // Convert to ChangelogEntry format
      return changes.map((c: any) => ({
        id: crypto.randomUUID(),
        articleId: newArticles[0].id,
        articleUrl: newArticles[0].url,
        articleTitle: newArticles[0].title,
        field: c.field as any,
        previousValue: c.previousValue,
        newValue: c.newValue,
        detectedAt: new Date().toISOString(),
        changeType: c.changeType as ChangeType,
        significance: c.significance,
      }));
    } else {
      // OpenAI-compatible
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2048,
        }),
      });

      if (!response.ok) throw new Error(`AI API error: ${response.status}`);

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '[]';
      const changes = JSON.parse(content);

      return changes.map((c: any) => ({
        id: crypto.randomUUID(),
        articleId: newArticles[0].id,
        articleUrl: newArticles[0].url,
        articleTitle: newArticles[0].title,
        field: c.field as any,
        previousValue: c.previousValue,
        newValue: c.newValue,
        detectedAt: new Date().toISOString(),
        changeType: c.changeType as ChangeType,
        significance: c.significance,
      }));
    }
  } catch (error) {
    logger.news.error('AI changelog detection failed:', error);
    return [];
  }
}

// =============================================================================
// STORY CLUSTERING SERVICE
// =============================================================================

export const StoryClusteringService = {
  /**
   * Get stored clusters
   */
  getClusters(): StoryCluster[] {
    try {
      const stored = localStorage.getItem(CLUSTERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.news.error('Failed to parse clusters:', error);
      return [];
    }
  },

  /**
   * Save clusters
   */
  saveClusters(clusters: StoryCluster[]): void {
    try {
      localStorage.setItem(CLUSTERS_KEY, JSON.stringify(clusters));
    } catch (error) {
      logger.news.error('Failed to save clusters:', error);
    }
  },

  /**
   * Build story clusters from articles using AI
   */
  async buildClusters(articles: Article[]): Promise<StoryCluster[]> {
    const aiConfig = ApiConfigService.getAIConfig();

    if (!aiConfig) {
      logger.news.warn('AI not configured - clusters will be basic');
    }

    // Step 1: Cluster articles by similarity
    const articleClusters = clusterArticles(articles);
    logger.news.info(
      `Found ${articleClusters.length} story clusters from ${articles.length} articles`
    );

    // Step 2: Generate AI summaries for each cluster
    const storyClusters: StoryCluster[] = [];

    for (const cluster of articleClusters) {
      const sortedArticles = cluster.sort(
        (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
      );

      let summary;
      if (aiConfig) {
        summary = await summarizeCluster(sortedArticles, aiConfig);
      } else {
        // Fallback without AI
        summary = {
          title: sortedArticles[0].title.substring(0, 80),
          summary: sortedArticles[0].description || sortedArticles[0].title,
          topics: [],
          significance: 'low' as const,
        };
      }

      const storyCluster: StoryCluster = {
        id: crypto.randomUUID(),
        title: summary.title,
        summary: summary.summary,
        articleIds: sortedArticles.map((a) => a.id),
        firstSeenAt: sortedArticles[0].publishedAt,
        lastUpdatedAt: sortedArticles[sortedArticles.length - 1].publishedAt,
        updateCount: sortedArticles.length - 1,
        significance: summary.significance,
        topics: summary.topics,
        changelog: [],
      };

      storyClusters.push(storyCluster);
    }

    // Step 3: Detect changes if we have existing clusters
    const existingClusters = this.getClusters();

    if (existingClusters.length > 0 && aiConfig) {
      for (const newCluster of storyClusters) {
        // Find matching old cluster (by topic similarity)
        const matchingOld = existingClusters.find((old) =>
          old.topics.some((t) => newCluster.topics.includes(t))
        );

        if (matchingOld) {
          const newArticles = articles.filter((a) => newCluster.articleIds.includes(a.id));
          const changes = await detectChanges(matchingOld, newArticles, aiConfig);
          newCluster.changelog = [...matchingOld.changelog, ...changes];
        }
      }
    }

    // Save and return
    this.saveClusters(storyClusters);
    return storyClusters;
  },

  /**
   * Clear all clusters
   */
  clearClusters(): void {
    try {
      localStorage.removeItem(CLUSTERS_KEY);
    } catch (error) {
      logger.news.error('Failed to clear clusters:', error);
    }
  },
} as const;
