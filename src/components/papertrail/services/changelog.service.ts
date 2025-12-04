/**
 * Paper Trail - Changelog Service
 * Tracks article changes over time using localStorage
 * Detects title/description modifications and classifies change types
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Article, ChangelogEntry, ChangeType } from '../../../schemas/papertrail.schema';

const ARTICLES_KEY = 'papertrail-articles';
const CHANGELOG_KEY = 'papertrail-changelog';

// =============================================================================
// CHANGE DETECTION UTILITIES
// =============================================================================

/**
 * Calculate similarity between two strings (0-1)
 * Uses simple word overlap for efficiency
 */
function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;

  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));

  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;

  return union > 0 ? intersection / union : 0;
}

/**
 * Classify the type of change based on content analysis
 */
function classifyChange(
  previousValue: string,
  newValue: string,
  field: 'title' | 'description'
): ChangeType {
  const prev = previousValue.toLowerCase();
  const next = newValue.toLowerCase();

  // Check for retraction indicators
  const retractionWords = ['retracted', 'withdrawn', 'removed', 'deleted', 'correction:'];
  if (retractionWords.some((w) => next.includes(w) && !prev.includes(w))) {
    return 'retraction';
  }

  // Check for correction indicators
  const correctionWords = ['corrected', 'updated', 'fixed', 'error', 'correction'];
  if (correctionWords.some((w) => next.includes(w) && !prev.includes(w))) {
    return 'correction';
  }

  // Check for clarification indicators
  const clarificationWords = ['clarification', 'clarified', 'added context', "editor's note"];
  if (clarificationWords.some((w) => next.includes(w) && !prev.includes(w))) {
    return 'clarification';
  }

  // Calculate similarity - major changes are corrections, minor are updates
  const similarity = calculateSimilarity(previousValue, newValue);

  if (similarity < 0.5) {
    // Significant change - likely a correction
    return 'correction';
  } else if (similarity < 0.8) {
    // Moderate change
    return field === 'title' ? 'correction' : 'update';
  }

  // Minor change
  return 'update';
}

/**
 * Generate a unique ID for changelog entries
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// =============================================================================
// CHANGELOG SERVICE
// =============================================================================

export const ChangelogService = {
  /**
   * Get all cached articles
   */
  getCachedArticles(): Record<string, Article> {
    try {
      const stored = localStorage.getItem(ARTICLES_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('[PaperTrail] Failed to parse cached articles:', error);
      return {};
    }
  },

  /**
   * Get all changelog entries
   */
  getChangelog(): ChangelogEntry[] {
    try {
      const stored = localStorage.getItem(CHANGELOG_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[PaperTrail] Failed to parse changelog:', error);
      return [];
    }
  },

  /**
   * Get changelog entries for a specific article
   */
  getArticleChanges(articleId: string): ChangelogEntry[] {
    return this.getChangelog().filter((entry) => entry.articleId === articleId);
  },

  /**
   * Check if an article has any changes
   */
  hasChanges(articleId: string): boolean {
    return this.getChangelog().some((entry) => entry.articleId === articleId);
  },

  /**
   * Get the count of changes for an article
   */
  getChangeCount(articleId: string): number {
    return this.getChangelog().filter((entry) => entry.articleId === articleId).length;
  },

  /**
   * Process new articles and detect changes
   * Returns the list of new changelog entries
   */
  processArticles(newArticles: Article[]): ChangelogEntry[] {
    const cached = this.getCachedArticles();
    const changelog = this.getChangelog();
    const newEntries: ChangelogEntry[] = [];
    const now = new Date().toISOString();

    for (const article of newArticles) {
      const cachedArticle = cached[article.id];

      if (cachedArticle) {
        // Article exists - check for changes

        // Check title change
        if (cachedArticle.title !== article.title) {
          const entry: ChangelogEntry = {
            id: generateId(),
            articleId: article.id,
            articleUrl: article.url,
            articleTitle: article.title,
            field: 'title',
            previousValue: cachedArticle.title,
            newValue: article.title,
            detectedAt: now,
            changeType: classifyChange(cachedArticle.title, article.title, 'title'),
          };
          newEntries.push(entry);
          changelog.push(entry);
        }

        // Check description change
        if (
          cachedArticle.description !== article.description &&
          cachedArticle.description &&
          article.description
        ) {
          const entry: ChangelogEntry = {
            id: generateId(),
            articleId: article.id,
            articleUrl: article.url,
            articleTitle: article.title,
            field: 'description',
            previousValue: cachedArticle.description,
            newValue: article.description,
            detectedAt: now,
            changeType: classifyChange(
              cachedArticle.description,
              article.description,
              'description'
            ),
          };
          newEntries.push(entry);
          changelog.push(entry);
        }

        // Update cached article with new data
        cached[article.id] = article;
      } else {
        // New article - just cache it
        cached[article.id] = article;
      }
    }

    // Persist updates
    this.saveCache(cached);
    this.saveChangelog(changelog);

    if (newEntries.length > 0) {
      console.log(`[PaperTrail] Detected ${newEntries.length} change(s)`);
    }

    return newEntries;
  },

  /**
   * Save articles cache
   */
  saveCache(articles: Record<string, Article>): void {
    try {
      localStorage.setItem(ARTICLES_KEY, JSON.stringify(articles));
    } catch (error) {
      console.error('[PaperTrail] Failed to save articles cache:', error);
    }
  },

  /**
   * Save changelog
   */
  saveChangelog(changelog: ChangelogEntry[]): void {
    try {
      localStorage.setItem(CHANGELOG_KEY, JSON.stringify(changelog));
    } catch (error) {
      console.error('[PaperTrail] Failed to save changelog:', error);
    }
  },

  /**
   * Clear all cached data
   */
  clearAll(): void {
    try {
      localStorage.removeItem(ARTICLES_KEY);
      localStorage.removeItem(CHANGELOG_KEY);
      console.log('[PaperTrail] Cache cleared');
    } catch (error) {
      console.error('[PaperTrail] Failed to clear cache:', error);
    }
  },

  /**
   * Get statistics about the changelog
   */
  getStats(): {
    totalArticles: number;
    totalChanges: number;
    changesByType: Record<ChangeType, number>;
  } {
    const articles = this.getCachedArticles();
    const changelog = this.getChangelog();

    const changesByType: Record<ChangeType, number> = {
      update: 0,
      correction: 0,
      retraction: 0,
      clarification: 0,
    };

    for (const entry of changelog) {
      changesByType[entry.changeType]++;
    }

    return {
      totalArticles: Object.keys(articles).length,
      totalChanges: changelog.length,
      changesByType,
    };
  },
} as const;
