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

## Week 1: Foundation

### Track A: Audit Completion (4-5 days)
- [x] Allotment page UX review (verify PlantingDialog improvements)
- [x] Dead code search (beyond completed items) - Findings documented in architecture audit
- [x] Dependency audit (`npm audit`, unused packages) - 0 vulnerabilities, no unused prod deps
- [x] AI Advisor decision: document choice to extend with function calling (ADR 022)
- [ ] Mark architecture audit complete

### Track B: AI Inventory Start (2-3 days)
- [ ] Create `src/lib/ai-tools-schema.ts` with PLANTING_TOOLS
- [ ] Update AI advisor route to accept tools parameter (feature-flagged off)
- [ ] Unit tests for tool schema validation

### Track C: Documentation (1-2 days)
- [ ] Draft getting-started guide outline
- [ ] Create `docs/sessions/` directory structure
- [ ] Add `docs/sessions/CURRENT.md` to .gitignore

---

## Week 2: AI Inventory MVP

### Track B: Core Implementation (5 days)
- [ ] Implement `src/services/ai-tool-executor.ts`
  - [ ] add_planting operation
  - [ ] update_planting operation
  - [ ] remove_planting operation
  - [ ] list_areas operation
- [ ] Create `src/components/ai-advisor/ToolCallConfirmation.tsx`
- [ ] Integrate confirmation flow into AI advisor page
- [ ] Unit tests for tool executor
- [ ] E2E test for add planting via chat

### Track A: Progressive Disclosure Groundwork
- [ ] Create `src/lib/feature-flags.ts` with gating infrastructure
- [ ] Add engagement tracking (visit count, planting count) to storage

### Track C: Blog Draft
- [ ] Write first draft of launch blog post
- [ ] Review and prune obsolete research documents

---

## Week 3: Progressive Disclosure Core

### Navigation & Gating (5 days)
- [ ] Simplify navigation to 3 primary items (Today, This Month, Seeds)
- [ ] Implement unlock logic based on engagement
- [ ] Add unlock CTAs to hidden features
- [ ] Hide AI Advisor, Compost, Allotment Layout initially
- [ ] Create basic onboarding wizard (3 screens)
  - [ ] Welcome with three paths (explore/plan/ask)
  - [ ] First meaningful action guidance
  - [ ] Success confirmation

### Track B: AI Inventory Polish
- [ ] Batch operations support (multiple plantings in one message)
- [ ] Improved error messages with suggestions
- [ ] Loading states for tool execution

---

## Week 4: Polish & Launch Prep

### Progressive Disclosure Polish (3 days)
- [ ] Unlock celebration modals (educational, not gamified)
- [ ] Progress indicators and feature teasers
- [ ] E2E testing of unlock flows

### Quality & Launch (2 days)
- [ ] Full test suite pass (unit + E2E)
- [ ] Accessibility regression check
- [ ] Analytics integration (simple event tracking)
- [ ] Bug fixes and refinement
- [ ] Publish documentation

---

## Success Criteria

- [~] Architecture audit 100% complete (Track A items done, pending dead code cleanup PR)
- [ ] AI Inventory: Users can add/update/remove plantings via chat
- [ ] Progressive Disclosure: New users see 3-item nav with unlock paths
- [ ] Onboarding: Welcome experience guides users to first meaningful action
- [ ] Quality: All tests passing, no accessibility regressions
- [ ] Documentation: Getting started guide published

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

**Status:** 🟢 Ready to Execute
**Owner:** Ismael + Claude
**Review:** End of each week
