/**
 * File Extractor Service - Client-side text extraction from PDF/DOCX
 *
 * Uses browser-compatible libraries:
 * - pdf-parse v2 for PDF extraction (works in browser)
 * - mammoth for DOCX extraction
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

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
 * Extract text from a PDF file using pdf-parse v2
 * Note: PDF.js worker is configured globally in src/index.tsx
 */
export async function extractTextFromPDF(file: File): Promise<ExtractionResult> {
  try {
    // Import pdf-parse (worker already configured globally)
    const { PDFParse } = await import('pdf-parse');

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Create parser with buffer
    const parser = new PDFParse({ data: new Uint8Array(arrayBuffer) });

    // Extract text
    const result = await parser.getText();

    const text = result.text || '';
    const wordCount = text.split(/\s+/).filter((w: string) => w.length > 0).length;

    return {
      success: true,
      text,
      pageCount: result.total,
      wordCount,
    };
  } catch (error) {
    console.error('PDF extraction failed:', error);
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

    // Log any warnings
    if (result.messages && result.messages.length > 0) {
      console.warn('DOCX extraction warnings:', result.messages);
    }

    return {
      success: true,
      text,
      wordCount,
    };
  } catch (error) {
    console.error('DOCX extraction failed:', error);
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
