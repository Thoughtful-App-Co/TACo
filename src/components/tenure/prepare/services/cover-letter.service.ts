/**
 * Cover Letter Service - Client-side API caller
 *
 * Handles communication with the cover letter generation API endpoint.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import type { MasterResume } from '../../../../schemas/prepare.schema';

// ============================================================================
// TYPES
// ============================================================================

export interface CoverLetterRequest {
  resume: {
    name: string;
    summary?: string;
    experiences: {
      company: string;
      title: string;
      startDate: string;
      endDate?: string;
      bullets: string[];
    }[];
    skills: string[];
  };
  // Either JD OR occupation data
  jobDescription?: string;
  occupationTitle?: string;
  occupationData?: {
    skills: { name: string }[];
    tasks: string[];
  };
  // Required target info
  targetCompany: string;
  targetRole: string;
  hiringManagerName?: string;
  // Style preferences
  tone: 'professional' | 'enthusiastic' | 'formal' | 'conversational';
  length: 'short' | 'medium' | 'long';
  keyPoints?: string[];
}

export interface CoverLetterResponse {
  coverLetter: string;
  sections: {
    opening: string;
    body: string[];
    closing: string;
  };
  keywordsUsed: string[];
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

export interface CoverLetterError {
  error: string;
  code: string;
  details?: unknown;
}

// ============================================================================
// COVER LETTER SERVICE
// ============================================================================

export class CoverLetterService {
  private readonly apiEndpoint: string;
  private readonly apiKey?: string;

  constructor(apiEndpoint: string = '/api/resume/cover-letter', apiKey?: string) {
    this.apiEndpoint = apiEndpoint;
    this.apiKey = apiKey;
  }

  /**
   * Generate a cover letter for a specific job
   */
  async generateCoverLetter(request: CoverLetterRequest): Promise<CoverLetterResponse> {
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
        const errorData: CoverLetterError = await response.json().catch(() => ({
          error: 'Unknown error',
          code: 'UNKNOWN_ERROR',
        }));

        throw new CoverLetterServiceError(
          errorData.error,
          errorData.code,
          response.status,
          errorData.details
        );
      }

      const data: CoverLetterResponse = await response.json();

      return data;
    } catch (error) {
      if (error instanceof CoverLetterServiceError) {
        throw error;
      }

      // Network or parsing error
      throw new CoverLetterServiceError(
        error instanceof Error ? error.message : 'Failed to generate cover letter',
        'NETWORK_ERROR',
        0
      );
    }
  }

  /**
   * Validate cover letter request before sending
   */
  validateRequest(request: CoverLetterRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.resume) {
      errors.push('Resume data is required');
    }

    if (!request.targetCompany || request.targetCompany.trim().length === 0) {
      errors.push('Target company is required');
    }

    if (!request.targetRole || request.targetRole.trim().length === 0) {
      errors.push('Target role is required');
    }

    // Either job description or occupation data should be provided
    if (!request.jobDescription && !request.occupationTitle) {
      errors.push('Either job description or occupation title is required');
    }

    if (request.resume?.experiences.length === 0) {
      errors.push('Resume must have at least one experience');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Custom error class for cover letter service
 */
export class CoverLetterServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'CoverLetterServiceError';
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
      case 'RATE_LIMITED':
        return 'Too many requests. Please wait a moment and try again.';
      case 'INSUFFICIENT_CREDITS':
        return 'Insufficient credits. Please upgrade your plan or wait for credit refresh.';
      default:
        return this.message;
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format a Date object to a string for the API
 */
function formatDate(date: Date | undefined): string {
  if (!date) return '';
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Convert MasterResume to CoverLetterRequest format
 */
export function prepareCoverLetterRequest(
  masterResume: MasterResume,
  options: {
    targetCompany: string;
    targetRole: string;
    applicantName?: string; // Name to use in the letter
    jobDescription?: string;
    occupationTitle?: string;
    occupationData?: { skills: { name: string }[]; tasks: string[] };
    hiringManagerName?: string;
    tone?: 'professional' | 'enthusiastic' | 'formal' | 'conversational';
    length?: 'short' | 'medium' | 'long';
    keyPoints?: string[];
  }
): CoverLetterRequest {
  return {
    resume: {
      name: options.applicantName || 'Applicant',
      summary: masterResume.parsedSections.summary,
      experiences: masterResume.parsedSections.experience.map((exp) => ({
        company: exp.company,
        title: exp.title,
        startDate: formatDate(exp.startDate),
        endDate: exp.endDate ? formatDate(exp.endDate) : undefined,
        bullets: exp.bulletPoints || [],
      })),
      skills: masterResume.parsedSections.skills,
    },
    targetCompany: options.targetCompany,
    targetRole: options.targetRole,
    jobDescription: options.jobDescription,
    occupationTitle: options.occupationTitle,
    occupationData: options.occupationData,
    hiringManagerName: options.hiringManagerName,
    tone: options.tone || 'professional',
    length: options.length || 'medium',
    keyPoints: options.keyPoints,
  };
}

/**
 * Estimate cost of cover letter generation
 */
export function estimateCoverLetterCost(): {
  estimatedTokens: number;
  estimatedCostUSD: number;
} {
  // Cover letters are relatively fixed in complexity
  // Estimate: ~500 tokens input, ~400 tokens output
  const totalTokens = 900;

  // Claude Haiku pricing: ~$0.25 per 1M input tokens, ~$1.25 per 1M output tokens
  // Average ~$0.75 per 1M tokens = $0.00000075 per token
  const estimatedCostUSD = totalTokens * 0.00000075;

  return {
    estimatedTokens: totalTokens,
    estimatedCostUSD: Math.max(estimatedCostUSD, 0.01), // Minimum $0.01
  };
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const coverLetterService = new CoverLetterService();
