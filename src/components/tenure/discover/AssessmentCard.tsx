/**
 * AssessmentCard Component
 *
 * Reusable card component for displaying assessment options in the Assessment Hub.
 * Compact mode when completed, full mode when not started.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show } from 'solid-js';
import { maximalist } from '../../../theme/maximalist';
import { IconTarget, IconBrain, IconMindmap } from '../pipeline/ui/Icons';

export interface AssessmentCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: 'target' | 'brain' | 'mindmap';
  questionCount: number;
  estimatedMinutes: number;
  isCompleted: boolean;
  isComingSoon?: boolean;
  onStart: () => void;
  onViewResults?: () => void;
  gradient: string;
  textOnPrimary?: string; // Text color for button (black on light, white on dark)
  // Compact mode data (when completed)
  resultTitle?: string; // e.g., "The Artificer", "INTJ", "The Explorer"
  resultSubtext?: string; // e.g., hybrid code, trait scores
}

const CheckIcon = (props: { width: number; height: number }) => (
  <svg width={props.width} height={props.height} viewBox="0 0 20 20" fill="currentColor">
    <path
      fill-rule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clip-rule="evenodd"
    />
  </svg>
);

export const AssessmentCard: Component<AssessmentCardProps> = (props) => {
  const isCompact = () => props.isCompleted && props.resultTitle;

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        padding: isCompact() ? '20px 24px' : '28px',
        'border-radius': maximalist.radii.lg,
        border: `1px solid ${maximalist.colors.border}`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        cursor: props.isComingSoon ? 'not-allowed' : 'pointer',
        opacity: props.isComingSoon ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!props.isComingSoon) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style['box-shadow'] = '0 8px 24px rgba(0,0,0,0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (!props.isComingSoon) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style['box-shadow'] = 'none';
        }
      }}
      onClick={() => {
        if (props.isCompleted && props.onViewResults) {
          props.onViewResults();
        } else if (!props.isComingSoon && !props.isCompleted) {
          props.onStart();
        }
      }}
    >
      {/* Compact Mode - When completed */}
      <Show when={isCompact()}>
        <div style={{ display: 'flex', 'align-items': 'center', gap: '16px' }}>
          {/* Small Icon */}
          <div
            style={{
              width: '48px',
              height: '48px',
              'border-radius': '50%',
              background: props.gradient,
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'flex-shrink': '0',
            }}
          >
            <Show when={props.icon === 'target'}>
              <IconTarget size={24} color="white" />
            </Show>
            <Show when={props.icon === 'brain'}>
              <IconBrain size={24} color="white" />
            </Show>
            <Show when={props.icon === 'mindmap'}>
              <IconMindmap size={24} color="white" />
            </Show>
          </div>

          {/* Content */}
          <div style={{ flex: 1, 'min-width': 0 }}>
            <div
              style={{
                'font-size': '13px',
                color: maximalist.colors.textMuted,
                'margin-bottom': '2px',
              }}
            >
              {props.title}
            </div>
            <div
              style={{
                'font-family': maximalist.fonts.heading,
                'font-size': '20px',
                'font-weight': '700',
                color: maximalist.colors.text,
                'margin-bottom': '2px',
              }}
            >
              {props.resultTitle}
            </div>
            <Show when={props.resultSubtext}>
              <div
                style={{
                  'font-size': '13px',
                  color: maximalist.colors.textMuted,
                  'font-family': 'monospace',
                }}
              >
                {props.resultSubtext}
              </div>
            </Show>
          </div>

          {/* Checkmark */}
          <div
            style={{
              width: '32px',
              height: '32px',
              'border-radius': '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10B981',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'flex-shrink': '0',
            }}
          >
            <CheckIcon width={18} height={18} />
          </div>
        </div>
      </Show>

      {/* Full Mode - When not completed */}
      <Show when={!isCompact()}>
        {/* Background gradient overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100px',
            background: `linear-gradient(180deg, ${props.gradient}12, transparent)`,
            'border-radius': `${maximalist.radii.lg} ${maximalist.radii.lg} 0 0`,
            'pointer-events': 'none',
          }}
        />

        {/* Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            'border-radius': '50%',
            background: props.gradient,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'margin-bottom': '20px',
            position: 'relative',
            'box-shadow': '0 8px 20px rgba(0,0,0,0.2)',
          }}
        >
          <Show when={props.icon === 'target'}>
            <IconTarget size={32} color="white" />
          </Show>
          <Show when={props.icon === 'brain'}>
            <IconBrain size={32} color="white" />
          </Show>
          <Show when={props.icon === 'mindmap'}>
            <IconMindmap size={32} color="white" />
          </Show>
        </div>

        {/* Coming Soon badge */}
        <Show when={props.isComingSoon}>
          <div
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              padding: '6px 12px',
              'border-radius': maximalist.radii.md,
              background: 'rgba(255,255,255,0.1)',
              border: `1px solid ${maximalist.colors.border}`,
              color: maximalist.colors.textMuted,
              'font-size': '12px',
              'font-weight': '600',
            }}
          >
            Coming Soon
          </div>
        </Show>

        {/* Title */}
        <h3
          style={{
            'font-family': maximalist.fonts.heading,
            'font-size': '24px',
            'font-weight': '700',
            'margin-bottom': '6px',
            color: maximalist.colors.text,
          }}
        >
          {props.title}
        </h3>

        {/* Subtitle */}
        <p
          style={{
            'font-size': '14px',
            color: maximalist.colors.accent,
            'margin-bottom': '12px',
            'font-weight': '600',
          }}
        >
          {props.subtitle}
        </p>

        {/* Description */}
        <p
          style={{
            'font-size': '15px',
            color: maximalist.colors.textMuted,
            'line-height': '1.5',
            'margin-bottom': '16px',
          }}
        >
          {props.description}
        </p>

        {/* Meta info */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            'margin-bottom': '20px',
            'font-size': '14px',
            color: maximalist.colors.textMuted,
          }}
        >
          <span>{props.questionCount} questions</span>
          <span>·</span>
          <span>{props.estimatedMinutes} min</span>
        </div>

        {/* Action button */}
        <Show when={!props.isComingSoon}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              props.onStart();
            }}
            style={{
              width: '100%',
              padding: '14px',
              background: props.gradient,
              border: 'none',
              'border-radius': maximalist.radii.md,
              color: props.textOnPrimary || 'white',
              'font-size': '15px',
              'font-weight': '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style['box-shadow'] = '0 4px 16px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style['box-shadow'] = 'none';
            }}
          >
            Start Assessment
          </button>
        </Show>
      </Show>
    </div>
  );
};
