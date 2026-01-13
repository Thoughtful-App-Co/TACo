/**
 * File Extractor Service - Client-side text extraction from PDF/DOCX
 *
 * Uses browser-compatible libraries:
 * - unpdf for PDF extraction (serverless-optimized, no CDN dependencies)
 * - mammoth for DOCX extraction
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { logger } from '../../../../lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface ExtractionResult {
  success: boolean;
  text: string;
  error?: string;
  pageCount?: number;
  wordCount?: number;
}

// ============================================================================
// PDF EXTRACTION
// ============================================================================

/**
 * Extract text from a PDF file using unpdf
 *
 * unpdf is a modern, serverless-optimized PDF extraction library that:
 * - Ships with a bundled PDF.js build (no CDN worker fetch required)
 * - Works in browser, Node.js, and worker environments
 * - Has zero external dependencies
 * - Provides a simple, focused API for text extraction
 */
export async function extractTextFromPDF(file: File): Promise<ExtractionResult> {
  logger.resume.debug('Starting PDF extraction for:', file.name);

  try {
    // Dynamic import for code splitting
    const { getDocumentProxy, extractText } = await import('unpdf');
    logger.resume.debug('unpdf loaded');

    // Read file as ArrayBuffer and convert to Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    logger.resume.debug('File read as ArrayBuffer, size:', arrayBuffer.byteLength, 'bytes');

    // Load the PDF document
    logger.resume.debug('Loading PDF document...');
    const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
    logger.resume.debug('PDF loaded successfully, pages:', pdf.numPages);

    // Extract text from all pages
    // mergePages: false returns an array of strings (one per page) for better formatting
    const { totalPages, text } = await extractText(pdf, { mergePages: false });

    // Join pages with double newlines for paragraph separation
    const fullText = Array.isArray(text) ? text.join('\n\n') : text;
    const wordCount = fullText.split(/\s+/).filter((w: string) => w.length > 0).length;

    logger.resume.info('PDF extraction complete!', {
      totalText: fullText.length,
      wordCount,
      pageCount: totalPages,
      preview: fullText.substring(0, 200),
    });

    return {
      success: true,
      text: fullText,
      pageCount: totalPages,
      wordCount,
    };
  } catch (error) {
    logger.resume.error('PDF extraction error:', error);
    logger.resume.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return {
      success: false,
      text: '',
      error: error instanceof Error ? error.message : 'Failed to extract text from PDF',
    };
  }
}

// ============================================================================
// DOCX EXTRACTION
// ============================================================================

/**
 * Extract text from a DOCX file using Mammoth
 */
export async function extractTextFromDOCX(file: File): Promise<ExtractionResult> {
  try {
    // Dynamic import to avoid bundling issues
    const mammoth = await import('mammoth');

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Extract text using mammoth
    const result = await mammoth.extractRawText({ arrayBuffer });

    const text = result.value;
    const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

    // Warnings from mammoth are informational only
    // result.messages may contain conversion warnings

    return {
      success: true,
      text,
      wordCount,
    };
  } catch (error) {
    return {
      success: false,
      text: '',
      error: error instanceof Error ? error.message : 'Failed to extract text from DOCX',
    };
  }
}

// ============================================================================
// UNIFIED EXTRACTION
// ============================================================================

/**
 * Extract text from any supported file type
 */
export async function extractTextFromFile(file: File): Promise<ExtractionResult> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.pdf')) {
    return extractTextFromPDF(file);
  }

  if (fileName.endsWith('.docx')) {
    return extractTextFromDOCX(file);
  }

  if (fileName.endsWith('.doc')) {
    return {
      success: false,
      text: '',
      error: 'Legacy .doc files are not supported. Please save as .docx and try again.',
    };
  }

  if (fileName.endsWith('.txt')) {
    try {
      const text = await file.text();
      const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
      return {
        success: true,
        text,
        wordCount,
      };
    } catch (error) {
      return {
        success: false,
        text: '',
        error: 'Failed to read text file',
      };
    }
  }

  return {
    success: false,
    text: '',
    error: `Unsupported file type: ${file.name.split('.').pop()}`,
  };
}

/**
 * Check if a file type is supported for extraction
 */
export function isSupportedFileType(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return lower.endsWith('.pdf') || lower.endsWith('.docx') || lower.endsWith('.txt');
}
