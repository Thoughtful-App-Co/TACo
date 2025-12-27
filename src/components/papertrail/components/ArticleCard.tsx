/**
 * Paper Trail - ArticleCard Component
 * Newspaper-style article card with change indicator
 * Enhanced with bold typography and visual punch
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show, createSignal } from 'solid-js';
import { Article } from '../../../schemas/papertrail.schema';
import {
  papertrail,
  yellowScale,
  motionTokens,
  typeScale,
  inkScale,
} from '../../../theme/papertrail';
import { SourceBadge, ChangeBadge, CountBadge } from '../ui/badge';
import { ChangelogService } from '../services/changelog.service';

interface ArticleCardProps {
  article: Article;
  onViewChanges?: (articleId: string) => void;
}

export const ArticleCard: Component<ArticleCardProps> = (props) => {
  const [isHovered, setIsHovered] = createSignal(false);

  const hasChanges = () => ChangelogService.hasChanges(props.article.id);
  const changeCount = () => ChangelogService.getChangeCount(props.article.id);
  const changes = () => ChangelogService.getArticleChanges(props.article.id);
  const latestChange = () => changes()[0];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <article
      onClick={() => window.open(props.article.url, '_blank')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={(e) => e.key === 'Enter' && window.open(props.article.url, '_blank')}
      tabIndex={0}
      role="link"
      aria-label={`Read article: ${props.article.title}`}
      style={{
        display: 'flex',
        gap: '0',
        background: papertrail.colors.surface,
        border: `1px solid ${isHovered() ? papertrail.colors.text : papertrail.colors.border}`,
        'border-left': hasChanges()
          ? `4px solid ${yellowScale[500]}`
          : `1px solid ${isHovered() ? papertrail.colors.text : papertrail.colors.border}`,
        cursor: 'pointer',
        transition: `all ${motionTokens.duration.fast} ${motionTokens.easing.standard}`,
        transform: isHovered() ? 'translateX(4px)' : 'translateX(0)',
        'box-shadow': isHovered() ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
        overflow: 'hidden',
      }}
    >
      {/* Image (if available) */}
      <Show when={props.article.imageUrl}>
        <div
          style={{
            width: '140px',
            height: '120px',
            'flex-shrink': 0,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `url(${props.article.imageUrl}) center/cover`,
              'background-color': inkScale.paper,
              filter: isHovered() ? 'brightness(1.05)' : 'brightness(1) grayscale(0.2)',
              transition: `filter ${motionTokens.duration.fast} ${motionTokens.easing.standard}`,
            }}
          />
          {/* Image overlay gradient */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '40px',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.3))',
            }}
          />
        </div>
      </Show>

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: '16px 20px',
          display: 'flex',
          'flex-direction': 'column',
          'min-width': 0,
        }}
      >
        {/* Top row: Source + Time + Change indicator */}
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: '10px',
            'margin-bottom': '10px',
            'flex-wrap': 'wrap',
          }}
        >
          <SourceBadge name={props.article.source.name} />
          <span
            style={{
              ...typeScale.timestamp,
              color: papertrail.colors.textMuted,
            }}
          >
            {formatDate(props.article.publishedAt)}
          </span>
          <Show when={hasChanges()}>
            <div style={{ display: 'flex', 'align-items': 'center', gap: '6px' }}>
              <ChangeBadge type={latestChange().changeType} size="sm" />
              <Show when={changeCount() > 1}>
                <CountBadge count={changeCount()} />
              </Show>
            </div>
          </Show>
        </div>

        {/* Headline - BOLDER */}
        <h3
          style={{
            margin: '0 0 8px',
            'font-family': papertrail.fonts.heading,
            'font-size': '17px',
            'font-weight': 700,
            'line-height': 1.3,
            color: isHovered() ? papertrail.colors.primary : papertrail.colors.text,
            display: '-webkit-box',
            '-webkit-line-clamp': '2',
            '-webkit-box-orient': 'vertical',
            overflow: 'hidden',
            transition: `color ${motionTokens.duration.fast}`,
          }}
        >
          {props.article.title}
        </h3>

        {/* Description */}
        <Show when={props.article.description}>
          <p
            style={{
              margin: 0,
              'font-family': papertrail.fonts.body,
              'font-size': '14px',
              'line-height': 1.5,
              color: papertrail.colors.textMuted,
              display: '-webkit-box',
              '-webkit-line-clamp': '2',
              '-webkit-box-orient': 'vertical',
              overflow: 'hidden',
            }}
          >
            {props.article.description}
          </p>
        </Show>

        {/* View Changes link */}
        <Show when={hasChanges() && props.onViewChanges}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              props.onViewChanges?.(props.article.id);
            }}
            style={{
              'margin-top': '12px',
              padding: '6px 12px',
              background: yellowScale[100],
              border: `1px solid ${yellowScale[400]}`,
              'font-family': papertrail.fonts.heading,
              'font-size': '11px',
              'font-weight': 700,
              'text-transform': 'uppercase',
              'letter-spacing': '0.05em',
              color: yellowScale[800],
              cursor: 'pointer',
              'align-self': 'flex-start',
              transition: `all ${motionTokens.duration.fast}`,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = yellowScale[500];
              e.currentTarget.style.color = '#000';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = yellowScale[100];
              e.currentTarget.style.color = yellowScale[800];
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = `2px solid ${yellowScale[500]}`;
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
          >
            View {changeCount()} change{changeCount() > 1 ? 's' : ''}
          </button>
        </Show>
      </div>
    </article>
  );
};
