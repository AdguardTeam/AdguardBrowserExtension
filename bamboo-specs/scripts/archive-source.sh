#!/bin/bash

# Usage: ./archive-source.sh beta|release
# Example: ./archive-source.sh release

# 'set' should be added to the beginning of each script to ensure that it runs with the correct options.
# Please do not move it to some common file, like `setup-tests.sh`, because sourcing A script from B script
# cannot change the options of B script.
#  -e: Exit immediately if any command exits with a non-zero status (i.e., if a command fails).
#  -x: Print each command to the terminal as it is executed, which is useful for debugging.
set -ex

# Validate argument
TARGET="$1"
if [ "$TARGET" != "beta" ] && [ "$TARGET" != "release" ]; then
  echo "Error: Argument must be 'beta' or 'release'"
  exit 1
fi

# Set output path
OUTPUT_DIR="build/$TARGET"
OUTPUT_ZIP="$OUTPUT_DIR/source.zip"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Step 1: List all tracked files
ALL_FILES=$(git ls-files)

# Step 2: Exclude files in Extension/filters/
FILES_EXCLUDING_FILTERS=$(grep -v '^Extension/filters/' <<< "$ALL_FILES")

# Step 3: List only the Extension/filters/firefox files
FIREFOX_FILTER_FILES=$(git ls-files Extension/filters/firefox)

# Step 4: Combine the two lists
COMBINED_FILES=$(echo -e "$FILES_EXCLUDING_FILTERS\n$FIREFOX_FILTER_FILES")

# Step 5: Create the zip from combined list
echo "$COMBINED_FILES" | zip -@ "$OUTPUT_ZIP"

echo "source.zip created at $OUTPUT_ZIP"
