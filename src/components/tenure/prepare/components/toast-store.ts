/**
 * Toast Store - SolidJS reactive store for toast notifications
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { createStore } from 'solid-js/store';

// ============================================================================
// TYPES
// ============================================================================

export type ToastType = 'info' | 'success' | 'error' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // milliseconds, undefined = no auto-dismiss
  showProgress?: boolean;
  progress?: number; // 0-100 for progress bar
}

interface ToastStoreState {
  toasts: Toast[];
  primaryColor: string; // Dynamic theme color for loading toasts
}

// ============================================================================
// HELPERS
// ============================================================================

const generateId = (): string => {
  return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// ============================================================================
// CREATE STORE
// ============================================================================

const [state, setState] = createStore<ToastStoreState>({
  toasts: [],
  primaryColor: '#8B5CF6', // Default purple, can be overridden
});

// Auto-dismiss timers
const dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

// ============================================================================
// STORE ACTIONS
// ============================================================================

export const toastStore = {
  // Expose state
  state,

  // -------------------------------------------------------------------------
  // CORE ACTIONS
  // -------------------------------------------------------------------------

  /**
   * Show a toast notification
   * @param options Toast options
   * @returns The toast ID (useful for updating/dismissing)
   */
  show: (options: Omit<Toast, 'id'> & { id?: string }): string => {
    const id = options.id || generateId();

    // Remove existing toast with same ID if present
    const existingIndex = state.toasts.findIndex((t) => t.id === id);
    if (existingIndex !== -1) {
      // Clear existing timer
      const existingTimer = dismissTimers.get(id);
      if (existingTimer) {
        clearTimeout(existingTimer);
        dismissTimers.delete(id);
      }
      // Remove existing toast
      setState('toasts', (toasts) => toasts.filter((t) => t.id !== id));
    }

    const toast: Toast = {
      id,
      type: options.type,
      message: options.message,
      duration: options.duration,
      showProgress: options.showProgress,
      progress: options.progress,
    };

    // Add toast
    setState('toasts', (toasts) => [...toasts, toast]);

    // Set up auto-dismiss for non-loading toasts
    if (toast.type !== 'loading' && toast.duration !== undefined && toast.duration > 0) {
      const timer = setTimeout(() => {
        toastStore.dismiss(id);
      }, toast.duration);
      dismissTimers.set(id, timer);
    }

    return id;
  },

  /**
   * Dismiss a toast by ID
   */
  dismiss: (id: string): void => {
    // Clear timer if exists
    const timer = dismissTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      dismissTimers.delete(id);
    }

    setState('toasts', (toasts) => toasts.filter((t) => t.id !== id));
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: (): void => {
    // Clear all timers
    dismissTimers.forEach((timer) => clearTimeout(timer));
    dismissTimers.clear();

    setState('toasts', []);
  },

  /**
   * Update an existing toast
   */
  update: (id: string, updates: Partial<Omit<Toast, 'id'>>): void => {
    setState(
      'toasts',
      (t) => t.id === id,
      (toast) => ({ ...toast, ...updates })
    );

    // If type changed from loading to something else, set up auto-dismiss
    const updatedToast = state.toasts.find((t) => t.id === id);
    if (updatedToast && updates.type && updates.type !== 'loading') {
      const duration = updates.duration ?? updatedToast.duration ?? 5000;
      if (duration > 0) {
        // Clear existing timer
        const existingTimer = dismissTimers.get(id);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }
        // Set new timer
        const timer = setTimeout(() => {
          toastStore.dismiss(id);
        }, duration);
        dismissTimers.set(id, timer);
      }
    }
  },

  /**
   * Update progress for a toast
   */
  setProgress: (id: string, progress: number): void => {
    setState('toasts', (t) => t.id === id, 'progress', Math.min(100, Math.max(0, progress)));
  },

  /**
   * Set the primary color for loading toasts
   */
  setPrimaryColor: (color: string): void => {
    setState('primaryColor', color);
  },

  // -------------------------------------------------------------------------
  // CONVENIENCE METHODS
  // -------------------------------------------------------------------------

  /**
   * Show an info toast
   */
  info: (message: string, duration: number = 5000): string => {
    return toastStore.show({ type: 'info', message, duration });
  },

  /**
   * Show a success toast
   */
  success: (message: string, duration: number = 5000): string => {
    return toastStore.show({ type: 'success', message, duration });
  },

  /**
   * Show an error toast
   */
  error: (message: string, duration: number = 7000): string => {
    return toastStore.show({ type: 'error', message, duration });
  },

  /**
   * Show a loading toast (does not auto-dismiss)
   */
  loading: (message: string, options?: { showProgress?: boolean; id?: string }): string => {
    return toastStore.show({
      type: 'loading',
      message,
      showProgress: options?.showProgress,
      id: options?.id,
    });
  },

  /**
   * Show a loading toast and return a promise helper
   * Usage: const { success, error, update } = toast.promise('Loading...')
   */
  promise: (
    message: string,
    options?: { showProgress?: boolean }
  ): {
    id: string;
    success: (successMessage: string, duration?: number) => void;
    error: (errorMessage: string, duration?: number) => void;
    update: (newMessage: string) => void;
    setProgress: (progress: number) => void;
    dismiss: () => void;
  } => {
    const id = toastStore.loading(message, options);

    return {
      id,
      success: (successMessage: string, duration: number = 5000) => {
        toastStore.update(id, { type: 'success', message: successMessage, duration });
      },
      error: (errorMessage: string, duration: number = 7000) => {
        toastStore.update(id, { type: 'error', message: errorMessage, duration });
      },
      update: (newMessage: string) => {
        toastStore.update(id, { message: newMessage });
      },
      setProgress: (progress: number) => {
        toastStore.setProgress(id, progress);
      },
      dismiss: () => {
        toastStore.dismiss(id);
      },
    };
  },
};

export default toastStore;
