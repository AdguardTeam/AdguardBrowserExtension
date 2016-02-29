#!/bin/bash -e
#
# Purpose: Pack a Firefox extension directory into xpi format

if test $# -ne 2; then
  echo "Usage: xpimake.sh <extension dir> <xpifile out name>"
  exit 1
fi

dir=$1
name=$(basename "$dir")
xpi="$name.xpi"

# xpi up the dir
(cd "$dir" && cfx xpi)
(cd "$dir" && unzip adguard-adblocker.xpi -d adguard-adblocker) || true
(cd "$dir" && cp install.rdf adguard-adblocker/)
echo "Copy install.rdf"
(cd "$dir" && rm -r adguard-adblocker/locale/)
echo "Remove xpi locale file"
(cd "$dir/adguard-adblocker" && zip -r adguard-adblocker.xpi *)
(cd "$dir" && mv adguard-adblocker/adguard-adblocker.xpi .)