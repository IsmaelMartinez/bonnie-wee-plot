# Excel Import Guide (Temporary Migration Tool)

> **Note**: This Excel import script is a **temporary migration tool** for users moving from Excel-based planning to the app's native system. Once you've imported your historical data, use the app's built-in export/import feature (DataManagement component) for all future backups and data transfers.

## What's New in V10

The import script now generates v10 format backups with these improvements:

- **Unified Areas System**: All beds, permanent plantings, and infrastructure are now represented as a single `Area` type with different kinds (rotation-bed, perennial-bed, tree, berry, herb, infrastructure)
- **Grid Positions**: Each area includes grid position data for proper visual layout
- **Season Structure**: Seasons now use `areas` array instead of legacy `beds` array
- **Type Safety**: Stronger typing with AreaKind discriminator instead of separate types

## Overview

Convert your Excel planning workbook to the app's native v10 backup format with unified areas system, then import it through the existing import/export interface.

## Prerequisites

Install Python dependencies (pandas and openpyxl):

```bash
pip3 install pandas openpyxl
```

## Step 1: Convert Excel to Backup Format

Run the conversion script:

```bash
python3 scripts/excel-to-backup.py "Allotment planning workbook.xlsx" my-backup.json
```

This creates a JSON file in the same format as the app's export function, containing:
- **AllotmentData**: All seasons, beds, and plantings
- **VarietyData**: All seed varieties with suppliers, prices, and status

## Step 2: Import via Web Interface

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the Allotment page:**
   ```
   http://localhost:3000/allotment
   ```

3. **Open Data Management:**
   - Click the download icon in the top toolbar
   - Select "Import Data" section

4. **Upload the backup file:**
   - Click "Select Backup File"
   - Choose `my-backup.json`
   - Data will be imported automatically

5. **Verify the import:**
   - Navigate through different years (2024, 2025)
   - Check `/seeds` page for imported varieties
   - Confirm plantings appear in correct beds

## What Gets Imported

### From "To grow" Sheets
- Seed varieties with names, suppliers, and prices
- Seed arrival status (have/ordered) per year
- Years each variety was used

### From "Sowing calendar" Sheets
- Plantings organized by bed and year
- Sowing, transplant, and harvest dates
- Variety names linked to plantings

### V10 Unified Areas System
- **Areas**: All beds converted to unified Area type with kind (rotation-bed, perennial-bed)
- **Grid Positions**: Default layout positions included for proper display
- **Rotation Groups**: Inferred from plant types in historical data
- **Seasons**: Use 'areas' array instead of legacy 'beds' structure

## Excel to App Bed Mapping

| Excel Bed | App Bed | Notes |
|-----------|---------|-------|
| A | A | Direct mapping |
| B | B1 | Defaults to B1 |
| C | C | Direct mapping |
| C/B | C | Takes first bed |
| D | D | Direct mapping |

## Plant Name Mapping

The script includes mappings for 50+ common plant names. If you see warnings about unmapped plants:

1. Add the mapping to `scripts/excel-to-backup.py` in the `PLANT_MAPPINGS` dictionary
2. Re-run the conversion
3. Check plant IDs match those in `src/lib/vegetable-database.ts`

## Backup Format (V10)

The output matches the app's v10 export format exactly:

```json
{
  "allotment": {
    "version": 10,
    "meta": {
      "name": "My Allotment",
      "location": "Scotland",
      "createdAt": "...",
      "updatedAt": "..."
    },
    "layout": {
      "areas": [
        {
          "id": "A",
          "name": "Bed A",
          "kind": "rotation-bed",
          "canHavePlantings": true,
          "icon": "🌱",
          "color": "zen-moss",
          "gridPosition": {"x": 8, "y": 2, "w": 2, "h": 2},
          "rotationGroup": "roots"
        }
      ]
    },
    "seasons": [
      {
        "year": 2024,
        "status": "historical",
        "areas": [
          {
            "areaId": "A",
            "rotationGroup": "roots",
            "plantings": [...],
            "notes": []
          }
        ]
      }
    ],
    "currentYear": 2025,
    "varieties": [],
    "maintenanceTasks": [],
    "gardenEvents": []
  },
  "varieties": {
    "version": 2,
    "varieties": [...],
    "meta": {...}
  },
  "exportedAt": "2026-01-11T12:00:00Z",
  "exportVersion": 10
}
```

This means:
- ✅ Works with existing import/export
- ✅ No special importer needed
- ✅ Can be edited manually if needed
- ✅ Version controlled with git

## Automatic Backup

The app creates an automatic backup before each import, so you can safely import your Excel data without losing existing data.

## After Import

Once imported, you can:
- **Export anytime**: Use Data Management to create new backups
- **Edit in app**: All data is now managed through the web interface
- **Version control**: Keep your JSON backups in git
- **No Excel needed**: The app is now your source of truth

## Future Excel Imports

To import new Excel data:
1. Update your Excel workbook
2. Run the conversion script again
3. Import the new backup file
4. Previous data will be replaced (backup created first)

## Troubleshooting

**"Unknown plant ID" warnings:**
- Add missing plants to `PLANT_MAPPINGS` in the script
- Check plant IDs in vegetable database

**Missing data after import:**
- Check console output for warnings
- Verify Excel sheet names match expected format
- Ensure data is in correct columns

**Import fails:**
- Validate JSON syntax: `python3 -m json.tool my-backup.json`
- Check file size isn't too large for localStorage
- Try exporting current data first to see expected format
