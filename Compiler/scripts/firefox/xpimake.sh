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
jpmXpiFile="$2.xpi"

# xpi up the dir
(cd "$dir" && jpm xpi)
(cd "$dir" && unzip *.xpi -d adguard-adblocker)
(cd "$dir" && cp install.rdf adguard-adblocker/)
echo "Copy install.rdf"
(cd "$dir/adguard-adblocker" && zip -r adguard-adblocker.xpi *)
(cd "$dir" && cp adguard-adblocker/adguard-adblocker.xpi .)