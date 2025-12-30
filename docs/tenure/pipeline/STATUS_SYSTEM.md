# Pipeline Status System

**Last Updated:** December 29, 2025  
**Version:** 2.0

---

## Overview

The Tenure Pipeline uses an 8-stage status system to track job applications from initial discovery through final outcomes.

---

## Status Definitions

### Active Progression Statuses

These represent the forward progression of an application:

| Status         | Label     | Description                                                                                 | Typical Actions                                            |
| -------------- | --------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `saved`        | Saved     | Bookmarked for future consideration, not yet applied                                        | Review job details, prepare application materials          |
| `applied`      | Applied   | Application has been submitted                                                              | Wait for initial response, prepare for potential screening |
| `screening`    | Screen    | Initial contact/conversations with recruiter or hiring manager (not official interview yet) | Prepare for phone screen, research company                 |
| `interviewing` | Interview | In official interview process (phone screens, technical assessments, panel interviews)      | Prepare questions, practice answers, follow up             |
| `offered`      | Offer     | Received formal job offer                                                                   | Review terms, negotiate if needed, make decision           |

### Terminal Statuses

These represent final outcomes:

| Status      | Label     | Description                      | Color           |
| ----------- | --------- | -------------------------------- | --------------- |
| `accepted`  | Accepted  | Offer accepted, job secured      | Green (#34D399) |
| `rejected`  | Rejected  | Rejected by company at any stage | Gray (#9CA3AF)  |
| `withdrawn` | Withdrawn | User withdrew from consideration | Gray (#9CA3AF)  |

---

## Status Constants

**File:** `src/schemas/pipeline.schema.ts`

### All Statuses (Ordered)

```typescript
export const STATUS_ORDER: ApplicationStatus[] = [
  'saved',
  'applied',
  'screening',
  'interviewing',
  'offered',
  'accepted',
  'rejected',
  'withdrawn',
];
```

**Use this for:** Dropdowns, full status lists, sorting

### Active Statuses Only

```typescript
export const ACTIVE_STATUSES: ApplicationStatus[] = [
  'saved',
  'applied',
  'screening',
  'interviewing',
  'offered',
];
```

**Use this for:** Pipeline columns, active progress tracking, excluding terminal states

### Terminal Statuses

```typescript
export const TERMINAL_STATUSES: ApplicationStatus[] = ['accepted', 'rejected', 'withdrawn'];
```

**Use this for:** Archive views, completion tracking, statistics

---

## Status Colors

**File:** `src/components/tenure/pipeline/theme/liquid-tenure.ts`

```typescript
export const statusColors = {
  saved: {
    bg: 'rgba(100, 116, 139, 0.15)',
    border: 'rgba(100, 116, 139, 0.3)',
    text: '#94A3B8', // Slate
  },
  applied: {
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.3)',
    text: '#60A5FA', // Blue
  },
  screening: {
    bg: 'rgba(6, 182, 212, 0.15)',
    border: 'rgba(6, 182, 212, 0.3)',
    text: '#22D3EE', // Cyan
  },
  interviewing: {
    bg: 'rgba(139, 92, 246, 0.15)',
    border: 'rgba(139, 92, 246, 0.3)',
    text: '#A78BFA', // Purple
  },
  offered: {
    bg: 'rgba(234, 179, 8, 0.15)',
    border: 'rgba(234, 179, 8, 0.3)',
    text: '#FBBF24', // Amber
  },
  accepted: {
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.3)',
    text: '#34D399', // Green
  },
  rejected: {
    bg: 'rgba(107, 114, 128, 0.1)',
    border: 'rgba(107, 114, 128, 0.2)',
    text: '#9CA3AF', // Gray
  },
  withdrawn: {
    bg: 'rgba(107, 114, 128, 0.1)',
    border: 'rgba(107, 114, 128, 0.2)',
    text: '#9CA3AF', // Gray
  },
};
```

---

## Status History

Every status change is tracked with a timestamp and optional note:

```typescript
export interface StatusChange {
  status: ApplicationStatus;
  timestamp: Date;
  note?: string; // Optional context about the change
}

interface JobApplication {
  // ...
  status: ApplicationStatus; // Current status
  statusHistory: StatusChange[]; // Full history
  rejectedAtStatus?: ApplicationStatus; // Track which stage rejection occurred
  // ...
}
```

### Example Status History

```javascript
statusHistory: [
  {
    status: 'saved',
    timestamp: new Date('2025-12-20T10:00:00Z'),
    note: 'Found on LinkedIn',
  },
  {
    status: 'applied',
    timestamp: new Date('2025-12-21T14:30:00Z'),
    note: 'Submitted via company portal',
  },
  {
    status: 'screening',
    timestamp: new Date('2025-12-26T09:15:00Z'),
    note: 'Phone call with recruiter Sarah',
  },
  {
    status: 'rejected',
    timestamp: new Date('2025-12-28T16:45:00Z'),
    note: 'Not moving forward - looking for more senior candidate',
  },
];
```

---

## Usage in Components

### Status Dropdown (Job Detail Sidebar)

**File:** `JobDetailSidebar.tsx`

Shows ALL statuses (including rejected/withdrawn):

```typescript
<select
  value={props.job.status}
  onChange={(e) => handleStatusChange(e.currentTarget.value)}
>
  {STATUS_ORDER.map((status) => (
    <option value={status}>{STATUS_LABELS[status]}</option>
  ))}
</select>
```

✅ Users can move applications to any status  
✅ Includes accepted, rejected, withdrawn

### Pipeline Columns (Dashboard)

**File:** `PipelineDashboard.tsx`

Shows only ACTIVE statuses as columns:

```typescript
{ACTIVE_STATUSES.map((status) => (
  <PipelineColumn status={status} applications={apps} />
))}
```

✅ Clean pipeline view  
✅ Terminal statuses hidden by default (accessible via filters)

### Status Timeline (Job Detail Sidebar)

**File:** `StatusTimeline.tsx`

Shows complete status history:

```typescript
<StatusTimeline
  statusHistory={job.statusHistory}
  currentStatus={job.status}
/>
```

✅ Visual timeline with all status changes  
✅ Works with all 8 statuses  
✅ Shows timestamps and notes

---

## Status Transitions

### Typical Flow

```
saved → applied → screening → interviewing → offered → accepted
                                                      ↘ rejected
                                                      ↘ withdrawn
```

### Allowed Transitions

**Any status can transition to any other status.** Users have full control.

Common patterns:

- `saved → applied` (submitting application)
- `applied → screening` (got initial response)
- `screening → interviewing` (moved to formal interviews)
- `interviewing → offered` (received offer)
- `offered → accepted` (accepted offer)
- `[any] → rejected` (rejected at any stage)
- `[any] → withdrawn` (user withdrew at any stage)

### Tracking Rejection Stage

When a job is rejected, the system tracks where it happened:

```typescript
job.rejectedAtStatus = 'interviewing'; // Rejected during interview stage
job.status = 'rejected';
```

This helps analyze:

- Which stages have highest rejection rates
- Where to focus improvement efforts
- Success rate by stage

---

## Best Practices

### For Users

1. **Update status promptly** when changes occur
2. **Add notes** to status changes (especially rejections) to track learnings
3. **Use "withdrawn"** if you decide not to pursue (different from rejection)
4. **Keep "saved"** for jobs you're actively considering but haven't applied yet

### For Developers

1. **Use `STATUS_ORDER`** for dropdowns and full lists
2. **Use `ACTIVE_STATUSES`** for pipeline columns
3. **Use `TERMINAL_STATUSES`** for filtering completed applications
4. **Always use `STATUS_LABELS`** for display text (never hardcode "Applied", etc.)
5. **Use `statusColors`** for consistent theming

---

## Statistics & Analytics

### Key Metrics by Status

```typescript
// Count by status
const countByStatus = (apps: JobApplication[]) => {
  return STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = apps.filter((a) => a.status === status).length;
      return acc;
    },
    {} as Record<ApplicationStatus, number>
  );
};

// Active vs Terminal split
const activeCount = apps.filter((a) => ACTIVE_STATUSES.includes(a.status)).length;
const terminalCount = apps.filter((a) => TERMINAL_STATUSES.includes(a.status)).length;

// Success rate (accepted / total terminal)
const successRate = accepted / (accepted + rejected + withdrawn);

// Conversion rates by stage
const screeningRate = screening / applied;
const interviewRate = interviewing / screening;
const offerRate = offered / interviewing;
```

---

## Migration Notes

### v1.0 → v2.0 Changes

**Before:**

- Status dropdown only showed `ACTIVE_STATUSES` (missing rejected/withdrawn)
- No status history timeline
- Terminal statuses not easily accessible

**After:**

- ✅ Status dropdown shows ALL 8 statuses via `STATUS_ORDER`
- ✅ Visual status history timeline component
- ✅ Terminal statuses fully supported everywhere
- ✅ `rejectedAtStatus` tracking added

---

## Color Psychology

| Status       | Color  | Meaning                   |
| ------------ | ------ | ------------------------- |
| Saved        | Slate  | Neutral, exploratory      |
| Applied      | Blue   | Active, professional      |
| Screening    | Cyan   | Communication, flow       |
| Interviewing | Purple | Important, evaluative     |
| Offered      | Amber  | Attention, decision point |
| Accepted     | Green  | Success, positive outcome |
| Rejected     | Gray   | Neutral, archived         |
| Withdrawn    | Gray   | User-controlled, archived |

**Why gray for rejected/withdrawn?**

- Reduces emotional impact
- Clearly separates from active pipeline
- Neutral tone (not red "failure")
- Consistent with "archived" state

---

## Related Documentation

- [THEMING.md](../THEMING.md) - Color system and theme tokens
- [SYNC_INTEGRATION.md](../SYNC_INTEGRATION.md) - Syncing status updates
- [pipeline.schema.ts](../../../src/schemas/pipeline.schema.ts) - TypeScript definitions

---

## For AI Agents

When working with status system:

1. **Always use constants**, never hardcode status strings
2. **Use `STATUS_ORDER`** for dropdowns (includes all 8)
3. **Use `ACTIVE_STATUSES`** for pipeline columns (excludes terminal)
4. **Use `STATUS_LABELS`** for display names
5. **Use `statusColors`** from liquid-tenure theme
6. **Track `rejectedAtStatus`** when setting status to 'rejected'
7. **Add notes to `statusHistory`** for context

### Common Mistakes to Avoid

❌ `ACTIVE_STATUSES` in dropdown (missing rejected/withdrawn)  
✅ `STATUS_ORDER` in dropdown (all statuses)

❌ Hardcoding `"Applied"` in UI  
✅ Using `STATUS_LABELS[status]`

❌ Forgetting to add `StatusChange` to history  
✅ Always update `statusHistory` array

❌ Using red color for rejected  
✅ Using neutral gray (`statusColors.rejected.text`)
