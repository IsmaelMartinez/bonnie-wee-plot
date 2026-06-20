# Plan: Feeding Alerts, Make-Your-Own Feed & Preserving/Storage

Status: proposed (2026-06-16). Working document — delete once implemented.

## Context & reality check

Research into the codebase found:

- **Feeding engine already exists.** `src/lib/task-generator.ts` generates a `feed`
  task type driven by `Vegetable.maintenance.feedMonths` + `feedFrequencyDays`,
  with cadence suppression via care logs (`CareLogDaysMap`), per-month dismissal,
  and auto care-log creation on completion (`useTodayData.onCompleteTask`).
- **The gap:** only perennials/trees/berries carry `maintenance.feedMonths`.
  Hungry annuals (tomatoes, courgettes, squash, brassicas, leeks, potatoes,
  sweetcorn, peppers, beans) have **no feeding data**, so no feed alerts fire for
  the crops most likely to need feeding. This is the "I'm probably missing some".
- **Watering** is already weather-gated (`shouldSkipWatering`, Open-Meteo rainfall).
  Improvable but not broken.
- **Make-your-own-feed:** comfrey is described as a "liquid feed (comfrey tea)"
  source; a compost system exists (`src/types/compost.ts`). No structured guidance
  tying "you have a glut / it's feeding season" to "here's how to make/apply feed".
- **Preserving/jam/storage data does NOT exist.** No storage, shelf-life, or
  preservation fields on `Vegetable`. This must be built from scratch (not surfaced).

Design constraint (from CLAUDE.md "Simplicity First"): preserving/storage should be
**informational** (surfaced from data), not a heavy new tracking subsystem.

---

## Milestone A — Feeding alerts (highest value, lowest risk)

### Goal A1 — Add feeding data to hungry annual crops ✅ DONE (2026-06-16)
> Implemented: unified feeding into `generateFeedingTasks` (mirrors watering) so
> annual plantings in rotation beds get feed alerts, not just perennials. Added
> `maintenance.feedMonths` + `feedFrequencyDays` to tomatoes, cucurbits, brassicas,
> leek, sweetcorn, and climbing beans. Covered by new unit tests.

Extend `MaintenanceInfo` usage across `src/lib/vegetables/data/*.ts` so the major
"hungry" annuals get `feedMonths` + `feedFrequencyDays` (+ short `notes`).
- Target crops: tomatoes, peppers/chillies, aubergine (solanaceae); courgette,
  squash, pumpkin, cucumber (cucurbits); brassicas (cabbage/cauliflower/sprouts);
  leeks, maincrop potatoes, sweetcorn, runner/climbing beans.
- Use realistic Scottish cadences (e.g. tomatoes weekly high-potash once fruiting).
- Acceptance: feeding tasks appear in the Today dashboard for a plot with these
  crops planted in season; unit test in `src/__tests__/lib/task-generator.test.ts`
  covers at least one newly-fed annual.

### Goal A2 — Add a structured "feed type" so alerts say *what* to feed ✅ DONE (2026-06-17)
> Implemented: added `FeedType` (`high-potash | high-nitrogen | balanced |
> comfrey | compost`) and an optional `feedType` to `MaintenanceInfo`. Populated
> it for every crop that already carries feed data (annuals + berries + trees +
> the perennial veg): tomatoes/tomatillo, cucurbits, beans → high-potash;
> brassicas, leek, sweetcorn, rhubarb → high-nitrogen; fruit trees, asparagus,
> artichoke, seakale → balanced; berries → high-potash. `createFeedTask` now
> reads it ("apply high-potash feed"); falls back to "general-purpose fertiliser"
> when unset. `feedType` is carried on `GeneratedTask` so the UI can suggest a
> homemade option (B1). Covered by a new unit test.

### Goal A3 — "Feed overdue" urgency ✅ DONE (2026-06-17)
> Implemented: `createFeedTask` marks a feed overdue when
> `daysSinceLastFeed > feedFrequencyDays + 14`, elevating it to `medium` priority
> with an "Overdue — last fed N days ago" note. Below the 14-day margin it stays
> low priority. Two new unit tests cover the elevated and within-margin cases.

---

## Milestone B — Make your own plant food

### Goal B1 — Lightweight "homemade feed" reference data + UI surface ✅ DONE (2026-06-17)
> Implemented: `src/lib/feeds/homemade-feeds.ts` holds five homemade feeds
> (comfrey tea, nettle feed, wood ash, worm-bin leachate, compost/manure), each
> with what it's good for, NPK lean, how to make it, a dilution ratio, and which
> `feedType`(s) it satisfies. `getHomemadeFeedsForType(feedType)` returns matches
> best-lean-first. UI tie-in: a collapsible "Make your own feed" disclosure
> (`HomemadeFeedHint` in `TaskList.tsx`) renders under any feed task that carries
> a `feedType`, listing the relevant homemade option(s). Six unit tests cover the
> feedType → feed mapping and data shape.

### Goal B2 — Link comfrey/compost the user already grows ✅ DONE (2026-06-20)
> Implemented: `getOwnFeedResourcesForType(feedType, ctx)` in
> `src/lib/feeds/homemade-feeds.ts` returns the user's own resources to prefer
> over the generic make-your-own feeds — gated by the same feedType relevance
> (comfrey → high-potash/comfrey, compost → balanced/compost). `useTodayData`
> derives an `OwnFeedContext` (`growsComfrey` from comfrey plantings/primary
> plants, `hasReadyCompost`/`hasCompost` from `AllotmentData.compost`) and
> threads it through `TodayDashboard` → `TaskList` → `HomemadeFeedHint`, which
> now leads with "Use your comfrey bed" / "Your compost is ready" above the
> collapsible generic list. Render-gated per Simplicity-First (nothing extra
> shows when the user grows/has nothing). Covered by new unit tests in
> `homemade-feeds.test.ts` and `TaskList.test.tsx`.

---

## Milestone C — Preserving & storage (net-new data, informational) — DEFERRED

> Deferred (2026-06-16): preserving/storage data does not exist yet and would be
> net-new authoring. Parked until feeding (A) and homemade feed (B) land. Goals
> below are kept for when it's picked back up.


### Goal C1 — Add storage/preservation data to the Vegetable model
Add an optional `storage` field to `Vegetable`:
```ts
storage?: {
  methods: ('fresh' | 'fridge' | 'freeze' | 'dry' | 'store-cool' | 'pickle' | 'jam' | 'ferment' | 'cure')[]
  freshDays?: number        // rough shelf life when fresh
  tip?: string              // e.g. "Cure tubers 2 weeks before storing in paper sacks"
}
```
Populate it for high-glut crops first (courgettes, beans, tomatoes, apples,
plums, berries, potatoes, onions, garlic, cabbage, rhubarb).
- Acceptance: data validates with type-check; a few representative crops populated;
  no schema/storage migration needed (it's static vegetable-database data, not user data).

### Goal C2 — Surface storage/preservation in the plant detail UI
Show the storage methods + tip on the plant/variety detail and/or harvest view
(e.g. badges: "Freeze · Jam · Store cool" with the tip). Read-only, no tracking.
- Acceptance: storage info renders for crops that have it; hidden when absent.

### Goal C3 (optional, depends on C1) — Glut/preserve nudge near harvest
When a crop with `storage.methods` including `freeze`/`jam`/`pickle` is in its
harvest window, add a `care-tip`-style task: "Glut of courgettes? Freeze grated or
make chutney." Reuses the existing `care-tip` task plumbing — no new task type.
- Acceptance: nudge appears in harvest month for a preserve-able crop; unit test.

---

## Suggested order & how to dispatch
1. ~~**A1 → A2 → A3**~~ ✅ done (feeding alerts; Milestone A complete).
2. ~~**B1 → B2**~~ ✅ done (homemade feeds + preferring the user's own comfrey
   bed / ready compost; Milestone B complete).
3. Milestone C (preserving/storage) — deferred; revisit later.

Each Goal above is self-contained and can be handed to an agent independently.
Keep changes data-first and render-gated per the Simplicity-First principle; add a
unit test with each goal that touches `task-generator.ts`.
