#!/bin/bash

# 'set' should be added to the beginning of each script to ensure that it runs with the correct options.
# Please do not move it to some common file, like `setup-tests.sh`, because sourcing A script from B script
# cannot change the options of B script.
#  -e: Exit immediately if any command exits with a non-zero status (i.e., if a command fails).
#  -x: Print each command to the terminal as it is executed, which is useful for debugging.
set -ex

branch="${bamboo_planRepository_branchName}"

# Throw error if current branch is not "release/mv3-filters", because we do not
# deploy new releases not from release branch.
if [ $branch != "release/mv3-filters" ]; then
    echo "auto-build is not supported on branch ${branch}"
    exit 1;
fi