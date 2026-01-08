/**
 * SessionLifecycleService
 *
 * Handles session lifecycle rules:
 * - Date-based status validation
 * - Automatic status transitions
 * - Stale session detection
 * - Session closeout operations
 */
import { SessionStorageService } from './session-storage.service';
import { TaskPersistenceService } from './task-persistence.service';
import type { Session, SessionStatus, StoryBlock } from '../lib/types';
import { logger } from '../../../lib/logger';

const log = logger.create('SessionLifecycle');

export interface SessionRuleViolation {
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  autoFix?: () => Promise<void>;
}

export interface StaleSessionInfo {
  session: Session;
  daysSinceDate: number;
  completedBlocks: number;
  totalBlocks: number;
  incompleteDuration: number;
}

export interface CloseoutResult {
  success: boolean;
  extractedTaskIds: string[];
  newSessionStatus: SessionStatus;
  error?: string;
}

export class SessionLifecycleService {
  private sessionStorage: SessionStorageService;

  constructor() {
    this.sessionStorage = new SessionStorageService();
  }

  // ============================================================================
  // DATE UTILITIES
  // ============================================================================

  /**
   * Get today's date as YYYY-MM-DD string
   */
  getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Check if a date is in the past (before today)
   */
  isPastDate(date: string): boolean {
    const sessionDate = new Date(date);
    sessionDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sessionDate < today;
  }

  /**
   * Check if a date is today
   */
  isToday(date: string): boolean {
    return date === this.getToday();
  }

  /**
   * Check if a date is in the future
   */
  isFutureDate(date: string): boolean {
    const sessionDate = new Date(date);
    sessionDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sessionDate > today;
  }

  /**
   * Get days since a date (negative if future)
   */
  getDaysSince(date: string): number {
    const sessionDate = new Date(date);
    sessionDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = today.getTime() - sessionDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  // ============================================================================
  // STATUS VALIDATION
  // ============================================================================

  /**
   * Get allowed statuses for a given date
   */
  getAllowedStatuses(date: string): SessionStatus[] {
    if (this.isFutureDate(date)) {
      return ['planned'];
    }
    if (this.isToday(date)) {
      return ['planned', 'in-progress', 'completed'];
    }
    // Past date
    return ['completed', 'incomplete', 'archived'];
  }

  /**
   * Validate a session's status against date rules
   */
  validateSessionStatus(session: Session): SessionRuleViolation[] {
    const violations: SessionRuleViolation[] = [];
    const allowedStatuses = this.getAllowedStatuses(session.date);

    if (!allowedStatuses.includes(session.status)) {
      const suggestedStatus = this.getSuggestedStatus(session);

      violations.push({
        rule: 'invalid-status-for-date',
        message: `Status "${session.status}" is not valid for ${this.getDateDescription(session.date)}. Allowed: ${allowedStatuses.join(', ')}`,
        severity: 'error',
        autoFix: async () => {
          await this.updateSessionStatus(session.date, suggestedStatus);
          log.info(`Auto-fixed session ${session.date} status to ${suggestedStatus}`);
        },
      });
    }

    // Check for stale in-progress sessions
    if (session.status === 'in-progress' && this.isPastDate(session.date)) {
      violations.push({
        rule: 'stale-in-progress',
        message: `Session from ${session.date} is still marked as in-progress`,
        severity: 'warning',
        autoFix: async () => {
          await this.updateSessionStatus(session.date, 'incomplete');
          log.info(`Auto-transitioned stale session ${session.date} to incomplete`);
        },
      });
    }

    // Check for old incomplete sessions (>30 days)
    if (session.status === 'incomplete' && this.getDaysSince(session.date) > 30) {
      violations.push({
        rule: 'old-incomplete',
        message: `Session from ${session.date} has been incomplete for over 30 days`,
        severity: 'info',
        autoFix: async () => {
          await this.sessionStorage.archiveSession(session.date);
          log.info(`Auto-archived old incomplete session ${session.date}`);
        },
      });
    }

    return violations;
  }

  /**
   * Get suggested status for a session based on its date and progress
   */
  getSuggestedStatus(session: Session): SessionStatus {
    const hasProgress = this.sessionHasProgress(session);
    const isComplete = this.sessionIsComplete(session);

    if (this.isFutureDate(session.date)) {
      return 'planned';
    }

    if (isComplete) {
      return 'completed';
    }

    if (this.isPastDate(session.date)) {
      return hasProgress ? 'incomplete' : 'archived';
    }

    // Today
    return hasProgress ? 'in-progress' : 'planned';
  }

  /**
   * Get human-readable date description
   */
  private getDateDescription(date: string): string {
    if (this.isToday(date)) return 'today';
    if (this.isFutureDate(date)) return 'a future date';
    const days = this.getDaysSince(date);
    if (days === 1) return 'yesterday';
    return `${days} days ago`;
  }

  // ============================================================================
  // SESSION ANALYSIS
  // ============================================================================

  /**
   * Check if session has any completed work
   */
  sessionHasProgress(session: Session): boolean {
    return session.storyBlocks.some((block) =>
      block.timeBoxes.some((tb) => tb.status === 'completed' || tb.status === 'in-progress')
    );
  }

  /**
   * Check if all timeboxes in session are complete
   */
  sessionIsComplete(session: Session): boolean {
    return session.storyBlocks.every((block) =>
      block.timeBoxes.every((tb) => tb.status === 'completed' || tb.type !== 'work')
    );
  }

  /**
   * Get session completion statistics
   */
  getSessionStats(session: Session): {
    totalBlocks: number;
    completedBlocks: number;
    totalTimeboxes: number;
    completedTimeboxes: number;
    totalDuration: number;
    completedDuration: number;
    incompleteDuration: number;
  } {
    let totalTimeboxes = 0;
    let completedTimeboxes = 0;
    let completedDuration = 0;
    let incompleteDuration = 0;

    const completedBlocks = session.storyBlocks.filter((block) => {
      const workTimeboxes = block.timeBoxes.filter((tb) => tb.type === 'work');
      totalTimeboxes += workTimeboxes.length;

      const blockComplete = workTimeboxes.every((tb) => tb.status === 'completed');

      workTimeboxes.forEach((tb) => {
        if (tb.status === 'completed') {
          completedTimeboxes++;
          completedDuration += tb.actualDuration || tb.duration;
        } else {
          incompleteDuration += tb.duration;
        }
      });

      return blockComplete;
    }).length;

    return {
      totalBlocks: session.storyBlocks.length,
      completedBlocks,
      totalTimeboxes,
      completedTimeboxes,
      totalDuration: session.totalDuration,
      completedDuration,
      incompleteDuration,
    };
  }

  // ============================================================================
  // STALE SESSION DETECTION
  // ============================================================================

  /**
   * Get all sessions that need attention (incomplete past sessions)
   */
  async getSessionsNeedingAttention(): Promise<StaleSessionInfo[]> {
    const allSessions = await this.sessionStorage.getAllSessions();
    const needsAttention: StaleSessionInfo[] = [];

    for (const session of allSessions) {
      // Skip future, completed, or archived sessions
      if (
        this.isFutureDate(session.date) ||
        session.status === 'completed' ||
        session.status === 'archived'
      ) {
        continue;
      }

      // Check if past and not complete
      if (this.isPastDate(session.date) && !this.sessionIsComplete(session)) {
        const stats = this.getSessionStats(session);
        needsAttention.push({
          session,
          daysSinceDate: this.getDaysSince(session.date),
          completedBlocks: stats.completedBlocks,
          totalBlocks: stats.totalBlocks,
          incompleteDuration: stats.incompleteDuration,
        });
      }
    }

    // Sort by date (oldest first - most urgent)
    return needsAttention.sort((a, b) => b.daysSinceDate - a.daysSinceDate);
  }

  /**
   * Get count of sessions needing attention
   */
  async getAttentionCount(): Promise<number> {
    const sessions = await this.getSessionsNeedingAttention();
    return sessions.length;
  }

  // ============================================================================
  // SESSION CLOSEOUT
  // ============================================================================

  /**
   * Close out an incomplete session
   * - Extracts incomplete focus blocks to backlog
   * - Updates session status to 'completed'
   */
  async closeoutSession(
    sessionDate: string,
    options: {
      extractToBacklog: boolean;
      focusBlockIdsToExtract?: string[];
    }
  ): Promise<CloseoutResult> {
    try {
      const session = await this.sessionStorage.getSession(sessionDate);

      if (!session) {
        return {
          success: false,
          extractedTaskIds: [],
          newSessionStatus: 'incomplete',
          error: 'Session not found',
        };
      }

      let extractedTaskIds: string[] = [];

      // Extract to backlog if requested
      if (options.extractToBacklog) {
        const extractedTasks = await TaskPersistenceService.extractFromSession(
          session,
          options.focusBlockIdsToExtract
        );
        extractedTaskIds = extractedTasks.map((t) => t.id);
        log.info(`Extracted ${extractedTaskIds.length} tasks from session ${sessionDate}`);
      }

      // Update session status to completed
      await this.updateSessionStatus(sessionDate, 'completed');

      log.info(`Closed out session ${sessionDate}`, {
        extracted: extractedTaskIds.length,
        status: 'completed',
      });

      return {
        success: true,
        extractedTaskIds,
        newSessionStatus: 'completed',
      };
    } catch (error) {
      log.error(`Failed to close out session ${sessionDate}`, error);
      return {
        success: false,
        extractedTaskIds: [],
        newSessionStatus: 'incomplete',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // AUTOMATIC TRANSITIONS
  // ============================================================================

  /**
   * Run automatic status transitions for all sessions
   * Called on app startup or periodically
   */
  async runAutoTransitions(): Promise<{
    transitioned: number;
    violations: SessionRuleViolation[];
  }> {
    const allSessions = await this.sessionStorage.getAllSessions();
    let transitioned = 0;
    const allViolations: SessionRuleViolation[] = [];

    for (const session of allSessions) {
      const violations = this.validateSessionStatus(session);
      allViolations.push(...violations);

      // Auto-fix critical violations
      for (const violation of violations) {
        if (violation.severity === 'error' && violation.autoFix) {
          await violation.autoFix();
          transitioned++;
        }
      }
    }

    if (transitioned > 0) {
      log.info(`Auto-transitioned ${transitioned} sessions`);
    }

    return { transitioned, violations: allViolations };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Update session status using SessionStorageService
   */
  private async updateSessionStatus(date: string, status: SessionStatus): Promise<void> {
    await this.sessionStorage.updateSessionMetadata(date, { status });
  }
}
