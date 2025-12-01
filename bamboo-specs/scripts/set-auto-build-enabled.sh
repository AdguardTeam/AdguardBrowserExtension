#!/usr/bin/env bash
set -e

echo "disableAutoBuildsBeta=${bamboo_disableAutoBuildsBeta}"
echo "disableAutoBuildsRelease=${bamboo_disableAutoBuildsRelease}"

RESULT_FILE="auto-build.properties"

if [ "${bamboo_disableAutoBuildsBeta}" = "true" ] && [ "${bamboo_disableAutoBuildsRelease}" = "true" ]; then
  echo "Both flags are true, disabling autobuild"
  echo "autoBuildEnabled=false" > "${RESULT_FILE}"
else
  echo "One of flags is not true, enabling autobuild"
  echo "autoBuildEnabled=true" > "${RESULT_FILE}"
fi

echo "Written ${RESULT_FILE}:"
cat "${RESULT_FILE}"