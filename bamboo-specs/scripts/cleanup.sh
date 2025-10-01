#!/bin/bash

# Cleanup script that preserves specified artifacts
# Usage: ./cleanup.sh artifact1,artifact2,artifact3

# 'set' should be added to the beginning of each script to ensure that it runs with the correct options.
# Please do not move it to some common file, like `setup-tests.sh`, because sourcing A script from B script
# cannot change the options of B script.
#  -e: Exit immediately if any command exits with a non-zero status (i.e., if a command fails).
#  -x: Print each command to the terminal as it is executed, which is useful for debugging.
set -ex

# Redirect stderr (2) to stdout (1) to capture all output in a single log
exec 2>&1

echo "Size before cleanup:" && du -h | tail -n 1
echo "Top 5 files:" && du -h | sort -hr | head -n 5

# Parse artifacts from command line argument
ARTIFACTS_ARG="${1:-}"
if [ -z "$ARTIFACTS_ARG" ]; then
    echo "No artifacts specified, cleaning entire workspace"
    ARTIFACTS=""
else
    # Convert comma-separated string to space-separated
    ARTIFACTS=$(echo "$ARTIFACTS_ARG" | tr ',' ' ')
    echo "Preserving artifacts: $ARTIFACTS"
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Stash artifacts to temporary directory
for f in $ARTIFACTS; do
  [ -e "$f" ] || continue
  echo "Stashing artifact: $f"
  mkdir -p "$TMP/$(dirname "$f")"
  mv "$f" "$TMP/$f"
done

# Clean entire workspace (including dotfiles and .git)
find . -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +

# Also clean tsurlfilter in parent directory (created by link-tsurlfilter.sh)
rm -rf ../tsurlfilter

# Restore artifacts
for f in $ARTIFACTS; do
  [ -e "$TMP/$f" ] || continue
  echo "Restoring artifact: $f"
  mkdir -p "$(dirname "$f")"
  mv "$TMP/$f" "$f"
done

echo "Size after cleanup:" && du -h | tail -n 1
echo "Top 5 files:" && du -h | sort -hr | head -n 5

echo "Cleanup completed successfully"
