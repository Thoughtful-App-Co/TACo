/**
 * ExperienceEditor - Modal for adding/editing work experiences
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, createEffect, Show } from 'solid-js';
import { Modal, ThemeType } from './Modal';
import { WorkExperience } from '../../../../schemas/pipeline.schema';

interface ExperienceEditorProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: () => ThemeType;
  experience?: WorkExperience; // If provided, edit mode. If undefined, add mode.
  onSave: (experience: Omit<WorkExperience, 'id'>) => void;
}

/**
 * Format a Date object to YYYY-MM-DD string for input[type="date"]
 */
const formatDateForInput = (date: Date | undefined): string => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Parse a YYYY-MM-DD string back to a Date object
 */
const parseDateFromInput = (value: string): Date | undefined => {
  if (!value) return undefined;
  return new Date(value);
};

export const ExperienceEditor: Component<ExperienceEditorProps> = (props) => {
  const theme = () => props.currentTheme();

  // Form state
  const [company, setCompany] = createSignal('');
  const [title, setTitle] = createSignal('');
  const [location, setLocation] = createSignal('');
  const [locationType, setLocationType] = createSignal<'remote' | 'hybrid' | 'onsite' | ''>('');
  const [startDate, setStartDate] = createSignal('');
  const [endDate, setEndDate] = createSignal('');
  const [isCurrentJob, setIsCurrentJob] = createSignal(false);
  const [description, setDescription] = createSignal('');
  const [skillsInput, setSkillsInput] = createSignal('');
  const [achievementsInput, setAchievementsInput] = createSignal('');
  const [bulletPointsInput, setBulletPointsInput] = createSignal('');

  // Validation state
  const [errors, setErrors] = createSignal<Record<string, string>>({});

  // Reset form when modal opens/closes or experience changes
  createEffect(() => {
    if (props.isOpen) {
      if (props.experience) {
        // Edit mode - populate fields
        setCompany(props.experience.company || '');
        setTitle(props.experience.title || '');
        setLocation(props.experience.location || '');
        setLocationType(props.experience.locationType || '');
        setStartDate(formatDateForInput(props.experience.startDate));
        setEndDate(formatDateForInput(props.experience.endDate));
        setIsCurrentJob(!props.experience.endDate);
        setDescription(props.experience.description || '');
        setSkillsInput(props.experience.skills?.join(', ') || '');
        setAchievementsInput(props.experience.achievements?.join('\n') || '');
        setBulletPointsInput(props.experience.bulletPoints?.join('\n') || '');
      } else {
        // Add mode - clear fields
        resetForm();
      }
      setErrors({});
    }
  });

  const resetForm = () => {
    setCompany('');
    setTitle('');
    setLocation('');
    setLocationType('');
    setStartDate('');
    setEndDate('');
    setIsCurrentJob(false);
    setDescription('');
    setSkillsInput('');
    setAchievementsInput('');
    setBulletPointsInput('');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!company().trim()) {
      newErrors.company = 'Company name is required';
    }
    if (!title().trim()) {
      newErrors.title = 'Job title is required';
    }
    if (!startDate()) {
      newErrors.startDate = 'Start date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    // Parse skills from comma-separated string
    const skills = skillsInput()
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Parse achievements from newline-separated string
    const achievements = achievementsInput()
      .split('\n')
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    // Parse bullet points from newline-separated string
    const bulletPoints = bulletPointsInput()
      .split('\n')
      .map((b) => b.trim().replace(/^[•\-\*]\s*/, '')) // Strip any leading bullet chars
      .filter((b) => b.length > 0);

    const experience: Omit<WorkExperience, 'id'> = {
      company: company().trim(),
      title: title().trim(),
      startDate: parseDateFromInput(startDate())!,
      endDate: isCurrentJob() ? undefined : parseDateFromInput(endDate()),
      location: location().trim() || undefined,
      locationType: locationType() || undefined,
      description: description().trim(),
      skills,
      achievements,
      bulletPoints,
    };

    props.onSave(experience);
    props.onClose();
  };

  const handleCancel = () => {
    props.onClose();
  };

  // Styles matching AddJobModal patterns
  const inputStyle = (): Record<string, string> => ({
    width: '100%',
    padding: '12px 16px',
    background: theme().colors.background,
    border: `1px solid ${theme().colors.border}`,
    'border-radius': '10px',
    color: theme().colors.text,
    'font-size': '14px',
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    outline: 'none',
    transition: 'border-color 0.15s ease',
    'box-sizing': 'border-box',
  });

  const labelStyle = (): Record<string, string> => ({
    display: 'block',
    'margin-bottom': '6px',
    'font-size': '13px',
    'font-weight': '500',
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    color: theme().colors.textMuted,
  });

  const errorStyle = (): Record<string, string> => ({
    margin: '4px 0 0',
    'font-size': '12px',
    color: '#EF4444',
    'font-family': "'Space Grotesk', system-ui, sans-serif",
  });

  const buttonPrimary = (): Record<string, string> => ({
    padding: '12px 24px',
    background: theme().colors.primary,
    border: 'none',
    'border-radius': '10px',
    color: theme().colors.background,
    'font-size': '14px',
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    'font-weight': '600',
    cursor: 'pointer',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    gap: '8px',
    transition: 'all 0.15s ease',
  });

  const buttonSecondary = (): Record<string, string> => ({
    padding: '12px 24px',
    background: 'transparent',
    border: `1px solid ${theme().colors.border}`,
    'border-radius': '10px',
    color: theme().colors.text,
    'font-size': '14px',
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    'font-weight': '500',
    cursor: 'pointer',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    gap: '8px',
    transition: 'all 0.15s ease',
  });

  const modalTitle = () => (props.experience ? 'Edit Experience' : 'Add Experience');

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={modalTitle()}
      currentTheme={props.currentTheme}
      maxWidth="600px"
    >
      <div style={{ display: 'grid', gap: '16px' }}>
        {/* Company & Title - Two column grid */}
        <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle()}>Company Name *</label>
            <input
              type="text"
              value={company()}
              onInput={(e) => setCompany(e.currentTarget.value)}
              placeholder="e.g., Acme Corp"
              style={inputStyle()}
            />
            <Show when={errors().company}>
              <p style={errorStyle()}>{errors().company}</p>
            </Show>
          </div>
          <div>
            <label style={labelStyle()}>Job Title *</label>
            <input
              type="text"
              value={title()}
              onInput={(e) => setTitle(e.currentTarget.value)}
              placeholder="e.g., Senior Software Engineer"
              style={inputStyle()}
            />
            <Show when={errors().title}>
              <p style={errorStyle()}>{errors().title}</p>
            </Show>
          </div>
        </div>

        {/* Location & Type - Two column grid */}
        <div style={{ display: 'grid', 'grid-template-columns': '2fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle()}>Location</label>
            <input
              type="text"
              value={location()}
              onInput={(e) => setLocation(e.currentTarget.value)}
              placeholder="e.g., San Francisco, CA"
              style={inputStyle()}
            />
          </div>
          <div>
            <label style={labelStyle()}>Type</label>
            <select
              value={locationType()}
              onChange={(e) =>
                setLocationType(e.currentTarget.value as 'remote' | 'hybrid' | 'onsite' | '')
              }
              style={{
                ...inputStyle(),
                cursor: 'pointer',
              }}
            >
              <option value="">Not specified</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
          </div>
        </div>

        {/* Start & End Date - Two column grid */}
        <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle()}>Start Date *</label>
            <input
              type="date"
              value={startDate()}
              onInput={(e) => setStartDate(e.currentTarget.value)}
              style={inputStyle()}
            />
            <Show when={errors().startDate}>
              <p style={errorStyle()}>{errors().startDate}</p>
            </Show>
          </div>
          <div>
            <label style={labelStyle()}>End Date</label>
            <input
              type="date"
              value={endDate()}
              onInput={(e) => setEndDate(e.currentTarget.value)}
              disabled={isCurrentJob()}
              style={{
                ...inputStyle(),
                opacity: isCurrentJob() ? '0.5' : '1',
                cursor: isCurrentJob() ? 'not-allowed' : 'text',
              }}
            />
          </div>
        </div>

        {/* Currently working here checkbox */}
        <div>
          <label
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
              cursor: 'pointer',
              'font-size': '13px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              color: theme().colors.text,
            }}
          >
            <input
              type="checkbox"
              checked={isCurrentJob()}
              onChange={(e) => {
                setIsCurrentJob(e.currentTarget.checked);
                if (e.currentTarget.checked) {
                  setEndDate('');
                }
              }}
              style={{ cursor: 'pointer' }}
            />
            Currently working here
          </label>
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle()}>Description</label>
          <textarea
            value={description()}
            onInput={(e) => setDescription(e.currentTarget.value)}
            placeholder="Describe your role and responsibilities..."
            rows={4}
            style={{
              ...inputStyle(),
              resize: 'vertical',
              'line-height': '1.5',
            }}
          />
        </div>

        {/* Skills - Comma separated */}
        <div>
          <label style={labelStyle()}>Skills</label>
          <input
            type="text"
            value={skillsInput()}
            onInput={(e) => setSkillsInput(e.currentTarget.value)}
            placeholder="e.g., React, TypeScript, Node.js (comma-separated)"
            style={inputStyle()}
          />
          <p
            style={{
              margin: '4px 0 0',
              'font-size': '11px',
              color: theme().colors.textMuted,
              'font-family': "'Space Grotesk', system-ui, sans-serif",
            }}
          >
            Separate skills with commas
          </p>
        </div>

        {/* Bullet Points */}
        <div>
          <label style={labelStyle()}>Bullet Points</label>
          <textarea
            value={bulletPointsInput()}
            onInput={(e) => setBulletPointsInput(e.currentTarget.value)}
            placeholder="Enter each bullet point on a new line..."
            rows={4}
            style={{
              ...inputStyle(),
              resize: 'vertical',
              'line-height': '1.5',
            }}
          />
          <p
            style={{
              margin: '4px 0 0',
              'font-size': '11px',
              color: theme().colors.textMuted,
              'font-family': "'Space Grotesk', system-ui, sans-serif",
            }}
          >
            Key responsibilities and accomplishments (one per line)
          </p>
        </div>

        {/* Achievements - Each line is an achievement */}
        <div>
          <label style={labelStyle()}>Achievements</label>
          <textarea
            value={achievementsInput()}
            onInput={(e) => setAchievementsInput(e.currentTarget.value)}
            placeholder="Enter each achievement on a new line..."
            rows={4}
            style={{
              ...inputStyle(),
              resize: 'vertical',
              'line-height': '1.5',
            }}
          />
          <p
            style={{
              margin: '4px 0 0',
              'font-size': '11px',
              color: theme().colors.textMuted,
              'font-family': "'Space Grotesk', system-ui, sans-serif",
            }}
          >
            Each line becomes a separate achievement
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', 'margin-top': '8px' }}>
          <button onClick={handleCancel} style={{ ...buttonSecondary(), flex: 1 }}>
            Cancel
          </button>
          <button onClick={handleSave} style={{ ...buttonPrimary(), flex: 2 }}>
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExperienceEditor;
