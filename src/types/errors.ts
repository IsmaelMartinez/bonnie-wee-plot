/**
 * Custom error types for better error handling and recovery
 *
 * These errors provide structured information about what went wrong
 * and how users can potentially recover from the error.
 */

/**
 * Error thrown during data import operations
 */
export class ImportError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly recoverable: boolean = true,
    public readonly suggestions: string[] = []
  ) {
    super(message)
    this.name = 'ImportError'
  }
}

/**
 * Error thrown during data export operations
 */
export class ExportError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly recoverable: boolean = true,
    public readonly suggestions: string[] = []
  ) {
    super(message)
    this.name = 'ExportError'
  }
}

/**
 * Error thrown when localStorage quota is exceeded
 */
export class StorageQuotaError extends Error {
  constructor(
    public readonly used: number,
    public readonly available: number
  ) {
    super(`Storage quota exceeded: ${used}MB used of ${available}MB`)
    this.name = 'StorageQuotaError'
  }
}
