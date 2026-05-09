# Compost area: love + improvement plan

## Current state

The compost surfaces in the app today are quite small. The `/compost` page (`src/app/compost/page.tsx`) lets the user create piles, log inputs, log events (turn / water / harvest / other), edit pile name and start date, change pile status, and delete piles. The Today dashboard shows a single `CompostAlerts` card (`src/components/dashboard/CompostAlerts.tsx`) that links to `/compost` and surfaces two counts: how many active piles "need turning" and how many piles are "ready to use." There are also generic, non-personalised care tips at the bottom of the compost page. Compost data lives on `AllotmentData.compost` (schema v18), routed through `useCompost` -> `useAllotmentData` -> `useSyncedStorage` -> `usePersistedStorage`. The pure mutation/query helpers sit in `src/services/compost-operations.ts`.

There is no compost integration with the Today task list, no per-pile photos, no carbon/nitrogen ratio hints based on logged inputs, no quick-action buttons on the dashboard widget, and no concept of "expected ready date" projected from the pile's start date and system type.

## The bug fix shipped in this PR

The Today widget's "X piles need turning" line was stale because the predicate was naive. It only looked at `event.type === 'turn'` and the pile `startDate`. That meant logging a harvest, adding fresh material, or otherwise managing the pile did not reset the seven-day clock — the user could empty a pile via a harvest event, walk back to the dashboard, and still see "needs turning." Marking the pile `applied` did remove it from the count (because it is filtered out of the active set), but every other "I just dealt with this pile" gesture was invisible to the predicate.

The fix moves the predicate into `compost-operations.ts` as `pileNeedsTurning(pile, now)` and `getCompostPilesNeedingTurn(data, now)`, both reusable. The predicate now treats the most recent of (turn event, harvest event, input added, pile start date) as the "last touched" time and compares that against the seven-day threshold. The widget calls the helper inside a `useMemo` keyed on the `data` reference returned by `useCompost`, so any mutation that changes `AllotmentData.compost` produces a new reference and re-derives the count. Unit tests in `src/__tests__/services/compost-operations.test.ts` cover the predicate against turn, harvest, input-add, ready, applied, and remove mutations. A Playwright spec in `tests/compost-widget-sync.spec.ts` walks the user flow end-to-end.

## Proposals, ranked by leverage

### 1. Show the most-urgent pile by name, not just a count (small, high leverage)

The widget already has the data to say "Bay 1 needs turning (10 days)" instead of "1 pile needs turning." When there are multiple stale piles, list the top one or two with their day-counts. This converts a vague status indicator into a concrete next action — the user knows which physical bin to walk to without opening the page. Cost is small: a sort, a slice, a couple of new lines of JSX. Same pattern for "ready to use" — name the pile rather than counting.

### 2. One-tap "log activity" quick actions on the widget (small-to-medium, high leverage)

Add tiny buttons inline on the widget rows: "Mark turned" next to the needs-turning row, "Mark harvested" next to the ready row. Tapping fires `addEvent(pileId, { type: 'turn' | 'harvest', date: now })` and the widget re-derives. This is the clearest expression of "compost should change if you just did the thing" — currently the user has to open the page, find the pile, open the event dialog, pick a type, submit. Cost grows if we want a confirmation toast or undo, but the minimal version is two more buttons wired to existing hook actions.

### 3. Project an "expected ready" date per pile (medium, medium leverage)

Each `CompostSystemType` has a typical maturation window (hot compost ~3 months, cold compost ~12 months, tumblers ~6 weeks, bokashi ~2 weeks of fermentation then bury, etc.). Add a small lookup table next to the system-type definition and surface an "estimated ready" line on each pile card and the widget. This gives the user a planning horizon — they can decide whether to start a new bay this autumn or rely on Bay 2 finishing first. Caveat: real ready-state depends on green/brown ratio and turning frequency; the projection is a hint, not a promise. Cost is medium because we need the table, the calculation, and a bit of UI on both surfaces.

### 4. Photos per pile for visual progress (medium, medium leverage)

Compost is a visual hobby. A user who took a photo of Bay 1 in November and again in March can see the difference at a glance, which is far more motivating than scrolling event lists. Add a `photos: { id, dataUrl, takenAt, notes? }[]` field to `CompostPile`, a camera button on the pile card, and a small thumbnail strip. Storage is the constraint — base64 in localStorage caps at ~5 MB across the whole `AllotmentData` blob, so we either downscale aggressively (small thumbnails only) or wire photos through a separate Supabase Storage bucket for signed-in users. Cost is medium for the in-localStorage-only version, larger if we add a cloud bucket.

### 5. Smarter health hints from logged inputs (medium, low-to-medium leverage)

The schema already distinguishes `green` / `brown` / `other` input types. We could compute a rolling green:brown ratio over the last 30 days of inputs and surface a hint when it skews badly ("This pile is heavy on greens — add some cardboard or dry leaves"). Useful but probably premature: most users skip the type selector when logging inputs (it defaults to `'other'` in the page form), so the data quality is poor. Worth doing only after the form is improved to nudge a green/brown choice. Cost is medium and there is a real risk of giving wrong advice on bad input data.

## Suggested order

Ship 1 and 2 together as a "compost widget v2" — they reuse the same hook and reinforce each other, and together they convert the widget from a passive indicator into something the user actually interacts with. Defer 3 and 4 until we know whether the widget gets used. Defer 5 indefinitely unless we redesign the input-logging flow first.
