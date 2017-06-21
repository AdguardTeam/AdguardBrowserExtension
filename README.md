# Adguard Browser Extension
[![Build Status](https://travis-ci.org/Mizzick/AdguardBrowserExtension.svg?branch=master)](https://travis-ci.org/Mizzick/AdguardBrowserExtension)

## How to build extension

### Requirements

- [JDK 1.7+](http://www.oracle.com/technetwork/java/javaee/downloads/index.html)
- [Apache Maven 2+](http://maven.apache.org/download.cgi)
- Set JAVA_HOME and JDK_HOME environment variables

### Building dev version

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

### Building beta and release versions
```
  ./build.sh beta
  ./build.sh release
```
You will need to put certificate.pem file to the Compiler directory. This build will create unpacked extensions and then pack them (crx for Chrome, xpi for Firefox).

## Tests
https://mizzick.github.io/AdguardBrowserExtension/Extension/tests/tests.html

## How to download a beta version of the extension?

All information related to Adguard beta testing is collected in this [blog article](https://blog.adguard.com/en/adguard-beta-test/). 

## Releases

You can find all Adguard browser extension releases here: https://github.com/AdguardTeam/AdguardBrowserExtension/releases
