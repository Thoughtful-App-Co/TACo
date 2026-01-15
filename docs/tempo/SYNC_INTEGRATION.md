# Tempo Sync Integration

> **Note:** This document previously described a Zero (Rocicorp) based sync approach that was not implemented. The actual sync implementation uses a simple R2-based system.

## Current Implementation

See [Sync Architecture](../core/SYNC_ARCHITECTURE.md) for the complete documentation.

### Quick Reference

**Sync Manager:** `src/lib/sync/tempo-sync.ts`

**Synced Storage Keys:**

- `session-{date}` - Session data (prefix-based)
- `tempo_queue_tasks` - Queue tasks
- `tempo_queue_settings` - Queue settings
- `tempo_tasks` - Tasks from TaskPersistenceService
- `torodoro-session-debriefs` - Debrief data

**Subscription Check:** `canUseTempoSync()` in `src/lib/feature-gates.ts`

**UI Location:** Settings sidebar (`settings-sidebar.tsx`)

### Usage in Components

```typescript
import { useTempoSync } from '@/lib/sync';

const { state, isEnabled, syncNow, resolveConflict } = useTempoSync();
```

### Storage File Integrations

The following files have been updated to call `notifyTempoDataChanged()` when data changes:

- `src/components/tempo/lib/sessionStorage.ts`
- `src/components/tempo/services/task-persistence.service.ts`
- `src/components/tempo/queue/services/queue.service.ts`
- `src/components/tempo/services/debrief-storage.service.ts`
