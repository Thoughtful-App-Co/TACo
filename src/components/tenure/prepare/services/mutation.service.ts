/**
 * Mutation Service - Client-side API caller
 *
 * Handles communication with the mutation API endpoint.
 * Includes error handling, retry logic, and response parsing.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import type { MasterResume } from '../../../../schemas/prepare.schema';

// ============================================================================
// TYPES
// ============================================================================

export interface MutationRequest {
  masterResume: {
    summary?: string;
    experiences: {
      id: string;
      company: string;
      title: string;
      bullets: string[];
      skills?: string[];
    }[];
    skills: string[];
    extractedKeywords?: {
      skills: string[];
      knowledge: string[];
      tools: string[];
    };
  };
  jobDescription: string;
  targetCompany?: string;
  targetRole?: string;
  preferences?: {
    tone?: 'professional' | 'technical' | 'executive' | 'casual';
    length?: 'concise' | 'detailed';
    emphasize?: string[];
    deemphasize?: string[];
  };
}

export interface MutationResponse {
  success: boolean;
  analysis: {
    jdKeywords: {
      skills: string[];
      knowledge: string[];
      tools: string[];
      requirements: string[];
    };
    matchedKeywords: string[];
    missingKeywords: string[];
    matchScoreBefore: number;
    matchScoreAfter: number;
  };
  mutations: {
    summary: {
      original: string | null;
      mutated: string;
      reason: string;
    } | null;
    experiences: {
      experienceId: string;
      bullets: {
        original: string;
        mutated: string;
        keywordsAdded: string[];
        reason: string;
      }[];
    }[];
    skillsReordered: string[];
    skillsToAdd: string[];
  };
  processingTime: number;
  aiTokensUsed: number;
}

export interface MutationError {
  error: string;
  code: string;
  details?: any;
}

// ============================================================================
// MUTATION SERVICE
// ============================================================================

export class MutationService {
  private readonly apiEndpoint: string;
  private readonly apiKey?: string;

  constructor(apiEndpoint: string = '/api/resume/mutate', apiKey?: string) {
    this.apiEndpoint = apiEndpoint;
    this.apiKey = apiKey;
  }

  /**
   * Mutate a resume for a specific job description
   */
  async mutateResume(request: MutationRequest): Promise<MutationResponse> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey;
      }

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData: MutationError = await response.json().catch(() => ({
          error: 'Unknown error',
          code: 'UNKNOWN_ERROR',
        }));

        throw new MutationServiceError(
          errorData.error,
          errorData.code,
          response.status,
          errorData.details
        );
      }

      const data: MutationResponse = await response.json();

      if (!data.success) {
        throw new MutationServiceError('Mutation failed', 'MUTATION_FAILED', 500);
      }

      return data;
    } catch (error) {
      if (error instanceof MutationServiceError) {
        throw error;
      }

      // Network or parsing error
      throw new MutationServiceError(
        error instanceof Error ? error.message : 'Failed to mutate resume',
        'NETWORK_ERROR',
        0
      );
    }
  }

  /**
   * Validate mutation request before sending
   */
  validateRequest(request: MutationRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.masterResume) {
      errors.push('Master resume is required');
    }

    if (!request.jobDescription || request.jobDescription.length < 100) {
      errors.push('Job description must be at least 100 characters');
    }

    if (request.masterResume?.experiences.length === 0) {
      errors.push('Resume must have at least one experience');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Custom error class for mutation service
 */
export class MutationServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'MutationServiceError';
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return this.statusCode >= 500 || this.code === 'NETWORK_ERROR';
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.code) {
      case 'MISSING_API_KEY':
        return 'API key not configured. Please contact support.';
      case 'VALIDATION_ERROR':
        return 'Invalid request. Please check your input.';
      case 'NETWORK_ERROR':
        return 'Network error. Please check your connection and try again.';
      case 'MUTATION_FAILED':
        return 'Failed to mutate resume. Please try again.';
      default:
        return this.message;
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert MasterResume to MutationRequest format
 */
export function prepareMutationRequest(
  masterResume: MasterResume,
  jobDescription: string,
  options?: {
    targetCompany?: string;
    targetRole?: string;
    tone?: 'professional' | 'technical' | 'executive' | 'casual';
    length?: 'concise' | 'detailed';
  }
): MutationRequest {
  return {
    masterResume: {
      summary: masterResume.parsedSections.summary,
      experiences: masterResume.parsedSections.experience.map((exp) => ({
        id: exp.id,
        company: exp.company,
        title: exp.title,
        bullets: exp.bulletPoints || [],
        skills: exp.skills,
      })),
      skills: masterResume.parsedSections.skills,
      extractedKeywords: {
        skills: masterResume.extractedKeywords.technical,
        knowledge: masterResume.extractedKeywords.soft,
        tools: masterResume.extractedKeywords.tools,
      },
    },
    jobDescription,
    targetCompany: options?.targetCompany,
    targetRole: options?.targetRole,
    preferences: {
      tone: options?.tone || 'professional',
      length: options?.length || 'concise',
    },
  };
}

/**
 * Calculate estimated cost of mutation
 */
export function estimateMutationCost(masterResume: MasterResume): {
  estimatedTokens: number;
  estimatedCostUSD: number;
} {
  // Rough estimate:
  // - Summary: ~300 tokens
  // - Each bullet: ~100 tokens
  // - Overhead: ~200 tokens

  const summaryTokens = masterResume.parsedSections.summary ? 300 : 0;
  const bulletCount = masterResume.parsedSections.experience.reduce(
    (sum, exp) => sum + (exp.bulletPoints?.length || 0),
    0
  );
  const bulletTokens = Math.min(bulletCount, 10) * 100; // Max 10 bullets
  const overheadTokens = 200;

  const totalTokens = summaryTokens + bulletTokens + overheadTokens;

  // Claude Haiku pricing: ~$0.25 per 1M input tokens, ~$1.25 per 1M output tokens
  // Assuming 50/50 split, average ~$0.75 per 1M tokens = $0.00000075 per token
  const estimatedCostUSD = totalTokens * 0.00000075;

  return {
    estimatedTokens: totalTokens,
    estimatedCostUSD: Math.max(estimatedCostUSD, 0.01), // Minimum $0.01
  };
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const mutationService = new MutationService();
