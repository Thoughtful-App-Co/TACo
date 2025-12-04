/**
 * Paper Trail - NewsFeed Component
 * Displays list of articles with refresh functionality
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, For, Show } from 'solid-js';
import { Article } from '../../../schemas/papertrail.schema';
import { papertrail } from '../../../theme/papertrail';
import { ArticleCard } from './ArticleCard';
import { Button } from '../ui/button';

interface NewsFeedProps {
  articles: Article[];
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: string | null;
  onRefresh: () => void;
  onViewChanges: (articleId: string) => void;
}

export const NewsFeed: Component<NewsFeedProps> = (props) => {
  const formatLastFetched = () => {
    if (!props.lastFetchedAt) return null;
    const date = new Date(props.lastFetchedAt);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
      {/* Header with Refresh */}
      <div
        style={{
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          'flex-wrap': 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              'font-family': papertrail.fonts.heading,
              'font-size': '20px',
              'font-weight': 700,
              color: papertrail.colors.text,
            }}
          >
            Latest News
          </h2>
          <Show when={formatLastFetched()}>
            <p
              style={{
                margin: '4px 0 0',
                'font-size': '12px',
                color: papertrail.colors.textMuted,
              }}
            >
              Last updated: {formatLastFetched()}
            </p>
          </Show>
        </div>

        <Button variant="outline" size="sm" onClick={props.onRefresh} disabled={props.isLoading}>
          <Show when={props.isLoading} fallback={'Refresh'}>
            <span style={{ display: 'flex', 'align-items': 'center', gap: '6px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '14px',
                  height: '14px',
                  border: '2px solid currentColor',
                  'border-top-color': 'transparent',
                  'border-radius': '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              Fetching...
            </span>
          </Show>
        </Button>
      </div>

      {/* Error State */}
      <Show when={props.error}>
        <div
          style={{
            padding: '16px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            'border-radius': papertrail.radii.organic,
          }}
        >
          <p style={{ margin: 0, color: '#DC2626', 'font-size': '14px' }}>
            <strong>Error:</strong> {props.error}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={props.onRefresh}
            style={{ 'margin-top': '12px' }}
          >
            Try Again
          </Button>
        </div>
      </Show>

      {/* Loading State */}
      <Show when={props.isLoading && props.articles.length === 0}>
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
          <For each={[1, 2, 3, 4, 5]}>
            {() => (
              <div
                style={{
                  height: '100px',
                  background: `linear-gradient(90deg, ${papertrail.colors.background} 25%, ${papertrail.colors.surface} 50%, ${papertrail.colors.background} 75%)`,
                  'background-size': '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                  'border-radius': papertrail.radii.organic,
                  border: `1px solid ${papertrail.colors.border}`,
                }}
              />
            )}
          </For>
        </div>
      </Show>

      {/* Empty State - Newspaper-style */}
      <Show when={!props.isLoading && props.articles.length === 0 && !props.error}>
        <div
          style={{
            padding: '60px 32px',
            'text-align': 'center',
            background: papertrail.colors.surface,
            border: `2px solid ${papertrail.colors.text}`,
            position: 'relative',
          }}
        >
          {/* Corner flourish */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              right: '8px',
              bottom: '8px',
              border: `1px solid ${papertrail.colors.border}`,
              'pointer-events': 'none',
            }}
          />

          <h3
            style={{
              margin: '0 0 8px',
              'font-family': papertrail.fonts.heading,
              'font-size': '24px',
              'font-weight': 900,
              'text-transform': 'uppercase',
              'letter-spacing': '-0.01em',
              color: papertrail.colors.text,
            }}
          >
            EXTRA! EXTRA!
          </h3>
          <p
            style={{
              margin: '0 0 24px',
              'font-family': papertrail.fonts.body,
              'font-size': '16px',
              'font-style': 'italic',
              color: papertrail.colors.textMuted,
            }}
          >
            The presses are ready. Fetch the latest headlines.
          </p>
          <Button variant="accent" onClick={props.onRefresh}>
            Fetch News
          </Button>
        </div>
      </Show>

      {/* Articles List */}
      <Show when={props.articles.length > 0}>
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
          <For each={props.articles}>
            {(article) => <ArticleCard article={article} onViewChanges={props.onViewChanges} />}
          </For>
        </div>
      </Show>

      {/* Animation keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};
