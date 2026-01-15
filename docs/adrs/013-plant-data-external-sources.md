# ADR 013: Plant Data External Sources and Validation Strategy

## Status
Proposed

## Date
2026-01-15

## Context

The vegetable database (`src/lib/vegetable-database.ts`) contains ~205 plants with companion/avoid plant arrays of inconsistent quality. Some entries have well-researched data, others are empty or contain vague references like "Vegetables (general)". Before migrating to Supabase, we need to validate and enhance this data using authoritative sources.

Key issues identified:
- Empty companion/avoid arrays (especially mushrooms, perennials)
- Naming inconsistencies ("Bush beans" vs "Beans") breaking validation
- Missing bidirectional relationships
- No confidence levels distinguishing proven vs anecdotal claims
- No external reference links (RHS, etc.)

## Decision

### Data Sources (by license compatibility)

**Tier 1 - Safe for Data Import:**
- OpenFarm (CC0/MIT) - Companion planting data, growing info
- University Extension Services - Public educational content

**Tier 2 - Link Only (do not copy content):**
- RHS (CC BY-NC 4.0) - Link to growing guides
- Garden Organic - Link to guides
- PFAF - Link with attribution

### Enhanced Data Model

Add to plant entries:
- `rhsUrl`: Link to RHS growing guide
- `confidence`: 'proven' | 'likely' | 'traditional' | 'anecdotal'
- `mechanism`: Why companion relationship works
- `botanicalName`: Scientific name for validation

### Validation Process

1. Export current data, flag quality issues
2. Cross-reference with OpenFarm API (if available) or scraped data
3. Use LLM to validate claims against University Extension corpus
4. Add confidence levels and mechanisms
5. Normalize plant names for consistent matching

## Consequences

### Positive
- Higher quality companion planting recommendations
- External links to authoritative sources (RHS)
- Better user trust through confidence indicators
- Proper legal compliance with source TOS

### Negative
- Significant one-time effort to validate 205 plants
- OpenFarm API may be unavailable (redirects to GitHub)
- Some traditional claims may lack scientific backing

### Mitigations
- Prioritize high-usage vegetables first
- Use OpenFarm's GitHub data exports if API unavailable
- Mark unverified claims as "traditional" rather than removing

## References

- Research: `/docs/research/plant-data-validation-strategy.md`
- RHS Terms: https://collections.rhs.org.uk/terms-of-use
- OpenFarm: https://github.com/openfarmcc/OpenFarm
