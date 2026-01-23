/**
 * PipelineView - Main container for Prospect with sidebar navigation
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show, createMemo, createEffect } from 'solid-js';
import { useLocation, useNavigate } from '@solidjs/router';
import { pipelineStore } from '../store';
import { liquidTenure, pipelineKeyframes } from '../theme/liquid-tenure';
import { ProspectSidebar, type ProspectSection } from './ProspectSidebar';
import { useMobile } from '../../lib/use-mobile';
import { MobileMenuProvider, MobileDrawer } from '../../lib/mobile-menu-context';
import { MobileHeader, MOBILE_HEADER_HEIGHT, BreadcrumbItem } from '../../lib/MobileHeader';
import { DashboardView } from './DashboardView';
import { PipelineDashboard } from './PipelineDashboard';
import { InsightsView } from './InsightsView';
import { SyncSettings } from './SyncSettings';
import { AddJobModal } from './AddJobModal';
import { ImportCSVModal } from './ImportCSVModal';
import { JobDetailSidebar } from './JobDetailSidebar';
import { JobApplication } from '../../../../schemas/pipeline.schema';
import { exportAndDownload } from '../utils/csv-export';
import {
  PROSPECT_NAV_ITEMS,
  IconHome,
  IconKanban,
  IconChart,
  IconSettingsNav,
} from './prospect-navigation';

// Breadcrumb items derived from nav items
const PROSPECT_BREADCRUMB_ITEMS: BreadcrumbItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: IconHome },
  { id: 'pipeline', label: 'Pipeline', icon: IconKanban },
  { id: 'insights', label: 'Insights', icon: IconChart },
  { id: 'settings', label: 'Settings', icon: IconSettingsNav },
];

interface PipelineViewProps {
  currentTheme?: () => Partial<typeof liquidTenure>;
}

export const PipelineView: Component<PipelineViewProps> = (props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMobile();

  // Determine active section from URL path
  const activeSection = createMemo((): ProspectSection => {
    const path = location.pathname;

    // Extract section from path like /tenure/prospect/dashboard
    const match = path.match(/\/tenure\/prospect\/([^/]+)/);
    if (match) {
      const section = match[1] as ProspectSection;
      // Validate it's a known section
      if (['dashboard', 'pipeline', 'insights', 'settings'].includes(section)) {
        return section;
      }
    }

    // Default to user's configured default or 'pipeline'
    const defaultSection = pipelineStore.state.settings.defaultProspectSection || 'pipeline';
    return defaultSection;
  });

  // Job detail state
  const [selectedJob, setSelectedJob] = createSignal<JobApplication | null>(null);

  // Modal state
  const [isAddJobModalOpen, setIsAddJobModalOpen] = createSignal(false);
  const [isImportModalOpen, setIsImportModalOpen] = createSignal(false);

  // Redirect to default section if on base /tenure/prospect path
  createEffect(() => {
    const path = location.pathname;
    if (path === '/tenure/prospect' || path === '/tenure/prospect/') {
      const defaultSection = pipelineStore.state.settings.defaultProspectSection || 'pipeline';
      navigate(`/tenure/prospect/${defaultSection}`, { replace: true });
    }
  });

  // Export CSV handler
  const handleExportCSV = () => {
    exportAndDownload(pipelineStore.state.applications);
  };

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

  // Merge provided theme with liquidTenure defaults
  const theme = () => {
    const provided = props.currentTheme?.() || {};
    return {
      ...liquidTenure,
      ...provided,
      colors: { ...liquidTenure.colors, ...(provided.colors || {}) },
      fonts: provided.fonts || liquidTenure.fonts,
      spacing: provided.spacing || liquidTenure.spacing,
      radii: { ...liquidTenure.radii, ...(provided.radii || {}) },
    } as typeof liquidTenure;
  };

  return (
    <MobileMenuProvider>
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
          onSectionChange={(section) => navigate(`/tenure/prospect/${section}`)}
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
            <div style={{ 'padding-top': isMobile() ? `${MOBILE_HEADER_HEIGHT}px` : '0' }}>
              {/* Mobile Header */}
              <MobileHeader
                title="Prospect"
                theme={theme}
                breadcrumbItems={PROSPECT_BREADCRUMB_ITEMS}
                activeBreadcrumb={activeSection()}
                onBreadcrumbSelect={(id) => navigate(`/tenure/prospect/${id}`)}
              />

              {/* Pipeline Header */}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  'flex-direction': isMobile() ? 'column' : 'row',
                  'align-items': isMobile() ? 'stretch' : 'center',
                  'justify-content': 'space-between',
                  padding: isMobile() ? '16px' : '24px 32px',
                  gap: isMobile() ? '16px' : '0',
                  'border-bottom': `1px solid ${theme().colors.border}`,
                  background: `linear-gradient(135deg, ${theme().colors.surface} 0%, ${theme().colors.primary}08 100%)`,
                  overflow: 'hidden',
                }}
              >
                {/* Subtle animated gradient backdrop */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `radial-gradient(ellipse at top right, ${theme().colors.primary}10 0%, transparent 50%)`,
                    opacity: 0.6,
                    'pointer-events': 'none',
                  }}
                />

                <div style={{ position: 'relative', 'z-index': 1 }}>
                  {/* Title with accent glow */}
                  <div
                    class="desktop-only"
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: '12px',
                      'margin-bottom': '12px',
                    }}
                  >
                    <h1
                      style={{
                        margin: 0,
                        'font-size': isMobile() ? '24px' : '32px',
                        'font-family': theme().fonts.heading,
                        'font-weight': '700',
                        color: theme().colors.text,
                        'text-shadow': `0 0 40px ${theme().colors.primary}40, 0 0 20px ${theme().colors.primary}20`,
                        'letter-spacing': '-0.02em',
                      }}
                    >
                      Job Pipeline
                    </h1>
                  </div>

                  {/* Metadata Cards - Sophisticated data presentation */}
                  {(() => {
                    const profile = pipelineStore.state.profile;
                    const appCount = pipelineStore.state.applications.length;

                    if (!profile?.name) {
                      return (
                        <p
                          style={{
                            margin: 0,
                            'font-size': '15px',
                            'font-family': theme().fonts.body,
                            color: theme().colors.textMuted,
                            'letter-spacing': '0.01em',
                          }}
                        >
                          Track your job applications
                        </p>
                      );
                    }

                    return (
                      <div
                        style={{
                          display: 'flex',
                          'align-items': 'center',
                          gap: '12px',
                          'flex-wrap': 'wrap',
                        }}
                      >
                        {/* Name Badge */}
                        <div
                          style={{
                            display: 'inline-flex',
                            'align-items': 'center',
                            gap: '8px',
                            padding: '6px 14px',
                            background: theme().colors.surfaceLight,
                            border: `1px solid ${theme().colors.border}`,
                            'border-radius': '8px',
                            'backdrop-filter': 'blur(8px)',
                          }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            style={{ color: theme().colors.primary, opacity: 0.8 }}
                          >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          <span
                            style={{
                              'font-size': '14px',
                              'font-family': theme().fonts.body,
                              'font-weight': '600',
                              color: theme().colors.text,
                              'letter-spacing': '0.01em',
                            }}
                          >
                            {profile.name}
                          </span>
                        </div>

                        {/* Occupation Badge - Primary Info (highlighted) */}
                        <Show when={profile.primaryOccupation}>
                          <div
                            style={{
                              display: 'inline-flex',
                              'align-items': 'center',
                              gap: '8px',
                              padding: '6px 14px',
                              background: `linear-gradient(135deg, ${theme().colors.primary}26 0%, ${theme().colors.secondary}26 100%)`,
                              border: `1px solid ${theme().colors.primary}4D`,
                              'border-radius': '8px',
                              'backdrop-filter': 'blur(8px)',
                              'box-shadow': `0 0 20px ${theme().colors.primary}26`,
                            }}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              style={{ color: theme().colors.primary, opacity: 0.9 }}
                            >
                              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                            </svg>
                            <span
                              style={{
                                'font-size': '14px',
                                'font-family': theme().fonts.body,
                                'font-weight': '600',
                                color: theme().colors.primary,
                                filter: 'brightness(1.2)',
                                'letter-spacing': '0.01em',
                              }}
                            >
                              {profile.primaryOccupation}
                            </span>
                          </div>
                        </Show>

                        {/* Application Count Badge - Info semantic color */}
                        <Show when={appCount > 0}>
                          <div
                            style={{
                              display: 'inline-flex',
                              'align-items': 'center',
                              gap: '8px',
                              padding: '6px 14px',
                              background: theme().colors.secondary
                                ? `${theme().colors.secondary}20`
                                : 'rgba(6, 182, 212, 0.12)',
                              border: `1px solid ${theme().colors.secondary ? `${theme().colors.secondary}40` : 'rgba(6, 182, 212, 0.25)'}`,
                              'border-radius': '8px',
                              'backdrop-filter': 'blur(8px)',
                            }}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              style={{ color: theme().colors.secondary, opacity: 0.9 }}
                            >
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            <span
                              style={{
                                'font-size': '14px',
                                'font-family': theme().fonts.body,
                                'font-weight': '700',
                                color: theme().colors.secondary,
                                'letter-spacing': '0.01em',
                              }}
                            >
                              {appCount}
                            </span>
                            <span
                              style={{
                                'font-size': '13px',
                                'font-family': theme().fonts.body,
                                'font-weight': '500',
                                color: theme().colors.secondary,
                                opacity: 0.7,
                                'letter-spacing': '0.01em',
                              }}
                            >
                              {appCount === 1 ? 'application' : 'applications'}
                            </span>
                          </div>
                        </Show>
                      </div>
                    );
                  })()}
                </div>

                {/* Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    'flex-wrap': isMobile() ? 'wrap' : 'nowrap',
                    width: isMobile() ? '100%' : 'auto',
                  }}
                >
                  {/* On mobile: show Import/Export in a collapsed state, prioritize Add Job */}
                  <Show when={!isMobile()}>
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
                      onClick={handleExportCSV}
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
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Export CSV
                    </button>
                  </Show>
                  <button
                    class="pipeline-btn"
                    onClick={() => setIsAddJobModalOpen(true)}
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      gap: '8px',
                      padding: isMobile() ? '14px 20px' : '10px 18px',
                      'min-height': isMobile() ? '48px' : 'auto',
                      flex: isMobile() ? '1' : 'initial',
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
              <div style={{ padding: isMobile() ? '12px' : '12px 16px' }}>
                <PipelineDashboard
                  currentTheme={theme}
                  onSelectJob={setSelectedJob}
                  selectedJob={selectedJob()}
                />
              </div>

              {/* Mobile Drawer for Pipeline section */}
              <MobileDrawer
                appName="Prospect"
                navItems={PROSPECT_NAV_ITEMS}
                currentSection="pipeline"
                onNavigate={(section: string) => navigate(`/tenure/prospect/${section}`)}
                basePath="/tenure/prospect"
                currentTenureApp="prospect"
                theme={theme}
              />
            </div>
          </Show>

          {/* Insights Section */}
          <Show when={activeSection() === 'insights'}>
            <InsightsView currentTheme={theme} onSelectJob={setSelectedJob} />
          </Show>

          {/* Settings Section */}
          <Show when={activeSection() === 'settings'}>
            <div
              style={{
                padding: '32px',
                'max-width': '1200px',
                'padding-top': isMobile() ? `${MOBILE_HEADER_HEIGHT + 16}px` : '32px',
              }}
            >
              <MobileHeader
                title="Prospect"
                theme={theme}
                breadcrumbItems={PROSPECT_BREADCRUMB_ITEMS}
                activeBreadcrumb={activeSection()}
                onBreadcrumbSelect={(id) => navigate(`/tenure/prospect/${id}`)}
              />
              <div style={{ 'margin-bottom': '32px' }}>
                <h1
                  class="desktop-only"
                  style={{
                    margin: '0 0 8px 0',
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

              {/* Mobile Drawer for Settings section */}
              <MobileDrawer
                appName="Prospect"
                navItems={PROSPECT_NAV_ITEMS}
                currentSection="settings"
                onNavigate={(section: string) => navigate(`/tenure/prospect/${section}`)}
                basePath="/tenure/prospect"
                currentTenureApp="prospect"
                theme={theme}
              />
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
    </MobileMenuProvider>
  );
};

export default PipelineView;
