/**
 * ResumeUploader - Drag-and-drop PDF/DOCX resume upload with AI parsing
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show } from 'solid-js';
import { prepareStore } from '../store';
import { parseResume } from '../services/resume-parser.service';
import { extractTextFromFile } from '../services/file-extractor.service';
import { IconUpload, IconFileText, IconCheck, IconAlert, IconX } from '../../pipeline/ui/Icons';

interface ResumeUploaderProps {
  onParseComplete?: () => void;
  currentTheme: () => {
    colors: {
      primary: string;
      secondary: string;
      text: string;
      textMuted: string;
      background: string;
      border: string;
      success: string;
      error: string;
    };
    fonts: {
      body: string;
      heading: string;
    };
  };
}

const ACCEPTED_FILE_TYPES = ['.pdf', '.docx', '.txt'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ResumeUploader: Component<ResumeUploaderProps> = (props) => {
  const theme = () => props.currentTheme();

  const [isDragging, setIsDragging] = createSignal(false);
  const [selectedFile, setSelectedFile] = createSignal<File | null>(null);
  const [uploadError, setUploadError] = createSignal<string | null>(null);
  const [pastedText, setPastedText] = createSignal('');
  const [uploadMode, setUploadMode] = createSignal<'file' | 'text'>('file');

  // Store state
  const isUploading = () => prepareStore.state.isUploading;
  const isParsing = () => prepareStore.state.isParsing;
  const uploadProgress = () => prepareStore.state.uploadProgress;
  const parseProgress = () => prepareStore.state.parseProgress;
  const storeError = () => prepareStore.state.error;

  const validateFile = (file: File): string | null => {
    // Check file type
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_FILE_TYPES.includes(extension)) {
      return `File type not supported. Please upload ${ACCEPTED_FILE_TYPES.join(', ')} files.`;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`;
    }

    return null;
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    await handleFileSelect(file);
  };

  const handleFileInput = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    await handleFileSelect(file);
  };

  const handleFileSelect = async (file: File) => {
    setUploadError(null);
    prepareStore.setError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setSelectedFile(file);
    await uploadAndParse(file);
  };

  const uploadAndParse = async (file: File) => {
    prepareStore.setUploading(true);
    prepareStore.setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        const currentProgress = prepareStore.state.uploadProgress;
        prepareStore.setUploadProgress(Math.min(currentProgress + 10, 90));
      }, 100);

      // Extract text from file using client-side parsing
      console.log('[ResumeUploader] Extracting text from file:', file.name);
      const extraction = await extractTextFromFile(file);

      clearInterval(progressInterval);
      prepareStore.setUploadProgress(100);
      prepareStore.setUploading(false);

      if (!extraction.success) {
        throw new Error(extraction.error || 'Failed to extract text from file');
      }

      console.log('[ResumeUploader] Extracted text:', {
        wordCount: extraction.wordCount,
        pageCount: extraction.pageCount,
        textPreview: extraction.text.substring(0, 200) + '...',
      });

      // Parse with AI - send extracted text
      await parseResumeContent(extraction.text, file.name, file.type);
    } catch (error) {
      console.error('Upload failed:', error);
      prepareStore.setError(error instanceof Error ? error.message : 'Upload failed');
      prepareStore.setUploading(false);
    }
  };

  const handleTextParse = async () => {
    const text = pastedText().trim();
    if (!text) {
      setUploadError('Please paste your resume text');
      return;
    }

    setUploadError(null);
    prepareStore.setError(null);

    await parseResumeContent(text, 'pasted-resume.txt', 'text/plain');
  };

  const parseResumeContent = async (content: string, fileName: string, fileType: string) => {
    prepareStore.setParsing(true);
    prepareStore.setParseProgress(0);

    try {
      // Get or create master resume
      if (!prepareStore.hasMasterResume()) {
        // Get userId from pipeline profile
        const pipelineProfile = localStorage.getItem('augment_pipeline_profile');
        const userId = pipelineProfile ? JSON.parse(pipelineProfile).id : crypto.randomUUID();
        prepareStore.createMasterResume(userId);
      }

      // Call AI parsing service
      const result = await parseResume({
        content,
        contentType: fileType.includes('pdf')
          ? 'pdf'
          : fileType.includes('word') || fileType.includes('docx')
            ? 'docx'
            : 'text',
        fileName,
      });

      console.log('[ResumeUploader] Parse result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Parsing failed');
      }

      console.log('[ResumeUploader] Parsed sections:', result.parsed);
      console.log('[ResumeUploader] Experience count:', result.parsed?.experience?.length);
      console.log('[ResumeUploader] Skills count:', result.parsed?.skills?.length);

      // Update master resume with parsed data
      prepareStore.setParsedSections(result.parsed);

      console.log('[ResumeUploader] Store after update:', prepareStore.state.masterResume);
      prepareStore.updateMasterResume({
        rawText: result.extractedText || content,
        extractedKeywords: result.keywords,
        sourceFile:
          uploadMode() === 'file'
            ? {
                name: fileName,
                type: fileName.endsWith('.pdf')
                  ? 'pdf'
                  : fileName.endsWith('.docx')
                    ? 'docx'
                    : 'txt',
                uploadedAt: new Date(),
                extractedText: result.extractedText || content,
              }
            : undefined,
      });

      prepareStore.setHasUploadedResume(true);
      prepareStore.completeWizardStep('upload');
      prepareStore.setParseProgress(100);
      prepareStore.setParsing(false);

      // Callback
      props.onParseComplete?.();
    } catch (error) {
      console.error('Parse failed:', error);
      prepareStore.setError(error instanceof Error ? error.message : 'Parsing failed');
      prepareStore.setParsing(false);
    }
  };

  const resetUploader = () => {
    setSelectedFile(null);
    setUploadError(null);
    setPastedText('');
    prepareStore.setError(null);
    prepareStore.setUploadProgress(0);
    prepareStore.setParseProgress(0);
  };

  return (
    <div style={{ width: '100%', 'max-width': '800px', margin: '0 auto' }}>
      {/* Mode Toggle */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          'margin-bottom': '24px',
          'justify-content': 'center',
        }}
      >
        <button
          onClick={() => setUploadMode('file')}
          class="pipeline-btn"
          style={{
            padding: '12px 24px',
            background:
              uploadMode() === 'file' ? theme().colors.primary : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${uploadMode() === 'file' ? theme().colors.primary : theme().colors.border}`,
            'border-radius': '8px',
            color: uploadMode() === 'file' ? '#FFFFFF' : theme().colors.textMuted,
            cursor: 'pointer',
            'font-size': '14px',
            'font-weight': '600',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            'align-items': 'center',
            gap: '8px',
          }}
          onMouseOver={(e) => {
            if (uploadMode() !== 'file') {
              e.currentTarget.style.background = `${theme().colors.primary}15`;
              e.currentTarget.style.borderColor = theme().colors.primary;
              e.currentTarget.style.color = theme().colors.primary;
              e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${theme().colors.primary}20`;
            } else {
              e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${theme().colors.primary}40`;
            }
          }}
          onMouseOut={(e) => {
            if (uploadMode() !== 'file') {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = theme().colors.border;
              e.currentTarget.style.color = theme().colors.textMuted;
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            } else {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          <IconUpload size={16} /> Upload File
        </button>
        <button
          onClick={() => setUploadMode('text')}
          class="pipeline-btn"
          style={{
            padding: '12px 24px',
            background:
              uploadMode() === 'text' ? theme().colors.primary : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${uploadMode() === 'text' ? theme().colors.primary : theme().colors.border}`,
            'border-radius': '8px',
            color: uploadMode() === 'text' ? '#FFFFFF' : theme().colors.textMuted,
            cursor: 'pointer',
            'font-size': '14px',
            'font-weight': '600',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            'align-items': 'center',
            gap: '8px',
          }}
          onMouseOver={(e) => {
            if (uploadMode() !== 'text') {
              e.currentTarget.style.background = `${theme().colors.primary}15`;
              e.currentTarget.style.borderColor = theme().colors.primary;
              e.currentTarget.style.color = theme().colors.primary;
              e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${theme().colors.primary}20`;
            } else {
              e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${theme().colors.primary}40`;
            }
          }}
          onMouseOut={(e) => {
            if (uploadMode() !== 'text') {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = theme().colors.border;
              e.currentTarget.style.color = theme().colors.textMuted;
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            } else {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          <IconFileText size={16} /> Paste Text
        </button>
      </div>

      {/* File Upload Mode */}
      <Show when={uploadMode() === 'file'}>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            position: 'relative',
            border: `2px dashed ${isDragging() ? theme().colors.primary : theme().colors.border}`,
            'border-radius': '16px',
            padding: '48px 32px',
            'text-align': 'center',
            background: isDragging() ? `${theme().colors.primary}10` : 'rgba(255, 255, 255, 0.02)',
            transition: 'all 0.3s',
            cursor: 'pointer',
          }}
          onClick={() => document.getElementById('resume-file-input')?.click()}
        >
          <input
            id="resume-file-input"
            type="file"
            accept={ACCEPTED_FILE_TYPES.join(',')}
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />

          <Show when={!selectedFile() && !isUploading() && !isParsing()}>
            <div
              style={{
                display: 'flex',
                'flex-direction': 'column',
                'align-items': 'center',
                gap: '16px',
              }}
            >
              <IconUpload size={48} color={theme().colors.primary} />
              <div>
                <h3
                  style={{
                    margin: '0 0 8px',
                    'font-size': '20px',
                    color: theme().colors.text,
                    'font-family': theme().fonts.heading,
                  }}
                >
                  Drop your resume here
                </h3>
                <p style={{ margin: 0, 'font-size': '14px', color: theme().colors.textMuted }}>
                  or click to browse
                </p>
              </div>
              <p
                style={{ margin: '16px 0 0', 'font-size': '13px', color: theme().colors.textMuted }}
              >
                Supports {ACCEPTED_FILE_TYPES.join(', ')} • Max {MAX_FILE_SIZE / (1024 * 1024)}MB
              </p>
            </div>
          </Show>

          <Show when={selectedFile() && !isParsing()}>
            <div
              style={{
                display: 'flex',
                'flex-direction': 'column',
                'align-items': 'center',
                gap: '12px',
              }}
            >
              <IconFileText size={48} color={theme().colors.primary} />
              <div>
                <p
                  style={{
                    margin: 0,
                    'font-size': '16px',
                    color: theme().colors.text,
                    'font-weight': '600',
                  }}
                >
                  {selectedFile()!.name}
                </p>
                <p
                  style={{
                    margin: '4px 0 0',
                    'font-size': '13px',
                    color: theme().colors.textMuted,
                  }}
                >
                  {(selectedFile()!.size / 1024).toLocaleString('en-US', {
                    maximumFractionDigits: 0,
                  })}{' '}
                  KB
                </p>
              </div>
            </div>
          </Show>

          <Show when={isUploading()}>
            <div
              style={{
                display: 'flex',
                'flex-direction': 'column',
                'align-items': 'center',
                gap: '16px',
              }}
            >
              <div style={{ 'font-size': '16px', color: theme().colors.text }}>Uploading...</div>
              <div
                style={{
                  width: '100%',
                  'max-width': '400px',
                  height: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  'border-radius': '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${uploadProgress()}%`,
                    height: '100%',
                    background: theme().colors.primary,
                    transition: 'width 0.3s',
                  }}
                />
              </div>
              <p style={{ margin: 0, 'font-size': '13px', color: theme().colors.textMuted }}>
                {uploadProgress()}%
              </p>
            </div>
          </Show>

          <Show when={isParsing()}>
            <div
              style={{
                display: 'flex',
                'flex-direction': 'column',
                'align-items': 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  border: `4px solid ${theme().colors.primary}`,
                  'border-top-color': 'transparent',
                  'border-radius': '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <div style={{ 'font-size': '16px', color: theme().colors.text }}>
                AI is analyzing your resume...
              </div>
              <div
                style={{
                  width: '100%',
                  'max-width': '400px',
                  height: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  'border-radius': '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${parseProgress()}%`,
                    height: '100%',
                    background: theme().colors.secondary,
                    transition: 'width 0.3s',
                  }}
                />
              </div>
              <p style={{ margin: 0, 'font-size': '13px', color: theme().colors.textMuted }}>
                Extracting experiences, skills, and keywords...
              </p>
            </div>
          </Show>
        </div>
      </Show>

      {/* Text Paste Mode */}
      <Show when={uploadMode() === 'text'}>
        <div>
          <textarea
            value={pastedText()}
            onInput={(e) => setPastedText(e.currentTarget.value)}
            placeholder="Paste your resume text here..."
            rows={12}
            style={{
              width: '100%',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${theme().colors.border}`,
              'border-radius': '12px',
              color: theme().colors.text,
              'font-size': '14px',
              'font-family': theme().fonts.body,
              resize: 'vertical',
              outline: 'none',
              'box-sizing': 'border-box',
            }}
          />
          <button
            onClick={handleTextParse}
            disabled={!pastedText().trim() || isParsing()}
            class="pipeline-btn"
            style={{
              'margin-top': '16px',
              padding: '14px 28px',
              background: theme().colors.primary,
              border: 'none',
              'border-radius': '10px',
              color: '#FFFFFF',
              'font-size': '15px',
              'font-weight': '600',
              cursor: pastedText().trim() && !isParsing() ? 'pointer' : 'not-allowed',
              opacity: pastedText().trim() && !isParsing() ? 1 : 0.5,
              width: '100%',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseOver={(e) => {
              if (pastedText().trim() && !isParsing()) {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = `0 6px 16px ${theme().colors.primary}40`;
                e.currentTarget.style.filter = 'brightness(1.1)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.filter = 'none';
            }}
          >
            {isParsing() ? 'Parsing...' : 'Parse Resume with AI'}
          </button>
        </div>
      </Show>

      {/* Error Display */}
      <Show when={uploadError() || storeError()}>
        <div
          style={{
            'margin-top': '16px',
            padding: '12px 16px',
            background: `${theme().colors.error}20`,
            border: `1px solid ${theme().colors.error}`,
            'border-radius': '8px',
            display: 'flex',
            'align-items': 'center',
            gap: '12px',
          }}
        >
          <IconAlert size={20} color={theme().colors.error} />
          <p style={{ margin: 0, 'font-size': '14px', color: theme().colors.error }}>
            {uploadError() || storeError()}
          </p>
          <button
            onClick={resetUploader}
            class="pipeline-btn"
            style={{
              'margin-left': 'auto',
              background: 'none',
              border: 'none',
              color: theme().colors.error,
              cursor: 'pointer',
              padding: '4px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = `${theme().colors.error}20`;
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <IconX size={16} />
          </button>
        </div>
      </Show>

      {/* Success Display */}
      <Show when={prepareStore.hasMasterResume() && parseProgress() === 100}>
        <div
          style={{
            'margin-top': '16px',
            padding: '12px 16px',
            background: `${theme().colors.success}20`,
            border: `1px solid ${theme().colors.success}`,
            'border-radius': '8px',
            display: 'flex',
            'align-items': 'center',
            gap: '12px',
          }}
        >
          <IconCheck size={20} color={theme().colors.success} />
          <p style={{ margin: 0, 'font-size': '14px', color: theme().colors.success }}>
            Resume parsed successfully! Found{' '}
            {prepareStore.state.masterResume?.parsedSections.experience.length || 0} experiences and{' '}
            {prepareStore.state.masterResume?.parsedSections.skills.length || 0} skills.
          </p>
        </div>
      </Show>

      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ResumeUploader;
