/**
 * ResumeVariantCard - Display card for resume variants
 *
 * Shows variant metadata, match score, and quick actions.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show, For } from 'solid-js';
import { ResumeVariant } from '../../../../schemas/prepare.schema';
import { IconEdit, IconTrash, IconSparkles, IconFileText } from '../../pipeline/ui/Icons';

interface ResumeVariantCardProps {
  variant: ResumeVariant;
  onEdit: (variant: ResumeVariant) => void;
  onDelete: (id: string) => void;
  onWizard: (variant: ResumeVariant) => void;
  onExport: (variant: ResumeVariant) => void;
  currentTheme: () => any;
}

export const ResumeVariantCard: Component<ResumeVariantCardProps> = (props) => {
  const theme = () => props.currentTheme();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getMatchScoreColor = (score?: number) => {
    if (!score) return theme().colors.textMuted;
    if (score >= 80) return theme().colors.success || '#10b981';
    if (score >= 60) return theme().colors.primary;
    return theme().colors.error || '#ef4444';
  };

  return (
    <div
      style={{
        padding: '24px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: `1px solid ${theme().colors.border}`,
        'border-radius': '12px',
        transition: 'all 0.2s',
        display: 'flex',
        'flex-direction': 'column',
        gap: '16px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Header */}
      <div>
        <h3
          style={{
            margin: '0 0 8px',
            'font-size': '18px',
            color: theme().colors.text,
            'font-family': theme().fonts.heading,
            'font-weight': '600',
          }}
        >
          {props.variant.name}
        </h3>
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: '12px',
            'flex-wrap': 'wrap',
          }}
        >
          <Show when={props.variant.targetRole}>
            <span
              style={{
                'font-size': '13px',
                color: theme().colors.textMuted,
              }}
            >
              {props.variant.targetRole}
            </span>
          </Show>
          <Show when={props.variant.targetCompany}>
            <span
              style={{
                'font-size': '13px',
                color: theme().colors.textMuted,
              }}
            >
              @ {props.variant.targetCompany}
            </span>
          </Show>
          <Show when={props.variant.keywordMatchScore !== undefined}>
            <span
              style={{
                padding: '4px 10px',
                background: `${getMatchScoreColor(props.variant.keywordMatchScore)}20`,
                border: `1px solid ${getMatchScoreColor(props.variant.keywordMatchScore)}`,
                'border-radius': '6px',
                'font-size': '12px',
                'font-weight': '600',
                color: getMatchScoreColor(props.variant.keywordMatchScore),
              }}
            >
              {props.variant.keywordMatchScore}% Match
            </span>
          </Show>
        </div>
      </div>

      {/* Keywords */}
      <Show when={props.variant.includedSkills.length > 0}>
        <div>
          <div
            style={{
              display: 'flex',
              'flex-wrap': 'wrap',
              gap: '6px',
              'margin-top': '8px',
            }}
          >
            <For each={props.variant.includedSkills.slice(0, 5)}>
              {(skill) => (
                <span
                  style={{
                    padding: '4px 8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${theme().colors.border}`,
                    'border-radius': '4px',
                    'font-size': '11px',
                    color: theme().colors.textMuted,
                  }}
                >
                  {skill}
                </span>
              )}
            </For>
            <Show when={props.variant.includedSkills.length > 5}>
              <span
                style={{
                  padding: '4px 8px',
                  'font-size': '11px',
                  color: theme().colors.textMuted,
                }}
              >
                +{props.variant.includedSkills.length - 5} more
              </span>
            </Show>
          </div>
        </div>
      </Show>

      {/* Metadata */}
      <div
        style={{
          'padding-top': '12px',
          'border-top': `1px solid ${theme().colors.border}`,
          display: 'flex',
          'justify-content': 'space-between',
          'align-items': 'center',
        }}
      >
        <div
          style={{
            'font-size': '12px',
            color: theme().colors.textMuted,
          }}
        >
          Created {formatDate(props.variant.createdAt)}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => props.onWizard(props.variant)}
            style={{
              padding: '8px',
              background: 'transparent',
              border: `1px solid ${theme().colors.border}`,
              'border-radius': '6px',
              color: theme().colors.text,
              cursor: 'pointer',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme().gradients.primary;
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.color = theme().colors.textOnPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = theme().colors.border;
              e.currentTarget.style.color = theme().colors.text;
            }}
            title="Tailor with wizard"
          >
            <IconSparkles size={14} />
          </button>

          <button
            onClick={() => props.onExport(props.variant)}
            style={{
              padding: '8px',
              background: 'transparent',
              border: `1px solid ${theme().colors.border}`,
              'border-radius': '6px',
              color: theme().colors.text,
              cursor: 'pointer',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="Export resume"
          >
            <IconFileText size={14} />
          </button>

          <button
            onClick={() => props.onEdit(props.variant)}
            style={{
              padding: '8px',
              background: 'transparent',
              border: `1px solid ${theme().colors.border}`,
              'border-radius': '6px',
              color: theme().colors.text,
              cursor: 'pointer',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="Edit variant"
          >
            <IconEdit size={14} />
          </button>

          <button
            onClick={() => props.onDelete(props.variant.id)}
            style={{
              padding: '8px',
              background: 'transparent',
              border: `1px solid ${theme().colors.border}`,
              'border-radius': '6px',
              color: theme().colors.error || '#ef4444',
              cursor: 'pointer',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${theme().colors.error}20`;
              e.currentTarget.style.borderColor = theme().colors.error;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = theme().colors.border;
            }}
            title="Delete variant"
          >
            <IconTrash size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
