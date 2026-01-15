# TACo Sync Architecture

**Status:** Implemented  
**Backend:** Cloudflare R2 + Workers  
**Apps:** Tenure, Tempo

---

## Overview

TACo uses a simple R2-based sync system for multi-device synchronization. This approach was chosen over more complex solutions (Evolu, Zero) because:

1. **Single-player sync** - Users sync their own data between devices, not collaborate
2. **Existing infrastructure** - We already have R2 for backups
3. **Simple conflict resolution** - "Keep Local" or "Use Server" is sufficient
4. **No new dependencies** - No additional libraries or external services

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ Tenure Store │    │ Tempo Store  │    │ localStorage │       │
│  └──────┬───────┘    └──────┬───────┘    └──────────────┘       │
│         │                   │                                    │
│         ▼                   ▼                                    │
│  ┌─────────────────────────────────────────┐                    │
│  │          SyncManager (per app)          │                    │
│  │  - Debounced push (30s after change)    │                    │
│  │  - Push on tab blur                     │                    │
│  │  - Version tracking                     │                    │
│  │  - Conflict detection                   │                    │
│  └─────────────────────────────────────────┘                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                    Cloudflare Workers API                         │
│                                                                   │
│  POST /api/sync/{app}/push   - Upload data                       │
│  GET  /api/sync/{app}/pull   - Download data                     │
│  GET  /api/sync/{app}/meta   - Get version info                  │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                     Cloudflare R2 Storage                         │
│                                                                   │
│  BACKUPS bucket:                                                  │
│    sync/{userId}/tenure/current.json                             │
│    sync/{userId}/tenure/meta.json                                │
│    sync/{userId}/tenure/history/{version}.json                   │
│    sync/{userId}/tempo/current.json                              │
│    sync/{userId}/tempo/meta.json                                 │
│    sync/{userId}/tempo/history/{version}.json                    │
└───────────────────────────────────────────────────────────────────┘
```

---

## Storage Keys

### Tenure (synced via `tenure-sync.ts`)

- `tenure_prospect_applications`
- `tenure_prospect_profile`
- `tenure_prospect_settings`
- `tenure_prepare_master_resume`
- `tenure_prepare_variants`
- `tenure_prepare_wizard`
- `tenure_prosper_*` (salary history, check-ins, accomplishments, etc.)
- `tenure_discover_answers`

### Tempo (synced via `tempo-sync.ts`)

- `session-{date}` - Session data (prefix-based)
- `tempo_queue_tasks` - Queue tasks
- `tempo_queue_settings` - Queue settings
- `tempo_tasks` - Tasks from TaskPersistenceService
- `torodoro-session-debriefs` - Debrief data

---

## Sync Flow

### Push Flow

```
1. Store change detected (via createEffect tracking)
2. notifyTenureDataChanged() / notifyTempoDataChanged() called
3. SyncManager.schedulePush() debounces (30s delay)
4. On debounce timeout OR tab blur:
   a. Collect all data from localStorage
   b. Generate checksum
   c. POST to /api/sync/{app}/push with:
      - data: full localStorage dump
      - version: local version number
      - checksum: SHA-256 hash
      - deviceId: unique device identifier
   d. Server checks version conflict:
      - If server version > client version: return CONFLICT
      - Otherwise: store data, increment version
5. Update local state on success
```

### Pull Flow

```
1. On app init, SyncManager.init() called
2. GET /api/sync/{app}/meta to check server version
3. If server version > local version:
   a. GET /api/sync/{app}/pull
   b. Apply data to localStorage
   c. Dispatch storage event for reactive updates
4. If server version < local version:
   a. Push local data to server
```

### Conflict Resolution

```
1. Server returns CONFLICT when push has stale version
2. SyncManager sets status to 'conflict'
3. UI shows SyncConflictModal
4. User chooses:
   - "Keep My Changes" → Force push with new version
   - "Use Server Data" → Pull server data, discard local
5. Modal closes, sync resumes
```

---

## Subscription Gating

Sync requires an active subscription. Check functions in `src/lib/feature-gates.ts`:

```typescript
// Tenure sync
canUseTenureSync(): { allowed: boolean; reason?: string }

// Tempo sync
canUseTempoSync(): { allowed: boolean; reason?: string }
```

**Valid subscriptions:**

- `sync_tenure` - Tenure app sync only
- `sync_tempo` - Tempo app sync only
- `sync_all` - Both apps
- `taco_club` - Includes everything

---

## Client Implementation

### File Structure

```
src/lib/sync/
├── types.ts           # Type definitions
├── SyncManager.ts     # Core sync orchestration class
├── tenure-sync.ts     # Tenure-specific integration
├── tempo-sync.ts      # Tempo-specific integration
└── index.ts           # Re-exports

src/components/common/sync/
├── SyncStatusIndicator.tsx  # Status badge component
├── SyncConflictModal.tsx    # Conflict resolution modal
└── index.ts
```

### Usage in Stores

```typescript
// In any store that needs sync
import { notifyTenureDataChanged } from '../../../lib/sync';

// Add effect to track changes
createEffect(() => {
  const _ = [state.data?.updatedAt, state.items.length];
  notifyTenureDataChanged();
});
```

### Usage in Components

```typescript
import { useTenureSync } from '@/lib/sync';
import { SyncStatusIndicator, SyncConflictModal } from '@/components/common/sync';

const { state, isEnabled, syncNow, resolveConflict } = useTenureSync();

// Show sync status
<Show when={state()}>
  <SyncStatusIndicator
    status={state()!.status}
    lastSyncedAt={state()!.lastSyncedAt}
    onSyncNow={syncNow}
  />
</Show>

// Handle conflicts
<SyncConflictModal
  isOpen={showConflict()}
  conflict={state()?.conflict}
  onResolve={resolveConflict}
  onClose={() => setShowConflict(false)}
/>
```

---

## API Endpoints

### POST /api/sync/{app}/push

```typescript
// Request
{
  data: object; // Full app data
  version: number; // Client's current version
  checksum: string; // SHA-256 of data
  deviceId: string; // Unique device ID
  timestamp: string; // ISO timestamp
}

// Success Response
{
  success: true;
  version: number; // New version number
  checksum: string;
  timestamp: string;
}

// Conflict Response
{
  error: 'Version conflict';
  code: 'CONFLICT';
  localVersion: number;
  serverVersion: number;
  serverModified: string;
  serverDeviceId: string;
}
```

### GET /api/sync/{app}/pull

```typescript
// Response
{
  success: true;
  data: object;           // Full app data
  meta: {
    version: number;
    lastModified: string;
    deviceId: string;
    checksum: string;
    size: number;
  };
  availableVersions: number[];  // For history/rollback
}
```

### GET /api/sync/{app}/meta

```typescript
// Response
{
  success: true;
  exists: boolean;
  meta: { ... } | null;
  availableVersions: number[];
}
```

---

## Version History

The system keeps the last 5 versions for each app, enabling rollback if needed:

```
sync/{userId}/{app}/
├── current.json          # Latest data
├── meta.json             # Version metadata
└── history/
    ├── 1.json
    ├── 2.json
    ├── 3.json
    ├── 4.json
    └── 5.json
```

---

## Offline Handling

- **Offline detection:** Uses `navigator.onLine` and `online`/`offline` events
- **Queue behavior:** Changes are tracked locally, push queued for when online
- **Retry:** Automatic retry with exponential backoff on network errors

---

## Security

- **Authentication:** All sync endpoints require valid JWT
- **User isolation:** Each user can only access their own sync data
- **No encryption:** Data is stored in plain JSON (encrypted in transit via HTTPS)
- **Device tracking:** Device IDs help identify which device made changes

---

## Differences from Previous Plans

| Aspect              | Old Plan (Evolu/Zero)          | Current Implementation |
| ------------------- | ------------------------------ | ---------------------- |
| Encryption          | End-to-end (Evolu)             | None (HTTPS only)      |
| Real-time           | Yes (Zero)                     | No (30s debounce)      |
| Collaboration       | Supported                      | Not supported          |
| Dependencies        | @evolu/react or @rocicorp/zero | None (pure fetch)      |
| Server              | Evolu Cloud or Zero Server     | Cloudflare R2          |
| Conflict resolution | CRDT/automatic                 | Manual (user choice)   |

---

## UI Integration

### Tenure

- Cloud sync section in Settings (`SyncSettings.tsx`)
- Shows sync status, last sync time, errors
- Manual "Sync Now" button
- Conflict modal when conflicts detected

### Tempo

- Cloud sync section in Settings Sidebar (`settings-sidebar.tsx`)
- Same features as Tenure
- Integrated into existing API settings modal

---

## Troubleshooting

### Sync not working

1. Check subscription status (`canUseTenureSync()` / `canUseTempoSync()`)
2. Check network connectivity
3. Check browser console for errors
4. Verify JWT is valid

### Conflict loop

1. Choose one device as "source of truth"
2. On that device: "Keep My Changes"
3. On other devices: "Use Server Data"

### Data loss

1. Check `sync/{userId}/{app}/history/` in R2
2. Previous versions are kept for rollback
3. Contact support with userId and timestamp

---

## Related Documentation

- [Feature Gating](./FEATURE_GATING.md) - Subscription checks
- [Auth System](../auth/UNIFIED_AUTH.md) - JWT authentication
- [Backup Recovery](../infrastructure/BACKUP_RECOVERY.md) - R2 backup system
