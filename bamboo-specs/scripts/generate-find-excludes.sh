#!/bin/bash

# Generates find-compatible exclusion list from .gitignore using git.
# Must be run from the repo root where .git is available.
#
# Usage: ./generate-find-excludes.sh [output-file]
# Output: a file with one exclude path per line (no wildcards, no eval needed).
#
# The generated file is consumed by parse-gitignore.sh inside Docker
# (where .git is not available).

# 'set' should be added to the beginning of each script to ensure that it runs with the correct options.
# Please do not move it to some common file, like `setup-tests.sh`, because sourcing A script from B script
# cannot change the options of B script.
#  -e: Exit immediately if any command exits with a non-zero status (i.e., if a command fails).
#  -x: Print each command to the terminal as it is executed, which is useful for debugging.
set -ex

# Output file path. Consumed by parse-gitignore.sh inside Docker.
DEFAULT_FILE="gitignore-excludes.txt"
OUTPUT_FILE="${1:-${DEFAULT_FILE}}"

# Use git to list ignored directories and files that exist in the working tree.
# --others:             show untracked files
# --ignored:            show only ignored files
# --exclude-standard:   use .gitignore / .git/info/exclude / global gitignore
# --directory:          show directory names only (not their contents)
EXISTING_IGNORED=$(git ls-files --others --ignored --exclude-standard --directory \
  | sed 's|/$||' | sort -u)

# Also parse .gitignore directly for patterns that may not exist on the host
# but will exist inside Docker (e.g., build/, node_modules/).
# Only include simple patterns — skip wildcards, negations, comments.
GITIGNORE_PATTERNS=""
if [ -f .gitignore ]; then
  GITIGNORE_PATTERNS=$(grep -v '^#' .gitignore \
    | grep -v '^!' \
    | grep -v '^$' \
    | grep -v '[*?[]' \
    | sed 's|^/||' \
    | sed 's|/$||' \
    | sort -u)
fi

# Merge both lists, deduplicate.
echo "$EXISTING_IGNORED" "$GITIGNORE_PATTERNS" \
  | tr ' ' '\n' | grep -v '^$' | sort -u > "$OUTPUT_FILE"

echo "Generated find excludes in $OUTPUT_FILE ($(wc -l < "$OUTPUT_FILE" | tr -d ' ') patterns)"
