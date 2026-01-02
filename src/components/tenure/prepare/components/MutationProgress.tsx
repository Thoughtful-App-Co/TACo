/**
 * MutationProgress - Loading State for Mutations
 *
 * Shows progress while mutation is being processed.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, onMount, onCleanup, Show } from 'solid-js';
import { CheckIcon, CircleHalfIcon, CircleIcon, MagicWandIcon } from 'solid-phosphor/bold';

interface MutationProgressProps {
  currentTheme: () => {
    colors: {
      primary: string;
      text: string;
      textMuted: string;
      border: string;
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

export const MutationProgress: Component<MutationProgressProps> = (props) => {
  const theme = () => props.currentTheme();
  const [progress, setProgress] = createSignal(0);
  const [currentStep, setCurrentStep] = createSignal(0);

  const steps = [
    'Extracting keywords from job description...',
    'Analyzing skill gaps...',
    'Rewriting experience bullets...',
    'Generating tailored summary...',
    'Finalizing mutations...',
  ];

  onMount(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) return 95; // Stop at 95% until real completion
        return p + 1;
      });

      // Update step based on progress
      const step = Math.floor((progress() / 100) * steps.length);
      setCurrentStep(Math.min(step, steps.length - 1));
    }, 100);

    onCleanup(() => clearInterval(interval));
  });

  return (
    <div
      style={{
        padding: '48px',
        'text-align': 'center',
        background: 'rgba(255, 255, 255, 0.02)',
        border: `1px solid ${theme().colors.border}`,
        'border-radius': '16px',
      }}
    >
      {/* Icon */}
      <div style={{ display: 'flex', 'justify-content': 'center', 'margin-bottom': '24px' }}>
        <MagicWandIcon width={64} height={64} color={theme().colors.primary} />
      </div>

      {/* Title */}
      <h3
        style={{
          margin: '0 0 8px',
          'font-size': '24px',
          color: theme().colors.text,
          'font-family': theme().fonts.heading,
        }}
      >
        Mutating Your Resume...
      </h3>

      <p
        style={{
          margin: '0 0 32px',
          'font-size': '14px',
          color: theme().colors.textMuted,
        }}
      >
        This may take 15-30 seconds
      </p>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          'max-width': '400px',
          height: '8px',
          margin: '0 auto 16px',
          background: 'rgba(255, 255, 255, 0.1)',
          'border-radius': '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress()}%`,
            height: '100%',
            background: theme().gradients.primary,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Progress Percentage */}
      <div
        style={{
          'margin-bottom': '24px',
          'font-size': '18px',
          'font-weight': '700',
          color: theme().colors.text,
        }}
      >
        {progress()}%
      </div>

      {/* Current Step */}
      <div
        style={{
          'font-size': '14px',
          color: theme().colors.textMuted,
          'min-height': '20px',
        }}
      >
        {steps[currentStep()]}
      </div>

      {/* Steps Checklist */}
      <div
        style={{
          'margin-top': '32px',
          'text-align': 'left',
          'max-width': '400px',
          margin: '32px auto 0',
        }}
      >
        {steps.map((step, idx) => (
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '12px',
              padding: '8px 0',
              'font-size': '13px',
              color: idx <= currentStep() ? theme().colors.text : theme().colors.textMuted,
              opacity: idx <= currentStep() ? 1 : 0.5,
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                'border-radius': '50%',
                background:
                  idx < currentStep()
                    ? theme().colors.primary
                    : idx === currentStep()
                      ? theme().gradients.primary
                      : 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                'font-size': '12px',
                'flex-shrink': 0,
              }}
            >
              <Show when={idx < currentStep()}>
                <CheckIcon width={12} height={12} />
              </Show>
              <Show when={idx === currentStep()}>
                <CircleHalfIcon width={12} height={12} />
              </Show>
              <Show when={idx > currentStep()}>
                <CircleIcon width={12} height={12} />
              </Show>
            </div>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
