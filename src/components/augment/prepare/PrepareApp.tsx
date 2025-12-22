/**
 * PrepareApp - Main container for Resume Intelligence module
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show } from 'solid-js';
import { prepareStore } from './store';
import { ResumeUploader } from './components/ResumeUploader';
import { ParseReviewPanel } from './components/ParseReviewPanel';
import { ExperienceEditor } from './components/ExperienceEditor';
import { EducationEditor } from './components/EducationEditor';
import { WorkExperience, Education } from '../../../schemas/pipeline.schema';
import { IconTrash } from '../pipeline/ui/Icons';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);

  // Modal state signals
  const [showExperienceEditor, setShowExperienceEditor] = createSignal(false);
  const [showEducationEditor, setShowEducationEditor] = createSignal(false);
  const [editingExperience, setEditingExperience] = createSignal<WorkExperience | undefined>();
  const [editingEducation, setEditingEducation] = createSignal<Education | undefined>();

  const hasMasterResume = () => prepareStore.hasMasterResume();
  const masterResume = () => prepareStore.state.masterResume;
  const wizardState = () => prepareStore.state.wizardState;

  const handleParseComplete = () => {
    // Auto-advance to review step after successful parse
    prepareStore.setWizardStep('parse-review');
  };

  const handleDeleteResume = () => {
    prepareStore.resetAll();
    setShowDeleteConfirm(false);
  };

  // Experience handlers
  const handleAddExperience = () => {
    setEditingExperience(undefined);
    setShowExperienceEditor(true);
  };

  const handleEditExperience = (exp: WorkExperience) => {
    setEditingExperience(exp);
    setShowExperienceEditor(true);
  };

  const handleDeleteExperience = (id: string) => {
    prepareStore.removeExperience(id);
  };

  const handleSaveExperience = (exp: Omit<WorkExperience, 'id'>) => {
    if (editingExperience()) {
      prepareStore.updateExperience(editingExperience()!.id, exp);
    } else {
      prepareStore.addExperience(exp);
    }
    setShowExperienceEditor(false);
  };

  // Education handlers
  const handleAddEducation = () => {
    setEditingEducation(undefined);
    setShowEducationEditor(true);
  };

  const handleEditEducation = (edu: Education) => {
    setEditingEducation(edu);
    setShowEducationEditor(true);
  };

  const handleDeleteEducation = (id: string) => {
    prepareStore.removeEducation(id);
  };

  const handleSaveEducation = (edu: Omit<Education, 'id'>) => {
    if (editingEducation()) {
      prepareStore.updateEducation(editingEducation()!.id, edu);
    } else {
      prepareStore.addEducation(edu);
    }
    setShowEducationEditor(false);
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
      {/* View Mode Toggle & Delete Button */}
      <Show when={hasMasterResume()}>
        <div
          style={{
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'center',
            'margin-bottom': '32px',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '12px',
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

          {/* Delete Resume Button */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              padding: '12px 20px',
              background: `${theme().colors.error}20`,
              border: `1px solid ${theme().colors.error}`,
              'border-radius': '10px',
              color: theme().colors.error,
              cursor: 'pointer',
              'font-size': '14px',
              'font-weight': '600',
              'font-family': theme().fonts.body,
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${theme().colors.error}30`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${theme().colors.error}20`;
            }}
          >
            <IconTrash size={16} />
            Delete Resume
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
          {/* Post-upload: Review parsed data */}
          <ParseReviewPanel
            currentTheme={theme}
            onContinue={() => prepareStore.setWizardStep('experience')}
            onAddExperience={handleAddExperience}
            onEditExperience={handleEditExperience}
            onDeleteExperience={handleDeleteExperience}
            onAddEducation={handleAddEducation}
            onEditEducation={handleEditEducation}
            onDeleteEducation={handleDeleteEducation}
          />
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

      {/* Delete Confirmation Modal */}
      <Show when={showDeleteConfirm()}>
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'z-index': 1000,
            padding: '20px',
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{
              background: theme().colors.background,
              border: `2px solid ${theme().colors.error}`,
              'border-radius': '16px',
              padding: '32px',
              'max-width': '500px',
              width: '100%',
              'box-shadow': '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '12px',
                'margin-bottom': '16px',
              }}
            >
              <IconTrash size={24} color={theme().colors.error} />
              <h3
                style={{
                  margin: 0,
                  'font-size': '24px',
                  color: theme().colors.error,
                  'font-family': theme().fonts.heading,
                }}
              >
                Delete Resume?
              </h3>
            </div>

            <p
              style={{
                margin: '0 0 24px',
                'font-size': '16px',
                color: theme().colors.text,
                'line-height': '1.6',
              }}
            >
              This will permanently delete your master resume, all variants, and reset the wizard.
              This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px', 'justify-content': 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${theme().colors.border}`,
                  'border-radius': '10px',
                  color: theme().colors.text,
                  'font-size': '15px',
                  'font-weight': '600',
                  cursor: 'pointer',
                  'font-family': theme().fonts.body,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteResume}
                style={{
                  padding: '12px 24px',
                  background: theme().colors.error,
                  border: 'none',
                  'border-radius': '10px',
                  color: '#FFFFFF',
                  'font-size': '15px',
                  'font-weight': '600',
                  cursor: 'pointer',
                  'font-family': theme().fonts.body,
                }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Experience Editor Modal */}
      <ExperienceEditor
        isOpen={showExperienceEditor()}
        onClose={() => setShowExperienceEditor(false)}
        currentTheme={theme}
        experience={editingExperience()}
        onSave={handleSaveExperience}
      />

      {/* Education Editor Modal */}
      <EducationEditor
        isOpen={showEducationEditor()}
        onClose={() => setShowEducationEditor(false)}
        currentTheme={theme}
        education={editingEducation()}
        onSave={handleSaveEducation}
      />
    </div>
  );
};

export default PrepareApp;
