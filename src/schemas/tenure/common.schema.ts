/**
 * Tenure Common Schema - Shared Types
 *
 * Types used across multiple Tenure modules.
 * This is the single source of truth for shared data structures.
 *
 * @module schemas/tenure/common
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { z } from 'zod';

// =============================================================================
// WORK EXPERIENCE
// =============================================================================

/**
 * Work experience entry - used by Profile, Resume, and Career Journal
 */
export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  startDate: Date;
  endDate?: Date; // undefined = current position
  location?: string;
  locationType?: 'remote' | 'hybrid' | 'onsite';
  description: string;
  elaboration?: string; // User's deeper write-up

  // Enhanced for Prepare module
  projects?: Project[];
  metrics?: QuantifiableMetric[];
  bulletPoints?: string[]; // AI-generated or manually crafted
  rawBullets?: string[]; // Original from uploaded resume

  // Skills & achievements
  skills: string[];
  achievements: string[];
}

export const WorkExperienceSchema = z.object({
  id: z.string(),
  company: z.string(),
  title: z.string(),
  startDate: z.date(),
  endDate: z.date().optional(),
  location: z.string().optional(),
  locationType: z.enum(['remote', 'hybrid', 'onsite']).optional(),
  description: z.string(),
  elaboration: z.string().optional(),
  projects: z.array(z.lazy(() => ProjectSchema)).optional(),
  metrics: z.array(z.lazy(() => QuantifiableMetricSchema)).optional(),
  bulletPoints: z.array(z.string()).optional(),
  rawBullets: z.array(z.string()).optional(),
  skills: z.array(z.string()),
  achievements: z.array(z.string()),
});

// =============================================================================
// EDUCATION
// =============================================================================

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  graduationDate?: Date;
  gpa?: number;
  honors?: string[];
  activities?: string[];
}

export const EducationSchema = z.object({
  id: z.string(),
  institution: z.string(),
  degree: z.string(),
  field: z.string(),
  graduationDate: z.date().optional(),
  gpa: z.number().min(0).max(4).optional(),
  honors: z.array(z.string()).optional(),
  activities: z.array(z.string()).optional(),
});

// =============================================================================
// QUANTIFIABLE METRICS
// =============================================================================

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

// =============================================================================
// PROJECTS
// =============================================================================

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

export const ProjectArtifactSchema = z.object({
  type: z.enum(['link', 'image', 'document']),
  url: z.string(),
  name: z.string(),
});

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
  artifacts: z.array(ProjectArtifactSchema).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// =============================================================================
// SALARY
// =============================================================================

export interface SalaryRange {
  min?: number;
  max?: number;
  currency: string;
  period: 'hourly' | 'annual';
}

export const SalaryRangeSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  currency: z.string(),
  period: z.enum(['hourly', 'annual']),
});

// =============================================================================
// LOCATION
// =============================================================================

export type LocationType = 'remote' | 'hybrid' | 'onsite';

export interface GeoLocation {
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;
}

export const GeoLocationSchema = z.object({
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
});

export interface LocationPreference {
  current?: {
    city?: string;
    state: string;
    msa?: string;
  };
  willingToRelocate: boolean;
  targetLocations?: {
    states?: string[];
    msas?: string[];
  };
  remotePreference: 'remote-only' | 'remote-preferred' | 'hybrid' | 'onsite' | 'flexible';
}

export const LocationPreferenceSchema = z.object({
  current: z
    .object({
      city: z.string().optional(),
      state: z.string(),
      msa: z.string().optional(),
    })
    .optional(),
  willingToRelocate: z.boolean(),
  targetLocations: z
    .object({
      states: z.array(z.string()).optional(),
      msas: z.array(z.string()).optional(),
    })
    .optional(),
  remotePreference: z.enum(['remote-only', 'remote-preferred', 'hybrid', 'onsite', 'flexible']),
});

// =============================================================================
// CONTACT
// =============================================================================

export interface Contact {
  id: string;
  name: string;
  role?: string;
  company?: string;
  email?: string;
  phone?: string;
  linkedIn?: string;
  notes?: string;
  lastContactedAt?: Date;
  createdAt: Date;
}

export const ContactSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string().optional(),
  company: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  linkedIn: z.string().optional(),
  notes: z.string().optional(),
  lastContactedAt: z.date().optional(),
  createdAt: z.date(),
});

// =============================================================================
// SYNC METADATA
// =============================================================================

export interface SyncMetadata {
  createdAt: Date;
  updatedAt: Date;
  syncVersion: number;
}

export const SyncMetadataSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  syncVersion: z.number().int().min(1),
});

// =============================================================================
// FEATURE FLAGS
// =============================================================================

export interface TenureFeatureFlags {
  showDiscover: boolean; // RIASEC assessment module
  showPrepare: boolean; // Resume builder module
  showProspect: boolean; // Job tracking pipeline
  showProsper: boolean; // Career journal module
  showMatches: boolean; // Job matches display
  enableSync: boolean;
  enableAI: boolean;
}

export const TenureFeatureFlagsSchema = z.object({
  showDiscover: z.boolean(),
  showPrepare: z.boolean(),
  showProspect: z.boolean(),
  showProsper: z.boolean(),
  showMatches: z.boolean(),
  enableSync: z.boolean(),
  enableAI: z.boolean(),
});

// Helper to parse boolean env vars (defaults to false for safety)
const envBool = (key: string, defaultValue: boolean = false): boolean => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const value = (import.meta.env as Record<string, string | undefined>)[key];
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  return defaultValue;
};

export const DEFAULT_FEATURE_FLAGS: TenureFeatureFlags = {
  showDiscover: true,
  showPrepare: true,
  showProspect: true,
  showProsper: true,
  showMatches: envBool('VITE_FEATURE_MATCHES', false), // Off by default, enable via env
  enableSync: true,
  enableAI: true,
};
