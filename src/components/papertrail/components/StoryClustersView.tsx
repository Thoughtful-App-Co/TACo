/**
 * Paper Trail - Story Clusters View
 * Main view showing AI-clustered stories instead of chronological articles
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, For, Show, createSignal } from 'solid-js';
import { Article, StoryCluster } from '../../../schemas/papertrail.schema';
import { papertrail, yellowScale } from '../../../theme/papertrail';
import { Button } from '../ui/button';
import { StoryClusterCard } from './StoryClusterCard';
import { StoryDetail } from './StoryDetail';

export interface StoryClustersViewProps {
  clusters: StoryCluster[];
  articles: Article[];
  isBuilding: boolean;
  onBuildClusters: () => void;
  getClusterArticles: (cluster: StoryCluster) => Article[];
}

export const StoryClustersView: Component<StoryClustersViewProps> = (props) => {
  const [expandedClusterId, setExpandedClusterId] = createSignal<string | null>(null);

  const sortedClusters = () => {
    return [...props.clusters].sort((a, b) => {
      // Sort by significance (high > medium > low), then by date
      const sigOrder = { high: 3, medium: 2, low: 1 };
      const sigDiff = sigOrder[b.significance] - sigOrder[a.significance];
      if (sigDiff !== 0) return sigDiff;

      // Then by last updated (most recent first)
      return new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime();
    });
  };

  const handleExpand = (clusterId: string) => {
    setExpandedClusterId((current) => (current === clusterId ? null : clusterId));
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          'justify-content': 'space-between',
          'align-items': 'center',
          'margin-bottom': '20px',
          'padding-bottom': '16px',
          'border-bottom': `2px solid ${papertrail.colors.border}`,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              'font-family': papertrail.fonts.heading,
              'font-size': '24px',
              'font-weight': 800,
              'text-transform': 'uppercase',
              'letter-spacing': '-0.01em',
              color: '#000000',
            }}
          >
            Story Clusters
          </h2>
          <p
            style={{
              margin: '4px 0 0',
              'font-size': '13px',
              color: papertrail.colors.textMuted,
            }}
          >
            {props.clusters.length} stories from {props.articles.length} articles
          </p>
        </div>

        <Button variant="accent" onClick={props.onBuildClusters} disabled={props.isBuilding}>
          {props.isBuilding ? 'Building...' : 'Rebuild Clusters'}
        </Button>
      </div>

      {/* Empty State */}
      <Show when={props.clusters.length === 0 && !props.isBuilding}>
        <div
          style={{
            padding: '48px 24px',
            'text-align': 'center',
            background: yellowScale[50],
            border: `3px solid ${yellowScale[500]}`,
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#000000"
            stroke-width="2"
            style={{ margin: '0 auto 16px' }}
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <h3
            style={{
              margin: '0 0 8px 0',
              'font-family': papertrail.fonts.heading,
              'font-size': '18px',
              'font-weight': 800,
              'text-transform': 'uppercase',
              color: '#000000',
            }}
          >
            No Clusters Yet
          </h3>
          <p style={{ margin: '0 0 16px 0', color: papertrail.colors.textMuted }}>
            Click "Rebuild Clusters" to group articles into stories with AI
          </p>
          <Button variant="accent" onClick={props.onBuildClusters}>
            Build Clusters
          </Button>
        </div>
      </Show>

      {/* Loading State */}
      <Show when={props.isBuilding}>
        <div
          style={{
            padding: '48px 24px',
            'text-align': 'center',
            background: yellowScale[50],
            border: `3px solid ${yellowScale[500]}`,
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 16px',
              border: `4px solid ${papertrail.colors.border}`,
              'border-top-color': yellowScale[500],
              'border-radius': '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p style={{ margin: 0, 'font-weight': 600, color: papertrail.colors.text }}>
            Clustering articles with AI...
          </p>
        </div>
      </Show>

      {/* Clusters List */}
      <Show when={props.clusters.length > 0 && !props.isBuilding}>
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
          <For each={sortedClusters()}>
            {(cluster) => {
              const articles = () => props.getClusterArticles(cluster);
              const isExpanded = () => expandedClusterId() === cluster.id;

              return (
                <div>
                  <StoryClusterCard
                    cluster={cluster}
                    articleCount={articles().length}
                    onExpand={() => handleExpand(cluster.id)}
                    isExpanded={isExpanded()}
                  />
                  <Show when={isExpanded()}>
                    <StoryDetail
                      cluster={cluster}
                      articles={articles()}
                      onClose={() => setExpandedClusterId(null)}
                    />
                  </Show>
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
};
