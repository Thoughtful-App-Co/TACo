/**
 * Resume Parser Service - AI-powered resume parsing client
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import type { ParsedResumeSections, ExtractedKeywords } from '../../../../schemas/prepare.schema';

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface ParseResumeRequest {
  content: string; // Raw text or base64 file
  contentType: 'text' | 'pdf' | 'docx';
  fileName?: string;
}

export interface ParseResumeResponse {
  success: boolean;
  parsed: ParsedResumeSections;
  keywords: ExtractedKeywords;
  extractedText?: string; // For PDF/DOCX
  confidence?: number; // 0-100
  error?: string;
}

// ============================================================================
// API CLIENT
// ============================================================================

/**
 * Parse resume using AI
 */
export async function parseResume(request: ParseResumeRequest): Promise<ParseResumeResponse> {
  try {
    const response = await fetch('/api/resume/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ParseResumeResponse = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      parsed: {
        experience: [],
        education: [],
        skills: [],
        certifications: [],
      },
      keywords: {
        technical: [],
        soft: [],
        industry: [],
        tools: [],
      },
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Extract text from PDF/DOCX (preprocessing before parsing)
 * This would typically be handled server-side, but including for completeness
 */
export async function extractTextFromFile(file: File): Promise<string> {
  // For text files, read directly
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    return await file.text();
  }

  // For PDF/DOCX, we'll send to server for extraction
  // This is a placeholder - actual implementation would use pdf-parse or mammoth
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/resume/extract-text', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Text extraction failed');
    }

    const data = await response.json();
    return data.text || '';
  } catch (error) {
    throw error;
  }
}

/**
 * Validate resume content before parsing
 */
export function validateResumeContent(content: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!content || content.trim().length === 0) {
    errors.push('Resume content is empty');
  }

  if (content.length < 50) {
    errors.push('Resume content is too short (minimum 50 characters)');
  }

  if (content.length > 50000) {
    errors.push('Resume content is too long (maximum 50,000 characters)');
  }

  // Check for basic resume markers
  const hasWorkExperience =
    /experience|employment|work history/i.test(content) ||
    /\b(20\d{2})\s*[-–]\s*(20\d{2}|present)/i.test(content);

  const hasEducation = /education|degree|university|college/i.test(content);

  const hasSkills = /skills|technologies|proficiencies/i.test(content);

  if (!hasWorkExperience && !hasEducation && !hasSkills) {
    errors.push(
      'Content does not appear to be a resume (missing experience, education, or skills sections)'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
