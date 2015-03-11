#!/bin/bash -e
#
# Purpose: Pack a Chromium extension directory into zip format

if test $# -ne 1; then
  echo "Usage: zipmake.sh <extension dir>"
  exit 1
fi

dir=$1
name=$(basename "$dir")
zip="$name.zip"
trap 'rm -f "$zip"' EXIT

# zip up the crx dir
(cd "$dir" && zip -qr -9 -X "$dir/$zip" .)