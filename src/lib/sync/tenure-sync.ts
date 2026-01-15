/**
 * Tenure Sync Integration
 *
 * Connects SyncManager to Tenure's localStorage stores.
 * Provides a singleton sync manager for the Tenure app.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { createSignal, createEffect, onCleanup } from 'solid-js';
import { SyncManager } from './SyncManager';
import type { SyncState } from './types';
import { canUseTenureSync } from '../feature-gates';
import { logger } from '../logger';

// ============================================================================
// TENURE DATA SHAPE
// ============================================================================

/**
 * All Tenure data that gets synced
 */
export interface TenureSyncData {
  // Pipeline/Prospect data
  applications: unknown[];
  profile: unknown | null;
  settings: unknown;

  // Prepare data
  masterResume: unknown | null;
  variants: unknown[];
  wizardState: unknown;
  mutationHistory: unknown[];

  // Prosper data
  salaryHistory: unknown | null;
  checkIns: unknown[];
  accomplishments: unknown[];
  employmentState: unknown;
  reviewCycles: unknown[];
  selfReviews: unknown[];
  externalFeedback: unknown[];
  accolades: unknown[];

  // Discover data
  riasecAnswers: unknown | null;

  // Feature flags
  featureFlags: unknown;
}

// ============================================================================
// STORAGE KEYS (must match the stores)
// ============================================================================

const STORAGE_KEYS = {
  // Pipeline/Prospect
  applications: 'tenure_prospect_applications',
  profile: 'tenure_prospect_profile',
  settings: 'tenure_prospect_settings',

  // Prepare
  masterResume: 'tenure_prepare_master_resume',
  variants: 'tenure_prepare_variants',
  wizardState: 'tenure_prepare_wizard',
  currentVariant: 'tenure_prepare_current_variant',
  mutationHistory: 'tenure_prepare_mutation_history',

  // Prosper
  salaryHistory: 'tenure_prosper_salary_history',
  checkIns: 'tenure_prosper_check_ins',
  accomplishments: 'tenure_prosper_accomplishments',
  employmentState: 'tenure_prosper_employment_state',
  reviewCycles: 'tenure_prosper_review_cycles',
  selfReviews: 'tenure_prosper_self_reviews',
  externalFeedback: 'tenure_prosper_external_feedback',
  accolades: 'tenure_prosper_accolades',

  // Discover
  riasecAnswers: 'tenure_discover_answers',

  // Feature flags
  featureFlags: 'tenure_feature_flags',
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
 * Collect all Tenure data from localStorage
 */
function getTenureData(): TenureSyncData {
  return {
    applications: loadFromStorage(STORAGE_KEYS.applications, []),
    profile: loadFromStorage(STORAGE_KEYS.profile, null),
    settings: loadFromStorage(STORAGE_KEYS.settings, {}),
    masterResume: loadFromStorage(STORAGE_KEYS.masterResume, null),
    variants: loadFromStorage(STORAGE_KEYS.variants, []),
    wizardState: loadFromStorage(STORAGE_KEYS.wizardState, {}),
    mutationHistory: loadFromStorage(STORAGE_KEYS.mutationHistory, []),
    salaryHistory: loadFromStorage(STORAGE_KEYS.salaryHistory, null),
    checkIns: loadFromStorage(STORAGE_KEYS.checkIns, []),
    accomplishments: loadFromStorage(STORAGE_KEYS.accomplishments, []),
    employmentState: loadFromStorage(STORAGE_KEYS.employmentState, {}),
    reviewCycles: loadFromStorage(STORAGE_KEYS.reviewCycles, []),
    selfReviews: loadFromStorage(STORAGE_KEYS.selfReviews, []),
    externalFeedback: loadFromStorage(STORAGE_KEYS.externalFeedback, []),
    accolades: loadFromStorage(STORAGE_KEYS.accolades, []),
    riasecAnswers: loadFromStorage(STORAGE_KEYS.riasecAnswers, null),
    featureFlags: loadFromStorage(STORAGE_KEYS.featureFlags, {}),
  };
}

/**
 * Apply synced data to localStorage
 */
function setTenureData(data: TenureSyncData): void {
  // Only update keys that exist in the incoming data
  if (data.applications !== undefined) {
    saveToStorage(STORAGE_KEYS.applications, data.applications);
  }
  if (data.profile !== undefined) {
    saveToStorage(STORAGE_KEYS.profile, data.profile);
  }
  if (data.settings !== undefined) {
    saveToStorage(STORAGE_KEYS.settings, data.settings);
  }
  if (data.masterResume !== undefined) {
    saveToStorage(STORAGE_KEYS.masterResume, data.masterResume);
  }
  if (data.variants !== undefined) {
    saveToStorage(STORAGE_KEYS.variants, data.variants);
  }
  if (data.wizardState !== undefined) {
    saveToStorage(STORAGE_KEYS.wizardState, data.wizardState);
  }
  if (data.mutationHistory !== undefined) {
    saveToStorage(STORAGE_KEYS.mutationHistory, data.mutationHistory);
  }
  if (data.salaryHistory !== undefined) {
    saveToStorage(STORAGE_KEYS.salaryHistory, data.salaryHistory);
  }
  if (data.checkIns !== undefined) {
    saveToStorage(STORAGE_KEYS.checkIns, data.checkIns);
  }
  if (data.accomplishments !== undefined) {
    saveToStorage(STORAGE_KEYS.accomplishments, data.accomplishments);
  }
  if (data.employmentState !== undefined) {
    saveToStorage(STORAGE_KEYS.employmentState, data.employmentState);
  }
  if (data.reviewCycles !== undefined) {
    saveToStorage(STORAGE_KEYS.reviewCycles, data.reviewCycles);
  }
  if (data.selfReviews !== undefined) {
    saveToStorage(STORAGE_KEYS.selfReviews, data.selfReviews);
  }
  if (data.externalFeedback !== undefined) {
    saveToStorage(STORAGE_KEYS.externalFeedback, data.externalFeedback);
  }
  if (data.accolades !== undefined) {
    saveToStorage(STORAGE_KEYS.accolades, data.accolades);
  }
  if (data.riasecAnswers !== undefined) {
    saveToStorage(STORAGE_KEYS.riasecAnswers, data.riasecAnswers);
  }
  if (data.featureFlags !== undefined) {
    saveToStorage(STORAGE_KEYS.featureFlags, data.featureFlags);
  }

  // Trigger a storage event so reactive stores can update
  window.dispatchEvent(new StorageEvent('storage', { key: 'tenure_sync_updated' }));

  logger.sync.info('Tenure data applied from sync');
}

// ============================================================================
// SINGLETON SYNC MANAGER
// ============================================================================

let tenureSyncManager: SyncManager<TenureSyncData> | null = null;

/**
 * Get or create the Tenure sync manager
 */
export function getTenureSyncManager(): SyncManager<TenureSyncData> | null {
  // Check subscription
  const access = canUseTenureSync();
  if (!access.allowed) {
    logger.sync.debug('Tenure sync not available:', access.reason);
    return null;
  }

  if (!tenureSyncManager) {
    tenureSyncManager = new SyncManager<TenureSyncData>('tenure', getTenureData, setTenureData);
  }

  return tenureSyncManager;
}

/**
 * Destroy the sync manager (for cleanup)
 */
export function destroyTenureSyncManager(): void {
  if (tenureSyncManager) {
    tenureSyncManager.destroy();
    tenureSyncManager = null;
  }
}

// ============================================================================
// REACTIVE SYNC STATE (SolidJS)
// ============================================================================

/**
 * Create reactive sync state for use in components
 */
export function useTenureSync() {
  const [syncState, setSyncState] = createSignal<SyncState | null>(null);
  const [isEnabled, setIsEnabled] = createSignal(false);

  createEffect(() => {
    const manager = getTenureSyncManager();

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
      const manager = getTenureSyncManager();
      if (manager) {
        await manager.push();
      }
    },

    /**
     * Resolve a conflict
     */
    resolveConflict: async (choice: 'local' | 'remote') => {
      const manager = getTenureSyncManager();
      if (manager) {
        await manager.resolveConflict(choice);
      }
    },

    /**
     * Schedule a push (call this when data changes)
     */
    schedulePush: () => {
      const manager = getTenureSyncManager();
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
export function notifyTenureDataChanged(): void {
  const manager = getTenureSyncManager();
  if (manager) {
    manager.schedulePush();
  }
}
