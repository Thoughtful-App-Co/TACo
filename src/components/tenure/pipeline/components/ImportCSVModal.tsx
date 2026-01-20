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
import { useMobile } from '../../lib/use-mobile';
import { IconX, IconUpload, IconCheck, IconAlert } from '../ui/Icons';
import {
  JobApplication,
  ApplicationStatus,
  StatusChange,
} from '../../../../schemas/pipeline.schema';

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: () => Partial<typeof liquidTenure> & typeof liquidTenure;
}

interface ParsedRow {
  // Existing fields
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

  // NEW: Comprehensive format fields
  id?: string; // Preserve original ID if present
  savedAt?: Date;
  lastActivityAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  statusTimeline?: StatusChange[]; // Parsed from pipe-separated string
  riasecFitScore?: number;
  riasecMatchedTypes?: string[];
  socCode?: string;
  followUpDue?: Date;
  snoozedUntil?: Date;

  isValid: boolean;
  errors: string[];
  isFullFormat: boolean; // NEW: Flag if this came from our comprehensive export
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
  appliedAt: ['applied', 'applied date', 'date applied', 'application date'],

  // NEW: Comprehensive format columns
  id: ['id', 'application id', 'job id'],
  salaryMin: ['salary min', 'min salary', 'salary_min'],
  salaryMax: ['salary max', 'max salary', 'salary_max'],
  salaryCurrency: ['salary currency', 'currency'],
  salaryPeriod: ['salary period', 'period'],
  savedAt: ['saved date', 'saved at', 'saved', 'bookmarked'],
  lastActivityAt: ['last activity', 'last updated', 'activity date'],
  createdAt: ['created at', 'created', 'creation date'],
  updatedAt: ['updated at', 'updated', 'modification date'],
  statusTimeline: ['status timeline', 'timeline', 'status history', 'history'],
  riasecFitScore: ['riasec fit score', 'riasec score', 'fit score', 'riasec fit'],
  riasecMatchedTypes: ['riasec matched types', 'matched types', 'riasec types'],
  socCode: ['soc code', 'soc', 'occupation code'],
  blsMedianWage: ['bls median wage', 'median wage', 'bls wage'],
  matchScore: ['match score', 'ai score', 'overall score'],
  contactsCount: ['contacts count', 'contacts'],
  documentsCount: ['documents count', 'documents'],
  followUpDue: ['follow up due', 'follow up', 'followup'],
  snoozedUntil: ['snoozed until', 'snoozed', 'snooze'],
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
  const isMobile = useMobile();

  const [step, setStep] = createSignal<'upload' | 'preview' | 'complete'>('upload');
  const [csvContent, setCsvContent] = createSignal<string>('');
  const [parsedRows, setParsedRows] = createSignal<ParsedRow[]>([]);
  const [importError, setImportError] = createSignal<string | null>(null);
  const [importedCount, setImportedCount] = createSignal(0);
  const [dragOver, setDragOver] = createSignal(false);
  const [isComprehensiveFormat, setIsComprehensiveFormat] = createSignal(false);

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
    setIsComprehensiveFormat(false);
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
      // Skip comment lines (used in comprehensive export format)
      if (line.trim().startsWith('#')) {
        continue;
      }

      // Skip empty lines
      if (!line.trim()) {
        continue;
      }

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

  /**
   * Parse status timeline from pipe-separated format
   * Format: status:YYYY-MM-DD HH:MM:note|status:YYYY-MM-DD HH:MM
   */
  const parseStatusTimeline = (timelineStr: string): StatusChange[] => {
    if (!timelineStr) return [];

    const entries = timelineStr.split('|').filter((e) => e.trim());
    return entries
      .map((entry) => {
        const parts = entry.split(':');
        const status = parts[0] as ApplicationStatus;
        // Reconstruct datetime (handles the colon in time)
        const dateTimeParts = parts.slice(1, 3).join(':');
        const timestamp = parseDate(dateTimeParts);
        const note = parts.length > 3 ? parts.slice(3).join(':') : undefined;

        return {
          status: STATUS_MAPPINGS[status.toLowerCase()] || status,
          timestamp: timestamp || new Date(),
          note: note?.trim() || undefined,
        };
      })
      .filter((entry) => entry.status);
  };

  /**
   * Parse RIASEC types from semicolon-separated format
   */
  const parseRiasecTypes = (typesStr: string): string[] => {
    if (!typesStr) return [];
    return typesStr
      .split(';')
      .map((t) => t.trim())
      .filter(Boolean);
  };

  /**
   * Parse individual salary components from comprehensive format
   */
  const parseSalaryFromComponents = (
    minStr: string,
    maxStr: string,
    currencyStr: string,
    periodStr: string
  ): ParsedRow['salary'] | undefined => {
    const min = minStr ? parseFloat(minStr) : undefined;
    const max = maxStr ? parseFloat(maxStr) : undefined;

    if (min === undefined && max === undefined) return undefined;
    if ((min !== undefined && isNaN(min)) || (max !== undefined && isNaN(max))) return undefined;

    const currency = currencyStr?.trim() || 'USD';
    const period: 'hourly' | 'annual' = periodStr?.toLowerCase().includes('hour')
      ? 'hourly'
      : 'annual';

    return { min, max, currency, period };
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

      // Find column indices - basic fields
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

      // Find column indices - comprehensive format fields
      const idIdx = findColumnIndex(headers, 'id');
      const salaryMinIdx = findColumnIndex(headers, 'salaryMin');
      const salaryMaxIdx = findColumnIndex(headers, 'salaryMax');
      const salaryCurrencyIdx = findColumnIndex(headers, 'salaryCurrency');
      const salaryPeriodIdx = findColumnIndex(headers, 'salaryPeriod');
      const savedAtIdx = findColumnIndex(headers, 'savedAt');
      const lastActivityAtIdx = findColumnIndex(headers, 'lastActivityAt');
      const createdAtIdx = findColumnIndex(headers, 'createdAt');
      const updatedAtIdx = findColumnIndex(headers, 'updatedAt');
      const statusTimelineIdx = findColumnIndex(headers, 'statusTimeline');
      const riasecFitScoreIdx = findColumnIndex(headers, 'riasecFitScore');
      const riasecMatchedTypesIdx = findColumnIndex(headers, 'riasecMatchedTypes');
      const socCodeIdx = findColumnIndex(headers, 'socCode');
      const followUpDueIdx = findColumnIndex(headers, 'followUpDue');
      const snoozedUntilIdx = findColumnIndex(headers, 'snoozedUntil');

      // Detect if this is a comprehensive format (has Status Timeline or ID columns)
      const isFullFormat = statusTimelineIdx !== -1 || idIdx !== -1;
      setIsComprehensiveFormat(isFullFormat);

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

          // Determine salary - use individual columns if comprehensive format, otherwise parse combined
          let salary: ParsedRow['salary'] | undefined;
          if (isFullFormat && (salaryMinIdx !== -1 || salaryMaxIdx !== -1)) {
            salary = parseSalaryFromComponents(
              row[salaryMinIdx] || '',
              row[salaryMaxIdx] || '',
              row[salaryCurrencyIdx] || '',
              row[salaryPeriodIdx] || ''
            );
          } else if (salaryIdx !== -1) {
            salary = parseSalary(row[salaryIdx] || '');
          }

          // Parse RIASEC fit score
          let riasecFitScore: number | undefined;
          if (riasecFitScoreIdx !== -1 && row[riasecFitScoreIdx]) {
            const score = parseFloat(row[riasecFitScoreIdx]);
            riasecFitScore = isNaN(score) ? undefined : score;
          }

          return {
            companyName: companyName || 'Unknown Company',
            roleName: roleName || 'Unknown Role',
            status: statusIdx !== -1 ? parseStatus(row[statusIdx] || '') : 'saved',
            jobUrl: urlIdx !== -1 ? row[urlIdx]?.trim() || undefined : undefined,
            location: locationIdx !== -1 ? row[locationIdx]?.trim() || undefined : undefined,
            locationType:
              locationTypeIdx !== -1 ? parseLocationType(row[locationTypeIdx] || '') : undefined,
            salary,
            department: departmentIdx !== -1 ? row[departmentIdx]?.trim() || undefined : undefined,
            notes: notesIdx !== -1 ? row[notesIdx]?.trim() || undefined : undefined,
            appliedAt: appliedIdx !== -1 ? parseDate(row[appliedIdx]) : undefined,

            // Comprehensive format fields
            id: idIdx !== -1 ? row[idIdx]?.trim() || undefined : undefined,
            savedAt: savedAtIdx !== -1 ? parseDate(row[savedAtIdx]) : undefined,
            lastActivityAt:
              lastActivityAtIdx !== -1 ? parseDate(row[lastActivityAtIdx]) : undefined,
            createdAt: createdAtIdx !== -1 ? parseDate(row[createdAtIdx]) : undefined,
            updatedAt: updatedAtIdx !== -1 ? parseDate(row[updatedAtIdx]) : undefined,
            statusTimeline:
              statusTimelineIdx !== -1
                ? parseStatusTimeline(row[statusTimelineIdx] || '')
                : undefined,
            riasecFitScore,
            riasecMatchedTypes:
              riasecMatchedTypesIdx !== -1
                ? parseRiasecTypes(row[riasecMatchedTypesIdx] || '')
                : undefined,
            socCode: socCodeIdx !== -1 ? row[socCodeIdx]?.trim() || undefined : undefined,
            followUpDue: followUpDueIdx !== -1 ? parseDate(row[followUpDueIdx]) : undefined,
            snoozedUntil: snoozedUntilIdx !== -1 ? parseDate(row[snoozedUntilIdx]) : undefined,

            isValid: errors.length === 0,
            errors,
            isFullFormat,
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
      const now = new Date();

      // Build the application object
      const baseApp: Omit<
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
        savedAt: row.savedAt || now,
        appliedAt: row.appliedAt,
        lastActivityAt: row.lastActivityAt || row.appliedAt || now,
        followUpDue: row.followUpDue,
        snoozedUntil: row.snoozedUntil,
        riasecFitScore: row.riasecFitScore,
        matchedRiasecTypes: row.riasecMatchedTypes,
        socCode: row.socCode,
        criteriaScores: [],
        contacts: [],
        documents: [],
      };

      if (row.isFullFormat && row.statusTimeline && row.statusTimeline.length > 0) {
        // For full format imports, we need to add the application with its timeline
        // This requires direct store manipulation since addApplication creates new timeline
        const fullApp: JobApplication = {
          ...baseApp,
          id: row.id || crypto.randomUUID(),
          statusHistory: row.statusTimeline,
          createdAt: row.createdAt || now,
          updatedAt: row.updatedAt || now,
          syncVersion: 1,
        };

        // Add directly to store state (bypass addApplication which creates new statusHistory)
        pipelineStore.state.applications.push(fullApp);
      } else {
        pipelineStore.addApplication(baseApp);
      }
      imported++;
    }

    // Trigger store save for direct additions
    if (isComprehensiveFormat()) {
      localStorage.setItem(
        'augment_pipeline_applications',
        JSON.stringify(pipelineStore.state.applications)
      );
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
          'align-items': isMobile() ? 'stretch' : 'center',
          'justify-content': 'center',
          'z-index': 1000,
          padding: isMobile() ? '0' : '20px',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div
          style={{
            background: theme().colors.surface,
            'border-radius': isMobile() ? '0' : '16px',
            'max-width': isMobile() ? '100vw' : '640px',
            width: isMobile() ? '100vw' : '100%',
            height: isMobile() ? '100vh' : 'auto',
            'max-height': isMobile() ? '100vh' : '90vh',
            overflow: 'auto',
            '-webkit-overflow-scrolling': 'touch',
            border: isMobile() ? 'none' : `1px solid ${theme().colors.border}`,
            'box-shadow': isMobile() ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
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
                  like Company, Role, Status, URL, Location, Department, Salary, and more.
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
                    <For
                      each={[
                        'Company *',
                        'Role *',
                        'Status',
                        'URL',
                        'Location',
                        'Location Type',
                        'Department',
                        'Salary',
                        'Notes',
                        'Applied Date',
                      ]}
                    >
                      {(col) => (
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
                      )}
                    </For>
                  </div>
                  <p
                    style={{
                      margin: '12px 0 0',
                      'font-size': '11px',
                      'font-family': "'Space Grotesk', system-ui, sans-serif",
                      color: theme().colors.textMuted,
                      'line-height': '1.5',
                    }}
                  >
                    Also supports comprehensive exports with: ID, Salary Min/Max/Currency/Period,
                    Status Timeline, RIASEC Fit Score, SOC Code, Created/Updated At, and more.
                  </p>
                </div>
              </div>
            </Show>

            {/* Preview Step */}
            <Show when={step() === 'preview'}>
              <div>
                {/* Comprehensive Format Indicator */}
                <Show when={isComprehensiveFormat()}>
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      'border-radius': '8px',
                      'margin-bottom': '16px',
                    }}
                  >
                    <IconCheck size={16} color="#6366F1" />
                    <p
                      style={{
                        margin: 0,
                        'font-size': '13px',
                        'font-family': "'Space Grotesk', system-ui, sans-serif",
                        color: '#6366F1',
                        'line-height': '1.4',
                      }}
                    >
                      Comprehensive format detected - status timeline and metadata will be preserved
                    </p>
                  </div>
                </Show>

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
                              <Show
                                when={row.isValid}
                                fallback={<IconAlert size={16} color="#F59E0B" />}
                              >
                                <IconCheck size={16} color="#10B981" />
                              </Show>
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
