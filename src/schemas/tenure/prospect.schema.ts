/**
 * Tenure Prospect Schema - Job Application Tracking
 *
 * Formerly "pipeline.schema.ts" - renamed to match Tenure module naming.
 * Tracks job applications through the hiring pipeline.
 *
 * @module schemas/tenure/prospect
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { z } from 'zod';
import {
  WorkExperience,
  WorkExperienceSchema,
  Education,
  EducationSchema,
  SalaryRange,
  SalaryRangeSchema,
  GeoLocation,
  GeoLocationSchema,
  LocationPreference,
  LocationPreferenceSchema,
  Contact,
  ContactSchema,
  SyncMetadata,
  TenureFeatureFlags,
  TenureFeatureFlagsSchema,
  DEFAULT_FEATURE_FLAGS,
} from './common.schema';

// =============================================================================
// APPLICATION STATUS
// =============================================================================

export type ApplicationStatus =
  | 'saved' // Bookmarked, not yet applied
  | 'applied' // Application submitted
  | 'screening' // Initial contact/conversations
  | 'interviewing' // Official interview process
  | 'offered' // Received offer
  | 'accepted' // Accepted the offer
  | 'rejected' // Rejected by company
  | 'withdrawn'; // Withdrew from consideration

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  screening: 'Screen',
  interviewing: 'Interview',
  offered: 'Offer',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const APPLICATION_STATUS_ORDER: ApplicationStatus[] = [
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

// =============================================================================
// STATUS TIMELINE
// =============================================================================

export interface StatusChange {
  status: ApplicationStatus;
  timestamp: Date;
  note?: string;
}

export const StatusChangeSchema = z.object({
  status: z.enum([
    'saved',
    'applied',
    'screening',
    'interviewing',
    'offered',
    'accepted',
    'rejected',
    'withdrawn',
  ]),
  timestamp: z.date(),
  note: z.string().optional(),
});

// =============================================================================
// JOB CONTACTS & DOCUMENTS
// =============================================================================

export interface JobContact {
  id: string;
  name: string;
  role?: string;
  email?: string;
  linkedIn?: string;
  notes?: string;
}

export const JobContactSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string().optional(),
  email: z.string().email().optional(),
  linkedIn: z.string().optional(),
  notes: z.string().optional(),
});

export interface JobDocument {
  id: string;
  name: string;
  type: 'resume' | 'cover_letter' | 'portfolio' | 'other';
  url?: string;
  content?: string;
}

export const JobDocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['resume', 'cover_letter', 'portfolio', 'other']),
  url: z.string().optional(),
  content: z.string().optional(),
});

// =============================================================================
// JOB ANALYSIS (AI)
// =============================================================================

export interface RequirementMatch {
  requirement: string;
  yearsRequired?: number;
  yearsUserHas?: number;
  matched: boolean;
  gap?: string;
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

export const JobAnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100),
  requirementMatches: z.array(
    z.object({
      requirement: z.string(),
      yearsRequired: z.number().optional(),
      yearsUserHas: z.number().optional(),
      matched: z.boolean(),
      gap: z.string().optional(),
      keywords: z.array(z.string()),
    })
  ),
  keywordAnalysis: z.array(
    z.object({
      keyword: z.string(),
      inJobPosting: z.boolean(),
      inResume: z.boolean(),
      importance: z.enum(['critical', 'important', 'nice-to-have']),
    })
  ),
  missingKeywords: z.array(z.string()),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  suggestions: z.array(z.string()),
  analyzedAt: z.date(),
});

// =============================================================================
// BLS MARKET DATA
// =============================================================================

export interface BlsMarketData {
  socCode: string;
  occupationTitle: string;
  medianWageAnnual: number;
  medianWageHourly: number;
  wagePercentiles?: {
    p10: number;
    p25: number;
    p75: number;
    p90: number;
  };
  employment?: number;
  growthProjection?: number;
  annualOpenings?: number;
  outlook?: 'excellent' | 'good' | 'fair' | 'limited' | 'declining';
  fetchedAt: Date;
  areaLevel: 'national' | 'state' | 'msa';
  areaCode?: string;
  areaName?: string;
}

export const BlsMarketDataSchema = z.object({
  socCode: z.string(),
  occupationTitle: z.string(),
  medianWageAnnual: z.number(),
  medianWageHourly: z.number(),
  wagePercentiles: z
    .object({
      p10: z.number(),
      p25: z.number(),
      p75: z.number(),
      p90: z.number(),
    })
    .optional(),
  employment: z.number().optional(),
  growthProjection: z.number().optional(),
  annualOpenings: z.number().optional(),
  outlook: z.enum(['excellent', 'good', 'fair', 'limited', 'declining']).optional(),
  fetchedAt: z.date(),
  areaLevel: z.enum(['national', 'state', 'msa']),
  areaCode: z.string().optional(),
  areaName: z.string().optional(),
});

// =============================================================================
// SNOOZE & NOTIFICATIONS
// =============================================================================

export interface SnoozeEntry {
  snoozedAt: Date;
  snoozedUntil: Date;
  reason?: 'manual' | 'holiday' | 'weekend' | 'busy';
  note?: string;
}

export const SnoozeEntrySchema = z.object({
  snoozedAt: z.date(),
  snoozedUntil: z.date(),
  reason: z.enum(['manual', 'holiday', 'weekend', 'busy']).optional(),
  note: z.string().optional(),
});

export interface NotificationInteraction {
  applicationId: string;
  lastViewedAt?: Date;
  dismissedAt?: Date;
  lastActivitySeenAt?: Date;
  snoozeCount: number;
  viewCount: number;
}

export const NotificationInteractionSchema = z.object({
  applicationId: z.string(),
  lastViewedAt: z.date().optional(),
  dismissedAt: z.date().optional(),
  lastActivitySeenAt: z.date().optional(),
  snoozeCount: z.number().int().min(0),
  viewCount: z.number().int().min(0),
});

// =============================================================================
// JOB APPLICATION
// =============================================================================

export interface JobApplication {
  id: string;

  // Job details
  companyName: string;
  roleName: string;
  jobUrl?: string;
  jobPostingText?: string;
  location?: string;
  locationType?: 'remote' | 'hybrid' | 'onsite';
  salary?: SalaryRange;
  department?: string;

  // Pipeline state
  status: ApplicationStatus;
  statusHistory: StatusChange[];
  rejectedAtStatus?: ApplicationStatus;

  // Timeline
  savedAt: Date;
  appliedAt?: Date;
  lastActivityAt: Date;
  followUpDue?: Date;

  // Notifications
  snoozedUntil?: Date;
  snoozeHistory?: SnoozeEntry[];

  // Analysis
  analysis?: JobAnalysis;
  criteriaScores: { criterionId: string; score: number; note?: string }[];

  // RIASEC fit (from Discover)
  riasecFitScore?: number;
  matchedRiasecTypes?: string[];

  // Market data
  socCode?: string;
  blsMarketData?: BlsMarketData;

  // Notes & attachments
  notes: string;
  contacts: JobContact[];
  documents: JobDocument[];

  // Sync metadata
  createdAt: Date;
  updatedAt: Date;
  syncVersion: number;
}

export const JobApplicationSchema = z.object({
  id: z.string(),
  companyName: z.string(),
  roleName: z.string(),
  jobUrl: z.string().optional(),
  jobPostingText: z.string().optional(),
  location: z.string().optional(),
  locationType: z.enum(['remote', 'hybrid', 'onsite']).optional(),
  salary: SalaryRangeSchema.optional(),
  department: z.string().optional(),
  status: z.enum([
    'saved',
    'applied',
    'screening',
    'interviewing',
    'offered',
    'accepted',
    'rejected',
    'withdrawn',
  ]),
  statusHistory: z.array(StatusChangeSchema),
  rejectedAtStatus: z
    .enum([
      'saved',
      'applied',
      'screening',
      'interviewing',
      'offered',
      'accepted',
      'rejected',
      'withdrawn',
    ])
    .optional(),
  savedAt: z.date(),
  appliedAt: z.date().optional(),
  lastActivityAt: z.date(),
  followUpDue: z.date().optional(),
  snoozedUntil: z.date().optional(),
  snoozeHistory: z.array(SnoozeEntrySchema).optional(),
  analysis: JobAnalysisSchema.optional(),
  criteriaScores: z.array(
    z.object({
      criterionId: z.string(),
      score: z.number(),
      note: z.string().optional(),
    })
  ),
  riasecFitScore: z.number().min(0).max(100).optional(),
  matchedRiasecTypes: z.array(z.string()).optional(),
  socCode: z.string().optional(),
  blsMarketData: BlsMarketDataSchema.optional(),
  notes: z.string(),
  contacts: z.array(JobContactSchema),
  documents: z.array(JobDocumentSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  syncVersion: z.number().int().min(1),
});

// =============================================================================
// USER CRITERIA
// =============================================================================

export type CriteriaCategory = 'must-have' | 'nice-to-have' | 'deal-breaker';

export interface UserCriterion {
  id: string;
  name: string;
  category: CriteriaCategory;
  weight: number; // 1-5
  description?: string;
}

export const UserCriterionSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['must-have', 'nice-to-have', 'deal-breaker']),
  weight: z.number().int().min(1).max(5),
  description: z.string().optional(),
});

export const DEFAULT_CRITERIA: UserCriterion[] = [
  { id: 'remote', name: 'Remote Work', category: 'must-have', weight: 5 },
  { id: 'salary', name: 'Salary Match', category: 'must-have', weight: 5 },
  { id: 'culture', name: 'Good Culture', category: 'nice-to-have', weight: 3 },
  { id: 'growth', name: 'Growth Opportunity', category: 'nice-to-have', weight: 4 },
  { id: 'tech-stack', name: 'Tech Stack Match', category: 'nice-to-have', weight: 3 },
  { id: 'benefits', name: 'Benefits Package', category: 'nice-to-have', weight: 3 },
];

// =============================================================================
// USER PROFILE (Career Profile)
// =============================================================================

export interface UserProfile {
  id: string;

  // Basic info
  name: string;
  email?: string;
  phone?: string;
  /** User's primary job title they're searching for (displayed in pipeline header) */
  primaryOccupation?: string;
  location?: string;
  geolocation?: GeoLocation;
  locationPreferences?: LocationPreference;
  targetOccupations?: { socCode: string; title: string }[];
  linkedIn?: string;
  portfolio?: string;

  // Resume content
  summary?: string;
  experiences: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications: string[];
  rawResumeText?: string;
  extractedKeywords: string[];

  // RIASEC profile (from Discover)
  riasecScores?: Record<string, number>;
  dominantTypes?: string[];

  // Sync metadata
  createdAt: Date;
  updatedAt: Date;
  syncVersion: number;
}

export const UserProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  primaryOccupation: z.string().optional(),
  location: z.string().optional(),
  geolocation: GeoLocationSchema.optional(),
  locationPreferences: LocationPreferenceSchema.optional(),
  targetOccupations: z
    .array(
      z.object({
        socCode: z.string(),
        title: z.string(),
      })
    )
    .optional(),
  linkedIn: z.string().optional(),
  portfolio: z.string().optional(),
  summary: z.string().optional(),
  experiences: z.array(WorkExperienceSchema),
  education: z.array(EducationSchema),
  skills: z.array(z.string()),
  certifications: z.array(z.string()),
  rawResumeText: z.string().optional(),
  extractedKeywords: z.array(z.string()),
  riasecScores: z.record(z.string(), z.number()).optional(),
  dominantTypes: z.array(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  syncVersion: z.number().int().min(1),
});

// =============================================================================
// SETTINGS
// =============================================================================

export interface LaborMarketSettings {
  enabled: boolean;
  autoFetchOnAdd: boolean;
  cacheRefreshHours: number;
  defaultAreaLevel: 'national' | 'state' | 'msa';
  showInJobCards: boolean;
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

export interface ProspectSettings {
  // Follow-up timing
  followUpIntervalDays: number;
  agingWarningDays: number;
  agingCriticalDays: number;
  holidayModeEnabled: boolean;
  holidayExtensionDays: number;

  // User criteria
  criteria: UserCriterion[];

  // API configuration
  apiMode: 'byok' | 'managed' | 'none';
  apiKey?: string;
  apiProvider?: 'anthropic' | 'openai';

  // Navigation defaults
  defaultLandingTab: 'discover' | 'prepare' | 'prospect' | 'prosper';
  defaultProspectSection?: 'dashboard' | 'pipeline' | 'insights' | 'settings';
  defaultInsightsTab?: 'flow' | 'analytics' | 'trends';

  // Sync
  syncEnabled: boolean;
  lastSyncAt?: Date;
  syncVersion: number;

  // Labor market
  laborMarket?: LaborMarketSettings;
}

export const ProspectSettingsSchema = z.object({
  followUpIntervalDays: z.number().int().min(1),
  agingWarningDays: z.number().int().min(1),
  agingCriticalDays: z.number().int().min(1),
  holidayModeEnabled: z.boolean(),
  holidayExtensionDays: z.number().int().min(0),
  criteria: z.array(UserCriterionSchema),
  apiMode: z.enum(['byok', 'managed', 'none']),
  apiKey: z.string().optional(),
  apiProvider: z.enum(['anthropic', 'openai']).optional(),
  defaultLandingTab: z.enum(['discover', 'prepare', 'prospect', 'prosper']),
  defaultProspectSection: z.enum(['dashboard', 'pipeline', 'insights', 'settings']).optional(),
  defaultInsightsTab: z.enum(['flow', 'analytics', 'trends']).optional(),
  syncEnabled: z.boolean(),
  lastSyncAt: z.date().optional(),
  syncVersion: z.number().int().min(1),
  laborMarket: z
    .object({
      enabled: z.boolean(),
      autoFetchOnAdd: z.boolean(),
      cacheRefreshHours: z.number().int().min(1),
      defaultAreaLevel: z.enum(['national', 'state', 'msa']),
      showInJobCards: z.boolean(),
      showSalaryAlerts: z.boolean(),
    })
    .optional(),
});

export const DEFAULT_PROSPECT_SETTINGS: ProspectSettings = {
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

// =============================================================================
// SYNC DATA
// =============================================================================

export interface ProspectSyncData {
  version: number;
  exportedAt: Date;
  profile: UserProfile | null;
  applications: JobApplication[];
  settings: ProspectSettings;
  riasecAnswers?: Record<string, number>;
}

// =============================================================================
// HELPERS
// =============================================================================

/** Internal helper - canonical export is from index.ts */
function daysSince(date: Date): number {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getAgingStatus(
  days: number,
  settings: ProspectSettings
): 'fresh' | 'warning' | 'critical' {
  if (days >= settings.agingCriticalDays) return 'critical';
  if (days >= settings.agingWarningDays) return 'warning';
  return 'fresh';
}

export function isSnoozed(application: JobApplication): boolean {
  if (!application.snoozedUntil) return false;
  return new Date(application.snoozedUntil) > new Date();
}

export function shouldNotify(application: JobApplication, settings: ProspectSettings): boolean {
  if (TERMINAL_STATUSES.includes(application.status)) return false;
  if (isSnoozed(application)) return false;

  const warningThreshold = settings.holidayModeEnabled
    ? settings.agingWarningDays + settings.holidayExtensionDays
    : settings.agingWarningDays;

  const days = daysSince(application.lastActivityAt);
  return days >= warningThreshold;
}

export function getEffectiveThresholds(settings: ProspectSettings): {
  warning: number;
  critical: number;
} {
  const extension = settings.holidayModeEnabled ? settings.holidayExtensionDays : 0;
  return {
    warning: settings.agingWarningDays + extension,
    critical: settings.agingCriticalDays + extension,
  };
}

export function snoozeApplication(
  application: JobApplication,
  snoozeDays: number,
  reason: SnoozeEntry['reason'] = 'manual'
): JobApplication {
  const now = new Date();
  const snoozedUntil = new Date(now);
  snoozedUntil.setDate(snoozedUntil.getDate() + snoozeDays);

  return {
    ...application,
    snoozedUntil,
    snoozeHistory: [...(application.snoozeHistory || []), { snoozedAt: now, snoozedUntil, reason }],
    updatedAt: now,
    syncVersion: application.syncVersion + 1,
  };
}

export function unsnoozeApplication(application: JobApplication): JobApplication {
  return {
    ...application,
    snoozedUntil: undefined,
    updatedAt: new Date(),
    syncVersion: application.syncVersion + 1,
  };
}

// Re-export feature flags for backward compatibility
export type { TenureFeatureFlags };
export { TenureFeatureFlagsSchema, DEFAULT_FEATURE_FLAGS };
export type FeatureFlags = TenureFeatureFlags;
export type PipelineSettings = ProspectSettings; // Alias for backward compatibility
export const DEFAULT_SETTINGS = DEFAULT_PROSPECT_SETTINGS;
