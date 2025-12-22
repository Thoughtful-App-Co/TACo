/**
 * PrepareApp - Main container for Resume Intelligence module
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show } from 'solid-js';
import { prepareStore } from './store';
import { ResumeUploader } from './components/ResumeUploader';

interface PrepareAppProps {
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

export const PrepareApp: Component<PrepareAppProps> = (props) => {
  const theme = () => props.currentTheme();

  const [viewMode, setViewMode] = createSignal<'wizard' | 'dashboard'>('wizard');

  const hasMasterResume = () => prepareStore.hasMasterResume();
  const masterResume = () => prepareStore.state.masterResume;
  const wizardState = () => prepareStore.state.wizardState;

  const handleParseComplete = () => {
    // Auto-advance to review step after successful parse
    prepareStore.setWizardStep('parse-review');
  };

  return (
    <div
      style={{
        padding: '32px',
        'max-width': '1200px',
        margin: '0 auto',
        'min-height': 'calc(100vh - 200px)',
      }}
    >
      {/* Header */}
      <div style={{ 'margin-bottom': '32px' }}>
        <h1
          style={{
            margin: '0 0 8px',
            'font-family': theme().fonts.heading,
            'font-size': '42px',
            'font-weight': '700',
            background: theme().gradients.primary,
            '-webkit-background-clip': 'text',
            '-webkit-text-fill-color': 'transparent',
            'background-clip': 'text',
          }}
        >
          Prepare: Resume Intelligence
        </h1>
        <p
          style={{
            margin: 0,
            'font-size': '18px',
            color: theme().colors.textMuted,
            'font-family': theme().fonts.body,
          }}
        >
          Upload your resume, build it from scratch, or tailor it to any job description with AI
        </p>
      </div>

      {/* View Mode Toggle */}
      <Show when={hasMasterResume()}>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            'margin-bottom': '32px',
            padding: '4px',
            background: 'rgba(255, 255, 255, 0.03)',
            'border-radius': '12px',
            border: `1px solid ${theme().colors.border}`,
            width: 'fit-content',
          }}
        >
          <button
            onClick={() => setViewMode('wizard')}
            style={{
              padding: '12px 24px',
              background: viewMode() === 'wizard' ? theme().gradients.primary : 'transparent',
              border: 'none',
              'border-radius': '8px',
              color:
                viewMode() === 'wizard' ? theme().colors.textOnPrimary : theme().colors.textMuted,
              cursor: 'pointer',
              'font-size': '14px',
              'font-weight': '600',
              'font-family': theme().fonts.body,
              transition: 'all 0.2s',
            }}
          >
            Resume Builder
          </button>
          <button
            onClick={() => setViewMode('dashboard')}
            style={{
              padding: '12px 24px',
              background: viewMode() === 'dashboard' ? theme().gradients.primary : 'transparent',
              border: 'none',
              'border-radius': '8px',
              color:
                viewMode() === 'dashboard'
                  ? theme().colors.textOnPrimary
                  : theme().colors.textMuted,
              cursor: 'pointer',
              'font-size': '14px',
              'font-weight': '600',
              'font-family': theme().fonts.body,
              transition: 'all 0.2s',
            }}
          >
            My Resumes
          </button>
        </div>
      </Show>

      {/* Main Content */}
      <Show
        when={viewMode() === 'wizard'}
        fallback={
          <div
            style={{
              padding: '48px',
              'text-align': 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${theme().colors.border}`,
              'border-radius': '16px',
            }}
          >
            <h3
              style={{
                margin: '0 0 16px',
                'font-size': '24px',
                color: theme().colors.text,
                'font-family': theme().fonts.heading,
              }}
            >
              Resume Dashboard
            </h3>
            <p style={{ margin: 0, color: theme().colors.textMuted }}>
              Coming soon: Manage resume variants, view analytics, and export your resumes
            </p>
          </div>
        }
      >
        {/* Wizard View */}
        <Show
          when={hasMasterResume()}
          fallback={
            <div>
              {/* Step 1: Upload */}
              <div
                style={{
                  'margin-bottom': '32px',
                  padding: '24px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${theme().colors.border}`,
                  'border-radius': '16px',
                }}
              >
                <h3
                  style={{
                    margin: '0 0 8px',
                    'font-size': '20px',
                    color: theme().colors.text,
                    'font-family': theme().fonts.heading,
                  }}
                >
                  Step 1: Upload Your Resume
                </h3>
                <p
                  style={{
                    margin: '0 0 24px',
                    'font-size': '14px',
                    color: theme().colors.textMuted,
                  }}
                >
                  Let AI parse your existing resume or paste the text directly
                </p>
                <ResumeUploader onParseComplete={handleParseComplete} currentTheme={theme} />
              </div>

              {/* Or Build from Scratch */}
              <div
                style={{
                  padding: '24px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${theme().colors.border}`,
                  'border-radius': '16px',
                  'text-align': 'center',
                }}
              >
                <h3
                  style={{
                    margin: '0 0 8px',
                    'font-size': '18px',
                    color: theme().colors.text,
                    'font-family': theme().fonts.heading,
                  }}
                >
                  Or Start from Scratch
                </h3>
                <p
                  style={{
                    margin: '0 0 16px',
                    'font-size': '14px',
                    color: theme().colors.textMuted,
                  }}
                >
                  Build your resume step-by-step with our guided wizard
                </p>
                <button
                  onClick={() => {
                    // Get userId from pipeline profile
                    const pipelineProfile = localStorage.getItem('augment_pipeline_profile');
                    const userId = pipelineProfile
                      ? JSON.parse(pipelineProfile).id
                      : crypto.randomUUID();
                    prepareStore.createMasterResume(userId);
                    prepareStore.setHasManualEntry(true);
                    prepareStore.setWizardStep('experience');
                  }}
                  style={{
                    padding: '12px 32px',
                    background: theme().gradients.primary,
                    border: 'none',
                    'border-radius': '10px',
                    color: theme().colors.textOnPrimary,
                    'font-size': '15px',
                    'font-weight': '600',
                    cursor: 'pointer',
                    'font-family': theme().fonts.body,
                  }}
                >
                  Start Building
                </button>
              </div>
            </div>
          }
        >
          {/* Post-upload: Resume parsed */}
          <div
            style={{
              padding: '32px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${theme().colors.border}`,
              'border-radius': '16px',
            }}
          >
            <h3
              style={{
                margin: '0 0 24px',
                'font-size': '24px',
                color: theme().colors.text,
                'font-family': theme().fonts.heading,
              }}
            >
              Resume Parsed Successfully!
            </h3>

            {/* Summary Stats */}
            <div
              style={{
                display: 'grid',
                'grid-template-columns': 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                'margin-bottom': '32px',
              }}
            >
              <div
                style={{
                  padding: '20px',
                  background: `${theme().colors.primary}10`,
                  border: `1px solid ${theme().colors.primary}40`,
                  'border-radius': '12px',
                }}
              >
                <div
                  style={{
                    'font-size': '32px',
                    'font-weight': '700',
                    color: theme().colors.primary,
                    'margin-bottom': '4px',
                  }}
                >
                  {masterResume()?.parsedSections.experience.length || 0}
                </div>
                <div style={{ 'font-size': '14px', color: theme().colors.textMuted }}>
                  Experiences
                </div>
              </div>

              <div
                style={{
                  padding: '20px',
                  background: `${theme().colors.secondary}10`,
                  border: `1px solid ${theme().colors.secondary}40`,
                  'border-radius': '12px',
                }}
              >
                <div
                  style={{
                    'font-size': '32px',
                    'font-weight': '700',
                    color: theme().colors.secondary,
                    'margin-bottom': '4px',
                  }}
                >
                  {masterResume()?.parsedSections.skills.length || 0}
                </div>
                <div style={{ 'font-size': '14px', color: theme().colors.textMuted }}>Skills</div>
              </div>

              <div
                style={{
                  padding: '20px',
                  background: `${theme().colors.success}10`,
                  border: `1px solid ${theme().colors.success}40`,
                  'border-radius': '12px',
                }}
              >
                <div
                  style={{
                    'font-size': '32px',
                    'font-weight': '700',
                    color: theme().colors.success,
                    'margin-bottom': '4px',
                  }}
                >
                  {masterResume()?.extractedKeywords.technical.length || 0}
                </div>
                <div style={{ 'font-size': '14px', color: theme().colors.textMuted }}>Keywords</div>
              </div>
            </div>

            {/* Next Steps */}
            <div>
              <h4
                style={{
                  margin: '0 0 16px',
                  'font-size': '18px',
                  color: theme().colors.text,
                  'font-family': theme().fonts.heading,
                }}
              >
                What's Next?
              </h4>
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
                <button
                  style={{
                    padding: '16px 24px',
                    background: theme().gradients.primary,
                    border: 'none',
                    'border-radius': '10px',
                    color: theme().colors.textOnPrimary,
                    'font-size': '15px',
                    'font-weight': '600',
                    cursor: 'pointer',
                    'text-align': 'left',
                    'font-family': theme().fonts.body,
                  }}
                >
                  → Review & Edit Experiences
                </button>
                <button
                  style={{
                    padding: '16px 24px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${theme().colors.border}`,
                    'border-radius': '10px',
                    color: theme().colors.text,
                    'font-size': '15px',
                    'font-weight': '600',
                    cursor: 'pointer',
                    'text-align': 'left',
                    'font-family': theme().fonts.body,
                  }}
                >
                  → Add Projects & Metrics
                </button>
                <button
                  style={{
                    padding: '16px 24px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${theme().colors.border}`,
                    'border-radius': '10px',
                    color: theme().colors.text,
                    'font-size': '15px',
                    'font-weight': '600',
                    cursor: 'pointer',
                    'text-align': 'left',
                    'font-family': theme().fonts.body,
                  }}
                >
                  → Tailor to Job Description
                </button>
              </div>
            </div>
          </div>
        </Show>
      </Show>

      {/* Debug Info (dev only) */}
      <Show when={import.meta.env.DEV}>
        <div
          style={{
            'margin-top': '32px',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${theme().colors.border}`,
            'border-radius': '8px',
            'font-family': 'monospace',
            'font-size': '12px',
            color: theme().colors.textMuted,
          }}
        >
          <div>Has Master Resume: {hasMasterResume() ? 'Yes' : 'No'}</div>
          <div>Wizard Step: {wizardState().currentStep}</div>
          <div>Upload Progress: {prepareStore.state.uploadProgress}%</div>
          <div>Parse Progress: {prepareStore.state.parseProgress}%</div>
        </div>
      </Show>
    </div>
  );
};

export default PrepareApp;
