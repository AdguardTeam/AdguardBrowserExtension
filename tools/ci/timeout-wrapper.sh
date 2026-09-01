#!/bin/bash

# Usage: ./timeout-wrapper.sh <same arguments as timeout command>
# Example: ./timeout-wrapper.sh 30s pnpm test

# Treat unset variables as an error and fail pipelines, but keep errexit
# disabled (with a re-enable below) so the command's exit code is captured.
set -uo pipefail
set +e

# Run the command with timeout
timeout "$@"

# Capture exit code
EXIT_CODE=$?

# Enable errexit back
set -e

# Handle other failures
if [ $EXIT_CODE -ne 0 ]; then
    if [ $EXIT_CODE -eq 124 ]; then
        echo "Command timed out"
    else
        echo "Command failed with exit code $EXIT_CODE"
    fi
    exit $EXIT_CODE
fi

# Success
exit 0
