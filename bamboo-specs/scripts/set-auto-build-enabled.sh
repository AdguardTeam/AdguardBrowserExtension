#!/usr/bin/env bash
set -e

echo "enableAutoBuildsBeta=${bamboo_enableAutoBuildsBeta}"
echo "enableAutoBuildsRelease=${bamboo_enableAutoBuildsRelease}"

RESULT_FILE="artifacts/auto-build.properties"

mkdir -p artifacts

if [ "${bamboo_enableAutoBuildsBeta}" = "true" ] || [ "${bamboo_enableAutoBuildsRelease}" = "true" ]; then
  echo "One of flags is true, enabling autobuild"
  echo "autoBuildEnabled=true" > "${RESULT_FILE}"
else
  echo "Both flags are not true, disabling autobuild"
  echo "autoBuildEnabled=false" > "${RESULT_FILE}"
fi

echo "Written ${RESULT_FILE}:"
cat "${RESULT_FILE}"