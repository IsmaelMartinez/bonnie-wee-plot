/**
 * Debounce utility for delaying function execution
 * Used to prevent excessive localStorage writes and API calls
 */

/**
 * Creates a debounced version of a function that delays execution
 * until after `delay` milliseconds have elapsed since the last call.
 * 
 * @param fn - The function to debounce
 * @param delay - The delay in milliseconds (default: 500ms)
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}

/**
 * Creates a debounced function with a flush capability
 * Useful when you need to force immediate execution (e.g., on page unload)
 * 
 * @param fn - The function to debounce
 * @param delay - The delay in milliseconds (default: 500ms)
 * @returns Object with debounced function and flush method
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createDebouncedFunction<T extends (...args: any[]) => void>(
  fn: T,
  delay: number = 500
): {
  debounced: (...args: Parameters<T>) => void
  flush: () => void
  cancel: () => void
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let pendingArgs: Parameters<T> | null = null

  const debounced = (...args: Parameters<T>) => {
    pendingArgs = args
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      if (pendingArgs) {
        fn(...pendingArgs)
        pendingArgs = null
      }
      timeoutId = null
    }, delay)
  }

  const flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    if (pendingArgs) {
      fn(...pendingArgs)
      pendingArgs = null
    }
  }

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    pendingArgs = null
  }

  return { debounced, flush, cancel }
}

