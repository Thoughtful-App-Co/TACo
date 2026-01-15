# Tenure Sync Integration

> **Note:** This document previously described an Evolu-based sync approach that was not implemented. The actual sync implementation uses a simple R2-based system.

## Current Implementation

See [Sync Architecture](../core/SYNC_ARCHITECTURE.md) for the complete documentation.

### Quick Reference

**Sync Manager:** `src/lib/sync/tenure-sync.ts`

**Synced Storage Keys:**

- `tenure_prospect_applications`
- `tenure_prospect_profile`
- `tenure_prospect_settings`
- `tenure_prepare_master_resume`
- `tenure_prepare_variants`
- `tenure_prepare_wizard`
- `tenure_prosper_*` (salary history, check-ins, accomplishments, etc.)
- `tenure_discover_answers`

**Subscription Check:** `canUseTenureSync()` in `src/lib/feature-gates.ts`

**UI Location:** Settings page (`SyncSettings.tsx`)

### Usage in Components

```typescript
import { useTenureSync } from '@/lib/sync';

const { state, isEnabled, syncNow, resolveConflict } = useTenureSync();
```

### Usage in Stores

```typescript
import { notifyTenureDataChanged } from '../../../lib/sync';

// In a createEffect:
createEffect(() => {
  const _ = [state.data?.updatedAt, state.items.length];
  notifyTenureDataChanged();
});
```
