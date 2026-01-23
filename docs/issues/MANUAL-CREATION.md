# Manual GitHub Issue Creation Guide

If you prefer to create issues manually through the GitHub web interface rather than using the CLI, follow this guide.

## Before You Start

1. Navigate to your repository on GitHub
2. Go to the "Issues" tab
3. Click "New Issue" button

## Issue #9: Remove separate variety storage and useVarieties hook

### Step 1: Basic Information
- **Title:** Remove separate variety storage and useVarieties hook
- **Description:** Copy the content from `/docs/issues/issue-9-remove-variety-storage.md`

### Step 2: Labels
Add these labels:
- `refactor`
- `variety-management`
- `breaking-change`
- `phase-3`

### Step 3: Additional Settings (if using issue template)
- **Priority:** High
- **Size/Effort:** M (3-5 days)

### Step 4: Create
Click "Create Issue" button

---

## Issue #10: Eliminate variety-allotment-sync service

### Step 1: Basic Information
- **Title:** Eliminate variety-allotment-sync service
- **Description:** Copy the content from `/docs/issues/issue-10-eliminate-sync-service.md`

### Step 2: Labels
Add these labels:
- `refactor`
- `variety-management`
- `phase-3`

### Step 3: Additional Settings (if using issue template)
- **Priority:** High
- **Size/Effort:** M (2-4 days)

### Step 4: Create
Click "Create Issue" button

---

## Issue #11: Implement one-time storage migration

### Step 1: Basic Information
- **Title:** Implement one-time storage migration
- **Description:** Copy the content from `/docs/issues/issue-11-storage-migration.md`

### Step 2: Labels
Add these labels:
- `refactor`
- `variety-management`
- `data-migration`
- `phase-3`

### Step 3: Additional Settings (if using issue template)
- **Priority:** High
- **Size/Effort:** L (4-6 days)

### Step 4: Create
Click "Create Issue" button

---

## Issue #12: Clean up redundant files and code

### Step 1: Basic Information
- **Title:** Clean up redundant files and code
- **Description:** Copy the content from `/docs/issues/issue-12-cleanup.md`

### Step 2: Labels
Add these labels:
- `refactor`
- `variety-management`
- `cleanup`
- `phase-3`

### Step 3: Additional Settings (if using issue template)
- **Priority:** Medium
- **Size/Effort:** S (1-2 days)

### Step 4: Create
Click "Create Issue" button

---

## After Creating All Issues

### Option 1: Using GitHub CLI to Link Issues (Recommended)

Once issues are created, link them with dependencies:

```bash
# Link issues to show sequential dependency

# #10 is blocked by #9
gh issue edit 10 --body-file - <<'EOF'
## Depends On
- Blocks until #9 is completed
EOF

# #11 is blocked by both #9 and #10
gh issue edit 11 --body-file - <<'EOF'
## Depends On
- Blocks until #9 and #10 are completed
EOF

# #12 is blocked by all others
gh issue edit 12 --body-file - <<'EOF'
## Depends On
- Blocks until #9, #10, and #11 are completed
EOF
```

### Option 2: Create a GitHub Project Board

1. Go to "Projects" tab in your repository
2. Click "New Project"
3. Create a new project named "Phase 3: Variety Management Refactor"
4. Add the issues to the project
5. Create columns: "Not Started", "In Progress", "In Review", "Done"
6. Link issues in "Not Started" column

### Option 3: Add to Existing Milestone

If you have a "Phase 3" milestone:

1. Go to "Issues" tab
2. Filter for `label:phase-3`
3. Open each issue
4. Assign to "Phase 3" milestone
5. Use GitHub's milestone view to track progress

---

## Verifying Issues Were Created

### Check in GitHub Web UI

1. Go to your repository's "Issues" tab
2. Search for `label:phase-3`
3. You should see 4 issues:
   - #9 (Remove storage)
   - #10 (Eliminate sync)
   - #11 (Storage migration)
   - #12 (Cleanup)

### Using GitHub CLI

```bash
# List all Phase 3 issues
gh issue list --label phase-3 --state open

# Should output something like:
# 9    Remove separate variety storage...   refactor,variety-management,phase-3
# 10   Eliminate variety-allotment-sync...  refactor,variety-management,phase-3
# 11   Implement one-time storage migra...  refactor,variety-management,phase-3
# 12   Clean up redundant files and code... refactor,variety-management,phase-3
```

---

## Content Reference

### Quick Copy-Paste Headers

Use these when creating issues manually if you want to be faster:

**Issue #9:**
- Title: `Remove separate variety storage and useVarieties hook`
- Priority: High | Size: M (3-5 days)

**Issue #10:**
- Title: `Eliminate variety-allotment-sync service`
- Priority: High | Size: M (2-4 days)

**Issue #11:**
- Title: `Implement one-time storage migration`
- Priority: High | Size: L (4-6 days)

**Issue #12:**
- Title: `Clean up redundant files and code`
- Priority: Medium | Size: S (1-2 days)

---

## File Locations for Content

When you need to copy the issue body content:

- `docs/issues/issue-9-remove-variety-storage.md`
- `docs/issues/issue-10-eliminate-sync-service.md`
- `docs/issues/issue-11-storage-migration.md`
- `docs/issues/issue-12-cleanup.md`

Each file has:
- Labels section
- Priority
- Size
- Description
- Acceptance Criteria
- Implementation Details
- Testing Requirements
- Dependencies

---

## Troubleshooting

### Issue: Can't create issues
- **Check:** Verify you have write access to the repository
- **Fix:** Ask repository owner to grant issue creation permissions

### Issue: Labels don't exist
- **Option 1:** Create labels first in repository Settings → Labels
- **Option 2:** Create issues without labels, then add labels later

### Issue: Can't copy content properly
- **Fix:** Use raw content view on GitHub to copy markdown cleanly
- **Tip:** Copy from the markdown file directly in your editor instead

### Issue: Need to assign to team members
- **Step 1:** Create the issue first
- **Step 2:** Click "Assignees" on the right panel
- **Step 3:** Select team members

---

## Next Steps After Creating Issues

1. **Review the issues** in GitHub to verify content
2. **Create a project board** if you don't have one (helpful for tracking)
3. **Assign team members** who will work on each issue
4. **Set milestone** to your release/sprint
5. **Add to backlog** for prioritization with other work
6. **Start with #9** - must be completed before #10
7. **Follow sequential order** - #9 → #10 → #11 → #12

---

## Creating Future Issues

This same format works for creating other issues. Template:

1. Individual markdown file with full specification
2. Consistent structure (Description, Acceptance Criteria, Implementation Details, etc.)
3. Clear labels for categorization
4. Priority and size estimates
5. Testing requirements
6. Dependencies listed

This approach ensures:
- Consistent issue quality
- Complete specifications upfront
- Easier handoff between team members
- Clear testing criteria
- Well-documented implementation path
