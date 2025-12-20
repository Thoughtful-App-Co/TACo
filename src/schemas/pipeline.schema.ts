/**
 * Pipeline Schema - Job Application Tracking System
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

// ============================================================================
// JOB APPLICATION
// ============================================================================

export type ApplicationStatus =
  | 'saved' // Bookmarked but not applied
  | 'applied' // Application submitted
  | 'screening' // Initial HR screening
  | 'interviewing' // In interview process
  | 'offered' // Received offer
  | 'accepted' // Accepted offer
  | 'rejected' // Rejected by company
  | 'withdrawn'; // Withdrawn by user

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

  // Timing & Aging
  savedAt: Date;
  appliedAt?: Date;
  lastActivityAt: Date;
  followUpDue?: Date;

  // Analysis results
  analysis?: JobAnalysis;

  // User-defined criteria scoring
  criteriaScores: { criterionId: string; score: number; note?: string }[];

  // RIASEC match (if from assessment)
  riasecFitScore?: number;
  matchedRiasecTypes?: string[];

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

export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  startDate: Date;
  endDate?: Date; // null = current
  description: string;
  elaboration?: string; // User's deeper write-up
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
  location?: string;
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

// ============================================================================
// PIPELINE SETTINGS
// ============================================================================

export interface PipelineSettings {
  // Follow-up timing
  followUpIntervalDays: number; // Default: 7
  agingWarningDays: number; // Default: 14 (yellow)
  agingCriticalDays: number; // Default: 30 (red)

  // User criteria
  criteria: UserCriterion[];

  // API configuration
  apiMode: 'byok' | 'managed' | 'none';
  apiKey?: string; // For BYOK
  apiProvider?: 'anthropic' | 'openai';

  // Sync
  syncEnabled: boolean;
  lastSyncAt?: Date;
  syncVersion: number;
}

export const DEFAULT_SETTINGS: PipelineSettings = {
  followUpIntervalDays: 7,
  agingWarningDays: 14,
  agingCriticalDays: 30,
  criteria: DEFAULT_CRITERIA,
  apiMode: 'none',
  syncEnabled: false,
  syncVersion: 1,
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
  showMatches: boolean;
  showPipeline: boolean;
  enableSync: boolean;
  enableAI: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  showMatches: false, // Sunset for now
  showPipeline: true,
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
  screening: 'Screening',
  interviewing: 'Interviewing',
  offered: 'Offered',
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
