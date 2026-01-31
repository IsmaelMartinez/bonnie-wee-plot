import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isQuotaExceededError,
  isBrowserEnvironment,
  safeJsonParse,
  safeJsonStringify,
  safeStorageGet,
  safeStorageSet,
  withUpdatedTimestamp,
  mapItemUpdate,
} from '@/lib/storage-ops'

describe('storage-ops', () => {
  describe('isQuotaExceededError', () => {
    it('returns true for QuotaExceededError', () => {
      const error = new DOMException('', 'QuotaExceededError')
      expect(isQuotaExceededError(error)).toBe(true)
    })

    it('returns true for error code 22', () => {
      // Create a mock object that behaves like DOMException with code 22
      const error = Object.create(DOMException.prototype, {
        code: { value: 22, writable: false },
        name: { value: 'SomeOtherError', writable: false },
      })
      expect(isQuotaExceededError(error)).toBe(true)
    })

    it('returns true for Firefox NS_ERROR_DOM_QUOTA_REACHED', () => {
      const error = new DOMException('', 'NS_ERROR_DOM_QUOTA_REACHED')
      expect(isQuotaExceededError(error)).toBe(true)
    })

    it('returns true for error code 1014', () => {
      // Create a mock object that behaves like DOMException with code 1014
      const error = Object.create(DOMException.prototype, {
        code: { value: 1014, writable: false },
        name: { value: 'SomeOtherError', writable: false },
      })
      expect(isQuotaExceededError(error)).toBe(true)
    })

    it('returns false for other errors', () => {
      expect(isQuotaExceededError(new Error('test'))).toBe(false)
      expect(isQuotaExceededError(null)).toBe(false)
      expect(isQuotaExceededError('string')).toBe(false)
      expect(isQuotaExceededError(undefined)).toBe(false)
    })

    it('returns false for DOMException with different name/code', () => {
      const error = new DOMException('', 'SyntaxError')
      expect(isQuotaExceededError(error)).toBe(false)
    })
  })

  describe('isBrowserEnvironment', () => {
    it('returns true when window is defined', () => {
      // In vitest with jsdom, window should be defined
      expect(isBrowserEnvironment()).toBe(true)
    })
  })

  describe('safeJsonParse', () => {
    it('parses valid JSON object', () => {
      const result = safeJsonParse<{ name: string }>('{"name": "test"}')
      expect(result.success).toBe(true)
      expect(result.data).toEqual({ name: 'test' })
    })

    it('parses valid JSON array', () => {
      const result = safeJsonParse<number[]>('[1, 2, 3]')
      expect(result.success).toBe(true)
      expect(result.data).toEqual([1, 2, 3])
    })

    it('parses valid JSON primitive', () => {
      const result = safeJsonParse<string>('"hello"')
      expect(result.success).toBe(true)
      expect(result.data).toBe('hello')
    })

    it('returns error for invalid JSON', () => {
      const result = safeJsonParse('not json')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid JSON')
    })

    it('returns error for incomplete JSON', () => {
      const result = safeJsonParse('{"name":')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid JSON')
    })
  })

  describe('safeJsonStringify', () => {
    it('stringifies valid objects', () => {
      const result = safeJsonStringify({ name: 'test' })
      expect(result.success).toBe(true)
      expect(result.data).toBe('{"name":"test"}')
    })

    it('stringifies arrays', () => {
      const result = safeJsonStringify([1, 2, 3])
      expect(result.success).toBe(true)
      expect(result.data).toBe('[1,2,3]')
    })

    it('stringifies primitives', () => {
      const result = safeJsonStringify('hello')
      expect(result.success).toBe(true)
      expect(result.data).toBe('"hello"')
    })

    it('handles circular references gracefully', () => {
      const obj: Record<string, unknown> = {}
      obj.self = obj
      const result = safeJsonStringify(obj)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to stringify data')
    })
  })

  describe('withUpdatedTimestamp', () => {
    it('adds updatedAt to object without existing timestamp', () => {
      const before = Date.now()
      const result = withUpdatedTimestamp({ name: 'test' })
      const after = Date.now()

      expect(result.name).toBe('test')
      expect(result.updatedAt).toBeDefined()
      const timestamp = new Date(result.updatedAt!).getTime()
      expect(timestamp).toBeGreaterThanOrEqual(before)
      expect(timestamp).toBeLessThanOrEqual(after)
    })

    it('updates existing updatedAt field', () => {
      const oldTimestamp = '2020-01-01T00:00:00.000Z'
      const result = withUpdatedTimestamp({ name: 'test', updatedAt: oldTimestamp })

      expect(result.name).toBe('test')
      expect(result.updatedAt).not.toBe(oldTimestamp)
    })

    it('preserves other properties', () => {
      const input = { name: 'test', count: 5, nested: { a: 1 } }
      const result = withUpdatedTimestamp(input)

      expect(result.name).toBe('test')
      expect(result.count).toBe(5)
      expect(result.nested).toEqual({ a: 1 })
    })
  })

  describe('mapItemUpdate', () => {
    it('updates matching item', () => {
      const items = [
        { id: '1', name: 'one' },
        { id: '2', name: 'two' },
      ]
      const result = mapItemUpdate(items, '2', item => ({ ...item, name: 'updated' }))
      expect(result).toEqual([
        { id: '1', name: 'one' },
        { id: '2', name: 'updated' },
      ])
    })

    it('returns same values if no match', () => {
      const items = [{ id: '1', name: 'one' }]
      const result = mapItemUpdate(items, '999', item => ({ ...item, name: 'updated' }))
      expect(result).toEqual([{ id: '1', name: 'one' }])
    })

    it('handles empty array', () => {
      const items: { id: string; name: string }[] = []
      const result = mapItemUpdate(items, '1', item => ({ ...item, name: 'updated' }))
      expect(result).toEqual([])
    })

    it('updates first item only when multiple items have same id', () => {
      const items = [
        { id: '1', name: 'first' },
        { id: '1', name: 'second' },
      ]
      const result = mapItemUpdate(items, '1', item => ({ ...item, name: 'updated' }))
      expect(result).toEqual([
        { id: '1', name: 'updated' },
        { id: '1', name: 'updated' },
      ])
    })
  })

  describe('safeStorageGet', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    afterEach(() => {
      localStorage.clear()
    })

    it('returns value when key exists', () => {
      localStorage.setItem('test-key', 'test-value')
      const result = safeStorageGet('test-key')
      expect(result.success).toBe(true)
      expect(result.data).toBe('test-value')
    })

    it('returns error when key does not exist', () => {
      const result = safeStorageGet('nonexistent-key')
      expect(result.success).toBe(false)
      expect(result.error).toBe('No data found')
    })

    it('handles JSON stored values', () => {
      localStorage.setItem('json-key', '{"name":"test"}')
      const result = safeStorageGet('json-key')
      expect(result.success).toBe(true)
      expect(result.data).toBe('{"name":"test"}')
    })
  })

  describe('safeStorageSet', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    afterEach(() => {
      localStorage.clear()
    })

    it('sets value successfully', () => {
      const result = safeStorageSet('test-key', 'test-value')
      expect(result.success).toBe(true)
      expect(localStorage.getItem('test-key')).toBe('test-value')
    })

    it('overwrites existing value', () => {
      localStorage.setItem('test-key', 'old-value')
      const result = safeStorageSet('test-key', 'new-value')
      expect(result.success).toBe(true)
      expect(localStorage.getItem('test-key')).toBe('new-value')
    })

    it('handles JSON values', () => {
      const jsonValue = '{"name":"test"}'
      const result = safeStorageSet('json-key', jsonValue)
      expect(result.success).toBe(true)
      expect(localStorage.getItem('json-key')).toBe(jsonValue)
    })

    it('returns quota error when storage throws QuotaExceededError', () => {
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new DOMException('', 'QuotaExceededError')
      })

      const result = safeStorageSet('key', 'value')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Storage quota exceeded')

      localStorage.setItem = originalSetItem
    })
  })
})
