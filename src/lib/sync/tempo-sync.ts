/**
 * Tempo Sync Integration
 *
 * Connects SyncManager to Tempo's localStorage stores.
 * Provides a singleton sync manager for the Tempo app.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { createSignal, createEffect, onCleanup } from 'solid-js';
import { SyncManager } from './SyncManager';
import type { SyncState } from './types';
import { canUseTempoSync } from '../feature-gates';
import { logger } from '../logger';

// ============================================================================
// TEMPO DATA SHAPE
// ============================================================================

/**
 * All Tempo data that gets synced
 */
export interface TempoSyncData {
  // Sessions (keyed by date, e.g., "2025-01-15")
  sessions: Record<string, unknown>;

  // Queue tasks (from QueueService)
  queueTasks: unknown[];

  // Queue settings
  queueSettings: unknown;

  // Tasks from TaskPersistenceService
  tasks: unknown[];

  // Debrief data
  debriefs: unknown[];
}

// ============================================================================
// STORAGE KEYS (must match the actual Tempo storage)
// ============================================================================

const STORAGE_KEYS = {
  sessionPrefix: 'session-', // Sessions are stored with prefix: session-{date}
  queueTasks: 'tempo_queue_tasks',
  queueSettings: 'tempo_queue_settings',
  tasks: 'tempo_tasks',
  debriefs: 'torodoro-session-debriefs',
};

// ============================================================================
// DATA COLLECTION
// ============================================================================

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    logger.sync.error(`Failed to load ${key} from storage:`, e);
  }
  return defaultValue;
}

function saveToStorage(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    logger.sync.error(`Failed to save ${key} to storage:`, e);
  }
}

/**
 * Collect all sessions from localStorage (they use prefix-based keys)
 */
function getAllSessions(): Record<string, unknown> {
  const sessions: Record<string, unknown> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEYS.sessionPrefix)) {
        const date = key.replace(STORAGE_KEYS.sessionPrefix, '');
        // Skip timer-only keys
        if (date.endsWith('-timer')) continue;
        const data = localStorage.getItem(key);
        if (data) {
          sessions[date] = JSON.parse(data);
        }
      }
    }
  } catch (e) {
    logger.sync.error('Failed to load sessions from storage:', e);
  }
  return sessions;
}

/**
 * Save all sessions to localStorage
 */
function setAllSessions(sessions: Record<string, unknown>): void {
  // First, collect existing session keys to remove stale ones
  const existingKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_KEYS.sessionPrefix) && !key.endsWith('-timer')) {
      existingKeys.push(key);
    }
  }

  // Remove sessions that are not in the new data
  for (const key of existingKeys) {
    const date = key.replace(STORAGE_KEYS.sessionPrefix, '');
    if (!(date in sessions)) {
      localStorage.removeItem(key);
    }
  }

  // Save all sessions from synced data
  for (const [date, session] of Object.entries(sessions)) {
    const key = `${STORAGE_KEYS.sessionPrefix}${date}`;
    saveToStorage(key, session);
  }
}

/**
 * Collect all Tempo data from localStorage
 */
function getTempoData(): TempoSyncData {
  return {
    sessions: getAllSessions(),
    queueTasks: loadFromStorage(STORAGE_KEYS.queueTasks, []),
    queueSettings: loadFromStorage(STORAGE_KEYS.queueSettings, {}),
    tasks: loadFromStorage(STORAGE_KEYS.tasks, []),
    debriefs: loadFromStorage(STORAGE_KEYS.debriefs, []),
  };
}

/**
 * Apply synced data to localStorage
 */
function setTempoData(data: TempoSyncData): void {
  if (data.sessions !== undefined) {
    setAllSessions(data.sessions);
  }
  if (data.queueTasks !== undefined) {
    saveToStorage(STORAGE_KEYS.queueTasks, data.queueTasks);
  }
  if (data.queueSettings !== undefined) {
    saveToStorage(STORAGE_KEYS.queueSettings, data.queueSettings);
  }
  if (data.tasks !== undefined) {
    saveToStorage(STORAGE_KEYS.tasks, data.tasks);
  }
  if (data.debriefs !== undefined) {
    saveToStorage(STORAGE_KEYS.debriefs, data.debriefs);
  }

  // Trigger a storage event so reactive stores can update
  window.dispatchEvent(new StorageEvent('storage', { key: 'tempo_sync_updated' }));

  logger.sync.info('Tempo data applied from sync');
}

// ============================================================================
// SINGLETON SYNC MANAGER
// ============================================================================

let tempoSyncManager: SyncManager<TempoSyncData> | null = null;

/**
 * Get or create the Tempo sync manager
 */
export function getTempoSyncManager(): SyncManager<TempoSyncData> | null {
  // Check subscription
  const access = canUseTempoSync();
  if (!access.allowed) {
    logger.sync.debug('Tempo sync not available:', access.reason);
    return null;
  }

  if (!tempoSyncManager) {
    tempoSyncManager = new SyncManager<TempoSyncData>('tempo', getTempoData, setTempoData);
  }

  return tempoSyncManager;
}

/**
 * Destroy the sync manager (for cleanup)
 */
export function destroyTempoSyncManager(): void {
  if (tempoSyncManager) {
    tempoSyncManager.destroy();
    tempoSyncManager = null;
  }
}

// ============================================================================
// REACTIVE SYNC STATE (SolidJS)
// ============================================================================

/**
 * Create reactive sync state for use in components
 */
export function useTempoSync() {
  const [syncState, setSyncState] = createSignal<SyncState | null>(null);
  const [isEnabled, setIsEnabled] = createSignal(false);

  createEffect(() => {
    const manager = getTempoSyncManager();

    if (!manager) {
      setIsEnabled(false);
      setSyncState(null);
      return;
    }

    setIsEnabled(true);
    setSyncState(manager.getState());

    // Subscribe to state changes
    const unsubscribe = manager.onStatusChange((state) => {
      setSyncState(state);
    });

    // Initialize sync
    manager.init();

    onCleanup(() => {
      unsubscribe();
    });
  });

  return {
    state: syncState,
    isEnabled,

    /**
     * Trigger a sync now
     */
    syncNow: async () => {
      const manager = getTempoSyncManager();
      if (manager) {
        await manager.push();
      }
    },

    /**
     * Resolve a conflict
     */
    resolveConflict: async (choice: 'local' | 'remote') => {
      const manager = getTempoSyncManager();
      if (manager) {
        await manager.resolveConflict(choice);
      }
    },

    /**
     * Schedule a push (call this when data changes)
     */
    schedulePush: () => {
      const manager = getTempoSyncManager();
      if (manager) {
        manager.schedulePush();
      }
    },
  };
}

/**
 * Helper to notify sync manager of data changes
 * Call this from stores when data is modified
 */
export function notifyTempoDataChanged(): void {
  const manager = getTempoSyncManager();
  if (manager) {
    manager.schedulePush();
  }
}
