&nbsp;
<p align="center">
  <img src="https://cdn.adguard.com/public/Adguard/Common/adguard_extension.svg" width="300px" alt="AdGuard Browser Extension" />
</p>
<h3 align="center">Ad blocker with advanced privacy protection features</h3>
<p align="center">
  AdGuard is a fast and lightweight ad blocking browser extension<br/>that effectively blocks all types of ads and trackers.
</p>


<p align="center">
    <a href="https://adguard.com/">AdGuard.com</a> |
    <a href="https://reddit.com/r/Adguard">Reddit</a> |
    <a href="https://twitter.com/AdGuard">Twitter</a> |
    <a href="https://t.me/adguard_en">Telegram</a>
    <br /><br />
    <a href="https://travis-ci.org/AdguardTeam/AdguardBrowserExtension">
      <img src="https://travis-ci.org/AdguardTeam/AdguardBrowserExtension.svg?branch=master" alt="Build status">
    </a>
    <a href="https://github.com/AdguardTeam/AdguardBrowserExtension/releases">
        <img src="https://img.shields.io/github/release/AdguardTeam/AdguardBrowserExtension/all.svg" alt="Latest release" />
    </a>
</p>

<br />

<p align="center">
    <img src="https://cdn.adguard.com/public/Adguard/Common/adguard_extension_settings.png" width="800" />
</p>

<hr />

AdGuard is a fast and lightweight ad blocking browser extension that effectively blocks all types of ads and trackers on all web pages. We focus on advanced privacy protection features to not just block known trackers, but prevent web sites from building your shadow profile. Unlike its standalone counterparts (AG for Windows, Mac), the browser extension is completely free and open source. You can learn more about [the difference](https://adguard.com/compare.html) here.

> AdGuard does not collect any information about you, and does not participate in any acceptable ads program. The only source of income we have is selling premium versions of our software, and we intend to keep it that way.

* [Installation](#installation)
  * [Chrome and Chromium-based browsers](#installation-chrome)
  * [Firefox](#installation-firefox)
  * [Opera](#installation-opera)
  * [Microsoft Edge](#installation-edge)
  * [Safari](#installation-safari)
* [Integration mode](#integration-mode)
* [Contribution](#contribution)
  * [Translating AdGuard](#contribution-translating)
  * [Testing AdGuard](#contribution-testing)
  * [Reporting issues](#contribution-reporting)
  * [Other options](#contribution-other)
* [Development](#dev)
  * [Requirements](#dev-requirements)
  * [How to build](#dev-build)
  * [Linter](#dev-linter)
  * [Update localizations](#dev-localizations)

<a id="installation"></a>
## Installation

<a id="installation-chrome"></a>
### Chrome and Chromium-based browsers
You can get the latest available AdGuard Extension version from the [Chrome Web Store](https://chrome.google.com/webstore/detail/bgnkhhnnamicmpeenaelnjfhikgbkllg).

<a id="installation-firefox"></a>
### Firefox
You can get the latest version of AdGuard Extension from the [Mozilla Add-ons website](https://adguard.com/en/download-extension/firefox.html).

> #### Legacy Firefox versions, Pale Moon
> Starting with the version 3.0 we no more support the legacy versions of Firefox. Here you can get the latest version that supports legacy firefox versions here: https://github.com/AdguardTeam/AdguardBrowserExtension/releases/tag/v.2.10.8 (look for "firefox-legacy" build).

<a id="installation-opera"></a>
### Opera
Opera is basically a Chromium browser, but it maintains its own add-ons store. You can get AdGuard Extension [from there](https://adguard.com/en/download-extension/opera.html).

<a id="installation-edge"></a>
### Microsoft Edge
The latest stable version of AdGuard browser extension is available in [Microsoft Store](https://adguard.com/en/download-extension/edge.html).

<a id="installation-safari"></a>
### Safari
Due to the major changes in Safari 12, we cannot maintain the same codebase anymore for the Safari extension. That's why we launched a new [AdGuard for Safari app](https://github.com/AdguardTeam/AdGuardForSafari).

> #### Legacy Safari version
> You can get the latest legacy Safari extension version in [Safari Extensions gallery](https://safari-extensions.apple.com/details/?id=com.adguard.safari-N33TQXN8C7). Please note, that Apple is going to completely disable support for legacy extensions in future Safari versions.

<a id="integration-mode"></a>
## Integration mode

The frequently asked question is "does it make sense to use the browser extension alongside AdGuard for Windows or Mac?" Interestingly enough, the answer is "yes, if you like the integration mode".

**Q: What is integration mode?** It is a special mode that the extension enters when being run along with a desktop AdGuard app (on Windows or macOS).

**Q: What happens in the integration mode?** In this mode, the extension stops filitering traffic (this function lies completely on the app). Its settings are also ignored, the app's settings are applied instead. The extension's color changes to blue and it serves as a replacement for AdGuard Assistant.

<a id="contribution"></a>
## Contribution

We are blessed to have a community that does not only love AdGuard, but also gives back. A lot of people volunteer in various ways to make other users' experience with AdGuard better, and you can join them!

We, on our part, can only be happy to reward the most active members of the community. So, what can you do?

<a id="contribution-translating"></a>
### Translating AdGuard

If you want to help with AdGuard translations, please learn more about translating our products here: https://kb.adguard.com/en/general/adguard-translations

<a id="contribution-testing"></a>
### Testing AdGuard

You can get a beta version of AdGuard Browser Extension for any browser. All necessary information on this topic can be found on a [dedicated page on our website](https://adguard.com/beta.html).

<a id="contribution-reporting"></a>
### Reporting issues

GitHub can be used to report a bug or to submit a feature request. To do so, go to [this page](https://github.com/AdguardTeam/AdguardBrowserExtension/issues) and click the *New issue* button.

>**Note:** for the filter-related issues (missed ads, false positives etc.) use the [dedicated repository](https://github.com/AdguardTeam/AdguardFilters).

<a id="contribution-other"></a>
### Other options

Here is a [dedicated page](https://adguard.com/contribute.html) for those who are willing to contribute.

<a id="dev"></a>
## Development

<a id="dev-requirements"></a>
### Requirements

- [nodejs](https://nodejs.org/en/download/)
- [yarn](https://yarnpkg.com/en/docs/install/)

Install local dependencies by running:
```
  yarn install
```

<a id="dev-build"></a>
### How to build

**How to run tests**
```
  yarn test
```

**Building the dev version**

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

**Building the beta and release versions**

Before building the release version, you should manually download necessary resources: filters and public suffix list.

```
  yarn resources
```

```
  yarn beta
  yarn release
```
You will need to put certificate.pem file to the Compiler directory. This build will create unpacked extensions and then pack them (crx for Chrome, xpi for Firefox).

<a id="dev-linter"></a>
### Linter
Despite our code my not currently comply with new style configuration,
please, setup `eslint` in your editor to follow up with it `.eslintrc`

<a id="dev-localizations"></a>
### Update localizations

To download and append localizations run:
```
  yarn locales-download
```

To upload new phrases to crowdin you need the file with phrases `./Extension/_locales/en/messages.json`. Then run:
```
  yarn locales-upload
```
