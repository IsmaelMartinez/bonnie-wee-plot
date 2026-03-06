# ADR 026: Guided Tours on Every Page

## Status
Accepted

## Date
2026-03-06

## Context

Bonnie Wee Plot is being shared with a wider group of testers. The app has eight user-facing pages, each with distinct features that new users may not discover on their own. An interactive onboarding mechanism was needed to bridge the gap between landing on a page and understanding what it offers.

Three approaches were considered:

1. **Static help pages or tooltips** — low-effort but easy to ignore, no sequential flow.
2. **Video walkthroughs** — high production cost, difficult to maintain as the UI evolves.
3. **driver.js step-by-step tours** (chosen) — lightweight library (~5 kB), declarative step definitions, localStorage-based completion tracking, and a consistent pattern that scales to every page.

## Decision

Every user-facing page must have a guided tour. Tours use driver.js with `data-tour` attributes on target elements and centralised step definitions. Completion state is persisted in localStorage so tours only auto-trigger once per page.

### Architecture

Tour definitions live in `src/lib/tours/tour-definitions.ts`. Each tour has an `id`, human-readable `name` and `description`, and an array of `DriveStep` objects targeting `[data-tour="..."]` selectors. A `TourId` union type ensures type safety across the system.

The `useTour` hook (`src/hooks/useTour.ts`) manages the driver.js instance, completion tracking via localStorage, and keyboard shortcut (`?`) to trigger the current page's tour. The `PageTour` component provides a manual trigger button that pages include in their header.

Path-to-tour mapping in `getTourIdForPath()` enables the keyboard shortcut to resolve which tour to start based on the current URL.

### Covered Pages

| Page | TourId | Steps |
|------|--------|-------|
| Today Dashboard | `today` | 4 |
| Monthly Calendar | `this-month` | 5 |
| Plot Layout | `allotment` | 5 |
| Seeds & Varieties | `seeds` | 4 |
| Settings | `settings` | 6 |
| Compost | `compost` | 3 |
| Plant Guide | `plants` | 3 |
| About | `about` | 3 |

### Tour Management

Settings > Help tab contains a `TourManager` component that lists all tours with their completion status and allows users to replay or reset any tour.

### Convention for New Pages

When adding a new page:
1. Add a `TourId` value to the union type in `tour-definitions.ts`.
2. Define the tour steps targeting `data-tour` attributes.
3. Add the path mapping in `getTourIdForPath()`.
4. Place `<PageTour tourId="..." />` in the page header.
5. Add `data-tour="..."` attributes to the key elements.

## Consequences

Every page now has a discoverable walkthrough. The `?` keyboard shortcut provides a consistent way to trigger tours. The localStorage completion tracking means tours don't pester returning users. The centralised definition file makes it easy to audit coverage and update step copy.

The trade-off is a dependency on driver.js and the need to keep `data-tour` attributes in sync with tour definitions. If an element is removed or renamed without updating the tour, that step will silently be skipped by driver.js.
