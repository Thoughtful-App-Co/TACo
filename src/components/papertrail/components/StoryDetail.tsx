/**
 * Paper Trail - Story Detail (Expandable)
 * Shows all articles in a cluster + changelog of story evolution
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, For, Show } from 'solid-js';
import { Article, StoryCluster } from '../../../schemas/papertrail.schema';
import { papertrail, yellowScale } from '../../../theme/papertrail';
import { ChangeBadge } from '../ui/badge';
import { ExternalLinkIcon } from '../ui/category-icons';

export interface StoryDetailProps {
  cluster: StoryCluster;
  articles: Article[];
  onClose: () => void;
}

export const StoryDetail: Component<StoryDetailProps> = (props) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      style={{
        'margin-top': '16px',
        padding: '20px',
        background: yellowScale[50],
        border: `3px solid ${yellowScale[500]}`,
        'border-top': 'none',
      }}
    >
      {/* Close Button */}
      <div style={{ display: 'flex', 'justify-content': 'flex-end', 'margin-bottom': '16px' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            props.onClose();
          }}
          style={{
            background: '#FFFFFF',
            border: '2px solid #000000',
            padding: '8px 16px',
            cursor: 'pointer',
            'font-family': papertrail.fonts.heading,
            'font-size': '12px',
            'font-weight': 700,
            'text-transform': 'uppercase',
            'letter-spacing': '0.05em',
          }}
        >
          Close ✕
        </button>
      </div>

      {/* Changelog Section */}
      <Show when={props.cluster.changelog.length > 0}>
        <div style={{ 'margin-bottom': '24px' }}>
          <h4
            style={{
              margin: '0 0 12px 0',
              'font-family': papertrail.fonts.heading,
              'font-size': '16px',
              'font-weight': 800,
              'text-transform': 'uppercase',
              'letter-spacing': '0.05em',
              color: '#000000',
            }}
          >
            Story Evolution ({props.cluster.changelog.length})
          </h4>

          <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
            <For each={props.cluster.changelog}>
              {(change) => (
                <div
                  style={{
                    padding: '12px 16px',
                    background: '#FFFFFF',
                    border: '2px solid #000000',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: '8px',
                      'margin-bottom': '8px',
                    }}
                  >
                    <ChangeBadge type={change.changeType} size="sm" />
                    <span
                      style={{
                        'font-size': '12px',
                        color: papertrail.colors.textMuted,
                      }}
                    >
                      {formatDate(change.detectedAt)}
                    </span>
                    <Show when={change.significance}>
                      <span
                        style={{
                          'margin-left': 'auto',
                          padding: '2px 8px',
                          background: papertrail.colors.background,
                          border: `1px solid ${papertrail.colors.border}`,
                          'font-size': '10px',
                          'font-weight': 700,
                          'text-transform': 'uppercase',
                          color: papertrail.colors.textMuted,
                        }}
                      >
                        {change.significance}
                      </span>
                    </Show>
                  </div>

                  <div style={{ 'font-size': '13px', 'line-height': 1.5 }}>
                    <Show when={change.previousValue}>
                      <div style={{ 'margin-bottom': '6px' }}>
                        <strong style={{ color: '#DC2626' }}>Was:</strong>{' '}
                        <span style={{ color: papertrail.colors.textMuted }}>
                          {change.previousValue}
                        </span>
                      </div>
                    </Show>
                    <div>
                      <strong style={{ color: '#059669' }}>Now:</strong>{' '}
                      <span style={{ color: papertrail.colors.text }}>{change.newValue}</span>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Articles Section */}
      <div>
        <h4
          style={{
            margin: '0 0 12px 0',
            'font-family': papertrail.fonts.heading,
            'font-size': '16px',
            'font-weight': 800,
            'text-transform': 'uppercase',
            'letter-spacing': '0.05em',
            color: '#000000',
          }}
        >
          All Articles ({props.articles.length})
        </h4>

        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
          <For each={props.articles}>
            {(article) => (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  background: '#FFFFFF',
                  border: '2px solid #000000',
                  'text-decoration': 'none',
                  color: 'inherit',
                  transition: 'all 150ms',
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
                    'align-items': 'flex-start',
                    gap: '12px',
                    'margin-bottom': '8px',
                  }}
                >
                  <span
                    style={{
                      padding: '2px 8px',
                      background: papertrail.colors.background,
                      border: `1px solid ${papertrail.colors.border}`,
                      'font-size': '10px',
                      'font-weight': 700,
                      'text-transform': 'uppercase',
                      color: papertrail.colors.textMuted,
                      'flex-shrink': 0,
                    }}
                  >
                    {article.source.name}
                  </span>
                  <span style={{ 'font-size': '12px', color: papertrail.colors.textMuted }}>
                    {formatDate(article.publishedAt)}
                  </span>
                </div>

                <h5
                  style={{
                    margin: '0 0 6px 0',
                    'font-family': papertrail.fonts.heading,
                    'font-size': '15px',
                    'font-weight': 700,
                    'line-height': 1.4,
                    color: '#000000',
                    display: 'flex',
                    'align-items': 'center',
                    gap: '6px',
                  }}
                >
                  <span>{article.title}</span>
                  <ExternalLinkIcon size={14} color={papertrail.colors.textMuted} />
                </h5>

                <Show when={article.description}>
                  <p
                    style={{
                      margin: 0,
                      'font-size': '13px',
                      'line-height': 1.5,
                      color: papertrail.colors.textMuted,
                    }}
                  >
                    {article.description}
                  </p>
                </Show>
              </a>
            )}
          </For>
        </div>
      </div>
    </div>
  );
};
