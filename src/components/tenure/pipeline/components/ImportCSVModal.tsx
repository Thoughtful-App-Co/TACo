/**
 * ImportCSVModal - Modal for importing job applications from CSV
 *
 * Supports common CSV formats with flexible column mapping:
 * - Company Name (required)
 * - Role/Job Title (required)
 * - Status (optional, defaults to 'saved')
 * - URL (optional)
 * - Location (optional)
 * - Location Type (optional: remote/hybrid/onsite)
 * - Department (optional)
 * - Salary (optional, supports formats like "$100K-$150K/yr", "100000-150000", "$50/hr")
 * - Notes (optional)
 * - Applied Date (optional, supports "YYYY-MM-DD" or "YYYY-MM-DD HH:MM", defaults to 12:00 PM if no time)
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, createMemo, For, Show } from 'solid-js';
import { pipelineStore } from '../store';
import { liquidTenure, pipelineAnimations } from '../theme/liquid-tenure';
import { IconX, IconUpload, IconCheck, IconAlert } from '../ui/Icons';
import { JobApplication, ApplicationStatus } from '../../../../schemas/pipeline.schema';

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: () => Partial<typeof liquidTenure> & typeof liquidTenure;
}

interface ParsedRow {
  companyName: string;
  roleName: string;
  status: ApplicationStatus;
  jobUrl?: string;
  location?: string;
  locationType?: 'remote' | 'hybrid' | 'onsite';
  salary?: {
    min?: number;
    max?: number;
    currency: string;
    period: 'hourly' | 'annual';
  };
  department?: string;
  notes?: string;
  appliedAt?: Date;
  isValid: boolean;
  errors: string[];
}

// Common column name mappings
const COLUMN_MAPPINGS: Record<string, string[]> = {
  companyName: ['company', 'company name', 'employer', 'organization', 'org'],
  roleName: ['role', 'job', 'title', 'job title', 'position', 'job name', 'role name'],
  status: ['status', 'state', 'stage', 'pipeline stage'],
  jobUrl: ['url', 'job url', 'link', 'job link', 'posting url', 'application url'],
  location: ['location', 'city', 'place', 'office', 'work location'],
  locationType: ['location type', 'work type', 'remote', 'work model', 'work style'],
  salary: ['salary', 'compensation', 'pay', 'salary range'],
  department: ['department', 'dept', 'team', 'division'],
  notes: ['notes', 'note', 'comments', 'description', 'details'],
  appliedAt: ['applied', 'applied date', 'date applied', 'application date', 'date'],
};

// Status mappings from common terms
const STATUS_MAPPINGS: Record<string, ApplicationStatus> = {
  saved: 'saved',
  bookmarked: 'saved',
  interested: 'saved',
  wishlist: 'saved',
  applied: 'applied',
  submitted: 'applied',
  sent: 'applied',
  screening: 'screening',
  'phone screen': 'screening',
  'initial screen': 'screening',
  interviewing: 'interviewing',
  interview: 'interviewing',
  'in progress': 'interviewing',
  offered: 'offered',
  offer: 'offered',
  accepted: 'accepted',
  hired: 'accepted',
  rejected: 'rejected',
  declined: 'rejected',
  'no response': 'rejected',
  withdrawn: 'withdrawn',
  cancelled: 'withdrawn',
};

export const ImportCSVModal: Component<ImportCSVModalProps> = (props) => {
  const theme = () => props.currentTheme();

  const [step, setStep] = createSignal<'upload' | 'preview' | 'complete'>('upload');
  const [csvContent, setCsvContent] = createSignal<string>('');
  const [parsedRows, setParsedRows] = createSignal<ParsedRow[]>([]);
  const [importError, setImportError] = createSignal<string | null>(null);
  const [importedCount, setImportedCount] = createSignal(0);
  const [dragOver, setDragOver] = createSignal(false);

  // Stats for preview
  const validRows = createMemo(() => parsedRows().filter((r) => r.isValid));
  const invalidRows = createMemo(() => parsedRows().filter((r) => !r.isValid));

  const resetModal = () => {
    setStep('upload');
    setCsvContent('');
    setParsedRows([]);
    setImportError(null);
    setImportedCount(0);
    setDragOver(false);
  };

  const handleClose = () => {
    resetModal();
    props.onClose();
  };

  // Parse CSV content
  const parseCSV = (content: string): string[][] => {
    const lines = content.trim().split(/\r?\n/);
    const result: string[][] = [];

    for (const line of lines) {
      // Handle quoted values with commas
      const row: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      row.push(current.trim());
      result.push(row);
    }

    return result;
  };

  // Find column index by possible names
  const findColumnIndex = (headers: string[], fieldName: string): number => {
    const possibleNames = COLUMN_MAPPINGS[fieldName] || [];
    const headerLower = headers.map((h) => h.toLowerCase().trim());

    for (const name of possibleNames) {
      const index = headerLower.indexOf(name);
      if (index !== -1) return index;
    }
    return -1;
  };

  // Parse status string to ApplicationStatus
  const parseStatus = (statusStr: string): ApplicationStatus => {
    const normalized = statusStr.toLowerCase().trim();
    return STATUS_MAPPINGS[normalized] || 'saved';
  };

  // Parse date string - defaults to 12:00 PM if no time is specified
  const parseDate = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;

    let parsed: Date;

    // Check if the date string includes a time component
    if (dateStr.includes(':') || dateStr.toLowerCase().includes('t')) {
      // Has time component, parse as-is
      parsed = new Date(dateStr);
    } else {
      // No time component, add 12:00 (noon) as default
      // Assuming date format is YYYY-MM-DD or similar
      const dateOnly = dateStr.trim();
      parsed = new Date(`${dateOnly}T12:00:00`);
    }

    return isNaN(parsed.getTime()) ? undefined : parsed;
  };

  // Parse location type
  const parseLocationType = (typeStr: string): 'remote' | 'hybrid' | 'onsite' | undefined => {
    if (!typeStr) return undefined;
    const normalized = typeStr.toLowerCase().trim();
    if (normalized.includes('remote')) return 'remote';
    if (normalized.includes('hybrid')) return 'hybrid';
    if (
      normalized.includes('onsite') ||
      normalized.includes('on-site') ||
      normalized.includes('office')
    )
      return 'onsite';
    return undefined;
  };

  // Parse salary (supports formats like "$100K-$150K", "100000-150000", "$50/hr", etc.)
  const parseSalary = (salaryStr: string): ParsedRow['salary'] | undefined => {
    if (!salaryStr) return undefined;

    const str = salaryStr.trim().toLowerCase();
    const isHourly = str.includes('/hr') || str.includes('hour');
    const period: 'hourly' | 'annual' = isHourly ? 'hourly' : 'annual';

    // Extract currency symbol or default to USD
    let currency = 'USD';
    if (str.includes('€') || str.includes('eur')) currency = 'EUR';
    else if (str.includes('£') || str.includes('gbp')) currency = 'GBP';
    else if (str.includes('¥') || str.includes('jpy')) currency = 'JPY';
    else if (str.includes('₹') || str.includes('inr')) currency = 'INR';

    // Remove all non-numeric characters except dash and decimal
    const cleaned = str.replace(/[^0-9.\-k]/gi, '');

    // Check if it's a range (contains dash)
    if (cleaned.includes('-')) {
      const parts = cleaned.split('-').map((p) => p.trim());
      if (parts.length === 2) {
        const parseValue = (val: string): number | undefined => {
          if (!val) return undefined;
          let num = parseFloat(val.replace(/k/i, ''));
          if (isNaN(num)) return undefined;
          // If it has 'k' or 'K', multiply by 1000
          if (val.toLowerCase().includes('k')) num *= 1000;
          return num;
        };

        const min = parseValue(parts[0]);
        const max = parseValue(parts[1]);

        if (min !== undefined || max !== undefined) {
          return { min, max, currency, period };
        }
      }
    } else {
      // Single value
      let num = parseFloat(cleaned.replace(/k/i, ''));
      if (!isNaN(num)) {
        if (cleaned.toLowerCase().includes('k')) num *= 1000;
        return { min: num, max: num, currency, period };
      }
    }

    return undefined;
  };

  // Process uploaded CSV
  const processCSV = (content: string) => {
    setCsvContent(content);
    setImportError(null);

    try {
      const rows = parseCSV(content);
      if (rows.length < 2) {
        setImportError('CSV must have at least a header row and one data row');
        return;
      }

      const headers = rows[0];
      const dataRows = rows.slice(1);

      // Find column indices
      const companyIdx = findColumnIndex(headers, 'companyName');
      const roleIdx = findColumnIndex(headers, 'roleName');
      const statusIdx = findColumnIndex(headers, 'status');
      const urlIdx = findColumnIndex(headers, 'jobUrl');
      const locationIdx = findColumnIndex(headers, 'location');
      const locationTypeIdx = findColumnIndex(headers, 'locationType');
      const salaryIdx = findColumnIndex(headers, 'salary');
      const departmentIdx = findColumnIndex(headers, 'department');
      const notesIdx = findColumnIndex(headers, 'notes');
      const appliedIdx = findColumnIndex(headers, 'appliedAt');

      if (companyIdx === -1 && roleIdx === -1) {
        setImportError(
          'Could not find Company or Role columns. Please ensure your CSV has columns like "Company", "Role", or "Job Title".'
        );
        return;
      }

      // Parse each row
      const parsed: ParsedRow[] = dataRows
        .filter((row) => row.some((cell) => cell.trim())) // Skip empty rows
        .map((row) => {
          const errors: string[] = [];

          const companyName = companyIdx !== -1 ? row[companyIdx]?.trim() || '' : '';
          const roleName = roleIdx !== -1 ? row[roleIdx]?.trim() || '' : '';

          if (!companyName && !roleName) {
            errors.push('Missing both company and role');
          } else if (!companyName) {
            errors.push('Missing company name');
          } else if (!roleName) {
            errors.push('Missing role/job title');
          }

          return {
            companyName: companyName || 'Unknown Company',
            roleName: roleName || 'Unknown Role',
            status: statusIdx !== -1 ? parseStatus(row[statusIdx] || '') : 'saved',
            jobUrl: urlIdx !== -1 ? row[urlIdx]?.trim() || undefined : undefined,
            location: locationIdx !== -1 ? row[locationIdx]?.trim() || undefined : undefined,
            locationType:
              locationTypeIdx !== -1 ? parseLocationType(row[locationTypeIdx] || '') : undefined,
            salary: salaryIdx !== -1 ? parseSalary(row[salaryIdx] || '') : undefined,
            department: departmentIdx !== -1 ? row[departmentIdx]?.trim() || undefined : undefined,
            notes: notesIdx !== -1 ? row[notesIdx]?.trim() || undefined : undefined,
            appliedAt: appliedIdx !== -1 ? parseDate(row[appliedIdx]) : undefined,
            isValid: errors.length === 0,
            errors,
          };
        });

      setParsedRows(parsed);
      setStep('preview');
    } catch (e) {
      setImportError('Failed to parse CSV. Please check the file format.');
    }
  };

  // Handle file input
  const handleFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      processCSV(content);
    };
    reader.onerror = () => {
      setImportError('Failed to read file');
    };
    reader.readAsText(file);
  };

  // Handle drag and drop
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer?.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setImportError('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      processCSV(content);
    };
    reader.readAsText(file);
  };

  // Import valid rows
  const handleImport = () => {
    const toImport = validRows();
    let imported = 0;

    for (const row of toImport) {
      const app: Omit<
        JobApplication,
        'id' | 'createdAt' | 'updatedAt' | 'syncVersion' | 'statusHistory'
      > = {
        companyName: row.companyName,
        roleName: row.roleName,
        status: row.status,
        jobUrl: row.jobUrl,
        location: row.location,
        locationType: row.locationType,
        salary: row.salary,
        department: row.department,
        notes: row.notes || '',
        savedAt: new Date(),
        appliedAt: row.appliedAt,
        lastActivityAt: row.appliedAt || new Date(),
        criteriaScores: [],
        contacts: [],
        documents: [],
      };

      pipelineStore.addApplication(app);
      imported++;
    }

    setImportedCount(imported);
    setStep('complete');
  };

  // Styles
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
            'max-width': '640px',
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
              Import from CSV
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
            {/* Upload Step */}
            <Show when={step() === 'upload'}>
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
                  Upload a CSV file with your job applications. We'll automatically detect columns
                  like Company, Role, Status, URL, and Location.
                </p>

                {/* Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${dragOver() ? theme().colors.primary : theme().colors.border}`,
                    'border-radius': '12px',
                    padding: '40px 20px',
                    'text-align': 'center',
                    background: dragOver() ? `${theme().colors.primary}10` : 'transparent',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onClick={() => document.getElementById('csv-file-input')?.click()}
                >
                  <input
                    type="file"
                    id="csv-file-input"
                    accept=".csv,text/csv"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      margin: '0 auto 16px',
                      background: `${theme().colors.primary}15`,
                      'border-radius': '14px',
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                    }}
                  >
                    <IconUpload size={28} color={theme().colors.primary} />
                  </div>
                  <p
                    style={{
                      margin: '0 0 8px',
                      'font-size': '15px',
                      'font-family': "'Space Grotesk', system-ui, sans-serif",
                      color: theme().colors.text,
                      'font-weight': '500',
                    }}
                  >
                    Drop your CSV file here
                  </p>
                  <p
                    style={{
                      margin: 0,
                      'font-size': '13px',
                      'font-family': "'Space Grotesk', system-ui, sans-serif",
                      color: theme().colors.textMuted,
                    }}
                  >
                    or click to browse
                  </p>
                </div>

                {/* Error */}
                <Show when={importError()}>
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'flex-start',
                      gap: '10px',
                      padding: '12px 16px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      'border-radius': '8px',
                      'margin-top': '16px',
                    }}
                  >
                    <IconAlert size={18} color="#EF4444" />
                    <p
                      style={{
                        margin: 0,
                        'font-size': '13px',
                        'font-family': "'Space Grotesk', system-ui, sans-serif",
                        color: '#EF4444',
                        'line-height': '1.4',
                      }}
                    >
                      {importError()}
                    </p>
                  </div>
                </Show>

                {/* Expected Format */}
                <div
                  style={{
                    'margin-top': '24px',
                    padding: '16px',
                    background: theme().colors.background,
                    'border-radius': '10px',
                    border: `1px solid ${theme().colors.border}`,
                  }}
                >
                  <p
                    style={{
                      margin: '0 0 12px',
                      'font-size': '12px',
                      'font-family': "'Space Grotesk', system-ui, sans-serif",
                      color: theme().colors.textMuted,
                      'text-transform': 'uppercase',
                      'letter-spacing': '0.05em',
                      'font-weight': '500',
                    }}
                  >
                    Expected columns
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      'flex-wrap': 'wrap',
                      gap: '8px',
                    }}
                  >
                    {[
                      'Company *',
                      'Role *',
                      'Status',
                      'URL',
                      'Location',
                      'Notes',
                      'Applied Date',
                    ].map((col) => (
                      <span
                        style={{
                          padding: '4px 10px',
                          background: col.includes('*')
                            ? `${theme().colors.primary}20`
                            : 'rgba(255,255,255,0.05)',
                          'border-radius': '6px',
                          'font-size': '12px',
                          'font-family': "'Space Grotesk', system-ui, sans-serif",
                          color: col.includes('*')
                            ? theme().colors.primary
                            : theme().colors.textMuted,
                          'font-weight': col.includes('*') ? '600' : '400',
                        }}
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Show>

            {/* Preview Step */}
            <Show when={step() === 'preview'}>
              <div>
                {/* Stats */}
                <div
                  style={{
                    display: 'flex',
                    gap: '16px',
                    'margin-bottom': '20px',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      padding: '16px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      'border-radius': '10px',
                      'text-align': 'center',
                    }}
                  >
                    <div
                      style={{
                        'font-size': '28px',
                        'font-family': "'Playfair Display', Georgia, serif",
                        'font-weight': '600',
                        color: '#10B981',
                      }}
                    >
                      {validRows().length}
                    </div>
                    <div
                      style={{
                        'font-size': '12px',
                        'font-family': "'Space Grotesk', system-ui, sans-serif",
                        color: '#10B981',
                        'margin-top': '4px',
                      }}
                    >
                      Ready to import
                    </div>
                  </div>
                  <Show when={invalidRows().length > 0}>
                    <div
                      style={{
                        flex: 1,
                        padding: '16px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        'border-radius': '10px',
                        'text-align': 'center',
                      }}
                    >
                      <div
                        style={{
                          'font-size': '28px',
                          'font-family': "'Playfair Display', Georgia, serif",
                          'font-weight': '600',
                          color: '#F59E0B',
                        }}
                      >
                        {invalidRows().length}
                      </div>
                      <div
                        style={{
                          'font-size': '12px',
                          'font-family': "'Space Grotesk', system-ui, sans-serif",
                          color: '#F59E0B',
                          'margin-top': '4px',
                        }}
                      >
                        Skipped (incomplete)
                      </div>
                    </div>
                  </Show>
                </div>

                {/* Preview Table */}
                <div
                  style={{
                    'max-height': '300px',
                    overflow: 'auto',
                    border: `1px solid ${theme().colors.border}`,
                    'border-radius': '10px',
                    'margin-bottom': '20px',
                  }}
                >
                  <table
                    style={{
                      width: '100%',
                      'border-collapse': 'collapse',
                      'font-size': '13px',
                      'font-family': "'Space Grotesk', system-ui, sans-serif",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: theme().colors.background,
                          position: 'sticky',
                          top: 0,
                        }}
                      >
                        <th
                          style={{
                            padding: '12px 16px',
                            'text-align': 'left',
                            color: theme().colors.textMuted,
                            'font-weight': '500',
                            'border-bottom': `1px solid ${theme().colors.border}`,
                          }}
                        >
                          Company
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            'text-align': 'left',
                            color: theme().colors.textMuted,
                            'font-weight': '500',
                            'border-bottom': `1px solid ${theme().colors.border}`,
                          }}
                        >
                          Role
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            'text-align': 'left',
                            color: theme().colors.textMuted,
                            'font-weight': '500',
                            'border-bottom': `1px solid ${theme().colors.border}`,
                          }}
                        >
                          Status
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            'text-align': 'center',
                            color: theme().colors.textMuted,
                            'font-weight': '500',
                            'border-bottom': `1px solid ${theme().colors.border}`,
                            width: '60px',
                          }}
                        >
                          Valid
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={parsedRows().slice(0, 50)}>
                        {(row) => (
                          <tr
                            style={{
                              background: row.isValid ? 'transparent' : 'rgba(245, 158, 11, 0.05)',
                            }}
                          >
                            <td
                              style={{
                                padding: '10px 16px',
                                color: theme().colors.text,
                                'border-bottom': `1px solid ${theme().colors.border}`,
                                'max-width': '180px',
                                overflow: 'hidden',
                                'text-overflow': 'ellipsis',
                                'white-space': 'nowrap',
                              }}
                            >
                              {row.companyName}
                            </td>
                            <td
                              style={{
                                padding: '10px 16px',
                                color: theme().colors.text,
                                'border-bottom': `1px solid ${theme().colors.border}`,
                                'max-width': '180px',
                                overflow: 'hidden',
                                'text-overflow': 'ellipsis',
                                'white-space': 'nowrap',
                              }}
                            >
                              {row.roleName}
                            </td>
                            <td
                              style={{
                                padding: '10px 16px',
                                color: theme().colors.textMuted,
                                'border-bottom': `1px solid ${theme().colors.border}`,
                                'text-transform': 'capitalize',
                              }}
                            >
                              {row.status}
                            </td>
                            <td
                              style={{
                                padding: '10px 16px',
                                'text-align': 'center',
                                'border-bottom': `1px solid ${theme().colors.border}`,
                              }}
                            >
                              {row.isValid ? (
                                <IconCheck size={16} color="#10B981" />
                              ) : (
                                <IconAlert size={16} color="#F59E0B" />
                              )}
                            </td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                  <Show when={parsedRows().length > 50}>
                    <div
                      style={{
                        padding: '12px 16px',
                        'text-align': 'center',
                        color: theme().colors.textMuted,
                        'font-size': '12px',
                        background: theme().colors.background,
                      }}
                    >
                      ... and {parsedRows().length - 50} more rows
                    </div>
                  </Show>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setStep('upload')}
                    style={{ ...buttonSecondary(), flex: 1 }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={validRows().length === 0}
                    style={{
                      ...buttonPrimary(),
                      flex: 2,
                      opacity: validRows().length > 0 ? 1 : 0.5,
                      cursor: validRows().length > 0 ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <IconUpload size={16} />
                    Import {validRows().length} Jobs
                  </button>
                </div>
              </div>
            </Show>

            {/* Complete Step */}
            <Show when={step() === 'complete'}>
              <div
                style={{
                  'text-align': 'center',
                  padding: '40px 20px',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 20px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    'border-radius': '50%',
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                  }}
                >
                  <IconCheck size={32} color="#10B981" />
                </div>
                <h3
                  style={{
                    margin: '0 0 8px',
                    'font-size': '20px',
                    'font-family': "'Playfair Display', Georgia, serif",
                    'font-weight': '600',
                    color: theme().colors.text,
                  }}
                >
                  Import Complete!
                </h3>
                <p
                  style={{
                    margin: '0 0 24px',
                    'font-size': '14px',
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                    color: theme().colors.textMuted,
                  }}
                >
                  Successfully imported {importedCount()} job applications.
                </p>
                <button onClick={handleClose} style={{ ...buttonPrimary() }}>
                  Done
                </button>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default ImportCSVModal;
