# Excel Import Guide

## Overview

Convert your Excel planning workbook to the app's native backup format, then import it through the existing import/export interface.

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

### Data Organization
- **Beds**: Excel beds (A, B, C, D) map to app beds (A, B1, C, D)
- **Rotation groups**: Inferred from plant types
- **Seasons**: Created as "historical" status for past years

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

## Backup Format

The output matches the app's export format exactly:

```json
{
  "allotment": {
    "version": 5,
    "meta": {...},
    "layout": {...},
    "seasons": [...],
    "currentYear": 2025,
    "maintenanceTasks": []
  },
  "varieties": {
    "version": 2,
    "varieties": [...],
    "meta": {...}
  },
  "exportedAt": "2026-01-05T12:00:00Z",
  "exportVersion": 5
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
