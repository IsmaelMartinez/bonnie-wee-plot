# Clean up redundant files and code

## Labels
`refactor`, `variety-management`, `cleanup`, `phase-3`

## Priority
Medium

## Size
S (1-2 days)

## Description

After the migration in issue #11 is complete and we're confident the legacy variety storage is no longer needed, this issue performs final cleanup of deprecated code and files. This removes the last traces of the split-brain architecture and simplifies the codebase.

Cleanup includes removing the legacy storage fallback code, updating all import statements, and removing any comments or documentation that references the old variety storage system.

## Acceptance Criteria

- [ ] Remove the legacy variety storage key from localStorage (after grace period or based on safe conditions)
  - [ ] Add cleanup logic that runs once when migration is confirmed complete
  - [ ] Or provide admin tool to clean up legacy data
  - [ ] Document manual cleanup process for users who need it

- [ ] Remove any fallback code that handles missing unified storage by falling back to legacy storage

- [ ] Update all documentation and comments
  - [ ] Remove references to separate variety storage
  - [ ] Update architectural documentation to reflect unified storage only
  - [ ] Update inline code comments that mention legacy system

- [ ] Verify no dead imports remain in codebase
  - [ ] Ensure all removed files no longer imported anywhere
  - [ ] Run TypeScript compiler in strict mode to catch import errors

- [ ] Verify tests pass
  - [ ] All unit tests pass
  - [ ] All e2e tests pass
  - [ ] No type errors

- [ ] Update CLAUDE.md if necessary to reflect new architecture

## Implementation Details

### Files to Remove/Clean

1. Remove fallback code from utilities that might reference legacy storage
2. Clean up any type definitions that were only for backward compatibility
3. Remove test fixtures that reference legacy storage format
4. Update error messages that might mention "variety storage"

### Files to Update

1. **`src/services/allotment-storage.ts`**
   - Remove any comments about variety-storage
   - Remove migration code from previous phases (once #11 confirmed working)

2. **`CLAUDE.md` project documentation**
   - Update "State Management" section to remove mention of separate variety storage
   - Update data model description
   - Update any architectural diagrams

3. **`docs/adrs/`** - potentially create ADR for unified storage completion

4. **Test files** - remove any mocks/stubs for variety-storage

### Optional Improvements (Out of Scope for Core Task)

- Create new ADR documenting why unified storage was chosen
- Add performance documentation showing consolidated storage is more efficient
- Create migration guide for anyone running custom code against old storage

## Testing Requirements

1. Unit tests
   - No tests for removed functionality needed
   - Verify existing tests all pass

2. E2E tests
   - Variety tracking still works correctly
   - Seed status filtering works
   - All variety features function normally

3. Type checking
   - `npm run type-check` passes with no errors
   - No unused imports or variables

4. Linting
   - `npm run lint` passes
   - No dead code warnings

## Dependencies

- Requires #9 (storage removed)
- Requires #10 (sync removed)
- Requires #11 (migration complete and validated)
- No dependencies on other work
