/**
 * JobInput - Add job postings to track
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal } from 'solid-js';
import { pipelineStore } from '../store';
import { liquidTenure, pipelineAnimations } from '../theme/liquid-tenure';
import { FluidCard } from '../ui';
import { IconFileText } from '../ui/Icons';
import { JobApplication } from '../../../../schemas/pipeline.schema';

interface JobInputProps {
  currentTheme: () => Partial<typeof liquidTenure> & typeof liquidTenure;
  onJobAdded: () => void;
}

export const JobInput: Component<JobInputProps> = (props) => {
  const theme = () => props.currentTheme();

  // Form state
  const [jobPostingText, setJobPostingText] = createSignal('');
  const [companyName, setCompanyName] = createSignal('');
  const [roleName, setRoleName] = createSignal('');
  const [jobUrl, setJobUrl] = createSignal('');
  const [notes, setNotes] = createSignal('');

  const inputStyle = () => ({
    width: '100%',
    padding: '12px 16px',
    background: theme().colors.background,
    border: `1px solid ${theme().colors.border}`,
    'border-radius': '10px',
    color: theme().colors.text,
    'font-size': '14px',
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    outline: 'none',
    transition: `border-color ${pipelineAnimations.fast}`,
    'box-sizing': 'border-box' as const,
  });

  const labelStyle = () => ({
    display: 'block',
    'margin-bottom': '6px',
    'font-size': '13px',
    'font-weight': '500',
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    color: theme().colors.textMuted,
  });

  const handleAddJob = () => {
    if (!companyName() || !roleName()) return;

    const app: Omit<
      JobApplication,
      'id' | 'createdAt' | 'updatedAt' | 'syncVersion' | 'statusHistory'
    > = {
      companyName: companyName(),
      roleName: roleName(),
      jobUrl: jobUrl() || undefined,
      jobPostingText: jobPostingText() || undefined,
      status: 'saved',
      savedAt: new Date(),
      lastActivityAt: new Date(),
      criteriaScores: [],
      notes: notes(),
      contacts: [],
      documents: [],
    };

    pipelineStore.addApplication(app);
    props.onJobAdded();

    // Reset form
    setJobPostingText('');
    setCompanyName('');
    setRoleName('');
    setJobUrl('');
    setNotes('');
  };

  return (
    <div style={{ 'max-width': '700px' }}>
      {/* Job Details Form */}
      <FluidCard>
        <h3
          style={{
            margin: '0 0 20px',
            'font-size': '18px',
            'font-family': "'Playfair Display', Georgia, serif",
            'font-weight': '600',
            color: '#FFFFFF',
            display: 'flex',
            'align-items': 'center',
            gap: '10px',
          }}
        >
          <IconFileText size={20} color="#FFFFFF" /> Add Job
        </h3>

        <div style={{ display: 'grid', gap: '16px' }}>
          {/* Company & Role */}
          <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle()}>Company Name *</label>
              <input
                type="text"
                value={companyName()}
                onInput={(e) => setCompanyName(e.currentTarget.value)}
                placeholder="e.g., Acme Corp"
                style={inputStyle()}
              />
            </div>
            <div>
              <label style={labelStyle()}>Role *</label>
              <input
                type="text"
                value={roleName()}
                onInput={(e) => setRoleName(e.currentTarget.value)}
                placeholder="e.g., Senior Software Engineer"
                style={inputStyle()}
              />
            </div>
          </div>

          {/* Job URL */}
          <div>
            <label style={labelStyle()}>Job URL</label>
            <input
              type="url"
              value={jobUrl()}
              onInput={(e) => setJobUrl(e.currentTarget.value)}
              placeholder="https://..."
              style={inputStyle()}
            />
          </div>

          {/* Job Posting Text */}
          <div>
            <label style={labelStyle()}>Job Posting Text</label>
            <textarea
              value={jobPostingText()}
              onInput={(e) => setJobPostingText(e.currentTarget.value)}
              placeholder="Paste the job description here for reference..."
              rows={6}
              style={{
                ...inputStyle(),
                resize: 'vertical',
                'line-height': '1.5',
              }}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle()}>Notes</label>
            <textarea
              value={notes()}
              onInput={(e) => setNotes(e.currentTarget.value)}
              placeholder="Any notes about this opportunity..."
              rows={3}
              style={{
                ...inputStyle(),
                resize: 'vertical',
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            class="pipeline-btn"
            onClick={handleAddJob}
            disabled={!companyName() || !roleName()}
            style={{
              padding: '14px 24px',
              background: '#0A0A0A',
              border:
                companyName() && roleName()
                  ? '2px solid #FFFFFF'
                  : '1px solid rgba(255, 255, 255, 0.2)',
              'border-radius': '10px',
              color: '#FFFFFF',
              'font-size': '15px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              'font-weight': '600',
              cursor: companyName() && roleName() ? 'pointer' : 'not-allowed',
              opacity: companyName() && roleName() ? 1 : 0.5,
            }}
          >
            Add Job
          </button>
        </div>
      </FluidCard>
    </div>
  );
};

export default JobInput;
