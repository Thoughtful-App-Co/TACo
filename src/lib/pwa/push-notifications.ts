/**
 * Push Notification Service
 *
 * Handles push notification subscription and preferences.
 * Note: VAPID keys must be generated and stored in environment variables.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { createSignal } from 'solid-js';
import { set, del } from 'idb-keyval';

// Get VAPID public key from environment
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

// Reactive signals
export const [pushSupported, setPushSupported] = createSignal(false);
export const [pushPermission, setPushPermission] = createSignal<NotificationPermission>('default');
export const [pushSubscription, setPushSubscription] = createSignal<PushSubscription | null>(null);

/**
 * Initialize push notification support
 */
export async function initPushNotifications(): Promise<void> {
  // Check if push is supported
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('[Push] Not supported in this browser');
    return;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.log('[Push] VAPID public key not configured');
    return;
  }

  setPushSupported(true);
  setPushPermission(Notification.permission);

  // Get existing subscription
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      setPushSubscription(subscription);
      console.log('[Push] Existing subscription found');
    }
  } catch (error) {
    console.error('[Push] Failed to get subscription:', error);
  }
}

/**
 * Request push notification permission
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  const permission = await Notification.requestPermission();
  setPushPermission(permission);
  return permission;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!pushSupported()) {
    console.log('[Push] Not supported');
    return null;
  }

  const permission = await requestPushPermission();
  if (permission !== 'granted') {
    console.log('[Push] Permission denied');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
    });

    setPushSubscription(subscription);

    // Store locally
    await set('push_subscription', JSON.stringify(subscription.toJSON()));

    // Sync with server
    await syncSubscriptionWithServer(subscription);

    console.log('[Push] Subscribed successfully');
    return subscription;
  } catch (error) {
    console.error('[Push] Subscription failed:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  const subscription = pushSubscription();
  if (!subscription) return true;

  try {
    await subscription.unsubscribe();
    setPushSubscription(null);
    await del('push_subscription');

    console.log('[Push] Unsubscribed');
    return true;
  } catch (error) {
    console.error('[Push] Unsubscribe failed:', error);
    return false;
  }
}

/**
 * Sync subscription with server
 */
async function syncSubscriptionWithServer(subscription: PushSubscription): Promise<void> {
  try {
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        timestamp: Date.now(),
      }),
    });
  } catch (error) {
    console.error('[Push] Failed to sync subscription:', error);
  }
}

/**
 * Helper to convert VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
