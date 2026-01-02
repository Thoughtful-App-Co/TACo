/**
 * Offline Queue
 *
 * Queues failed API requests when offline and automatically retries when back online.
 * Uses IndexedDB for persistence across sessions.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { get, set, del, keys } from 'idb-keyval';

export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  timestamp: number;
  retries: number;
  maxRetries: number;
  appContext?: string; // 'tempo', 'tenure', etc.
}

const QUEUE_PREFIX = 'offline_queue_';
const MAX_RETRIES = 3;

/**
 * Queue a failed request for retry when back online
 */
export async function queueRequest(
  url: string,
  options: RequestInit,
  appContext?: string
): Promise<string> {
  const id = `${QUEUE_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const queuedRequest: QueuedRequest = {
    id,
    url,
    method: options.method || 'GET',
    headers: Object.fromEntries(new Headers(options.headers).entries()),
    body: typeof options.body === 'string' ? options.body : null,
    timestamp: Date.now(),
    retries: 0,
    maxRetries: MAX_RETRIES,
    appContext,
  };

  await set(id, queuedRequest);

  console.log(`[OfflineQueue] Queued request: ${id}`, { url, method: options.method });
  return id;
}

/**
 * Get all queued requests
 */
export async function getQueuedRequests(): Promise<QueuedRequest[]> {
  const allKeys = await keys();
  const queueKeys = allKeys.filter(
    (key): key is string => typeof key === 'string' && key.startsWith(QUEUE_PREFIX)
  );

  const requests: QueuedRequest[] = [];
  for (const key of queueKeys) {
    const request = await get<QueuedRequest>(key);
    if (request) {
      requests.push(request);
    }
  }

  return requests.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Process the entire queue
 * Called automatically when coming back online
 */
export async function processQueue(): Promise<{
  processed: number;
  failed: number;
  remaining: number;
}> {
  const requests = await getQueuedRequests();
  let processed = 0;
  let failed = 0;

  console.log(`[OfflineQueue] Processing ${requests.length} queued requests...`);

  for (const request of requests) {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });

      if (response.ok) {
        await del(request.id);
        processed++;
        console.log(`[OfflineQueue] ✓ Processed: ${request.url}`);
      } else if (response.status >= 400 && response.status < 500) {
        // Client error - don't retry
        await del(request.id);
        failed++;
        console.log(`[OfflineQueue] ✗ Failed (client error ${response.status}): ${request.url}`);
      } else {
        // Server error - retry
        request.retries++;
        if (request.retries >= request.maxRetries) {
          await del(request.id);
          failed++;
          console.log(`[OfflineQueue] ✗ Failed (max retries): ${request.url}`);
        } else {
          await set(request.id, request);
          console.log(
            `[OfflineQueue] ↻ Retry ${request.retries}/${request.maxRetries}: ${request.url}`
          );
        }
      }
    } catch (error) {
      // Network error - keep in queue
      console.log(`[OfflineQueue] Network error, keeping: ${request.url}`, error);
    }
  }

  const remaining = (await getQueuedRequests()).length;

  console.log(
    `[OfflineQueue] Complete: ${processed} processed, ${failed} failed, ${remaining} remaining`
  );

  return { processed, failed, remaining };
}

/**
 * Clear entire queue
 */
export async function clearQueue(): Promise<void> {
  const allKeys = await keys();
  const queueKeys = allKeys.filter(
    (key): key is string => typeof key === 'string' && key.startsWith(QUEUE_PREFIX)
  );

  for (const key of queueKeys) {
    await del(key);
  }

  console.log(`[OfflineQueue] Cleared ${queueKeys.length} requests`);
}

/**
 * Remove a specific request from the queue
 */
export async function removeFromQueue(id: string): Promise<void> {
  await del(id);
  console.log(`[OfflineQueue] Removed: ${id}`);
}

// Auto-process queue when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[OfflineQueue] Back online, processing queue...');
    processQueue().then(({ processed, failed, remaining }) => {
      if (processed > 0 || failed > 0) {
        console.log(
          `[OfflineQueue] Results: ${processed} succeeded, ${failed} failed, ${remaining} queued`
        );
      }
    });
  });
}
