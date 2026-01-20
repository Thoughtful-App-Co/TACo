/**
 * Tenure Prepare Schema - Resume Intelligence System
 *
 * Manages master resume, variants, and AI-powered resume optimization.
 *
 * @module schemas/tenure/prepare
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { z } from 'zod';
import {
  WorkExperience,
  WorkExperienceSchema,
  Education,
  EducationSchema,
  QuantifiableMetric,
  QuantifiableMetricSchema,
  Project,
  ProjectSchema,
} from './common.schema';

// =============================================================================
// RESUME SOURCE
// =============================================================================

export interface ResumeSourceFile {
  name: string;
  type: 'pdf' | 'docx' | 'txt';
  uploadedAt: Date;
  extractedText: string;
}

export const ResumeSourceFileSchema = z.object({
  name: z.string(),
  type: z.enum(['pdf', 'docx', 'txt']),
  uploadedAt: z.date(),
  extractedText: z.string(),
});

// =============================================================================
// PARSED SECTIONS
// =============================================================================

export interface VolunteerWork {
  organization: string;
  role: string;
  description: string;
  dates: string;
}

export const VolunteerWorkSchema = z.object({
  organization: z.string(),
  role: z.string(),
  description: z.string(),
  dates: z.string(),
});

export interface ParsedResumeSections {
  summary?: string;
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications: string[];
  projects?: Project[];
  awards?: string[];
  languages?: string[];
  volunteerWork?: VolunteerWork[];
}

export const ParsedResumeSectionsSchema = z.object({
  summary: z.string().optional(),
  experience: z.array(WorkExperienceSchema),
  education: z.array(EducationSchema),
  skills: z.array(z.string()),
  certifications: z.array(z.string()),
  projects: z.array(ProjectSchema).optional(),
  awards: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  volunteerWork: z.array(VolunteerWorkSchema).optional(),
});

// =============================================================================
// EXTRACTED KEYWORDS
// =============================================================================

export interface ExtractedKeywords {
  technical: string[];
  soft: string[];
  industry: string[];
  tools: string[];
}

export const ExtractedKeywordsSchema = z.object({
  technical: z.array(z.string()),
  soft: z.array(z.string()),
  industry: z.array(z.string()),
  tools: z.array(z.string()),
});

// =============================================================================
// MASTER RESUME
// =============================================================================

export interface MasterResume {
  id: string;
  userId: string;

  // Source data
  rawText?: string;
  sourceFile?: ResumeSourceFile;

  // Parsed sections (AI-extracted)
  parsedSections: ParsedResumeSections;

  // Metrics library
  metricsLibrary: QuantifiableMetric[];

  // Keywords extracted for matching
  extractedKeywords: ExtractedKeywords;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastParsedAt?: Date;
  parseVersion: number;
}

export const MasterResumeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  rawText: z.string().optional(),
  sourceFile: ResumeSourceFileSchema.optional(),
  parsedSections: ParsedResumeSectionsSchema,
  metricsLibrary: z.array(QuantifiableMetricSchema),
  extractedKeywords: ExtractedKeywordsSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  lastParsedAt: z.date().optional(),
  parseVersion: z.number().int().min(1),
});

// =============================================================================
// RESUME VARIANT
// =============================================================================

export interface VariantExperience {
  experienceId: string;
  includedProjects: string[];
  customBullets?: string[];
}

export interface AIGeneratedBullets {
  experienceId: string;
  bullets: string[];
}

export interface ResumeVariant {
  id: string;
  masterResumeId: string;
  name: string;

  // Target context
  targetRole?: string;
  targetCompany?: string;
  targetJobDescription?: string;

  // Customizations
  customSummary?: string;
  includedExperiences: VariantExperience[];
  includedSkills: string[];
  includedMetrics: string[];

  // AI-generated content
  aiGeneratedSummary?: string;
  aiSuggestedBullets?: AIGeneratedBullets[];
  keywordMatchScore?: number;
  missingKeywords?: string[];

  // Export
  lastExportedAt?: Date;
  exportFormat?: 'pdf' | 'docx' | 'txt' | 'markdown';

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export const ResumeVariantSchema = z.object({
  id: z.string(),
  masterResumeId: z.string(),
  name: z.string(),
  targetRole: z.string().optional(),
  targetCompany: z.string().optional(),
  targetJobDescription: z.string().optional(),
  customSummary: z.string().optional(),
  includedExperiences: z.array(
    z.object({
      experienceId: z.string(),
      includedProjects: z.array(z.string()),
      customBullets: z.array(z.string()).optional(),
    })
  ),
  includedSkills: z.array(z.string()),
  includedMetrics: z.array(z.string()),
  aiGeneratedSummary: z.string().optional(),
  aiSuggestedBullets: z
    .array(
      z.object({
        experienceId: z.string(),
        bullets: z.array(z.string()),
      })
    )
    .optional(),
  keywordMatchScore: z.number().min(0).max(100).optional(),
  missingKeywords: z.array(z.string()).optional(),
  lastExportedAt: z.date().optional(),
  exportFormat: z.enum(['pdf', 'docx', 'txt', 'markdown']).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// =============================================================================
// WIZARD STATE
// =============================================================================

export type WizardStep =
  | 'upload'
  | 'parse-review'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'summary'
  | 'complete';

export interface WizardState {
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  hasUploadedResume: boolean;
  hasManualEntry: boolean;
}

export const WizardStateSchema = z.object({
  currentStep: z.enum([
    'upload',
    'parse-review',
    'experience',
    'projects',
    'skills',
    'summary',
    'complete',
  ]),
  completedSteps: z.array(
    z.enum(['upload', 'parse-review', 'experience', 'projects', 'skills', 'summary', 'complete'])
  ),
  hasUploadedResume: z.boolean(),
  hasManualEntry: z.boolean(),
});

// =============================================================================
// MUTATION (AI Tailoring)
// =============================================================================

export type TonePreference = 'professional' | 'casual' | 'technical' | 'executive';
export type LengthPreference = 'concise' | 'detailed' | 'one-page';

export interface ResumeMutationRequest {
  masterResumeId: string;
  targetJobDescription: string;
  targetCompany?: string;
  targetRole?: string;
  emphasize?: string[];
  deemphasize?: string[];
  tone?: TonePreference;
  lengthPreference?: LengthPreference;
}

export interface MutationChange {
  section: string;
  original: string;
  suggested: string;
  reason: string;
}

export interface ResumeMutationResult {
  variantId: string;
  changes: MutationChange[];
  keywordMatchBefore: number;
  keywordMatchAfter: number;
  suggestedSkillsToAdd: string[];
  suggestedMetricsToHighlight: string[];
}

export const ResumeMutationRequestSchema = z.object({
  masterResumeId: z.string(),
  targetJobDescription: z.string(),
  targetCompany: z.string().optional(),
  targetRole: z.string().optional(),
  emphasize: z.array(z.string()).optional(),
  deemphasize: z.array(z.string()).optional(),
  tone: z.enum(['professional', 'casual', 'technical', 'executive']).optional(),
  lengthPreference: z.enum(['concise', 'detailed', 'one-page']).optional(),
});

export const ResumeMutationResultSchema = z.object({
  variantId: z.string(),
  changes: z.array(
    z.object({
      section: z.string(),
      original: z.string(),
      suggested: z.string(),
      reason: z.string(),
    })
  ),
  keywordMatchBefore: z.number(),
  keywordMatchAfter: z.number(),
  suggestedSkillsToAdd: z.array(z.string()),
  suggestedMetricsToHighlight: z.array(z.string()),
});

// =============================================================================
// MUTATION HISTORY
// =============================================================================

export interface MutationHistoryEntry {
  id: string;
  variantId?: string;
  timestamp: Date;
  targetRole?: string;
  targetCompany?: string;
  jobDescription?: string;
  changesSummary?: string;
  keywordMatchScore?: number;
  matchScoreBefore?: number;
  matchScoreAfter?: number;
}

export const MutationHistoryEntrySchema = z.object({
  id: z.string(),
  variantId: z.string().optional(),
  timestamp: z.date(),
  targetRole: z.string().optional(),
  targetCompany: z.string().optional(),
  jobDescription: z.string().optional(),
  changesSummary: z.string().optional(),
  keywordMatchScore: z.number().optional(),
  matchScoreBefore: z.number().optional(),
  matchScoreAfter: z.number().optional(),
});

// =============================================================================
// HELPERS
// =============================================================================

export function createEmptyMasterResume(userId: string): MasterResume {
  return {
    id: crypto.randomUUID(),
    userId,
    parsedSections: {
      experience: [],
      education: [],
      skills: [],
      certifications: [],
    },
    metricsLibrary: [],
    extractedKeywords: {
      technical: [],
      soft: [],
      industry: [],
      tools: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    parseVersion: 1,
  };
}

export function createEmptyWizardState(): WizardState {
  return {
    currentStep: 'upload',
    completedSteps: [],
    hasUploadedResume: false,
    hasManualEntry: false,
  };
}

// Re-export common types used by prepare
export type { WorkExperience, Education, QuantifiableMetric, Project };
