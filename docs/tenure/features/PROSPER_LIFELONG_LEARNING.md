# Prosper Lifelong Learning - Feature Specification

## Executive Summary

This document specifies the **Prosper Lifelong Learning** feature, which transforms the Career Journal into a continuous learning capture system that flows into resume skills through a quarterly approval process.

### Core Vision

> "Every learning moment in your career journal becomes a building block for your resume."

The system creates a virtuous cycle:

1. **Journal** → Capture learning moments with generous, contemplative UX
2. **Track** → Learning entries accumulate as skill evidence
3. **Review** → Quarterly approval process to promote learnings to skills
4. **Resume** → Approved skills flow into master resume automatically

---

## Part 1: Journal UX Enhancement - "Breathing Room"

### 1.1 Current State Analysis

The existing `CheckInWizard` component has:

- **32px container padding** - adequate but not generous
- **16-24px element gaps** - functional but dense
- **700px max-width modal** - constrained feeling
- **Multiple fields per step** - efficient but not contemplative
- **Standard form aesthetics** - professional but not journal-like

### 1.2 Target Experience

The redesigned journal should evoke the feeling of:

- Opening a quality leather-bound journal
- Having space to think before writing
- One thought at a time (single-question focus)
- Visual breathing room that encourages reflection

### 1.3 Spacing Specifications

#### Container Level

```typescript
// BEFORE
{ padding: '32px', 'max-width': '700px' }

// AFTER
{
  padding: '48px 64px',      // Generous horizontal margins
  'max-width': '640px',       // Slightly narrower for focus
  'min-height': '70vh',       // Taller to use vertical space
}
```

#### Step-Level Layout

```typescript
// Each step gets full vertical space
{
  display: 'flex',
  'flex-direction': 'column',
  'justify-content': 'center',   // Vertically centered content
  'min-height': '400px',         // Consistent step height
  gap: '48px',                   // Major breathing room between sections
}
```

#### Typography Spacing

```typescript
// Question/Prompt styling
{
  'font-size': '28px',           // Larger, more prominent
  'line-height': '1.4',          // Readable
  'margin-bottom': '32px',       // Space before input
  'font-weight': '400',          // Light, not heavy
}

// Helper text
{
  'font-size': '16px',
  'line-height': '1.6',
  'margin-bottom': '40px',
  color: prosper.colors.textMuted,
}
```

#### Form Field Spacing

```typescript
// Input fields
{
  padding: '16px 20px',          // More internal space
  'font-size': '18px',           // Larger text
  'margin-bottom': '24px',       // Space after each field
}

// Textarea (for reflection prompts)
{
  padding: '20px 24px',
  'font-size': '18px',
  'line-height': '1.8',          // Very readable
  'min-height': '160px',         // Taller default
}
```

#### Navigation Spacing

```typescript
// Button area
{
  'margin-top': '64px',          // Major separation from content
  'padding-top': '32px',         // Additional visual break
  gap: '16px',                   // Between buttons
}
```

### 1.4 Single-Question Focus Mode

Transform multi-field steps into single-question flows:

**Current Step 1 (Employment Context):**

- Company field
- Job Title field
- (Both visible simultaneously)

**Redesigned Step 1:**

```
Step 1a: "Where are you working right now?"
         [Company input]
         [Continue →]

Step 1b: "What's your current title?"
         [Title input]
         [← Back] [Continue →]
```

This increases total steps but creates a more contemplative flow.

### 1.5 Visual Breathing Elements

Add subtle visual elements that reinforce journal aesthetics:

```typescript
// Subtle top border on each step (like a page edge)
{
  'border-top': '1px solid rgba(212, 175, 55, 0.1)', // Gold tint
  'padding-top': '40px',
}

// Progress indicator redesign
// Instead of: ━━━━━━━━━━ (bar)
// Use: ○ ○ ● ○ ○ (dots with current highlighted)

// Transition between steps
{
  animation: 'fadeIn 0.4s ease-out',
  // Slower, more deliberate transitions
}
```

### 1.6 Component Structure

```
CheckInWizard (refactored)
├── JournalStepContainer
│   ├── StepProgressDots
│   ├── JournalPrompt (question)
│   ├── JournalHelperText (optional context)
│   ├── JournalInput / JournalTextarea
│   └── JournalNavigation
└── JournalConfirmation (final step)
```

---

## Part 2: Learning Capture System

### 2.1 Learning Entry Schema

Add to `prosper.schema.ts`:

```typescript
/**
 * Learning entry types
 */
export type LearningType =
  | 'skill-acquired' // Learned a new skill
  | 'skill-deepened' // Improved existing skill
  | 'certification' // Formal certification
  | 'course' // Completed course/training
  | 'project-learning' // Learned through project work
  | 'mentorship' // Learned from/as mentor
  | 'reading' // Books, articles, docs
  | 'conference' // Conferences, workshops
  | 'other';

/**
 * Proficiency levels for skills
 */
export type SkillProficiency =
  | 'exposed' // Have used/seen it
  | 'familiar' // Can work with guidance
  | 'proficient' // Can work independently
  | 'advanced' // Can mentor others
  | 'expert'; // Industry-recognized expertise

/**
 * Learning entry captured in journal
 */
export interface LearningEntry {
  id: string;
  userId: string;

  // What was learned
  title: string; // "Learned TypeScript generics"
  description?: string; // Detailed notes
  type: LearningType;

  // Skill mapping
  skillName: string; // Normalized skill name
  skillCategory: SkillCategory; // Technical, soft, domain, tools
  proficiencyBefore?: SkillProficiency;
  proficiencyAfter: SkillProficiency;

  // Evidence & context
  evidence?: string; // How you demonstrated this
  projectId?: string; // Link to project where applied
  employerId?: string; // Job where learned
  quarter: string; // "Q4 2025"

  // Source tracking
  sourceType: 'check-in' | 'quick-log' | 'manual';
  sourceId?: string; // QuarterlyCheckIn ID if from check-in

  // Resume pipeline status
  approvalStatus: 'pending' | 'approved' | 'declined' | 'deferred';
  approvedForResumeAt?: Date;
  addedToResumeAt?: Date;
  resumeSkillId?: string; // Link to skill in MasterResume

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Skill categories for organization
 */
export type SkillCategory =
  | 'technical' // Programming, tools, frameworks
  | 'soft' // Communication, leadership
  | 'domain' // Industry knowledge
  | 'tools' // Specific software/platforms
  | 'methodology'; // Agile, design thinking, etc.

/**
 * Aggregated skill from multiple learning entries
 */
export interface TrackedSkill {
  id: string;
  userId: string;

  // Skill identity
  name: string; // Normalized name
  category: SkillCategory;
  aliases: string[]; // Other names for this skill

  // Proficiency tracking
  currentProficiency: SkillProficiency;
  proficiencyHistory: Array<{
    date: Date;
    proficiency: SkillProficiency;
    learningEntryId: string;
  }>;

  // Evidence
  learningEntryIds: string[]; // All learning entries for this skill
  totalLearningHours?: number; // If tracked

  // Resume status
  isOnResume: boolean;
  resumeSkillId?: string;
  lastResumeSync?: Date;

  // Metadata
  firstLearnedAt: Date;
  lastPracticedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.2 Journal Integration

Modify Step 4 (Challenges & Learning) to capture structured learning:

```typescript
// Current: freeform textarea
// New: structured learning capture

interface LearningCaptureStep {
  // Freeform learning goals (existing)
  learningGoals: string;

  // NEW: Structured learning entries
  newLearnings: Array<{
    title: string;
    skillName: string;
    type: LearningType;
    proficiency: SkillProficiency;
    evidence?: string;
  }>;
}
```

**UI Flow:**

```
Step 4: "What did you learn this quarter?"

[Freeform textarea for general reflection]

───────────────────────────────

"Capture specific skills for your resume"

+ Add a skill you learned or improved

[Modal: Skill Capture]
  - What skill? [autocomplete from skill library]
  - How did you learn it? [dropdown: LearningType]
  - Your proficiency now? [slider: exposed → expert]
  - How did you demonstrate it? [optional textarea]
  [Save Skill]

[List of captured skills with edit/remove]
```

---

## Part 3: Quarterly Approval Workflow

### 3.1 Approval Cycle Schema

```typescript
/**
 * Quarterly skill review cycle
 */
export interface SkillReviewCycle {
  id: string;
  userId: string;

  // Period
  quarter: string; // "Q4 2025"
  year: number;
  quarterNumber: 1 | 2 | 3 | 4;

  // Review window
  reviewWindowStart: Date; // When review becomes available
  reviewWindowEnd: Date; // Deadline for review

  // Content
  pendingLearnings: string[]; // LearningEntry IDs to review

  // Decisions
  decisions: Array<{
    learningEntryId: string;
    decision: 'approved' | 'declined' | 'deferred';
    reason?: string;
    decidedAt: Date;
  }>;

  // Status
  status: 'upcoming' | 'active' | 'completed' | 'skipped';
  completedAt?: Date;

  // Resume sync
  syncedToResumeAt?: Date;
  skillsAddedToResume: string[]; // TrackedSkill IDs

  // Metadata
  createdAt: Date;
}

/**
 * Resume skill (in Prepare module)
 */
export interface ResumeSkill {
  id: string;

  // Identity
  name: string;
  category: SkillCategory;

  // Source tracking
  source: 'manual' | 'prosper-sync' | 'parsed';
  prosperSkillId?: string; // Link back to TrackedSkill

  // Display
  proficiency?: SkillProficiency;
  yearsExperience?: number;
  isHighlighted: boolean; // Featured skill

  // Evidence (from Prosper)
  learningEntries?: string[]; // For reference
  lastVerifiedAt?: Date;

  // Metadata
  addedAt: Date;
  updatedAt: Date;
}
```

### 3.2 Approval UI Flow

**Trigger:** Quarterly review notification (start of new quarter)

```
┌─────────────────────────────────────────────────────────────┐
│  🎯 Q4 2025 Skill Review                                    │
│                                                             │
│  Review 7 new skills from your journal                      │
│  Add approved skills to your resume                         │
│                                                             │
│  [Start Review]                                             │
└─────────────────────────────────────────────────────────────┘
```

**Review Interface:**

```
┌─────────────────────────────────────────────────────────────┐
│  Skill 1 of 7                                               │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  TypeScript Generics                                  │  │
│  │  ────────────────────────────────────────────────────│  │
│  │  Category: Technical                                  │  │
│  │  Proficiency: Proficient                              │  │
│  │  Learned: October 2025                                │  │
│  │                                                       │  │
│  │  Evidence:                                            │  │
│  │  "Built type-safe API client with generic request/   │  │
│  │   response types for the dashboard project"          │  │
│  │                                                       │  │
│  │  Source: Q4 2025 Check-in                            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Add to your resume?                                        │
│                                                             │
│  [✓ Yes, add it]  [✗ Not yet]  [→ Defer to next quarter]   │
│                                                             │
│  ○ ○ ● ○ ○ ○ ○                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Resume Sync Process

When skills are approved:

```typescript
async function syncApprovedSkillsToResume(
  reviewCycle: SkillReviewCycle,
  masterResume: MasterResume
): Promise<SyncResult> {
  const approvedDecisions = reviewCycle.decisions.filter((d) => d.decision === 'approved');

  for (const decision of approvedDecisions) {
    const learningEntry = await getLearningEntry(decision.learningEntryId);
    const trackedSkill = await getOrCreateTrackedSkill(learningEntry.skillName);

    // Check if skill already on resume
    const existingResumeSkill = masterResume.parsedSections.skills.find(
      (s) => normalizeSkillName(s) === normalizeSkillName(trackedSkill.name)
    );

    if (existingResumeSkill) {
      // Update proficiency if improved
      await updateResumeSkillProficiency(existingResumeSkill, trackedSkill);
    } else {
      // Add new skill to resume
      await addSkillToResume(masterResume, trackedSkill, learningEntry);
    }

    // Mark as synced
    await markLearningEntrySynced(learningEntry.id);
  }

  return {
    skillsAdded: newSkillsCount,
    skillsUpdated: updatedSkillsCount,
  };
}
```

---

## Part 4: Data Flow Architecture

### 4.1 Complete Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│                        PROSPER MODULE                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │   Journal   │───▶│ Learning Entry  │───▶│ Tracked Skill   │  │
│  │  Check-In   │    │    (pending)    │    │   (aggregated)  │  │
│  └─────────────┘    └─────────────────┘    └─────────────────┘  │
│         │                    │                      │            │
│         ▼                    ▼                      ▼            │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │ Quick Log   │───▶│ Quarterly       │───▶│ Approval        │  │
│  │ (anytime)   │    │ Review Cycle    │    │ Decision        │  │
│  └─────────────┘    └─────────────────┘    └─────────────────┘  │
│                                                     │            │
├─────────────────────────────────────────────────────┼────────────┤
│                      PREPARE MODULE                 ▼            │
├─────────────────────────────────────────────────────┬────────────┤
│                                                     │            │
│  ┌─────────────────┐    ┌─────────────────────┐    │            │
│  │  Master Resume  │◀───│ Resume Skill        │◀───┘            │
│  │  (skills[])     │    │ (from Prosper sync) │                 │
│  └─────────────────┘    └─────────────────────┘                 │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────┐                                            │
│  │ Resume Variant  │  Skills available for tailoring            │
│  └─────────────────┘                                            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Storage Keys

```typescript
// Prosper module storage
const PROSPER_STORAGE_KEYS = {
  learningEntries: 'prosper_learning_entries',
  trackedSkills: 'prosper_tracked_skills',
  skillReviewCycles: 'prosper_skill_review_cycles',
  // ... existing keys
};

// Cross-module link (in Prepare)
const PREPARE_STORAGE_KEYS = {
  // ... existing keys
  prosperSyncState: 'prepare_prosper_sync_state',
};
```

### 4.3 Event-Driven Integration

```typescript
// Events emitted by Prosper
type ProsperEvents = {
  'learning:created': { learningEntry: LearningEntry };
  'learning:updated': { learningEntry: LearningEntry };
  'skill:approved': { trackedSkill: TrackedSkill; learningEntries: LearningEntry[] };
  'review:completed': { reviewCycle: SkillReviewCycle };
};

// Events consumed by Prepare
type PrepareHandlers = {
  'skill:approved': (data) => addSkillToMasterResume(data);
  'review:completed': (data) => updateResumeLastSyncDate(data);
};
```

---

## Part 5: Implementation Plan

### Phase 1: Journal UX Enhancement (3-5 days)

| Task                                              | Priority | Estimate |
| ------------------------------------------------- | -------- | -------- |
| Refactor `CheckInWizard` with new spacing system  | High     | 4h       |
| Implement single-question-per-step flow           | High     | 3h       |
| Add step transition animations                    | Medium   | 2h       |
| Create `JournalPrompt`, `JournalInput` components | High     | 3h       |
| Update progress indicator to dot-style            | Low      | 1h       |
| Add "breathing room" visual elements              | Low      | 2h       |
| Test on mobile viewports                          | High     | 2h       |

### Phase 2: Learning Capture (5-7 days)

| Task                                              | Priority | Estimate |
| ------------------------------------------------- | -------- | -------- |
| Add `LearningEntry` schema to `prosper.schema.ts` | High     | 2h       |
| Add `TrackedSkill` schema                         | High     | 2h       |
| Create skill autocomplete library                 | Medium   | 4h       |
| Build learning capture UI in journal step         | High     | 6h       |
| Integrate with prosper-store                      | High     | 3h       |
| Quick log learning (outside check-in)             | Medium   | 4h       |
| Unit tests for learning capture                   | High     | 3h       |

### Phase 3: Quarterly Approval System (5-7 days)

| Task                               | Priority | Estimate |
| ---------------------------------- | -------- | -------- |
| Add `SkillReviewCycle` schema      | High     | 2h       |
| Build review cycle trigger logic   | High     | 3h       |
| Create approval review UI          | High     | 8h       |
| Implement decision persistence     | High     | 3h       |
| Add notification system for review | Medium   | 4h       |
| Review history view                | Low      | 3h       |
| Unit tests for approval flow       | High     | 3h       |

### Phase 4: Resume Integration (3-5 days)

| Task                                                   | Priority | Estimate |
| ------------------------------------------------------ | -------- | -------- |
| Add `ResumeSkill` schema to `prepare.schema.ts`        | High     | 2h       |
| Build sync service between modules                     | High     | 6h       |
| Update master resume UI to show Prosper-sourced skills | High     | 4h       |
| Add "skill source" badges                              | Low      | 2h       |
| Handle skill deduplication                             | Medium   | 3h       |
| Integration tests                                      | High     | 4h       |

---

## Part 6: Success Metrics

### Engagement Metrics

- **Learning entries per check-in**: Target 2-3 average
- **Quarterly review completion rate**: Target 80%+
- **Skills approved per quarter**: Target 60%+ of submitted

### Quality Metrics

- **Skills with evidence**: Target 70%+ have evidence attached
- **Skills synced to resume**: Target 50%+ of approved skills on resume

### UX Metrics

- **Journal completion rate**: Track before/after spacing redesign
- **Time to complete check-in**: Should increase slightly (more thoughtful)
- **Return rate for quick logging**: Track weekly active loggers

---

## Appendix A: Skill Library Seed Data

Initial skill categories for autocomplete:

```typescript
const SKILL_LIBRARY = {
  technical: [
    'TypeScript', 'JavaScript', 'React', 'Node.js', 'Python',
    'SQL', 'GraphQL', 'REST APIs', 'Git', 'Docker', 'AWS',
    'System Design', 'Data Structures', 'Algorithms', ...
  ],
  soft: [
    'Leadership', 'Communication', 'Mentoring', 'Presentation',
    'Conflict Resolution', 'Time Management', 'Collaboration',
    'Strategic Thinking', 'Decision Making', ...
  ],
  methodology: [
    'Agile', 'Scrum', 'Kanban', 'Design Thinking', 'Lean',
    'Test-Driven Development', 'DevOps', 'CI/CD', ...
  ],
  domain: [
    // Industry-specific, populated based on user's field
  ],
  tools: [
    'Figma', 'Jira', 'Confluence', 'Slack', 'GitHub',
    'VS Code', 'Postman', 'Datadog', 'Sentry', ...
  ],
};
```

---

## Appendix B: Migration Path

For existing users with journal entries:

1. **No breaking changes** - existing check-ins remain valid
2. **Retroactive learning extraction** - Offer optional AI-assisted extraction of learnings from past check-in text
3. **Gradual adoption** - New learning capture is additive, not required

---

## Document History

| Version | Date       | Author | Changes               |
| ------- | ---------- | ------ | --------------------- |
| 1.0     | 2025-12-31 | Claude | Initial specification |

---

_This feature specification is part of the TACo product documentation._
_Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved._
