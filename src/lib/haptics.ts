/**
 * Haptic Feedback Utilities
 *
 * Provides native-like haptic feedback for mobile interactions.
 * Uses the Vibration API where supported, falls back gracefully.
 *
 * Usage:
 * ```tsx
 * import { haptics } from '@/lib/haptics';
 *
 * // Light tap feedback
 * haptics.light();
 *
 * // Medium impact
 * haptics.medium();
 *
 * // Success feedback
 * haptics.success();
 *
 * // Error feedback
 * haptics.error();
 * ```
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { logger } from './logger';

// ==========================================================================
// TYPES
// ==========================================================================

type HapticPattern = number | number[];

interface HapticOptions {
  /** Whether haptics are enabled (default: true) */
  enabled?: boolean;
}

// ==========================================================================
// STATE
// ==========================================================================

let hapticsEnabled = true;

// Check for Vibration API support
const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

// ==========================================================================
// CORE FUNCTIONS
// ==========================================================================

/**
 * Trigger a vibration pattern.
 * @param pattern - Duration in ms or array of durations [vibrate, pause, vibrate, ...]
 */
function vibrate(pattern: HapticPattern): boolean {
  if (!hapticsEnabled || !isSupported) {
    return false;
  }

  try {
    return navigator.vibrate(pattern);
  } catch (error) {
    logger.features.warn('Haptic feedback failed:', error);
    return false;
  }
}

/**
 * Cancel any ongoing vibration.
 */
function cancel(): boolean {
  if (!isSupported) return false;

  try {
    return navigator.vibrate(0);
  } catch {
    return false;
  }
}

// ==========================================================================
// HAPTIC PATTERNS
// ==========================================================================

/**
 * Light tap - subtle feedback for standard interactions.
 * Duration: 10ms
 */
function light(): boolean {
  return vibrate(10);
}

/**
 * Medium tap - noticeable feedback for selections.
 * Duration: 20ms
 */
function medium(): boolean {
  return vibrate(20);
}

/**
 * Heavy tap - strong feedback for important actions.
 * Duration: 40ms
 */
function heavy(): boolean {
  return vibrate(40);
}

/**
 * Success pattern - positive feedback.
 * Pattern: short-pause-short
 */
function success(): boolean {
  return vibrate([10, 50, 10]);
}

/**
 * Warning pattern - cautionary feedback.
 * Pattern: medium-pause-short
 */
function warning(): boolean {
  return vibrate([20, 100, 10]);
}

/**
 * Error pattern - negative feedback.
 * Pattern: long-pause-long
 */
function error(): boolean {
  return vibrate([40, 100, 40]);
}

/**
 * Selection changed - feedback for list selections, toggles.
 * Duration: 5ms (very subtle)
 */
function selection(): boolean {
  return vibrate(5);
}

/**
 * Impact - strong single impact for button presses.
 * Duration: 15ms
 */
function impact(): boolean {
  return vibrate(15);
}

// ==========================================================================
// CONFIGURATION
// ==========================================================================

/**
 * Enable or disable haptic feedback globally.
 * Useful for user preferences.
 */
function setEnabled(enabled: boolean): void {
  hapticsEnabled = enabled;
  logger.features.debug(`Haptics ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Check if haptics are currently enabled.
 */
function getEnabled(): boolean {
  return hapticsEnabled;
}

/**
 * Check if the device supports haptic feedback.
 */
function getSupported(): boolean {
  return isSupported;
}

// ==========================================================================
// EXPORT
// ==========================================================================

export const haptics = {
  // Patterns
  light,
  medium,
  heavy,
  success,
  warning,
  error,
  selection,
  impact,

  // Control
  cancel,
  setEnabled,
  getEnabled,
  getSupported,

  // Direct vibrate (for custom patterns)
  vibrate,
} as const;

export default haptics;
