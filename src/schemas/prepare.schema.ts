/**
 * Prepare Module Schema - Resume Intelligence System
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { z } from 'zod';
import { WorkExperience, Education } from './pipeline.schema';

// ============================================================================
// QUANTIFIABLE METRICS
// ============================================================================

export type MetricUnit = 'percent' | 'currency' | 'count' | 'time' | 'custom';
export type MetricDirection = 'increased' | 'decreased' | 'achieved' | 'maintained';

export interface QuantifiableMetric {
  id: string;
  value: number;
  unit: MetricUnit;
  customUnit?: string; // e.g., "users", "requests/sec"
  direction: MetricDirection;
  description: string; // "Reduced page load time"
  context?: string; // "by optimizing database queries"
  isReusable: boolean; // Can be pulled into other resume variants
  tags: string[]; // For categorization: ["performance", "cost-savings"]
  createdAt: Date;
}

export const QuantifiableMetricSchema = z.object({
  id: z.string(),
  value: z.number(),
  unit: z.enum(['percent', 'currency', 'count', 'time', 'custom']),
  customUnit: z.string().optional(),
  direction: z.enum(['increased', 'decreased', 'achieved', 'maintained']),
  description: z.string(),
  context: z.string().optional(),
  isReusable: z.boolean(),
  tags: z.array(z.string()),
  createdAt: z.date(),
});

// ============================================================================
// PROJECTS
// ============================================================================

export type ProjectRole = 'lead' | 'contributor' | 'owner' | 'collaborator';
export type ArtifactType = 'link' | 'image' | 'document';

export interface ProjectArtifact {
  type: ArtifactType;
  url: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  role: ProjectRole;
  technologies: string[];
  startDate?: Date;
  endDate?: Date;
  metrics: QuantifiableMetric[];
  highlights: string[]; // Bullet points
  canShowPublicly: boolean; // NDA flag
  artifacts?: ProjectArtifact[];
  createdAt: Date;
  updatedAt: Date;
}

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  role: z.enum(['lead', 'contributor', 'owner', 'collaborator']),
  technologies: z.array(z.string()),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  metrics: z.array(QuantifiableMetricSchema),
  highlights: z.array(z.string()),
  canShowPublicly: z.boolean(),
  artifacts: z
    .array(
      z.object({
        type: z.enum(['link', 'image', 'document']),
        url: z.string(),
        name: z.string(),
      })
    )
    .optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// MASTER RESUME
// ============================================================================

export interface ResumeSourceFile {
  name: string;
  type: 'pdf' | 'docx' | 'txt';
  uploadedAt: Date;
  extractedText: string;
}

export interface VolunteerWork {
  organization: string;
  role: string;
  description: string;
  dates: string;
}

export interface ParsedResumeSections {
  summary?: string;
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications: string[];
  projects?: Project[]; // Standalone projects not under a job
  awards?: string[];
  languages?: string[];
  volunteerWork?: VolunteerWork[];
}

export interface ExtractedKeywords {
  technical: string[];
  soft: string[];
  industry: string[];
  tools: string[];
}

export interface MasterResume {
  id: string;
  userId: string;

  // Source data
  rawText?: string; // Pasted or extracted text
  sourceFile?: ResumeSourceFile;

  // Parsed sections (AI-extracted)
  parsedSections: ParsedResumeSections;

  // Metrics library - all quantifiable achievements
  metricsLibrary: QuantifiableMetric[];

  // Keywords extracted for matching
  extractedKeywords: ExtractedKeywords;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastParsedAt?: Date;
  parseVersion: number; // Track parsing model version
}

export const MasterResumeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  rawText: z.string().optional(),
  sourceFile: z
    .object({
      name: z.string(),
      type: z.enum(['pdf', 'docx', 'txt']),
      uploadedAt: z.date(),
      extractedText: z.string(),
    })
    .optional(),
  parsedSections: z.object({
    summary: z.string().optional(),
    experience: z.array(z.any()), // WorkExperience schema from pipeline
    education: z.array(z.any()), // Education schema from pipeline
    skills: z.array(z.string()),
    certifications: z.array(z.string()),
    projects: z.array(ProjectSchema).optional(),
    awards: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    volunteerWork: z
      .array(
        z.object({
          organization: z.string(),
          role: z.string(),
          description: z.string(),
          dates: z.string(),
        })
      )
      .optional(),
  }),
  metricsLibrary: z.array(QuantifiableMetricSchema),
  extractedKeywords: z.object({
    technical: z.array(z.string()),
    soft: z.array(z.string()),
    industry: z.array(z.string()),
    tools: z.array(z.string()),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastParsedAt: z.date().optional(),
  parseVersion: z.number(),
});

// ============================================================================
// RESUME VARIANT (Tailored versions)
// ============================================================================

export interface VariantExperience {
  experienceId: string;
  includedProjects: string[]; // Project IDs to include
  customBullets?: string[]; // Override bullets for this variant
}

export interface AIGeneratedBullets {
  experienceId: string;
  bullets: string[];
}

export interface ResumeVariant {
  id: string;
  masterResumeId: string;
  name: string; // "Frontend Developer - Startup Focus"

  // Target context
  targetRole?: string;
  targetCompany?: string;
  targetJobDescription?: string; // The JD used to tailor

  // Customizations
  customSummary?: string;
  includedExperiences: VariantExperience[];
  includedSkills: string[];
  includedMetrics: string[]; // Metric IDs to highlight

  // AI-generated content
  aiGeneratedSummary?: string;
  aiSuggestedBullets?: AIGeneratedBullets[];
  keywordMatchScore?: number; // How well this variant matches target JD
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
  keywordMatchScore: z.number().optional(),
  missingKeywords: z.array(z.string()).optional(),
  lastExportedAt: z.date().optional(),
  exportFormat: z.enum(['pdf', 'docx', 'txt', 'markdown']).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// RESUME WIZARD STATE
// ============================================================================

export type WizardStep =
  | 'upload' // Upload existing resume
  | 'parse-review' // Review AI parsing
  | 'experience' // Add/edit experiences
  | 'projects' // Add projects & metrics
  | 'skills' // Skills & certifications
  | 'summary' // Professional summary
  | 'complete'; // Done

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

// ============================================================================
// MUTATION REQUEST (for AI tailoring)
// ============================================================================

export type TonePreference = 'professional' | 'casual' | 'technical' | 'executive';
export type LengthPreference = 'concise' | 'detailed' | 'one-page';

export interface ResumeMutationRequest {
  masterResumeId: string;
  targetJobDescription: string;
  targetCompany?: string;
  targetRole?: string;

  // User preferences
  emphasize?: string[]; // Skills/experiences to highlight
  deemphasize?: string[]; // Things to minimize
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

// ============================================================================
// HELPERS
// ============================================================================

export function generateId(): string {
  return crypto.randomUUID();
}

export function createEmptyMasterResume(userId: string): MasterResume {
  return {
    id: generateId(),
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
