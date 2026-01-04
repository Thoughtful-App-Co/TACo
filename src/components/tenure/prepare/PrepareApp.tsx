/**
 * PrepareApp v2 - Resume Builder/Wizard/Repository
 *
 * Complete redesign with:
 * - Resume Builder: Upload/create master resume
 * - Resume Wizard: AI-powered tailoring (JD or Job Title modes)
 * - Resume Repository: Manage all resume variants
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show } from 'solid-js';
import { prepareStore } from './store';
import { ResumeUploader } from './components/ResumeUploader';
import { ParseReviewPanel } from './components/ParseReviewPanel';
import { ExperienceEditor } from './components/ExperienceEditor';
import { EducationEditor } from './components/EducationEditor';
import { ToastContainer } from './components/Toast';
import { WizardModeSelector } from './components/WizardModeSelector';
import { MutationPanel } from './components/MutationPanel';
import { MutationResultsView } from './components/MutationResultsView';
import { MutationProgress } from './components/MutationProgress';
import { RepositoryView } from './components/RepositoryView';
import { WorkExperience, Education } from '../../../schemas/pipeline.schema';
import { ResumeVariant } from '../../../schemas/prepare.schema';
import { IconTrash, IconFileText, IconSparkles, IconGrid } from '../pipeline/ui/Icons';
import { ArrowLeftIcon } from 'solid-phosphor/bold';
import {
  mutationService,
  prepareMutationRequest,
  type MutationResponse,
} from './services/mutation.service';
import { JobTitlePanel } from './components/JobTitlePanel';
import {
  roleMutationService,
  prepareRoleMutationRequest,
  type RoleMutationResponse,
} from './services/role-mutation.service';
import type { OnetOccupationSkills } from '../../../services/onet';
import { mutationActions } from './store';
import { recordMutationUsage } from '../../../lib/usage-tracker';
import { CoverLetterPanel } from './components/CoverLetterPanel';
import { SuccessModal } from './components/SuccessModal';
import {
  coverLetterService,
  prepareCoverLetterRequest,
  type CoverLetterResponse,
} from './services/cover-letter.service';
import { exportService, type ExportFormat } from './services/export.service';
import { logger } from '../../../lib/logger';

interface PrepareAppProps {
  currentTheme: () => {
    colors: {
      primary: string;
      secondary: string;
      text: string;
      textMuted: string;
      textOnPrimary: string;
      background: string;
      surface: string;
      border: string;
      success: string;
      error: string;
    };
    fonts: {
      body: string;
      heading: string;
    };
    gradients: {
      primary: string;
    };
  };
  riasecScores?: { code: string; score: number; label: string }[];
}

type ViewMode = 'builder' | 'wizard' | 'repository';
type WizardMode = 'job-description' | 'job-title' | null;

export const PrepareApp: Component<PrepareAppProps> = (props) => {
  const theme = () => props.currentTheme();

  const [viewMode, setViewMode] = createSignal<ViewMode>('builder');
  const [wizardMode, setWizardMode] = createSignal<WizardMode>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);

  // Modal state signals
  const [showExperienceEditor, setShowExperienceEditor] = createSignal(false);
  const [showEducationEditor, setShowEducationEditor] = createSignal(false);
  const [editingExperience, setEditingExperience] = createSignal<WorkExperience | undefined>();
  const [editingEducation, setEditingEducation] = createSignal<Education | undefined>();

  // Mutation state
  const [isMutating, setIsMutating] = createSignal(false);
  const [mutationResult, setMutationResult] = createSignal<MutationResponse | null>(null);
  const [mutationError, setMutationError] = createSignal<string | null>(null);

  // Cover letter state
  const [showCoverLetter, setShowCoverLetter] = createSignal(false);
  const [coverLetterResult, setCoverLetterResult] = createSignal<CoverLetterResponse | null>(null);
  const [coverLetterError, setCoverLetterError] = createSignal<string | null>(null);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = createSignal(false);

  // Track current mutation context for cover letter
  const [currentMutationContext, setCurrentMutationContext] = createSignal<{
    targetRole?: string;
    targetCompany?: string;
    jobDescription?: string;
    occupationTitle?: string;
    occupationData?: { skills: { name: string }[]; tasks: string[] };
  } | null>(null);

  // Success modal state
  const [successModal, setSuccessModal] = createSignal<{
    isOpen: boolean;
    title: string;
    message: string;
    primaryAction?: { label: string; onClick: () => void };
    secondaryAction?: { label: string; onClick: () => void };
  }>({ isOpen: false, title: '', message: '' });

  // Export modal state
  const [showExportModal, setShowExportModal] = createSignal(false);
  const [exportTarget, setExportTarget] = createSignal<'master' | ResumeVariant | null>(null);
  const [isExporting, setIsExporting] = createSignal(false);

  const closeSuccessModal = () => setSuccessModal({ isOpen: false, title: '', message: '' });

  const hasMasterResume = () => prepareStore.hasMasterResume();
  const masterResume = () => prepareStore.state.masterResume;

  const handleParseComplete = () => {
    prepareStore.setWizardStep('parse-review');
  };

  const handleDeleteResume = () => {
    prepareStore.resetAll();
    setShowDeleteConfirm(false);
  };

  // Experience handlers
  const handleAddExperience = () => {
    setEditingExperience(undefined);
    setShowExperienceEditor(true);
  };

  const handleEditExperience = (exp: WorkExperience) => {
    setEditingExperience(exp);
    setShowExperienceEditor(true);
  };

  const handleDeleteExperience = (id: string) => {
    prepareStore.removeExperience(id);
  };

  const handleReorderExperiences = (ids: string[]) => {
    prepareStore.reorderExperiences(ids);
  };

  const handleSaveExperience = (exp: Omit<WorkExperience, 'id'>) => {
    if (editingExperience()) {
      prepareStore.updateExperience(editingExperience()!.id, exp);
    } else {
      prepareStore.addExperience(exp);
    }
    setShowExperienceEditor(false);
  };

  // Education handlers
  const handleAddEducation = () => {
    setEditingEducation(undefined);
    setShowEducationEditor(true);
  };

  const handleEditEducation = (edu: Education) => {
    setEditingEducation(edu);
    setShowEducationEditor(true);
  };

  const handleDeleteEducation = (id: string) => {
    prepareStore.removeEducation(id);
  };

  const handleReorderEducation = (ids: string[]) => {
    prepareStore.reorderEducation(ids);
  };

  const handleSaveEducation = (edu: Omit<Education, 'id'>) => {
    if (editingEducation()) {
      prepareStore.updateEducation(editingEducation()!.id, edu);
    } else {
      prepareStore.addEducation(edu);
    }
    setShowEducationEditor(false);
  };

  // Wizard mode selection
  const handleSelectWizardMode = (mode: 'job-description' | 'job-title') => {
    setWizardMode(mode);
  };

  const handleBackToModeSelector = () => {
    setWizardMode(null);
    setMutationResult(null);
    setMutationError(null);
  };

  // Mutation handlers
  const handleMutate = async (params: {
    jobDescription: string;
    targetRole?: string;
    targetCompany?: string;
    tone: 'professional' | 'technical' | 'executive' | 'casual';
    length: 'concise' | 'detailed';
  }) => {
    const resume = masterResume();
    if (!resume) return;

    setIsMutating(true);
    setMutationError(null);
    setMutationResult(null);

    try {
      const request = prepareMutationRequest(resume, params.jobDescription, {
        targetRole: params.targetRole,
        targetCompany: params.targetCompany,
        tone: params.tone,
        length: params.length,
      });

      const result = await mutationService.mutateResume(request);

      setMutationResult(result);
      mutationActions.setCurrentMutation(result);

      // Track usage
      recordMutationUsage(params.targetRole);

      // Save context for potential cover letter generation
      setCurrentMutationContext({
        targetRole: params.targetRole,
        targetCompany: params.targetCompany,
        jobDescription: params.jobDescription,
      });

      // Add to history
      mutationActions.addToMutationHistory({
        timestamp: new Date(),
        targetRole: params.targetRole,
        targetCompany: params.targetCompany,
        jobDescription: params.jobDescription,
        matchScoreBefore: result.analysis.matchScoreBefore,
        matchScoreAfter: result.analysis.matchScoreAfter,
      });
    } catch (error: any) {
      logger.resume.error('Mutation failed:', error);
      setMutationError(error.getUserMessage?.() || error.message || 'Failed to mutate resume');
    } finally {
      setIsMutating(false);
    }
  };

  // Role-based mutation handler
  const handleRoleMutate = async (params: {
    occupationCode: string;
    occupationTitle: string;
    occupationData: OnetOccupationSkills;
    tone: 'professional' | 'technical' | 'executive' | 'casual';
    length: 'concise' | 'detailed';
  }) => {
    const resume = masterResume();
    if (!resume) return;

    setIsMutating(true);
    setMutationError(null);
    setMutationResult(null);

    try {
      const request = prepareRoleMutationRequest(
        resume,
        params.occupationCode,
        params.occupationTitle,
        params.occupationData,
        { tone: params.tone, length: params.length }
      );

      const result = await roleMutationService.mutateByRole(request);

      // Convert role mutation response to match MutationResponse format for ResultsView
      const convertedResult: MutationResponse = {
        success: true,
        analysis: {
          jdKeywords: {
            skills: result.analysis.requiredSkills,
            knowledge: result.analysis.requiredKnowledge,
            tools: [],
            requirements: [],
          },
          matchedKeywords: result.analysis.matchedSkills,
          missingKeywords: result.analysis.missingSkills,
          matchScoreBefore: result.analysis.matchScoreBefore,
          matchScoreAfter: result.analysis.matchScoreAfter,
        },
        mutations: {
          summary:
            result.mutations.originalSummary && result.mutations.suggestedSummary
              ? {
                  original: result.mutations.originalSummary,
                  mutated: result.mutations.suggestedSummary,
                  reason: 'Tailored for target role',
                }
              : null,
          experiences: result.mutations.bulletChanges.reduce(
            (acc, change) => {
              const existing = acc.find((e) => e.experienceId === change.experienceId);
              if (existing) {
                existing.bullets.push({
                  original: change.original,
                  mutated: change.suggested,
                  keywordsAdded: [],
                  reason: `Relevance score: ${change.relevanceScore}`,
                });
              } else {
                acc.push({
                  experienceId: change.experienceId,
                  bullets: [
                    {
                      original: change.original,
                      mutated: change.suggested,
                      keywordsAdded: [],
                      reason: `Relevance score: ${change.relevanceScore}`,
                    },
                  ],
                });
              }
              return acc;
            },
            [] as {
              experienceId: string;
              bullets: {
                original: string;
                mutated: string;
                keywordsAdded: string[];
                reason: string;
              }[];
            }[]
          ),
          skillsToAdd: result.mutations.skillsToAdd,
          skillsReordered: result.mutations.skillsReordered,
        },
        processingTime: result.metadata.processingTime,
        aiTokensUsed: result.metadata.tokensUsed.total,
      };

      setMutationResult(convertedResult);
      mutationActions.setCurrentMutation(convertedResult);

      recordMutationUsage(params.occupationTitle);

      // Save context for potential cover letter generation
      setCurrentMutationContext({
        targetRole: params.occupationTitle,
        occupationTitle: params.occupationTitle,
        occupationData: params.occupationData,
      });

      mutationActions.addToMutationHistory({
        timestamp: new Date(),
        targetRole: params.occupationTitle,
        targetCompany: undefined,
        jobDescription: `Role-based: ${params.occupationTitle} (${params.occupationCode})`,
        matchScoreBefore: result.analysis.matchScoreBefore,
        matchScoreAfter: result.analysis.matchScoreAfter,
      });
    } catch (error: any) {
      logger.resume.error('Role mutation failed:', error);
      setMutationError(
        error.getUserMessage?.() || error.message || 'Failed to create resume variant'
      );
    } finally {
      setIsMutating(false);
    }
  };

  const handleAcceptAllChanges = () => {
    const result = mutationResult();
    if (!result) return;

    mutationActions.applyMutationToMaster(result);
    setSuccessModal({
      isOpen: true,
      title: 'Changes Applied!',
      message: 'All suggested changes have been applied to your master resume.',
      primaryAction: {
        label: 'Continue Editing',
        onClick: () => {
          closeSuccessModal();
          handleCloseMutationResults();
          setViewMode('builder');
        },
      },
      secondaryAction: {
        label: 'Back to Wizard',
        onClick: closeSuccessModal,
      },
    });
  };

  const handleSaveAsVariant = (name: string) => {
    const result = mutationResult();
    if (!result) return;

    mutationActions.createVariantFromMutation(
      result,
      name,
      result.analysis.jdKeywords.skills[0] // Use first skill as target role
    );

    setSuccessModal({
      isOpen: true,
      title: 'Variant Saved!',
      message: `Your tailored resume has been saved as "${name}". You can view and manage it in the Repository.`,
      primaryAction: {
        label: 'View Repository',
        onClick: () => {
          closeSuccessModal();
          setViewMode('repository');
        },
      },
      secondaryAction: {
        label: 'Create Another',
        onClick: () => {
          closeSuccessModal();
          handleCloseMutationResults();
        },
      },
    });
  };

  const handleCloseMutationResults = () => {
    setMutationResult(null);
    mutationActions.clearCurrentMutation();
  };

  const handleGenerateCoverLetter = async (params: {
    targetCompany: string;
    targetRole: string;
    hiringManagerName?: string;
    tone: 'professional' | 'enthusiastic' | 'formal' | 'conversational';
    length: 'short' | 'medium' | 'long';
    keyPoints: string[];
  }) => {
    const resume = masterResume();
    const context = currentMutationContext();
    if (!resume || !context) return;

    setIsGeneratingCoverLetter(true);
    setCoverLetterError(null);
    setCoverLetterResult(null);

    try {
      const request = prepareCoverLetterRequest(resume, {
        targetCompany: params.targetCompany,
        targetRole: params.targetRole,
        applicantName: (resume.parsedSections as any).personalInfo?.name,
        jobDescription: context.jobDescription,
        occupationTitle: context.occupationTitle,
        occupationData: context.occupationData,
        hiringManagerName: params.hiringManagerName,
        tone: params.tone,
        length: params.length,
        keyPoints: params.keyPoints,
      });

      const result = await coverLetterService.generateCoverLetter(request);
      setCoverLetterResult(result);
    } catch (error: any) {
      logger.resume.error('Cover letter generation failed:', error);
      setCoverLetterError(
        error.getUserMessage?.() || error.message || 'Failed to generate cover letter'
      );
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  const handleCloseCoverLetter = () => {
    setShowCoverLetter(false);
    setCoverLetterResult(null);
    setCoverLetterError(null);
  };

  const handleExport = async (format: ExportFormat) => {
    const target = exportTarget();
    const master = masterResume();
    if (!target || !master) return;

    setIsExporting(true);
    try {
      if (target === 'master') {
        await exportService.exportMasterResume(master, { format });
      } else {
        await exportService.exportVariant(target, master, { format });
      }
      setShowExportModal(false);
      setExportTarget(null);
    } catch (error: any) {
      logger.resume.error('Export failed:', error);
      // Show error in success modal (reusing for error display)
      setSuccessModal({
        isOpen: true,
        title: 'Export Failed',
        message: error.message || 'Failed to export resume',
        primaryAction: {
          label: 'Close',
          onClick: closeSuccessModal,
        },
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      style={{
        padding: '32px',
        'max-width': '1200px',
        margin: '0 auto',
        'min-height': 'calc(100vh - 200px)',
      }}
    >
      {/* Tab Navigation */}
      <Show when={hasMasterResume()}>
        <div
          style={{
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'center',
            'margin-bottom': '32px',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '12px',
              padding: '4px',
              background: 'rgba(255, 255, 255, 0.03)',
              'border-radius': '12px',
              border: `1px solid ${theme().colors.border}`,
              width: 'fit-content',
            }}
          >
            {/* Resume Builder Tab */}
            <button
              onClick={() => setViewMode('builder')}
              style={{
                padding: '12px 20px',
                background: viewMode() === 'builder' ? theme().gradients.primary : 'transparent',
                border: 'none',
                'border-radius': '8px',
                color:
                  viewMode() === 'builder'
                    ? theme().colors.textOnPrimary
                    : theme().colors.textMuted,
                cursor: 'pointer',
                'font-size': '14px',
                'font-weight': '600',
                'font-family': theme().fonts.body,
                transition: 'all 0.2s',
                display: 'flex',
                'align-items': 'center',
                gap: '8px',
              }}
            >
              <IconFileText size={16} />
              Resume Builder
            </button>

            {/* Resume Wizard Tab */}
            <button
              onClick={() => {
                setViewMode('wizard');
                setWizardMode(null);
              }}
              style={{
                padding: '12px 20px',
                background: viewMode() === 'wizard' ? theme().gradients.primary : 'transparent',
                border: 'none',
                'border-radius': '8px',
                color:
                  viewMode() === 'wizard' ? theme().colors.textOnPrimary : theme().colors.textMuted,
                cursor: 'pointer',
                'font-size': '14px',
                'font-weight': '600',
                'font-family': theme().fonts.body,
                transition: 'all 0.2s',
                display: 'flex',
                'align-items': 'center',
                gap: '8px',
              }}
            >
              <IconSparkles size={16} />
              Resume Wizard
            </button>

            {/* Resume Repository Tab */}
            <button
              onClick={() => setViewMode('repository')}
              style={{
                padding: '12px 20px',
                background: viewMode() === 'repository' ? theme().gradients.primary : 'transparent',
                border: 'none',
                'border-radius': '8px',
                color:
                  viewMode() === 'repository'
                    ? theme().colors.textOnPrimary
                    : theme().colors.textMuted,
                cursor: 'pointer',
                'font-size': '14px',
                'font-weight': '600',
                'font-family': theme().fonts.body,
                transition: 'all 0.2s',
                display: 'flex',
                'align-items': 'center',
                gap: '8px',
              }}
            >
              <IconGrid size={16} />
              Resume Repository
            </button>
          </div>

          {/* Delete Resume Button */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              padding: '12px 20px',
              background: `${theme().colors.error}20`,
              border: `1px solid ${theme().colors.error}`,
              'border-radius': '10px',
              color: theme().colors.error,
              cursor: 'pointer',
              'font-size': '14px',
              'font-weight': '600',
              'font-family': theme().fonts.body,
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${theme().colors.error}30`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${theme().colors.error}20`;
            }}
          >
            <IconTrash size={16} />
            Delete Resume
          </button>
        </div>
      </Show>

      {/* Main Content */}

      {/* WIZARD VIEW */}
      <Show when={viewMode() === 'wizard'}>
        <Show when={isMutating()}>
          <MutationProgress currentTheme={theme} />
        </Show>

        <Show when={!isMutating() && !wizardMode()}>
          <WizardModeSelector
            onSelectMode={handleSelectWizardMode}
            currentTheme={theme}
            riasecScores={props.riasecScores}
          />
        </Show>

        <Show when={!isMutating() && wizardMode() && !mutationResult()}>
          <div>
            <button
              onClick={handleBackToModeSelector}
              style={{
                'margin-bottom': '24px',
                padding: '8px 16px',
                background: 'transparent',
                border: `1px solid ${theme().colors.border}`,
                'border-radius': '8px',
                color: theme().colors.text,
                cursor: 'pointer',
                'font-size': '14px',
                'font-family': theme().fonts.body,
              }}
            >
              <ArrowLeftIcon width={16} height={16} /> Back to Mode Selection
            </button>

            <Show when={wizardMode() === 'job-description'}>
              <MutationPanel
                onMutate={handleMutate}
                isLoading={isMutating()}
                currentTheme={theme}
              />
            </Show>

            <Show when={wizardMode() === 'job-title'}>
              <JobTitlePanel
                onMutate={handleRoleMutate}
                isLoading={isMutating()}
                riasecScores={props.riasecScores}
                currentTheme={theme}
              />
            </Show>
          </div>
        </Show>

        <Show when={!isMutating() && mutationResult()}>
          <Show when={!showCoverLetter()}>
            <MutationResultsView
              mutation={mutationResult()!}
              onAcceptAll={handleAcceptAllChanges}
              onSaveAsVariant={handleSaveAsVariant}
              onClose={handleCloseMutationResults}
              currentTheme={theme}
            />

            {/* Cover Letter Button - Show below mutation results */}
            <div
              style={{
                'margin-top': '24px',
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${theme().colors.border}`,
                'border-radius': '12px',
                display: 'flex',
                'justify-content': 'space-between',
                'align-items': 'center',
              }}
            >
              <div>
                <h4
                  style={{
                    margin: '0 0 4px',
                    'font-size': '16px',
                    color: theme().colors.text,
                    'font-family': theme().fonts.heading,
                  }}
                >
                  Need a Cover Letter?
                </h4>
                <p
                  style={{
                    margin: 0,
                    'font-size': '14px',
                    color: theme().colors.textMuted,
                  }}
                >
                  Generate a matching cover letter for this application (uses 1 extra credit)
                </p>
              </div>
              <button
                onClick={() => setShowCoverLetter(true)}
                style={{
                  padding: '12px 24px',
                  background: theme().gradients.primary,
                  border: 'none',
                  'border-radius': '10px',
                  color: theme().colors.textOnPrimary,
                  'font-size': '15px',
                  'font-weight': '600',
                  cursor: 'pointer',
                }}
              >
                Generate Cover Letter
              </button>
            </div>
          </Show>

          <Show when={showCoverLetter()}>
            <CoverLetterPanel
              targetCompany={currentMutationContext()?.targetCompany || ''}
              targetRole={currentMutationContext()?.targetRole || ''}
              jobDescription={currentMutationContext()?.jobDescription}
              occupationTitle={currentMutationContext()?.occupationTitle}
              occupationData={currentMutationContext()?.occupationData}
              onGenerate={handleGenerateCoverLetter}
              onClose={handleCloseCoverLetter}
              isLoading={isGeneratingCoverLetter()}
              result={coverLetterResult()}
              error={coverLetterError()}
              currentTheme={theme}
            />
          </Show>
        </Show>

        <Show when={mutationError()}>
          <div
            style={{
              padding: '24px',
              background: `${theme().colors.error}20`,
              border: `2px solid ${theme().colors.error}`,
              'border-radius': '16px',
              'text-align': 'center',
            }}
          >
            <h3 style={{ margin: '0 0 8px', color: theme().colors.error }}>Wizard Failed</h3>
            <p style={{ margin: 0, color: theme().colors.text }}>{mutationError()}</p>
            <button
              onClick={() => setMutationError(null)}
              style={{
                'margin-top': '16px',
                padding: '10px 20px',
                background: theme().colors.error,
                border: 'none',
                'border-radius': '8px',
                color: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        </Show>
      </Show>

      {/* BUILDER VIEW */}
      <Show when={viewMode() === 'builder'}>
        <Show
          when={hasMasterResume()}
          fallback={
            <div>
              {/* Step 1: Upload */}
              <div
                style={{
                  'margin-bottom': '32px',
                  padding: '24px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${theme().colors.border}`,
                  'border-radius': '16px',
                }}
              >
                <h3
                  style={{
                    margin: '0 0 8px',
                    'font-size': '20px',
                    color: theme().colors.text,
                    'font-family': theme().fonts.heading,
                  }}
                >
                  Step 1: Upload Your Resume
                </h3>
                <p
                  style={{
                    margin: '0 0 24px',
                    'font-size': '14px',
                    color: theme().colors.textMuted,
                  }}
                >
                  Let AI parse your existing resume or paste the text directly
                </p>
                <ResumeUploader onParseComplete={handleParseComplete} currentTheme={theme} />
              </div>

              {/* Or Build from Scratch */}
              <div
                style={{
                  padding: '24px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${theme().colors.border}`,
                  'border-radius': '16px',
                  'text-align': 'center',
                }}
              >
                <h3
                  style={{
                    margin: '0 0 8px',
                    'font-size': '18px',
                    color: theme().colors.text,
                    'font-family': theme().fonts.heading,
                  }}
                >
                  Or Start from Scratch
                </h3>
                <p
                  style={{
                    margin: '0 0 16px',
                    'font-size': '14px',
                    color: theme().colors.textMuted,
                  }}
                >
                  Build your resume step-by-step with our guided wizard
                </p>
                <button
                  onClick={() => {
                    const pipelineProfile = localStorage.getItem('augment_pipeline_profile');
                    const userId = pipelineProfile
                      ? JSON.parse(pipelineProfile).id
                      : crypto.randomUUID();
                    prepareStore.createMasterResume(userId);
                    prepareStore.setHasManualEntry(true);
                    prepareStore.setWizardStep('experience');
                  }}
                  style={{
                    padding: '12px 32px',
                    background: theme().gradients.primary,
                    border: 'none',
                    'border-radius': '10px',
                    color: theme().colors.textOnPrimary,
                    'font-size': '15px',
                    'font-weight': '600',
                    cursor: 'pointer',
                    'font-family': theme().fonts.body,
                  }}
                >
                  Start Building
                </button>
              </div>
            </div>
          }
        >
          {/* Post-upload: Review parsed data */}
          <ParseReviewPanel
            currentTheme={theme as any}
            onContinue={() => prepareStore.setWizardStep('experience')}
            onAddExperience={handleAddExperience}
            onEditExperience={handleEditExperience}
            onDeleteExperience={handleDeleteExperience}
            onReorderExperiences={handleReorderExperiences}
            onAddEducation={handleAddEducation}
            onEditEducation={handleEditEducation}
            onDeleteEducation={handleDeleteEducation}
            onReorderEducation={handleReorderEducation}
          />
        </Show>
      </Show>

      {/* REPOSITORY VIEW */}
      <Show when={viewMode() === 'repository'}>
        <RepositoryView
          onEditMaster={() => setViewMode('builder')}
          onWizardFromMaster={() => {
            setViewMode('wizard');
            setWizardMode(null);
          }}
          onWizardFromVariant={(variant: ResumeVariant) => {
            // TODO: Pre-populate wizard with variant data
            setViewMode('wizard');
            setWizardMode(null);
          }}
          onEditVariant={(variant: ResumeVariant) => {
            // TODO: Implement variant editing
            logger.resume.debug('Edit variant:', variant);
            setViewMode('builder');
          }}
          onExport={(item) => {
            setExportTarget(item);
            setShowExportModal(true);
          }}
          currentTheme={theme}
        />
      </Show>

      {/* Delete Confirmation Modal */}
      <Show when={showDeleteConfirm()}>
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'z-index': 1000,
            padding: '20px',
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{
              background: theme().colors.background,
              border: `2px solid ${theme().colors.error}`,
              'border-radius': '16px',
              padding: '32px',
              'max-width': '500px',
              width: '100%',
              'box-shadow': '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '12px',
                'margin-bottom': '16px',
              }}
            >
              <IconTrash size={24} color={theme().colors.error} />
              <h3
                style={{
                  margin: 0,
                  'font-size': '24px',
                  color: theme().colors.error,
                  'font-family': theme().fonts.heading,
                }}
              >
                Delete Resume?
              </h3>
            </div>

            <p
              style={{
                margin: '0 0 24px',
                'font-size': '16px',
                color: theme().colors.text,
                'line-height': '1.6',
              }}
            >
              This will permanently delete your master resume, all variants, and reset the wizard.
              This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px', 'justify-content': 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${theme().colors.border}`,
                  'border-radius': '10px',
                  color: theme().colors.text,
                  'font-size': '15px',
                  'font-weight': '600',
                  cursor: 'pointer',
                  'font-family': theme().fonts.body,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteResume}
                style={{
                  padding: '12px 24px',
                  background: theme().colors.error,
                  border: 'none',
                  'border-radius': '10px',
                  color: '#FFFFFF',
                  'font-size': '15px',
                  'font-weight': '600',
                  cursor: 'pointer',
                  'font-family': theme().fonts.body,
                }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Experience Editor Modal */}
      <ExperienceEditor
        isOpen={showExperienceEditor()}
        onClose={() => setShowExperienceEditor(false)}
        currentTheme={theme}
        experience={editingExperience()}
        onSave={handleSaveExperience}
      />

      {/* Education Editor Modal */}
      <EducationEditor
        isOpen={showEducationEditor()}
        onClose={() => setShowEducationEditor(false)}
        currentTheme={theme}
        education={editingEducation()}
        onSave={handleSaveEducation}
      />

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Export Modal */}
      <Show when={showExportModal()}>
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'z-index': 1000,
            padding: '20px',
          }}
          onClick={() => setShowExportModal(false)}
        >
          <div
            style={{
              background: theme().colors.background,
              border: `1px solid ${theme().colors.border}`,
              'border-radius': '16px',
              padding: '32px',
              'max-width': '400px',
              width: '100%',
              'box-shadow': '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: '0 0 8px',
                'font-size': '22px',
                color: theme().colors.text,
                'font-family': theme().fonts.heading,
              }}
            >
              Export Resume
            </h3>
            <p
              style={{
                margin: '0 0 24px',
                'font-size': '14px',
                color: theme().colors.textMuted,
              }}
            >
              Choose a format to export your{' '}
              {exportTarget() === 'master' ? 'master resume' : 'resume variant'}
            </p>

            <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
              <button
                onClick={() => handleExport('txt')}
                disabled={isExporting()}
                style={{
                  padding: '14px 20px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${theme().colors.border}`,
                  'border-radius': '10px',
                  color: theme().colors.text,
                  'font-size': '15px',
                  'font-weight': '600',
                  cursor: isExporting() ? 'not-allowed' : 'pointer',
                  'text-align': 'left',
                  display: 'flex',
                  'justify-content': 'space-between',
                  'align-items': 'center',
                }}
              >
                <span>Plain Text (.txt)</span>
                <span style={{ 'font-size': '12px', color: theme().colors.textMuted }}>
                  Simple, ATS-friendly
                </span>
              </button>

              <button
                onClick={() => handleExport('pdf')}
                disabled={isExporting()}
                style={{
                  padding: '14px 20px',
                  background: theme().gradients.primary,
                  border: 'none',
                  'border-radius': '10px',
                  color: theme().colors.textOnPrimary,
                  'font-size': '15px',
                  'font-weight': '600',
                  cursor: isExporting() ? 'not-allowed' : 'pointer',
                  'text-align': 'left',
                  display: 'flex',
                  'justify-content': 'space-between',
                  'align-items': 'center',
                }}
              >
                <span>PDF Document</span>
                <span style={{ 'font-size': '12px', opacity: 0.8 }}>Opens print dialog</span>
              </button>

              <button
                onClick={() => handleExport('docx')}
                disabled={true}
                style={{
                  padding: '14px 20px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: `1px dashed ${theme().colors.border}`,
                  'border-radius': '10px',
                  color: theme().colors.textMuted,
                  'font-size': '15px',
                  'font-weight': '600',
                  cursor: 'not-allowed',
                  'text-align': 'left',
                  display: 'flex',
                  'justify-content': 'space-between',
                  'align-items': 'center',
                }}
              >
                <span>Word Document (.docx)</span>
                <span style={{ 'font-size': '12px' }}>Coming soon</span>
              </button>
            </div>

            <button
              onClick={() => setShowExportModal(false)}
              style={{
                'margin-top': '20px',
                width: '100%',
                padding: '12px',
                background: 'transparent',
                border: `1px solid ${theme().colors.border}`,
                'border-radius': '8px',
                color: theme().colors.text,
                'font-size': '14px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </Show>

      {/* Success Modal */}
      <SuccessModal
        isOpen={successModal().isOpen}
        title={successModal().title}
        message={successModal().message}
        primaryAction={successModal().primaryAction}
        secondaryAction={successModal().secondaryAction}
        onClose={closeSuccessModal}
        currentTheme={theme}
      />
    </div>
  );
};

export default PrepareApp;
