#!/bin/bash

# This script checks if it's Tuesday at 0:30 local time (the night between Monday and Tuesday).
# This allows collecting all changes made during Monday (first working day after weekend):
# Note: Bamboo cron runs in local timezone (UTC+3), not UTC.
# The cron runs at:
# - Monday 0:30, 12:30 local → script returns false (skip review)
# - Tuesday 0:30 local → script returns true ✓ (collects Monday's changes and send for
# manual review)
# - Tuesday 12:30 local → script returns false (skip review)
# And so on for the rest of the week

# 'set' should be added to the beginning of each script to ensure that it runs with the correct options.
# Please do not move it to some common file, like `setup-tests.sh`, because sourcing A script from B script
# cannot change the options of B script.
#  -e: Exit immediately if any command exits with a non-zero status (i.e., if a command fails).
#  -x: Print each command to the terminal as it is executed, which is useful for debugging.
set -ex

# Day of week in local time (1=Mon, 2=Tue ... 7=Sun)
dayOfWeek=$(date +%u)
TUESDAY_IDX=2

# Hour in local time (00-23)
hours=$(date +%H)

if [[ "$dayOfWeek" -eq "$TUESDAY_IDX" && "$hours" = "00" ]]; then
  echo "OK: Tuesday and hour is 0 (covers 0:30 cron run)"
  exit 0 # Returns success when manual review is needed
else
  echo "Skip"
  exit 1 # Returns failure when skip review should be used
fi
