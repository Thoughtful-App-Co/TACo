/**
 * Pipeline Schema - Job Application Tracking System
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

// ============================================================================
// JOB APPLICATION
// ============================================================================

export type ApplicationStatus =
  | 'saved' // Bookmarked, not yet applied
  | 'applied' // Application submitted
  | 'screening' // Initial contact/conversations (not official interview yet)
  | 'interviewing' // Official interview process
  | 'offered' // Received offer
  | 'accepted' // Accepted the offer
  | 'rejected' // Rejected by company
  | 'withdrawn'; // Withdrew from consideration

export interface StatusChange {
  status: ApplicationStatus;
  timestamp: Date;
  note?: string;
}

export interface SalaryRange {
  min?: number;
  max?: number;
  currency: string;
  period: 'hourly' | 'annual';
}

export interface JobContact {
  id: string;
  name: string;
  role?: string;
  email?: string;
  linkedIn?: string;
  notes?: string;
}

export interface JobDocument {
  id: string;
  name: string;
  type: 'resume' | 'cover_letter' | 'portfolio' | 'other';
  url?: string;
  content?: string; // For inline storage
}

export interface RequirementMatch {
  requirement: string;
  yearsRequired?: number;
  yearsUserHas?: number;
  matched: boolean;
  gap?: string; // e.g., "Need 1 more year"
  keywords: string[];
}

export interface KeywordAnalysis {
  keyword: string;
  inJobPosting: boolean;
  inResume: boolean;
  importance: 'critical' | 'important' | 'nice-to-have';
}

export interface JobAnalysis {
  overallScore: number; // 0-100
  requirementMatches: RequirementMatch[];
  keywordAnalysis: KeywordAnalysis[];
  missingKeywords: string[];
  strengths: string[];
  gaps: string[];
  suggestions: string[];
  analyzedAt: Date;
}

/**
 * Cached BLS labor market data for a job/occupation
 */
export interface BlsMarketData {
  /** Standard Occupational Classification code (e.g., "15-1252") */
  socCode: string;
  /** Occupation title from BLS */
  occupationTitle: string;
  /** National median annual wage */
  medianWageAnnual: number;
  /** National median hourly wage */
  medianWageHourly: number;
  /** Wage percentiles for context */
  wagePercentiles?: {
    p10: number;
    p25: number;
    p75: number;
    p90: number;
  };
  /** Total national employment */
  employment?: number;
  /** 10-year growth projection (percent) */
  growthProjection?: number;
  /** Average annual job openings */
  annualOpenings?: number;
  /** Outlook assessment */
  outlook?: 'excellent' | 'good' | 'fair' | 'limited' | 'declining';
  /** When this data was fetched */
  fetchedAt: Date;
  /** Geographic level of this data */
  areaLevel: 'national' | 'state' | 'msa';
  /** Area code if state/msa level */
  areaCode?: string;
  /** Area name if state/msa level */
  areaName?: string;
}

export interface SnoozeEntry {
  snoozedAt: Date;
  snoozedUntil: Date;
  reason?: 'manual' | 'holiday' | 'weekend' | 'busy';
  note?: string;
}

export interface NotificationInteraction {
  applicationId: string;
  lastViewedAt?: Date; // When user last viewed this notification
  dismissedAt?: Date; // When user dismissed this notification (won't show again until new activity)
  lastActivitySeenAt?: Date; // The lastActivityAt timestamp when user last viewed
  snoozeCount: number; // How many times user has snoozed this app
  viewCount: number; // How many times user has viewed this notification
}

export interface JobApplication {
  id: string;

  // Job details
  companyName: string;
  roleName: string;
  jobUrl?: string;
  jobPostingText?: string; // Raw job posting for reference
  location?: string;
  locationType?: 'remote' | 'hybrid' | 'onsite';
  salary?: SalaryRange;
  department?: string;

  // Pipeline state
  status: ApplicationStatus;
  statusHistory: StatusChange[];
  rejectedAtStatus?: ApplicationStatus; // Tracks which stage rejection occurred at

  // Timing & Aging
  savedAt: Date;
  appliedAt?: Date;
  lastActivityAt: Date;
  followUpDue?: Date;

  // Notification & Snooze
  snoozedUntil?: Date; // If set, hide from notifications until this date
  snoozeHistory?: SnoozeEntry[]; // Track snooze patterns for analytics

  // Analysis results
  analysis?: JobAnalysis;

  // User-defined criteria scoring
  criteriaScores: { criterionId: string; score: number; note?: string }[];

  // RIASEC match (if from assessment)
  riasecFitScore?: number;
  matchedRiasecTypes?: string[];

  // BLS Market Data
  /** Standard Occupational Classification code */
  socCode?: string;
  /** Cached BLS market data for this occupation */
  blsMarketData?: BlsMarketData;

  // Notes & context
  notes: string;
  contacts: JobContact[];
  documents: JobDocument[];

  // Sync metadata
  createdAt: Date;
  updatedAt: Date;
  syncVersion: number;
}

// ============================================================================
// USER CRITERIA
// ============================================================================

export type CriteriaCategory = 'must-have' | 'nice-to-have' | 'deal-breaker';

export interface UserCriterion {
  id: string;
  name: string;
  category: CriteriaCategory;
  weight: number; // 1-5
  description?: string;
}

// Default criteria templates
export const DEFAULT_CRITERIA: UserCriterion[] = [
  { id: 'remote', name: 'Remote Work', category: 'must-have', weight: 5 },
  { id: 'salary', name: 'Salary Match', category: 'must-have', weight: 5 },
  { id: 'culture', name: 'Good Culture', category: 'nice-to-have', weight: 3 },
  { id: 'growth', name: 'Growth Opportunity', category: 'nice-to-have', weight: 4 },
  { id: 'tech-stack', name: 'Tech Stack Match', category: 'nice-to-have', weight: 3 },
  { id: 'benefits', name: 'Benefits Package', category: 'nice-to-have', weight: 3 },
];

// ============================================================================
// USER RESUME / PROFILE
// ============================================================================

// Import types from prepare schema for enhanced experience tracking
// Note: Actual Project and QuantifiableMetric types defined in prepare.schema.ts
export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  startDate: Date;
  endDate?: Date; // null = current
  location?: string;
  locationType?: 'remote' | 'hybrid' | 'onsite';
  description: string;
  elaboration?: string; // User's deeper write-up

  // Enhanced for Prepare module
  projects?: any[]; // Project[] from prepare.schema.ts
  metrics?: any[]; // QuantifiableMetric[] from prepare.schema.ts
  bulletPoints?: string[]; // AI-generated or manually crafted
  rawBullets?: string[]; // Original from uploaded resume

  // Existing fields
  skills: string[];
  achievements: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  graduationDate?: Date;
  gpa?: number;
}

export interface UserProfile {
  id: string;

  // Basic info
  name: string;
  email?: string;
  phone?: string;
  /** User's primary job title they're searching for (displayed in pipeline header) */
  primaryOccupation?: string;
  location?: string;
  geolocation?: {
    city?: string;
    state?: string;
    country?: string;
    timezone?: string;
  };
  /** User's job search location preferences */
  locationPreferences?: UserLocationPreference;
  /** Target occupations for market data */
  targetOccupations?: { socCode: string; title: string }[];
  linkedIn?: string;
  portfolio?: string;

  // Resume content
  summary?: string;
  experiences: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications: string[];

  // Raw resume for reference
  rawResumeText?: string;

  // Parsed/extracted keywords for matching
  extractedKeywords: string[];

  // RIASEC profile (linked from assessment)
  riasecScores?: Record<string, number>;
  dominantTypes?: string[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  syncVersion: number;
}

/**
 * User's location preferences for job search
 */
export interface UserLocationPreference {
  /** Current location */
  current?: {
    city?: string;
    state: string;
    msa?: string;
  };
  /** Willing to relocate */
  willingToRelocate: boolean;
  /** Target locations if willing to relocate */
  targetLocations?: {
    states?: string[];
    msas?: string[];
  };
  /** Remote work preference */
  remotePreference: 'remote-only' | 'remote-preferred' | 'hybrid' | 'onsite' | 'flexible';
}

// ============================================================================
// PIPELINE SETTINGS
// ============================================================================

/**
 * Settings for labor market data features
 */
export interface LaborMarketSettings {
  /** Enable BLS market data integration */
  enabled: boolean;
  /** Auto-fetch market data when adding jobs */
  autoFetchOnAdd: boolean;
  /** Refresh cache interval (hours) */
  cacheRefreshHours: number;
  /** Default geographic level for data */
  defaultAreaLevel: 'national' | 'state' | 'msa';
  /** Show market data in job cards */
  showInJobCards: boolean;
  /** Show salary comparison alerts */
  showSalaryAlerts: boolean;
}

export const DEFAULT_LABOR_MARKET_SETTINGS: LaborMarketSettings = {
  enabled: true,
  autoFetchOnAdd: true,
  cacheRefreshHours: 24,
  defaultAreaLevel: 'national',
  showInJobCards: true,
  showSalaryAlerts: true,
};

export interface PipelineSettings {
  // Follow-up timing
  followUpIntervalDays: number; // Default: 7
  agingWarningDays: number; // Default: 14 (yellow)
  agingCriticalDays: number; // Default: 30 (red)

  // Holiday mode - extends aging thresholds during hiring slowdowns
  holidayModeEnabled: boolean; // Default: false
  holidayExtensionDays: number; // Default: 7 - extra days added to thresholds

  // User criteria
  criteria: UserCriterion[];

  // API configuration
  apiMode: 'byok' | 'managed' | 'none';
  apiKey?: string; // For BYOK
  apiProvider?: 'anthropic' | 'openai';

  // Default landing tab for /tenure route
  defaultLandingTab: 'discover' | 'prepare' | 'prospect' | 'prosper';

  // Default Prospect section (for /tenure/prospect route)
  defaultProspectSection?: 'dashboard' | 'pipeline' | 'insights' | 'settings';

  // Default Insights tab (for /tenure/prospect/insights route)
  defaultInsightsTab?: 'flow' | 'analytics' | 'trends';

  // Sync
  syncEnabled: boolean;
  lastSyncAt?: Date;
  syncVersion: number;

  /** Labor market data settings */
  laborMarket?: LaborMarketSettings;
}

export const DEFAULT_SETTINGS: PipelineSettings = {
  followUpIntervalDays: 7,
  agingWarningDays: 14,
  agingCriticalDays: 30,
  holidayModeEnabled: false,
  holidayExtensionDays: 7,
  criteria: DEFAULT_CRITERIA,
  apiMode: 'none',
  defaultLandingTab: 'discover',
  syncEnabled: false,
  syncVersion: 1,
  laborMarket: DEFAULT_LABOR_MARKET_SETTINGS,
};

// ============================================================================
// SYNC DATA STRUCTURE
// ============================================================================

export interface PipelineSyncData {
  version: number;
  exportedAt: Date;
  profile: UserProfile | null;
  applications: JobApplication[];
  settings: PipelineSettings;
  riasecAnswers?: Record<string, number>; // Preserve RIASEC data
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export interface FeatureFlags {
  showDiscover: boolean; // RIASEC assessment module
  showPrepare: boolean; // Resume builder module
  showProspect: boolean; // Job tracking pipeline (renamed from showPipeline)
  showProsper: boolean; // Career journal module
  showMatches: boolean; // Deprecated - career matches (sunset)
  enableSync: boolean;
  enableAI: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  showDiscover: true,
  showPrepare: true,
  showProspect: true,
  showProsper: true,
  showMatches: false, // Sunset
  enableSync: true,
  enableAI: true,
};

// ============================================================================
// STREAMING ANALYSIS STATE
// ============================================================================

export interface AnalysisStreamState {
  isAnalyzing: boolean;
  currentStep: 'parsing' | 'extracting' | 'matching' | 'scoring' | 'complete' | 'error';
  progress: number; // 0-100
  messages: string[]; // Stream of status messages
  error?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  screening: 'Screen',
  interviewing: 'Interview',
  offered: 'Offer',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const STATUS_ORDER: ApplicationStatus[] = [
  'saved',
  'applied',
  'screening',
  'interviewing',
  'offered',
  'accepted',
  'rejected',
  'withdrawn',
];

export const ACTIVE_STATUSES: ApplicationStatus[] = [
  'saved',
  'applied',
  'screening',
  'interviewing',
  'offered',
];

export const TERMINAL_STATUSES: ApplicationStatus[] = ['accepted', 'rejected', 'withdrawn'];

/**
 * Calculate days since a date
 */
export function daysSince(date: Date): number {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get aging status based on days
 */
export function getAgingStatus(
  days: number,
  settings: PipelineSettings
): 'fresh' | 'warning' | 'critical' {
  if (days >= settings.agingCriticalDays) return 'critical';
  if (days >= settings.agingWarningDays) return 'warning';
  return 'fresh';
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

// ============================================================================
// NOTIFICATION & SNOOZE HELPERS
// ============================================================================

/**
 * Check if an application is currently snoozed
 */
export function isSnoozed(application: JobApplication): boolean {
  if (!application.snoozedUntil) return false;
  return new Date(application.snoozedUntil) > new Date();
}

/**
 * Check if an application should trigger a notification (stale and not snoozed)
 */
export function shouldNotify(application: JobApplication, settings: PipelineSettings): boolean {
  // Don't notify for terminal statuses
  if (TERMINAL_STATUSES.includes(application.status)) return false;

  // Don't notify if snoozed
  if (isSnoozed(application)) return false;

  // Apply holiday mode if enabled
  const warningThreshold = settings.holidayModeEnabled
    ? settings.agingWarningDays + settings.holidayExtensionDays
    : settings.agingWarningDays;

  // Check if stale
  const days = daysSince(application.lastActivityAt);
  return days >= warningThreshold;
}

/**
 * Get effective aging thresholds (with holiday mode applied if enabled)
 */
export function getEffectiveThresholds(settings: PipelineSettings): {
  warning: number;
  critical: number;
} {
  const extension = settings.holidayModeEnabled ? settings.holidayExtensionDays : 0;
  return {
    warning: settings.agingWarningDays + extension,
    critical: settings.agingCriticalDays + extension,
  };
}

/**
 * Snooze an application until a specific date
 */
export function snoozeApplication(
  application: JobApplication,
  snoozeDays: number,
  reason: SnoozeEntry['reason'] = 'manual'
): JobApplication {
  const now = new Date();
  const snoozedUntil = new Date(now);
  snoozedUntil.setDate(snoozedUntil.getDate() + snoozeDays);

  const snoozeEntry: SnoozeEntry = {
    snoozedAt: now,
    snoozedUntil,
    reason,
  };

  return {
    ...application,
    snoozedUntil,
    snoozeHistory: [...(application.snoozeHistory || []), snoozeEntry],
    updatedAt: now,
    syncVersion: application.syncVersion + 1,
  };
}

/**
 * Unsnooze an application (clear snoozedUntil)
 */
export function unsnoozeApplication(application: JobApplication): JobApplication {
  return {
    ...application,
    snoozedUntil: undefined,
    updatedAt: new Date(),
    syncVersion: application.syncVersion + 1,
  };
}
