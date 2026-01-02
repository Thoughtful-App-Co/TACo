# Changelog

All notable changes to TACo (Thoughtful App Co.) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0-beta] - 2026-01-XX

### 🎉 First Official Beta Release - "First Light"

This release marks the first feature-complete beta of **Tenure**, the career intelligence platform. All core modules (Discover, Prepare, Prospect, Prosper) are fully functional and production-ready.

### Added

#### Discover - Self-Assessment Suite

- **RIASEC Holland Code Assessment** - 60-question I/O psychology career aptitude test
- **OCEAN Big Five Personality Assessment** - Comprehensive personality inventory with percentile scoring
- **Jungian Cognitive Function Assessment** - MBTI-style personality typing with 16 types
- **Extended Profile Report** - Unified report combining all three assessments with career recommendations
- **Assessment History** - Track multiple assessment completions with date stamps and re-test capability

#### Prepare - Resume Intelligence

- **PDF/DOCX Resume Parsing** - Smart extraction of work history, education, and skills from uploaded resumes
- **Master Resume Storage** - Centralized source-of-truth resume with structured data model
- **AI-Powered Resume Mutation** - Claude Sonnet 4 integration for tailoring resumes to specific job descriptions
- **Cover Letter Generation** - Job-aware cover letter creation with company research integration
- **Resume Variant Repository** - Save and manage multiple customized resume versions
- **Job Title Mode Selector** - Toggle between exact role match and flexible skill-based positioning

#### Prospect - Application Pipeline

- **8-Stage Kanban Pipeline** - Drag-and-drop job tracking (Saved → Applied → Phone → Technical → Onsite → Offer → Rejected/Withdrawn)
- **Dashboard with Analytics** - Real-time stats, conversion metrics, and application velocity tracking
- **Sankey Flow Visualization** - Visual pipeline flow showing drop-off points and conversion rates
- **Aging Alerts** - Configurable stale application detection with batch action suggestions
- **Bulk Actions** - Archive, status update, and delete operations across multiple applications
- **CSV Import/Export** - Import from spreadsheets with field mapping; export with customizable columns
- **Notification Center** - In-app alerts for aging applications and interview reminders
- **Archive System** - Show/hide rejected applications while preserving historical data

#### Prosper - Career Journal

- **Quarterly Check-Ins** - Structured reflection prompts with mood tracking and satisfaction scoring
- **Accomplishment Logging** - Capture wins with quantifiable metrics, tags, and resume export readiness
- **Salary History Tracking** - Per-year salary entry with base + bonus + equity breakdown
- **Salary Range Quick-Fill** - Interpolate salary growth from start → current salary
- **360 Review Cycles** - Create review periods, collect self-reviews and external feedback
- **Accolades Collection** - Capture and categorize positive feedback from peers and managers
- **Salary Growth Chart** - Visualization of compensation over time

#### Infrastructure

- **Progressive Web App (PWA)** - Offline-first architecture with install-to-home-screen capability
- **localStorage Persistence** - Privacy-first client-side data storage with automatic save
- **Emergency Data Export** - One-click JSON export for backup and disaster recovery
- **7 Theme System** - Liquid, Brutalist, Biophilic, Maximalist, Daylight, Zen Touch, Papermorphic
- **Responsive Design** - Mobile, tablet, and desktop-optimized layouts
- **Font System** - Custom typography with Playfair Display, Space Grotesk, and Geist Mono

### Changed

- Reorganized feature documentation into `/docs/tenure/features/v1/` (shipped) and `/docs/tenure/features/v2/` (deferred)
- Feature-gated BLS market comparison (infrastructure complete, requires SOC code mapping)

### Deferred to v2

- **Market Salary Comparison** - BLS wage percentile overlay (chart infrastructure complete, SOC mapping needed)
- **Career Matching** - Personality-based job recommendations (marked as future roadmap)
- **SOC Code Auto-Detection** - Automatic job title → occupation code mapping

### Technical

- **Framework:** SolidJS 1.8.0
- **Language:** TypeScript 5.3.0
- **Validation:** Zod 3.25.76
- **Charts:** D3 7.9.0
- **AI:** Claude Sonnet 4 via Anthropic SDK 0.71.0
- **Build:** Vite 5.0.0
- **PWA:** vite-plugin-pwa 1.2.0
- **Hosting:** Cloudflare Pages + Functions

### Fixed

- BLS API integration stability improvements
- Resume parsing edge cases for non-standard formats
- Kanban drag-and-drop performance on large pipelines
- Theme persistence across module navigation

### Known Limitations

- No cloud sync (all data is client-side by design for privacy)
- No cross-device synchronization
- No authentication system (MVP deliberate choice)
- Export formats limited to JSON (no direct PDF resume export)
- Labor market data is US-centric (O\*NET and BLS)

### Security

- Client-side encryption for sensitive data (planned for v2)
- No external tracking or analytics
- Privacy-first design with all data stored locally

---

## [Unreleased]

### Planned for v2

- BLS market salary comparison with SOC code integration
- Career matching recommendations based on personality assessments
- Multi-device sync (requires authentication system)
- Enhanced labor market analytics
- PDF resume export
- International labor market data (Eurostat for EU)

---

**Legend:**

- ✅ Shipped in this release
- ⏸️ Deferred to v2
- 🚧 In progress
- 📋 Planned

For detailed feature documentation, see `/docs/tenure/features/v1/FEATURE_MANIFEST.md`
