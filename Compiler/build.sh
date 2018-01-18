#!/bin/bash

version="2.8.4"

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
    options="$opts --browser=chrome --pack=zip --update-filters=true"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #opera release crx for addons.opera.com
    options="$opts --browser=opera --pack=crx --name=opera --update-filters=true"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox release for AMO (WebExt)
    options="$opts --browser=firefox_webext --pack=webext --extensionId=adguardadblocker@adguard.com --update-filters=true --remote-scripts=false"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}
    
    #safari release for extensions.apple.com
    options="$opts --browser=safari --pack=extz --extensionId=com.adguard.safari --update-filters=true"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}
    
    #edge release
    options="$opts --browser=edge --pack=zip --update-filters=true"
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

    #chrome beta crx
    options="$opts --browser=chrome --pack=crx --update-url=https://adguardteam.github.io/AdguardBrowserExtension/chrome_updates.xml"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox beta for AMO (WebExt)
    options="--version=${version}beta --branch=$branch --dest=$destPath --browser=firefox_webext --pack=webext --extensionId=adguardadblocker@adguard.com --remote-scripts=false"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox beta (WebExt)
    options="$opts --browser=firefox_webext --pack=webext --extensionId=adguardadblockerbeta@adguard.com --update-url=https://adguardteam.github.io/AdguardBrowserExtension/firefox_updates.rdf"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox beta (Legacy)
    options="$opts --browser=firefox --pack=xpi --extensionId=adguardadblockerlegacy@adguard.com --update-url=https://adguardteam.github.io/AdguardBrowserExtension/firefox_updates.rdf"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #safari beta
    options="$opts --browser=safari  --pack=extz --extensionId=com.adguard.safaribeta --update-url=https://adguardteam.github.io/AdguardBrowserExtension/safari_updates.xml"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #edge beta zip
    options="$opts --browser=edge --pack=zip"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    # chrome api zip
    options="$opts --browser=chrome --name=adguard --create-api=true --pack=zip"
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
    options="$opts --browser=chrome --name=adguard --create-api=true"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    echo "Dev builds created"

fi
