'use client'

import { useState, useCallback, useRef } from 'react'

/**
 * Validator function: returns an error message string if invalid, or undefined if valid.
 */
type FieldValidator<T> = (value: T[keyof T], fields: T) => string | undefined

/**
 * Options for useFormState hook.
 */
interface UseFormStateOptions<T extends Record<string, unknown>> {
  /** Initial field values. Also used as the baseline for dirty tracking. */
  initialValues: T
  /** Per-field validators. Each receives the field value and all fields. */
  validators?: { [K in keyof T]?: FieldValidator<T> }
  /** Field names that must be non-empty (truthy after trimming for strings). */
  required?: (keyof T)[]
  /** Called with validated field values on submit. Can be async. */
  onSubmit: (values: T) => void | Promise<void>
}

interface UseFormStateReturn<T extends Record<string, unknown>> {
  /** Current field values. */
  fields: T
  /** Update a single field by name. Clears that field's error if one exists. */
  setField: <K extends keyof T>(name: K, value: T[K]) => void
  /** Current validation errors keyed by field name. */
  errors: Partial<Record<keyof T, string>>
  /** Manually set an error on a field (useful for external validation like duplicate checks). */
  setError: (name: keyof T, message: string) => void
  /** Manually clear an error on a field. */
  clearError: (name: keyof T) => void
  /** Whether any field has changed from its initial value. */
  isDirty: boolean
  /** Whether the form is currently submitting (for async submit handlers). */
  isSubmitting: boolean
  /** Form submit handler - call preventDefault, run validation, call onSubmit. */
  handleSubmit: (e: React.FormEvent) => void
  /** Reset all fields to initial values (or new values) and clear errors. */
  resetForm: (values?: T) => void
  /** Run all validators and return true if the form is valid. */
  validate: () => boolean
}

/**
 * Shared form state management hook.
 *
 * Handles field state, dirty tracking, validation, and async-safe submit.
 * Designed to work alongside existing form logic without requiring a full rewrite.
 *
 * @example
 * ```tsx
 * const { fields, setField, errors, isDirty, isSubmitting, handleSubmit } = useFormState({
 *   initialValues: { name: '', description: '' },
 *   required: ['name'],
 *   validators: {
 *     name: (value) => {
 *       if (existingNames.includes(value as string)) return 'Name already exists'
 *     },
 *   },
 *   onSubmit: (values) => saveArea(values),
 * })
 * ```
 */
export function useFormState<T extends Record<string, unknown>>(
  options: UseFormStateOptions<T>
): UseFormStateReturn<T> {
  const { initialValues, validators, required, onSubmit } = options

  const [fields, setFields] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Store initial values in a ref so dirty tracking is stable
  const initialRef = useRef(initialValues)

  const setField = useCallback(<K extends keyof T>(name: K, value: T[K]) => {
    setFields(prev => ({ ...prev, [name]: value }))
    // Clear error for this field when user edits it
    setErrors(prev => {
      if (prev[name]) {
        const next = { ...prev }
        delete next[name]
        return next
      }
      return prev
    })
  }, [])

  const setError = useCallback((name: keyof T, message: string) => {
    setErrors(prev => ({ ...prev, [name]: message }))
  }, [])

  const clearError = useCallback((name: keyof T) => {
    setErrors(prev => {
      if (prev[name]) {
        const next = { ...prev }
        delete next[name]
        return next
      }
      return prev
    })
  }, [])

  // Dirty tracking: compare current fields to initial values
  const isDirty = Object.keys(fields).some(key => {
    const k = key as keyof T
    return fields[k] !== initialRef.current[k]
  })

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {}

    // Check required fields
    if (required) {
      for (const fieldName of required) {
        const value = fields[fieldName]
        const isEmpty =
          value === undefined ||
          value === null ||
          value === '' ||
          (typeof value === 'string' && value.trim() === '')
        if (isEmpty) {
          newErrors[fieldName] = 'This field is required'
        }
      }
    }

    // Run custom validators
    if (validators) {
      for (const key of Object.keys(validators) as (keyof T)[]) {
        // Skip if already has a required error
        if (newErrors[key]) continue
        const validator = validators[key]
        if (validator) {
          const error = validator(fields[key], fields)
          if (error) {
            newErrors[key] = error
          }
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [fields, required, validators])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()

    // Prevent double-submit
    if (isSubmitting) return

    if (!validate()) return

    const result = onSubmit(fields)

    // Handle async submit
    if (result instanceof Promise) {
      setIsSubmitting(true)
      result
        .catch((err) => {
          console.error('Form submit error:', err)
        })
        .finally(() => {
          setIsSubmitting(false)
        })
    }
  }, [fields, isSubmitting, onSubmit, validate])

  const resetForm = useCallback((values?: T) => {
    const resetValues = values ?? initialRef.current
    setFields(resetValues)
    setErrors({})
    if (values) {
      initialRef.current = values
    }
  }, [])

  return {
    fields,
    setField,
    errors,
    setError,
    clearError,
    isDirty,
    isSubmitting,
    handleSubmit,
    resetForm,
    validate,
  }
}

export default useFormState
