#!/bin/bash

version="2.4.4"

if [[ ! ("$#" == 1) ]] || [[ ! ($1 = dev) && ! ($1 = release) && ! ($1 = beta) ]] ; then
    echo "Pass a single argument as an environment value"
    exit 2
fi
env=$1
if [ -z $(which jpm 2> /dev/null) ] || [ -z $(which cfx 2> /dev/null) ]; then
    echo "Release or beta bundle creation would fail, please install cfx and jpm utilities"
fi
mvn package
if [ -d deploy ]; then
    cd deploy
elif [ -e deploy ]; then
    echo "deploy target exists and it is not a directory"
    exit 2
else
    mkdir deploy
    cd deploy
fi

if [ "$env" = release ]; then

    echo "Creating release builds..."

    destPath=../../Build/Release

    #chrome release zip for chrome.store
    options="--version=$version --dest=$destPath --name=chromium --browser=chrome --pack=zip --update-filters=true"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #opera release crx for addons.opera.com
    options="--version=$version --dest=$destPath --name=opera --browser=chrome --pack=crx"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox release xpi for amo
    options="--version=$version --dest=$destPath --name=firefox-amo --browser=firefox --pack=xpi_jpm --extensionId=adguardadblocker@adguard.com"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}
    
    #firefox beta xpi for AMO
    options="--version=$version-beta --dest=$destPath --name=firefox-amo --browser=firefox --pack=xpi_jpm --extensionId=adguardadblocker@adguard.com"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #safari release for extensions.apple.com
    options="--version=$version --dest=$destPath --name=Adguard --browser=safari  --extensionId=com.adguard.safari --update-url=https://chrome.adtidy.org/safari/updates.xml"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}
    
    #edge
    options="--version=$version --branch=$branch --dest=$destPath --name=edge --browser=edge --pack=zip"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    echo "Release builds created"

elif [ "$env" = beta ]; then

    echo "Creating beta builds..."

    destPath=../../Build/Beta
    branch=beta

    #chrome beta zip
    options="--version=$version --branch=$branch --dest=$destPath --name=chromium-beta --browser=chrome --pack=zip --update-filters=false"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #chrome beta crx
    options="--version=$version --branch=$branch --dest=$destPath --name=chromium-beta --browser=chrome --pack=crx --update-url=https://chrome.adtidy.org/updates.xml"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox beta xpi
    options="--version=$version --branch=$branch --dest=$destPath --name=firefox-standalone --browser=firefox --pack=xpi_jpm --extensionId=adguardadblockerbeta@adguard.com --update-url=https://chrome.adtidy.org/updates.rdf"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox beta legacy xpi
    options="--version=$version --branch=legacy --dest=$destPath --name=legacy --browser=firefox_legacy --pack=xpi_cfx --extensionId=adguardadblockerlegacy@adguard.com --update-url=https://chrome.adtidy.org/updates.rdf"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #safari beta
    options="--version=$version --branch=$branch --dest=$destPath --name=AdguardBeta --browser=safari  --extensionId=com.adguard.safaribeta --update-url=https://chrome.adtidy.org/safari/updates.xml"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}
    
    #edge
    options="--version=$version --branch=$branch --dest=$destPath --name=edge --browser=edge --pack=zip"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    echo "Beta builds created"

else

    echo "Creating dev builds..."

    destPath=../../Build/Dev
    branch=dev

    #chrome
    options="--version=$version --branch=$branch --dest=$destPath --name=chrome --browser=chrome"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox
    options="--version=$version --branch=$branch --dest=$destPath --name=firefox --browser=firefox --extensionId=adguardadblockerdev@adguard.com"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox legacy
    options="--version=$version --branch=$branch-Legacy --dest=$destPath --name=firefox-legacy --browser=firefox_legacy --extensionId=adguardadblockerlegacydev@adguard.com"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #safari
    options="--version=$version --branch=$branch --dest=$destPath --name=AdguardDev --browser=safari --extensionId=com.adguard.safaridev"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}
    
    #edge
    options="--version=$version --branch=$branch --dest=$destPath --name=edge --browser=edge"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    echo "Dev builds created"

fi
