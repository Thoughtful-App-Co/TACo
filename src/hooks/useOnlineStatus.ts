/**
 * Online Status Hook
 *
 * Provides reactive online/offline status and network quality information.
 * Useful for showing offline indicators and adjusting UX based on connection.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { createSignal, onMount, onCleanup } from 'solid-js';
import { logger } from '../lib/logger';

const log = logger.create('Network');

export interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  effectiveType: string | null; // '4g', '3g', '2g', 'slow-2g'
  downlink: number | null; // Mbps
  rtt: number | null; // Round-trip time in ms
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = createSignal(navigator.onLine);
  const [wasOffline, setWasOffline] = createSignal(false);
  const [connectionInfo, setConnectionInfo] = createSignal<{
    effectiveType: string | null;
    downlink: number | null;
    rtt: number | null;
  }>({
    effectiveType: null,
    downlink: null,
    rtt: null,
  });

  onMount(() => {
    const handleOnline = () => {
      log.info('Back online');
      setIsOnline(true);
      if (!isOnline()) {
        setWasOffline(true);
        // Reset wasOffline after showing "back online" message
        setTimeout(() => setWasOffline(false), 5000);
      }
    };

    const handleOffline = () => {
      log.info('Went offline');
      setIsOnline(false);
    };

    const updateConnectionInfo = () => {
      const connection = (navigator as any).connection;
      if (connection) {
        setConnectionInfo({
          effectiveType: connection.effectiveType || null,
          downlink: connection.downlink || null,
          rtt: connection.rtt || null,
        });
        log.info('Connection updated:', {
          type: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Network Information API (Chrome, Edge, Opera)
    const connection = (navigator as any).connection;
    if (connection) {
      updateConnectionInfo();
      connection.addEventListener('change', updateConnectionInfo);
    }

    onCleanup(() => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateConnectionInfo);
      }
    });
  });

  return {
    isOnline,
    wasOffline,
    connectionInfo,
    isSlowConnection: () => {
      const info = connectionInfo();
      return info.effectiveType === 'slow-2g' || info.effectiveType === '2g';
    },
  };
}
