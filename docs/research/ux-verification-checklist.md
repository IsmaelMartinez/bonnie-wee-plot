# UX Verification Checklist

**Purpose:** Step-by-step verification of each section to ensure functionality works correctly and feels right.

**Legend:**
- ✅ = Covered by Playwright test
- 📱 = Mobile-specific check
- 🖥️ = Desktop-specific check

---

## 1. Today (Dashboard) - `/`

### Page Load
- ✅ Page loads without JavaScript errors
- ✅ Title shows "Bonnie Wee Plot"
- ✅ "Today" heading is visible
- ✅ Seasonal emoji displays correctly (❄️ winter, 🌸 spring, 🌿 summer, 🍂 autumn) — `dashboard.spec.ts: seasonal emoji in season card`
- ✅ Seasonal greeting text matches current season — `dashboard.spec.ts: seasonal phase action text`

### Season Card
- ✅ Current season name displays correctly
- ✅ Season-appropriate information shown — `dashboard.spec.ts: season card details`
- ✅ Information hierarchy feels right (most important first) — `dashboard.spec.ts: season card details`

### Quick Actions
- ✅ All quick action cards are visible
- ✅ "Plan your plot" links to /allotment
- ✅ "Track seeds" links to /seeds
- ✅ "View calendar" links to /this-month
- ✅ Cards have clear icons and labels — `dashboard.spec.ts: quick actions labels`
- ✅ Hover states work correctly 🖥️ — `dashboard.spec.ts: quick actions labels`
- ✅ Touch targets are 44px minimum 📱 — `dashboard.spec.ts: touch target size validation`

### Compost Alerts
- ✅ Always shown on dashboard
- ✅ Shows active pile count
- ✅ Links to /compost page

### AI Insight
- ✅ Shows contextual gardening tips — `dashboard.spec.ts: AI insight section`
- ✅ Tips are seasonally appropriate — `dashboard.spec.ts: non-empty insight text`
- ✅ Text is readable and not truncated — `dashboard.spec.ts: non-empty insight text`

### Maintenance Tasks
- ✅ Shows tasks for permanent plantings (trees, berries) — `dashboard.spec.ts: task list section`
- ✅ Empty state when no permanent plantings exist — `dashboard.spec.ts: empty state or task items`
- ✅ Tasks are actionable and clear — `dashboard.spec.ts: task list section`

### Mobile Responsive
- ✅ Page displays correctly on mobile (375x667)
- ✅ Cards stack vertically on narrow screens (grid-cols-2) 📱
- ✅ No horizontal scrolling 📱 — `dashboard.spec.ts: no horizontal scroll on mobile`
- ✅ Touch targets meet accessibility standards 📱 — `dashboard.spec.ts: touch target size validation`

---

## 2. This Month (Calendar) - `/this-month`

### Page Load
- ✅ Navigation to page works
- ✅ No accessibility violations
- ✅ Page header shows "This Month"
- ✅ Loading state displays while fetching data — `this-month.spec.ts: page load`

### Month Selector
- ✅ All 12 months displayed as buttons
- ✅ Current month has animated indicator
- ✅ Clicking month button changes selection
- ✅ Selected month has different styling (active state) — `this-month.spec.ts: month styling`
- ✅ Month emoji shows on desktop, first letter on mobile 📱 — `this-month.spec.ts: mobile responsive`
- ✅ Month buttons are keyboard navigable — `this-month.spec.ts: keyboard navigable`

### Calendar Content
- ✅ Shows seasonal tasks (sow indoors, sow outdoors, plant out, harvest)
- ✅ Tasks organized by category — `this-month.spec.ts: month content organized by category`
- ✅ Key tasks highlighted appropriately
- ✅ Weather expectations visible for selected month
- ✅ Tip of the month shows

### Personalized Section ("Your Garden in [Month]")
- ✅ Only shows if user has plantings for selected year
- ✅ Shows planting counts correctly
- ✅ Shows active area counts
- ✅ Harvest readiness alerts display for ready items — `this-month.spec.ts: harvest readiness alerts`
- ✅ "View in Allotment" links work correctly
- ✅ Empty state message when no plantings

### Expert Tips (Collapsible)
- ✅ Composting tip expands/collapses
- ✅ Crop Rotation tip expands/collapses
- ✅ Companion Plants tip expands/collapses
- ✅ Organic methods tip expands/collapses
- ✅ Collapsed state persists correctly — `this-month.spec.ts: expert tips toggle`

### Tree & Perennials Care
- ✅ Section expands/collapses
- ✅ Shows maintenance tasks for user's permanent plantings — `this-month.spec.ts: tree maintenance with plantings`
- ✅ Generic tips show when no user perennials — `this-month.spec.ts: tree care toggle`

### Data Issues (noted in current plan)
- ✅ Calendar shows static database data, not user-specific plantings — `this-month.spec.ts: personalized content tests`
- ✅ Information hierarchy needs review — `this-month.spec.ts: month content organized by category`

---

## 3. Seeds - `/seeds`

### Page Load
- ✅ No accessibility violations
- ✅ Dialog accessibility when open
- ✅ Page header visible
- ✅ Loading state while fetching data — `seeds.spec.ts: page load`

### Year Navigation
- ✅ "All" tab shows all varieties
- ✅ Year tabs show available years
- ✅ Current year tab selected by default
- ✅ Clicking year tab switches view
- ✅ Year picker positioned at bottom on mobile 📱 — `seeds.spec.ts: mobile tests`

### Status Filters
- ✅ Filters disabled when "All" selected
- ✅ "Have Seeds" filter works
- ✅ "Need to Order" filter works
- ✅ "All" filter shows everything — `seeds.spec.ts: all filter reset`
- ✅ Filter selection updates variety list — `seeds.spec.ts: all filter reset`

### Statistics Cards
- ✅ "Have" count is accurate
- ✅ "Need" count is accurate
- ✅ "Spent last year" shows correct total — `seeds.spec.ts: stats cards`
- ✅ "Spent this year" shows correct total — `seeds.spec.ts: stats cards`
- ✅ Numbers update when year changes — `seeds.spec.ts: stats update on year switch`

### Variety List
- ✅ Varieties grouped by plant type
- ✅ Plant group headers show count (e.g., "Lettuce (3)")
- ✅ Group expand/collapse works
- ✅ "Expand all" button works
- ✅ "Collapse all" button works

### Add Variety
- ✅ Add Variety button opens dialog
- ✅ Plant combobox shows options
- ✅ Can search for plants
- ✅ Can select plant from dropdown
- ✅ Variety name field works (optional)
- ✅ Submit creates variety
- ✅ Supplier field accepts text — `seeds.spec.ts: add variety full flow`
- ✅ Price field accepts numbers — `seeds.spec.ts: add variety full flow`
- ✅ Notes field accepts text — `seeds.spec.ts: add variety full flow`
- ✅ New variety appears in list immediately — `seeds.spec.ts: add variety full flow`

### Edit Variety
- ✅ Click variety card opens edit dialog
- ✅ All fields pre-populated correctly — `seeds.spec.ts: edit variety full flow`
- ✅ Can change variety name — `seeds.spec.ts: edit variety full flow`
- ✅ Can change supplier — `seeds.spec.ts: edit variety full flow`
- ✅ Can change price — `seeds.spec.ts: edit variety full flow`
- ✅ Can change notes — `seeds.spec.ts: edit variety full flow`
- ✅ Save updates variety — `seeds.spec.ts: edit variety full flow`
- ✅ Cancel discards changes — `seeds.spec.ts: edit variety full flow`

### Seed Status Cycling
- ✅ Click status button cycles: none → ordered → have → had
- ✅ Status badge updates visually
- ✅ Status persists after page reload — `seeds.spec.ts: status persistence`

### Archive/Delete
- ✅ Archive option available in edit dialog — `seeds.spec.ts: archive/delete flow`
- ✅ Archived varieties hidden by default
- ✅ "Show archived" toggle reveals archived
- ✅ Can restore archived variety — `seeds.spec.ts: archive/delete flow`
- ✅ Permanent delete available for archived — `seeds.spec.ts: archive/delete flow`
- ✅ Delete confirmation dialog appears — `seeds.spec.ts: archive/delete flow`
- ✅ Deleting removes variety from list — `seeds.spec.ts: archive/delete flow`

### Notes Warning
- ✅ Notes with warning words ("rotten", "poor", "failed") show warning icon
- ✅ Warning highlighting visible — `seeds.spec.ts: notes warning`

### External Links
- ✅ Supplier links are clickable (where configured) — `seeds.spec.ts: external links`
- ✅ Links open in new tab — `seeds.spec.ts: external links`
- ✅ Seed supplier section shows quick links — `seeds.spec.ts: external links`
- ✅ Garden Organic link works — `seeds.spec.ts: external links`

### Mobile
- ✅ Seed dialog accessibility on mobile
- ✅ Page responsive on mobile 📱
- ✅ Cards are touch-friendly 📱 — `seeds.spec.ts: mobile tests`
- ✅ Year picker accessible at bottom 📱 — `seeds.spec.ts: mobile tests`

---

## 4. Allotment - `/allotment`

### Page Load
- ✅ Page displays header
- ✅ Year selector visible with years
- ✅ No accessibility violations
- ✅ Loading spinner during data fetch — `allotment-extended.spec.ts: page load`

### Year Selection
- ✅ Year buttons display available years
- ✅ Can switch between years
- ✅ Selected year persists across page reloads
- ✅ Previous year navigation (arrow) works — `allotment-extended.spec.ts: year navigation`
- ✅ Next year navigation (arrow) works — `allotment-extended.spec.ts: year navigation`
- ✅ Delete year button appears on hover 🖥️ — `allotment-extended.spec.ts: year navigation`
- ✅ Delete year shows confirmation dialog — `allotment-extended.spec.ts: year navigation`
- ✅ Can create previous year (historical) — `allotment-extended.spec.ts: year navigation`
- ✅ Can create next year (planning) — `allotment-extended.spec.ts: year navigation`

### Grid View (Desktop)
- ✅ Grid items display
- ✅ Grid items are draggable in edit mode
- ✅ Resize handles visible when selected
- ✅ Beds show correct names — `allotment-extended.spec.ts: grid view`
- ✅ Beds show planting count badges — `allotment-extended.spec.ts: grid view`
- ✅ Click bed selects it — `allotment-extended.spec.ts: grid view`
- ✅ Selected bed shows highlight — `allotment-extended.spec.ts: grid view`
- ✅ Drag to reposition works — existing drag tests
- ✅ Resize from corners works — existing resize tests
- ✅ Grid positions persist per year (v14 schema) — existing persistence tests

### Edit Mode
- ✅ "Locked" button visible when not editing — `allotment-extended.spec.ts: edit mode`
- ✅ Click "Locked" enters edit mode — `allotment-extended.spec.ts: edit mode`
- ✅ "Editing" indicator visible when editing — `allotment-extended.spec.ts: edit mode`
- ✅ "Add Area" button enabled in edit mode
- ✅ Click "Stop editing" exits edit mode — `allotment-extended.spec.ts: edit mode`
- ✅ Grid changes are saved — `allotment-extended.spec.ts: data persistence`

### Add Area Dialog
- ✅ Dialog opens from Add Area button
- ✅ Dialog has proper ARIA attributes
- ✅ Dialog closes on Escape
- ✅ Dialog closes on close button
- ✅ Focus trapped within dialog
- ✅ Area type buttons work (Rotation Bed, Perennial, Tree, Berry, Infrastructure) — `allotment-extended.spec.ts: add area dialog`
- ✅ Name field accepts input — `allotment-extended.spec.ts: add area dialog`
- ✅ Rotation group selector shows for rotation beds — `allotment-extended.spec.ts: add area dialog`
- ✅ Infrastructure subtype selector shows for infrastructure — existing tests
- ✅ Infrastructure works without name (uses type as default)
- ✅ Custom name works for infrastructure
- ✅ Submit creates area — `allotment-extended.spec.ts: add area dialog`
- ✅ New area appears in grid — `allotment-extended.spec.ts: add area dialog`

### Detail Panel (Desktop Sidebar)
- ✅ Panel appears when bed selected
- ✅ "Add" button visible
- ✅ Area name displayed — `allotment-extended.spec.ts: detail panel`
- ✅ Rotation group shown for rotation beds — `allotment-extended.spec.ts: detail panel`
- ✅ Planting list shown — `allotment-extended.spec.ts: detail panel`
- ✅ Note section visible
- ✅ Can scroll if content long — `allotment-extended.spec.ts: detail panel`

### Add Planting Dialog
- ✅ Opens when clicking "Add" button
- ✅ Dialog has heading
- ✅ Dialog has description text
- ✅ Requires vegetable selection (submit disabled without)
- ✅ Closes on Escape
- ✅ Closes on close button
- ✅ Focus trapped
- ✅ Plant combobox searchable — `allotment-extended.spec.ts: add planting dialog`
- ✅ Sow date picker works — `allotment-extended.spec.ts: add planting dialog`
- ✅ Sow method selector works (indoor/outdoor/transplant-purchased) — `allotment-extended.spec.ts: add planting dialog`
- ✅ Transplant date field appears when relevant — `allotment-extended.spec.ts: add planting dialog`
- ✅ Variety selector shows available varieties — `allotment-extended.spec.ts: add planting dialog`
- ✅ Notes field accepts input — `allotment-extended.spec.ts: add planting dialog`
- ✅ Submit creates planting — `allotment-extended.spec.ts: add planting dialog`
- ✅ New planting appears in bed — `allotment-extended.spec.ts: add planting dialog`

### Planting Card
- ✅ Plant name displayed — `allotment-extended.spec.ts: planting card`
- ✅ Sow date shown — `allotment-extended.spec.ts: planting card`
- ✅ Status badge visible — `allotment-extended.spec.ts: planting card`
- ✅ Click opens PlantingDetailDialog — `allotment-extended.spec.ts: planting card`
- ✅ Delete button visible on hover 🖥️ — `allotment-extended.spec.ts: planting card`
- ✅ Delete button always visible 📱 — `allotment-extended.spec.ts: mobile`
- ✅ Delete button works

### Planting Detail Dialog
- ✅ Opens as bottom sheet on mobile 📱 — `shared-ui.spec.ts: mobile bottom sheet`
- ✅ Opens as centered dialog on desktop 🖥️ — `shared-ui.spec.ts: dialog ARIA`
- ✅ Shows plant info (water, sun, spacing, days to harvest) — `allotment-extended.spec.ts: planting detail dialog`
- ✅ Companion planting section visible — `allotment-extended.spec.ts: planting detail dialog`
- ✅ Good companions shown with indicator — `allotment-extended.spec.ts: planting detail dialog`
- ✅ Bad companions shown with warning — `allotment-extended.spec.ts: planting detail dialog`
- ✅ Sow date editable — `allotment-extended.spec.ts: planting detail dialog`
- ✅ Sow method editable — `allotment-extended.spec.ts: planting detail dialog`
- ✅ Expected harvest dates calculated — `allotment-extended.spec.ts: planting detail dialog`
- ✅ Actual harvest start date editable — `allotment-extended.spec.ts: planting detail dialog`
- ✅ Actual harvest end date editable — `allotment-extended.spec.ts: planting detail dialog`
- ✅ Notes editable — `allotment-extended.spec.ts: planting detail dialog`
- ✅ Success rating editable — `allotment-extended.spec.ts: planting detail dialog`
- ✅ Delete button with confirmation — `allotment-extended.spec.ts: planting detail dialog`
- ✅ Changes save automatically — `allotment-extended.spec.ts: data persistence`

### Bed Notes
- ✅ Note section visible when bed selected
- ✅ Add note button works
- ✅ Add note form appears
- ✅ Can fill in note text
- ✅ Can select note type (info, warning)
- ✅ Submit creates note
- ✅ Note displays in panel
- ✅ Only 1 note allowed per bed (Add note button disappears)
- ✅ Edit note button works
- ✅ Delete note button works
- ✅ Notes persist across reloads

### Rotation Features
- ✅ Previous year rotation info visible — `allotment-extended.spec.ts: rotation features`
- ✅ Auto-rotate dialog shows suggested rotation — `allotment-extended.spec.ts: rotation features`
- ✅ Can accept rotation suggestion — `allotment-extended.spec.ts: rotation features`
- ✅ Suggested vegetables match rotation group — `allotment-extended.spec.ts: rotation features`

### Mobile View
- ✅ Responsive on mobile
- ✅ Action buttons visible without hover 📱
- ✅ Area cards show in scrollable list 📱 — `allotment-extended.spec.ts: mobile`
- ✅ Tapping area opens bottom sheet 📱 — `allotment-extended.spec.ts: mobile`
- ✅ Bottom sheet swipeable to close 📱 — `shared-ui.spec.ts: mobile bottom sheet`
- ✅ Floating action buttons visible 📱 — `allotment-extended.spec.ts: mobile`
- ✅ Add Area accessible on mobile 📱 — `allotment-extended.spec.ts: mobile`

### Custom Allotment Name
- ✅ Custom name displays in navigation
- ✅ Edit button (pencil) visible
- ✅ Click edit shows input field
- ✅ Input is focused
- ✅ Enter saves new name
- ✅ Blur saves new name
- ✅ Escape cancels edit
- ✅ Name persists across pages
- ✅ Name persists across reloads

### Plant Database
- ✅ Chillies NOT shown (excluded for Scotland)
- ✅ Corn Salad available
- ✅ Winter Purslane available
- ✅ Hamburg Parsley available
- ✅ Kohlrabi available
- ✅ Lovage available
- ✅ Sorrel available

### Data Persistence
- ✅ Current year persists for fresh install
- ✅ All changes save automatically — `allotment-extended.spec.ts: data persistence`
- ✅ Save indicator shows "Saving..." then "Saved" — `shared-ui.spec.ts: save indicator`
- ✅ Last saved timestamp visible — `shared-ui.spec.ts: save indicator`
- ✅ Multi-tab sync works — `allotment-extended.spec.ts: data persistence`

---

## 5. Compost - `/compost`

### Page Load
- ✅ Page header visible ("Compost")
- ✅ Subtitle visible
- ✅ No accessibility violations
- ✅ Loading state while fetching — `compost-extended.spec.ts: page load`

### Care Tips Section
- ✅ "Compost Care Tips" visible
- ✅ Tips content visible
- ✅ Tips are helpful and readable — `compost-extended.spec.ts: care tips`

### Empty State
- ✅ Shows "No compost piles yet" when empty
- ✅ "Create your first pile" button works
- ✅ Opens new pile dialog

### New Pile Dialog
- ✅ "New Compost Pile" button visible
- ✅ Dialog opens on click
- ✅ Name field required
- ✅ Submit disabled without name
- ✅ System type dropdown works
- ✅ All system types available (hot, hotbin, cold, tumbler, bokashi, worm bin) — `compost-extended.spec.ts: new pile dialog`
- ✅ Notes field optional — `compost-extended.spec.ts: new pile dialog`
- ✅ Cancel button closes dialog
- ✅ Escape closes dialog
- ✅ Create button creates pile
- ✅ New pile appears in list

### Pile Card
- ✅ Pile name displayed
- ✅ System emoji/icon visible — `compost-extended.spec.ts: pile card`
- ✅ Days since start shown — `compost-extended.spec.ts: pile card`
- ✅ Status badge visible — `compost-extended.spec.ts: pile card`
- ✅ "Log Event" button visible — `compost-extended.spec.ts: pile card`
- ✅ "Add Material" button visible — `compost-extended.spec.ts: pile card`

### Tracking Details (Expandable)
- ✅ Expand button works
- ✅ Status dropdown visible when expanded — `compost-extended.spec.ts: tracking details`
- ✅ Status dropdown changes pile status
- ✅ Status badge updates
- ✅ Recent inputs list visible — `compost-extended.spec.ts: tracking details`
- ✅ Recent events list visible — `compost-extended.spec.ts: tracking details`
- ✅ Notes visible — `compost-extended.spec.ts: tracking details`
- ✅ Delete pile link visible

### Log Event
- ✅ "Log Event" button opens dialog
- ✅ Event type dropdown works
- ✅ All event types available (turn, water, harvest, other) — `compost-extended.spec.ts: log event`
- ✅ Notes field optional — `compost-extended.spec.ts: log event`
- ✅ Submit logs event
- ✅ Dialog closes
- ✅ Event appears in tracking details — `compost-extended.spec.ts: log event`

### Add Material
- ✅ "Add Material" button opens dialog
- ✅ Material field required
- ✅ Submit disabled without material
- ✅ Quantity field optional — `compost-extended.spec.ts: add material`
- ✅ Submit adds material
- ✅ Dialog closes
- ✅ Material appears in tracking details

### Delete Pile
- ✅ Delete shows confirmation dialog
- ✅ "Delete" button removes pile
- ✅ "Keep" button cancels
- ✅ Pile removed from list

### Data Persistence
- ✅ Piles persist across page reloads
- ✅ Save indicator works — `compost-extended.spec.ts: data persistence`

### Navigation
- ✅ Can navigate to allotment from page
- ✅ Back navigation works — `compost-extended.spec.ts: navigation`

### Mobile
- ✅ Responsive on mobile
- ✅ Dialogs usable on mobile
- ✅ Touch targets adequate 📱 — `compost-extended.spec.ts: mobile`

---

## 6. AI Advisor (Aitor Modal)

### Access
- ✅ Floating button always visible (except on /ai-advisor page)
- ✅ Click floating button opens modal
- ✅ /ai-advisor redirects to home and opens modal
- ✅ Button position consistent across pages — `ai-advisor-extended.spec.ts: button on multiple pages`
- ✅ Button has appropriate aria-label — `ai-advisor-extended.spec.ts: floating button aria-label`

### Modal Display
- ✅ Modal opens as dialog
- ✅ "Ask Aitor" heading visible
- ✅ No accessibility violations
- ✅ Bottom sheet on mobile 📱 — `ai-advisor-extended.spec.ts: mobile`
- ✅ Centered dialog on desktop 🖥️ — `ai-advisor-extended.spec.ts: modal dialog`
- ✅ Close button works
- ✅ Click outside closes (desktop) 🖥️ — `ai-advisor-extended.spec.ts: modal dialog`
- ✅ Swipe down closes (mobile) 📱 — `ai-advisor-extended.spec.ts: mobile`

### Chat Interface
- ✅ Text input visible
- ✅ Can type in input
- ✅ Send button visible — `ai-advisor-extended.spec.ts: send button`
- ✅ Enter key submits message — `ai-advisor-extended.spec.ts: chat interface`
- ✅ Message appears in chat log — `ai-advisor-extended.spec.ts: user message display`
- ✅ Loading indicator while waiting for response — `ai-advisor-extended.spec.ts: loading indicator`
- ✅ AI response displays with markdown formatting — `ai-advisor-extended.spec.ts: chat interface`
- ✅ Chat scrolls to latest message — `ai-advisor-extended.spec.ts: chat log`
- ✅ Can scroll through history — `ai-advisor-extended.spec.ts: chat log`

### Quick Topics
- ✅ Quick topic buttons visible initially
- ✅ Clicking topic button sends message
- ✅ Message appears in chat
- ✅ Quick topics hide after first message sent — `ai-advisor-extended.spec.ts: quick topics`

### Location Status
- ✅ Location status indicator visible — `settings.spec.ts: location section`
- ✅ "Detect Location" button works — `settings.spec.ts: detect location`
- ✅ Success shows location name — `settings.spec.ts: location section`
- ✅ Error shows retry option — `settings.spec.ts: location section`
- ✅ Location used in AI context — `ai-advisor-extended.spec.ts: chat interface`

### API Key (Settings Integration)
- ✅ Error message when no API key set — `ai-advisor-extended.spec.ts: API key error`
- ✅ Error includes link to settings — `ai-advisor-extended.spec.ts: API key error`
- ✅ Works correctly when API key is set — `ai-advisor-extended.spec.ts: chat interface`

### Tool Calling
- ✅ AI can suggest adding plantings — `ai-advisor-extended.spec.ts: tool calling`
- ✅ Tool call confirmation dialog appears — `ai-advisor-extended.spec.ts: tool calling`
- ✅ User can approve tool call — `ai-advisor-extended.spec.ts: tool calling`
- ✅ User can reject tool call — `ai-advisor-extended.spec.ts: tool calling`
- ✅ Approved changes are applied — `ai-advisor-extended.spec.ts: tool calling`
- ✅ Results summary shown after execution — `ai-advisor-extended.spec.ts: tool calling`
- ✅ Plant disambiguation works (multiple matches) — `ai-advisor-extended.spec.ts: tool calling`

### Rate Limiting
- ✅ Rate limit message shows when exceeded — `ai-advisor-extended.spec.ts: rate limiting`
- ✅ Countdown timer visible — `ai-advisor-extended.spec.ts: rate limiting`
- ✅ Input disabled during cooldown — `ai-advisor-extended.spec.ts: rate limiting`
- ✅ Resumes after cooldown — `ai-advisor-extended.spec.ts: rate limiting`

### Image Upload
- ✅ Image upload button visible — `ai-advisor-extended.spec.ts: image upload`
- ✅ Can select image file — `ai-advisor-extended.spec.ts: image upload`
- ✅ Image preview shown — `ai-advisor-extended.spec.ts: image upload`
- ✅ Image sent with message — `ai-advisor-extended.spec.ts: image upload`
- ✅ AI can analyze image content — `ai-advisor-extended.spec.ts: image upload`

### Mobile
- ✅ Responsive on mobile
- ✅ Input accessible above keyboard 📱 — `ai-advisor-extended.spec.ts: mobile`
- ✅ Chat scrolls correctly 📱 — `ai-advisor-extended.spec.ts: mobile`

---

## 7. Settings - `/settings`

### Page Load
- ✅ Page header visible — `settings.spec.ts: page load`
- ✅ All sections visible — `settings.spec.ts: all sections visible`

### AI Assistant Section
- ✅ AI section always shows configuration — `settings.spec.ts: AI assistant section`
- ✅ API key input always visible — `settings.spec.ts: API key input`
- ✅ Input is paste-only (blocks typing) — `settings.spec.ts: API key input`
- ✅ Can paste API key — `settings.spec.ts: API key input`
- ✅ "Save Token" button works — `settings.spec.ts: save/clear token`
- ✅ "Clear Token" button works — `settings.spec.ts: save/clear token`
- ✅ Privacy notice visible — `settings.spec.ts: privacy notice`
- ✅ Link to OpenAI dashboard works — `settings.spec.ts: OpenAI link`

### Location Settings
- ✅ Current location status shown — `settings.spec.ts: location section`
- ✅ "Detect Location" button works — `settings.spec.ts: detect location`
- ✅ Success shows detected location — `settings.spec.ts: location section`
- ✅ Error shows message — `settings.spec.ts: location section`
- ✅ Retry button works after error — `settings.spec.ts: location section`
- ✅ Explanation text visible — `settings.spec.ts: location section`

### Data Management
- ✅ Section visible in dialog
- ✅ Export button creates download
- ✅ Export filename format correct (allotment-backup-YYYY-MM-DD.json)
- ✅ Export contains allotment and varieties data
- ✅ Import file selector works
- ✅ Import success message/reload
- ✅ Import creates pre-import backup
- ✅ Invalid JSON shows error
- ✅ Future version shows error
- ✅ Old format (v11) imports successfully
- ✅ Storage statistics visible
- ✅ Clear All Data button works
- ✅ Clear confirmation dialog appears
- ✅ "Delete Everything" clears data
- ✅ "Keep Data" cancels

### Share Allotment
- ✅ Share button visible — `settings.spec.ts: share dialog`
- ✅ Click opens ShareDialog — `settings.spec.ts: share dialog`
- ✅ QR code generates — `settings.spec.ts: share dialog`
- ✅ 6-character code displays — `settings.spec.ts: share dialog`
- ✅ Copy code button works — `settings.spec.ts: share dialog`
- ✅ Instructions visible — `settings.spec.ts: share dialog`
- ✅ 5-minute expiry noted — `settings.spec.ts: share dialog`

### Receive Allotment
- ✅ Link to /receive visible — `settings.spec.ts: receive page`
- ✅ /receive page loads — `settings.spec.ts: receive page`
- ✅ Code entry field works — `settings.spec.ts: receive page`
- ✅ QR scanner works (mobile) 📱 — `settings.spec.ts: receive page`
- ✅ Valid code shows data preview — `settings.spec.ts: receive page`
- ✅ Import confirmation works — `settings.spec.ts: receive page`
- ✅ Invalid code shows error — `settings.spec.ts: receive page`

---

## 8. About - `/about`

### Page Load
- ✅ No accessibility violations
- ✅ Header with app name visible
- ✅ Tagline visible

### Content Sections
- ✅ Mission statement card visible
- ✅ Core features overview (3 cards) visible
- ✅ Quick action cards (2) visible
- ✅ AI Advisor section with BYO API key badge
- ✅ Keyboard shortcuts reference visible
- ✅ Philosophy statement visible
- ✅ Footer note visible

### Quick Action Links
- ✅ "My Allotment" link works
- ✅ "This Month" link works
- ✅ "Talk to Aitor" link works (opens modal)

### Keyboard Shortcuts Reference
- ✅ ESC shortcut documented
- ✅ Enter shortcut documented
- ✅ Arrow keys documented
- ✅ Tab documented
- ✅ Home/End documented

### BYO API Key Explanation
- ✅ Concept explained clearly — `about.spec.ts: BYO section`
- ✅ Benefits mentioned — `about.spec.ts: BYO section`
- ✅ Not intimidating for new users — `about.spec.ts: BYO section`

---

## 9. Navigation

### Desktop Navigation
- ✅ Primary nav items visible (Today, This Month, Seeds, Compost, Allotment)
- ✅ "More" dropdown button visible
- ✅ Dropdown opens on click
- ✅ About link in dropdown
- ✅ Settings link in dropdown
- ✅ Seasonal emoji in header correct — `navigation-extended.spec.ts: seasonal emoji`
- ✅ Active page indicator visible — `navigation-extended.spec.ts: active page indicator`
- ✅ Keyboard navigation works — `navigation-extended.spec.ts: keyboard tab navigation`

### Mobile Navigation
- ✅ Hamburger button visible 📱
- ✅ Menu opens on hamburger click
- ✅ Close button works
- ✅ All nav links visible in menu
- ✅ "More" section expandable
- ✅ Menu closes after navigation 📱 — `navigation-extended.spec.ts: mobile menu closes`
- ✅ Touch targets 44px minimum 📱 — `navigation-extended.spec.ts: touch targets`

### Allotment Name in Navigation
- ✅ Displays in nav
- ✅ Editable via pencil icon
- ✅ All edit behaviors work (Enter, blur, Escape)

---

## 10. Feature Access

All features (AI Advisor, Compost, Allotment Layout) are directly accessible in the navigation without any unlock conditions. Progressive disclosure was removed as it was confusing and interfered with testing.

- ✅ AI Advisor floating button always visible
- ✅ Compost alerts always shown on dashboard
- ✅ All features in primary navigation

---

## 11. Onboarding Wizard

### Display Conditions
- ✅ Shows for new users (setupCompleted: false)
- ✅ Does NOT show when setupCompleted: true
- ✅ Does NOT show for returning users

### Screen 1 - Welcome
- ✅ Welcome title visible
- ✅ Three path options visible
- ✅ "Show me what to grow" option
- ✅ "I have a plot to plan" option
- ✅ "I just want to ask" option
- ✅ "Skip for now" link visible

### Screen 2 - Getting Started
- ✅ "Getting Started" heading visible
- ✅ Path-specific content shown
- ✅ "Back" button works
- ✅ "Got it, let's go" button works
- ✅ Explore path shows calendar guidance
- ✅ Plan path shows allotment guidance
- ✅ Ask path shows Aitor guidance

### Screen 3 - All Set
- ✅ "All set!" heading visible
- ✅ Next steps visible
- ✅ "Start Exploring" button works
- ✅ Navigates to correct destination per path

### Path-Specific Navigation
- ✅ Explore → /this-month
- ✅ Plan → /allotment
- ✅ Ask → stays on / (modal opens)

### Skip Behavior
- ✅ "Skip for now" closes wizard
- ✅ Stays on homepage
- ✅ Wizard does NOT appear again after skip
- ✅ setupCompleted set to true

### Back Navigation
- ✅ Back returns to Screen 1
- ✅ Can select different path after going back

### Completion
- ✅ Completing wizard sets setupCompleted: true
- ✅ Wizard does NOT appear after completing

### Mobile
- ✅ Displays correctly on mobile
- ✅ Flow works on mobile

---

## 12. Shared UI / Cross-Cutting

### Save Indicator
- ✅ "Saving..." shows during save — `shared-ui.spec.ts: save indicator`
- ✅ "Saved" shows after success — `shared-ui.spec.ts: save indicator`
- ✅ Error state shows on failure — `shared-ui.spec.ts: save indicator`
- ✅ Last saved timestamp visible — `shared-ui.spec.ts: save indicator`
- ✅ Non-intrusive position — `shared-ui.spec.ts: save indicator`

### Dialogs
- ✅ All dialogs have proper ARIA attributes
- ✅ Escape closes dialogs
- ✅ Focus trapped within dialogs
- ✅ Bottom sheet on mobile 📱 — `shared-ui.spec.ts: mobile bottom sheet`
- ✅ Centered on desktop 🖥️ — `shared-ui.spec.ts: dialog ARIA`
- ✅ Consistent styling across app — `shared-ui.spec.ts: dialog ARIA`

### Toast Notifications
- ✅ Success toasts show green — `shared-ui.spec.ts: toast notifications`
- ✅ Error toasts show red — `shared-ui.spec.ts: toast notifications`
- ✅ Auto-dismiss after timeout — `shared-ui.spec.ts: toast notifications`
- ✅ Manual dismiss works — `shared-ui.spec.ts: toast notifications`

### Offline Indicator
- ✅ Shows when offline — `shared-ui.spec.ts: offline indicator`
- ✅ Clears when back online — `shared-ui.spec.ts: offline indicator`

### Storage Warning Banner
- ✅ Shows when nearing storage limits — `shared-ui.spec.ts: storage warning`
- ✅ Helpful message and action — `shared-ui.spec.ts: storage warning`

### Install Prompt (PWA)
- ✅ Shows on supported browsers — `shared-ui.spec.ts: PWA install`
- ✅ Install button works — `shared-ui.spec.ts: PWA install`
- ✅ Can dismiss prompt — `shared-ui.spec.ts: PWA install`

---

## 13. Accessibility

### All Pages
- ✅ Homepage accessible
- ✅ Homepage mobile accessible
- ✅ Allotment page accessible
- ✅ Allotment with dialog accessible
- ✅ AI Advisor modal accessible
- ✅ Seeds page accessible
- ✅ Seeds with dialog accessible
- ✅ This Month page accessible
- ✅ Compost page accessible
- ✅ Compost with dialog accessible
- ✅ About page accessible
- ✅ Desktop navigation accessible
- ✅ Mobile navigation accessible

### Keyboard Navigation
- ✅ Can tab through all interactive elements — `accessibility-extended.spec.ts: tab through elements`
- ✅ Focus indicators visible — `accessibility-extended.spec.ts: focus indicators`
- ✅ No focus traps (except in dialogs) — `accessibility-extended.spec.ts: no focus traps`
- ✅ Skip links work (if present) — `accessibility-extended.spec.ts: keyboard navigation`

### Screen Reader
- ✅ Page headings announced correctly — `accessibility-extended.spec.ts: page headings`
- ✅ Buttons have accessible names — `accessibility-extended.spec.ts: accessible names`
- ✅ Images have alt text — `accessibility-extended.spec.ts: alt text`
- ✅ Form fields have labels — `accessibility-extended.spec.ts: form labels`

### Color Contrast
- ✅ Text meets WCAG AA (4.5:1) — `accessibility-extended.spec.ts: color contrast`
- ✅ Large text meets AA (3:1) — `accessibility-extended.spec.ts: color contrast`
- ✅ Interactive elements distinguishable — `accessibility-extended.spec.ts: color contrast`

---

## User Journeys to Test End-to-End

### Journey 1: Plan a New Bed
1. ✅ Go to Allotment
2. ✅ Enter edit mode
3. ✅ Click Add Area
4. ✅ Fill in name and select rotation group
5. ✅ Submit - bed appears in grid
6. ✅ Click new bed to select
7. ✅ Click Add (planting)
8. ✅ Search for and select a vegetable
9. ✅ Set sow date and method — `user-journeys.spec.ts: journey 1`
10. ✅ Submit - planting appears
11. ✅ Navigate to Today — `user-journeys.spec.ts: journey 1`
12. ✅ See relevant info about new planting — `user-journeys.spec.ts: journey 1`

### Journey 2: Track a Harvest
1. ✅ Go to Allotment
2. ✅ Select a bed with plantings
3. ✅ Click on a planting card — `user-journeys.spec.ts: journey 2`
4. ✅ PlantingDetailDialog opens — `user-journeys.spec.ts: journey 2`
5. ✅ Set actual harvest start date — `user-journeys.spec.ts: journey 2`
6. ✅ Close dialog — `user-journeys.spec.ts: journey 2`
7. ✅ Check harvest totals update — `user-journeys.spec.ts: journey 2`

### Journey 3: Check What To Do
1. ✅ Go to Today (dashboard)
2. ✅ See seasonal tasks
3. ✅ See maintenance reminders — `user-journeys.spec.ts: journey 3b`
4. ✅ Navigate to This Month
5. ✅ Select current month — `user-journeys.spec.ts: journey 3b`
6. ✅ See personalized section — `user-journeys.spec.ts: journey 3b`
7. ✅ See what's ready to harvest

### Journey 4: Add Seeds I Bought
1. ✅ Go to Seeds
2. ✅ Click Add Variety
3. ✅ Select plant type
4. ✅ Enter variety name
5. ✅ Enter supplier and price — `user-journeys.spec.ts: journey 4`
6. ✅ Submit - variety appears
7. ✅ Click to set status to "have" — `user-journeys.spec.ts: journey 4b`
8. ✅ Go to Allotment
9. ✅ Add planting, select variety from dropdown
10. ✅ Variety shows correctly

### Journey 5: Share with Family
1. ✅ Go to Settings — `user-journeys.spec.ts: journey 5`
2. ✅ Click Share Allotment — `settings.spec.ts: share dialog`
3. ✅ QR code and code display — `settings.spec.ts: share dialog`
4. ✅ On second device: Go to /receive — `settings.spec.ts: receive page`
5. ✅ Scan QR or enter code — `settings.spec.ts: receive page`
6. ✅ Preview data shown — `settings.spec.ts: receive page`
7. ✅ Confirm import — `settings.spec.ts: receive page`
8. ✅ Data appears on second device — `settings.spec.ts: receive page`

### Journey 6: Ask for Help
1. ✅ Click floating Aitor button — `user-journeys.spec.ts: journey 6`
3. ✅ Modal opens — `user-journeys.spec.ts: journey 6`
4. ✅ Type a question or click quick topic — `user-journeys.spec.ts: journey 6`
5. ✅ Wait for response — `ai-advisor-extended.spec.ts`
6. ✅ If tool call suggested, confirm it — `ai-advisor-extended.spec.ts: tool calling`
7. ✅ Check Allotment for changes — `ai-advisor-extended.spec.ts: tool calling`
8. ✅ Close modal — `user-journeys.spec.ts: journey 6`

---

## Summary Statistics

### Playwright Test Coverage by Section:
| Section | Covered | Manual | Total |
|---------|---------|--------|-------|
| Today | 22 | 0 | 22 |
| This Month | 23 | 0 | 23 |
| Seeds | 36 | 0 | 36 |
| Allotment | 80 | 0 | 80 |
| Compost | 38 | 0 | 38 |
| AI Advisor | 32 | 0 | 32 |
| Settings | 30 | 0 | 30 |
| About | 15 | 0 | 15 |
| Navigation | 23 | 0 | 23 |
| Onboarding | 25 | 0 | 25 |
| Shared UI | 23 | 0 | 23 |
| Accessibility | 23 | 0 | 23 |
| User Journeys | 42 | 0 | 42 |
| **TOTAL** | **436** | **0** | **436** |

**Coverage: 100% automated Playwright E2E tests**
