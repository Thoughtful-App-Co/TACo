/**
 * EducationEditor - Modal component for adding/editing education entries
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, createEffect, JSX, Show } from 'solid-js';
import { Modal, ThemeType } from './Modal';
import type { Education } from '../../../../schemas/pipeline.schema';

// ============================================================================
// TYPES
// ============================================================================

export interface EducationEditorProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: () => ThemeType;
  education?: Education; // If provided, edit mode. If undefined, add mode.
  onSave: (education: Omit<Education, 'id'>) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format a Date to YYYY-MM-DD for input[type="date"]
 */
function formatDateForInput(date: Date | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string to a Date
 */
function parseDateFromInput(dateString: string): Date | undefined {
  if (!dateString) return undefined;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? undefined : date;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const EducationEditor: Component<EducationEditorProps> = (props) => {
  const theme = () => props.currentTheme();

  // Form state
  const [institution, setInstitution] = createSignal('');
  const [degree, setDegree] = createSignal('');
  const [field, setField] = createSignal('');
  const [graduationDate, setGraduationDate] = createSignal('');
  const [inProgress, setInProgress] = createSignal(false);
  const [gpa, setGpa] = createSignal('');

  // Validation state
  const [errors, setErrors] = createSignal<Record<string, string>>({});

  // Reset form when modal opens or education prop changes
  createEffect(() => {
    if (props.isOpen) {
      if (props.education) {
        // Edit mode - pre-populate fields
        setInstitution(props.education.institution || '');
        setDegree(props.education.degree || '');
        setField(props.education.field || '');
        setGraduationDate(formatDateForInput(props.education.graduationDate));
        setInProgress(!props.education.graduationDate);
        setGpa(props.education.gpa !== undefined ? props.education.gpa.toString() : '');
      } else {
        // Add mode - reset fields
        setInstitution('');
        setDegree('');
        setField('');
        setGraduationDate('');
        setInProgress(false);
        setGpa('');
      }
      setErrors({});
    }
  });

  // Validate required fields
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!institution().trim()) {
      newErrors.institution = 'Institution name is required';
    }
    if (!degree().trim()) {
      newErrors.degree = 'Degree is required';
    }
    if (!field().trim()) {
      newErrors.field = 'Field of study is required';
    }

    // Validate GPA if provided
    const gpaValue = gpa().trim();
    if (gpaValue) {
      const gpaNum = parseFloat(gpaValue);
      if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4.0) {
        newErrors.gpa = 'GPA must be between 0 and 4.0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (!validate()) return;

    const educationData: Omit<Education, 'id'> = {
      institution: institution().trim(),
      degree: degree().trim(),
      field: field().trim(),
      graduationDate: inProgress() ? undefined : parseDateFromInput(graduationDate()),
      gpa: gpa().trim() ? parseFloat(gpa()) : undefined,
    };

    props.onSave(educationData);
    props.onClose();
  };

  // Style functions matching AddJobModal patterns
  const inputStyle = (): JSX.CSSProperties => ({
    width: '100%',
    padding: '12px 16px',
    background: theme().colors.background,
    border: `1px solid ${theme().colors.border}`,
    'border-radius': '10px',
    color: theme().colors.text,
    'font-size': '14px',
    'font-family': theme().fonts.body,
    outline: 'none',
    transition: 'border-color 0.15s ease',
    'box-sizing': 'border-box',
  });

  const inputErrorStyle = (): JSX.CSSProperties => ({
    ...inputStyle(),
    'border-color': '#EF4444',
  });

  const labelStyle = (): JSX.CSSProperties => ({
    display: 'block',
    'margin-bottom': '6px',
    'font-size': '13px',
    'font-weight': '500',
    'font-family': theme().fonts.body,
    color: theme().colors.textMuted,
  });

  const errorTextStyle = (): JSX.CSSProperties => ({
    margin: '4px 0 0',
    'font-size': '12px',
    color: '#EF4444',
    'font-family': theme().fonts.body,
  });

  const buttonPrimaryStyle = (): JSX.CSSProperties => ({
    padding: '12px 24px',
    background: theme().colors.primary,
    border: 'none',
    'border-radius': '10px',
    color: '#FFFFFF',
    'font-size': '14px',
    'font-family': theme().fonts.body,
    'font-weight': '600',
    cursor: 'pointer',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    gap: '8px',
    transition: 'all 0.15s ease',
    flex: '2',
  });

  const buttonSecondaryStyle = (): JSX.CSSProperties => ({
    padding: '12px 24px',
    background: 'transparent',
    border: `1px solid ${theme().colors.border}`,
    'border-radius': '10px',
    color: theme().colors.text,
    'font-size': '14px',
    'font-family': theme().fonts.body,
    'font-weight': '500',
    cursor: 'pointer',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    gap: '8px',
    transition: 'all 0.15s ease',
    flex: '1',
  });

  const checkboxContainerStyle = (): JSX.CSSProperties => ({
    display: 'flex',
    'align-items': 'center',
    gap: '8px',
    'margin-top': '8px',
  });

  const checkboxLabelStyle = (): JSX.CSSProperties => ({
    'font-size': '13px',
    'font-family': theme().fonts.body,
    color: theme().colors.text,
    cursor: 'pointer',
  });

  const isValid = () => institution().trim() && degree().trim() && field().trim();
  const modalTitle = () => (props.education ? 'Edit Education' : 'Add Education');

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={modalTitle()}
      currentTheme={props.currentTheme}
      maxWidth="500px"
    >
      <div style={{ display: 'grid', gap: '16px' }}>
        {/* Institution Name */}
        <div>
          <label style={labelStyle()}>Institution Name *</label>
          <input
            type="text"
            value={institution()}
            onInput={(e) => {
              setInstitution(e.currentTarget.value);
              if (errors().institution) {
                setErrors((prev) => ({ ...prev, institution: '' }));
              }
            }}
            placeholder="e.g., Stanford University"
            style={errors().institution ? inputErrorStyle() : inputStyle()}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = theme().colors.primary;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = errors().institution
                ? '#EF4444'
                : theme().colors.border;
            }}
          />
          <Show when={errors().institution}>
            <p style={errorTextStyle()}>{errors().institution}</p>
          </Show>
        </div>

        {/* Degree */}
        <div>
          <label style={labelStyle()}>Degree *</label>
          <input
            type="text"
            value={degree()}
            onInput={(e) => {
              setDegree(e.currentTarget.value);
              if (errors().degree) {
                setErrors((prev) => ({ ...prev, degree: '' }));
              }
            }}
            placeholder="e.g., Bachelor of Science"
            style={errors().degree ? inputErrorStyle() : inputStyle()}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = theme().colors.primary;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = errors().degree
                ? '#EF4444'
                : theme().colors.border;
            }}
          />
          <Show when={errors().degree}>
            <p style={errorTextStyle()}>{errors().degree}</p>
          </Show>
        </div>

        {/* Field of Study */}
        <div>
          <label style={labelStyle()}>Field of Study *</label>
          <input
            type="text"
            value={field()}
            onInput={(e) => {
              setField(e.currentTarget.value);
              if (errors().field) {
                setErrors((prev) => ({ ...prev, field: '' }));
              }
            }}
            placeholder="e.g., Computer Science"
            style={errors().field ? inputErrorStyle() : inputStyle()}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = theme().colors.primary;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = errors().field
                ? '#EF4444'
                : theme().colors.border;
            }}
          />
          <Show when={errors().field}>
            <p style={errorTextStyle()}>{errors().field}</p>
          </Show>
        </div>

        {/* Graduation Date and GPA - Side by Side */}
        <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '16px' }}>
          {/* Graduation Date */}
          <div>
            <label style={labelStyle()}>Graduation Date</label>
            <input
              type="date"
              value={graduationDate()}
              onInput={(e) => setGraduationDate(e.currentTarget.value)}
              disabled={inProgress()}
              style={{
                ...inputStyle(),
                opacity: inProgress() ? 0.5 : 1,
                cursor: inProgress() ? 'not-allowed' : 'pointer',
              }}
              onFocus={(e) => {
                if (!inProgress()) {
                  e.currentTarget.style.borderColor = theme().colors.primary;
                }
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = theme().colors.border;
              }}
            />
            <div style={checkboxContainerStyle()}>
              <input
                type="checkbox"
                id="in-progress"
                checked={inProgress()}
                onChange={(e) => {
                  setInProgress(e.currentTarget.checked);
                  if (e.currentTarget.checked) {
                    setGraduationDate('');
                  }
                }}
                style={{ cursor: 'pointer' }}
              />
              <label for="in-progress" style={checkboxLabelStyle()}>
                In Progress
              </label>
            </div>
          </div>

          {/* GPA */}
          <div>
            <label style={labelStyle()}>GPA</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="4.0"
              value={gpa()}
              onInput={(e) => {
                setGpa(e.currentTarget.value);
                if (errors().gpa) {
                  setErrors((prev) => ({ ...prev, gpa: '' }));
                }
              }}
              placeholder="e.g., 3.85"
              style={errors().gpa ? inputErrorStyle() : inputStyle()}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = theme().colors.primary;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = errors().gpa
                  ? '#EF4444'
                  : theme().colors.border;
              }}
            />
            <Show when={errors().gpa}>
              <p style={errorTextStyle()}>{errors().gpa}</p>
            </Show>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', 'margin-top': '8px' }}>
          <button
            onClick={props.onClose}
            style={buttonSecondaryStyle()}
            onMouseOver={(e) => {
              e.currentTarget.style.background = `${theme().colors.border}40`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid()}
            style={{
              ...buttonPrimaryStyle(),
              opacity: isValid() ? 1 : 0.5,
              cursor: isValid() ? 'pointer' : 'not-allowed',
            }}
            onMouseOver={(e) => {
              if (isValid()) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${theme().colors.primary}40`;
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {props.education ? 'Save Changes' : 'Add Education'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EducationEditor;
