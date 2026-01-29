# Acceleration Plan: Production Readiness Sprint

**Date:** January 28, 2026
**Duration:** 4 weeks
**Goal:** Ship Progressive Disclosure, AI Inventory, and Onboarding while preparing for P2P sync

---

## Strategic Decisions

### P2P Sync Timing: Option B (Ship Value First)
Build Progressive Disclosure and AI Inventory on current localStorage stack. P2P sync comes after the 4-week sprint validates core UX. The "mobile as server" insight simplifies P2P significantly, but shipping user value takes priority.

### Parallelization Strategy
Three independent tracks run simultaneously:
- Track A: Architecture Audit completion (blocks Progressive Disclosure)
- Track B: AI Inventory MVP (independent, immediate value)
- Track C: Documentation and onboarding design (gap work)

---

## Week 1: Foundation ✅

### Track A: Audit Completion (4-5 days)
- [x] Allotment page UX review (verify PlantingDialog improvements)
- [x] Dead code search (beyond completed items) - Findings documented in architecture audit
- [x] Dependency audit (`npm audit`, unused packages) - 0 vulnerabilities, no unused prod deps
- [x] AI Advisor decision: document choice to extend with function calling (ADR 022)
- [x] Mark architecture audit complete

### Track B: AI Inventory Start (2-3 days)
- [x] Create `src/lib/ai-tools-schema.ts` with PLANTING_TOOLS
- [x] Update AI advisor route to accept tools parameter (feature-flagged off)
- [x] Unit tests for tool schema validation

### Track C: Documentation (1-2 days)
- [x] Draft getting-started guide outline
- [x] Create `docs/sessions/` directory structure
- [x] Add `docs/sessions/CURRENT.md` to .gitignore

---

## Week 2: AI Inventory MVP ✅

### Track B: Core Implementation (5 days)
- [x] Implement `src/services/ai-tool-executor.ts`
  - [x] add_planting operation
  - [x] update_planting operation
  - [x] remove_planting operation
  - [x] list_areas operation
- [x] Create `src/components/ai-advisor/ToolCallConfirmation.tsx`
- [x] Integrate confirmation flow into AI advisor page
- [x] Unit tests for tool executor
- [x] E2E test for add planting via chat

### Track A: Progressive Disclosure Groundwork
- [x] Create `src/lib/feature-flags.ts` with gating infrastructure
- [x] Add engagement tracking (visit count, planting count) to storage

### Track C: Blog Draft
- [ ] Write first draft of launch blog post
- [x] Review and prune obsolete research documents

---

## Week 3: Progressive Disclosure Core ✅

### Navigation & Gating (5 days)
- [x] Simplify navigation to 3 primary items (Today, This Month, Seeds) - PR #92
- [x] Implement unlock logic based on engagement - PR #92
- [x] Add unlock CTAs to hidden features - PR #92
- [x] Hide AI Advisor, Compost, Allotment Layout initially - PR #92
- [x] Create basic onboarding wizard (3 screens) - PR #91
  - [x] Welcome with three paths (explore/plan/ask)
  - [x] First meaningful action guidance
  - [x] Success confirmation

### Track B: AI Inventory Polish
- [x] Batch operations support (multiple plantings in one message)
- [x] Improved error messages with suggestions - PR #93
- [x] Loading states for tool execution - PR #93
- [x] Area name resolution (use names instead of IDs) - PR #94, #95

---

## Week 4: Polish & Launch Prep ✅

### Progressive Disclosure Polish (3 days)
- [x] Unlock celebration modals (educational, not gamified) - PR #97
- [x] Progress indicators and feature teasers - PR #91
- [x] E2E testing of unlock flows - PR #99

### Quality & Launch (2 days)
- [x] Full test suite pass (unit + E2E) - All 150 tests passing
- [ ] Accessibility regression check
- [x] Analytics integration (simple event tracking) - PR #96
- [ ] Bug fixes and refinement
- [x] Publish documentation - PR #98

---

## Success Criteria

- [x] Architecture audit 100% complete
- [x] AI Inventory: Users can add/update/remove plantings via chat (PRs #87, #89, #90, #93-95)
- [x] Progressive Disclosure: New users see 3-item nav with unlock paths (PR #92)
- [x] Onboarding: Welcome experience guides users to first meaningful action (PR #91)
- [x] Quality: All tests passing (150 E2E + unit tests)
- [x] Documentation: Getting started guide published (PR #98)

### Remaining Items
- [ ] Accessibility regression check
- [ ] Write launch blog post
- [ ] Final bug fixes and refinement

---

## Deferred to Post-Sprint

### P2P Sync (3-4 weeks after sprint)
- Yjs CRDT integration
- QR code pairing with security model
- Mobile as always-on server
- Device identity and encryption

### Other Deferred Items
- Authentication (Clerk) - Phase 6
- Database (Supabase) - Phase 7
- Multi-provider AI - Phase 8
- Advanced AI features (photo import, voice)

---

## P2P Security Model (Reference)

### QR Pairing Flow
1. Phone displays QR (public key + 6-digit code shown separately)
2. Laptop scans, displays same code for verbal verification
3. Laptop sends encrypted public key + code back
4. Phone verifies code match before accepting

### Encryption Stack
- Ed25519 keypairs for device identity
- X25519 key agreement for session encryption
- XSalsa20-Poly1305 for messages (tweetnacl)
- Monotonic nonces, session rekeying every 24h/1000 messages

### Device Loss
- "Report Lost" from any paired device revokes compromised device
- Periodic encrypted backup export recommended

---

## Claude Workflow

### Session Handoffs
Use `docs/sessions/CURRENT.md` (gitignored) to capture:
- Last session summary (2-3 sentences)
- Files modified
- Next steps (ordered)
- Open questions
- Context needed for resumption

### Parallel Sessions
```bash
git worktree add ../community-allotment--feature-name -b feature/name
```
Each worktree has own CURRENT.md. Feature decisions go in committed `docs/sessions/feature-*.md`.

### What Goes Where
| Type | Location | Lifespan |
|------|----------|----------|
| Session state | docs/sessions/CURRENT.md | Until resumed |
| Feature decisions | docs/sessions/feature-*.md | Until merged |
| Reusable patterns | CLAUDE.md | Permanent |
| Architecture decisions | docs/adrs/*.md | Permanent |

---

## Onboarding Design

### Three Entry Paths
- **Path A:** "Show me what to grow" → This Month (lowest friction)
- **Path B:** "I have a plot to plan" → Allotment wizard
- **Path C:** "I just want to ask" → AI Advisor

### Aha Moments to Design For
1. Scottish-specific intelligence (local conditions, not generic)
2. Connected data (plantings → calendar with dates)
3. Year-over-year memory (history informs recommendations)
4. Companion suggestions (add tomatoes → suggest basil)

### Unlock Conditions (Refined)
- AI Advisor: Immediately accessible, promoted contextually
- Compost: 5 plantings OR first harvest recorded
- Allotment Layout: Available in simplified view mode, full editor unlocks with use

---

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing functionality | Every change in dedicated PR with full test run |
| AI function calling corrupts data | User confirmation required, undo capability planned |
| Progressive disclosure frustrates users | Low thresholds, clear teasers, unlock paths visible |
| Scope creep | Strict adherence to Phase 1 scope, defer extras |

---

## Files to Create/Modify

### New Files
- `src/lib/ai-tools-schema.ts` - Tool definitions
- `src/services/ai-tool-executor.ts` - Execution logic
- `src/components/ai-advisor/ToolCallConfirmation.tsx` - Confirmation UI
- `src/lib/feature-flags.ts` - Gating infrastructure
- `docs/sessions/CURRENT.md` - Session handoff (gitignored)
- `docs/user-guide/getting-started.md` - User documentation

### Modified Files
- `src/app/api/ai-advisor/route.ts` - Add tools support
- `src/hooks/useAllotment.ts` - Engagement tracking
- `src/services/allotment-storage.ts` - Feature unlock state
- `src/components/Navigation.tsx` - Progressive disclosure
- `.gitignore` - Add sessions/CURRENT.md

---

**Status:** 🎉 Nearly Complete - Core sprint goals achieved
**Owner:** Ismael + Claude
**Review:** End of each week

## Completed PRs (Week 4)
- PR #91: Progressive disclosure navigation
- PR #92: Feature flags and unlock system
- PR #93: AI tool polish
- PR #94: Area ID descriptions for AI tools
- PR #95: Area name-based lookups
- PR #96: Local analytics tracking
- PR #97: Unlock celebration modals
- PR #98: Documentation updates
- PR #99: E2E tests for onboarding and progressive disclosure
