/**
 * Tooltip - Animated tooltip component with 200ms fade transition
 * Supports rich content for pipeline analytics display
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, JSX, createSignal, Show, onCleanup } from 'solid-js';
import { Portal } from 'solid-js/web';

export interface TooltipProps {
  /** Content to display in the tooltip */
  content: JSX.Element;
  /** The trigger element */
  children: JSX.Element;
  /** Tooltip position relative to trigger */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  /** Delay before showing tooltip (ms) */
  delay?: number;
  /** Max width of tooltip */
  maxWidth?: number;
  /** Custom class for tooltip container */
  class?: string;
  /** Disable tooltip */
  disabled?: boolean;
}

export const Tooltip: Component<TooltipProps> = (props) => {
  const [isVisible, setIsVisible] = createSignal(false);
  const [isRendered, setIsRendered] = createSignal(false);
  const [cursorPos, setCursorPos] = createSignal({ x: 0, y: 0 });
  let triggerRef: HTMLDivElement | undefined;
  let timeoutId: number | undefined;

  const delay = () => props.delay ?? 150;
  const maxWidth = () => props.maxWidth || 280;

  const showTooltip = (e: MouseEvent | FocusEvent) => {
    if (props.disabled) return;

    let x = 0;
    let y = 0;

    if (e instanceof MouseEvent) {
      const cursorX = e.clientX;
      const cursorY = e.clientY;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const tooltipWidth = maxWidth();
      const tooltipHeight = 200;
      const offset = 12; // Small offset from cursor
      const edgePadding = 10;

      // Default: below and right of cursor
      x = cursorX + offset;
      y = cursorY + offset;

      // If tooltip would go off RIGHT edge, flip to LEFT of cursor
      if (x + tooltipWidth > viewportWidth - edgePadding) {
        x = cursorX - tooltipWidth - offset;
      }

      // If tooltip would go off BOTTOM edge, flip to ABOVE cursor
      if (y + tooltipHeight > viewportHeight - edgePadding) {
        y = cursorY - tooltipHeight - offset;
      }

      // Final safety: ensure not off left or top edge
      if (x < edgePadding) {
        x = edgePadding;
      }
      if (y < edgePadding) {
        y = edgePadding;
      }
    } else {
      // Focus event (keyboard) - position near element
      if (triggerRef) {
        const rect = triggerRef.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const tooltipWidth = maxWidth();

        x = rect.right + 12;
        y = rect.top;

        if (x + tooltipWidth > viewportWidth - 10) {
          x = rect.left - tooltipWidth - 12;
        }
      }
    }

    setCursorPos({ x, y });

    timeoutId = window.setTimeout(() => {
      setIsRendered(true);
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }, delay());
  };

  const hideTooltip = () => {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    setIsVisible(false);
    // Wait for fade out animation before unmounting
    setTimeout(() => {
      setIsRendered(false);
    }, 200);
  };

  onCleanup(() => {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  });

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        style={{ display: 'inline-block' }}
      >
        {props.children}
      </div>

      <Show when={isRendered()}>
        <Portal>
          <div
            class={props.class}
            style={{
              position: 'fixed',
              left: `${cursorPos().x}px`,
              top: `${cursorPos().y}px`,
              transform: 'none',
              'max-width': `${maxWidth()}px`,
              'z-index': '10000',
              opacity: isVisible() ? 1 : 0,
              transition: 'opacity 200ms ease',
              'pointer-events': 'none',
            }}
          >
            <div
              style={{
                background:
                  'linear-gradient(135deg, rgba(30, 30, 35, 0.98), rgba(20, 20, 25, 0.99))',
                'backdrop-filter': 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                'border-radius': '12px',
                padding: '14px 18px',
                'box-shadow': `
                  0 4px 24px rgba(0, 0, 0, 0.4),
                  0 2px 8px rgba(0, 0, 0, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.05)
                `,
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                'font-size': '14px',
                color: 'rgba(255, 255, 255, 0.92)',
                'line-height': '1.55',
              }}
            >
              {props.content}
            </div>
          </div>
        </Portal>
      </Show>
    </>
  );
};

// ============================================================================
// SPECIALIZED TOOLTIP CONTENT COMPONENTS
// ============================================================================

interface StatTooltipContentProps {
  title: string;
  metrics: Array<{
    label: string;
    value: string | number;
    color?: string;
    trend?: 'up' | 'down' | 'neutral';
  }>;
  insight?: string | JSX.Element;
}

export const StatTooltipContent: Component<StatTooltipContentProps> = (props) => (
  <div style={{ 'min-width': '200px' }}>
    {/* Header */}
    <div
      style={{
        'font-weight': '600',
        'font-size': '15px',
        'margin-bottom': '12px',
        color: '#FFFFFF',
        display: 'flex',
        'align-items': 'center',
        gap: '8px',
      }}
    >
      {props.title}
    </div>

    {/* Metrics list */}
    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
      {props.metrics.map((metric) => (
        <div
          style={{
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'flex-start',
            gap: '12px',
          }}
        >
          <span
            style={{
              color: 'rgba(255, 255, 255, 0.65)',
              'font-size': '13px',
              flex: '0 0 auto',
            }}
          >
            {metric.label}
          </span>
          <span
            style={{
              'font-weight': '600',
              'font-size': '14px',
              color: metric.color || '#FFFFFF',
              display: 'flex',
              'align-items': 'center',
              gap: '4px',
              'text-align': 'right',
              flex: '1 1 auto',
              'word-break': 'break-word',
            }}
          >
            {metric.trend === 'up' && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10B981"
                stroke-width="2"
              >
                <path d="M18 15l-6-6-6 6" />
              </svg>
            )}
            {metric.trend === 'down' && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#EF4444"
                stroke-width="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            )}
            {metric.value}
          </span>
        </div>
      ))}
    </div>

    {/* Insight */}
    <Show when={props.insight}>
      <div
        style={{
          'margin-top': '12px',
          'padding-top': '10px',
          'border-top': '1px solid rgba(255, 255, 255, 0.1)',
          'font-size': '12px',
          color: 'rgba(255, 255, 255, 0.55)',
          'font-style': 'italic',
        }}
      >
        {props.insight}
      </div>
    </Show>
  </div>
);

interface PipelineColumnTooltipContentProps {
  status: string;
  count: number;
  avgDaysInStage: number | null;
  conversionRate: number | null; // Percentage that moved to next stage
  dropOffRate: number | null; // Percentage that were rejected/withdrawn
  oldestDays: number | null;
  accentColor: string;
}

export const PipelineColumnTooltipContent: Component<PipelineColumnTooltipContentProps> = (
  props
) => (
  <div style={{ 'min-width': '220px' }}>
    {/* Header with accent */}
    <div
      style={{
        display: 'flex',
        'align-items': 'center',
        gap: '10px',
        'margin-bottom': '14px',
        'padding-bottom': '12px',
        'border-bottom': `2px solid ${props.accentColor}40`,
      }}
    >
      <div
        style={{
          width: '10px',
          height: '10px',
          'border-radius': '50%',
          background: props.accentColor,
          'box-shadow': `0 0 8px ${props.accentColor}60`,
        }}
      />
      <span style={{ 'font-weight': '600', 'font-size': '15px', color: '#FFFFFF' }}>
        {props.status}
      </span>
      <span
        style={{
          'margin-left': 'auto',
          'font-size': '20px',
          'font-weight': '700',
          color: props.accentColor,
        }}
      >
        {props.count}
      </span>
    </div>

    {/* Metrics */}
    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '10px' }}>
      <Show when={props.avgDaysInStage !== null}>
        <div style={{ display: 'flex', 'justify-content': 'space-between' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.65)', 'font-size': '13px' }}>
            Avg. time in stage
          </span>
          <span style={{ 'font-weight': '600', 'font-size': '14px', color: '#FFFFFF' }}>
            {props.avgDaysInStage} {props.avgDaysInStage === 1 ? 'day' : 'days'}
          </span>
        </div>
      </Show>

      <Show when={props.conversionRate !== null}>
        <div style={{ display: 'flex', 'justify-content': 'space-between' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.65)', 'font-size': '13px' }}>
            Conversion rate
          </span>
          <span
            style={{
              'font-weight': '600',
              'font-size': '14px',
              color: props.conversionRate! >= 50 ? '#10B981' : '#F59E0B',
            }}
          >
            {props.conversionRate}%
          </span>
        </div>
      </Show>

      <Show when={props.dropOffRate !== null && props.dropOffRate > 0}>
        <div style={{ display: 'flex', 'justify-content': 'space-between' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.65)', 'font-size': '13px' }}>Drop-off</span>
          <span style={{ 'font-weight': '600', 'font-size': '14px', color: '#EF4444' }}>
            {props.dropOffRate}%
          </span>
        </div>
      </Show>

      <Show when={props.oldestDays !== null && props.oldestDays > 7}>
        <div style={{ display: 'flex', 'justify-content': 'space-between' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.65)', 'font-size': '13px' }}>
            Oldest entry
          </span>
          <span
            style={{
              'font-weight': '600',
              'font-size': '14px',
              color: props.oldestDays! >= 14 ? '#EF4444' : '#F59E0B',
            }}
          >
            {props.oldestDays} days
          </span>
        </div>
      </Show>
    </div>

    {/* Empty state message */}
    <Show when={props.count === 0}>
      <div
        style={{
          'text-align': 'center',
          color: 'rgba(255, 255, 255, 0.45)',
          'font-size': '13px',
          padding: '10px 0',
        }}
      >
        No applications in this stage
      </div>
    </Show>
  </div>
);

interface ApplicationTooltipContentProps {
  companyName: string;
  roleName: string;
  daysInCurrentStatus: number;
  status: string;
  score?: number;
  nextAction?: string;
  accentColor: string;
  salary?: string | null;
  location?: string;
  locationType?: 'remote' | 'hybrid' | 'onsite';
}

export const ApplicationTooltipContent: Component<ApplicationTooltipContentProps> = (props) => (
  <div style={{ 'min-width': '200px' }}>
    {/* Header */}
    <div style={{ 'margin-bottom': '12px' }}>
      <div
        style={{
          'font-weight': '600',
          'font-size': '15px',
          color: '#FFFFFF',
          'margin-bottom': '4px',
        }}
      >
        {props.roleName}
      </div>
      <div style={{ 'font-size': '13px', color: 'rgba(255, 255, 255, 0.65)' }}>
        {props.companyName}
      </div>
    </div>

    {/* Status bar */}
    <div
      style={{
        display: 'flex',
        'align-items': 'center',
        gap: '10px',
        'margin-bottom': '12px',
        padding: '8px 12px',
        background: `${props.accentColor}15`,
        'border-radius': '8px',
        border: `1px solid ${props.accentColor}30`,
      }}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          'border-radius': '50%',
          background: props.accentColor,
        }}
      />
      <span style={{ 'font-size': '13px', color: props.accentColor, 'font-weight': '600' }}>
        {props.status}
      </span>
      <span style={{ 'margin-left': 'auto', 'font-size': '13px', color: 'rgba(255,255,255,0.55)' }}>
        {props.daysInCurrentStatus}d ago
      </span>
    </div>

    {/* Metadata grid */}
    <div style={{ display: 'grid', gap: '8px', 'margin-bottom': '8px' }}>
      {/* Location */}
      <Show when={props.location || props.locationType}>
        <div style={{ display: 'flex', 'justify-content': 'space-between' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.65)', 'font-size': '13px' }}>Location</span>
          <span style={{ 'font-size': '13px', color: '#FFFFFF', 'font-weight': '500' }}>
            {props.location || props.locationType || 'Not specified'}
          </span>
        </div>
      </Show>

      {/* Salary */}
      <Show when={props.salary}>
        <div style={{ display: 'flex', 'justify-content': 'space-between' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.65)', 'font-size': '13px' }}>Salary</span>
          <span style={{ 'font-size': '13px', color: '#22C55E', 'font-weight': '600' }}>
            {props.salary}
          </span>
        </div>
      </Show>

      {/* Score if available */}
      <Show when={props.score !== undefined}>
        <div style={{ display: 'flex', 'justify-content': 'space-between' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.65)', 'font-size': '13px' }}>
            Match Score
          </span>
          <span
            style={{
              'font-weight': '600',
              'font-size': '14px',
              color: props.score! >= 70 ? '#10B981' : props.score! >= 50 ? '#F59E0B' : '#EF4444',
            }}
          >
            {props.score}%
          </span>
        </div>
      </Show>
    </div>

    {/* Next action suggestion */}
    <Show when={props.nextAction}>
      <div
        style={{
          'margin-top': '10px',
          'padding-top': '10px',
          'border-top': '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          'align-items': 'center',
          gap: '8px',
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke={props.accentColor}
          stroke-width="2"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
        <span style={{ 'font-size': '13px', color: props.accentColor }}>{props.nextAction}</span>
      </div>
    </Show>
  </div>
);

export default Tooltip;
