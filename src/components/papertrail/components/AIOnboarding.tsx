/**
 * Paper Trail - AI Onboarding Banner
 * Gradual onboarding for AI entity extraction
 * Only shown when user first interacts with Graph tab
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show } from 'solid-js';
import { papertrail, yellowScale } from '../../../theme/papertrail';
import { Button } from '../ui/button';
import { ApiConfigService } from '../services/api-config.service';

const ONBOARDING_DISMISSED_KEY = 'papertrail-ai-onboarding-dismissed';

export interface AIOnboardingProps {
  onSetupAI: () => void;
}

export const AIOnboarding: Component<AIOnboardingProps> = (props) => {
  // Check if already dismissed
  const wasDismissed = localStorage.getItem(ONBOARDING_DISMISSED_KEY) === 'true';
  const isAIConfigured = ApiConfigService.isAIEnabled();

  // Don't show if already dismissed OR if AI is already configured
  const [isDismissed, setIsDismissed] = createSignal(wasDismissed || isAIConfigured);

  const handleDismiss = () => {
    localStorage.setItem(ONBOARDING_DISMISSED_KEY, 'true');
    setIsDismissed(true);
  };

  const handleSetup = () => {
    handleDismiss();
    props.onSetupAI();
  };

  return (
    <Show when={!isDismissed()}>
      <div
        style={{
          padding: '24px',
          background: yellowScale[50],
          border: `3px solid ${yellowScale[500]}`,
          'box-shadow': '4px 4px 0 rgba(0, 0, 0, 0.1)',
          'margin-bottom': '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '20px',
            'align-items': 'flex-start',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: '48px',
              height: '48px',
              background: yellowScale[500],
              border: '2px solid #000000',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'flex-shrink': 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#000000">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
          </div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            <h3
              style={{
                margin: '0 0 8px 0',
                'font-family': papertrail.fonts.heading,
                'font-size': '18px',
                'font-weight': 800,
                'text-transform': 'uppercase',
                'letter-spacing': '-0.01em',
                color: '#000000',
              }}
            >
              Enhance with AI Entity Extraction
            </h3>
            <p
              style={{
                margin: '0 0 16px 0',
                'font-size': '14px',
                'line-height': 1.6,
                color: papertrail.colors.text,
              }}
            >
              Right now, we're using simple keyword extraction to build entity graphs. Want smarter
              entity detection? Add your AI API key (Claude, OpenAI, Groq, or local Ollama) for
              better person, organization, and location recognition.
            </p>

            <div style={{ display: 'flex', gap: '12px', 'align-items': 'center' }}>
              <Button variant="primary" size="sm" onClick={handleSetup}>
                Set Up AI
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                Maybe Later
              </Button>
              <span
                style={{
                  'font-size': '12px',
                  color: papertrail.colors.textMuted,
                  'margin-left': 'auto',
                }}
              >
                Your API keys stay in your browser
              </span>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
};
