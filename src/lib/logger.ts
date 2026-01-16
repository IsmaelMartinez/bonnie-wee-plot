/**
 * Structured logging utility for Community Allotment
 *
 * Provides consistent log formatting with timestamps, levels, and metadata.
 * In production, logs are queued for potential aggregation service integration.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  metadata?: Record<string, unknown>
}

export interface LoggerConfig {
  minLevel?: LogLevel
  enableConsole?: boolean
  onLog?: (entry: LogEntry) => void
}

// Log level priority for filtering
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// Queue for batching logs in production
let logQueue: LogEntry[] = []
const MAX_QUEUE_SIZE = 100
const FLUSH_INTERVAL_MS = 30000 // 30 seconds

// Default configuration
let config: LoggerConfig = {
  minLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  enableConsole: true,
}

/**
 * Configure the logger settings
 */
export function configureLogger(newConfig: Partial<LoggerConfig>): void {
  config = { ...config, ...newConfig }
}

/**
 * Get the current logger configuration
 */
export function getLoggerConfig(): LoggerConfig {
  return { ...config }
}

/**
 * Check if a log level should be output based on minimum level setting
 */
function shouldLog(level: LogLevel): boolean {
  const minPriority = LOG_LEVEL_PRIORITY[config.minLevel || 'debug']
  const currentPriority = LOG_LEVEL_PRIORITY[level]
  return currentPriority >= minPriority
}

/**
 * Format a log entry for console output
 */
function formatForConsole(entry: LogEntry): string {
  const { timestamp, level, message, metadata } = entry
  const levelUpper = level.toUpperCase().padEnd(5)
  let output = `[${timestamp}] ${levelUpper} ${message}`

  if (metadata && Object.keys(metadata).length > 0) {
    output += ` ${JSON.stringify(metadata)}`
  }

  return output
}

/**
 * Create a structured log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  metadata?: Record<string, unknown>
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    metadata,
  }
}

/**
 * Output a log entry to the appropriate destination
 */
function outputLog(entry: LogEntry): void {
  // Call custom log handler if configured
  if (config.onLog) {
    config.onLog(entry)
  }

  // Console output
  if (config.enableConsole) {
    const formatted = formatForConsole(entry)
    switch (entry.level) {
      case 'debug':
        console.debug(formatted)
        break
      case 'info':
        console.info(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'error':
        console.error(formatted)
        break
    }
  }

  // In production, queue logs for potential aggregation
  if (process.env.NODE_ENV === 'production') {
    queueLog(entry)
  }
}

/**
 * Add a log entry to the queue for batch processing
 */
function queueLog(entry: LogEntry): void {
  logQueue.push(entry)

  // Prevent unbounded queue growth
  if (logQueue.length > MAX_QUEUE_SIZE) {
    logQueue = logQueue.slice(-MAX_QUEUE_SIZE)
  }
}

/**
 * Get queued logs (for testing or manual flush)
 */
export function getQueuedLogs(): LogEntry[] {
  return [...logQueue]
}

/**
 * Clear the log queue
 */
export function clearLogQueue(): void {
  logQueue = []
}

/**
 * Flush queued logs to an aggregation service
 * This is a placeholder for future integration with services like Axiom or Loki
 */
export async function flushLogs(): Promise<LogEntry[]> {
  const logs = [...logQueue]
  logQueue = []
  // Future: Send logs to aggregation service here
  // await sendToAggregationService(logs)
  return logs
}

/**
 * Core logging function
 */
function log(
  level: LogLevel,
  message: string,
  metadata?: Record<string, unknown>
): void {
  if (!shouldLog(level)) {
    return
  }

  const entry = createLogEntry(level, message, metadata)
  outputLog(entry)
}

/**
 * Logger interface with convenience methods for each log level
 */
export const logger = {
  debug: (message: string, metadata?: Record<string, unknown>) =>
    log('debug', message, metadata),

  info: (message: string, metadata?: Record<string, unknown>) =>
    log('info', message, metadata),

  warn: (message: string, metadata?: Record<string, unknown>) =>
    log('warn', message, metadata),

  error: (message: string, metadata?: Record<string, unknown>) =>
    log('error', message, metadata),
}

// Track flush failures to avoid spamming console
let flushFailureCount = 0
const MAX_FLUSH_FAILURE_LOGS = 3

// Auto-flush logs periodically in production (browser only)
if (
  typeof window !== 'undefined' &&
  process.env.NODE_ENV === 'production'
) {
  setInterval(() => {
    if (logQueue.length > 0) {
      flushLogs().catch((error) => {
        flushFailureCount++
        // Use console.warn directly to avoid log loops, but limit to first few failures
        if (flushFailureCount <= MAX_FLUSH_FAILURE_LOGS) {
          console.warn(
            '[Logger] Failed to flush logs:',
            error instanceof Error ? error.message : 'Unknown error'
          )
        }
      })
    }
  }, FLUSH_INTERVAL_MS)
}

export default logger
