/**
 * Role-Based Mutation Service
 *
 * Client-side service for the /api/resume/mutate-by-role endpoint.
 * Used when user selects "Create for Job Title" mode in the wizard.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import type { MasterResume } from '../../../../schemas/prepare.schema';
import type { OnetOccupationSkills } from '../../../../services/onet';

// Request types
export interface RoleMutationRequest {
  resume: {
    name: string;
    summary?: string;
    experiences: {
      id: string;
      company: string;
      title: string;
      startDate: string;
      endDate?: string;
      bullets: string[];
    }[];
    skills: string[];
  };
  occupationCode: string;
  occupationTitle: string;
  occupationData: OnetOccupationSkills;
  tone: 'professional' | 'technical' | 'executive' | 'casual';
  length: 'concise' | 'detailed';
}

// Response types
export interface RoleMutationResponse {
  analysis: {
    roleTitle: string;
    roleCode: string;
    requiredSkills: string[];
    requiredKnowledge: string[];
    matchedSkills: string[];
    missingSkills: string[];
    matchScoreBefore: number;
    matchScoreAfter: number;
  };
  mutations: {
    originalSummary?: string;
    suggestedSummary?: string;
    bulletChanges: {
      experienceId: string;
      original: string;
      suggested: string;
      relevanceScore: number;
    }[];
    skillsToAdd: string[];
    skillsReordered: string[];
  };
  metadata: {
    model: string;
    processingTime: number;
    tokensUsed: {
      prompt: number;
      completion: number;
      total: number;
    };
  };
}

// Error class
export class RoleMutationError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'RoleMutationError';
  }

  getUserMessage(): string {
    switch (this.statusCode) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
      case 403:
        return 'Authentication error. Please refresh and try again.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 502:
        return 'AI service temporarily unavailable. Please try again later.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
}

// API client
class RoleMutationService {
  private baseUrl: string;

  constructor() {
    // Use relative URL in browser, or configure for different environments
    this.baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:8788';
  }

  async mutateByRole(request: RoleMutationRequest): Promise<RoleMutationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/resume/mutate-by-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new RoleMutationError(
          errorData.error || 'Failed to mutate resume by role',
          response.status,
          errorData.details
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof RoleMutationError) {
        throw error;
      }
      throw new RoleMutationError('Network error. Please check your connection.', 0, error);
    }
  }
}

// Export singleton instance
export const roleMutationService = new RoleMutationService();

/**
 * Prepare request from master resume and occupation data
 */
export function prepareRoleMutationRequest(
  masterResume: MasterResume,
  occupationCode: string,
  occupationTitle: string,
  occupationData: OnetOccupationSkills,
  options: {
    tone?: 'professional' | 'technical' | 'executive' | 'casual';
    length?: 'concise' | 'detailed';
  } = {}
): RoleMutationRequest {
  return {
    resume: {
      name: 'Resume', // MasterResume doesn't have contactInfo, use placeholder
      summary: masterResume.parsedSections.summary,
      experiences: masterResume.parsedSections.experience.map((exp) => ({
        id: exp.id,
        company: exp.company,
        title: exp.title,
        startDate: exp.startDate instanceof Date ? exp.startDate.toISOString() : exp.startDate,
        endDate: exp.endDate instanceof Date ? exp.endDate.toISOString() : exp.endDate,
        bullets: exp.bulletPoints || exp.rawBullets || [],
      })),
      skills: masterResume.parsedSections.skills,
    },
    occupationCode,
    occupationTitle,
    occupationData,
    tone: options.tone || 'professional',
    length: options.length || 'concise',
  };
}

/**
 * Estimate cost for role mutation (for display purposes)
 */
export function estimateRoleMutationCost(
  experienceCount: number,
  skillsCount: number
): { minCost: number; maxCost: number; estimatedTokens: number } {
  // Similar to JD-based mutation, but slightly different due to O*NET data
  const baseTokens = 800; // System prompt + O*NET data
  const perExperienceTokens = 150;
  const perSkillTokens = 5;
  const outputTokens = 600;

  const estimatedPromptTokens =
    baseTokens + experienceCount * perExperienceTokens + skillsCount * perSkillTokens;
  const totalTokens = estimatedPromptTokens + outputTokens;

  // Claude Haiku pricing: $0.25/1M input, $1.25/1M output
  const inputCost = (estimatedPromptTokens / 1_000_000) * 0.25;
  const outputCost = (outputTokens / 1_000_000) * 1.25;
  const totalCost = inputCost + outputCost;

  return {
    minCost: totalCost * 0.8,
    maxCost: totalCost * 1.3,
    estimatedTokens: totalTokens,
  };
}
