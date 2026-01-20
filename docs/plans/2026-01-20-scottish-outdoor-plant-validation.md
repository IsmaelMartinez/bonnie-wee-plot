# Scottish Outdoor Plant Validation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove greenhouse-requiring plants from the database and clean up orphaned companion references for a Scottish outdoor-only growing app.

**Architecture:** Remove 8 plants (basil, pepper, aubergine, tomato, beefsteak-tomato, cucumber, luffa, outdoor-melon) from both the index and database, then clean up all companion/avoid references to these removed plants. Keep cold-hardy outdoor tomatoes (cherry-tomato, blight-resistant-tomato).

**Tech Stack:** TypeScript, Vitest tests

---

## Task 1: Update Tests for New Plant List

**Files:**
- Modify: `src/__tests__/lib/plant-data-integrity.test.ts:54`
- Modify: `src/__tests__/lib/plant-data-integrity.test.ts:134-143`
- Modify: `src/__tests__/lib/vegetable-database.test.ts:44`

**Step 1: Update the critical companion pairs test**

Change line 54 from `['tomato', 'potato', 'bad']` to `['cherry-tomato', 'potato', 'bad']` since we're removing the generic tomato.

**Step 2: Update the common vegetables test**

Change line 44 in vegetable-database.test.ts from:
```typescript
const commonVegs = ['carrot', 'potato', 'onion', 'lettuce', 'peas', 'tomato']
```
to:
```typescript
const commonVegs = ['carrot', 'potato', 'onion', 'lettuce', 'peas', 'cherry-tomato']
```

**Step 3: Adjust expected plant count range**

Lines 134-143: The current range is 190-220. After removing 8 plants from ~210, update to 180-215 to accommodate the removal.

**Step 4: Run tests to verify they still pass before removals**

Run: `npm run test:unit -- src/__tests__/lib/plant-data-integrity.test.ts src/__tests__/lib/vegetable-database.test.ts`

**Step 5: Commit**

```bash
git add src/__tests__/lib/plant-data-integrity.test.ts src/__tests__/lib/vegetable-database.test.ts
git commit -m "test: adjust plant tests for greenhouse plant removal"
```

---

## Task 2: Update Companion Normalization

**Files:**
- Modify: `src/lib/companion-normalization.ts:36`

**Step 1: Remove Cucumber from CATEGORY_EXPANSIONS**

Change line 36 from:
```typescript
'Cucurbits': ['Pumpkin', 'Squash', 'Courgette', 'Cucumber'],
```
to:
```typescript
'Cucurbits': ['Pumpkin', 'Squash', 'Courgette'],
```

**Step 2: Run companion normalization tests**

Run: `npm run test:unit -- src/__tests__/lib/companion-normalization.test.ts`

**Step 3: Commit**

```bash
git add src/lib/companion-normalization.ts
git commit -m "fix: remove cucumber from cucurbits category expansion"
```

---

## Task 3: Remove Greenhouse Plants from Index

**Files:**
- Modify: `src/lib/vegetables/index.ts`

**Step 1: Remove these 8 entries from vegetableIndex array**

Remove entries with these IDs:
- `basil`
- `pepper`
- `aubergine`
- `tomato`
- `beefsteak-tomato`
- `cucumber`
- `luffa`
- `outdoor-melon`

Search for each ID and remove the entire object `{ id: '...', name: '...', category: '...' },`

**Step 2: Verify index still exports correctly**

Run: `npm run type-check`

**Step 3: Commit**

```bash
git add src/lib/vegetables/index.ts
git commit -m "feat: remove greenhouse plants from index"
```

---

## Task 4: Remove Greenhouse Plants from Database

**Files:**
- Modify: `src/lib/vegetable-database.ts`

**Step 1: Remove the 8 plant definitions**

Search for each ID and remove the entire plant object from the `vegetables` array:
- `id: 'basil'`
- `id: 'pepper'`
- `id: 'aubergine'`
- `id: 'tomato'`
- `id: 'beefsteak-tomato'`
- `id: 'cucumber'`
- `id: 'luffa'`
- `id: 'outdoor-melon'`

Each plant object spans roughly 40-60 lines. Remove from the opening `{` to the closing `},`.

**Step 2: Run type-check and basic tests**

Run: `npm run type-check && npm run test:unit -- src/__tests__/lib/vegetable-database.test.ts`

**Step 3: Commit**

```bash
git add src/lib/vegetable-database.ts
git commit -m "feat: remove 8 greenhouse-requiring plants from database"
```

---

## Task 5: Clean Up Companion References (Name-Based)

**Files:**
- Modify: `src/lib/vegetable-database.ts`

**Step 1: Search and remove 'Tomato' from companionPlants arrays**

Search for `'Tomato'` in companionPlants arrays throughout the file. Remove each occurrence from the array. Estimate: 50+ occurrences.

**Step 2: Search and remove 'Cucumber' from companionPlants arrays**

Search for `'Cucumber'` in companionPlants arrays. Remove each occurrence. Estimate: 15+ occurrences.

**Step 3: Search and remove 'Pepper' from companionPlants arrays**

Search for `'Pepper'` - found in tomatillo's companions. Remove.

**Step 4: Search and remove 'Basil' from companionPlants arrays**

Search for `'Basil'` in companionPlants - likely only in tomato (already removed).

**Step 5: Repeat for avoidPlants arrays**

Search for 'Tomato', 'Cucumber', 'Pepper', 'Basil' in avoidPlants arrays and remove.

**Step 6: Run tests**

Run: `npm run test:unit -- src/__tests__/lib/plant-data-integrity.test.ts`

**Step 7: Commit**

```bash
git add src/lib/vegetable-database.ts
git commit -m "fix: remove name-based companion refs to deleted plants"
```

---

## Task 6: Clean Up Enhanced Companion References (ID-Based)

**Files:**
- Modify: `src/lib/vegetable-database.ts`

**Step 1: Search and remove enhancedCompanions entries with plantId: 'tomato'**

Search for `plantId: 'tomato'` within enhancedCompanions arrays. Remove the entire object `{ plantId: 'tomato', ... },`. Estimate: 50+ occurrences.

**Step 2: Search and remove enhancedCompanions entries with plantId: 'cucumber'**

Search for `plantId: 'cucumber'`. Remove each object.

**Step 3: Search and remove enhancedCompanions entries with plantId: 'pepper'**

Search for `plantId: 'pepper'`. Remove each object.

**Step 4: Repeat for enhancedAvoid arrays**

Search for `plantId: 'tomato'`, `plantId: 'cucumber'`, `plantId: 'pepper'` in enhancedAvoid arrays and remove.

**Step 5: Run all plant data tests**

Run: `npm run test:unit`

**Step 6: Commit**

```bash
git add src/lib/vegetable-database.ts
git commit -m "fix: remove ID-based enhanced companion refs to deleted plants"
```

---

## Task 7: Final Verification

**Step 1: Run full unit test suite**

Run: `npm run test:unit`
Expected: All tests pass

**Step 2: Run type checking**

Run: `npm run type-check`
Expected: No type errors

**Step 3: Run E2E tests**

Run: `npm run test`
Expected: All Playwright tests pass

**Step 4: Verify plant counts**

The index and database should both have the same count, approximately 202-205 plants (down from ~210).

**Step 5: Verify no orphaned companion references**

The plant-data-integrity tests check this automatically.

**Step 6: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: final cleanup for scottish outdoor plant validation"
```

---

## Verification Summary

After all tasks complete, verify:
1. `npm run test:unit` passes (all unit tests)
2. `npm run test` passes (all E2E tests)
3. `npm run type-check` passes (no type errors)
4. Index and database have same plant count
5. No references to removed plant IDs remain in companion arrays

## Plants Removed (8 total)

| ID | Name | Reason |
|----|------|--------|
| basil | Basil | "Grow under cover in Scotland - needs warmth" |
| pepper | Pepper | "Require greenhouse or polytunnel in Scotland" |
| aubergine | Aubergine | "Best in greenhouse or polytunnel" |
| tomato | Tomato | "Best under cover in Scotland" |
| beefsteak-tomato | Beefsteak Tomato | "Best in greenhouse or polytunnel" |
| cucumber | Cucumber | "Best under cover in Scotland" |
| luffa | Luffa | "Needs polytunnel in Scotland" |
| outdoor-melon | Outdoor Melon | "Needs cloche or polytunnel" (name contradicts requirement) |

## Plants Kept (Cold-Hardy Outdoor Tomatoes)

| ID | Name | Reason |
|----|------|--------|
| cherry-tomato | Cherry Tomato | "More reliable outdoors in Scotland than large varieties" |
| blight-resistant-tomato | Blight-Resistant Tomato | "Can grow outdoors in wet Scottish weather" |
