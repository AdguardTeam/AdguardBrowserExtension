#!/bin/bash

# Prepare beta or release artifacts from Docker output, relative to the current
# directory. Usage: bash tools/ci/stage-deploy-artifacts.sh <beta|release>

# 'set' should be added to the beginning of each script to ensure that it runs with the correct options.
# Please do not move it to some common file, like `setup-tests.sh`, because sourcing A script from B script
# cannot change the options of B script.
#  -e: Exit immediately if any command exits with a non-zero status (i.e., if a command fails).
#  -x: Print each command to the terminal as it is executed, which is useful for debugging.
set -ex
exec 2>&1

case "${1:-}" in
    beta|release) CHANNEL="$1" ;;
    *) echo 'Expected channel: beta or release'; exit 1 ;;
esac

mkdir -p staged/static-chrome staged/static-edge staged/cws-mv3 staged/gh-assets

# Static filenames are stable public download URLs. Keep them unchanged when
# internal packages are renamed, including chrome.crx referenced by update.xml.
cp output/build/artifacts/chrome-mv2.zip staged/static-chrome/chrome.zip
cp output/build/artifacts/chrome-mv3.zip output/build/artifacts/build.txt staged/static-chrome/
# Edge static publishing uses its own Deployer module and uploads only the Edge
# MV3 package, so it never overwrites the shared build.txt.
cp output/build/artifacts/edge-mv3.zip staged/static-edge/

# The shared deploy-to-chrome-web-store.yml runs go-webext with -f chrome.zip.
# This filename is the workflow's input contract, not a Chrome Web Store requirement.
cp output/build/artifacts/chrome-mv3.zip staged/cws-mv3/chrome.zip

cp output/build/artifacts/chrome-mv2.zip output/build/artifacts/chrome-mv3.zip \
   output/build/artifacts/edge-mv2.zip output/build/artifacts/edge-mv3.zip \
   output/build/artifacts/build.txt staged/gh-assets/

if [ "$CHANNEL" = beta ]; then
    cp output/crx/artifacts/chrome-mv2.crx staged/static-chrome/chrome.crx
    cp output/crx/artifacts/update.xml staged/static-chrome/
    cp output/crx/artifacts/chrome-mv2.crx staged/gh-assets/
else
    mkdir -p staged/static-firefox staged/amo staged/edge
    cp output/build/artifacts/firefox.zip output/build/artifacts/build.txt staged/static-firefox/
    # The shared Firefox and Edge deploy workflows require these filenames.
    # Preserve their contracts independently of internal and GitHub asset names.
    cp output/build/artifacts/firefox.zip output/build/artifacts/source.zip \
       output/build/artifacts/approval-notes.txt staged/amo/
    # The Edge Add-ons listing receives the Edge MV3 package; the Edge MV2
    # package ships only as a GitHub Release asset.
    cp output/build/artifacts/edge-mv3.zip staged/edge/edge.zip
    cp output/build/artifacts/opera-mv2.zip output/build/artifacts/opera-mv3.zip \
       output/build/artifacts/firefox.zip staged/gh-assets/
fi
