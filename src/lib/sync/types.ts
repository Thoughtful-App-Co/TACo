/**
 * Sync Types - Type definitions for the sync system
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

export type SyncApp = 'tenure' | 'tempo';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline' | 'conflict';

/**
 * Sync metadata from server
 */
export interface SyncMeta {
  version: number;
  lastModified: string;
  deviceId: string;
  checksum: string;
  size: number;
}

/**
 * Conflict information when server has newer data
 */
export interface SyncConflict {
  localVersion: number;
  serverVersion: number;
  localModified: string;
  serverModified: string;
  serverDeviceId: string;
}

/**
 * Current sync state
 */
export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  lastError: string | null;
  conflict: SyncConflict | null;
  pendingChanges: boolean;
  serverVersion: number | null;
  localVersion: number;
}

/**
 * Sync manager options
 */
export interface SyncManagerOptions {
  /** Debounce delay for auto-push in ms (default: 30000) */
  debounceMs?: number;
  /** Auto-sync on init (default: true) */
  autoSync?: boolean;
  /** Push on window blur (default: true) */
  pushOnBlur?: boolean;
}

/**
 * Callback for data retrieval
 */
export type GetDataCallback<T = unknown> = () => T;

/**
 * Callback for data application
 */
export type SetDataCallback<T = unknown> = (data: T) => void;

/**
 * Status change listener
 */
export type StatusChangeListener = (state: SyncState) => void;

/**
 * API response types
 */
export interface MetaResponse {
  success: boolean;
  exists: boolean;
  meta: SyncMeta | null;
  availableVersions: number[];
}

export interface PullResponse {
  success: boolean;
  data: unknown;
  meta: SyncMeta;
  availableVersions: number[];
}

export interface PushResponse {
  success: boolean;
  version: number;
  checksum: string;
  timestamp: string;
}

export interface ConflictResponse {
  error: string;
  code: 'CONFLICT';
  localVersion: number;
  serverVersion: number;
  serverModified: string;
  serverDeviceId: string;
}
