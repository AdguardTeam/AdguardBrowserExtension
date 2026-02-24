#!/bin/bash

# This script checks if it's the right time for manual review.
# Cron is configured for Tuesday 00:30 in UTC+3 (local Bamboo time).
# However, `date` command on the build server returns UTC time.
# Tuesday 00:30 UTC+3 = Monday 21:30 UTC
# So we check for: Monday, hour 21 (in UTC)

# 'set' should be added to the beginning of each script to ensure that it runs with the correct options.
# Please do not move it to some common file, like `setup-tests.sh`, because sourcing A script from B script
# cannot change the options of B script.
#  -e: Exit immediately if any command exits with a non-zero status (i.e., if a command fails).
#  -x: Print each command to the terminal as it is executed, which is useful for debugging.
set -ex

# Day of week (1=Mon, 2=Tue ... 7=Sun) - date returns UTC
dayOfWeek=$(date +%u)
MONDAY_IDX=1

# Hour (00-23) - date returns UTC
hours=$(date +%H)

# Tuesday 00:30 UTC+3 = Monday 21:30 UTC
if [[ "$dayOfWeek" -eq "$MONDAY_IDX" && "$hours" = "21" ]]; then
  echo "OK: Monday 21:xx UTC (= Tuesday 00:xx UTC+3)"
  exit 0 # Returns success when manual review is needed
else
  echo "Skip"
  exit 1 # Returns failure when skip review should be used
fi
