# AdGuard Browser Extension
[![Build Status](https://travis-ci.org/AdguardTeam/AdguardBrowserExtension.svg?branch=master)](https://travis-ci.org/AdguardTeam/AdguardBrowserExtension)

## What is AdGuard?

AdGuard is a fast and lightweight ad blocking extension that effectively blocks all types of ads on all web pages! Unlike it's standalone counterparts (AG for Windows, Mac), browser extension is completely free and open source.

## How to build

### Requirements

- [JDK 1.7+](http://www.oracle.com/technetwork/java/javaee/downloads/index.html)
- [Apache Maven 2+](http://maven.apache.org/download.cgi)
- Set JAVA_HOME and JDK_HOME environment variables

### Building the dev version

Run the following command in the Compiler directory:
```
  ./build.sh dev
```

This will create a Build directory with unpacked extensions for all browsers:
```
  Build/chrome-$currentVersion
  Build/firefox-$currentVersion
  Build/opera-$currentVersion
  Build/safari-$currentVersion.safariextension
```

### Building the beta and release versions
```
  ./build.sh beta
  ./build.sh release
```
You will need to put certificate.pem file to the Compiler directory. This build will create unpacked extensions and then pack them (crx for Chrome, xpi for Firefox).

## How to run tests
```
  cd tests 
  ./run.sh
```

## How to download a beta version of the extension?

All information related to Adguard beta testing is collected in this [blog article](https://blog.adguard.com/en/adguard-beta-test/). 

## Releases

You can find all Adguard browser extension releases here: https://github.com/AdguardTeam/AdguardBrowserExtension/releases