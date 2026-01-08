/**
 * ViewHeader - Persistent navigation header for Echoprax views
 *
 * Provides consistent back navigation across all sub-views.
 * Mobile-first with proper touch targets.
 *
 * Memphis x Retro-Futurism Design
 */

import { Component, JSX, Show } from 'solid-js';
import { CaretLeft } from 'phosphor-solid';
import {
  echoprax,
  memphisColors,
  glassButton,
  typography,
  touchTargets,
} from '../../../theme/echoprax';

export interface ViewHeaderProps {
  /** Title displayed in the center */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Callback when back button is pressed */
  onBack?: () => void;
  /** Hide the back button (for root views) */
  hideBack?: boolean;
  /** Optional right-side action element */
  rightAction?: JSX.Element;
  /** Optional accent color for the title */
  titleColor?: string;
  /** Make header transparent (for overlay on content) */
  transparent?: boolean;
}

export const ViewHeader: Component<ViewHeaderProps> = (props) => {
  return (
    <header
      style={{
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'space-between',
        padding: `${echoprax.spacing.sm} ${echoprax.spacing.md}`,
        'min-height': touchTargets.primary,
        background: props.transparent ? 'transparent' : echoprax.colors.background,
        position: 'relative',
        'z-index': 10,
        // Subtle bottom border when not transparent
        'border-bottom': props.transparent ? 'none' : `1px solid ${echoprax.colors.border}`,
      }}
    >
      {/* Left: Back Button */}
      <div
        style={{
          'min-width': touchTargets.secondary,
          display: 'flex',
          'align-items': 'center',
        }}
      >
        <Show when={!props.hideBack && props.onBack}>
          <button
            type="button"
            onClick={() => props.onBack?.()}
            class="echoprax-glass-btn"
            aria-label="Go back"
            style={{
              ...glassButton.default,
              border: 'none',
              'border-radius': echoprax.radii.md,
              width: touchTargets.secondary,
              height: touchTargets.secondary,
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              cursor: 'pointer',
              color: echoprax.colors.text,
              padding: 0,
            }}
          >
            <CaretLeft size={24} weight="bold" />
          </button>
        </Show>
      </div>

      {/* Center: Title */}
      <div
        style={{
          flex: 1,
          'text-align': 'center',
          'min-width': 0, // Allow text truncation
          padding: `0 ${echoprax.spacing.sm}`,
        }}
      >
        <h1
          style={{
            ...typography.headingSm,
            color: props.titleColor || echoprax.colors.text,
            margin: 0,
            'white-space': 'nowrap',
            overflow: 'hidden',
            'text-overflow': 'ellipsis',
          }}
        >
          {props.title}
        </h1>
        <Show when={props.subtitle}>
          <p
            style={{
              ...typography.caption,
              color: echoprax.colors.textMuted,
              margin: `${echoprax.spacing.xs} 0 0`,
            }}
          >
            {props.subtitle}
          </p>
        </Show>
      </div>

      {/* Right: Action Slot */}
      <div
        style={{
          'min-width': touchTargets.secondary,
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'flex-end',
        }}
      >
        {props.rightAction}
      </div>
    </header>
  );
};

/**
 * Compact ViewHeader variant for session player
 * Shows minimal chrome during active workout
 */
export interface SessionHeaderProps {
  /** Workout name */
  title: string;
  /** BPM range label */
  bpmLabel?: string;
  /** Elapsed time display */
  elapsedTime?: string;
  /** Exit button handler */
  onExit?: () => void;
  /** Current session state for color theming */
  stateColor?: string;
}

export const SessionHeader: Component<SessionHeaderProps> = (props) => {
  return (
    <header
      style={{
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'space-between',
        padding: `${echoprax.spacing.sm} ${echoprax.spacing.md}`,
        gap: echoprax.spacing.sm,
        'min-height': touchTargets.minimum,
      }}
    >
      {/* Exit Button */}
      <Show when={props.onExit}>
        <button
          type="button"
          onClick={() => props.onExit?.()}
          class="echoprax-glass-btn"
          aria-label="Exit workout"
          style={{
            ...glassButton.default,
            border: 'none',
            'border-radius': echoprax.radii.sm,
            width: touchTargets.minimum,
            height: touchTargets.minimum,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            cursor: 'pointer',
            color: memphisColors.coral,
            padding: 0,
            'flex-shrink': 0,
          }}
        >
          <CaretLeft size={20} weight="bold" />
        </button>
      </Show>

      {/* Title & BPM */}
      <div
        style={{
          flex: 1,
          'min-width': 0,
          overflow: 'hidden',
        }}
      >
        <h1
          style={{
            ...typography.bodySm,
            'font-weight': '600',
            color: echoprax.colors.text,
            margin: 0,
            'white-space': 'nowrap',
            overflow: 'hidden',
            'text-overflow': 'ellipsis',
          }}
        >
          {props.title}
        </h1>
        <Show when={props.bpmLabel}>
          <p
            style={{
              ...typography.caption,
              color: props.stateColor || memphisColors.acidYellow,
              margin: 0,
            }}
          >
            {props.bpmLabel}
          </p>
        </Show>
      </div>

      {/* Elapsed Time */}
      <Show when={props.elapsedTime}>
        <div
          aria-live="polite"
          aria-label={`Elapsed time: ${props.elapsedTime}`}
          style={{
            ...typography.headingSm,
            'font-size': '1rem',
            color: props.stateColor || memphisColors.electricBlue,
            'flex-shrink': 0,
            'font-variant-numeric': 'tabular-nums',
          }}
        >
          {props.elapsedTime}
        </div>
      </Show>
    </header>
  );
};
