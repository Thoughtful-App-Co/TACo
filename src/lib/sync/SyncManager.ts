/**
 * SyncManager - Client-side sync orchestration
 *
 * Handles automatic sync between localStorage and R2 cloud storage.
 * Features:
 * - Debounced auto-push (30s after last change)
 * - Push on tab blur/close
 * - Conflict detection and resolution
 * - Offline queue with auto-retry
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { authFetch, getStoredToken } from '../auth';
import { logger } from '../logger';
import type {
  SyncApp,
  SyncState,
  SyncMeta,
  SyncConflict,
  SyncManagerOptions,
  GetDataCallback,
  SetDataCallback,
  StatusChangeListener,
  MetaResponse,
  PullResponse,
  PushResponse,
  ConflictResponse,
} from './types';

const DEFAULT_OPTIONS: Required<SyncManagerOptions> = {
  debounceMs: 30000, // 30 seconds
  autoSync: true,
  pushOnBlur: true,
  pollIntervalMs: 60000, // 60 seconds - check for server changes periodically
  pullOnFocus: true, // Pull when tab gains focus
};

/**
 * Generate or retrieve a unique device ID for this browser
 */
function getDeviceId(app: SyncApp): string {
  const key = `taco_sync_${app}_device_id`;
  let deviceId = localStorage.getItem(key);

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(key, deviceId);
  }

  return deviceId;
}

/**
 * Get local sync metadata
 */
function getLocalMeta(app: SyncApp): { version: number; lastModified: string } | null {
  const key = `taco_sync_${app}_meta`;
  const stored = localStorage.getItem(key);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Save local sync metadata
 */
function saveLocalMeta(app: SyncApp, version: number, lastModified: string): void {
  const key = `taco_sync_${app}_meta`;
  localStorage.setItem(key, JSON.stringify({ version, lastModified }));
}

/**
 * SyncManager class
 */
export class SyncManager<T = unknown> {
  private app: SyncApp;
  private getData: GetDataCallback<T>;
  private setData: SetDataCallback<T>;
  private options: Required<SyncManagerOptions>;
  private deviceId: string;

  private state: SyncState;
  private listeners: Set<StatusChangeListener> = new Set();

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private offlineQueue: Array<() => Promise<void>> = [];
  private isOnline: boolean = navigator.onLine;

  private boundHandleOnline: () => void;
  private boundHandleOffline: () => void;
  private boundHandleBlur: () => void;
  private boundHandleBeforeUnload: (e: BeforeUnloadEvent) => void;
  private boundHandleVisibilityChange: () => void;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    app: SyncApp,
    getData: GetDataCallback<T>,
    setData: SetDataCallback<T>,
    options: SyncManagerOptions = {}
  ) {
    this.app = app;
    this.getData = getData;
    this.setData = setData;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.deviceId = getDeviceId(app);

    const localMeta = getLocalMeta(app);

    this.state = {
      status: navigator.onLine ? 'idle' : 'offline',
      lastSyncedAt: localMeta?.lastModified ?? null,
      lastError: null,
      conflict: null,
      pendingChanges: false,
      serverVersion: null,
      localVersion: localMeta?.version ?? 0,
    };

    // Bind event handlers
    this.boundHandleOnline = this.handleOnline.bind(this);
    this.boundHandleOffline = this.handleOffline.bind(this);
    this.boundHandleBlur = this.handleBlur.bind(this);
    this.boundHandleBeforeUnload = this.handleBeforeUnload.bind(this);
    this.boundHandleVisibilityChange = this.handleVisibilityChange.bind(this);

    // Set up event listeners
    window.addEventListener('online', this.boundHandleOnline);
    window.addEventListener('offline', this.boundHandleOffline);

    if (this.options.pushOnBlur) {
      window.addEventListener('blur', this.boundHandleBlur);
      window.addEventListener('beforeunload', this.boundHandleBeforeUnload);
    }

    if (this.options.pullOnFocus) {
      document.addEventListener('visibilitychange', this.boundHandleVisibilityChange);
    }

    logger.sync.info(`SyncManager initialized for ${app}`, {
      deviceId: this.deviceId,
      localVersion: this.state.localVersion,
    });
  }

  /**
   * Initialize sync - check server and pull if needed
   */
  async init(): Promise<void> {
    logger.sync.info(`[${this.app}] SyncManager.init() called`, {
      isAuthenticated: this.isAuthenticated(),
      autoSync: this.options.autoSync,
      isOnline: this.isOnline,
    });

    if (!this.isAuthenticated()) {
      logger.sync.debug('Not authenticated, skipping sync init');
      return;
    }

    if (!this.options.autoSync) {
      return;
    }

    try {
      await this.checkAndSync();
    } catch (error) {
      logger.sync.error('Sync init failed:', error);
    }

    // Start polling for changes
    this.startPolling();
  }

  /**
   * Check server meta and sync if needed
   */
  private async checkAndSync(): Promise<void> {
    logger.sync.info(`[${this.app}] checkAndSync() starting`, {
      isOnline: this.isOnline,
      localVersion: this.state.localVersion,
      pendingChanges: this.state.pendingChanges,
    });

    if (!this.isOnline) {
      this.updateStatus('offline');
      return;
    }

    this.updateStatus('syncing');

    try {
      const metaResponse = await this.fetchMeta();

      if (!metaResponse.exists) {
        // No server data - push local if we have any
        const localData = this.getData();
        if (localData && Object.keys(localData as object).length > 0) {
          await this.push();
        } else {
          this.updateStatus('idle');
        }
        return;
      }

      const serverMeta = metaResponse.meta!;
      this.state.serverVersion = serverMeta.version;

      // Compare versions
      if (serverMeta.version > this.state.localVersion) {
        // Server has newer data - pull it
        logger.sync.info('Server has newer data, pulling', {
          serverVersion: serverMeta.version,
          localVersion: this.state.localVersion,
        });
        await this.pull();
      } else if (this.state.pendingChanges) {
        // Local has changes to push
        await this.push();
      } else {
        this.updateStatus('idle');
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Fetch server metadata
   */
  private async fetchMeta(): Promise<MetaResponse> {
    const response = await authFetch(`/api/sync/${this.app}/meta`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    logger.sync.info(`[${this.app}] fetchMeta response`, result);
    return result;
  }

  /**
   * Pull data from server
   */
  async pull(): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    this.updateStatus('syncing');

    try {
      const response = await authFetch(`/api/sync/${this.app}/pull`);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result: PullResponse = await response.json();

      // Apply data
      logger.sync.info(`[${this.app}] Applying pulled data`, {
        version: result.meta.version,
        dataKeys: Object.keys(result.data || {}),
      });
      this.setData(result.data as T);

      // Update local meta
      saveLocalMeta(this.app, result.meta.version, result.meta.lastModified);
      this.state.localVersion = result.meta.version;
      this.state.serverVersion = result.meta.version;
      this.state.lastSyncedAt = result.meta.lastModified;
      this.state.pendingChanges = false;

      logger.sync.info('Pull successful', {
        app: this.app,
        version: result.meta.version,
      });

      this.updateStatus('idle');
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Push data to server
   */
  async push(): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    if (!this.isOnline) {
      // Queue for later
      this.offlineQueue.push(() => this.push());
      this.updateStatus('offline');
      return;
    }

    this.updateStatus('syncing');

    try {
      const data = this.getData();

      logger.sync.info(`[${this.app}] Pushing data`, {
        localVersion: this.state.localVersion,
        dataSize: JSON.stringify(data).length,
      });

      const response = await authFetch(`/api/sync/${this.app}/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data,
          deviceId: this.deviceId,
          localVersion: this.state.localVersion,
        }),
      });

      if (response.status === 409) {
        // Conflict
        const conflict: ConflictResponse = await response.json();
        this.handleConflict(conflict);
        return;
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result: PushResponse = await response.json();

      // Update local meta
      saveLocalMeta(this.app, result.version, result.timestamp);
      this.state.localVersion = result.version;
      this.state.serverVersion = result.version;
      this.state.lastSyncedAt = result.timestamp;
      this.state.pendingChanges = false;

      logger.sync.info('Push successful', {
        app: this.app,
        version: result.version,
      });

      this.updateStatus('idle');
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Schedule a debounced push
   */
  schedulePush(): void {
    this.state.pendingChanges = true;
    this.notifyListeners();

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      if (this.isAuthenticated() && this.isOnline) {
        this.push().catch((error) => {
          logger.sync.error('Scheduled push failed:', error);
        });
      }
    }, this.options.debounceMs);
  }

  /**
   * Force immediate push (for tab blur)
   */
  forcePush(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.state.pendingChanges && this.isAuthenticated() && this.isOnline) {
      // Use sendBeacon for reliability on page unload
      this.pushWithBeacon();
    }
  }

  /**
   * Push using sendBeacon for page unload scenarios
   */
  private pushWithBeacon(): void {
    const token = getStoredToken();
    if (!token) return;

    const data = this.getData();
    const payload = JSON.stringify({
      data,
      deviceId: this.deviceId,
      localVersion: this.state.localVersion,
    });

    // Create a blob with auth header embedded
    // Note: sendBeacon doesn't support custom headers, so we use a special endpoint pattern
    // For now, fall back to regular fetch with keepalive
    fetch(`/api/sync/${this.app}/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Ignore errors on unload - best effort
    });
  }

  /**
   * Resolve a conflict by choosing local or remote data
   */
  async resolveConflict(choice: 'local' | 'remote'): Promise<void> {
    if (!this.state.conflict) {
      throw new Error('No conflict to resolve');
    }

    if (choice === 'remote') {
      // Pull server data
      await this.pull();
    } else {
      // Force push local data (increment version to override)
      this.state.localVersion = this.state.conflict.serverVersion;
      await this.push();
    }

    this.state.conflict = null;
    this.notifyListeners();
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    return { ...this.state };
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(listener: StatusChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Start periodic polling for server changes
   */
  private startPolling(): void {
    if (this.pollTimer || !this.options.pollIntervalMs) {
      logger.sync.debug(`[${this.app}] Polling not started`, {
        alreadyRunning: !!this.pollTimer,
        pollInterval: this.options.pollIntervalMs,
      });
      return;
    }

    this.pollTimer = setInterval(() => {
      if (this.isAuthenticated() && this.isOnline && this.state.status === 'idle') {
        logger.sync.debug('Polling for changes...');
        this.checkAndSync().catch((error) => {
          logger.sync.error('Poll sync check failed:', error);
        });
      }
    }, this.options.pollIntervalMs);

    logger.sync.info(`Polling started with ${this.options.pollIntervalMs}ms interval`);
  }

  /**
   * Stop polling
   */
  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
      logger.sync.info('Polling stopped');
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.stopPolling();

    window.removeEventListener('online', this.boundHandleOnline);
    window.removeEventListener('offline', this.boundHandleOffline);
    window.removeEventListener('blur', this.boundHandleBlur);
    window.removeEventListener('beforeunload', this.boundHandleBeforeUnload);
    document.removeEventListener('visibilitychange', this.boundHandleVisibilityChange);

    this.listeners.clear();

    logger.sync.info(`SyncManager destroyed for ${this.app}`);
  }

  // =========================================================================
  // PRIVATE HELPERS
  // =========================================================================

  private isAuthenticated(): boolean {
    return !!getStoredToken();
  }

  private updateStatus(status: SyncState['status']): void {
    this.state.status = status;
    if (status !== 'error') {
      this.state.lastError = null;
    }
    this.notifyListeners();
  }

  private handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : 'Unknown error';
    this.state.status = 'error';
    this.state.lastError = message;
    this.notifyListeners();
    logger.sync.error(`Sync error for ${this.app}:`, error);
  }

  private handleConflict(conflict: ConflictResponse): void {
    this.state.status = 'conflict';
    this.state.conflict = {
      localVersion: conflict.localVersion,
      serverVersion: conflict.serverVersion,
      localModified: this.state.lastSyncedAt || new Date().toISOString(),
      serverModified: conflict.serverModified,
      serverDeviceId: conflict.serverDeviceId,
    };
    this.notifyListeners();
    logger.sync.warn('Sync conflict detected', this.state.conflict);
  }

  private notifyListeners(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (error) {
        logger.sync.error('Listener error:', error);
      }
    }
  }

  private handleOnline(): void {
    this.isOnline = true;
    logger.sync.info('Back online, processing queue');

    // Process offline queue
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const task of queue) {
      task().catch((error) => {
        logger.sync.error('Queued task failed:', error);
      });
    }

    // Check for updates
    this.checkAndSync().catch((error) => {
      logger.sync.error('Online sync check failed:', error);
    });
  }

  private handleOffline(): void {
    this.isOnline = false;
    this.updateStatus('offline');
    logger.sync.info('Went offline');
  }

  private handleBlur(): void {
    if (this.state.pendingChanges) {
      this.forcePush();
    }
  }

  private handleBeforeUnload(_e: BeforeUnloadEvent): void {
    if (this.state.pendingChanges) {
      this.forcePush();
    }
  }

  private handleVisibilityChange(): void {
    logger.sync.info(`[${this.app}] Visibility changed`, {
      visibilityState: document.visibilityState,
      isOnline: this.isOnline,
      isAuthenticated: this.isAuthenticated(),
    });

    if (document.visibilityState === 'visible' && this.isOnline && this.isAuthenticated()) {
      logger.sync.info('Tab became visible, checking for updates');
      this.checkAndSync().catch((error) => {
        logger.sync.error('Visibility sync check failed:', error);
      });
    }
  }
}
