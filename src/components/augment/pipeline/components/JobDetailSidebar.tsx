/**
 * JobDetailSidebar - View and edit job application details
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show, createSignal, createEffect, onCleanup } from 'solid-js';
import { pipelineStore } from '../store';
import { liquidAugment, statusColors, pipelineAnimations } from '../theme/liquid-augment';
import {
  JobApplication,
  ApplicationStatus,
  STATUS_LABELS,
  ACTIVE_STATUSES,
} from '../../../../schemas/pipeline.schema';
import {
  IconX,
  IconBriefcase,
  IconEdit,
  IconCheck,
  IconExternalLink,
  IconClock,
} from '../ui/Icons';
import { AgingIndicator } from '../ui';

// Persist width preference
const STORAGE_KEY = 'augment_job_sidebar_width';
const DEFAULT_WIDTH = 520;
const MIN_WIDTH = 400;
const MAX_WIDTH = 700;

interface JobDetailSidebarProps {
  job: JobApplication | null;
  onClose: () => void;
  currentTheme: () => Partial<typeof liquidAugment> & typeof liquidAugment;
}

export const JobDetailSidebar: Component<JobDetailSidebarProps> = (props) => {
  const theme = () => props.currentTheme();

  // Editing state
  const [isEditing, setIsEditing] = createSignal(false);
  const [editedJob, setEditedJob] = createSignal<Partial<JobApplication>>({});

  // Resize state
  const [width, setWidth] = createSignal(
    parseInt(localStorage.getItem(STORAGE_KEY) || String(DEFAULT_WIDTH))
  );
  const [isDragging, setIsDragging] = createSignal(false);
  const [hasAnimated, setHasAnimated] = createSignal(false);

  // Sync editedJob when job changes
  createEffect(() => {
    if (props.job) {
      setEditedJob({
        companyName: props.job.companyName,
        roleName: props.job.roleName,
        jobUrl: props.job.jobUrl,
        jobPostingText: props.job.jobPostingText,
        notes: props.job.notes,
        status: props.job.status,
      });
      setIsEditing(false);
    }
  });

  // Reset animation flag when sidebar closes
  createEffect(() => {
    if (!props.job) {
      setHasAnimated(false);
    }
  });

  // Mark as animated after initial render
  createEffect(() => {
    if (props.job && !hasAnimated()) {
      const timer = setTimeout(() => setHasAnimated(true), 300);
      onCleanup(() => clearTimeout(timer));
    }
  });

  // Handle drag resize
  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const startX = e.clientX;
    const startWidth = width();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      localStorage.setItem(STORAGE_KEY, String(width()));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle escape key
  createEffect(() => {
    if (props.job) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (isEditing()) {
            setIsEditing(false);
          } else {
            props.onClose();
          }
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      onCleanup(() => document.removeEventListener('keydown', handleKeyDown));
    }
  });

  // Prevent body scroll when open
  createEffect(() => {
    if (props.job) {
      document.body.style.overflow = 'hidden';
      onCleanup(() => {
        document.body.style.overflow = '';
      });
    }
  });

  const handleSave = () => {
    if (props.job && editedJob()) {
      pipelineStore.updateApplication(props.job.id, editedJob());
      setIsEditing(false);
    }
  };

  const handleStatusChange = (newStatus: ApplicationStatus) => {
    if (props.job) {
      pipelineStore.updateStatus(props.job.id, newStatus);
      setEditedJob((prev) => ({ ...prev, status: newStatus }));
    }
  };

  const handleDelete = () => {
    if (props.job && confirm('Delete this application? This cannot be undone.')) {
      pipelineStore.deleteApplication(props.job.id);
      props.onClose();
    }
  };

  const inputStyle = () => ({
    width: '100%',
    padding: '12px 16px',
    background: theme().colors.background,
    border: `1px solid ${theme().colors.border}`,
    'border-radius': '10px',
    color: theme().colors.text,
    'font-size': '14px',
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    outline: 'none',
    transition: `border-color ${pipelineAnimations.fast}`,
    'box-sizing': 'border-box' as const,
  });

  const labelStyle = () => ({
    display: 'block',
    'margin-bottom': '6px',
    'font-size': '12px',
    'font-weight': '500',
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    color: theme().colors.textMuted,
    'text-transform': 'uppercase' as const,
    'letter-spacing': '0.05em',
  });

  return (
    <Show when={props.job}>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          'backdrop-filter': 'blur(4px)',
          'z-index': 999,
          animation: 'sidebar-fade-in 0.2s ease-out',
          cursor: isDragging() ? 'ew-resize' : 'default',
        }}
        onClick={props.onClose}
      />

      {/* Sidebar Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: `${width()}px`,
          'max-width': '100vw',
          background: theme().colors.surface,
          'border-left': `1px solid ${theme().colors.border}`,
          'box-shadow': '-8px 0 32px rgba(0, 0, 0, 0.3)',
          'z-index': 1000,
          display: 'flex',
          'flex-direction': 'column',
          animation: isDragging() || hasAnimated() ? 'none' : 'sidebar-slide-in 0.25s ease-out',
          'user-select': isDragging() ? 'none' : 'auto',
        }}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '12px',
            cursor: 'ew-resize',
            'z-index': 10,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
          }}
          onMouseEnter={(e) => {
            const handle = e.currentTarget.querySelector('.resize-handle-bar') as HTMLElement;
            if (handle) {
              handle.style.opacity = '1';
              handle.style.background = theme().colors.primary;
            }
          }}
          onMouseLeave={(e) => {
            if (!isDragging()) {
              const handle = e.currentTarget.querySelector('.resize-handle-bar') as HTMLElement;
              if (handle) {
                handle.style.opacity = '0.5';
                handle.style.background = theme().colors.border;
              }
            }
          }}
        >
          <div
            class="resize-handle-bar"
            style={{
              width: '4px',
              height: '48px',
              'border-radius': '2px',
              background: isDragging() ? theme().colors.primary : theme().colors.border,
              opacity: isDragging() ? '1' : '0.5',
              transition: 'all 0.15s ease',
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'space-between',
            padding: '20px 24px 20px 28px',
            'border-bottom': `1px solid ${theme().colors.border}`,
            'flex-shrink': 0,
          }}
        >
          <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                width: '36px',
                height: '36px',
                'border-radius': '10px',
                background: `${statusColors[props.job!.status].bg}`,
                color: statusColors[props.job!.status].text,
              }}
            >
              <IconBriefcase size={20} />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  'font-size': '18px',
                  'font-family': "'Playfair Display', Georgia, serif",
                  'font-weight': '600',
                  color: theme().colors.text,
                }}
              >
                {isEditing() ? 'Edit Application' : 'Application Details'}
              </h2>
              <div
                style={{
                  'font-size': '12px',
                  color: theme().colors.textMuted,
                  'font-family': "'Space Grotesk', system-ui, sans-serif",
                  'margin-top': '2px',
                }}
              >
                <AgingIndicator lastActivityAt={props.job!.lastActivityAt} size="sm" showLabel />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
            <Show when={!isEditing()}>
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  width: '40px',
                  height: '40px',
                  background: 'transparent',
                  border: `1px solid ${theme().colors.border}`,
                  'border-radius': '10px',
                  cursor: 'pointer',
                  color: theme().colors.textMuted,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = theme().colors.text;
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = theme().colors.textMuted;
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Edit"
              >
                <IconEdit size={18} />
              </button>
            </Show>

            <button
              onClick={props.onClose}
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                width: '40px',
                height: '40px',
                background: 'transparent',
                border: `1px solid ${theme().colors.border}`,
                'border-radius': '10px',
                cursor: 'pointer',
                color: theme().colors.textMuted,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = theme().colors.text;
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = theme().colors.textMuted;
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Close (Esc)"
            >
              <IconX size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '24px 24px 24px 28px',
          }}
        >
          <Show when={!isEditing()}>
            {/* View Mode */}
            <div style={{ display: 'flex', 'flex-direction': 'column', gap: '24px' }}>
              {/* Company & Role */}
              <div>
                <h3
                  style={{
                    margin: '0 0 4px',
                    'font-size': '24px',
                    'font-family': "'Playfair Display', Georgia, serif",
                    'font-weight': '600',
                    color: theme().colors.text,
                  }}
                >
                  {props.job!.roleName}
                </h3>
                <p
                  style={{
                    margin: 0,
                    'font-size': '16px',
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                    color: theme().colors.textMuted,
                  }}
                >
                  {props.job!.companyName}
                </p>
              </div>

              {/* Status */}
              <div>
                <label style={labelStyle()}>Status</label>
                <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '8px' }}>
                  {ACTIVE_STATUSES.map((status) => (
                    <button
                      onClick={() => handleStatusChange(status)}
                      style={{
                        padding: '8px 14px',
                        background:
                          props.job!.status === status ? statusColors[status].bg : 'transparent',
                        border: `1px solid ${statusColors[status].border}`,
                        'border-radius': '8px',
                        color: statusColors[status].text,
                        'font-size': '13px',
                        'font-family': "'Space Grotesk', system-ui, sans-serif",
                        'font-weight': props.job!.status === status ? '600' : '400',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Job URL */}
              <Show when={props.job!.jobUrl}>
                <div>
                  <label style={labelStyle()}>Job Posting</label>
                  <a
                    href={props.job!.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      'align-items': 'center',
                      gap: '8px',
                      color: theme().colors.primary,
                      'text-decoration': 'none',
                      'font-size': '14px',
                      'font-family': "'Space Grotesk', system-ui, sans-serif",
                    }}
                  >
                    View posting <IconExternalLink size={14} />
                  </a>
                </div>
              </Show>

              {/* Description */}
              <Show when={props.job!.jobPostingText}>
                <div>
                  <label style={labelStyle()}>Job Description</label>
                  <p
                    style={{
                      margin: 0,
                      'font-size': '14px',
                      'font-family': "'Space Grotesk', system-ui, sans-serif",
                      color: theme().colors.text,
                      'line-height': '1.6',
                      'white-space': 'pre-wrap',
                    }}
                  >
                    {props.job!.jobPostingText}
                  </p>
                </div>
              </Show>

              {/* Notes */}
              <Show when={props.job!.notes}>
                <div>
                  <label style={labelStyle()}>Notes</label>
                  <p
                    style={{
                      margin: 0,
                      'font-size': '14px',
                      'font-family': "'Space Grotesk', system-ui, sans-serif",
                      color: theme().colors.text,
                      'line-height': '1.6',
                      'white-space': 'pre-wrap',
                    }}
                  >
                    {props.job!.notes}
                  </p>
                </div>
              </Show>

              {/* Timeline */}
              <div>
                <label style={labelStyle()}>Timeline</label>
                <div
                  style={{
                    display: 'flex',
                    'flex-direction': 'column',
                    gap: '8px',
                    'font-size': '13px',
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                    color: theme().colors.textMuted,
                  }}
                >
                  <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                    <IconClock size={14} />
                    Saved: {new Date(props.job!.savedAt).toLocaleDateString()}
                  </div>
                  <Show when={props.job!.appliedAt}>
                    <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                      <IconClock size={14} />
                      Applied: {new Date(props.job!.appliedAt!).toLocaleDateString()}
                    </div>
                  </Show>
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={handleDelete}
                style={{
                  padding: '12px',
                  background: 'transparent',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  'border-radius': '10px',
                  color: '#EF4444',
                  'font-size': '14px',
                  'font-family': "'Space Grotesk', system-ui, sans-serif",
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  'margin-top': '16px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Delete Application
              </button>
            </div>
          </Show>

          <Show when={isEditing()}>
            {/* Edit Mode */}
            <div style={{ display: 'flex', 'flex-direction': 'column', gap: '20px' }}>
              <div>
                <label style={labelStyle()}>Company Name</label>
                <input
                  type="text"
                  value={editedJob().companyName || ''}
                  onInput={(e) =>
                    setEditedJob((prev) => ({ ...prev, companyName: e.currentTarget.value }))
                  }
                  style={inputStyle()}
                />
              </div>

              <div>
                <label style={labelStyle()}>Role</label>
                <input
                  type="text"
                  value={editedJob().roleName || ''}
                  onInput={(e) =>
                    setEditedJob((prev) => ({ ...prev, roleName: e.currentTarget.value }))
                  }
                  style={inputStyle()}
                />
              </div>

              <div>
                <label style={labelStyle()}>Job URL</label>
                <input
                  type="url"
                  value={editedJob().jobUrl || ''}
                  onInput={(e) =>
                    setEditedJob((prev) => ({ ...prev, jobUrl: e.currentTarget.value }))
                  }
                  style={inputStyle()}
                />
              </div>

              <div>
                <label style={labelStyle()}>Job Description</label>
                <textarea
                  value={editedJob().jobPostingText || ''}
                  onInput={(e) =>
                    setEditedJob((prev) => ({ ...prev, jobPostingText: e.currentTarget.value }))
                  }
                  rows={6}
                  style={{
                    ...inputStyle(),
                    resize: 'vertical',
                    'line-height': '1.5',
                  }}
                />
              </div>

              <div>
                <label style={labelStyle()}>Notes</label>
                <textarea
                  value={editedJob().notes || ''}
                  onInput={(e) =>
                    setEditedJob((prev) => ({ ...prev, notes: e.currentTarget.value }))
                  }
                  rows={4}
                  style={{
                    ...inputStyle(),
                    resize: 'vertical',
                    'line-height': '1.5',
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', 'margin-top': '8px' }}>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'transparent',
                    border: `1px solid ${theme().colors.border}`,
                    'border-radius': '10px',
                    color: theme().colors.text,
                    'font-size': '14px',
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  style={{
                    flex: 2,
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    gap: '8px',
                    padding: '12px',
                    background: theme().colors.primary,
                    border: 'none',
                    'border-radius': '10px',
                    color: theme().colors.background,
                    'font-size': '14px',
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                    'font-weight': '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <IconCheck size={16} />
                  Save Changes
                </button>
              </div>
            </div>
          </Show>
        </div>
      </div>

      {/* Inject keyframes */}
      <style>{`
        @keyframes sidebar-slide-in {
          from {
            transform: translateX(100%);
            opacity: 0.8;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes sidebar-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </Show>
  );
};

export default JobDetailSidebar;
