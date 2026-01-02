/**
 * MasterResumeCard - Display card for master resume
 *
 * Shows master resume with edit and wizard actions.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show } from 'solid-js';
import { MasterResume } from '../../../../schemas/prepare.schema';
import { IconEdit, IconSparkles, IconFileText } from '../../pipeline/ui/Icons';

interface MasterResumeCardProps {
  resume: MasterResume;
  onEdit: () => void;
  onWizard: () => void;
  onExport: () => void;
  currentTheme: () => any;
}

export const MasterResumeCard: Component<MasterResumeCardProps> = (props) => {
  const theme = () => props.currentTheme();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getExperienceCount = () => {
    return props.resume.parsedSections.experience.length;
  };

  const getSkillsCount = () => {
    return props.resume.parsedSections.skills.length;
  };

  return (
    <div
      style={{
        padding: '28px',
        background: `linear-gradient(135deg, ${theme().colors.primary}15, ${theme().colors.secondary}10)`,
        border: `2px solid ${theme().colors.primary}`,
        'border-radius': '16px',
        transition: 'all 0.2s',
        display: 'flex',
        'flex-direction': 'column',
        gap: '20px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 12px 32px ${theme().colors.primary}30`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Badge */}
      <div
        style={{
          display: 'inline-block',
          'align-self': 'flex-start',
          padding: '6px 12px',
          background: theme().gradients.primary,
          'border-radius': '8px',
          'font-size': '11px',
          'font-weight': '700',
          color: theme().colors.textOnPrimary,
          'letter-spacing': '0.5px',
          'text-transform': 'uppercase',
        }}
      >
        Master Resume
      </div>

      {/* Header */}
      <div>
        <h2
          style={{
            margin: '0 0 8px',
            'font-size': '24px',
            color: theme().colors.text,
            'font-family': theme().fonts.heading,
            'font-weight': '700',
          }}
        >
          My Resume
        </h2>
        <Show when={props.resume.parsedSections.summary}>
          <p
            style={{
              margin: '0',
              'font-size': '14px',
              color: theme().colors.textMuted,
              'line-height': '1.6',
              'max-height': '60px',
              overflow: 'hidden',
              'text-overflow': 'ellipsis',
              display: '-webkit-box',
              '-webkit-line-clamp': '3',
              '-webkit-box-orient': 'vertical',
            }}
          >
            {props.resume.parsedSections.summary}
          </p>
        </Show>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          'grid-template-columns': 'repeat(3, 1fr)',
          gap: '16px',
        }}
      >
        <div
          style={{
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            'border-radius': '8px',
            'text-align': 'center',
          }}
        >
          <div
            style={{
              'font-size': '24px',
              'font-weight': '700',
              color: theme().colors.primary,
              'font-family': theme().fonts.heading,
            }}
          >
            {getExperienceCount()}
          </div>
          <div
            style={{
              'font-size': '12px',
              color: theme().colors.textMuted,
              'margin-top': '4px',
            }}
          >
            Experiences
          </div>
        </div>

        <div
          style={{
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            'border-radius': '8px',
            'text-align': 'center',
          }}
        >
          <div
            style={{
              'font-size': '24px',
              'font-weight': '700',
              color: theme().colors.primary,
              'font-family': theme().fonts.heading,
            }}
          >
            {getSkillsCount()}
          </div>
          <div
            style={{
              'font-size': '12px',
              color: theme().colors.textMuted,
              'margin-top': '4px',
            }}
          >
            Skills
          </div>
        </div>

        <div
          style={{
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            'border-radius': '8px',
            'text-align': 'center',
          }}
        >
          <div
            style={{
              'font-size': '12px',
              color: theme().colors.textMuted,
              'margin-bottom': '4px',
            }}
          >
            Created
          </div>
          <div
            style={{
              'font-size': '13px',
              'font-weight': '600',
              color: theme().colors.text,
            }}
          >
            {formatDate(props.resume.createdAt)}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          display: 'grid',
          'grid-template-columns': '1fr 1fr 1fr',
          gap: '12px',
          'padding-top': '8px',
        }}
      >
        <button
          onClick={props.onWizard}
          style={{
            padding: '12px 16px',
            background: theme().gradients.primary,
            border: 'none',
            'border-radius': '10px',
            color: theme().colors.textOnPrimary,
            cursor: 'pointer',
            'font-size': '14px',
            'font-weight': '600',
            'font-family': theme().fonts.body,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <IconSparkles size={16} />
          Wizard
        </button>

        <button
          onClick={props.onExport}
          style={{
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${theme().colors.border}`,
            'border-radius': '10px',
            color: theme().colors.text,
            cursor: 'pointer',
            'font-size': '14px',
            'font-weight': '600',
            'font-family': theme().fonts.body,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
        >
          <IconFileText size={16} />
          Export
        </button>

        <button
          onClick={props.onEdit}
          style={{
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${theme().colors.border}`,
            'border-radius': '10px',
            color: theme().colors.text,
            cursor: 'pointer',
            'font-size': '14px',
            'font-weight': '600',
            'font-family': theme().fonts.body,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
        >
          <IconEdit size={16} />
          Edit
        </button>
      </div>
    </div>
  );
};
