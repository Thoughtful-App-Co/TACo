/**
 * WizardModeSelector - Choose how to create a resume variant
 *
 * Two modes:
 * 1. Tailor to Specific Job Description (paste JD text)
 * 2. Create for Job Title/Role (with RIASEC suggestions)
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show, For } from 'solid-js';
import { IconFileText, IconBriefcase } from '../../pipeline/ui/Icons';

interface WizardModeSelectorProps {
  onSelectMode: (mode: 'job-description' | 'job-title') => void;
  currentTheme: () => any;
  riasecScores?: { code: string; score: number; label: string }[];
}

export const WizardModeSelector: Component<WizardModeSelectorProps> = (props) => {
  const theme = () => props.currentTheme();

  // RIASEC-based job suggestions
  const getJobSuggestions = (): string[] => {
    if (!props.riasecScores || props.riasecScores.length === 0) {
      return ['Software Engineer', 'Project Manager', 'Data Analyst', 'Sales Manager'];
    }

    const topCode = props.riasecScores[0].code.toUpperCase();
    const suggestions: Record<string, string[]> = {
      R: ['Mechanical Engineer', 'Electrician', 'Construction Manager', 'Lab Technician'],
      I: ['Data Scientist', 'Research Scientist', 'Software Engineer', 'Analyst'],
      A: ['UX Designer', 'Creative Director', 'Content Strategist', 'Graphic Designer'],
      S: ['Healthcare Administrator', 'Teacher', 'Counselor', 'Social Worker'],
      E: ['Business Development Manager', 'Sales Director', 'Entrepreneur', 'Marketing Manager'],
      C: ['Accountant', 'Financial Analyst', 'Operations Manager', 'Quality Assurance'],
    };

    return suggestions[topCode[0]] || suggestions.I;
  };

  return (
    <div
      style={{
        padding: '32px',
        'max-width': '900px',
        margin: '0 auto',
      }}
    >
      <h2
        style={{
          margin: '0 0 12px',
          'font-size': '28px',
          color: theme().colors.text,
          'font-family': theme().fonts.heading,
          'text-align': 'center',
        }}
      >
        How would you like to create your resume?
      </h2>
      <p
        style={{
          margin: '0 0 40px',
          'font-size': '16px',
          color: theme().colors.textMuted,
          'text-align': 'center',
          'line-height': '1.6',
        }}
      >
        Choose your approach to tailor your resume with AI assistance
      </p>

      <div
        style={{
          display: 'grid',
          'grid-template-columns': 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Mode 1: Tailor to Job Description */}
        <button
          onClick={() => props.onSelectMode('job-description')}
          style={{
            padding: '32px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: `2px solid ${theme().colors.border}`,
            'border-radius': '16px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            'text-align': 'left',
            'font-family': theme().fonts.body,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = theme().colors.primary;
            e.currentTarget.style.transform = 'translateY(-4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
            e.currentTarget.style.borderColor = theme().colors.border;
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '16px',
              'margin-bottom': '16px',
            }}
          >
            <div
              style={{
                padding: '12px',
                background: theme().gradients.primary,
                'border-radius': '12px',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
              }}
            >
              <IconFileText size={24} color={theme().colors.textOnPrimary || '#FFFFFF'} />
            </div>
            <h3
              style={{
                margin: 0,
                'font-size': '20px',
                color: theme().colors.text,
                'font-family': theme().fonts.heading,
              }}
            >
              Tailor to Job Description
            </h3>
          </div>
          <p
            style={{
              margin: '0 0 16px',
              'font-size': '15px',
              color: theme().colors.textMuted,
              'line-height': '1.6',
            }}
          >
            Paste a specific job posting and AI will optimize your resume to match keywords,
            requirements, and tone.
          </p>
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.03)',
              'border-radius': '8px',
              'font-size': '13px',
              color: theme().colors.textMuted,
            }}
          >
            <strong style={{ color: theme().colors.text }}>Best for:</strong> Active applications
            where you have the full job description
          </div>
        </button>

        {/* Mode 2: Create for Job Title */}
        <button
          onClick={() => props.onSelectMode('job-title')}
          style={{
            padding: '32px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: `2px solid ${theme().colors.border}`,
            'border-radius': '16px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            'text-align': 'left',
            'font-family': theme().fonts.body,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = theme().colors.primary;
            e.currentTarget.style.transform = 'translateY(-4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
            e.currentTarget.style.borderColor = theme().colors.border;
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '16px',
              'margin-bottom': '16px',
            }}
          >
            <div
              style={{
                padding: '12px',
                background: theme().gradients.primary,
                'border-radius': '12px',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
              }}
            >
              <IconBriefcase size={24} color={theme().colors.textOnPrimary || '#FFFFFF'} />
            </div>
            <h3
              style={{
                margin: 0,
                'font-size': '20px',
                color: theme().colors.text,
                'font-family': theme().fonts.heading,
              }}
            >
              Create for Job Title
            </h3>
          </div>
          <p
            style={{
              margin: '0 0 16px',
              'font-size': '15px',
              color: theme().colors.textMuted,
              'line-height': '1.6',
            }}
          >
            Enter a job title or role type and AI will create a resume variant optimized for that
            position using industry best practices.
          </p>
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.03)',
              'border-radius': '8px',
              'font-size': '13px',
              color: theme().colors.textMuted,
              'margin-bottom': '16px',
            }}
          >
            <strong style={{ color: theme().colors.text }}>Best for:</strong> Exploring different
            career paths or creating general-purpose variants
          </div>

          {/* RIASEC Suggestions */}
          <Show when={props.riasecScores && props.riasecScores.length > 0}>
            <div
              style={{
                'margin-top': '16px',
                'padding-top': '16px',
                'border-top': `1px solid ${theme().colors.border}`,
              }}
            >
              <p
                style={{
                  margin: '0 0 12px',
                  'font-size': '13px',
                  color: theme().colors.text,
                  'font-weight': '600',
                }}
              >
                Suggested based on your profile:
              </p>
              <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '8px' }}>
                <For each={getJobSuggestions().slice(0, 3)}>
                  {(suggestion) => (
                    <span
                      style={{
                        padding: '6px 12px',
                        background: `${theme().colors.primary}15`,
                        border: `1px solid ${theme().colors.primary}`,
                        'border-radius': '6px',
                        'font-size': '12px',
                        color: theme().colors.primary,
                        'font-weight': '500',
                      }}
                    >
                      {suggestion}
                    </span>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </button>
      </div>
    </div>
  );
};
