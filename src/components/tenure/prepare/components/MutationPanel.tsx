/**
 * MutationPanel - Resume Mutation Input Form
 *
 * Allows users to paste job descriptions and configure mutation preferences.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show, For } from 'solid-js';
import { MagicWandIcon } from 'solid-phosphor/bold';
import { getMutationsRemaining, getUsageSummary } from '../../../../lib/usage-tracker';
import { canUseMutation } from '../../../../lib/feature-gates';

interface MutationPanelProps {
  onMutate: (params: {
    jobDescription: string;
    targetRole?: string;
    targetCompany?: string;
    tone: 'professional' | 'technical' | 'executive' | 'casual';
    length: 'concise' | 'detailed';
  }) => void;
  isLoading?: boolean;
  currentTheme: () => {
    colors: {
      primary: string;
      secondary: string;
      text: string;
      textMuted: string;
      textOnPrimary: string;
      background: string;
      surface: string;
      border: string;
      success: string;
      error: string;
    };
    fonts: {
      body: string;
      heading: string;
    };
    gradients: {
      primary: string;
    };
  };
}

export const MutationPanel: Component<MutationPanelProps> = (props) => {
  const theme = () => props.currentTheme();

  const [jobDescription, setJobDescription] = createSignal('');
  const [targetRole, setTargetRole] = createSignal('');
  const [targetCompany, setTargetCompany] = createSignal('');
  const [tone, setTone] = createSignal<'professional' | 'technical' | 'executive' | 'casual'>(
    'professional'
  );
  const [length, setLength] = createSignal<'concise' | 'detailed'>('concise');
  const [error, setError] = createSignal<string | null>(null);

  const usageSummary = () => getUsageSummary();
  const canMutate = () => {
    const access = canUseMutation();
    const hasQuota = getMutationsRemaining() > 0;
    return access.allowed && hasQuota;
  };

  const handleMutate = () => {
    setError(null);

    // Validation
    if (jobDescription().trim().length < 100) {
      setError('Job description must be at least 100 characters');
      return;
    }

    if (!canMutate()) {
      setError('You have reached your mutation limit for this month');
      return;
    }

    props.onMutate({
      jobDescription: jobDescription(),
      targetRole: targetRole() || undefined,
      targetCompany: targetCompany() || undefined,
      tone: tone(),
      length: length(),
    });
  };

  return (
    <div
      style={{
        padding: '24px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: `1px solid ${theme().colors.border}`,
        'border-radius': '16px',
      }}
    >
      {/* Header */}
      <div style={{ 'margin-bottom': '24px' }}>
        <h3
          style={{
            margin: '0 0 8px',
            'font-size': '24px',
            color: theme().colors.text,
            'font-family': theme().fonts.heading,
            display: 'flex',
            'align-items': 'center',
            gap: '8px',
          }}
        >
          <MagicWandIcon width={20} height={20} />
          Tailor Your Resume
        </h3>
        <p
          style={{
            margin: 0,
            'font-size': '14px',
            color: theme().colors.textMuted,
          }}
        >
          Paste a job description below to optimize your resume with AI-powered keyword matching
        </p>
      </div>

      {/* Job Description Input */}
      <div style={{ 'margin-bottom': '24px' }}>
        <label
          style={{
            display: 'block',
            'margin-bottom': '8px',
            'font-size': '14px',
            'font-weight': '600',
            color: theme().colors.text,
            'font-family': theme().fonts.body,
          }}
        >
          Job Description *
        </label>
        <textarea
          value={jobDescription()}
          onInput={(e) => setJobDescription(e.currentTarget.value)}
          placeholder="Paste the full job description here..."
          disabled={props.isLoading}
          style={{
            width: '100%',
            'min-height': '200px',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${theme().colors.border}`,
            'border-radius': '8px',
            color: theme().colors.text,
            'font-family': theme().fonts.body,
            'font-size': '14px',
            'line-height': '1.6',
            resize: 'vertical',
          }}
        />
        <div
          style={{
            'margin-top': '4px',
            'font-size': '12px',
            color: theme().colors.textMuted,
          }}
        >
          {jobDescription().length} / 100 characters minimum
        </div>
      </div>

      {/* Optional Context */}
      <div
        style={{
          display: 'grid',
          'grid-template-columns': '1fr 1fr',
          gap: '16px',
          'margin-bottom': '24px',
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              'margin-bottom': '8px',
              'font-size': '14px',
              'font-weight': '600',
              color: theme().colors.text,
              'font-family': theme().fonts.body,
            }}
          >
            Target Role (Optional)
          </label>
          <input
            type="text"
            value={targetRole()}
            onInput={(e) => setTargetRole(e.currentTarget.value)}
            placeholder="e.g., Registered Nurse"
            disabled={props.isLoading}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${theme().colors.border}`,
              'border-radius': '8px',
              color: theme().colors.text,
              'font-family': theme().fonts.body,
              'font-size': '14px',
            }}
          />
        </div>
        <div>
          <label
            style={{
              display: 'block',
              'margin-bottom': '8px',
              'font-size': '14px',
              'font-weight': '600',
              color: theme().colors.text,
              'font-family': theme().fonts.body,
            }}
          >
            Target Company (Optional)
          </label>
          <input
            type="text"
            value={targetCompany()}
            onInput={(e) => setTargetCompany(e.currentTarget.value)}
            placeholder="e.g., City Hospital"
            disabled={props.isLoading}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${theme().colors.border}`,
              'border-radius': '8px',
              color: theme().colors.text,
              'font-family': theme().fonts.body,
              'font-size': '14px',
            }}
          />
        </div>
      </div>

      {/* Preferences */}
      <div style={{ 'margin-bottom': '24px' }}>
        <h4
          style={{
            margin: '0 0 16px',
            'font-size': '16px',
            color: theme().colors.text,
            'font-family': theme().fonts.heading,
          }}
        >
          Preferences
        </h4>

        {/* Tone */}
        <div style={{ 'margin-bottom': '16px' }}>
          <label
            style={{
              display: 'block',
              'margin-bottom': '8px',
              'font-size': '14px',
              'font-weight': '600',
              color: theme().colors.text,
            }}
          >
            Tone
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <For each={['professional', 'technical', 'executive', 'casual'] as const}>
              {(option) => (
                <button
                  onClick={() => setTone(option)}
                  disabled={props.isLoading}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background:
                      tone() === option ? theme().gradients.primary : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${tone() === option ? 'transparent' : theme().colors.border}`,
                    'border-radius': '8px',
                    color: tone() === option ? theme().colors.textOnPrimary : theme().colors.text,
                    'font-family': theme().fonts.body,
                    'font-size': '14px',
                    'font-weight': '600',
                    cursor: props.isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    'text-transform': 'capitalize',
                  }}
                >
                  {option}
                </button>
              )}
            </For>
          </div>
        </div>

        {/* Length */}
        <div>
          <label
            style={{
              display: 'block',
              'margin-bottom': '8px',
              'font-size': '14px',
              'font-weight': '600',
              color: theme().colors.text,
            }}
          >
            Length
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <For each={['concise', 'detailed'] as const}>
              {(option) => (
                <button
                  onClick={() => setLength(option)}
                  disabled={props.isLoading}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background:
                      length() === option ? theme().gradients.primary : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${length() === option ? 'transparent' : theme().colors.border}`,
                    'border-radius': '8px',
                    color: length() === option ? theme().colors.textOnPrimary : theme().colors.text,
                    'font-family': theme().fonts.body,
                    'font-size': '14px',
                    'font-weight': '600',
                    cursor: props.isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    'text-transform': 'capitalize',
                  }}
                >
                  {option}
                </button>
              )}
            </For>
          </div>
        </div>
      </div>

      {/* Error Message */}
      <Show when={error()}>
        <div
          style={{
            'margin-bottom': '16px',
            padding: '12px 16px',
            background: `${theme().colors.error}20`,
            border: `1px solid ${theme().colors.error}`,
            'border-radius': '8px',
            color: theme().colors.error,
            'font-size': '14px',
          }}
        >
          {error()}
        </div>
      </Show>

      {/* Action Button */}
      <div style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'space-between' }}>
        <button
          onClick={handleMutate}
          disabled={props.isLoading || !canMutate()}
          style={{
            padding: '14px 32px',
            background: canMutate() ? theme().gradients.primary : theme().colors.border,
            border: 'none',
            'border-radius': '10px',
            color: canMutate() ? theme().colors.textOnPrimary : theme().colors.textMuted,
            'font-family': theme().fonts.body,
            'font-size': '16px',
            'font-weight': '600',
            cursor: props.isLoading || !canMutate() ? 'not-allowed' : 'pointer',
            opacity: props.isLoading ? 0.6 : 1,
            display: 'flex',
            'align-items': 'center',
            gap: '8px',
          }}
        >
          <MagicWandIcon width={18} height={18} />
          {props.isLoading ? 'Mutating...' : 'Mutate Resume'}
        </button>

        <div
          style={{
            'font-size': '14px',
            color: theme().colors.textMuted,
          }}
        >
          {usageSummary().mutations.remaining === -1
            ? 'Unlimited mutations'
            : `${usageSummary().mutations.remaining}/${usageSummary().mutations.limit} mutations left this month`}
        </div>
      </div>
    </div>
  );
};
