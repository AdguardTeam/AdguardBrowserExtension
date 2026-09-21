#!/bin/bash

# Shared helpers for the Chrome Web Store status scripts
# (`check-extension-status.sh` and `check-publish-state.sh`). Not executable
# on its own: source it after the `set` options are applied, so both scripts
# cannot drift apart on the `go-webext status` invocation, the API-failure
# pattern, the state-marker check, or the status-field parsing.

# API-failure shapes only, anchored to the start of a line: a bare `error` or
# item text that merely mentions `unauthorized` or `rate limit` must not turn
# a benign result into a hard failure.
CWS_API_ERROR_REGEX='^(error|failed|unauthorized|forbidden|status code [45][0-9][0-9]|"code": ?[45][0-9][0-9]|rate ?limit)'

# Fetch `go-webext status` for an item id without aborting under `set -e`:
# a non-zero go-webext exit (expired refresh token, API outage) must map to
# the callers' exit-2 path instead of being read as "not tolerated" or
# "unavailable". One stalled call is bounded by `timeout` (overridable via
# CWS_STATUS_TIMEOUT_SECONDS, default 60), so it cannot consume the whole job
# timeout. Sets STATUS_OUTPUT and GO_WEBEXT_EXIT.
cws_fetch_status() {
    local item_id="${1}"

    set +e
    # `timeout` is GNU coreutils and absent on stock macOS: local test runs
    # fall back to the unbounded call, CI/Docker always bounds it.
    if command -v timeout >/dev/null 2>&1; then
        STATUS_OUTPUT="$(timeout "${CWS_STATUS_TIMEOUT_SECONDS:-60}" go-webext status chrome -a "${item_id}" 2>&1)"
    else
        STATUS_OUTPUT="$(go-webext status chrome -a "${item_id}" 2>&1)"
    fi
    GO_WEBEXT_EXIT=$?
    set -e
}

# Check that a successful response carries at least one of the given markers:
# a response without them is an unexpected payload (API error, throttling,
# format change), which callers must map to exit 2.
cws_has_state_markers() {
    local status_output="${1}"
    local markers="${2}"
    echo "${status_output}" | grep -Eq "${markers}"
}

# Print the value of a `go-webext status` field: the last word of the line
# carrying the label. `|| true` keeps errexit/pipefail from aborting on a
# missing line, so the callers' "no field found" diagnostics stay reachable.
cws_field() {
    local status_output="${1}"
    local label="${2}"
    echo "${status_output}" | grep "${label}" | awk '{print $NF}' || true
}
