#!/usr/bin/env tsx
/**
 * Migration Script for User Export
 *
 * Migrates allotment-backup-2026-01-22.json to schema v13.
 *
 * Expected transformations:
 * - Merge varieties from allotment.varieties (32) and varieties.varieties (31)
 * - Fix 2 varieties with empty names (archive them)
 * - Fix 3 varieties with URLs instead of names (Electric, Senshyu, kingsland wight)
 * - Remove duplicate "Electric" variety
 * - Remove yearsUsed field (now computed from plantings)
 * - Add isArchived: false to all active varieties
 * - Update schema to v13
 * - Clear separate variety storage
 *
 * Usage:
 *   npx tsx scripts/migrate-user-export.ts
 */

import fs from 'fs'
import path from 'path'
import type { CompleteExport } from '../src/types/unified-allotment'

interface MigrationReport {
  varietiesBeforeMerge: { allotment: number; separate: number }
  varietiesAfterMerge: number
  duplicatesRemoved: Array<{ id: string; name: string; reason: string }>
  nameFixes: Array<{ id: string; old: string; new: string }>
  archived: Array<{ id: string; name: string; reason: string }>
  orphanedReferences: number
  plantingsProcessed: number
  seasonsProcessed: number
  schemaVersion: { old: number; new: number }
}

/**
 * Extract variety name from RHS URL
 */
function extractVarietyNameFromUrl(url: string): string | null {
  // Pattern: https://www.rhs.org.uk/plants/147978/allium-cepa-electric-pbr/details
  // Extract: "electric-pbr" -> "Electric"
  const match = url.match(/\/([^/]+)\/details$/)
  if (!match) return null

  const slug = match[1]
  // Extract variety name (remove species prefix)
  const parts = slug.split('-')

  // For "allium-cepa-electric-pbr", take from index 2 onwards
  // For "allium-cepa-senshyu-yellow", take from index 2 onwards
  const varietyParts = parts.slice(2)

  // Capitalize first letter of each part
  return varietyParts
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .replace(/\s+Pbr$/, '') // Remove "Pbr" suffix
}

/**
 * Extract variety name from organic catalogue URL
 */
function extractNameFromOrganicUrl(url: string): string | null {
  // Pattern: https://www.organiccatalogue.com/potatoes-onions-garlic/garlic-bulbs-plants/-garlic-bulbs-kingsland-wight_mh-74725
  // Extract: "kingsland-wight" -> "Kingsland Wight"
  const match = url.match(/\/([^/_]+)_[^/]+$/)
  if (!match) return null

  const slug = match[1]

  // Remove product type prefix if present (e.g., "garlic-bulbs-")
  const cleaned = slug.replace(/^[a-z]+-[a-z]+-/, '')

  // Capitalize first letter of each part
  return cleaned
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/**
 * Capitalize first letter of each word in a variety name
 */
function capitalizeVarietyName(name: string): string {
  if (!name) return name

  // Special cases to preserve
  const preserveCase = ['F1', 'F2', 'PBR', 'RHS']

  return name
    .split(' ')
    .map(word => {
      // Preserve special case words
      if (preserveCase.includes(word.toUpperCase())) {
        return word.toUpperCase()
      }
      // Capitalize first letter, keep rest as-is
      if (word.length === 0) return word
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

/**
 * Clean variety name (remove URLs, extract actual names)
 */
function cleanVarietyName(name: string): { cleaned: string; wasUrl: boolean; wasCapitalized: boolean } {
  if (!name || name.trim() === '') {
    return { cleaned: '', wasUrl: false, wasCapitalized: false }
  }

  let cleaned = name.trim()
  let wasUrl = false

  // Check if it's a URL
  if (name.startsWith('http://') || name.startsWith('https://')) {
    wasUrl = true
    if (name.includes('rhs.org.uk')) {
      const extracted = extractVarietyNameFromUrl(name)
      cleaned = extracted || name
    } else if (name.includes('organiccatalogue.com')) {
      const extracted = extractNameFromOrganicUrl(name)
      cleaned = extracted || name
    }
  }

  // Capitalize if first letter is lowercase
  const wasCapitalized = cleaned.length > 0 && cleaned[0] === cleaned[0].toLowerCase()
  if (wasCapitalized) {
    cleaned = capitalizeVarietyName(cleaned)
  }

  return { cleaned, wasUrl, wasCapitalized }
}

/**
 * Main migration function
 */
function migrateExport(inputPath: string): { data: CompleteExport; report: MigrationReport } {
  // 1. Load backup file
  console.log(`Loading backup file: ${inputPath}`)
  const rawData = fs.readFileSync(inputPath, 'utf-8')
  const data = JSON.parse(rawData) as CompleteExport

  const report: MigrationReport = {
    varietiesBeforeMerge: {
      allotment: data.allotment.varieties?.length || 0,
      separate: data.varieties?.varieties?.length || 0,
    },
    varietiesAfterMerge: 0,
    duplicatesRemoved: [],
    nameFixes: [],
    archived: [],
    orphanedReferences: 0,
    plantingsProcessed: 0,
    seasonsProcessed: 0,
    schemaVersion: {
      old: data.allotment.version,
      new: 13,
    },
  }

  console.log(`\nSchema version: ${report.schemaVersion.old} → ${report.schemaVersion.new}`)
  console.log(`Varieties before merge: allotment=${report.varietiesBeforeMerge.allotment}, separate=${report.varietiesBeforeMerge.separate}`)

  // 2. Build variety map (use allotment.varieties as source of truth, supplement with varieties.varieties)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const varietyMap = new Map<string, any>()

  // First, add all from allotment.varieties (these have clean names)
  if (data.allotment.varieties) {
    for (const variety of data.allotment.varieties) {
      varietyMap.set(variety.id, { ...variety })
    }
  }

  // Then, supplement with varieties.varieties (check for missing, fix URLs)
  if (data.varieties?.varieties) {
    for (const variety of data.varieties.varieties) {
      const existing = varietyMap.get(variety.id)

      if (!existing) {
        // New variety not in allotment.varieties
        varietyMap.set(variety.id, { ...variety })
      }
      // Note: We no longer merge plannedYears - seedsByYear is the source of truth
    }
  }

  // 3. Process varieties: fix names, detect duplicates, archive empty
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processedVarieties: any[] = []
  const nameToIds = new Map<string, string[]>()

  for (const variety of varietyMap.values()) {
    const { cleaned, wasUrl, wasCapitalized } = cleanVarietyName(variety.name)

    // Track name fixes
    if ((wasUrl || wasCapitalized) && cleaned !== variety.name) {
      report.nameFixes.push({
        id: variety.id,
        old: variety.name,
        new: cleaned,
      })
    }

    variety.name = cleaned

    // Archive varieties with empty names
    if (!cleaned || cleaned === '') {
      variety.isArchived = true
      report.archived.push({
        id: variety.id,
        name: `[Empty name - ${variety.plantId || 'unknown plant'}]`,
        reason: 'Empty name',
      })
    } else {
      // Track by name for duplicate detection
      const normalizedName = cleaned.toLowerCase().trim()
      if (!nameToIds.has(normalizedName)) {
        nameToIds.set(normalizedName, [])
      }
      nameToIds.get(normalizedName)!.push(variety.id)
    }

    // Remove yearsUsed field (computed in v13)
    delete variety.yearsUsed

    // Ensure isArchived is set
    if (variety.isArchived === undefined) {
      variety.isArchived = false
    }

    // Remove plannedYears if present (no longer part of StoredVariety - use seedsByYear instead)
    delete variety.plannedYears

    // Ensure seedsByYear exists
    if (!variety.seedsByYear) {
      variety.seedsByYear = {}
    }

    processedVarieties.push(variety)
  }

  // 4. Detect and handle duplicates
  for (const [, ids] of nameToIds.entries()) {
    if (ids.length > 1) {
      // Keep the first one, archive the rest
      const [keepId, ...duplicateIds] = ids

      for (const dupId of duplicateIds) {
        const variety = processedVarieties.find(v => v.id === dupId)
        if (variety) {
          variety.isArchived = true
          report.duplicatesRemoved.push({
            id: dupId,
            name: variety.name,
            reason: `Duplicate of ${keepId}`,
          })
        }
      }
    }
  }

  // 5. Count orphaned planting references
  const varietyNames = new Set(
    processedVarieties
      .filter(v => !v.isArchived && v.name)
      .map(v => v.name.toLowerCase().trim())
  )

  let orphanedCount = 0

  for (const season of data.allotment.seasons) {
    report.seasonsProcessed++

    for (const area of season.areas) {
      for (const planting of area.plantings || []) {
        report.plantingsProcessed++

        if (planting.varietyName) {
          const normalizedName = planting.varietyName.toLowerCase().trim()
          if (!varietyNames.has(normalizedName)) {
            orphanedCount++
          }
        }
      }
    }
  }

  report.orphanedReferences = orphanedCount

  // 6. Update schema
  data.allotment.version = 13
  data.allotment.varieties = processedVarieties

  // Clear separate variety storage (varieties now in allotment.varieties)
  data.varieties = {
    version: 2,
    varieties: [],
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  }

  // Update export metadata
  data.exportVersion = 13

  report.varietiesAfterMerge = processedVarieties.filter(v => !v.isArchived).length

  return { data, report }
}

/**
 * Generate markdown report
 */
function generateReportMarkdown(report: MigrationReport): string {
  const sections: string[] = []

  sections.push('# Migration Report: allotment-backup-2026-01-22.json → v13\n')
  sections.push(`Generated: ${new Date().toISOString()}\n`)

  sections.push('## Summary\n')
  sections.push(`- Schema version: ${report.schemaVersion.old} → ${report.schemaVersion.new}`)
  sections.push(`- Varieties before merge: allotment=${report.varietiesBeforeMerge.allotment}, separate=${report.varietiesBeforeMerge.separate}`)
  sections.push(`- Varieties after merge: ${report.varietiesAfterMerge} (${report.duplicatesRemoved.length + report.archived.length} archived)`)
  sections.push(`- Seasons processed: ${report.seasonsProcessed}`)
  sections.push(`- Plantings processed: ${report.plantingsProcessed}`)
  sections.push(`- Orphaned planting references: ${report.orphanedReferences}`)
  sections.push('')

  if (report.nameFixes.length > 0) {
    sections.push('## Name Fixes (URL → Clean Name)\n')
    for (const fix of report.nameFixes) {
      sections.push(`- \`${fix.id}\`: "${fix.old}" → "${fix.new}"`)
    }
    sections.push('')
  }

  if (report.archived.length > 0) {
    sections.push('## Archived Varieties\n')
    for (const item of report.archived) {
      sections.push(`- \`${item.id}\`: ${item.name} (${item.reason})`)
    }
    sections.push('')
  }

  if (report.duplicatesRemoved.length > 0) {
    sections.push('## Duplicates Removed\n')
    for (const dup of report.duplicatesRemoved) {
      sections.push(`- \`${dup.id}\`: "${dup.name}" (${dup.reason})`)
    }
    sections.push('')
  }

  if (report.orphanedReferences > 0) {
    sections.push('## Orphaned References\n')
    sections.push(`Found ${report.orphanedReferences} planting(s) with varietyName that don't match any active variety.`)
    sections.push('These plantings retain their varietyName for historical reference but won\'t link to variety records.')
    sections.push('')
  }

  sections.push('## Schema Changes (v12 → v13)\n')
  sections.push('- Removed `yearsUsed` from StoredVariety (now computed from plantings)')
  sections.push('- Added `isArchived: false` to all active varieties')
  sections.push('- Merged `allotment.varieties` and `varieties.varieties` into single array')
  sections.push('- Cleared separate variety storage (now empty)')
  sections.push('')

  sections.push('## Verification Steps\n')
  sections.push('1. Import `allotment-migrated-2026-01-22.json` into the app')
  sections.push('2. Verify variety count matches expected: ' + report.varietiesAfterMerge)
  sections.push('3. Verify all plantings are intact (check seasons 2024, 2025, 2026)')
  sections.push('4. Verify variety names are clean (no URLs)')
  sections.push('5. Check that archived varieties don\'t appear in dropdowns')
  sections.push('')

  return sections.join('\n')
}

/**
 * Main execution
 */
function main() {
  const inputPath = path.join(process.cwd(), 'allotment-backup-2026-01-22.json')
  const outputPath = path.join(process.cwd(), 'allotment-migrated-2026-01-22.json')
  const reportPath = path.join(process.cwd(), 'migration-report.md')

  // Check input file exists
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`)
    process.exit(1)
  }

  try {
    // Run migration
    const { data, report } = migrateExport(inputPath)

    // Write migrated file
    console.log(`\nWriting migrated file: ${outputPath}`)
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8')

    // Write report
    const reportMarkdown = generateReportMarkdown(report)
    console.log(`Writing migration report: ${reportPath}`)
    fs.writeFileSync(reportPath, reportMarkdown, 'utf-8')

    // Print summary
    console.log('\n' + '='.repeat(60))
    console.log('Migration completed successfully!')
    console.log('='.repeat(60))
    console.log(reportMarkdown)

    console.log('Next steps:')
    console.log('1. Review migration-report.md for details')
    console.log('2. Import allotment-migrated-2026-01-22.json in the app')
    console.log('3. Verify all data is intact')

  } catch (error) {
    console.error('\nMigration failed:', error)
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}

export { migrateExport, generateReportMarkdown, type MigrationReport }
