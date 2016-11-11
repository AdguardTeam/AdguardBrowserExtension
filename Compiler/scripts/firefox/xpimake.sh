#!/bin/bash -e
#
# Purpose: Pack a Firefox extension directory into xpi format

if test $# -ne 2; then
  echo "Usage: xpimake.sh <extension dir> <xpifile out name>"
  exit 1
fi

dir=$1
xpiFile="$2.xpi"

# zip up the dir
(cd "$dir" && zip -r "$xpiFile" *)
(cd "$dir" && cp "$xpiFile" ../)