# Job Accomplishment Tracker

## Overview

A feature to help employed users track, reflect on, and document their work accomplishments while in a job. This creates a living repository of achievements for future job searches, performance reviews, and self-motivation.

## Core Problem

When job searching, people struggle to recall specific accomplishments from previous roles. By the time they need to update their resume, they've forgotten crucial details about projects, metrics, and impact. Additionally, workers often lose sight of their progress and value during challenging periods.

## Solution

Provide a quarterly check-in system that helps users:

1. **Record accomplishments** as they happen
2. **Reflect** on how they're feeling about their work
3. **Document projects** that can't be shown publicly (NDA, proprietary)

## Key Features

### Quarterly Check-ins

- **Automatic prompts** every 3 months while status = "accepted" (employed)
- **Flexible timing** - can skip, snooze, or complete early
- **Notification system** - gentle reminders without being intrusive

### Accomplishment Logging

#### What to Track:

- **Projects completed** - Name, description, your role, technologies used
- **Metrics/Impact** - Quantifiable results (e.g., "Reduced load time by 40%", "Saved company $50k annually")
- **Skills developed** - New technologies, methodologies, certifications
- **Leadership/Collaboration** - Mentoring, cross-functional work, presentations
- **Recognition** - Awards, promotions, positive feedback

#### Data Structure:

```typescript
interface JobAccomplishment {
  id: string;
  jobApplicationId: string; // Links to the job you accepted
  quarter: string; // e.g., "Q1 2025"
  createdAt: Date;

  // Accomplishments
  projects: {
    name: string;
    description: string;
    role: string;
    technologies: string[];
    impact?: string; // Quantifiable results
    startDate?: Date;
    endDate?: Date;
    canShowPublicly: boolean; // NDA/proprietary flag
    artifacts?: string[]; // Screenshots, links (if shareable)
  }[];

  // Reflection
  satisfactionScore: number; // 1-10 scale
  mood: 'thriving' | 'satisfied' | 'neutral' | 'struggling' | 'burnt-out';
  whatIsGoingWell: string;
  challenges: string;
  learningGoals: string;

  // Career development
  skillsGained: string[];
  certificationsEarned: string[];

  // Optional
  notes: string;
}
```

### Reflection Component

**Why This Matters:**

- **Self-awareness** - Regular check-ins help identify patterns (e.g., "I'm consistently unhappy in Q4, maybe I need more PTO")
- **Early warning system** - Catch burnout before it gets severe
- **Motivation** - Looking back at accomplishments reminds you of your value

**Questions to Prompt:**

1. **How are you feeling about your work?** (1-10 scale + mood selector)
2. **What's going well?** (Free text)
3. **What's challenging?** (Free text)
4. **What do you want to learn next?** (Free text)

### Privacy & Portability

**NDA-Friendly:**

- Flag projects as "Can't show publicly"
- Still capture details for your own reference
- Export excludes sensitive info when sharing

**Export Formats:**

- **Resume bullets** - Auto-generated achievement statements
- **Performance review** - Organized by quarter with metrics
- **Portfolio** - Only public projects
- **Full backup** - JSON export for portability

## User Journey

### Scenario 1: New Hire

1. User accepts job offer → Status changes to "accepted"
2. System creates quarterly check-in schedule
3. After 3 months, user gets gentle prompt: "Time to reflect on Q1!"
4. User spends 15 minutes documenting 2-3 key projects
5. Logs satisfaction score, notes they're excited about new tech stack

### Scenario 2: Job Search (2 years later)

1. User decides to start job searching again
2. Opens "Career Repository" in Prospect
3. Sees 8 quarters of documented accomplishments
4. Exports as "Resume Bullets"
5. Has specific, quantifiable achievements ready to use

### Scenario 3: Performance Review

1. Annual review coming up
2. User opens last 4 quarters of check-ins
3. Has concrete list of projects, metrics, and growth areas
4. Walks into review with confidence and data

## UI/UX Considerations

### When to Surface

- **Quarterly prompts** - Notification + dashboard banner
- **Dedicated section** in Prospect (e.g., sidebar: "My Career Journal")
- **Job detail view** - Show accomplishments for accepted roles

### Design Principles

- **Quick capture** - Should take 10-15 minutes max
- **Template-driven** - Pre-filled questions to guide reflection
- **Visual timeline** - See quarters at a glance with mood indicators
- **Exportable** - One-click to get resume bullets

### Mobile Considerations

- Voice-to-text for faster input
- Photo upload for artifacts
- Push notifications for quarterly reminders

## Technical Considerations

### Data Storage

- Local-first with optional cloud sync
- Encrypted for sensitive project details
- Version history (in case of accidental deletion)

### Integration Points

- **RIASEC Assessment** - Correlate satisfaction with personality fit
- **Job Applications** - Link accomplishments to specific roles
- **Resume Builder** - Auto-populate from repository

### AI Enhancements (Future)

- **Auto-generate resume bullets** from freeform notes
- **Suggest metrics** based on role type
- **Identify patterns** - "You seem happiest when working on frontend projects"
- **Career trajectory insights** - "Your skills have evolved from junior → senior in these areas"

## Success Metrics

1. **Engagement** - % of users who complete quarterly check-ins
2. **Retention** - Users with 4+ quarters logged
3. **Export rate** - % who export accomplishments when job searching
4. **Satisfaction** - User feedback on helpfulness during job search

## Phase 1 (MVP)

- Quarterly check-in prompts
- Basic accomplishment form (projects, satisfaction score, notes)
- Timeline view of past quarters
- Export to text/markdown

## Phase 2

- NDA flagging and privacy controls
- Skill tracking integration
- Resume bullet generation
- Performance review export format

## Phase 3

- AI-powered insights and pattern detection
- Mobile app with voice input
- Team collaboration (for managers tracking team growth)
- Integration with LinkedIn/portfolio sites

## Related Features

- **Prospect (Job Hunt Tracker)** - Where this lives
- **Discover (RIASEC)** - Personality fit correlation
- **Profile Builder** - Resume/experience management
- **Nurture** - Career growth and learning

---

## Key Insight

This feature transforms Prospect from just a job hunting tool into a **career lifecycle companion**. It's useful when you're looking for a job AND when you're employed, creating continuous value and stickiness.
