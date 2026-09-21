#!/bin/bash

# This script checks the status of a Chrome Web Store extension and determines
# whether an auto-build is allowed based on its publication and rollout status.
#
# Usage: ./check-extension-status.sh [channel]
#   channel: "release" (default) or "beta"
#
# Required environment variables (must be set by the caller):
#   CHROME_CLIENT_ID       - Chrome Web Store API client ID
#   CHROME_CLIENT_SECRET   - Chrome Web Store API client secret
#   CHROME_REFRESH_TOKEN   - Chrome Web Store API refresh token
#   CHROME_PUBLISHER_ID    - Chrome Web Store publisher ID
#   CHROME_API_VERSION     - Chrome Web Store API version (e.g., "v2")
#
# Exit codes:
#   0 - channel is published at 100% rollout, auto-build allowed
#   1 - channel genuinely unavailable (under review / not published) - soft skip
#   2 - the check itself failed (API/credential error, or unparseable go-webext
#       output) - callers must fail

# 'set' should be added to the beginning of each script to ensure that it runs with the correct options.
# Please do not move it to some common file, like `setup-tests.sh`, because sourcing A script from B script
# cannot change the options of B script.
#  -e: Exit immediately if any command exits with a non-zero status (i.e., if a command fails).
#  -x: Print each command to the terminal as it is executed, which is useful for debugging.
set -ex

# Shared helpers for the `go-webext status` invocation, the API-failure
# pattern and the field parsing (also used by check-publish-state.sh).
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/cws-status-lib.sh"

CHANNEL="${1:-release}"

# Determine extension ID based on channel. Callers may override the IDs via
# CWS_BETA_ITEM_ID / CWS_RELEASE_ITEM_ID (repo vars in auto-build.yml) so
# check-cws and the publish jobs always hit the same listing and can't drift
# after a CWS listing migration; the literals are the current defaults.
if [ "${CHANNEL}" = "release" ]; then
    EXTENSION_ID="${CWS_RELEASE_ITEM_ID:-bgnkhhnnamicmpeenaelnjfhikgbkllg}"
elif [ "${CHANNEL}" = "beta" ]; then
    EXTENSION_ID="${CWS_BETA_ITEM_ID:-apjcbfpjihpedihablmalmbbhjpklbdf}"
else
    echo "⚠️ Unknown channel: ${CHANNEL}"
    exit 1
fi

echo "Checking status for extension: ${EXTENSION_ID}"

# Get status from Chrome Web Store. A non-zero go-webext exit (expired refresh
# token, API outage) is the common hard-error path and must map to exit 2
# below, not to "unavailable" (see cws-status-lib.sh).
cws_fetch_status "${EXTENSION_ID}"

echo "${STATUS_OUTPUT}"

if [ "${GO_WEBEXT_EXIT}" -ne 0 ]; then
    echo "❌ go-webext failed with exit status ${GO_WEBEXT_EXIT} for the ${CHANNEL} channel (see output above)"
    exit 2
fi

# Distinguish a real API/credential failure from "channel not available".
# A clean status response only lists Published/Submitted/Rollout state; an
# error (bad tokens, throttling, API failure) shows up explicitly as go-webext
# output. Match API-failure shapes only, like check-publish-state.sh: a bare
# `error` anywhere in the status output (e.g. in item text) would turn a benign
# result into a hard failure. Exit 2 so callers can fail loudly instead of
# silently skipping the publish (exit 1 is reserved for "channel genuinely
# unavailable").
if echo "${STATUS_OUTPUT}" | grep -Eiq "${CWS_API_ERROR_REGEX}"; then
    echo "❌ go-webext reported an error for the ${CHANNEL} channel (see output above)"
    exit 2
fi

# A successful go-webext run must carry at least one known state marker: an
# unexpected payload (API error, throttling, format change) means the store
# state is unknown, not that the channel is unavailable, so it must map to
# exit 2 instead of being silently downgraded to "channel unavailable".
if ! cws_has_state_markers "${STATUS_OUTPUT}" 'Published State:|Submitted State:|Rollout:'; then
    echo "❌ go-webext output for the ${CHANNEL} channel contains no recognized state markers (see output above)"
    exit 2
fi

# Check that:
# 1. PublishedItemRevisionStatus exists and is PUBLISHED
# 2. No SubmittedItemRevisionStatus exists (nothing under review)
# 3. PublishedItemRevisionStatus is rolled out to 100% of users

# Check if Published State is PUBLISHED
if ! echo "${STATUS_OUTPUT}" | grep -q "Published State: PUBLISHED"; then
    PUBLISHED_STATE="$(cws_field "${STATUS_OUTPUT}" 'Published State:')"
    if [ -z "${PUBLISHED_STATE}" ]; then
        echo "⚠️ No published version found, auto-build NOT allowed"
    else
        echo "⚠️ Published state is ${PUBLISHED_STATE}, auto-build NOT allowed"
    fi
    echo "Auto-build is only allowed when published state is PUBLISHED"
    exit 1
fi

# Check submitted state (should be unset, CANCELLED, or PUBLISHED)
# Submitted state will be unset if no submission since last successful publish
if echo "${STATUS_OUTPUT}" | grep -q "Submitted State:"; then
    SUBMITTED_STATE="$(cws_field "${STATUS_OUTPUT}" 'Submitted State:')"
    if [ "${SUBMITTED_STATE}" != "CANCELLED" ] && [ "${SUBMITTED_STATE}" != "PUBLISHED" ]; then
        echo "⚠️ Extension is mostly under review with pending submission (${SUBMITTED_STATE}), auto-build NOT allowed"
        echo "Auto-build is only allowed when submitted state is unset, CANCELLED, or PUBLISHED"
        exit 1
    fi
    echo "✅ Submitted state is ${SUBMITTED_STATE} (acceptable)"
else
    echo "✅ No submitted state (no submission since last publish)"
fi

# Check if rollout is at 100%
if ! echo "${STATUS_OUTPUT}" | grep -q "Rollout: 100%"; then
    ROLLOUT="$(cws_field "${STATUS_OUTPUT}" 'Rollout:')"
    if [ -z "${ROLLOUT}" ]; then
        echo "⚠️ No rollout information found, auto-build NOT allowed"
    else
        echo "⚠️ Extension rollout is at ${ROLLOUT}, auto-build NOT allowed"
    fi
    echo "Auto-build is only allowed when rollout is at 100%"
    exit 1
fi

echo "✅ Extension is PUBLISHED at 100% rollout with no pending submissions, auto-build allowed for channel ${CHANNEL}"
exit 0
