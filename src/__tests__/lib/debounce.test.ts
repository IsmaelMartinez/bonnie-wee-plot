import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { debounce, createDebouncedFunction } from '@/lib/utils/debounce'

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should not call the function immediately', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 500)

    debounced()
    expect(fn).not.toHaveBeenCalled()
  })

  it('should call the function after the delay', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 500)

    debounced()
    vi.advanceTimersByTime(500)

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should pass arguments to the debounced function', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 500)

    debounced('hello', 42)
    vi.advanceTimersByTime(500)

    expect(fn).toHaveBeenCalledWith('hello', 42)
  })

  it('should reset the timer on repeated calls', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 500)

    debounced()
    vi.advanceTimersByTime(300)

    debounced()
    vi.advanceTimersByTime(300)

    // Only 600ms total passed, but timer was reset at 300ms
    // So only 300ms since last call - fn should not be called yet
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(200)
    // Now 500ms since the second call
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should only call with the most recent arguments', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 500)

    debounced('first')
    debounced('second')
    debounced('third')

    vi.advanceTimersByTime(500)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('third')
  })

  it('should use default delay of 500ms when none specified', () => {
    const fn = vi.fn()
    const debounced = debounce(fn)

    debounced()
    vi.advanceTimersByTime(499)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should allow multiple independent executions over time', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('a')
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('a')

    debounced('b')
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith('b')
  })
})

describe('createDebouncedFunction', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return an object with debounced, flush, and cancel', () => {
    const fn = vi.fn()
    const result = createDebouncedFunction(fn, 500)

    expect(result).toHaveProperty('debounced')
    expect(result).toHaveProperty('flush')
    expect(result).toHaveProperty('cancel')
    expect(typeof result.debounced).toBe('function')
    expect(typeof result.flush).toBe('function')
    expect(typeof result.cancel).toBe('function')
  })

  describe('debounced', () => {
    it('should not call the function immediately', () => {
      const fn = vi.fn()
      const { debounced } = createDebouncedFunction(fn, 500)

      debounced()
      expect(fn).not.toHaveBeenCalled()
    })

    it('should call the function after the delay', () => {
      const fn = vi.fn()
      const { debounced } = createDebouncedFunction(fn, 500)

      debounced()
      vi.advanceTimersByTime(500)

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should pass arguments to the function', () => {
      const fn = vi.fn()
      const { debounced } = createDebouncedFunction(fn, 500)

      debounced('data', 123)
      vi.advanceTimersByTime(500)

      expect(fn).toHaveBeenCalledWith('data', 123)
    })

    it('should reset the timer on repeated calls', () => {
      const fn = vi.fn()
      const { debounced } = createDebouncedFunction(fn, 500)

      debounced('first')
      vi.advanceTimersByTime(400)

      debounced('second')
      vi.advanceTimersByTime(400)

      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('second')
    })
  })

  describe('flush', () => {
    it('should immediately execute the pending function', () => {
      const fn = vi.fn()
      const { debounced, flush } = createDebouncedFunction(fn, 500)

      debounced('urgent')
      expect(fn).not.toHaveBeenCalled()

      flush()
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('urgent')
    })

    it('should not execute again after flush when timer fires', () => {
      const fn = vi.fn()
      const { debounced, flush } = createDebouncedFunction(fn, 500)

      debounced('data')
      flush()
      expect(fn).toHaveBeenCalledTimes(1)

      // Advance past the original timeout
      vi.advanceTimersByTime(500)
      // Should still only have been called once
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should do nothing if no pending call', () => {
      const fn = vi.fn()
      const { flush } = createDebouncedFunction(fn, 500)

      flush()
      expect(fn).not.toHaveBeenCalled()
    })

    it('should use the most recent arguments', () => {
      const fn = vi.fn()
      const { debounced, flush } = createDebouncedFunction(fn, 500)

      debounced('old')
      debounced('new')
      flush()

      expect(fn).toHaveBeenCalledWith('new')
    })
  })

  describe('cancel', () => {
    it('should prevent the pending function from executing', () => {
      const fn = vi.fn()
      const { debounced, cancel } = createDebouncedFunction(fn, 500)

      debounced('data')
      cancel()
      vi.advanceTimersByTime(500)

      expect(fn).not.toHaveBeenCalled()
    })

    it('should clear pending args so flush does nothing after cancel', () => {
      const fn = vi.fn()
      const { debounced, cancel, flush } = createDebouncedFunction(fn, 500)

      debounced('data')
      cancel()
      flush()

      expect(fn).not.toHaveBeenCalled()
    })

    it('should do nothing if no pending call', () => {
      const fn = vi.fn()
      const { cancel } = createDebouncedFunction(fn, 500)

      // Should not throw
      expect(() => cancel()).not.toThrow()
    })

    it('should allow new debounced calls after cancel', () => {
      const fn = vi.fn()
      const { debounced, cancel } = createDebouncedFunction(fn, 500)

      debounced('first')
      cancel()

      debounced('second')
      vi.advanceTimersByTime(500)

      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('second')
    })
  })

  describe('default delay', () => {
    it('should use 500ms as default delay', () => {
      const fn = vi.fn()
      const { debounced } = createDebouncedFunction(fn)

      debounced()
      vi.advanceTimersByTime(499)
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1)
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })
})
