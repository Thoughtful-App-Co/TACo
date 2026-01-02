/**
 * ReviewsView - 360 Reviews & Feedback Collection
 *
 * Features:
 * - Review cycles list with status badges
 * - Create new review cycle form
 * - Self-review section with ratings and text responses
 * - External feedback collection with shareable links
 * - Accolades showcase
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, createMemo, For, Show } from 'solid-js';
import { prosperStore } from '../store';
import type { ReviewCycleStatus, FeedbackSource, AccoladeEntry } from '../../../../schemas/tenure';
import { createDefaultReviewQuestions } from '../../../../schemas/tenure';
import { ArrowLeftIcon } from 'solid-phosphor/bold';

// ============================================================================
// TYPES
// ============================================================================

interface ReviewsViewProps {
  currentTheme: () => any;
}

type ActiveTab = 'cycles' | 'self-review' | 'feedback' | 'accolades';

// ============================================================================
// ICONS
// ============================================================================

const PlusIcon: Component = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const CopyIcon: Component = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const StarIcon: Component = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    stroke-width="1"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const StarOutlineIcon: Component = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// ============================================================================
// HELPERS
// ============================================================================

const getStatusColor = (status: ReviewCycleStatus): string => {
  switch (status) {
    case 'draft':
      return '#6B7280'; // gray
    case 'in-progress':
      return '#3B82F6'; // blue
    case 'collecting-feedback':
      return '#F59E0B'; // amber
    case 'completed':
      return '#10B981'; // green
    default:
      return '#6B7280';
  }
};

const getStatusLabel = (status: ReviewCycleStatus): string => {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'in-progress':
      return 'In Progress';
    case 'collecting-feedback':
      return 'Collecting Feedback';
    case 'completed':
      return 'Completed';
    default:
      return status;
  }
};

const formatDate = (date: Date | undefined): string => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getCategoryColor = (category: AccoladeEntry['category']): string => {
  switch (category) {
    case 'technical':
      return '#3B82F6';
    case 'leadership':
      return '#8B5CF6';
    case 'collaboration':
      return '#10B981';
    case 'innovation':
      return '#F59E0B';
    case 'impact':
      return '#EF4444';
    case 'other':
    default:
      return '#6B7280';
  }
};

// ============================================================================
// STATUS BADGE COMPONENT
// ============================================================================

const StatusBadge: Component<{ status: ReviewCycleStatus; theme: () => any }> = (props) => {
  const color = () => getStatusColor(props.status);
  return (
    <span
      style={{
        display: 'inline-flex',
        'align-items': 'center',
        padding: '4px 12px',
        'border-radius': '12px',
        background: `${color()}20`,
        color: color(),
        'font-size': '12px',
        'font-weight': '600',
        'text-transform': 'capitalize',
      }}
    >
      {getStatusLabel(props.status)}
    </span>
  );
};

// ============================================================================
// RATING STARS COMPONENT
// ============================================================================

const RatingStars: Component<{
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  theme: () => any;
}> = (props) => {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      <For each={[1, 2, 3, 4, 5]}>
        {(star) => (
          <button
            type="button"
            onClick={() => !props.readonly && props.onChange?.(star)}
            disabled={props.readonly}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px',
              cursor: props.readonly ? 'default' : 'pointer',
              color: star <= props.value ? '#F59E0B' : props.theme().colors.border,
              transition: 'color 0.2s',
            }}
          >
            {star <= props.value ? <StarIcon /> : <StarOutlineIcon />}
          </button>
        )}
      </For>
    </div>
  );
};

// ============================================================================
// CREATE REVIEW CYCLE FORM
// ============================================================================

const CreateReviewCycleForm: Component<{ onClose: () => void; theme: () => any }> = (props) => {
  const theme = () => props.theme();
  const [name, setName] = createSignal('');
  const [periodStart, setPeriodStart] = createSignal('');
  const [periodEnd, setPeriodEnd] = createSignal('');

  const inputStyle = () => ({
    width: '100%',
    padding: '10px 12px',
    background: theme().colors.background,
    border: `1px solid ${theme().colors.border}`,
    'border-radius': '8px',
    color: theme().colors.text,
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    'font-size': '14px',
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    const cycle = {
      name: name() || `Review ${new Date().toLocaleDateString()}`,
      periodStart: new Date(periodStart()),
      periodEnd: new Date(periodEnd()),
      company: prosperStore.state.employmentState.currentCompany || 'Current Company',
      title: prosperStore.state.employmentState.currentTitle || 'Current Role',
      employerId: prosperStore.state.employmentState.currentEmployerId,
      questions: createDefaultReviewQuestions(),
      status: 'draft' as ReviewCycleStatus,
      feedbackRequestsSent: 0,
      feedbackReceived: 0,
    };

    prosperStore.addReviewCycle(cycle);
    props.onClose();
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}
    >
      <div>
        <label
          style={{
            display: 'block',
            'font-size': '14px',
            'font-weight': '500',
            color: theme().colors.text,
            'margin-bottom': '6px',
          }}
        >
          Review Cycle Name
        </label>
        <input
          type="text"
          value={name()}
          onInput={(e) => setName(e.currentTarget.value)}
          placeholder="e.g., Q4 2025 Review"
          style={inputStyle()}
        />
      </div>

      <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '16px' }}>
        <div>
          <label
            style={{
              display: 'block',
              'font-size': '14px',
              'font-weight': '500',
              color: theme().colors.text,
              'margin-bottom': '6px',
            }}
          >
            Period Start <span style={{ color: theme().colors.accent }}>*</span>
          </label>
          <input
            type="date"
            value={periodStart()}
            onInput={(e) => setPeriodStart(e.currentTarget.value)}
            required
            style={inputStyle()}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              'font-size': '14px',
              'font-weight': '500',
              color: theme().colors.text,
              'margin-bottom': '6px',
            }}
          >
            Period End <span style={{ color: theme().colors.accent }}>*</span>
          </label>
          <input
            type="date"
            value={periodEnd()}
            onInput={(e) => setPeriodEnd(e.currentTarget.value)}
            required
            style={inputStyle()}
          />
        </div>
      </div>

      <div
        style={{
          background: theme().colors.background,
          padding: '12px 16px',
          'border-radius': '8px',
          border: `1px solid ${theme().colors.border}`,
        }}
      >
        <p style={{ margin: 0, 'font-size': '13px', color: theme().colors.textMuted }}>
          <strong>Company:</strong> {prosperStore.state.employmentState.currentCompany || 'Not set'}
          <br />
          <strong>Title:</strong> {prosperStore.state.employmentState.currentTitle || 'Not set'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', 'justify-content': 'flex-end' }}>
        <button
          type="button"
          onClick={props.onClose}
          style={{
            background: 'transparent',
            color: theme().colors.textMuted,
            border: `1px solid ${theme().colors.border}`,
            padding: '10px 20px',
            'border-radius': '8px',
            cursor: 'pointer',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            'font-size': '14px',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{
            background: theme().colors.secondary,
            color: '#FFF',
            border: 'none',
            padding: '10px 20px',
            'border-radius': '8px',
            cursor: 'pointer',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            'font-weight': '600',
            'font-size': '14px',
          }}
        >
          Create Review Cycle
        </button>
      </div>
    </form>
  );
};

// ============================================================================
// REVIEW CYCLES LIST
// ============================================================================

const ReviewCyclesList: Component<{
  onSelectCycle: (id: string) => void;
  onCreateNew: () => void;
  theme: () => any;
}> = (props) => {
  const theme = () => props.theme();
  const cycles = createMemo(() =>
    [...prosperStore.state.reviewCycles].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  );

  return (
    <div>
      <div
        style={{
          display: 'flex',
          'justify-content': 'space-between',
          'align-items': 'center',
          'margin-bottom': '24px',
        }}
      >
        <h3
          style={{
            'font-family': "'Playfair Display', Georgia, serif",
            'font-size': '20px',
            color: theme().colors.text,
            margin: 0,
          }}
        >
          Review Cycles
        </h3>
        <button
          onClick={props.onCreateNew}
          style={{
            background: theme().colors.secondary,
            color: '#FFF',
            border: 'none',
            padding: '10px 16px',
            'border-radius': '8px',
            cursor: 'pointer',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            'font-weight': '600',
            'font-size': '14px',
            display: 'flex',
            'align-items': 'center',
            gap: '8px',
          }}
        >
          <PlusIcon />
          New Review Cycle
        </button>
      </div>

      <Show
        when={cycles().length > 0}
        fallback={
          <div
            style={{
              background: theme().colors.surface,
              padding: '48px 32px',
              'border-radius': '16px',
              'text-align': 'center',
              border: `2px dashed ${theme().colors.border}`,
            }}
          >
            <div style={{ 'font-size': '48px', 'margin-bottom': '16px' }}>360</div>
            <h3
              style={{
                'font-family': "'Playfair Display', Georgia, serif",
                'font-size': '20px',
                color: theme().colors.text,
                'margin-bottom': '8px',
              }}
            >
              No Review Cycles Yet
            </h3>
            <p style={{ color: theme().colors.textMuted, 'margin-bottom': '24px' }}>
              Start your first 360 review cycle to gather self-assessment and external feedback
            </p>
            <button
              onClick={props.onCreateNew}
              style={{
                background: theme().colors.secondary,
                color: '#FFF',
                border: 'none',
                padding: '12px 24px',
                'border-radius': '8px',
                cursor: 'pointer',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                'font-weight': '600',
                'font-size': '14px',
              }}
            >
              Create Your First Review Cycle
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
          <For each={cycles()}>
            {(cycle) => (
              <div
                onClick={() => props.onSelectCycle(cycle.id)}
                style={{
                  background: theme().colors.surface,
                  padding: '20px',
                  'border-radius': '12px',
                  border: `1px solid ${theme().colors.border}`,
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme().colors.secondary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme().colors.border;
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    'justify-content': 'space-between',
                    'align-items': 'start',
                    'margin-bottom': '12px',
                  }}
                >
                  <div>
                    <h4
                      style={{
                        'font-family': "'Playfair Display', Georgia, serif",
                        'font-size': '18px',
                        color: theme().colors.text,
                        margin: '0 0 4px 0',
                      }}
                    >
                      {cycle.name}
                    </h4>
                    <p style={{ 'font-size': '14px', color: theme().colors.textMuted, margin: 0 }}>
                      {cycle.company} - {cycle.title}
                    </p>
                  </div>
                  <StatusBadge status={cycle.status} theme={theme} />
                </div>

                <div
                  style={{ display: 'flex', gap: '24px', 'font-size': '13px', 'flex-wrap': 'wrap' }}
                >
                  <div>
                    <span style={{ color: theme().colors.textMuted }}>Period: </span>
                    <span style={{ color: theme().colors.text }}>
                      {formatDate(cycle.periodStart)} - {formatDate(cycle.periodEnd)}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: theme().colors.textMuted }}>Feedback: </span>
                    <span style={{ color: theme().colors.text }}>
                      {cycle.feedbackReceived} / {cycle.feedbackRequestsSent} received
                    </span>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

// ============================================================================
// SELF REVIEW SECTION
// ============================================================================

const SelfReviewSection: Component<{
  cycleId: string;
  theme: () => any;
}> = (props) => {
  const theme = () => props.theme();

  const cycle = createMemo(() =>
    prosperStore.state.reviewCycles.find((c) => c.id === props.cycleId)
  );

  const existingReview = createMemo(() =>
    prosperStore.state.selfReviews.find((r) => r.reviewCycleId === props.cycleId)
  );

  // Form state
  const [technicalSkills, setTechnicalSkills] = createSignal(
    existingReview()?.ratings.technicalSkills || 3
  );
  const [communication, setCommunication] = createSignal(
    existingReview()?.ratings.communication || 3
  );
  const [leadership, setLeadership] = createSignal(existingReview()?.ratings.leadership || 3);
  const [problemSolving, setProblemSolving] = createSignal(
    existingReview()?.ratings.problemSolving || 3
  );
  const [collaboration, setCollaboration] = createSignal(
    existingReview()?.ratings.collaboration || 3
  );
  const [initiative, setInitiative] = createSignal(existingReview()?.ratings.initiative || 3);

  const [accomplishments, setAccomplishments] = createSignal(
    existingReview()?.accomplishments || ''
  );
  const [challenges, setChallenges] = createSignal(existingReview()?.challenges || '');
  const [goalsForNext, setGoalsForNext] = createSignal(existingReview()?.goalsForNext || '');
  const [areasForGrowth, setAreasForGrowth] = createSignal(existingReview()?.areasForGrowth || '');

  const completedFields = createMemo(() => {
    let count = 0;
    if (accomplishments().trim()) count++;
    if (challenges().trim()) count++;
    if (goalsForNext().trim()) count++;
    if (areasForGrowth().trim()) count++;
    return count;
  });

  const progressPercent = createMemo(() => (completedFields() / 4) * 100);

  const inputStyle = () => ({
    width: '100%',
    padding: '10px 12px',
    background: theme().colors.background,
    border: `1px solid ${theme().colors.border}`,
    'border-radius': '8px',
    color: theme().colors.text,
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    'font-size': '14px',
    resize: 'vertical' as const,
  });

  const handleSave = (complete: boolean = false) => {
    const reviewData = {
      reviewCycleId: props.cycleId,
      periodStart: cycle()?.periodStart || new Date(),
      periodEnd: cycle()?.periodEnd || new Date(),
      company: cycle()?.company || '',
      title: cycle()?.title || '',
      employerId: cycle()?.employerId,
      responses: {},
      ratings: {
        technicalSkills: technicalSkills(),
        communication: communication(),
        leadership: leadership(),
        problemSolving: problemSolving(),
        collaboration: collaboration(),
        initiative: initiative(),
      },
      accomplishments: accomplishments(),
      challenges: challenges(),
      goalsForNext: goalsForNext(),
      areasForGrowth: areasForGrowth(),
      isDraft: !complete,
      completedAt: complete ? new Date() : undefined,
    };

    if (existingReview()) {
      prosperStore.updateSelfReview(existingReview()!.id, reviewData);
      if (complete) {
        prosperStore.completeSelfReview(existingReview()!.id);
      }
    } else {
      prosperStore.addSelfReview(reviewData);
    }

    // Update cycle status
    if (complete) {
      prosperStore.updateReviewCycle(props.cycleId, { status: 'collecting-feedback' });
    } else if (cycle()?.status === 'draft') {
      prosperStore.updateReviewCycle(props.cycleId, { status: 'in-progress' });
    }
  };

  const RatingRow: Component<{
    label: string;
    value: number;
    onChange: (v: number) => void;
  }> = (rowProps) => (
    <div
      style={{
        display: 'flex',
        'justify-content': 'space-between',
        'align-items': 'center',
        padding: '12px 0',
        'border-bottom': `1px solid ${theme().colors.border}`,
      }}
    >
      <span style={{ 'font-size': '14px', color: theme().colors.text }}>{rowProps.label}</span>
      <RatingStars value={rowProps.value} onChange={rowProps.onChange} theme={theme} />
    </div>
  );

  return (
    <div
      style={{
        background: theme().colors.surface,
        padding: '24px',
        'border-radius': '16px',
        border: `1px solid ${theme().colors.border}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          'justify-content': 'space-between',
          'align-items': 'center',
          'margin-bottom': '24px',
        }}
      >
        <div>
          <h3
            style={{
              'font-family': "'Playfair Display', Georgia, serif",
              'font-size': '20px',
              color: theme().colors.text,
              margin: '0 0 4px 0',
            }}
          >
            Self-Assessment
          </h3>
          <p style={{ 'font-size': '14px', color: theme().colors.textMuted, margin: 0 }}>
            {cycle()?.name}
          </p>
        </div>

        {/* Progress Indicator */}
        <div style={{ 'text-align': 'right' }}>
          <div
            style={{ 'font-size': '14px', color: theme().colors.textMuted, 'margin-bottom': '4px' }}
          >
            {completedFields()} / 4 sections complete
          </div>
          <div
            style={{
              width: '120px',
              height: '6px',
              background: theme().colors.background,
              'border-radius': '3px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPercent()}%`,
                height: '100%',
                background: theme().colors.secondary,
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
      </div>

      {/* Ratings Section */}
      <div style={{ 'margin-bottom': '32px' }}>
        <h4
          style={{
            'font-size': '16px',
            'font-weight': '600',
            color: theme().colors.text,
            'margin-bottom': '16px',
          }}
        >
          Self-Ratings (1-5)
        </h4>
        <div
          style={{
            background: theme().colors.background,
            padding: '0 16px',
            'border-radius': '12px',
            border: `1px solid ${theme().colors.border}`,
          }}
        >
          <RatingRow
            label="Technical Skills"
            value={technicalSkills()}
            onChange={setTechnicalSkills}
          />
          <RatingRow label="Communication" value={communication()} onChange={setCommunication} />
          <RatingRow label="Leadership" value={leadership()} onChange={setLeadership} />
          <RatingRow
            label="Problem Solving"
            value={problemSolving()}
            onChange={setProblemSolving}
          />
          <RatingRow label="Collaboration" value={collaboration()} onChange={setCollaboration} />
          <div
            style={{
              display: 'flex',
              'justify-content': 'space-between',
              'align-items': 'center',
              padding: '12px 0',
            }}
          >
            <span style={{ 'font-size': '14px', color: theme().colors.text }}>Initiative</span>
            <RatingStars value={initiative()} onChange={setInitiative} theme={theme} />
          </div>
        </div>
      </div>

      {/* Text Responses */}
      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '20px' }}>
        <div>
          <label
            style={{
              display: 'block',
              'font-size': '14px',
              'font-weight': '500',
              color: theme().colors.text,
              'margin-bottom': '6px',
            }}
          >
            Key Accomplishments
          </label>
          <textarea
            value={accomplishments()}
            onInput={(e) => setAccomplishments(e.currentTarget.value)}
            placeholder="List your major accomplishments during this review period..."
            rows={4}
            style={inputStyle()}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              'font-size': '14px',
              'font-weight': '500',
              color: theme().colors.text,
              'margin-bottom': '6px',
            }}
          >
            Challenges Faced
          </label>
          <textarea
            value={challenges()}
            onInput={(e) => setChallenges(e.currentTarget.value)}
            placeholder="Describe challenges you encountered and how you addressed them..."
            rows={4}
            style={inputStyle()}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              'font-size': '14px',
              'font-weight': '500',
              color: theme().colors.text,
              'margin-bottom': '6px',
            }}
          >
            Goals for Next Period
          </label>
          <textarea
            value={goalsForNext()}
            onInput={(e) => setGoalsForNext(e.currentTarget.value)}
            placeholder="What do you want to achieve in the next review period?"
            rows={4}
            style={inputStyle()}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              'font-size': '14px',
              'font-weight': '500',
              color: theme().colors.text,
              'margin-bottom': '6px',
            }}
          >
            Areas for Growth
          </label>
          <textarea
            value={areasForGrowth()}
            onInput={(e) => setAreasForGrowth(e.currentTarget.value)}
            placeholder="What skills or areas would you like to develop?"
            rows={4}
            style={inputStyle()}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          'justify-content': 'flex-end',
          'margin-top': '24px',
        }}
      >
        <button
          onClick={() => handleSave(false)}
          style={{
            background: 'transparent',
            color: theme().colors.textMuted,
            border: `1px solid ${theme().colors.border}`,
            padding: '10px 20px',
            'border-radius': '8px',
            cursor: 'pointer',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            'font-size': '14px',
          }}
        >
          Save Draft
        </button>
        <button
          onClick={() => handleSave(true)}
          style={{
            background: theme().colors.secondary,
            color: '#FFF',
            border: 'none',
            padding: '10px 20px',
            'border-radius': '8px',
            cursor: 'pointer',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            'font-weight': '600',
            'font-size': '14px',
          }}
        >
          Complete Self-Review
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// FEEDBACK COLLECTION SECTION
// ============================================================================

const FeedbackCollectionSection: Component<{
  cycleId: string;
  theme: () => any;
}> = (props) => {
  const theme = () => props.theme();
  const [copiedLink, setCopiedLink] = createSignal<string | null>(null);
  const [selectedSource, setSelectedSource] = createSignal<FeedbackSource>('peer');

  const cycle = createMemo(() =>
    prosperStore.state.reviewCycles.find((c) => c.id === props.cycleId)
  );

  const feedbackEntries = createMemo(() =>
    prosperStore.state.externalFeedback.filter((f) => f.reviewCycleId === props.cycleId)
  );

  const handleGenerateLink = () => {
    const link = prosperStore.generateFeedbackLink(props.cycleId, selectedSource());
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 3000);
  };

  const copyExistingLink = (token: string) => {
    const link = `${window.location.origin}/feedback/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 3000);
  };

  const getSourceLabel = (source: FeedbackSource): string => {
    switch (source) {
      case 'manager':
        return 'Manager';
      case 'peer':
        return 'Peer';
      case 'direct-report':
        return 'Direct Report';
      case 'other':
        return 'Other';
      default:
        return source;
    }
  };

  return (
    <div
      style={{
        background: theme().colors.surface,
        padding: '24px',
        'border-radius': '16px',
        border: `1px solid ${theme().colors.border}`,
      }}
    >
      <h3
        style={{
          'font-family': "'Playfair Display', Georgia, serif",
          'font-size': '20px',
          color: theme().colors.text,
          'margin-bottom': '24px',
        }}
      >
        Feedback Collection
      </h3>

      {/* Generate Link Section */}
      <div
        style={{
          background: theme().colors.background,
          padding: '20px',
          'border-radius': '12px',
          'margin-bottom': '24px',
        }}
      >
        <h4
          style={{
            'font-size': '16px',
            'font-weight': '600',
            color: theme().colors.text,
            'margin-bottom': '12px',
          }}
        >
          Request Feedback
        </h4>

        <div style={{ display: 'flex', gap: '12px', 'flex-wrap': 'wrap', 'align-items': 'end' }}>
          <div style={{ 'flex-grow': 1, 'min-width': '200px' }}>
            <label
              style={{
                display: 'block',
                'font-size': '13px',
                color: theme().colors.textMuted,
                'margin-bottom': '6px',
              }}
            >
              Feedback Source
            </label>
            <select
              value={selectedSource()}
              onChange={(e) => setSelectedSource(e.currentTarget.value as FeedbackSource)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: theme().colors.surface,
                border: `1px solid ${theme().colors.border}`,
                'border-radius': '8px',
                color: theme().colors.text,
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                'font-size': '14px',
              }}
            >
              <option value="manager">Manager</option>
              <option value="peer">Peer</option>
              <option value="direct-report">Direct Report</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button
            onClick={handleGenerateLink}
            style={{
              background: theme().colors.secondary,
              color: '#FFF',
              border: 'none',
              padding: '10px 20px',
              'border-radius': '8px',
              cursor: 'pointer',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              'font-weight': '600',
              'font-size': '14px',
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
              'white-space': 'nowrap',
            }}
          >
            <CopyIcon />
            Generate & Copy Link
          </button>
        </div>

        <Show when={copiedLink()}>
          <div
            style={{
              'margin-top': '12px',
              padding: '12px',
              background: '#10B98120',
              'border-radius': '8px',
              color: '#10B981',
              'font-size': '13px',
            }}
          >
            Link copied to clipboard!
          </div>
        </Show>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          'grid-template-columns': 'repeat(2, 1fr)',
          gap: '16px',
          'margin-bottom': '24px',
        }}
      >
        <div
          style={{
            background: theme().colors.background,
            padding: '16px',
            'border-radius': '12px',
            'text-align': 'center',
          }}
        >
          <div
            style={{ 'font-size': '28px', 'font-weight': 'bold', color: theme().colors.secondary }}
          >
            {cycle()?.feedbackRequestsSent || 0}
          </div>
          <div style={{ 'font-size': '13px', color: theme().colors.textMuted }}>Requests Sent</div>
        </div>
        <div
          style={{
            background: theme().colors.background,
            padding: '16px',
            'border-radius': '12px',
            'text-align': 'center',
          }}
        >
          <div style={{ 'font-size': '28px', 'font-weight': 'bold', color: '#10B981' }}>
            {feedbackEntries().filter((f) => f.submittedAt).length}
          </div>
          <div style={{ 'font-size': '13px', color: theme().colors.textMuted }}>
            Responses Received
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <Show when={feedbackEntries().length > 0}>
        <h4
          style={{
            'font-size': '16px',
            'font-weight': '600',
            color: theme().colors.text,
            'margin-bottom': '12px',
          }}
        >
          Feedback Responses
        </h4>
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
          <For each={feedbackEntries()}>
            {(feedback) => (
              <div
                style={{
                  background: theme().colors.background,
                  padding: '16px',
                  'border-radius': '12px',
                  border: `1px solid ${theme().colors.border}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    'justify-content': 'space-between',
                    'align-items': 'start',
                    'margin-bottom': '8px',
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        'border-radius': '4px',
                        background: `${theme().colors.secondary}20`,
                        color: theme().colors.secondary,
                        'font-size': '12px',
                        'font-weight': '600',
                        'margin-bottom': '4px',
                      }}
                    >
                      {getSourceLabel(feedback.source)}
                    </span>
                    <p style={{ 'font-size': '14px', color: theme().colors.text, margin: 0 }}>
                      {feedback.isAnonymous
                        ? 'Anonymous'
                        : feedback.submitterName || 'Pending response'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', 'align-items': 'center' }}>
                    <Show
                      when={feedback.submittedAt}
                      fallback={
                        <>
                          <span
                            style={{
                              'font-size': '12px',
                              color: theme().colors.textMuted,
                            }}
                          >
                            Pending
                          </span>
                          <button
                            onClick={() => copyExistingLink(feedback.token)}
                            style={{
                              background: 'transparent',
                              border: `1px solid ${theme().colors.border}`,
                              padding: '6px 10px',
                              'border-radius': '6px',
                              cursor: 'pointer',
                              color: theme().colors.textMuted,
                              display: 'flex',
                              'align-items': 'center',
                              gap: '4px',
                              'font-size': '12px',
                            }}
                          >
                            <CopyIcon />
                            Copy Link
                          </button>
                        </>
                      }
                    >
                      <span
                        style={{
                          'font-size': '12px',
                          color: '#10B981',
                        }}
                      >
                        Submitted {formatDate(feedback.submittedAt)}
                      </span>
                    </Show>
                  </div>
                </div>

                <Show when={feedback.submittedAt && feedback.strengths}>
                  <div style={{ 'margin-top': '12px' }}>
                    <p
                      style={{
                        'font-size': '13px',
                        color: theme().colors.textMuted,
                        margin: '0 0 4px 0',
                      }}
                    >
                      Strengths:
                    </p>
                    <p style={{ 'font-size': '14px', color: theme().colors.text, margin: 0 }}>
                      {feedback.strengths}
                    </p>
                  </div>
                </Show>

                <Show when={feedback.submittedAt && feedback.areasForImprovement}>
                  <div style={{ 'margin-top': '12px' }}>
                    <p
                      style={{
                        'font-size': '13px',
                        color: theme().colors.textMuted,
                        margin: '0 0 4px 0',
                      }}
                    >
                      Areas for Improvement:
                    </p>
                    <p style={{ 'font-size': '14px', color: theme().colors.text, margin: 0 }}>
                      {feedback.areasForImprovement}
                    </p>
                  </div>
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

// ============================================================================
// ACCOLADES SECTION
// ============================================================================

const AccoladesSection: Component<{ theme: () => any }> = (props) => {
  const theme = () => props.theme();
  const [showForm, setShowForm] = createSignal(false);

  // Form state
  const [title, setTitle] = createSignal('');
  const [description, setDescription] = createSignal('');
  const [category, setCategory] = createSignal<AccoladeEntry['category']>('other');
  const [fromName, setFromName] = createSignal('');
  const [fromRelationship, setFromRelationship] = createSignal('');

  const accolades = createMemo(() =>
    [...prosperStore.state.accolades].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  );

  const inputStyle = () => ({
    width: '100%',
    padding: '10px 12px',
    background: theme().colors.background,
    border: `1px solid ${theme().colors.border}`,
    'border-radius': '8px',
    color: theme().colors.text,
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    'font-size': '14px',
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    prosperStore.addAccolade({
      source: 'manual',
      title: title(),
      description: description(),
      category: category(),
      fromName: fromName() || undefined,
      fromRelationship: fromRelationship() || undefined,
      date: new Date(),
      company: prosperStore.state.employmentState.currentCompany || 'Current Company',
      employerId: prosperStore.state.employmentState.currentEmployerId,
      canShowPublicly: true,
      addedToResume: false,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setCategory('other');
    setFromName('');
    setFromRelationship('');
    setShowForm(false);
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          'justify-content': 'space-between',
          'align-items': 'center',
          'margin-bottom': '24px',
        }}
      >
        <div>
          <h3
            style={{
              'font-family': "'Playfair Display', Georgia, serif",
              'font-size': '20px',
              color: theme().colors.text,
              margin: '0 0 4px 0',
            }}
          >
            Accolades
          </h3>
          <p style={{ 'font-size': '14px', color: theme().colors.textMuted, margin: 0 }}>
            Showcase positive feedback and recognition
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            background: theme().colors.secondary,
            color: '#FFF',
            border: 'none',
            padding: '10px 16px',
            'border-radius': '8px',
            cursor: 'pointer',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            'font-weight': '600',
            'font-size': '14px',
            display: 'flex',
            'align-items': 'center',
            gap: '8px',
          }}
        >
          <PlusIcon />
          Add Accolade
        </button>
      </div>

      {/* Add Accolade Form */}
      <Show when={showForm()}>
        <div
          style={{
            background: theme().colors.surface,
            padding: '24px',
            'border-radius': '16px',
            border: `1px solid ${theme().colors.border}`,
            'margin-bottom': '24px',
          }}
        >
          <h4
            style={{
              'font-family': "'Playfair Display', Georgia, serif",
              'font-size': '18px',
              color: theme().colors.text,
              'margin-bottom': '16px',
            }}
          >
            Add New Accolade
          </h4>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  'font-size': '14px',
                  'font-weight': '500',
                  color: theme().colors.text,
                  'margin-bottom': '6px',
                }}
              >
                Title <span style={{ color: theme().colors.accent }}>*</span>
              </label>
              <input
                type="text"
                value={title()}
                onInput={(e) => setTitle(e.currentTarget.value)}
                placeholder="e.g., Outstanding Project Delivery"
                required
                style={inputStyle()}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  'font-size': '14px',
                  'font-weight': '500',
                  color: theme().colors.text,
                  'margin-bottom': '6px',
                }}
              >
                Description <span style={{ color: theme().colors.accent }}>*</span>
              </label>
              <textarea
                value={description()}
                onInput={(e) => setDescription(e.currentTarget.value)}
                placeholder="The feedback or recognition you received..."
                required
                rows={4}
                style={{ ...inputStyle(), resize: 'vertical' }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  'font-size': '14px',
                  'font-weight': '500',
                  color: theme().colors.text,
                  'margin-bottom': '6px',
                }}
              >
                Category
              </label>
              <select
                value={category()}
                onChange={(e) => setCategory(e.currentTarget.value as AccoladeEntry['category'])}
                style={inputStyle()}
              >
                <option value="technical">Technical</option>
                <option value="leadership">Leadership</option>
                <option value="collaboration">Collaboration</option>
                <option value="innovation">Innovation</option>
                <option value="impact">Impact</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '16px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    'font-size': '14px',
                    'font-weight': '500',
                    color: theme().colors.text,
                    'margin-bottom': '6px',
                  }}
                >
                  From (Name)
                </label>
                <input
                  type="text"
                  value={fromName()}
                  onInput={(e) => setFromName(e.currentTarget.value)}
                  placeholder="e.g., John Smith"
                  style={inputStyle()}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    'font-size': '14px',
                    'font-weight': '500',
                    color: theme().colors.text,
                    'margin-bottom': '6px',
                  }}
                >
                  Relationship
                </label>
                <input
                  type="text"
                  value={fromRelationship()}
                  onInput={(e) => setFromRelationship(e.currentTarget.value)}
                  placeholder="e.g., VP of Engineering"
                  style={inputStyle()}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', 'justify-content': 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  background: 'transparent',
                  color: theme().colors.textMuted,
                  border: `1px solid ${theme().colors.border}`,
                  padding: '10px 20px',
                  'border-radius': '8px',
                  cursor: 'pointer',
                  'font-family': "'Space Grotesk', system-ui, sans-serif",
                  'font-size': '14px',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  background: theme().colors.secondary,
                  color: '#FFF',
                  border: 'none',
                  padding: '10px 20px',
                  'border-radius': '8px',
                  cursor: 'pointer',
                  'font-family': "'Space Grotesk', system-ui, sans-serif",
                  'font-weight': '600',
                  'font-size': '14px',
                }}
              >
                Save Accolade
              </button>
            </div>
          </form>
        </div>
      </Show>

      {/* Accolades List */}
      <Show
        when={accolades().length > 0}
        fallback={
          <div
            style={{
              background: theme().colors.surface,
              padding: '48px 32px',
              'border-radius': '16px',
              'text-align': 'center',
              border: `2px dashed ${theme().colors.border}`,
            }}
          >
            <div style={{ 'font-size': '48px', 'margin-bottom': '16px' }}>
              <StarIcon />
            </div>
            <h4
              style={{
                'font-family': "'Playfair Display', Georgia, serif",
                'font-size': '18px',
                color: theme().colors.text,
                'margin-bottom': '8px',
              }}
            >
              No Accolades Yet
            </h4>
            <p style={{ color: theme().colors.textMuted }}>
              Save positive feedback and recognition to showcase your achievements
            </p>
          </div>
        }
      >
        <div
          style={{
            display: 'grid',
            'grid-template-columns': 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          <For each={accolades()}>
            {(accolade) => (
              <div
                style={{
                  background: theme().colors.surface,
                  padding: '20px',
                  'border-radius': '12px',
                  border: `1px solid ${theme().colors.border}`,
                  'border-left': `4px solid ${getCategoryColor(accolade.category)}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    'justify-content': 'space-between',
                    'align-items': 'start',
                    'margin-bottom': '12px',
                  }}
                >
                  <h4
                    style={{
                      'font-size': '16px',
                      'font-weight': '600',
                      color: theme().colors.text,
                      margin: 0,
                    }}
                  >
                    {accolade.title}
                  </h4>
                  <span
                    style={{
                      padding: '2px 8px',
                      'border-radius': '4px',
                      background: `${getCategoryColor(accolade.category)}20`,
                      color: getCategoryColor(accolade.category),
                      'font-size': '11px',
                      'font-weight': '600',
                      'text-transform': 'capitalize',
                    }}
                  >
                    {accolade.category}
                  </span>
                </div>

                <p
                  style={{
                    'font-size': '14px',
                    color: theme().colors.text,
                    margin: '0 0 12px 0',
                    'line-height': '1.5',
                  }}
                >
                  "{accolade.description}"
                </p>

                <div style={{ 'font-size': '13px', color: theme().colors.textMuted }}>
                  <Show when={accolade.fromName}>
                    <div>
                      {accolade.fromName}
                      {accolade.fromRelationship && ` - ${accolade.fromRelationship}`}
                    </div>
                  </Show>
                  <div>
                    {accolade.company} - {formatDate(accolade.date)}
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

// ============================================================================
// CYCLE DETAIL VIEW
// ============================================================================

const CycleDetailView: Component<{
  cycleId: string;
  onBack: () => void;
  theme: () => any;
}> = (props) => {
  const theme = () => props.theme();
  const [activeSection, setActiveSection] = createSignal<'self-review' | 'feedback'>('self-review');

  const cycle = createMemo(() =>
    prosperStore.state.reviewCycles.find((c) => c.id === props.cycleId)
  );

  return (
    <div>
      {/* Back button and header */}
      <div style={{ 'margin-bottom': '24px' }}>
        <button
          onClick={props.onBack}
          style={{
            background: 'transparent',
            border: 'none',
            color: theme().colors.secondary,
            cursor: 'pointer',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            'font-size': '14px',
            padding: '0',
            'margin-bottom': '16px',
            display: 'flex',
            'align-items': 'center',
            gap: '4px',
          }}
        >
          <ArrowLeftIcon width={16} height={16} /> Back to Review Cycles
        </button>

        <div
          style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'start' }}
        >
          <div>
            <h2
              style={{
                'font-family': "'Playfair Display', Georgia, serif",
                'font-size': '24px',
                color: theme().colors.text,
                margin: '0 0 4px 0',
              }}
            >
              {cycle()?.name}
            </h2>
            <p style={{ 'font-size': '14px', color: theme().colors.textMuted, margin: 0 }}>
              {formatDate(cycle()?.periodStart)} - {formatDate(cycle()?.periodEnd)}
            </p>
          </div>
          <StatusBadge status={cycle()?.status || 'draft'} theme={theme} />
        </div>
      </div>

      {/* Section Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          'margin-bottom': '24px',
          'border-bottom': `1px solid ${theme().colors.border}`,
          'padding-bottom': '16px',
        }}
      >
        <button
          onClick={() => setActiveSection('self-review')}
          style={{
            background:
              activeSection() === 'self-review' ? theme().colors.secondary : 'transparent',
            color: activeSection() === 'self-review' ? '#FFF' : theme().colors.textMuted,
            border: 'none',
            padding: '10px 20px',
            'border-radius': '8px',
            cursor: 'pointer',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            'font-weight': '500',
            'font-size': '14px',
          }}
        >
          Self-Review
        </button>
        <button
          onClick={() => setActiveSection('feedback')}
          style={{
            background: activeSection() === 'feedback' ? theme().colors.secondary : 'transparent',
            color: activeSection() === 'feedback' ? '#FFF' : theme().colors.textMuted,
            border: 'none',
            padding: '10px 20px',
            'border-radius': '8px',
            cursor: 'pointer',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            'font-weight': '500',
            'font-size': '14px',
          }}
        >
          External Feedback
        </button>
      </div>

      {/* Section Content */}
      <Show when={activeSection() === 'self-review'}>
        <SelfReviewSection cycleId={props.cycleId} theme={theme} />
      </Show>

      <Show when={activeSection() === 'feedback'}>
        <FeedbackCollectionSection cycleId={props.cycleId} theme={theme} />
      </Show>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ReviewsView: Component<ReviewsViewProps> = (props) => {
  const theme = () => props.currentTheme();
  const [activeTab, setActiveTab] = createSignal<ActiveTab>('cycles');
  const [showCreateForm, setShowCreateForm] = createSignal(false);
  const [selectedCycleId, setSelectedCycleId] = createSignal<string | null>(null);

  const tabStyle = (tab: ActiveTab) => ({
    background: activeTab() === tab ? theme().colors.secondary : 'transparent',
    color: activeTab() === tab ? '#FFF' : theme().colors.textMuted,
    border: 'none',
    padding: '10px 20px',
    'border-radius': '8px',
    cursor: 'pointer',
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    'font-weight': '500',
    'font-size': '14px',
    transition: 'all 0.2s',
  });

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ 'margin-bottom': '24px' }}>
        <h1
          style={{
            margin: '0 0 8px',
            'font-size': '32px',
            'font-family': "'Playfair Display', Georgia, serif",
            'font-weight': '700',
            color: theme().colors.text,
          }}
        >
          360 Reviews
        </h1>
        <p
          style={{
            margin: 0,
            'font-size': '15px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            color: theme().colors.textMuted,
          }}
        >
          Self-assessment and external feedback collection
        </p>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          'margin-bottom': '32px',
          'border-bottom': `1px solid ${theme().colors.border}`,
          'padding-bottom': '16px',
        }}
      >
        <button
          onClick={() => {
            setActiveTab('cycles');
            setSelectedCycleId(null);
          }}
          style={tabStyle('cycles')}
        >
          Review Cycles
        </button>
        <button onClick={() => setActiveTab('accolades')} style={tabStyle('accolades')}>
          Accolades
        </button>
      </div>

      {/* Content */}
      <Show when={activeTab() === 'cycles'}>
        <Show
          when={selectedCycleId()}
          fallback={
            <>
              <ReviewCyclesList
                onSelectCycle={(id) => setSelectedCycleId(id)}
                onCreateNew={() => setShowCreateForm(true)}
                theme={theme}
              />

              {/* Create Review Cycle Modal */}
              <Show when={showCreateForm()}>
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    'z-index': 100,
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    padding: '24px',
                  }}
                  onClick={() => setShowCreateForm(false)}
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: theme().colors.surface,
                      padding: '24px',
                      'border-radius': '16px',
                      border: `1px solid ${theme().colors.border}`,
                      'max-width': '500px',
                      width: '100%',
                    }}
                  >
                    <h3
                      style={{
                        'font-family': "'Playfair Display', Georgia, serif",
                        'font-size': '20px',
                        color: theme().colors.text,
                        'margin-bottom': '20px',
                      }}
                    >
                      Create New Review Cycle
                    </h3>
                    <CreateReviewCycleForm onClose={() => setShowCreateForm(false)} theme={theme} />
                  </div>
                </div>
              </Show>
            </>
          }
        >
          <CycleDetailView
            cycleId={selectedCycleId()!}
            onBack={() => setSelectedCycleId(null)}
            theme={theme}
          />
        </Show>
      </Show>

      <Show when={activeTab() === 'accolades'}>
        <AccoladesSection theme={theme} />
      </Show>
    </div>
  );
};

export default ReviewsView;
