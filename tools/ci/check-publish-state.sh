#!/bin/bash

# This script checks whether a failed Chrome Web Store publish call actually
# landed in the store: CWS sometimes answers HTTP 502 on publish after the
# upload (go-webext update) already succeeded, while the extension is actually
# submitted or published. The auto-build workflow runs it after a failed
# publish job to decide whether that failure was real.
#
# Usage: ./check-publish-state.sh <item-id> <expected-version>
#   item-id:          Chrome Web Store item ID (32 chars)
#   expected-version: version the failed publish call uploaded
#                     (major.minor.patch.build)
#
# Required environment variables (must be set by the caller):
#   CHROME_CLIENT_ID       - Chrome Web Store API client ID
#   CHROME_CLIENT_SECRET   - Chrome Web Store API client secret
#   CHROME_REFRESH_TOKEN   - Chrome Web Store API refresh token
#   CHROME_PUBLISHER_ID    - Chrome Web Store publisher ID
#   CHROME_API_VERSION     - Chrome Web Store API version (e.g. "v2")
#
# Optional environment variables:
#   CWS_VERIFY_ATTEMPTS      - number of status polls (default 5)
#   CWS_VERIFY_DELAY_SECONDS - delay between polls in seconds (default 20)
#
# Exit codes:
#   0 - the store holds the expected version (a submission is registered or the
#       version is published) - the publish failure was benign
#   1 - the store does not hold the expected version - the failure is real
#   2 - the check itself failed (API/credential error or invalid poll settings)
#       - callers must fail

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

# Shared helpers for the `go-webext status` invocation, the API-failure
# pattern and the field parsing (also used by check-extension-status.sh).
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=tools/ci/cws-status-lib.sh
. "$SCRIPT_DIR/cws-status-lib.sh"

ITEM_ID="${1:-}"
EXPECTED_VERSION="${2:-}"
ATTEMPTS="${CWS_VERIFY_ATTEMPTS:-5}"
DELAY_SECONDS="${CWS_VERIFY_DELAY_SECONDS:-20}"

if [ -z "${ITEM_ID}" ] || [ -z "${EXPECTED_VERSION}" ]; then
    echo "❌ Usage: $0 <item-id> <expected-version>"
    exit 2
fi

# Guard the optional poll settings: a zero or non-numeric attempt count would
# skip polling and exit 1 ("real failure") without a single status check, and
# a non-numeric delay would abort `sleep` mid-retry, so both break the 0/1/2
# contract. Bad input must map to exit 2.
require_integer_at_least() {
    local name="${1}"
    local value="${2}"
    local minimum="${3}"

    case "${value}" in
        ''|*[!0-9]*)
            echo "❌ ${name} must be an integer >= ${minimum}, got '${value}'"
            exit 2
            ;;
    esac

    if [ "${value}" -lt "${minimum}" ]; then
        echo "❌ ${name} must be an integer >= ${minimum}, got '${value}'"
        exit 2
    fi
}

require_integer_at_least CWS_VERIFY_ATTEMPTS "${ATTEMPTS}" 1
require_integer_at_least CWS_VERIFY_DELAY_SECONDS "${DELAY_SECONDS}" 0

echo "Checking publish state for item ${ITEM_ID}, expected version ${EXPECTED_VERSION}"

# A submission registered by CWS proves the publish call landed: the check-cws
# job runs before the build in the same workflow and skips the whole publish
# when a submission is already pending, so a pending submission seen here was
# created by this run's publish call. Only PENDING_REVIEW and STAGED prove that
# (go-webext ItemState, internal/chrome/store_v2.go). Terminal states
# (PUBLISHED, PUBLISHED_TO_TESTERS, REJECTED, CANCELLED) can belong to an
# earlier submission cycle, and ITEM_STATE_UNSPECIFIED can be an upload that was
# never queued for review: those fall through to the published-version check.
is_tolerated() {
    local status_output="${1}"
    local submitted_state
    local published_version

    # Unanchored greps, matching check-extension-status.sh: both scripts must
    # agree on the `go-webext status` field format.
    submitted_state="$(cws_field "${status_output}" 'Submitted State:')"
    if [ "${submitted_state}" = "PENDING_REVIEW" ] || [ "${submitted_state}" = "STAGED" ]; then
        echo "✅ Submitted state is ${submitted_state}: the publish call landed"
        return 0
    fi

    published_version="$(cws_field "${status_output}" 'Published Version:')"
    if [ "${published_version}" = "${EXPECTED_VERSION}" ]; then
        echo "✅ Published version is ${published_version}: the publish call landed"
        return 0
    fi

    echo "⚠️ Published version: ${published_version:-unknown}, submitted state: ${submitted_state:-none}"
    return 1
}

attempt=1
while [ "${attempt}" -le "${ATTEMPTS}" ]; do
    echo "Status poll ${attempt}/${ATTEMPTS}"

    # A non-zero go-webext exit (expired refresh token, API outage) must map
    # to exit 2, not to "not tolerated" (see cws-status-lib.sh).
    cws_fetch_status "${ITEM_ID}"

    echo "${STATUS_OUTPUT}"

    if [ "${GO_WEBEXT_EXIT}" -ne 0 ]; then
        echo "❌ go-webext failed with exit status ${GO_WEBEXT_EXIT} (see output above)"
        exit 2
    fi

    # Match API-failure shapes only, anchored at the start of a line: item text
    # mentioning `error`, `unauthorized` or `rate limit` must not turn a benign
    # publish into a hard error.
    if echo "${STATUS_OUTPUT}" | grep -Eiq "${CWS_API_ERROR_REGEX}"; then
        echo "❌ go-webext reported an error (see output above)"
        exit 2
    fi

    # A successful go-webext run must carry at least one known state marker:
    # an empty or renamed payload means the store state is unknown, not that
    # the publish failed, so it must map to exit 2.
    if ! cws_has_state_markers "${STATUS_OUTPUT}" 'Submitted State:|Published Version:'; then
        echo "❌ go-webext output contains no recognized state markers (see output above)"
        exit 2
    fi

    if is_tolerated "${STATUS_OUTPUT}"; then
        exit 0
    fi

    if [ "${attempt}" -lt "${ATTEMPTS}" ]; then
        sleep "${DELAY_SECONDS}"
    fi
    attempt=$((attempt + 1))
done

echo "❌ The publish failure is real: the store does not hold version ${EXPECTED_VERSION}"
exit 1
