# AI Vision and Competitive Landscape Research

Last updated: 2026-03-14

This document synthesises research from five parallel investigations: our current AI capabilities, the competitive garden app landscape, available APIs and data sources, AI assistant UX patterns, and open-source/innovation opportunities. The goal is to inform two proposed features (full-capability AI chatbot and proactive garden advisor) and identify what it takes to be the best garden planning app by a mile.

---

## Part 1: The Gap — What Aitor Can Do vs What the App Can Do

The AI advisor (Aitor) currently has access to 4 tools: `add_planting`, `update_planting`, `remove_planting`, and `list_areas`. The app's `useAllotment` hook exposes 60+ operations across eight categories. The gap is enormous.

### What Aitor Cannot Do Today

**Area management** — Cannot create, rename, archive, or modify beds/areas. "Add a new raised bed" is a dead end.

**Variety/seed inventory** — 15+ operations (add variety, record ordered/have status, link to plantings, track suppliers, spending) are completely inaccessible. "Order some tomato seeds" goes nowhere.

**Maintenance and custom tasks** — The task system exists but the AI cannot write tasks based on its advice. "Remind me to prune the raspberries next week" is conversation only.

**Care logs and harvests** — "I harvested 2kg of carrots today" cannot be recorded. `logHarvest()` and `addCareLog()` are unavailable.

**Garden events** — Pruning, feeding, watering events cannot be logged.

**Season and rotation data** — Cannot create seasons, update rotation groups, or query rotation history.

**Notes** — Area notes exist but the AI cannot read or write them.

### What Needs to Happen

Expanding from 4 tools to full coverage means adding tools for: area CRUD (add/update/remove/archive areas), variety management (add variety, update seed status, record supplier/price), task management (add/complete/update maintenance and custom tasks), care logging (log care events, record harvests), garden events (log pruning, feeding, etc.), season management (create season, update rotation), and notes (read/add area notes). The tool executor's pattern of area-name resolution and user confirmation already works well and extends naturally to new tool types.

---

## Part 2: Competitive Landscape

### Market Segments

The garden app market breaks into four segments: vegetable/allotment planners (GrowVeg, VegPlotter, Seedtime, Planter), AI identification/care apps (PictureThis, PlantIn, Planta, Greg), landscape design tools (iScape, Gardenly), and community/journal platforms (Gardenize, GardenTags). A fifth segment of AI-native planners is emerging.

### Key Competitors

**GrowVeg** is the market leader for vegetable planning. It has 408 plants with 21,400 varieties (vs our 192), 5-year rotation history with visual timeline, companion planting backed by 502 scientific studies, email/push planting reminders, and weather integration. Priced at ~$40/year. Its main weakness is that it's cloud-first with no offline capability and no AI features.

**Planta** dominates the houseplant/care space with 30+ parameters for watering recommendations, "Dr. Planta" photo-based disease diagnosis, and a freemium model at $7.99/month. Strong on AI-powered care but weak on vegetable/allotment planning.

**Fryd** is the closest feature competitor. It has 4,000+ plant varieties, companion planting scores visualised in the layout, succession sowing in the visual planner, a "magic wand" auto-arrangement feature, crop rotation guidance, and community variety sharing. This is the one to beat for vegetable planning UX.

**Greg** and **PictureThis** focus on plant identification and care reminders through photo recognition, with large user bases but shallow planning features.

**VegPlotter** is UK-focused with a free tier, basic drag-and-drop layout, and a growing community. Less feature-rich than GrowVeg or Fryd.

### Table-Stakes Features (Users Expect These)

Drag-and-drop garden layouts, location-personalised planting calendars, a plant database with spacing/timing/care info, companion planting information, and crop rotation tracking. Bonnie Wee Plot has all of these.

### Differentiating Features (Separate Leaders from Pack)

Succession planting with gap analysis, seed inventory tracking, photo journaling, weather integration, push/email reminders, multi-year plan history, and evidence-based companion planting. Bonnie Wee Plot has seed inventory and multi-year history but lacks weather integration and reminders.

### Bonnie Wee Plot's Existing Advantages

**Scotland-adapted plant data** is the deepest moat. All 192 plants have planting calendars tuned for Scottish growing conditions, including a fall factor adjustment for autumn plantings, Scotland-specific sowing windows, and RHS-aligned 4-year crop rotation. No competitor offers this level of regional adaptation — GrowVeg and Fryd use generic UK or Central European data. For a Scottish allotment grower, 192 plants covering every common vegetable, herb, berry, and fruit tree is more than sufficient (typical growers work 20-30 crops per season). The per-category file structure makes expansion straightforward if demand warrants it, but breadth is not the bottleneck — regional accuracy is the differentiator.

Offline-first architecture with optional cloud sync is extremely rare (most competitors are cloud-first and require accounts). BYO API key AI advisor model exists in no competitor. Perennial lifecycle tracking with age-aware care tips appears in no competitor. Integrated seed inventory connecting to planting recommendations is uncommon.

### Competitive Gaps to Close

Absence of email/push planting reminders, no weather integration for frost alerts or watering advice, and no photo journaling capability. GrowVeg has more plants (408 vs 192) but this is not a meaningful gap for the allotment audience — our 192 cover all common food crops with superior Scottish regional accuracy.

---

## Part 3: Available APIs and Data Sources

### Weather (Highest Value Integration)

**Open-Meteo** is the recommended primary provider. Free, no API key needed, provides soil temperature at four depths, soil moisture, and comprehensive forecasts. Perfect for a BYO-key app since it requires zero configuration.

**Met Office DataHub** is the best UK-specific option. Free tier allows 360 calls/day from the UK's 2km deterministic model, far higher resolution than global APIs. Lacks dedicated agricultural parameters but provides excellent temperature/frost data.

**Visual Crossing** has the best agricultural features: soil temperature, evapotranspiration, and a dedicated growing degree day (GDD) endpoint that would improve our `date-calculator.ts` beyond the current static "fall factor" for Scotland. Free tier of 1,000 records/day.

Integration recommendation: Open-Meteo as primary (free, no config), Met Office DataHub as UK enhancement. Feed into frost alerts on Today dashboard, improved harvest date predictions using actual temperature accumulation, and soil temperature indicators for sow timing.

### Plant Data

**Permapeople** has 8,500+ profiles with strong permaculture/companion planting data under CC BY-SA 4.0. Could enrich our `enhancedCompanions` and `enhancedAvoid` arrays.

**Perenual** has 10,000+ species with care data and a Plant ID API for image-based identification. Free tier available.

**OpenFarm** was the leading open-source plant database but shut down in April 2025, creating a gap in the ecosystem. This is an opportunity: our built-in 192-plant database is a competitive advantage since we don't depend on fragile external APIs.

**Trefle** provides botanical/taxonomic data but is more science-oriented than practical growing guides.

### Soil Data

**SoilGrids** (ISRIC) provides global soil property maps at 250m resolution via REST API. A one-time lookup when setting up an allotment would return soil composition (pH, organic carbon, sand/silt/clay) that could inform plant recommendations. Free, fair-use rate limiting of 5 calls/min.

**UK Soil Observatory** / BGS provides the most accurate UK soil data via WMS services. More complex to integrate but the gold standard for UK soil information.

### Disease/Pest Identification

**Kindwise** (plant.id / plant.health) identifies 548 classes of plant health issues. 100 free credits on signup, then pay-per-credit. JavaScript SDK available.

In practice, our existing GPT-4o vision capability in Aitor already handles general plant/disease identification. Kindwise would be a dedicated fallback for users without an OpenAI key.

### Calendar Export

**ICS file export** using the `ics` npm package is the clear winner. The task generator already produces structured tasks with dates; converting to iCalendar events is a small feature with high utility. Works with every calendar app, no OAuth flows needed.

---

## Part 4: AI Assistant Patterns — How to Build Best-in-Class

### Progressive Autonomy (The Key Framework)

A February 2026 Smashing Magazine article provides the definitive framework for AI agents modifying user data, with three tiers:

**Tier 1 — Suggest only.** The AI proposes actions but the user must execute them manually. This is where most apps start. Low risk, low friction reduction.

**Tier 2 — Propose and confirm.** The AI prepares the action and presents a preview; the user confirms. This is where Bonnie Wee Plot's `ToolCallConfirmation` already sits for planting operations. The right default tier for data modifications.

**Tier 3 — Autonomous with audit.** The AI acts autonomously but logs everything with undo capability. Appropriate for low-risk actions after the user has built trust.

The insight is that users should be able to set their own autonomy level per action category. Someone might want Tier 3 for logging harvests (low risk, high frequency) but Tier 2 for removing plantings (higher risk).

### Proactive/Ambient AI (The "Side Agent" Pattern)

LangChain's ambient agent framework defines three human-in-the-loop patterns for proactive AI: **notify** (surface information), **question** (ask for input), and **review** (present a plan for approval).

The critical design principle from Fitbit's Gemini-powered health coach: silence is the correct output when everything is on track. The AI should only surface insights the user cannot easily derive themselves. Bad implementations nag; good ones feel like a knowledgeable friend who speaks up at the right moment.

For Bonnie Wee Plot, a proactive garden advisor would:

**Monitor weather and trigger alerts.** "Frost expected tonight — consider covering your tomatoes" is actionable and time-sensitive. This requires weather API integration and knowledge of what's planted.

**Detect patterns in the user's data.** "Your carrots in Bed B have failed two years running — the soil might be too heavy. Consider trying parsnips there instead" requires multi-year planting history analysis.

**Suggest seasonal actions with context.** Not just "time to prune raspberries" (the current rule-based task generator already does this) but "your raspberries are in their third year and producing well — consider propagating new canes from the strongest stems to replace the older ones next year."

**Learn from behaviour.** Track which tasks users complete vs dismiss. If they always dismiss "mulch strawberries" suggestions, stop suggesting it. If they always complete succession sowing reminders, prioritise those.

### Multi-Modal Capabilities

**Photo analysis** is the highest-value multi-modal feature. Plant health assessment, pest identification, and harvest readiness checks are all practical use cases. The existing GPT-4o integration already supports images. The gap is making this a structured workflow rather than free-form chat: "Take a photo of your tomato leaves" → structured diagnosis with treatment recommendations.

**Voice interaction** addresses a real pain point (dirty hands while gardening). This is a browser capability that could be added without external APIs using the Web Speech API.

**AR overlays** are mature for landscape design (DreamzAR, iScape) but less relevant for allotment-scale bed planning. Low priority.

### AI-Powered Task Generation (Beyond Rule-Based)

The current `task-generator.ts` is entirely rule-based: it checks month calendars, sow dates, and perennial lifecycle stages. An AI-enhanced version would add:

**Weather-aware prioritisation.** Connect forecast data to existing tasks. "Don't suggest watering, it's going to rain tomorrow" or "Move indoor sowing up, the forecast shows a warm spell coming."

**Succession planning with actual data.** The current hardcoded `SUCCESSION_CROPS` list and 21-day interval is crude. AI could factor in actual historical growing times from the user's care logs and forecast conditions to suggest optimal succession timing.

**Personalised ordering.** Simple completion tracking (which tasks does the user actually do?) enables reordering the task list by relevance without complex ML.

---

## Part 5: Open-Source Landscape and Innovation Opportunities

### Notable Open-Source Projects

**FarmBot** is the most ambitious open-source garden project. Its 2025 3D farm designer with orbitable perspectives, soil height rendering, and virtual sun positioning shows what's possible for garden visualisation. The REST API design (JWT auth, resources as JSON documents) is well-structured. Concept of "farm events" for scheduling maps directly to task generation.

**Growstuff** demonstrates crowdsourced growing data at modest scale (2,689 members, 4,854 plantings, 947 crops). Its "growth curves" recording height, spread, and watering over a lifecycle, plus harvest prediction from crowdsourced data, show what's possible with community data aggregation.

**Plant-it** (self-hosted, GPL-3.0) deliberately chose not to recommend actions, believing only the user should decide. An interesting philosophical contrast with our AI advisor approach.

**HortusFox** integrates OpenWeatherMap, Pl@ntNet, and GBIF — showing the value of external API composition.

### The OpenFarm Shutdown (Opportunity)

OpenFarm's servers shutting down in April 2025 leaves a gap in the open-source plant data ecosystem. Bonnie Wee Plot's built-in 192-plant database, already enriched with RHS URLs, Wikipedia links, botanical names, companion planting data, and care tips, is more self-contained than apps depending on external APIs. If we ever open-source our plant data under a permissive license, there's a community waiting for it.

### Gamification Patterns

Research shows apps using gamification see 60% higher daily active users. The patterns that translate best to gardening:

**Streaks** for consecutive days of garden activity (logging care, checking tasks). Duolingo's model adapted for gardening.

**Milestone badges** for real achievements: first sow, first harvest, 10 varieties planted, full rotation completed, 100kg harvested. These reinforce behaviours that actually make better gardeners.

**Harvest value tracking** — calculating the economic value of your allotment's produce based on supermarket prices. Several calculators already exist; integrating this into harvest logging would gamify the payoff of gardening.

**Seasonal challenges** aligned with the growing calendar: "Plant 5 succession sowings this month" or "Log 3 harvests this week."

### Community Features

The most promising community features for allotment culture:

**Anonymous data sharing.** Aggregate planting success rates by postcode/climate zone from Supabase-synced users. "What grows well near you" powered by real data rather than generic databases.

**Local seed swap coordination.** Meet for Branch shows the proximity-based model works for plant swaps. This aligns with allotment culture where gardeners are physically neighbours.

---

## Part 6: Feature Prioritisation — What Makes Us THE Best

### Tier 1: High Impact, Achievable Now

These build on existing infrastructure and close the most important competitive gaps.

**1. Expand AI tool coverage to full app capabilities.**
Add tools for area CRUD, variety management, task management, care logging, harvest recording, garden events, season management, and notes. The tool executor pattern, area-name resolution, and confirmation UX already work. This is an expansion of a proven architecture, not a new system. This alone would make Aitor the most capable AI gardening assistant on the market — no competitor has an AI that can modify garden data.

**2. Weather integration for frost alerts and sow timing.**
Open-Meteo (free, no key) for soil temperature and forecasts. Feed into the Today dashboard as alerts and into `date-calculator.ts` for improved harvest predictions. Met Office DataHub as an optional UK enhancement. This is the single most-requested feature across competitor reviews.

**3. ICS calendar export.**
The `ics` npm package turns task generator output into calendar events in ~100 lines. Works with every calendar app. High utility, low effort.

### Tier 2: Differentiating, Medium Effort

These would put Bonnie Wee Plot clearly ahead of all competitors.

**4. Proactive garden advisor ("side agent").**
An AI that monitors your garden data and weather, surfacing contextual suggestions on the Today dashboard. Uses the progressive autonomy framework: starts as notifications, escalates to proposed actions with confirmation. Requires weather integration (item 2) as a prerequisite. The key differentiator is context depth — Aitor already knows the full garden state, planting history, and variety inventory. No competitor combines this depth of context with proactive suggestions.

**5. Weather-aware task prioritisation.**
Enhance `task-generator.ts` to factor in forecast data. "Don't water today, rain expected" and "bring frost-tender plants inside tonight" are the kind of timely, actionable advice that makes an app indispensable.

**6. Photo-based plant health workflow.**
Structure the existing GPT-4o vision capability into a guided flow: take photo → get diagnosis → get treatment plan → optionally log the issue as a care event. Currently this is just free-form chat; a structured workflow would be much more useful.

### Tier 3: Long-Term Differentiators

**7. Learning from user behaviour.**
Track task completion patterns to personalise task ordering and suppress irrelevant suggestions. Simple completion tracking, not complex ML.

**8. Community data aggregation.**
Anonymous, aggregated "what works near you" data from Supabase-synced users. Requires meaningful user base first.

**9. Gamification.**
Harvest value tracking, milestone badges, seasonal challenges. Reinforces engagement and makes gardening progress visible.

**10. Soil data integration.**
SoilGrids one-time lookup at allotment setup to inform plant recommendations. Nice enrichment but not a core differentiator.

**11. Community-contributed plants.**
Allow users to submit new plant entries (varieties, growing calendars, care tips) that get reviewed and added to the database. The per-category file structure makes ingestion straightforward. Growstuff's model (2,689 members contributing 4,854 plantings across 947 crops) shows even modest-scale crowdsourcing produces useful data. This is a "respond to demand" feature — build it when the community asks for plants we don't have.

**12. Regional adaptation beyond Scotland.**
The Scotland-tuned planting calendars, fall factor adjustments, and sowing windows are the deepest moat today. Generalising this to other UK regions and eventually other countries would dramatically expand the addressable audience. The architecture supports it: `AllotmentData.meta` already captures location, and the date calculator's fall factor concept could generalise to climate zone-specific adjustments. The main cost is plant data curation — each region needs validated calendars, not just shifted dates. Community-contributed plants (item 11) and regional adaptation are complementary: local growers are the best source of "what works here" data.

---

## Sources

### Competitor Research
- GrowVeg (growveg.com), Fryd (fryd.app), Planta (getplanta.com), VegPlotter (vegplotter.com)
- Planter, Seedtime, Greg, PictureThis, PlantIn, Gardenize, GardenTags, iScape
- Seed to Spoon (seedtospoon.net) — frost dates from 100+ years of historical data

### APIs and Data
- Open-Meteo (open-meteo.com) — free weather API with soil temperature
- Met Office DataHub (metoffice.gov.uk) — UK 2km resolution forecasts
- Visual Crossing — GDD endpoint, agricultural elements
- SoilGrids REST API (rest.isric.org) — global soil properties at 250m
- Kindwise plant.id / plant.health — disease identification API
- Perenual (perenual.com) — 10,000+ plant species API
- Permapeople (permapeople.org) — permaculture plant database
- ics npm package — iCalendar file generation

### AI Patterns
- Smashing Magazine (Feb 2026) — AI agent UX framework (Intent Preview, Progressive Autonomy, Explainable Rationale, Action Audit)
- LangChain ambient agent framework — notify/question/review patterns
- Fitbit Gemini health coach — proactive AI best practices
- PlantWhisperer (CHI 2026) — anthropomorphised plant chatbot research
- CottonBot — LLM-RAG with real sensor data for agriculture

### Open Source
- FarmBot (farm.bot) — 3D garden designer, REST API
- Growstuff (growstuff.org) — crowdsourced planting data
- Plant-it (github.com/MDeLuise/plant-it) — self-hosted plant care
- HortusFox — PHP garden manager with API integrations
- OpenFarm — shut down April 2025, gap in ecosystem
