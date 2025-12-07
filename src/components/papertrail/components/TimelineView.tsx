/**
 * Paper Trail - Timeline View
 * Category-based timelines: "What's happening in AI/Economy/Politics?"
 * Shows chronological story evolution grouped by topic
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, For, Show } from 'solid-js';
import { StoryCluster, Article } from '../../../schemas/papertrail.schema';
import { papertrail, yellowScale } from '../../../theme/papertrail';
import { CATEGORY_ICONS, ExternalLinkIcon } from '../ui/category-icons';

export interface TimelineViewProps {
  clusters: StoryCluster[];
  articles: Article[];
}

interface CategoryTimeline {
  category: string;
  stories: Array<{
    cluster: StoryCluster;
    latestUpdate: Date;
    updateCount: number;
  }>;
}

// Category detection with keyword patterns
const CATEGORY_PATTERNS: Record<string, string[]> = {
  'AI & Tech': [
    'ai',
    'artificial intelligence',
    'tech',
    'google',
    'openai',
    'microsoft',
    'apple',
    'meta',
    'tesla',
    'software',
    'chip',
    'semiconductor',
  ],
  Politics: [
    'trump',
    'biden',
    'election',
    'congress',
    'senate',
    'government',
    'president',
    'politics',
    'republican',
    'democrat',
    'vote',
  ],
  Economy: [
    'economy',
    'inflation',
    'fed',
    'market',
    'stock',
    'recession',
    'gdp',
    'jobs',
    'unemployment',
    'trade',
    'tariff',
    'dollar',
  ],
  Climate: [
    'climate',
    'environment',
    'emissions',
    'green',
    'renewable',
    'carbon',
    'warming',
    'flood',
    'wildfire',
    'storm',
  ],
  Health: [
    'health',
    'medical',
    'vaccine',
    'covid',
    'disease',
    'hospital',
    'drug',
    'fda',
    'virus',
    'pandemic',
  ],
  'War & Conflict': [
    'war',
    'military',
    'conflict',
    'ukraine',
    'russia',
    'israel',
    'palestine',
    'gaza',
    'iran',
    'syria',
    'china',
    'taiwan',
  ],
  Space: ['space', 'nasa', 'spacex', 'mars', 'rocket', 'satellite', 'asteroid', 'moon', 'orbit'],
  Sports: [
    'football',
    'basketball',
    'soccer',
    'sports',
    'nfl',
    'nba',
    'world cup',
    'olympics',
    'championship',
  ],
  Entertainment: [
    'movie',
    'film',
    'music',
    'celebrity',
    'netflix',
    'streaming',
    'hollywood',
    'award',
    'actor',
  ],
  Science: [
    'science',
    'research',
    'study',
    'discovery',
    'scientist',
    'physics',
    'chemistry',
    'biology',
    'quantum',
  ],
};

/**
 * Detect category for a story based on title, summary, and topics
 */
function detectCategory(cluster: StoryCluster): string {
  const searchText =
    `${cluster.title} ${cluster.summary} ${cluster.topics.join(' ')}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_PATTERNS)) {
    if (keywords.some((keyword) => searchText.includes(keyword))) {
      return category;
    }
  }

  // Fallback: use first topic or "Other"
  return cluster.topics[0] || 'Other';
}

/**
 * Group stories by category
 */
function groupByCategory(clusters: StoryCluster[]): CategoryTimeline[] {
  const categoryMap = new Map<string, CategoryTimeline>();

  for (const cluster of clusters) {
    const category = detectCategory(cluster);

    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        category,
        stories: [],
      });
    }

    categoryMap.get(category)!.stories.push({
      cluster,
      latestUpdate: new Date(cluster.lastUpdatedAt),
      updateCount: cluster.updateCount + cluster.changelog.length,
    });
  }

  // Sort stories within each category by date (most recent first)
  for (const timeline of categoryMap.values()) {
    timeline.stories.sort((a, b) => b.latestUpdate.getTime() - a.latestUpdate.getTime());
  }

  // Convert to array and sort by total activity (categories with most updates first)
  return Array.from(categoryMap.values()).sort((a, b) => {
    const activityA = a.stories.reduce((sum, s) => sum + s.updateCount, 0);
    const activityB = b.stories.reduce((sum, s) => sum + s.updateCount, 0);
    return activityB - activityA;
  });
}

export const TimelineView: Component<TimelineViewProps> = (props) => {
  const categoryTimelines = () => groupByCategory(props.clusters);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          'margin-bottom': '24px',
          'padding-bottom': '16px',
          'border-bottom': `3px solid ${yellowScale[500]}`,
        }}
      >
        <h2
          style={{
            margin: 0,
            'font-family': papertrail.fonts.heading,
            'font-size': '28px',
            'font-weight': 900,
            'text-transform': 'uppercase',
            'letter-spacing': '-0.02em',
            color: '#000000',
          }}
        >
          What's Happening?
        </h2>
        <p
          style={{
            margin: '6px 0 0',
            'font-size': '14px',
            color: papertrail.colors.textMuted,
          }}
        >
          Stories grouped by topic—see what's evolving in each category
        </p>
      </div>

      {/* Empty State */}
      <Show when={categoryTimelines().length === 0}>
        <div
          style={{
            padding: '48px 24px',
            'text-align': 'center',
            background: yellowScale[50],
            border: `3px solid ${yellowScale[500]}`,
          }}
        >
          <p style={{ margin: 0, color: papertrail.colors.textMuted }}>
            No timeline events yet. Build story clusters first.
          </p>
        </div>
      </Show>

      {/* Category Timelines */}
      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '32px' }}>
        <For each={categoryTimelines()}>
          {(timeline) => {
            const Icon = CATEGORY_ICONS[timeline.category] || CATEGORY_ICONS['Other'];

            return (
              <div
                style={{
                  background: '#FFFFFF',
                  border: '3px solid #000000',
                  'box-shadow': '6px 6px 0 #000000',
                  overflow: 'hidden',
                }}
              >
                {/* Category Header */}
                <div
                  style={{
                    padding: '16px 20px',
                    background: yellowScale[500],
                    'border-bottom': '3px solid #000000',
                    display: 'flex',
                    'align-items': 'center',
                    gap: '16px',
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      'flex-shrink': 0,
                    }}
                  >
                    <Icon size={32} color="#000000" />
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        margin: 0,
                        'font-family': papertrail.fonts.heading,
                        'font-size': '20px',
                        'font-weight': 900,
                        'text-transform': 'uppercase',
                        'letter-spacing': '0.02em',
                        color: '#000000',
                      }}
                    >
                      {timeline.category}
                    </h3>
                    <p
                      style={{
                        margin: '2px 0 0',
                        'font-size': '12px',
                        'font-weight': 600,
                        color: '#000000',
                        opacity: 0.7,
                      }}
                    >
                      {timeline.stories.length} stor{timeline.stories.length === 1 ? 'y' : 'ies'}
                    </p>
                  </div>
                </div>

                {/* Timeline Events */}
                <div style={{ padding: '20px' }}>
                  <div style={{ position: 'relative', 'padding-left': '40px' }}>
                    {/* Timeline Line */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '8px',
                        bottom: '8px',
                        width: '3px',
                        background: yellowScale[500],
                      }}
                    />

                    {/* Stories */}
                    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
                      <For each={timeline.stories}>
                        {(story) => (
                          <div style={{ position: 'relative' }}>
                            {/* Timeline Dot */}
                            <div
                              style={{
                                position: 'absolute',
                                left: '-34px',
                                top: '8px',
                                width: '14px',
                                height: '14px',
                                background: story.updateCount > 0 ? yellowScale[500] : '#FFFFFF',
                                border: '3px solid #000000',
                                'border-radius': '50%',
                              }}
                            />

                            {/* Story Content */}
                            <a
                              href={(() => {
                                // Get first article URL from cluster
                                const firstArticle = props.articles.find((a) =>
                                  story.cluster.articleIds.includes(a.id)
                                );
                                return firstArticle?.url || '#';
                              })()}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'block',
                                padding: '12px 16px',
                                background: papertrail.colors.background,
                                border: `2px solid ${papertrail.colors.border}`,
                                'text-decoration': 'none',
                                color: 'inherit',
                                transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translate(-2px, -2px)';
                                e.currentTarget.style.boxShadow = '3px 3px 0 #000000';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translate(0, 0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  'justify-content': 'space-between',
                                  'align-items': 'flex-start',
                                  gap: '12px',
                                  'margin-bottom': '6px',
                                }}
                              >
                                <h4
                                  style={{
                                    margin: 0,
                                    'font-family': papertrail.fonts.heading,
                                    'font-size': '15px',
                                    'font-weight': 700,
                                    'line-height': 1.4,
                                    color: '#000000',
                                    flex: 1,
                                    display: 'flex',
                                    'align-items': 'center',
                                    gap: '6px',
                                  }}
                                >
                                  <span>{story.cluster.title}</span>
                                  <ExternalLinkIcon size={14} color={papertrail.colors.textMuted} />
                                </h4>
                                <span
                                  style={{
                                    'font-size': '12px',
                                    'font-weight': 600,
                                    color: papertrail.colors.textMuted,
                                    'flex-shrink': 0,
                                  }}
                                >
                                  {formatDate(story.latestUpdate)}
                                </span>
                              </div>

                              <p
                                style={{
                                  margin: '0 0 8px 0',
                                  'font-size': '13px',
                                  'line-height': 1.5,
                                  color: papertrail.colors.textMuted,
                                }}
                              >
                                {story.cluster.summary}
                              </p>

                              <div
                                style={{
                                  display: 'flex',
                                  'align-items': 'center',
                                  gap: '8px',
                                  'font-size': '11px',
                                  color: papertrail.colors.textMuted,
                                }}
                              >
                                <span style={{ 'font-weight': 600 }}>
                                  {story.cluster.articleIds.length} articles
                                </span>
                                <Show when={story.updateCount > 0}>
                                  <span>•</span>
                                  <span style={{ color: yellowScale[700], 'font-weight': 700 }}>
                                    {story.updateCount} update{story.updateCount !== 1 ? 's' : ''}
                                  </span>
                                </Show>
                              </div>
                            </a>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                </div>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};
