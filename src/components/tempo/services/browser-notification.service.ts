/**
 * Browser Notification Service for Tempo Timer
 *
 * Handles system-level browser notifications for timer completion events.
 * Falls back gracefully if notifications are not supported or denied.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { logger } from '../../../lib/logger';

const log = logger.create('BrowserNotification');

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export interface BrowserNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  onClick?: () => void;
}

class BrowserNotificationService {
  private permissionStatus: NotificationPermissionStatus = 'default';

  constructor() {
    this.checkSupport();
  }

  private checkSupport(): void {
    if (!('Notification' in window)) {
      this.permissionStatus = 'unsupported';
      log.warn('Browser notifications not supported');
      return;
    }
    this.permissionStatus = Notification.permission as NotificationPermissionStatus;
  }

  /**
   * Request notification permission from the user
   * @returns Promise resolving to the permission status
   */
  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (this.permissionStatus === 'unsupported') {
      log.warn('Cannot request permission - notifications not supported');
      return 'unsupported';
    }

    if (this.permissionStatus === 'granted') {
      log.debug('Notification permission already granted');
      return 'granted';
    }

    try {
      const result = await Notification.requestPermission();
      this.permissionStatus = result as NotificationPermissionStatus;

      if (result === 'granted') {
        log.info('Notification permission granted');
      } else if (result === 'denied') {
        log.warn('Notification permission denied by user');
      } else {
        log.debug('Notification permission dismissed');
      }

      return this.permissionStatus;
    } catch (error) {
      log.error('Failed to request notification permission', error);
      return this.permissionStatus;
    }
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermissionStatus {
    return this.permissionStatus;
  }

  /**
   * Check if notifications are enabled and working
   */
  isEnabled(): boolean {
    return this.permissionStatus === 'granted';
  }

  /**
   * Check if user has explicitly denied notifications
   */
  isDenied(): boolean {
    return this.permissionStatus === 'denied';
  }

  /**
   * Send a browser notification
   * @returns true if notification was sent, false otherwise
   */
  async notify(options: BrowserNotificationOptions): Promise<boolean> {
    if (!this.isEnabled()) {
      log.debug('Notifications not enabled, skipping notification', { title: options.title });
      return false;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon ?? '/icons/tempo-icon-192.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction ?? false,
      });

      if (options.onClick) {
        notification.onclick = () => {
          window.focus();
          options.onClick?.();
          notification.close();
        };
      }

      log.debug('Browser notification sent', { title: options.title });
      return true;
    } catch (error) {
      log.error('Failed to send browser notification', error);
      return false;
    }
  }

  /**
   * Send a timer completion notification
   */
  async notifyTimerComplete(
    taskName: string,
    isSessionComplete: boolean = false
  ): Promise<boolean> {
    const title = isSessionComplete ? 'Session Complete!' : 'Timer Complete!';
    const body = isSessionComplete
      ? `Great work! You've completed your focus session for "${taskName}".`
      : `Time's up for "${taskName}". Ready for a break?`;

    return this.notify({
      title,
      body,
      tag: 'tempo-timer',
      requireInteraction: true,
      onClick: () => {
        log.debug('Timer notification clicked');
      },
    });
  }

  /**
   * Get warning message for users who have denied notifications
   */
  getPermissionWarning(): string | null {
    if (this.permissionStatus === 'denied') {
      return 'Notifications are blocked. You may miss timer alerts. Enable notifications in your browser settings for the best experience.';
    }
    if (this.permissionStatus === 'unsupported') {
      return 'Your browser does not support notifications. Timer alerts will only appear in the app.';
    }
    return null;
  }
}

// Export singleton instance
export const browserNotificationService = new BrowserNotificationService();
