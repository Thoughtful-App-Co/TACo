/**
 * Tenure Prosper Schema - Career Journal & Accomplishment Tracking
 *
 * Track career growth, accomplishments, salary history, and 360 reviews.
 *
 * @module schemas/tenure/prosper
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { z } from 'zod';
import { QuantifiableMetric, QuantifiableMetricSchema } from './common.schema';

// =============================================================================
// EMPLOYMENT STATE
// =============================================================================

export type CheckInFrequency = 'monthly' | 'quarterly' | 'biannually';

export interface EmploymentState {
  isCurrentlyEmployed: boolean;
  currentEmployerId?: string;
  currentCompany?: string;
  currentTitle?: string;
  employmentStartDate?: Date;
  checkInFrequency: CheckInFrequency;
  lastCheckInDate?: Date;
  nextCheckInDue?: Date;
  checkInReminderDays: number;
}

export const EmploymentStateSchema = z.object({
  isCurrentlyEmployed: z.boolean(),
  currentEmployerId: z.string().optional(),
  currentCompany: z.string().optional(),
  currentTitle: z.string().optional(),
  employmentStartDate: z.date().optional(),
  checkInFrequency: z.enum(['monthly', 'quarterly', 'biannually']),
  lastCheckInDate: z.date().optional(),
  nextCheckInDue: z.date().optional(),
  checkInReminderDays: z.number().int().min(0),
});

// =============================================================================
// QUARTERLY CHECK-IN
// =============================================================================

export type MoodLevel = 'thriving' | 'satisfied' | 'neutral' | 'struggling' | 'burnt-out';

export interface CheckInAccomplishments {
  projectIds: string[];
  metricIds: string[];
  customAccomplishments: string[];
}

export interface CheckInReflection {
  satisfactionScore: number; // 1-10
  mood: MoodLevel;
  whatIsGoingWell: string;
  challenges: string;
  learningGoals: string;
  privateNotes?: string;
}

export interface QuarterlyCheckIn {
  id: string;
  userId: string;
  quarter: string;
  year: number;
  quarterNumber: 1 | 2 | 3 | 4;
  periodStart: Date;
  periodEnd: Date;
  employerId?: string;
  company: string;
  title: string;
  accomplishments: CheckInAccomplishments;
  reflection: CheckInReflection;
  skillsGained: string[];
  certificationsEarned: string[];
  trainingsCompleted: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  isDraft: boolean;
}

export const QuarterlyCheckInSchema = z.object({
  id: z.string(),
  userId: z.string(),
  quarter: z.string(),
  year: z.number().int(),
  quarterNumber: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  periodStart: z.date(),
  periodEnd: z.date(),
  employerId: z.string().optional(),
  company: z.string(),
  title: z.string(),
  accomplishments: z.object({
    projectIds: z.array(z.string()),
    metricIds: z.array(z.string()),
    customAccomplishments: z.array(z.string()),
  }),
  reflection: z.object({
    satisfactionScore: z.number().min(1).max(10),
    mood: z.enum(['thriving', 'satisfied', 'neutral', 'struggling', 'burnt-out']),
    whatIsGoingWell: z.string(),
    challenges: z.string(),
    learningGoals: z.string(),
    privateNotes: z.string().optional(),
  }),
  skillsGained: z.array(z.string()),
  certificationsEarned: z.array(z.string()),
  trainingsCompleted: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
  isDraft: z.boolean(),
});

// =============================================================================
// ACCOMPLISHMENT LOG
// =============================================================================

export type AccomplishmentType =
  | 'project'
  | 'metric'
  | 'recognition'
  | 'learning'
  | 'milestone'
  | 'other';

export interface AccomplishmentEntry {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: AccomplishmentType;
  metric?: QuantifiableMetric;
  date: Date;
  quarter: string;
  employerId?: string;
  tags: string[];
  canShowPublicly: boolean;
  addedToResume: boolean;
  linkedExperienceId?: string;
  createdAt: Date;
}

export const AccomplishmentEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  type: z.enum(['project', 'metric', 'recognition', 'learning', 'milestone', 'other']),
  metric: QuantifiableMetricSchema.optional(),
  date: z.date(),
  quarter: z.string(),
  employerId: z.string().optional(),
  tags: z.array(z.string()),
  canShowPublicly: z.boolean(),
  addedToResume: z.boolean(),
  linkedExperienceId: z.string().optional(),
  createdAt: z.date(),
});

// =============================================================================
// SALARY TRACKING (Your Worth)
// =============================================================================

export type SalaryEntryMode = 'per-year' | 'start-to-current';

export interface SalaryEntry {
  id: string;
  userId: string;
  year: number;
  baseSalary: number;
  bonus?: number;
  equity?: number;
  otherComp?: number;
  totalCompensation: number;
  employerId?: string;
  company: string;
  title: string;
  socCode?: string;
  createdAt: Date;
  updatedAt: Date;
  isEstimated: boolean;
}

export const SalaryEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  year: z.number().int().min(1900).max(2100),
  baseSalary: z.number().min(0),
  bonus: z.number().min(0).optional(),
  equity: z.number().min(0).optional(),
  otherComp: z.number().min(0).optional(),
  totalCompensation: z.number().min(0),
  employerId: z.string().optional(),
  company: z.string(),
  title: z.string(),
  socCode: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  isEstimated: z.boolean(),
});

export interface ProsperSalaryRange {
  id: string;
  userId: string;
  employerId?: string;
  company: string;
  title: string;
  socCode?: string;
  startYear: number;
  endYear?: number;
  startingSalary: number;
  currentSalary: number;
  startingBonus?: number;
  currentBonus?: number;
  startingEquity?: number;
  currentEquity?: number;
  createdAt: Date;
  updatedAt: Date;
}

export const ProsperSalaryRangeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  employerId: z.string().optional(),
  company: z.string(),
  title: z.string(),
  socCode: z.string().optional(),
  startYear: z.number().int().min(1900).max(2100),
  endYear: z.number().int().min(1900).max(2100).optional(),
  startingSalary: z.number().min(0),
  currentSalary: z.number().min(0),
  startingBonus: z.number().min(0).optional(),
  currentBonus: z.number().min(0).optional(),
  startingEquity: z.number().min(0).optional(),
  currentEquity: z.number().min(0).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export interface MarketBenchmark {
  socCode: string;
  occupationTitle: string;
  areaCode?: string;
  areaName?: string;
  percentile10: number;
  percentile25: number;
  median: number;
  percentile75: number;
  percentile90: number;
  totalEmployment?: number;
  employmentPerThousand?: number;
  dataYear: number;
  fetchedAt: Date;
  source: 'bls' | 'cached';
}

export const MarketBenchmarkSchema = z.object({
  socCode: z.string(),
  occupationTitle: z.string(),
  areaCode: z.string().optional(),
  areaName: z.string().optional(),
  percentile10: z.number().min(0),
  percentile25: z.number().min(0),
  median: z.number().min(0),
  percentile75: z.number().min(0),
  percentile90: z.number().min(0),
  totalEmployment: z.number().int().min(0).optional(),
  employmentPerThousand: z.number().min(0).optional(),
  dataYear: z.number().int(),
  fetchedAt: z.date(),
  source: z.enum(['bls', 'cached']),
});

export interface SalaryHistory {
  userId: string;
  entryMode: SalaryEntryMode;
  yearlyEntries: SalaryEntry[];
  rangeEntries: ProsperSalaryRange[];
  benchmarks: Record<string, MarketBenchmark>;
  showTotalComp: boolean;
  comparisonEnabled: boolean;
  lastUpdated: Date;
}

export const SalaryHistorySchema = z.object({
  userId: z.string(),
  entryMode: z.enum(['per-year', 'start-to-current']),
  yearlyEntries: z.array(SalaryEntrySchema),
  rangeEntries: z.array(ProsperSalaryRangeSchema),
  benchmarks: z.record(z.string(), MarketBenchmarkSchema),
  showTotalComp: z.boolean(),
  comparisonEnabled: z.boolean(),
  lastUpdated: z.date(),
});

// =============================================================================
// COMPENSATION SNAPSHOT (for charting)
// =============================================================================

/**
 * Compensation snapshot - yearly view combining user salary + market data
 */
export interface CompensationSnapshot {
  year: number;
  userSalary: number;
  marketData?: {
    percentile10: number;
    percentile25: number;
    median: number;
    percentile75: number;
    percentile90: number;
    userPercentile?: number;
  };
  company: string;
  title: string;
}

export const CompensationSnapshotSchema = z.object({
  year: z.number().int(),
  userSalary: z.number().min(0),
  marketData: z
    .object({
      percentile10: z.number().min(0),
      percentile25: z.number().min(0),
      median: z.number().min(0),
      percentile75: z.number().min(0),
      percentile90: z.number().min(0),
      userPercentile: z.number().min(0).max(100).optional(),
    })
    .optional(),
  company: z.string(),
  title: z.string(),
});

// =============================================================================
// 360 REVIEW
// =============================================================================

export type ReviewCycleStatus = 'draft' | 'in-progress' | 'collecting-feedback' | 'completed';
export type FeedbackSource = 'self' | 'manager' | 'peer' | 'direct-report' | 'other';

export interface ReviewQuestion {
  id: string;
  text: string;
  category: 'strengths' | 'growth' | 'impact' | 'collaboration' | 'goals' | 'custom';
  isRequired: boolean;
}

export interface SelfReview {
  id: string;
  userId: string;
  reviewCycleId: string;
  periodStart: Date;
  periodEnd: Date;
  quarter?: string;
  employerId?: string;
  company: string;
  title: string;
  responses: Record<string, string>;
  ratings: {
    technicalSkills: number;
    communication: number;
    leadership: number;
    problemSolving: number;
    collaboration: number;
    initiative: number;
  };
  accomplishments: string;
  challenges: string;
  goalsForNext: string;
  areasForGrowth: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  isDraft: boolean;
}

export const SelfReviewSchema = z.object({
  id: z.string(),
  userId: z.string(),
  reviewCycleId: z.string(),
  periodStart: z.date(),
  periodEnd: z.date(),
  quarter: z.string().optional(),
  employerId: z.string().optional(),
  company: z.string(),
  title: z.string(),
  responses: z.record(z.string(), z.string()),
  ratings: z.object({
    technicalSkills: z.number().min(1).max(5),
    communication: z.number().min(1).max(5),
    leadership: z.number().min(1).max(5),
    problemSolving: z.number().min(1).max(5),
    collaboration: z.number().min(1).max(5),
    initiative: z.number().min(1).max(5),
  }),
  accomplishments: z.string(),
  challenges: z.string(),
  goalsForNext: z.string(),
  areasForGrowth: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
  isDraft: z.boolean(),
});

export interface ExternalFeedback {
  id: string;
  reviewCycleId: string;
  token: string;
  source: FeedbackSource;
  submitterName?: string;
  submitterEmail?: string;
  relationship: string;
  responses: Record<string, string>;
  ratings?: {
    technicalSkills?: number;
    communication?: number;
    leadership?: number;
    problemSolving?: number;
    collaboration?: number;
    initiative?: number;
  };
  strengths: string;
  areasForImprovement: string;
  additionalComments?: string;
  isAnonymous: boolean;
  createdAt: Date;
  submittedAt?: Date;
  viewedByUser: boolean;
}

export const ExternalFeedbackSchema = z.object({
  id: z.string(),
  reviewCycleId: z.string(),
  token: z.string(),
  source: z.enum(['self', 'manager', 'peer', 'direct-report', 'other']),
  submitterName: z.string().optional(),
  submitterEmail: z.string().email().optional(),
  relationship: z.string(),
  responses: z.record(z.string(), z.string()),
  ratings: z
    .object({
      technicalSkills: z.number().min(1).max(5).optional(),
      communication: z.number().min(1).max(5).optional(),
      leadership: z.number().min(1).max(5).optional(),
      problemSolving: z.number().min(1).max(5).optional(),
      collaboration: z.number().min(1).max(5).optional(),
      initiative: z.number().min(1).max(5).optional(),
    })
    .optional(),
  strengths: z.string(),
  areasForImprovement: z.string(),
  additionalComments: z.string().optional(),
  isAnonymous: z.boolean(),
  createdAt: z.date(),
  submittedAt: z.date().optional(),
  viewedByUser: z.boolean(),
});

export interface ReviewCycle {
  id: string;
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  name: string;
  employerId?: string;
  company: string;
  title: string;
  selfReviewId?: string;
  externalFeedbackIds: string[];
  questions: ReviewQuestion[];
  status: ReviewCycleStatus;
  feedbackRequestsSent: number;
  feedbackReceived: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export const ReviewCycleSchema = z.object({
  id: z.string(),
  userId: z.string(),
  periodStart: z.date(),
  periodEnd: z.date(),
  name: z.string(),
  employerId: z.string().optional(),
  company: z.string(),
  title: z.string(),
  selfReviewId: z.string().optional(),
  externalFeedbackIds: z.array(z.string()),
  questions: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      category: z.enum(['strengths', 'growth', 'impact', 'collaboration', 'goals', 'custom']),
      isRequired: z.boolean(),
    })
  ),
  status: z.enum(['draft', 'in-progress', 'collecting-feedback', 'completed']),
  feedbackRequestsSent: z.number().int().min(0),
  feedbackReceived: z.number().int().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
});

// =============================================================================
// ACCOLADES
// =============================================================================

export interface AccoladeEntry {
  id: string;
  userId: string;
  source: 'external-feedback' | 'manager-note' | 'award' | 'recognition' | 'manual';
  sourceId?: string;
  title: string;
  description: string;
  category: 'technical' | 'leadership' | 'collaboration' | 'innovation' | 'impact' | 'other';
  fromName?: string;
  fromRelationship?: string;
  date: Date;
  company: string;
  employerId?: string;
  canShowPublicly: boolean;
  addedToResume: boolean;
  createdAt: Date;
}

export const AccoladeEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  source: z.enum(['external-feedback', 'manager-note', 'award', 'recognition', 'manual']),
  sourceId: z.string().optional(),
  title: z.string(),
  description: z.string(),
  category: z.enum(['technical', 'leadership', 'collaboration', 'innovation', 'impact', 'other']),
  fromName: z.string().optional(),
  fromRelationship: z.string().optional(),
  date: z.date(),
  company: z.string(),
  employerId: z.string().optional(),
  canShowPublicly: z.boolean(),
  addedToResume: z.boolean(),
  createdAt: z.date(),
});

// =============================================================================
// DATA EXPORT
// =============================================================================

export type ExportFormat = 'resume-bullets' | 'performance-review' | 'portfolio' | 'full-backup';

export interface ExportDateRange {
  start: Date;
  end: Date;
}

export interface ExportRequest {
  format: ExportFormat;
  dateRange?: ExportDateRange;
  includePrivate: boolean;
  employerIds?: string[]; // Filter by specific jobs
}

export const ExportRequestSchema = z.object({
  format: z.enum(['resume-bullets', 'performance-review', 'portfolio', 'full-backup']),
  dateRange: z
    .object({
      start: z.date(),
      end: z.date(),
    })
    .optional(),
  includePrivate: z.boolean(),
  employerIds: z.array(z.string()).optional(),
});

// =============================================================================
// HELPERS
// =============================================================================

export function getCurrentQuarter(): {
  quarter: string;
  year: number;
  quarterNumber: 1 | 2 | 3 | 4;
} {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const quarterNumber = (Math.floor(month / 3) + 1) as 1 | 2 | 3 | 4;
  const quarter = `Q${quarterNumber} ${year}`;
  return { quarter, year, quarterNumber };
}

export function getQuarterDates(year: number, quarter: 1 | 2 | 3 | 4): { start: Date; end: Date } {
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0);
  return { start, end };
}

export function createDefaultEmploymentState(): EmploymentState {
  return {
    isCurrentlyEmployed: false,
    checkInFrequency: 'quarterly',
    checkInReminderDays: 7,
  };
}

export function calculateNextCheckInDue(lastCheckInDate: Date, frequency: CheckInFrequency): Date {
  const next = new Date(lastCheckInDate);
  switch (frequency) {
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'biannually':
      next.setMonth(next.getMonth() + 6);
      break;
  }
  return next;
}

export function calculatePercentile(userSalary: number, benchmark: MarketBenchmark): number {
  if (userSalary <= benchmark.percentile10) return 10;
  if (userSalary <= benchmark.percentile25) {
    const range = benchmark.percentile25 - benchmark.percentile10;
    const position = userSalary - benchmark.percentile10;
    return 10 + (position / range) * 15;
  }
  if (userSalary <= benchmark.median) {
    const range = benchmark.median - benchmark.percentile25;
    const position = userSalary - benchmark.percentile25;
    return 25 + (position / range) * 25;
  }
  if (userSalary <= benchmark.percentile75) {
    const range = benchmark.percentile75 - benchmark.median;
    const position = userSalary - benchmark.median;
    return 50 + (position / range) * 25;
  }
  if (userSalary <= benchmark.percentile90) {
    const range = benchmark.percentile90 - benchmark.percentile75;
    const position = userSalary - benchmark.percentile75;
    return 75 + (position / range) * 15;
  }
  return 90;
}

export function generateFeedbackToken(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function createDefaultReviewQuestions(): ReviewQuestion[] {
  return [
    {
      id: crypto.randomUUID(),
      text: 'What are the key strengths this person brings to their role?',
      category: 'strengths',
      isRequired: true,
    },
    {
      id: crypto.randomUUID(),
      text: 'What areas would you recommend for growth or improvement?',
      category: 'growth',
      isRequired: true,
    },
    {
      id: crypto.randomUUID(),
      text: 'Describe a specific example of impact this person has made.',
      category: 'impact',
      isRequired: false,
    },
    {
      id: crypto.randomUUID(),
      text: 'How effectively does this person collaborate with others?',
      category: 'collaboration',
      isRequired: false,
    },
  ];
}

/**
 * Interpolate yearly salary entries from a range (linear growth)
 */
export function interpolateSalaryRange(range: ProsperSalaryRange): SalaryEntry[] {
  const entries: SalaryEntry[] = [];
  const currentYear = new Date().getFullYear();
  const endYear = range.endYear || currentYear;
  const years = endYear - range.startYear + 1;

  if (years <= 1) {
    return [
      {
        id: crypto.randomUUID(),
        userId: range.userId,
        year: range.startYear,
        baseSalary: range.startingSalary,
        bonus: range.startingBonus,
        equity: range.startingEquity,
        totalCompensation:
          range.startingSalary + (range.startingBonus || 0) + (range.startingEquity || 0),
        employerId: range.employerId,
        company: range.company,
        title: range.title,
        socCode: range.socCode,
        createdAt: range.createdAt,
        updatedAt: range.updatedAt,
        isEstimated: false,
      },
    ];
  }

  const salaryDiff = range.currentSalary - range.startingSalary;
  const salaryPerYear = salaryDiff / (years - 1);

  const bonusDiff = (range.currentBonus || 0) - (range.startingBonus || 0);
  const bonusPerYear = bonusDiff / (years - 1);

  const equityDiff = (range.currentEquity || 0) - (range.startingEquity || 0);
  const equityPerYear = equityDiff / (years - 1);

  for (let i = 0; i < years; i++) {
    const year = range.startYear + i;
    const baseSalary = Math.round(range.startingSalary + salaryPerYear * i);
    const bonus = range.startingBonus
      ? Math.round((range.startingBonus || 0) + bonusPerYear * i)
      : undefined;
    const equity = range.startingEquity
      ? Math.round((range.startingEquity || 0) + equityPerYear * i)
      : undefined;

    entries.push({
      id: crypto.randomUUID(),
      userId: range.userId,
      year,
      baseSalary,
      bonus,
      equity,
      totalCompensation: baseSalary + (bonus || 0) + (equity || 0),
      employerId: range.employerId,
      company: range.company,
      title: range.title,
      socCode: range.socCode,
      createdAt: range.createdAt,
      updatedAt: range.updatedAt,
      isEstimated: i > 0 && i < years - 1,
    });
  }

  return entries;
}

// Re-export QuantifiableMetric for convenience
export type { QuantifiableMetric };
