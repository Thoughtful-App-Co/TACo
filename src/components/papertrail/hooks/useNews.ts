/**
 * Paper Trail - useNews Hook
 * Manages news fetching and article state
 * News is fetched from server-side API - no user configuration needed
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { createSignal, createEffect, onMount } from 'solid-js';
import { Article } from '../../../schemas/papertrail.schema';
import { NewsService, FetchOptions } from '../services/news.service';
import { ChangelogService } from '../services/changelog.service';
import { logger } from '../../../lib/logger';

export interface UseNewsReturn {
  articles: () => Article[];
  isLoading: () => boolean;
  error: () => string | null;
  lastFetchedAt: () => string | null;
  refresh: (options?: FetchOptions) => Promise<void>;
}

export function useNews(): UseNewsReturn {
  const [articles, setArticles] = createSignal<Article[]>([]);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = createSignal<string | null>(null);

  // Load cached articles on mount
  createEffect(() => {
    const cached = ChangelogService.getCachedArticles();
    const cachedList = Object.values(cached);
    if (cachedList.length > 0) {
      // Sort by publishedAt descending
      cachedList.sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      setArticles(cachedList);

      // Get the most recent fetch time
      const mostRecent = cachedList.reduce((latest, article) => {
        const fetchTime = new Date(article.fetchedAt).getTime();
        return fetchTime > latest ? fetchTime : latest;
      }, 0);
      if (mostRecent > 0) {
        setLastFetchedAt(new Date(mostRecent).toISOString());
      }
    }
  });

  // Auto-fetch on mount if no cached articles
  onMount(() => {
    const cached = ChangelogService.getCachedArticles();
    if (Object.keys(cached).length === 0) {
      refresh();
    }
  });

  const refresh = async (options: FetchOptions = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const newArticles = await NewsService.fetchArticles(options);

      // Process for changelog detection
      const changes = ChangelogService.processArticles(newArticles);

      if (changes.length > 0) {
        logger.news.info(`Detected ${changes.length} article change(s)`);
      }

      // Update state with all cached articles (which now includes new ones)
      const allCached = ChangelogService.getCachedArticles();
      const allArticles = Object.values(allCached);
      allArticles.sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );

      setArticles(allArticles);
      setLastFetchedAt(new Date().toISOString());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch news';
      setError(message);
      logger.news.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    articles,
    isLoading,
    error,
    lastFetchedAt,
    refresh,
  };
}
