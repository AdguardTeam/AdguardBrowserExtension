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

AdGuard is a fast and lightweight ad blocking browser extension that effectively blocks all types of ads
and trackers on all web pages. We focus on advanced privacy protection features to not just block known trackers,
but prevent web sites from building your shadow profile.
Unlike its standalone counterparts (AG for Windows, Mac), the browser extension is completely free and open source.
You can learn more about [the difference](https://adguard.com/compare.html) here.

> AdGuard does not collect any information about you, and does not participate in any acceptable ads program.
> The only source of income we have is selling premium versions of our software, and we intend to keep it that way.

- [Installation](#installation)
    - [Chrome and Chromium-based browsers](#installation-chrome)
    - [Firefox](#installation-firefox)
    - [Opera](#installation-opera)
    - [Microsoft Edge](#installation-edge)
- [Contribution](#contribution)
    - [Translating AdGuard](#contribution-translating)
    - [Testing AdGuard](#contribution-testing)
    - [Reporting issues](#contribution-reporting)
    - [Other options](#contribution-other)
- [Development](#dev)
    - [Requirements](#dev-requirements)
    - [How to build](#dev-build)
        - [Tests and dev build](#dev-tests-and-build)
        - [Linking with the developer build of tsurlfilter/tswebextension](#dev-link)
        - [Building the beta and release versions](#dev-beta-and-release)
        - [Special building instructions for Firefox reviewers](#dev-for-firefox-reviewers)
        - [Analyzing bundle size](#dev-bundle-size)
    - [Linter](#dev-linter)
    - [Update localizations](#dev-localizations)
- [Minimum supported browser versions](#browser-compatibility)

## <a name="installation"></a> Installation

### <a name="installation-chrome"></a> Chrome and Chromium-based browsers

You can get the latest available AdGuard Extension version from the
[Chrome Web Store](https://agrd.io/extension_chrome).

### <a name="installation-firefox"></a> Firefox

You can get the latest version of AdGuard Extension from the
[Mozilla Add-ons website](https://agrd.io/extension_firefox).

### <a name="installation-opera"></a> Opera

Opera is basically a Chromium browser, but it maintains its own add-ons store.
You can get AdGuard Extension [from there](https://agrd.io/extension_opera).

### <a name="installation-edge"></a> Microsoft Edge

The latest stable version of AdGuard browser extension is available in
[Microsoft Store](https://agrd.io/extension_edge).

## <a name="contribution"></a> Contribution

We are blessed to have a community that does not only love AdGuard, but also
gives back. A lot of people volunteer in various ways to make other users'
experience with AdGuard better, and you can join them!

We, on our part, can only be happy to reward the most active members of the
community. So, what can you do?

### <a name="contribution-translating"></a> Translating AdGuard

If you want to help with AdGuard translations, please learn more about
translating our products here: <https://kb.adguard.com/en/general/adguard-translations>

### <a name="contribution-testing"></a> Testing AdGuard

You can get a beta version of AdGuard Browser Extension for any browser.
All necessary information on this topic can be found on a
[dedicated page on our website](https://adguard.com/beta.html).

### <a name="contribution-reporting"></a> Reporting issues

GitHub can be used to report a bug or to submit a feature request. To do so, go
to [this page](https://github.com/AdguardTeam/AdguardBrowserExtension/issues)
and click the *New issue* button.

> [!NOTE]
> For the filter-related issues (missed ads, false positives etc.) use
> the [dedicated repository](https://github.com/AdguardTeam/AdguardFilters).

### <a name="contribution-other"></a> Other options

Here is a [dedicated page](https://adguard.com/contribute.html) for those who
are willing to contribute.

## <a name="dev"></a> Development

### <a name="dev-requirements"></a> Requirements

- [node.js LTS](https://nodejs.org/en/download/)
- [pnpm v8](https://pnpm.io/installation)

Install local dependencies by running:

```shell
pnpm install
```

### <a name="dev-build"></a> How to build

#### <a name="dev-tests-and-build"></a> Tests and dev build

Running tests:

```shell
pnpm test
```

Run the following command to build the dev version:

```shell
pnpm dev
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
pnpm dev <browser>
```

Where `<browser>` is one of the following: `chrome`, `edge`, `opera`, `firefox`,
`firefox-standalone`, like this:

```shell
pnpm dev chrome
```

To run dev build in watch mode, run:

```shell
pnpm dev --watch
```

Or for a specific browser:

```shell
pnpm dev <browser> --watch
```

#### <a name="dev-link"></a> Linking with the developer build of tsurlfilter/tswebextension

Since version v4.0, AdGuard browser extension uses an open source library
[tsurlfilter][tsurlfilter] that implements
the filtering engine.

While developing the browser extension it may be required to test the changes
to `tsurlfilter`. Here's what you need to do to link your local dev build
to the local dev build of `tsurlfilter`.

1. Clone and build [tsurlfilter][tsurlfilter] libraries.

1. You have two options to link the packages:

    - **Option 1**: Link the packages globally:

        1. Go to the `tsurlfilter/packages/tsurlfilter` or `tsurlfilter/packages/tswebextension` directory.

        1. Run the following command:

            ```shell
            pnpm link --global
            ```

            This command will create a symlink to the package in the global `node_modules` directory.

        1. Once you have the packages linked globally, you can link them to the browser extension.
        Just run the following command in the root directory of the browser extension:

            ```shell
            pnpm link @adguard/tsurlfilter
            ```

    - **Option 2**: Link the packages by path:

        1. Just run the following command in the root directory of the browser extension:

            ```shell
            pnpm link <path-to-tsurlfilter/packages/tsurlfilter>
            ```

1. If you want to unlink the packages, just run `pnpm unlink @adguard/tsurlfilter`
or `pnpm unlink @adguard/tswebextension` in the root directory of the browser extension
regardless of the linking option you chose.

    > [!WARNING]
    > pnpm will modify the lock file when linking packages. See <https://github.com/pnpm/pnpm/issues/4219>.

    > [!NOTE]
    > If you want to list linked packages, run `pnpm list --depth 0` in the root directory of the browser extension
    > which will show you all dependencies. Linked packages have a version like `link:../path/to/package`.

1. Build the browser extension in the watch mode:

    ```shell
    pnpm dev <browser> --watch
    ```

[tsurlfilter]: https://github.com/AdguardTeam/tsurlfilter

#### <a name="dev-beta-and-release"></a> Building the beta and release versions

Before building the release version, you should manually download the necessary
resources that will be included into the build: filters and public suffix list.

```shell
pnpm resources
```

This command also checks if there are dangerous rules in the filters.
See [dangerous rules](tools/resources/dangerous-rules/README.md)

```shell
pnpm beta
pnpm release
```

You will need to put certificate.pem file to the `./private` directory. This
build will create unpacked extensions and then pack them (crx for Chrome).

#### <a name="dev-for-firefox-reviewers"></a> Special building instructions for Firefox reviewers

1. Ensure you have installed Node.js and pnpm.

1. To build the **BETA** version, run:

    ```shell
    pnpm beta firefox-standalone
    ```

1. Navigate to the build directory:

    ```shell
    cd ./build/beta
    ```

1. Compare the generated `firefox.zip` file with the uploaded one.

#### <a name="dev-bundle-size"> Analyzing bundle size

If you want to analyze the bundle size, run build with the `ANALYZE` environment:

```shell
pnpm cross-env ANALYZE=true pnpm <build command>
```

So, for example, if you want to analyze the beta build for Chrome, run:

```shell
pnpm cross-env ANALYZE=true pnpm beta chrome
```

Or if you want to analyze all beta builds, run:

```shell
pnpm cross-env ANALYZE=true pnpm beta
```

Analyzer will generate reports to the `./build/analyze-reports` directory in the following format:

```shell
build/analyze-reports
├── <browser-name>-<build-type>.html
```

### <a name="dev-linter"></a> Linter

Despite our code may not currently comply with new style configuration,
please, setup `eslint` in your editor to follow up with it `.eslintrc`

### <a name="dev-localizations"></a> Update localizations

To download and append localizations run:

```shell
pnpm locales download
```

To upload new phrases to crowdin you need the file with phrases
`./Extension/_locales/en/messages.json`. Then run:

```shell
pnpm locales upload
```

To remove old messages from locale messages run:

```shell
pnpm locales renew
```

To validate translations run:

```shell
pnpm locales validate
```

To show locales info run:

```shell
pnpm locales info
```

## <a name="browser-compatibility"></a> Minimum supported browser versions

| Browser                     | Version |
|---------------------------- |:-------:|
| Chromium-based browsers MV2 | 79      |
| Chromium-based browsers MV3 | 121     |
| Firefox                     | 78      |
| Firefox Mobile              | 113     |
| Opera                       | 67      |
| Edge                        | 80      |
