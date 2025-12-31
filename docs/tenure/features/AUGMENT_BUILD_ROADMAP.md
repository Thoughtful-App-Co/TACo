# Augment Build Roadmap

## Current Status (Phase 2 Complete - Text Parsing Works!)

### ✅ Completed

- **Phase 1**: Schema layer (Prepare, Prosper, enhanced Pipeline)
- **Phase 2**: Resume parser with AI integration
  - ResumeUploader component (drag-drop, file/text modes)
  - resume-parser.service.ts (API client)
  - /api/resume/parse endpoint (Claude 3.5 Sonnet)
  - PrepareApp container
  - Integration into 4-tab navigation

### 🚧 In Progress

- Local development setup with API keys

---

## Monetization Architecture (Future Implementation)

### License Key System Design

**Concept:** Software license keys that grant access to AI API calls via TACo backend

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                         │
│  localStorage: { licenseKey: "taco_pro_abc123..." }         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               CLOUDFLARE WORKER (Backend)                    │
│                                                              │
│  1. Validate license key (check KV store)                   │
│  2. Verify tier limits (free/pro/enterprise)                │
│  3. Check usage quota (calls this month < limit)            │
│  4. Log request for billing/analytics                       │
│  5. Call Anthropic API with OUR key (never exposed)         │
│  6. Increment usage counter                                 │
│  7. Return result to client                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      ANTHROPIC API                           │
│            (API key stored in CF secrets)                    │
└─────────────────────────────────────────────────────────────┘
```

### Security Best Practices

**Key Principles:**

1. ✅ **Server-side key storage only** - Anthropic key NEVER in client code
2. ✅ **Per-user rate limiting** - Prevent abuse/runaway costs
3. ✅ **Usage tracking** - Log every API call for billing
4. ✅ **Cost alerts** - Anthropic billing notifications at thresholds
5. ✅ **Circuit breaker** - Auto-disable if costs spike unexpectedly

### Tier Structure (Proposed)

| Tier           | Price/Month | API Calls | Models     | Support   |
| -------------- | ----------- | --------- | ---------- | --------- |
| **Free**       | $0          | 100       | Haiku only | Community |
| **Pro**        | $29         | 10,000    | All models | Email     |
| **Enterprise** | Custom      | Unlimited | All models | Priority  |

### Implementation Checklist

- [ ] Create Cloudflare KV namespace for license keys
- [ ] Add license key validation middleware
- [ ] Implement per-key usage tracking
- [ ] Set up usage limits per tier
- [ ] Add Anthropic cost monitoring
- [ ] Create admin dashboard for key management
- [ ] Implement auto-renewal/billing integration
- [ ] Add usage analytics per customer
- [ ] Set up cost alerts (Slack/email)
- [ ] Document API rate limits publicly

### Alternative: BYOK (Bring Your Own Key)

**For enterprise/privacy-conscious users:**

- Allow users to provide their own Anthropic API key
- Stored encrypted in their browser (localStorage)
- Bypasses our API key and billing
- Use case: Large companies with existing Anthropic contracts

---

## Current Development Setup

### Local Testing (MVP)

**File:** `.dev.vars` (gitignored)

```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

**Risk:** Development API key exposed in local environment
**Mitigation:**

- Key only in `.dev.vars` (never committed)
- Personal dev keys, not production
- Set Anthropic billing alerts

**TODO:** Implement license key system before production deployment

---

## Next Steps (Phase 3)

### Prepare Module - Core Features

#### PDF/DOCX Parsing (Priority: High)

**Status:** Currently only supports pasted text  
**Implementation needed:**

- [x] Add PDF parsing library (`pdfjs-dist`)
- [x] Add DOCX parsing library (`mammoth`)
- [ ] Update `/api/resume/parse` endpoint to extract text from binary files
- [ ] Handle base64 encoded file uploads
- [x] Add file size/page limits (security)
- [ ] Test with various resume formats (single/multi-column, tables, etc.)

**Libraries used:**

- `pdfjs-dist` - Mozilla's PDF.js (browser-compatible, configured globally)
- `mammoth` - DOCX to HTML/text converter (browser-compatible)
- Client-side extraction using file-extractor.service.ts

#### Wizard Components

1. **ExperienceEditor.tsx** - Add/edit work experiences
2. **ProjectEditor.tsx** - Projects with quantifiable metrics
3. **MetricsEditor.tsx** - Achievement templates (% improvement, $ saved, etc.)
4. **SkillsManager.tsx** - Skills with autocomplete
5. **SummaryGenerator.tsx** - AI-powered professional summary
6. **ResumeVariants.tsx** - Manage tailored versions
7. **ResumeMutator.tsx** - AI tailoring for job descriptions
8. **ResumePreview.tsx** - Live preview + PDF/DOCX export

### Prosper Module - Career Journal

1. **EmploymentStatus.tsx** - "I am employed" toggle
2. **CheckInWizard.tsx** - Quarterly reflection flow
3. **AccomplishmentLog.tsx** - Quick capture between check-ins
4. **CareerTimeline.tsx** - Visual timeline with mood indicators
5. **SatisfactionChart.tsx** - Trend analysis
6. **InsightsPanel.tsx** - AI pattern detection
7. **ExportPanel.tsx** - Resume bullets, performance reviews

---

## Notes

- **API Key Management** decision made: 2025-12-21
- License key system designed but not yet implemented
- Current approach: Direct API key in `.dev.vars` for local dev only
- Production deployment requires license key validation before launch

---

## Related Docs

- [AUGMENT.md](./AUGMENT.md) - Feature overview
- [JOB_ACCOMPLISHMENT_TRACKER.md](./JOB_ACCOMPLISHMENT_TRACKER.md) - Prosper spec
- [ROADMAP_BILLING_AUTH.md](./ROADMAP_BILLING_AUTH.md) - Billing architecture
