# 'set' should be added to the beginning of each script to ensure that it runs with the correct options.
# Please do not move it to some common file, like `setup-tests.sh`, because sourcing A script from B script
# cannot change the options of B script.
#  -e: Exit immediately if any command exits with a non-zero status (i.e., if a command fails).
#  -x: Print each command to the terminal as it is executed, which is useful for debugging.
set -ex

# Fix mixed logs
exec 2>&1

# This script is responsible for linking pre-built tsurlfilter packages.
# It assumes tsurlfilter has already been built by build-tsurlfilter.sh
# and is available at /tsurlfilter.
#
# This is a fast operation (~2-3 seconds) that only runs pnpm link commands.

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

# Path to pre-built tsurlfilter packages
# This should be set by the Dockerfile (copied from tsurlfilter-build stage)
TSURLFILTER_DIR="/tsurlfilter"

# Function to link pre-built packages
link_packages() {
    # Check if tsurlfilter directory exists and has content
    if [ ! -d "${TSURLFILTER_DIR}/packages" ]; then
        echo "No tsurlfilter packages found at ${TSURLFILTER_DIR}/packages"
        echo "Skipping linking (tsurlfilter was not built or TSURLFILTER_REF was empty)"
        exit 0
    fi

    echo "Linking tswebextension package to main project..."
    pnpm link ${TSURLFILTER_DIR}/packages/tswebextension

    # Optionally link additional packages based on command line flags
    if [ "$LINK_AGTREE" = true ]; then
        echo "Linking agtree package to main project..."
        pnpm link ${TSURLFILTER_DIR}/packages/agtree
    fi

    if [ "$LINK_TSURLFILTER" = true ]; then
        echo "Linking tsurlfilter package to main project..."
        pnpm link ${TSURLFILTER_DIR}/packages/tsurlfilter
    fi

    # CSS Tokenizer is a dependency of AGTree and TSUrlFilter
    # if any of them is linked, link CSS Tokenizer as well
    if [ "$LINK_AGTREE" = true ] || [ "$LINK_TSURLFILTER" = true ]; then
        echo "Linking css-tokenizer package to main project..."
        pnpm link ${TSURLFILTER_DIR}/packages/css-tokenizer
    fi

    echo "Package linking completed successfully"
}

link_packages
