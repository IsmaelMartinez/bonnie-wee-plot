# Plan: Consolidate Share & Store into One Section

## Problem
Settings > Data tab has 3 separate sections for data transfer:
1. **Data Management** (modal) - file export/import buried behind a tiny icon button
2. **Share Allotment** - QR/code sharing
3. **Receive Allotment** - receive via code

Two transfer methods, three sections. Confusing.

## Proposed Design

Restructure the Data tab into 2 clear sections:

### Section 1: "Transfer Data"
One unified section with all 4 transfer actions in a clean 2x2 grid:

```
┌─────────────────────────────────────┐
│ Transfer Data                       │
│ Share or move your allotment data   │
│                                     │
│  SEND                               │
│  ┌──────────────┐ ┌──────────────┐  │
│  │ Share2 icon   │ │ Download icon│  │
│  │ Share via     │ │ Export as    │  │
│  │ Link          │ │ File         │  │
│  │ QR code &     │ │ Download     │  │
│  │ share code    │ │ JSON backup  │  │
│  └──────────────┘ └──────────────┘  │
│                                     │
│  RECEIVE                            │
│  ┌──────────────┐ ┌──────────────┐  │
│  │ QrCode icon   │ │ Upload icon  │  │
│  │ Receive via   │ │ Import from  │  │
│  │ Code          │ │ File         │  │
│  │ Scan QR or    │ │ Restore from │  │
│  │ enter code    │ │ JSON backup  │  │
│  └──────────────┘ └──────────────┘  │
└─────────────────────────────────────┘
```

- "Share via Link" → opens existing ShareDialog
- "Export as File" → triggers JSON download directly (no modal)
- "Receive via Code" → links to /receive page
- "Import from File" → opens file picker directly (no modal)

### Section 2: "Storage"
Slimmed down, inline (no modal):
- Storage stats (usage bar)
- Analytics toggle
- Danger zone (clear all data)

## Files to Change

1. **`src/app/settings/page.tsx`** - Restructure Data tab to new layout
2. **`src/components/allotment/DataManagement.tsx`** - Refactor: extract export/import logic into reusable hooks/functions, keep storage/analytics/danger zone inline (no modal)

## What stays the same
- ShareDialog component (unchanged)
- /receive page and flow (unchanged)
- All API routes (unchanged)
- Export/import logic (just moved out of modal)
- Storage stats, analytics, danger zone (just shown inline instead of in modal)
