#!/bin/sh

env=$1

mvn package;

cd deploy;

version="2.0.10"

if [ "$env" = release ]; then

    echo "Creating release builds..."

    #chrome release zip for chrome.store
    options="--version=$version --name=main --browser=chrome --pack=zip --update-filters=true"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #opera release crx for addons.opera.com
    options="--version=$version --name=opera --browser=chrome --pack=crx --local-script-rules=true"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox release xpi for amo
    options="--version=$version --name=firefox --browser=firefox --pack=xpi --local-script-rules=true"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #safari release for extensions.apple.com
    options="--version=$version --name=Adguard --browser=safari  --extension-id=com.adguard.safari --update-url=https://chrome.adtidy.org/safari/updates.xml"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    echo "Release builds created"

elif [ "$env" = beta ]; then

    echo "Creating beta builds..."

    #chrome beta zip
    options="--version=$version --name=main --browser=chrome --pack=zip --update-filters=true"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #chrome beta crx
    options="--version=$version --name=main --browser=chrome --pack=crx --update-url=https://chrome.adtidy.org/updates.xml"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox beta xpi
    options="--version=$version --name=main --browser=firefox --pack=xpi --update-url=https://chrome.adtidy.org/updates.rdf"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox beta legacy xpi
    options="--version=$version --name=legacy --browser=firefox_legacy --pack=xpi --update-url=https://chrome.adtidy.org/legacy.rdf"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #safari beta
    options="--version=$version --name=AdguardBeta --browser=safari  --extension-id=com.adguard.safaribeta --update-url=https://chrome.adtidy.org/safari/updates.xml"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    echo "Beta builds created"

else

    echo "Creating dev builds..."

    #chrome
    options="--version=$version --name=chrome --browser=chrome"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox
    options="--version=$version --name=firefox --browser=firefox"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox legacy
    options="--version=$version --name=firefox-legacy --browser=firefox_legacy"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #safari
    options="--version=$version --name=safari --browser=safari --extension-id=com.adguard.safari"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    echo "Dev builds created"

fi
