&nbsp;
<p align="center">
  <img src="https://cdn.adguard.com/public/Adguard/Common/adguard_extension.svg" width="300px" alt="AdGuard Browser Extension" />
</p>
<h3 align="center">具有先进隐私保护功能的广告拦截器</h3>
<p align="center">
  AdGuard 是快速且轻量级的广告拦截浏览器扩展<br/>可以有效阻止所有类型的广告和跟踪器。
</p>


<p align="center">
    <a href="https://adguard.com/">AdGuard.com</a> |
    <a href="https://reddit.com/r/Adguard">Reddit</a> |
    <a href="https://twitter.com/AdGuard">Twitter</a> |
    <a href="https://t.me/adguard_en">Telegram</a>
    <br /><br />
    </a>
    <a href="https://github.com/AdguardTeam/AdguardBrowserExtension/releases">
        <img src="https://img.shields.io/github/release/AdguardTeam/AdguardBrowserExtension/all.svg" alt="Latest release" />
    </a>
</p>

<br />

<p align="center">
    <img src="https://cdn.adguard.com/public/Adguard/Common/adguard_extension_4_settings.png" width="800" />
</p>

<hr />

AdGuard 是一款快速且轻量级的广告拦截浏览器扩展程序，可有效拦截所有网页上的所有类型的广告和跟踪器。 我们专注于先进的隐私保护功能，不仅可以阻止已知的跟踪器，还可以防止网站构建您的影子配置文件。 与独立的同类产品（适用于 Windows、Mac 的 AG）不同，该浏览器扩展是完全免费且开源的。 您可以[在这里](https://adguard.com/compare.html) 了解更多差异。

> AdGuard 不会收集有关您的任何信息，也不参与任何可接受的广告计划。 我们唯一的收入来源是销售我们软件的高级版本，我们打算保持这种状态。

* [安装](#installation)
  * [Chrome 以及 Chromium内核浏览器](#installation-chrome)
  * [Firefox](#installation-firefox)
  * [Opera](#installation-opera)
  * [Microsoft Edge](#installation-edge)
* [构建](#contribution)
  * [翻译AdGuard](#contribution-translating)
  * [测试AdGuard](#contribution-testing)
  * [报告问题](#contribution-reporting)
  * [其他](#contribution-other)
* [开发](#dev)
  * [Requirements](#dev-requirements)
  * [如何构建](#dev-build)
  * [Linter](#dev-linter)
  * [更新本地化](#dev-localizations)
* [Minimum supported browser versions](#minimum-supported-browser-versions)

<a id="installation"></a>
## Installation

<a id="installation-chrome"></a>
### Chrome and Chromium-based browsers
You can get the latest available AdGuard Extension version from the [Chrome Web Store](https://agrd.io/extension_chrome)。

<a id="installation-firefox"></a>
### Firefox
You can get the latest version of AdGuard Extension from the [Mozilla Add-ons website](https://agrd.io/extension_firefox)。

<a id="installation-opera"></a>
### Opera
Opera is basically a Chromium browser, but it maintains its own add-ons store. You can get AdGuard Extension [from there](https://agrd.io/extension_opera)。

<a id="installation-edge"></a>
### Microsoft Edge
The latest stable version of AdGuard browser extension is available in [Microsoft Store](https://agrd.io/extension_edge)。

<a id="contribution"></a>
## Contribution

We are blessed to have a community that does not only love AdGuard, but also gives back. A lot of people volunteer in various ways to make other users' experience with AdGuard better, and you can join them!

We, on our part, can only be happy to reward the most active members of the community. So, what can you do?

<a id="contribution-translating"></a>
### Translating AdGuard

If you want to help with AdGuard translations, please learn more about translating our products here: https://kb.adguard.com/en/general/adguard-translations

<a id="contribution-testing"></a>
### Testing AdGuard

You can get a beta version of AdGuard Browser Extension for any browser. All necessary information on this topic can be found on a [dedicated page on our website](https://adguard.com/beta.html)。

<a id="contribution-reporting"></a>
### Reporting issues

GitHub can be used to report a bug or to submit a feature request. To do so, go to [this page](https://github.com/AdguardTeam/AdguardBrowserExtension/issues) and click the *新建议题* button.

>**Note:** for the filter-related issues (missed ads, false positives etc.) use the [dedicated repository](https://github.com/AdguardTeam/AdguardFilters)。

<a id="contribution-other"></a>
### Other options

Here is a [dedicated page](https://adguard.com/contribute.html) for those who are willing to contribute.

<a id="dev"></a>
## Development

> Since version 4.0, Adguard browser extension uses opensource [tsurlfilter](https://github.com/AdguardTeam/tsurlfilter) library for implementing content blocking rules.

<a id="dev-requirements"></a>
### Requirements

- [node.js LTS](https://nodejs.org/en/download/)
- NPM v8
- [yarn v1.22](https://yarnpkg.com/en/docs/install/)

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

This will create a build directory with unpacked extensions for all browsers:
```
  build/dev/chrome
  build/dev/edge
  build/dev/firefox-amo
  build/dev/firefox-standalone
  build/dev/opera
```

**Building the beta and release versions**

Before building the release version, you should manually download necessary resources: filters and public suffix list.

```
  yarn resources
```

```
  CREDENTIALS_PASSWORD=<password> yarn beta
  CREDENTIALS_PASSWORD=<password> yarn release
```
You will need to put certificate.pem and mozilla_credentials.json files to the `./private` directory. This build will create unpacked extensions and then pack them (crx for Chrome, xpi for Firefox).

**Building the sample extension with API**

Run the following command:
```
yarn adguard-api
```
This will create a build directory with unpacked sample extension for chromium browsers:

```
build/dev/adguard-api
```

<a id="dev-linter"></a>
### Linter
Despite our code may not currently comply with new style configuration,
please, setup `eslint` in your editor to follow up with it `.eslintrc`

<a id="dev-localizations"></a>
### Update localizations

To download and append localizations run:
```
  yarn locales:download
```

To upload new phrases to crowdin you need the file with phrases `./Extension/_locales/en/messages.json`. Then run:
```
  yarn locales:upload
```

To remove old messages from locale messages run:
```
  yarn locales:renew
```

To validate translations run:
```
  yarn locales:validate
```

To show locales info run:
```
  yarn locales:info
```

<a id="minimum-supported-browser-versions"></a>

## Minimum supported browser versions
| Browser                 	| Version 	 |
|-------------------------	|:---------:|
| Chromium Based Browsers 	|  79   	   |
| Firefox                 	|  78   	   |
| Opera                   	|  66   	   |
| Edge                    	|  79   	   |

