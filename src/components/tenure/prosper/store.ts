/**
 * Prosper Store - SolidJS reactive store with localStorage persistence
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { createStore } from 'solid-js/store';
import { createEffect } from 'solid-js';
import {
  // Prosper types
  EmploymentState,
  QuarterlyCheckIn,
  AccomplishmentEntry,
  SalaryHistory,
  SalaryEntry,
  ProsperSalaryRange,
  MarketBenchmark,
  ReviewCycle,
  SelfReview,
  ExternalFeedback,
  AccoladeEntry,
  CheckInFrequency,
  MoodLevel,
  AccomplishmentType,
  SalaryEntryMode,
  CompensationSnapshot,
  // Common types
  QuantifiableMetric,
  // Helpers
  generateId,
  getCurrentQuarter,
  getQuarterDates,
  createDefaultEmploymentState,
  calculateNextCheckInDue,
  calculatePercentile,
  generateFeedbackToken,
  createDefaultReviewQuestions,
  interpolateSalaryRange,
} from '../../../schemas/tenure';
import { logger } from '../../../lib/logger';
import { notifyTenureDataChanged } from '../../../lib/sync';

// Alias for compatibility
type SalaryRange = ProsperSalaryRange;

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  userId: 'tenure_prosper_user_id',
  salaryHistory: 'tenure_prosper_salary_history',
  checkIns: 'tenure_prosper_check_ins',
  accomplishments: 'tenure_prosper_accomplishments',
  employmentState: 'tenure_prosper_employment_state',
  reviewCycles: 'tenure_prosper_review_cycles',
  selfReviews: 'tenure_prosper_self_reviews',
  externalFeedback: 'tenure_prosper_external_feedback',
  accolades: 'tenure_prosper_accolades',
  sidebarCollapsed: 'tenure_prosper_sidebar_collapsed',
};

// ============================================================================
// STORE STATE INTERFACE
// ============================================================================

interface ProsperStoreState {
  // Salary tracking
  salaryHistory: SalaryHistory | null;

  // Journal
  checkIns: QuarterlyCheckIn[];
  accomplishments: AccomplishmentEntry[];
  employmentState: EmploymentState;

  // 360 Reviews
  reviewCycles: ReviewCycle[];
  selfReviews: SelfReview[];
  externalFeedback: ExternalFeedback[];
  accolades: AccoladeEntry[];

  // UI state
  isLoading: boolean;
  error: string | null;
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

function loadInitialState(): ProsperStoreState {
  // Generate a default user ID if none exists
  const userId = localStorage.getItem(STORAGE_KEYS.userId) || generateId();
  if (!localStorage.getItem(STORAGE_KEYS.userId)) {
    localStorage.setItem(STORAGE_KEYS.userId, userId);
  }

  return {
    salaryHistory: loadFromStorage<SalaryHistory | null>(STORAGE_KEYS.salaryHistory, null),
    checkIns: loadFromStorage<QuarterlyCheckIn[]>(STORAGE_KEYS.checkIns, []),
    accomplishments: loadFromStorage<AccomplishmentEntry[]>(STORAGE_KEYS.accomplishments, []),
    employmentState: loadFromStorage<EmploymentState>(
      STORAGE_KEYS.employmentState,
      createDefaultEmploymentState()
    ),
    reviewCycles: loadFromStorage<ReviewCycle[]>(STORAGE_KEYS.reviewCycles, []),
    selfReviews: loadFromStorage<SelfReview[]>(STORAGE_KEYS.selfReviews, []),
    externalFeedback: loadFromStorage<ExternalFeedback[]>(STORAGE_KEYS.externalFeedback, []),
    accolades: loadFromStorage<AccoladeEntry[]>(STORAGE_KEYS.accolades, []),
    isLoading: false,
    error: null,
  };
}

// ============================================================================
// CREATE STORE
// ============================================================================

const [state, setState] = createStore<ProsperStoreState>(loadInitialState());

// ============================================================================
// PERSISTENCE EFFECTS
// ============================================================================

createEffect(() => {
  if (state.salaryHistory) {
    localStorage.setItem(STORAGE_KEYS.salaryHistory, JSON.stringify(state.salaryHistory));
  }
});

createEffect(() => {
  localStorage.setItem(STORAGE_KEYS.checkIns, JSON.stringify(state.checkIns));
});

createEffect(() => {
  localStorage.setItem(STORAGE_KEYS.accomplishments, JSON.stringify(state.accomplishments));
});

createEffect(() => {
  localStorage.setItem(STORAGE_KEYS.employmentState, JSON.stringify(state.employmentState));
});

createEffect(() => {
  localStorage.setItem(STORAGE_KEYS.reviewCycles, JSON.stringify(state.reviewCycles));
});

createEffect(() => {
  localStorage.setItem(STORAGE_KEYS.selfReviews, JSON.stringify(state.selfReviews));
});

createEffect(() => {
  localStorage.setItem(STORAGE_KEYS.externalFeedback, JSON.stringify(state.externalFeedback));
});

createEffect(() => {
  localStorage.setItem(STORAGE_KEYS.accolades, JSON.stringify(state.accolades));
});

// Notify sync manager when data changes
createEffect(() => {
  // Explicitly read each reactive value to ensure SolidJS tracks them as dependencies
  void state.salaryHistory?.lastUpdated;
  void state.checkIns.length;
  void state.accomplishments.length;
  void state.reviewCycles.length;
  void state.accolades.length;
  // Notify sync manager (debounced internally)
  notifyTenureDataChanged();
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getUserId(): string {
  return localStorage.getItem(STORAGE_KEYS.userId) || generateId();
}

// ============================================================================
// STORE ACTIONS
// ============================================================================

export const prosperStore = {
  // Expose state
  state,

  // -------------------------------------------------------------------------
  // SALARY HISTORY ACTIONS
  // -------------------------------------------------------------------------

  initializeSalaryHistory(mode: SalaryEntryMode) {
    const userId = getUserId();
    const history: SalaryHistory = {
      userId,
      entryMode: mode,
      yearlyEntries: [],
      rangeEntries: [],
      benchmarks: {},
      showTotalComp: false,
      comparisonEnabled: true,
      lastUpdated: new Date(),
    };
    setState('salaryHistory', history);
  },

  addYearlySalaryEntry: (entry: Omit<SalaryEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const userId = getUserId();
    const now = new Date();
    const newEntry: SalaryEntry = {
      ...entry,
      id: generateId(),
      userId,
      createdAt: now,
      updatedAt: now,
    };

    setState('salaryHistory', 'yearlyEntries', (entries) => {
      // Remove existing entry for this year if it exists
      const filtered = entries.filter((e) => e.year !== newEntry.year);
      // Add new entry and sort by year
      return [...filtered, newEntry].sort((a, b) => a.year - b.year);
    });
    setState('salaryHistory', 'lastUpdated', now);
  },

  updateYearlySalaryEntry(id: string, updates: Partial<SalaryEntry>) {
    const now = new Date();
    setState('salaryHistory', 'yearlyEntries', (entries) =>
      entries.map((entry) => (entry.id === id ? { ...entry, ...updates, updatedAt: now } : entry))
    );
    setState('salaryHistory', 'lastUpdated', now);
  },

  deleteYearlySalaryEntry(id: string) {
    setState('salaryHistory', 'yearlyEntries', (entries) => entries.filter((e) => e.id !== id));
    setState('salaryHistory', 'lastUpdated', new Date());
  },

  addSalaryRange(range: Omit<SalaryRange, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    const userId = getUserId();
    const now = new Date();
    const newRange: SalaryRange = {
      ...range,
      id: generateId(),
      userId,
      createdAt: now,
      updatedAt: now,
    };

    setState('salaryHistory', 'rangeEntries', (ranges) => [...ranges, newRange]);
    setState('salaryHistory', 'lastUpdated', now);
  },

  updateSalaryRange(id: string, updates: Partial<SalaryRange>) {
    const now = new Date();
    setState('salaryHistory', 'rangeEntries', (ranges) =>
      ranges.map((range) => (range.id === id ? { ...range, ...updates, updatedAt: now } : range))
    );
    setState('salaryHistory', 'lastUpdated', now);
  },

  deleteSalaryRange(id: string) {
    setState('salaryHistory', 'rangeEntries', (ranges) => ranges.filter((r) => r.id !== id));
    setState('salaryHistory', 'lastUpdated', new Date());
  },

  updateMarketBenchmark(socCode: string, benchmark: MarketBenchmark) {
    setState('salaryHistory', 'benchmarks', socCode, benchmark);
    setState('salaryHistory', 'lastUpdated', new Date());
  },

  toggleCompType() {
    setState('salaryHistory', 'showTotalComp', (show) => !show);
  },

  toggleMarketComparison() {
    setState('salaryHistory', 'comparisonEnabled', (enabled) => !enabled);
  },

  switchSalaryMode(mode: SalaryEntryMode) {
    setState('salaryHistory', 'entryMode', mode);
    setState('salaryHistory', 'lastUpdated', new Date());
  },

  // Get compensation snapshots for charting
  getCompensationSnapshots(): CompensationSnapshot[] {
    if (!state.salaryHistory) return [];

    const snapshots: CompensationSnapshot[] = [];
    const showTotal = state.salaryHistory.showTotalComp;

    // Always use yearly entries (both single-year and range entries are stored here)
    state.salaryHistory.yearlyEntries.forEach((entry) => {
      const userSalary = showTotal ? entry.totalCompensation : entry.baseSalary;
      const benchmark = entry.socCode ? state.salaryHistory!.benchmarks[entry.socCode] : undefined;

      snapshots.push({
        year: entry.year,
        userSalary,
        marketData: benchmark
          ? {
              percentile10: benchmark.percentile10,
              percentile25: benchmark.percentile25,
              median: benchmark.median,
              percentile75: benchmark.percentile75,
              percentile90: benchmark.percentile90,
              userPercentile: calculatePercentile(userSalary, benchmark),
            }
          : undefined,
        company: entry.company,
        title: entry.title,
      });
    });

    return snapshots.sort((a, b) => a.year - b.year);
  },

  // -------------------------------------------------------------------------
  // JOURNAL ACTIONS
  // -------------------------------------------------------------------------

  updateEmploymentState(updates: Partial<EmploymentState>) {
    setState('employmentState', updates);
  },

  addCheckIn(checkIn: Omit<QuarterlyCheckIn, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    const userId = getUserId();
    const now = new Date();
    const newCheckIn: QuarterlyCheckIn = {
      ...checkIn,
      id: generateId(),
      userId,
      createdAt: now,
      updatedAt: now,
    };
    setState('checkIns', (checkIns) => [newCheckIn, ...checkIns]);
  },

  updateCheckIn(id: string, updates: Partial<QuarterlyCheckIn>) {
    const now = new Date();
    setState('checkIns', (checkIns) =>
      checkIns.map((checkIn) =>
        checkIn.id === id ? { ...checkIn, ...updates, updatedAt: now } : checkIn
      )
    );
  },

  deleteCheckIn(id: string) {
    setState('checkIns', (checkIns) => checkIns.filter((c) => c.id !== id));
  },

  completeCheckIn(id: string) {
    const now = new Date();
    setState('checkIns', (checkIns) =>
      checkIns.map((checkIn) =>
        checkIn.id === id
          ? { ...checkIn, isDraft: false, completedAt: now, updatedAt: now }
          : checkIn
      )
    );
  },

  addAccomplishment(
    accomplishment: Omit<AccomplishmentEntry, 'id' | 'userId' | 'createdAt' | 'quarter'>
  ) {
    const userId = getUserId();
    const now = new Date();
    const quarter = getCurrentQuarter().quarter;
    const newAccomplishment: AccomplishmentEntry = {
      ...accomplishment,
      id: generateId(),
      userId,
      quarter,
      createdAt: now,
    };
    setState('accomplishments', (accomplishments) => [newAccomplishment, ...accomplishments]);
  },

  updateAccomplishment(id: string, updates: Partial<AccomplishmentEntry>) {
    setState('accomplishments', (accomplishments) =>
      accomplishments.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc))
    );
  },

  deleteAccomplishment(id: string) {
    setState('accomplishments', (accomplishments) => accomplishments.filter((a) => a.id !== id));
  },

  // -------------------------------------------------------------------------
  // 360 REVIEW ACTIONS
  // -------------------------------------------------------------------------

  addReviewCycle(
    cycle: Omit<ReviewCycle, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'externalFeedbackIds'>
  ) {
    const userId = getUserId();
    const now = new Date();
    const newCycle: ReviewCycle = {
      ...cycle,
      id: generateId(),
      userId,
      externalFeedbackIds: [],
      createdAt: now,
      updatedAt: now,
    };
    setState('reviewCycles', (cycles) => [newCycle, ...cycles]);
    return newCycle.id;
  },

  updateReviewCycle(id: string, updates: Partial<ReviewCycle>) {
    const now = new Date();
    setState('reviewCycles', (cycles) =>
      cycles.map((cycle) => (cycle.id === id ? { ...cycle, ...updates, updatedAt: now } : cycle))
    );
  },

  deleteReviewCycle(id: string) {
    setState('reviewCycles', (cycles) => cycles.filter((c) => c.id !== id));
    // Clean up associated reviews and feedback
    setState('selfReviews', (reviews) => reviews.filter((r) => r.reviewCycleId !== id));
    setState('externalFeedback', (feedback) => feedback.filter((f) => f.reviewCycleId !== id));
  },

  addSelfReview(review: Omit<SelfReview, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    const userId = getUserId();
    const now = new Date();
    const newReview: SelfReview = {
      ...review,
      id: generateId(),
      userId,
      createdAt: now,
      updatedAt: now,
    };
    setState('selfReviews', (reviews) => [...reviews, newReview]);

    // Update review cycle with this self-review
    setState('reviewCycles', (cycles) =>
      cycles.map((cycle) =>
        cycle.id === review.reviewCycleId
          ? { ...cycle, selfReviewId: newReview.id, updatedAt: now }
          : cycle
      )
    );

    return newReview.id;
  },

  updateSelfReview(id: string, updates: Partial<SelfReview>) {
    const now = new Date();
    setState('selfReviews', (reviews) =>
      reviews.map((review) =>
        review.id === id ? { ...review, ...updates, updatedAt: now } : review
      )
    );
  },

  completeSelfReview(id: string) {
    const now = new Date();
    setState('selfReviews', (reviews) =>
      reviews.map((review) =>
        review.id === id ? { ...review, isDraft: false, completedAt: now, updatedAt: now } : review
      )
    );
  },

  addExternalFeedback(
    feedback: Omit<ExternalFeedback, 'id' | 'token' | 'createdAt' | 'viewedByUser'>
  ) {
    const now = new Date();
    const newFeedback: ExternalFeedback = {
      ...feedback,
      id: generateId(),
      token: generateFeedbackToken(),
      createdAt: now,
      viewedByUser: false,
    };
    setState('externalFeedback', (feedbacks) => [...feedbacks, newFeedback]);

    // Update review cycle
    setState('reviewCycles', (cycles) =>
      cycles.map((cycle) =>
        cycle.id === feedback.reviewCycleId
          ? {
              ...cycle,
              externalFeedbackIds: [...cycle.externalFeedbackIds, newFeedback.id],
              feedbackReceived: cycle.feedbackReceived + 1,
              updatedAt: now,
            }
          : cycle
      )
    );

    return newFeedback;
  },

  submitExternalFeedback(id: string) {
    const now = new Date();
    setState('externalFeedback', (feedbacks) =>
      feedbacks.map((feedback) =>
        feedback.id === id ? { ...feedback, submittedAt: now } : feedback
      )
    );
  },

  markFeedbackViewed(id: string) {
    setState('externalFeedback', (feedbacks) =>
      feedbacks.map((feedback) =>
        feedback.id === id ? { ...feedback, viewedByUser: true } : feedback
      )
    );
  },

  generateFeedbackLink(cycleId: string, source: ExternalFeedback['source']): string {
    // Inline the feedback creation to avoid self-reference
    const now = new Date();
    const newFeedback: ExternalFeedback = {
      id: generateId(),
      token: generateFeedbackToken(),
      reviewCycleId: cycleId,
      source,
      relationship: '',
      responses: {},
      strengths: '',
      areasForImprovement: '',
      isAnonymous: false,
      createdAt: now,
      viewedByUser: false,
    };

    setState('externalFeedback', (feedbacks) => [...feedbacks, newFeedback]);

    // Update review cycle
    setState('reviewCycles', (cycles) =>
      cycles.map((cycle) =>
        cycle.id === cycleId
          ? {
              ...cycle,
              externalFeedbackIds: [...cycle.externalFeedbackIds, newFeedback.id],
              feedbackRequestsSent: cycle.feedbackRequestsSent + 1,
              feedbackReceived: cycle.feedbackReceived + 1,
              updatedAt: now,
            }
          : cycle
      )
    );

    return `${window.location.origin}/feedback/${newFeedback.token}`;
  },

  getFeedbackByToken(token: string): ExternalFeedback | undefined {
    return state.externalFeedback.find((f) => f.token === token);
  },

  addAccolade(accolade: Omit<AccoladeEntry, 'id' | 'userId' | 'createdAt'>) {
    const userId = getUserId();
    const now = new Date();
    const newAccolade: AccoladeEntry = {
      ...accolade,
      id: generateId(),
      userId,
      createdAt: now,
    };
    setState('accolades', (accolades) => [newAccolade, ...accolades]);
  },

  updateAccolade(id: string, updates: Partial<AccoladeEntry>) {
    setState('accolades', (accolades) =>
      accolades.map((accolade) => (accolade.id === id ? { ...accolade, ...updates } : accolade))
    );
  },

  deleteAccolade(id: string) {
    setState('accolades', (accolades) => accolades.filter((a) => a.id !== id));
  },

  // -------------------------------------------------------------------------
  // DATA MANAGEMENT
  // -------------------------------------------------------------------------

  exportData() {
    return {
      salaryHistory: state.salaryHistory,
      checkIns: state.checkIns,
      accomplishments: state.accomplishments,
      employmentState: state.employmentState,
      reviewCycles: state.reviewCycles,
      selfReviews: state.selfReviews,
      externalFeedback: state.externalFeedback,
      accolades: state.accolades,
      exportedAt: new Date().toISOString(),
    };
  },

  importData(data: any) {
    setState('salaryHistory', reviveDates(data.salaryHistory));
    setState('checkIns', reviveDates(data.checkIns));
    setState('accomplishments', reviveDates(data.accomplishments));
    setState('employmentState', reviveDates(data.employmentState));
    setState('reviewCycles', reviveDates(data.reviewCycles));
    setState('selfReviews', reviveDates(data.selfReviews));
    setState('externalFeedback', reviveDates(data.externalFeedback));
    setState('accolades', reviveDates(data.accolades));
  },

  clearAllData() {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    const initialState = loadInitialState();
    setState(initialState);
  },
};

export default prosperStore;
