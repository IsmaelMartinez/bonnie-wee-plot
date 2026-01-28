# Architecture Audit & Simplification Plan

**Date:** January 27, 2026
**Phase:** Pre-Phase 1 Launch
**Goal:** Clean up the codebase, remove technical debt and unused features, simplify overly complex sections, and ensure architecture can support progressive feature disclosure without excessive complexity

---

## Overview

We need to audit the entire codebase to:
1. Remove unused code, pages, and historical features
2. Simplify sections that are unnecessarily complex
3. Identify architectural patterns that might cause problems during Phase 1 rollout
4. Ensure the simplicity-first principle is applied throughout
5. Document decisions in ADRs for future reference

This is blocking Phase 1 launch—we can't hide features if the architecture is cluttered with unused code.

---

## Part 1: Codebase Audit

### 1.1 Pages & Routes Audit

**Action:** Find all routes in `src/app/` and categorize them

**Checklist:**
- [ ] `/` (homepage) - KEEP, VERIFY simplicity
- [ ] `/allotment` - KEEP, just audited via PlantingDialog work
- [ ] `/seeds` - KEEP, seed variety tracking
- [ ] `/this-month` - KEEP, seasonal view
- [ ] `/today` - KEEP, daily dashboard
- [ ] `/ai-advisor` - KEEP, but will be hidden in Phase 1
- [ ] `/compost` - POTENTIAL CANDIDATE FOR REMOVAL/SIMPLIFICATION
- [ ] `/about` - VERIFY needed
- [ ] Check for `/garden-planner` or other historical pages
- [ ] Check for unused API routes in `/api`

**Outcome:** List of pages to keep, simplify, or remove

### 1.2 Component Audit

**Action:** Review component folder structure

**Key Folders:**
- `src/components/garden-planner/` - AUDIT: Is GardenPlanner still used? (was this pre-unified design?)
- `src/components/allotment/` - Just audited, should be clean
- `src/components/ai-advisor/` - AUDIT: Is there cruft here?
- `src/components/ui/` - AUDIT: Are all shared components used?

**Per-component checklist:**
- [ ] No unused props
- [ ] No dead code branches
- [ ] No "just in case" features
- [ ] Components have a single clear purpose

### 1.3 Lib & Utilities Audit

**Action:** Check `src/lib/` for duplication and dead code

**Key Questions:**
- Are there redundant date utilities? (date-calculator.ts, planting-utils.ts)
- Are there competing state management patterns?
- Is there experimental code (e.g., old version of something)?
- Are there utility functions that are only called once or never called?

**Tools:**
- Search for function definitions vs. imports to find unused functions
- Look for TODO/FIXME/HACK comments indicating incomplete work

### 1.4 Types Audit

**Action:** Check `src/types/` for accumulated cruft

**Key Questions:**
- Are there deprecated types still in the codebase?
- Are there unused discriminators or fields in unions?
- Do types reflect the actual data model or historical iterations?

### 1.5 Hooks Audit

**Action:** Verify `src/hooks/` contains only necessary state logic

**Expected:**
- `useAllotment` - primary state management
- Any others? If yes, verify they're essential and not redundant with useAllotment

---

## Part 2: Complexity Assessment

### 2.1 Pages That Are Too Complex

**Hypothesis:** Some pages have too many features or responsibilities

**Pages to Audit:**
- **Compost page** - ✅ SIMPLIFIED (PR #73)
  - Removed: thermal status, temperature tracking, system-specific tips, stats dashboard, input type classification
  - Kept: pile management, basic event logging (turn/water/harvest), generic care tips
  - Decision: Simplified to ~605 lines. Still visible but may hide in Phase 1 progressive disclosure

- **This Month page** - ✅ IMPROVED HIERARCHY (PR #73)
  - Changed: Expert Tips and Tree Care sections now collapsible (default collapsed)
  - Removed: AI Advisor CTA (redundant with nav)
  - Kept: Personalized section at top, all other content
  - Decision: Improved visual hierarchy; ready for Phase 1

- **Seeds page** - User concern: Seed inventory might be confusing
  - Question: Is per-year inventory status needed? Or just "ordered/have/none"?
  - Question: How does it connect to plantings? Is the connection clear?
  - Decision: Verify UI clarity; consider removing advanced filtering if unused

- **AI Advisor page** - User concern: No context about modifying data
  - Question: Should Aitor be able to directly modify the allotment?
  - Current: Read-only (shows context), can't modify
  - Potential: Allow Aitor to add/edit plantings (see AI inventory research)
  - Decision: Decide whether to extend or keep read-only

### 2.2 Architecture Complexity Hotspots

**Areas to Review:**
- **State Management:** Is useAllotment hook simple enough or should we refactor?
- **Storage Service:** Is schema migration logic understandable? (14+ versions is a lot)
- **Date Calculations:** Are there too many edge cases in date-calculator.ts?
- **Type System:** Are discriminated unions being used correctly throughout?

---

## Part 3: Section-by-Section UX Review

After codebase audit, systematically review each section per the roadmap:

### Review Template for Each Section

**Section Name:**

**Current State:**
- What does this page/feature do?
- How complex is the code?
- How complex is the UI?

**User Impact:**
- What problem does it solve?
- Is it essential or "nice to have"?
- Do users actually use all features?

**Simplification Opportunities:**
- What can be removed?
- What can be hidden?
- What can be made clearer?

**Decision:**
- KEEP as-is
- KEEP but simplify (describe changes)
- HIDE (mark for Phase 2+)
- REMOVE (document why)

**Sections to Review:**
1. **Today** - Daily dashboard
2. **This Month** - Seasonal calendar
3. **Seeds** - Seed inventory & catalog
4. **Allotment** - Garden layout & plantings
5. **Compost** - Pile tracking
6. **AI Advisor** - Chat with context

---

## Part 4: Architecture Health Checks

### 4.1 Dead Code

**Action:** Systematically find and remove unused code

**Steps:**
1. Run TypeScript compiler with `noUnusedLocals` and `noUnusedParameters` (should be strict already)
2. Check git history for "commented out" code and remove it
3. Search for functions/components that are defined but never imported
4. Remove console.log/debug code

### 4.2 Duplication

**Action:** Find and consolidate duplicated patterns

**Common Areas:**
- Icon/color mapping (e.g., getPhaseIcon, getPhaseColors) - ALREADY FIXED in planting-utils
- Date formatting
- Validation logic
- Component patterns

### 4.3 Technical Debt Assessment

**Action:** Document what needs addressing before Phase 1

**Examples:**
- Schema migration complexity (v1-v14 is a lot to maintain)
- Storage service file size and comprehensibility
- Test coverage gaps
- Type safety issues

**Output:** Create follow-up ADRs or tech debt tickets for post-Phase-1

### 4.4 Dependencies Check

**Action:** Verify all npm dependencies are necessary

- Remove unused packages
- Check for duplicate functionality (e.g., do we need both library X and Y?)
- Check for security vulnerabilities (`npm audit`)

---

## Implementation Approach

### Phase A: Audit & Assessment (1-2 days)

1. Run codebase audit checklist (Part 1)
2. Identify dead code and complexity hotspots
3. Create inventory of findings
4. Document assumptions about what's safe to remove

### Phase B: Decision Making (1 day)

1. Review findings with user perspective
2. Decide keep/simplify/hide/remove for each item
3. Identify dependencies (does component X depend on feature Y that we're removing?)
4. Create detailed change list

### Phase C: Implementation (2-3 days)

1. Remove/simplify per decisions
2. Run full test suite after each major change
3. Update documentation
4. Create ADR documenting major changes

### Phase D: Verification (1 day)

1. Code review of all changes
2. Verify build still passes
3. Verify tests still pass
4. Verify no new bugs introduced

---

## Success Criteria

- [ ] All pages have clear, documented purpose
- [ ] No unused code, components, or routes
- [ ] Each page does one thing well (simplicity principle)
- [ ] Code is easier to understand and modify
- [ ] TypeScript is strict with no violations
- [ ] Test suite passes
- [ ] Build passes
- [ ] Ready for Phase 1 feature gating

---

## Risks & Mitigations

**Risk:** Removing code that's actually used
**Mitigation:** Search carefully, check git history, run tests thoroughly

**Risk:** Breaking dependencies between features
**Mitigation:** Document interdependencies before removing; test carefully

**Risk:** Over-simplifying removes user value
**Mitigation:** Make decisions based on actual usage patterns, not assumptions; hide rather than remove initially

**Risk:** This takes longer than planned
**Mitigation:** Prioritize: audit first, then fix critical issues, then polish

---

## Next Steps

1. **Review this plan** - Does it match your vision?
2. **Kick off Phase A** - Start with codebase audit
3. **Document findings** - Create inventory of current state
4. **Review decisions** - Verify keep/simplify/hide/remove choices
5. **Execute Phase C** - Implement changes
6. **Verify Phase D** - Ensure quality

---

**Status:** 🟡 In Progress
**Owner:** TBD
**Timeline:** Target completion by early February 2026 (before Phase 1 launch)

---

## Progress Tracker

### Completed
- [x] **Compost page simplification** (PR #73) - Replaced system-specific tips with generic care guidance, removed thermal status/temperature tracking
- [x] **This Month page hierarchy** (PR #73) - Collapsible Expert Tips and Tree Care sections, removed AI CTA
- [x] **Dead code: plan-history folder** (PR #72) - Removed unused RotationTimeline, SeasonView, Year2026Planning components
- [x] **check-temp type removal** (PR #73) - Removed unused event type from CompostEvent
- [x] **Bed conversion removal** (PR #78) - Removed non-working AreaTypeConverter component and all related code
- [x] **Seed status 'had' addition** (PR #79) - Added 'had' status for seeds, removed unused 'available' checkbox
- [x] **Today dashboard simplification** (PR #80) - Removed BedAlerts component (redundant with task list), added status filtering to task generator, made TaskList full-width
- [x] **Security scanning + Vercel migration** (PR #12) - Added CodeQL and Snyk scanning, migrated primary deployment to Vercel
- [x] **Documentation sync** (PR #82) - Updated Next.js version to 16, Vercel deployment links, seed status docs, fixed ADR numbering

### Pending UX Reviews (Part 3)
- [x] **Today** - Daily dashboard review (completed in PR #80)
- [ ] **Seeds** - Seed inventory & catalog review
- [ ] **Allotment** - Layout & plantings (recently improved with PlantingDialog)
- [ ] **AI Advisor** - Decide: keep read-only OR extend with function calling for data modification

### Pending Architecture Checks (Part 4)
- [ ] Dead code search (beyond what's been removed)
- [ ] Duplication check
- [ ] Technical debt assessment
- [ ] Dependencies check (`npm audit`, unused packages)
