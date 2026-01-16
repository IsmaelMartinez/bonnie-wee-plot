import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  logger,
  configureLogger,
  getLoggerConfig,
  getQueuedLogs,
  clearLogQueue,
  flushLogs,
  type LogEntry,
} from '@/lib/logger'

describe('logger', () => {
  beforeEach(() => {
    // Reset logger config to defaults
    configureLogger({
      minLevel: 'debug',
      enableConsole: false, // Disable console during tests
      onLog: undefined,
    })
    clearLogQueue()
    vi.clearAllMocks()
  })

  afterEach(() => {
    clearLogQueue()
  })

  describe('configureLogger', () => {
    it('should update logger configuration', () => {
      configureLogger({ minLevel: 'warn' })
      const config = getLoggerConfig()
      expect(config.minLevel).toBe('warn')
    })

    it('should preserve existing config when partially updating', () => {
      configureLogger({ minLevel: 'error' })
      configureLogger({ enableConsole: true })
      const config = getLoggerConfig()
      expect(config.minLevel).toBe('error')
      expect(config.enableConsole).toBe(true)
    })
  })

  describe('log levels', () => {
    it('should log debug messages when minLevel is debug', () => {
      const logs: LogEntry[] = []
      configureLogger({
        minLevel: 'debug',
        onLog: (entry) => logs.push(entry),
      })

      logger.debug('debug message')
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('debug')
      expect(logs[0].message).toBe('debug message')
    })

    it('should filter debug messages when minLevel is info', () => {
      const logs: LogEntry[] = []
      configureLogger({
        minLevel: 'info',
        onLog: (entry) => logs.push(entry),
      })

      logger.debug('should be filtered')
      logger.info('should appear')

      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('info')
    })

    it('should filter info and debug when minLevel is warn', () => {
      const logs: LogEntry[] = []
      configureLogger({
        minLevel: 'warn',
        onLog: (entry) => logs.push(entry),
      })

      logger.debug('filtered')
      logger.info('filtered')
      logger.warn('should appear')
      logger.error('should also appear')

      expect(logs).toHaveLength(2)
      expect(logs[0].level).toBe('warn')
      expect(logs[1].level).toBe('error')
    })

    it('should only log errors when minLevel is error', () => {
      const logs: LogEntry[] = []
      configureLogger({
        minLevel: 'error',
        onLog: (entry) => logs.push(entry),
      })

      logger.debug('filtered')
      logger.info('filtered')
      logger.warn('filtered')
      logger.error('should appear')

      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('error')
    })
  })

  describe('log entry structure', () => {
    it('should include timestamp in ISO format', () => {
      const logs: LogEntry[] = []
      configureLogger({
        minLevel: 'debug',
        onLog: (entry) => logs.push(entry),
      })

      logger.info('test message')

      expect(logs[0].timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      )
    })

    it('should include optional metadata', () => {
      const logs: LogEntry[] = []
      configureLogger({
        minLevel: 'debug',
        onLog: (entry) => logs.push(entry),
      })

      logger.info('test message', { userId: '123', action: 'login' })

      expect(logs[0].metadata).toEqual({ userId: '123', action: 'login' })
    })

    it('should handle messages without metadata', () => {
      const logs: LogEntry[] = []
      configureLogger({
        minLevel: 'debug',
        onLog: (entry) => logs.push(entry),
      })

      logger.info('simple message')

      expect(logs[0].metadata).toBeUndefined()
    })
  })

  describe('console output', () => {
    it('should output to console.debug for debug level', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
      configureLogger({ minLevel: 'debug', enableConsole: true })

      logger.debug('debug message')

      expect(consoleSpy).toHaveBeenCalled()
      expect(consoleSpy.mock.calls[0][0]).toContain('DEBUG')
      expect(consoleSpy.mock.calls[0][0]).toContain('debug message')
    })

    it('should output to console.info for info level', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      configureLogger({ minLevel: 'debug', enableConsole: true })

      logger.info('info message')

      expect(consoleSpy).toHaveBeenCalled()
      expect(consoleSpy.mock.calls[0][0]).toContain('INFO')
    })

    it('should output to console.warn for warn level', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      configureLogger({ minLevel: 'debug', enableConsole: true })

      logger.warn('warning message')

      expect(consoleSpy).toHaveBeenCalled()
      expect(consoleSpy.mock.calls[0][0]).toContain('WARN')
    })

    it('should output to console.error for error level', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      configureLogger({ minLevel: 'debug', enableConsole: true })

      logger.error('error message')

      expect(consoleSpy).toHaveBeenCalled()
      expect(consoleSpy.mock.calls[0][0]).toContain('ERROR')
    })

    it('should not output to console when enableConsole is false', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      configureLogger({ minLevel: 'debug', enableConsole: false })

      logger.info('test message')

      expect(consoleSpy).not.toHaveBeenCalled()
    })

    it('should include metadata in console output', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      configureLogger({ minLevel: 'debug', enableConsole: true })

      logger.info('test', { key: 'value' })

      expect(consoleSpy.mock.calls[0][0]).toContain('{"key":"value"}')
    })
  })

  describe('log queue', () => {
    it('should return empty queue initially', () => {
      expect(getQueuedLogs()).toEqual([])
    })

    it('should clear queue with clearLogQueue', () => {
      // Manually add to queue by simulating production logging
      const originalEnv = process.env.NODE_ENV
      vi.stubEnv('NODE_ENV', 'production')

      configureLogger({ minLevel: 'debug', enableConsole: false })
      logger.info('test')

      // Force production behavior for test
      vi.stubEnv('NODE_ENV', originalEnv)
      clearLogQueue()
      expect(getQueuedLogs()).toEqual([])
    })

    it('should flush and return logs', async () => {
      // Add entries directly to test flush
      const logs: LogEntry[] = []
      configureLogger({
        minLevel: 'debug',
        enableConsole: false,
        onLog: (entry) => logs.push(entry),
      })

      logger.info('message 1')
      logger.info('message 2')

      // Flush returns logs and clears queue
      const flushed = await flushLogs()
      expect(flushed).toEqual([]) // Queue only fills in production
    })
  })

  describe('onLog callback', () => {
    it('should call onLog callback for each log entry', () => {
      const onLog = vi.fn()
      configureLogger({
        minLevel: 'debug',
        enableConsole: false,
        onLog,
      })

      logger.info('test message', { key: 'value' })

      expect(onLog).toHaveBeenCalledTimes(1)
      expect(onLog).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          message: 'test message',
          metadata: { key: 'value' },
        })
      )
    })

    it('should not call onLog when log level is filtered', () => {
      const onLog = vi.fn()
      configureLogger({
        minLevel: 'error',
        enableConsole: false,
        onLog,
      })

      logger.debug('filtered')
      logger.info('filtered')
      logger.warn('filtered')

      expect(onLog).not.toHaveBeenCalled()
    })
  })
})
