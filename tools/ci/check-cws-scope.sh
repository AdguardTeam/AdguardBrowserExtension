#!/bin/bash

# This script runs the CWS skip-review change check for one store channel
# inside the auto-build Docker stage and records the outcome in the publish
# properties file the workflow reads.
#
# A build that is not eligible for the requested CWS review must not be
# submitted to CWS, but it is still a valid build: the Edge submission always
# goes through the standard Edge review, so the caller skips only the CWS
# publish jobs and keeps the Edge publish. The checker reports ineligibility
# with exit code 2; every other non-zero code is a real error the caller must
# treat as fatal. A failure outside the checker that happens to exit with 2
# would be read as ineligible, which is the safe direction: the CWS publish is
# skipped, the Edge submission continues, and the run is still reported as
# failed by the `report-cws-scope` job.
#
# Usage: ./check-cws-scope.sh <properties-file> <channel> <old-dir> <new-dir> <review-mode>
#   properties-file: publish properties file to append the outcome to
#                    (created by the auto-build stage)
#   channel:         `beta` or `release` - names the `<channel>-scope` key
#   old-dir:         unpacked extension currently published in CWS
#   new-dir:         unpacked built extension to compare with it
#   review-mode:     `expedited` or `standard-review` - the review the build is
#                    submitted for, selects the checker flag
#
# Exit codes:
#   0 - the outcome was recorded (`<channel>-scope=ok` or `<channel>-scope=ineligible`)
#   1 - the check could not be run or the arguments are invalid - callers must
#       fail the build

# 'set' should be added to the beginning of each script to ensure that it runs with the correct options.
# Please do not move it to some common file, like `setup-tests.sh`, because sourcing A script from B script
# cannot change the options of B script.
#  -e: Exit immediately if any command exits with a non-zero status (i.e., if a command fails).
#  -u: Treat unset variables as an error.
#  -x: Print each command to the terminal as it is executed, which is useful for debugging.
#  -o pipefail: Fail the pipeline if any command in it fails.
set -euxo pipefail

# Fix mixed logs
exec 2>&1

PROPERTIES_FILE="${1:-}"
CHANNEL="${2:-}"
OLD_DIR="${3:-}"
NEW_DIR="${4:-}"
REVIEW_MODE="${5:-}"

if [ -z "${PROPERTIES_FILE}" ] || [ -z "${CHANNEL}" ] || [ -z "${OLD_DIR}" ] || [ -z "${NEW_DIR}" ] || [ -z "${REVIEW_MODE}" ]; then
    echo "❌ Usage: $0 <properties-file> <channel> <old-dir> <new-dir> <review-mode>"
    exit 1
fi

# A typo in the channel would write a key the workflow does not read, and the
# publish job would then run without a recorded outcome.
case "${CHANNEL}" in
    beta|release) ;;
    *)
        echo "❌ Unknown channel '${CHANNEL}', expected 'beta' or 'release'"
        exit 1
        ;;
esac

case "${REVIEW_MODE}" in
    expedited|standard-review) ;;
    *)
        echo "❌ Unknown review mode '${REVIEW_MODE}', expected 'expedited' or 'standard-review'"
        exit 1
        ;;
esac

# The auto-build stage creates the file before running the checks; appending to
# a missing file would silently record the outcome in the wrong place.
if [ ! -f "${PROPERTIES_FILE}" ]; then
    echo "❌ Properties file ${PROPERTIES_FILE} does not exist"
    exit 1
fi

run_checker() {
    if [ "${REVIEW_MODE}" = 'standard-review' ]; then
        pnpm tsx tools/skip-review/check-changes-for-cws "${OLD_DIR}" "${NEW_DIR}" --standard-review
    else
        pnpm tsx tools/skip-review/check-changes-for-cws "${OLD_DIR}" "${NEW_DIR}"
    fi
}

echo "Checking the ${CHANNEL} package for the ${REVIEW_MODE} CWS review"

if run_checker; then
    echo "${CHANNEL}-scope=ok" >> "${PROPERTIES_FILE}"
    echo "✅ ${CHANNEL} package is eligible for the requested CWS review"
else
    STATUS=$?
    if [ "${STATUS}" = '2' ]; then
        echo "${CHANNEL}-scope=ineligible" >> "${PROPERTIES_FILE}"
        echo "⚠️ CWS ${CHANNEL} publish will be skipped: the build is not eligible for the requested review"
    else
        echo "❌ The ${CHANNEL} scope check failed with exit status ${STATUS}"
        exit "${STATUS}"
    fi
fi
