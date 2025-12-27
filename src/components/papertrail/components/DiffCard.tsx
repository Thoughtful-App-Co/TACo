/**
 * Paper Trail - DiffCard Component
 * Shows side-by-side comparison of article changes
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component } from 'solid-js';
import { ChangelogEntry } from '../../../schemas/papertrail.schema';
import { papertrail, yellowScale, diffColors, motionTokens } from '../../../theme/papertrail';
import { Card, CardContent } from '../ui/card';
import { ChangeBadge } from '../ui/badge';

interface DiffCardProps {
  entry: ChangelogEntry;
}

export const DiffCard: Component<DiffCardProps> = (props) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const fieldLabel = () => {
    return props.entry.field === 'title' ? 'Headline' : 'Description';
  };

  return (
    <Card>
      <CardContent style={{ padding: '16px' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            'align-items': 'flex-start',
            'justify-content': 'space-between',
            gap: '12px',
            'margin-bottom': '16px',
          }}
        >
          <div style={{ flex: 1, 'min-width': 0 }}>
            <a
              href={props.entry.articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                'font-family': papertrail.fonts.heading,
                'font-size': '15px',
                'font-weight': 600,
                color: papertrail.colors.text,
                'text-decoration': 'none',
                'line-height': 1.3,
                transition: `color ${motionTokens.duration.fast}`,
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = yellowScale[700])}
              onMouseOut={(e) => (e.currentTarget.style.color = papertrail.colors.text)}
            >
              {props.entry.articleTitle}
            </a>
            <p
              style={{
                margin: '4px 0 0',
                'font-size': '12px',
                color: papertrail.colors.textMuted,
              }}
            >
              {fieldLabel()} changed • {formatDate(props.entry.detectedAt)}
            </p>
          </div>
          <ChangeBadge type={props.entry.changeType} />
        </div>

        {/* Diff Display */}
        <div
          style={{
            display: 'grid',
            'grid-template-columns': '1fr 1fr',
            gap: '12px',
          }}
        >
          {/* Previous Value */}
          <div>
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '6px',
                'margin-bottom': '8px',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  'border-radius': '50%',
                  background: diffColors.removed.accent,
                }}
              />
              <span
                style={{
                  'font-family': papertrail.fonts.heading,
                  'font-size': '11px',
                  'font-weight': 600,
                  'text-transform': 'uppercase',
                  'letter-spacing': '0.05em',
                  color: diffColors.removed.text,
                }}
              >
                Before
              </span>
            </div>
            <div
              style={{
                padding: '12px',
                background: diffColors.removed.bg,
                border: `1px solid ${diffColors.removed.border}`,
                'border-radius': papertrail.radii.organic,
                'font-family': papertrail.fonts.body,
                'font-size': '13px',
                'line-height': 1.5,
                color: papertrail.colors.text,
              }}
            >
              <span style={{ 'text-decoration': 'line-through', opacity: 0.7 }}>
                {props.entry.previousValue}
              </span>
            </div>
          </div>

          {/* New Value */}
          <div>
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '6px',
                'margin-bottom': '8px',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  'border-radius': '50%',
                  background: diffColors.added.accent,
                }}
              />
              <span
                style={{
                  'font-family': papertrail.fonts.heading,
                  'font-size': '11px',
                  'font-weight': 600,
                  'text-transform': 'uppercase',
                  'letter-spacing': '0.05em',
                  color: diffColors.added.text,
                }}
              >
                After
              </span>
            </div>
            <div
              style={{
                padding: '12px',
                background: diffColors.added.bg,
                border: `1px solid ${diffColors.added.border}`,
                'border-radius': papertrail.radii.organic,
                'font-family': papertrail.fonts.body,
                'font-size': '13px',
                'line-height': 1.5,
                color: papertrail.colors.text,
              }}
            >
              {props.entry.newValue}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
