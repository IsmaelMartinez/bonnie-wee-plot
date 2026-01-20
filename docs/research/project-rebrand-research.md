# Project Rebrand Research

Date: 2026-01-19

## Decision

Rebrand from "Community Allotment" / "Scottish Grow Guide" to "Bonnie Wee Plot" (Scottish: beautiful small plot).

## Previous Branding State

The codebase had a dual identity:
- Package name and GitHub repo used "community-allotment"
- UI and user-facing content used "Scottish Grow Guide"

This suggests a partial transition had already occurred.

## Files Updated

### Core Identity
- `package.json` - name: "bonnie-wee-plot", repository URL updated
- `README.md` - title and clone instructions
- `CLAUDE.md` - project overview

### App Metadata
- `src/app/manifest.ts` - name: "Bonnie Wee Plot", short_name: "Bonnie Plot"
- `src/app/layout.tsx` - title metadata and footer copyright
- `src/app/about/page.tsx` - header

### UI Components
- `src/components/ui/InstallPrompt.tsx` - install prompt text (iOS and standard)

### Configuration
- `next.config.mjs` - basePath: "/bonnie-wee-plot" for GitHub Pages
- `.github/workflows/deploy.yml` - NEXT_PUBLIC_BASE_PATH

### Documentation
- `.github/copilot-instructions.md` - title
- `AI_AITOR_SETUP.md` - API key naming example

### Architecture Decision Records
- `docs/adrs/README.md`
- `docs/adrs/001-nextjs-app-router.md`
- `docs/adrs/007-playwright-e2e-testing.md`
- `docs/adrs/013-pwa-serwist.md`
- `docs/adrs/014-observability-foundation.md`
- `docs/adrs/015-accessibility-patterns.md`

### Test Files
- `tests/homepage.spec.ts` - title assertions
- `tests/ai-advisor.spec.ts` - title assertions

## Not Changed (Backward Compatibility)

The following were intentionally not changed to preserve user data:

- `allotment-unified-data` - main localStorage key
- `community-allotment-varieties` - variety storage key (in `src/types/variety-data.ts`)
- `allotment-grid-layout` - grid layout storage key

Changing these would cause existing users to lose their data. A future migration strategy could be implemented if needed.

## GitHub Repository

The GitHub repository should be renamed from `community-allotment` to `bonnie-wee-plot`. GitHub will automatically redirect the old URL to the new one, preserving links and clone URLs.

## Name Alternatives Considered

1. **Plot Planner Scotland** - Clear geographic focus but generic
2. **My Plot / My Growing Plot** - Personal but lacks geographic identity
3. **Aitor's Garden** - Leverages AI persona but diminishes user agency
4. **Grow North / Grow Scotland** - Geographic but potentially limiting
5. **Harvest Rotation / RotationPlot** - Feature-focused but technical-sounding

The final choice "Bonnie Wee Plot" was selected because:
- Scottish identity ("Bonnie" is distinctly Scottish)
- Personal ownership emphasis ("Wee Plot" suggests individual garden)
- Memorable and distinctive
- Works well as both formal name and casual reference
