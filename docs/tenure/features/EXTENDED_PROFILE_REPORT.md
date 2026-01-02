# Extended Profile Report - Implementation Plan

**Feature:** Comprehensive career analysis combining RIASEC, OCEAN, and Jungian assessments  
**Status:** Planning Phase  
**Priority:** Premium Feature - Post MVP  
**Last Updated:** 2025-01-01

---

## Overview

The **Extended Profile Report** is a premium feature that synthesizes data from three validated psychological assessments (RIASEC interests, Big Five personality traits, and Jungian cognitive types) into actionable career insights. This report goes beyond individual assessment results to provide integrated analysis for career planning, team dynamics, and professional growth.

### Current State

- **Teaser UI:** Implemented in `DiscoverOverview.tsx` (lines 311-428)
- **Trigger:** Shows when all three assessments are completed (`areAllAssessmentsCompleted()`)
- **Status:** "Coming Soon" premium feature
- **Color System:** ✅ Fixed to use default → post-RIASEC dynamic theming

### Design Philosophy

1. **Synthesis Over Summation** - The report combines insights across assessments, not just lists individual results
2. **Actionable Over Academic** - Focus on practical career decisions, not theoretical psychology
3. **Visual Over Text-Heavy** - Use charts, infographics, and color-coded sections for quick comprehension
4. **Personalized Color Theming** - Report uses user's RIASEC duotone colors throughout

---

## Color Theming System

### Default (Pre-RIASEC Assessment)

When no RIASEC profile exists:

```typescript
Primary:   #8B5CF6  // Investigative (Purple)
Secondary: #EC4899  // Artistic (Pink)
Gradient:  linear-gradient(135deg, #8B5CF6, #EC4899)
```

### Post-RIASEC (Dynamic)

Uses top 2 RIASEC types from user's profile:

```typescript
// Example: User's top types are Realistic (R) + Investigative (I)
Primary:   #F97316  // Realistic (Orange)
Secondary: #8B5CF6  // Investigative (Purple)
Gradient:  linear-gradient(135deg, #F97316, #8B5CF6)

// RIASEC Color Palette
realistic:     '#F97316'  // Neon Orange (Hot)
investigative: '#8B5CF6'  // Neon Purple (Cool)
artistic:      '#EC4899'  // Hot Pink (Hot)
social:        '#10B981'  // Emerald Green (Cool)
enterprising:  '#EAB308'  // Electric Yellow (Hot)
conventional:  '#06B6D4'  // Cyan (Cool)
```

**Color Functions:**

- `getCurrentDuotone()` - Returns primary/secondary colors based on RIASEC profile
- `getDuotoneFromProfile(riasecScores)` - Calculates duotone from score profile
- `getDefaultDuotone()` - Fallback purple/pink gradient

---

## Report Sections

### Section 1: Your Professional Archetype

**Purpose:** Synthesize all three assessments into a single career persona

**Content:**

- **Archetype Name** (e.g., "The Technical Innovator", "The Empathetic Leader")
  - Derived from Holland Code (RIASEC) + Jungian type + OCEAN traits
- **Visual Avatar/Icon** representing the archetype
- **Tagline** (1 sentence describing work style)
- **Core Strengths** (4-6 bullet points synthesizing all assessments)
- **Potential Blind Spots** (2-3 development areas based on low OCEAN scores + cognitive type)

**Data Sources:**

- RIASEC: Top 2 Holland codes → primary interests
- OCEAN: High/low traits → work style preferences
- Jungian: Dominant function → information processing approach

**Example Synthesis Logic:**

```typescript
// Example: RIASEC = "RI" (Realistic + Investigative)
//          OCEAN = Low Extraversion, High Conscientiousness, High Openness
//          Jungian = INTJ (Ni-Te)

Archetype: "The System Architect"
Tagline: "Deep thinker who designs elegant solutions to complex technical problems"
Strengths:
  - Analytical problem-solving (RIASEC-I + Jungian-Ti)
  - Systematic planning (OCEAN-C + Jungian-Te)
  - Independent work (OCEAN-E low + RIASEC-R)
  - Innovative solutions (OCEAN-O high + RIASEC-I)
Blind Spots:
  - May undervalue team collaboration (OCEAN-E low)
  - Risk of perfectionism paralysis (OCEAN-C high + Jungian-Ni)
```

---

### Section 2: Career Match Analysis

**Purpose:** Recommend career paths aligned with complete profile

**Content:**

- **Top 10 Career Matches** (SOC codes from O\*NET)
  - Match score (0-100) weighted across all three assessments
  - Median salary + growth outlook (from BLS API)
  - Why it fits (1 sentence citing specific traits)
- **Visual Career Map** (scatter plot)
  - X-axis: People-oriented ← → Things-oriented (RIASEC)
  - Y-axis: Structured ← → Flexible (OCEAN Conscientiousness)
  - Bubble size: Match strength
  - Bubble color: RIASEC primary type color

**Match Score Algorithm:**

```typescript
function calculateCareerMatch(
  career: CareerRecommendation,
  riasec: RiasecScores,
  ocean: OceanProfile,
  jungian: JungianProfile
): number {
  // 50% weight: RIASEC fit (existing algorithm)
  const riasecFit = calculateJobFitScore(riasec, career.riasecCode);

  // 30% weight: OCEAN trait alignment
  const oceanFit = calculateOceanCareerFit(ocean, career);

  // 20% weight: Jungian cognitive style fit
  const jungianFit = calculateJungianCareerFit(jungian, career);

  return Math.round(riasecFit * 0.5 + oceanFit * 0.3 + jungianFit * 0.2);
}

// OCEAN fit based on career requirements
function calculateOceanCareerFit(ocean: OceanProfile, career: CareerRecommendation): number {
  // Example logic (requires career trait requirements database)
  // Leadership roles: High E, High C, Low N
  // Creative roles: High O, Low C
  // Analytical roles: High C, Low E
  // etc.
}

// Jungian fit based on cognitive functions
function calculateJungianCareerFit(jungian: JungianProfile, career: CareerRecommendation): number {
  // Example logic:
  // Ti (Introverted Thinking) → Technical, analytical careers
  // Fe (Extraverted Feeling) → Counseling, teaching, HR
  // etc.
}
```

**Data Sources:**

- O\*NET database (career descriptions + RIASEC codes)
- BLS API (salary + growth data)
- Custom trait-to-career mapping tables (OCEAN, Jungian)

---

### Section 3: Team Compatibility Profile

**Purpose:** Help users understand how they fit into team dynamics

**Content:**

- **Your Role on Teams** (based on RIASEC + OCEAN)
  - Natural role: "Executor", "Strategist", "Connector", "Innovator", etc.
  - Communication style (Jungian + OCEAN Extraversion/Agreeableness)
  - Conflict resolution approach (OCEAN Agreeableness/Neuroticism)
- **Ideal Team Composition**
  - Complementary RIASEC types (e.g., "You're RI, seek AS and EC teammates")
  - Complementary OCEAN traits (e.g., "Balance your low E with high E collaborators")
- **Collaboration Tips**
  - 3-5 actionable tips based on profile
  - Example: "Your high Conscientiousness helps teams stay on track, but remember to stay flexible when plans change (low Openness risk)"

**Visual Elements:**

- **Team Wheel** showing user's position + ideal complementary types
- **Communication Style Card** (based on Jungian type + OCEAN E/A)

---

### Section 4: Growth Roadmap

**Purpose:** Personalized professional development plan

**Content:**

- **Strengths to Leverage** (top 3 high-scoring areas)
  - How to maximize in current role
  - Skills to develop further
- **Growth Opportunities** (areas for development)
  - Based on low OCEAN scores + RIASEC gaps
  - Suggested learning resources (books, courses, projects)
- **Career Transition Paths**
  - If user wants to pivot: "Your profile suggests you could successfully transition from [current] to [target]"
  - Skills to build for transition
  - Timeline estimate (based on skill gaps)

**Example:**

```
Strengths to Leverage:
  1. Analytical Thinking (RIASEC-I: 92, Jungian-Ti)
     → Take lead on complex problem-solving projects
     → Develop expertise in data analysis or systems architecture

  2. Independent Work (OCEAN-E: 28, RIASEC-R: 78)
     → Seek roles with autonomy (research, remote work)
     → Avoid micromanaged or highly collaborative environments

Growth Opportunities:
  1. Interpersonal Skills (OCEAN-E: 28, RIASEC-S: 34)
     → Practice active listening in 1:1s
     → Join professional networking groups
     → Consider Toastmasters for presentation skills

  2. Adaptability (OCEAN-O: 45)
     → Try new approaches to familiar problems
     → Take on cross-functional projects
```

---

### Section 5: Personalized Insights

**Purpose:** Unique observations based on rare trait combinations

**Content:**

- **Rare Profile Combinations**
  - Flag unusual trait pairings (e.g., "Only 8% of people are high I + low E + INTJ")
  - What this means for career uniqueness
- **Hidden Strengths**
  - Traits that don't fit stereotypes but create unique advantages
  - Example: "Your high Conscientiousness + high Artistic (RIASEC-A) is rare—perfect for creative roles requiring precision (architecture, UX design, filmmaking)"
- **Watch-Outs**
  - Conflicting traits that may cause internal tension
  - Example: "High Enterprising (E) + Low Extraversion (OCEAN-E) = you have leadership ambitions but may find networking draining. Focus on written communication and leading small teams."

---

## Technical Architecture

### Data Flow

```
User completes all 3 assessments
  ↓
Assessment Store (localStorage)
  ├─ RIASEC: scores, Holland code
  ├─ OCEAN: Big Five percentiles, archetype
  └─ Jungian: type, dominant/auxiliary functions
  ↓
Extended Report Generator
  ├─ Synthesize archetype
  ├─ Calculate career matches (O*NET + BLS)
  ├─ Generate team compatibility profile
  └─ Build growth roadmap
  ↓
Render Report Component
  ├─ Apply user's RIASEC duotone colors
  ├─ Generate charts (radar, scatter, bar)
  └─ Export as PDF (future: premium feature)
```

### Components to Build

```
src/components/tenure/discover/
  ├─ ExtendedProfileReport.tsx          # Main report container
  ├─ sections/
  │   ├─ ArchetypeSection.tsx           # Section 1
  │   ├─ CareerMatchSection.tsx         # Section 2
  │   ├─ TeamCompatibilitySection.tsx   # Section 3
  │   ├─ GrowthRoadmapSection.tsx       # Section 4
  │   └─ InsightsSection.tsx            # Section 5
  ├─ charts/
  │   ├─ CareerMapScatter.tsx           # Career positioning chart
  │   └─ TeamWheelChart.tsx             # Team compatibility wheel
  └─ utils/
      ├─ archetype-generator.ts         # Synthesize archetype from all 3
      ├─ career-matcher.ts              # Multi-assessment career matching
      └─ team-analyzer.ts               # Team role + compatibility logic
```

### Data Requirements

**New Data Files Needed:**

1. **Archetype Mapping Table** (`src/data/career-archetypes.ts`)
   - Maps RIASEC × OCEAN × Jungian combinations to archetype names
   - ~50-100 predefined archetypes

2. **Career Trait Requirements** (`src/data/career-trait-requirements.ts`)
   - OCEAN + Jungian requirements for each SOC code
   - Example: "Software Developer" → High O, Low E, Ti/Te dominant

3. **Team Role Mappings** (`src/data/team-roles.ts`)
   - Maps profiles to team roles (Belbin's Team Roles model?)
   - Communication style descriptors

4. **Growth Resource Library** (`src/data/growth-resources.ts`)
   - Books, courses, projects for each trait development area
   - Filtered by user's weak traits

**Existing Data to Leverage:**

- ✅ RIASEC questions + scoring (`src/data/riasec-questions.ts` - need to create)
- ✅ OCEAN questions + scoring (`src/data/bfi-questions.ts`)
- ✅ Jungian questions + scoring (`src/data/oejts-questions.ts`)
- ✅ O\*NET taxonomy (`src/data/onet-taxonomy.ts`)
- ✅ OCEAN archetypes (`src/data/ocean-archetypes.ts`)

---

## Premium Feature Gating

### Access Control

**Free Users:**

- ❌ Cannot view Extended Profile Report
- ✅ See teaser card in Discover Overview when all assessments complete
- ✅ Teaser shows preview of what they'd get

**Premium Users (Tenure Extras or Loco TACo Club):**

- ✅ Full access to Extended Profile Report
- ✅ Export report as PDF (future enhancement)
- ✅ Re-generate report after retaking assessments

### Feature Flag

```typescript
// src/lib/feature-gates.ts
export function canAccessExtendedReport(): boolean {
  // For now: always false (coming soon)
  // Future: check user subscription status
  const user = getCurrentUser();
  return user?.hasTenureExtras || user?.isLocoTacoMember || false;
}
```

### UI Flow

```
User completes all 3 assessments
  ↓
Teaser appears in Discover Overview
  ↓
User clicks "View Extended Report" button
  ↓
Check: canAccessExtendedReport()
  ├─ YES → Show full report
  └─ NO  → Show paywall modal
            ├─ Preview: "Here's what you'll get..."
            ├─ Pricing: "Included in Tenure Extras ($X/mo)"
            └─ CTA: "Upgrade Now" → billing flow
```

---

## Implementation Phases

### Phase 1: Data Foundation (Week 1-2)

- [ ] Create archetype mapping table (50-100 archetypes)
- [ ] Build career trait requirements database (OCEAN + Jungian for top 100 SOC codes)
- [ ] Create team role mapping logic
- [ ] Build growth resource library (books, courses per trait)

### Phase 2: Core Logic (Week 2-3)

- [ ] Implement `archetype-generator.ts`
  - [ ] Synthesize RIASEC + OCEAN + Jungian → archetype
  - [ ] Generate tagline + strengths + blind spots
- [ ] Implement `career-matcher.ts`
  - [ ] Multi-assessment match scoring algorithm
  - [ ] BLS API integration for salary/growth data
  - [ ] Career map scatter plot data generator
- [ ] Implement `team-analyzer.ts`
  - [ ] Determine team role from profile
  - [ ] Identify complementary types
  - [ ] Generate collaboration tips

### Phase 3: UI Components (Week 3-4)

- [ ] Build section components
  - [ ] `ArchetypeSection.tsx` (avatar, tagline, strengths)
  - [ ] `CareerMatchSection.tsx` (top 10 list + scatter plot)
  - [ ] `TeamCompatibilitySection.tsx` (wheel chart + tips)
  - [ ] `GrowthRoadmapSection.tsx` (strengths + opportunities)
  - [ ] `InsightsSection.tsx` (rare combinations + watch-outs)
- [ ] Build chart components
  - [ ] `CareerMapScatter.tsx` (Recharts scatter plot)
  - [ ] `TeamWheelChart.tsx` (Recharts radar or custom SVG)
- [ ] Integrate RIASEC duotone theming throughout report

### Phase 4: Main Report Container (Week 4)

- [ ] Build `ExtendedProfileReport.tsx`
  - [ ] Navigation/table of contents
  - [ ] Print/PDF export button (future: premium only)
  - [ ] Responsive layout (desktop + mobile)
  - [ ] Loading states while generating report
- [ ] Update `DiscoverOverview.tsx` teaser button
  - [ ] Change from "Coming Soon" to "View Report"
  - [ ] Add click handler → route to report
- [ ] Add route in `TenureApp.tsx` for `/discover/report`

### Phase 5: Premium Gating (Week 5)

- [ ] Implement feature flag check
- [ ] Build paywall modal for free users
- [ ] Add upgrade CTA to pricing page
- [ ] Test report generation with all profile combinations

### Phase 6: Polish & Launch (Week 6)

- [ ] Performance optimization (report generation speed)
- [ ] Accessibility audit (keyboard nav, screen readers)
- [ ] Mobile responsive testing
- [ ] Content review (tone, accuracy of insights)
- [ ] Beta test with Loco TACo Club members
- [ ] Launch announcement

---

## Open Questions

### 1. Archetype Naming System

- **Option A:** Fantasy/RPG-themed (current: "The Sage", "The Bard")
- **Option B:** Professional/Corporate ("The Analyst", "The Leader")
- **Option C:** Hybrid (fantasy names but grounded descriptions)
- **Decision:** TBD - depends on brand tone

### 2. Career Data Sources

- **RIASEC codes:** O\*NET (free, comprehensive)
- **OCEAN requirements:** Need to build custom mapping (no standard exists)
- **Jungian fit:** Use function-based heuristics (Ti → technical, Fe → social, etc.)
- **Question:** Should we crowdsource OCEAN/Jungian career fits from users? (future feature)

### 3. Team Compatibility Model

- **Option A:** Belbin's 9 Team Roles (well-known, research-backed)
- **Option B:** Custom TACo model (more flexible, less academic)
- **Option C:** RIASEC-only (simpler, already have data)
- **Decision:** TBD

### 4. Growth Roadmap Resources

- **Sources:** Books (Amazon affiliate?), Courses (Udemy/Coursera), Free resources
- **Personalization:** Filter by budget, time commitment, learning style?
- **Question:** Should users be able to mark resources as "completed" and track growth?

### 5. PDF Export

- **Library:** jsPDF, Puppeteer, or CSS print styles?
- **Premium only?** Yes (Tenure Extras feature)
- **Branding:** Include TACo logo, user's RIASEC colors

---

## Success Metrics

### User Engagement

- **Completion Rate:** % of users who finish all 3 assessments
- **Report Views:** How many users view the Extended Report after unlocking
- **Time on Report:** Average session duration on report page
- **Return Visits:** Do users come back to re-read their report?

### Conversion Metrics

- **Paywall Impressions:** How many free users see paywall
- **Upgrade Rate:** % of paywall viewers who upgrade to Tenure Extras
- **Feature Value Perception:** Survey question "Was Extended Report worth the upgrade?"

### Quality Metrics

- **Accuracy:** User survey "How accurate was your archetype?" (1-5 scale)
- **Actionability:** "Did you take action based on report insights?" (yes/no)
- **NPS:** "How likely are you to recommend TACo based on this report?" (0-10)

---

## Future Enhancements (Post-Launch)

1. **Share Report** - Generate shareable link for recruiters/managers
2. **Team Report** - Compare profiles across a team (Nurture integration?)
3. **Longitudinal Tracking** - Re-take assessments yearly, track changes
4. **AI Insights** - Use LLM to generate personalized narrative (premium)
5. **Video Walkthrough** - Automated video explaining user's report
6. **Career Path Simulator** - "What if I develop skill X? How would my matches change?"

---

## Dependencies

### Internal

- ✅ Assessment Store (`assessment-store.ts`) - already implemented
- ✅ RIASEC scoring logic (`discover.schema.ts`) - already implemented
- ✅ OCEAN scoring logic (`ocean.ts`) - already implemented
- ✅ Jungian scoring logic (`jungian.ts`) - already implemented
- ✅ RIASEC color system (`riasec-colors.ts`) - already implemented
- ⏳ Premium feature gating (blocked on auth/billing - see `PREMIUM_FEATURES_PLAN.md`)

### External

- O\*NET API (career data) - free, no auth required
- BLS API (salary/growth data) - free, registration required
- Recharts (charting library) - already in `package.json`

### Data Creation

- Archetype mapping table (custom, needs design)
- Career trait requirements (custom, needs research)
- Team role logic (custom or Belbin license?)
- Growth resource library (curation effort)

---

## References

### Research Foundations

- **RIASEC/Holland Codes:** Holland, J. L. (1997). _Making Vocational Choices_
- **Big Five/OCEAN:** Costa, P. T., & McCrae, R. R. (1992). _NEO PI-R_
- **Jungian Types:** Jung, C. G. (1971). _Psychological Types_
- **Team Roles:** Belbin, R. M. (2010). _Management Teams_

### Similar Products (for inspiration, not copying)

- 16Personalities (MBTI) - great UX, visual design
- CliftonStrengths - actionable insights, growth focus
- LinkedIn Career Explorer - career matching based on skills
- Crystal Knows - personality-based communication tips

---

## Timeline Estimate

**Total:** ~6 weeks (1 engineer, full-time)

| Phase                 | Duration | Dependencies            |
| --------------------- | -------- | ----------------------- |
| Data Foundation       | 2 weeks  | None                    |
| Core Logic            | 1 week   | Data Foundation         |
| UI Components         | 1 week   | Core Logic              |
| Main Report Container | 1 week   | UI Components           |
| Premium Gating        | 0.5 week | Auth/Billing (external) |
| Polish & Launch       | 0.5 week | All above               |

**Blockers:**

- Premium feature gating requires auth/billing system (see `PREMIUM_FEATURES_PLAN.md`)
- Can build report in parallel, gate access later

---

## Next Steps

1. **Review this plan** - Get stakeholder approval on scope, approach, timeline
2. **Prioritize vs. other features** - Does this beat other roadmap items?
3. **Decide archetype naming** - Fantasy vs. professional tone?
4. **Start data curation** - Begin building archetype + career trait tables
5. **Prototype Section 1** - Build archetype section as proof of concept
6. **User research** - Would beta testers pay for this? What price point?

---

**Document Owner:** TACo Product Team  
**Contributors:** Claude (AI Assistant), Erikk Shupp  
**Next Review:** After auth/billing system planning complete
