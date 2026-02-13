#!/bin/bash

# 'set' should be added to the beginning of each script to ensure that it runs with the correct options.
# Please do not move it to some common file, like `setup-tests.sh`, because sourcing A script from B script
# cannot change the options of B script.
#  -e: Exit immediately if any command exits with a non-zero status (i.e., if a command fails).
#  -x: Print each command to the terminal as it is executed, which is useful for debugging.
set -ex

# Show files in current directory
ls -la

# Fix mixed logs
exec 2>&1

# Validate input
if [ -z "$1" ]; then
  echo "Error: Target (release/beta/dev) not provided."
  exit 1
fi

TARGET=$1
ARTIFACT="chrome-mv3-${TARGET}.zip"

echo "Running integration tests for target: $TARGET"

# Move artifact to build directory, because integration tests expect it there.
mkdir -p build/$TARGET/
mv $ARTIFACT build/$TARGET/chrome-mv3.zip

# Set cache directory
pnpm config set store-dir ${bamboo_cachePnpm}

# Install dependencies
pnpm install ${bamboo_varsPnpm}

# For correct link playwright browsers
pnpm exec playwright install

# Run integration tests
pnpm test:integration $TARGET

# Move test results to distinguish release and beta
mv tests-reports/integration-tests.xml tests-reports/integration-tests-${TARGET}.xml
