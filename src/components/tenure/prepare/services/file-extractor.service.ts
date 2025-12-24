/**
 * File Extractor Service - Client-side text extraction from PDF/DOCX
 *
 * Uses browser-compatible libraries:
 * - pdfjs-dist for PDF extraction (configured globally in src/index.tsx)
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
 * Extract text from a PDF file using pdfjs-dist directly
 * Note: PDF.js worker is configured globally in src/index.tsx
 */
export async function extractTextFromPDF(file: File): Promise<ExtractionResult> {
  console.log('[PDF Extractor] Starting extraction for:', file.name);

  try {
    // Import pdfjs-dist - worker is already configured in src/index.tsx
    const pdfjsLib = await import('pdfjs-dist');
    console.log('[PDF Extractor] pdfjs-dist loaded, version:', pdfjsLib.version);

    // Ensure worker is configured (defensive check)
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      console.log('[PDF Extractor] Worker not configured, setting up...');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    } else {
      console.log(
        '[PDF Extractor] Worker already configured:',
        pdfjsLib.GlobalWorkerOptions.workerSrc
      );
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    console.log('[PDF Extractor] File read as ArrayBuffer, size:', arrayBuffer.byteLength, 'bytes');

    // Load the PDF document with standard font data for font handling
    console.log('[PDF Extractor] Loading PDF document...');
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      standardFontDataUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/standard_fonts/`,
      cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    });
    const pdf = await loadingTask.promise;
    console.log('[PDF Extractor] PDF loaded successfully, pages:', pdf.numPages);

    // Extract text from all pages
    const textParts: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`[PDF Extractor] Extracting text from page ${pageNum}/${pdf.numPages}...`);
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      textParts.push(pageText);
      console.log(`[PDF Extractor] Page ${pageNum} extracted, ${pageText.length} characters`);
    }

    const text = textParts.join('\n\n');
    const wordCount = text.split(/\s+/).filter((w: string) => w.length > 0).length;

    console.log('[PDF Extractor] Extraction complete!', {
      totalText: text.length,
      wordCount,
      pageCount: pdf.numPages,
      preview: text.substring(0, 200),
    });

    return {
      success: true,
      text,
      pageCount: pdf.numPages,
      wordCount,
    };
  } catch (error) {
    console.error('[PDF Extractor] Error:', error);
    console.error(
      '[PDF Extractor] Error stack:',
      error instanceof Error ? error.stack : 'No stack'
    );
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
    }

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
