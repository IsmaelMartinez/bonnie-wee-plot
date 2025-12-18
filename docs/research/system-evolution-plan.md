# System Evolution & Architecture Research: "Community Allotment 2.0"

## 1. Executive Summary

This document summarizes the findings from a 10-iteration simulated debate between Engineering (Staff/SRE/Security) and Product. The goal was to evolve the current "Community Allotment" prototype (a client-side, local-storage-based Next.js app) into a production-ready, scalable, and secure platform.

**Key Outcome:** The team reached consensus on a **"Local-First, Cloud-Synced PWA"** architecture. This preserves the "free and open" spirit (users own their data/keys) while enabling requested features like cross-device sync and offline usage in the garden.

## 2. Simulation Methodology

We simulated a series of 10 architectural review meetings ("iterations") involving four personas:
*   **Staff Engineer**: Focused on code quality, scalability, and technical debt.
*   **SRE**: Focused on reliability, observability, and infrastructure costs.
*   **Security Engineer**: Focused on data privacy, API key handling, and vulnerability management.
*   **Product Manager**: Focused on user retention, mobile experience, and community features.

Each iteration fed into the next, refining the architecture from a simple prototype to a mature system.

---

## 3. The Debate: 10 Iterations of Evolution

### Iteration 1: The "Persistence" Crisis
*   **Trigger**: PM reports users losing data when clearing browser cache or switching devices.
*   **Critique**:
    *   **Staff**: `localStorage` (ADR 002) is brittle and monolithic. Loading the entire JSON blob is O(n) and unscalable.
    *   **SRE**: No visibility into data loss. "It works on my machine" is the only metric we have.
    *   **Security**: `localStorage` is vulnerable to XSS. Storing OpenAI keys there is high risk.
*   **Decision**: We must move beyond pure `localStorage`.

### Iteration 2: The Backend Dilemma
*   **Proposal**: Staff suggests a full Postgres DB.
*   **Pushback**:
    *   **SRE**: "I am not managing a Postgres cluster for a free community app."
    *   **PM**: We can't afford high hosting costs.
*   **Decision**: Adopt a **Backend-as-a-Service (BaaS)** model. **Supabase** (Postgres + Auth) is selected for its generous free tier and open-source nature.

### Iteration 3: The "Sync" Strategy
*   **Conflict**: How to handle existing data?
*   **Staff**: "Local-First" architecture. The app should work offline (in the allotment) and sync when back on Wi-Fi.
*   **SRE**: Complex conflict resolution needed?
*   **Decision**: **Optimistic UI with "Last-Write-Wins"** for V1. The definitive state lives in the cloud, but the local cache allows offline work.

### Iteration 4: The "Bring Your Own Key" (BYOK) Security Review
*   **Critique**: Security Engineer flags `x-openai-token` header and client-side key storage.
*   **Debate**:
    *   **PM**: We can't pay for everyone's AI usage. BYOK is essential for the business model.
    *   **Security**: If we sync data, do we sync API keys? **ABSOLUTELY NOT**.
*   **Decision**:
    *   API Keys remain **device-local only**. They are never synced to the cloud DB.
    *   Keys are encrypted in `localStorage` using a user-derived salt (if Auth is implemented) or at least obfuscated.

### Iteration 5: Mobile & Offline Experience
*   **Trigger**: PM notes 80% of usage is in the garden (mobile).
*   **Staff**: The current Drag-and-Drop planner is unusable on touch screens.
*   **SRE**: Next.js App Router is heavy on poor 4G connections.
*   **Decision**:
    *   Convert to **Progressive Web App (PWA)** for installability.
    *   Implement `next-pwa` for aggressive asset caching.
    *   Redesign Planner for "Tap-to-Select, Tap-to-Place" interaction on mobile (replacing drag-and-drop).

### Iteration 6: Performance Optimization
*   **Observation**: SRE notes the `GardenPlanner` component re-renders the entire grid on every cell change.
*   **Staff**: The `GardenPlannerData` context is too coarse.
*   **Decision**:
    *   Refactor state management to use **Zustand** or **Jotai** for atomic updates.
    *   Implement virtualization for the grid if plots exceed 10x10.

### Iteration 7: Image Handling & Cost
*   **Trigger**: Users uploading 10MB photos for AI diagnosis.
*   **SRE**: Bandwidth costs (if we proxy) or Latency (if users send directly).
*   **Staff**: Resize images on the client (browser canvas) before sending to API.
*   **Decision**: Client-side image compression (max 1024px, 70% quality) implemented in `src/app/api/ai-advisor/route.ts` consumers.

### Iteration 8: Accessibility (a11y)
*   **Audit**: Security/Compliance notes the app is effectively unusable for screen reader users.
*   **Staff**: The Grid is a `div` soup.
*   **Decision**:
    *   Implement `ARIA` grid roles.
    *   Ensure all planner actions are keyboard accessible (Space to pick up, Arrows to move, Enter to drop).

### Iteration 9: Testing & Reliability
*   **Critique**: SRE refuses to deploy without better coverage. "One Playwright test is not a suite."
*   **Decision**:
    *   **Unit Tests**: 80% coverage for `src/lib/` (logic).
    *   **Integration**: Mocked AI responses for Advisor tests.
    *   **E2E**: Critical flows (Create Plan -> Add Veg -> Save) running on CI.

### Iteration 10: The Roadmap Agreement
*   **Consensus**: The team agrees on the implementation order.
*   **Final Plan**: See Section 4.

---

## 4. Strategic Roadmap & Priorities

### Phase 1: hardening (Immediate)
1.  **Refactor**: Split `GardenPlannerData` into atomic state (Fixes: Performance).
2.  **Test**: Add unit tests for `vegetable-database.ts` and `companion-validation.ts`.
3.  **Security**: Implement client-side key encryption.

### Phase 2: The Mobile Shift (Next Month)
1.  **PWA**: Add `manifest.json` and Service Workers.
2.  **Touch UI**: Implement "Click-Plot" mode for mobile users.
3.  **Image Opt**: Client-side resizing for AI Analysis.

### Phase 3: Connected Garden (Quarterly Goal)
1.  **Backend**: Set up Supabase project.
2.  **Auth**: Implement Email/Magic Link auth.
3.  **Sync**: Build the "Local-First" sync engine (using `crdt` or simple timestamp merging).

## 5. Architectural Decision Records (ADRs) to Update

*   **ADR-002 (Data Persistence)**: DEPRECATE `localStorage` as sole source. Move to "Local-First + Cloud Sync".
*   **ADR-004 (No Database)**: REVOKE. Adopt Supabase.
*   **New ADR-011**: "Client-Side Image Optimization Strategy".


