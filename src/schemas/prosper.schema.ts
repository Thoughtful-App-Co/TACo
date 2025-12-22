/**
 * Prosper Module Schema - Career Journal & Accomplishment Tracking
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { z } from 'zod';
import { QuantifiableMetric, QuantifiableMetricSchema } from './prepare.schema';

// ============================================================================
// EMPLOYMENT STATE
// ============================================================================

export type CheckInFrequency = 'monthly' | 'quarterly' | 'biannually';

export interface EmploymentState {
  isCurrentlyEmployed: boolean;
  currentEmployerId?: string; // Links to a WorkExperience ID
  currentCompany?: string;
  currentTitle?: string;
  employmentStartDate?: Date;

  // Check-in settings
  checkInFrequency: CheckInFrequency;
  lastCheckInDate?: Date;
  nextCheckInDue?: Date;
  checkInReminderDays: number; // Days before due to remind
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
  checkInReminderDays: z.number(),
});

// ============================================================================
// QUARTERLY CHECK-IN
// ============================================================================

export type MoodLevel = 'thriving' | 'satisfied' | 'neutral' | 'struggling' | 'burnt-out';

export interface CheckInAccomplishments {
  projectIds: string[]; // Projects completed this quarter
  metricIds: string[]; // Metrics achieved
  customAccomplishments: string[]; // Freeform additions
}

export interface CheckInReflection {
  satisfactionScore: number; // 1-10
  mood: MoodLevel;
  whatIsGoingWell: string;
  challenges: string;
  learningGoals: string;
  privateNotes?: string; // Never exported
}

export interface QuarterlyCheckIn {
  id: string;
  userId: string;

  // Time period
  quarter: string; // "Q1 2025"
  year: number;
  quarterNumber: 1 | 2 | 3 | 4;
  periodStart: Date;
  periodEnd: Date;

  // Employment context
  employerId?: string; // WorkExperience ID
  company: string;
  title: string;

  // Accomplishments (links to Projects/Metrics in WorkExperience)
  accomplishments: CheckInAccomplishments;

  // Reflection
  reflection: CheckInReflection;

  // Skills & Growth
  skillsGained: string[];
  certificationsEarned: string[];
  trainingsCompleted: string[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  isDraft: boolean;
}

export const QuarterlyCheckInSchema = z.object({
  id: z.string(),
  userId: z.string(),
  quarter: z.string(),
  year: z.number(),
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

// ============================================================================
// ACCOMPLISHMENT LOG (Quick capture between check-ins)
// ============================================================================

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

  // Content
  title: string;
  description?: string;
  type: AccomplishmentType;

  // Quantification (optional)
  metric?: QuantifiableMetric;

  // Context
  date: Date;
  quarter: string;
  employerId?: string;
  tags: string[];

  // Privacy
  canShowPublicly: boolean;

  // Status
  addedToResume: boolean; // Has this been incorporated?
  linkedExperienceId?: string; // If added to a WorkExperience

  // Metadata
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

// ============================================================================
// SATISFACTION TREND
// ============================================================================

export interface SatisfactionDataPoint {
  date: Date;
  quarter: string;
  score: number;
  mood: MoodLevel;
  company: string;
}

export const SatisfactionDataPointSchema = z.object({
  date: z.date(),
  quarter: z.string(),
  score: z.number(),
  mood: z.enum(['thriving', 'satisfied', 'neutral', 'struggling', 'burnt-out']),
  company: z.string(),
});

// ============================================================================
// CAREER JOURNAL (Aggregate view)
// ============================================================================

export interface EmploymentHistory {
  employerId: string;
  company: string;
  title: string;
  startDate: Date;
  endDate?: Date;
  checkIns: string[]; // QuarterlyCheckIn IDs
}

export interface CareerInsights {
  generatedAt: Date;
  patterns: string[]; // "You're happiest when working on frontend"
  growthAreas: string[];
  skillTrajectory: string[];
}

export interface CareerJournal {
  userId: string;

  // Employment history
  employmentStates: EmploymentHistory[];

  // Quick stats
  totalCheckIns: number;
  totalAccomplishments: number;
  averageSatisfaction: number;
  currentStreak: number; // Consecutive quarters with check-ins

  // Insights (AI-generated)
  insights?: CareerInsights;
}

export const CareerJournalSchema = z.object({
  userId: z.string(),
  employmentStates: z.array(
    z.object({
      employerId: z.string(),
      company: z.string(),
      title: z.string(),
      startDate: z.date(),
      endDate: z.date().optional(),
      checkIns: z.array(z.string()),
    })
  ),
  totalCheckIns: z.number(),
  totalAccomplishments: z.number(),
  averageSatisfaction: z.number(),
  currentStreak: z.number(),
  insights: z
    .object({
      generatedAt: z.date(),
      patterns: z.array(z.string()),
      growthAreas: z.array(z.string()),
      skillTrajectory: z.array(z.string()),
    })
    .optional(),
});

// ============================================================================
// EXPORT FORMATS
// ============================================================================

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

// ============================================================================
// HELPERS
// ============================================================================

export function generateId(): string {
  return crypto.randomUUID();
}

export function getCurrentQuarter(): {
  quarter: string;
  year: number;
  quarterNumber: 1 | 2 | 3 | 4;
} {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();
  const quarterNumber = (Math.floor(month / 3) + 1) as 1 | 2 | 3 | 4;
  const quarter = `Q${quarterNumber} ${year}`;

  return { quarter, year, quarterNumber };
}

export function getQuarterDates(year: number, quarter: 1 | 2 | 3 | 4): { start: Date; end: Date } {
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0); // Last day of the quarter

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
