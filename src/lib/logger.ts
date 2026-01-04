/**
 * Centralized logging utility using loglevel
 *
 * Features:
 * - Namespaced loggers for different subsystems (e.g., logger.auth, logger.onet)
 * - Environment-aware log levels (debug in dev, warn in prod)
 * - Runtime toggle via localStorage: localStorage.setItem('debug', 'true')
 * - Consistent [Namespace] prefix formatting
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *
 *   // Use namespaced loggers
 *   logger.auth.info('User logged in', { email: user.email });
 *   logger.onet.debug('API response', data);
 *   logger.resume.error('Parse failed', error);
 *
 *   // Or create custom namespace
 *   const log = logger.create('MyFeature');
 *   log.debug('Something happened');
 *
 * Log Levels (in order of severity):
 *   trace < debug < info < warn < error
 *
 * Production: Only warn and error are shown by default
 * Development: All levels shown
 * Debug mode: Set localStorage.setItem('debug', 'true') to enable all levels in prod
 */

import log, { Logger, LogLevelDesc } from 'loglevel';

// =============================================================================
// CONFIGURATION
// =============================================================================

const IS_BROWSER = typeof window !== 'undefined';
const IS_PRODUCTION = IS_BROWSER
  ? window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')
  : true; // Cloudflare Workers treated as production

/**
 * Check if debug mode is enabled via localStorage or URL param
 */
function isDebugEnabled(): boolean {
  if (!IS_BROWSER) return false;

  // Check localStorage
  const localStorageDebug = localStorage.getItem('debug');
  if (localStorageDebug === 'true') return true;

  // Check URL param for temporary debugging: ?debug=true
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('debug') === 'true') return true;

  return false;
}

/**
 * Get the appropriate log level based on environment
 */
function getLogLevel(): LogLevelDesc {
  if (!IS_PRODUCTION) return 'trace'; // Development: show everything
  if (isDebugEnabled()) return 'debug'; // Production with debug flag: show debug+
  return 'warn'; // Production: only warn and error
}

// =============================================================================
// LOGGER FACTORY
// =============================================================================

/**
 * Registry of created loggers for consistent configuration
 */
const loggerRegistry: Map<string, Logger> = new Map();

/**
 * Create or retrieve a namespaced logger
 */
function createLogger(namespace: string): Logger {
  // Return existing logger if already created
  const existing = loggerRegistry.get(namespace);
  if (existing) return existing;

  // Create new logger with namespace
  const namespaceLogger = log.getLogger(namespace);

  // Set initial log level
  namespaceLogger.setLevel(getLogLevel());

  // Store original method factory
  const originalFactory = namespaceLogger.methodFactory;

  // Override method factory to add namespace prefix
  namespaceLogger.methodFactory = function (methodName, logLevel, loggerName) {
    const rawMethod = originalFactory(methodName, logLevel, loggerName);

    return function (...args: unknown[]) {
      const prefix = `[${namespace}]`;

      // Handle different argument types
      if (args.length === 0) {
        rawMethod(prefix);
      } else if (typeof args[0] === 'string') {
        rawMethod(`${prefix} ${args[0]}`, ...args.slice(1));
      } else {
        rawMethod(prefix, ...args);
      }
    };
  };

  // Apply the method factory
  namespaceLogger.setLevel(namespaceLogger.getLevel());

  // Register for future retrieval
  loggerRegistry.set(namespace, namespaceLogger);

  return namespaceLogger;
}

// =============================================================================
// PRE-DEFINED NAMESPACED LOGGERS
// =============================================================================

/**
 * Main logger export with pre-defined namespaces and factory method
 */
export const logger = {
  // Core root logger (no namespace prefix)
  root: log,

  // Factory for custom namespaces
  create: createLogger,

  // ==========================================================================
  // Pre-defined namespaced loggers matching existing [Prefix] patterns
  // ==========================================================================

  /** Authentication subsystem */
  auth: createLogger('Auth'),

  /** O*NET API interactions */
  onet: createLogger('O*NET'),

  /** Resume parsing and mutations */
  resume: createLogger('Resume'),

  /** Labor market data */
  laborMarket: createLogger('LaborMarket'),

  /** Push notifications */
  push: createLogger('Push'),

  /** PWA installation */
  pwa: createLogger('PWA'),

  /** Stripe/billing */
  billing: createLogger('Billing'),

  /** Backup/sync operations */
  backup: createLogger('Backup'),

  /** Task processing */
  tasks: createLogger('Tasks'),

  /** News/PaperTrail */
  news: createLogger('PaperTrail'),

  /** Feature gates */
  features: createLogger('Features'),

  /** Storage/persistence */
  storage: createLogger('Storage'),

  /** API calls (generic) */
  api: createLogger('API'),

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Enable debug mode at runtime (useful for debugging production)
   * Usage: In browser console, run: logger.enableDebug()
   */
  enableDebug(): void {
    if (IS_BROWSER) {
      localStorage.setItem('debug', 'true');
      updateAllLogLevels('debug');
      // eslint-disable-next-line no-console
      console.log('[Logger] Debug mode enabled. Refresh to apply to all loggers.');
    }
  },

  /**
   * Disable debug mode
   */
  disableDebug(): void {
    if (IS_BROWSER) {
      localStorage.removeItem('debug');
      updateAllLogLevels(IS_PRODUCTION ? 'warn' : 'trace');
      // eslint-disable-next-line no-console
      console.log('[Logger] Debug mode disabled.');
    }
  },

  /**
   * Set log level for all loggers
   */
  setLevel(level: LogLevelDesc): void {
    updateAllLogLevels(level);
  },

  /**
   * Get current log level name
   */
  getLevel(): string {
    return log.getLevel().toString();
  },
};

/**
 * Update log level for all registered loggers
 */
function updateAllLogLevels(level: LogLevelDesc): void {
  log.setLevel(level);
  loggerRegistry.forEach((registeredLogger) => {
    registeredLogger.setLevel(level);
  });
}

// =============================================================================
// INITIALIZATION
// =============================================================================

// Set root logger level
log.setLevel(getLogLevel());

// Expose logger to window for debugging in production
if (IS_BROWSER) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).logger = logger;
}

// =============================================================================
// CLOUDFLARE WORKERS LOGGER
// =============================================================================

/**
 * Logger for Cloudflare Workers (functions/)
 *
 * Since Workers don't have localStorage, this provides a simpler interface
 * that always logs at info+ level (Cloudflare Workers Logs capture all console output)
 *
 * Usage in functions/:
 *   import { workersLogger } from '@/lib/logger';
 *   const log = workersLogger('O*NET');
 *   log.info('Request received');
 *   log.error('Failed', error);
 */
export function workersLogger(namespace: string) {
  const prefix = `[${namespace}]`;

  return {
    trace: (...args: unknown[]) => {
      // Trace is typically too verbose for production workers
      // Uncomment if needed for debugging
      // console.debug(prefix, ...args);
    },
    debug: (...args: unknown[]) => {
      // Debug logs visible in Workers Logs when tailing
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
// TYPE EXPORTS
// =============================================================================

export type { Logger, LogLevelDesc };
