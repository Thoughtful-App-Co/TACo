/**
 * PipelineView - Main container for Prospect with sidebar navigation
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show } from 'solid-js';
import { pipelineStore } from '../store';
import { liquidAugment, pipelineKeyframes } from '../theme/liquid-augment';
import { ProspectSidebar, type ProspectSection } from './ProspectSidebar';
import { DashboardView } from './DashboardView';
import { PipelineDashboard } from './PipelineDashboard';
import { InsightsView } from './InsightsView';
import { SyncSettings } from './SyncSettings';
import { AddJobModal } from './AddJobModal';
import { ImportCSVModal } from './ImportCSVModal';
import { JobDetailSidebar } from './JobDetailSidebar';
import { JobApplication } from '../../../../schemas/pipeline.schema';

interface PipelineViewProps {
  currentTheme?: () => Partial<typeof liquidAugment>;
}

export const PipelineView: Component<PipelineViewProps> = (props) => {
  // Section navigation - default to pipeline (not dashboard)
  const [activeSection, setActiveSection] = createSignal<ProspectSection>('pipeline');

  // Job detail state
  const [selectedJob, setSelectedJob] = createSignal<JobApplication | null>(null);

  // Modal state
  const [isAddJobModalOpen, setIsAddJobModalOpen] = createSignal(false);
  const [isImportModalOpen, setIsImportModalOpen] = createSignal(false);

  // Inject keyframes on mount
  if (typeof document !== 'undefined') {
    const styleId = 'pipeline-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = pipelineKeyframes;
      document.head.appendChild(style);
    }
  }

  // Merge provided theme with liquidAugment defaults
  const theme = () => {
    const provided = props.currentTheme?.() || {};
    return {
      ...liquidAugment,
      ...provided,
      colors: { ...liquidAugment.colors, ...(provided.colors || {}) },
      fonts: provided.fonts || liquidAugment.fonts,
      spacing: provided.spacing || liquidAugment.spacing,
      radii: { ...liquidAugment.radii, ...(provided.radii || {}) },
    } as typeof liquidAugment;
  };

  return (
    <div
      style={{
        display: 'flex',
        'min-height': '100vh',
        background: theme().colors.background,
        color: theme().colors.text,
        'font-family': theme().fonts.body,
      }}
    >
      {/* Left Sidebar Navigation */}
      <ProspectSidebar
        activeSection={activeSection()}
        onSectionChange={setActiveSection}
        currentTheme={theme}
      />

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          'min-width': 0, // Prevent flex overflow
          overflow: 'auto',
          background: theme().colors.background,
        }}
      >
        {/* Dashboard Section */}
        <Show when={activeSection() === 'dashboard'}>
          <DashboardView
            currentTheme={theme}
            onSelectJob={setSelectedJob}
            onAddJob={() => setIsAddJobModalOpen(true)}
            onImportCSV={() => setIsImportModalOpen(true)}
          />
        </Show>

        {/* Pipeline Section */}
        <Show when={activeSection() === 'pipeline'}>
          <div>
            {/* Pipeline Header */}
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'space-between',
                padding: '16px 24px',
                'border-bottom': `1px solid ${theme().colors.border}`,
                background: theme().colors.surface,
              }}
            >
              <div>
                <h1
                  style={{
                    margin: '0 0 4px',
                    'font-size': '28px',
                    'font-family': "'Playfair Display', Georgia, serif",
                    'font-weight': '700',
                    color: theme().colors.text,
                  }}
                >
                  Pipeline
                </h1>
                <p
                  style={{
                    margin: 0,
                    'font-size': '14px',
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                    color: theme().colors.textMuted,
                  }}
                >
                  {pipelineStore.state.applications.length > 0
                    ? `${pipelineStore.state.applications.length} application${pipelineStore.state.applications.length !== 1 ? 's' : ''}`
                    : 'Track your job applications'}
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  class="pipeline-btn"
                  onClick={() => setIsImportModalOpen(true)}
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    background: 'transparent',
                    border: `1px solid ${theme().colors.border}`,
                    'border-radius': '10px',
                    color: theme().colors.text,
                    'font-size': '14px',
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                    'font-weight': '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Import CSV
                </button>
                <button
                  class="pipeline-btn"
                  onClick={() => setIsAddJobModalOpen(true)}
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    background: theme().colors.primary,
                    border: 'none',
                    'border-radius': '10px',
                    color: theme().colors.background,
                    'font-size': '14px',
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                    'font-weight': '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Job
                </button>
              </div>
            </div>

            {/* Pipeline Content */}
            <div style={{ padding: '12px 16px' }}>
              <PipelineDashboard
                currentTheme={theme}
                onSelectJob={setSelectedJob}
                selectedJob={selectedJob()}
              />
            </div>
          </div>
        </Show>

        {/* Insights Section */}
        <Show when={activeSection() === 'insights'}>
          <InsightsView currentTheme={theme} onSelectJob={setSelectedJob} />
        </Show>

        {/* Settings Section */}
        <Show when={activeSection() === 'settings'}>
          <div style={{ padding: '32px', 'max-width': '1200px' }}>
            <div style={{ 'margin-bottom': '32px' }}>
              <h1
                style={{
                  margin: '0 0 8px',
                  'font-size': '32px',
                  'font-family': "'Playfair Display', Georgia, serif",
                  'font-weight': '700',
                  color: theme().colors.text,
                }}
              >
                Settings
              </h1>
              <p
                style={{
                  margin: 0,
                  'font-size': '15px',
                  'font-family': "'Space Grotesk', system-ui, sans-serif",
                  color: theme().colors.textMuted,
                }}
              >
                Manage your criteria, sync preferences, and tool settings
              </p>
            </div>
            <SyncSettings currentTheme={theme} />
          </div>
        </Show>
      </div>

      {/* Modals */}
      <AddJobModal
        isOpen={isAddJobModalOpen()}
        onClose={() => setIsAddJobModalOpen(false)}
        currentTheme={theme}
      />

      <ImportCSVModal
        isOpen={isImportModalOpen()}
        onClose={() => setIsImportModalOpen(false)}
        currentTheme={theme}
      />

      {/* Job Detail Sidebar */}
      <JobDetailSidebar
        job={selectedJob()}
        onClose={() => setSelectedJob(null)}
        currentTheme={theme}
      />
    </div>
  );
};

export default PipelineView;
