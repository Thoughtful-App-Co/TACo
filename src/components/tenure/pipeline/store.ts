/**
 * Pipeline Store - SolidJS reactive store with localStorage persistence
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { createStore } from 'solid-js/store';
import { createEffect } from 'solid-js';
import {
  JobApplication,
  UserProfile,
  ProspectSettings,
  ProspectSyncData,
  TenureFeatureFlags,
  ApplicationStatus,
  StatusChange,
  UserCriterion,
  WorkExperience,
  DEFAULT_PROSPECT_SETTINGS,
  DEFAULT_FEATURE_FLAGS,
  generateId,
  daysSince,
  shouldNotify,
  isSnoozed,
  snoozeApplication,
  unsnoozeApplication,
  getEffectiveThresholds,
  ACTIVE_STATUSES,
  TERMINAL_STATUSES,
} from '../../../schemas/tenure';

// Backward compatibility aliases
type PipelineSettings = ProspectSettings;
type PipelineSyncData = ProspectSyncData;
type FeatureFlags = TenureFeatureFlags;
const DEFAULT_SETTINGS = DEFAULT_PROSPECT_SETTINGS;
import { normalizeJobTitle, getCanonicalPositionName } from './utils/position-matching';
import { normalizeToAnnual } from './utils/salary';
import { notificationInteractionStore } from './store/notification-interactions';
import { logger } from '../../../lib/logger';
import { notifyTenureDataChanged } from '../../../lib/sync';

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  applications: 'tenure_prospect_applications',
  profile: 'tenure_prospect_profile',
  settings: 'tenure_prospect_settings',
  featureFlags: 'tenure_feature_flags',
  riasecAnswers: 'tenure_discover_answers',
};

// ============================================================================
// STORE STATE INTERFACE
// ============================================================================

export type AggregationMode = 'none' | 'company' | 'position' | 'salary';

interface PipelineStoreState {
  applications: JobApplication[];
  profile: UserProfile | null;
  settings: PipelineSettings;
  featureFlags: FeatureFlags;

  // UI state
  isLoading: boolean;
  error: string | null;
  aggregationMode: AggregationMode;

  // Selection state for bulk operations
  selectedIds: Set<string>;
}

// ============================================================================
// INITIAL STATE LOADER
// ============================================================================

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Revive dates
      return reviveDates(parsed);
    }
  } catch (e) {
    logger.storage.error(`Failed to load ${key} from storage:`, e);
  }
  return defaultValue;
}

function reviveDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    // Check if it's an ISO date string
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
      return new Date(obj);
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(reviveDates);
  }
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = reviveDates(obj[key]);
    }
    return result;
  }
  return obj;
}

function loadInitialState(): PipelineStoreState {
  // Load feature flags with migration - ensure showPipeline is true by default
  const storedFlags = loadFromStorage<Partial<FeatureFlags>>(STORAGE_KEYS.featureFlags, {});
  const featureFlags: FeatureFlags = {
    ...DEFAULT_FEATURE_FLAGS,
    ...storedFlags,
    // Migration: ensure all new flags are enabled by default
    showProspect: storedFlags.showProspect ?? (storedFlags as any).showPipeline ?? true,
  };

  return {
    applications: loadFromStorage<JobApplication[]>(STORAGE_KEYS.applications, []),
    profile: loadFromStorage<UserProfile | null>(STORAGE_KEYS.profile, null),
    settings: loadFromStorage<PipelineSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS),
    featureFlags,
    isLoading: false,
    error: null,
    aggregationMode: 'none' as AggregationMode,
    selectedIds: new Set<string>(),
  };
}

// ============================================================================
// CREATE STORE
// ============================================================================

const [state, setState] = createStore<PipelineStoreState>(loadInitialState());

// ============================================================================
// PERSISTENCE EFFECTS
// ============================================================================

// Auto-save applications
createEffect(() => {
  localStorage.setItem(STORAGE_KEYS.applications, JSON.stringify(state.applications));
});

// Auto-save profile
createEffect(() => {
  if (state.profile) {
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(state.profile));
  }
});

// Auto-save settings
createEffect(() => {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
});

// Auto-save feature flags
createEffect(() => {
  localStorage.setItem(STORAGE_KEYS.featureFlags, JSON.stringify(state.featureFlags));
});

// Notify sync manager when data changes
createEffect(() => {
  // Explicitly read each reactive value to ensure SolidJS tracks them as dependencies
  void state.applications.length;
  void state.profile?.updatedAt;
  void state.settings.syncVersion;
  // Notify sync manager (debounced internally)
  notifyTenureDataChanged();
});

// ============================================================================
// STORE ACTIONS
// ============================================================================

export const pipelineStore = {
  // Expose state
  state,

  // -------------------------------------------------------------------------
  // APPLICATION ACTIONS
  // -------------------------------------------------------------------------

  addApplication: (
    app: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt' | 'syncVersion' | 'statusHistory'>
  ) => {
    const now = new Date();
    const newApp: JobApplication = {
      ...app,
      id: generateId(),
      statusHistory: [{ status: app.status, timestamp: now }],
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
      syncVersion: 1,
    };
    setState('applications', (apps) => [newApp, ...apps]);
    return newApp;
  },

  updateApplication: (id: string, updates: Partial<JobApplication>) => {
    setState(
      'applications',
      (app) => app.id === id,
      (app) => ({
        ...app,
        ...updates,
        updatedAt: new Date(),
        syncVersion: app.syncVersion + 1,
      })
    );
  },

  updateStatus: (id: string, newStatus: ApplicationStatus, note?: string) => {
    setState(
      'applications',
      (app) => app.id === id,
      (app) => {
        // Don't create a new status entry if the status hasn't changed
        if (app.status === newStatus) {
          return app;
        }

        const now = new Date();
        const statusChange: StatusChange = {
          status: newStatus,
          timestamp: now,
          note,
        };

        const updates: Partial<JobApplication> = {
          status: newStatus,
          statusHistory: [...app.statusHistory, statusChange],
          lastActivityAt: now,
          updatedAt: now,
          appliedAt: newStatus === 'applied' && !app.appliedAt ? now : app.appliedAt,
          syncVersion: app.syncVersion + 1,
        };

        // Capture rejection point: track which stage the rejection occurred at
        if (newStatus === 'rejected' || newStatus === 'withdrawn') {
          updates.rejectedAtStatus = app.status; // Store the previous status
        }

        return { ...app, ...updates };
      }
    );
  },

  deleteApplication: (id: string) => {
    setState('applications', (apps) => apps.filter((app) => app.id !== id));
  },

  setFollowUpDue: (id: string, date: Date | undefined) => {
    setState('applications', (app) => app.id === id, 'followUpDue', date);
    setState('applications', (app) => app.id === id, 'updatedAt', new Date());
  },

  addNote: (id: string, note: string) => {
    setState(
      'applications',
      (app) => app.id === id,
      (app) => ({
        ...app,
        notes: app.notes ? `${app.notes}\n\n${note}` : note,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
    );
  },

  // -------------------------------------------------------------------------
  // QUERY HELPERS
  // -------------------------------------------------------------------------

  getApplicationById: (id: string): JobApplication | undefined => {
    return state.applications.find((app) => app.id === id);
  },

  getApplicationsByStatus: (status: ApplicationStatus): JobApplication[] => {
    return state.applications.filter((app) => app.status === status);
  },

  getActiveApplications: (): JobApplication[] => {
    const activeStatuses: ApplicationStatus[] = [
      'saved',
      'applied',
      'screening',
      'interviewing',
      'offered',
    ];
    return state.applications.filter((app) => activeStatuses.includes(app.status));
  },

  getAgingApplications: (daysThreshold: number): JobApplication[] => {
    return state.applications.filter((app) => {
      const days = daysSince(app.lastActivityAt);
      return days >= daysThreshold;
    });
  },

  getFollowUpsDue: (): JobApplication[] => {
    const now = new Date();
    return state.applications.filter((app) => {
      if (!app.followUpDue) return false;
      return new Date(app.followUpDue) <= now;
    });
  },

  // -------------------------------------------------------------------------
  // PROFILE ACTIONS
  // -------------------------------------------------------------------------

  setProfile: (profile: UserProfile) => {
    setState('profile', profile);
  },

  updateProfile: (updates: Partial<UserProfile>) => {
    setState('profile', (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ...updates,
        updatedAt: new Date(),
        syncVersion: prev.syncVersion + 1,
      };
    });
  },

  createProfile: (name: string, email?: string) => {
    const now = new Date();
    const profile: UserProfile = {
      id: generateId(),
      name,
      email,
      experiences: [],
      education: [],
      skills: [],
      certifications: [],
      extractedKeywords: [],
      createdAt: now,
      updatedAt: now,
      syncVersion: 1,
    };
    setState('profile', profile);
    return profile;
  },

  addExperience: (experience: Omit<WorkExperience, 'id'>) => {
    const newExp: WorkExperience = {
      ...experience,
      id: generateId(),
    };
    setState('profile', 'experiences', (exps) => (exps ? [...exps, newExp] : [newExp]));
    setState('profile', 'updatedAt', new Date());
    return newExp;
  },

  updateExperience: (id: string, updates: Partial<WorkExperience>) => {
    setState(
      'profile',
      'experiences',
      (exp) => exp.id === id,
      (exp) => ({ ...exp, ...updates })
    );
    setState('profile', 'updatedAt', new Date());
  },

  deleteExperience: (id: string) => {
    setState('profile', 'experiences', (exps) => exps?.filter((exp) => exp.id !== id) || []);
    setState('profile', 'updatedAt', new Date());
  },

  setSkills: (skills: string[]) => {
    setState('profile', 'skills', skills);
    setState('profile', 'updatedAt', new Date());
  },

  setExtractedKeywords: (keywords: string[]) => {
    setState('profile', 'extractedKeywords', keywords);
    setState('profile', 'updatedAt', new Date());
  },

  // -------------------------------------------------------------------------
  // SETTINGS ACTIONS
  // -------------------------------------------------------------------------

  updateSettings: (updates: Partial<PipelineSettings>) => {
    setState('settings', (prev) => ({
      ...prev,
      ...updates,
      syncVersion: prev.syncVersion + 1,
    }));
  },

  addCriterion: (criterion: Omit<UserCriterion, 'id'>) => {
    const newCriterion: UserCriterion = {
      ...criterion,
      id: generateId(),
    };
    setState('settings', 'criteria', (criteria) => [...criteria, newCriterion]);
  },

  updateCriterion: (id: string, updates: Partial<UserCriterion>) => {
    setState(
      'settings',
      'criteria',
      (c) => c.id === id,
      (c) => ({ ...c, ...updates })
    );
  },

  deleteCriterion: (id: string) => {
    setState('settings', 'criteria', (criteria) => criteria.filter((c) => c.id !== id));
  },

  // -------------------------------------------------------------------------
  // FEATURE FLAGS
  // -------------------------------------------------------------------------

  setFeatureFlag: (flag: keyof FeatureFlags, value: boolean) => {
    setState('featureFlags', flag, value);
  },

  // -------------------------------------------------------------------------
  // SYNC ACTIONS
  // -------------------------------------------------------------------------

  exportData: (): PipelineSyncData => {
    const riasecAnswers = localStorage.getItem(STORAGE_KEYS.riasecAnswers);
    return {
      version: 1,
      exportedAt: new Date(),
      profile: state.profile,
      applications: state.applications,
      settings: state.settings,
      riasecAnswers: riasecAnswers ? JSON.parse(riasecAnswers) : undefined,
    };
  },

  importData: (data: PipelineSyncData) => {
    // Validate version
    if (data.version !== 1) {
      throw new Error(`Unsupported sync data version: ${data.version}`);
    }

    // Import profile
    if (data.profile) {
      setState('profile', reviveDates(data.profile));
    }

    // Merge applications (newer wins based on updatedAt)
    const existingApps = new Map(state.applications.map((app) => [app.id, app]));
    const importedApps = reviveDates(data.applications) as JobApplication[];

    for (const imported of importedApps) {
      const existing = existingApps.get(imported.id);
      if (!existing || new Date(imported.updatedAt) > new Date(existing.updatedAt)) {
        existingApps.set(imported.id, imported);
      }
    }

    setState('applications', Array.from(existingApps.values()));

    // Import settings (keep local API key)
    const localApiKey = state.settings.apiKey;
    setState('settings', {
      ...reviveDates(data.settings),
      apiKey: localApiKey, // Preserve local API key
    });

    // Import RIASEC answers if present
    if (data.riasecAnswers) {
      localStorage.setItem(STORAGE_KEYS.riasecAnswers, JSON.stringify(data.riasecAnswers));
    }

    // Update sync timestamp
    setState('settings', 'lastSyncAt', new Date());
  },

  generateSyncCode: (): string => {
    const data = pipelineStore.exportData();
    const json = JSON.stringify(data);
    return btoa(encodeURIComponent(json));
  },

  importFromSyncCode: (code: string) => {
    try {
      const json = decodeURIComponent(atob(code));
      const data = JSON.parse(json) as PipelineSyncData;
      pipelineStore.importData(data);
    } catch (e) {
      throw new Error('Invalid sync code');
    }
  },

  // -------------------------------------------------------------------------
  // UI STATE
  // -------------------------------------------------------------------------

  setLoading: (loading: boolean) => {
    setState('isLoading', loading);
  },

  setError: (error: string | null) => {
    setState('error', error);
  },

  setAggregationMode: (mode: AggregationMode) => {
    setState('aggregationMode', mode);
  },

  // -------------------------------------------------------------------------
  // SELECTION ACTIONS (for bulk operations)
  // -------------------------------------------------------------------------

  toggleSelection: (id: string) => {
    setState('selectedIds', (prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  },

  selectAll: (ids: string[]) => {
    setState('selectedIds', new Set(ids));
  },

  clearSelection: () => {
    setState('selectedIds', new Set<string>());
  },

  isSelected: (id: string): boolean => {
    return state.selectedIds.has(id);
  },

  getSelectedCount: (): number => {
    return state.selectedIds.size;
  },

  // Check if all applications with given IDs are selected
  areAllSelected: (ids: string[]): boolean => {
    if (ids.length === 0) return false;
    return ids.every((id) => state.selectedIds.has(id));
  },

  // Check if some (but not all) applications with given IDs are selected
  areSomeSelected: (ids: string[]): boolean => {
    if (ids.length === 0) return false;
    const selectedCount = ids.filter((id) => state.selectedIds.has(id)).length;
    return selectedCount > 0 && selectedCount < ids.length;
  },

  // Toggle selection for all given IDs (select all if not all selected, deselect all if all selected)
  toggleAllSelection: (ids: string[]) => {
    const allSelected = ids.every((id) => state.selectedIds.has(id));
    if (allSelected) {
      // Deselect all
      setState('selectedIds', (prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      // Select all
      setState('selectedIds', (prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return next;
      });
    }
  },

  bulkUpdateStatus: (newStatus: ApplicationStatus, note?: string) => {
    const now = new Date();
    const selectedIds = state.selectedIds;

    for (const id of selectedIds) {
      const statusChange: StatusChange = {
        status: newStatus,
        timestamp: now,
        note,
      };

      setState(
        'applications',
        (app) => app.id === id,
        (app) => {
          const updates: Partial<JobApplication> = {
            status: newStatus,
            statusHistory: [...app.statusHistory, statusChange],
            lastActivityAt: now,
            updatedAt: now,
            appliedAt: newStatus === 'applied' && !app.appliedAt ? now : app.appliedAt,
            syncVersion: app.syncVersion + 1,
          };

          if (newStatus === 'rejected' || newStatus === 'withdrawn') {
            updates.rejectedAtStatus = app.status;
          }

          return { ...app, ...updates };
        }
      );
    }

    // Clear selection after bulk update
    setState('selectedIds', new Set<string>());
  },

  bulkDelete: () => {
    const selectedIds = state.selectedIds;
    setState('applications', (apps) => apps.filter((app) => !selectedIds.has(app.id)));
    setState('selectedIds', new Set<string>());
  },

  // -------------------------------------------------------------------------
  // AGGREGATION HELPERS
  // -------------------------------------------------------------------------

  getApplicationsGroupedByCompany: (): Map<string, JobApplication[]> => {
    const grouped = new Map<string, JobApplication[]>();

    for (const app of state.applications) {
      const company = app.companyName || 'Unknown Company';
      if (!grouped.has(company)) {
        grouped.set(company, []);
      }
      grouped.get(company)!.push(app);
    }

    return grouped;
  },

  getApplicationsGroupedByPosition: (): Map<string, JobApplication[]> => {
    const grouped = new Map<string, JobApplication[]>();

    // First, group by normalized title
    for (const app of state.applications) {
      const normalized = normalizeJobTitle(app.roleName || 'Unknown Position');
      if (!grouped.has(normalized)) {
        grouped.set(normalized, []);
      }
      grouped.get(normalized)!.push(app);
    }

    // Replace normalized keys with canonical names
    const result = new Map<string, JobApplication[]>();
    for (const [normalized, apps] of grouped.entries()) {
      const canonical = getCanonicalPositionName(apps.map((a) => a.roleName));
      result.set(canonical, apps);
    }

    return result;
  },

  getApplicationsGroupedBySalary: (): Map<string, JobApplication[]> => {
    const grouped = new Map<string, JobApplication[]>();

    for (const app of state.applications) {
      const annual = normalizeToAnnual(app.salary);

      let bucket: string;
      if (annual === null) {
        bucket = 'Not Specified';
      } else {
        bucket = annual.toLocaleString('en-US', {
          style: 'currency',
          currency: app.salary?.currency || 'USD',
          maximumFractionDigits: 0,
        });
      }

      if (!grouped.has(bucket)) {
        grouped.set(bucket, []);
      }
      grouped.get(bucket)!.push(app);
    }

    return grouped;
  },

  // -------------------------------------------------------------------------
  // NOTIFICATION ACTIONS
  // -------------------------------------------------------------------------

  /**
   * Get all applications that should trigger notifications
   * (stale, not snoozed, not terminal status, not dismissed)
   */
  getNotifiableApplications: (): JobApplication[] => {
    return state.applications.filter(
      (app) => shouldNotify(app, state.settings) && !notificationInteractionStore.isDismissed(app)
    );
  },

  /**
   * Get notification count (for badge display)
   * Only counts new/unviewed notifications
   */
  getNotificationCount: (): number => {
    const notifiable = pipelineStore.getNotifiableApplications();
    return notificationInteractionStore.getNewCount(notifiable);
  },

  /**
   * Get notifiable applications grouped by severity
   */
  getNotificationsByPriority: (): {
    critical: JobApplication[];
    warning: JobApplication[];
  } => {
    const notifiable = pipelineStore.getNotifiableApplications();
    const thresholds = getEffectiveThresholds(state.settings);

    const critical: JobApplication[] = [];
    const warning: JobApplication[] = [];

    for (const app of notifiable) {
      const days = daysSince(app.lastActivityAt);
      if (days >= thresholds.critical) {
        critical.push(app);
      } else {
        warning.push(app);
      }
    }

    // Sort by days descending (most stale first)
    critical.sort((a, b) => daysSince(b.lastActivityAt) - daysSince(a.lastActivityAt));
    warning.sort((a, b) => daysSince(b.lastActivityAt) - daysSince(a.lastActivityAt));

    return { critical, warning };
  },

  /**
   * Snooze an application for a specified number of days
   */
  snoozeApp: (appId: string, days: number, reason?: 'manual' | 'holiday' | 'weekend' | 'busy') => {
    setState(
      'applications',
      (app) => app.id === appId,
      (app) => snoozeApplication(app, days, reason)
    );
    // Track snooze interaction
    notificationInteractionStore.incrementSnoozeCount(appId);
  },

  /**
   * Unsnooze an application (clear snoozedUntil)
   */
  unsnoozeApp: (appId: string) => {
    setState(
      'applications',
      (app) => app.id === appId,
      (app) => unsnoozeApplication(app)
    );
  },

  /**
   * Check if an application is currently snoozed
   */
  isAppSnoozed: (appId: string): boolean => {
    const app = state.applications.find((a) => a.id === appId);
    return app ? isSnoozed(app) : false;
  },

  /**
   * Toggle holiday mode
   */
  toggleHolidayMode: () => {
    setState('settings', 'holidayModeEnabled', (enabled) => !enabled);
  },

  // -------------------------------------------------------------------------
  // RESET
  // -------------------------------------------------------------------------

  resetAll: () => {
    localStorage.removeItem(STORAGE_KEYS.applications);
    localStorage.removeItem(STORAGE_KEYS.profile);
    localStorage.removeItem(STORAGE_KEYS.settings);
    setState({
      applications: [],
      profile: null,
      settings: DEFAULT_SETTINGS,
      isLoading: false,
      error: null,
      aggregationMode: 'none' as AggregationMode,
      selectedIds: new Set<string>(),
      featureFlags: state.featureFlags,
    });
  },
};

export default pipelineStore;
