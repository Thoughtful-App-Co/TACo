/**
 * Sync Module - Re-exports
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

export { SyncManager } from './SyncManager';
export type {
  SyncApp,
  SyncStatus,
  SyncState,
  SyncMeta,
  SyncConflict,
  SyncManagerOptions,
  GetDataCallback,
  SetDataCallback,
  StatusChangeListener,
} from './types';

// Tenure sync
export {
  useTenureSync,
  getTenureSyncManager,
  destroyTenureSyncManager,
  notifyTenureDataChanged,
} from './tenure-sync';
export type { TenureSyncData } from './tenure-sync';

// Tempo sync
export {
  useTempoSync,
  getTempoSyncManager,
  destroyTempoSyncManager,
  notifyTempoDataChanged,
} from './tempo-sync';
export type { TempoSyncData } from './tempo-sync';
