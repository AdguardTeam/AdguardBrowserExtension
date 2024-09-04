&nbsp;
<p align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://cdn.adguard.com/public/Adguard/Common/Logos/ext_dark.svg" width="300px" alt="AdGuard Browser Extension" />
        <img src="https://cdn.adguard.com/public/Adguard/Common/Logos/ext.svg" width="300px" alt="AdGuard Browser Extension"/>
    </picture>
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
    </a>
    <a href="https://github.com/AdguardTeam/AdguardBrowserExtension/releases">
        <img src="https://img.shields.io/github/release/AdguardTeam/AdguardBrowserExtension/all.svg" alt="Latest release" />
    </a>
    <a href="https://addons.mozilla.org/en-US/firefox/addon/adguard-adblocker/">
        <img src="https://img.shields.io/amo/v/adguard-adblocker?labelColor=orange" alt="Mozilla Add-on Version" />
    </a>
</p>

<br />

<p align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://cdn.adguard.com/public/Adguard/Common/adguard_extension_settings_dark.png" width="900px" alt="AdGuard Browser Extension" />
        <img src="https://cdn.adguard.com/public/Adguard/Common/adguard_extension_settings_white.png" width="900px" alt="AdGuard Browser Extension"/>
    </picture>
</p>

AdGuard is a fast and lightweight ad blocking browser extension that effectively blocks all types of ads and trackers on all web pages. We focus on advanced privacy protection features to not just block known trackers, but prevent web sites from building your shadow profile. Unlike its standalone counterparts (AG for Windows, Mac), the browser extension is completely free and open source. You can learn more about [the difference](https://adguard.com/compare.html) here.

> AdGuard does not collect any information about you, and does not participate in any acceptable ads program. The only source of income we have is selling premium versions of our software, and we intend to keep it that way.

- [Installation](#installation)
  - [Chrome and Chromium-based browsers](#chrome-and-chromium-based-browsers)
  - [Firefox](#firefox)
  - [Opera](#opera)
  - [Microsoft Edge](#microsoft-edge)
- [Contribution](#contribution)
  - [Translating AdGuard](#translating-adguard)
  - [Testing AdGuard](#testing-adguard)
  - [Reporting issues](#reporting-issues)
  - [Other options](#other-options)
- [Development](#development)
  - [Requirements](#requirements)
  - [How to build](#how-to-build)
    - [Tests and dev build](#tests-and-dev-build)
    - [Linking with the developer build of tsurlfilter/tswebextension](#linking-with-the-developer-build-of-tsurlfiltertswebextension)
    - [Building the beta and release versions](#building-the-beta-and-release-versions)
    - [Analyzing bundle size](#analyzing-bundle-size)
    - [Debug MV3 declarative rules](#debug-mv3-declarative-rules)
  - [Linter](#linter)
  - [Update localizations](#update-localizations)
- [Minimum supported browser versions](#minimum-supported-browser-versions)

<a id="installation"></a>

## Installation

<a id="installation-chrome"></a>

### Chrome and Chromium-based browsers

You can get the latest available AdGuard Extension version from the
[Chrome Web Store](https://agrd.io/extension_chrome).

<a id="installation-firefox"></a>

### Firefox

You can get the latest version of AdGuard Extension from the
[Mozilla Add-ons website](https://agrd.io/extension_firefox).

<a id="installation-opera"></a>

### Opera

Opera is basically a Chromium browser, but it maintains its own add-ons store.
You can get AdGuard Extension [from there](https://agrd.io/extension_opera).

<a id="installation-edge"></a>

### Microsoft Edge

The latest stable version of AdGuard browser extension is available in
[Microsoft Store](https://agrd.io/extension_edge).

<a id="contribution"></a>

## Contribution

We are blessed to have a community that does not only love AdGuard, but also
gives back. A lot of people volunteer in various ways to make other users'
experience with AdGuard better, and you can join them!

We, on our part, can only be happy to reward the most active members of the
community. So, what can you do?

<a id="contribution-translating"></a>

### Translating AdGuard

If you want to help with AdGuard translations, please learn more about
translating our products here: <https://kb.adguard.com/en/general/adguard-translations>

<a id="contribution-testing"></a>

### Testing AdGuard

You can get a beta version of AdGuard Browser Extension for any browser.
All necessary information on this topic can be found on a
[dedicated page on our website](https://adguard.com/beta.html).

<a id="contribution-reporting"></a>

### Reporting issues

GitHub can be used to report a bug or to submit a feature request. To do so, go
to [this page](https://github.com/AdguardTeam/AdguardBrowserExtension/issues)
and click the *New issue* button.

> [!NOTE]
> For the filter-related issues (missed ads, false positives etc.) use
> the [dedicated repository](https://github.com/AdguardTeam/AdguardFilters).

<a id="contribution-other"></a>

### Other options

Here is a [dedicated page](https://adguard.com/contribute.html) for those who
are willing to contribute.

<a id="dev"></a>

## Development

<a id="dev-requirements"></a>

### Requirements

- [node.js LTS](https://nodejs.org/en/download/)
- NPM v8
- [yarn v1.22](https://yarnpkg.com/en/docs/install/)


<a id="dev-build"></a>

### How to build

#### Tests and dev build

Install local dependencies by running:

```shell
  yarn install
```

Running tests:

```shell
  yarn test
```

Run the following command to build the dev version:

```shell
  yarn dev
```

This will create a build directory with unpacked extensions for all browsers:

```shell
  build/dev/chrome
  build/dev/edge
  build/dev/firefox-amo
  build/dev/firefox-standalone
  build/dev/opera
```

To make a dev build for a specific browser, run:

```shell
  yarn dev <browser>
```

Where `<browser>` is one of the following: `chrome`, `edge`, `opera`, `firefox`,
`firefox-standalone`, like this:

```shell
  yarn dev chrome
```

To run dev build in watch mode, run:

```shell
  yarn dev --watch
```

Or for a specific browser:

```shell
  yarn dev <browser> --watch
```

#### Linking with the developer build of tsurlfilter/tswebextension

Since version v4.0, AdGuard browser extension uses an open source library
[tsurlfilter][tsurlfilter] that implements
the filtering engine.

While developing the browser extension it may be required to test the changes
to `tsurlfilter`. Here's what you need to do to link your local dev build
to the local dev build of `tsurlfilter`.

1. Clone and build [tsurlfilter][tsurlfilter] libraries.
1. Go to the `tsurlfilter/packages/tsurlfilter` and
`tsurlfilter/packages/tswebextension` directories and run `yarn link`.

1. Now you can link these packages to the browser extension. To do that run
`yarn link` commands in the root directory of the browser extension root
directory:

  ```shell
  yarn link @adguard/tsurlfilter
  yarn link @adguard/tswebextension
  ```

1. Build the browser extension in the watch mode:

  ```shell
  yarn dev <browser> --watch --no-cache
  ```

`--no-cache` flag is required to rebuild the extension on changes in the linked packages.

[tsurlfilter]: https://github.com/AdguardTeam/tsurlfilter

#### Building the beta and release versions

Before building the release version, you should manually download the necessary
resources that will be included into the build: filters and public suffix list.

```shell
  yarn resources
```

> [!TIP]
> Run `yarn resources:mv3` to download resources for MV3 version.

This command also checks if there are dangerous rules in the filters.
See [dangerous rules](tools/resources/dangerous-rules/README.md)

```shell
  yarn beta
  yarn release
```

You will need to put certificate.pem file to the `./private` directory. This
build will create unpacked extensions and then pack them (crx for Chrome).

#### Analyzing bundle size

If you want to analyze the bundle size, run build with the `ANALYZE` environment:

```shell
  yarn cross-env ANALYZE=true yarn <build command>
```

So, for example, if you want to analyze the beta build for Chrome, run:

```shell
  yarn cross-env ANALYZE=true yarn beta chrome
```

Or if you want to analyze all beta builds, run:

```shell
  yarn cross-env ANALYZE=true yarn beta
```

Analyzer will generate reports to the `./build/analyze-reports` directory in the following format:

```shell
  build/analyze-reports
  ├── <browser-name>-<build-type>.html
```

#### Debug MV3 declarative rules

If you want to debug MV3 declarative rules and check exactly which rules has been applied for some requests, you can build extension in dev mode as described in the upper section ([how to build](#how-to-build)), but for specified branch, in which we develop MV3 version.

Then install extension via developer mode, make requests and see applied declarative rules in the filtering log.

##### How to build MV3 extension

1. Switch to the `v5.0` branch:

    ```bash
    git checkout v5.0
    ```

1. Run the following command in the terminal:

    ```bash
    yarn dev chrome-mv3
    ```

1. The built extension will be located in the directory:

    ```bash
    ./build/dev/chrome-mv3
    ```

##### How to install unpacked in the browser

1. Turn on developer mode:

    ![Developer mode](https://cdn.adtidy.org/content/Kb/ad_blocker/browser_extension/developer_mode.png)

1. Click *Load unpacked*:

    ![Load unacked](https://cdn.adtidy.org/content/Kb/ad_blocker/browser_extension/load_unpacked.png)

1. Select the extension directory and click `Select`:

    ![Select](https://cdn.adtidy.org/content/Kb/ad_blocker/browser_extension/select.png)

That’s it!

##### How to debug rules

1. Find and modify the rule you need in the `./Extension/filters/chromium-mv3` directory in the `.txt` files.

1. Convert the rules from txt to declarative form:

    ```bash
    yarn convert-declarative
    ```

1. Build the extension again:

    ```bash
    yarn dev chrome-mv3
    ```

1. Reload the extension in the browser:

    ![Reload extension](https://cdn.adtidy.org/content/Kb/ad_blocker/browser_extension/reload_extension.png)

1. If you see an ❗ mark - it means that assumed rule (which we calculated with our tsurlfilter engine, which performed applying rules in MV2) and actually applied rule (from which we converted to DNR rule) are not the same. And this can be a problem of conversion. <br/> Otherwise, if assumed and applied rules are the same - only applied rule (in text and declarative ways) will be shown.

<a id="dev-linter"></a>

### Linter

Despite our code may not currently comply with new style configuration,
please, setup `eslint` in your editor to follow up with it `.eslintrc`

<a id="dev-localizations"></a>

### Update localizations

To download and append localizations run:

```shell
    yarn locales download
```

To upload new phrases to crowdin you need the file with phrases
`./Extension/_locales/en/messages.json`. Then run:

```shell
    yarn locales upload
```

To remove old messages from locale messages run:

```shell
  yarn locales renew
```

To validate translations run:

```shell
  yarn locales validate
```

To show locales info run:

```bash
  yarn locales info
```

<a id="minimum-supported-browser-versions"></a>

## Permissions required
- `tabs`                          - this permission is required in order to get the URL of the options page tab
- `webRequest`                    - this permission is necessary to apply complicated rules (cosmetic for instance), detecting and removing tracking cookies, counting blocked resources.
- `cookies`                       - this permissions is required to delete cookies from requests or changing their lifetime.
- `contextMenus`                  - this permission is required in order to create a context menu
- `scripting`                     - this permission is required in order to inject assistant script only in the required pages
- `storage`                       - this permission is required in order to save user settings, user rules and custom filters
- `declarativeNetRequest`         - this permission is required in order to block, redirect and modify URL requests
- `declarativeNetRequestFeedback` - this permission is required in order to create a log of the blocked, redirected or modified URL requests
- `unlimitedStorage`              - this permission is required in order to save large filters
- `webNavigation`                 - this permission is required in order to catch the moment for injecting scriptlets

## Minimum supported browser versions

| Browser                  | Version  |
|------------------------- |:--------:|
| Chromium Based Browsers  |  118     |
| Firefox                  |  78      |
| Firefox Mobile           | 113      |
| Opera                    |  67      |
| Edge                     |  80      |
