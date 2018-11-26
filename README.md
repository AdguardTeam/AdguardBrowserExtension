# AdGuard Browser Extension [![Build Status](https://travis-ci.org/AdguardTeam/AdguardBrowserExtension.svg?branch=master)](https://travis-ci.org/AdguardTeam/AdguardBrowserExtension)
> ### Disclaimer
> * AdGuard Browser Extension is free. We believe that all free products should be open source, and AdGuard Browser Extension is not an exception. Its code can be found in this repository.
> * Privacy policy: https://adguard.com/privacy/browser-extension.html (Briefly: AdGuard sends only necessary, limited information, e.g. information required for filter updates).

AdGuard is a fast and lightweight ad blocking browser extension that effectively blocks all types of ads on all web pages. Unlike its standalone counterparts (AG for Windows, Mac), browser extension is completely free and open source.

To get more information and to download AdGuard Browser Extension, visit our website [https://adguard.com/](https://adguard.com/adguard-browser-extension/overview.html).

### How to report an issue?

GitHub can be used to report a bug or to submit a feature request. To do so, go to [this page](https://github.com/AdguardTeam/AdguardBrowserExtension/issues) and click the *New issue* button.

>**Note:** for the filter-related issues (missed ads, false positives etc.) use the [dedicated repository](https://github.com/AdguardTeam/AdguardFilters).

### Our plans

To see the 'big picture', to watch current progress and to get an idea of approximate dates for upcoming AdGuard Browser Extension releases, see this page: https://github.com/AdguardTeam/AdguardBrowserExtension/milestones

### Releases

* Latest release version: [2.10.11](https://github.com/AdguardTeam/AdguardBrowserExtension/releases/tag/v2.10.11)
* Latest beta version: [2.10.11](https://github.com/AdguardTeam/AdguardBrowserExtension/releases/tag/v2.10.11)

You can find all AdGuard Browser Extension releases here: https://github.com/AdguardTeam/AdguardBrowserExtension/releases

### How to become a beta tester?

You can get a beta version of AdGuard Browser Extension for any browser. All necessary information on this topic can be found in our [Knowledgebase article](https://kb.adguard.com/general/adguard-beta-testing-program#browser-extensions).

### How to build

#### Requirements

- [nodejs](https://nodejs.org/en/download/)
- [yarn](https://yarnpkg.com/en/docs/install/)

Install local dependencies by running:
```
  yarn install
```

#### Download localizations

To run the task of downloading the localization files, put the `oneskyapp.json` configuration file in the root directory.

The configuration file looks like:

    {
        "url": "url of localizations",
        "project_id": "some id",
        "secret_key": "some key",
        "api_key": "some api key"
    }

For security reasons, this file is ignored by .gitignore settings.

To download and append localizations run:
```
  yarn locales-download
```

To upload new phrases to oneskyapp you need the same file `oneskyapp.json` and file with phrases `./Extension/_locales/en/messages.json`. Then run:
```
  yarn locales-upload
```

#### Building the dev version

Run the following command:
```
  yarn dev
```

This will create a Build directory with unpacked extensions for all browsers:
```
  Build/chrome-$currentVersion
  Build/firefox-$currentVersion
  Build/opera-$currentVersion
```

#### Building the beta and release versions

Before building the release version, you should manually download necessary resources: filters and public suffix list.

```
  yarn resources
```

```
  yarn beta
  yarn release
```
You will need to put certificate.pem file to the Compiler directory. This build will create unpacked extensions and then pack them (crx for Chrome, xpi for Firefox).

### How to run tests
```
  yarn test
```
