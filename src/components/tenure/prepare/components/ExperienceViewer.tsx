/**
 * ExperienceViewer - Displays parsed work experiences with edit/delete actions
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, For, Show, createSignal } from 'solid-js';
import type { WorkExperience } from '../../../../schemas/pipeline.schema';
import type { Theme } from '../../../../theme/types';
import { FluidCard } from '../../pipeline/ui/FluidCard';
import { IconEdit, IconTrash, IconPlus, IconBriefcase } from '../../pipeline/ui/Icons';
import { liquidTenure, pipelineAnimations } from '../../pipeline/theme/liquid-tenure';

// ============================================================================
// TYPES
// ============================================================================

export type ThemeType = Theme;

export interface ExperienceViewerProps {
  experiences: WorkExperience[];
  currentTheme: () => ThemeType;
  onEdit: (experience: WorkExperience) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format a date range for display
 */
function formatDateRange(startDate: Date | undefined, endDate: Date | undefined): string {
  const formatDate = (d: Date) => {
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${month} ${year}`;
  };
  if (!startDate) return '';
  const start = formatDate(new Date(startDate));
  const end = endDate ? formatDate(new Date(endDate)) : 'Present';
  return `${start} - ${end}`;
}

/**
 * Get location type badge styles
 */
function getLocationTypeBadge(
  locationType: 'remote' | 'hybrid' | 'onsite' | undefined,
  _theme: ThemeType
): { background: string; color: string; label: string } {
  switch (locationType) {
    case 'remote':
      return {
        background: 'rgba(16, 185, 129, 0.15)',
        color: '#34D399',
        label: 'Remote',
      };
    case 'hybrid':
      return {
        background: 'rgba(139, 92, 246, 0.15)',
        color: '#A78BFA',
        label: 'Hybrid',
      };
    case 'onsite':
      return {
        background: 'rgba(59, 130, 246, 0.15)',
        color: '#60A5FA',
        label: 'On-site',
      };
    default:
      return {
        background: 'rgba(107, 114, 128, 0.15)',
        color: '#9CA3AF',
        label: '',
      };
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ExperienceViewer: Component<ExperienceViewerProps> = (props) => {
  const theme = () => props.currentTheme();
  const [hoveredCardId, setHoveredCardId] = createSignal<string | null>(null);

  return (
    <div
      style={{
        display: 'flex',
        'flex-direction': 'column',
        gap: '20px',
        width: '100%',
        'padding-bottom': '80px', // Space for floating add button
      }}
    >
      {/* Experience Cards */}
      <Show
        when={props.experiences.length > 0}
        fallback={<EmptyState theme={theme()} onAdd={props.onAdd} />}
      >
        <For each={props.experiences}>
          {(experience) => (
            <ExperienceCard
              experience={experience}
              theme={theme()}
              isHovered={hoveredCardId() === experience.id}
              onMouseEnter={() => setHoveredCardId(experience.id)}
              onMouseLeave={() => setHoveredCardId(null)}
              onEdit={() => props.onEdit(experience)}
              onDelete={() => props.onDelete(experience.id)}
            />
          )}
        </For>
      </Show>

      {/* Floating Add Button */}
      <Show when={props.experiences.length > 0}>
        <button
          onClick={props.onAdd}
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            width: '56px',
            height: '56px',
            'border-radius': '50%',
            background: `linear-gradient(135deg, ${theme().colors.primary}, ${theme().colors.secondary})`,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'box-shadow': `0 8px 24px ${theme().colors.primary}40`,
            transition: `all ${pipelineAnimations.normal} ${pipelineAnimations.flow}`,
            'z-index': '100',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = `0 12px 32px ${theme().colors.primary}60`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = `0 8px 24px ${theme().colors.primary}40`;
          }}
        >
          <IconPlus size={24} color="#FFFFFF" />
        </button>
      </Show>
    </div>
  );
};

// ============================================================================
// EXPERIENCE CARD
// ============================================================================

interface ExperienceCardProps {
  experience: WorkExperience;
  theme: ThemeType;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ExperienceCard: Component<ExperienceCardProps> = (props) => {
  const locationBadge = () => getLocationTypeBadge(props.experience.locationType, props.theme);
  const dateRange = () => formatDateRange(props.experience.startDate, props.experience.endDate);

  return (
    <FluidCard
      hoverable
      variant="elevated"
      style={{
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <div
        onMouseEnter={props.onMouseEnter}
        onMouseLeave={props.onMouseLeave}
        style={{ position: 'relative' }}
      >
        {/* Card Header with Actions */}
        <div
          style={{
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'flex-start',
            'margin-bottom': '16px',
          }}
        >
          {/* Company Name */}
          <h3
            style={{
              margin: 0,
              'font-size': '20px',
              'font-weight': '700',
              color: props.theme.colors.text,
              'font-family': props.theme.fonts.heading,
            }}
          >
            {props.experience.company}
          </h3>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              opacity: props.isHovered ? 1 : 0,
              transition: `opacity ${pipelineAnimations.fast}`,
            }}
          >
            <ActionButton
              icon={<IconEdit size={16} color={props.theme.colors.textMuted} />}
              onClick={(e) => {
                e.stopPropagation();
                props.onEdit();
              }}
              theme={props.theme}
              label="Edit"
            />
            <ActionButton
              icon={<IconTrash size={16} color="#EF4444" />}
              onClick={(e) => {
                e.stopPropagation();
                props.onDelete();
              }}
              theme={props.theme}
              label="Delete"
              variant="danger"
            />
          </div>
        </div>

        {/* Job Title and Date Range */}
        <div
          style={{
            display: 'flex',
            'flex-wrap': 'wrap',
            'align-items': 'center',
            gap: '8px',
            'margin-bottom': '12px',
          }}
        >
          <span
            style={{
              'font-size': '16px',
              'font-weight': '600',
              color: props.theme.colors.primary,
            }}
          >
            {props.experience.title}
          </span>
          <Show when={dateRange()}>
            <span style={{ color: props.theme.colors.textMuted }}>•</span>
            <span
              style={{
                'font-size': '14px',
                color: props.theme.colors.textMuted,
              }}
            >
              {dateRange()}
            </span>
          </Show>
        </div>

        {/* Location with Badge */}
        <Show when={props.experience.location || props.experience.locationType}>
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '10px',
              'margin-bottom': '16px',
            }}
          >
            <Show when={props.experience.location}>
              <span
                style={{
                  'font-size': '14px',
                  color: props.theme.colors.textMuted,
                }}
              >
                {props.experience.location}
              </span>
            </Show>
            <Show when={props.experience.locationType && locationBadge().label}>
              <span
                style={{
                  'font-size': '12px',
                  'font-weight': '600',
                  padding: '4px 10px',
                  'border-radius': '9999px',
                  background: locationBadge().background,
                  color: locationBadge().color,
                }}
              >
                {locationBadge().label}
              </span>
            </Show>
          </div>
        </Show>

        {/* Description */}
        <Show when={props.experience.description}>
          <p
            style={{
              margin: '0 0 16px',
              'font-size': '14px',
              'line-height': '1.6',
              color: props.theme.colors.text,
            }}
          >
            {props.experience.description}
          </p>
        </Show>

        {/* Bullet Points */}
        <Show when={props.experience.bulletPoints && props.experience.bulletPoints.length > 0}>
          <ul
            style={{
              margin: '0 0 16px',
              'padding-left': '20px',
              'list-style-type': 'disc',
            }}
          >
            <For each={props.experience.bulletPoints}>
              {(bullet) => (
                <li
                  style={{
                    'font-size': '14px',
                    'line-height': '1.6',
                    color: props.theme.colors.text,
                    'margin-bottom': '6px',
                  }}
                >
                  {bullet}
                </li>
              )}
            </For>
          </ul>
        </Show>

        {/* Skills Tags */}
        <Show when={props.experience.skills && props.experience.skills.length > 0}>
          <div
            style={{
              display: 'flex',
              'flex-wrap': 'wrap',
              gap: '8px',
              'margin-bottom': '16px',
            }}
          >
            <For each={props.experience.skills}>
              {(skill) => (
                <span
                  style={{
                    'font-size': '12px',
                    'font-weight': '500',
                    padding: '4px 12px',
                    'border-radius': '9999px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: props.theme.colors.text,
                    border: `1px solid ${props.theme.colors.border}`,
                  }}
                >
                  {skill}
                </span>
              )}
            </For>
          </div>
        </Show>

        {/* Achievements */}
        <Show when={props.experience.achievements && props.experience.achievements.length > 0}>
          <div
            style={{
              padding: '12px 16px',
              background: `${props.theme.colors.primary}10`,
              'border-radius': '12px',
              'border-left': `3px solid ${props.theme.colors.primary}`,
            }}
          >
            <div
              style={{
                'font-size': '12px',
                'font-weight': '600',
                color: props.theme.colors.primary,
                'margin-bottom': '8px',
                'text-transform': 'uppercase',
                'letter-spacing': '0.5px',
              }}
            >
              Key Achievements
            </div>
            <For each={props.experience.achievements}>
              {(achievement) => (
                <div
                  style={{
                    'font-size': '14px',
                    'line-height': '1.5',
                    color: props.theme.colors.text,
                    'margin-bottom': '4px',
                  }}
                >
                  • {achievement}
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </FluidCard>
  );
};

// ============================================================================
// ACTION BUTTON
// ============================================================================

interface ActionButtonProps {
  icon: any;
  onClick: (e: MouseEvent) => void;
  theme: ThemeType;
  label: string;
  variant?: 'default' | 'danger';
}

const ActionButton: Component<ActionButtonProps> = (props) => {
  const [isHovered, setIsHovered] = createSignal(false);

  const hoverBg = () => {
    if (props.variant === 'danger') {
      return 'rgba(239, 68, 68, 0.2)';
    }
    return 'rgba(255, 255, 255, 0.15)';
  };

  const borderColor = () => {
    if (isHovered() && props.variant === 'danger') {
      return '#EF4444';
    }
    if (isHovered()) {
      return props.theme.colors.primary;
    }
    return props.theme.colors.border;
  };

  return (
    <button
      onClick={props.onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={props.label}
      class="pipeline-btn"
      style={{
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        width: '32px',
        height: '32px',
        'border-radius': '8px',
        background: isHovered() ? hoverBg() : 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${borderColor()}`,
        cursor: 'pointer',
        transition: `all ${pipelineAnimations.normal} ${pipelineAnimations.flow}`,
        transform: isHovered() ? 'translateY(-1px) scale(1.05)' : 'none',
        'box-shadow': isHovered()
          ? `0 4px 8px ${props.variant === 'danger' ? '#EF444420' : `${props.theme.colors.primary}20`}`
          : 'none',
      }}
    >
      {props.icon}
    </button>
  );
};

// ============================================================================
// EMPTY STATE
// ============================================================================

interface EmptyStateProps {
  theme: ThemeType;
  onAdd: () => void;
}

const EmptyState: Component<EmptyStateProps> = (props) => {
  return (
    <div
      style={{
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        'justify-content': 'center',
        padding: '64px 32px',
        'text-align': 'center',
        background: liquidTenure.glass.background,
        border: liquidTenure.glass.border,
        'border-radius': liquidTenure.radii.card,
        'backdrop-filter': liquidTenure.glass.backdropFilter,
      }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          'border-radius': '50%',
          background: `${props.theme.colors.primary}15`,
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'margin-bottom': '24px',
        }}
      >
        <IconBriefcase size={36} color={props.theme.colors.primary} />
      </div>

      <h3
        style={{
          margin: '0 0 8px',
          'font-size': '20px',
          'font-weight': '600',
          color: props.theme.colors.text,
          'font-family': props.theme.fonts.heading,
        }}
      >
        No work experiences yet
      </h3>

      <p
        style={{
          margin: '0 0 24px',
          'font-size': '14px',
          color: props.theme.colors.textMuted,
          'max-width': '360px',
        }}
      >
        Add your first work experience to start building your professional profile. Upload a resume
        or add experiences manually.
      </p>

      <button
        onClick={props.onAdd}
        style={{
          display: 'flex',
          'align-items': 'center',
          gap: '8px',
          padding: '14px 28px',
          background: `linear-gradient(135deg, ${props.theme.colors.primary}, ${props.theme.colors.secondary})`,
          border: 'none',
          'border-radius': '12px',
          color: '#FFFFFF',
          'font-size': '15px',
          'font-weight': '600',
          cursor: 'pointer',
          transition: `all ${pipelineAnimations.normal} ${pipelineAnimations.flow}`,
          'box-shadow': `0 4px 16px ${props.theme.colors.primary}40`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = `0 8px 24px ${props.theme.colors.primary}60`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = `0 4px 16px ${props.theme.colors.primary}40`;
        }}
      >
        <IconPlus size={18} color="#FFFFFF" />
        Add your first work experience
      </button>
    </div>
  );
};

export default ExperienceViewer;
