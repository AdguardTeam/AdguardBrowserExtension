#!/bin/bash

# Archives source files into a zip for AMO (addons.mozilla.org) publishing.
# Excludes files matching .gitignore patterns and Extension/filters/ (except firefox).
#
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

# Build exclusion patterns via shared script.
# Prefers gitignore-excludes.txt (generated on host by generate-find-excludes.sh),
# falls back to .gitignore parsing if gitignore-excludes.txt is not available.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/parse-gitignore.sh" gitignore-excludes.txt

# Find all files, excluding .git, .gitignore patterns and Extension/filters/
ALL_FILES=$(find . -type f ! -path './.git/*' "${GITIGNORE_EXCLUDE_ARGS[@]}" ! -path './Extension/filters/*' \
  | sed 's|^\./||' | sort)

# Find Extension/filters/firefox files
FIREFOX_FILTER_FILES=""
if [ -d "Extension/filters/firefox" ]; then
  FIREFOX_FILTER_FILES=$(find Extension/filters/firefox -type f | sort)
fi

# Combine the two lists
if [ -n "$FIREFOX_FILTER_FILES" ]; then
  COMBINED_FILES=$(echo -e "$ALL_FILES\n$FIREFOX_FILTER_FILES")
else
  COMBINED_FILES="$ALL_FILES"
fi

# Step 5: Create the zip from combined list
echo "$COMBINED_FILES" | zip -@ "$OUTPUT_ZIP"

# Append Firefox Add-ons Review team build instructions to README.md inside source.zip.
# The review instructions are embedded here as a heredoc so everything stays in one file.
# See https://extensionworkshop.com/documentation/publish/source-code-submission/
TEMP_DIR=$(mktemp -d)
unzip -o "$OUTPUT_ZIP" README.md -d "$TEMP_DIR"
# Replace the TOC anchor with a TOC entry for the Firefox reviewer section.
sed -i.bak 's/<!-- TOC:AMO_REVIEW -->/- [Building Instructions for Firefox Add-ons Review Team](#building-instructions-for-firefox-add-ons-review-team)/' "$TEMP_DIR/README.md"
rm -f "$TEMP_DIR/README.md.bak"
cat >> "$TEMP_DIR/README.md" << 'REVIEW_EOF'

## Building Instructions for Firefox Add-ons Review Team

This section is intended for the Firefox Add-ons Review team to reproduce
the extension build from source.

### Prerequisites

The only prerequisite is [Docker](https://docs.docker.com/get-docker/).
All build tools (Node.js v22, pnpm v10) are pre-installed in the Docker image.

### Building the release version

You can build the release version by running a single command:

```sh
docker run --rm \
    -v "$(pwd)":/workspace \
    -w /workspace \
    adguard/extension-builder:22.17--0.3.0--0 \
    bash -c "pnpm install && pnpm release firefox-amo"
```

The build output will be in the `./build/release/firefox-amo` directory.
The resulting `firefox-amo.zip` can be compared with the uploaded add-on.

### Building the beta version

```sh
docker run --rm \
    -v "$(pwd)":/workspace \
    -w /workspace \
    adguard/extension-builder:22.17--0.3.0--0 \
    bash -c "pnpm install && pnpm beta firefox-standalone"
```

The build output will be in the `./build/beta/firefox-standalone` directory.
The resulting `firefox-standalone.zip` can be compared with the uploaded add-on.
REVIEW_EOF
ABS_OUTPUT_ZIP="$(cd "$(dirname "$OUTPUT_ZIP")" && pwd)/$(basename "$OUTPUT_ZIP")"
(cd "$TEMP_DIR" && zip "$ABS_OUTPUT_ZIP" README.md)
rm -rf "$TEMP_DIR"

echo "source.zip created at $OUTPUT_ZIP"
