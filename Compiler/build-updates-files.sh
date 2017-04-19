#!/bin/bash

if [[ ! ("$#" == 1) ]] ; then
    echo "Pass a single argument as an version value (e.g. 2.6.0)"
    exit 2
fi
version=$1

cp ./resources/chrome_updates.xml     ../
cp ./resources/firefox_updates.rdf    ../
cp ./resources/safari_updates.xml     ../

sed -i '' -e "s/%VERSION%/${version}/g"                        ../chrome_updates.xml
sed -i '' -e "s/%NAME%/chrome-beta-${version}.crx/g"    ../chrome_updates.xml

sed -i '' -e "s/%VERSION%/${version}/g"                                     ../firefox_updates.rdf
sed -i '' -e "s/%STANDALONE_NAME%/firefox-standalone-beta-${version}.xpi/g" ../firefox_updates.rdf
sed -i '' -e "s/%LEGACY_NAME%/firefox-legacy-beta-${version}.xpi/g"         ../firefox_updates.rdf

sed -i '' -e "s/%VERSION%/${version}/g"                        ../safari_updates.xml
sed -i '' -e "s/%NAME%/safari-beta-${version}.safariextz/g"    ../safari_updates.xml

echo 'Done'
