/**
 * EducationViewer - Displays parsed education entries with edit/delete actions
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, For, Show, createSignal, JSX } from 'solid-js';
import {
  IconEdit,
  IconTrash,
  IconPlus,
  IconChevronUp,
  IconChevronDown,
} from '../../pipeline/ui/Icons';
import type { Education } from '../../../../schemas/pipeline.schema';
import type { ThemeType } from './Modal';

interface EducationViewerProps {
  education: Education[];
  currentTheme: () => ThemeType;
  onEdit: (education: Education) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onReorder?: (ids: string[]) => void;
}

/**
 * Formats a graduation date to display the year
 * Returns "In Progress" for undefined dates
 */
function formatGraduationDate(date: Date | undefined): string {
  if (!date) return 'In Progress';
  const d = new Date(date);
  return d.getFullYear().toString();
}

/**
 * Formats degree and field into a readable string
 * e.g., "Bachelor of Science in Computer Science"
 */
function formatDegreeAndField(degree: string, field: string): string {
  if (!degree && !field) return '';
  if (!field) return degree;
  if (!degree) return field;
  return `${degree} in ${field}`;
}

export const EducationViewer: Component<EducationViewerProps> = (props) => {
  const theme = () => props.currentTheme();

  // Track which card is being hovered
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

    const currentIds = props.education.map((edu) => edu.id);
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

    const currentIds = props.education.map((edu) => edu.id);
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
    const currentIndex = props.education.findIndex((edu) => edu.id === id);
    return currentIndex > 0;
  };

  const canMoveDown = (id: string): boolean => {
    const currentIndex = props.education.findIndex((edu) => edu.id === id);
    return currentIndex < props.education.length - 1;
  };

  // Container styles
  const containerStyle = (): JSX.CSSProperties => ({
    display: 'flex',
    'flex-direction': 'column',
    gap: '16px',
  });

  // Card styles
  const cardStyle = (isHovered: boolean): JSX.CSSProperties => ({
    position: 'relative',
    padding: '20px',
    background: isHovered ? `${theme().colors.surface}ee` : `${theme().colors.surface}aa`,
    border: `1px solid ${isHovered ? theme().colors.primary : theme().colors.border}`,
    'border-radius': '12px',
    transition: 'all 0.2s ease',
    transform: isHovered ? 'translateY(-2px)' : 'none',
    'box-shadow': isHovered
      ? `0 8px 24px ${theme().colors.primary}20`
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
  });

  // Institution name styles
  const institutionStyle = (): JSX.CSSProperties => ({
    margin: 0,
    'font-size': '18px',
    'font-weight': '600',
    color: theme().colors.text,
    'font-family': theme().fonts.heading,
  });

  // Degree and field styles
  const degreeStyle = (): JSX.CSSProperties => ({
    margin: '8px 0 0',
    'font-size': '14px',
    color: theme().colors.textMuted,
    'font-family': theme().fonts.body,
  });

  // GPA badge styles
  const gpaStyle = (): JSX.CSSProperties => ({
    display: 'inline-block',
    'margin-top': '12px',
    padding: '4px 10px',
    'font-size': '12px',
    'font-weight': '500',
    color: theme().colors.secondary,
    background: `${theme().colors.secondary}15`,
    'border-radius': '6px',
    'font-family': theme().fonts.body,
  });

  // Graduation year badge styles
  const yearBadgeStyle = (): JSX.CSSProperties => ({
    display: 'inline-block',
    padding: '4px 10px',
    'font-size': '12px',
    'font-weight': '500',
    color: theme().colors.primary,
    background: `${theme().colors.primary}20`,
    'border-radius': '20px',
    'font-family': theme().fonts.body,
  });

  // Header row styles (institution + year badge + actions)
  const headerRowStyle = (): JSX.CSSProperties => ({
    display: 'flex',
    'align-items': 'flex-start',
    'justify-content': 'space-between',
    gap: '12px',
    'margin-bottom': '12px',
  });

  // Left side: institution and year badge
  const headerLeftStyle = (): JSX.CSSProperties => ({
    display: 'flex',
    'align-items': 'center',
    gap: '12px',
    'flex-wrap': 'wrap',
    flex: '1',
  });

  // Action buttons container
  const actionsContainerStyle = (isVisible: boolean): JSX.CSSProperties => ({
    display: 'flex',
    gap: '8px',
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 0.2s ease',
    'flex-shrink': 0,
  });

  // Action button styles
  const actionButtonStyle = (variant: 'edit' | 'delete'): JSX.CSSProperties => ({
    padding: '8px',
    background: 'transparent',
    border: `1px solid ${variant === 'delete' ? '#ef4444' : theme().colors.border}`,
    'border-radius': '6px',
    color: variant === 'delete' ? '#ef4444' : theme().colors.textMuted,
    cursor: 'pointer',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  });

  // Empty state container
  const emptyStateStyle = (): JSX.CSSProperties => ({
    'text-align': 'center',
    padding: '48px 24px',
    background: `${theme().colors.surface}50`,
    border: `2px dashed ${theme().colors.border}`,
    'border-radius': '12px',
  });

  // Empty state message
  const emptyMessageStyle = (): JSX.CSSProperties => ({
    margin: '0 0 16px',
    'font-size': '16px',
    color: theme().colors.textMuted,
    'font-family': theme().fonts.body,
  });

  // Add button styles
  const addButtonStyle = (isPrimary: boolean = false): JSX.CSSProperties => ({
    display: 'inline-flex',
    'align-items': 'center',
    gap: '8px',
    padding: isPrimary ? '12px 24px' : '10px 20px',
    background: isPrimary ? theme().colors.primary : 'transparent',
    border: `1px solid ${theme().colors.primary}`,
    'border-radius': '8px',
    color: isPrimary ? '#FFFFFF' : theme().colors.primary,
    'font-size': '14px',
    'font-weight': '500',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    'font-family': theme().fonts.body,
  });

  // Add button container at bottom
  const addButtonContainerStyle = (): JSX.CSSProperties => ({
    'margin-top': '8px',
    display: 'flex',
    'justify-content': 'center',
  });

  return (
    <div style={containerStyle()}>
      <Show
        when={props.education.length > 0}
        fallback={
          <div style={emptyStateStyle()}>
            <p style={emptyMessageStyle()}>No education entries yet</p>
            <button
              onClick={props.onAdd}
              style={addButtonStyle(true)}
              class="pipeline-btn"
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = `0 6px 16px ${theme().colors.primary}40`;
                e.currentTarget.style.filter = 'brightness(1.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.filter = 'none';
              }}
            >
              <IconPlus size={16} />
              Add your education
            </button>
          </div>
        }
      >
        <For each={props.education}>
          {(edu) => {
            const isHovered = () => hoveredCardId() === edu.id;
            const isAnimating = () => animatingId() === edu.id;

            return (
              <div
                style={{
                  ...cardStyle(isHovered()),
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isAnimating()
                    ? 'scale(0.98)'
                    : isHovered()
                      ? 'translateY(-2px)'
                      : 'none',
                }}
                onMouseEnter={() => setHoveredCardId(edu.id)}
                onMouseLeave={() => setHoveredCardId(null)}
              >
                {/* Header: Institution + Year Badge + Actions */}
                <div style={headerRowStyle()}>
                  <div style={headerLeftStyle()}>
                    <h3 style={institutionStyle()}>{edu.institution}</h3>
                    <span style={yearBadgeStyle()}>{formatGraduationDate(edu.graduationDate)}</span>
                  </div>

                  {/* Action buttons - visible on hover */}
                  <div style={actionsContainerStyle(isHovered())}>
                    {/* Move Up/Down Arrows */}
                    <Show when={props.onReorder}>
                      <button
                        onClick={() => canMoveUp(edu.id) && handleMoveUp(edu.id)}
                        style={{
                          ...actionButtonStyle('edit'),
                          opacity: canMoveUp(edu.id) ? 1 : 0.4,
                          cursor: canMoveUp(edu.id) ? 'pointer' : 'not-allowed',
                        }}
                        title="Move up"
                        class="pipeline-btn"
                        disabled={!canMoveUp(edu.id)}
                      >
                        <IconChevronUp
                          size={14}
                          color={
                            canMoveUp(edu.id) ? theme().colors.textMuted : theme().colors.border
                          }
                        />
                      </button>
                      <button
                        onClick={() => canMoveDown(edu.id) && handleMoveDown(edu.id)}
                        style={{
                          ...actionButtonStyle('edit'),
                          opacity: canMoveDown(edu.id) ? 1 : 0.4,
                          cursor: canMoveDown(edu.id) ? 'pointer' : 'not-allowed',
                        }}
                        title="Move down"
                        class="pipeline-btn"
                        disabled={!canMoveDown(edu.id)}
                      >
                        <IconChevronDown
                          size={14}
                          color={
                            canMoveDown(edu.id) ? theme().colors.textMuted : theme().colors.border
                          }
                        />
                      </button>
                    </Show>
                    <button
                      onClick={() => props.onEdit(edu)}
                      style={actionButtonStyle('edit')}
                      title="Edit education"
                      class="pipeline-btn"
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = `${theme().colors.primary}15`;
                        e.currentTarget.style.borderColor = theme().colors.primary;
                        e.currentTarget.style.color = theme().colors.primary;
                        e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)';
                        e.currentTarget.style.boxShadow = `0 4px 8px ${theme().colors.primary}20`;
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = theme().colors.border;
                        e.currentTarget.style.color = theme().colors.textMuted;
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <IconEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(edu.id)}
                      style={actionButtonStyle('delete')}
                      title="Delete education"
                      class="pipeline-btn"
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#ef444420';
                        e.currentTarget.style.borderColor = '#ef4444';
                        e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 4px 8px #ef444420';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = '#ef4444';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                </div>

                {/* Degree and Field */}
                <Show when={edu.degree || edu.field}>
                  <p style={degreeStyle()}>{formatDegreeAndField(edu.degree, edu.field)}</p>
                </Show>

                {/* GPA */}
                <Show when={edu.gpa !== undefined && edu.gpa !== null}>
                  <span style={gpaStyle()}>GPA: {edu.gpa!.toFixed(2)}</span>
                </Show>
              </div>
            );
          }}
        </For>

        {/* Add button at bottom */}
        <div style={addButtonContainerStyle()}>
          <button
            onClick={props.onAdd}
            style={addButtonStyle(false)}
            class="pipeline-btn"
            onMouseOver={(e) => {
              e.currentTarget.style.background = `${theme().colors.primary}15`;
              e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${theme().colors.primary}20`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <IconPlus size={14} />
            Add Education
          </button>
        </div>
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
                Delete Education?
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
              Are you sure you want to delete this education entry? This action cannot be undone.
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

export default EducationViewer;
