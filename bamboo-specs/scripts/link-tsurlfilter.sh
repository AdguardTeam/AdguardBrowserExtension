# 'set' should be added to the beginning of each script to ensure that it runs with the correct options.
# Please do not move it to some common file, like `setup-tests.sh`, because sourcing A script from B script
# cannot change the options of B script.
#  -e: Exit immediately if any command exits with a non-zero status (i.e., if a command fails).
#  -x: Print each command to the terminal as it is executed, which is useful for debugging.
set -ex

# Fix mixed logs
exec 2>&1

ls -la

# Parse command line arguments
LINK_AGTREE=false
LINK_TSURLFILTER=false

while [ $# -gt 0 ]; do
    case $1 in
        --with-agtree)
            LINK_AGTREE=true
            shift
            ;;
        --with-tsurlfilter)
            LINK_TSURLFILTER=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Available options: --with-agtree, --with-tsurlfilter"
            exit 1
            ;;
    esac
done

# Configuration file for Bamboo Test plan
# Developers can modify these variables to control the build behavior

# TSUrlFilter repository reference (branch, commit, or tag)
# Set to empty string or comment out to skip tsurlfilter cloning
# Examples:
#   TSURLFILTER_REF="fix/AG-45315"     # branch
#   TSURLFILTER_REF="a1b2c3d4e5f6..."  # commit hash
#   TSURLFILTER_REF="v2.1.0"           # tag
#   TSURLFILTER_REF=""                 # skip cloning

TSURLFILTER_REF="release/browser-extension-v5.3"

# Repository URLs
# This should be set as a Bamboo project variable: tsurlfilterRepoUrl
TSURLFILTER_REPO="${bamboo_tsurlfilterRepoUrl}"

# Validate required variable is set
if [ -n "${TSURLFILTER_REF}" ] && [ -z "${TSURLFILTER_REPO}" ]; then
    echo "ERROR: bamboo_tsurlfilterRepoUrl is not set. Please configure it in Bamboo project variables."
    exit 1
fi

# Function to setup SSH for tsurlfilter cloning
setup_ssh() {
    mkdir -p ~/.ssh

    # Write Bamboo SSH private key from plan variable into container
    if [ -n "${bamboo_sshSecretKey}" ]; then
        printf "%b\n" "${bamboo_sshSecretKey}" > ~/.ssh/id_rsa
        chmod 600 ~/.ssh/id_rsa

        # Uncomment below if you want to print public key so it can be added as a deploy key in the repo
        # PUB_KEY="$(ssh-keygen -y -f ~/.ssh/id_rsa 2>/dev/null || true)"
        # if [ -n "$PUB_KEY" ]; then
        #     echo "DEPLOY_PUBLIC_KEY: $PUB_KEY"
        # fi
    fi

    # Preload known_hosts for Bitbucket Server (uses non-default SSH port 7999)
    ssh-keyscan -p 7999 -t rsa bit.int.agrd.dev >> ~/.ssh/known_hosts 2>/dev/null || true

    echo "SSH setup completed"
}

# Function to clone and process tsurlfilter repository
clone_tsurlfilter() {
    echo "Cloning tsurlfilter with ref: ${TSURLFILTER_REF}"

    git init
    git remote add origin ${TSURLFILTER_REPO}
    git fetch --depth=1 origin ${TSURLFILTER_REF}
    git checkout FETCH_HEAD
}

# Function to link and build tswebextension
link_tswebextension() {
    if [ -n "${TSURLFILTER_REF}" ]; then
        setup_ssh

        # Store original directory to return to later
        ORIGINAL_DIR=$(pwd)

        cd ..

        # Ensure idempotency: start from a clean folder
        rm -rf tsurlfilter || true

        mkdir -p tsurlfilter
        cd tsurlfilter

        clone_tsurlfilter

        (cd packages/tswebextension \
        && pnpm install \
        && npx lerna run build --scope=@adguard/tswebextension --include-dependencies)

        # Return to main project directory and link the built tswebextension package
        cd "${ORIGINAL_DIR}"

        echo "Linking tswebextension package to main project..."
        pnpm link ../tsurlfilter/packages/tswebextension

        # Optionally link additional packages based on command line flags
        if [ "$LINK_AGTREE" = true ]; then
            echo "Linking agtree package to main project..."
            pnpm link ../tsurlfilter/packages/agtree
        fi

        if [ "$LINK_TSURLFILTER" = true ]; then
            echo "Linking tsurlfilter package to main project..."
            pnpm link ../tsurlfilter/packages/tsurlfilter
        fi

        # CSS Tokenizer is a dependency of AGTree and TSUrlFilter
        # if any of them is linked, link CSS Tokenizer as well
        if [ "$LINK_AGTREE" = true ] || [ "$LINK_TSURLFILTER" = true ]; then
            pnpm link ../tsurlfilter/packages/css-tokenizer
        fi
    else
        echo "No TSURLFILTER_REF specified, skipping tsurlfilter clone"
    fi
}

link_tswebextension
