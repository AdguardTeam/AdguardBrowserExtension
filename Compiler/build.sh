#!/bin/bash

version="2.6.0"

if [[ ! ("$#" == 1) ]] || [[ ! ($1 = dev) && ! ($1 = release) && ! ($1 = beta) ]] ; then
    echo "Pass a single argument as an environment value"
    exit 2
fi
env=$1

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
    options="--version=$version --dest=$destPath --name=chrome-release --browser=chrome --pack=zip --update-filters=false"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #opera release crx for addons.opera.com
    options="--version=$version --dest=$destPath --name=opera-release --browser=chrome --pack=crx"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox release xpi for AMO (WebExt)
    options="--version=$version --dest=$destPath --name=firefox-amo-release --browser=firefox_webext --pack=xpi --extensionId=adguardadblocker@adguard.com --update-filters=false"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}
    
    #firefox beta xpi for AMO (WebExt)
    options="--version=$version --dest=$destPath --name=firefox-amo-beta --browser=firefox --pack=xpi --extensionId=adguardadblocker@adguard.com"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #safari release for extensions.apple.com
    options="--version=$version --dest=$destPath --name=safari-release --browser=safari  --extensionId=com.adguard.safari --update-url=https://chrome.adtidy.org/safari/updates.xml --update-filters=false"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}
    
    #edge
    options="--version=$version --dest=$destPath --name=edge-release --browser=edge --pack=zip"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    echo "Release builds created"

elif [ "$env" = beta ]; then

    echo "Creating beta builds..."

    destPath=../../Build/Beta
    branch=beta

    #chrome beta zip
    options="--version=$version --branch=$branch --dest=$destPath --name=chrome-beta --browser=chrome --pack=zip"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #opera beta zip
    options="--version=$version --branch=$branch --dest=$destPath --name=opera-beta --browser=chrome --pack=zip"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox beta standalone xpi (WebExt)
    options="--version=$version --branch=$branch --dest=$destPath --name=firefox-standalone-beta --browser=firefox_webext --pack=xpi --extensionId=adguardadblockerbeta@adguard.com --update-url=https://adguardteam.github.io/AdguardBrowserExtension/Releases/firefox_updates.rdf"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox beta AMO xpi (WebExt)
    options="--version=$version --branch=$branch --dest=$destPath --name=firefox-amo-beta --browser=firefox_webext --pack=xpi --extensionId=adguardadblockerbeta@adguard.com"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox beta legacy xpi
    options="--version=$version --branch=legacy --dest=$destPath --name=firefox-legacy-beta --browser=firefox --pack=xpi --extensionId=adguardadblockerlegacy@adguard.com --update-url=https://adguardteam.github.io/AdguardBrowserExtension/Releases/firefox_updates.rdf"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #safari beta
    options="--version=$version --branch=$branch --dest=$destPath --name=safari-beta --browser=safari  --extensionId=com.adguard.safaribeta --update-url=https://adguardteam.github.io/AdguardBrowserExtension/Releases/safari_updates.xml"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}
    
    #edge beta zip
    options="--version=$version --branch=$branch --dest=$destPath --name=edge-beta --browser=edge --pack=zip"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    echo "Beta builds created"

else

    echo "Creating dev builds..."

    destPath=../../Build/Dev
    branch=dev

    #chrome
    options="--version=$version --branch=$branch --dest=$destPath --name=chrome --browser=chrome"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #opera
    options="--version=$version --branch=$branch --dest=$destPath --name=opera --browser=chrome"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox standalone (WebExt)
    options="--version=$version --branch=$branch --dest=$destPath --name=firefox-standalone --browser=firefox_webext --extensionId=adguardadblockerdev@adguard.com"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox amo (WebExt)
    options="--version=$version --branch=$branch --dest=$destPath --name=firefox-amo --browser=firefox_webext --extensionId=adguardadblockerdev@adguard.com"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox legacy
    options="--version=$version --branch=$branch --dest=$destPath --name=firefox-legacy --browser=firefox --extensionId=adguardadblockerdev@adguard.com"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #safari
    options="--version=$version --branch=$branch --dest=$destPath --name=safari --browser=safari --extensionId=com.adguard.safaridev"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #edge
    options="--version=$version --branch=$branch --dest=$destPath --name=edge --browser=edge"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    # chrome api
    options="--version=$version --branch=$branch --dest=$destPath --name=chrome-api --browser=chrome --create-api=true"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    echo "Dev builds created"

fi
