/**
 * Resume Export Service
 *
 * Exports resumes to various formats (TXT, PDF, DOCX).
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import type { MasterResume, ResumeVariant } from '../../../../schemas/prepare.schema';
import type { WorkExperience } from '../../../../schemas/pipeline.schema';

// ============================================================================
// TYPES
// ============================================================================

export type ExportFormat = 'txt' | 'pdf' | 'docx';

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeContactInfo?: boolean;
}

export interface ResumeData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  experiences: {
    company: string;
    title: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    bullets: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    field?: string;
    graduationDate?: string;
    gpa?: string;
  }[];
  skills: string[];
  certifications: string[];
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(date: Date | string | undefined): string {
  if (!date) return '';
  if (typeof date === 'string') return date;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Convert MasterResume to common ResumeData format
 */
export function masterResumeToData(resume: MasterResume): ResumeData {
  return {
    summary: resume.parsedSections.summary,
    experiences: resume.parsedSections.experience.map((exp: WorkExperience) => ({
      company: exp.company,
      title: exp.title,
      startDate: formatDate(exp.startDate),
      endDate: exp.endDate ? formatDate(exp.endDate) : 'Present',
      location: exp.location,
      bullets: exp.bulletPoints || [],
    })),
    education: resume.parsedSections.education.map((edu) => ({
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      graduationDate: formatDate(edu.graduationDate),
      gpa: edu.gpa?.toString(),
    })),
    skills: resume.parsedSections.skills,
    certifications: resume.parsedSections.certifications,
  };
}

/**
 * Convert ResumeVariant to common ResumeData format
 * Note: Variants store references to master resume experiences
 */
export function variantToData(variant: ResumeVariant, masterResume: MasterResume): ResumeData {
  // Get included experiences from master
  const experiences = variant.includedExperiences
    .map((inc) => {
      const masterExp = masterResume.parsedSections.experience.find(
        (e) => e.id === inc.experienceId
      );
      if (!masterExp) return null;
      return {
        company: masterExp.company,
        title: masterExp.title,
        startDate: formatDate(masterExp.startDate),
        endDate: masterExp.endDate ? formatDate(masterExp.endDate) : 'Present',
        location: masterExp.location,
        bullets: inc.customBullets || masterExp.bulletPoints || [],
      };
    })
    .filter(Boolean) as ResumeData['experiences'];

  return {
    summary:
      variant.customSummary || variant.aiGeneratedSummary || masterResume.parsedSections.summary,
    experiences,
    education: masterResume.parsedSections.education.map((edu) => ({
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      graduationDate: formatDate(edu.graduationDate),
      gpa: edu.gpa?.toString(),
    })),
    skills: variant.includedSkills,
    certifications: masterResume.parsedSections.certifications,
  };
}

// ============================================================================
// TXT EXPORT
// ============================================================================

function generateTxt(data: ResumeData): string {
  const lines: string[] = [];
  const separator = '═'.repeat(60);
  const sectionLine = '─'.repeat(40);

  // Header
  if (data.name) {
    lines.push(data.name.toUpperCase());
    lines.push(separator);
    lines.push('');
  }

  if (data.email || data.phone || data.location) {
    const contact = [data.email, data.phone, data.location].filter(Boolean).join(' | ');
    lines.push(contact);
    lines.push('');
  }

  // Summary
  if (data.summary) {
    lines.push('PROFESSIONAL SUMMARY');
    lines.push(sectionLine);
    lines.push(data.summary);
    lines.push('');
  }

  // Experience
  if (data.experiences.length > 0) {
    lines.push('PROFESSIONAL EXPERIENCE');
    lines.push(sectionLine);

    for (const exp of data.experiences) {
      lines.push(`${exp.title}`);
      lines.push(`${exp.company}${exp.location ? ` | ${exp.location}` : ''}`);
      lines.push(`${exp.startDate} - ${exp.endDate}`);
      lines.push('');

      for (const bullet of exp.bullets) {
        lines.push(`  • ${bullet}`);
      }
      lines.push('');
    }
  }

  // Education
  if (data.education.length > 0) {
    lines.push('EDUCATION');
    lines.push(sectionLine);

    for (const edu of data.education) {
      lines.push(`${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`);
      lines.push(`${edu.institution}${edu.graduationDate ? ` | ${edu.graduationDate}` : ''}`);
      if (edu.gpa) lines.push(`GPA: ${edu.gpa}`);
      lines.push('');
    }
  }

  // Skills
  if (data.skills.length > 0) {
    lines.push('SKILLS');
    lines.push(sectionLine);
    lines.push(data.skills.join(' • '));
    lines.push('');
  }

  // Certifications
  if (data.certifications.length > 0) {
    lines.push('CERTIFICATIONS');
    lines.push(sectionLine);
    for (const cert of data.certifications) {
      lines.push(`• ${cert}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================================
// PDF EXPORT (using browser print)
// ============================================================================

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function generatePdfHtml(data: ResumeData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Resume</title>
  <style>
    @page { margin: 0.5in; size: letter; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #333;
      padding: 0.5in;
    }
    .header { text-align: center; margin-bottom: 20px; }
    .name { font-size: 24pt; font-weight: bold; letter-spacing: 2px; color: #1a1a1a; }
    .contact { font-size: 10pt; color: #666; margin-top: 8px; }
    .section { margin-bottom: 16px; }
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 1px solid #333;
      padding-bottom: 4px;
      margin-bottom: 10px;
      color: #1a1a1a;
    }
    .summary { font-style: italic; color: #444; }
    .job { margin-bottom: 14px; }
    .job-header { display: flex; justify-content: space-between; align-items: baseline; }
    .job-title { font-weight: bold; font-size: 11pt; }
    .job-company { font-style: italic; }
    .job-dates { font-size: 10pt; color: #666; }
    .job-bullets { margin-left: 16px; margin-top: 6px; }
    .job-bullets li { margin-bottom: 3px; }
    .edu-item { margin-bottom: 10px; }
    .edu-degree { font-weight: bold; }
    .edu-school { font-style: italic; }
    .skills { line-height: 1.6; }
    .skill-tag { 
      display: inline-block; 
      background: #f0f0f0; 
      padding: 2px 8px; 
      margin: 2px 4px 2px 0;
      border-radius: 3px;
      font-size: 10pt;
    }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    ${data.name ? `<div class="name">${escapeHtml(data.name)}</div>` : ''}
    ${
      data.email || data.phone || data.location
        ? `
      <div class="contact">
        ${[data.email, data.phone, data.location].filter(Boolean).join(' | ')}
      </div>
    `
        : ''
    }
  </div>

  ${
    data.summary
      ? `
    <div class="section">
      <div class="section-title">Professional Summary</div>
      <div class="summary">${escapeHtml(data.summary)}</div>
    </div>
  `
      : ''
  }

  ${
    data.experiences.length > 0
      ? `
    <div class="section">
      <div class="section-title">Professional Experience</div>
      ${data.experiences
        .map(
          (exp) => `
        <div class="job">
          <div class="job-header">
            <div>
              <span class="job-title">${escapeHtml(exp.title)}</span>
              <span class="job-company"> — ${escapeHtml(exp.company)}${exp.location ? `, ${escapeHtml(exp.location)}` : ''}</span>
            </div>
            <div class="job-dates">${exp.startDate} – ${exp.endDate}</div>
          </div>
          ${
            exp.bullets.length > 0
              ? `
            <ul class="job-bullets">
              ${exp.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
            </ul>
          `
              : ''
          }
        </div>
      `
        )
        .join('')}
    </div>
  `
      : ''
  }

  ${
    data.education.length > 0
      ? `
    <div class="section">
      <div class="section-title">Education</div>
      ${data.education
        .map(
          (edu) => `
        <div class="edu-item">
          <span class="edu-degree">${escapeHtml(edu.degree)}${edu.field ? ` in ${escapeHtml(edu.field)}` : ''}</span>
          <br>
          <span class="edu-school">${escapeHtml(edu.institution)}</span>
          ${edu.graduationDate ? ` — ${edu.graduationDate}` : ''}
          ${edu.gpa ? `<br>GPA: ${edu.gpa}` : ''}
        </div>
      `
        )
        .join('')}
    </div>
  `
      : ''
  }

  ${
    data.skills.length > 0
      ? `
    <div class="section">
      <div class="section-title">Skills</div>
      <div class="skills">
        ${data.skills.map((s) => `<span class="skill-tag">${escapeHtml(s)}</span>`).join('')}
      </div>
    </div>
  `
      : ''
  }

  ${
    data.certifications.length > 0
      ? `
    <div class="section">
      <div class="section-title">Certifications</div>
      <ul>
        ${data.certifications.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}
      </ul>
    </div>
  `
      : ''
  }
</body>
</html>`;
}

// ============================================================================
// EXPORT SERVICE
// ============================================================================

export class ExportService {
  /**
   * Export a master resume
   */
  async exportMasterResume(resume: MasterResume, options: ExportOptions): Promise<void> {
    const data = masterResumeToData(resume);
    const filename = options.filename || `resume-${Date.now()}`;
    await this.export(data, filename, options.format);
  }

  /**
   * Export a variant resume
   */
  async exportVariant(
    variant: ResumeVariant,
    masterResume: MasterResume,
    options: ExportOptions
  ): Promise<void> {
    const data = variantToData(variant, masterResume);
    const filename =
      options.filename || `resume-${variant.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
    await this.export(data, filename, options.format);
  }

  /**
   * Core export logic
   */
  private async export(data: ResumeData, filename: string, format: ExportFormat): Promise<void> {
    switch (format) {
      case 'txt':
        this.downloadTxt(data, filename);
        break;
      case 'pdf':
        this.downloadPdf(data, filename);
        break;
      case 'docx':
        this.downloadDocx(data, filename);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private downloadTxt(data: ResumeData, filename: string): void {
    const content = generateTxt(data);
    const blob = new Blob([content], { type: 'text/plain' });
    this.triggerDownload(blob, `${filename}.txt`);
  }

  private downloadPdf(data: ResumeData, filename: string): void {
    const html = generatePdfHtml(data);

    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Could not open print window. Please allow popups.');
    }

    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to load then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Note: Can't auto-close because user might want to save as PDF via print dialog
      }, 250);
    };
  }

  private downloadDocx(_data: ResumeData, _filename: string): void {
    // DOCX generation requires external library (docx or similar)
    // For now, show a message to use the PDF option and save as PDF
    throw new Error(
      'DOCX export coming soon! For now, use PDF export and save as PDF from the print dialog.'
    );
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Singleton instance
export const exportService = new ExportService();
