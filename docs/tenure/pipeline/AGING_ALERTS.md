# Aging Alerts System

**Last Updated:** December 29, 2025  
**Version:** 1.0

---

## Overview

The Aging Alerts system helps users stay on top of their job applications by tracking the time since last activity. Applications that go without updates become "stale" and require attention. This system provides visual cues and notifications to ensure users follow up on their applications in a timely manner.

Key features:

- Visual indicators showing days since last activity
- Color-coded urgency levels (fresh, warning, critical)
- Alert banner when stale applications exist
- Configurable thresholds based on user preferences

---

## Aging Thresholds

**File:** `src/schemas/pipeline.schema.ts`

The aging system uses three configurable thresholds defined in `PipelineSettings`:

```typescript
export interface PipelineSettings {
  followUpIntervalDays: number; // Default: 7 - suggested follow-up cadence
  agingWarningDays: number; // Default: 14 - amber warning threshold
  agingCriticalDays: number; // Default: 30 - red critical threshold
  // ...
}

export const DEFAULT_SETTINGS: PipelineSettings = {
  followUpIntervalDays: 7,
  agingWarningDays: 14,
  agingCriticalDays: 30,
  // ...
};
```

| Threshold    | Default  | Status     | Meaning                                  |
| ------------ | -------- | ---------- | ---------------------------------------- |
| 0 - 13 days  | Fresh    | `fresh`    | Application is current, no action needed |
| 14 - 29 days | Warning  | `warning`  | Application needs attention soon         |
| 30+ days     | Critical | `critical` | Application is critically stale          |

---

## Components

### AgingIndicator

**File:** `src/components/tenure/pipeline/ui/AgingIndicator.tsx`

A compact, color-coded badge that displays the time since last activity on application cards and list rows.

#### Props Interface

```typescript
interface AgingIndicatorProps {
  lastActivityAt: Date; // Required: Date of last activity
  size?: 'sm' | 'md' | 'lg'; // Optional: Visual size (default: 'md')
  showLabel?: boolean; // Optional: Show text label (default: true)
  style?: JSX.CSSProperties; // Optional: Custom styles
}
```

#### Size Variants

| Size | Padding  | Font Size | Dot Size |
| ---- | -------- | --------- | -------- |
| `sm` | 2px 8px  | 10px      | 6px      |
| `md` | 4px 10px | 11px      | 8px      |
| `lg` | 6px 14px | 13px      | 10px     |

#### Time Formatting

The component formats days into human-readable strings:

```typescript
const formatDays = (d: number): string => {
  if (d === 0) return 'Today';
  if (d === 1) return '1 day';
  if (d < 7) return `${d} days`;
  if (d < 14) return '1 week';
  if (d < 30) return `${Math.floor(d / 7)} weeks`;
  if (d < 60) return '1 month';
  return `${Math.floor(d / 30)} months`;
};
```

#### Usage Example

```tsx
import { AgingIndicator } from './ui/AgingIndicator';

<AgingIndicator lastActivityAt={job.lastActivityAt} size="sm" showLabel={true} />;
```

---

### AgingAlert Banner

**File:** `src/components/tenure/pipeline/components/AgingAlert.tsx`

A notification banner that appears at the top of the pipeline when stale applications exist. It provides a summary of applications needing attention and quick actions.

#### Props Interface

```typescript
interface AgingAlertProps {
  applications: JobApplication[]; // All applications to analyze
  warningDays?: number; // Custom warning threshold (default: 14)
  criticalDays?: number; // Custom critical threshold (default: 30)
  onDismiss?: () => void; // Handler for dismiss button
  onViewStale?: () => void; // Handler for "View" button
  theme: () => typeof liquidTenure; // Theme accessor
}
```

#### Key Behaviors

1. **Only counts ACTIVE_STATUSES** - Terminal statuses (`accepted`, `rejected`, `withdrawn`) are excluded from stale counts

2. **Conditional visibility** - Banner only renders when `staleCount() > 0`

3. **Escalating urgency** - Colors change based on whether any applications are critical:
   - Warning styling when only warning-level applications exist
   - Critical styling when any application exceeds critical threshold

4. **Dynamic messaging** - Message adapts to count:
   - Single: "You have 1 application that needs attention"
   - Few: "You have 3 applications that need attention"
   - Many (4+): "4 applications are going stale - time to follow up!"

#### Usage Example

```tsx
import AgingAlert from './components/AgingAlert';

<AgingAlert
  applications={pipelineStore.state.applications}
  warningDays={settings.agingWarningDays}
  criticalDays={settings.agingCriticalDays}
  onDismiss={() => setAlertDismissed(true)}
  onViewStale={() => setFilter('stale')}
  theme={() => liquidTenure}
/>;
```

---

## Color System

**File:** `src/components/tenure/pipeline/theme/liquid-tenure.ts`

Aging colors use semantic color tokens for consistent meaning across the application:

```typescript
import { semanticColors } from '../../../../theme/semantic-colors';

export const agingColors = {
  fresh: {
    color: semanticColors.info.base, // Blue
    bg: semanticColors.info.bg,
    border: semanticColors.info.border,
    pulse: false,
  },
  warning: {
    color: semanticColors.warning.base, // Amber
    bg: semanticColors.warning.bg,
    border: semanticColors.warning.border,
    pulse: true,
  },
  critical: {
    color: semanticColors.error.base, // Red
    bg: semanticColors.error.bg,
    border: semanticColors.error.border,
    pulse: true,
  },
};
```

### CSS Animation

Warning and critical states include a pulsing animation to draw attention:

```css
@keyframes aging-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.aging-indicator.warning,
.aging-indicator.critical {
  animation: aging-pulse 2s ease-in-out infinite;
}
```

---

## Helper Functions

**File:** `src/schemas/pipeline.schema.ts`

### daysSince

Calculates the number of days since a given date:

```typescript
export function daysSince(date: Date): number {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
```

### getAgingStatus

Determines the aging status based on days and settings:

```typescript
export function getAgingStatus(
  days: number,
  settings: PipelineSettings
): 'fresh' | 'warning' | 'critical' {
  if (days >= settings.agingCriticalDays) return 'critical';
  if (days >= settings.agingWarningDays) return 'warning';
  return 'fresh';
}
```

---

## Configuration

Users can customize aging thresholds through the `PipelineSettings` interface:

```typescript
// In user settings management
const updateAgingSettings = (warningDays: number, criticalDays: number, followUpDays: number) => {
  pipelineStore.updateSettings({
    agingWarningDays: warningDays,
    agingCriticalDays: criticalDays,
    followUpIntervalDays: followUpDays,
  });
};
```

### Recommended Thresholds by Search Intensity

| Search Type     | Warning | Critical | Follow-up |
| --------------- | ------- | -------- | --------- |
| Active (urgent) | 7 days  | 14 days  | 3 days    |
| Standard        | 14 days | 30 days  | 7 days    |
| Passive         | 21 days | 45 days  | 14 days   |

---

## Usage Examples

### Displaying Aging on Cards

```tsx
import { AgingIndicator } from './ui/AgingIndicator';
import { JobApplication } from '../../../schemas/pipeline.schema';

const ApplicationCard = (props: { job: JobApplication }) => (
  <div class="application-card">
    <h3>{props.job.roleName}</h3>
    <p>{props.job.companyName}</p>
    <AgingIndicator lastActivityAt={props.job.lastActivityAt} size="sm" />
  </div>
);
```

### Filtering Stale Applications

```typescript
import { ACTIVE_STATUSES, daysSince, getAgingStatus } from '../../../schemas/pipeline.schema';

const getStaleApplications = (applications: JobApplication[], settings: PipelineSettings) => {
  return applications.filter((app) => {
    // Only include active applications
    if (!ACTIVE_STATUSES.includes(app.status)) {
      return false;
    }
    // Check if application is stale
    const aging = getAgingStatus(daysSince(app.lastActivityAt), settings);
    return aging === 'warning' || aging === 'critical';
  });
};
```

### Updating Last Activity

```typescript
const recordActivity = (applicationId: string, note?: string) => {
  pipelineStore.updateApplication(applicationId, {
    lastActivityAt: new Date(),
    notes: note ? `${existingNotes}\n\n${note}` : existingNotes,
  });
};
```

---

## Best Practices

### For Users

1. **Update applications promptly** - When you receive a response, have an interview, or take any action, update the application to reset the aging clock

2. **Follow up on stale applications** - Use the warning phase as a reminder to send follow-up emails or check application status

3. **Use notes to track activity** - Document phone calls, emails sent, and other interactions to maintain context

4. **Dismiss or withdraw dead leads** - If an application is truly dormant with no response, consider marking it as withdrawn rather than letting it age indefinitely

5. **Adjust thresholds to your needs** - Active job seekers may want shorter thresholds; passive searchers may prefer longer ones

### For Developers

1. **Always update `lastActivityAt`** when any application action occurs:
   - Status changes
   - Notes added
   - Contacts added
   - Documents attached

2. **Use `ACTIVE_STATUSES`** when calculating stale counts - terminal statuses should not generate aging alerts

3. **Use helper functions** - Always use `daysSince()` and `getAgingStatus()` rather than inline calculations

4. **Respect user settings** - Access thresholds from `PipelineSettings`, not hardcoded values

5. **Apply consistent styling** - Use `agingColors` from the theme for all aging-related UI

---

## Related Documentation

- [STATUS_SYSTEM.md](./STATUS_SYSTEM.md) - Pipeline status definitions and transitions
- [THEMING.md](../THEMING.md) - Color system and theme tokens
- [SYNC_INTEGRATION.md](../SYNC_INTEGRATION.md) - Syncing application updates
- [pipeline.schema.ts](../../../src/schemas/pipeline.schema.ts) - TypeScript definitions

---

## For AI Agents

When working with the aging alerts system:

1. **Use helper functions** - Always use `daysSince()` and `getAgingStatus()` from the schema
2. **Respect ACTIVE_STATUSES** - Only active applications should contribute to stale counts
3. **Update `lastActivityAt`** - Any user action on an application should update this timestamp
4. **Use semantic colors** - Access colors via `agingColors` from liquid-tenure theme
5. **Check settings** - Access thresholds from `PipelineSettings`, not defaults

### Common Mistakes to Avoid

| Wrong                                      | Right                                |
| ------------------------------------------ | ------------------------------------ |
| Hardcoding threshold values                | Using `settings.agingWarningDays`    |
| Calculating days manually                  | Using `daysSince(date)`              |
| Including terminal statuses in stale count | Filtering with `ACTIVE_STATUSES`     |
| Using raw colors                           | Using `agingColors[status].color`    |
| Forgetting to update `lastActivityAt`      | Updating on every application action |

---

_Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved._
