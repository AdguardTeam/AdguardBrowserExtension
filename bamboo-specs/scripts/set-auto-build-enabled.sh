#!/usr/bin/env bash
set -e

echo "enableAutoBuildsBeta=${bamboo_enableAutoBuildsBeta}"
echo "enableAutoBuildsRelease=${bamboo_enableAutoBuildsRelease}"

RESULT_FILE="artifacts/auto-build.properties"

mkdir -p artifacts

if [ "${bamboo_enableAutoBuildsBeta}" = "true" ] || [ "${bamboo_enableAutoBuildsRelease}" = "true" ]; then
  echo "Both flags are true, disabling autobuild"
  echo "autoBuildEnabled=true" > "${RESULT_FILE}"
else
  echo "One of flags is not true, enabling autobuild"
  echo "autoBuildEnabled=false" > "${RESULT_FILE}"
fi

echo "Written ${RESULT_FILE}:"
cat "${RESULT_FILE}"