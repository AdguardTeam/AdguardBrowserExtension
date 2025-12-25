#!/bin/bash

# This script checks the status of a Chrome Web Store extension and determines
# whether an auto-build is allowed based on its publication and rollout status.

# 'set' should be added to the beginning of each script to ensure that it runs with the correct options.
# Please do not move it to some common file, like `setup-tests.sh`, because sourcing A script from B script
# cannot change the options of B script.
#  -e: Exit immediately if any command exits with a non-zero status (i.e., if a command fails).
#  -x: Print each command to the terminal as it is executed, which is useful for debugging.
set -ex

CHANNEL="${1:-release}"

# Determine extension ID based on channel
if [ "${CHANNEL}" = "release" ]; then
    EXTENSION_ID="bgnkhhnnamicmpeenaelnjfhikgbkllg"
elif [ "${CHANNEL}" = "beta" ]; then
    EXTENSION_ID="apjcbfpjihpedihablmalmbbhjpklbdf"
else
    echo "Unknown channel: ${CHANNEL}"
    exit 1
fi

echo "Checking status for extension: ${EXTENSION_ID}"

# Get status from Chrome Web Store
STATUS_OUTPUT=$(CHROME_CLIENT_ID="${bamboo_chromeWebStoreClientId}" \
    CHROME_CLIENT_SECRET="${bamboo_chromeWebStoreClientSecret}" \
    CHROME_REFRESH_TOKEN="${bamboo_chromeWebStoreSecretRefreshToken}" \
    CHROME_PUBLISHER_ID="${bamboo_chromeWebStorePublisherId}" \
    go-webext status chrome \
    -a "${EXTENSION_ID}" 2>&1)

echo "${STATUS_OUTPUT}"

# Check that:
# 1. PublishedItemRevisionStatus exists and is PUBLISHED
# 2. No SubmittedItemRevisionStatus exists (nothing under review)
# 3. PublishedItemRevisionStatus is rolled out to 100% of users

# Check if Published State is PUBLISHED
if ! echo "${STATUS_OUTPUT}" | grep -q "Published State: PUBLISHED"; then
    PUBLISHED_STATE=$(echo "${STATUS_OUTPUT}" | grep "Published State:" | awk '{print $3}')
    if [ -z "${PUBLISHED_STATE}" ]; then
        echo "⚠️ No published version found, auto-build NOT allowed"
    else
        echo "⚠️ Published state is ${PUBLISHED_STATE}, auto-build NOT allowed"
    fi
    echo "Auto-build is only allowed when published state is PUBLISHED"
    exit 1
fi

# Check if there's a submission under review
if echo "${STATUS_OUTPUT}" | grep -q "Submitted State:"; then
    SUBMITTED_STATE=$(echo "${STATUS_OUTPUT}" | grep "Submitted State:" | awk '{print $3}')
    echo "⚠️ Extension has a pending submission (${SUBMITTED_STATE}), auto-build NOT allowed"
    echo "Auto-build is only allowed when there are no pending submissions"
    exit 1
fi

# Check if rollout is at 100%
if ! echo "${STATUS_OUTPUT}" | grep -q "Rollout: 100%"; then
    ROLLOUT=$(echo "${STATUS_OUTPUT}" | grep "Rollout:" | awk '{print $2}')
    if [ -z "${ROLLOUT}" ]; then
        echo "⚠️ No rollout information found, auto-build NOT allowed"
    else
        echo "⚠️ Extension rollout is at ${ROLLOUT}, auto-build NOT allowed"
    fi
    echo "Auto-build is only allowed when rollout is at 100%"
    exit 1
fi

echo "✅ Extension is PUBLISHED at 100% rollout with no pending submissions, auto-build allowed"
exit 0
