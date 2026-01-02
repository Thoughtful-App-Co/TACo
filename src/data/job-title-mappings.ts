/**
 * Job Title to SOC Code Mappings
 *
 * Maps common job titles (especially those not directly represented in O*NET)
 * to their most appropriate Standard Occupational Classification (SOC) codes.
 *
 * This bridges the gap between industry job titles and government occupational
 * classifications, enabling better labor market data matching.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SocMapping {
  /** SOC/O*NET code (e.g., "15-1252.00") */
  socCode: string;
  /** Official O*NET occupation title */
  title: string;
  /** How well this mapping matches the job title */
  confidence: 'high' | 'medium' | 'low';
  /** Why this mapping was chosen */
  rationale?: string;
}

export interface JobTitleEntry {
  /** Primary mappings for this job title */
  mappings: SocMapping[];
  /** Alternative spellings/variations of this title */
  aliases?: string[];
  /** Category for grouping */
  category:
    | 'tech'
    | 'business'
    | 'design'
    | 'data'
    | 'marketing'
    | 'finance'
    | 'operations'
    | 'hr'
    | 'healthcare'
    | 'education'
    | 'legal'
    | 'trades'
    | 'manufacturing'
    | 'hospitality'
    | 'logistics'
    | 'retail'
    | 'realestate'
    | 'creative'
    | 'socialservices'
    | 'government'
    | 'science'
    | 'other';
}

// ============================================================================
// JOB TITLE MAPPINGS
// ============================================================================

/**
 * Comprehensive mapping of job titles to SOC codes.
 * Keys are lowercase, normalized job titles.
 */
export const JOB_TITLE_MAPPINGS: Record<string, JobTitleEntry> = {
  // =========================================================================
  // PRODUCT & PROJECT MANAGEMENT
  // =========================================================================
  'product manager': {
    category: 'business',
    aliases: ['pm', 'product lead', 'product owner'],
    mappings: [
      {
        socCode: '11-2021.00',
        title: 'Marketing Managers',
        confidence: 'high',
        rationale:
          'Product managers often align with marketing manager responsibilities for product strategy',
      },
      {
        socCode: '15-1299.09',
        title: 'Information Technology Project Managers',
        confidence: 'medium',
        rationale: 'Tech product managers share project management responsibilities',
      },
      {
        socCode: '11-1021.00',
        title: 'General and Operations Managers',
        confidence: 'medium',
        rationale: 'Senior product managers often have operational responsibilities',
      },
    ],
  },
  'technical product manager': {
    category: 'tech',
    aliases: ['technical pm', 'tpm'],
    mappings: [
      {
        socCode: '15-1299.09',
        title: 'Information Technology Project Managers',
        confidence: 'high',
        rationale: 'Technical PMs align closely with IT project management',
      },
      {
        socCode: '11-3021.00',
        title: 'Computer and Information Systems Managers',
        confidence: 'medium',
        rationale: 'Often involves systems-level decision making',
      },
    ],
  },
  'project manager': {
    category: 'business',
    aliases: ['program manager'],
    mappings: [
      {
        socCode: '13-1082.00',
        title: 'Project Management Specialists',
        confidence: 'high',
        rationale: 'Direct SOC match for project management',
      },
      {
        socCode: '15-1299.09',
        title: 'Information Technology Project Managers',
        confidence: 'high',
        rationale: 'IT-specific project management',
      },
    ],
  },
  'scrum master': {
    category: 'tech',
    aliases: ['agile coach', 'agile scrum master'],
    mappings: [
      {
        socCode: '13-1082.00',
        title: 'Project Management Specialists',
        confidence: 'high',
        rationale: 'Scrum masters are specialized project facilitators',
      },
      {
        socCode: '15-1299.09',
        title: 'Information Technology Project Managers',
        confidence: 'medium',
        rationale: 'Often works in IT contexts',
      },
    ],
  },

  // =========================================================================
  // SOFTWARE ENGINEERING
  // =========================================================================
  'software engineer': {
    category: 'tech',
    aliases: ['software developer', 'programmer', 'coder', 'swe'],
    mappings: [
      {
        socCode: '15-1252.00',
        title: 'Software Developers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'frontend engineer': {
    category: 'tech',
    aliases: [
      'front-end developer',
      'frontend developer',
      'ui developer',
      'react developer',
      'vue developer',
      'angular developer',
    ],
    mappings: [
      {
        socCode: '15-1252.00',
        title: 'Software Developers',
        confidence: 'high',
        rationale: 'Frontend is a specialization of software development',
      },
      {
        socCode: '15-1254.00',
        title: 'Web Developers',
        confidence: 'high',
        rationale: 'Web development focus',
      },
    ],
  },
  'backend engineer': {
    category: 'tech',
    aliases: ['back-end developer', 'backend developer', 'server developer', 'api developer'],
    mappings: [
      {
        socCode: '15-1252.00',
        title: 'Software Developers',
        confidence: 'high',
        rationale: 'Backend is a specialization of software development',
      },
    ],
  },
  'full stack engineer': {
    category: 'tech',
    aliases: ['fullstack developer', 'full-stack developer', 'full stack developer'],
    mappings: [
      {
        socCode: '15-1252.00',
        title: 'Software Developers',
        confidence: 'high',
        rationale: 'Full stack combines frontend and backend development',
      },
      {
        socCode: '15-1254.00',
        title: 'Web Developers',
        confidence: 'medium',
        rationale: 'Often focused on web applications',
      },
    ],
  },
  'mobile engineer': {
    category: 'tech',
    aliases: ['mobile developer', 'ios developer', 'android developer', 'app developer'],
    mappings: [
      {
        socCode: '15-1252.00',
        title: 'Software Developers',
        confidence: 'high',
        rationale: 'Mobile is a specialization of software development',
      },
    ],
  },
  'devops engineer': {
    category: 'tech',
    aliases: ['site reliability engineer', 'sre', 'platform engineer', 'infrastructure engineer'],
    mappings: [
      {
        socCode: '15-1244.00',
        title: 'Network and Computer Systems Administrators',
        confidence: 'high',
        rationale: 'DevOps involves systems administration and infrastructure',
      },
      {
        socCode: '15-1252.00',
        title: 'Software Developers',
        confidence: 'medium',
        rationale: 'DevOps involves significant software automation',
      },
    ],
  },
  'cloud engineer': {
    category: 'tech',
    aliases: ['cloud architect', 'aws engineer', 'azure engineer', 'gcp engineer'],
    mappings: [
      {
        socCode: '15-1244.00',
        title: 'Network and Computer Systems Administrators',
        confidence: 'high',
        rationale: 'Cloud engineering is systems administration in the cloud',
      },
      {
        socCode: '15-1241.00',
        title: 'Computer Network Architects',
        confidence: 'medium',
        rationale: 'Cloud architecture involves network design',
      },
    ],
  },
  'security engineer': {
    category: 'tech',
    aliases: ['cybersecurity engineer', 'infosec engineer', 'application security engineer'],
    mappings: [
      {
        socCode: '15-1212.00',
        title: 'Information Security Analysts',
        confidence: 'high',
        rationale: 'Direct match for security roles',
      },
      {
        socCode: '15-1299.05',
        title: 'Information Security Engineers',
        confidence: 'high',
        rationale: 'Specific security engineering role',
      },
    ],
  },
  'qa engineer': {
    category: 'tech',
    aliases: ['quality assurance engineer', 'test engineer', 'sdet', 'automation engineer'],
    mappings: [
      {
        socCode: '15-1253.00',
        title: 'Software Quality Assurance Analysts and Testers',
        confidence: 'high',
        rationale: 'Direct SOC match for QA',
      },
    ],
  },
  'machine learning engineer': {
    category: 'tech',
    aliases: ['ml engineer', 'ai engineer', 'deep learning engineer'],
    mappings: [
      {
        socCode: '15-2051.00',
        title: 'Data Scientists',
        confidence: 'high',
        rationale: 'ML engineering is closely related to data science',
      },
      {
        socCode: '15-1252.00',
        title: 'Software Developers',
        confidence: 'medium',
        rationale: 'ML engineers write production software',
      },
    ],
  },

  // =========================================================================
  // DATA ROLES
  // =========================================================================
  'data scientist': {
    category: 'data',
    aliases: ['data science', 'senior data scientist'],
    mappings: [
      {
        socCode: '15-2051.00',
        title: 'Data Scientists',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'data analyst': {
    category: 'data',
    aliases: ['business analyst', 'analytics analyst', 'reporting analyst'],
    mappings: [
      {
        socCode: '15-2051.01',
        title: 'Business Intelligence Analysts',
        confidence: 'high',
        rationale: 'Data analysis for business intelligence',
      },
      {
        socCode: '13-1161.00',
        title: 'Market Research Analysts and Marketing Specialists',
        confidence: 'medium',
        rationale: 'Market-focused data analysis',
      },
    ],
  },
  'data engineer': {
    category: 'data',
    aliases: ['etl developer', 'data pipeline engineer', 'big data engineer'],
    mappings: [
      {
        socCode: '15-1243.00',
        title: 'Database Architects',
        confidence: 'high',
        rationale: 'Data engineers design data systems',
      },
      {
        socCode: '15-1252.00',
        title: 'Software Developers',
        confidence: 'medium',
        rationale: 'Data engineering involves software development',
      },
    ],
  },
  'database administrator': {
    category: 'data',
    aliases: ['dba', 'database engineer'],
    mappings: [
      {
        socCode: '15-1242.00',
        title: 'Database Administrators',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'business intelligence analyst': {
    category: 'data',
    aliases: ['bi analyst', 'bi developer', 'tableau developer', 'power bi developer'],
    mappings: [
      {
        socCode: '15-2051.01',
        title: 'Business Intelligence Analysts',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },

  // =========================================================================
  // DESIGN ROLES
  // =========================================================================
  'ux designer': {
    category: 'design',
    aliases: ['user experience designer', 'ux/ui designer', 'experience designer'],
    mappings: [
      {
        socCode: '15-1255.00',
        title: 'Web and Digital Interface Designers',
        confidence: 'high',
        rationale: 'UX design is digital interface design',
      },
      {
        socCode: '27-1021.00',
        title: 'Commercial and Industrial Designers',
        confidence: 'medium',
        rationale: 'Product design principles apply',
      },
    ],
  },
  'ui designer': {
    category: 'design',
    aliases: ['user interface designer', 'visual designer', 'interface designer'],
    mappings: [
      {
        socCode: '15-1255.00',
        title: 'Web and Digital Interface Designers',
        confidence: 'high',
        rationale: 'Direct match for UI design',
      },
      {
        socCode: '27-1024.00',
        title: 'Graphic Designers',
        confidence: 'medium',
        rationale: 'Visual design aspects',
      },
    ],
  },
  'product designer': {
    category: 'design',
    aliases: ['digital product designer'],
    mappings: [
      {
        socCode: '15-1255.00',
        title: 'Web and Digital Interface Designers',
        confidence: 'high',
        rationale: 'Product design for digital products',
      },
      {
        socCode: '27-1021.00',
        title: 'Commercial and Industrial Designers',
        confidence: 'medium',
        rationale: 'General product design principles',
      },
    ],
  },
  'graphic designer': {
    category: 'design',
    aliases: ['visual designer', 'brand designer'],
    mappings: [
      {
        socCode: '27-1024.00',
        title: 'Graphic Designers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'ux researcher': {
    category: 'design',
    aliases: ['user researcher', 'design researcher', 'usability researcher'],
    mappings: [
      {
        socCode: '19-3022.00',
        title: 'Survey Researchers',
        confidence: 'medium',
        rationale: 'Research methodology overlap',
      },
      {
        socCode: '15-1255.00',
        title: 'Web and Digital Interface Designers',
        confidence: 'medium',
        rationale: 'Research informs design',
      },
    ],
  },

  // =========================================================================
  // MARKETING ROLES
  // =========================================================================
  'marketing manager': {
    category: 'marketing',
    aliases: ['head of marketing', 'marketing lead'],
    mappings: [
      {
        socCode: '11-2021.00',
        title: 'Marketing Managers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'digital marketing manager': {
    category: 'marketing',
    aliases: ['online marketing manager', 'growth marketing manager'],
    mappings: [
      {
        socCode: '11-2021.00',
        title: 'Marketing Managers',
        confidence: 'high',
        rationale: 'Digital is a channel within marketing management',
      },
      {
        socCode: '13-1161.01',
        title: 'Search Marketing Strategists',
        confidence: 'medium',
        rationale: 'Digital marketing includes search',
      },
    ],
  },
  'content marketing manager': {
    category: 'marketing',
    aliases: ['content strategist', 'content manager'],
    mappings: [
      {
        socCode: '11-2021.00',
        title: 'Marketing Managers',
        confidence: 'high',
        rationale: 'Content marketing is a marketing discipline',
      },
      {
        socCode: '27-3041.00',
        title: 'Editors',
        confidence: 'medium',
        rationale: 'Content creation and editing',
      },
    ],
  },
  'seo specialist': {
    category: 'marketing',
    aliases: ['seo manager', 'seo analyst', 'search engine optimization'],
    mappings: [
      {
        socCode: '13-1161.01',
        title: 'Search Marketing Strategists',
        confidence: 'high',
        rationale: 'Direct match for SEO',
      },
    ],
  },
  'growth hacker': {
    category: 'marketing',
    aliases: ['growth marketer', 'growth manager'],
    mappings: [
      {
        socCode: '13-1161.00',
        title: 'Market Research Analysts and Marketing Specialists',
        confidence: 'high',
        rationale: 'Growth marketing involves market analysis',
      },
      {
        socCode: '11-2021.00',
        title: 'Marketing Managers',
        confidence: 'medium',
        rationale: 'Growth involves marketing strategy',
      },
    ],
  },

  // =========================================================================
  // LEADERSHIP / EXECUTIVE ROLES
  // =========================================================================
  cto: {
    category: 'tech',
    aliases: ['chief technology officer', 'chief technical officer', 'vp of engineering'],
    mappings: [
      {
        socCode: '11-3021.00',
        title: 'Computer and Information Systems Managers',
        confidence: 'high',
        rationale: 'CTOs are senior IT/technology managers',
      },
      {
        socCode: '11-1011.00',
        title: 'Chief Executives',
        confidence: 'medium',
        rationale: 'C-level executive role',
      },
    ],
  },
  ceo: {
    category: 'business',
    aliases: ['chief executive officer', 'founder', 'co-founder'],
    mappings: [
      {
        socCode: '11-1011.00',
        title: 'Chief Executives',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  cfo: {
    category: 'finance',
    aliases: ['chief financial officer', 'vp of finance'],
    mappings: [
      {
        socCode: '11-3031.00',
        title: 'Financial Managers',
        confidence: 'high',
        rationale: 'CFOs are senior financial managers',
      },
      {
        socCode: '11-1011.00',
        title: 'Chief Executives',
        confidence: 'medium',
        rationale: 'C-level executive role',
      },
    ],
  },
  coo: {
    category: 'operations',
    aliases: ['chief operating officer', 'vp of operations'],
    mappings: [
      {
        socCode: '11-1021.00',
        title: 'General and Operations Managers',
        confidence: 'high',
        rationale: 'COOs are senior operations managers',
      },
      {
        socCode: '11-1011.00',
        title: 'Chief Executives',
        confidence: 'medium',
        rationale: 'C-level executive role',
      },
    ],
  },
  'engineering manager': {
    category: 'tech',
    aliases: ['software engineering manager', 'dev manager', 'development manager'],
    mappings: [
      {
        socCode: '11-3021.00',
        title: 'Computer and Information Systems Managers',
        confidence: 'high',
        rationale: 'Engineering managers are IT/systems managers',
      },
    ],
  },
  'technical lead': {
    category: 'tech',
    aliases: ['tech lead', 'team lead', 'staff engineer', 'principal engineer'],
    mappings: [
      {
        socCode: '15-1252.00',
        title: 'Software Developers',
        confidence: 'high',
        rationale: 'Tech leads are senior developers',
      },
      {
        socCode: '11-3021.00',
        title: 'Computer and Information Systems Managers',
        confidence: 'medium',
        rationale: 'Often has management responsibilities',
      },
    ],
  },

  // =========================================================================
  // HR / PEOPLE ROLES
  // =========================================================================
  recruiter: {
    category: 'hr',
    aliases: ['talent acquisition', 'technical recruiter', 'sourcer'],
    mappings: [
      {
        socCode: '13-1071.00',
        title: 'Human Resources Specialists',
        confidence: 'high',
        rationale: 'Recruiting is an HR function',
      },
    ],
  },
  'hr manager': {
    category: 'hr',
    aliases: ['human resources manager', 'people manager', 'people operations manager'],
    mappings: [
      {
        socCode: '11-3121.00',
        title: 'Human Resources Managers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },

  // =========================================================================
  // FINANCE ROLES
  // =========================================================================
  'financial analyst': {
    category: 'finance',
    aliases: ['finance analyst', 'fp&a analyst'],
    mappings: [
      {
        socCode: '13-2051.00',
        title: 'Financial and Investment Analysts',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  accountant: {
    category: 'finance',
    aliases: ['staff accountant', 'senior accountant', 'cpa'],
    mappings: [
      {
        socCode: '13-2011.00',
        title: 'Accountants and Auditors',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },

  // =========================================================================
  // SALES / CUSTOMER SUCCESS
  // =========================================================================
  'sales representative': {
    category: 'business',
    aliases: ['sales rep', 'account executive', 'ae', 'sales associate'],
    mappings: [
      {
        socCode: '41-3091.00',
        title:
          'Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel',
        confidence: 'high',
        rationale: 'General sales role',
      },
      {
        socCode: '41-4011.00',
        title:
          'Sales Representatives, Wholesale and Manufacturing, Technical and Scientific Products',
        confidence: 'medium',
        rationale: 'Technical sales',
      },
    ],
  },
  'customer success manager': {
    category: 'business',
    aliases: ['csm', 'customer success', 'client success manager'],
    mappings: [
      {
        socCode: '43-4051.00',
        title: 'Customer Service Representatives',
        confidence: 'medium',
        rationale: 'Customer-facing role',
      },
      {
        socCode: '11-2022.00',
        title: 'Sales Managers',
        confidence: 'medium',
        rationale: 'Retention and growth focus',
      },
    ],
  },
  'sales manager': {
    category: 'business',
    aliases: ['head of sales', 'vp of sales', 'sales director'],
    mappings: [
      {
        socCode: '11-2022.00',
        title: 'Sales Managers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },

  // =========================================================================
  // SUPPORT / OPERATIONS
  // =========================================================================
  'technical support': {
    category: 'tech',
    aliases: ['tech support', 'it support', 'help desk', 'support engineer'],
    mappings: [
      {
        socCode: '15-1232.00',
        title: 'Computer User Support Specialists',
        confidence: 'high',
        rationale: 'Direct SOC match for tech support',
      },
    ],
  },
  'systems administrator': {
    category: 'tech',
    aliases: ['sysadmin', 'system administrator', 'it administrator'],
    mappings: [
      {
        socCode: '15-1244.00',
        title: 'Network and Computer Systems Administrators',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'network engineer': {
    category: 'tech',
    aliases: ['network administrator', 'network architect'],
    mappings: [
      {
        socCode: '15-1241.00',
        title: 'Computer Network Architects',
        confidence: 'high',
        rationale: 'Direct SOC match for network roles',
      },
      {
        socCode: '15-1244.00',
        title: 'Network and Computer Systems Administrators',
        confidence: 'high',
        rationale: 'Network administration',
      },
    ],
  },

  // =========================================================================
  // HEALTHCARE
  // =========================================================================
  'registered nurse': {
    category: 'healthcare',
    aliases: ['nurse', 'rn', 'staff nurse', 'bedside nurse'],
    mappings: [
      {
        socCode: '29-1141.00',
        title: 'Registered Nurses',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'licensed practical nurse': {
    category: 'healthcare',
    aliases: ['lpn', 'lvn', 'licensed vocational nurse'],
    mappings: [
      {
        socCode: '29-2061.00',
        title: 'Licensed Practical and Licensed Vocational Nurses',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'nurse practitioner': {
    category: 'healthcare',
    aliases: ['np', 'aprn', 'advanced practice registered nurse'],
    mappings: [
      {
        socCode: '29-1171.00',
        title: 'Nurse Practitioners',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'medical assistant': {
    category: 'healthcare',
    aliases: ['ma', 'clinical assistant', 'medical office assistant'],
    mappings: [
      {
        socCode: '31-9092.00',
        title: 'Medical Assistants',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  physician: {
    category: 'healthcare',
    aliases: ['doctor', 'md', 'medical doctor', 'attending physician'],
    mappings: [
      {
        socCode: '29-1216.00',
        title: 'General Internal Medicine Physicians',
        confidence: 'high',
        rationale: 'Common physician specialty',
      },
      {
        socCode: '29-1215.00',
        title: 'Family Medicine Physicians',
        confidence: 'high',
        rationale: 'Primary care physician',
      },
      {
        socCode: '29-1228.00',
        title: 'Physicians, All Other',
        confidence: 'high',
        rationale: 'General physician category',
      },
    ],
  },
  pharmacist: {
    category: 'healthcare',
    aliases: ['clinical pharmacist', 'retail pharmacist', 'hospital pharmacist'],
    mappings: [
      {
        socCode: '29-1051.00',
        title: 'Pharmacists',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'physical therapist': {
    category: 'healthcare',
    aliases: ['pt', 'physiotherapist', 'physical therapy'],
    mappings: [
      {
        socCode: '29-1123.00',
        title: 'Physical Therapists',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'dental hygienist': {
    category: 'healthcare',
    aliases: ['hygienist', 'rdh', 'registered dental hygienist'],
    mappings: [
      {
        socCode: '29-1292.00',
        title: 'Dental Hygienists',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'medical technologist': {
    category: 'healthcare',
    aliases: ['lab tech', 'clinical laboratory technologist', 'medical lab technologist', 'mlt'],
    mappings: [
      {
        socCode: '29-2011.00',
        title: 'Medical and Clinical Laboratory Technologists',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'emergency medical technician': {
    category: 'healthcare',
    aliases: ['emt', 'paramedic', 'emt-b', 'emt-p', 'first responder'],
    mappings: [
      {
        socCode: '29-2042.00',
        title: 'Emergency Medical Technicians',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'home health aide': {
    category: 'healthcare',
    aliases: ['hha', 'home care aide', 'personal care aide'],
    mappings: [
      {
        socCode: '31-1121.00',
        title: 'Home Health Aides',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'certified nursing assistant': {
    category: 'healthcare',
    aliases: ['cna', 'nursing assistant', 'nurse aide', 'patient care technician'],
    mappings: [
      {
        socCode: '31-1131.00',
        title: 'Nursing Assistants',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },

  // =========================================================================
  // EDUCATION
  // =========================================================================
  teacher: {
    category: 'education',
    aliases: ['school teacher', 'classroom teacher', 'educator'],
    mappings: [
      {
        socCode: '25-2021.00',
        title: 'Elementary School Teachers, Except Special Education',
        confidence: 'high',
        rationale: 'Common teaching level',
      },
      {
        socCode: '25-2031.00',
        title: 'Secondary School Teachers, Except Special and Career/Technical Education',
        confidence: 'high',
        rationale: 'Secondary education teaching',
      },
    ],
  },
  'elementary school teacher': {
    category: 'education',
    aliases: ['primary school teacher', 'grade school teacher'],
    mappings: [
      {
        socCode: '25-2021.00',
        title: 'Elementary School Teachers, Except Special Education',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'middle school teacher': {
    category: 'education',
    aliases: ['junior high teacher'],
    mappings: [
      {
        socCode: '25-2022.00',
        title: 'Middle School Teachers, Except Special and Career/Technical Education',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'high school teacher': {
    category: 'education',
    aliases: ['secondary school teacher'],
    mappings: [
      {
        socCode: '25-2031.00',
        title: 'Secondary School Teachers, Except Special and Career/Technical Education',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  professor: {
    category: 'education',
    aliases: ['college professor', 'university professor', 'faculty', 'lecturer'],
    mappings: [
      {
        socCode: '25-1099.00',
        title: 'Postsecondary Teachers, All Other',
        confidence: 'high',
        rationale: 'General postsecondary teaching',
      },
    ],
  },
  'instructional designer': {
    category: 'education',
    aliases: ['curriculum designer', 'learning designer', 'instructional coordinator'],
    mappings: [
      {
        socCode: '25-9031.00',
        title: 'Instructional Coordinators',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  tutor: {
    category: 'education',
    aliases: ['private tutor', 'academic tutor', 'tutoring'],
    mappings: [
      {
        socCode: '25-3041.00',
        title: 'Tutors',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  principal: {
    category: 'education',
    aliases: ['school principal', 'school administrator', 'head of school', 'headmaster'],
    mappings: [
      {
        socCode: '11-9032.00',
        title: 'Education Administrators, Kindergarten through Secondary',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'teaching assistant': {
    category: 'education',
    aliases: ['teacher aide', 'instructional aide', 'paraprofessional', 'para'],
    mappings: [
      {
        socCode: '25-9042.00',
        title:
          'Teaching Assistants, Preschool, Elementary, Middle, and Secondary School, Except Special Education',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  librarian: {
    category: 'education',
    aliases: ['school librarian', 'media specialist', 'library media specialist'],
    mappings: [
      {
        socCode: '25-4022.00',
        title: 'Librarians and Media Collections Specialists',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'special education teacher': {
    category: 'education',
    aliases: ['sped teacher', 'special ed teacher', 'resource teacher'],
    mappings: [
      {
        socCode: '25-2051.00',
        title: 'Special Education Teachers, Preschool',
        confidence: 'medium',
        rationale: 'Preschool special education',
      },
      {
        socCode: '25-2052.00',
        title: 'Special Education Teachers, Kindergarten and Elementary School',
        confidence: 'high',
        rationale: 'Elementary special education',
      },
      {
        socCode: '25-2057.00',
        title: 'Special Education Teachers, Middle School',
        confidence: 'high',
        rationale: 'Middle school special education',
      },
      {
        socCode: '25-2058.00',
        title: 'Special Education Teachers, Secondary School',
        confidence: 'high',
        rationale: 'Secondary special education',
      },
    ],
  },
  'school counselor': {
    category: 'education',
    aliases: ['guidance counselor', 'academic counselor', 'career counselor'],
    mappings: [
      {
        socCode: '21-1012.00',
        title: 'Educational, Guidance, and Career Counselors and Advisors',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },

  // =========================================================================
  // LEGAL
  // =========================================================================
  lawyer: {
    category: 'legal',
    aliases: ['attorney', 'attorney at law', 'counsel', 'legal counsel'],
    mappings: [
      {
        socCode: '23-1011.00',
        title: 'Lawyers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  paralegal: {
    category: 'legal',
    aliases: ['legal assistant', 'litigation paralegal', 'corporate paralegal'],
    mappings: [
      {
        socCode: '23-2011.00',
        title: 'Paralegals and Legal Assistants',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'legal secretary': {
    category: 'legal',
    aliases: ['legal administrative assistant', 'law firm secretary'],
    mappings: [
      {
        socCode: '43-6012.00',
        title: 'Legal Secretaries and Administrative Assistants',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'compliance officer': {
    category: 'legal',
    aliases: ['compliance manager', 'compliance analyst', 'regulatory compliance'],
    mappings: [
      {
        socCode: '13-1041.00',
        title: 'Compliance Officers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  judge: {
    category: 'legal',
    aliases: ['magistrate', 'justice', 'judicial officer'],
    mappings: [
      {
        socCode: '23-1023.00',
        title: 'Judges, Magistrate Judges, and Magistrates',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'court reporter': {
    category: 'legal',
    aliases: ['stenographer', 'court stenographer', 'simultaneous captioner'],
    mappings: [
      {
        socCode: '23-2091.00',
        title: 'Court Reporters and Simultaneous Captioners',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },

  // =========================================================================
  // TRADES / CONSTRUCTION
  // =========================================================================
  electrician: {
    category: 'trades',
    aliases: ['electrical technician', 'journeyman electrician', 'master electrician'],
    mappings: [
      {
        socCode: '47-2111.00',
        title: 'Electricians',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  plumber: {
    category: 'trades',
    aliases: ['pipefitter', 'steamfitter', 'journeyman plumber', 'master plumber'],
    mappings: [
      {
        socCode: '47-2152.00',
        title: 'Plumbers, Pipefitters, and Steamfitters',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  carpenter: {
    category: 'trades',
    aliases: ['finish carpenter', 'framing carpenter', 'journeyman carpenter'],
    mappings: [
      {
        socCode: '47-2031.00',
        title: 'Carpenters',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'hvac technician': {
    category: 'trades',
    aliases: ['hvac', 'hvac installer', 'hvac mechanic', 'heating and cooling technician'],
    mappings: [
      {
        socCode: '49-9021.00',
        title: 'Heating, Air Conditioning, and Refrigeration Mechanics and Installers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  welder: {
    category: 'trades',
    aliases: ['certified welder', 'mig welder', 'tig welder', 'pipe welder'],
    mappings: [
      {
        socCode: '51-4121.00',
        title: 'Welders, Cutters, Solderers, and Brazers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  mechanic: {
    category: 'trades',
    aliases: ['auto mechanic', 'automotive technician', 'car mechanic', 'ase certified'],
    mappings: [
      {
        socCode: '49-3023.00',
        title: 'Automotive Service Technicians and Mechanics',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'construction manager': {
    category: 'trades',
    aliases: ['site manager', 'construction superintendent', 'project superintendent'],
    mappings: [
      {
        socCode: '11-9021.00',
        title: 'Construction Managers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'general contractor': {
    category: 'trades',
    aliases: ['gc', 'contractor', 'construction foreman', 'construction supervisor'],
    mappings: [
      {
        socCode: '47-1011.00',
        title: 'First-Line Supervisors of Construction Trades and Extraction Workers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  painter: {
    category: 'trades',
    aliases: ['house painter', 'commercial painter', 'construction painter'],
    mappings: [
      {
        socCode: '47-2141.00',
        title: 'Painters, Construction and Maintenance',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  roofer: {
    category: 'trades',
    aliases: ['roofing contractor', 'roof installer'],
    mappings: [
      {
        socCode: '47-2181.00',
        title: 'Roofers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },

  // =========================================================================
  // MANUFACTURING
  // =========================================================================
  'machine operator': {
    category: 'manufacturing',
    aliases: ['production operator', 'manufacturing operator', 'equipment operator'],
    mappings: [
      {
        socCode: '51-9199.00',
        title: 'Production Workers, All Other',
        confidence: 'high',
        rationale: 'General production worker category',
      },
    ],
  },
  'cnc operator': {
    category: 'manufacturing',
    aliases: ['cnc machinist', 'cnc programmer', 'cnc technician'],
    mappings: [
      {
        socCode: '51-4011.00',
        title: 'Computer Numerically Controlled Tool Operators',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'quality inspector': {
    category: 'manufacturing',
    aliases: ['quality control', 'qc inspector', 'quality technician', 'qa inspector'],
    mappings: [
      {
        socCode: '51-9061.00',
        title: 'Inspectors, Testers, Sorters, Samplers, and Weighers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'production supervisor': {
    category: 'manufacturing',
    aliases: ['production manager', 'manufacturing supervisor', 'shift supervisor'],
    mappings: [
      {
        socCode: '51-1011.00',
        title: 'First-Line Supervisors of Production and Operating Workers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  assembler: {
    category: 'manufacturing',
    aliases: ['assembly worker', 'production assembler', 'manufacturing assembler'],
    mappings: [
      {
        socCode: '51-2098.00',
        title: 'Miscellaneous Assemblers and Fabricators',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'maintenance technician': {
    category: 'manufacturing',
    aliases: ['maintenance mechanic', 'industrial maintenance', 'facilities technician'],
    mappings: [
      {
        socCode: '49-9071.00',
        title: 'Maintenance and Repair Workers, General',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'plant manager': {
    category: 'manufacturing',
    aliases: ['factory manager', 'manufacturing manager', 'operations manager'],
    mappings: [
      {
        socCode: '11-3051.00',
        title: 'Industrial Production Managers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'process engineer': {
    category: 'manufacturing',
    aliases: ['manufacturing engineer', 'industrial engineer', 'production engineer'],
    mappings: [
      {
        socCode: '17-2112.00',
        title: 'Industrial Engineers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'forklift operator': {
    category: 'manufacturing',
    aliases: ['forklift driver', 'lift operator', 'material handler'],
    mappings: [
      {
        socCode: '53-7051.00',
        title: 'Industrial Truck and Tractor Operators',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },

  // =========================================================================
  // HOSPITALITY
  // =========================================================================
  chef: {
    category: 'hospitality',
    aliases: ['head chef', 'executive chef', 'sous chef', 'kitchen manager'],
    mappings: [
      {
        socCode: '35-1011.00',
        title: 'Chefs and Head Cooks',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'line cook': {
    category: 'hospitality',
    aliases: ['cook', 'prep cook', 'restaurant cook', 'short order cook'],
    mappings: [
      {
        socCode: '35-2014.00',
        title: 'Cooks, Restaurant',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  server: {
    category: 'hospitality',
    aliases: ['waiter', 'waitress', 'food server', 'wait staff'],
    mappings: [
      {
        socCode: '35-3031.00',
        title: 'Waiters and Waitresses',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  bartender: {
    category: 'hospitality',
    aliases: ['bar tender', 'mixologist', 'barkeep'],
    mappings: [
      {
        socCode: '35-3011.00',
        title: 'Bartenders',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'hotel manager': {
    category: 'hospitality',
    aliases: ['lodging manager', 'resort manager', 'motel manager', 'inn keeper'],
    mappings: [
      {
        socCode: '11-9081.00',
        title: 'Lodging Managers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'front desk agent': {
    category: 'hospitality',
    aliases: ['hotel front desk', 'front desk clerk', 'guest services agent', 'receptionist'],
    mappings: [
      {
        socCode: '43-4081.00',
        title: 'Hotel, Motel, and Resort Desk Clerks',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'event planner': {
    category: 'hospitality',
    aliases: ['event coordinator', 'meeting planner', 'wedding planner', 'conference planner'],
    mappings: [
      {
        socCode: '13-1121.00',
        title: 'Meeting, Convention, and Event Planners',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'restaurant manager': {
    category: 'hospitality',
    aliases: ['food service manager', 'dining manager', 'f&b manager'],
    mappings: [
      {
        socCode: '11-9051.00',
        title: 'Food Service Managers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  housekeeper: {
    category: 'hospitality',
    aliases: ['room attendant', 'hotel housekeeper', 'housekeeping'],
    mappings: [
      {
        socCode: '37-2012.00',
        title: 'Maids and Housekeeping Cleaners',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  concierge: {
    category: 'hospitality',
    aliases: ['guest services', 'hotel concierge'],
    mappings: [
      {
        socCode: '39-6012.00',
        title: 'Concierges',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },

  // =========================================================================
  // LOGISTICS / SUPPLY CHAIN
  // =========================================================================
  'warehouse manager': {
    category: 'logistics',
    aliases: ['distribution manager', 'warehouse supervisor', 'fulfillment manager'],
    mappings: [
      {
        socCode: '11-3071.00',
        title: 'Transportation, Storage, and Distribution Managers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'logistics coordinator': {
    category: 'logistics',
    aliases: ['logistics specialist', 'logistics analyst', 'supply chain coordinator'],
    mappings: [
      {
        socCode: '13-1081.00',
        title: 'Logisticians',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'supply chain manager': {
    category: 'logistics',
    aliases: ['supply chain director', 'distribution manager', 'logistics manager'],
    mappings: [
      {
        socCode: '11-3071.00',
        title: 'Transportation, Storage, and Distribution Managers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'truck driver': {
    category: 'logistics',
    aliases: ['cdl driver', 'semi driver', 'tractor trailer driver', 'otr driver', 'trucker'],
    mappings: [
      {
        socCode: '53-3032.00',
        title: 'Heavy and Tractor-Trailer Truck Drivers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'delivery driver': {
    category: 'logistics',
    aliases: ['courier', 'package delivery', 'route driver', 'delivery person'],
    mappings: [
      {
        socCode: '53-3033.00',
        title: 'Light Truck Drivers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'warehouse associate': {
    category: 'logistics',
    aliases: ['warehouse worker', 'warehouse hand', 'distribution associate', 'picker packer'],
    mappings: [
      {
        socCode: '53-7062.00',
        title: 'Laborers and Freight, Stock, and Material Movers, Hand',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'shipping coordinator': {
    category: 'logistics',
    aliases: ['shipping clerk', 'receiving clerk', 'shipping and receiving'],
    mappings: [
      {
        socCode: '43-5071.00',
        title: 'Shipping, Receiving, and Inventory Clerks',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  dispatcher: {
    category: 'logistics',
    aliases: ['logistics dispatcher', 'truck dispatcher', 'transportation dispatcher'],
    mappings: [
      {
        socCode: '43-5032.00',
        title: 'Dispatchers, Except Police, Fire, and Ambulance',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'inventory manager': {
    category: 'logistics',
    aliases: ['inventory control', 'stock manager', 'inventory specialist'],
    mappings: [
      {
        socCode: '43-5081.00',
        title: 'Stock Clerks and Order Fillers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'procurement specialist': {
    category: 'logistics',
    aliases: ['buyer', 'purchasing agent', 'procurement manager', 'purchasing specialist'],
    mappings: [
      {
        socCode: '13-1023.00',
        title: 'Purchasing Agents, Except Wholesale, Retail, and Farm Products',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },

  // =========================================================================
  // RETAIL
  // =========================================================================
  'store manager': {
    category: 'retail',
    aliases: ['retail manager', 'shop manager', 'branch manager'],
    mappings: [
      {
        socCode: '41-1011.00',
        title: 'First-Line Supervisors of Retail Sales Workers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  cashier: {
    category: 'retail',
    aliases: ['checker', 'register operator', 'front end cashier'],
    mappings: [
      {
        socCode: '41-2011.00',
        title: 'Cashiers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'retail associate': {
    category: 'retail',
    aliases: ['sales associate', 'retail sales', 'sales clerk', 'store associate'],
    mappings: [
      {
        socCode: '41-2031.00',
        title: 'Retail Salespersons',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  merchandiser: {
    category: 'retail',
    aliases: ['visual merchandiser', 'retail merchandiser', 'window dresser'],
    mappings: [
      {
        socCode: '27-1026.00',
        title: 'Merchandise Displayers and Window Trimmers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'retail buyer': {
    category: 'retail',
    aliases: ['buyer', 'wholesale buyer', 'purchasing buyer'],
    mappings: [
      {
        socCode: '13-1022.00',
        title: 'Wholesale and Retail Buyers, Except Farm Products',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'loss prevention': {
    category: 'retail',
    aliases: ['loss prevention officer', 'asset protection', 'security officer', 'lp'],
    mappings: [
      {
        socCode: '33-9099.00',
        title: 'Protective Service Workers, All Other',
        confidence: 'high',
        rationale: 'Loss prevention falls under protective services',
      },
    ],
  },

  // =========================================================================
  // REAL ESTATE
  // =========================================================================
  'real estate agent': {
    category: 'realestate',
    aliases: ['realtor', 'real estate sales agent', 'buyer agent', 'listing agent'],
    mappings: [
      {
        socCode: '41-9022.00',
        title: 'Real Estate Sales Agents',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'real estate broker': {
    category: 'realestate',
    aliases: ['broker', 'managing broker', 'principal broker'],
    mappings: [
      {
        socCode: '41-9021.00',
        title: 'Real Estate Brokers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'property manager': {
    category: 'realestate',
    aliases: ['apartment manager', 'community manager', 'building manager', 'hoa manager'],
    mappings: [
      {
        socCode: '11-9141.00',
        title: 'Property, Real Estate, and Community Association Managers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'mortgage loan officer': {
    category: 'realestate',
    aliases: ['loan officer', 'mortgage banker', 'mortgage originator', 'mlo'],
    mappings: [
      {
        socCode: '13-2072.00',
        title: 'Loan Officers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'real estate appraiser': {
    category: 'realestate',
    aliases: ['appraiser', 'property appraiser', 'assessor'],
    mappings: [
      {
        socCode: '13-2023.00',
        title: 'Appraisers and Assessors of Real Estate',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'leasing agent': {
    category: 'realestate',
    aliases: ['leasing consultant', 'leasing specialist', 'apartment leasing'],
    mappings: [
      {
        socCode: '41-9022.00',
        title: 'Real Estate Sales Agents',
        confidence: 'high',
        rationale: 'Leasing agents are specialized real estate agents',
      },
    ],
  },

  // =========================================================================
  // CREATIVE / MEDIA
  // =========================================================================
  writer: {
    category: 'creative',
    aliases: ['content writer', 'author', 'freelance writer', 'staff writer'],
    mappings: [
      {
        socCode: '27-3043.00',
        title: 'Writers and Authors',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  journalist: {
    category: 'creative',
    aliases: ['reporter', 'news reporter', 'correspondent', 'news analyst'],
    mappings: [
      {
        socCode: '27-3023.00',
        title: 'News Analysts, Reporters, and Journalists',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  photographer: {
    category: 'creative',
    aliases: ['professional photographer', 'commercial photographer', 'portrait photographer'],
    mappings: [
      {
        socCode: '27-4021.00',
        title: 'Photographers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  videographer: {
    category: 'creative',
    aliases: ['video editor', 'camera operator', 'video producer'],
    mappings: [
      {
        socCode: '27-4032.00',
        title: 'Film and Video Editors',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  copywriter: {
    category: 'creative',
    aliases: ['advertising copywriter', 'creative copywriter', 'copy editor'],
    mappings: [
      {
        socCode: '27-3043.00',
        title: 'Writers and Authors',
        confidence: 'high',
        rationale: 'Copywriting is a writing specialization',
      },
    ],
  },
  'social media manager': {
    category: 'creative',
    aliases: ['social media coordinator', 'social media specialist', 'community manager'],
    mappings: [
      {
        socCode: '27-3031.00',
        title: 'Public Relations Specialists',
        confidence: 'high',
        rationale: 'Social media management is a PR function',
      },
    ],
  },
  'public relations specialist': {
    category: 'creative',
    aliases: ['pr specialist', 'publicist', 'communications specialist', 'media relations'],
    mappings: [
      {
        socCode: '27-3031.00',
        title: 'Public Relations Specialists',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  animator: {
    category: 'creative',
    aliases: ['3d animator', '2d animator', 'motion graphics artist', 'vfx artist'],
    mappings: [
      {
        socCode: '27-1014.00',
        title: 'Special Effects Artists and Animators',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'video producer': {
    category: 'creative',
    aliases: ['producer', 'content producer', 'media producer', 'film producer'],
    mappings: [
      {
        socCode: '27-2012.00',
        title: 'Producers and Directors',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  podcaster: {
    category: 'creative',
    aliases: ['podcast host', 'podcast producer', 'radio host'],
    mappings: [
      {
        socCode: '27-3011.00',
        title: 'Broadcast Announcers and Radio Disc Jockeys',
        confidence: 'high',
        rationale: 'Closest match for audio broadcasting',
      },
    ],
  },

  // =========================================================================
  // SOCIAL SERVICES
  // =========================================================================
  'social worker': {
    category: 'socialservices',
    aliases: ['clinical social worker', 'lcsw', 'msw', 'licensed social worker'],
    mappings: [
      {
        socCode: '21-1021.00',
        title: 'Child, Family, and School Social Workers',
        confidence: 'high',
        rationale: 'Common social work specialization',
      },
      {
        socCode: '21-1022.00',
        title: 'Healthcare Social Workers',
        confidence: 'high',
        rationale: 'Healthcare social work specialization',
      },
    ],
  },
  'mental health counselor': {
    category: 'socialservices',
    aliases: ['counselor', 'therapist', 'lpc', 'licensed professional counselor'],
    mappings: [
      {
        socCode: '21-1014.00',
        title: 'Mental Health Counselors',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  psychotherapist: {
    category: 'socialservices',
    aliases: ['therapist', 'psychologist', 'clinical psychologist'],
    mappings: [
      {
        socCode: '21-1014.00',
        title: 'Mental Health Counselors',
        confidence: 'high',
        rationale: 'Psychotherapy is a counseling function',
      },
      {
        socCode: '19-3031.00',
        title: 'Clinical and Counseling Psychologists',
        confidence: 'high',
        rationale: 'Direct match for psychologists',
      },
    ],
  },
  'case manager': {
    category: 'socialservices',
    aliases: ['case coordinator', 'case worker', 'client services coordinator'],
    mappings: [
      {
        socCode: '21-1093.00',
        title: 'Social and Human Service Assistants',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'community health worker': {
    category: 'socialservices',
    aliases: ['health educator', 'outreach worker', 'community outreach'],
    mappings: [
      {
        socCode: '21-1094.00',
        title: 'Community Health Workers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'substance abuse counselor': {
    category: 'socialservices',
    aliases: ['addiction counselor', 'drug counselor', 'chemical dependency counselor'],
    mappings: [
      {
        socCode: '21-1011.00',
        title: 'Substance Abuse and Behavioral Disorder Counselors',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'marriage and family therapist': {
    category: 'socialservices',
    aliases: ['family therapist', 'marriage counselor', 'couples therapist', 'mft', 'lmft'],
    mappings: [
      {
        socCode: '21-1013.00',
        title: 'Marriage and Family Therapists',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'youth worker': {
    category: 'socialservices',
    aliases: ['youth counselor', 'youth specialist', 'youth advocate'],
    mappings: [
      {
        socCode: '21-1093.00',
        title: 'Social and Human Service Assistants',
        confidence: 'high',
        rationale: 'Youth work falls under human services',
      },
    ],
  },

  // =========================================================================
  // GOVERNMENT / PUBLIC SECTOR
  // =========================================================================
  'police officer': {
    category: 'government',
    aliases: ['cop', 'law enforcement officer', 'patrol officer', 'deputy'],
    mappings: [
      {
        socCode: '33-3051.00',
        title: "Police and Sheriff's Patrol Officers",
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  firefighter: {
    category: 'government',
    aliases: ['fire fighter', 'fireman', 'fire rescue'],
    mappings: [
      {
        socCode: '33-2011.00',
        title: 'Firefighters',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'urban planner': {
    category: 'government',
    aliases: ['city planner', 'regional planner', 'town planner', 'community planner'],
    mappings: [
      {
        socCode: '19-3051.00',
        title: 'Urban and Regional Planners',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'public administrator': {
    category: 'government',
    aliases: ['government administrator', 'city administrator', 'public sector manager'],
    mappings: [
      {
        socCode: '11-1011.00',
        title: 'Chief Executives',
        confidence: 'medium',
        rationale: 'Public sector executive',
      },
      {
        socCode: '11-1021.00',
        title: 'General and Operations Managers',
        confidence: 'high',
        rationale: 'Government operations management',
      },
    ],
  },
  'policy analyst': {
    category: 'government',
    aliases: ['government analyst', 'public policy analyst', 'legislative analyst'],
    mappings: [
      {
        socCode: '13-1199.00',
        title: 'Business Operations Specialists, All Other',
        confidence: 'high',
        rationale: 'Policy analysis is a specialized operations role',
      },
    ],
  },
  'park ranger': {
    category: 'government',
    aliases: ['forest ranger', 'wildlife officer', 'conservation officer'],
    mappings: [
      {
        socCode: '33-3031.00',
        title: 'Fish and Game Wardens',
        confidence: 'high',
        rationale: 'Wildlife and park enforcement',
      },
      {
        socCode: '33-9092.00',
        title: 'Lifeguards, Ski Patrol, and Other Recreational Protective Service Workers',
        confidence: 'medium',
        rationale: 'Recreational protective services',
      },
    ],
  },
  'postal worker': {
    category: 'government',
    aliases: ['mail carrier', 'letter carrier', 'mailman', 'usps carrier'],
    mappings: [
      {
        socCode: '43-5052.00',
        title: 'Postal Service Mail Carriers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },

  // =========================================================================
  // SCIENCE / RESEARCH
  // =========================================================================
  'research scientist': {
    category: 'science',
    aliases: ['scientist', 'senior scientist', 'principal scientist', 'staff scientist'],
    mappings: [
      {
        socCode: '19-1099.00',
        title: 'Life Scientists, All Other',
        confidence: 'high',
        rationale: 'General life science research',
      },
      {
        socCode: '19-2099.00',
        title: 'Physical Scientists, All Other',
        confidence: 'high',
        rationale: 'General physical science research',
      },
    ],
  },
  'lab technician': {
    category: 'science',
    aliases: ['laboratory technician', 'research technician', 'lab assistant'],
    mappings: [
      {
        socCode: '19-4099.00',
        title: 'Life, Physical, and Social Science Technicians, All Other',
        confidence: 'high',
        rationale: 'General lab technician category',
      },
    ],
  },
  biologist: {
    category: 'science',
    aliases: ['biological scientist', 'life scientist', 'microbiologist'],
    mappings: [
      {
        socCode: '19-1029.00',
        title: 'Biological Scientists, All Other',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  chemist: {
    category: 'science',
    aliases: ['analytical chemist', 'organic chemist', 'research chemist'],
    mappings: [
      {
        socCode: '19-2031.00',
        title: 'Chemists',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'environmental scientist': {
    category: 'science',
    aliases: ['environmental specialist', 'environmental analyst', 'ecologist'],
    mappings: [
      {
        socCode: '19-2041.00',
        title: 'Environmental Scientists and Specialists, Including Health',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  geologist: {
    category: 'science',
    aliases: ['geoscientist', 'earth scientist', 'petroleum geologist'],
    mappings: [
      {
        socCode: '19-2042.00',
        title: 'Geoscientists, Except Hydrologists and Geographers',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
  'research assistant': {
    category: 'science',
    aliases: ['research associate', 'lab assistant', 'research aide'],
    mappings: [
      {
        socCode: '19-4061.00',
        title: 'Social Science Research Assistants',
        confidence: 'high',
        rationale: 'Direct SOC match',
      },
    ],
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize a job title for lookup.
 * Converts to lowercase and trims whitespace.
 */
function normalizeTitle(title: string): string {
  return title.toLowerCase().trim();
}

/**
 * Search for SOC mappings by job title.
 * Checks exact matches first, then aliases.
 *
 * @param query - The job title to search for
 * @returns Array of matching entries with their source titles
 */
export function searchJobTitleMappings(query: string): Array<{
  jobTitle: string;
  entry: JobTitleEntry;
  matchType: 'exact' | 'alias' | 'partial';
}> {
  const normalized = normalizeTitle(query);
  const results: Array<{
    jobTitle: string;
    entry: JobTitleEntry;
    matchType: 'exact' | 'alias' | 'partial';
  }> = [];

  for (const [jobTitle, entry] of Object.entries(JOB_TITLE_MAPPINGS)) {
    // Check exact match
    if (normalizeTitle(jobTitle) === normalized) {
      results.push({ jobTitle, entry, matchType: 'exact' });
      continue;
    }

    // Check aliases
    if (entry.aliases?.some((alias) => normalizeTitle(alias) === normalized)) {
      results.push({ jobTitle, entry, matchType: 'alias' });
      continue;
    }

    // Check partial match (query is contained in title or vice versa)
    if (
      normalizeTitle(jobTitle).includes(normalized) ||
      normalized.includes(normalizeTitle(jobTitle))
    ) {
      results.push({ jobTitle, entry, matchType: 'partial' });
      continue;
    }

    // Check partial match on aliases
    if (
      entry.aliases?.some(
        (alias) =>
          normalizeTitle(alias).includes(normalized) || normalized.includes(normalizeTitle(alias))
      )
    ) {
      results.push({ jobTitle, entry, matchType: 'partial' });
    }
  }

  // Sort: exact matches first, then alias matches, then partial matches
  return results.sort((a, b) => {
    const order = { exact: 0, alias: 1, partial: 2 };
    return order[a.matchType] - order[b.matchType];
  });
}

/**
 * Get all SOC codes from mappings that match a query.
 * Returns unique SOC codes with their highest confidence level.
 *
 * @param query - The job title to search for
 * @returns Array of SOC mappings, deduplicated by SOC code
 */
export function getSocCodesForJobTitle(query: string): SocMapping[] {
  const matches = searchJobTitleMappings(query);
  const socMap = new Map<string, SocMapping>();

  for (const match of matches) {
    for (const mapping of match.entry.mappings) {
      const existing = socMap.get(mapping.socCode);
      if (!existing) {
        socMap.set(mapping.socCode, mapping);
      } else {
        // Keep the higher confidence mapping
        const confidenceOrder = { high: 0, medium: 1, low: 2 };
        if (confidenceOrder[mapping.confidence] < confidenceOrder[existing.confidence]) {
          socMap.set(mapping.socCode, mapping);
        }
      }
    }
  }

  // Sort by confidence
  return Array.from(socMap.values()).sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.confidence] - order[b.confidence];
  });
}

/**
 * Get all unique categories in the mappings.
 */
export function getAllCategories(): string[] {
  const categories = new Set<string>();
  for (const entry of Object.values(JOB_TITLE_MAPPINGS)) {
    categories.add(entry.category);
  }
  return Array.from(categories).sort();
}

/**
 * Get all job titles in a specific category.
 */
export function getJobTitlesByCategory(category: string): string[] {
  return Object.entries(JOB_TITLE_MAPPINGS)
    .filter(([, entry]) => entry.category === category)
    .map(([title]) => title)
    .sort();
}
