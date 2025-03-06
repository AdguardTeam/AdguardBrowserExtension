#!/bin/bash

# Usage: ./timeout-wrapper.sh <same arguments as timeout command>
# Example: ./timeout-wrapper.sh 30s pnpm test

# Disable errexit to handle the exit code of the command with timeout.
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
