/**
 * ParseReviewPanel - Orchestrator component for reviewing parsed resume data
 *
 * Provides tabbed interface for reviewing and editing parsed resume sections:
 * - Experience: Work history with titles, companies, and dates
 * - Education: Degrees, institutions, and certifications
 * - Skills: Technical and soft skills extracted from resume
 * - Summary: Professional summary/objective statement
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show, For, JSX } from 'solid-js';
import { FluidCard } from '../../pipeline/ui/FluidCard';
import { IconBriefcase, IconFileText, IconZap, IconUser, IconPlus } from '../../pipeline/ui/Icons';
import { prepareStore } from '../store';
import { ExperienceViewer } from './ExperienceViewer';
import { EducationViewer } from './EducationViewer';
import { SkillsViewer } from './SkillsViewer';
import { WorkExperience, Education } from '../../../../schemas/pipeline.schema';
import type { Theme } from '../../../../theme/types';

// ============================================================================
// TYPES
// ============================================================================

type TabId = 'experience' | 'education' | 'skills' | 'summary';

interface TabConfig {
  id: TabId;
  label: string;
  icon: Component<{ size?: number; color?: string }>;
}

// Extended theme type that includes the extra properties PrepareApp provides
export type ExtendedTheme = Theme & {
  colors: Theme['colors'] & {
    textOnPrimary: string;
    success: string;
    error: string;
  };
  gradients: {
    primary: string;
  };
};

interface ParseReviewPanelProps {
  currentTheme: () => ExtendedTheme;
  onContinue?: () => void;

  // Experience handlers
  onAddExperience: () => void;
  onEditExperience: (exp: WorkExperience) => void;
  onDeleteExperience: (id: string) => void;
  onReorderExperiences?: (ids: string[]) => void;

  // Education handlers
  onAddEducation: () => void;
  onEditEducation: (edu: Education) => void;
  onDeleteEducation: (id: string) => void;
  onReorderEducation?: (ids: string[]) => void;
}

// ============================================================================
// TAB CONFIGURATION
// ============================================================================

const TABS: TabConfig[] = [
  { id: 'experience', label: 'Experience', icon: IconBriefcase },
  { id: 'education', label: 'Education', icon: IconFileText },
  { id: 'skills', label: 'Skills', icon: IconZap },
  { id: 'summary', label: 'Summary', icon: IconUser },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const ParseReviewPanel: Component<ParseReviewPanelProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal<TabId>('experience');

  // ---------------------------------------------------------------------------
  // DATA ACCESSORS
  // ---------------------------------------------------------------------------

  const parsedSections = () => prepareStore.state.masterResume?.parsedSections;

  const getTabCount = (tabId: TabId): number => {
    const sections = parsedSections();
    if (!sections) return 0;

    switch (tabId) {
      case 'experience':
        return sections.experience?.length ?? 0;
      case 'education':
        return sections.education?.length ?? 0;
      case 'skills':
        return sections.skills?.length ?? 0;
      case 'summary':
        return sections.summary ? 1 : 0;
      default:
        return 0;
    }
  };

  // ---------------------------------------------------------------------------
  // STYLES
  // ---------------------------------------------------------------------------

  const containerStyle = (): JSX.CSSProperties => ({
    display: 'flex',
    'flex-direction': 'column',
    gap: '24px',
    width: '100%',
  });

  const tabBarStyle = (): JSX.CSSProperties => ({
    display: 'flex',
    gap: '8px',
    padding: '6px',
    background: 'rgba(255, 255, 255, 0.03)',
    'border-radius': '16px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  });

  const tabStyle = (isActive: boolean): JSX.CSSProperties => ({
    display: 'flex',
    'align-items': 'center',
    gap: '8px',
    padding: '12px 20px',
    'border-radius': '12px',
    border: 'none',
    background: isActive
      ? `linear-gradient(135deg, ${props.currentTheme().colors.primary}25, ${props.currentTheme().colors.primary}15)`
      : 'transparent',
    color: isActive ? props.currentTheme().colors.primary : props.currentTheme().colors.textMuted,
    'font-family': props.currentTheme().fonts.body,
    'font-size': '14px',
    'font-weight': isActive ? '600' : '500',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    'box-shadow': isActive ? `0 0 20px ${props.currentTheme().colors.primary}20` : 'none',
  });

  const badgeStyle = (isActive: boolean): JSX.CSSProperties => ({
    display: 'inline-flex',
    'align-items': 'center',
    'justify-content': 'center',
    'min-width': '22px',
    height: '22px',
    padding: '0 6px',
    'border-radius': '11px',
    background: isActive ? props.currentTheme().colors.primary : 'rgba(255, 255, 255, 0.1)',
    color: isActive
      ? props.currentTheme().colors.textOnPrimary
      : props.currentTheme().colors.textMuted,
    'font-size': '12px',
    'font-weight': '600',
  });

  const contentAreaStyle = (): JSX.CSSProperties => ({
    'min-height': '400px',
  });

  const sectionHeaderStyle = (): JSX.CSSProperties => ({
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'space-between',
    'margin-bottom': '20px',
  });

  const headingStyle = (): JSX.CSSProperties => ({
    'font-family': props.currentTheme().fonts.heading,
    'font-size': '20px',
    'font-weight': '600',
    color: props.currentTheme().colors.text,
    margin: '0',
  });

  const itemCountStyle = (): JSX.CSSProperties => ({
    'font-size': '14px',
    color: props.currentTheme().colors.textMuted,
  });

  const listStyle = (): JSX.CSSProperties => ({
    display: 'flex',
    'flex-direction': 'column',
    gap: '12px',
    'margin-bottom': '20px',
  });

  const listItemStyle = (): JSX.CSSProperties => ({
    display: 'flex',
    'align-items': 'center',
    gap: '12px',
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.03)',
    'border-radius': '12px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    transition: 'all 0.2s ease',
  });

  const listItemTitleStyle = (): JSX.CSSProperties => ({
    'font-size': '15px',
    'font-weight': '500',
    color: props.currentTheme().colors.text,
    margin: '0',
  });

  const listItemSubtitleStyle = (): JSX.CSSProperties => ({
    'font-size': '13px',
    color: props.currentTheme().colors.textMuted,
    margin: '4px 0 0 0',
  });

  const skillTagStyle = (): JSX.CSSProperties => ({
    display: 'inline-flex',
    padding: '8px 14px',
    background: 'rgba(255, 255, 255, 0.05)',
    'border-radius': '20px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    'font-size': '13px',
    color: props.currentTheme().colors.text,
  });

  const skillsContainerStyle = (): JSX.CSSProperties => ({
    display: 'flex',
    'flex-wrap': 'wrap',
    gap: '8px',
    'margin-bottom': '20px',
  });

  const summaryTextStyle = (): JSX.CSSProperties => ({
    'font-size': '15px',
    'line-height': '1.7',
    color: props.currentTheme().colors.text,
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '20px',
    'border-radius': '12px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    'margin-bottom': '20px',
  });

  const emptyStateStyle = (): JSX.CSSProperties => ({
    display: 'flex',
    'flex-direction': 'column',
    'align-items': 'center',
    'justify-content': 'center',
    padding: '60px 20px',
    color: props.currentTheme().colors.textMuted,
    'text-align': 'center',
  });

  const addButtonStyle = (): JSX.CSSProperties => ({
    display: 'flex',
    'align-items': 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'transparent',
    border: `1px dashed ${props.currentTheme().colors.border}`,
    'border-radius': '12px',
    color: props.currentTheme().colors.textMuted,
    'font-size': '14px',
    'font-weight': '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%',
    'justify-content': 'center',
  });

  // ---------------------------------------------------------------------------
  // RENDER HELPERS
  // ---------------------------------------------------------------------------

  const renderExperienceTab = () => {
    const experiences = parsedSections()?.experience ?? [];
    return (
      <ExperienceViewer
        experiences={experiences}
        currentTheme={props.currentTheme}
        onEdit={props.onEditExperience}
        onDelete={props.onDeleteExperience}
        onAdd={props.onAddExperience}
        onReorder={props.onReorderExperiences}
      />
    );
  };

  const renderEducationTab = () => {
    const education = parsedSections()?.education ?? [];
    return (
      <EducationViewer
        education={education}
        currentTheme={props.currentTheme}
        onEdit={props.onEditEducation}
        onDelete={props.onDeleteEducation}
        onAdd={props.onAddEducation}
        onReorder={props.onReorderEducation}
      />
    );
  };

  const renderSkillsTab = () => {
    const skills = parsedSections()?.skills ?? [];
    return <SkillsViewer skills={skills} currentTheme={props.currentTheme} />;
  };

  const renderSummaryTab = () => {
    const summary = parsedSections()?.summary;

    return (
      <div>
        <div style={sectionHeaderStyle()}>
          <h3 style={headingStyle()}>Professional Summary</h3>
          <span style={itemCountStyle()}>{summary ? '1 summary' : 'No summary'}</span>
        </div>

        <Show
          when={summary}
          fallback={
            <div style={emptyStateStyle()}>
              <IconUser size={48} color={props.currentTheme().colors.textMuted} />
              <p style={{ margin: '16px 0 0 0' }}>No summary found</p>
              <p style={{ margin: '8px 0 0 0', 'font-size': '13px' }}>
                Add a professional summary to highlight your qualifications
              </p>
            </div>
          }
        >
          <div style={summaryTextStyle()}>{summary}</div>
        </Show>

        <button style={addButtonStyle()} class="pipeline-btn">
          <IconPlus size={18} />
          {summary ? 'Edit Summary' : 'Add Summary'}
        </button>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab()) {
      case 'experience':
        return renderExperienceTab();
      case 'education':
        return renderEducationTab();
      case 'skills':
        return renderSkillsTab();
      case 'summary':
        return renderSummaryTab();
      default:
        return null;
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div style={containerStyle()}>
      {/* Tab Navigation */}
      <div style={tabBarStyle()}>
        <For each={TABS}>
          {(tab) => {
            const isActive = () => activeTab() === tab.id;
            const count = () => getTabCount(tab.id);
            const TabIcon = tab.icon;

            return (
              <button
                style={tabStyle(isActive())}
                onClick={() => setActiveTab(tab.id)}
                class="pipeline-tab"
              >
                <TabIcon
                  size={18}
                  color={
                    isActive()
                      ? props.currentTheme().colors.primary
                      : props.currentTheme().colors.textMuted
                  }
                />
                <span>{tab.label}</span>
                <span style={badgeStyle(isActive())}>{count()}</span>
              </button>
            );
          }}
        </For>
      </div>

      {/* Content Area */}
      <FluidCard style={{ padding: '24px' }}>
        <div style={contentAreaStyle()}>{renderTabContent()}</div>
      </FluidCard>
    </div>
  );
};

export default ParseReviewPanel;
