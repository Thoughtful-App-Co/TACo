/**
 * AgingAlert - Notification banner for stale job applications
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show, createMemo } from 'solid-js';
import { JobApplication, ACTIVE_STATUSES, daysSince } from '../../../../schemas/pipeline.schema';
import { liquidTenure, pipelineAnimations } from '../theme/liquid-tenure';

interface AgingAlertProps {
  applications: JobApplication[];
  warningDays?: number;
  criticalDays?: number;
  onDismiss?: () => void;
  onViewStale?: () => void;
  theme: () => typeof liquidTenure;
}

const AgingAlert: Component<AgingAlertProps> = (props) => {
  const warningThreshold = () => props.warningDays ?? 14;
  const criticalThreshold = () => props.criticalDays ?? 30;

  const staleApplications = createMemo(() => {
    return props.applications.filter((app) => {
      // Only count active applications
      if (!ACTIVE_STATUSES.includes(app.status)) {
        return false;
      }
      // Check if application is stale (warning threshold or above)
      const days = daysSince(app.lastActivityAt);
      return days >= warningThreshold();
    });
  });

  const criticalCount = createMemo(() => {
    return staleApplications().filter((app) => daysSince(app.lastActivityAt) >= criticalThreshold())
      .length;
  });

  const hasCritical = createMemo(() => criticalCount() > 0);
  const staleCount = createMemo(() => staleApplications().length);

  const getMessage = createMemo(() => {
    const count = staleCount();
    if (count >= 4) {
      return `${count} applications are going stale - time to follow up!`;
    }
    return `You have ${count} application${count === 1 ? '' : 's'} that need${count === 1 ? 's' : ''} attention`;
  });

  const styles = createMemo(() => {
    const t = props.theme();
    const isCritical = hasCritical();

    return {
      container: {
        display: 'flex',
        'align-items': 'center',
        gap: '12px',
        padding: '12px 16px',
        background: isCritical ? t.aging.critical.bg : t.aging.warning.bg,
        border: `1px solid ${isCritical ? t.aging.critical.border : t.aging.warning.border}`,
        'border-radius': t.radii.card,
        animation: `pipeline-fade-up ${pipelineAnimations.normal} ${pipelineAnimations.fadeUp} forwards`,
      } as const,
      icon: {
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        width: '32px',
        height: '32px',
        'border-radius': '50%',
        background: isCritical ? `${t.aging.critical.color}20` : `${t.aging.warning.color}20`,
        color: isCritical ? t.aging.critical.color : t.aging.warning.color,
        'flex-shrink': '0',
      } as const,
      content: {
        flex: '1',
        display: 'flex',
        'flex-direction': 'column',
        gap: '2px',
      } as const,
      message: {
        color: isCritical ? t.aging.critical.color : t.aging.warning.color,
        'font-size': '14px',
        'font-weight': '500',
        margin: '0',
      } as const,
      criticalNote: {
        color: t.aging.critical.color,
        'font-size': '12px',
        opacity: '0.9',
        margin: '0',
      } as const,
      actions: {
        display: 'flex',
        'align-items': 'center',
        gap: '8px',
        'flex-shrink': '0',
      } as const,
      viewButton: {
        display: 'inline-flex',
        'align-items': 'center',
        gap: '6px',
        padding: '6px 12px',
        background: isCritical ? `${t.aging.critical.color}20` : `${t.aging.warning.color}20`,
        border: `1px solid ${isCritical ? t.aging.critical.border : t.aging.warning.border}`,
        'border-radius': t.radii.button,
        color: isCritical ? t.aging.critical.color : t.aging.warning.color,
        'font-size': '13px',
        'font-weight': '500',
        cursor: 'pointer',
        transition: `all ${pipelineAnimations.fast}`,
      } as const,
      dismissButton: {
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        width: '28px',
        height: '28px',
        padding: '0',
        background: 'transparent',
        border: 'none',
        'border-radius': '50%',
        color: t.colors.textMuted,
        cursor: 'pointer',
        transition: `all ${pipelineAnimations.fast}`,
      } as const,
    };
  });

  return (
    <Show when={staleCount() > 0}>
      <div style={styles().container}>
        {/* Clock/Alert Icon */}
        <div style={styles().icon}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        {/* Message Content */}
        <div style={styles().content}>
          <p style={styles().message}>{getMessage()}</p>
          <Show when={hasCritical()}>
            <p style={styles().criticalNote}>
              {criticalCount()} over {criticalThreshold()} days - critical!
            </p>
          </Show>
        </div>

        {/* Action Buttons */}
        <div style={styles().actions}>
          <Show when={props.onViewStale}>
            <button
              style={styles().viewButton}
              onClick={() => props.onViewStale?.()}
              class="pipeline-btn"
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
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              View
            </button>
          </Show>

          <Show when={props.onDismiss}>
            <button
              style={styles().dismissButton}
              onClick={() => props.onDismiss?.()}
              class="pipeline-icon-btn"
              aria-label="Dismiss alert"
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </Show>
        </div>
      </div>
    </Show>
  );
};

export default AgingAlert;
