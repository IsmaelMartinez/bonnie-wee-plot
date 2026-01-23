/**
 * Unit tests for custom error types
 *
 * Tests error classification and recovery suggestions
 */

import { describe, it, expect } from 'vitest'
import { ImportError, ExportError, StorageQuotaError } from '@/types/errors'

describe('ImportError', () => {
  it('creates error with all properties', () => {
    const error = new ImportError(
      'Invalid data format',
      'INVALID_FORMAT',
      true,
      ['Check the file format', 'Try exporting again']
    )

    expect(error.message).toBe('Invalid data format')
    expect(error.code).toBe('INVALID_FORMAT')
    expect(error.recoverable).toBe(true)
    expect(error.suggestions).toHaveLength(2)
    expect(error.name).toBe('ImportError')
    expect(error).toBeInstanceOf(Error)
  })

  it('defaults to recoverable=true when not specified', () => {
    const error = new ImportError('Test error', 'TEST_CODE')

    expect(error.recoverable).toBe(true)
    expect(error.suggestions).toEqual([])
  })

  it('can be marked as non-recoverable', () => {
    const error = new ImportError(
      'Unrecoverable corruption',
      'DATA_CORRUPTED',
      false,
      ['Contact support']
    )

    expect(error.recoverable).toBe(false)
  })
})

describe('ExportError', () => {
  it('creates error with all properties', () => {
    const error = new ExportError(
      'Failed to generate export',
      'EXPORT_FAILED',
      true,
      ['Check browser storage', 'Try again']
    )

    expect(error.message).toBe('Failed to generate export')
    expect(error.code).toBe('EXPORT_FAILED')
    expect(error.recoverable).toBe(true)
    expect(error.suggestions).toHaveLength(2)
    expect(error.name).toBe('ExportError')
    expect(error).toBeInstanceOf(Error)
  })
})

describe('StorageQuotaError', () => {
  it('creates error with usage information', () => {
    const error = new StorageQuotaError(8, 10)

    expect(error.used).toBe(8)
    expect(error.available).toBe(10)
    expect(error.message).toContain('8MB')
    expect(error.message).toContain('10MB')
    expect(error.name).toBe('StorageQuotaError')
    expect(error).toBeInstanceOf(Error)
  })

  it('formats message correctly', () => {
    const error = new StorageQuotaError(5.5, 10)

    expect(error.message).toBe('Storage quota exceeded: 5.5MB used of 10MB')
  })
})

describe('Error Classification', () => {
  it('distinguishes between different error types', () => {
    const importErr = new ImportError('Import failed', 'IMPORT_FAIL')
    const exportErr = new ExportError('Export failed', 'EXPORT_FAIL')
    const quotaErr = new StorageQuotaError(10, 10)

    expect(importErr).toBeInstanceOf(ImportError)
    expect(exportErr).toBeInstanceOf(ExportError)
    expect(quotaErr).toBeInstanceOf(StorageQuotaError)

    expect(importErr.name).toBe('ImportError')
    expect(exportErr.name).toBe('ExportError')
    expect(quotaErr.name).toBe('StorageQuotaError')
  })

  it('provides recovery suggestions for common scenarios', () => {
    const versionMismatch = new ImportError(
      'Version too new',
      'VERSION_MISMATCH',
      false,
      ['Update the application', 'Use a compatible backup file']
    )

    const corruptedData = new ImportError(
      'Invalid JSON',
      'CORRUPTED_DATA',
      true,
      ['Try exporting a new backup', 'Restore from a different backup']
    )

    expect(versionMismatch.suggestions).toContain('Update the application')
    expect(corruptedData.suggestions).toContain('Try exporting a new backup')
  })
})
