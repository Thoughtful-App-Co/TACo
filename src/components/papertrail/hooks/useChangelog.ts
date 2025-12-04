/**
 * Paper Trail - useChangelog Hook
 * Manages changelog state and provides access to detected changes
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { createSignal, createEffect } from 'solid-js';
import { ChangelogEntry, ChangeType } from '../../../schemas/papertrail.schema';
import { ChangelogService } from '../services/changelog.service';

export interface UseChangelogReturn {
  changelog: () => ChangelogEntry[];
  stats: () => {
    totalArticles: number;
    totalChanges: number;
    changesByType: Record<ChangeType, number>;
  };
  getArticleChanges: (articleId: string) => ChangelogEntry[];
  hasChanges: (articleId: string) => boolean;
  getChangeCount: (articleId: string) => number;
  refreshChangelog: () => void;
}

export function useChangelog(): UseChangelogReturn {
  const [changelog, setChangelog] = createSignal<ChangelogEntry[]>([]);
  const [stats, setStats] = createSignal({
    totalArticles: 0,
    totalChanges: 0,
    changesByType: {
      update: 0,
      correction: 0,
      retraction: 0,
      clarification: 0,
    } as Record<ChangeType, number>,
  });

  const refreshChangelog = () => {
    const entries = ChangelogService.getChangelog();
    // Sort by detectedAt descending
    entries.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
    setChangelog(entries);
    setStats(ChangelogService.getStats());
  };

  // Load on mount
  createEffect(() => {
    refreshChangelog();
  });

  const getArticleChanges = (articleId: string): ChangelogEntry[] => {
    return changelog().filter((entry) => entry.articleId === articleId);
  };

  const hasChanges = (articleId: string): boolean => {
    return changelog().some((entry) => entry.articleId === articleId);
  };

  const getChangeCount = (articleId: string): number => {
    return changelog().filter((entry) => entry.articleId === articleId).length;
  };

  return {
    changelog,
    stats,
    getArticleChanges,
    hasChanges,
    getChangeCount,
    refreshChangelog,
  };
}
