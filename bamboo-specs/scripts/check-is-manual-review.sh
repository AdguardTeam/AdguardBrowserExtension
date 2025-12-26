#!/bin/bash

# This script checks if it's Tuesday at 0:30 UTC (the night between Monday and Tuesday).
# This allows collecting all changes made during Monday (first working day after weekend):
# The cron runs at:
# - Monday 0:30, 12:30 → script returns false (skip review)
# - Tuesday 0:30 → script returns true ✓ (collects Monday's changes and send for
# manual review)
# - Tuesday 12:30 → script returns false (skip review)
# And so on for the rest of the week

# 'set' should be added to the beginning of each script to ensure that it runs with the correct options.
# Please do not move it to some common file, like `setup-tests.sh`, because sourcing A script from B script
# cannot change the options of B script.
#  -e: Exit immediately if any command exits with a non-zero status (i.e., if a command fails).
#  -x: Print each command to the terminal as it is executed, which is useful for debugging.
set -ex

# Day of week in UTC (1=Mon, 2=Tue ... 7=Sun)
dayOfWeek=$(date -u +%u)
TUESDAY_IDX=2

# Time in minutes since start of day (UTC)
minutes=$((10#$(date -u +%H) * 60 + 10#$(date -u +%M)))

# Range 0:00–1:00 UTC (covers the 0:30 cron run)
start=$((0 * 60 + 0))
end=$((1 * 60 + 0))

if [[ "$dayOfWeek" -eq "$TUESDAY_IDX" && "$minutes" -ge "$start" && "$minutes" -lt "$end" ]]; then
  echo "OK: Tuesday and between 0:00–1:00 UTC"
  exit 0 # Returns success when manual review is needed
else
  echo "Skip"
  exit 1 # Returns failure when skip review should be used
fi
