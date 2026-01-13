/**
 * Skill Matcher Service v2 - Industry-Agnostic
 *
 * Normalizes and matches skills between job descriptions and resumes.
 * Uses O*NET taxonomy for universal skill standardization.
 *
 * Works for ALL industries, not just tech.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { normalizeSkill, areSimilarSkills } from './keyword-extraction.service';
import { ONET_SKILLS, ONET_KNOWLEDGE } from '../../../../data/onet-taxonomy';

// ============================================================================
// TYPES
// ============================================================================

export type MatchType = 'exact' | 'fuzzy' | 'semantic' | 'synonym' | 'none';

export interface SkillMatch {
  keyword: string; // The keyword from JD
  matchedTo: string | null; // What it matched in resume (null if no match)
  matchType: MatchType;
  confidence: number; // 0-100
}

export interface SkillMatchResult {
  matches: SkillMatch[];
  matchedKeywords: string[];
  missingKeywords: string[];
  matchScore: number; // 0-100
}

// ============================================================================
// UNIVERSAL SKILL SYNONYMS (Cross-Industry)
// ============================================================================

const SKILL_SYNONYMS: Record<string, string[]> = {
  // Universal Skills (from O*NET)
  communication: ['communicating', 'communicate', 'verbal', 'written communication'],
  leadership: ['leading', 'lead', 'management', 'supervise', 'mentor'],
  collaboration: ['collaborate', 'teamwork', 'team player', 'cooperative'],
  'problem solving': ['problem-solving', 'analytical', 'troubleshooting', 'critical thinking'],
  'time management': ['prioritization', 'organization', 'scheduling'],
  'customer service': ['client service', 'customer care', 'guest services'],

  // Education
  bachelor: ['bachelors', 'bs', 'ba', 'undergraduate'],
  master: ['masters', 'ms', 'ma', 'mba', 'graduate'],
  doctorate: ['phd', 'doctoral'],

  // Common abbreviations (cross-industry)
  management: ['mgmt', 'admin', 'administration'],
  experience: ['exp', 'background'],
};

// Build reverse lookup for synonyms
const SYNONYM_MAP = new Map<string, string>();
for (const [canonical, synonyms] of Object.entries(SKILL_SYNONYMS)) {
  SYNONYM_MAP.set(canonical, canonical);
  for (const synonym of synonyms) {
    SYNONYM_MAP.set(synonym, canonical);
  }
}

// ============================================================================
// SKILL MATCHING
// ============================================================================

/**
 * Match job description keywords against resume keywords
 */
export function matchSkills(jdKeywords: string[], resumeKeywords: string[]): SkillMatchResult {
  const matches: SkillMatch[] = [];
  const matchedJDKeywords: string[] = [];
  const missingKeywords: string[] = [];

  // Normalize all resume keywords once
  const normalizedResumeKeywords = resumeKeywords.map((kw) => ({
    original: kw,
    normalized: normalizeSkill(kw),
    canonical: getCanonicalSkill(kw),
  }));

  // Match each JD keyword
  for (const jdKeyword of jdKeywords) {
    const normalizedJD = normalizeSkill(jdKeyword);
    const canonicalJD = getCanonicalSkill(jdKeyword);

    let bestMatch: SkillMatch = {
      keyword: jdKeyword,
      matchedTo: null,
      matchType: 'none',
      confidence: 0,
    };

    // Try matching strategies in order of confidence
    for (const resumeKW of normalizedResumeKeywords) {
      // Strategy 1: Exact match (normalized)
      if (normalizedJD === resumeKW.normalized) {
        bestMatch = {
          keyword: jdKeyword,
          matchedTo: resumeKW.original,
          matchType: 'exact',
          confidence: 100,
        };
        break;
      }

      // Strategy 2: Canonical match (synonyms)
      if (canonicalJD && canonicalJD === resumeKW.canonical) {
        if (bestMatch.confidence < 95) {
          bestMatch = {
            keyword: jdKeyword,
            matchedTo: resumeKW.original,
            matchType: 'synonym',
            confidence: 95,
          };
        }
      }

      // Strategy 3: Fuzzy match (Levenshtein distance)
      if (areSimilarSkills(normalizedJD, resumeKW.normalized)) {
        if (bestMatch.confidence < 85) {
          bestMatch = {
            keyword: jdKeyword,
            matchedTo: resumeKW.original,
            matchType: 'fuzzy',
            confidence: 85,
          };
        }
      }

      // Strategy 4: Contains match (partial)
      if (
        normalizedJD.includes(resumeKW.normalized) ||
        resumeKW.normalized.includes(normalizedJD)
      ) {
        if (bestMatch.confidence < 70) {
          bestMatch = {
            keyword: jdKeyword,
            matchedTo: resumeKW.original,
            matchType: 'fuzzy',
            confidence: 70,
          };
        }
      }
    }

    matches.push(bestMatch);

    if (bestMatch.matchedTo) {
      matchedJDKeywords.push(jdKeyword);
    } else {
      missingKeywords.push(jdKeyword);
    }
  }

  // Calculate overall match score
  const matchScore =
    jdKeywords.length > 0 ? Math.round((matchedJDKeywords.length / jdKeywords.length) * 100) : 0;

  return {
    matches,
    matchedKeywords: matchedJDKeywords,
    missingKeywords,
    matchScore,
  };
}

/**
 * Get canonical form of a skill (from synonym map)
 */
function getCanonicalSkill(skill: string): string | null {
  const normalized = normalizeSkill(skill);
  return SYNONYM_MAP.get(normalized) || null;
}

/**
 * Group matches by match type for reporting
 */
export function groupMatchesByType(matches: SkillMatch[]): Record<MatchType, SkillMatch[]> {
  const grouped: Record<MatchType, SkillMatch[]> = {
    exact: [],
    fuzzy: [],
    semantic: [],
    synonym: [],
    none: [],
  };

  for (const match of matches) {
    grouped[match.matchType].push(match);
  }

  return grouped;
}

/**
 * Get top missing keywords (prioritized by importance)
 */
export function getPrioritizedMissingKeywords(
  missingKeywords: string[],
  allJDKeywords: string[]
): string[] {
  // Simple heuristic: Keywords that appear earlier in the JD are more important
  return missingKeywords.sort((a, b) => {
    const indexA = allJDKeywords.indexOf(a);
    const indexB = allJDKeywords.indexOf(b);
    return indexA - indexB;
  });
}

/**
 * Suggest skills from resume that might be worth highlighting
 */
export function suggestSkillsToHighlight(
  resumeKeywords: string[],
  jdKeywords: string[],
  limit: number = 5
): string[] {
  const matchResult = matchSkills(jdKeywords, resumeKeywords);

  // Return skills that matched but might not be prominently featured
  return matchResult.matchedKeywords.slice(0, limit);
}

/**
 * Categorize missing keywords by severity
 */
export interface MissingKeywordAnalysis {
  critical: string[]; // Skills mentioned multiple times or in requirements
  important: string[]; // Skills mentioned once
  niceToHave: string[]; // Skills mentioned in "nice to have" or optional sections
}

export function analyzeMissingKeywords(
  missingKeywords: string[],
  jobDescriptionText: string
): MissingKeywordAnalysis {
  const critical: string[] = [];
  const important: string[] = [];
  const niceToHave: string[] = [];

  const lowerJD = jobDescriptionText.toLowerCase();

  for (const keyword of missingKeywords) {
    const lowerKeyword = keyword.toLowerCase();

    // Count occurrences
    const occurrences = (lowerJD.match(new RegExp(lowerKeyword, 'g')) || []).length;

    // Check if in "nice to have" section
    const niceToHaveSection = lowerJD.match(
      /nice to have|preferred|bonus|plus|optional|additional[\s\S]*$/i
    )?.[0];
    const isNiceToHave = niceToHaveSection?.includes(lowerKeyword) || false;

    // Check if in requirements section
    const requirementsSection = lowerJD.match(
      /requirements?|required|must have|qualifications?[\s\S]*/i
    )?.[0];
    const isRequired = requirementsSection?.includes(lowerKeyword) || false;

    if (isNiceToHave) {
      niceToHave.push(keyword);
    } else if (occurrences > 1 || isRequired) {
      critical.push(keyword);
    } else {
      important.push(keyword);
    }
  }

  return { critical, important, niceToHave };
}
