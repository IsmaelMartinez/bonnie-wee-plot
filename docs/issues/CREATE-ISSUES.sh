#!/bin/bash
# Create Phase 3 GitHub Issues using GitHub CLI
#
# Prerequisites:
# - GitHub CLI installed (gh)
# - Authenticated to GitHub (gh auth login)
# - Run from project root directory
#
# Usage:
#   chmod +x docs/issues/CREATE-ISSUES.sh
#   ./docs/issues/CREATE-ISSUES.sh
#

set -e

REPO=${REPO:-"$(gh repo view --json nameWithOwner -q)"}
ISSUE_DIR="docs/issues"

echo "Creating Phase 3 issues in $REPO..."
echo ""

# Issue #9
echo "Creating Issue #9: Remove separate variety storage and useVarieties hook..."
gh issue create \
  --repo "$REPO" \
  --title "Remove separate variety storage and useVarieties hook" \
  --label "refactor,variety-management,breaking-change,phase-3" \
  --body "$(cat "$ISSUE_DIR/issue-9-remove-variety-storage.md")" \
  2>/dev/null && echo "✓ Issue #9 created" || echo "✗ Issue #9 creation failed"

echo ""

# Issue #10
echo "Creating Issue #10: Eliminate variety-allotment-sync service..."
gh issue create \
  --repo "$REPO" \
  --title "Eliminate variety-allotment-sync service" \
  --label "refactor,variety-management,phase-3" \
  --body "$(cat "$ISSUE_DIR/issue-10-eliminate-sync-service.md")" \
  2>/dev/null && echo "✓ Issue #10 created" || echo "✗ Issue #10 creation failed"

echo ""

# Issue #11
echo "Creating Issue #11: Implement one-time storage migration..."
gh issue create \
  --repo "$REPO" \
  --title "Implement one-time storage migration" \
  --label "refactor,variety-management,data-migration,phase-3" \
  --body "$(cat "$ISSUE_DIR/issue-11-storage-migration.md")" \
  2>/dev/null && echo "✓ Issue #11 created" || echo "✗ Issue #11 creation failed"

echo ""

# Issue #12
echo "Creating Issue #12: Clean up redundant files and code..."
gh issue create \
  --repo "$REPO" \
  --title "Clean up redundant files and code" \
  --label "refactor,variety-management,cleanup,phase-3" \
  --body "$(cat "$ISSUE_DIR/issue-12-cleanup.md")" \
  2>/dev/null && echo "✓ Issue #12 created" || echo "✗ Issue #12 creation failed"

echo ""
echo "All issues created! Check your repository's Issues tab."
echo ""
echo "Next steps:"
echo "1. Review the issues in GitHub"
echo "2. Add project/milestone if desired (gh issue edit #9 --project ...)"
echo "3. Assign issues to team members (gh issue edit #9 --assignee ...)"
echo "4. Set issue order/dependencies in GitHub project board"
