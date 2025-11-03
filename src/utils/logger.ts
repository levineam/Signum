/**
 * Structured logging utility using Pino
 * Story 2.4.6: Production Security Hardening
 *
 * Replaces console.log/error/warn/info/debug with production-grade logging
 *
 * Features:
 * - Environment-based log levels (debug in dev, info in prod)
 * - Pretty-printing in development (colorized, readable)
 * - JSON output in production (structured, searchable)
 * - Contextual logging with fields (userId, route, etc.)
 *
 * Usage:
 *   import logger from '@/utils/logger'
 *
 *   logger.debug({ userId, route: 'api/notes' }, 'User authenticated')
 *   logger.info({ noteId }, 'Note created successfully')
 *   logger.warn({ count }, 'Approaching rate limit')
 *   logger.error({ error, route: 'api/tasks' }, 'Database query failed')
 *   logger.fatal({ error }, 'Service unavailable')
 *
 * Environment Variables:
 *   LOG_LEVEL - Set logging level: debug|info|warn|error|fatal
 *               Development default: debug (shows all logs)
 *               Production default: info (hides debug logs)
 *
 * Edge Runtime Compatibility:
 *   ⚠️ Pino requires Node.js runtime. If converting API routes to Edge runtime,
 *   either keep routes on Node runtime or replace with edge-compatible logger.
 */

import pino from 'pino'

const logger = pino({
  // Set log level based on environment
  // Development: debug (shows everything)
  // Production: info (hides debug logs)
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),

  // Pretty-print in development for readability
  // JSON in production for structured logging
  transport: process.env.NODE_ENV !== 'production'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    : undefined,

  // Format log levels consistently
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() }
    }
  }
})

export default logger
