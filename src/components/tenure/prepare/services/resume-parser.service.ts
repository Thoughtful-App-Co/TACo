/**
 * Resume Parser Service - AI-powered resume parsing client
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { logger } from '../../../../lib/logger';
import { authFetch } from '../../../../lib/auth';
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
  logger.resume.debug('Starting API call to /api/resume/parse');
  logger.resume.debug('Request:', {
    contentLength: request.content.length,
    contentType: request.contentType,
    fileName: request.fileName,
  });

  try {
    const response = await authFetch('/api/resume/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    logger.resume.debug('Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.resume.error('Error response:', errorData);

      // If there's debug info, log it prominently
      if (errorData.debugInfo) {
        logger.resume.error('=== DEBUG INFO ===');
        logger.resume.error('Parse Error:', errorData.debugInfo.parseError);
        logger.resume.error('Response Length:', errorData.debugInfo.responseLength);
        logger.resume.error('Response Preview:', errorData.debugInfo.responsePreview);
        logger.resume.error('Response Suffix:', errorData.debugInfo.responseSuffix);
        logger.resume.error('=== END DEBUG INFO ===');
      }

      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ParseResumeResponse = await response.json();

    // Check if the response indicates success
    if (!data.success && data.error) {
      logger.resume.error('API returned error:', data.error);

      // Log debug info if present
      if ((data as any).debugInfo) {
        logger.resume.error('=== DEBUG INFO ===');
        logger.resume.error('Parse Error:', (data as any).debugInfo.parseError);
        logger.resume.error('Response Length:', (data as any).debugInfo.responseLength);
        logger.resume.error('Response Preview:', (data as any).debugInfo.responsePreview);
        logger.resume.error('Response Suffix:', (data as any).debugInfo.responseSuffix);
        logger.resume.error('=== END DEBUG INFO ===');
      }
    }

    logger.resume.info('Success! Parsed data:', {
      success: data.success,
      experienceCount: data.parsed?.experience?.length || 0,
      educationCount: data.parsed?.education?.length || 0,
      skillsCount: data.parsed?.skills?.length || 0,
      confidence: data.confidence,
    });
    return data;
  } catch (error) {
    logger.resume.error('Exception caught:', error);
    logger.resume.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

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
  // This is a placeholder - actual implementation would use pdfjs-dist or mammoth
  const formData = new FormData();
  formData.append('file', file);

  const response = await authFetch('/api/resume/extract-text', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Text extraction failed');
  }

  const data = await response.json();
  return data.text || '';
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
