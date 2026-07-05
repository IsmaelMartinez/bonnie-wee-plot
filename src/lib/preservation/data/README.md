# Preserving guides — authoring spec

One `PreservationGuide[]` file per vegetable category. **`cucurbits.ts` is
fully authored and is the exemplar to copy.** Each remaining file can be
filled in its own independent session — a session owns exactly one data file,
so parallel sessions never conflict.

## Spec (every session follows this)

For each crop in your file, add one `PreservationGuide`:

1. **`plantId`** — must match `src/lib/vegetables/index.ts` exactly.
2. **`summary`** — one orienting sentence (glut warning, best use, keeper vs eat-fresh).
3. **`methods`** — 2–4 entries covering the realistic options, from simplest
   (fresh/fridge) to preserves (freeze, dry, cure, store-cool, pickle, ferment,
   jam/chutney). Use only `StorageMethod` values. Check the crop's existing
   `storage.methods` in `src/lib/vegetables/data/<category>.ts` and stay
   consistent with it (you may add methods it omits, with good reason).
   - `how`: 1–3 practical sentences, Scottish-allotment voice (match cucurbits.ts).
   - `storageLife`: plain-English duration where known (e.g. "8–12 months frozen").
   - `resources`: 0–2 links per method, **preferring the shared constants** in
     `../resources` (NCHFP per-method pages, Garden Organic storing, UMN
     harvest/storage, RHS fruit storing, PSU Let's Preserve).
4. **`recipeIdeas`** — 1–3 links for eating the glut (cakes, bakes, soups,
   cordials): BBC Food ingredient hubs first, then BBC Good Food collections,
   River Cottage for preserves-heavy crops.

## Link rules (important)

- **Free resources only** — no paywalls, no sign-up walls. Ad-supported is fine.
- **Verify every URL you add** returns 200 before committing:
  `curl -s -o /dev/null -w "%{http_code}" -A "Mozilla/5.0" "<url>"`
- BBC Food hub pattern: `https://www.bbc.co.uk/food/<slug>` — lowercase,
  singular, underscores for spaces (`runner_bean`, `jerusalem_artichoke`).
  Verified working: courgette, rhubarb, beetroot, kohlrabi, blackcurrant,
  gooseberry, raspberry, runner_bean, jerusalem_artichoke, squash, pumpkin,
  butternut_squash. Spot-check all others.
- BBC Good Food collections: only verified slugs. There is **no**
  `chutney-recipes` or `glut-recipes` collection; use
  `pickles-jams-and-chutneys-recipes` and `garden-glut-cake-recipes`
  (both already in `resources.ts` as `BBC_GOOD_FOOD.*`).
- lovefoodhatewaste.com and allotment-garden.org block automated fetches
  (403) but are genuinely free sites — only add their URLs if you can verify
  them another way, and note it in the PR.
- Food-safety guardrails: never suggest home-canning low-acid vegetables
  without pressure canning; pumpkin/squash purée is freeze-only; when in
  doubt link NCHFP and keep instructions to fridge/freeze/dry/pickle/ferment.

## Definition of done (per session)

- Every crop listed for the file has a guide (delete the TODO comment).
- Remove your crops from `PENDING_GUIDES` in
  `src/__tests__/lib/preservation-coverage.test.ts` (the test fails with a
  stale-entry message if you forget).
- `npx vitest run src/__tests__/lib/preservation-data.test.ts src/__tests__/lib/preservation-coverage.test.ts` passes.
- `npm run lint` and `npm run type-check` pass.
- All new URLs curl-verified 200 (paste the check output in the PR description).
- Commit to a fresh branch, push, open a PR.

## Session goals

Suggested session prompt: *"Fill `src/lib/preservation/data/<file>.ts`
following the authoring spec in `src/lib/preservation/data/README.md`."*

| # | File | Crops (count) |
|---|------|----------------|
| 1 | `leafy-greens.ts` | lettuce, spinach, perpetual-spinach, kale, cavolo-nero, chard, rocket, pak-choi, mizuna, land-cress, corn-salad, winter-purslane, mustard-greens, watercress, salad-burnet, orache, new-zealand-spinach, good-king-henry, radicchio, endive, ice-plant (21) |
| 2 | `root-vegetables.ts` | carrot, beetroot, parsnip, turnip, swede, radish, jerusalem-artichoke, celeriac, salsify, hamburg-parsley, florence-fennel, mooli, black-radish, scorzonera, horseradish, chinese-artichoke, yacon, skirret, oca, ulluco (20) |
| 3 | `brassicas.ts` | broccoli, cabbage, cauliflower, brussels-sprouts, kohlrabi, savoy-cabbage, red-cabbage, chinese-broccoli, romanesco, turnip-tops, mibuna, seakale, purple-sprouting-broccoli (13) |
| 4 | `legumes.ts` | peas, runner-beans, broad-beans, french-beans, climbing-french-beans, borlotti-beans, edamame, mangetout, sugar-snap-peas, asparagus-peas, black-turtle-beans, fenugreek, ground-nut (13) |
| 5 | `solanaceae.ts` | potato, early-potato, second-early-potato, maincrop-potato, cherry-tomato, plum-tomato, blight-resistant-tomato, tomatillo (8) |
| 6 | `alliums.ts` | onion, garlic, leek, spring-onion, shallot, welsh-onion, elephant-garlic, walking-onion, potato-onion, garlic-chives, ramps (11) |
| 7 | `herbs.ts` | parsley, coriander, mint, thyme, rosemary, chives, lovage, sorrel, oregano, sage, french-tarragon, dill, herb-fennel, lemon-balm, marjoram, bay, borage, chamomile, winter-savory, hyssop (20) |
| 8 | `berries.ts` | strawberry, raspberry, blackcurrant, redcurrant, gooseberry, blueberry, blackberry, tayberry, loganberry, jostaberry, honeyberry, goji-berry, aronia, elderberry, sea-buckthorn (15) |
| 9 | `fruit-trees.ts` | apple-tree, pear-tree, plum-tree, cherry-tree, damson-tree, greengage-tree, medlar-tree, quince-tree, fig-tree, mulberry-tree (10) |
| 10 | `other.ts` + `mushrooms.ts` + `edible-extras.ts` | sweetcorn, asparagus, globe-artichoke, rhubarb, celery, cardoon, mashua; oyster-mushroom, shiitake, lions-mane, king-oyster, button-mushroom; nasturtium, calendula, lavender, bergamot, hardy-kiwi, hops, sunflower (19) |

`cucurbits.ts` (7) — ✅ done (exemplar).

Category-specific hints:

- **Leafy greens**: most are fridge/fresh; cooking greens (kale, chard, spinach)
  blanch-and-freeze; mustard/pak-choi can ferment (kimchi-style — link
  `UMN_SAUERKRAUT` + `NCHFP.fermenting`).
- **Roots**: damp-sand boxes / in-ground storage are the star methods
  (`GARDEN_ORGANIC_STORING`); beetroot pickles; horseradish/mooli ferment.
- **Brassicas**: sauerkraut for cabbages (`UMN_SAUERKRAUT`); freeze florets
  blanched; red cabbage pickles.
- **Legumes**: pod beans freeze after blanching; borlotti/black turtle dry on
  the vine; runner-bean chutney is a classic.
- **Solanaceae**: potatoes = cure + paper sacks, never fridge; tomatoes =
  passata/freeze whole, oven-dry; green-tomato chutney; tomatillo salsa verde.
- **Alliums**: cure and plait/net (`RHS_ONIONS`); leeks stay in the ground;
  garlic keeps 6–10 months.
- **Herbs**: soft herbs freeze in oil/ice cubes; woody herbs dry
  (`NCHFP.drying`); herb vinegars and butters.
- **Berries**: open-freeze on trays; jams (`NCHFP.jams`, `BBC_GOOD_FOOD.jams`);
  blackcurrant cordial; elderberry must be cooked.
- **Fruit trees**: `RHS_STORING_FRUIT` for apples/pears/quince/medlar; wrap
  and tray-store apples; plums/damsons freeze stoned and make jam/gin;
  membrillo for quince; medlar bletting.
- **Other/mushrooms/extras**: sweetcorn blanch-freeze same day; rhubarb
  freezes raw + crumbles/cordial; mushrooms dry brilliantly (`NCHFP.drying`);
  lavender/chamomile dry for tea; hops dry for brewing; sunflower seeds dry.

## Verified resource library (fetched 2026-07-04)

All in `src/lib/preservation/resources.ts`. For reference:

| Resource | URL | Notes |
|---|---|---|
| NCHFP methods hub | https://nchfp.uga.edu/ | Gold standard; per-method pages under `/how/<method>/` |
| USDA canning guide | https://nchfp.uga.edu/resources/category/usda-guide | Free PDFs |
| RHS storing fruit | https://www.rhs.org.uk/fruit/fruit-trees/storing | Apples, pears, quince, medlar |
| RHS onions | https://www.rhs.org.uk/vegetables/onions/grow-your-own | Harvest + storing section |
| Garden Organic | https://www.gardenorganic.org.uk/expert-advice/garden-management/harvesting-and-storage/harvesting-and-storing-vegetables | Best UK allotment storing page |
| FSA fact checker | https://www.gov.uk/government/publications/home-food-fact-checker | UK food-safety storage Q&A |
| PSU Let's Preserve | https://extension.psu.edu/food-safety-and-quality/home-food-preservation-and-safety/lets-preserve | 26 crop-by-crop fact sheets |
| UMN preserving | https://extension.umn.edu/food-safety/preserving-and-preparing | All methods landing page |
| UMN harvest/storage | https://extension.umn.edu/planting-and-growing-guides/harvesting-and-storing-home-garden-vegetables | 30+ crops, storage conditions |
| UMN sauerkraut | https://extension.umn.edu/preserving-and-preparing/how-make-your-own-sauerkraut | Best free fermentation primer |
| BBC Food hubs | https://www.bbc.co.uk/food/<ingredient> | Per-ingredient recipes, no ads |
| BBC Good Food | https://www.bbcgoodfood.com/recipes/collection/<slug> | Verified slugs only; recipes checked non-premium |
| River Cottage | https://www.rivercottage.net/recipes | Free, strong preserves coverage |
| Wikibooks Cookbook | https://en.wikibooks.org/wiki/Cookbook:Table_of_Contents | CC technique reference |

Known bot-blocked (free but unverifiable by curl): lovefoodhatewaste.com,
allotment-garden.org.
