# Augment: Career Intelligence & Job Tracking

## Vision

Augment is your personal career intelligence system—a lifetime companion for building deep self-knowledge of your professional identity. It serves you when job hunting AND when employed, creating a living repository of your career story.

## Philosophy

Understanding yourself professionally is the mission. Job tracking is a powerful utility that serves that understanding. Over time, Augment becomes your career memory, insight engine, and narrative builder.

## Current Features (MVP)

### 1. Discover - Professional Self-Knowledge

**IO Psychology Assessment (RIASEC)**

- Holland Code personality evaluation
- Career aptitude profiling
- Work style analysis
- **Purpose:** Foundation of your career identity

### 2. Matches - Career Exploration

**Personality-Aligned Career Suggestions**

- RIASEC-based job recommendations
- Career fit scoring
- Industry exploration
- **Purpose:** Apply self-knowledge to career possibilities

### 3. Prospect - Job Application Pipeline

**Application Tracking & Analytics**

**Features:**

- Kanban pipeline (8 statuses: Saved → Offer)
- Dashboard with real-time stats
- Analytics & insights (Sankey flow visualization)
- Rejection tracking (capture drop-off points)
- Archive filtering (show/hide rejected/withdrawn)
- RIASEC integration (personality fit per job)

**Pipeline Statuses:**

1. **Saved** - Jobs you're considering
2. **Applied** - Submitted applications
3. **Phone Screen** - Initial conversation
4. **Technical** - Skills assessment
5. **Onsite** - In-person/final interview
6. **Offer** - Job offers received
7. **Rejected** - Application declined
8. **Withdrawn** - You withdrew

**Purpose:** Learn from your job hunt journey, track progress, gain insights

## Use Cases

### Job Seeker (Current Focus - MVP)

1. **Discover** → Take RIASEC assessment, understand your work personality
2. **Explore** → Find careers aligned with your profile
3. **Track** → Manage applications, analyze drop-offs, optimize strategy
4. **Learn** → Build insights about what works for YOUR career

### Employed Professional (Roadmap)

1. **Archive** → Document accomplishments quarterly (see Job Accomplishment Tracker)
2. **Reflect** → Build career narrative over time
3. **Prepare** → Export to resume, performance reviews, portfolio
4. **Transition** → When ready for next role, your career story is ready

## Integration Between Features

**Discovery → Exploration:**

- RIASEC scores inform job recommendations
- Personality profile highlights best-fit careers

**Exploration → Tracking:**

- Matched jobs can be added directly to pipeline
- RIASEC fit score preserved on each application

**Tracking → Learning:**

- Sankey flow shows drop-off patterns
- Rejection analysis reveals strategy improvements
- Over time, pattern recognition guides career decisions

## Technical Architecture

**Design System:** Maximalist + Liquid theme

- Duotone color system (RIASEC-based)
- Fluid animations & glassmorphic UI
- Responsive kanban board
- Real-time stats dashboard

**Data Storage:** LocalStorage (client-side)

- Privacy-first (your data stays local)
- No server required for core features
- Export/import for backup

**Tech Stack:**

- SolidJS (reactive UI)
- TypeScript (type safety)
- D3 (Sankey visualizations)
- Zod (schema validation)

## Roadmap

### Phase 1: Job Tracking MVP ✅ (Current)

- RIASEC assessment
- Career matching
- Pipeline kanban
- Analytics dashboard
- Rejection tracking

### Phase 2: Insights & Optimization (Q2 2027)

- Conversion funnel metrics
- Time-to-offer analytics
- Application success patterns
- Strategy recommendations

### Phase 3: Career Lifecycle (Q3 2027+)

- Job Accomplishment Tracker integration
- Quarterly check-ins for employed users
- Career repository/archive
- Resume/portfolio exports
- Lifetime career narrative building

## Why Augment?

**Existing tools treat job hunting as transactional:**

- Apply to 100 jobs → hope for callbacks
- No self-knowledge, just volume
- Ends when you get hired

**Augment treats your career as continuous:**

- Understand yourself FIRST
- Track applications to LEARN (not just manage)
- Build a repository that serves you for LIFE
- Job hunting is ONE phase of career intelligence

## Key Differentiators

1. **IO Psychology Foundation** - Science-backed personality assessment
2. **Learning-Focused** - Track to learn, not just organize
3. **Lifetime Value** - Useful when job hunting AND employed
4. **Privacy-First** - Your data stays local
5. **Career Intelligence** - Not just tracking, but understanding

## Success Metrics

**For Job Seekers:**

- Time to offer (reduced through strategy insights)
- Application quality (fewer, better-fit applications)
- Self-knowledge clarity (personality → career alignment)

**For Employed Users (Future):**

- Career narrative completeness
- Accomplishment documentation frequency
- Readiness for next career transition

## Philosophy in Action

> "Most job trackers help you organize applications. Augment helps you understand your career. Tracking is the tool. Self-knowledge is the mission."

---

**See also:**

- [Job Accomplishment Tracker](./JOB_ACCOMPLISHMENT_TRACKER.md) - Future employed user features
- [Roadmap: Billing & Auth](./ROADMAP_BILLING_AUTH.md) - Monetization strategy
