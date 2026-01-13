/**
 * CSV Export Utilities - Export job applications to CSV format
 *
 * Enhanced export includes:
 * - Schema version in header comments
 * - Full status timeline
 * - RIASEC fit scores
 * - All dates and metadata
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { JobApplication, StatusChange } from '../../../../schemas/pipeline.schema';
import { formatSalary } from './salary';

/**
 * Escape CSV field (handle quotes, commas, newlines)
 */
function escapeCSVField(value: any): string {
  if (value === null || value === undefined) return '';

  const stringValue = String(value);

  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('|')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Format date for CSV export (YYYY-MM-DD)
 */
function formatDate(date: Date | string | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Format date with time for CSV export (YYYY-MM-DD HH:MM)
 */
function formatDateTime(date: Date | string | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().replace('T', ' ').slice(0, 16); // YYYY-MM-DD HH:MM
}

/**
 * Format status history as pipe-separated string
 * Format: status:YYYY-MM-DD HH:MM|status:YYYY-MM-DD HH:MM
 */
function formatStatusHistory(history: StatusChange[] | undefined): string {
  if (!history || history.length === 0) return '';
  return history
    .map(
      (change) =>
        `${change.status}:${formatDateTime(change.timestamp)}${change.note ? `:${change.note.replace(/[|:]/g, ' ')}` : ''}`
    )
    .join('|');
}

/**
 * Format RIASEC matched types as semicolon-separated
 */
function formatRiasecTypes(types: string[] | undefined): string {
  if (!types || types.length === 0) return '';
  return types.join(';');
}

/**
 * Export applications to comprehensive CSV string
 * Includes all data needed for full reconstruction
 */
export function exportApplicationsToCSV(applications: JobApplication[]): string {
  // CSV Header comments with schema version (parsers ignore lines starting with #)
  const headerComments = [
    `# TACo Tenure - Job Applications Export`,
    `# Schema Version: 1`,
    `# Exported: ${new Date().toISOString()}`,
    `# Application Count: ${applications.length}`,
    `# `,
    `# Timeline format: status:datetime:note|status:datetime:note`,
    `# RIASEC Types format: R;I;A;S;E;C (semicolon separated)`,
    `# `,
  ];

  // CSV Headers - comprehensive for full data preservation
  const headers = [
    'ID',
    'Company',
    'Role',
    'Status',
    'Location',
    'Location Type',
    'Department',
    'Salary Min',
    'Salary Max',
    'Salary Currency',
    'Salary Period',
    'Job URL',
    'Saved Date',
    'Applied Date',
    'Last Activity',
    'Created At',
    'Updated At',
    'Status Timeline',
    'RIASEC Fit Score',
    'RIASEC Matched Types',
    'SOC Code',
    'BLS Median Wage',
    'Match Score',
    'Contacts Count',
    'Documents Count',
    'Notes',
    'Follow Up Due',
    'Snoozed Until',
  ];

  // Build rows
  const rows = applications.map((app) => {
    return [
      escapeCSVField(app.id),
      escapeCSVField(app.companyName),
      escapeCSVField(app.roleName),
      escapeCSVField(app.status),
      escapeCSVField(app.location),
      escapeCSVField(app.locationType),
      escapeCSVField(app.department),
      escapeCSVField(app.salary?.min),
      escapeCSVField(app.salary?.max),
      escapeCSVField(app.salary?.currency),
      escapeCSVField(app.salary?.period),
      escapeCSVField(app.jobUrl),
      escapeCSVField(formatDateTime(app.savedAt)),
      escapeCSVField(formatDateTime(app.appliedAt)),
      escapeCSVField(formatDateTime(app.lastActivityAt)),
      escapeCSVField(formatDateTime(app.createdAt)),
      escapeCSVField(formatDateTime(app.updatedAt)),
      escapeCSVField(formatStatusHistory(app.statusHistory)),
      escapeCSVField(app.riasecFitScore),
      escapeCSVField(formatRiasecTypes(app.matchedRiasecTypes)),
      escapeCSVField(app.socCode),
      escapeCSVField(app.blsMarketData?.medianWageAnnual),
      escapeCSVField(app.analysis?.overallScore),
      escapeCSVField(app.contacts?.length || 0),
      escapeCSVField(app.documents?.length || 0),
      escapeCSVField(app.notes),
      escapeCSVField(formatDateTime(app.followUpDue)),
      escapeCSVField(formatDateTime(app.snoozedUntil)),
    ];
  });

  // Combine: comments + headers + rows
  const csvLines = [...headerComments, headers.join(','), ...rows.map((row) => row.join(','))];

  return csvLines.join('\n');
}

/**
 * Export applications to simple CSV (basic columns only, for spreadsheet use)
 */
export function exportApplicationsToSimpleCSV(applications: JobApplication[]): string {
  // Simple headers without comments
  const headers = [
    'Company',
    'Role',
    'Status',
    'Location',
    'Location Type',
    'Department',
    'Salary',
    'Job URL',
    'Saved Date',
    'Applied Date',
    'Last Activity',
    'Notes',
    'Match Score',
    'Days in Status',
  ];

  // Build rows
  const rows = applications.map((app) => {
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(app.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    return [
      escapeCSVField(app.companyName),
      escapeCSVField(app.roleName),
      escapeCSVField(app.status),
      escapeCSVField(app.location),
      escapeCSVField(app.locationType),
      escapeCSVField(app.department),
      escapeCSVField(formatSalary(app.salary)),
      escapeCSVField(app.jobUrl),
      escapeCSVField(formatDate(app.savedAt)),
      escapeCSVField(formatDateTime(app.appliedAt)),
      escapeCSVField(formatDate(app.lastActivityAt)),
      escapeCSVField(app.notes),
      escapeCSVField(app.analysis?.overallScore),
      escapeCSVField(daysSinceActivity),
    ];
  });

  const csvLines = [headers.join(','), ...rows.map((row) => row.join(','))];

  return csvLines.join('\n');
}

/**
 * Trigger browser download of CSV file
 */
export function downloadCSV(csvContent: string, filename: string = 'job-applications.csv'): void {
  // Add BOM for Excel UTF-8 compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Export applications with full data and trigger download
 */
export function exportAndDownload(applications: JobApplication[]): void {
  const csv = exportApplicationsToCSV(applications);
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `tenure-jobs-full-${timestamp}.csv`;
  downloadCSV(csv, filename);
}

/**
 * Export applications with simple data and trigger download
 */
export function exportSimpleAndDownload(applications: JobApplication[]): void {
  const csv = exportApplicationsToSimpleCSV(applications);
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `job-applications-${timestamp}.csv`;
  downloadCSV(csv, filename);
}
