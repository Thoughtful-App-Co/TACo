/**
 * ExportView - Export career data in various formats
 *
 * Features:
 * - Multiple export formats (Resume Bullets, Performance Review, Portfolio, Full Backup)
 * - Date range filtering
 * - Employer filtering
 * - Include/exclude private notes toggle
 * - Preview panel
 * - Download as JSON, Markdown, or copy to clipboard
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, createMemo, For, Show } from 'solid-js';
import { prosperStore } from '../store';
import type { ExportFormat } from '../../../../schemas/tenure';
import {
  CurrencyDollarIcon,
  NotePencilIcon,
  TrophyIcon,
  ChartBarIcon as ChartIcon,
  StarIcon,
  FileIcon,
  TargetIcon,
} from 'solid-phosphor/bold';

// ============================================================================
// TYPES
// ============================================================================

interface ExportViewProps {
  currentTheme: () => any;
}

interface FormatCardProps {
  format: ExportFormat;
  title: string;
  description: string;
  icon: string;
  selected: boolean;
  onClick: () => void;
  theme: () => any;
}

// ============================================================================
// ICONS
// ============================================================================

const DownloadIcon: Component = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const CopyIcon: Component = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon: Component = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="3"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ============================================================================
// FORMAT CARD COMPONENT
// ============================================================================

const FormatCard: Component<FormatCardProps> = (props) => {
  const theme = () => props.theme();

  return (
    <button
      onClick={props.onClick}
      style={{
        background: props.selected ? theme().colors.surface : theme().colors.background,
        border: `2px solid ${props.selected ? theme().colors.secondary : theme().colors.border}`,
        'border-radius': '12px',
        padding: '20px',
        cursor: 'pointer',
        'text-align': 'left',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Show when={props.selected}>
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '24px',
            height: '24px',
            background: theme().colors.secondary,
            'border-radius': '50%',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            color: '#FFF',
          }}
        >
          <CheckIcon />
        </div>
      </Show>

      <div
        style={{
          'font-size': '32px',
          'margin-bottom': '12px',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
        }}
      >
        <Show when={props.icon === 'file'}>
          <FileIcon width={32} height={32} />
        </Show>
        <Show when={props.icon === 'chart'}>
          <ChartIcon width={32} height={32} />
        </Show>
        <Show when={props.icon === 'target'}>
          <TargetIcon width={32} height={32} />
        </Show>
      </div>

      <h3
        style={{
          'font-family': "'Playfair Display', Georgia, serif",
          'font-size': '18px',
          color: theme().colors.text,
          margin: '0 0 8px 0',
        }}
      >
        {props.title}
      </h3>

      <p
        style={{
          'font-family': "'Space Grotesk', system-ui, sans-serif",
          'font-size': '14px',
          color: theme().colors.textMuted,
          margin: 0,
          'line-height': '1.5',
        }}
      >
        {props.description}
      </p>
    </button>
  );
};

// ============================================================================
// DATA SUMMARY COMPONENT
// ============================================================================

interface DataSummaryProps {
  theme: () => any;
}

const DataSummary: Component<DataSummaryProps> = (props) => {
  const theme = () => props.theme();

  const salaryCount = createMemo(() => {
    const history = prosperStore.state.salaryHistory;
    if (!history) return 0;
    return history.entryMode === 'per-year'
      ? history.yearlyEntries.length
      : history.rangeEntries.length;
  });

  const journalCount = createMemo(() => prosperStore.state.checkIns.length);
  const accomplishmentCount = createMemo(() => prosperStore.state.accomplishments.length);
  const reviewCount = createMemo(() => prosperStore.state.reviewCycles.length);
  const accoladeCount = createMemo(() => prosperStore.state.accolades.length);

  const summaryItems = [
    { label: 'Salary Data Points', count: salaryCount, icon: 'currency' },
    { label: 'Journal Entries', count: journalCount, icon: 'note' },
    { label: 'Accomplishments', count: accomplishmentCount, icon: 'trophy' },
    { label: 'Review Cycles', count: reviewCount, icon: 'chart' },
    { label: 'Accolades', count: accoladeCount, icon: 'star' },
  ];

  return (
    <div
      style={{
        background: theme().colors.surface,
        'border-radius': '12px',
        padding: '20px',
        border: `1px solid ${theme().colors.border}`,
      }}
    >
      <h3
        style={{
          'font-family': "'Playfair Display', Georgia, serif",
          'font-size': '18px',
          color: theme().colors.text,
          margin: '0 0 16px 0',
        }}
      >
        Data Summary
      </h3>

      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
        <For each={summaryItems}>
          {(item) => (
            <div
              style={{
                display: 'flex',
                'justify-content': 'space-between',
                'align-items': 'center',
              }}
            >
              <span
                style={{
                  'font-family': "'Space Grotesk', system-ui, sans-serif",
                  'font-size': '14px',
                  color: theme().colors.textMuted,
                  display: 'flex',
                  'align-items': 'center',
                  gap: '8px',
                }}
              >
                <span style={{ display: 'flex', 'align-items': 'center' }}>
                  <Show when={item.icon === 'currency'}>
                    <CurrencyDollarIcon width={16} height={16} />
                  </Show>
                  <Show when={item.icon === 'note'}>
                    <NotePencilIcon width={16} height={16} />
                  </Show>
                  <Show when={item.icon === 'trophy'}>
                    <TrophyIcon width={16} height={16} />
                  </Show>
                  <Show when={item.icon === 'chart'}>
                    <ChartIcon width={16} height={16} />
                  </Show>
                  <Show when={item.icon === 'star'}>
                    <StarIcon width={16} height={16} />
                  </Show>
                </span>
                {item.label}
              </span>
              <span
                style={{
                  'font-family': "'Space Grotesk', system-ui, sans-serif",
                  'font-size': '16px',
                  'font-weight': '600',
                  color: theme().colors.text,
                }}
              >
                {item.count()}
              </span>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};

// ============================================================================
// PREVIEW PANEL COMPONENT
// ============================================================================

interface PreviewPanelProps {
  content: string;
  format: ExportFormat;
  theme: () => any;
}

const PreviewPanel: Component<PreviewPanelProps> = (props) => {
  const theme = () => props.theme();

  return (
    <div
      style={{
        background: theme().colors.surface,
        'border-radius': '12px',
        padding: '20px',
        border: `1px solid ${theme().colors.border}`,
        height: '100%',
        display: 'flex',
        'flex-direction': 'column',
      }}
    >
      <h3
        style={{
          'font-family': "'Playfair Display', Georgia, serif",
          'font-size': '18px',
          color: theme().colors.text,
          margin: '0 0 16px 0',
        }}
      >
        Preview
      </h3>

      <div
        style={{
          flex: 1,
          background: theme().colors.background,
          'border-radius': '8px',
          padding: '16px',
          'overflow-y': 'auto',
          'max-height': '400px',
          border: `1px solid ${theme().colors.border}`,
        }}
      >
        <Show
          when={props.content}
          fallback={
            <p
              style={{
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                'font-size': '14px',
                color: theme().colors.textMuted,
                'text-align': 'center',
                'font-style': 'italic',
              }}
            >
              Select an export format to see a preview
            </p>
          }
        >
          <pre
            style={{
              'font-family': "'Space Grotesk', monospace",
              'font-size': '13px',
              color: theme().colors.text,
              margin: 0,
              'white-space': 'pre-wrap',
              'word-break': 'break-word',
              'line-height': '1.6',
            }}
          >
            {props.content}
          </pre>
        </Show>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORT GENERATORS
// ============================================================================

function generateResumeBullets(
  includePrivate: boolean,
  dateRange?: { start: Date; end: Date },
  employerIds?: string[]
): string {
  let output = '# Resume Bullet Points\n\n';
  output += `Generated: ${new Date().toLocaleDateString()}\n\n`;

  // Get accomplishments
  let accomplishments = [...prosperStore.state.accomplishments];

  // Filter by date range
  if (dateRange) {
    accomplishments = accomplishments.filter((a) => {
      const date = new Date(a.date);
      return date >= dateRange.start && date <= dateRange.end;
    });
  }

  // Filter by employer
  if (employerIds && employerIds.length > 0) {
    accomplishments = accomplishments.filter(
      (a) => a.employerId && employerIds.includes(a.employerId)
    );
  }

  // Filter out private if needed
  if (!includePrivate) {
    accomplishments = accomplishments.filter((a) => a.canShowPublicly);
  }

  // Group by type
  const byType: Record<string, typeof accomplishments> = {};
  accomplishments.forEach((a) => {
    if (!byType[a.type]) byType[a.type] = [];
    byType[a.type].push(a);
  });

  // Output by type
  Object.entries(byType).forEach(([type, items]) => {
    output += `## ${type.charAt(0).toUpperCase() + type.slice(1)}s\n\n`;
    items.forEach((item) => {
      output += `- ${item.title}`;
      if (item.description) {
        output += `: ${item.description}`;
      }
      if (item.metric) {
        output += ` (${item.metric.value}${item.metric.unit ? ' ' + item.metric.unit : ''})`;
      }
      output += '\n';
    });
    output += '\n';
  });

  // Add check-in accomplishments
  let checkIns = [...prosperStore.state.checkIns].filter((c) => !c.isDraft);

  if (dateRange) {
    checkIns = checkIns.filter((c) => {
      const date = new Date(c.periodEnd);
      return date >= dateRange.start && date <= dateRange.end;
    });
  }

  if (employerIds && employerIds.length > 0) {
    checkIns = checkIns.filter((c) => c.employerId && employerIds.includes(c.employerId));
  }

  if (checkIns.length > 0) {
    output += '## From Quarterly Check-ins\n\n';
    checkIns.forEach((checkIn) => {
      if (checkIn.accomplishments.customAccomplishments.length > 0) {
        output += `### ${checkIn.quarter} - ${checkIn.company}\n\n`;
        checkIn.accomplishments.customAccomplishments.forEach((acc) => {
          output += `- ${acc}\n`;
        });
        output += '\n';
      }
    });
  }

  return output;
}

function generatePerformanceReview(
  includePrivate: boolean,
  dateRange?: { start: Date; end: Date },
  employerIds?: string[]
): string {
  let output = '# Performance Review Summary\n\n';
  output += `Generated: ${new Date().toLocaleDateString()}\n\n`;

  // Get check-ins
  let checkIns = [...prosperStore.state.checkIns].filter((c) => !c.isDraft);

  if (dateRange) {
    checkIns = checkIns.filter((c) => {
      const date = new Date(c.periodEnd);
      return date >= dateRange.start && date <= dateRange.end;
    });
  }

  if (employerIds && employerIds.length > 0) {
    checkIns = checkIns.filter((c) => c.employerId && employerIds.includes(c.employerId));
  }

  // Sort by date
  checkIns.sort((a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime());

  if (checkIns.length === 0) {
    output += '_No check-in data available for the selected period._\n';
    return output;
  }

  // Satisfaction trend
  const avgSatisfaction =
    checkIns.reduce((sum, c) => sum + c.reflection.satisfactionScore, 0) / checkIns.length;
  output += `## Overall Satisfaction: ${avgSatisfaction.toFixed(1)}/10\n\n`;

  // Each quarter
  checkIns.forEach((checkIn) => {
    output += `---\n\n`;
    output += `## ${checkIn.quarter} - ${checkIn.company}\n`;
    output += `**Role:** ${checkIn.title}\n`;
    output += `**Satisfaction:** ${checkIn.reflection.satisfactionScore}/10\n`;
    output += `**Mood:** ${checkIn.reflection.mood.replace('-', ' ')}\n\n`;

    output += '### Accomplishments\n\n';
    if (checkIn.accomplishments.customAccomplishments.length > 0) {
      checkIn.accomplishments.customAccomplishments.forEach((acc) => {
        output += `- ${acc}\n`;
      });
    } else {
      output += '_No accomplishments recorded_\n';
    }
    output += '\n';

    output += '### What Went Well\n\n';
    output += checkIn.reflection.whatIsGoingWell || '_Not recorded_';
    output += '\n\n';

    output += '### Challenges\n\n';
    output += checkIn.reflection.challenges || '_Not recorded_';
    output += '\n\n';

    output += '### Learning Goals\n\n';
    output += checkIn.reflection.learningGoals || '_Not recorded_';
    output += '\n\n';

    if (includePrivate && checkIn.reflection.privateNotes) {
      output += '### Private Notes\n\n';
      output += checkIn.reflection.privateNotes;
      output += '\n\n';
    }

    // Skills gained
    if (checkIn.skillsGained.length > 0) {
      output += '### Skills Gained\n\n';
      checkIn.skillsGained.forEach((skill) => {
        output += `- ${skill}\n`;
      });
      output += '\n';
    }
  });

  // Include review cycles
  let reviewCycles = [...prosperStore.state.reviewCycles];

  if (dateRange) {
    reviewCycles = reviewCycles.filter((r) => {
      const date = new Date(r.periodEnd);
      return date >= dateRange.start && date <= dateRange.end;
    });
  }

  if (employerIds && employerIds.length > 0) {
    reviewCycles = reviewCycles.filter((r) => r.employerId && employerIds.includes(r.employerId));
  }

  if (reviewCycles.length > 0) {
    output += '---\n\n## 360 Review Cycles\n\n';
    reviewCycles.forEach((cycle) => {
      output += `### ${cycle.name}\n`;
      output += `**Period:** ${new Date(cycle.periodStart).toLocaleDateString()} - ${new Date(cycle.periodEnd).toLocaleDateString()}\n`;
      output += `**Status:** ${cycle.status}\n`;
      output += `**Feedback Received:** ${cycle.feedbackReceived}/${cycle.feedbackRequestsSent}\n\n`;
    });
  }

  return output;
}

function generatePortfolio(
  _includePrivate: boolean,
  dateRange?: { start: Date; end: Date },
  employerIds?: string[]
): string {
  let output = '# Career Portfolio\n\n';
  output += `Generated: ${new Date().toLocaleDateString()}\n\n`;

  // Key accomplishments (public only for portfolio - includePrivate is ignored for portfolio)
  let accomplishments = [...prosperStore.state.accomplishments].filter((a) => a.canShowPublicly);

  if (dateRange) {
    accomplishments = accomplishments.filter((a) => {
      const date = new Date(a.date);
      return date >= dateRange.start && date <= dateRange.end;
    });
  }

  if (employerIds && employerIds.length > 0) {
    accomplishments = accomplishments.filter(
      (a) => a.employerId && employerIds.includes(a.employerId)
    );
  }

  output += '## Key Accomplishments\n\n';
  if (accomplishments.length > 0) {
    accomplishments.forEach((acc) => {
      output += `### ${acc.title}\n`;
      if (acc.description) output += `${acc.description}\n`;
      output += `**Type:** ${acc.type} | **Date:** ${new Date(acc.date).toLocaleDateString()}\n`;
      if (acc.tags.length > 0) {
        output += `**Tags:** ${acc.tags.join(', ')}\n`;
      }
      if (acc.metric) {
        output += `**Impact:** ${acc.metric.value}${acc.metric.unit ? ' ' + acc.metric.unit : ''}\n`;
      }
      output += '\n';
    });
  } else {
    output += '_No public accomplishments recorded_\n\n';
  }

  // Accolades
  let accolades = [...prosperStore.state.accolades].filter((a) => a.canShowPublicly);

  if (dateRange) {
    accolades = accolades.filter((a) => {
      const date = new Date(a.date);
      return date >= dateRange.start && date <= dateRange.end;
    });
  }

  if (employerIds && employerIds.length > 0) {
    accolades = accolades.filter((a) => a.employerId && employerIds.includes(a.employerId));
  }

  if (accolades.length > 0) {
    output += '## Recognition & Accolades\n\n';
    accolades.forEach((accolade) => {
      output += `### ${accolade.title}\n`;
      output += `${accolade.description}\n`;
      if (accolade.fromName) {
        output += `**From:** ${accolade.fromName}`;
        if (accolade.fromRelationship) output += ` (${accolade.fromRelationship})`;
        output += '\n';
      }
      output += `**Date:** ${new Date(accolade.date).toLocaleDateString()} | **Company:** ${accolade.company}\n\n`;
    });
  }

  // Career progression (salary data summary - no actual numbers in portfolio)
  const history = prosperStore.state.salaryHistory;
  if (history) {
    const entries = history.entryMode === 'per-year' ? history.yearlyEntries : history.rangeEntries;
    if (entries.length > 0) {
      output += '## Career Progression\n\n';

      // Get unique companies and roles
      const progression = entries.map((e) => ({
        company: e.company,
        title: e.title,
        year: 'startYear' in e ? e.startYear : e.year,
      }));

      // Sort by year
      progression.sort((a, b) => a.year - b.year);

      progression.forEach((p) => {
        output += `- **${p.year}**: ${p.title} at ${p.company}\n`;
      });
      output += '\n';
    }
  }

  return output;
}

function generateFullBackup(): string {
  const data = prosperStore.exportData();
  return JSON.stringify(data, null, 2);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ExportView: Component<ExportViewProps> = (props) => {
  const theme = () => props.currentTheme();

  // State
  const [selectedFormat, setSelectedFormat] = createSignal<ExportFormat | null>(null);
  const [includePrivate, setIncludePrivate] = createSignal(false);
  const [useDateRange, setUseDateRange] = createSignal(false);
  const [startDate, setStartDate] = createSignal('');
  const [endDate, setEndDate] = createSignal('');
  const [selectedEmployers, setSelectedEmployers] = createSignal<string[]>([]);
  const [copied, setCopied] = createSignal(false);

  // Get unique employers from data
  const employers = createMemo(() => {
    const employerMap = new Map<string, string>();

    // From check-ins
    prosperStore.state.checkIns.forEach((c) => {
      if (c.employerId && c.company) {
        employerMap.set(c.employerId, c.company);
      }
    });

    // From salary history
    const history = prosperStore.state.salaryHistory;
    if (history) {
      history.yearlyEntries.forEach((e) => {
        if (e.employerId && e.company) {
          employerMap.set(e.employerId, e.company);
        }
      });
      history.rangeEntries.forEach((e) => {
        if (e.employerId && e.company) {
          employerMap.set(e.employerId, e.company);
        }
      });
    }

    // From accomplishments
    prosperStore.state.accomplishments.forEach((a) => {
      if (a.employerId) {
        // Try to find company name from check-ins
        const checkIn = prosperStore.state.checkIns.find((c) => c.employerId === a.employerId);
        if (checkIn) {
          employerMap.set(a.employerId, checkIn.company);
        }
      }
    });

    return Array.from(employerMap.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  });

  // Generate preview content
  const previewContent = createMemo(() => {
    const format = selectedFormat();
    if (!format) return '';

    const dateRange =
      useDateRange() && startDate() && endDate()
        ? { start: new Date(startDate()), end: new Date(endDate()) }
        : undefined;

    const employerIds = selectedEmployers().length > 0 ? selectedEmployers() : undefined;

    switch (format) {
      case 'resume-bullets':
        return generateResumeBullets(includePrivate(), dateRange, employerIds);
      case 'performance-review':
        return generatePerformanceReview(includePrivate(), dateRange, employerIds);
      case 'portfolio':
        return generatePortfolio(includePrivate(), dateRange, employerIds);
      case 'full-backup':
        return generateFullBackup();
      default:
        return '';
    }
  });

  // Export handlers
  const downloadAsJson = () => {
    const content = previewContent();
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prosper-export-${selectedFormat()}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAsMarkdown = () => {
    const content = previewContent();
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prosper-export-${selectedFormat()}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    const content = previewContent();
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleEmployer = (id: string) => {
    setSelectedEmployers((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
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
    display: 'flex',
    'align-items': 'center',
    gap: '8px',
  });

  const secondaryButtonStyle = () => ({
    background: 'transparent',
    color: theme().colors.text,
    border: `1px solid ${theme().colors.border}`,
    padding: '10px 20px',
    'border-radius': '8px',
    cursor: 'pointer',
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    'font-size': '14px',
    display: 'flex',
    'align-items': 'center',
    gap: '8px',
  });

  const formatCards: Array<{
    format: ExportFormat;
    title: string;
    description: string;
    icon: string;
  }> = [
    {
      format: 'resume-bullets',
      title: 'Resume Bullets',
      description: 'Convert accomplishments to bullet points for your resume',
      icon: 'file',
    },
    {
      format: 'performance-review',
      title: 'Performance Review',
      description: 'Format data for annual reviews with satisfaction trends',
      icon: 'chart',
    },
    {
      format: 'portfolio',
      title: 'Portfolio',
      description: 'Shareable career highlights and public accomplishments',
      icon: 'target',
    },
    {
      format: 'full-backup',
      title: 'Full Backup',
      description: 'JSON export of all your data for safekeeping',
      icon: 'file',
    },
  ];

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
          Export Data
        </h1>
        <p
          style={{
            margin: 0,
            'font-size': '15px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            color: theme().colors.textMuted,
          }}
        >
          Download your career data for safekeeping or sharing
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          'grid-template-columns': '1fr 400px',
          gap: '32px',
        }}
      >
        {/* Left Column - Options */}
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '24px' }}>
          {/* Format Selection */}
          <section>
            <h2
              style={{
                'font-family': "'Playfair Display', Georgia, serif",
                'font-size': '20px',
                color: theme().colors.text,
                margin: '0 0 16px 0',
              }}
            >
              Export Format
            </h2>

            <div
              style={{
                display: 'grid',
                'grid-template-columns': 'repeat(2, 1fr)',
                gap: '16px',
              }}
            >
              <For each={formatCards}>
                {(card) => (
                  <FormatCard
                    format={card.format}
                    title={card.title}
                    description={card.description}
                    icon={card.icon}
                    selected={selectedFormat() === card.format}
                    onClick={() => setSelectedFormat(card.format)}
                    theme={theme}
                  />
                )}
              </For>
            </div>
          </section>

          {/* Export Options */}
          <Show when={selectedFormat() && selectedFormat() !== 'full-backup'}>
            <section
              style={{
                background: theme().colors.surface,
                'border-radius': '12px',
                padding: '20px',
                border: `1px solid ${theme().colors.border}`,
              }}
            >
              <h2
                style={{
                  'font-family': "'Playfair Display', Georgia, serif",
                  'font-size': '20px',
                  color: theme().colors.text,
                  margin: '0 0 20px 0',
                }}
              >
                Export Options
              </h2>

              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '20px' }}>
                {/* Date Range Toggle */}
                <div>
                  <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      id="use-date-range"
                      checked={useDateRange()}
                      onChange={(e) => setUseDateRange(e.currentTarget.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label
                      for="use-date-range"
                      style={{
                        'font-family': "'Space Grotesk', system-ui, sans-serif",
                        'font-size': '14px',
                        color: theme().colors.text,
                        cursor: 'pointer',
                      }}
                    >
                      Filter by date range
                    </label>
                  </div>

                  <Show when={useDateRange()}>
                    <div
                      style={{
                        display: 'grid',
                        'grid-template-columns': '1fr 1fr',
                        gap: '12px',
                        'margin-top': '12px',
                        'margin-left': '30px',
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: 'block',
                            'font-size': '12px',
                            color: theme().colors.textMuted,
                            'margin-bottom': '4px',
                          }}
                        >
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={startDate()}
                          onInput={(e) => setStartDate(e.currentTarget.value)}
                          style={inputStyle()}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: 'block',
                            'font-size': '12px',
                            color: theme().colors.textMuted,
                            'margin-bottom': '4px',
                          }}
                        >
                          End Date
                        </label>
                        <input
                          type="date"
                          value={endDate()}
                          onInput={(e) => setEndDate(e.currentTarget.value)}
                          style={inputStyle()}
                        />
                      </div>
                    </div>
                  </Show>
                </div>

                {/* Private Notes Toggle */}
                <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    id="include-private"
                    checked={includePrivate()}
                    onChange={(e) => setIncludePrivate(e.currentTarget.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label
                    for="include-private"
                    style={{
                      'font-family': "'Space Grotesk', system-ui, sans-serif",
                      'font-size': '14px',
                      color: theme().colors.text,
                      cursor: 'pointer',
                    }}
                  >
                    Include private notes
                  </label>
                </div>

                {/* Employer Filter */}
                <Show when={employers().length > 0}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        'font-family': "'Space Grotesk', system-ui, sans-serif",
                        'font-size': '14px',
                        color: theme().colors.text,
                        'margin-bottom': '12px',
                      }}
                    >
                      Filter by employer (leave unchecked for all)
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        'flex-wrap': 'wrap',
                        gap: '8px',
                      }}
                    >
                      <For each={employers()}>
                        {(employer) => (
                          <button
                            onClick={() => toggleEmployer(employer.id)}
                            style={{
                              padding: '6px 12px',
                              'border-radius': '16px',
                              border: `1px solid ${
                                selectedEmployers().includes(employer.id)
                                  ? theme().colors.secondary
                                  : theme().colors.border
                              }`,
                              background: selectedEmployers().includes(employer.id)
                                ? theme().colors.secondary
                                : 'transparent',
                              color: selectedEmployers().includes(employer.id)
                                ? '#FFF'
                                : theme().colors.text,
                              'font-family': "'Space Grotesk', system-ui, sans-serif",
                              'font-size': '13px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            {employer.name}
                          </button>
                        )}
                      </For>
                    </div>
                  </div>
                </Show>
              </div>
            </section>
          </Show>

          {/* Export Actions */}
          <Show when={selectedFormat()}>
            <section
              style={{
                background: theme().colors.surface,
                'border-radius': '12px',
                padding: '20px',
                border: `1px solid ${theme().colors.border}`,
              }}
            >
              <h2
                style={{
                  'font-family': "'Playfair Display', Georgia, serif",
                  'font-size': '20px',
                  color: theme().colors.text,
                  margin: '0 0 16px 0',
                }}
              >
                Download
              </h2>

              <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '12px' }}>
                <Show when={selectedFormat() === 'full-backup'}>
                  <button onClick={downloadAsJson} style={primaryButtonStyle()}>
                    <DownloadIcon />
                    Download JSON
                  </button>
                </Show>

                <Show when={selectedFormat() !== 'full-backup'}>
                  <button onClick={downloadAsMarkdown} style={primaryButtonStyle()}>
                    <DownloadIcon />
                    Download Markdown
                  </button>
                  <button onClick={downloadAsJson} style={secondaryButtonStyle()}>
                    <DownloadIcon />
                    Download JSON
                  </button>
                </Show>

                <button
                  onClick={copyToClipboard}
                  style={{
                    ...secondaryButtonStyle(),
                    ...(copied() ? { color: '#10B981', 'border-color': '#10B981' } : {}),
                  }}
                >
                  {copied() ? <CheckIcon /> : <CopyIcon />}
                  {copied() ? 'Copied!' : 'Copy to Clipboard'}
                </button>
              </div>
            </section>
          </Show>
        </div>

        {/* Right Column - Preview & Summary */}
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '24px' }}>
          <DataSummary theme={theme} />
          <PreviewPanel
            content={previewContent()}
            format={selectedFormat() || 'full-backup'}
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
};

export default ExportView;
