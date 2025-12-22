/**
 * Prepare Store - SolidJS reactive store for Resume Intelligence
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { createStore } from 'solid-js/store';
import { createEffect } from 'solid-js';
import {
  MasterResume,
  ResumeVariant,
  WizardState,
  createEmptyMasterResume,
  createEmptyWizardState,
  generateId,
} from '../../../schemas/prepare.schema';

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  masterResume: 'augment_prepare_master_resume',
  variants: 'augment_prepare_variants',
  wizardState: 'augment_prepare_wizard',
  currentVariantId: 'augment_prepare_current_variant',
};

// ============================================================================
// STORE STATE INTERFACE
// ============================================================================

interface PrepareStoreState {
  masterResume: MasterResume | null;
  variants: ResumeVariant[];
  wizardState: WizardState;
  currentVariantId: string | null;

  // UI state
  isLoading: boolean;
  isUploading: boolean;
  isParsing: boolean;
  error: string | null;
  uploadProgress: number; // 0-100
  parseProgress: number; // 0-100
}

// ============================================================================
// INITIAL STATE LOADER
// ============================================================================

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return reviveDates(parsed);
    }
  } catch (e) {
    console.error(`Failed to load ${key} from storage:`, e);
  }
  return defaultValue;
}

function reviveDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
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

function loadInitialState(): PrepareStoreState {
  return {
    masterResume: loadFromStorage<MasterResume | null>(STORAGE_KEYS.masterResume, null),
    variants: loadFromStorage<ResumeVariant[]>(STORAGE_KEYS.variants, []),
    wizardState: loadFromStorage<WizardState>(STORAGE_KEYS.wizardState, createEmptyWizardState()),
    currentVariantId: loadFromStorage<string | null>(STORAGE_KEYS.currentVariantId, null),
    isLoading: false,
    isUploading: false,
    isParsing: false,
    error: null,
    uploadProgress: 0,
    parseProgress: 0,
  };
}

// ============================================================================
// CREATE STORE
// ============================================================================

const [state, setState] = createStore<PrepareStoreState>(loadInitialState());

// ============================================================================
// PERSISTENCE EFFECTS
// ============================================================================

createEffect(() => {
  if (state.masterResume) {
    localStorage.setItem(STORAGE_KEYS.masterResume, JSON.stringify(state.masterResume));
  }
});

createEffect(() => {
  localStorage.setItem(STORAGE_KEYS.variants, JSON.stringify(state.variants));
});

createEffect(() => {
  localStorage.setItem(STORAGE_KEYS.wizardState, JSON.stringify(state.wizardState));
});

createEffect(() => {
  if (state.currentVariantId) {
    localStorage.setItem(STORAGE_KEYS.currentVariantId, state.currentVariantId);
  }
});

// ============================================================================
// STORE ACTIONS
// ============================================================================

export const prepareStore = {
  // Expose state
  state,

  // -------------------------------------------------------------------------
  // MASTER RESUME ACTIONS
  // -------------------------------------------------------------------------

  createMasterResume: (userId: string) => {
    const masterResume = createEmptyMasterResume(userId);
    setState('masterResume', masterResume);
    return masterResume;
  },

  updateMasterResume: (updates: Partial<MasterResume>) => {
    setState('masterResume', (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ...updates,
        updatedAt: new Date(),
      };
    });
  },

  setRawText: (text: string) => {
    setState('masterResume', 'rawText', text);
    setState('masterResume', 'updatedAt', new Date());
  },

  setParsedSections: (sections: MasterResume['parsedSections']) => {
    setState('masterResume', (prev) => {
      if (!prev) {
        console.error('Cannot set parsed sections: masterResume is null');
        return prev;
      }
      return {
        ...prev,
        parsedSections: sections,
        lastParsedAt: new Date(),
        updatedAt: new Date(),
      };
    });
  },

  addMetricToLibrary: (metric: any) => {
    // QuantifiableMetric from prepare schema
    setState('masterResume', 'metricsLibrary', (lib) => [...lib, metric]);
    setState('masterResume', 'updatedAt', new Date());
  },

  removeMetricFromLibrary: (metricId: string) => {
    setState('masterResume', 'metricsLibrary', (lib) => lib.filter((m) => m.id !== metricId));
    setState('masterResume', 'updatedAt', new Date());
  },

  // -------------------------------------------------------------------------
  // VARIANT ACTIONS
  // -------------------------------------------------------------------------

  createVariant: (name: string, targetRole?: string): ResumeVariant => {
    if (!state.masterResume) {
      throw new Error('Cannot create variant without master resume');
    }

    const newVariant: ResumeVariant = {
      id: generateId(),
      masterResumeId: state.masterResume.id,
      name,
      targetRole,
      includedExperiences: [],
      includedSkills: state.masterResume.parsedSections.skills,
      includedMetrics: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setState('variants', (variants) => [...variants, newVariant]);
    setState('currentVariantId', newVariant.id);
    return newVariant;
  },

  updateVariant: (variantId: string, updates: Partial<ResumeVariant>) => {
    setState(
      'variants',
      (v) => v.id === variantId,
      (v) => ({
        ...v,
        ...updates,
        updatedAt: new Date(),
      })
    );
  },

  deleteVariant: (variantId: string) => {
    setState('variants', (variants) => variants.filter((v) => v.id !== variantId));
    if (state.currentVariantId === variantId) {
      setState('currentVariantId', null);
    }
  },

  setCurrentVariant: (variantId: string | null) => {
    setState('currentVariantId', variantId);
  },

  getCurrentVariant: (): ResumeVariant | null => {
    if (!state.currentVariantId) return null;
    return state.variants.find((v) => v.id === state.currentVariantId) || null;
  },

  // -------------------------------------------------------------------------
  // WIZARD ACTIONS
  // -------------------------------------------------------------------------

  setWizardStep: (step: WizardState['currentStep']) => {
    setState('wizardState', 'currentStep', step);
  },

  completeWizardStep: (step: WizardState['currentStep']) => {
    setState('wizardState', 'completedSteps', (steps) => {
      if (!steps.includes(step)) {
        return [...steps, step];
      }
      return steps;
    });
  },

  setHasUploadedResume: (value: boolean) => {
    setState('wizardState', 'hasUploadedResume', value);
  },

  setHasManualEntry: (value: boolean) => {
    setState('wizardState', 'hasManualEntry', value);
  },

  resetWizard: () => {
    setState('wizardState', createEmptyWizardState());
  },

  // -------------------------------------------------------------------------
  // UI STATE
  // -------------------------------------------------------------------------

  setLoading: (loading: boolean) => {
    setState('isLoading', loading);
  },

  setUploading: (uploading: boolean) => {
    setState('isUploading', uploading);
  },

  setParsing: (parsing: boolean) => {
    setState('isParsing', parsing);
  },

  setError: (error: string | null) => {
    setState('error', error);
  },

  setUploadProgress: (progress: number) => {
    setState('uploadProgress', Math.min(100, Math.max(0, progress)));
  },

  setParseProgress: (progress: number) => {
    setState('parseProgress', Math.min(100, Math.max(0, progress)));
  },

  // -------------------------------------------------------------------------
  // QUERY HELPERS
  // -------------------------------------------------------------------------

  hasMasterResume: (): boolean => {
    return state.masterResume !== null;
  },

  getVariantsByRole: (role: string): ResumeVariant[] => {
    return state.variants.filter((v) => v.targetRole?.toLowerCase().includes(role.toLowerCase()));
  },

  getRecentVariants: (limit: number = 5): ResumeVariant[] => {
    return [...state.variants]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  },

  // -------------------------------------------------------------------------
  // RESET
  // -------------------------------------------------------------------------

  resetAll: () => {
    localStorage.removeItem(STORAGE_KEYS.masterResume);
    localStorage.removeItem(STORAGE_KEYS.variants);
    localStorage.removeItem(STORAGE_KEYS.wizardState);
    localStorage.removeItem(STORAGE_KEYS.currentVariantId);

    setState({
      masterResume: null,
      variants: [],
      wizardState: createEmptyWizardState(),
      currentVariantId: null,
      isLoading: false,
      isUploading: false,
      isParsing: false,
      error: null,
      uploadProgress: 0,
      parseProgress: 0,
    });
  },
};

export default prepareStore;
