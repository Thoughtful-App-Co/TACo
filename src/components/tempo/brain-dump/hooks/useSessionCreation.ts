// /features/brain-dump/hooks/useSessionCreation.ts
import { createSignal } from 'solid-js';
import { brainDumpService } from '../services/brain-dump-services';
import type { ProcessedStory } from '../../lib/types';
import { useNavigate } from '@solidjs/router';
import type { ErrorDetails } from '../types';
import { logger } from '../../../../lib/logger';

const log = logger.create('Session');

export function useSessionCreation() {
  const navigate = useNavigate();
  const [isCreatingSession, setIsCreatingSession] = createSignal(false);
  const [processingStep, setProcessingStep] = createSignal<string>('');
  const [processingProgress, setProcessingProgress] = createSignal(0);
  const [error, setError] = createSignal<ErrorDetails | null>(null);

  const createSession = async (stories: ProcessedStory[]) => {
    setIsCreatingSession(true);
    setError(null);
    setProcessingStep('Creating session...');
    setProcessingProgress(0);

    try {
      const startTime = new Date().toISOString();
      setProcessingProgress(50);

      const result = await brainDumpService.createSession(stories, startTime);

      setProcessingProgress(100);
      setProcessingStep('Session created successfully!');

      // Navigate to the newly created session page
      const today = new Date().toISOString().split('T')[0];
      log.debug(`Navigating to session page for date: ${today}`);

      // Add a small delay to ensure the session is saved before navigation
      setTimeout(() => {
        // Make sure the date is in the correct format (YYYY-MM-DD)
        const formattedDateForURL = today.replace(/\//g, '-');
        navigate(`/session/${formattedDateForURL}`);
      }, 500);

      return result;
    } catch (err) {
      log.error('Failed to create session: ' + String(err));

      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      let errorDetails: unknown = err;

      // If the error has a structured response
      if (err instanceof Error && (err as any).cause && typeof (err as any).cause === 'object') {
        errorDetails = (err as any).cause;
      }

      setError({
        message: errorMessage,
        code: 'SESSION_ERROR',
        details: errorDetails,
      });

      setProcessingProgress(0);
      setProcessingStep('Error creating session');
      throw err;
    } finally {
      setTimeout(() => {
        setIsCreatingSession(false);
        setProcessingProgress(0);
        setProcessingStep('');
      }, 1000);
    }
  };

  return {
    createSession,
    isCreatingSession,
    processingStep,
    processingProgress,
    error,
    setError,
  };
}
