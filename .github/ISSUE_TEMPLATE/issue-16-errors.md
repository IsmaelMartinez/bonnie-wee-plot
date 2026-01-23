---
name: "#16: Enhance variety management error messages"
about: Provide clear, actionable error messages for variety operations
title: "#16: Enhance variety management error messages"
labels: phase-4, enhancement, variety-management
---

## Problem Statement

Error messages throughout the variety management system are generic and non-actionable. Users don't know what went wrong or how to fix it. Error messages should be:
- Clear and specific about what failed
- Actionable (tell user what to do)
- Contextual (include relevant data like variety name)
- Localized for different error types

## Acceptance Criteria

- [ ] Create error type hierarchy in `/src/types/variety-errors.ts`:
  - `VarietyError` (base class)
  - `VarietyNotFoundError`
  - `VarietyNameError` (duplicate, invalid format)
  - `VarietyOperationError` (general operation failure)
  - `VarietyIntegrityError` (data consistency issues)
  - `VarietyStorageError` (storage limits, quota)

- [ ] Each error type includes:
  - `code` - machine-readable error identifier
  - `message` - user-facing error message
  - `details` - optional object with additional context
  - `suggestion` - optional action the user can take

- [ ] Update all variety storage functions to throw/return typed errors:
  - `addVariety()`
  - `updateVariety()`
  - `removeVariety()`
  - `renameVariety()`
  - `archiveVariety()`
  - And other operations

- [ ] Error messages for common scenarios:
  - "Variety 'Early Tomato' already exists for this plant"
  - "Cannot rename: 'Cherry Tomato' is already used for this plant"
  - "Variety 'Unknown' not found - it may have been deleted"
  - "Storage quota exceeded. Archive old varieties to free space."
  - "Planting references this variety which no longer exists"

- [ ] Create error message constants in `/src/types/variety-errors.ts`:
  - Centralized for consistency and i18n preparation
  - Include placeholder positions for dynamic content

- [ ] Update `useVarieties` hook:
  - Catch and re-throw errors with context
  - Maintain error state in hook return value
  - Add `clearError()` method

- [ ] Tests for:
  - Each error type with example scenarios
  - Message formatting and suggestions
  - Error propagation through hook

- [ ] Documentation:
  - Add comments explaining error types
  - Example error scenarios in JSDoc

## Implementation Details

### Error Type Module
Create `/src/types/variety-errors.ts`:
```typescript
export class VarietyError extends Error {
  code: string
  details?: Record<string, unknown>
  suggestion?: string

  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>,
    suggestion?: string
  )
}

export class VarietyNotFoundError extends VarietyError { ... }
export class VarietyNameError extends VarietyError { ... }
export class VarietyOperationError extends VarietyError { ... }
export class VarietyIntegrityError extends VarietyError { ... }
export class VarietyStorageError extends VarietyError { ... }

export const ERROR_MESSAGES = {
  VARIETY_NOT_FOUND: (name: string) => `Variety '${name}' not found`,
  DUPLICATE_NAME: (name: string, plant: string) => `Variety '${name}' already exists for ${plant}`,
  INVALID_NAME: (reason: string) => `Invalid variety name: ${reason}`,
  STORAGE_QUOTA_EXCEEDED: () => 'Storage quota exceeded. Archive old varieties to free space.',
  INTEGRITY_ERROR: (description: string) => `Data integrity issue: ${description}`,
  // ... more messages
}
```

### Storage Function Updates
Update variety-storage.ts functions:
- Replace generic `StorageResult` with typed errors where appropriate
- Or return `StorageResult` with error code + message

### Hook Updates
Update `/src/hooks/useVarieties.ts`:
- Add error state management
- Add `clearError()` method
- Catch and re-throw errors with context

## Testing Requirements

- [ ] Unit tests for each error type
- [ ] Test error message formatting
- [ ] Test error propagation through hook
- [ ] Test error state management in component
- [ ] Test error clearing

## Files to Create

- `/src/types/variety-errors.ts`
- `/src/__tests__/types/variety-errors.test.ts` (if needed)

## Files to Modify

- `/src/services/variety-storage.ts`
- `/src/hooks/useVarieties.ts`
- All variety operation functions to use new errors

## Estimated Effort

Medium (5-6 hours) - Mostly code organization and message creation, straightforward implementation.

## Related

Epic: Variety Management Refactor
Phase: 4
Priority: Medium
Depends on: #13, #14, #15
