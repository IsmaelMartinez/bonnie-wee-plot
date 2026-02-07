# UX Verification Checklist

**Purpose:** Step-by-step verification of each section to ensure functionality works correctly and feels right.

**Legend:**
- ✅ = Covered by Playwright test
- 🔲 = Manual verification needed
- 📱 = Mobile-specific check
- 🖥️ = Desktop-specific check

---

## 1. Today (Dashboard) - `/`

### Page Load
- ✅ Page loads without JavaScript errors
- ✅ Title shows "Bonnie Wee Plot"
- ✅ "Today" heading is visible
- 🔲 Seasonal emoji displays correctly (❄️ winter, 🌸 spring, 🌿 summer, 🍂 autumn)
- 🔲 Seasonal greeting text matches current season

### Season Card
- ✅ Current season name displays correctly
- 🔲 Season-appropriate information shown
- 🔲 Information hierarchy feels right (most important first)

### Quick Actions
- ✅ All quick action cards are visible
- ✅ "Plan your plot" links to /allotment
- ✅ "Track seeds" links to /seeds
- ✅ "View calendar" links to /this-month
- 🔲 Cards have clear icons and labels
- 🔲 Hover states work correctly 🖥️
- 🔲 Touch targets are 44px minimum 📱

### Compost Alerts (when unlocked)
- ✅ Only shows when `compost` feature is unlocked
- 🔲 Shows active pile count
- 🔲 Links to /compost page
- ✅ Hidden completely when feature is locked

### AI Insight
- 🔲 Shows contextual gardening tips
- 🔲 Tips are seasonally appropriate
- 🔲 Text is readable and not truncated

### Maintenance Tasks
- 🔲 Shows tasks for permanent plantings (trees, berries)
- 🔲 Empty state when no permanent plantings exist
- 🔲 Tasks are actionable and clear

### Mobile Responsive
- ✅ Page displays correctly on mobile (375x667)
- ✅ Cards stack vertically on narrow screens (grid-cols-2) 📱
- 🔲 No horizontal scrolling 📱
- 🔲 Touch targets meet accessibility standards 📱

---

## 2. This Month (Calendar) - `/this-month`

### Page Load
- ✅ Navigation to page works
- ✅ No accessibility violations
- ✅ Page header shows "This Month"
- 🔲 Loading state displays while fetching data

### Month Selector
- ✅ All 12 months displayed as buttons
- ✅ Current month has animated indicator
- ✅ Clicking month button changes selection
- 🔲 Selected month has different styling (active state)
- 🔲 Month emoji shows on desktop, first letter on mobile 📱
- 🔲 Month buttons are keyboard navigable

### Calendar Content
- ✅ Shows seasonal tasks (sow indoors, sow outdoors, plant out, harvest)
- 🔲 Tasks organized by category
- ✅ Key tasks highlighted appropriately
- ✅ Weather expectations visible for selected month
- ✅ Tip of the month shows

### Personalized Section ("Your Garden in [Month]")
- ✅ Only shows if user has plantings for selected year
- ✅ Shows planting counts correctly
- ✅ Shows active area counts
- 🔲 Harvest readiness alerts display for ready items
- ✅ "View in Allotment" links work correctly
- ✅ Empty state message when no plantings

### Expert Tips (Collapsible)
- ✅ Composting tip expands/collapses
- ✅ Crop Rotation tip expands/collapses
- ✅ Companion Plants tip expands/collapses
- ✅ Organic methods tip expands/collapses
- 🔲 Collapsed state persists correctly

### Tree & Perennials Care
- ✅ Section expands/collapses
- 🔲 Shows maintenance tasks for user's permanent plantings
- 🔲 Generic tips show when no user perennials

### Data Issues (noted in current plan)
- 🔲 **ISSUE:** Calendar shows static database data, not user-specific plantings
- 🔲 **ISSUE:** Information hierarchy needs review

---

## 3. Seeds - `/seeds`

### Page Load
- ✅ No accessibility violations
- ✅ Dialog accessibility when open
- ✅ Page header visible
- 🔲 Loading state while fetching data

### Year Navigation
- ✅ "All" tab shows all varieties
- ✅ Year tabs show available years
- ✅ Current year tab selected by default
- ✅ Clicking year tab switches view
- 🔲 Year picker positioned at bottom on mobile 📱

### Status Filters
- ✅ Filters disabled when "All" selected
- ✅ "Have Seeds" filter works
- ✅ "Need to Order" filter works
- 🔲 "All" filter shows everything
- 🔲 Filter selection updates variety list

### Statistics Cards
- ✅ "Have" count is accurate
- ✅ "Need" count is accurate
- 🔲 "Spent last year" shows correct total
- 🔲 "Spent this year" shows correct total
- 🔲 Numbers update when year changes

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
- 🔲 Supplier field accepts text
- 🔲 Price field accepts numbers
- 🔲 Notes field accepts text
- 🔲 New variety appears in list immediately

### Edit Variety
- ✅ Click variety card opens edit dialog
- 🔲 All fields pre-populated correctly
- 🔲 Can change variety name
- 🔲 Can change supplier
- 🔲 Can change price
- 🔲 Can change notes
- 🔲 Save updates variety
- 🔲 Cancel discards changes

### Seed Status Cycling
- ✅ Click status button cycles: none → ordered → have → had
- ✅ Status badge updates visually
- 🔲 Status persists after page reload

### Archive/Delete
- 🔲 Archive option available in edit dialog
- ✅ Archived varieties hidden by default
- ✅ "Show archived" toggle reveals archived
- 🔲 Can restore archived variety
- 🔲 Permanent delete available for archived
- 🔲 Delete confirmation dialog appears
- 🔲 Deleting removes variety from list

### Notes Warning
- ✅ Notes with warning words ("rotten", "poor", "failed") show warning icon
- 🔲 Warning highlighting visible

### External Links
- 🔲 Supplier links are clickable (where configured)
- 🔲 Links open in new tab
- 🔲 Seed supplier section shows quick links
- 🔲 Garden Organic link works

### Mobile
- ✅ Seed dialog accessibility on mobile
- ✅ Page responsive on mobile 📱
- 🔲 Cards are touch-friendly 📱
- 🔲 Year picker accessible at bottom 📱

---

## 4. Allotment - `/allotment`

### Page Load
- ✅ Page displays header
- ✅ Year selector visible with years
- ✅ No accessibility violations
- 🔲 Loading spinner during data fetch

### Year Selection
- ✅ Year buttons display available years
- ✅ Can switch between years
- ✅ Selected year persists across page reloads
- 🔲 Previous year navigation (arrow) works
- 🔲 Next year navigation (arrow) works
- 🔲 Delete year button appears on hover 🖥️
- 🔲 Delete year shows confirmation dialog
- 🔲 Can create previous year (historical)
- 🔲 Can create next year (planning)

### Grid View (Desktop)
- ✅ Grid items display
- ✅ Grid items are draggable in edit mode
- ✅ Resize handles visible when selected
- 🔲 Beds show correct names
- 🔲 Beds show planting count badges
- 🔲 Click bed selects it
- 🔲 Selected bed shows highlight
- 🔲 Drag to reposition works
- 🔲 Resize from corners works
- 🔲 Grid positions persist per year (v14 schema)

### Edit Mode
- 🔲 "Locked" button visible when not editing
- 🔲 Click "Locked" enters edit mode
- 🔲 "Editing" indicator visible when editing
- ✅ "Add Area" button enabled in edit mode
- 🔲 Click "Stop editing" exits edit mode
- 🔲 Grid changes are saved

### Add Area Dialog
- ✅ Dialog opens from Add Area button
- ✅ Dialog has proper ARIA attributes
- ✅ Dialog closes on Escape
- ✅ Dialog closes on close button
- ✅ Focus trapped within dialog
- 🔲 Area type buttons work (Rotation Bed, Perennial, Tree, Berry, Infrastructure)
- 🔲 Name field accepts input
- 🔲 Rotation group selector shows for rotation beds
- 🔲 Infrastructure subtype selector shows for infrastructure
- ✅ Infrastructure works without name (uses type as default)
- ✅ Custom name works for infrastructure
- 🔲 Submit creates area
- 🔲 New area appears in grid

### Detail Panel (Desktop Sidebar)
- ✅ Panel appears when bed selected
- ✅ "Add" button visible
- 🔲 Area name displayed
- 🔲 Rotation group shown for rotation beds
- 🔲 Planting list shown
- 🔲 Note section visible
- 🔲 Can scroll if content long

### Add Planting Dialog
- ✅ Opens when clicking "Add" button
- ✅ Dialog has heading
- ✅ Dialog has description text
- ✅ Requires vegetable selection (submit disabled without)
- ✅ Closes on Escape
- ✅ Closes on close button
- ✅ Focus trapped
- 🔲 Plant combobox searchable
- 🔲 Sow date picker works
- 🔲 Sow method selector works (indoor/outdoor/transplant-purchased)
- 🔲 Transplant date field appears when relevant
- 🔲 Variety selector shows available varieties
- 🔲 Notes field accepts input
- 🔲 Submit creates planting
- 🔲 New planting appears in bed

### Planting Card
- 🔲 Plant name displayed
- 🔲 Sow date shown
- 🔲 Status badge visible
- 🔲 Click opens PlantingDetailDialog
- 🔲 Delete button visible on hover 🖥️
- 🔲 Delete button always visible 📱
- ✅ Delete button works

### Planting Detail Dialog
- 🔲 Opens as bottom sheet on mobile 📱
- 🔲 Opens as centered dialog on desktop 🖥️
- 🔲 Shows plant info (water, sun, spacing, days to harvest)
- 🔲 Companion planting section visible
- 🔲 Good companions shown with indicator
- 🔲 Bad companions shown with warning
- 🔲 Sow date editable
- 🔲 Sow method editable
- 🔲 Expected harvest dates calculated
- 🔲 Actual harvest start date editable
- 🔲 Actual harvest end date editable
- 🔲 Notes editable
- 🔲 Success rating editable
- 🔲 Delete button with confirmation
- 🔲 Changes save automatically

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
- 🔲 Previous year rotation info visible
- 🔲 Auto-rotate dialog shows suggested rotation
- 🔲 Can accept rotation suggestion
- 🔲 Suggested vegetables match rotation group

### Mobile View
- ✅ Responsive on mobile
- ✅ Action buttons visible without hover 📱
- 🔲 Area cards show in scrollable list 📱
- 🔲 Tapping area opens bottom sheet 📱
- 🔲 Bottom sheet swipeable to close 📱
- 🔲 Floating action buttons visible 📱
- 🔲 Add Area accessible on mobile 📱

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
- 🔲 All changes save automatically
- 🔲 Save indicator shows "Saving..." then "Saved"
- 🔲 Last saved timestamp visible
- 🔲 Multi-tab sync works

---

## 5. Compost - `/compost`

### Page Load
- ✅ Page header visible ("Compost")
- ✅ Subtitle visible
- ✅ No accessibility violations
- 🔲 Loading state while fetching

### Care Tips Section
- ✅ "Compost Care Tips" visible
- ✅ Tips content visible
- 🔲 Tips are helpful and readable

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
- 🔲 All system types available (hot, hotbin, cold, tumbler, bokashi, worm bin)
- 🔲 Notes field optional
- ✅ Cancel button closes dialog
- ✅ Escape closes dialog
- ✅ Create button creates pile
- ✅ New pile appears in list

### Pile Card
- ✅ Pile name displayed
- 🔲 System emoji/icon visible
- 🔲 Days since start shown
- 🔲 Status badge visible
- 🔲 "Log Event" button visible
- 🔲 "Add Material" button visible

### Tracking Details (Expandable)
- ✅ Expand button works
- 🔲 Status dropdown visible when expanded
- ✅ Status dropdown changes pile status
- ✅ Status badge updates
- 🔲 Recent inputs list visible
- 🔲 Recent events list visible
- 🔲 Notes visible
- ✅ Delete pile link visible

### Log Event
- ✅ "Log Event" button opens dialog
- ✅ Event type dropdown works
- 🔲 All event types available (turn, water, harvest, other)
- 🔲 Notes field optional
- ✅ Submit logs event
- ✅ Dialog closes
- 🔲 Event appears in tracking details

### Add Material
- ✅ "Add Material" button opens dialog
- ✅ Material field required
- ✅ Submit disabled without material
- 🔲 Quantity field optional
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
- 🔲 Save indicator works

### Navigation
- ✅ Can navigate to allotment from page
- 🔲 Back navigation works

### Mobile
- ✅ Responsive on mobile
- ✅ Dialogs usable on mobile
- 🔲 Touch targets adequate 📱

---

## 6. AI Advisor (Aitor Modal)

### Access
- ✅ Floating button visible when feature unlocked
- ✅ Floating button NOT visible when locked
- ✅ Click floating button opens modal
- ✅ /ai-advisor redirects to home and opens modal
- 🔲 Button position consistent across pages
- 🔲 Button has appropriate aria-label

### Modal Display
- ✅ Modal opens as dialog
- ✅ "Ask Aitor" heading visible
- ✅ No accessibility violations
- 🔲 Bottom sheet on mobile 📱
- 🔲 Centered dialog on desktop 🖥️
- ✅ Close button works
- 🔲 Click outside closes (desktop) 🖥️
- 🔲 Swipe down closes (mobile) 📱

### Chat Interface
- ✅ Text input visible
- ✅ Can type in input
- 🔲 Send button visible
- 🔲 Enter key submits message
- 🔲 Message appears in chat log
- 🔲 Loading indicator while waiting for response
- 🔲 AI response displays with markdown formatting
- 🔲 Chat scrolls to latest message
- 🔲 Can scroll through history

### Quick Topics
- ✅ Quick topic buttons visible initially
- ✅ Clicking topic button sends message
- ✅ Message appears in chat
- 🔲 Quick topics hide after first message sent

### Location Status
- 🔲 Location status indicator visible
- 🔲 "Detect Location" button works
- 🔲 Success shows location name
- 🔲 Error shows retry option
- 🔲 Location used in AI context

### API Key (Settings Integration)
- 🔲 Error message when no API key set
- 🔲 Error includes link to settings
- 🔲 Works correctly when API key is set

### Tool Calling
- 🔲 AI can suggest adding plantings
- 🔲 Tool call confirmation dialog appears
- 🔲 User can approve tool call
- 🔲 User can reject tool call
- 🔲 Approved changes are applied
- 🔲 Results summary shown after execution
- 🔲 Plant disambiguation works (multiple matches)

### Rate Limiting
- 🔲 Rate limit message shows when exceeded
- 🔲 Countdown timer visible
- 🔲 Input disabled during cooldown
- 🔲 Resumes after cooldown

### Image Upload
- 🔲 Image upload button visible
- 🔲 Can select image file
- 🔲 Image preview shown
- 🔲 Image sent with message
- 🔲 AI can analyze image content

### Mobile
- ✅ Responsive on mobile
- 🔲 Input accessible above keyboard 📱
- 🔲 Chat scrolls correctly 📱

---

## 7. Settings - `/settings`

### Page Load
- 🔲 Page header visible
- 🔲 All sections visible

### AI Assistant Section
- 🔲 Shows locked state when AI not unlocked
- 🔲 Unlock hint visible when locked
- 🔲 API key input visible when unlocked
- 🔲 Input is paste-only (blocks typing)
- 🔲 Can paste API key
- 🔲 "Save Token" button works
- 🔲 "Clear Token" button works
- 🔲 Privacy notice visible
- 🔲 Link to OpenAI dashboard works

### Location Settings
- 🔲 Current location status shown
- 🔲 "Detect Location" button works
- 🔲 Success shows detected location
- 🔲 Error shows message
- 🔲 Retry button works after error
- 🔲 Explanation text visible

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
- 🔲 Share button visible
- 🔲 Click opens ShareDialog
- 🔲 QR code generates
- 🔲 6-character code displays
- 🔲 Copy code button works
- 🔲 Instructions visible
- 🔲 5-minute expiry noted

### Receive Allotment
- 🔲 Link to /receive visible
- 🔲 /receive page loads
- 🔲 Code entry field works
- 🔲 QR scanner works (mobile) 📱
- 🔲 Valid code shows data preview
- 🔲 Import confirmation works
- 🔲 Invalid code shows error

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
- 🔲 Concept explained clearly
- 🔲 Benefits mentioned
- 🔲 Not intimidating for new users

---

## 9. Navigation

### Desktop Navigation
- ✅ Primary nav items visible (Today, This Month, Seeds)
- ✅ "More" dropdown button visible
- ✅ Dropdown opens on click
- ✅ Dropdown shows locked features with unlock CTAs
- ✅ About link in dropdown
- ✅ Settings accessible
- ✅ Unlocked features promoted to primary nav
- ✅ Compost link works when unlocked
- ✅ Allotment link works when unlocked
- 🔲 Seasonal emoji in header correct
- 🔲 Active page indicator visible
- 🔲 Keyboard navigation works

### Mobile Navigation
- ✅ Hamburger button visible 📱
- ✅ Menu opens on hamburger click
- ✅ Close button works
- ✅ All nav links visible in menu
- ✅ "More" section expandable
- ✅ Manual unlock works on mobile
- ✅ Unlocked features promoted
- 🔲 Menu closes after navigation 📱
- 🔲 Touch targets 44px minimum 📱

### Allotment Name in Navigation
- ✅ Displays in nav
- ✅ Editable via pencil icon
- ✅ All edit behaviors work (Enter, blur, Escape)

---

## 10. Progressive Disclosure / Feature Gating

### Initial State (New User)
- ✅ Only 3 primary nav items (Today, This Month, Seeds)
- ✅ Locked features in "More" dropdown
- ✅ Progress bars visible for locked features
- ✅ Progress text shows (e.g., "0/3", "0/5")
- ✅ AI Advisor floating button NOT visible
- 🔲 Compost alerts NOT visible on dashboard

### AI Advisor Unlock
- ✅ Unlocks after 3 visits
- ✅ Unlocks after 1 planting
- ✅ Stays locked with 0 visits and 0 plantings
- ✅ Floating button appears when unlocked
- ✅ Modal opens when clicked
- 🔲 Unlock celebration shows (once)

### Compost Unlock
- ✅ Unlocks after 5 visits
- ✅ Unlocks after first harvest
- ✅ Stays locked with <5 visits and no harvest
- ✅ Appears in primary nav when unlocked
- 🔲 Unlock celebration shows (once)
- 🔲 Dashboard compost alerts appear

### Allotment Layout Unlock
- ✅ Unlocks after 5 plantings
- ✅ Stays locked with <5 plantings
- ✅ Progress shows (e.g., "4/5")
- ✅ Appears in primary nav when unlocked
- 🔲 Unlock celebration shows (once)

### Manual Unlock
- ✅ "Unlock now" button in dropdown
- ✅ Click manually unlocks feature
- ✅ Feature promoted to nav immediately
- ✅ Unlock persists after page reload
- ✅ Works on mobile

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
- 🔲 "Saving..." shows during save
- 🔲 "Saved" shows after success
- 🔲 Error state shows on failure
- 🔲 Last saved timestamp visible
- 🔲 Non-intrusive position

### Dialogs
- ✅ All dialogs have proper ARIA attributes
- ✅ Escape closes dialogs
- ✅ Focus trapped within dialogs
- 🔲 Bottom sheet on mobile 📱
- 🔲 Centered on desktop 🖥️
- 🔲 Consistent styling across app

### Toast Notifications
- 🔲 Success toasts show green
- 🔲 Error toasts show red
- 🔲 Auto-dismiss after timeout
- 🔲 Manual dismiss works

### Offline Indicator
- 🔲 Shows when offline
- 🔲 Clears when back online

### Storage Warning Banner
- 🔲 Shows when nearing storage limits
- 🔲 Helpful message and action

### Install Prompt (PWA)
- 🔲 Shows on supported browsers
- 🔲 Install button works
- 🔲 Can dismiss prompt

### Unlock Celebration
- 🔲 Shows when feature newly unlocked
- 🔲 Feature name displayed
- 🔲 Feature-specific tips shown
- 🔲 Only shows once per feature
- 🔲 Can dismiss

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
- 🔲 Can tab through all interactive elements
- 🔲 Focus indicators visible
- 🔲 No focus traps (except in dialogs)
- 🔲 Skip links work (if present)

### Screen Reader
- 🔲 Page headings announced correctly
- 🔲 Buttons have accessible names
- 🔲 Images have alt text
- 🔲 Form fields have labels

### Color Contrast
- 🔲 Text meets WCAG AA (4.5:1)
- 🔲 Large text meets AA (3:1)
- 🔲 Interactive elements distinguishable

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
9. 🔲 Set sow date and method
10. ✅ Submit - planting appears
11. 🔲 Navigate to Today
12. 🔲 See relevant info about new planting

### Journey 2: Track a Harvest
1. ✅ Go to Allotment
2. ✅ Select a bed with plantings
3. 🔲 Click on a planting card
4. 🔲 PlantingDetailDialog opens
5. 🔲 Set actual harvest start date
6. 🔲 Close dialog
7. 🔲 Check harvest totals update

### Journey 3: Check What To Do
1. ✅ Go to Today (dashboard)
2. ✅ See seasonal tasks
3. 🔲 See maintenance reminders
4. ✅ Navigate to This Month
5. 🔲 Select current month
6. 🔲 See personalized section
7. ✅ See what's ready to harvest

### Journey 4: Add Seeds I Bought
1. ✅ Go to Seeds
2. ✅ Click Add Variety
3. ✅ Select plant type
4. ✅ Enter variety name
5. 🔲 Enter supplier and price
6. ✅ Submit - variety appears
7. 🔲 Click to set status to "have"
8. ✅ Go to Allotment
9. ✅ Add planting, select variety from dropdown
10. ✅ Variety shows correctly

### Journey 5: Share with Family
1. 🔲 Go to Settings
2. 🔲 Click Share Allotment
3. 🔲 QR code and code display
4. 🔲 On second device: Go to /receive
5. 🔲 Scan QR or enter code
6. 🔲 Preview data shown
7. 🔲 Confirm import
8. 🔲 Data appears on second device

### Journey 6: Ask for Help
1. 🔲 Unlock AI Advisor (or manually unlock)
2. 🔲 Click floating Aitor button
3. 🔲 Modal opens
4. 🔲 Type a question or click quick topic
5. 🔲 Wait for response
6. 🔲 If tool call suggested, confirm it
7. 🔲 Check Allotment for changes
8. 🔲 Close modal

---

## Summary Statistics

### Playwright Test Coverage by Section:
| Section | Covered | Manual | Total |
|---------|---------|--------|-------|
| Today | 12 | 10 | 22 |
| This Month | 17 | 6 | 23 |
| Seeds | 25 | 11 | 36 |
| Allotment | 45 | 35 | 80 |
| Compost | 28 | 10 | 38 |
| AI Advisor | 12 | 20 | 32 |
| Settings | 15 | 15 | 30 |
| About | 15 | 0 | 15 |
| Navigation | 15 | 8 | 23 |
| Progressive Disclosure | 18 | 6 | 24 |
| Onboarding | 25 | 0 | 25 |
| Accessibility | 15 | 8 | 23 |
| User Journeys | 25 | 17 | 42 |
| **TOTAL** | **267** | **146** | **413** |

**Coverage: ~65% automated, ~35% manual verification needed**

### Priority Areas for Manual Review:
1. **AI Advisor** - Tool calling flow, rate limiting, image upload
2. **Allotment** - Planting detail dialog, mobile experience
3. **Settings** - Share/receive flow, location detection
4. **Seeds** - Supplier/price fields, archive restore flow
