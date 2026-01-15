# Plant Data Validation Strategy: Authoritative Sources and Database Enhancement

## Executive Summary

This research document identifies authoritative sources for validating and improving the Community Allotment plant database.

**Important Legal Note**: This document covers linking to external resources and using open data. Before implementing, review the Terms of Service section at the end of this document to ensure compliance with each source's licensing requirements.

It covers companion planting, crop rotation, composting, soil care, and no-dig methods, with a focus on evidence-based horticulture. The document proposes an enhanced data structure for Supabase migration that includes external reference links to reputable sources like the RHS.

---

## Part 1: Current Database Assessment

### Database Statistics

The vegetable database at `/src/lib/vegetable-database.ts` contains approximately 205 plant entries. Each entry includes:

```typescript
interface Vegetable {
  id: string
  name: string
  category: VegetableCategory
  description: string
  planting: PlantingInfo
  care: CareRequirements
  companionPlants: string[]  // Quality varies significantly
  avoidPlants: string[]      // Many entries are empty
}
```

### Quality Issues Identified

The companion and avoid plant arrays show inconsistent quality across entries. Some entries have well-researched companions while others are empty or contain vague references like "Vegetables (general)" or "Most vegetables". There are naming inconsistencies such as "Bush beans" vs "Beans" that break string matching in the companion validation system. Many entries have empty `avoidPlants[]` arrays, which may indicate either genuinely neutral plants or simply missing data. Bidirectional relationships are not enforced, meaning if Tomato lists Basil as a companion, Basil may not reciprocate.

---

## Part 2: Authoritative Sources

### Primary UK Authority: Royal Horticultural Society (RHS)

The RHS is the UK's leading gardening charity and the most authoritative source for British gardening information. Their website provides comprehensive, evidence-based guidance that should serve as the primary external reference.

#### RHS URL Patterns for External Links

Individual vegetable growing guides follow this pattern:
- `https://www.rhs.org.uk/vegetables/[vegetable-name]/grow-your-own`

Examples:
- Tomatoes: https://www.rhs.org.uk/vegetables/tomatoes/grow-your-own
- Carrots: https://www.rhs.org.uk/vegetables/carrots/grow-your-own
- Potatoes: https://www.rhs.org.uk/vegetables/potatoes/grow-your-own
- Onions: https://www.rhs.org.uk/vegetables/onions/grow-your-own

Each RHS vegetable guide includes:
- Getting Started overview
- Choosing What To Grow (variety selection with AGM awards)
- Sowing and Planting guidance
- Plant Care (watering, feeding, mulching)
- Harvesting and Storing
- Problem Solving (pests and diseases)
- Month-by-month calendar showing sow, plant, and harvest windows

#### RHS Crop Rotation Guidance

The RHS provides authoritative crop rotation advice at https://www.rhs.org.uk/vegetables/crop-rotation

Their recommended four-year rotation groups:
- Year 1 - Legumes: Peas, broad beans, French and runner beans
- Year 2 - Brassicas: Brussels sprouts, cabbage, cauliflower, kale, kohl-rabi, oriental greens, radish, swede, turnips
- Year 3 - Potatoes: Potato family (tomatoes can go anywhere in rotation)
- Year 4 - Roots: Beetroot, carrot, celeriac, celery, Florence fennel, parsley, parsnip

Crops that don't fit rotation: Perennial vegetables (rhubarb, asparagus), cucurbits (courgettes, pumpkins, squashes), salads, and sweetcorn can be grown wherever convenient.

#### RHS Soil and Composting Resources

Key RHS soil care pages:
- Composting: https://www.rhs.org.uk/soil-composts-mulches/composting
- Organic Matter - What Is It: https://www.rhs.org.uk/soil-composts-mulches/what-is-organic-matter
- Organic Matter - How to Use: https://www.rhs.org.uk/soil-composts-mulches/organic-matter-how-to-use-in-garden
- Mulching with Organic Matter: https://www.rhs.org.uk/soil-composts-mulches/how-to-mulch-with-organic-matter
- Soil Types Explained: https://www.rhs.org.uk/soil-composts-mulches/soil-types
- The Magic of Soil (No-Dig): https://www.rhs.org.uk/gardening-for-the-environment/the-magic-of-soil
- Organic Gardening Guide: https://www.rhs.org.uk/gardening-for-the-environment/organic-gardening

RHS composting guidance recommends a green/brown balance of 25-50% soft leafy green material and 75-50% chopped woody brown material. Composting takes 6 months to 2 years to reach maturity.

### Garden Organic (formerly HDRA)

Garden Organic at https://www.gardenorganic.org.uk is the UK's leading organic growing charity. Their companion planting guidance at https://www.gardenorganic.org.uk/expert-advice/how-to-grow/how-to-grow-flowers/companion-or-mixed-planting emphasises that traditional companion planting "can often have unproven benefits" and focuses on how diversification and mixed schemes provide the biggest benefits.

Key insight from Garden Organic: The classic onion/carrot pairing "were thought to confuse the carrot root fly – but trials have shown inconsistent results." They recommend "covering with mesh or fleece is more likely to achieve consistent control."

### Charles Dowding and No-Dig Methods

Charles Dowding at https://charlesdowding.co.uk is the UK's leading proponent of no-dig gardening, awarded the RHS Elizabeth Medal of Honour in 2024 for his work promoting no-dig methods.

His long-running comparative trials at Homeacres show no-dig beds average 6% better production by weight with better crop quality and fewer weeds and slugs. The method mimics nature by adding organic matter to the top layer rather than incorporating it through digging.

### Scientific Research on Soil Health

Peer-reviewed research supports minimal soil disturbance approaches. A 15-year synthesis study published in Scientific Reports (Nature) found conversion from ploughing to reduced tillage increased topsoil organic carbon by 25%, microbial biomass by 32%, and microbial activity by 34%.

The USDA Natural Resources Conservation Service at https://www.nrcs.usda.gov/conservation-basics/natural-resource-concerns/soil/soil-health confirms that tillage destroys soil organic matter and structure, reduces water infiltration, increases runoff, and disrupts natural biological cycles.

Key scientific sources:
- Nature Scientific Reports: https://www.nature.com/articles/s41598-020-61320-8 (15-year reduced tillage study)
- PMC/NCBI: https://pmc.ncbi.nlm.nih.gov/articles/PMC2610104/ (Soil health in agricultural systems)
- MDPI Agriculture: https://www.mdpi.com/2077-0472/15/9/998 (Sustainable practices review)
- Frontiers in Soil Science: https://www.frontiersin.org/journals/soil-science/articles/10.3389/fsoil.2024.1462428/full (Soil health perspective)

### Companion Planting Academic Research

University Extension services provide the most balanced combination of scientific credibility and practical applicability:

- University of Minnesota: https://extension.umn.edu/planting-and-growing-guides/companion-planting-home-gardens
- UMass Amherst: https://ag.umass.edu/home-lawn-garden/fact-sheets/companion-planting-in-vegetable-garden
- West Virginia University: https://extension.wvu.edu/lawn-gardening-pests/gardening/garden-management/companion-planting

A systematic review analysing data from 18 countries across 63 articles found that intercropping promotes beneficial arthropods and reduces pest abundance. Cereal-legume combinations outperform cereal-cereal in both enhancing beneficial insects and reducing pests.

### Reference Books

For evidence-based companion planting, "Plant Partners: Science-Based Companion Planting Strategies for the Vegetable Garden" by Jessica Walliser (2020) received an American Horticultural Society Book Award. It covers soil conditioning, weed management, pest management, disease management, biological control, and pollination with all recommendations backed by scientific studies.

Classic references (useful for identifying claims to verify):
- "Carrots Love Tomatoes" by Louise Riotte (1975) - Traditional claims, many lack scientific validation
- "Rodale's Successful Organic Gardening: Companion Planting" (1994) - More evidence-focused than Riotte

### Open Data Sources

OpenFarm at https://github.com/openfarmcc/OpenFarm provides CC0 (Public Domain) licensed JSON data via REST API. The API includes companion plant fields alongside seed spacing, depth, watering regimen, and soil composition. This is the most promising source for bulk data import and cross-validation.

PFAF (Plants For A Future) at https://pfaf.org contains over 8000 plants focused on temperate regions including the UK. Scraped data available at https://github.com/saulshanabrook/pfaf-data.

---

## Part 3: Enhanced Data Structure for Supabase

### Proposed Schema

```sql
-- Core plants table (migrating from vegetable-database.ts)
CREATE TABLE plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,           -- e.g., 'tomato', 'basil'
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  botanical_name TEXT,                  -- Scientific name
  description TEXT,

  -- External reference links
  rhs_url TEXT,                         -- e.g., 'https://www.rhs.org.uk/vegetables/tomatoes/grow-your-own'
  wikipedia_url TEXT,
  pfaf_url TEXT,

  -- Crop rotation
  rotation_group TEXT CHECK (rotation_group IN (
    'legumes', 'brassicas', 'potatoes', 'roots', 'alliums',
    'cucurbits', 'solanaceae', 'permanent', 'any'
  )),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plant relationships with confidence and mechanism
CREATE TABLE plant_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_a_id UUID REFERENCES plants(id) ON DELETE CASCADE,
  plant_b_id UUID REFERENCES plants(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('companion', 'avoid')),

  -- Evidence quality
  confidence_level TEXT NOT NULL CHECK (confidence_level IN (
    'proven',      -- Peer-reviewed research
    'likely',      -- Extension service recommendation
    'traditional', -- Established gardening tradition
    'anecdotal'    -- Personal observations
  )),

  -- How the relationship works
  mechanism TEXT CHECK (mechanism IN (
    'allelopathy',           -- Chemical interaction (positive or negative)
    'pest_confusion',        -- Visual/olfactory disruption of pests
    'pest_trap',             -- Attracts pests away from target
    'beneficial_attraction', -- Attracts predatory insects
    'nitrogen_fixation',     -- Legume nitrogen sharing
    'physical_support',      -- Structural support (e.g., Three Sisters)
    'shade_provision',       -- Microclimate modification
    'weed_suppression',      -- Living mulch effect
    'pollinator_support',    -- Increased pollination
    'disease_suppression',   -- Reduces disease pressure
    'unknown'                -- Traditional claim, mechanism unclear
  )),

  bidirectional BOOLEAN DEFAULT true,
  notes TEXT,
  source_reference TEXT,               -- Citation or URL

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plant_a_id, plant_b_id, relationship_type)
);

-- Soil and care information
CREATE TABLE soil_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID REFERENCES plants(id) ON DELETE CASCADE,

  -- Soil requirements
  preferred_ph_min DECIMAL(3,1),
  preferred_ph_max DECIMAL(3,1),
  soil_type TEXT[],                    -- ['loam', 'clay', 'sandy', 'chalky']
  drainage TEXT CHECK (drainage IN ('well-drained', 'moist', 'wet')),
  organic_matter_need TEXT CHECK (organic_matter_need IN ('low', 'medium', 'high')),

  -- Composting relevance
  compostable_parts TEXT[],            -- ['leaves', 'stems', 'roots']
  green_manure_suitable BOOLEAN DEFAULT false,
  nitrogen_fixer BOOLEAN DEFAULT false,

  notes TEXT
);

-- External resources and references
CREATE TABLE plant_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID REFERENCES plants(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN (
    'growing_guide',      -- How to grow
    'pest_disease',       -- Problem solving
    'variety_info',       -- Cultivar information
    'video',              -- Video guides
    'scientific_paper'    -- Research references
  )),
  source TEXT NOT NULL,               -- 'rhs', 'garden_organic', 'university_extension'
  url TEXT NOT NULL,
  title TEXT,
  last_verified TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_plants_category ON plants(category);
CREATE INDEX idx_plants_rotation_group ON plants(rotation_group);
CREATE INDEX idx_plant_relationships_a ON plant_relationships(plant_a_id);
CREATE INDEX idx_plant_relationships_b ON plant_relationships(plant_b_id);
CREATE INDEX idx_plant_resources_plant ON plant_resources(plant_id);
```

### RHS URL Generation Pattern

For automatic RHS link generation, most vegetables follow this pattern:

```typescript
function generateRHSUrl(slug: string): string | null {
  // Map of known RHS vegetable URLs
  const rhsVegetables = [
    'tomatoes', 'carrots', 'potatoes', 'onions', 'garlic', 'leeks',
    'peas', 'beans', 'beetroot', 'parsnips', 'cabbage', 'cauliflower',
    'broccoli', 'kale', 'spinach', 'lettuce', 'courgettes', 'squash',
    'pumpkins', 'cucumbers', 'peppers', 'aubergines', 'sweetcorn',
    'asparagus', 'rhubarb', 'strawberries', 'raspberries', 'blueberries'
  ]

  if (rhsVegetables.includes(slug)) {
    return `https://www.rhs.org.uk/vegetables/${slug}/grow-your-own`
  }

  // Fruit has different pattern
  const rhsFruits = ['apples', 'pears', 'plums', 'cherries']
  if (rhsFruits.includes(slug)) {
    return `https://www.rhs.org.uk/fruit/${slug}/grow-your-own`
  }

  return null
}
```

---

## Part 4: LLM-Assisted Data Validation Process

### Phase 1: Export and Categorise Current Data

Extract the existing 205 plant entries to a structured format. Group by category to identify patterns and gaps. Flag entries with empty companion/avoid arrays or vague references.

### Phase 2: Compile Reference Corpus

Build a validation corpus from:
- RHS vegetable growing guides (scrape or manually compile)
- University Extension fact sheets
- Plant Partners book summaries
- Garden Organic guidance
- OpenFarm structured data

### Phase 3: LLM Validation Prompt Template

For each plant, prompt an LLM with:

```
Plant: Tomato
Current companions: ['Basil', 'Carrots', 'Marigolds']
Current avoid: ['Fennel', 'Brassicas', 'Corn']

Using the provided reference corpus, evaluate each relationship:

1. For each companion claim:
   - Is this supported by research? (proven/likely/traditional/anecdotal)
   - What is the mechanism? (pest_confusion/allelopathy/etc)
   - Is the relationship bidirectional?
   - Source reference if available

2. For each avoid claim:
   - Is this supported by research?
   - What is the mechanism?
   - Source reference

3. Missing relationships:
   - Are there well-documented companions not listed?
   - Are there avoid plants not listed?

4. Name normalisation:
   - Should "Basil" be linked to a specific database entry?
   - Are there variant names to handle?
```

### Phase 4: Human Review Queue

Flag high-confidence changes for automated application. Queue uncertain claims for manual review. Prioritise vegetables and herbs (highest user impact) over ornamental plants.

### Phase 5: External Link Population

For each plant, attempt to find and verify:
- RHS growing guide URL
- Wikipedia article
- PFAF entry
- Garden Organic resources

Store last_verified timestamp to track link rot.

---

## Part 5: Crop Rotation Integration

### Current Rotation Groups

The existing codebase defines rotation groups in `/src/lib/rotation.ts`:

```typescript
type RotationGroup =
  | 'brassicas'
  | 'legumes'
  | 'roots'
  | 'solanaceae'
  | 'alliums'
  | 'cucurbits'
  | 'permanent'
```

### RHS Alignment

Map existing categories to RHS four-year rotation:

| Year | RHS Group | Our Categories |
|------|-----------|----------------|
| 1 | Legumes | legumes |
| 2 | Brassicas | brassicas |
| 3 | Potatoes | solanaceae (subset) |
| 4 | Roots | roots |
| Any | Flexible | cucurbits, alliums, leafy-greens |
| N/A | Permanent | permanent, herbs, berries, fruit-trees |

### Rotation Guidance Content

Add rotation-specific advice to plant entries:

```typescript
interface RotationGuidance {
  groupBenefits: string[]     // Why this group in this position
  precedingBenefit: string    // What benefit from previous group
  followingConsideration: string // What to consider for next group
  rhsRotationUrl: string      // Link to RHS rotation page
}
```

Example for Brassicas:
- Group benefits: Heavy feeders that use nitrogen fixed by preceding legumes
- Preceding benefit: Follow legumes to utilise fixed nitrogen
- Following consideration: Don't precede legumes (club root risk)
- RHS URL: https://www.rhs.org.uk/vegetables/crop-rotation

---

## Part 6: Composting and Soil Care Integration

### Compostability Data

Add to plant entries:

```typescript
interface CompostInfo {
  compostableAtEnd: boolean       // Can harvest waste be composted?
  diseaseRisk: string[]           // Diseases that may persist in compost
  hotCompostRequired: boolean     // Need hot composting for safety?
  greenBrownRatio: 'green' | 'brown' | 'mixed'
  notes: string[]
}
```

Example for Tomatoes:
- compostableAtEnd: true (foliage yes, but watch for blight)
- diseaseRisk: ['late_blight', 'early_blight']
- hotCompostRequired: true (if blight present)
- greenBrownRatio: 'green'
- notes: ["Don't compost if blight present", "Stems break down slowly"]

### Soil Preference Data

Enhance care requirements:

```typescript
interface EnhancedCare extends CareRequirements {
  soilPh: { min: number, max: number }
  soilType: SoilType[]
  organicMatterNeed: 'low' | 'medium' | 'high'
  mulchBenefit: 'essential' | 'beneficial' | 'optional'
  noDigSuitable: boolean
  rhsSoilUrl?: string
}
```

### External Resource Links

Add to each plant:

```typescript
interface ExternalResources {
  rhsGrowingGuide?: string
  rhsPestDisease?: string
  gardenOrganicUrl?: string
  charlesDowdingUrl?: string
  wikipediaUrl?: string
  scientificName?: string
}
```

---

## Part 7: Validation Priorities

### High Priority (Immediate Impact)

Normalise plant names to eliminate variants like "Bush beans" vs "Beans". This is breaking the companion validation string matching. Create a mapping table for common variants.

Validate these well-documented relationships:
- Three Sisters (corn, beans, squash): nitrogen fixation + physical support
- Tomato-basil: pest confusion + flavour (some evidence)
- Carrot-onion: mutual pest deterrence (inconsistent research)
- Brassica-mint: cabbage pest deterrence

### Medium Priority (Data Enrichment)

Add RHS URLs to all vegetables with known RHS growing guides. Populate rotation_group for all plants based on RHS categories. Add confidence_level to existing companion claims.

### Lower Priority (Completeness)

Research and populate companion data for entries with empty arrays (mushrooms, perennial flowers, bulbs). Add soil preference data. Add composting guidance.

---

## Part 8: Implementation Plan

### Step 1: Create Mapping Tables

Build normalisation tables for plant name variants. Map current database IDs to RHS URL slugs. Verify RHS URLs exist (some plants may not have dedicated pages).

### Step 2: Enhance TypeScript Types

Add optional fields to Vegetable interface:

```typescript
interface Vegetable {
  // Existing fields...

  // New reference fields
  rhsUrl?: string
  wikipediaUrl?: string
  botanicalName?: string

  // Enhanced companion data (for migration)
  companionData?: {
    plant: string
    confidence: 'proven' | 'likely' | 'traditional' | 'anecdotal'
    mechanism?: string
    bidirectional?: boolean
  }[]
}
```

### Step 3: LLM Batch Processing

Process plants in batches by category. Start with solanaceae (tomatoes, peppers, potatoes) as they have most user interest. Use Claude with the reference corpus to validate and enhance each entry.

### Step 4: Supabase Migration

Once validated, migrate to Supabase schema. Maintain TypeScript types that can be populated from Supabase queries. Use build-time or runtime fetching depending on performance requirements.

---

## Part 9: Terms of Service and Licensing Compliance

This section documents the licensing requirements for each external source we plan to use. Community Allotment is a non-commercial, open-source project, which affects how we can use these resources.

### Usage Types

We distinguish between three types of usage:

1. **Linking**: Providing hyperlinks to external pages (generally permitted)
2. **Citation**: Referencing information with attribution (varies by source)
3. **Data Import**: Bulk importing structured data into our database (requires compatible license)

### Source-by-Source Analysis

#### Royal Horticultural Society (RHS)

**License**: CC BY-NC 4.0 for most content (Non-Commercial with Attribution)

**What's Permitted**:
- Linking to RHS pages (no explicit restriction found)
- Non-commercial use for private study, teaching, learning, and research
- Distribution with proper attribution for non-commercial purposes

**What's Required**:
- Attribution: "Image © The Royal Horticultural Society" for any images
- Credit the RHS as authors where content is referenced
- Include URL citations with access dates for academic use

**What's Prohibited**:
- Commercial use without explicit permission
- Text/data mining or web scraping (explicitly prohibited for Heritage Catalogue)
- Using RHS trademarks or logos without written consent

**Our Approach**:
- Link to RHS growing guides (e.g., `rhs.org.uk/vegetables/tomatoes/grow-your-own`)
- Do NOT copy RHS content into our database
- Use links as external references only
- Contact webmaster@rhs.org.uk if clarification needed

**Reference**: https://collections.rhs.org.uk/terms-of-use

---

#### OpenFarm

**License**: MIT License (code), CC0 Public Domain (data)

**What's Permitted**:
- Free use, modification, distribution of code and data
- Commercial and non-commercial use
- Bulk data import via API

**What's Required**:
- Include MIT license notice for code usage
- Attribution appreciated but not legally required for CC0 data

**What's Prohibited**:
- Nothing significant - very permissive

**Our Approach**:
- Can import companion planting data from OpenFarm API
- Include attribution: "Companion data sourced from OpenFarm (openfarmcc.org)"
- Best open data source for bulk import

**Reference**: https://github.com/openfarmcc/OpenFarm/blob/mainline/LICENSE

---

#### Plants For A Future (PFAF)

**License**: CC BY 4.0 (Attribution) with non-commercial restrictions for certain uses

**What's Permitted**:
- Linking to PFAF plant pages
- Using database for educational/research purposes
- Copying with full attribution and links back to PFAF

**What's Required**:
- Full attribution to Plants For A Future
- Prominent links back to pfaf.org on websites using their data
- Share-alike: additions/corrections should be shared back

**What's Prohibited**:
- Commercial use without permission (contact them for commercial licensing)
- Using on advertising-driven websites without permission
- Using images without per-image attribution

**Our Approach**:
- Link to PFAF pages for additional plant information
- Do NOT bulk import PFAF data without further clarification
- If we use PFAF data, include prominent attribution and share any improvements

**Reference**: https://pfaf.org/user/cmspage.aspx?pageid=136 (Copyright Information)

---

#### Garden Organic

**Status**: Terms of Service not found in public search

**Our Approach**:
- Link to Garden Organic guides only
- Do NOT copy content
- Contact them before any substantive use of their information
- They are a charity promoting organic growing, likely amenable to educational use

**Contact**: info@gardenorganic.org.uk

---

#### Charles Dowding / No-Dig

**Status**: Commercial author with published books and paid courses

**Our Approach**:
- Link to charlesdowding.co.uk for no-dig information
- Reference his books appropriately
- Do NOT reproduce his content
- His methods are general knowledge; the specific presentation is copyrighted

---

#### University Extension Services

**License**: Generally public domain or educational use permitted (US government-funded)

**Our Approach**:
- Link to extension service fact sheets
- Can cite findings with attribution
- Most extension content is explicitly for public education

---

### Recommended Implementation Strategy

Given the licensing landscape, we recommend this tiered approach:

**Tier 1 - Safe to Use Freely**:
- OpenFarm data (CC0/MIT) - can import companion data
- University Extension citations - public educational content
- Links to any source - linking is not copying

**Tier 2 - Use with Attribution**:
- PFAF data with prominent attribution and links
- RHS information cited with proper credit (not copied)

**Tier 3 - Link Only**:
- RHS growing guides - link, don't copy
- Garden Organic content - link, don't copy
- Charles Dowding content - link, don't copy

**Tier 4 - Requires Permission**:
- RHS images or substantial content extraction
- PFAF for commercial or advertising-supported use
- Any bulk scraping of RHS content

### Attribution Template

When displaying external references in the app, use this format:

```
Learn more from the Royal Horticultural Society:
[How to Grow Tomatoes](https://www.rhs.org.uk/vegetables/tomatoes/grow-your-own)

Companion data includes information from:
- OpenFarm (openfarmcc.org) - CC0 Public Domain
- Plants For A Future (pfaf.org) - CC BY 4.0
```

### Legal Disclaimer

This analysis is provided for informational purposes only and does not constitute legal advice. Terms of service may change. When in doubt, contact the source organisation directly before using their content.

For Community Allotment specifically:
- We are a non-commercial, open-source project
- We do not display advertising
- Our use is educational/community benefit
- We should still respect all licensing requirements

---

## Sources and References

### UK Authorities
- [RHS Plant Finder and Growing Guides](https://www.rhs.org.uk/plants)
- [RHS Crop Rotation](https://www.rhs.org.uk/vegetables/crop-rotation)
- [RHS Composting Guide](https://www.rhs.org.uk/soil-composts-mulches/composting)
- [RHS Soil and Organic Matter](https://www.rhs.org.uk/soil-composts-mulches/organic-matter-how-to-use-in-garden)
- [Garden Organic Companion Planting](https://www.gardenorganic.org.uk/expert-advice/how-to-grow/how-to-grow-flowers/companion-or-mixed-planting)
- [Charles Dowding No Dig](https://charlesdowding.co.uk/)

### University Extension Services
- [University of Minnesota - Companion Planting](https://extension.umn.edu/planting-and-growing-guides/companion-planting-home-gardens)
- [UMass Amherst - Companion Planting](https://ag.umass.edu/home-lawn-garden/fact-sheets/companion-planting-in-vegetable-garden)
- [West Virginia University - Companion Planting](https://extension.wvu.edu/lawn-gardening-pests/gardening/garden-management/companion-planting)
- [West Virginia University - Crop Rotation](https://extension.wvu.edu/lawn-gardening-pests/gardening/garden-management/crop-rotation-guide-for-vegetable-gardens)

### Scientific Research
- [Nature Scientific Reports - 15-Year Reduced Tillage Study](https://www.nature.com/articles/s41598-020-61320-8)
- [PMC - Soil Health in Agricultural Systems](https://pmc.ncbi.nlm.nih.gov/articles/PMC2610104/)
- [MDPI Agronomy - Allelopathic Interactions](https://www.mdpi.com/journal/agronomy/special_issues/1A3FO81Z85)
- [USDA NRCS - Soil Health](https://www.nrcs.usda.gov/conservation-basics/natural-resource-concerns/soil/soil-health)

### Open Data Sources
- [OpenFarm API](https://github.com/openfarmcc/OpenFarm)
- [PFAF Database](https://pfaf.org/)
- [USDA Plants Database](https://plants.usda.gov/)

### Books
- "Plant Partners" by Jessica Walliser (2020) - Evidence-based companion planting
- "No Dig" by Charles Dowding (2022) - No-dig methodology
- "RHS Vegetables for the Gourmet Gardener" - Variety selection

---

*Document created: January 14, 2026*
*Purpose: Guide plant data validation and Supabase migration*
