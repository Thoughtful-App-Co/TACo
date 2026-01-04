/**
 * Workers Logger
 *
 * Lightweight structured logging for Cloudflare Workers.
 * Outputs to Cloudflare Workers Logs (captured via wrangler tail or dashboard).
 *
 * Features:
 * - Namespaced loggers with [Prefix] format
 * - All console methods preserved for Workers Logs compatibility
 * - Structured logging with automatic JSON serialization of objects
 *
 * Usage:
 *   import { createLogger } from './logger';
 *   const log = createLogger('O*NET');
 *
 *   log.info('Request received');
 *   log.error('Failed', { error: err.message, stack: err.stack });
 *   log.debug('Verbose data', someObject);
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

export interface WorkersLogger {
  trace: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/**
 * Create a namespaced logger for Cloudflare Workers
 *
 * @param namespace - The logger namespace (e.g., 'O*NET', 'Auth', 'Billing')
 * @returns Logger instance with trace/debug/info/warn/error methods
 */
export function createLogger(namespace: string): WorkersLogger {
  const prefix = `[${namespace}]`;

  return {
    trace: (...args: unknown[]) => {
      // Trace is typically too verbose for workers
      // Uncomment for extreme debugging
      // console.debug(prefix, '[TRACE]', ...args);
    },
    debug: (...args: unknown[]) => {
      // eslint-disable-next-line no-console
      console.debug(prefix, ...args);
    },
    info: (...args: unknown[]) => {
      // eslint-disable-next-line no-console
      console.log(prefix, ...args);
    },
    warn: (...args: unknown[]) => {
      // eslint-disable-next-line no-console
      console.warn(prefix, ...args);
    },
    error: (...args: unknown[]) => {
      // eslint-disable-next-line no-console
      console.error(prefix, ...args);
    },
  };
}

// =============================================================================
// PRE-CONFIGURED LOGGERS
// =============================================================================

/** Authentication operations */
export const authLog = createLogger('Auth');

/** O*NET API operations */
export const onetLog = createLogger('O*NET');

/** Resume parsing and mutations */
export const resumeLog = createLogger('Resume');

/** Billing and Stripe operations */
export const billingLog = createLogger('Billing');

/** Backup/sync operations */
export const backupLog = createLogger('Backup');

/** Task processing */
export const tasksLog = createLogger('Tasks');

/** Push notifications */
export const pushLog = createLogger('Push');

/** Generic API operations */
export const apiLog = createLogger('API');
