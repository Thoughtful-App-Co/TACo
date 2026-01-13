# Tempo - Zero Sync Integration

**App:** Tempo (Task Management & Productivity)  
**Sync Engine:** Zero (by Rocicorp)  
**Status:** Planning Phase

---

## Why Zero for Tempo?

| Tempo Requirement              | Zero Capability          |
| ------------------------------ | ------------------------ |
| Real-time task updates         | Built-in real-time sync  |
| Complex queries (filter, sort) | Powerful query system    |
| Session management             | Transactional integrity  |
| Brain dump processing          | Handles large text blobs |
| Offline-first                  | Core design principle    |
| TypeScript native              | First-class TS support   |

**Plus:** Direct connection to Rocicorp team for support

---

## Data Model

### Core Entities

```typescript
// Tempo uses Zero's schema system
import { z } from 'zod';
import { createZeroSchema } from '@rocicorp/zero';

export const tempoSchema = createZeroSchema({
  tables: {
    tasks: {
      columns: {
        id: { type: 'string', primaryKey: true },
        userId: { type: 'string', indexed: true },
        title: { type: 'string' },
        description: { type: 'string', optional: true },
        status: { type: 'string' }, // 'active' | 'completed' | 'deleted'
        priority: { type: 'number' },
        difficulty: { type: 'number', optional: true },
        tags: { type: 'json' }, // string[]
        createdAt: { type: 'number' },
        updatedAt: { type: 'number' },
        completedAt: { type: 'number', optional: true },
      },
      indexes: {
        byStatus: ['userId', 'status'],
        byPriority: ['userId', 'priority'],
      },
    },

    sessions: {
      columns: {
        id: { type: 'string', primaryKey: true },
        userId: { type: 'string', indexed: true },
        title: { type: 'string' },
        duration: { type: 'number' }, // minutes
        startTime: { type: 'number' },
        endTime: { type: 'number', optional: true },
        status: { type: 'string' }, // 'planning' | 'active' | 'completed'
        taskIds: { type: 'json' }, // string[] - tasks in this session
        createdAt: { type: 'number' },
      },
    },

    brainDumps: {
      columns: {
        id: { type: 'string', primaryKey: true },
        userId: { type: 'string', indexed: true },
        content: { type: 'string' },
        processed: { type: 'boolean' },
        extractedTasks: { type: 'json', optional: true }, // Task[]
        createdAt: { type: 'number' },
        processedAt: { type: 'number', optional: true },
      },
    },

    debriefs: {
      columns: {
        id: { type: 'string', primaryKey: true },
        userId: { type: 'string', indexed: true },
        sessionId: { type: 'string' },
        completedTasks: { type: 'number' },
        feedback: { type: 'string', optional: true },
        insights: { type: 'json', optional: true },
        createdAt: { type: 'number' },
      },
    },
  },
});
```

---

## Setup & Installation

### 1. Install Zero

```bash
pnpm install @rocicorp/zero
```

### 2. Initialize Zero Client

```typescript
// src/components/tempo/lib/zero-client.ts

import { Zero } from '@rocicorp/zero';
import { tempoSchema } from './schema';

let zeroInstance: Zero | null = null;

export function getZeroClient(userId: string) {
  if (!zeroInstance) {
    zeroInstance = new Zero({
      userID: userId,
      schema: tempoSchema,
      server: import.meta.env.VITE_ZERO_SERVER_URL || 'https://zero.thoughtfulappco.com',
      // Auth handled by our unified system
      auth: async () => {
        const token = localStorage.getItem('taco_session_token');
        if (!token) throw new Error('Not authenticated');
        return token;
      },
    });
  }

  return zeroInstance;
}
```

### 3. Query Pattern (Solid.js)

```typescript
// src/components/tempo/hooks/useTasks.ts

import { createMemo } from 'solid-js';
import { useQuery } from '@rocicorp/zero/solid';
import { getZeroClient } from '../lib/zero-client';

export function useTasks(userId: string, status?: 'active' | 'completed') {
  const zero = getZeroClient(userId);

  const tasks = useQuery(
    zero.query.tasks
      .where('userId', userId)
      .where('status', status || 'active')
      .orderBy('priority', 'desc')
  );

  return tasks;
}
```

### 4. Mutations

```typescript
// src/components/tempo/lib/mutations.ts

import { getZeroClient } from './zero-client';

export async function createTask(userId: string, data: Partial<Task>) {
  const zero = getZeroClient(userId);

  await zero.mutate.tasks.insert({
    id: crypto.randomUUID(),
    userId,
    title: data.title!,
    description: data.description,
    status: 'active',
    priority: data.priority || 1,
    tags: data.tags || [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

export async function updateTaskStatus(taskId: string, status: string) {
  const zero = getZeroClient(userId);

  await zero.mutate.tasks.update({
    id: taskId,
    status,
    updatedAt: Date.now(),
    ...(status === 'completed' ? { completedAt: Date.now() } : {}),
  });
}
```

---

## Sync Subscription Gating

### Free vs Paid Behavior

```typescript
// src/components/tempo/lib/sync-manager.ts

import { getZeroClient } from './zero-client';

export async function initializeTempoSync(userId: string, hasSyncSubscription: boolean) {
  if (!hasSyncSubscription) {
    // Free tier: Local-only mode
    console.log('[Tempo] Running in local-only mode');
    return null; // Don't initialize Zero at all
  }

  // Paid tier: Enable sync
  console.log('[Tempo] Initializing Zero sync');
  const zero = getZeroClient(userId);
  await zero.sync.start();

  return zero;
}
```

---

## Migration from localStorage

### Current State (localStorage)

```typescript
// Current implementation
const tasks = JSON.parse(localStorage.getItem('tempo_tasks') || '[]');
```

### Migration Strategy

```typescript
// src/components/tempo/lib/migration.ts

export async function migrateToZero(userId: string) {
  const zero = getZeroClient(userId);

  // 1. Read existing localStorage data
  const tasks = JSON.parse(localStorage.getItem('tempo_tasks') || '[]');
  const sessions = JSON.parse(localStorage.getItem('tempo_sessions') || '[]');

  // 2. Batch insert into Zero
  await zero.mutate.transaction(async (tx) => {
    for (const task of tasks) {
      await tx.tasks.insert({
        ...task,
        userId,
        createdAt: task.createdAt || Date.now(),
        updatedAt: task.updatedAt || Date.now(),
      });
    }

    for (const session of sessions) {
      await tx.sessions.insert({
        ...session,
        userId,
      });
    }
  });

  // 3. Mark migration complete
  localStorage.setItem('tempo_migrated_to_zero', 'true');

  // 4. Keep localStorage as backup for 30 days
  localStorage.setItem('tempo_migration_date', Date.now().toString());

  console.log('[Tempo] Migration to Zero complete');
}
```

---

## Offline Support

Zero handles offline automatically:

```typescript
// Zero syncs when online, works offline
const tasks = useQuery(zero.query.tasks.where('userId', userId));

// Mutations queue while offline, sync when back online
await createTask(userId, { title: 'New task' });
// ✅ Works offline, syncs later
```

---

## Export/Backup

```typescript
// src/components/tempo/lib/export.ts

export async function exportTempoData(userId: string) {
  const zero = getZeroClient(userId);

  // Query all user data
  const tasks = await zero.query.tasks.where('userId', userId).toArray();
  const sessions = await zero.query.sessions.where('userId', userId).toArray();
  const brainDumps = await zero.query.brainDumps.where('userId', userId).toArray();
  const debriefs = await zero.query.debriefs.where('userId', userId).toArray();

  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data: {
      tasks,
      sessions,
      brainDumps,
      debriefs,
    },
  };

  // Download as JSON
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tempo-export-${Date.now()}.json`;
  a.click();

  return exportData;
}
```

---

## Server Setup (Your Backend)

### Zero Server Configuration

```typescript
// services/zero-server/index.ts (Cloudflare Worker)

import { createZeroServer } from '@rocicorp/zero/server';
import { tempoSchema } from './schema';

export default {
  async fetch(request: Request, env: Env) {
    // Validate user auth
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const userId = await validateToken(token, env);

    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check sync subscription
    const hasSyncSubscription = await checkSubscription(userId, 'sync', env);
    if (!hasSyncSubscription) {
      return new Response('Sync subscription required', { status: 402 });
    }

    // Create Zero server instance
    const zeroServer = createZeroServer({
      schema: tempoSchema,
      storage: {
        type: 'cloudflare-durable-objects',
        namespace: env.ZERO_STORAGE,
      },
      auth: {
        getUserID: () => userId,
      },
    });

    return zeroServer.handleRequest(request);
  },
};
```

---

## Cost Considerations

### Zero Pricing (as of 2024)

- **Self-hosted:** Free (you run the server)
- **Managed:** Contact Rocicorp for pricing

**Recommendation:** Start with self-hosted on Cloudflare

### Storage Costs (Cloudflare Durable Objects)

- **Free tier:** 1GB storage
- **Paid:** $0.20/GB-month
- **Estimated:** ~10KB per user → 1000 users = 10MB (~$0.002/month)

---

## Testing

```typescript
// src/components/tempo/lib/zero-client.test.ts

import { describe, it, expect } from 'vitest';
import { getZeroClient } from './zero-client';

describe('Zero Client', () => {
  it('creates tasks', async () => {
    const userId = 'test-user-1';
    const zero = getZeroClient(userId);

    await createTask(userId, {
      title: 'Test task',
      priority: 1,
    });

    const tasks = await zero.query.tasks.where('userId', userId).toArray();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Test task');
  });
});
```

---

## Next Steps

1. [ ] Contact Rocicorp team (leverage your connection)
2. [ ] Set up Zero server on Cloudflare
3. [ ] Implement schema
4. [ ] Build migration from localStorage
5. [ ] Add sync toggle in settings
6. [ ] Test offline behavior
7. [ ] Implement export functionality

---

## Related Docs

- [Unified Auth System](../auth/UNIFIED_AUTH.md)
- [Backup & Disaster Recovery](../infrastructure/BACKUP_RECOVERY.md)
- [Billing Integration](../billing/STRIPE_INTEGRATION.md)
