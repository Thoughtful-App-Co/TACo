/**
 * NotificationCenter - Dropdown panel for stale application notifications
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, For, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { pipelineStore } from '../store';
import { JobApplication, daysSince } from '../../../../schemas/pipeline.schema';
import { liquidTenure } from '../theme/liquid-tenure';
import { IconClock, IconExternalLink, IconX } from '../ui/Icons';
import { notificationInteractionStore } from '../store/notification-interactions';
import { CheckIcon, CaretDownIcon } from 'solid-phosphor/bold';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectApplication: (app: JobApplication) => void;
  currentTheme: () => typeof liquidTenure;
}

export const NotificationCenter: Component<NotificationCenterProps> = (props) => {
  const theme = () => props.currentTheme();

  // Get notifications grouped by priority
  const notifications = () => pipelineStore.getNotificationsByPriority();
  const totalCount = () => pipelineStore.getNotificationCount();

  // Snooze dropdown state
  const [snoozeDropdownOpen, setSnoozeDropdownOpen] = createSignal<string | null>(null);

  const handleSnooze = (appId: string, days: number) => {
    pipelineStore.snoozeApp(appId, days, 'manual');
    setSnoozeDropdownOpen(null);
  };

  const handleCheckLink = (app: JobApplication) => {
    if (app.jobUrl) {
      window.open(app.jobUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleViewApp = (app: JobApplication) => {
    notificationInteractionStore.markAsViewed(app);
    props.onSelectApplication(app);
    props.onClose();
  };

  const handleDismiss = (app: JobApplication) => {
    notificationInteractionStore.dismiss(app);
  };

  return (
    <Show when={props.isOpen}>
      {/* Backdrop */}
      <Portal>
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            'z-index': 998,
          }}
          onClick={props.onClose}
        />

        {/* Dropdown Panel */}
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '160px',
            width: '420px',
            'max-height': '600px',
            background: 'linear-gradient(135deg, rgba(20, 20, 25, 0.98), rgba(15, 15, 18, 0.98))',
            border: `1px solid ${theme().colors.border}`,
            'border-radius': '16px',
            'box-shadow': '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.1)',
            'backdrop-filter': 'blur(20px)',
            'z-index': 999,
            display: 'flex',
            'flex-direction': 'column',
            overflow: 'hidden',
            animation: 'notification-slide-in 0.2s ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
              'border-bottom': `1px solid ${theme().colors.border}`,
              display: 'flex',
              'justify-content': 'space-between',
              'align-items': 'center',
              'flex-shrink': 0,
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  'font-size': '18px',
                  'font-family': "'Space Grotesk', system-ui, sans-serif",
                  'font-weight': '700',
                  color: theme().colors.text,
                }}
              >
                Needs Attention
              </h3>
              <Show when={totalCount() > 0}>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    'font-size': '13px',
                    color: theme().colors.textMuted,
                  }}
                >
                  {totalCount()} application{totalCount() !== 1 ? 's' : ''} need follow-up
                </p>
              </Show>
            </div>
            <button
              onClick={props.onClose}
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                width: '32px',
                height: '32px',
                background: 'transparent',
                border: `1px solid ${theme().colors.border}`,
                'border-radius': '8px',
                cursor: 'pointer',
                color: theme().colors.textMuted,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = theme().colors.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = theme().colors.textMuted;
              }}
            >
              <IconX size={16} />
            </button>
          </div>

          {/* Content */}
          <div
            style={{
              flex: 1,
              'overflow-y': 'auto',
              padding: '16px',
            }}
          >
            <Show
              when={totalCount() > 0}
              fallback={
                <div
                  style={{
                    padding: '48px 24px',
                    'text-align': 'center',
                    color: theme().colors.textMuted,
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      margin: '0 auto 16px',
                      background: `${theme().colors.primary}20`,
                      'border-radius': '50%',
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                    }}
                  >
                    <IconClock size={28} color={theme().colors.primary} />
                  </div>
                  <p style={{ margin: 0, 'font-size': '15px', color: theme().colors.text }}>
                    All caught up!
                  </p>
                  <p style={{ margin: '8px 0 0 0', 'font-size': '13px' }}>
                    No applications need attention right now.
                  </p>
                </div>
              }
            >
              {/* Critical Section */}
              <Show when={notifications().critical.length > 0}>
                <div style={{ 'margin-bottom': '24px' }}>
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: '8px',
                      'margin-bottom': '12px',
                      'padding-left': '4px',
                    }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        'border-radius': '50%',
                        background: '#EF4444',
                        'box-shadow': '0 0 8px #EF444480',
                      }}
                    />
                    <span
                      style={{
                        'font-size': '12px',
                        'font-weight': '600',
                        'text-transform': 'uppercase',
                        'letter-spacing': '0.5px',
                        color: '#EF4444',
                      }}
                    >
                      Critical ({notifications().critical.length})
                    </span>
                  </div>
                  <For each={notifications().critical}>
                    {(app) => (
                      <NotificationItem
                        app={app}
                        severity="critical"
                        theme={theme}
                        onView={() => handleViewApp(app)}
                        onCheckLink={() => handleCheckLink(app)}
                        onSnooze={(days) => handleSnooze(app.id, days)}
                        snoozeDropdownOpen={snoozeDropdownOpen() === app.id}
                        onToggleSnoozeDropdown={() =>
                          setSnoozeDropdownOpen(snoozeDropdownOpen() === app.id ? null : app.id)
                        }
                        onDismiss={() => handleDismiss(app)}
                      />
                    )}
                  </For>
                </div>
              </Show>

              {/* Warning Section */}
              <Show when={notifications().warning.length > 0}>
                <div>
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: '8px',
                      'margin-bottom': '12px',
                      'padding-left': '4px',
                    }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        'border-radius': '50%',
                        background: '#F59E0B',
                        'box-shadow': '0 0 8px #F59E0B80',
                      }}
                    />
                    <span
                      style={{
                        'font-size': '12px',
                        'font-weight': '600',
                        'text-transform': 'uppercase',
                        'letter-spacing': '0.5px',
                        color: '#F59E0B',
                      }}
                    >
                      Warning ({notifications().warning.length})
                    </span>
                  </div>
                  <For each={notifications().warning}>
                    {(app) => (
                      <NotificationItem
                        app={app}
                        severity="warning"
                        theme={theme}
                        onView={() => handleViewApp(app)}
                        onCheckLink={() => handleCheckLink(app)}
                        onSnooze={(days) => handleSnooze(app.id, days)}
                        snoozeDropdownOpen={snoozeDropdownOpen() === app.id}
                        onToggleSnoozeDropdown={() =>
                          setSnoozeDropdownOpen(snoozeDropdownOpen() === app.id ? null : app.id)
                        }
                        onDismiss={() => handleDismiss(app)}
                      />
                    )}
                  </For>
                </div>
              </Show>
            </Show>
          </div>

          {/* Footer */}
          <Show when={totalCount() > 0}>
            <div
              style={{
                padding: '16px 24px',
                'border-top': `1px solid ${theme().colors.border}`,
                display: 'flex',
                'justify-content': 'space-between',
                'align-items': 'center',
                'flex-shrink': 0,
              }}
            >
              <button
                onClick={() => pipelineStore.toggleHolidayMode()}
                style={{
                  padding: '8px 16px',
                  background: pipelineStore.state.settings.holidayModeEnabled
                    ? `${theme().colors.primary}20`
                    : 'transparent',
                  border: `1px solid ${pipelineStore.state.settings.holidayModeEnabled ? theme().colors.primary : theme().colors.border}`,
                  'border-radius': '8px',
                  'font-size': '13px',
                  'font-weight': '500',
                  color: pipelineStore.state.settings.holidayModeEnabled
                    ? theme().colors.primary
                    : theme().colors.textMuted,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!pipelineStore.state.settings.holidayModeEnabled) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = theme().colors.text;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!pipelineStore.state.settings.holidayModeEnabled) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = theme().colors.textMuted;
                  }
                }}
              >
                <Show when={pipelineStore.state.settings.holidayModeEnabled}>
                  <CheckIcon width={14} height={14} style={{ 'margin-right': '4px' }} />
                </Show>
                Holiday Mode
              </button>
              <span style={{ 'font-size': '12px', color: theme().colors.textMuted }}>
                +{pipelineStore.state.settings.holidayExtensionDays} days when enabled
              </span>
            </div>
          </Show>
        </div>

        {/* Animations */}
        <style>{`
          @keyframes notification-slide-in {
            from {
              opacity: 0;
              transform: translateY(-8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </Portal>
    </Show>
  );
};

// ============================================================================
// NOTIFICATION ITEM
// ============================================================================

interface NotificationItemProps {
  app: JobApplication;
  severity: 'critical' | 'warning';
  theme: () => typeof liquidTenure;
  onView: () => void;
  onCheckLink: () => void;
  onSnooze: (days: number) => void;
  snoozeDropdownOpen: boolean;
  onToggleSnoozeDropdown: () => void;
  onDismiss: () => void;
}

const NotificationItem: Component<NotificationItemProps> = (props) => {
  const theme = () => props.theme();
  const days = () => daysSince(props.app.lastActivityAt);
  const severityColor = () => (props.severity === 'critical' ? '#EF4444' : '#F59E0B');
  const isNew = () => notificationInteractionStore.isNew(props.app);

  const snoozeDurations = [
    { label: '1 day', days: 1 },
    { label: '3 days', days: 3 },
    { label: '1 week', days: 7 },
    { label: '2 weeks', days: 14 },
  ];

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: `1px solid rgba(255, 255, 255, 0.06)`,
        'border-radius': '12px',
        padding: '14px',
        'margin-bottom': '8px',
        transition: 'all 0.15s ease',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
      }}
    >
      {/* New Badge */}
      <Show when={isNew()}>
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            padding: '3px 8px',
            background: '#3B82F6',
            'border-radius': '10px',
            'font-size': '10px',
            'font-weight': '700',
            color: 'white',
            'text-transform': 'uppercase',
            'letter-spacing': '0.5px',
            'z-index': 1,
          }}
        >
          NEW
        </div>
      </Show>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          'justify-content': 'space-between',
          'align-items': 'flex-start',
          'margin-bottom': '8px',
        }}
      >
        <div style={{ flex: 1, 'min-width': 0 }}>
          <h4
            style={{
              margin: 0,
              'font-size': '14px',
              'font-weight': '600',
              color: theme().colors.text,
              'white-space': 'nowrap',
              overflow: 'hidden',
              'text-overflow': 'ellipsis',
            }}
          >
            {props.app.roleName}
          </h4>
          <p
            style={{
              margin: '2px 0 0 0',
              'font-size': '12px',
              color: theme().colors.textMuted,
            }}
          >
            {props.app.companyName}
          </p>
        </div>
        <div
          style={{
            'margin-left': '12px',
            'flex-shrink': 0,
            display: 'flex',
            'align-items': 'center',
            gap: '4px',
            padding: '4px 8px',
            background: `${severityColor()}20`,
            'border-radius': '6px',
          }}
        >
          <IconClock size={12} color={severityColor()} />
          <span
            style={{
              'font-size': '12px',
              'font-weight': '600',
              color: severityColor(),
            }}
          >
            {days()}d
          </span>
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          'flex-wrap': 'wrap',
        }}
      >
        <button
          onClick={props.onView}
          style={{
            padding: '6px 12px',
            background: `${theme().colors.primary}20`,
            border: `1px solid ${theme().colors.primary}40`,
            'border-radius': '6px',
            'font-size': '12px',
            'font-weight': '500',
            color: theme().colors.primary,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${theme().colors.primary}30`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `${theme().colors.primary}20`;
          }}
        >
          View
        </button>

        <Show when={props.app.jobUrl}>
          <button
            onClick={props.onCheckLink}
            style={{
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              'border-radius': '6px',
              'font-size': '12px',
              'font-weight': '500',
              color: theme().colors.textMuted,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              'align-items': 'center',
              gap: '4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = theme().colors.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = theme().colors.textMuted;
            }}
          >
            <IconExternalLink size={12} />
            Check Link
          </button>
        </Show>

        {/* Snooze Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={props.onToggleSnoozeDropdown}
            style={{
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              'border-radius': '6px',
              'font-size': '12px',
              'font-weight': '500',
              color: theme().colors.textMuted,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = theme().colors.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = theme().colors.textMuted;
            }}
          >
            Snooze <CaretDownIcon width={14} height={14} style={{ 'vertical-align': 'middle' }} />
          </button>

          <Show when={props.snoozeDropdownOpen}>
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                'margin-top': '4px',
                background: 'rgba(20, 20, 25, 0.98)',
                border: `1px solid ${theme().colors.border}`,
                'border-radius': '8px',
                'box-shadow': '0 8px 24px rgba(0, 0, 0, 0.4)',
                'backdrop-filter': 'blur(20px)',
                'z-index': 1000,
                'min-width': '120px',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <For each={snoozeDurations}>
                {(duration) => (
                  <button
                    onClick={() => props.onSnooze(duration.days)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'transparent',
                      border: 'none',
                      'text-align': 'left',
                      'font-size': '13px',
                      color: theme().colors.textMuted,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.color = theme().colors.text;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = theme().colors.textMuted;
                    }}
                  >
                    {duration.label}
                  </button>
                )}
              </For>
            </div>
          </Show>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={props.onDismiss}
          style={{
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            padding: '6px 8px',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            'border-radius': '6px',
            cursor: 'pointer',
            color: 'rgba(255, 255, 255, 0.3)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          }}
          title="Dismiss notification"
        >
          <IconX size={14} />
        </button>
      </div>
    </div>
  );
};

export default NotificationCenter;
