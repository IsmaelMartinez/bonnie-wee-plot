#!/usr/bin/env python3
"""
TEMPORARY MIGRATION TOOL - Convert Excel Workbook to App Backup Format (v11)

This script is a one-time migration tool for users moving from Excel-based
planning to the app's native system. After migrating, use the app's built-in
export/import feature (DataManagement component) for backups.

Converts Allotment Planning Workbook to v11 backup format with unified areas.
Outputs the same format as the app's export function.

v11 format features:
- Unified 'areas' array (rotation-bed, perennial-bed, tree, berry, herb, infrastructure)
- Seasons use 'areas' array for per-year plantings
- Includes gridPosition for visual layout
- Singular plant IDs (pea not peas, broad-bean not broad-beans)

Usage: python3 excel-to-backup.py <excel-file> <output-json>

Requirements:
  pip install pandas openpyxl
"""

import pandas as pd
import json
import sys
from datetime import datetime

# Plant name mappings from Excel to database IDs
# v11: Use singular form for plant IDs (pea not peas, bean not beans)
PLANT_MAPPINGS = {
    'peas': 'pea',
    'pea': 'pea',
    'beans': 'broad-bean',
    'beans & peas': 'broad-bean',
    'broad bean \'ratio\'': 'broad-bean',
    'broad beans': 'broad-bean',
    'french beans': 'french-bean',
    'french bean': 'french-bean',
    'french borlotti stokkievitsboon': 'french-bean',
    'runner beans': 'runner-bean',
    'runner bean': 'runner-bean',
    'onions': 'onion',
    'onion': 'onion',
    'onion electric (red autumn)': 'onion',
    'onion senshyu (white autumn)': 'onion',
    'white senshyn': 'onion',
    'red electric': 'onion',
    'onion \'centurion\'': 'onion',
    'spring onion \'lilia\'': 'spring-onion',
    'spring onion parade (organic)': 'spring-onion',
    'spring onions': 'spring-onion',
    'onion (spring) keravel pink': 'spring-onion',
    'potatoes': 'potato',
    'potato': 'potato',
    'potatoes (early)': 'potato',
    'charlotte seed': 'potato',
    'heidi red seed': 'potato',
    'organic colleen': 'potato',
    'organic setanta': 'potato',
    'garlic': 'garlic',
    'garlic (autumn) kingsland': 'garlic',
    'garlic \'flavor\'': 'garlic',
    'caulk wight (hardneck)': 'garlic',
    'leeks': 'leek',
    'leek': 'leek',
    'lancelot': 'leek',
    'leeks seeds tape': 'leek',
    'carrots': 'carrot',
    'carrot': 'carrot',
    'carrot nantes 2 (organic)': 'carrot',
    'beetroot': 'beetroot',
    'courgettes': 'courgette',
    'courgette': 'courgette',
    'courguette': 'courgette',
    'wave climber': 'courgette',
    'cauliflower': 'cauliflower',
    'pak choi': 'pak-choi',
    'pak choi baby': 'pak-choi',
    'lettuce': 'lettuce',
    'spinach': 'spinach',
    'chard': 'chard',
    'rainbow chard': 'chard',
    'strawberries': 'strawberry',
    'strawberry': 'strawberry',
    'broccoli': 'broccoli',
    'cornflower': 'cornflower',
    'cornflower \'blue diadem\'': 'cornflower',
    'cosmos': 'cosmos',
    'cosmos \'sonata mixed\'': 'cosmos',
    'calendula': 'calendula',
    'pumpkin': 'pumpkin',
    'sweetcorn': 'sweetcorn',
    'spinach \'palco\' f1': 'spinach',
    'sweet pea \'old fashioned mixed\'': 'sweet-pea',
    'sweet pea': 'sweet-pea',
    'red - marigold (afro-french) \'zenith mixed\' f1': 'marigold',
    'marigold (dwarf french) \'disco\'': 'marigold',
    'marigold': 'marigold',
    'sunflower \'medium red flower\'': 'sunflower',
    'sunflower': 'sunflower',
    'zinnia \'dahlia flowered mixed\'': 'zinnia',
    'zinnia': 'zinnia',
    'lupin': 'lupin',
    'nasturtium': 'nasturtium',
}

# Bed ID mapping from Excel to app
BED_MAPPING = {
    'A': 'A',
    'C': 'C',
    'C/B': 'C',
    'D': 'D',
    'B': 'B1',
}

def generate_id(prefix):
    """Generate a unique ID"""
    import random, string
    return f"{prefix}-{''.join(random.choices(string.ascii_lowercase + string.digits, k=8))}"

def normalize_plant_name(name):
    if pd.isna(name):
        return None
    return str(name).lower().strip().replace('  ', ' ')

def map_plant_id(type_name):
    normalized = normalize_plant_name(type_name)
    if not normalized:
        return None
    if normalized in PLANT_MAPPINGS:
        return PLANT_MAPPINGS[normalized]
    cleaned = normalized.split('(')[0].strip()
    if cleaned in PLANT_MAPPINGS:
        return PLANT_MAPPINGS[cleaned]
    return None

def parse_varieties(df, year):
    varieties = []
    last_type = None
    for _, row in df.iterrows():
        if pd.isna(row.get('Variety')):
            continue
        plant_type = row.get('Type')
        if pd.isna(plant_type):
            plant_type = last_type
        else:
            last_type = plant_type
        if not plant_type:
            continue
        plant_id = map_plant_id(plant_type)
        if not plant_id:
            print(f"Warning: Could not map '{plant_type}' to plant ID", file=sys.stderr)
            continue
        varieties.append({
            'plantId': plant_id,
            'name': str(row['Variety']).strip(),
            'supplier': str(row.get('Supplier', '')).strip() if pd.notna(row.get('Supplier')) else None,
            'price': float(row.get('Price', 0)) if pd.notna(row.get('Price')) else None,
            'year': year,
            'arrived': bool(row.get('Arrived')) if pd.notna(row.get('Arrived')) else False
        })
    return varieties

def parse_plantings(df, year):
    plantings = []
    last_type = None
    for idx, row in df.iterrows():
        if idx < 2:
            continue
        variety_col = df.columns[1]
        variety = row.get(variety_col)
        if pd.isna(variety):
            continue
        type_col = df.columns[0]
        plant_type = row.get(type_col)
        if pd.isna(plant_type):
            plant_type = last_type
        else:
            last_type = plant_type
        if not plant_type:
            continue
        plant_id = map_plant_id(plant_type)
        if not plant_id:
            continue
        bed_col = df.columns[2]
        bed = row.get(bed_col)
        sow_date = None
        plant_out_date = None
        harvest_date = None
        for col in df.columns:
            val = row[col]
            if pd.notna(val) and isinstance(val, (pd.Timestamp, datetime)):
                col_lower = str(col).lower()
                if 'sow' in col_lower or 'january' in col_lower or 'february' in col_lower:
                    if not sow_date:
                        sow_date = val.strftime('%Y-%m-%d')
                elif 'plant' in col_lower:
                    if not plant_out_date:
                        plant_out_date = val.strftime('%Y-%m-%d')
                elif 'harvest' in col_lower:
                    if not harvest_date:
                        harvest_date = val.strftime('%Y-%m-%d')
        plantings.append({
            'plantId': plant_id,
            'varietyName': str(variety).strip(),
            'bed': str(bed).strip() if pd.notna(bed) else None,
            'sowDate': sow_date,
            'transplantDate': plant_out_date,
            'harvestDate': harvest_date,
            'year': year
        })
    return plantings

def main():
    if len(sys.argv) < 3:
        print("Usage: python excel-to-backup.py <excel-file> <output-json>", file=sys.stderr)
        sys.exit(1)

    excel_file = sys.argv[1]
    output_file = sys.argv[2]
    now = datetime.now().isoformat() + 'Z'

    # Read all sheets
    all_sheets = pd.read_excel(excel_file, sheet_name=None)

    all_varieties_raw = []
    all_plantings_raw = []

    # Parse 2024 data
    if '2024 To grow' in all_sheets:
        all_varieties_raw.extend(parse_varieties(all_sheets['2024 To grow'], 2024))
    if 'Sowing calendar 2024' in all_sheets:
        all_plantings_raw.extend(parse_plantings(all_sheets['Sowing calendar 2024'], 2024))

    # Parse 2025 data
    if '2025 To grow' in all_sheets:
        all_varieties_raw.extend(parse_varieties(all_sheets['2025 To grow'], 2025))
    if 'Sowing calendar 25' in all_sheets:
        all_plantings_raw.extend(parse_plantings(all_sheets['Sowing calendar 25'], 2025))

    # Build Varieties Data
    variety_map = {}
    for v in all_varieties_raw:
        key = (v['plantId'], v['name'])
        if key not in variety_map:
            variety_map[key] = {
                'id': generate_id('variety'),
                'plantId': v['plantId'],
                'name': v['name'],
                'supplier': v['supplier'],
                'price': v['price'],
                'yearsUsed': [],
                'plannedYears': [],
                'seedsByYear': {}
            }
        variety_map[key]['yearsUsed'].append(v['year'])
        variety_map[key]['seedsByYear'][v['year']] = 'have' if v['arrived'] else 'ordered'

    varieties_output = []
    for v in variety_map.values():
        v['yearsUsed'] = sorted(list(set(v['yearsUsed'])))
        cleaned = {k: v for k, v in v.items() if v is not None and v != {}}
        varieties_output.append(cleaned)

    # Build Seasons Data
    seasons_map = {}
    for p in all_plantings_raw:
        year = p['year']
        bed_id = BED_MAPPING.get(p['bed'], None)
        if not bed_id:
            continue

        if year not in seasons_map:
            seasons_map[year] = {}
        if bed_id not in seasons_map[year]:
            seasons_map[year][bed_id] = []

        planting = {
            'id': generate_id('planting'),
            'plantId': p['plantId'],
        }
        if p['varietyName']:
            planting['varietyName'] = p['varietyName']
        if p['sowDate']:
            planting['sowDate'] = p['sowDate']
        if p['transplantDate']:
            planting['transplantDate'] = p['transplantDate']
        if p['harvestDate']:
            planting['harvestDate'] = p['harvestDate']

        seasons_map[year][bed_id].append(planting)

    # Infer rotation groups
    def infer_rotation_group(plantings):
        # Simple mapping based on plantId (v11: uses singular form)
        group_counts = {}
        for p in plantings:
            pid = p['plantId']
            # Simplified rotation group inference
            if pid in ['pea', 'broad-bean', 'french-bean', 'runner-bean']:
                group = 'legumes'
            elif pid in ['cabbage', 'kale', 'broccoli', 'cauliflower', 'brussels-sprout']:
                group = 'brassicas'
            elif pid in ['carrot', 'beetroot', 'parsnip', 'potato', 'turnip']:
                group = 'roots'
            elif pid in ['onion', 'garlic', 'leek', 'spring-onion', 'shallot']:
                group = 'alliums'
            elif pid in ['courgette', 'pumpkin', 'squash', 'cucumber', 'melon']:
                group = 'cucurbits'
            elif pid in ['tomato', 'pepper', 'aubergine', 'chilli']:
                group = 'solanaceae'
            else:
                group = 'roots'  # default
            group_counts[group] = group_counts.get(group, 0) + 1
        if not group_counts:
            return 'roots'
        return max(group_counts, key=group_counts.get)

    seasons_output = []
    for year in sorted(seasons_map.keys()):
        beds = []
        for bed_id in sorted(seasons_map[year].keys()):
            plantings = seasons_map[year][bed_id]
            beds.append({
                'bedId': bed_id,
                'rotationGroup': infer_rotation_group(plantings),
                'plantings': plantings
            })

        seasons_output.append({
            'year': year,
            'status': 'historical',
            'beds': beds,
            'notes': 'Imported from Excel',
            'createdAt': now,
            'updatedAt': now
        })

    # Build v10 unified areas from beds
    # Default grid positions for common beds
    grid_positions = {
        'E': {'x': 0, 'y': 0, 'w': 2, 'h': 2},
        'C': {'x': 0, 'y': 4, 'w': 2, 'h': 3},
        'B2-prime': {'x': 2, 'y': 2, 'w': 2, 'h': 2},
        'B2': {'x': 2, 'y': 4, 'w': 2, 'h': 4},
        'B1-prime': {'x': 4, 'y': 2, 'w': 2, 'h': 2},
        'B1': {'x': 4, 'y': 4, 'w': 2, 'h': 4},
        'A': {'x': 8, 'y': 2, 'w': 2, 'h': 2},
        'raspberries': {'x': 8, 'y': 4, 'w': 2, 'h': 4},
        'D': {'x': 2, 'y': 9, 'w': 4, 'h': 3},
    }

    areas = []
    for bed_id in ['A', 'B1', 'B2', 'B1-prime', 'B2-prime', 'C', 'D', 'E', 'raspberries']:
        kind = 'perennial-bed' if bed_id == 'raspberries' else 'rotation-bed'
        icon = '🍇' if bed_id == 'raspberries' else '🌱'

        area = {
            'id': bed_id,
            'name': f'Bed {bed_id}' if bed_id != 'raspberries' else 'Raspberries',
            'kind': kind,
            'canHavePlantings': True,
            'icon': icon,
            'color': 'zen-moss',
            'createdAt': now
        }

        # Add grid position if available
        if bed_id in grid_positions:
            area['gridPosition'] = grid_positions[bed_id]

        # Add rotation group for first season if we have data
        if seasons_map and kind == 'rotation-bed':
            first_year = min(seasons_map.keys())
            if bed_id in seasons_map.get(first_year, {}):
                plantings = seasons_map[first_year][bed_id]
                area['rotationGroup'] = infer_rotation_group(plantings)

        areas.append(area)

    # Convert seasons from old 'beds' format to new 'areas' format
    seasons_v10 = []
    for year in sorted(seasons_map.keys()):
        area_seasons = []
        for bed_id in sorted(seasons_map[year].keys()):
            plantings = seasons_map[year][bed_id]
            area_seasons.append({
                'areaId': bed_id,
                'rotationGroup': infer_rotation_group(plantings),
                'plantings': plantings,
                'notes': []
            })

        seasons_v10.append({
            'year': year,
            'status': 'historical',
            'areas': area_seasons,  # v10: renamed from 'beds' to 'areas'
            'notes': 'Imported from Excel',
            'createdAt': now,
            'updatedAt': now
        })

    # Build complete backup format (v11)
    output = {
        'allotment': {
            'version': 11,  # Updated to v11 - uses singular plant IDs
            'meta': {
                'name': 'My Allotment',
                'location': 'Scotland',
                'createdAt': now,
                'updatedAt': now
            },
            'layout': {
                'areas': areas  # v10: unified areas array
            },
            'seasons': seasons_v10,
            'currentYear': max(seasons_map.keys()) if seasons_map else 2025,
            'varieties': [],  # Embedded varieties (will merge from varieties section)
            'maintenanceTasks': [],
            'gardenEvents': []
        },
        'varieties': {
            'version': 2,
            'varieties': varieties_output,
            'meta': {
                'createdAt': now,
                'updatedAt': now
            }
        },
        'exportedAt': now,
        'exportVersion': 11  # Updated to v11 - uses singular plant IDs
    }

    with open(output_file, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"Converted {len(varieties_output)} varieties and {len(seasons_output)} seasons", file=sys.stderr)
    print(f"Output written to {output_file}", file=sys.stderr)

if __name__ == '__main__':
    main()
