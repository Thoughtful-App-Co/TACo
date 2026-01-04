/**
 * Storage Migration Utility - One-time localStorage key migration
 *
 * Migrates legacy key prefixes to new unified naming:
 * - augment_* → tenure_*
 * - prosper_* → tenure_prosper_*
 *
 * Safe to run multiple times - only migrates if old keys exist and new don't.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { logger } from './logger';

export const MIGRATION_VERSION = 1;
export const MIGRATION_KEY = 'tenure_migration_version';

/**
 * Key migration mapping: oldKey → newKey
 * Only migrates if oldKey exists AND newKey doesn't exist
 */
const KEY_MIGRATIONS: Record<string, string> = {
  // Pipeline/Prospect
  augment_pipeline_applications: 'tenure_pipeline_applications',
  augment_pipeline_profile: 'tenure_pipeline_profile',
  augment_pipeline_settings: 'tenure_pipeline_settings',
  augment_feature_flags: 'tenure_feature_flags',
  augment_notification_interactions: 'tenure_notification_interactions',

  // RIASEC
  augment_answers: 'tenure_riasec_answers',

  // Prepare
  augment_prepare_master_resume: 'tenure_prepare_master_resume',
  augment_prepare_variants: 'tenure_prepare_variants',
  augment_prepare_wizard: 'tenure_prepare_wizard',
  augment_prepare_current_variant: 'tenure_prepare_current_variant',
  augment_prepare_current_mutation: 'tenure_prepare_current_mutation',
  augment_prepare_mutation_history: 'tenure_prepare_mutation_history',

  // Prosper (prosper_ → tenure_prosper_)
  prosper_user_id: 'tenure_prosper_user_id',
  prosper_salary_history: 'tenure_prosper_salary_history',
  prosper_check_ins: 'tenure_prosper_check_ins',
  prosper_accomplishments: 'tenure_prosper_accomplishments',
  prosper_employment_state: 'tenure_prosper_employment_state',
  prosper_review_cycles: 'tenure_prosper_review_cycles',
  prosper_self_reviews: 'tenure_prosper_self_reviews',
  prosper_external_feedback: 'tenure_prosper_external_feedback',
  prosper_accolades: 'tenure_prosper_accolades',

  // UI State
  prosper_sidebar_collapsed: 'tenure_prosper_sidebar_collapsed',
  prospect_sidebar_collapsed: 'tenure_prospect_sidebar_collapsed',
  job_detail_sidebar_width: 'tenure_job_detail_sidebar_width',
};

export interface MigrationResult {
  version: number;
  migratedKeys: string[];
  skippedKeys: string[];
  errors: Array<{ key: string; error: string }>;
  timestamp: string;
  alreadyMigrated: boolean;
}

/**
 * Check if migration has already been completed
 */
export function isMigrationComplete(): boolean {
  const storedVersion = localStorage.getItem(MIGRATION_KEY);
  return storedVersion !== null && parseInt(storedVersion, 10) >= MIGRATION_VERSION;
}

/**
 * Run the one-time storage migration
 *
 * This is safe to run multiple times:
 * - Checks migration version first
 * - Only migrates keys that exist in old location but not new
 * - Preserves old keys (doesn't delete them)
 *
 * @param deleteOldKeys - If true, removes old keys after successful migration (default: false for safety)
 */
export function runStorageMigration(deleteOldKeys: boolean = false): MigrationResult {
  const result: MigrationResult = {
    version: MIGRATION_VERSION,
    migratedKeys: [],
    skippedKeys: [],
    errors: [],
    timestamp: new Date().toISOString(),
    alreadyMigrated: false,
  };

  // Check if already migrated
  if (isMigrationComplete()) {
    result.alreadyMigrated = true;
    logger.storage.info('Already at version', MIGRATION_VERSION);
    return result;
  }

  logger.storage.info('Starting migration to version', MIGRATION_VERSION);

  for (const [oldKey, newKey] of Object.entries(KEY_MIGRATIONS)) {
    try {
      const oldValue = localStorage.getItem(oldKey);
      const newValue = localStorage.getItem(newKey);

      // Skip if old key doesn't exist
      if (oldValue === null) {
        result.skippedKeys.push(`${oldKey} (not found)`);
        continue;
      }

      // Skip if new key already exists (don't overwrite)
      if (newValue !== null) {
        result.skippedKeys.push(`${oldKey} (new key exists)`);
        continue;
      }

      // Migrate: copy value to new key
      localStorage.setItem(newKey, oldValue);
      result.migratedKeys.push(`${oldKey} → ${newKey}`);

      // Optionally delete old key
      if (deleteOldKeys) {
        localStorage.removeItem(oldKey);
      }

      logger.storage.info(`Migrated: ${oldKey} → ${newKey}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push({ key: oldKey, error: errorMessage });
      logger.storage.error(`Error migrating ${oldKey}:`, error);
    }
  }

  // Mark migration as complete
  localStorage.setItem(MIGRATION_KEY, String(MIGRATION_VERSION));

  logger.storage.info('Complete:', {
    migrated: result.migratedKeys.length,
    skipped: result.skippedKeys.length,
    errors: result.errors.length,
  });

  return result;
}

/**
 * Get migration status without running migration
 */
export function getMigrationStatus(): {
  currentVersion: number | null;
  targetVersion: number;
  needsMigration: boolean;
  keysToMigrate: string[];
  keysAlreadyMigrated: string[];
  keysNotFound: string[];
} {
  const storedVersion = localStorage.getItem(MIGRATION_KEY);
  const currentVersion = storedVersion ? parseInt(storedVersion, 10) : null;

  const keysToMigrate: string[] = [];
  const keysAlreadyMigrated: string[] = [];
  const keysNotFound: string[] = [];

  for (const [oldKey, newKey] of Object.entries(KEY_MIGRATIONS)) {
    const oldValue = localStorage.getItem(oldKey);
    const newValue = localStorage.getItem(newKey);

    if (oldValue === null && newValue === null) {
      keysNotFound.push(oldKey);
    } else if (newValue !== null) {
      keysAlreadyMigrated.push(oldKey);
    } else if (oldValue !== null) {
      keysToMigrate.push(oldKey);
    }
  }

  return {
    currentVersion,
    targetVersion: MIGRATION_VERSION,
    needsMigration: currentVersion === null || currentVersion < MIGRATION_VERSION,
    keysToMigrate,
    keysAlreadyMigrated,
    keysNotFound,
  };
}

/**
 * Reset migration status (for development/testing)
 * WARNING: This allows migration to run again
 */
export function resetMigrationStatus(): void {
  localStorage.removeItem(MIGRATION_KEY);
  logger.storage.info('Migration status reset');
}

/**
 * Cleanup old keys after migration (call this later once you're confident migration worked)
 */
export function cleanupOldKeys(): { deleted: string[]; notFound: string[] } {
  const deleted: string[] = [];
  const notFound: string[] = [];

  for (const oldKey of Object.keys(KEY_MIGRATIONS)) {
    if (localStorage.getItem(oldKey) !== null) {
      localStorage.removeItem(oldKey);
      deleted.push(oldKey);
    } else {
      notFound.push(oldKey);
    }
  }

  logger.storage.info('Cleaned up old keys:', { deleted: deleted.length });
  return { deleted, notFound };
}

/**
 * Auto-run migration on module import (optional)
 * Import this at app entry point to auto-migrate
 */
export function autoMigrate(): void {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const result = runStorageMigration(false); // Keep old keys for safety

    if (!result.alreadyMigrated && result.migratedKeys.length > 0) {
      logger.storage.info('Auto-migration complete:', result.migratedKeys.length, 'keys migrated');
    }
  }
}
