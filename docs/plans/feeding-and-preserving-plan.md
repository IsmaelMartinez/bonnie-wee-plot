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

### Goal A2 — Add a structured "feed type" so alerts say *what* to feed
Add an optional `feedType` (e.g. `'high-potash' | 'high-nitrogen' | 'balanced' |
'comfrey' | 'compost'`) to `MaintenanceInfo`, surfaced in the feed task note
(e.g. "Feed tomatoes — high-potash, every 7 days"). Falls back to current generic
text when absent.
- Files: `src/types/garden-planner.ts`, `createFeedTask` in `task-generator.ts`,
  `TaskList.tsx` note rendering.
- Acceptance: feed task notes show the feed type when set; no regression when unset.

### Goal A3 — "Feed overdue" urgency
Today, a plant fed long past its cadence still shows low priority. Add urgency:
when `daysSinceFeed >= feedFrequencyDays` by a margin (e.g. > cadence + 14d), mark
the feed task medium/high priority and note "Overdue — last fed N days ago".
- Files: `createFeedTask` / priority logic in `task-generator.ts` + tests.
- Acceptance: unit test asserts overdue feed → elevated priority.

---

## Milestone B — Make your own plant food

### Goal B1 — Lightweight "homemade feed" reference data + UI surface
Add a small static dataset of homemade feeds (comfrey tea, nettle feed, wood-ash
potash, worm-bin leachate, general liquid feed) with: what it's good for, NPK
lean (high-N vs high-K), how to make it, dilution ratio, and which `feedType` it
satisfies. Surface it where feeding is relevant (feed task detail / a small
"How to make this feed" link, and/or a Help/Guide section).
- New file: `src/lib/feeds/homemade-feeds.ts` (+ types).
- Tie-in: when a feed task has `feedType: 'high-potash'`, offer "comfrey tea" etc.
- Acceptance: clicking/opening a feed task surfaces a relevant homemade option;
  unit test maps feedType → suggested homemade feed.

### Goal B2 (optional) — Link comfrey/compost the user already grows
If the user has comfrey planted or an active compost pile, prefer suggesting their
own resource ("Use your comfrey bed" / "Your compost is ready"). Pure enhancement
on top of B1.

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
1. **A1 → A2 → A3** (feeding alerts; A1 alone already fixes the main complaint).
2. **B1** (homemade feeds), then optional **B2**.
3. Milestone C (preserving/storage) — deferred; revisit later.

Each Goal above is self-contained and can be handed to an agent independently.
Keep changes data-first and render-gated per the Simplicity-First principle; add a
unit test with each goal that touches `task-generator.ts`.
