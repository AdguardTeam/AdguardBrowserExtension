#!/bin/bash -e
#
# Purpose: Pack a FF extension directory into zip format
# More info:
# https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Getting_started_with_web-ext

if test $# -ne 1; then
  echo "Usage: webextmake.sh <extension dir>"
  exit 1
fi

dir=$1

# web-ext build
cd "$dir/webextension"
web-ext build --artifacts-dir=../