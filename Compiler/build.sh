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
    branch=release
    opts="--version=$version --branch=$branch --dest=$destPath"

    #chrome release zip for chrome.store
    options="$opts --browser=chrome --pack=zip --update-filters=false"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #opera release crx for addons.opera.com
    options="$opts --browser=chrome --pack=zip --name=opera"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox release xpi for AMO (WebExt)
    options="$opts --browser=firefox_webext --pack=xpi --extensionId=adguardadblocker@adguard.com --update-filters=false --remote-scripts=false"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}
    
    #firefox beta xpi for AMO (WebExt)
    options="$opts --browser=firefox_webext --pack=xpi --extensionId=adguardadblocker@adguard.com --remote-scripts=false --name=firefox-amo-beta"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox release xpi (WebExt)
    options="$opts --browser=firefox_webext --pack=xpi --extensionId=adguardadblocker@adguard.com"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox release xpi (Legacy)
    options="$opts --browser=firefox --pack=xpi --extensionId=adguardadblocker@adguard.com"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #safari release for extensions.apple.com
    options="$opts --browser=safari --extensionId=com.adguard.safari --update-filters=false"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}
    
    #edge
    options="$opts --browser=edge --pack=zip"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    echo "Release builds created"

elif [ "$env" = beta ]; then

    echo "Creating beta builds..."

    destPath=../../Build/Beta
    branch=beta
    opts="--version=$version --branch=$branch --dest=$destPath"

    #chrome beta zip
    options="$opts --browser=chrome --pack=zip"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #opera beta zip
    options="$opts --browser=chrome --pack=zip --name=opera"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox beta xpi for AMO (WebExt)
    options="$opts --browser=firefox_webext --pack=xpi --extensionId=adguardadblockerbeta@adguard.com --remote-scripts=false"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox beta xpi (WebExt)
    options="$opts --browser=firefox_webext --pack=xpi --extensionId=adguardadblockerbeta@adguard.com --update-url=https://adguardteam.github.io/AdguardBrowserExtension/Releases/firefox_updates.rdf"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox beta xpi (Legacy)
    options="$opts --browser=firefox --pack=xpi --extensionId=adguardadblockerlegacy@adguard.com --update-url=https://adguardteam.github.io/AdguardBrowserExtension/Releases/firefox_updates.rdf"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #safari beta
    options="$opts --browser=safari  --extensionId=com.adguard.safaribeta --update-url=https://adguardteam.github.io/AdguardBrowserExtension/Releases/safari_updates.xml"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}
    
    #edge beta zip
    options="$opts --browser=edge --pack=zip"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    echo "Beta builds created"

else

    echo "Creating dev builds..."

    destPath=../../Build/Dev
    branch=dev
    opts="--version=$version --branch=$branch --dest=$destPath"

    #chrome
    options="$opts --browser=chrome"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #opera
    options="$opts --browser=chrome --name=opera"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox for AMO (WebExt)
    options="$opts --browser=firefox_webext --extensionId=adguardadblockerdev@adguard.com --remote-scripts=false"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox (WebExt)
    options="$opts --browser=firefox_webext --extensionId=adguardadblockerdev@adguard.com"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox (Legacy)
    options="$opts --browser=firefox --extensionId=adguardadblockerdev@adguard.com"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #safari
    options="$opts --browser=safari --extensionId=com.adguard.safaridev"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #edge
    options="$opts --browser=edge"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    # chrome api
    options="$opts --browser=chrome  --name=chrome-api --create-api=true"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    echo "Dev builds created"

fi
