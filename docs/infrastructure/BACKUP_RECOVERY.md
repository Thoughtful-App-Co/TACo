# Backup & Disaster Recovery Strategy

**Philosophy:** User owns their data, multiple recovery paths, Obsidian-style retention  
**Status:** Architecture Design

---

## Core Principles

1. **Primary storage: User's device** (localStorage/IndexedDB/SQLite)
2. **Backup: Optional paid sync** (encrypted cloud storage)
3. **Always exportable** (JSON, CSV, vCard, SQLite)
4. **1-month retention after cancellation** (Obsidian model)
5. **Final email backup** on subscription end
6. **No vendor lock-in** (standard formats)

---

## Recovery Matrix

| Scenario                      | Recovery Method                   | Cost | Time to Recover |
| ----------------------------- | --------------------------------- | ---- | --------------- |
| **Accidental deletion**       | Undo/trash (local)                | Free | Instant         |
| **Browser data cleared**      | Sync restore (if subscribed)      | Paid | < 1 minute      |
| **Device lost/stolen**        | Sync restore + manual export      | Paid | < 5 minutes     |
| **Subscription cancelled**    | Email backup (sent automatically) | Free | Check email     |
| **Forgot to cancel, expired** | 1-month cold storage              | Free | Contact support |
| **Want to switch tools**      | Export JSON/CSV                   | Free | Instant         |

---

## Backup Tiers

### Free Tier (Local-Only)

```
┌─────────────────────────────────────────┐
│           USER'S DEVICE                  │
│                                         │
│  • localStorage (primary)               │
│  • IndexedDB (if using Evolu/Zero)      │
│  • No automatic backups                 │
│  • Manual export anytime (JSON/CSV)     │
│                                         │
└─────────────────────────────────────────┘
```

**Recovery:** User responsible for their own backups

### Sync Subscription ($3.50/mo or $35/year)

```
┌─────────────────────────────────────────┐
│           USER'S DEVICE                  │
│  • localStorage (primary)               │
│  • Syncs to cloud (encrypted)           │
└─────────────────────────────────────────┘
                 │
                 ▼ Real-time sync
┌─────────────────────────────────────────┐
│         CLOUD STORAGE                    │
│  • Zero/Evolu/Jazz servers              │
│  • Encrypted at rest                    │
│  • Automatic backups                    │
│  • Cross-device sync                    │
└─────────────────────────────────────────┘
                 │
                 ▼ On cancellation
┌─────────────────────────────────────────┐
│         EMAIL BACKUP                     │
│  • JSON export sent to user             │
│  • Includes all data                    │
│  • Re-importable                        │
└─────────────────────────────────────────┘
                 │
                 ▼ Keep for 30 days
┌─────────────────────────────────────────┐
│         COLD STORAGE                     │
│  • Archived for 1 month                 │
│  • Can reactivate subscription          │
│  • Then permanently deleted             │
└─────────────────────────────────────────┘
```

---

## Export Formats

### Per-App Export Capabilities

| App         | JSON    | CSV             | SQLite         | vCard | PDF            |
| ----------- | ------- | --------------- | -------------- | ----- | -------------- |
| **Tempo**   | ✅ Full | ✅ Task list    | ✅ (via Zero)  | ❌    | ❌             |
| **Tenure**  | ✅ Full | ✅ Applications | ✅ (via Evolu) | ❌    | ⚠️ Resume only |
| **Nurture** | ✅ Full | ✅ Contacts     | ❌             | ✅    | ❌             |

### Export Implementation

```typescript
// Unified export interface for all apps

interface ExportData {
  version: string; // Format version
  app: 'tempo' | 'tenure' | 'nurture';
  exportedAt: string; // ISO timestamp
  userId: string;
  data: any; // App-specific data
  metadata?: {
    mnemonic?: string; // For Evolu (Tenure)
    encryption?: 'none' | 'evolu';
  };
}

// Global export function
export async function exportAllApps(userId: string) {
  const tempoData = await exportTempoData(userId);
  const tenureData = await exportTenureData(userId);
  const nurtureData = await exportNurtureData(userId);

  const combinedExport = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    userId,
    apps: {
      tempo: tempoData,
      tenure: tenureData,
      nurture: nurtureData,
    },
  };

  // Download as single JSON file
  downloadJSON(combinedExport, `thoughtful-app-co-export-${Date.now()}.json`);
}
```

---

## Email Backup on Cancellation

### Trigger Flow

```typescript
// Stripe webhook: subscription.cancelled

export async function handleSubscriptionCancelled(
  userId: string,
  subscription: StripeSubscription,
  env: Env
) {
  // 1. Generate full export
  const exportData = await generateFullExport(userId, env);

  // 2. Upload to temporary storage (24h expiry link)
  const downloadUrl = await uploadToR2(exportData, { ttl: 24 * 60 * 60 });

  // 3. Send email with download link
  await sendCancellationEmail(userId, downloadUrl, env);

  // 4. Move data to cold storage (30 day retention)
  await moveToColdStorage(userId, exportData, env);
}

async function sendCancellationEmail(userId: string, downloadUrl: string, env: Env) {
  const user = await getUser(userId, env);

  await env.RESEND.emails.send({
    from: 'Thoughtful App Co <backups@thoughtfulappco.com>',
    to: user.email,
    subject: 'Your Thoughtful App Co Data Backup',
    html: `
      <h2>Your subscription has been cancelled</h2>
      
      <p>We've prepared a backup of all your data. Download it here:</p>
      
      <p><a href="${downloadUrl}">Download Backup (expires in 24 hours)</a></p>
      
      <h3>What happens next:</h3>
      <ul>
        <li>Your data will be stored for 30 days in case you return</li>
        <li>After 30 days, it will be permanently deleted</li>
        <li>Your local data is unaffected - it stays on your device</li>
        <li>You can re-import this backup anytime</li>
      </ul>
      
      <p>To reactivate your subscription, visit <a href="https://thoughtfulappco.com/account">your account</a>.</p>
    `,
  });
}
```

---

## Cold Storage Implementation

### Cloudflare R2 (S3-compatible)

```typescript
// Store cancelled user data for 30 days

interface ColdStorageEntry {
  userId: string;
  exportData: ExportData;
  cancelledAt: number;
  expiresAt: number; // cancelledAt + 30 days
}

export async function moveToColdStorage(userId: string, exportData: ExportData, env: Env) {
  const entry: ColdStorageEntry = {
    userId,
    exportData,
    cancelledAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  // Upload to R2 with 30-day lifecycle policy
  await env.R2_BACKUPS.put(`cold-storage/${userId}.json`, JSON.stringify(entry), {
    customMetadata: {
      expiresAt: entry.expiresAt.toString(),
    },
  });

  // Schedule deletion job (Cloudflare cron)
  await env.KV.put(
    `cold-storage-expiry:${userId}`,
    entry.expiresAt.toString(),
    { expirationTtl: 30 * 24 * 60 * 60 } // Auto-delete after 30 days
  );
}

// Restore from cold storage if user reactivates
export async function restoreFromColdStorage(userId: string, env: Env): Promise<ExportData | null> {
  const object = await env.R2_BACKUPS.get(`cold-storage/${userId}.json`);

  if (!object) return null;

  const entry: ColdStorageEntry = JSON.parse(await object.text());

  // Check if not expired
  if (Date.now() > entry.expiresAt) {
    return null; // Already deleted
  }

  return entry.exportData;
}
```

---

## Automated Backup Schedule (for Sync Users)

```typescript
// Cloudflare Cron: Run daily at 3 AM UTC

export async function dailyBackupJob(env: Env) {
  // Get all users with active sync subscriptions
  const users = await env.DB.prepare(
    `
      SELECT DISTINCT user_id FROM subscriptions
      WHERE (product = 'sync' OR product = 'taco_club')
      AND status = 'active'
    `
  ).all();

  for (const user of users.results) {
    await backupUser(user.user_id, env);
  }
}

async function backupUser(userId: string, env: Env) {
  // Generate snapshot
  const exportData = await generateFullExport(userId, env);

  // Store in R2 with date-based key
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  await env.R2_BACKUPS.put(`daily-backups/${userId}/${date}.json`, JSON.stringify(exportData), {
    customMetadata: {
      backupDate: date,
    },
  });

  // Keep last 7 days of daily backups
  await cleanupOldBackups(userId, env);
}
```

---

## Import/Restore Functionality

### Restore UI Component

```typescript
// src/components/settings/RestoreBackup.tsx

export const RestoreBackup = () => {
  const [file, setFile] = createSignal<File | null>(null);
  const [importing, setImporting] = createSignal(false);

  async function handleImport() {
    if (!file()) return;

    setImporting(true);

    try {
      const text = await file()!.text();
      const exportData = JSON.parse(text);

      // Validate format
      if (!exportData.version || !exportData.apps) {
        throw new Error('Invalid backup file format');
      }

      // Import each app's data
      if (exportData.apps.tempo) {
        await importTempoData(exportData.apps.tempo);
      }
      if (exportData.apps.tenure) {
        await importTenureData(exportData.apps.tenure);
      }
      if (exportData.apps.nurture) {
        await importNurtureData(exportData.apps.nurture);
      }

      alert('Backup restored successfully!');
      window.location.reload();
    } catch (error) {
      alert(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <h3>Restore from Backup</h3>
      <input
        type="file"
        accept=".json"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button onClick={handleImport} disabled={!file() || importing()}>
        {importing() ? 'Restoring...' : 'Restore Backup'}
      </button>
    </div>
  );
};
```

---

## Data Retention Policy (Obsidian Model)

| User Action                                 | Data Retention           | Reasoning                  |
| ------------------------------------------- | ------------------------ | -------------------------- |
| **Active subscription**                     | Indefinite               | User is paying for storage |
| **Cancelled subscription**                  | 1 month                  | Grace period to return     |
| **Account deletion**                        | Immediate                | User requested deletion    |
| **Subscription expires (forgot to cancel)** | 1 month                  | Same as cancelled          |
| **Cold storage**                            | 30 days                  | Then permanent deletion    |
| **Free tier**                               | Never stored server-side | Local-only                 |

---

## Cost Analysis

### Storage Costs (Cloudflare R2)

- **Daily backups:** 7 days × avg 10MB per user = 70MB/user/month
- **Cold storage:** 1 month × avg 10MB = 10MB per cancelled user
- **R2 pricing:** $0.015/GB-month

**For 1000 users:**

- Active users: 1000 × 70MB = 70GB = **$1.05/month**
- Cancelled users (estimate 50): 50 × 10MB = 0.5GB = **$0.01/month**
- **Total: ~$1-2/month for 1000 users**

---

## Testing

```typescript
describe('Backup & Recovery', () => {
  it('exports all app data', async () => {
    const exportData = await exportAllApps(userId);

    expect(exportData.apps.tempo).toBeDefined();
    expect(exportData.apps.tenure).toBeDefined();
    expect(exportData.apps.nurture).toBeDefined();
  });

  it('sends email backup on cancellation', async () => {
    await handleSubscriptionCancelled(userId, subscription, env);

    // Check email was sent
    expect(emailsSent).toContainEqual(
      expect.objectContaining({
        to: user.email,
        subject: expect.stringContaining('Backup'),
      })
    );
  });

  it('restores from backup file', async () => {
    const backupFile = new File([JSON.stringify(exportData)], 'backup.json');

    await importBackup(backupFile);

    const tasks = await getTempoTasks();
    expect(tasks.length).toBeGreaterThan(0);
  });
});
```

---

## User-Facing Documentation

### FAQ Entries

**Q: What happens to my data if I cancel?**

A: We email you a complete backup of all your data. We keep it stored for 30 days in case you return. After that, it's permanently deleted. Your local data on your device is never affected.

**Q: Can I get my data out anytime?**

A: Yes! Every app has a free export feature. You can download your data as JSON or CSV anytime, even on the free tier.

**Q: What if my device breaks?**

A: If you have a Sync subscription, your data is automatically backed up to the cloud. Just sign in on a new device and everything syncs back. If you don't have Sync, we recommend exporting your data regularly.

---

## Next Steps

1. [ ] Set up Cloudflare R2 bucket for backups
2. [ ] Implement export functions for each app
3. [ ] Build import/restore UI
4. [ ] Create email templates for backups
5. [ ] Set up daily backup cron job
6. [ ] Implement cold storage logic
7. [ ] Test full backup/restore flow

---

## Related Docs

- [Tempo Sync Integration](../tempo/SYNC_INTEGRATION.md)
- [Tenure Sync Integration](../tenure/SYNC_INTEGRATION.md)
- [Nurture Sync Integration](../nurture/SYNC_INTEGRATION.md)
- [Unified Auth System](../auth/UNIFIED_AUTH.md)
- [Billing Integration](../billing/STRIPE_INTEGRATION.md)
