/**
 * CoverLetterPanel - Generate Cover Letter from Mutation Results
 *
 * Shows after mutation results, allows generating a matching cover letter.
 * Uses extra credits (tracked separately from mutations).
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show, For } from 'solid-js';
import type { CoverLetterResponse } from '../services/cover-letter.service';
import { IconCopy, IconDownload, IconX, IconPlus } from '../../pipeline/ui/Icons';

interface CoverLetterPanelProps {
  // Context from mutation
  targetCompany: string;
  targetRole: string;
  jobDescription?: string;
  occupationTitle?: string;
  occupationData?: { skills: { name: string }[]; tasks: string[] };
  // Callbacks
  onGenerate: (params: {
    targetCompany: string;
    targetRole: string;
    hiringManagerName?: string;
    tone: 'professional' | 'enthusiastic' | 'formal' | 'conversational';
    length: 'short' | 'medium' | 'long';
    keyPoints: string[];
  }) => void;
  onClose: () => void;
  isLoading?: boolean;
  result?: CoverLetterResponse | null;
  error?: string | null;
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

export const CoverLetterPanel: Component<CoverLetterPanelProps> = (props) => {
  const theme = () => props.currentTheme();

  // Form state
  const [targetCompany, setTargetCompany] = createSignal(props.targetCompany);
  const [targetRole, setTargetRole] = createSignal(props.targetRole);
  const [hiringManagerName, setHiringManagerName] = createSignal('');
  const [tone, setTone] = createSignal<
    'professional' | 'enthusiastic' | 'formal' | 'conversational'
  >('professional');
  const [length, setLength] = createSignal<'short' | 'medium' | 'long'>('medium');
  const [keyPoints, setKeyPoints] = createSignal<string[]>([]);
  const [newKeyPoint, setNewKeyPoint] = createSignal('');

  // Copy state
  const [copied, setCopied] = createSignal(false);

  const addKeyPoint = () => {
    const point = newKeyPoint().trim();
    if (point && keyPoints().length < 5) {
      setKeyPoints([...keyPoints(), point]);
      setNewKeyPoint('');
    }
  };

  const removeKeyPoint = (index: number) => {
    setKeyPoints(keyPoints().filter((_, i) => i !== index));
  };

  const handleGenerate = () => {
    props.onGenerate({
      targetCompany: targetCompany(),
      targetRole: targetRole(),
      hiringManagerName: hiringManagerName() || undefined,
      tone: tone(),
      length: length(),
      keyPoints: keyPoints(),
    });
  };

  const copyToClipboard = async () => {
    if (props.result?.coverLetter) {
      await navigator.clipboard.writeText(props.result.coverLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadAsTxt = () => {
    if (props.result?.coverLetter) {
      const blob = new Blob([props.result.coverLetter], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cover-letter-${targetCompany().replace(/\s+/g, '-').toLowerCase()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const toneOptions: Array<{
    value: 'professional' | 'enthusiastic' | 'formal' | 'conversational';
    label: string;
  }> = [
    { value: 'professional', label: 'Professional' },
    { value: 'enthusiastic', label: 'Enthusiastic' },
    { value: 'formal', label: 'Formal' },
    { value: 'conversational', label: 'Conversational' },
  ];

  const lengthOptions: Array<{ value: 'short' | 'medium' | 'long'; label: string; desc: string }> =
    [
      { value: 'short', label: 'Short', desc: '150-200 words' },
      { value: 'medium', label: 'Medium', desc: '250-350 words' },
      { value: 'long', label: 'Long', desc: '400-500 words' },
    ];

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
      <div
        style={{
          display: 'flex',
          'justify-content': 'space-between',
          'align-items': 'start',
          'margin-bottom': '24px',
        }}
      >
        <div>
          <h3
            style={{
              margin: '0 0 8px',
              'font-size': '24px',
              color: theme().colors.text,
              'font-family': theme().fonts.heading,
            }}
          >
            Generate Cover Letter
          </h3>
          <p
            style={{
              margin: 0,
              'font-size': '14px',
              color: theme().colors.textMuted,
            }}
          >
            Create a tailored cover letter for this position (uses 1 extra credit)
          </p>
        </div>
        <button
          onClick={props.onClose}
          style={{
            padding: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${theme().colors.border}`,
            'border-radius': '8px',
            color: theme().colors.text,
            cursor: 'pointer',
          }}
        >
          <IconX size={18} />
        </button>
      </div>

      {/* Show form if no result, otherwise show results */}
      <Show when={!props.result}>
        {/* Target Info */}
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
              Target Company *
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
              Target Role *
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
        </div>

        {/* Hiring Manager Name (Optional) */}
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
            Hiring Manager Name (Optional)
          </label>
          <input
            type="text"
            value={hiringManagerName()}
            onInput={(e) => setHiringManagerName(e.currentTarget.value)}
            placeholder="e.g., Sarah Johnson"
            disabled={props.isLoading}
            style={{
              width: '100%',
              'max-width': '400px',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${theme().colors.border}`,
              'border-radius': '8px',
              color: theme().colors.text,
              'font-family': theme().fonts.body,
              'font-size': '14px',
            }}
          />
          <p
            style={{
              margin: '4px 0 0',
              'font-size': '12px',
              color: theme().colors.textMuted,
            }}
          >
            If provided, the letter will be addressed to this person
          </p>
        </div>

        {/* Tone Selector */}
        <div style={{ 'margin-bottom': '24px' }}>
          <label
            style={{
              display: 'block',
              'margin-bottom': '12px',
              'font-size': '14px',
              'font-weight': '600',
              color: theme().colors.text,
            }}
          >
            Tone
          </label>
          <div style={{ display: 'flex', gap: '12px', 'flex-wrap': 'wrap' }}>
            <For each={toneOptions}>
              {(option) => (
                <button
                  onClick={() => setTone(option.value)}
                  disabled={props.isLoading}
                  style={{
                    padding: '10px 20px',
                    background:
                      tone() === option.value
                        ? theme().gradients.primary
                        : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${tone() === option.value ? 'transparent' : theme().colors.border}`,
                    'border-radius': '8px',
                    color:
                      tone() === option.value ? theme().colors.textOnPrimary : theme().colors.text,
                    'font-family': theme().fonts.body,
                    'font-size': '14px',
                    'font-weight': '600',
                    cursor: props.isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {option.label}
                </button>
              )}
            </For>
          </div>
        </div>

        {/* Length Selector */}
        <div style={{ 'margin-bottom': '24px' }}>
          <label
            style={{
              display: 'block',
              'margin-bottom': '12px',
              'font-size': '14px',
              'font-weight': '600',
              color: theme().colors.text,
            }}
          >
            Length
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <For each={lengthOptions}>
              {(option) => (
                <button
                  onClick={() => setLength(option.value)}
                  disabled={props.isLoading}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background:
                      length() === option.value
                        ? theme().gradients.primary
                        : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${length() === option.value ? 'transparent' : theme().colors.border}`,
                    'border-radius': '8px',
                    color:
                      length() === option.value
                        ? theme().colors.textOnPrimary
                        : theme().colors.text,
                    'font-family': theme().fonts.body,
                    'font-size': '14px',
                    'font-weight': '600',
                    cursor: props.isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    'text-align': 'center',
                  }}
                >
                  <div>{option.label}</div>
                  <div
                    style={{
                      'font-size': '11px',
                      'font-weight': '400',
                      opacity: 0.8,
                      'margin-top': '2px',
                    }}
                  >
                    {option.desc}
                  </div>
                </button>
              )}
            </For>
          </div>
        </div>

        {/* Key Points */}
        <div style={{ 'margin-bottom': '24px' }}>
          <label
            style={{
              display: 'block',
              'margin-bottom': '8px',
              'font-size': '14px',
              'font-weight': '600',
              color: theme().colors.text,
            }}
          >
            Key Points to Emphasize (Optional)
          </label>
          <p
            style={{
              margin: '0 0 12px',
              'font-size': '12px',
              color: theme().colors.textMuted,
            }}
          >
            Add up to 5 specific points you want highlighted
          </p>

          {/* Key points chips */}
          <Show when={keyPoints().length > 0}>
            <div
              style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '8px', 'margin-bottom': '12px' }}
            >
              <For each={keyPoints()}>
                {(point, index) => (
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      background: `${theme().colors.primary}20`,
                      border: `1px solid ${theme().colors.primary}`,
                      'border-radius': '20px',
                      'font-size': '13px',
                      color: theme().colors.text,
                    }}
                  >
                    <span>{point}</span>
                    <button
                      onClick={() => removeKeyPoint(index())}
                      disabled={props.isLoading}
                      style={{
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        width: '16px',
                        height: '16px',
                        padding: 0,
                        background: 'transparent',
                        border: 'none',
                        color: theme().colors.textMuted,
                        cursor: 'pointer',
                        'font-size': '14px',
                      }}
                    >
                      <IconX size={12} />
                    </button>
                  </div>
                )}
              </For>
            </div>
          </Show>

          {/* Add key point input */}
          <Show when={keyPoints().length < 5}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newKeyPoint()}
                onInput={(e) => setNewKeyPoint(e.currentTarget.value)}
                onKeyPress={(e) => e.key === 'Enter' && addKeyPoint()}
                placeholder="e.g., 5 years leadership experience"
                disabled={props.isLoading}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${theme().colors.border}`,
                  'border-radius': '8px',
                  color: theme().colors.text,
                  'font-family': theme().fonts.body,
                  'font-size': '14px',
                }}
              />
              <button
                onClick={addKeyPoint}
                disabled={props.isLoading || !newKeyPoint().trim()}
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  background: newKeyPoint().trim()
                    ? theme().colors.primary
                    : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${newKeyPoint().trim() ? 'transparent' : theme().colors.border}`,
                  'border-radius': '8px',
                  color: newKeyPoint().trim()
                    ? theme().colors.textOnPrimary
                    : theme().colors.textMuted,
                  'font-size': '14px',
                  'font-weight': '600',
                  cursor: props.isLoading || !newKeyPoint().trim() ? 'not-allowed' : 'pointer',
                }}
              >
                <IconPlus size={16} /> Add
              </button>
            </div>
          </Show>
        </div>

        {/* Error Message */}
        <Show when={props.error}>
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
            {props.error}
          </div>
        </Show>

        {/* Generate Button */}
        <div style={{ display: 'flex', 'justify-content': 'flex-end' }}>
          <button
            onClick={handleGenerate}
            disabled={props.isLoading || !targetCompany().trim() || !targetRole().trim()}
            style={{
              padding: '14px 32px',
              background:
                !props.isLoading && targetCompany().trim() && targetRole().trim()
                  ? theme().gradients.primary
                  : theme().colors.border,
              border: 'none',
              'border-radius': '10px',
              color:
                !props.isLoading && targetCompany().trim() && targetRole().trim()
                  ? theme().colors.textOnPrimary
                  : theme().colors.textMuted,
              'font-family': theme().fonts.body,
              'font-size': '16px',
              'font-weight': '600',
              cursor:
                props.isLoading || !targetCompany().trim() || !targetRole().trim()
                  ? 'not-allowed'
                  : 'pointer',
              opacity: props.isLoading ? 0.6 : 1,
            }}
          >
            {props.isLoading ? 'Generating...' : 'Generate Cover Letter'}
          </button>
        </div>
      </Show>

      {/* Results View */}
      <Show when={props.result}>
        <div>
          {/* Full Cover Letter */}
          <div
            style={{
              'margin-bottom': '24px',
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${theme().colors.border}`,
              'border-radius': '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                'justify-content': 'space-between',
                'align-items': 'center',
                'margin-bottom': '16px',
              }}
            >
              <h4
                style={{
                  margin: 0,
                  'font-size': '16px',
                  color: theme().colors.text,
                  'font-family': theme().fonts.heading,
                }}
              >
                Your Cover Letter
              </h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={copyToClipboard}
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    background: copied() ? theme().colors.success : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${copied() ? theme().colors.success : theme().colors.border}`,
                    'border-radius': '8px',
                    color: copied() ? '#FFFFFF' : theme().colors.text,
                    'font-size': '13px',
                    'font-weight': '600',
                    cursor: 'pointer',
                  }}
                >
                  <IconCopy size={14} /> {copied() ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={downloadAsTxt}
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${theme().colors.border}`,
                    'border-radius': '8px',
                    color: theme().colors.text,
                    'font-size': '13px',
                    'font-weight': '600',
                    cursor: 'pointer',
                  }}
                >
                  <IconDownload size={14} /> Download TXT
                </button>
              </div>
            </div>
            <div
              style={{
                'white-space': 'pre-wrap',
                'font-size': '14px',
                'line-height': '1.7',
                color: theme().colors.text,
                'font-family': theme().fonts.body,
              }}
            >
              {props.result?.coverLetter}
            </div>
          </div>

          {/* Sections Breakdown */}
          <div
            style={{
              'margin-bottom': '24px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${theme().colors.border}`,
              'border-radius': '12px',
            }}
          >
            <h4
              style={{
                margin: '0 0 16px',
                'font-size': '16px',
                color: theme().colors.text,
                'font-family': theme().fonts.heading,
              }}
            >
              Sections Breakdown
            </h4>

            {/* Opening */}
            <div style={{ 'margin-bottom': '16px' }}>
              <div
                style={{
                  'margin-bottom': '6px',
                  'font-size': '12px',
                  'font-weight': '600',
                  color: theme().colors.textMuted,
                  'text-transform': 'uppercase',
                }}
              >
                Opening
              </div>
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  'border-radius': '8px',
                  'font-size': '14px',
                  'line-height': '1.5',
                  color: theme().colors.text,
                }}
              >
                {props.result?.sections.opening}
              </div>
            </div>

            {/* Body Paragraphs */}
            <div style={{ 'margin-bottom': '16px' }}>
              <div
                style={{
                  'margin-bottom': '6px',
                  'font-size': '12px',
                  'font-weight': '600',
                  color: theme().colors.textMuted,
                  'text-transform': 'uppercase',
                }}
              >
                Body
              </div>
              <For each={props.result?.sections.body}>
                {(paragraph, index) => (
                  <div
                    style={{
                      padding: '12px',
                      'margin-bottom':
                        index() < (props.result?.sections.body.length || 0) - 1 ? '8px' : 0,
                      background: 'rgba(255, 255, 255, 0.03)',
                      'border-radius': '8px',
                      'font-size': '14px',
                      'line-height': '1.5',
                      color: theme().colors.text,
                    }}
                  >
                    {paragraph}
                  </div>
                )}
              </For>
            </div>

            {/* Closing */}
            <div>
              <div
                style={{
                  'margin-bottom': '6px',
                  'font-size': '12px',
                  'font-weight': '600',
                  color: theme().colors.textMuted,
                  'text-transform': 'uppercase',
                }}
              >
                Closing
              </div>
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  'border-radius': '8px',
                  'font-size': '14px',
                  'line-height': '1.5',
                  color: theme().colors.text,
                }}
              >
                {props.result?.sections.closing}
              </div>
            </div>
          </div>

          {/* Keywords Used */}
          <Show when={props.result?.keywordsUsed && props.result.keywordsUsed.length > 0}>
            <div
              style={{
                'margin-bottom': '24px',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${theme().colors.border}`,
                'border-radius': '12px',
              }}
            >
              <div
                style={{
                  'margin-bottom': '12px',
                  'font-size': '14px',
                  'font-weight': '600',
                  color: theme().colors.text,
                }}
              >
                Keywords Used
              </div>
              <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '8px' }}>
                <For each={props.result?.keywordsUsed}>
                  {(keyword) => (
                    <span
                      style={{
                        padding: '4px 10px',
                        background: `${theme().colors.success}20`,
                        border: `1px solid ${theme().colors.success}`,
                        'border-radius': '6px',
                        'font-size': '12px',
                        color: theme().colors.success,
                        'font-weight': '500',
                      }}
                    >
                      {keyword}
                    </span>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Metadata */}
          <Show when={props.result?.metadata}>
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.02)',
                'border-radius': '8px',
                'font-size': '12px',
                color: theme().colors.textMuted,
              }}
            >
              Generated in {props.result?.metadata.processingTime}ms |{' '}
              {props.result?.metadata.tokensUsed.total} tokens used
            </div>
          </Show>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              'justify-content': 'flex-end',
              'margin-top': '24px',
              'padding-top': '16px',
              'border-top': `1px solid ${theme().colors.border}`,
            }}
          >
            <button
              onClick={props.onClose}
              style={{
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${theme().colors.border}`,
                'border-radius': '10px',
                color: theme().colors.text,
                'font-size': '15px',
                'font-weight': '600',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
};
