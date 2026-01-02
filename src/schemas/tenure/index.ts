/**
 * Tenure Schema - Master Index
 *
 * Unified schema namespace for the Tenure career management app.
 * All Tenure-related schemas are organized under this directory.
 *
 * Structure:
 * - common.schema.ts   - Shared types (WorkExperience, Education, etc.)
 * - discover.schema.ts - RIASEC career assessment
 * - prepare.schema.ts  - Resume intelligence & variants
 * - prospect.schema.ts - Job application tracking (formerly "pipeline")
 * - prosper.schema.ts  - Career journal & accomplishments
 *
 * @module schemas/tenure
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

// =============================================================================
// SCHEMA VERSIONING
// =============================================================================

/**
 * Schema versions for each Tenure module.
 * Increment when making breaking changes to data structures.
 * Used for migration detection and data compatibility.
 */
export const TENURE_SCHEMA_VERSIONS = {
  /** Shared types version */
  common: 1,
  /** RIASEC assessment data */
  discover: 1,
  /** Resume intelligence */
  prepare: 1,
  /** Job application tracking */
  prospect: 2, // Bumped from pipeline v1
  /** Career journal */
  prosper: 1,
  /** Overall Tenure app version */
  app: 1,
} as const;

export type TenureSchemaVersions = typeof TENURE_SCHEMA_VERSIONS;

// =============================================================================
// STORAGE KEYS
// =============================================================================

/**
 * Canonical localStorage keys for Tenure data.
 * All keys use the `tenure_` prefix for consistency.
 */
export const TENURE_STORAGE_KEYS = {
  // Discover (RIASEC)
  riasecAnswers: 'tenure_discover_answers',
  riasecProfile: 'tenure_discover_profile',

  // Prepare (Resume)
  masterResume: 'tenure_prepare_master_resume',
  resumeVariants: 'tenure_prepare_variants',
  prepareWizard: 'tenure_prepare_wizard',
  currentVariant: 'tenure_prepare_current_variant',
  mutationHistory: 'tenure_prepare_mutation_history',

  // Prospect (Job Applications)
  applications: 'tenure_prospect_applications',
  profile: 'tenure_prospect_profile',
  settings: 'tenure_prospect_settings',
  notificationInteractions: 'tenure_prospect_notifications',

  // Prosper (Career Journal)
  userId: 'tenure_prosper_user_id',
  salaryHistory: 'tenure_prosper_salary_history',
  checkIns: 'tenure_prosper_check_ins',
  accomplishments: 'tenure_prosper_accomplishments',
  employmentState: 'tenure_prosper_employment_state',
  reviewCycles: 'tenure_prosper_review_cycles',
  selfReviews: 'tenure_prosper_self_reviews',
  externalFeedback: 'tenure_prosper_external_feedback',
  accolades: 'tenure_prosper_accolades',

  // App-wide
  featureFlags: 'tenure_feature_flags',
  schemaVersion: 'tenure_schema_version',

  // UI State
  sidebarCollapsed: 'tenure_sidebar_collapsed',
  jobDetailWidth: 'tenure_job_detail_width',
} as const;

export type TenureStorageKeys = typeof TENURE_STORAGE_KEYS;

// =============================================================================
// VERSIONED DATA WRAPPER
// =============================================================================

/**
 * Wrapper for versioned data storage.
 * All persisted data should use this wrapper for migration compatibility.
 */
export interface VersionedData<T> {
  /** Schema version when data was saved */
  schemaVersion: number;
  /** Timestamp when data was last saved */
  savedAt: string;
  /** The actual data */
  data: T;
}

/**
 * Create a versioned data wrapper
 */
export function wrapWithVersion<T>(data: T, schemaVersion: number): VersionedData<T> {
  return {
    schemaVersion,
    savedAt: new Date().toISOString(),
    data,
  };
}

/**
 * Extract data from versioned wrapper, with version check
 */
export function unwrapVersionedData<T>(
  wrapped: VersionedData<T> | T,
  expectedVersion: number
): { data: T; needsMigration: boolean; actualVersion: number } {
  // Check if it's a versioned wrapper
  if (wrapped && typeof wrapped === 'object' && 'schemaVersion' in wrapped && 'data' in wrapped) {
    const versioned = wrapped as VersionedData<T>;
    return {
      data: versioned.data,
      needsMigration: versioned.schemaVersion < expectedVersion,
      actualVersion: versioned.schemaVersion,
    };
  }

  // Legacy data without version wrapper
  return {
    data: wrapped as T,
    needsMigration: true,
    actualVersion: 0,
  };
}

// =============================================================================
// RE-EXPORTS
// =============================================================================

// Common types (shared across modules)
export * from './common.schema';

// Discover (RIASEC)
export * from './discover.schema';

// Prepare (Resume Intelligence)
export * from './prepare.schema';

// Prospect (Job Applications) - formerly "pipeline"
export * from './prospect.schema';

// Prosper (Career Journal)
export * from './prosper.schema';

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Calculate days since a date
 */
export function daysSince(date: Date): number {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
