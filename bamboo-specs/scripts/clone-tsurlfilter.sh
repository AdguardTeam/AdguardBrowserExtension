#!/bin/bash
# 'set' should be added to the beginning of each script to ensure that it runs with the correct options.
# Please do not move it to some common file, like `setup-tests.sh`, because sourcing A script from B script
# cannot change the options of B script.
#  -e: Exit immediately if any command exits with a non-zero status (i.e., if a command fails).
#  -x: Print each command to the terminal as it is executed, which is useful for debugging.
set -ex

# Fix mixed logs
exec 2>&1

# Clones the tsurlfilter repository and produces a clean Docker build context
# containing only committed source files (no .git/ metadata).
#
# This is critical for Docker layer caching: Docker checksums every file in
# the --build-context to decide if cached layers are valid. A raw git clone
# includes .git/ (FETCH_HEAD, objects, index) which differs on every clone
# even for the same commit — busting the cache and forcing a full tsurlfilter
# rebuild (~3.5 min). By using `git archive`, we produce byte-identical output
# across clones of the same ref, so Docker cache hits and the build takes ~0s.
#
# Output: ../tsurlfilter directory (sibling to browser-extension, source only)

# Configuration
# TSUrlFilter repository reference (branch, commit, or tag)
# Set to empty string or comment out to skip tsurlfilter cloning
# Examples:
#   TSURLFILTER_REF="fix/AG-45315"     # branch
#   TSURLFILTER_REF="a1b2c3d4e5f6..."  # commit hash
#   TSURLFILTER_REF="v2.1.0"           # tag
#   TSURLFILTER_REF=""                 # skip cloning

TSURLFILTER_REF="fix/AG-50890"

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

# Function to clone tsurlfilter and produce clean source-only output
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

    # Resolve to absolute path before cd-ing into the temp clone directory
    ABS_TSURLFILTER_DIR="$(cd "$(dirname "${TSURLFILTER_DIR}")" && pwd)/$(basename "${TSURLFILTER_DIR}")"

    rm -rf "${ABS_TSURLFILTER_DIR}"

    CLONE_TMP=$(mktemp -d)
    trap 'rm -rf "$CLONE_TMP"' EXIT

    echo "Cloning tsurlfilter with ref: ${TSURLFILTER_REF}"

    git init "$CLONE_TMP"
    cd "$CLONE_TMP"
    git remote add origin "${TSURLFILTER_REPO}"
    git fetch --depth=1 origin "${TSURLFILTER_REF}"
    git checkout FETCH_HEAD

    mkdir -p "${ABS_TSURLFILTER_DIR}"
    git archive HEAD | tar -C "${ABS_TSURLFILTER_DIR}" -xf -

    if [ ! -d "${ABS_TSURLFILTER_DIR}/packages" ]; then
        echo "ERROR: git archive produced incomplete output (no packages/ directory)"
        ls -la "${ABS_TSURLFILTER_DIR}"
        exit 1
    fi

    echo "tsurlfilter cloned and prepared at ${ABS_TSURLFILTER_DIR} (source only, no .git)"
}

clone_tsurlfilter
