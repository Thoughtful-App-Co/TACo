/**
 * AggregationAccordion - Expandable/collapsible group container for aggregated views
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, JSX, Show } from 'solid-js';
import { liquidTenure, pipelineAnimations } from '../theme/liquid-tenure';

interface AggregationAccordionProps {
  title: string;
  count: number;
  children: JSX.Element;
  defaultExpanded?: boolean;
  accentColor?: string;
  currentTheme?: () => Partial<typeof liquidTenure> & typeof liquidTenure;
}

export const AggregationAccordion: Component<AggregationAccordionProps> = (props) => {
  const [isExpanded, setIsExpanded] = createSignal(props.defaultExpanded ?? false);
  const theme = () => props.currentTheme?.() || liquidTenure;
  const accentColor = () => props.accentColor || theme().colors.primary;

  const toggleExpanded = () => setIsExpanded(!isExpanded());

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.8), rgba(20, 20, 25, 0.9))',
        border: `1px solid ${theme().colors.border}`,
        'border-radius': '12px',
        overflow: 'hidden',
        transition: `all ${pipelineAnimations.normal}`,
        'box-shadow': isExpanded()
          ? `0 4px 20px rgba(0, 0, 0, 0.2), 0 0 0 1px ${accentColor()}20`
          : '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Accordion Header */}
      <button
        onClick={toggleExpanded}
        style={{
          width: '100%',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          padding: '16px 20px',
          background: isExpanded()
            ? `linear-gradient(135deg, ${accentColor()}15, ${accentColor()}08)`
            : 'transparent',
          border: 'none',
          'border-bottom': isExpanded() ? `1px solid ${theme().colors.border}` : 'none',
          cursor: 'pointer',
          transition: `all ${pipelineAnimations.fast}`,
        }}
        onMouseEnter={(e) => {
          if (!isExpanded()) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded()) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        {/* Left: Chevron + Title */}
        <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
          {/* Chevron Icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={accentColor()}
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            style={{
              transform: isExpanded() ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: `transform ${pipelineAnimations.fast}`,
              'flex-shrink': '0',
            }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>

          {/* Title */}
          <span
            style={{
              'font-size': '16px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              'font-weight': '600',
              color: theme().colors.text,
              'text-align': 'left',
            }}
          >
            {props.title}
          </span>
        </div>

        {/* Right: Count Badge */}
        <div
          style={{
            padding: '6px 14px',
            background: `${accentColor()}25`,
            border: `1px solid ${accentColor()}40`,
            'border-radius': '12px',
            'font-size': '14px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            'font-weight': '700',
            color: accentColor(),
            'min-width': '36px',
            'text-align': 'center',
          }}
        >
          {props.count}
        </div>
      </button>

      {/* Accordion Content */}
      <Show when={isExpanded()}>
        <div
          style={{
            padding: '16px',
            animation: 'accordion-slide-down 0.3s ease-out',
          }}
        >
          {props.children}
        </div>
      </Show>
    </div>
  );
};

export default AggregationAccordion;
