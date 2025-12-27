# Tenure - Evolu Sync Integration

**App:** Tenure (Resume & Job Pipeline Management)  
**Sync Engine:** Evolu  
**Status:** Planning Phase

---

## Why Evolu for Tenure?

| Tenure Requirement            | Evolu Capability                     |
| ----------------------------- | ------------------------------------ |
| Resume data (sensitive)       | **End-to-end encryption by default** |
| Job applications (structured) | SQLite under the hood                |
| Timeline/history tracking     | SQL queries for filtering            |
| Privacy-critical data         | Encrypted local-first design         |
| Offline-first                 | Core principle                       |
| Simple sync                   | Minimal server complexity            |
| Export-friendly               | SQLite = easy dump                   |

**Key advantage:** Evolu encrypts everything by default - perfect for resumes

---

## Data Model

### Evolu Schema

```typescript
// src/components/tenure/lib/schema.ts

import * as S from '@evolu/react';
import * as Effect from 'effect/Effect';

const TenureDatabase = S.database({
  // Job Applications
  application: S.table({
    id: S.id('Application'),
    userId: S.string,

    // Company & Role
    companyName: S.string,
    roleName: S.string,
    jobUrl: S.nullable(S.string),
    location: S.string,
    locationType: S.nullable(S.literal('remote', 'hybrid', 'onsite')),

    // Salary
    salaryMin: S.nullable(S.number),
    salaryMax: S.nullable(S.number),
    salaryCurrency: S.nullable(S.string),

    // Status
    status: S.literal(
      'saved',
      'applied',
      'screening',
      'interviewing',
      'offered',
      'accepted',
      'rejected',
      'withdrawn'
    ),

    // Timestamps
    createdAt: S.number,
    updatedAt: S.number,
    appliedAt: S.nullable(S.number),
    lastActivityAt: S.number,

    // Analysis (from AI)
    analysisScore: S.nullable(S.number),
    analysisData: S.nullable(S.json), // Full AI analysis object

    // Notes
    notes: S.nullable(S.string),

    // Follow-up
    followUpDue: S.nullable(S.number),

    // Metadata
    isDeleted: S.boolean,
  }),

  // Resumes
  resume: S.table({
    id: S.id('Resume'),
    userId: S.string,

    title: S.string, // "Software Engineer Resume 2024"
    version: S.number,
    isActive: S.boolean,

    // Resume content (encrypted)
    summary: S.nullable(S.string),
    experienceData: S.json, // Experience[]
    educationData: S.json, // Education[]
    skillsData: S.json, // string[]
    projectsData: S.json, // Project[]
    certificationsData: S.json, // string[]

    // Metadata
    createdAt: S.number,
    updatedAt: S.number,
    lastMutatedAt: S.nullable(S.number),

    isDeleted: S.boolean,
  }),

  // Resume Mutations (AI-generated variants)
  mutation: S.table({
    id: S.id('Mutation'),
    userId: S.string,
    resumeId: S.id('Resume'),

    // Mutation details
    mutationType: S.literal('job-specific', 'archetype'),
    targetJobTitle: S.nullable(S.string),
    targetArchetype: S.nullable(S.string),

    // Generated content (encrypted)
    mutatedContent: S.json, // Full resume object

    // Timestamps
    createdAt: S.number,

    // Cost tracking
    costCents: S.number, // Track API cost for billing

    isDeleted: S.boolean,
  }),

  // Status History (for analytics)
  statusChange: S.table({
    id: S.id('StatusChange'),
    applicationId: S.id('Application'),

    fromStatus: S.nullable(S.string),
    toStatus: S.string,
    timestamp: S.number,
  }),
});

export type TenureDatabase = S.ExtractDatabase<typeof TenureDatabase>;
export const tenureDb = TenureDatabase;
```

---

## Setup & Installation

### 1. Install Evolu

```bash
npm install @evolu/react
npm install effect  # Evolu dependency
```

### 2. Initialize Evolu

```typescript
// src/components/tenure/lib/evolu-client.ts

import { createEvolu } from '@evolu/react';
import { tenureDb } from './schema';

export const evolu = createEvolu(tenureDb, {
  // Evolu handles encryption automatically
  // No API key needed for encryption

  // Sync server (optional - only if user has subscription)
  syncUrl: import.meta.env.VITE_EVOLU_SYNC_URL,

  // User's encryption key (derived from mnemonic)
  // Evolu generates this on first use
});

// Export hooks
export const useEvolu = evolu.useEvolu;
export const useQuery = evolu.useQuery;
```

### 3. Query Pattern

```typescript
// src/components/tenure/hooks/useApplications.ts

import { useQuery } from '../lib/evolu-client';
import * as S from '@evolu/react';

export function useApplications(userId: string, status?: string) {
  const { rows } = useQuery((db) =>
    db
      .selectFrom('application')
      .select(['id', 'companyName', 'roleName', 'status', 'appliedAt'])
      .where('userId', '=', userId)
      .where('isDeleted', '=', false)
      .$if(!!status, (qb) => qb.where('status', '=', status!))
      .orderBy('lastActivityAt', 'desc')
  );

  return rows;
}
```

### 4. Mutations

```typescript
// src/components/tenure/lib/mutations.ts

import { evolu } from './evolu-client';
import * as S from '@evolu/react';

export function createApplication(userId: string, data: Partial<Application>) {
  evolu.create('application', {
    id: S.id('Application'),
    userId,
    companyName: data.companyName!,
    roleName: data.roleName!,
    jobUrl: data.jobUrl || null,
    location: data.location || '',
    status: 'saved',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastActivityAt: Date.now(),
    isDeleted: false,
  });
}

export function updateApplicationStatus(applicationId: string, newStatus: string) {
  // Create status change record
  evolu.create('statusChange', {
    id: S.id('StatusChange'),
    applicationId,
    fromStatus: null, // TODO: get current status
    toStatus: newStatus,
    timestamp: Date.now(),
  });

  // Update application
  evolu.update('application', {
    id: applicationId,
    status: newStatus,
    updatedAt: Date.now(),
    lastActivityAt: Date.now(),
    ...(newStatus === 'applied' ? { appliedAt: Date.now() } : {}),
  });
}
```

---

## Encryption & Security

### How Evolu Encrypts Data

Evolu uses **mnemonic-based encryption** (like a crypto wallet):

```typescript
// First time user opens Tenure
// Evolu generates a 12-word mnemonic

const mnemonic = evolu.owner?.mnemonic;
// "witch collapse practice feed shame open despair creek road again ice..."

// This mnemonic is the ONLY key to decrypt data
// User must save it (we can help them back it up)
```

### Mnemonic Backup Flow

```typescript
// src/components/tenure/components/MnemonicBackup.tsx

export const MnemonicBackup = () => {
  const { owner } = useEvolu();

  if (!owner) return null;

  return (
    <div>
      <h3>⚠️ Save Your Encryption Key</h3>
      <p>Write down these 12 words. You'll need them to access your data on other devices.</p>

      <div class="mnemonic-grid">
        {owner.mnemonic.split(' ').map((word, i) => (
          <div class="word">
            <span class="number">{i + 1}</span>
            <span class="text">{word}</span>
          </div>
        ))}
      </div>

      <button onClick={downloadMnemonic}>Download as Text File</button>
      <button onClick={copyToClipboard}>Copy to Clipboard</button>
    </div>
  );
};
```

### Restore from Mnemonic

```typescript
// New device or browser
evolu.restoreOwner(savedMnemonic);
```

---

## Sync Subscription Gating

### Free vs Paid Behavior

```typescript
// src/components/tenure/lib/sync-manager.ts

export async function initializeTenureSync(userId: string, hasSyncSubscription: boolean) {
  // Evolu ALWAYS encrypts locally (free or paid)
  // Sync is optional

  if (!hasSyncSubscription) {
    console.log('[Tenure] Running in local-only mode (encrypted)');
    // User can still export their encrypted data
    return;
  }

  // Paid: Enable sync to Evolu server
  console.log('[Tenure] Enabling Evolu sync');
  evolu.sync(); // Starts syncing
}
```

---

## Migration from localStorage

### Current State

```typescript
// Current implementation
const applications = JSON.parse(localStorage.getItem('tenure_applications') || '[]');
```

### Migration Strategy

```typescript
// src/components/tenure/lib/migration.ts

export function migrateToEvolu(userId: string) {
  // 1. Read existing localStorage
  const apps = JSON.parse(localStorage.getItem('tenure_applications') || '[]');
  const resumes = JSON.parse(localStorage.getItem('tenure_resumes') || '[]');

  // 2. Batch insert into Evolu
  apps.forEach((app: any) => {
    createApplication(userId, {
      ...app,
      id: undefined, // Let Evolu generate new ID
    });
  });

  resumes.forEach((resume: any) => {
    createResume(userId, {
      ...resume,
      id: undefined,
    });
  });

  // 3. Mark migration complete
  localStorage.setItem('tenure_migrated_to_evolu', 'true');
  localStorage.setItem('tenure_migration_backup', JSON.stringify({ apps, resumes }));

  console.log('[Tenure] Migration to Evolu complete');
}
```

---

## Export/Backup

### Export Encrypted Data

```typescript
// src/components/tenure/lib/export.ts

export function exportTenureData() {
  const { owner } = useEvolu();

  // Get all data from Evolu
  const applications = useQuery((db) =>
    db
      .selectFrom('application')
      .selectAll()
      .where('userId', '=', userId)
      .where('isDeleted', '=', false)
  );

  const resumes = useQuery((db) =>
    db.selectFrom('resume').selectAll().where('userId', '=', userId).where('isDeleted', '=', false)
  );

  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    mnemonic: owner?.mnemonic, // IMPORTANT: Include for re-import
    data: {
      applications: applications.rows,
      resumes: resumes.rows,
    },
  };

  // Download as encrypted JSON
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tenure-export-encrypted-${Date.now()}.json`;
  a.click();
}
```

### Import Data on New Device

```typescript
export function importTenureData(importData: any) {
  // 1. Restore owner from mnemonic
  evolu.restoreOwner(importData.mnemonic);

  // 2. Insert all data
  importData.data.applications.forEach((app: any) => {
    evolu.create('application', app);
  });

  importData.data.resumes.forEach((resume: any) => {
    evolu.create('resume', resume);
  });
}
```

---

## Sync Server Setup

### Option 1: Evolu Cloud (Recommended)

Evolu provides a hosted sync server:

```typescript
// Just set the URL
const evolu = createEvolu(tenureDb, {
  syncUrl: 'https://evolu.world', // Official Evolu server
});
```

**Cost:** Free tier available, check evolu.world for pricing

### Option 2: Self-Hosted

Run your own Evolu server on Cloudflare:

```typescript
// services/evolu-server/index.ts

import { createEvoluServer } from '@evolu/server';

export default {
  async fetch(request: Request, env: Env) {
    const userId = await authenticateRequest(request, env);
    if (!userId) return new Response('Unauthorized', { status: 401 });

    // Check sync subscription
    const hasSyncSubscription = await checkSubscription(userId, 'sync', env);
    if (!hasSyncSubscription) {
      return new Response('Sync subscription required', { status: 402 });
    }

    const evoluServer = createEvoluServer({
      storage: env.EVOLU_STORAGE, // Cloudflare Durable Object
    });

    return evoluServer.handleRequest(request);
  },
};
```

---

## Mutation Tracking (for Billing)

Track AI resume mutations for usage-based billing:

```typescript
// When user requests a mutation
export async function createResumeMutation(
  userId: string,
  resumeId: string,
  mutationType: 'job-specific' | 'archetype',
  targetDetails: string
) {
  // 1. Call AI endpoint (your backend)
  const response = await fetch('/api/tenure/mutate-resume', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({
      resumeId,
      mutationType,
      targetDetails,
    }),
  });

  const { mutatedContent, costCents } = await response.json();

  // 2. Store mutation in Evolu
  evolu.create('mutation', {
    id: S.id('Mutation'),
    userId,
    resumeId,
    mutationType,
    targetJobTitle: mutationType === 'job-specific' ? targetDetails : null,
    targetArchetype: mutationType === 'archetype' ? targetDetails : null,
    mutatedContent: JSON.stringify(mutatedContent),
    createdAt: Date.now(),
    costCents, // Track for billing
    isDeleted: false,
  });

  // 3. Backend also logs this for billing
}
```

Query mutation usage for current month:

```typescript
export function useMonthlyMutationCount(userId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { rows } = useQuery((db) =>
    db
      .selectFrom('mutation')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('userId', '=', userId)
      .where('createdAt', '>=', startOfMonth.getTime())
      .where('isDeleted', '=', false)
  );

  return rows[0]?.count || 0;
}
```

---

## Privacy Guarantee

**What's encrypted:**

- ✅ All resume content
- ✅ All job application details
- ✅ All notes and analysis
- ✅ Everything in the database

**What's NOT encrypted:**

- ❌ Your email (needed for account)
- ❌ Subscription status (needed for billing)
- ❌ Mutation count (needed for quota)

**Who can read your data:**

- ✅ You (with your mnemonic)
- ❌ Thoughtful App Co (we can't decrypt)
- ❌ Evolu (they can't decrypt)
- ❌ Anyone else

---

## Testing

```typescript
// src/components/tenure/lib/evolu-client.test.ts

import { describe, it, expect } from 'vitest';
import { createApplication } from './mutations';

describe('Evolu Client', () => {
  it('creates encrypted applications', () => {
    const userId = 'test-user';

    createApplication(userId, {
      companyName: 'Acme Corp',
      roleName: 'Software Engineer',
      location: 'Remote',
    });

    const apps = useApplications(userId);
    expect(apps.length).toBe(1);
    expect(apps[0].companyName).toBe('Acme Corp');
  });
});
```

---

## Next Steps

1. [ ] Install Evolu
2. [ ] Implement schema
3. [ ] Build mnemonic backup UI
4. [ ] Migrate from localStorage
5. [ ] Set up Evolu sync (cloud or self-hosted)
6. [ ] Implement mutation tracking
7. [ ] Test encryption/decryption flow

---

## Related Docs

- [Unified Auth System](../auth/UNIFIED_AUTH.md)
- [Backup & Disaster Recovery](../infrastructure/BACKUP_RECOVERY.md)
- [Billing Integration](../billing/STRIPE_INTEGRATION.md)
- [Resume Mutation API](./MUTATION_API.md)
