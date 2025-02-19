#!/bin/bash

# Usage: ./timeout-wrapper.sh <same arguments as timeout command>
# Example: ./timeout-wrapper.sh 30s pnpm test

# Save the current errexit state, then disable it.
# Disabling errexit is necessary because the timeout command will return a non-zero exit code if the command times out
# and errexit would cause the script to exit immediately. We want to capture the exit code and handle it.
IS_ERREXIT_SET=$(echo $- | grep e | wc -l)
set +e

# Run the command with timeout
timeout "$@"

# Capture exit code
EXIT_CODE=$?

# Enable errexit if it was enabled before
if [ $IS_ERREXIT_SET -eq 1 ]; then
    set -e
fi

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
