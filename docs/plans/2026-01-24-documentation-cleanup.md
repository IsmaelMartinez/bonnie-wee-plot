# Documentation Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clean up, consolidate, and reorganize project documentation to ensure relevance and accuracy.

**Architecture:** Audit all docs, remove obsolete content, consolidate where beneficial, split README into focused files, add GH Pages link.

**Tech Stack:** Markdown, GitHub

---

## Parallelization Strategy

Tasks can be executed by subagents in parallel as follows:

| Wave | Tasks | Model | Rationale |
|------|-------|-------|-----------|
| Wave 1 | T1, T2, T3 | haiku | Simple deletions, no dependencies |
| Wave 2 | T4, T5, T7 | haiku | Independent edits/reviews |
| Wave 3 | T6 | sonnet | Requires content creation (CONTRIBUTING.md) |
| Wave 4 | T8, T9 | haiku | Final verification and GH issue creation |

**Dependency Graph:**
```
T1 ─┐
T2 ─┼─→ T8 (verify links after deletions)
T3 ─┘
T4 ───→ (independent)
T5 ───→ (independent)
T6 ───→ (independent, but larger)
T7 ───→ (independent)
T9 ───→ (can run anytime, creates GH issues)
```

---

## GitHub Issues to Create

### Issue #1: Remove obsolete tasks/ directory
**Labels:** `documentation`, `cleanup`
**Body:**
```
The `tasks/` directory contains obsolete planning artifacts from completed work:
- `plant-data-parallel-plan.md` - plant data validation complete
- `plant-data-status.md` - plant data validation complete
- `plant-data-validation.md` - plant data validation complete
- `prd-drag-drop-plot-planner.md` - drag-drop implemented

Delete the entire directory.
```

### Issue #2: Remove obsolete .github planning docs
**Labels:** `documentation`, `cleanup`
**Body:**
```
The variety management refactor (PR #47) is complete. Remove planning artifacts:
- `.github/VARIETY_MANAGEMENT_REFACTOR.md`
- `.github/ISSUE_SPECS_SUMMARY.md`
- `.github/ISSUE_TEMPLATE/` directory
- `ISSUE_CREATION_SUMMARY.txt` (root)
```

### Issue #3: Clean up research documents
**Labels:** `documentation`, `cleanup`
**Body:**
```
Remove obsolete research docs:
- `docs/research/phase-1-implementation-estimate.md` - duplicates quick-reference
- `docs/research/project-rebrand-research.md` - rebrand complete

Update `docs/research/pre-production-strategic-plan.md` with completion status for Phases 0-5.
```

### Issue #4: Create CONTRIBUTING.md
**Labels:** `documentation`, `enhancement`
**Body:**
```
Extract contribution guidelines from README.md into dedicated CONTRIBUTING.md:
- Getting started
- Development workflow
- Code style guidelines
- Testing instructions
- PR process

Update README.md to link to CONTRIBUTING.md instead of inline instructions.
```

### Issue #5: Add GitHub Pages link to README
**Labels:** `documentation`, `enhancement`
**Body:**
```
Add a prominent link to the live GitHub Pages deployment near the top of README.md.

Format: `**Try it now:** [Bonnie Wee Plot](https://username.github.io/bonnie-wee-plot)`
```

### Issue #6: Fix CREDITS.md version reference
**Labels:** `documentation`, `bug`
**Body:**
```
CREDITS.md line 17 references "Next.js 14" but the project uses Next.js 15.

Update to "Next.js 15".
```

---

## Task 1: Delete tasks/ Directory

**Model:** haiku (simple deletion)
**Parallel:** Wave 1 (with T2, T3)

**Files:**
- Delete: `tasks/plant-data-parallel-plan.md`
- Delete: `tasks/plant-data-status.md`
- Delete: `tasks/plant-data-validation.md`
- Delete: `tasks/prd-drag-drop-plot-planner.md`
- Delete: `tasks/` directory

**Step 1: Delete task files**
```bash
rm -rf tasks/
```

**Step 2: Commit**
```bash
git add -A && git commit -m "chore: remove obsolete tasks/ directory"
```

---

## Task 2: Delete Root Planning Artifacts

**Model:** haiku (simple deletion)
**Parallel:** Wave 1 (with T1, T3)

**Files:**
- Delete: `ISSUE_CREATION_SUMMARY.txt`

**Step 1: Delete file**
```bash
rm ISSUE_CREATION_SUMMARY.txt
```

**Step 2: Commit**
```bash
git add -A && git commit -m "chore: remove ISSUE_CREATION_SUMMARY.txt"
```

---

## Task 3: Delete .github/ Planning Artifacts

**Model:** haiku (simple deletion)
**Parallel:** Wave 1 (with T1, T2)

**Files:**
- Delete: `.github/VARIETY_MANAGEMENT_REFACTOR.md`
- Delete: `.github/ISSUE_SPECS_SUMMARY.md`
- Delete: `.github/ISSUE_TEMPLATE/` directory

**Step 1: Delete files**
```bash
rm -f .github/VARIETY_MANAGEMENT_REFACTOR.md .github/ISSUE_SPECS_SUMMARY.md
rm -rf .github/ISSUE_TEMPLATE/
```

**Step 2: Commit**
```bash
git add -A && git commit -m "chore: remove obsolete variety refactor planning docs"
```

---

## Task 4: Clean Up Research Documents

**Model:** haiku (simple edits)
**Parallel:** Wave 2 (with T5, T7)

**Files:**
- Delete: `docs/research/phase-1-implementation-estimate.md`
- Delete: `docs/research/project-rebrand-research.md`
- Modify: `docs/research/pre-production-strategic-plan.md`

**Step 1: Delete obsolete docs**
```bash
rm docs/research/phase-1-implementation-estimate.md
rm docs/research/project-rebrand-research.md
```

**Step 2: Update pre-production-strategic-plan.md**

Add after "## Executive Summary" section:

```markdown
## Status Update (January 2026)

Phases 0-5 have been completed. The app is deployed to GitHub Pages. Phases 6-8 (Authentication, Database, Multi-Provider AI) remain as future work contingent on user adoption.
```

**Step 3: Commit**
```bash
git add -A && git commit -m "docs: clean up obsolete research documents"
```

---

## Task 5: Review ADRs

**Model:** haiku (verification only)
**Parallel:** Wave 2 (with T4, T7)

All 19 ADRs reviewed - they are current and accurate.

| ADR | Status | Notes |
|-----|--------|-------|
| 001-011 | Accepted | Current |
| 012 | Proposed | External plant data - not yet implemented |
| 013-019 | Accepted | Current |

**Files:**
- No changes needed

**Step 1: Verify ADR index**
```bash
cat docs/adrs/README.md
```

Confirm all 19 ADRs listed with correct statuses.

**Step 2: No commit needed**

---

## Task 6: Create CONTRIBUTING.md and Update README

**Model:** sonnet (content creation required)
**Parallel:** Wave 3 (runs alone - larger task)

**Files:**
- Create: `CONTRIBUTING.md`
- Modify: `README.md`

**Step 1: Create CONTRIBUTING.md**

```markdown
# Contributing to Bonnie Wee Plot

We welcome contributions!

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/bonnie-wee-plot.git
   cd bonnie-wee-plot
   ```
3. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
4. Start development:
   ```bash
   npm run dev
   ```

## Development Workflow

### Before Making Changes

- Run `npm run lint` to check code style
- Run `npm run type-check` to verify TypeScript
- Read `CLAUDE.md` for architecture context

### Making Changes

1. Create a feature branch
2. Follow existing code style
3. Run tests: `npm run test:all`
4. Commit with descriptive message

### Pull Requests

1. Ensure all tests pass
2. Update docs if needed
3. Submit PR with clear description

## Code Style

- TypeScript strict mode
- Tailwind CSS for styling
- Server Components where possible
- `'use client'` only when needed

## Testing

- Unit tests: `npm run test:unit`
- E2E tests: `npm run test`
- Both: `npm run test:all`

## Questions?

Open an issue for help or questions.
```

**Step 2: Update README.md**

Replace lines 178-185 (contribution section) with:
```markdown
## Want to Help?

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.
```

**Step 3: Add GH Pages link after line 5**

Add after welcome paragraph:
```markdown
**Try it now:** [Bonnie Wee Plot on GitHub Pages](https://yourusername.github.io/bonnie-wee-plot)
```

**Step 4: Commit**
```bash
git add -A && git commit -m "docs: create CONTRIBUTING.md, add GH Pages link to README"
```

---

## Task 7: Miscellaneous Cleanup

**Model:** haiku (simple edits)
**Parallel:** Wave 2 (with T4, T5)

**Files:**
- Delete: `docs/architecture/` (empty directory)
- Modify: `CREDITS.md` (fix Next.js version)

**Step 1: Remove empty directory**
```bash
rmdir docs/architecture 2>/dev/null || true
```

**Step 2: Update CREDITS.md line 17**

Change `Next.js 14` to `Next.js 15`

**Step 3: Commit**
```bash
git add -A && git commit -m "docs: fix Next.js version in CREDITS.md"
```

---

## Task 8: Verify CLAUDE.md Links

**Model:** haiku (verification)
**Parallel:** Wave 4 (after deletions complete)

**Files:**
- Verify: `CLAUDE.md`

**Step 1: Check ADR references exist**
```bash
ls docs/adrs/018-variety-refactor.md docs/adrs/019-per-year-grid-positions.md
```

Both files exist. No changes needed.

---

## Task 9: Create GitHub Issues

**Model:** haiku (gh CLI commands)
**Parallel:** Wave 4 (can run independently)

**Step 1: Create issues**

```bash
gh issue create --title "Remove obsolete tasks/ directory" \
  --body "The tasks/ directory contains obsolete planning artifacts. Delete entire directory." \
  --label "documentation"

gh issue create --title "Remove obsolete .github planning docs" \
  --body "Variety management refactor (PR #47) complete. Remove planning artifacts from .github/" \
  --label "documentation"

gh issue create --title "Clean up research documents" \
  --body "Remove phase-1-implementation-estimate.md and project-rebrand-research.md. Update pre-production-strategic-plan.md with completion status." \
  --label "documentation"

gh issue create --title "Create CONTRIBUTING.md" \
  --body "Extract contribution guidelines from README into dedicated CONTRIBUTING.md" \
  --label "documentation,enhancement"

gh issue create --title "Add GitHub Pages link to README" \
  --body "Add prominent link to live deployment near top of README" \
  --label "documentation"

gh issue create --title "Fix Next.js version in CREDITS.md" \
  --body "Update line 17 from Next.js 14 to Next.js 15" \
  --label "documentation,bug"
```

---

## Summary

**Deleted (8 items):**
- `tasks/` directory (4 files)
- `ISSUE_CREATION_SUMMARY.txt`
- `.github/VARIETY_MANAGEMENT_REFACTOR.md`
- `.github/ISSUE_SPECS_SUMMARY.md`
- `.github/ISSUE_TEMPLATE/`
- `docs/research/phase-1-implementation-estimate.md`
- `docs/research/project-rebrand-research.md`
- `docs/architecture/` (empty)

**Created (1 item):**
- `CONTRIBUTING.md`

**Modified (3 items):**
- `README.md`
- `docs/research/pre-production-strategic-plan.md`
- `CREDITS.md`

**GitHub Issues Created:** 6

**Parallel Execution:**
- Wave 1: T1, T2, T3 (haiku x3) - deletions
- Wave 2: T4, T5, T7 (haiku x3) - edits/reviews
- Wave 3: T6 (sonnet x1) - content creation
- Wave 4: T8, T9 (haiku x2) - verification/issues
