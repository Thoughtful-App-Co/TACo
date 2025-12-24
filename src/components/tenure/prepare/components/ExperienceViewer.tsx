/**
 * ExperienceViewer - Displays parsed work experiences with edit/delete actions
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, For, Show, createSignal } from 'solid-js';
import type { WorkExperience } from '../../../../schemas/pipeline.schema';
import type { Theme } from '../../../../theme/types';
import { FluidCard } from '../../pipeline/ui/FluidCard';
import {
  IconEdit,
  IconTrash,
  IconPlus,
  IconBriefcase,
  IconChevronUp,
  IconChevronDown,
} from '../../pipeline/ui/Icons';
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
  onReorder?: (ids: string[]) => void;
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
  const [deleteConfirmId, setDeleteConfirmId] = createSignal<string | null>(null);
  const [animatingId, setAnimatingId] = createSignal<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = () => {
    const id = deleteConfirmId();
    if (id) {
      props.onDelete(id);
      setDeleteConfirmId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const handleMoveUp = (id: string) => {
    if (!props.onReorder) return;

    const currentIds = props.experiences.map((exp) => exp.id);
    const currentIndex = currentIds.indexOf(id);

    // Can't move up if already at the top
    if (currentIndex <= 0) return;

    // Trigger animation
    setAnimatingId(id);

    // Swap with previous item
    const newIds = [...currentIds];
    [newIds[currentIndex - 1], newIds[currentIndex]] = [
      newIds[currentIndex],
      newIds[currentIndex - 1],
    ];

    // Call reorder handler
    props.onReorder(newIds);

    // Clear animation after transition completes
    setTimeout(() => setAnimatingId(null), 300);
  };

  const handleMoveDown = (id: string) => {
    if (!props.onReorder) return;

    const currentIds = props.experiences.map((exp) => exp.id);
    const currentIndex = currentIds.indexOf(id);

    // Can't move down if already at the bottom
    if (currentIndex >= currentIds.length - 1) return;

    // Trigger animation
    setAnimatingId(id);

    // Swap with next item
    const newIds = [...currentIds];
    [newIds[currentIndex], newIds[currentIndex + 1]] = [
      newIds[currentIndex + 1],
      newIds[currentIndex],
    ];

    // Call reorder handler
    props.onReorder(newIds);

    // Clear animation after transition completes
    setTimeout(() => setAnimatingId(null), 300);
  };

  const canMoveUp = (id: string): boolean => {
    const currentIndex = props.experiences.findIndex((exp) => exp.id === id);
    return currentIndex > 0;
  };

  const canMoveDown = (id: string): boolean => {
    const currentIndex = props.experiences.findIndex((exp) => exp.id === id);
    return currentIndex < props.experiences.length - 1;
  };

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
              isAnimating={animatingId() === experience.id}
              onMouseEnter={() => setHoveredCardId(experience.id)}
              onMouseLeave={() => setHoveredCardId(null)}
              onEdit={() => props.onEdit(experience)}
              onDelete={() => handleDeleteClick(experience.id)}
              onMoveUp={() => handleMoveUp(experience.id)}
              onMoveDown={() => handleMoveDown(experience.id)}
              canMoveUp={canMoveUp(experience.id)}
              canMoveDown={canMoveDown(experience.id)}
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

      {/* Delete Confirmation Modal */}
      <Show when={deleteConfirmId() !== null}>
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
          onClick={handleCancelDelete}
        >
          <div
            style={{
              background: theme().colors.surface || '#1F2937',
              border: `2px solid #EF4444`,
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
              <IconTrash size={24} color="#EF4444" />
              <h3
                style={{
                  margin: 0,
                  'font-size': '24px',
                  color: '#EF4444',
                  'font-family': theme().fonts.heading,
                }}
              >
                Delete Work Experience?
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
              Are you sure you want to delete this work experience? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px', 'justify-content': 'flex-end' }}>
              <button
                onClick={handleCancelDelete}
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
                onClick={handleConfirmDelete}
                style={{
                  padding: '12px 24px',
                  background: '#EF4444',
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
  isAnimating?: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
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
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: props.isAnimating ? 'scale(0.98)' : 'none',
      }}
    >
      <div
        onMouseEnter={props.onMouseEnter}
        onMouseLeave={props.onMouseLeave}
        style={{
          position: 'relative',
        }}
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
              flex: 1,
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
            {/* Move Up/Down Arrows */}
            <Show when={props.onMoveUp && props.onMoveDown}>
              <ActionButton
                icon={
                  <IconChevronUp
                    size={14}
                    color={
                      props.canMoveUp ? props.theme.colors.textMuted : props.theme.colors.border
                    }
                  />
                }
                onClick={(e) => {
                  e.stopPropagation();
                  if (props.canMoveUp) props.onMoveUp?.();
                }}
                theme={props.theme}
                label="Move up"
                variant="default"
                disabled={!props.canMoveUp}
              />
              <ActionButton
                icon={
                  <IconChevronDown
                    size={14}
                    color={
                      props.canMoveDown ? props.theme.colors.textMuted : props.theme.colors.border
                    }
                  />
                }
                onClick={(e) => {
                  e.stopPropagation();
                  if (props.canMoveDown) props.onMoveDown?.();
                }}
                theme={props.theme}
                label="Move down"
                variant="default"
                disabled={!props.canMoveDown}
              />
            </Show>
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
  disabled?: boolean;
}

const ActionButton: Component<ActionButtonProps> = (props) => {
  const [isHovered, setIsHovered] = createSignal(false);

  const hoverBg = () => {
    if (props.disabled) return 'rgba(255, 255, 255, 0.02)';
    if (props.variant === 'danger') {
      return 'rgba(239, 68, 68, 0.2)';
    }
    return 'rgba(255, 255, 255, 0.15)';
  };

  const borderColor = () => {
    if (props.disabled) return props.theme.colors.border;
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
      onClick={props.disabled ? undefined : props.onClick}
      onMouseEnter={() => !props.disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={props.label}
      class="pipeline-btn"
      disabled={props.disabled}
      style={{
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        width: '32px',
        height: '32px',
        'border-radius': '8px',
        background: isHovered() && !props.disabled ? hoverBg() : 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${borderColor()}`,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.4 : 1,
        transition: `all ${pipelineAnimations.normal} ${pipelineAnimations.flow}`,
        transform: isHovered() && !props.disabled ? 'translateY(-1px) scale(1.05)' : 'none',
        'box-shadow':
          isHovered() && !props.disabled
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
