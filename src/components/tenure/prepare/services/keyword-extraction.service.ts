/**
 * Keyword Extraction Service v2 - Industry-Agnostic
 * 
 * Combines wink-nlp (POS tagging, NER) and keyword-extractor (stopword removal)
 * to extract keywords from job descriptions and resumes.
 * 
 * THIS VERSION IS INDUSTRY-AGNOSTIC - Works for tech, healthcare, construction,
 * hospitality, sales, politics, marketing, etc.
 * 
 * Uses O*NET universal taxonomy for skill/knowledge matching.
 * 
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import winkNLP from 'wink-nlp';
import model from 'wink-eng-lite-web-model';
import keywordExtractor from 'keyword-extractor';
import { ONET_SKILLS, ONET_KNOWLEDGE, findMatchingSkill, findMatchingKnowledge } from '../../../../data/onet-taxonomy';

// ============================================================================
// TYPES
// ============================================================================

export interface ExtractedKeywords {
  skills: string[];          // O*NET universal skills (communication, critical thinking, etc)
  knowledge: string[];       // O*NET knowledge areas (medicine, law, engineering, etc)
  tools: string[];           // Tools, software, equipment (domain-neutral extraction)
  requirements: string[];    // Experience requirements (5+ years, Bachelor's degree, etc)
  raw: string[];             // All extracted terms (for debugging)
}

export interface KeywordExtractionOptions {
  removeDigits?: boolean;
  lowercase?: boolean;
  extractPhrases?: boolean;
  minLength?: number;
}

// ============================================================================
// NLP INITIALIZATION
// ============================================================================

let nlpInstance: ReturnType<typeof winkNLP> | null = null;
let nlpIts: any = null;

function initializeNLP() {
  if (!nlpInstance) {
    nlpInstance = winkNLP(model);
    nlpIts = nlpInstance.its;
  }
  return { nlp: nlpInstance, its: nlpIts };
}

// ============================================================================
// KEYWORD EXTRACTION (Industry-Agnostic)
// ============================================================================

/**
 * Extract keywords from job description or resume text
 * 
 * This function is INDUSTRY-AGNOSTIC - it doesn't assume tech/software.
 * It extracts nouns, entities, and phrases, then matches against O*NET taxonomy.
 */
export function extractKeywords(
  text: string,
  options: KeywordExtractionOptions = {}
): ExtractedKeywords {
  const {
    removeDigits = false,
    lowercase = true,
    extractPhrases = true,
    minLength = 3,
  } = options;

  // Initialize NLP
  const { nlp, its } = initializeNLP();

  // Step 1: Basic keyword extraction using keyword-extractor
  const basicKeywords = keywordExtractor.extract(text, {
    language: 'english',
    remove_digits: removeDigits,
    return_changed_case: lowercase,
    return_chained_words: extractPhrases,
  }) as string[];

  // Filter by minimum length
  const filteredBasicKeywords = basicKeywords.filter((kw) => kw.length >= minLength);

  // Step 2: NLP-based extraction using wink-nlp
  const doc = nlp.readDoc(text);

  // Extract nouns (likely to be skills/tools/technologies - DOMAIN NEUTRAL)
  const nouns = doc
    .tokens()
    .filter((t: any) => {
      const pos = t.out(its.pos);
      return pos === 'NOUN' || pos === 'PROPN';
    })
    .out();

  // Extract named entities (companies, technologies, etc - DOMAIN NEUTRAL)
  const entities = doc.entities().out(its.detail);

  // Extract n-grams for multi-word phrases (DOMAIN NEUTRAL)
  const bigrams = doc.tokens().out(its.bigram);
  const trigrams = doc.tokens().out(its.trigram);

  // Step 3: Combine all sources and deduplicate
  const allKeywords = new Set<string>([
    ...filteredBasicKeywords,
    ...nouns,
    ...entities.map((e: any) => e.value || ''),
    ...bigrams,
    ...trigrams,
  ]);

  // Remove empty strings and normalize
  const normalizedKeywords = Array.from(allKeywords)
    .map((kw) => kw.trim().toLowerCase())
    .filter((kw) => kw.length >= minLength);

  // Step 4: Categorize keywords using O*NET taxonomy
  const categorized = categorizeKeywords(normalizedKeywords);

  return categorized;
}

/**
 * Categorize keywords using O*NET universal taxonomy
 * 
 * This is INDUSTRY-AGNOSTIC - matches against 35 universal skills and 33 knowledge areas
 */
function categorizeKeywords(keywords: string[]): ExtractedKeywords {
  const skills: string[] = [];
  const knowledge: string[] = [];
  const tools: string[] = [];
  const requirements: string[] = [];

  for (const keyword of keywords) {
    // Check if it's a requirement pattern (e.g., "5+ years", "bachelor's degree")
    if (isRequirement(keyword)) {
      requirements.push(keyword);
      continue;
    }

    // Match against O*NET Skills (universal - all industries)
    const matchedSkill = findMatchingSkill(keyword);
    if (matchedSkill) {
      skills.push(matchedSkill.name);
      continue;
    }

    // Match against O*NET Knowledge (identifies industry/domain)
    const matchedKnowledge = findMatchingKnowledge(keyword);
    if (matchedKnowledge) {
      knowledge.push(matchedKnowledge.name);
      continue;
    }

    // If it looks like a tool/software/equipment, categorize as tool
    if (isToolKeyword(keyword)) {
      tools.push(keyword);
      continue;
    }

    // Default: add to tools (industry-specific items will fall here)
    tools.push(keyword);
  }

  return {
    skills: [...new Set(skills)],
    knowledge: [...new Set(knowledge)],
    tools: [...new Set(tools)],
    requirements: [...new Set(requirements)],
    raw: keywords,
  };
}

/**
 * Check if keyword matches requirement patterns
 */
function isRequirement(keyword: string): boolean {
  const requirementPatterns = [
    /\d+\+?\s*(years?|yrs?)/i,             // "5+ years", "3 yrs"
    /bachelor'?s?|master'?s?|phd|degree/i,  // Degrees
    /experience (with|in)/i,                 // "experience with"
    /\d+\s*to\s*\d+/,                        // "3 to 5"
    /certification|certified|license/i,      // Certifications
  ];

  return requirementPatterns.some((pattern) => pattern.test(keyword));
}

/**
 * Heuristic: Check if keyword looks like a tool/software/equipment
 * 
 * DOMAIN NEUTRAL - doesn't assume tech tools
 */
function isToolKeyword(keyword: string): boolean {
  const toolPatterns = [
    /software|system|platform|application/i,  // Software
    /tool|equipment|machine|device/i,          // Equipment
    /crm|erp|pos|ehr|emr/i,                    // Common acronyms (any domain)
  ];

  return toolPatterns.some((pattern) => pattern.test(keyword));
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract years of experience from text
 * e.g., "5+ years", "3-5 years" → { min: 5, max: null } or { min: 3, max: 5 }
 */
export function extractYearsOfExperience(
  text: string
): { min: number; max: number | null } | null {
  const patterns = [
    /(\d+)\+\s*(years?|yrs?)/i,             // "5+ years"
    /(\d+)\s*-\s*(\d+)\s*(years?|yrs?)/i,   // "3-5 years"
    /(\d+)\s*to\s*(\d+)\s*(years?|yrs?)/i,  // "3 to 5 years"
    /(\d+)\s*(years?|yrs?)/i,               // "5 years"
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[2] && !isNaN(Number(match[2]))) {
        // Range: "3-5 years" or "3 to 5 years"
        return { min: Number(match[1]), max: Number(match[2]) };
      } else {
        // Single value: "5+ years" or "5 years"
        return { min: Number(match[1]), max: null };
      }
    }
  }

  return null;
}

/**
 * Normalize skill name for comparison
 * e.g., "React.js" → "react", "Node.JS" → "node"
 */
export function normalizeSkill(skill: string): string {
  return skill
    .toLowerCase()
    .replace(/\.js$/i, '')    // Remove .js suffix
    .replace(/[^\w\s]/g, '')  // Remove special chars
    .trim();
}

/**
 * Check if two skills are similar (fuzzy match)
 */
export function areSimilarSkills(skill1: string, skill2: string): boolean {
  const normalized1 = normalizeSkill(skill1);
  const normalized2 = normalizeSkill(skill2);

  // Exact match after normalization
  if (normalized1 === normalized2) {
    return true;
  }

  // Check if one contains the other (e.g., "postgres" and "postgresql")
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return true;
  }

  // Levenshtein distance for fuzzy matching
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  const similarity = 1 - distance / maxLength;

  return similarity >= 0.8; // 80% similar
}

/**
 * Levenshtein distance (edit distance) between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
