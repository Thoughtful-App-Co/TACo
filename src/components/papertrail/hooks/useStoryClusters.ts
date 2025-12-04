/**
 * Paper Trail - Story Clusters Hook
 * Manages story clustering state and AI-powered summarization
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { createSignal, createEffect } from 'solid-js';
import { Article, StoryCluster } from '../../../schemas/papertrail.schema';
import { StoryClusteringService } from '../services/story-clustering.service';

export function useStoryClusters() {
  const [clusters, setClusters] = createSignal<StoryCluster[]>([]);
  const [isBuilding, setIsBuilding] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Load existing clusters on mount
  createEffect(() => {
    const stored = StoryClusteringService.getClusters();
    if (stored.length > 0) {
      setClusters(stored);
    }
  });

  /**
   * Build clusters from articles using AI
   */
  const buildClusters = async (articles: Article[]) => {
    if (articles.length === 0) {
      setError('No articles to cluster');
      return;
    }

    setIsBuilding(true);
    setError(null);

    try {
      const newClusters = await StoryClusteringService.buildClusters(articles);
      setClusters(newClusters);
      console.log(`[PaperTrail] Built ${newClusters.length} story clusters`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to build clusters';
      setError(message);
      console.error('[PaperTrail] Clustering error:', err);
    } finally {
      setIsBuilding(false);
    }
  };

  /**
   * Clear all clusters
   */
  const clearClusters = () => {
    StoryClusteringService.clearClusters();
    setClusters([]);
  };

  /**
   * Get articles for a specific cluster
   */
  const getClusterArticles = (cluster: StoryCluster, allArticles: Article[]): Article[] => {
    return allArticles.filter((a) => cluster.articleIds.includes(a.id));
  };

  return {
    clusters,
    isBuilding,
    error,
    buildClusters,
    clearClusters,
    getClusterArticles,
  };
}
