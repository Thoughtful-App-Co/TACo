# Tenure v1 Feature Manifest (0.1.0-beta)

## Release: 0.1.0-beta

**Release Date:** January 2026  
**Codename:** "First Light"  
**Status:** Official Beta Release

---

## Shipped Features

### Discover (Self-Assessment Suite) ✅

**Purpose:** Build deep professional self-knowledge through validated personality assessments

- ✅ **RIASEC Holland Code Assessment**
  - 60-question I/O psychology-based career aptitude test
  - Six-factor personality profile (Realistic, Investigative, Artistic, Social, Enterprising, Conventional)
  - Career alignment scoring
  - Stored history with re-test capability

- ✅ **OCEAN Big Five Personality Assessment**
  - 60-question personality inventory (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism)
  - Percentile scoring against population norms
  - Work style insights and team role suggestions
  - Integration with Extended Profile Report

- ✅ **Jungian Cognitive Function Assessment**
  - MBTI-style personality typing
  - 16 personality type framework
  - Cognitive function stack analysis
  - Career path recommendations per type

- ✅ **Extended Profile Report**
  - Unified report combining RIASEC + OCEAN + Jungian
  - Career archetype identification
  - Team role mapping
  - Recommended occupations with O\*NET integration
  - Export capability (PDF-ready)

- ✅ **Assessment Data Management**
  - localStorage persistence
  - Assessment history tracking
  - Re-take functionality with date stamping
  - Data export for backup

---

### Prepare (Resume Intelligence) ✅

**Purpose:** Transform static resumes into dynamic, mutation-ready career documents

- ✅ **Resume Parsing (PDF/DOCX)**
  - Intelligent extraction of work history, education, skills
  - Support for multiple resume formats
  - Automatic section detection (contact, summary, experience, education, skills)
  - Preservation of original formatting metadata

- ✅ **Master Resume Storage**
  - Centralized "source of truth" resume
  - Structured data model (experiences, education, skills, certifications)
  - Version control for master resume updates
  - Easy editing of individual sections

- ✅ **Resume Mutation for Job Targeting**
  - AI-powered resume tailoring to job descriptions
  - Claude Sonnet integration for content optimization
  - Bullet point rewriting with keyword alignment
  - Skills emphasis based on job requirements
  - Mutation history tracking

- ✅ **Cover Letter Generation**
  - Job description-aware cover letter creation
  - Company research integration
  - Tone and style customization
  - Template system with smart placeholders

- ✅ **Resume Variant Repository**
  - Save and manage multiple resume versions
  - Per-job customization storage
  - Variant comparison view
  - Quick recall for similar job applications

- ✅ **Job Title Mode Selector**
  - Toggle between exact role match and flexible positioning
  - Skill-based framing for career pivots
  - Experience emphasis adjustment

---

### Prospect (Application Pipeline) ✅

**Purpose:** Transform job tracking from spreadsheet chaos into strategic intelligence

- ✅ **8-Stage Kanban Pipeline**
  - Drag-and-drop job cards across statuses
  - Stages: Saved → Applied → Phone Screen → Technical → Onsite → Offer → Rejected/Withdrawn
  - Real-time status updates
  - Color-coded card system with company branding

- ✅ **Dashboard with Real-Time Stats**
  - Application count by status
  - Average time-to-offer metrics
  - Conversion funnel percentages
  - Offer vs rejection ratio
  - Weekly application velocity

- ✅ **Sankey Flow Visualization**
  - Visual pipeline flow showing drop-off points
  - Conversion rate display per stage transition
  - Interactive drill-down into stage-specific data
  - Export-ready analytics charts

- ✅ **Aging Alerts & Stale Application Detection**
  - Configurable aging thresholds per pipeline stage
  - Visual indicators for stale applications
  - Batch action suggestions for old applications
  - "Days since last update" tracking

- ✅ **Bulk Actions**
  - Archive/restore multiple applications
  - Bulk status updates
  - Mass delete with confirmation
  - Tag management across selections

- ✅ **CSV Import/Export**
  - Import from existing job tracking spreadsheets
  - Field mapping interface
  - Export with customizable columns
  - Backup-friendly format

- ✅ **Notification Center**
  - In-app notification system
  - Aging application alerts
  - Interview reminders
  - Configurable notification preferences

- ✅ **Archive System**
  - Show/hide rejected and withdrawn applications
  - Preserve historical data for analysis
  - Restore capability
  - Permanent delete with confirmation

---

### Prosper (Career Journal) ✅

**Purpose:** Document career growth through quarterly reflections and accomplishment tracking

- ✅ **Quarterly Check-Ins**
  - Structured reflection prompts (What's going well? Challenges? Learning goals?)
  - Mood tracking (Thriving → Burnt-out scale)
  - Satisfaction scoring (1-10 scale)
  - Skills gained tracking
  - Certifications and training log

- ✅ **Accomplishment Logging**
  - Capture wins with quantifiable metrics
  - Types: Project, Metric, Recognition, Learning, Milestone
  - Tag system for easy filtering
  - Resume export readiness flag
  - Link to specific job experiences

- ✅ **Salary History Tracking**
  - Per-year salary entry with base + bonus + equity breakdown
  - Quick-fill salary range (start → current with interpolation)
  - Total compensation toggle
  - Company and title association
  - Chart visualization of salary growth over time

- ✅ **360 Review Cycle Management**
  - Create review periods with custom questions
  - Self-review with structured prompts
  - External feedback collection via shareable links
  - Anonymous feedback support
  - Ratings across 6 competency dimensions

- ✅ **Accolades Collection**
  - Capture positive feedback from peers, managers, customers
  - Source tracking (external feedback, awards, recognition)
  - Categorization by skill area
  - Public/private visibility toggle
  - Resume export capability

- ⏸️ **Market Salary Comparison** → Deferred to v2
  - BLS wage percentile overlay
  - SOC code mapping
  - Geographic wage comparison

---

### Infrastructure ✅

- ✅ **Progressive Web App (PWA)**
  - Offline-first architecture
  - Install to home screen capability
  - Service worker caching
  - Background sync (future)

- ✅ **localStorage Persistence**
  - All data stored client-side
  - Privacy-first design (no server tracking)
  - Automatic save on every action
  - Version migration system

- ✅ **Emergency Data Export**
  - One-click JSON export of all app data
  - Backup recommendation system
  - Import capability for disaster recovery

- ✅ **Theme System**
  - 7 theme options: Liquid, Brutalist, Biophilic, Maximalist, Daylight, Zen Touch, Papermorphic
  - Per-module theme persistence
  - Smooth theme transitions
  - Color-coded module identity

- ✅ **Responsive Design**
  - Mobile-optimized UI
  - Tablet layout support
  - Desktop-first workflows

- ✅ **Font System**
  - Playfair Display (headings)
  - Space Grotesk (body text)
  - Geist Mono (code/data)
  - Custom Shupp branding font

---

## Deferred to v2 (See `/docs/tenure/features/v2/`)

- ⏸️ BLS Market Salary Comparison (infrastructure complete, requires SOC mapping)
- ⏸️ Career Matching Recommendations (marked as "LATER" in TENURE.MD)
- ⏸️ SOC Code Auto-Detection from Job Titles

---

## Technical Stack

- **Framework:** SolidJS 1.8+
- **Language:** TypeScript 5.3+
- **Validation:** Zod 3.25+
- **Visualization:** D3 7.9+
- **AI:** Claude Sonnet 4 (via Anthropic SDK)
- **Hosting:** Cloudflare Pages + Functions
- **Build:** Vite 5.0+
- **PWA:** vite-plugin-pwa 1.2+

---

## Known Limitations

1. **No Cloud Sync:** All data is local-only (by design for privacy)
2. **Single-Device:** No cross-device synchronization
3. **No Authentication:** No user accounts (MVP deliberate choice)
4. **Limited Export Formats:** JSON only (no direct PDF resume export)
5. **US-Centric Labor Data:** O\*NET and BLS are US-focused

---

## Success Metrics (Post-Launch)

- [ ] 100+ active users within first month
- [ ] Average 3+ assessments completed per user
- [ ] 50+ resumes parsed
- [ ] 1,000+ job applications tracked
- [ ] 10+ quarterly check-ins logged

---

## Next Steps → v2

See `/docs/tenure/features/v2/` for roadmap items including:

- Market salary comparison with BLS integration
- Career matching recommendations
- Enhanced labor market analytics
- Multi-device sync (post-authentication)
