#!/usr/bin/env bash
# Pinned-browser symlink workaround for Claude Code on the web / any environment
# whose pre-installed Chromium revision differs from the one @playwright/test
# pins. Playwright resolves a versioned path (e.g. chromium-1228/chrome-linux64/
# chrome); when the image ships a different revision (e.g. chromium-1194/
# chrome-linux) Playwright refuses to launch and asks you to run
# `playwright install` (which is disabled here). This script symlinks the pinned
# revision Playwright wants onto whatever build is present, so the suite runs
# against the image's Chromium without downloading anything.
#
# Idempotent. Safe to run at session start. Requires PLAYWRIGHT_BROWSERS_PATH
# (defaults to /opt/pw-browsers).
set -euo pipefail

BROWSERS_DIR="${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}"

# The revision Playwright currently pins, e.g. /opt/pw-browsers/chromium-1228/...
WANT_CHROME="$(node -e "console.log(require('@playwright/test').chromium.executablePath())")"
WANT_DIR="$(dirname "$(dirname "$WANT_CHROME")")"          # .../chromium-<rev>
WANT_SUB="$(basename "$(dirname "$WANT_CHROME")")"         # chrome-linux64

link_browser() {
  local prefix="$1" bin_name="$2" src_bin="$3" want_dir="$4" want_sub="$5"
  if [ -x "$want_dir/$want_sub/$bin_name" ] || [ -L "$want_dir/$want_sub" ]; then
    echo "ok: $(basename "$want_dir") already present"
    return
  fi
  # Newest matching installed build of this prefix (e.g. chromium-1194).
  local have_dir
  have_dir="$(ls -d "$BROWSERS_DIR/$prefix"-* 2>/dev/null | sort -V | tail -1 || true)"
  if [ -z "$have_dir" ]; then
    echo "warn: no installed $prefix build to link from" >&2
    return
  fi
  local have_sub
  have_sub="$(ls -d "$have_dir"/chrome-linux* 2>/dev/null | head -1 || true)"
  [ -z "$have_sub" ] && { echo "warn: no chrome-linux dir in $have_dir" >&2; return; }

  mkdir -p "$want_dir"
  if [ "$bin_name" = "$src_bin" ]; then
    ln -sfn "$have_sub" "$want_dir/$want_sub"
  else
    # Binary is named differently (headless shell); symlink each resource, then
    # expose the binary under the name Playwright expects.
    mkdir -p "$want_dir/$want_sub"
    for f in "$have_sub"/*; do ln -sfn "$f" "$want_dir/$want_sub/$(basename "$f")"; done
    ln -sfn "$have_sub/$src_bin" "$want_dir/$want_sub/$bin_name"
  fi
  touch "$want_dir/INSTALLATION_COMPLETE" "$want_dir/DEPENDENCIES_VALIDATED"
  echo "linked: $(basename "$want_dir") -> $(basename "$have_dir")"
}

# Full Chromium (chrome-linux64/chrome).
link_browser "chromium" "chrome" "chrome" "$WANT_DIR" "$WANT_SUB"

# Headless shell (chrome-headless-shell-linux64/chrome-headless-shell). Derive
# its pinned dir by swapping the revision onto the headless-shell prefix.
REV="${WANT_DIR##*-}"
HS_WANT_DIR="$BROWSERS_DIR/chromium_headless_shell-$REV"
link_browser "chromium_headless_shell" "chrome-headless-shell" "headless_shell" \
  "$HS_WANT_DIR" "chrome-headless-shell-linux64"

echo "done."
