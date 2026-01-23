/**
 * ResumeUploader - Drag-and-drop PDF/DOCX resume upload with AI parsing
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show, onMount } from 'solid-js';
import { prepareStore } from '../store';
import { parseResume } from '../services/resume-parser.service';
import { extractTextFromFile } from '../services/file-extractor.service';
import { IconUpload, IconFileText, IconCheck, IconAlert, IconX } from '../../pipeline/ui/Icons';
import { toastStore } from './toast-store';
import { logger } from '../../../../lib/logger';
import { canUseMutation } from '../../../../lib/feature-gates';
import { Paywall } from '../../../common/Paywall';

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
const RESUME_PARSER_PAYWALL_DISMISSED_KEY = 'taco_resume_parser_paywall_dismissed';

export const ResumeUploader: Component<ResumeUploaderProps> = (props) => {
  const theme = () => props.currentTheme();

  const [isDragging, setIsDragging] = createSignal(false);
  const [selectedFile, setSelectedFile] = createSignal<File | null>(null);
  const [uploadError, setUploadError] = createSignal<string | null>(null);
  const [pastedText, setPastedText] = createSignal('');
  const [uploadMode, setUploadMode] = createSignal<'file' | 'text'>('file');
  const [showPaywall, setShowPaywall] = createSignal(false);
  const [dontRemindChecked, setDontRemindChecked] = createSignal(false);

  // Set toast primary color to match theme
  onMount(() => {
    toastStore.setPrimaryColor(theme().colors.primary);
  });

  // Store state
  const isUploading = () => prepareStore.state.isUploading;
  const isParsing = () => prepareStore.state.isParsing;
  const uploadProgress = () => prepareStore.state.uploadProgress;
  const parseProgress = () => prepareStore.state.parseProgress;
  const storeError = () => prepareStore.state.error;

  const savePaywallDismissed = (dismissed: boolean): void => {
    try {
      if (dismissed) {
        localStorage.setItem(RESUME_PARSER_PAYWALL_DISMISSED_KEY, 'true');
      } else {
        localStorage.removeItem(RESUME_PARSER_PAYWALL_DISMISSED_KEY);
      }
    } catch {
      // Ignore localStorage errors
    }
  };

  const checkSubscriptionAccess = (): boolean => {
    const access = canUseMutation();
    logger.resume.debug('Subscription access check:', {
      allowed: access.allowed,
      reason: access.reason,
      requiresAuth: access.requiresAuth,
      requiresSubscription: access.requiresSubscription,
    });

    if (!access.allowed) {
      // Always show paywall when user explicitly tries to use the feature
      // The "don't remind me" only suppresses auto-prompts, not explicit actions
      logger.resume.info('Showing paywall - no subscription access');
      setShowPaywall(true);
      logger.resume.debug('showPaywall signal set to:', showPaywall());
      return false;
    }
    logger.resume.info('Subscription check passed');
    return true;
  };

  const handlePaywallClose = () => {
    if (dontRemindChecked()) {
      savePaywallDismissed(true);
    }
    setShowPaywall(false);
    setDontRemindChecked(false);
  };

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
    logger.resume.debug('handleFileSelect called with:', file.name);

    if (!checkSubscriptionAccess()) {
      logger.resume.warn('Subscription check failed, aborting file select');
      return;
    }

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
      logger.resume.debug('Starting text extraction for:', file.name);
      const extraction = await extractTextFromFile(file);

      clearInterval(progressInterval);
      prepareStore.setUploadProgress(100);
      prepareStore.setUploading(false);

      logger.resume.debug('Extraction result:', {
        success: extraction.success,
        textLength: extraction.text?.length || 0,
        wordCount: extraction.wordCount,
        pageCount: extraction.pageCount,
        error: extraction.error,
        textPreview: extraction.text?.substring(0, 200),
      });

      if (!extraction.success) {
        logger.resume.error('Extraction failed:', extraction.error);
        throw new Error(extraction.error || 'Failed to extract text from file');
      }

      if (!extraction.text || extraction.text.trim().length === 0) {
        logger.resume.error('No text extracted from file');
        throw new Error(
          'No text could be extracted from the PDF. The file may be empty or contain only images.'
        );
      }

      // Parse with AI - send extracted text
      logger.resume.debug('Starting AI parsing...');
      await parseResumeContent(extraction.text, file.name, file.type);
    } catch (error) {
      prepareStore.setError(error instanceof Error ? error.message : 'Upload failed');
      prepareStore.setUploading(false);
    }
  };

  const handleTextParse = async () => {
    logger.resume.debug('handleTextParse called');

    if (!checkSubscriptionAccess()) {
      logger.resume.warn('Subscription check failed, aborting text parse');
      return;
    }

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

    // Show loading toast with progress
    const loader = toastStore.promise('Analyzing your resume with AI...', { showProgress: true });

    // Progress simulation - slowly increase from 0 to 90 over ~25 seconds
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      // Increase progress more slowly as we get higher
      const increment =
        currentProgress < 30 ? 4 : currentProgress < 60 ? 3 : currentProgress < 80 ? 2 : 1;
      currentProgress = Math.min(currentProgress + increment, 90);
      loader.setProgress(currentProgress);
      prepareStore.setParseProgress(currentProgress);

      // Update status messages at milestones
      if (currentProgress >= 20 && currentProgress < 25) {
        loader.update('Extracting work experience...');
      } else if (currentProgress >= 40 && currentProgress < 45) {
        loader.update('Identifying skills and keywords...');
      } else if (currentProgress >= 60 && currentProgress < 65) {
        loader.update('Analyzing education history...');
      } else if (currentProgress >= 80 && currentProgress < 85) {
        loader.update('Categorizing expertise areas...');
      }
    }, 1000);

    try {
      // Get or create master resume
      if (!prepareStore.hasMasterResume()) {
        // Get userId from pipeline profile
        const pipelineProfile = localStorage.getItem('augment_pipeline_profile');
        const userId = pipelineProfile ? JSON.parse(pipelineProfile).id : crypto.randomUUID();
        prepareStore.createMasterResume(userId);
      }

      // Call AI parsing service
      logger.resume.debug('Calling AI parsing service with:', {
        contentLength: content.length,
        fileName,
        fileType,
      });

      const result = await parseResume({
        content,
        contentType: fileType.includes('pdf')
          ? 'pdf'
          : fileType.includes('word') || fileType.includes('docx')
            ? 'docx'
            : 'text',
        fileName,
      });

      // Clear progress interval on completion
      clearInterval(progressInterval);

      logger.resume.debug('AI parsing result:', {
        success: result.success,
        experienceCount: result.parsed?.experience?.length || 0,
        educationCount: result.parsed?.education?.length || 0,
        skillsCount: result.parsed?.skills?.length || 0,
        error: result.error,
      });

      if (!result.success) {
        logger.resume.error('AI parsing failed:', result.error);
        throw new Error(result.error || 'Parsing failed');
      }

      // Update master resume with parsed data
      logger.resume.debug('Updating store with parsed data...');
      prepareStore.setParsedSections(result.parsed);

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

      // Show success toast
      const experienceCount = result.parsed?.experience?.length || 0;
      const skillsCount = result.parsed?.skills?.length || 0;
      loader.setProgress(100);
      loader.success(
        `Resume parsed successfully! Found ${experienceCount} experiences and ${skillsCount} skills.`
      );

      // Callback
      props.onParseComplete?.();
    } catch (error) {
      // Clear progress interval on error
      clearInterval(progressInterval);

      const errorMessage = error instanceof Error ? error.message : 'Parsing failed';
      prepareStore.setError(errorMessage);
      prepareStore.setParsing(false);

      // Show error toast
      loader.error(errorMessage);
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

      {/* Paywall Modal */}
      <Paywall
        isOpen={showPaywall()}
        onClose={handlePaywallClose}
        feature="tenure_extras"
        featureName="AI Resume Parsing"
        showDontRemind={true}
        onDontRemindChange={setDontRemindChecked}
      />

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
