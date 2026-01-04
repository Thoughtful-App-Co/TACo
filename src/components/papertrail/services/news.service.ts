/**
 * Paper Trail - Story Feed Service
 *
 * Fetches the living stream of evolving stories. This isn't a traditional
 * news aggregator—it's the entry point for stories that will grow, change,
 * and interconnect over time.
 *
 * Stories fetched here become living documents tracked for:
 * - Evolution and updates
 * - Corrections and retractions
 * - Entity relationships and connections
 * - Multi-source perspective comparison
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Article } from '../../../schemas/papertrail.schema';
import { logger } from '../../../lib/logger';

// =============================================================================
// NEWS SERVICE
// =============================================================================

export interface FetchOptions {
  query?: string;
  section?: string;
  limit?: number;
}

export interface NewsApiResponse {
  articles: Article[];
  total: number;
  currentPage: number;
  pages: number;
  sources?: string[]; // List of source names in this response
}

export const NewsService = {
  /**
   * Fetch news articles from our server-side API
   */
  async fetchArticles(options: FetchOptions = {}): Promise<Article[]> {
    const { query, section, limit = 20 } = options;

    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (section) params.set('section', section);
      params.set('limit', String(limit));

      const response = await fetch(`/api/news?${params}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data: NewsApiResponse = await response.json();
      return data.articles || [];
    } catch (error) {
      logger.news.error('Failed to fetch news:', error);
      throw error;
    }
  },

  /**
   * Test API connection with minimal request
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const articles = await this.fetchArticles({ limit: 1 });
      return {
        success: true,
        message: `Connected! Found ${articles.length} article(s).`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  },
} as const;
