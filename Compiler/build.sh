#!/bin/sh

env=$1

mvn package;

cd deploy;

if [ "$env" = release ]; then

    echo "Creating release builds..."

    #chrome release zip for chrome.store
    options="--version=2.0.0 --name=main --browser=chrome --pack=zip --update-filters=true --autoupdate=false"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #chrome release crx
    options="--version=2.0.0 --name=main --browser=chrome --pack=crx"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox release xpi for amo
    options="--version=2.0.0 --name=firefox --browser=firefox --pack=xpi  --local-script-rules=true --autoupdate=false"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox release xpi
    options="--version=2.0.0 --name=main --browser=firefox --pack=xpi"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox legacy release xpi
    options="--version=2.0.0 --name=legacy --browser=firefox_legacy --pack=xpi"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #safari release for extensions.apple.com
    options="--version=2.0.0 --name=Adguard --browser=safari"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    echo "Release builds created"

else

    echo "Creating dev builds..."

    #chrome
    options="--version=2.0.0 --name=chrome --browser=chrome"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #opera
    options="--version=2.0.0 --name=opera --browser=chrome --local-script-rules=true"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #safari
    options="--version=2.0.0 --name=safari --browser=safari"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox
    options="--version=2.0.0 --name=firefox --browser=firefox --local-script-rules=true"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    #firefox legacy
    options="--version=2.0.0 --name=firefox --browser=firefox_legacy --local-script-rules=true"
    java -classpath extension-compiler.jar com.adguard.compiler.Main ${options}

    echo "Dev builds created"

fi
