/**
 * Gap Analyzer Service v2 - Industry-Agnostic
 *
 * Analyzes the gap between resume keywords and job description requirements.
 * Provides actionable insights on what's missing and what to emphasize.
 *
 * Works for ALL industries.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import type { ExtractedKeywords } from './keyword-extraction.service';
import {
  matchSkills,
  analyzeMissingKeywords,
  type SkillMatch,
  type MissingKeywordAnalysis,
} from './skill-matcher.service';

// ============================================================================
// TYPES
// ============================================================================

export interface GapAnalysis {
  // Overall scores
  overallMatchScore: number; // 0-100
  skillsMatchScore: number; // 0-100
  knowledgeMatchScore: number; // 0-100
  toolsMatchScore: number; // 0-100

  // Matched keywords (what you have)
  matchedKeywords: {
    skills: SkillMatch[];
    knowledge: SkillMatch[];
    tools: SkillMatch[];
  };

  // Missing keywords (what you need to add)
  missingKeywords: {
    critical: string[]; // Must have
    important: string[]; // Should have
    niceToHave: string[]; // Optional
  };

  // Actionable suggestions
  suggestions: Suggestion[];

  // Skills to emphasize (you have them, but they might not be prominent)
  skillsToEmphasize: string[];

  // Skills to de-emphasize (not relevant to this JD)
  skillsToDeemphasize: string[];
}

export interface Suggestion {
  type: 'add_keyword' | 'emphasize_skill' | 'reorder_skills' | 'add_experience' | 'reframe_bullet';
  priority: 'critical' | 'important' | 'nice-to-have';
  description: string;
  keywords?: string[];
  section?: 'summary' | 'experience' | 'skills' | 'certifications';
}

// ============================================================================
// GAP ANALYSIS
// ============================================================================

/**
 * Analyze the gap between resume and job description
 */
export function analyzeGap(
  resumeKeywords: ExtractedKeywords,
  jdKeywords: ExtractedKeywords,
  jobDescriptionText: string
): GapAnalysis {
  // Match skills (O*NET universal skills)
  const skillsMatch = matchSkills(jdKeywords.skills, resumeKeywords.skills);

  // Match knowledge (O*NET knowledge areas - identifies industry)
  const knowledgeMatch = matchSkills(jdKeywords.knowledge, resumeKeywords.knowledge);

  // Match tools (industry-specific tools/software/equipment)
  const toolsMatch = matchSkills(jdKeywords.tools, resumeKeywords.tools);

  // Calculate overall match score (weighted average)
  const overallMatchScore = calculateWeightedMatchScore({
    skills: skillsMatch.matchScore,
    knowledge: knowledgeMatch.matchScore,
    tools: toolsMatch.matchScore,
  });

  // Combine all missing keywords
  const allMissingKeywords = [
    ...skillsMatch.missingKeywords,
    ...knowledgeMatch.missingKeywords,
    ...toolsMatch.missingKeywords,
  ];

  // Categorize missing keywords by severity
  const missingAnalysis = analyzeMissingKeywords(allMissingKeywords, jobDescriptionText);

  // Generate suggestions
  const suggestions = generateSuggestions(
    { skills: skillsMatch, knowledge: knowledgeMatch, tools: toolsMatch },
    missingAnalysis,
    resumeKeywords,
    jdKeywords
  );

  // Identify skills to emphasize (matched but not prominent)
  const skillsToEmphasize = identifySkillsToEmphasize(resumeKeywords, jdKeywords, {
    skills: skillsMatch,
    knowledge: knowledgeMatch,
    tools: toolsMatch,
  });

  // Identify skills to de-emphasize (not relevant to JD)
  const skillsToDeemphasize = identifySkillsToDeemphasize(resumeKeywords, jdKeywords);

  return {
    overallMatchScore,
    skillsMatchScore: skillsMatch.matchScore,
    knowledgeMatchScore: knowledgeMatch.matchScore,
    toolsMatchScore: toolsMatch.matchScore,

    matchedKeywords: {
      skills: skillsMatch.matches.filter((m) => m.matchedTo !== null),
      knowledge: knowledgeMatch.matches.filter((m) => m.matchedTo !== null),
      tools: toolsMatch.matches.filter((m) => m.matchedTo !== null),
    },

    missingKeywords: missingAnalysis,

    suggestions,
    skillsToEmphasize,
    skillsToDeemphasize,
  };
}

/**
 * Calculate weighted match score
 * Skills and knowledge are weighted higher than tools
 */
function calculateWeightedMatchScore(scores: {
  skills: number;
  knowledge: number;
  tools: number;
}): number {
  const weights = {
    skills: 0.4, // 40% weight (universal skills)
    knowledge: 0.35, // 35% weight (identifies industry fit)
    tools: 0.25, // 25% weight (specific tools/software)
  };

  return Math.round(
    scores.skills * weights.skills +
      scores.knowledge * weights.knowledge +
      scores.tools * weights.tools
  );
}

/**
 * Generate actionable suggestions based on gap analysis
 */
function generateSuggestions(
  matches: {
    skills: ReturnType<typeof matchSkills>;
    knowledge: ReturnType<typeof matchSkills>;
    tools: ReturnType<typeof matchSkills>;
  },
  missingAnalysis: MissingKeywordAnalysis,
  resumeKeywords: ExtractedKeywords,
  jdKeywords: ExtractedKeywords
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Suggest adding critical missing keywords
  if (missingAnalysis.critical.length > 0) {
    for (const keyword of missingAnalysis.critical.slice(0, 3)) {
      suggestions.push({
        type: 'add_keyword',
        priority: 'critical',
        description: `Incorporate "${keyword}" into your experience bullets`,
        keywords: [keyword],
        section: 'experience',
      });
    }
  }

  // Suggest adding important missing keywords
  if (missingAnalysis.important.length > 0) {
    suggestions.push({
      type: 'add_keyword',
      priority: 'important',
      description: `Add these to your resume: ${missingAnalysis.important.slice(0, 3).join(', ')}`,
      keywords: missingAnalysis.important.slice(0, 3),
      section: 'skills',
    });
  }

  // Suggest emphasizing matched skills
  const matchedButNotProminent = [
    ...matches.skills.matchedKeywords,
    ...matches.tools.matchedKeywords,
  ].slice(0, 3);

  if (matchedButNotProminent.length > 0) {
    suggestions.push({
      type: 'emphasize_skill',
      priority: 'important',
      description: `Emphasize these matched skills: ${matchedButNotProminent.join(', ')}`,
      keywords: matchedButNotProminent,
      section: 'summary',
    });
  }

  // Suggest reordering skills to match JD priority
  if (jdKeywords.skills.length > 0 || jdKeywords.tools.length > 0) {
    suggestions.push({
      type: 'reorder_skills',
      priority: 'nice-to-have',
      description: 'Reorder your skills section to prioritize JD keywords',
      keywords: [...jdKeywords.skills, ...jdKeywords.tools].slice(0, 5),
      section: 'skills',
    });
  }

  // Suggest reframing bullets if skills are missing
  if (missingAnalysis.critical.some((kw) => jdKeywords.skills.includes(kw))) {
    suggestions.push({
      type: 'reframe_bullet',
      priority: 'important',
      description: 'Reframe experience bullets to highlight relevant skills',
      keywords: missingAnalysis.critical.filter((kw) => jdKeywords.skills.includes(kw)),
      section: 'experience',
    });
  }

  // Sort by priority
  return suggestions.sort((a, b) => {
    const priorityOrder = { critical: 0, important: 1, 'nice-to-have': 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Identify skills that should be emphasized (you have them, but they're not prominent)
 */
function identifySkillsToEmphasize(
  resumeKeywords: ExtractedKeywords,
  jdKeywords: ExtractedKeywords,
  matches: {
    skills: ReturnType<typeof matchSkills>;
    knowledge: ReturnType<typeof matchSkills>;
    tools: ReturnType<typeof matchSkills>;
  }
): string[] {
  const toEmphasize: string[] = [];

  // Skills that matched but might be buried in the resume
  const allMatches = [
    ...matches.skills.matches,
    ...matches.knowledge.matches,
    ...matches.tools.matches,
  ];

  for (const match of allMatches) {
    if (match.matchedTo && match.matchType !== 'exact') {
      // Fuzzy or synonym matches should be emphasized (make them more explicit)
      toEmphasize.push(match.matchedTo);
    }
  }

  return [...new Set(toEmphasize)].slice(0, 5);
}

/**
 * Identify skills that should be de-emphasized (not relevant to this JD)
 */
function identifySkillsToDeemphasize(
  resumeKeywords: ExtractedKeywords,
  jdKeywords: ExtractedKeywords
): string[] {
  const toDeemphasize: string[] = [];

  // Combine all JD keywords
  const allJDKeywords = new Set([
    ...jdKeywords.skills,
    ...jdKeywords.knowledge,
    ...jdKeywords.tools,
  ]);

  // Find resume keywords that don't appear in JD at all
  for (const resumeKeyword of [...resumeKeywords.skills, ...resumeKeywords.tools]) {
    const isRelevant = Array.from(allJDKeywords).some((jdKeyword) => {
      return (
        resumeKeyword.toLowerCase().includes(jdKeyword.toLowerCase()) ||
        jdKeyword.toLowerCase().includes(resumeKeyword.toLowerCase())
      );
    });

    if (!isRelevant) {
      toDeemphasize.push(resumeKeyword);
    }
  }

  // Don't go overboard - only return top 3-5 least relevant
  return toDeemphasize.slice(0, 5);
}

/**
 * Calculate improvement potential (how much the score could improve)
 */
export function calculateImprovementPotential(analysis: GapAnalysis): {
  currentScore: number;
  potentialScore: number;
  improvementPoints: number;
} {
  const currentScore = analysis.overallMatchScore;

  // Assume adding critical keywords would add 10 points each (up to 30)
  const criticalBoost = Math.min(analysis.missingKeywords.critical.length * 10, 30);

  // Assume adding important keywords would add 5 points each (up to 15)
  const importantBoost = Math.min(analysis.missingKeywords.important.length * 5, 15);

  // Assume emphasizing skills would add 5 points
  const emphasizeBoost = analysis.skillsToEmphasize.length > 0 ? 5 : 0;

  const potentialScore = Math.min(
    currentScore + criticalBoost + importantBoost + emphasizeBoost,
    100
  );

  return {
    currentScore,
    potentialScore,
    improvementPoints: potentialScore - currentScore,
  };
}

/**
 * Get a human-readable summary of the gap analysis
 */
export function getGapSummary(analysis: GapAnalysis): string {
  const { currentScore, potentialScore, improvementPoints } =
    calculateImprovementPotential(analysis);

  if (currentScore >= 90) {
    return `Excellent match! Your resume aligns ${currentScore}% with this job.`;
  } else if (currentScore >= 70) {
    return `Good match (${currentScore}%). Adding ${analysis.missingKeywords.critical.length} critical keywords could boost to ${potentialScore}%.`;
  } else if (currentScore >= 50) {
    return `Fair match (${currentScore}%). Focus on ${analysis.missingKeywords.critical.length} critical gaps for +${improvementPoints}% improvement.`;
  } else {
    return `Low match (${currentScore}%). This position may require significant resume tailoring.`;
  }
}
