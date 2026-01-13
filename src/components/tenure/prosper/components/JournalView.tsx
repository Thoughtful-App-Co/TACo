/**
 * Career Journal - Quarterly Check-ins & Accomplishment Tracking
 *
 * Features:
 * - Quarterly check-in wizard with consistent prompts
 * - Mood tracking (thriving → burnt-out scale)
 * - Accomplishment capture (projects, metrics, recognition)
 * - Historical timeline view
 * - Quick accomplishment log between check-ins
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, createMemo, For, Show } from 'solid-js';
import { prosperStore } from '../store';
import {
  QuarterlyCheckIn,
  MoodLevel,
  AccomplishmentEntry,
  AccomplishmentType,
  getCurrentQuarter,
  getQuarterDates,
} from '../../../../schemas/tenure';
import { NotePencilIcon } from 'solid-phosphor/bold';

// ============================================================================
// TYPES
// ============================================================================

interface JournalViewProps {
  currentTheme: () => any;
}

// ============================================================================
// LOCAL MOOD COLOR HELPER
// ============================================================================

const getMoodColor = (mood: MoodLevel): string => {
  switch (mood) {
    case 'thriving':
      return '#10B981'; // green
    case 'satisfied':
      return '#3B82F6'; // blue
    case 'neutral':
      return '#6B7280'; // gray
    case 'struggling':
      return '#F59E0B'; // orange
    case 'burnt-out':
      return '#EF4444'; // red
    default:
      return '#6B7280';
  }
};

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

const CheckIcon: Component = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="3"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ============================================================================
// QUARTERLY CHECK-IN WIZARD
// ============================================================================

const CheckInWizard: Component<{ onClose: () => void; theme: () => any }> = (props) => {
  const theme = () => props.theme();
  const [step, setStep] = createSignal(1);
  const totalSteps = 5;

  const currentQuarter = getCurrentQuarter();
  const quarterDates = getQuarterDates(currentQuarter.year, currentQuarter.quarterNumber);

  // Form state
  const [company, setCompany] = createSignal('');
  const [title, setTitle] = createSignal('');
  const [satisfactionScore, setSatisfactionScore] = createSignal(7);
  const [mood, setMood] = createSignal<MoodLevel>('satisfied');
  const [accomplishments, setAccomplishments] = createSignal('');
  const [challenges, setChallenges] = createSignal('');
  const [learningGoals, setLearningGoals] = createSignal('');
  const [privateNotes, setPrivateNotes] = createSignal('');

  const handleSubmit = () => {
    const checkIn: Omit<QuarterlyCheckIn, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      quarter: currentQuarter.quarter,
      year: currentQuarter.year,
      quarterNumber: currentQuarter.quarterNumber,
      periodStart: quarterDates.start,
      periodEnd: quarterDates.end,
      employerId: prosperStore.state.employmentState.currentEmployerId,
      company: company() || prosperStore.state.employmentState.currentCompany || 'N/A',
      title: title() || prosperStore.state.employmentState.currentTitle || 'N/A',
      accomplishments: {
        projectIds: [],
        metricIds: [],
        customAccomplishments: accomplishments()
          ? accomplishments().split('\n').filter(Boolean)
          : [],
      },
      reflection: {
        satisfactionScore: satisfactionScore(),
        mood: mood(),
        whatIsGoingWell: accomplishments(),
        challenges: challenges(),
        learningGoals: learningGoals(),
        privateNotes: privateNotes(),
      },
      skillsGained: [],
      certificationsEarned: [],
      trainingsCompleted: [],
      isDraft: false,
      completedAt: new Date(),
    };

    prosperStore.addCheckIn(checkIn);
    props.onClose();
  };

  // Style helpers
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

  const primaryButtonStyle = () => ({
    background: theme().colors.secondary,
    color: '#FFF',
    border: 'none',
    padding: '10px 20px',
    'border-radius': '8px',
    cursor: 'pointer',
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    'font-weight': '600',
    'font-size': '14px',
  });

  const secondaryButtonStyle = () => ({
    background: 'transparent',
    color: theme().colors.textMuted,
    border: `1px solid ${theme().colors.border}`,
    padding: '10px 20px',
    'border-radius': '8px',
    cursor: 'pointer',
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    'font-size': '14px',
  });

  const FormField: Component<{ label: string; required?: boolean; children: any }> = (
    fieldProps
  ) => (
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
        {fieldProps.label}
        <Show when={fieldProps.required}>
          <span style={{ color: theme().colors.accent }}>*</span>
        </Show>
      </label>
      {fieldProps.children}
    </div>
  );

  const WizardNavigation: Component<{
    onNext: () => void;
    onBack?: () => void;
    onCancel: () => void;
  }> = (navProps) => (
    <div
      style={{
        'margin-top': '24px',
        display: 'flex',
        gap: '12px',
        'justify-content': 'space-between',
      }}
    >
      <button type="button" onClick={navProps.onCancel} style={secondaryButtonStyle()}>
        Cancel
      </button>
      <div style={{ display: 'flex', gap: '12px' }}>
        <Show when={navProps.onBack}>
          <button type="button" onClick={navProps.onBack} style={secondaryButtonStyle()}>
            Back
          </button>
        </Show>
        <button type="button" onClick={navProps.onNext} style={primaryButtonStyle()}>
          Next
        </button>
      </div>
    </div>
  );

  return (
    <div
      style={{
        background: theme().colors.surface,
        padding: '32px',
        'border-radius': '16px',
        border: `1px solid ${theme().colors.border}`,
        'max-width': '700px',
        margin: '0 auto',
      }}
    >
      {/* Progress Bar */}
      <div style={{ 'margin-bottom': '32px' }}>
        <div
          style={{
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'center',
            'margin-bottom': '8px',
          }}
        >
          <h2
            style={{
              'font-family': "'Playfair Display', Georgia, serif",
              'font-size': '24px',
              color: theme().colors.text,
              margin: 0,
            }}
          >
            {currentQuarter.quarter} Check-In
          </h2>
          <span style={{ 'font-size': '14px', color: theme().colors.textMuted }}>
            Step {step()} of {totalSteps}
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '4px',
            background: theme().colors.background,
            'border-radius': '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${(step() / totalSteps) * 100}%`,
              height: '100%',
              background: theme().colors.secondary,
              transition: 'width 0.3s',
            }}
          />
        </div>
      </div>

      {/* Step 1: Employment Context */}
      <Show when={step() === 1}>
        <div>
          <h3
            style={{
              'font-family': "'Playfair Display', Georgia, serif",
              'font-size': '20px',
              color: theme().colors.text,
              'margin-bottom': '16px',
            }}
          >
            Current Employment
          </h3>
          <p style={{ color: theme().colors.textMuted, 'margin-bottom': '24px' }}>
            Tell us about your current role this quarter
          </p>

          <div style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
            <FormField label="Company">
              <input
                type="text"
                value={company()}
                onInput={(e) => setCompany(e.currentTarget.value)}
                placeholder={
                  prosperStore.state.employmentState.currentCompany || 'Enter company name'
                }
                style={inputStyle()}
              />
            </FormField>

            <FormField label="Job Title">
              <input
                type="text"
                value={title()}
                onInput={(e) => setTitle(e.currentTarget.value)}
                placeholder={
                  prosperStore.state.employmentState.currentTitle || 'Enter your job title'
                }
                style={inputStyle()}
              />
            </FormField>
          </div>

          <WizardNavigation onNext={() => setStep(2)} onCancel={props.onClose} />
        </div>
      </Show>

      {/* Step 2: Satisfaction & Mood */}
      <Show when={step() === 2}>
        <div>
          <h3
            style={{
              'font-family': "'Playfair Display', Georgia, serif",
              'font-size': '20px',
              color: theme().colors.text,
              'margin-bottom': '16px',
            }}
          >
            How are you feeling?
          </h3>
          <p style={{ color: theme().colors.textMuted, 'margin-bottom': '24px' }}>
            Rate your satisfaction and overall mood this quarter
          </p>

          <div style={{ display: 'flex', 'flex-direction': 'column', gap: '24px' }}>
            {/* Satisfaction Score */}
            <div>
              <label
                style={{
                  display: 'block',
                  'font-size': '14px',
                  'font-weight': '500',
                  color: theme().colors.text,
                  'margin-bottom': '12px',
                }}
              >
                Satisfaction Score:{' '}
                <span
                  style={{
                    color: theme().colors.primary,
                    'font-size': '20px',
                    'font-weight': 'bold',
                  }}
                >
                  {satisfactionScore()}
                </span>
                /10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={satisfactionScore()}
                onInput={(e) => setSatisfactionScore(parseInt(e.currentTarget.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  'border-radius': '3px',
                  background: `linear-gradient(to right, ${theme().colors.accent} 0%, ${theme().colors.secondary} 50%, ${theme().colors.primary} 100%)`,
                  appearance: 'none',
                }}
              />
              <div
                style={{ display: 'flex', 'justify-content': 'space-between', 'margin-top': '8px' }}
              >
                <span style={{ 'font-size': '12px', color: theme().colors.textMuted }}>
                  Not Satisfied
                </span>
                <span style={{ 'font-size': '12px', color: theme().colors.textMuted }}>
                  Very Satisfied
                </span>
              </div>
            </div>

            {/* Mood Selection */}
            <div>
              <label
                style={{
                  display: 'block',
                  'font-size': '14px',
                  'font-weight': '500',
                  color: theme().colors.text,
                  'margin-bottom': '12px',
                }}
              >
                Overall Mood
              </label>
              <div
                style={{ display: 'grid', 'grid-template-columns': 'repeat(5, 1fr)', gap: '8px' }}
              >
                <For
                  each={
                    ['thriving', 'satisfied', 'neutral', 'struggling', 'burnt-out'] as MoodLevel[]
                  }
                >
                  {(moodOption) => {
                    const isSelected = () => mood() === moodOption;
                    return (
                      <button
                        type="button"
                        onClick={() => setMood(moodOption)}
                        style={{
                          padding: '12px 8px',
                          'border-radius': '8px',
                          border: `2px solid ${isSelected() ? getMoodColor(moodOption) : theme().colors.border}`,
                          background: isSelected()
                            ? getMoodColor(moodOption)
                            : theme().colors.background,
                          color: isSelected() ? '#FFF' : theme().colors.text,
                          cursor: 'pointer',
                          'font-size': '12px',
                          'text-transform': 'capitalize',
                          transition: 'all 0.2s',
                        }}
                      >
                        {moodOption.replace('-', ' ')}
                      </button>
                    );
                  }}
                </For>
              </div>
            </div>
          </div>

          <WizardNavigation
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
            onCancel={props.onClose}
          />
        </div>
      </Show>

      {/* Step 3: Accomplishments */}
      <Show when={step() === 3}>
        <div>
          <h3
            style={{
              'font-family': "'Playfair Display', Georgia, serif",
              'font-size': '20px',
              color: theme().colors.text,
              'margin-bottom': '16px',
            }}
          >
            What went well?
          </h3>
          <p style={{ color: theme().colors.textMuted, 'margin-bottom': '24px' }}>
            List your key accomplishments this quarter (one per line)
          </p>

          <FormField label="Accomplishments">
            <textarea
              value={accomplishments()}
              onInput={(e) => setAccomplishments(e.currentTarget.value)}
              placeholder={`Example:\n- Led the migration to new infrastructure\n- Shipped feature X ahead of schedule\n- Received recognition from CEO`}
              rows={8}
              style={{ ...inputStyle(), resize: 'vertical' }}
            />
          </FormField>

          <WizardNavigation
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
            onCancel={props.onClose}
          />
        </div>
      </Show>

      {/* Step 4: Challenges & Growth */}
      <Show when={step() === 4}>
        <div>
          <h3
            style={{
              'font-family': "'Playfair Display', Georgia, serif",
              'font-size': '20px',
              color: theme().colors.text,
              'margin-bottom': '16px',
            }}
          >
            Challenges & Learning
          </h3>
          <p style={{ color: theme().colors.textMuted, 'margin-bottom': '24px' }}>
            Reflect on difficulties and areas for growth
          </p>

          <div style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
            <FormField label="What challenges did you face?">
              <textarea
                value={challenges()}
                onInput={(e) => setChallenges(e.currentTarget.value)}
                placeholder="Describe obstacles, setbacks, or difficulties..."
                rows={4}
                style={{ ...inputStyle(), resize: 'vertical' }}
              />
            </FormField>

            <FormField label="What are your learning goals for next quarter?">
              <textarea
                value={learningGoals()}
                onInput={(e) => setLearningGoals(e.currentTarget.value)}
                placeholder="Skills to develop, knowledge to gain, areas to improve..."
                rows={4}
                style={{ ...inputStyle(), resize: 'vertical' }}
              />
            </FormField>
          </div>

          <WizardNavigation
            onNext={() => setStep(5)}
            onBack={() => setStep(3)}
            onCancel={props.onClose}
          />
        </div>
      </Show>

      {/* Step 5: Private Notes */}
      <Show when={step() === 5}>
        <div>
          <h3
            style={{
              'font-family': "'Playfair Display', Georgia, serif",
              'font-size': '20px',
              color: theme().colors.text,
              'margin-bottom': '16px',
            }}
          >
            Private Notes
          </h3>
          <p style={{ color: theme().colors.textMuted, 'margin-bottom': '24px' }}>
            Anything else you want to remember? (This is never exported)
          </p>

          <FormField label="Private Notes (optional)">
            <textarea
              value={privateNotes()}
              onInput={(e) => setPrivateNotes(e.currentTarget.value)}
              placeholder="Personal reflections, sensitive information, or anything you want to keep private..."
              rows={6}
              style={{ ...inputStyle(), resize: 'vertical' }}
            />
          </FormField>

          <div
            style={{
              'margin-top': '24px',
              display: 'flex',
              gap: '12px',
              'justify-content': 'flex-end',
            }}
          >
            <button type="button" onClick={() => setStep(4)} style={secondaryButtonStyle()}>
              Back
            </button>
            <button type="button" onClick={handleSubmit} style={primaryButtonStyle()}>
              Complete Check-In
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
};

// ============================================================================
// QUICK ACCOMPLISHMENT LOG
// ============================================================================

const QuickAccomplishmentForm: Component<{ onClose: () => void; theme: () => any }> = (props) => {
  const theme = () => props.theme();
  const [title, setTitle] = createSignal('');
  const [description, setDescription] = createSignal('');
  const [type, setType] = createSignal<AccomplishmentType>('milestone');
  const [tags, setTags] = createSignal('');

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

  const primaryButtonStyle = () => ({
    background: theme().colors.secondary,
    color: '#FFF',
    border: 'none',
    padding: '10px 20px',
    'border-radius': '8px',
    cursor: 'pointer',
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    'font-weight': '600',
    'font-size': '14px',
  });

  const secondaryButtonStyle = () => ({
    background: 'transparent',
    color: theme().colors.textMuted,
    border: `1px solid ${theme().colors.border}`,
    padding: '10px 20px',
    'border-radius': '8px',
    cursor: 'pointer',
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    'font-size': '14px',
  });

  const FormField: Component<{ label: string; required?: boolean; children: any }> = (
    fieldProps
  ) => (
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
        {fieldProps.label}
        <Show when={fieldProps.required}>
          <span style={{ color: theme().colors.accent }}>*</span>
        </Show>
      </label>
      {fieldProps.children}
    </div>
  );

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    const accomplishment: Omit<AccomplishmentEntry, 'id' | 'userId' | 'createdAt' | 'quarter'> = {
      title: title(),
      description: description() || undefined,
      type: type(),
      date: new Date(),
      employerId: prosperStore.state.employmentState.currentEmployerId,
      tags: tags()
        ? tags()
            .split(',')
            .map((t) => t.trim())
        : [],
      canShowPublicly: true,
      addedToResume: false,
    };

    prosperStore.addAccomplishment(accomplishment);
    props.onClose();
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}
    >
      <FormField label="Title" required>
        <input
          type="text"
          value={title()}
          onInput={(e) => setTitle(e.currentTarget.value)}
          placeholder="Brief description of accomplishment"
          required
          style={inputStyle()}
        />
      </FormField>

      <FormField label="Type">
        <select
          value={type()}
          onChange={(e) => setType(e.currentTarget.value as AccomplishmentType)}
          style={inputStyle()}
        >
          <option value="project">Project</option>
          <option value="metric">Metric/KPI</option>
          <option value="recognition">Recognition</option>
          <option value="learning">Learning</option>
          <option value="milestone">Milestone</option>
          <option value="other">Other</option>
        </select>
      </FormField>

      <FormField label="Description">
        <textarea
          value={description()}
          onInput={(e) => setDescription(e.currentTarget.value)}
          placeholder="Additional details..."
          rows={3}
          style={{ ...inputStyle(), resize: 'vertical' }}
        />
      </FormField>

      <FormField label="Tags (comma-separated)">
        <input
          type="text"
          value={tags()}
          onInput={(e) => setTags(e.currentTarget.value)}
          placeholder="e.g., frontend, leadership, optimization"
          style={inputStyle()}
        />
      </FormField>

      <div style={{ display: 'flex', gap: '12px', 'justify-content': 'flex-end' }}>
        <button type="button" onClick={props.onClose} style={secondaryButtonStyle()}>
          Cancel
        </button>
        <button type="submit" style={primaryButtonStyle()}>
          Add Accomplishment
        </button>
      </div>
    </form>
  );
};

// ============================================================================
// HISTORICAL TIMELINE
// ============================================================================

const CheckInTimeline: Component<{ theme: () => any }> = (props) => {
  const theme = () => props.theme();
  const checkIns = createMemo(() =>
    [...prosperStore.state.checkIns].sort(
      (a, b) => b.year - a.year || b.quarterNumber - a.quarterNumber
    )
  );

  return (
    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
      <Show when={checkIns().length === 0}>
        <div
          style={{
            background: theme().colors.surface,
            padding: '48px 32px',
            'border-radius': '16px',
            'text-align': 'center',
            border: `2px dashed ${theme().colors.border}`,
          }}
        >
          <div style={{ display: 'flex', 'justify-content': 'center', 'margin-bottom': '16px' }}>
            <NotePencilIcon width={48} height={48} color={theme().colors.textMuted} />
          </div>
          <h3
            style={{
              'font-family': "'Playfair Display', Georgia, serif",
              'font-size': '20px',
              color: theme().colors.text,
              'margin-bottom': '8px',
            }}
          >
            No Check-Ins Yet
          </h3>
          <p style={{ color: theme().colors.textMuted }}>
            Complete your first quarterly check-in to start tracking your journey
          </p>
        </div>
      </Show>

      <For each={checkIns()}>
        {(checkIn) => (
          <div
            style={{
              background: theme().colors.surface,
              padding: '20px',
              'border-radius': '12px',
              border: `1px solid ${theme().colors.border}`,
              'border-left': `4px solid ${getMoodColor(checkIn.reflection.mood)}`,
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
                    margin: 0,
                  }}
                >
                  {checkIn.quarter}
                </h4>
                <p
                  style={{
                    'font-size': '14px',
                    color: theme().colors.textMuted,
                    margin: '4px 0 0 0',
                  }}
                >
                  {checkIn.company} • {checkIn.title}
                </p>
              </div>
              <div
                style={{
                  padding: '4px 12px',
                  'border-radius': '8px',
                  background: getMoodColor(checkIn.reflection.mood) + '20',
                  color: getMoodColor(checkIn.reflection.mood),
                  'font-size': '12px',
                  'font-weight': '600',
                  'text-transform': 'capitalize',
                }}
              >
                {checkIn.reflection.mood.replace('-', ' ')}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', 'margin-bottom': '12px' }}>
              <div>
                <span style={{ 'font-size': '12px', color: theme().colors.textMuted }}>
                  Satisfaction
                </span>
                <div
                  style={{
                    'font-size': '24px',
                    'font-weight': 'bold',
                    color: theme().colors.primary,
                  }}
                >
                  {checkIn.reflection.satisfactionScore}/10
                </div>
              </div>
              <div>
                <span style={{ 'font-size': '12px', color: theme().colors.textMuted }}>
                  Accomplishments
                </span>
                <div
                  style={{
                    'font-size': '24px',
                    'font-weight': 'bold',
                    color: theme().colors.secondary,
                  }}
                >
                  {checkIn.accomplishments.customAccomplishments.length}
                </div>
              </div>
            </div>

            <Show when={checkIn.accomplishments.customAccomplishments.length > 0}>
              <div
                style={{
                  'margin-top': '12px',
                  'padding-top': '12px',
                  'border-top': `1px solid ${theme().colors.border}`,
                }}
              >
                <ul
                  style={{
                    margin: 0,
                    padding: '0 0 0 20px',
                    color: theme().colors.textMuted,
                    'font-size': '14px',
                  }}
                >
                  <For each={checkIn.accomplishments.customAccomplishments.slice(0, 3)}>
                    {(acc) => <li style={{ 'margin-bottom': '4px' }}>{acc}</li>}
                  </For>
                </ul>
                <Show when={checkIn.accomplishments.customAccomplishments.length > 3}>
                  <p
                    style={{
                      'font-size': '12px',
                      color: theme().colors.textMuted,
                      'margin-top': '8px',
                    }}
                  >
                    +{checkIn.accomplishments.customAccomplishments.length - 3} more
                  </p>
                </Show>
              </div>
            </Show>
          </div>
        )}
      </For>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const JournalView: Component<JournalViewProps> = (props) => {
  const theme = () => props.currentTheme();
  const [showCheckInWizard, setShowCheckInWizard] = createSignal(false);
  const [showQuickLog, setShowQuickLog] = createSignal(false);

  const currentQuarter = getCurrentQuarter();
  const hasCheckInForCurrentQuarter = createMemo(() =>
    prosperStore.state.checkIns.some(
      (ci) => ci.quarter === currentQuarter.quarter && ci.year === currentQuarter.year
    )
  );

  const primaryButtonStyle = () => ({
    background: theme().colors.secondary,
    color: '#FFF',
    border: 'none',
    padding: '10px 20px',
    'border-radius': '8px',
    cursor: 'pointer',
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    'font-weight': '600',
    'font-size': '14px',
  });

  const secondaryButtonStyle = () => ({
    background: 'transparent',
    color: theme().colors.textMuted,
    border: `1px solid ${theme().colors.border}`,
    padding: '10px 20px',
    'border-radius': '8px',
    cursor: 'pointer',
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    'font-size': '14px',
  });

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ 'margin-bottom': '32px' }}>
        <h1
          style={{
            margin: '0 0 8px',
            'font-size': '32px',
            'font-family': "'Playfair Display', Georgia, serif",
            'font-weight': '700',
            color: theme().colors.text,
          }}
        >
          Career Journal
        </h1>
        <p
          style={{
            margin: 0,
            'font-size': '15px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            color: theme().colors.textMuted,
            'margin-bottom': '24px',
          }}
        >
          Track your quarterly progress and capture accomplishments as they happen
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', 'flex-wrap': 'wrap' }}>
          <button
            onClick={() => setShowCheckInWizard(true)}
            disabled={hasCheckInForCurrentQuarter()}
            style={{
              ...primaryButtonStyle(),
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
              opacity: hasCheckInForCurrentQuarter() ? 0.5 : 1,
              cursor: hasCheckInForCurrentQuarter() ? 'not-allowed' : 'pointer',
            }}
          >
            <Show when={hasCheckInForCurrentQuarter()} fallback={<PlusIcon />}>
              <CheckIcon />
            </Show>
            {hasCheckInForCurrentQuarter()
              ? `${currentQuarter.quarter} Complete`
              : `Start ${currentQuarter.quarter} Check-In`}
          </button>

          <button
            onClick={() => setShowQuickLog(true)}
            style={{
              ...secondaryButtonStyle(),
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
            }}
          >
            <PlusIcon />
            Quick Log Accomplishment
          </button>
        </div>
      </div>

      {/* Modals */}
      <Show when={showCheckInWizard()}>
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
            'overflow-y': 'auto',
          }}
          onClick={() => setShowCheckInWizard(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <CheckInWizard onClose={() => setShowCheckInWizard(false)} theme={theme} />
          </div>
        </div>
      </Show>

      <Show when={showQuickLog()}>
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
          onClick={() => setShowQuickLog(false)}
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
                'margin-bottom': '16px',
              }}
            >
              Quick Log Accomplishment
            </h3>
            <QuickAccomplishmentForm onClose={() => setShowQuickLog(false)} theme={theme} />
          </div>
        </div>
      </Show>

      {/* Timeline */}
      <div>
        <h2
          style={{
            'font-family': "'Playfair Display', Georgia, serif",
            'font-size': '24px',
            color: theme().colors.text,
            'margin-bottom': '16px',
          }}
        >
          Your Journey
        </h2>
        <CheckInTimeline theme={theme} />
      </div>
    </div>
  );
};
