#!/bin/bash
# 'set' should be added to the beginning of each script to ensure that it runs with the correct options.
# Please do not move it to some common file, like `setup-tests.sh`, because sourcing A script from B script
# cannot change the options of B script.
#  -e: Exit immediately if any command exits with a non-zero status (i.e., if a command fails).
#  -x: Print each command to the terminal as it is executed, which is useful for debugging.
set -ex

# Fix mixed logs
exec 2>&1

# This script is responsible for cloning the tsurlfilter repository.
# It runs on CI (outside Docker) before docker build.
# The cloned source is then passed to Docker via named build context.
# Building happens inside Docker to leverage layer caching.
#
# Output: ../tsurlfilter directory (sibling to browser-extension)

# Configuration
# TSUrlFilter repository reference (branch, commit, or tag)
# Set to empty string or comment out to skip tsurlfilter cloning
# Examples:
#   TSURLFILTER_REF="fix/AG-45315"     # branch
#   TSURLFILTER_REF="a1b2c3d4e5f6..."  # commit hash
#   TSURLFILTER_REF="v2.1.0"           # tag
#   TSURLFILTER_REF=""                 # skip cloning

TSURLFILTER_REF=""

# Repository URL
# This should be set as a Bamboo project variable: tsurlfilterRepoUrl
TSURLFILTER_REPO="${bamboo_tsurlfilterRepoUrl}"

# Output directory (sibling to browser-extension, not inside it)
TSURLFILTER_DIR="../tsurlfilter"

# Function to setup SSH for tsurlfilter cloning
# Uses temp file with GIT_SSH_COMMAND (works outside Docker)
setup_ssh() {
    # Extract host and port from repo URL (format: ssh://git@host:port/path)
    REPO_HOST=$(echo "${TSURLFILTER_REPO}" | sed -n 's|.*@\([^:]*\):.*|\1|p')
    REPO_PORT=$(echo "${TSURLFILTER_REPO}" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')

    if [ -z "${bamboo_sshSecretKey}" ]; then
        echo "No SSH key provided, skipping SSH setup"
        return 0
    fi

    # Disable trace to avoid exposing SSH key in logs
    set +x

    SSH_KEY_FILE=$(mktemp)
    printf "%b\n" "${bamboo_sshSecretKey}" > "$SSH_KEY_FILE"
    chmod 600 "$SSH_KEY_FILE"
    export GIT_SSH_COMMAND="ssh -i $SSH_KEY_FILE -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

    # Re-enable trace
    set -x

    echo "SSH setup completed (using temp file with GIT_SSH_COMMAND)"
}

# Function to clone tsurlfilter repository
clone_tsurlfilter() {
    if [ -z "${TSURLFILTER_REF}" ]; then
        echo "No TSURLFILTER_REF specified, creating empty directory"
        # Clean up any existing tsurlfilter directory to ensure fresh state
        rm -rf "${TSURLFILTER_DIR}"
        mkdir -p "${TSURLFILTER_DIR}"
        exit 0
    fi

    if [ -z "${TSURLFILTER_REPO}" ]; then
        echo "ERROR: bamboo_tsurlfilterRepoUrl is not set. Please configure it in Bamboo project variables."
        exit 1
    fi

    setup_ssh

    # Always clone fresh (CI cleans workspace anyway)
    rm -rf "${TSURLFILTER_DIR}"
    mkdir -p "${TSURLFILTER_DIR}"
    cd "${TSURLFILTER_DIR}"

    echo "Cloning tsurlfilter with ref: ${TSURLFILTER_REF}"

    git init
    git remote add origin "${TSURLFILTER_REPO}"
    git fetch --depth=1 origin "${TSURLFILTER_REF}"
    git checkout FETCH_HEAD

    echo "tsurlfilter cloned successfully to ${TSURLFILTER_DIR}"
}

clone_tsurlfilter
