#!/bin/bash

# Checks the exit-code file produced by a Docker test stage and fails the job
# with a clear message when the recorded code is non-zero. Test stages always
# exit 0 so the JUnit report is uploaded even on failure, and write the real
# exit code to <dir>/exit-code.txt.
#
# Usage: ./check-exit-code.sh <exit-code-file> <label>

# 'set' should be added to the beginning of each script to ensure that it runs with the correct options.
# Please do not move it to some common file, like `setup-tests.sh`, because sourcing A script from B script
# cannot change the options of B script.
#  -e: Exit immediately if any command exits with a non-zero status (i.e., if a command fails).
#  -u: Treat unset variables as an error.
#  -x: Print each command to the terminal as it is executed, which is useful for debugging.
#  -o pipefail: Fail the pipeline if any command in it fails.
set -euxo pipefail

# Script Conventions: merge stderr into stdout so nothing written to stderr
# (including ::error:: markers) is lost when the workflow captures this output.
exec 2>&1

EXIT_CODE_FILE="${1:?Usage: ./check-exit-code.sh <exit-code-file> <label>}"
LABEL="${2:?Usage: ./check-exit-code.sh <exit-code-file> <label>}"

code="$(cat "${EXIT_CODE_FILE}")"
if [ "${code}" != "0" ]; then
    echo "::error::${LABEL} failed with exit code ${code}"
    exit 1
fi

echo "${LABEL} passed"
