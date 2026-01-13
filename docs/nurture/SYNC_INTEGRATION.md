# Nurture - Jazz Sync Integration

**App:** Nurture (Relationship Cultivation)  
**Sync Engine:** Jazz (by Garden Computing)  
**Status:** Planning Phase

---

## Why Jazz for Nurture?

| Nurture Requirement  | Jazz Capability             |
| -------------------- | --------------------------- |
| Contact management   | CRDT-based sync             |
| Future collaboration | Built for multi-user        |
| Real-time updates    | Real-time by default        |
| Permissions (future) | Fine-grained access control |
| Relationship data    | Graph-friendly data model   |
| Simple onboarding    | Great DX                    |

**Key advantage:** Future-proof for collaborative features (shared contacts, team relationship management)

**Supporting the community:** Garden Computing is building local-first infrastructure

---

## Data Model

### Jazz Schema

```typescript
// src/components/nurture/lib/schema.ts

import { co, CoMap, CoList, Account } from 'jazz-tools';

// Contact entity
export class Contact extends CoMap {
  id = co.string;
  userId = co.string; // Owner

  // Basic info
  name = co.string;
  email = co.optional(co.string);
  phone = co.optional(co.string);
  company = co.optional(co.string);
  title = co.optional(co.string);

  // Relationship
  relationship = co.literal('friend', 'family', 'colleague', 'mentor', 'professional', 'other');

  // Nurture cycle
  nurtureCycle = co.number; // Days between check-ins
  lastContact = co.number; // Timestamp
  growthStage = co.literal('seedling', 'growing', 'flourishing', 'needs-water');

  // Notes & tags
  notes = co.optional(co.string);
  tags = co.optional(CoList.of(co.string));

  // Timestamps
  createdAt = co.number;
  updatedAt = co.number;

  // Metadata
  isDeleted = co.boolean;
}

// Interaction log
export class Interaction extends CoMap {
  id = co.string;
  contactId = co.ref(Contact);

  // Interaction details
  type = co.literal('call', 'text', 'coffee', 'lunch', 'video', 'event', 'other');
  date = co.number;
  notes = co.optional(co.string);

  // Sentiment
  quality = co.optional(co.number); // 1-5 rating

  createdAt = co.number;
}

// Contact list (root collection)
export class ContactList extends CoMap {
  contacts = co.ref(CoList.of(co.ref(Contact)));
}

// Nurture settings
export class NurtureSettings extends CoMap {
  userId = co.string;

  // Notification preferences
  enableReminders = co.boolean;
  reminderTime = co.optional(co.string); // "09:00" format

  // Default nurture cycles
  defaultCycles = co.json; // { friend: 7, family: 5, colleague: 14 }

  updatedAt = co.number;
}
```

---

## Setup & Installation

### 1. Install Jazz

```bash
pnpm install jazz-tools jazz-browser
```

### 2. Initialize Jazz Client

```typescript
// src/components/nurture/lib/jazz-client.ts

import { createJazzReactApp, DemoAuth } from 'jazz-react';
import { Contact, ContactList, Interaction, NurtureSettings } from './schema';

// Create Jazz app
export const Jazz = createJazzReactApp({
  // Auth provider - integrate with our unified auth
  auth: DemoAuth({
    appName: 'Thoughtful App Co - Nurture',
    // TODO: Replace with our auth integration
  }),

  // Peer server
  peer: import.meta.env.VITE_JAZZ_PEER_SERVER || 'wss://jazz.thoughtfulappco.com',
});

export const { useAccount, useCoState, useAcceptInvite } = Jazz;
```

### 3. Query Pattern

```typescript
// src/components/nurture/hooks/useContacts.ts

import { useCoState } from '../lib/jazz-client';
import { Contact, ContactList } from '../lib/schema';

export function useContacts() {
  const { me } = useAccount();

  // Get user's contact list
  const contactList = useCoState(ContactList, me?.root.contactListId);

  if (!contactList?.contacts) return [];

  // Filter out deleted
  return contactList.contacts.filter((contact) => !contact?.isDeleted);
}

export function useContactsByStage(stage: Contact['growthStage']) {
  const contacts = useContacts();
  return contacts.filter((c) => c.growthStage === stage);
}
```

### 4. Mutations

```typescript
// src/components/nurture/lib/mutations.ts

import { Contact, Interaction } from './schema';
import { useAccount } from './jazz-client';

export function useCreateContact() {
  const { me } = useAccount();

  return async (data: Partial<Contact>) => {
    if (!me) throw new Error('Not authenticated');

    // Create new contact
    const contact = Contact.create(
      {
        id: crypto.randomUUID(),
        userId: me.id,
        name: data.name!,
        email: data.email,
        phone: data.phone,
        relationship: data.relationship || 'other',
        nurtureCycle: data.nurtureCycle || 14,
        lastContact: Date.now(),
        growthStage: 'seedling',
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDeleted: false,
      },
      { owner: me }
    );

    // Add to user's contact list
    me.root.contactList?.contacts.append(contact);

    return contact;
  };
}

export function useLogInteraction() {
  const { me } = useAccount();

  return async (contactId: string, data: Partial<Interaction>) => {
    if (!me) throw new Error('Not authenticated');

    const interaction = Interaction.create(
      {
        id: crypto.randomUUID(),
        contactId,
        type: data.type!,
        date: data.date || Date.now(),
        notes: data.notes,
        quality: data.quality,
        createdAt: Date.now(),
      },
      { owner: me }
    );

    // Update contact's lastContact timestamp
    const contact = await me.root.contactList?.contacts.find((c) => c.id === contactId);
    if (contact) {
      contact.lastContact = Date.now();
      contact.updatedAt = Date.now();

      // Recalculate growth stage
      contact.growthStage = calculateGrowthStage(contact);
    }

    return interaction;
  };
}

function calculateGrowthStage(contact: Contact): Contact['growthStage'] {
  const daysSince = (Date.now() - contact.lastContact) / (1000 * 60 * 60 * 24);

  if (daysSince > contact.nurtureCycle * 1.5) return 'needs-water';
  if (daysSince > contact.nurtureCycle) return 'seedling';
  if (daysSince < contact.nurtureCycle / 2) return 'flourishing';
  return 'growing';
}
```

---

## Sync Subscription Gating

### Free vs Paid Behavior

```typescript
// src/components/nurture/lib/sync-manager.ts

export async function initializeNurtureSync(userId: string, hasSyncSubscription: boolean) {
  if (!hasSyncSubscription) {
    console.log('[Nurture] Running in local-only mode');
    // Jazz can still work locally without sync
    // Just don't connect to peer server
    return;
  }

  console.log('[Nurture] Enabling Jazz sync');
  // Jazz syncs automatically when peer connection is active
}
```

---

## Migration from localStorage

### Current State (Sample Data Only)

Nurture currently has no persistence - just sample data in component state.

### Migration Strategy

```typescript
// src/components/nurture/lib/migration.ts

export async function migrateToJazz() {
  const { me } = useAccount();
  if (!me) throw new Error('Not authenticated');

  // If there's any localStorage data from previous experiments
  const storedContacts = localStorage.getItem('nurture_contacts');
  if (!storedContacts) {
    console.log('[Nurture] No data to migrate');
    return;
  }

  const contacts = JSON.parse(storedContacts);

  // Create contact list if doesn't exist
  if (!me.root.contactList) {
    me.root.contactList = ContactList.create(
      {
        contacts: [],
      },
      { owner: me }
    );
  }

  // Migrate each contact
  for (const contact of contacts) {
    const newContact = Contact.create(
      {
        ...contact,
        id: contact.id || crypto.randomUUID(),
        userId: me.id,
        createdAt: contact.createdAt || Date.now(),
        updatedAt: Date.now(),
        isDeleted: false,
      },
      { owner: me }
    );

    me.root.contactList.contacts.append(newContact);
  }

  localStorage.setItem('nurture_migrated_to_jazz', 'true');
  console.log('[Nurture] Migration complete');
}
```

---

## Jazz Account Integration

### With Unified Auth

Jazz has its own auth system, but we need to integrate with our unified Thoughtful App Co. auth:

```typescript
// src/components/nurture/lib/auth-integration.ts

import { BrowserPasskeyAuth } from 'jazz-browser-auth-passkey';
import { useAccount } from './jazz-client';

export function createJazzAccount(thoughtfulAppCoUserId: string) {
  // Option 1: Use Jazz's passkey auth
  const auth = BrowserPasskeyAuth({
    appName: 'Thoughtful App Co',
    accountID: thoughtfulAppCoUserId, // Link to our account
  });

  return auth;
}

// Option 2: Custom auth provider (recommended)
export const ThoughtfulAppCoAuth = {
  async createAccount() {
    // User already authenticated with our system
    const sessionToken = localStorage.getItem('taco_session_token');
    if (!sessionToken) throw new Error('Not authenticated');

    // Validate session with our backend
    const response = await fetch('/api/auth/validate', {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });

    if (!response.ok) throw new Error('Invalid session');

    const { userId } = await response.json();

    // Create Jazz account linked to our user
    return {
      id: userId,
      // Jazz needs this
    };
  },

  async getExistingAccount() {
    // Similar to createAccount
  },
};
```

---

## Collaborative Features (Future)

Jazz is built for collaboration - here's how Nurture could use it:

### Shared Contacts

```typescript
// Share a contact with another user
export function useShareContact() {
  const { me } = useAccount();

  return async (contactId: string, recipientId: string) => {
    const contact = me.root.contactList?.contacts.find((c) => c.id === contactId);
    if (!contact) throw new Error('Contact not found');

    // Jazz handles permissions automatically
    contact._raw.giveAccessTo('reader', recipientId);

    // Or create a shared contact list
    const sharedList = ContactList.create(
      {
        contacts: [contact],
      },
      {
        owner: me,
        writers: [recipientId], // Can add/edit
      }
    );
  };
}
```

### Team Relationship Management

```typescript
// Company/team shared contact database
export class TeamContactList extends CoMap {
  teamId = co.string;
  teamName = co.string;
  contacts = co.ref(CoList.of(co.ref(Contact)));
  members = co.ref(CoList.of(co.string)); // User IDs
}
```

---

## Export/Backup

```typescript
// src/components/nurture/lib/export.ts

export function exportNurtureData() {
  const contacts = useContacts();

  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data: {
      contacts: contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        relationship: contact.relationship,
        nurtureCycle: contact.nurtureCycle,
        lastContact: contact.lastContact,
        growthStage: contact.growthStage,
        notes: contact.notes,
        tags: contact.tags,
      })),
    },
  };

  // Download as JSON
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nurture-export-${Date.now()}.json`;
  a.click();
}

// Also export as vCard for compatibility
export function exportAsVCard() {
  const contacts = useContacts();

  const vcardData = contacts
    .map((contact) =>
      `
BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
EMAIL:${contact.email || ''}
TEL:${contact.phone || ''}
ORG:${contact.company || ''}
TITLE:${contact.title || ''}
NOTE:${contact.notes || ''}
END:VCARD
  `.trim()
    )
    .join('\n\n');

  const blob = new Blob([vcardData], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nurture-contacts-${Date.now()}.vcf`;
  a.click();
}
```

---

## Peer Server Setup

### Option 1: Use Jazz Cloud (Recommended)

Jazz provides hosted peer servers:

```typescript
const Jazz = createJazzReactApp({
  peer: 'wss://cloud.jazz.tools', // Official Jazz cloud
});
```

**Cost:** Check jazz.tools for pricing

### Option 2: Self-Hosted Peer Server

Run your own on Cloudflare:

```typescript
// services/jazz-peer/index.ts

import { createPeerServer } from 'jazz-mesh';

export default {
  async fetch(request: Request, env: Env) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected websocket', { status: 400 });
    }

    // Authenticate user
    const token = new URL(request.url).searchParams.get('token');
    const userId = await validateToken(token, env);
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check sync subscription
    const hasSyncSubscription = await checkSubscription(userId, 'sync', env);
    if (!hasSyncSubscription) {
      return new Response('Sync subscription required', { status: 402 });
    }

    // Create peer server
    const peer = createPeerServer({
      storage: env.JAZZ_STORAGE,
    });

    return peer.handleWebSocket(request);
  },
};
```

---

## Reminders & Notifications

### "Needs Water" Detection

```typescript
// Run daily to detect contacts that need attention
export function detectNeedsWater() {
  const contacts = useContacts();
  const now = Date.now();

  const needsAttention = contacts.filter((contact) => {
    const daysSince = (now - contact.lastContact) / (1000 * 60 * 60 * 24);
    return daysSince > contact.nurtureCycle;
  });

  return needsAttention;
}

// Trigger notifications (part of Extras subscription)
export async function sendNurtureReminders(userId: string) {
  const needsWater = detectNeedsWater();

  if (needsWater.length === 0) return;

  // Call notification API (your backend)
  await fetch('/api/notifications/nurture-reminder', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({
      userId,
      contacts: needsWater.map((c) => ({
        name: c.name,
        daysSince: Math.floor((Date.now() - c.lastContact) / (1000 * 60 * 60 * 24)),
      })),
    }),
  });
}
```

---

## Testing

```typescript
// src/components/nurture/lib/jazz-client.test.ts

import { describe, it, expect } from 'vitest';

describe('Jazz Client', () => {
  it('creates contacts', async () => {
    const createContact = useCreateContact();

    const contact = await createContact({
      name: 'Test Contact',
      relationship: 'friend',
      nurtureCycle: 7,
    });

    expect(contact.name).toBe('Test Contact');
    expect(contact.relationship).toBe('friend');
  });

  it('logs interactions', async () => {
    const logInteraction = useLogInteraction();

    const interaction = await logInteraction(contactId, {
      type: 'coffee',
      notes: 'Great catch-up',
      quality: 5,
    });

    expect(interaction.type).toBe('coffee');
  });
});
```

---

## Cost Considerations

### Jazz Pricing

- **Self-hosted peer server:** Free (you run it)
- **Jazz Cloud:** Check jazz.tools for current pricing

### Storage Costs

- Contacts are small (~1KB each)
- 1000 contacts = ~1MB
- Cloudflare storage: ~$0.20/GB-month
- **Estimated:** Negligible for typical usage

---

## Next Steps

1. [ ] Install Jazz
2. [ ] Implement schema
3. [ ] Build UI with Jazz hooks
4. [ ] Set up peer server (cloud or self-hosted)
5. [ ] Integrate with unified auth
6. [ ] Implement migration (if needed)
7. [ ] Test sync across devices
8. [ ] Build vCard export

---

## Related Docs

- [Unified Auth System](../auth/UNIFIED_AUTH.md)
- [Backup & Disaster Recovery](../infrastructure/BACKUP_RECOVERY.md)
- [Billing Integration](../billing/STRIPE_INTEGRATION.md)
- [Notification System](../infrastructure/NOTIFICATIONS.md)
