/**
 * Emergency Export Utility - Full localStorage backup with schema versions
 *
 * Use this to preserve all Tenure data before schema migrations.
 * Creates a comprehensive JSON backup that can be restored even if schemas change.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

// Schema version tracking - increment when schema changes
export const SCHEMA_VERSIONS = {
  pipeline: 1, // JobApplication, UserProfile, PipelineSettings
  prepare: 1, // MasterResume, ResumeVariant
  prosper: 1, // SalaryHistory, CheckIns, Accomplishments
  tenure: 1, // Assessments, Strengths, CultureProfile
  featureFlags: 1,
  riasec: 1,
} as const;

// All known Tenure localStorage keys (including legacy "augment_" prefix)
export const TENURE_STORAGE_KEYS = {
  // Pipeline/Prospect (job applications)
  applications: ['augment_pipeline_applications', 'tenure_pipeline_applications'],
  profile: ['augment_pipeline_profile', 'tenure_pipeline_profile'],
  settings: ['augment_pipeline_settings', 'tenure_pipeline_settings'],
  featureFlags: ['augment_feature_flags', 'tenure_feature_flags'],
  notificationInteractions: [
    'augment_notification_interactions',
    'tenure_notification_interactions',
  ],

  // RIASEC (career assessment)
  riasecAnswers: ['augment_answers', 'tenure_riasec_answers'],

  // Prepare (resume intelligence)
  masterResume: ['augment_prepare_master_resume', 'tenure_prepare_master_resume'],
  resumeVariants: ['augment_prepare_variants', 'tenure_prepare_variants'],
  prepareWizard: ['augment_prepare_wizard', 'tenure_prepare_wizard'],
  currentVariant: ['augment_prepare_current_variant', 'tenure_prepare_current_variant'],
  currentMutation: ['augment_prepare_current_mutation', 'tenure_prepare_current_mutation'],
  mutationHistory: ['augment_prepare_mutation_history', 'tenure_prepare_mutation_history'],

  // Prosper (career journal - note: currently uses prosper_ prefix, should migrate)
  prosperUserId: ['prosper_user_id', 'tenure_prosper_user_id'],
  salaryHistory: ['prosper_salary_history', 'tenure_prosper_salary_history'],
  checkIns: ['prosper_check_ins', 'tenure_prosper_check_ins'],
  accomplishments: ['prosper_accomplishments', 'tenure_prosper_accomplishments'],
  employmentState: ['prosper_employment_state', 'tenure_prosper_employment_state'],
  reviewCycles: ['prosper_review_cycles', 'tenure_prosper_review_cycles'],
  selfReviews: ['prosper_self_reviews', 'tenure_prosper_self_reviews'],
  externalFeedback: ['prosper_external_feedback', 'tenure_prosper_external_feedback'],
  accolades: ['prosper_accolades', 'tenure_prosper_accolades'],

  // UI State
  prosperSidebarCollapsed: ['prosper_sidebar_collapsed', 'tenure_prosper_sidebar_collapsed'],
  prospectSidebarCollapsed: ['prospect_sidebar_collapsed', 'tenure_prospect_sidebar_collapsed'],
  jobDetailSidebarWidth: ['job_detail_sidebar_width', 'tenure_job_detail_sidebar_width'],

  // Caches (BLS labor market data)
  blsCache: ['bls_cache_*'],
  salaryBenchmarkCache: ['salary_benchmark_v1_*'],
  salaryBenchmarkRateLimit: ['salary_benchmark_rate_limit'],
  userLocation: ['taco_user_location'],
  laborMarketFeatures: ['taco_labor_market_features'],
} as const;

export interface TenureEmergencyBackup {
  _meta: {
    exportVersion: number;
    exportedAt: string;
    appVersion: string;
    schemaVersions: typeof SCHEMA_VERSIONS;
    hostname: string;
    userAgent: string;
  };

  // Core data (most important to preserve)
  pipeline: {
    applications: any[];
    profile: any | null;
    settings: any | null;
    featureFlags: any | null;
    notificationInteractions: any | null;
  };

  riasec: {
    answers: Record<string, number> | null;
  };

  prepare: {
    masterResume: any | null;
    variants: any[];
    wizard: any | null;
    currentVariant: string | null;
    mutationHistory: any[];
  };

  prosper: {
    userId: string | null;
    salaryHistory: any | null;
    checkIns: any[];
    accomplishments: any[];
    employmentState: any | null;
    reviewCycles: any[];
    selfReviews: any[];
    externalFeedback: any[];
    accolades: any[];
  };

  // UI preferences (nice to have)
  uiState: {
    prosperSidebarCollapsed: boolean | null;
    prospectSidebarCollapsed: boolean | null;
    jobDetailSidebarWidth: number | null;
  };

  // Caches (can be regenerated, but nice to preserve)
  caches: {
    bls: Record<string, any>;
    salaryBenchmark: Record<string, any>;
    userLocation: any | null;
  };

  // Raw localStorage dump (fallback for anything we missed)
  _rawLocalStorage: Record<string, string>;
}

/**
 * Safely parse JSON from localStorage
 */
function safeParseStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`Failed to parse localStorage key "${key}":`, e);
    return defaultValue;
  }
}

/**
 * Get first available value from multiple possible keys
 */
function getFromKeys<T>(keys: readonly string[], defaultValue: T): T {
  for (const key of keys) {
    const value = safeParseStorage(key, null);
    if (value !== null) return value as T;
  }
  return defaultValue;
}

/**
 * Get all localStorage keys matching a prefix
 */
function getKeysWithPrefix(prefix: string): Record<string, any> {
  const result: Record<string, any> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix.replace('*', ''))) {
      result[key] = safeParseStorage(key, null);
    }
  }
  return result;
}

/**
 * Export ALL Tenure data from localStorage
 * This is a comprehensive backup that preserves everything
 */
export function exportTenureEmergencyBackup(): TenureEmergencyBackup {
  const K = TENURE_STORAGE_KEYS;

  // Collect all raw localStorage for safety
  const rawLocalStorage: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      (key.startsWith('augment_') ||
        key.startsWith('tenure_') ||
        key.startsWith('prosper_') ||
        key.startsWith('bls_cache_') ||
        key.startsWith('salary_benchmark_') ||
        key.startsWith('taco_') ||
        key === 'prospect_sidebar_collapsed' ||
        key === 'job_detail_sidebar_width')
    ) {
      rawLocalStorage[key] = localStorage.getItem(key) || '';
    }
  }

  return {
    _meta: {
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0', // TODO: Get from package.json
      schemaVersions: SCHEMA_VERSIONS,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    },

    pipeline: {
      applications: getFromKeys(K.applications, []),
      profile: getFromKeys(K.profile, null),
      settings: getFromKeys(K.settings, null),
      featureFlags: getFromKeys(K.featureFlags, null),
      notificationInteractions: getFromKeys(K.notificationInteractions, null),
    },

    riasec: {
      answers: getFromKeys(K.riasecAnswers, null),
    },

    prepare: {
      masterResume: getFromKeys(K.masterResume, null),
      variants: getFromKeys(K.resumeVariants, []),
      wizard: getFromKeys(K.prepareWizard, null),
      currentVariant: getFromKeys(K.currentVariant, null),
      mutationHistory: getFromKeys(K.mutationHistory, []),
    },

    prosper: {
      userId: getFromKeys(K.prosperUserId, null),
      salaryHistory: getFromKeys(K.salaryHistory, null),
      checkIns: getFromKeys(K.checkIns, []),
      accomplishments: getFromKeys(K.accomplishments, []),
      employmentState: getFromKeys(K.employmentState, null),
      reviewCycles: getFromKeys(K.reviewCycles, []),
      selfReviews: getFromKeys(K.selfReviews, []),
      externalFeedback: getFromKeys(K.externalFeedback, []),
      accolades: getFromKeys(K.accolades, []),
    },

    uiState: {
      prosperSidebarCollapsed: getFromKeys(K.prosperSidebarCollapsed, null),
      prospectSidebarCollapsed: getFromKeys(K.prospectSidebarCollapsed, null),
      jobDetailSidebarWidth: getFromKeys(K.jobDetailSidebarWidth, null),
    },

    caches: {
      bls: getKeysWithPrefix('bls_cache_'),
      salaryBenchmark: getKeysWithPrefix('salary_benchmark_'),
      userLocation: getFromKeys(K.userLocation, null),
    },

    _rawLocalStorage: rawLocalStorage,
  };
}

/**
 * Download emergency backup as JSON file
 */
export function downloadEmergencyBackup(): void {
  const backup = exportTenureEmergencyBackup();
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `tenure-emergency-backup-${timestamp}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log(`Emergency backup downloaded: ${filename}`);
  console.log(`Applications: ${backup.pipeline.applications.length}`);
  console.log(`Has profile: ${!!backup.pipeline.profile}`);
  console.log(
    `RIASEC answers: ${backup.riasec.answers ? Object.keys(backup.riasec.answers).length : 0}`
  );
}

/**
 * Get a summary of what would be backed up (for UI preview)
 */
export function getBackupSummary(): {
  applicationCount: number;
  hasProfile: boolean;
  hasRiasecAnswers: boolean;
  hasSalaryHistory: boolean;
  accomplishmentCount: number;
  checkInCount: number;
  totalKeys: number;
} {
  const backup = exportTenureEmergencyBackup();

  return {
    applicationCount: backup.pipeline.applications.length,
    hasProfile: !!backup.pipeline.profile,
    hasRiasecAnswers: !!backup.riasec.answers && Object.keys(backup.riasec.answers).length > 0,
    hasSalaryHistory: !!backup.prosper.salaryHistory,
    accomplishmentCount: backup.prosper.accomplishments.length,
    checkInCount: backup.prosper.checkIns.length,
    totalKeys: Object.keys(backup._rawLocalStorage).length,
  };
}
