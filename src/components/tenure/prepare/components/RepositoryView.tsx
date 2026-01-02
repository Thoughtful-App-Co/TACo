/**
 * RepositoryView - Resume Repository Dashboard
 *
 * Displays master resume and all variants with management actions.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show, For, createSignal } from 'solid-js';
import { prepareStore } from '../store';
import { MasterResumeCard } from './MasterResumeCard';
import { ResumeVariantCard } from './ResumeVariantCard';
import { ResumeVariant } from '../../../../schemas/prepare.schema';
import { IconPlus } from '../../pipeline/ui/Icons';

interface RepositoryViewProps {
  onEditMaster: () => void;
  onWizardFromMaster: () => void;
  onWizardFromVariant: (variant: ResumeVariant) => void;
  onEditVariant: (variant: ResumeVariant) => void;
  onExport: (item: 'master' | ResumeVariant) => void;
  currentTheme: () => any;
}

export const RepositoryView: Component<RepositoryViewProps> = (props) => {
  const theme = () => props.currentTheme();
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal<string | null>(null);

  const masterResume = () => prepareStore.state.masterResume;
  const variants = () => prepareStore.state.variants;

  const handleDeleteVariant = (id: string) => {
    prepareStore.deleteVariant(id);
    setShowDeleteConfirm(null);
  };

  const handleExportMaster = () => {
    props.onExport('master');
  };

  const handleExportVariant = (variant: ResumeVariant) => {
    props.onExport(variant);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ 'margin-bottom': '32px' }}>
        <h2
          style={{
            margin: '0 0 8px',
            'font-size': '28px',
            color: theme().colors.text,
            'font-family': theme().fonts.heading,
          }}
        >
          Resume Repository
        </h2>
        <p
          style={{
            margin: 0,
            'font-size': '16px',
            color: theme().colors.textMuted,
          }}
        >
          Manage your master resume and all tailored variants
        </p>
      </div>

      {/* Master Resume Section */}
      <div style={{ 'margin-bottom': '40px' }}>
        <h3
          style={{
            margin: '0 0 16px',
            'font-size': '18px',
            color: theme().colors.text,
            'font-family': theme().fonts.heading,
            'font-weight': '600',
          }}
        >
          Master Resume
        </h3>
        <Show
          when={masterResume()}
          fallback={
            <div
              style={{
                padding: '48px',
                'text-align': 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                border: `1px dashed ${theme().colors.border}`,
                'border-radius': '12px',
              }}
            >
              <p style={{ margin: 0, color: theme().colors.textMuted }}>
                No master resume found. Please create one in the Resume Builder.
              </p>
            </div>
          }
        >
          <MasterResumeCard
            resume={masterResume()!}
            onEdit={props.onEditMaster}
            onWizard={props.onWizardFromMaster}
            onExport={handleExportMaster}
            currentTheme={theme}
          />
        </Show>
      </div>

      {/* Variants Section */}
      <div>
        <div
          style={{
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'center',
            'margin-bottom': '16px',
          }}
        >
          <h3
            style={{
              margin: 0,
              'font-size': '18px',
              color: theme().colors.text,
              'font-family': theme().fonts.heading,
              'font-weight': '600',
            }}
          >
            Resume Variants ({variants().length})
          </h3>
          <button
            onClick={props.onWizardFromMaster}
            style={{
              padding: '10px 20px',
              background: theme().gradients.primary,
              border: 'none',
              'border-radius': '8px',
              color: theme().colors.textOnPrimary,
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
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <IconPlus size={16} />
            Create New Variant
          </button>
        </div>

        <Show
          when={variants().length > 0}
          fallback={
            <div
              style={{
                padding: '48px',
                'text-align': 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                border: `1px dashed ${theme().colors.border}`,
                'border-radius': '12px',
              }}
            >
              <p
                style={{
                  margin: '0 0 16px',
                  'font-size': '16px',
                  color: theme().colors.text,
                }}
              >
                No resume variants yet
              </p>
              <p
                style={{
                  margin: '0 0 24px',
                  'font-size': '14px',
                  color: theme().colors.textMuted,
                }}
              >
                Use the Resume Wizard to create tailored versions of your resume for specific jobs
              </p>
              <button
                onClick={props.onWizardFromMaster}
                style={{
                  padding: '12px 24px',
                  background: theme().gradients.primary,
                  border: 'none',
                  'border-radius': '10px',
                  color: theme().colors.textOnPrimary,
                  cursor: 'pointer',
                  'font-size': '15px',
                  'font-weight': '600',
                  'font-family': theme().fonts.body,
                }}
              >
                Create Your First Variant
              </button>
            </div>
          }
        >
          <div
            style={{
              display: 'grid',
              'grid-template-columns': 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '20px',
            }}
          >
            <For each={variants()}>
              {(variant) => (
                <ResumeVariantCard
                  variant={variant}
                  onEdit={props.onEditVariant}
                  onDelete={(id) => setShowDeleteConfirm(id)}
                  onWizard={() => props.onWizardFromVariant(variant)}
                  onExport={() => handleExportVariant(variant)}
                  currentTheme={theme}
                />
              )}
            </For>
          </div>
        </Show>
      </div>

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
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            style={{
              background: theme().colors.background,
              border: `2px solid ${theme().colors.error}`,
              'border-radius': '16px',
              padding: '32px',
              'max-width': '450px',
              width: '100%',
              'box-shadow': '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: '0 0 12px',
                'font-size': '22px',
                color: theme().colors.error,
                'font-family': theme().fonts.heading,
              }}
            >
              Delete Variant?
            </h3>
            <p
              style={{
                margin: '0 0 24px',
                'font-size': '15px',
                color: theme().colors.text,
                'line-height': '1.6',
              }}
            >
              This will permanently delete this resume variant. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', 'justify-content': 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${theme().colors.border}`,
                  'border-radius': '8px',
                  color: theme().colors.text,
                  'font-size': '14px',
                  'font-weight': '600',
                  cursor: 'pointer',
                  'font-family': theme().fonts.body,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteVariant(showDeleteConfirm()!)}
                style={{
                  padding: '10px 20px',
                  background: theme().colors.error,
                  border: 'none',
                  'border-radius': '8px',
                  color: '#FFFFFF',
                  'font-size': '14px',
                  'font-weight': '600',
                  cursor: 'pointer',
                  'font-family': theme().fonts.body,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};
