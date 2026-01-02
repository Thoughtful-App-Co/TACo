/**
 * JobDetailSidebar - View and edit job application details
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show, createSignal, createEffect, onCleanup } from 'solid-js';
import { pipelineStore } from '../store';
import { liquidTenure, statusColors, pipelineAnimations } from '../theme/liquid-tenure';
import {
  JobApplication,
  ApplicationStatus,
  STATUS_LABELS,
  STATUS_ORDER,
  SalaryRange,
} from '../../../../schemas/pipeline.schema';
import {
  IconX,
  IconBriefcase,
  IconEdit,
  IconCheck,
  IconExternalLink,
  IconClock,
  IconTrash,
} from '../ui/Icons';
import { AgingIndicator } from '../ui';
import {
  formatSalary,
  formatNumberForInput,
  parseFormattedNumber,
  getCurrencySymbol,
} from '../utils';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { StatusTimeline } from './StatusTimeline';

// Persist width preference
const STORAGE_KEY = 'augment_job_sidebar_width';
const DEFAULT_WIDTH = 520;
const MIN_WIDTH = 400;
const MAX_WIDTH = 700;

interface JobDetailSidebarProps {
  job: JobApplication | null;
  onClose: () => void;
  currentTheme: () => Partial<typeof liquidTenure> & typeof liquidTenure;
}

export const JobDetailSidebar: Component<JobDetailSidebarProps> = (props) => {
  const theme = () => props.currentTheme();

  // Editing state
  const [isEditing, setIsEditing] = createSignal(false);
  const [editedJob, setEditedJob] = createSignal<Partial<JobApplication>>({});
  const [showDeleteModal, setShowDeleteModal] = createSignal(false);

  // Salary edit state
  const [salaryIsRange, setSalaryIsRange] = createSignal(false);
  const [salaryMin, setSalaryMin] = createSignal('');
  const [salaryMax, setSalaryMax] = createSignal('');
  const [salarySingle, setSalarySingle] = createSignal('');
  const [salaryCurrency, setSalaryCurrency] = createSignal('USD');
  const [salaryPeriod, setSalaryPeriod] = createSignal<'hourly' | 'annual'>('annual');
  const [location, setLocation] = createSignal('');
  const [locationType, setLocationType] = createSignal<'remote' | 'hybrid' | 'onsite' | ''>('');
  const [department, setDepartment] = createSignal('');
  const [appliedAtDate, setAppliedAtDate] = createSignal('');
  const [appliedAtTime, setAppliedAtTime] = createSignal('12:00');

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

      // Initialize location
      setLocation(props.job.location || '');
      setLocationType(props.job.locationType || '');
      setDepartment(props.job.department || '');

      // Initialize applied date/time
      if (props.job.appliedAt) {
        const date = new Date(props.job.appliedAt);
        setAppliedAtDate(date.toISOString().split('T')[0]); // YYYY-MM-DD
        setAppliedAtTime(
          date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
        );
      } else {
        setAppliedAtDate('');
        setAppliedAtTime('12:00');
      }

      // Initialize salary (with formatted display)
      if (props.job.salary) {
        setSalaryCurrency(props.job.salary.currency);
        setSalaryPeriod(props.job.salary.period);

        if (props.job.salary.min === props.job.salary.max) {
          // Single value - format with commas
          setSalaryIsRange(false);
          setSalarySingle(
            props.job.salary.min ? formatNumberForInput(String(props.job.salary.min)) : ''
          );
        } else {
          // Range - format with commas
          setSalaryIsRange(true);
          setSalaryMin(
            props.job.salary.min ? formatNumberForInput(String(props.job.salary.min)) : ''
          );
          setSalaryMax(
            props.job.salary.max ? formatNumberForInput(String(props.job.salary.max)) : ''
          );
        }
      } else {
        setSalaryIsRange(false);
        setSalarySingle('');
        setSalaryMin('');
        setSalaryMax('');
        setSalaryCurrency('USD');
        setSalaryPeriod('annual');
      }

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
      // Build salary object
      let salary: SalaryRange | undefined = undefined;
      if (salaryIsRange()) {
        const min = parseFormattedNumber(salaryMin());
        const max = parseFormattedNumber(salaryMax());
        if (!isNaN(min) || !isNaN(max)) {
          salary = {
            min: !isNaN(min) ? min : undefined,
            max: !isNaN(max) ? max : undefined,
            currency: salaryCurrency(),
            period: salaryPeriod(),
          };
        }
      } else {
        const single = parseFormattedNumber(salarySingle());
        if (!isNaN(single)) {
          salary = {
            min: single,
            max: single,
            currency: salaryCurrency(),
            period: salaryPeriod(),
          };
        }
      }

      // Build appliedAt date/time
      let appliedAt: Date | undefined = undefined;
      if (appliedAtDate()) {
        const dateStr = `${appliedAtDate()}T${appliedAtTime() || '12:00'}:00`;
        appliedAt = new Date(dateStr);
      }

      // Build update object
      const updates: Partial<JobApplication> = {
        ...editedJob(),
        salary,
        location: location() || undefined,
        locationType: locationType() || undefined,
        department: department() || undefined,
        appliedAt,
      };

      // Update lastActivityAt to match appliedAt when set
      // This ensures aging indicators reflect time since application submission
      if (appliedAt) {
        updates.lastActivityAt = appliedAt;
      } else if (props.job.appliedAt && !appliedAt) {
        // User cleared appliedAt - revert lastActivityAt to savedAt
        updates.lastActivityAt = props.job.savedAt;
      }

      pipelineStore.updateApplication(props.job.id, updates);
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
    if (props.job) {
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
            </div>
          </div>

          <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
            <Show when={!isEditing()}>
              {/* Delete button */}
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  width: '40px',
                  height: '40px',
                  background: 'transparent',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  'border-radius': '10px',
                  cursor: 'pointer',
                  color: '#EF4444',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                }}
                title="Delete Application"
              >
                <IconTrash size={18} />
              </button>

              {/* Edit button */}
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
                <div style={{ position: 'relative' }}>
                  <select
                    value={props.job!.status}
                    onChange={(e) => handleStatusChange(e.currentTarget.value as ApplicationStatus)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      'padding-left': '44px',
                      background: theme().colors.background,
                      border: `1px solid ${theme().colors.border}`,
                      'border-radius': '10px',
                      color: theme().colors.text,
                      'font-size': '14px',
                      'font-family': "'Space Grotesk', system-ui, sans-serif",
                      'font-weight': '500',
                      outline: 'none',
                      cursor: 'pointer',
                      transition: `border-color ${pipelineAnimations.fast}`,
                      appearance: 'none',
                      '-webkit-appearance': 'none',
                      '-moz-appearance': 'none',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = theme().colors.primary;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = theme().colors.border;
                    }}
                  >
                    {STATUS_ORDER.map((status) => (
                      <option value={status}>{STATUS_LABELS[status]}</option>
                    ))}
                  </select>
                  {/* Status indicator badge */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '20px',
                      height: '20px',
                      'border-radius': '6px',
                      background: statusColors[props.job!.status].bg,
                      border: `2px solid ${statusColors[props.job!.status].border}`,
                      'pointer-events': 'none',
                    }}
                  />
                  {/* Dropdown arrow */}
                  <div
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      'pointer-events': 'none',
                      color: theme().colors.textMuted,
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="2 4 6 8 10 4" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Status History Timeline */}
              <Show when={props.job!.statusHistory && props.job!.statusHistory.length > 0}>
                <div>
                  <label style={labelStyle()}>Status History</label>
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${theme().colors.border}`,
                      'border-radius': '12px',
                      padding: '16px',
                      'margin-top': '8px',
                    }}
                  >
                    <StatusTimeline
                      statusHistory={props.job!.statusHistory}
                      currentStatus={props.job!.status}
                      theme={theme}
                    />
                  </div>
                </div>
              </Show>

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

              {/* Location & Type */}
              <Show when={props.job!.location || props.job!.locationType}>
                <div>
                  <label style={labelStyle()}>Location</label>
                  <p
                    style={{
                      margin: 0,
                      'font-size': '14px',
                      'font-family': "'Space Grotesk', system-ui, sans-serif",
                      color: theme().colors.text,
                    }}
                  >
                    {props.job!.location}
                    {props.job!.location && props.job!.locationType && ' • '}
                    {props.job!.locationType && (
                      <span
                        style={{
                          'text-transform': 'capitalize',
                          color: theme().colors.textMuted,
                        }}
                      >
                        {props.job!.locationType}
                      </span>
                    )}
                  </p>
                </div>
              </Show>

              {/* Department */}
              <Show when={props.job!.department}>
                <div>
                  <label style={labelStyle()}>Department</label>
                  <p
                    style={{
                      margin: 0,
                      'font-size': '14px',
                      'font-family': "'Space Grotesk', system-ui, sans-serif",
                      color: theme().colors.text,
                    }}
                  >
                    {props.job!.department}
                  </p>
                </div>
              </Show>

              {/* Salary */}
              <Show when={props.job!.salary}>
                <div>
                  <label style={labelStyle()}>Salary</label>
                  <p
                    style={{
                      margin: 0,
                      'font-size': '14px',
                      'font-family': "'Space Grotesk', system-ui, sans-serif",
                      color: theme().colors.text,
                      'font-weight': '600',
                    }}
                  >
                    {formatSalary(props.job!.salary, false)}
                  </p>
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

              {/* Location Fields */}
              <div style={{ display: 'grid', 'grid-template-columns': '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle()}>Location</label>
                  <input
                    type="text"
                    value={location()}
                    onInput={(e) => setLocation(e.currentTarget.value)}
                    placeholder="e.g., San Francisco, CA"
                    style={inputStyle()}
                  />
                </div>
                <div>
                  <label style={labelStyle()}>Type</label>
                  <select
                    value={locationType()}
                    onChange={(e) =>
                      setLocationType(e.currentTarget.value as 'remote' | 'hybrid' | 'onsite' | '')
                    }
                    style={{
                      ...inputStyle(),
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">Not specified</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">On-site</option>
                  </select>
                </div>
              </div>

              {/* Salary Section */}
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${theme().colors.border}`,
                  'border-radius': '10px',
                }}
              >
                <label style={{ ...labelStyle(), 'margin-bottom': '12px' }}>Salary</label>

                <div style={{ 'margin-bottom': '12px' }}>
                  <label
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      'font-size': '13px',
                      'font-family': "'Space Grotesk', system-ui, sans-serif",
                      color: theme().colors.text,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={salaryIsRange()}
                      onChange={(e) => setSalaryIsRange(e.currentTarget.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    Salary Range
                  </label>
                </div>

                <div style={{ display: 'grid', gap: '12px' }}>
                  <Show
                    when={salaryIsRange()}
                    fallback={
                      <div>
                        <label style={labelStyle()}>Amount</label>
                        <div style={{ position: 'relative' }}>
                          <span
                            style={{
                              position: 'absolute',
                              left: '12px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: theme().colors.textMuted,
                              'font-size': '14px',
                              'pointer-events': 'none',
                            }}
                          >
                            {getCurrencySymbol(salaryCurrency())}
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={salarySingle()}
                            onInput={(e) => {
                              const formatted = formatNumberForInput(e.currentTarget.value);
                              setSalarySingle(formatted);
                            }}
                            placeholder="e.g., 120,000"
                            style={{
                              ...inputStyle(),
                              'text-indent': '24px',
                            }}
                          />
                        </div>
                      </div>
                    }
                  >
                    <div
                      style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '12px' }}
                    >
                      <div>
                        <label style={labelStyle()}>Min</label>
                        <div style={{ position: 'relative' }}>
                          <span
                            style={{
                              position: 'absolute',
                              left: '12px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: theme().colors.textMuted,
                              'font-size': '14px',
                              'pointer-events': 'none',
                            }}
                          >
                            {getCurrencySymbol(salaryCurrency())}
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={salaryMin()}
                            onInput={(e) => {
                              const formatted = formatNumberForInput(e.currentTarget.value);
                              setSalaryMin(formatted);
                            }}
                            placeholder="e.g., 100,000"
                            style={{
                              ...inputStyle(),
                              'text-indent': '24px',
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle()}>Max</label>
                        <div style={{ position: 'relative' }}>
                          <span
                            style={{
                              position: 'absolute',
                              left: '12px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: theme().colors.textMuted,
                              'font-size': '14px',
                              'pointer-events': 'none',
                            }}
                          >
                            {getCurrencySymbol(salaryCurrency())}
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={salaryMax()}
                            onInput={(e) => {
                              const formatted = formatNumberForInput(e.currentTarget.value);
                              setSalaryMax(formatted);
                            }}
                            placeholder="e.g., 140,000"
                            style={{
                              ...inputStyle(),
                              'text-indent': '24px',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </Show>

                  <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle()}>Currency</label>
                      <select
                        value={salaryCurrency()}
                        onChange={(e) => setSalaryCurrency(e.currentTarget.value)}
                        style={{
                          ...inputStyle(),
                          cursor: 'pointer',
                        }}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD ($)</option>
                        <option value="AUD">AUD ($)</option>
                        <option value="JPY">JPY (¥)</option>
                        <option value="INR">INR (₹)</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle()}>Period</label>
                      <select
                        value={salaryPeriod()}
                        onChange={(e) =>
                          setSalaryPeriod(e.currentTarget.value as 'hourly' | 'annual')
                        }
                        style={{
                          ...inputStyle(),
                          cursor: 'pointer',
                        }}
                      >
                        <option value="annual">Annual</option>
                        <option value="hourly">Hourly</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label style={labelStyle()}>Department</label>
                <input
                  type="text"
                  value={department()}
                  onInput={(e) => setDepartment(e.currentTarget.value)}
                  placeholder="e.g., Engineering, Sales, Marketing"
                  style={inputStyle()}
                />
              </div>

              {/* Applied Date & Time */}
              <div>
                <label style={labelStyle()}>Application Date & Time</label>
                <div style={{ display: 'grid', 'grid-template-columns': '2fr 1fr', gap: '12px' }}>
                  <div>
                    <input
                      type="date"
                      value={appliedAtDate()}
                      onInput={(e) => setAppliedAtDate(e.currentTarget.value)}
                      style={inputStyle()}
                    />
                  </div>
                  <div>
                    <input
                      type="time"
                      value={appliedAtTime()}
                      onInput={(e) => setAppliedAtTime(e.currentTarget.value)}
                      style={inputStyle()}
                    />
                  </div>
                </div>
                <p
                  style={{
                    margin: '6px 0 0',
                    'font-size': '11px',
                    color: theme().colors.textMuted,
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                  }}
                >
                  Leave blank if not yet applied. Time defaults to 12:00 PM.
                </p>
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal()}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Application?"
        message={`Are you sure you want to delete your application to ${props.job?.companyName} for ${props.job?.roleName}? This action cannot be undone.`}
        confirmText="Delete"
        theme={theme}
      />
    </Show>
  );
};

export default JobDetailSidebar;
