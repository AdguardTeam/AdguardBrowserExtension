#!/bin/bash

if [[ ! ("$#" == 1) ]] ; then
    echo "Pass a single argument as an version value"
    exit 2
fi
version=$1

cp ./resources/firefox_updates.rdf    ../Releases/
cp ./resources/safari_updates.xml     ../Releases/

mkdir ../Releases/$version
cp      ../Build/Beta/firefox-standalone-beta-$version.xpi   ../Releases/$version/
cp      ../Build/Beta/firefox-legacy-beta-$version.xpi       ../Releases/$version/
cp -rf  ../Build/Beta/safari-beta-$version.safariextension   ../Releases/$version/

sed -i '' -e "s/%VERSION%/${version}/g"                                     ../Releases/firefox_updates.rdf
sed -i '' -e "s/%STANDALONE_NAME%/firefox-standalone-beta-${version}.xpi/g" ../Releases/firefox_updates.rdf
sed -i '' -e "s/%LEGACY_NAME%/firefox-legacy-beta-${version}.xpi/g"         ../Releases/firefox_updates.rdf

sed -i '' -e "s/%VERSION%/${version}/g"                             ../Releases/safari_updates.xml
sed -i '' -e "s/%NAME%/safari-beta-${version}.safariextension/g"    ../Releases/safari_updates.xml
