/**
 * Notification Interaction Store - Track user interactions with notifications
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { createStore } from 'solid-js/store';
import { NotificationInteraction, JobApplication } from '../../../../schemas/pipeline.schema';

// ============================================================================
// STORAGE KEY
// ============================================================================

const STORAGE_KEY = 'augment_notification_interactions';

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface NotificationInteractionsState {
  interactions: Map<string, NotificationInteraction>; // key = applicationId
}

// ============================================================================
// HELPERS
// ============================================================================

function loadFromStorage(): Map<string, NotificationInteraction> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const map = new Map<string, NotificationInteraction>();

      // Convert array to Map and revive dates
      for (const [key, value] of Object.entries(parsed)) {
        const interaction = value as any;
        map.set(key, {
          ...interaction,
          lastViewedAt: interaction.lastViewedAt ? new Date(interaction.lastViewedAt) : undefined,
          dismissedAt: interaction.dismissedAt ? new Date(interaction.dismissedAt) : undefined,
          lastActivitySeenAt: interaction.lastActivitySeenAt
            ? new Date(interaction.lastActivitySeenAt)
            : undefined,
        });
      }

      return map;
    }
  } catch (e) {
    console.error('Failed to load notification interactions:', e);
  }
  return new Map();
}

function saveToStorage(interactions: Map<string, NotificationInteraction>) {
  try {
    // Convert Map to object for JSON serialization
    const obj: Record<string, NotificationInteraction> = {};
    for (const [key, value] of interactions.entries()) {
      obj[key] = value;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (e) {
    console.error('Failed to save notification interactions:', e);
  }
}

// ============================================================================
// CREATE STORE
// ============================================================================

const [state, setState] = createStore<NotificationInteractionsState>({
  interactions: loadFromStorage(),
});

// Persist to localStorage on changes
const persistToStorage = () => {
  saveToStorage(state.interactions);
};

// ============================================================================
// STORE ACTIONS
// ============================================================================

export const notificationInteractionStore = {
  state,

  /**
   * Get interaction data for an application
   */
  getInteraction: (applicationId: string): NotificationInteraction | undefined => {
    return state.interactions.get(applicationId);
  },

  /**
   * Check if a notification is "new" (not viewed since last activity)
   */
  isNew: (application: JobApplication): boolean => {
    const interaction = state.interactions.get(application.id);

    // No interaction record = new
    if (!interaction) return true;

    // Dismissed = not new (until next activity)
    if (interaction.dismissedAt) {
      // Check if there's been activity since dismissal
      if (interaction.lastActivitySeenAt) {
        return new Date(application.lastActivityAt) > interaction.lastActivitySeenAt;
      }
      return false;
    }

    // Not viewed yet = new
    if (!interaction.lastViewedAt) return true;

    // Viewed, but has there been activity since?
    if (interaction.lastActivitySeenAt) {
      return new Date(application.lastActivityAt) > interaction.lastActivitySeenAt;
    }

    return false;
  },

  /**
   * Check if a notification is dismissed and should be hidden
   */
  isDismissed: (application: JobApplication): boolean => {
    const interaction = state.interactions.get(application.id);
    if (!interaction || !interaction.dismissedAt) return false;

    // If dismissed, check if there's been new activity since
    if (interaction.lastActivitySeenAt) {
      return new Date(application.lastActivityAt) <= interaction.lastActivitySeenAt;
    }

    return true;
  },

  /**
   * Mark a notification as viewed
   */
  markAsViewed: (application: JobApplication) => {
    const now = new Date();
    const existing = state.interactions.get(application.id);

    const updated: NotificationInteraction = {
      applicationId: application.id,
      lastViewedAt: now,
      lastActivitySeenAt: application.lastActivityAt,
      dismissedAt: existing?.dismissedAt,
      snoozeCount: existing?.snoozeCount || 0,
      viewCount: (existing?.viewCount || 0) + 1,
    };

    setState('interactions', (prev) => {
      const next = new Map(prev);
      next.set(application.id, updated);
      return next;
    });

    persistToStorage();
  },

  /**
   * Mark a notification as dismissed (won't show again until new activity)
   */
  dismiss: (application: JobApplication) => {
    const now = new Date();
    const existing = state.interactions.get(application.id);

    const updated: NotificationInteraction = {
      applicationId: application.id,
      lastViewedAt: existing?.lastViewedAt || now,
      dismissedAt: now,
      lastActivitySeenAt: application.lastActivityAt,
      snoozeCount: existing?.snoozeCount || 0,
      viewCount: existing?.viewCount || 0,
    };

    setState('interactions', (prev) => {
      const next = new Map(prev);
      next.set(application.id, updated);
      return next;
    });

    persistToStorage();
  },

  /**
   * Increment snooze count for an application
   */
  incrementSnoozeCount: (applicationId: string) => {
    const existing = state.interactions.get(applicationId);

    const updated: NotificationInteraction = {
      applicationId,
      lastViewedAt: existing?.lastViewedAt,
      dismissedAt: existing?.dismissedAt,
      lastActivitySeenAt: existing?.lastActivitySeenAt,
      snoozeCount: (existing?.snoozeCount || 0) + 1,
      viewCount: existing?.viewCount || 0,
    };

    setState('interactions', (prev) => {
      const next = new Map(prev);
      next.set(applicationId, updated);
      return next;
    });

    persistToStorage();
  },

  /**
   * Clear dismissed state (show notification again)
   */
  undismiss: (applicationId: string) => {
    setState('interactions', (prev) => {
      const next = new Map(prev);
      const existing = next.get(applicationId);
      if (existing) {
        next.set(applicationId, {
          ...existing,
          dismissedAt: undefined,
        });
      }
      return next;
    });

    persistToStorage();
  },

  /**
   * Get count of new (unviewed) notifications
   */
  getNewCount: (applications: JobApplication[]): number => {
    return applications.filter(
      (app) =>
        notificationInteractionStore.isNew(app) && !notificationInteractionStore.isDismissed(app)
    ).length;
  },

  /**
   * Clear all interactions (for testing/reset)
   */
  clearAll: () => {
    setState('interactions', new Map());
    localStorage.removeItem(STORAGE_KEY);
  },
};

export default notificationInteractionStore;
