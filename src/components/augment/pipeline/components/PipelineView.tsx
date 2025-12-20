/**
 * PipelineView - Main container for the job application pipeline
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal } from 'solid-js';
import { pipelineStore } from '../store';
import { liquidAugment, pipelineKeyframes } from '../theme/liquid-augment';
import { PipelineDashboard } from './PipelineDashboard';
import { AddJobModal } from './AddJobModal';
import { JobDetailSidebar } from './JobDetailSidebar';
import { JobApplication } from '../../../../schemas/pipeline.schema';
import { IconPipeline, IconPlus } from '../ui/Icons';

interface PipelineViewProps {
  currentTheme?: () => Partial<typeof liquidAugment>;
}

export const PipelineView: Component<PipelineViewProps> = (props) => {
  const [selectedJob, setSelectedJob] = createSignal<JobApplication | null>(null);
  const [isAddJobModalOpen, setIsAddJobModalOpen] = createSignal(false);

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

  const applicationCount = () => pipelineStore.state.applications.length;

  return (
    <div
      style={{
        'min-height': '100%',
        background: theme().colors.background,
        color: theme().colors.text,
        'font-family': theme().fonts.body,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          padding: '24px 32px',
          'border-bottom': `1px solid ${theme().colors.border}`,
        }}
      >
        {/* Left side - Title */}
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: '12px',
          }}
        >
          <IconPipeline size={28} color={theme().colors.primary} />
          <div>
            <h2
              style={{
                margin: 0,
                'font-size': '24px',
                'font-family': "'Playfair Display', Georgia, serif",
                'font-weight': '600',
                color: theme().colors.text,
              }}
            >
              Prospect
            </h2>
            <p
              style={{
                margin: '2px 0 0',
                color: theme().colors.textMuted,
                'font-size': '13px',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
              }}
            >
              {applicationCount() > 0
                ? `${applicationCount()} application${applicationCount() !== 1 ? 's' : ''}`
                : 'Track your job applications'}
            </p>
          </div>
        </div>

        {/* Right side - Add Job Button */}
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
          <IconPlus size={16} />
          Add Job
        </button>
      </div>

      {/* Content - Dashboard */}
      <div style={{ padding: '24px 32px' }}>
        <PipelineDashboard
          currentTheme={theme}
          onSelectJob={setSelectedJob}
          selectedJob={selectedJob()}
        />
      </div>

      {/* Add Job Modal */}
      <AddJobModal
        isOpen={isAddJobModalOpen()}
        onClose={() => setIsAddJobModalOpen(false)}
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
