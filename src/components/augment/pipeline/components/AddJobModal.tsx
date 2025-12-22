/**
 * AddJobModal - Modal for adding jobs via URL scraping or manual entry
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show } from 'solid-js';
import { pipelineStore } from '../store';
import { liquidAugment, pipelineAnimations } from '../theme/liquid-augment';
import { IconX, IconLink, IconEdit, IconLoader, IconCheck } from '../ui/Icons';
import { JobApplication, SalaryRange } from '../../../../schemas/pipeline.schema';
import { formatNumberForInput, parseFormattedNumber, getCurrencySymbol } from '../utils';

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: () => Partial<typeof liquidAugment> & typeof liquidAugment;
}

type ModalView = 'initial' | 'url-loading' | 'url-result' | 'manual';

interface ScrapedJobData {
  companyName?: string;
  roleName?: string;
  location?: string;
  salary?: string;
  description?: string;
  requirements?: string[];
  url: string;
}

export const AddJobModal: Component<AddJobModalProps> = (props) => {
  const theme = () => props.currentTheme();

  const [view, setView] = createSignal<ModalView>('initial');
  const [jobUrl, setJobUrl] = createSignal('');
  const [urlError, setUrlError] = createSignal<string | null>(null);
  const [scrapedData, setScrapedData] = createSignal<ScrapedJobData | null>(null);

  // Form state (for manual entry or editing scraped data)
  const [companyName, setCompanyName] = createSignal('');
  const [roleName, setRoleName] = createSignal('');
  const [jobPostingText, setJobPostingText] = createSignal('');
  const [notes, setNotes] = createSignal('');
  const [formUrl, setFormUrl] = createSignal('');

  // Salary state
  const [salaryIsRange, setSalaryIsRange] = createSignal(false);
  const [salaryMin, setSalaryMin] = createSignal('');
  const [salaryMax, setSalaryMax] = createSignal('');
  const [salarySingle, setSalarySingle] = createSignal('');
  const [salaryCurrency, setSalaryCurrency] = createSignal('USD');
  const [salaryPeriod, setSalaryPeriod] = createSignal<'hourly' | 'annual'>('annual');

  // Location state
  const [location, setLocation] = createSignal('');
  const [locationType, setLocationType] = createSignal<'remote' | 'hybrid' | 'onsite' | ''>('');

  // Department state
  const [department, setDepartment] = createSignal('');

  // Applied date/time state
  const [appliedAtDate, setAppliedAtDate] = createSignal('');
  const [appliedAtTime, setAppliedAtTime] = createSignal('12:00');

  const resetModal = () => {
    setView('initial');
    setJobUrl('');
    setUrlError(null);
    setScrapedData(null);
    setCompanyName('');
    setRoleName('');
    setJobPostingText('');
    setNotes('');
    setFormUrl('');
    setSalaryIsRange(false);
    setSalaryMin('');
    setSalaryMax('');
    setSalarySingle('');
    setSalaryCurrency('USD');
    setSalaryPeriod('annual');
    setLocation('');
    setLocationType('');
    setDepartment('');
    setAppliedAtDate('');
    setAppliedAtTime('12:00');
  };

  const handleClose = () => {
    resetModal();
    props.onClose();
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleFetchUrl = async () => {
    const url = jobUrl().trim();
    if (!url) {
      setUrlError('Please enter a URL');
      return;
    }
    if (!isValidUrl(url)) {
      setUrlError('Please enter a valid URL');
      return;
    }

    setUrlError(null);
    setView('url-loading');

    try {
      // Call the Cloudflare Worker to scrape the job posting
      const response = await fetch('/api/tasks/scrape-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch job posting');
      }

      const data = await response.json();
      setScrapedData({ ...data, url });

      // Pre-fill form with scraped data
      setCompanyName(data.companyName || '');
      setRoleName(data.roleName || '');
      setJobPostingText(data.description || '');
      setFormUrl(url);

      setView('url-result');
    } catch (error) {
      // If scraping fails, fall back to manual entry with URL pre-filled
      setFormUrl(url);
      setView('manual');
      setUrlError('Could not auto-extract job details. Please enter manually.');
    }
  };

  const handleManualEntry = () => {
    setView('manual');
    setFormUrl(jobUrl());
  };

  const handleAddJob = () => {
    if (!companyName() || !roleName()) return;

    // Build salary object if provided
    let salary: SalaryRange | undefined = undefined;
    if (salaryIsRange()) {
      const min = parseFormattedNumber(salaryMin());
      const max = parseFormattedNumber(salaryMax());
      if (!isNaN(min) || !isNaN(max)) {
        salary = {
          min: !isNaN(min) ? min : undefined,
          max: !isNaN(max) ? max : undefined,
          currency: salaryCurrency(),
          period: salaryPeriod(),
        };
      }
    } else {
      const single = parseFormattedNumber(salarySingle());
      if (!isNaN(single)) {
        salary = {
          min: single,
          max: single,
          currency: salaryCurrency(),
          period: salaryPeriod(),
        };
      }
    }

    // Build appliedAt date/time
    let appliedAt: Date | undefined = undefined;
    if (appliedAtDate()) {
      const dateStr = `${appliedAtDate()}T${appliedAtTime() || '12:00'}:00`;
      appliedAt = new Date(dateStr);
    }

    const app: Omit<
      JobApplication,
      'id' | 'createdAt' | 'updatedAt' | 'syncVersion' | 'statusHistory'
    > = {
      companyName: companyName(),
      roleName: roleName(),
      jobUrl: formUrl() || undefined,
      jobPostingText: jobPostingText() || undefined,
      salary,
      location: location() || undefined,
      locationType: locationType() || undefined,
      department: department() || undefined,
      appliedAt,
      status: 'saved',
      savedAt: new Date(),
      lastActivityAt: appliedAt || new Date(),
      criteriaScores: [],
      notes: notes(),
      contacts: [],
      documents: [],
    };

    pipelineStore.addApplication(app);
    handleClose();
  };

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

  const buttonPrimary = () => ({
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
    transition: `all ${pipelineAnimations.fast}`,
  });

  const buttonSecondary = () => ({
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
    transition: `all ${pipelineAnimations.fast}`,
  });

  return (
    <Show when={props.isOpen}>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          'backdrop-filter': 'blur(8px)',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'z-index': 1000,
          padding: '20px',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div
          style={{
            background: theme().colors.surface,
            'border-radius': '16px',
            'max-width': '560px',
            width: '100%',
            'max-height': '90vh',
            overflow: 'auto',
            border: `1px solid ${theme().colors.border}`,
            'box-shadow': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'space-between',
              padding: '20px 24px',
              'border-bottom': `1px solid ${theme().colors.border}`,
            }}
          >
            <h2
              style={{
                margin: 0,
                'font-size': '20px',
                'font-family': "'Playfair Display', Georgia, serif",
                'font-weight': '600',
                color: theme().colors.text,
              }}
            >
              Add Job
            </h2>
            <button
              onClick={handleClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                color: theme().colors.textMuted,
              }}
            >
              <IconX size={20} />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '24px' }}>
            {/* Initial View - URL input */}
            <Show when={view() === 'initial'}>
              <div>
                <p
                  style={{
                    margin: '0 0 20px',
                    'font-size': '14px',
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                    color: theme().colors.textMuted,
                    'line-height': '1.5',
                  }}
                >
                  Paste a job posting URL to auto-fill details, or enter manually.
                </p>

                <div style={{ 'margin-bottom': '16px' }}>
                  <label style={labelStyle()}>Job Posting URL</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="url"
                      value={jobUrl()}
                      onInput={(e) => {
                        setJobUrl(e.currentTarget.value);
                        setUrlError(null);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleFetchUrl();
                      }}
                      placeholder="https://company.com/careers/job-posting"
                      style={{ ...inputStyle(), flex: 1 }}
                    />
                    <button onClick={handleFetchUrl} style={buttonPrimary()}>
                      <IconLink size={16} />
                      Fetch
                    </button>
                  </div>
                  <Show when={urlError()}>
                    <p
                      style={{
                        margin: '8px 0 0',
                        'font-size': '13px',
                        color: '#EF4444',
                        'font-family': "'Space Grotesk', system-ui, sans-serif",
                      }}
                    >
                      {urlError()}
                    </p>
                  </Show>
                </div>

                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '12px',
                    margin: '24px 0',
                  }}
                >
                  <div style={{ flex: 1, height: '1px', background: theme().colors.border }} />
                  <span
                    style={{
                      'font-size': '12px',
                      color: theme().colors.textMuted,
                      'font-family': "'Space Grotesk', system-ui, sans-serif",
                      'text-transform': 'uppercase',
                      'letter-spacing': '0.05em',
                    }}
                  >
                    or
                  </span>
                  <div style={{ flex: 1, height: '1px', background: theme().colors.border }} />
                </div>

                <button onClick={handleManualEntry} style={{ ...buttonSecondary(), width: '100%' }}>
                  <IconEdit size={16} />
                  Enter Manually
                </button>
              </div>
            </Show>

            {/* Loading View */}
            <Show when={view() === 'url-loading'}>
              <div
                style={{
                  display: 'flex',
                  'flex-direction': 'column',
                  'align-items': 'center',
                  'justify-content': 'center',
                  padding: '40px 20px',
                  gap: '16px',
                }}
              >
                <IconLoader size={32} color={theme().colors.primary} />
                <p
                  style={{
                    margin: 0,
                    'font-size': '14px',
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                    color: theme().colors.textMuted,
                  }}
                >
                  Fetching job details...
                </p>
              </div>
            </Show>

            {/* URL Result / Manual Entry Form */}
            <Show when={view() === 'url-result' || view() === 'manual'}>
              <div>
                <Show when={view() === 'url-result'}>
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: '8px',
                      padding: '12px 16px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      'border-radius': '8px',
                      'margin-bottom': '20px',
                      color: '#10B981',
                      'font-size': '13px',
                      'font-family': "'Space Grotesk', system-ui, sans-serif",
                    }}
                  >
                    <IconCheck size={16} />
                    Job details extracted! Review and edit below.
                  </div>
                </Show>

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
                      value={formUrl()}
                      onInput={(e) => setFormUrl(e.currentTarget.value)}
                      placeholder="https://..."
                      style={inputStyle()}
                    />
                  </div>

                  {/* Location Section */}
                  <div style={{ display: 'grid', 'grid-template-columns': '2fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={labelStyle()}>Location</label>
                      <input
                        type="text"
                        value={location()}
                        onInput={(e) => setLocation(e.currentTarget.value)}
                        placeholder="e.g., San Francisco, CA or Worldwide"
                        style={inputStyle()}
                      />
                    </div>
                    <div>
                      <label style={labelStyle()}>Type</label>
                      <select
                        value={locationType()}
                        onChange={(e) =>
                          setLocationType(
                            e.currentTarget.value as 'remote' | 'hybrid' | 'onsite' | ''
                          )
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

                  {/* Department */}
                  <div>
                    <label style={labelStyle()}>Department</label>
                    <input
                      type="text"
                      value={department()}
                      onInput={(e) => setDepartment(e.currentTarget.value)}
                      placeholder="e.g., Engineering, Sales, Marketing"
                      style={inputStyle()}
                    />
                  </div>

                  {/* Applied Date & Time */}
                  <div>
                    <label style={labelStyle()}>Application Date & Time (Optional)</label>
                    <div
                      style={{ display: 'grid', 'grid-template-columns': '2fr 1fr', gap: '12px' }}
                    >
                      <div>
                        <input
                          type="date"
                          value={appliedAtDate()}
                          onInput={(e) => setAppliedAtDate(e.currentTarget.value)}
                          style={inputStyle()}
                        />
                      </div>
                      <div>
                        <input
                          type="time"
                          value={appliedAtTime()}
                          onInput={(e) => setAppliedAtTime(e.currentTarget.value)}
                          style={inputStyle()}
                        />
                      </div>
                    </div>
                    <p
                      style={{
                        margin: '6px 0 0',
                        'font-size': '11px',
                        color: theme().colors.textMuted,
                        'font-family': "'Space Grotesk', system-ui, sans-serif",
                      }}
                    >
                      Leave blank if not yet applied. Time defaults to 12:00 PM.
                    </p>
                  </div>

                  {/* Salary Section */}
                  <div
                    style={{
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${theme().colors.border}`,
                      'border-radius': '10px',
                    }}
                  >
                    <label style={{ ...labelStyle(), 'margin-bottom': '12px' }}>Salary</label>

                    {/* Is Range Checkbox */}
                    <div style={{ 'margin-bottom': '12px' }}>
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
                          checked={salaryIsRange()}
                          onChange={(e) => setSalaryIsRange(e.currentTarget.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        Salary Range (instead of single amount)
                      </label>
                    </div>

                    {/* Salary Inputs */}
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <Show
                        when={salaryIsRange()}
                        fallback={
                          <div>
                            <label style={labelStyle()}>Amount</label>
                            <div style={{ position: 'relative' }}>
                              <span
                                style={{
                                  position: 'absolute',
                                  left: '14px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  color: theme().colors.textMuted,
                                  'font-size': '14px',
                                  'pointer-events': 'none',
                                }}
                              >
                                {getCurrencySymbol(salaryCurrency())}
                              </span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={salarySingle()}
                                onInput={(e) => {
                                  const formatted = formatNumberForInput(e.currentTarget.value);
                                  setSalarySingle(formatted);
                                }}
                                placeholder="e.g., 120,000"
                                style={{ ...inputStyle(), 'padding-left': '36px' }}
                              />
                            </div>
                          </div>
                        }
                      >
                        <div
                          style={{
                            display: 'grid',
                            'grid-template-columns': '1fr 1fr',
                            gap: '12px',
                          }}
                        >
                          <div>
                            <label style={labelStyle()}>Min</label>
                            <div style={{ position: 'relative' }}>
                              <span
                                style={{
                                  position: 'absolute',
                                  left: '14px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  color: theme().colors.textMuted,
                                  'font-size': '14px',
                                  'pointer-events': 'none',
                                }}
                              >
                                {getCurrencySymbol(salaryCurrency())}
                              </span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={salaryMin()}
                                onInput={(e) => {
                                  const formatted = formatNumberForInput(e.currentTarget.value);
                                  setSalaryMin(formatted);
                                }}
                                placeholder="e.g., 100,000"
                                style={{ ...inputStyle(), 'padding-left': '36px' }}
                              />
                            </div>
                          </div>
                          <div>
                            <label style={labelStyle()}>Max</label>
                            <div style={{ position: 'relative' }}>
                              <span
                                style={{
                                  position: 'absolute',
                                  left: '14px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  color: theme().colors.textMuted,
                                  'font-size': '14px',
                                  'pointer-events': 'none',
                                }}
                              >
                                {getCurrencySymbol(salaryCurrency())}
                              </span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={salaryMax()}
                                onInput={(e) => {
                                  const formatted = formatNumberForInput(e.currentTarget.value);
                                  setSalaryMax(formatted);
                                }}
                                placeholder="e.g., 140,000"
                                style={{ ...inputStyle(), 'padding-left': '36px' }}
                              />
                            </div>
                          </div>
                        </div>
                      </Show>

                      {/* Currency and Period */}
                      <div
                        style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '12px' }}
                      >
                        <div>
                          <label style={labelStyle()}>Currency</label>
                          <select
                            value={salaryCurrency()}
                            onChange={(e) => setSalaryCurrency(e.currentTarget.value)}
                            style={{
                              ...inputStyle(),
                              cursor: 'pointer',
                            }}
                          >
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="CAD">CAD ($)</option>
                            <option value="AUD">AUD ($)</option>
                            <option value="JPY">JPY (¥)</option>
                            <option value="INR">INR (₹)</option>
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle()}>Period</label>
                          <select
                            value={salaryPeriod()}
                            onChange={(e) =>
                              setSalaryPeriod(e.currentTarget.value as 'hourly' | 'annual')
                            }
                            style={{
                              ...inputStyle(),
                              cursor: 'pointer',
                            }}
                          >
                            <option value="annual">Annual</option>
                            <option value="hourly">Hourly</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Job Posting Text */}
                  <div>
                    <label style={labelStyle()}>Job Description</label>
                    <textarea
                      value={jobPostingText()}
                      onInput={(e) => setJobPostingText(e.currentTarget.value)}
                      placeholder="Paste or enter the job description here..."
                      rows={5}
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
                      rows={2}
                      style={{
                        ...inputStyle(),
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '12px', 'margin-top': '8px' }}>
                    <button
                      onClick={() => setView('initial')}
                      style={{ ...buttonSecondary(), flex: 1 }}
                    >
                      Back
                    </button>
                    <button
                      onClick={handleAddJob}
                      disabled={!companyName() || !roleName()}
                      style={{
                        ...buttonPrimary(),
                        flex: 2,
                        opacity: companyName() && roleName() ? 1 : 0.5,
                        cursor: companyName() && roleName() ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Add Job
                    </button>
                  </div>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default AddJobModal;
