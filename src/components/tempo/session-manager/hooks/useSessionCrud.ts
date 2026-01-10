import { createSignal, createEffect, createMemo, onMount } from 'solid-js';
import type { Session, SessionStatus, StoryBlock } from '../../lib/types';
import { SessionStorageService } from '../../services/session-storage.service';
import { logger } from '../../../../lib/logger';

const log = logger.create('SessionCrud');

// Toast fallback for user feedback (matches useSession.ts pattern)
const useToastFallback = () => {
  const toast = (props: {
    title: string;
    description: string;
    variant?: 'default' | 'destructive' | 'success';
  }) => {
    // Simple fallback - can be enhanced with a proper toast component later
    if (props.variant === 'destructive') {
      log.error(`${props.title}: ${props.description}`);
    } else {
      log.info(`${props.title}: ${props.description}`);
    }
  };

  return { toast };
};

export interface CreateSessionInput {
  date: string;
  storyBlocks?: StoryBlock[];
  status?: SessionStatus;
  totalDuration?: number;
}

export interface UpdateSessionInput {
  storyBlocks?: StoryBlock[];
  status?: SessionStatus;
  totalDuration?: number;
}

export interface UseSessionCrudReturn {
  // State
  sessions: () => Session[];
  allSessions: () => Session[];
  loading: () => boolean;
  error: () => Error | null;

  // CRUD Operations
  createSession: (data: CreateSessionInput) => Promise<Session | null>;
  updateSession: (date: string, updates: UpdateSessionInput) => Promise<Session | null>;
  deleteSession: (date: string, permanent?: boolean) => Promise<boolean>;
  duplicateSession: (
    sourceDate: string,
    targetDate: string,
    resetProgress?: boolean
  ) => Promise<Session | null>;

  // Queries
  refreshSessions: () => Promise<void>;
  getSessionByDate: (date: string) => Session | undefined;
  filterByStatus: (status: SessionStatus | 'all') => void;

  // Utility
  sessionExistsForDate: (date: string) => Promise<boolean>;
}

export interface UseSessionCrudProps {
  storageService?: SessionStorageService;
  autoLoad?: boolean;
}

export const useSessionCrud = ({
  storageService = new SessionStorageService(),
  autoLoad = true,
}: UseSessionCrudProps = {}): UseSessionCrudReturn => {
  const { toast } = useToastFallback();

  // Core state
  const [allSessions, setAllSessions] = createSignal<Session[]>([]);
  const [loading, setLoading] = createSignal<boolean>(false);
  const [error, setError] = createSignal<Error | null>(null);
  const [statusFilter, setStatusFilter] = createSignal<SessionStatus | 'all'>('all');

  // Filtered sessions based on status filter
  const sessions = createMemo(() => {
    const filter = statusFilter();
    const all = allSessions();

    if (filter === 'all') {
      return all;
    }

    return all.filter((session) => session.status === filter);
  });

  /**
   * Refresh sessions list from storage
   */
  const refreshSessions = async (): Promise<void> => {
    log.debug('Refreshing sessions list');
    setLoading(true);
    setError(null);

    try {
      const loadedSessions = await storageService.getAllSessions();
      setAllSessions(loadedSessions);
      log.debug(`Loaded ${loadedSessions.length} sessions`);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to load sessions');
      setError(errorObj);
      log.error('Failed to refresh sessions', err);
      toast({
        title: 'Error',
        description: 'Failed to load sessions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get a session by date from the loaded sessions
   */
  const getSessionByDate = (date: string): Session | undefined => {
    return allSessions().find((session) => session.date === date);
  };

  /**
   * Check if a session exists for a given date
   */
  const sessionExistsForDate = async (date: string): Promise<boolean> => {
    try {
      const existingSession = await storageService.getSession(date);
      return existingSession !== null;
    } catch (err) {
      log.error(`Error checking session existence for date: ${date}`, err);
      return false;
    }
  };

  /**
   * Create a new session
   */
  const createSession = async (data: CreateSessionInput): Promise<Session | null> => {
    log.debug(`Creating session for date: ${data.date}`);
    setLoading(true);
    setError(null);

    try {
      // Check if session already exists
      const exists = await sessionExistsForDate(data.date);
      if (exists) {
        const errorMsg = `Session already exists for date: ${data.date}`;
        log.warn(errorMsg);
        toast({
          title: 'Session Exists',
          description:
            'A session already exists for this date. Please choose a different date or edit the existing session.',
          variant: 'destructive',
        });
        setLoading(false);
        return null;
      }

      const newSession: Session = {
        date: data.date,
        storyBlocks: data.storyBlocks || [],
        status: data.status || 'planned',
        totalDuration: data.totalDuration || 0,
        lastUpdated: new Date().toISOString(),
      };

      await storageService.saveSession(data.date, newSession);

      // Refresh the sessions list
      await refreshSessions();

      toast({
        title: 'Session Created',
        description: `Successfully created session for ${data.date}`,
        variant: 'success',
      });

      log.info(`Session created for date: ${data.date}`);
      return newSession;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to create session');
      setError(errorObj);
      log.error('Failed to create session', err);
      toast({
        title: 'Error',
        description: 'Failed to create session. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update an existing session
   */
  const updateSession = async (
    date: string,
    updates: UpdateSessionInput
  ): Promise<Session | null> => {
    log.debug(`Updating session for date: ${date}`, updates);
    setLoading(true);
    setError(null);

    try {
      const existingSession = await storageService.getSession(date);
      if (!existingSession) {
        const errorMsg = `No session found for date: ${date}`;
        log.warn(errorMsg);
        toast({
          title: 'Session Not Found',
          description: 'The session you are trying to update does not exist.',
          variant: 'destructive',
        });
        setLoading(false);
        return null;
      }

      const updatedSession: Session = {
        ...existingSession,
        ...updates,
        date, // Ensure date is preserved
        lastUpdated: new Date().toISOString(),
      };

      await storageService.saveSession(date, updatedSession);

      // Refresh the sessions list
      await refreshSessions();

      toast({
        title: 'Session Updated',
        description: `Successfully updated session for ${date}`,
        variant: 'success',
      });

      log.info(`Session updated for date: ${date}`);
      return updatedSession;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to update session');
      setError(errorObj);
      log.error('Failed to update session', err);
      toast({
        title: 'Error',
        description: 'Failed to update session. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a session (archive or permanently delete)
   */
  const deleteSession = async (date: string, permanent: boolean = false): Promise<boolean> => {
    log.debug(`Deleting session for date: ${date}, permanent: ${permanent}`);
    setLoading(true);
    setError(null);

    try {
      const existingSession = await storageService.getSession(date);
      if (!existingSession) {
        log.warn(`No session found for date: ${date}`);
        toast({
          title: 'Session Not Found',
          description: 'The session you are trying to delete does not exist.',
          variant: 'destructive',
        });
        setLoading(false);
        return false;
      }

      if (permanent) {
        // Permanently delete the session
        await storageService.deleteSession(date);
        log.info(`Session permanently deleted for date: ${date}`);
        toast({
          title: 'Session Deleted',
          description: `Session for ${date} has been permanently deleted.`,
          variant: 'success',
        });
      } else {
        // Archive the session (soft delete)
        const archived = await storageService.archiveSession(date);
        if (!archived) {
          throw new Error('Failed to archive session');
        }
        log.info(`Session archived for date: ${date}`);
        toast({
          title: 'Session Archived',
          description: `Session for ${date} has been archived.`,
          variant: 'success',
        });
      }

      // Refresh the sessions list
      await refreshSessions();
      return true;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to delete session');
      setError(errorObj);
      log.error('Failed to delete session', err);
      toast({
        title: 'Error',
        description: 'Failed to delete session. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Duplicate a session to a new date
   */
  const duplicateSession = async (
    sourceDate: string,
    targetDate: string,
    resetProgress: boolean = true
  ): Promise<Session | null> => {
    log.debug(
      `Duplicating session from ${sourceDate} to ${targetDate}, resetProgress: ${resetProgress}`
    );
    setLoading(true);
    setError(null);

    try {
      // Check if source session exists
      const sourceSession = await storageService.getSession(sourceDate);
      if (!sourceSession) {
        log.warn(`Source session not found for date: ${sourceDate}`);
        toast({
          title: 'Source Session Not Found',
          description: 'The session you are trying to duplicate does not exist.',
          variant: 'destructive',
        });
        setLoading(false);
        return null;
      }

      // Check if target date already has a session
      const targetExists = await sessionExistsForDate(targetDate);
      if (targetExists) {
        log.warn(`Session already exists for target date: ${targetDate}`);
        toast({
          title: 'Target Date Has Session',
          description:
            'A session already exists for the target date. Please choose a different date.',
          variant: 'destructive',
        });
        setLoading(false);
        return null;
      }

      // Create a deep copy of story blocks
      let duplicatedStoryBlocks: StoryBlock[] = JSON.parse(
        JSON.stringify(sourceSession.storyBlocks)
      );

      // Reset progress if requested
      if (resetProgress) {
        duplicatedStoryBlocks = duplicatedStoryBlocks.map((story) => ({
          ...story,
          progress: 0,
          timeBoxes: story.timeBoxes.map((timeBox) => ({
            ...timeBox,
            status: 'todo' as const,
            actualDuration: undefined,
            startTime: undefined,
            tasks: timeBox.tasks?.map((task) => ({
              ...task,
              status: 'todo' as const,
            })),
          })),
        }));
      }

      const duplicatedSession: Session = {
        date: targetDate,
        storyBlocks: duplicatedStoryBlocks,
        status: resetProgress ? 'planned' : sourceSession.status,
        totalDuration: sourceSession.totalDuration,
        lastUpdated: new Date().toISOString(),
      };

      await storageService.saveSession(targetDate, duplicatedSession);

      // Refresh the sessions list
      await refreshSessions();

      toast({
        title: 'Session Duplicated',
        description: `Successfully duplicated session to ${targetDate}`,
        variant: 'success',
      });

      log.info(`Session duplicated from ${sourceDate} to ${targetDate}`);
      return duplicatedSession;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to duplicate session');
      setError(errorObj);
      log.error('Failed to duplicate session', err);
      toast({
        title: 'Error',
        description: 'Failed to duplicate session. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filter sessions by status
   */
  const filterByStatus = (status: SessionStatus | 'all'): void => {
    log.debug(`Filtering sessions by status: ${status}`);
    setStatusFilter(status);
  };

  // Auto-load sessions on mount if enabled
  onMount(() => {
    if (autoLoad) {
      refreshSessions();
    }
  });

  return {
    // State
    sessions,
    allSessions,
    loading,
    error,

    // CRUD Operations
    createSession,
    updateSession,
    deleteSession,
    duplicateSession,

    // Queries
    refreshSessions,
    getSessionByDate,
    filterByStatus,

    // Utility
    sessionExistsForDate,
  };
};
