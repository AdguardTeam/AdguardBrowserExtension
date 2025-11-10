&nbsp;
<p align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://cdn.adguard.com/public/Adguard/Common/Logos/ext_logo_dark.svg" width="300px" alt="AdGuard Browser Extension" />
        <img src="https://cdn.adguard.com/public/Adguard/Common/Logos/ext_logo.svg" width="300px" alt="AdGuard Browser Extension"/>
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

AdGuard is a fast and lightweight ad blocking browser extension that effectively blocks all types of ads and trackers on all web pages. We focus on advanced privacy protection features to not just block known trackers, but prevent web sites from building your shadow profile. Unlike its standalone counterparts (AG for Windows, Mac), the browser extension is completely free and open source. You can learn more about [the difference](https://adguard.com/compare.html) here.

> AdGuard does not collect any information about you, and does not participate in any acceptable ads program. The only source of income we have is selling premium versions of our software, and we intend to keep it that way.

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
        - [Linking tsurlfilter on CI (Bamboo)](#dev-ci-link)
        - [Building the beta and release versions](#dev-beta-and-release)
        - [Special building instructions for Firefox reviewers](#dev-for-firefox-reviewers)
        - [Analyzing bundle size](#dev-bundle-size)
        - [Debug MV3 declarative rules](#dev-debug-mv3)
    - [Linter](#dev-linter)
    - [Update localizations](#dev-localizations)
    - [Bundle Size Monitoring](#dev-bundle-size-monitoring)
- [Permissions required](#permissions-required)
- [Auto-publish builds](#auto-publish-builds)
- [Versioning Schema](#versioning-schema)
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
translating our products here: <https://adguard.com/kb/miscellaneous/contribute/translate/program/>

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

Ensure that the following software is installed on your computer:

- [Node.js][nodejs]: v22 (you can install multiple versions using [nvm][nvm])
- [pnpm][pnpm]: v10
- [Git][git]

[git]: https://git-scm.com/
[nodejs]: https://nodejs.org/en/download
[nvm]: https://github.com/nvm-sh/nvm
[pnpm]: https://pnpm.io/installation

### <a name="dev-build"></a> How to build

#### <a name="dev-tests-and-build"></a> Tests and dev build

Install local dependencies by running:

```shell
pnpm install
```

Running unit tests:

```shell
pnpm test
```

Running integration tests:

```shell
pnpm test:integration <TARGET>
# TARGET can be 'dev', 'beta', 'release', same as build targets.
```

Running integration tests with userscripts mode selection:

```shell
pnpm test:integration <TARGET> [-u <USERSCRIPTS_MODE>]
# TARGET can be 'dev', 'beta', 'release', same as build targets.
# USERSCRIPTS_MODE can be 'enabled' or 'disabled' (default: both modes)
```

Running integration tests with enabling debug mode (page will be stopped after
tests execution) for one of them:

```shell
pnpm test:integration <TARGET> [-d <TEST_ID>] [-u <USERSCRIPTS_MODE>]
# TARGET can be 'dev', 'beta', 'release', same as build targets.
# TEST_ID can be extracted from https://testcases.agrd.dev/data.json
# USERSCRIPTS_MODE can be 'enabled' or 'disabled' (default: both modes)
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

Where `<browser>` is one of the following: `chrome`, `chrome-mv3`, `edge`, `opera`, `firefox-amo`,
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
[tsurlfilter] that implements
the filtering engine.

While developing the browser extension it may be required to test the changes
to `tsurlfilter`. Here's what you need to do to link your local dev build
to the local dev build of `tsurlfilter`.

1. Clone and build [tsurlfilter] libraries.

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
    pnpm dev <browser> --watch --no-cache
    ```

    `--no-cache` flag is required to rebuild the extension on changes in the linked packages.

[tsurlfilter]: https://github.com/AdguardTeam/tsurlfilter

#### <a name="dev-ci-link"></a> Linking tsurlfilter on CI (Bamboo)

For CI builds, you can link with a specific tsurlfilter commit, branch, or tag using the automated linking script.

To enable tsurlfilter linking on CI:

1. **Edit the configuration in `bamboo-specs/scripts/link-tsurlfilter.sh`:**

   ```bash
   # Set TSURLFILTER_REF to the desired reference
   # TSURLFILTER_REF="fix/AG-45315"     # branch name
   # TSURLFILTER_REF="a1b2c3d4e5f6..."  # commit hash
   # TSURLFILTER_REF="v2.1.0"           # tag name
   # TSURLFILTER_REF=""                 # skip linking (default)
   ```

2. **The script will automatically:**
   - Clone the specified tsurlfilter reference
   - Build the tswebextension package
   - Link it to the browser extension project
   - Clean up the tsurlfilter directory after the build

The linking script is integrated into all CI jobs (tests, linting, builds) and only activates when `TSURLFILTER_REF` is set to a non-empty value.

> [!NOTE]
> The CI linking is designed to be idempotent and automatically handles SSH setup and cleanup.

#### <a name="dev-beta-and-release"></a> Building the beta and release versions

Before building the release version, you should manually download the necessary
resources that will be included into the build: filters and public suffix list.

```shell
pnpm resources
```

> [!TIP]
> Run `pnpm resources:mv3` to download resources for MV3 version.

#### Resources Process

The `pnpm resources` command performs the following steps:

1. **Downloads filters**: Fetches filter metadata and filter rules from the AdGuard filters repository
2. **Updates local script rules**: Extract script rules inside separate file only for firefox.
3. **Finds dangerous rules** (optional): If `OPENAI_API_KEY` environment variable is provided, uses OpenAI API to analyze and identify potentially dangerous rules in the filters

For MV3 version (`pnpm resources:mv3`), the process includes additional steps:

1. **Updates dnr-rulesets package**: Installs the latest `@adguard/dnr-rulesets` package
2. **Updates local test script rules**: Fetches all script rules from test cases and updates local resources
3. **Downloads and prepares MV3 filters**: Downloads filters and converts them to declarative format
4. **Updates local resources for MV3**: Processes and updates local script resources for Chromium MV3
5. **Finds dangerous rules** (optional): If `OPENAI_API_KEY` environment variable is provided, uses OpenAI API to analyze and identify potentially dangerous rules in the filters
6. **Extracts unsafe rules**: Runs a separate command to identify and extract unsafe rules to ruleset metadata

See [dangerous rules documentation](tools/resources/dangerous-rules/README.md) for more details about the dangerous rules detection process.

```shell
pnpm beta
pnpm release
```

You will need to put certificate.pem file to the `./private/AdguardBrowserExtension` directory. This
build will create unpacked extensions and then pack them (crx for Chrome).

For testing purposes for `dev` command credentials taken from `./tests/certificate-test.pem` file.

WARNING: DO NOT USE TEST CREDENTIALS FOR PRODUCTION BUILDS, BECAUSE THEY ARE AVAILABLE IN PUBLIC.

##### How to generate credentials for `crx` builds

You can use [Crx CLI `keygen`](https://github.com/thom4parisot/crx#crx-keygen-directory)
to generate credentials for `crx` builds, see the example below:

```bash
# Command will generate `key.pem` credential in the `./private/AdguardBrowserExtension` directory
pnpm crx keygen ./private/AdguardBrowserExtension
```

#### <a name="dev-for-firefox-reviewers"></a> Special building instructions for Firefox reviewers

1. To ensure that the extension is built in the same way, use the docker image:

    ```shell
    docker run --rm -it \
        -v "$(pwd)":/workspace \
        -w /workspace \
        adguard/extension-builder:22.17--0.2.1--0 \
        /bin/bash
    ```

1. Inside the docker container, install the dependencies:

    ```shell
    pnpm install
    ```

1. To build the **BETA** version, run:

    ```shell
    pnpm beta firefox-standalone
    ```

1. Navigate to the build directory:

    ```shell
    cd ./build/beta
    ```

1. Compare the generated `firefox-standalone.zip` file with the uploaded one.

If you need to build the **RELEASE** version:

1. Run:

    ```shell
    pnpm release firefox-amo
    ```

1. Navigate to the build directory:

    ```shell
    cd ./build/release
    ```

1. Compare the generated `firefox-amo.zip` file with the uploaded one.

#### <a name="dev-bundle-size"></a> Analyzing bundle size

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

#### <a name="dev-debug-mv3"></a> Debug MV3 declarative rules

If you want to debug MV3 declarative rules and check exactly which rules have been applied to requests, you can build and install the extension as described in the sections below. This will allow you to view the applied declarative rules in the filtering log.

Additionally, you can edit filters and rebuild DNR rulesets without rebuilding the entire extension, which may be useful for debugging purposes.

##### <a name="dev-debug-mv3-how-to-build"></a>  How to build the MV3 extension

1. Ensure that you have installed all dependencies as described in the [Requirements](#dev-requirements) section.

    ```shell
    pnpm install
    ```

1. Run the following command in the terminal:

    ```shell
    pnpm dev chrome-mv3
    ```

1. The built extension will be located in the following directory:

    ```shell
    ./build/dev/chrome-mv3
    ```

##### How to install the unpacked extension in the browser

1. Turn on developer mode:

    ![Developer mode](https://cdn.adtidy.org/content/Kb/ad_blocker/browser_extension/developer_mode.png)

1. Click *Load unpacked*:

    ![Load unpacked](https://cdn.adtidy.org/content/Kb/ad_blocker/browser_extension/load_unpacked.png)

1. Select the extension directory and click `Select`:

    ![Select](https://cdn.adtidy.org/content/Kb/ad_blocker/browser_extension/select.png)

##### How to debug rules

You can debug and update DNR rulesets without rebuilding the entire extension. There are two main workflows:

**A. Automatic (recommended for most cases):**

1. **Build the extension** (if not done yet):
    ```shell
    pnpm install
    pnpm dev chrome-mv3
    ```

1. **Start watching for filter changes:**
    ```shell
    pnpm debug-filters:watch
    ```
    - This will extract text filters to `./build/dev/chrome-mv3/filters` and watch for changes.
    - When you edit and save any filter file, DNR rulesets will be rebuilt automatically.

1. **Reload the extension in your browser** to apply new rulesets.

**B. Manual (for advanced/manual control):**

1. **Build the extension** (if not done yet):
    ```shell
    pnpm install
    pnpm dev chrome-mv3
    ```

1. **Extract text filters:**
    ```shell
    pnpm debug-filters:extract
    ```

1. **Edit the text filters** in `./build/dev/chrome-mv3/filters` as needed.

1. **Convert filters to DNR rulesets:**
    ```shell
    pnpm debug-filters:convert
    ```

1. **Reload the extension in your browser** to apply new rulesets.

**Tip:**
- To download the latest available text filters, run:
    ```shell
    pnpm debug-filters:load
    ```

If you see an exclamation mark in the filtering log, it means the assumed rule (calculated by the engine) and the applied rule (converted to DNR) are different. Otherwise, only the applied rule (in DNR and text ways) will be shown.

##### <a name="dev-technical-info-about-debug-commands"></a> Technical information about commands

- **Watch for changes and auto-convert:**
    ```shell
    pnpm debug-filters:watch
    # Under the hood:
    pnpm exec dnr-rulesets watch \
        # Enable extended logging about rulesets, since it is optional - it can be removed
        --debug \
        # Path to the extension manifest
        ./build/dev/chrome-mv3/manifest.json \
        # Path to web-accessible-resources directory (needed for $redirect rules)
        # relative to the root directory of the extension (because they will be
        # loaded during runtime).
        /web-accessible-resources/redirects
    ```
- **Load latest text filters and metadata:**
    ```shell
    pnpm debug-filters:load
    # Under the hood:
    pnpm exec dnr-rulesets load
        # This will load latest text filters with their metadata
        --latest-filters
        # Destination path for text filters
        ./build/dev/chrome-mv3/filters
    ```
- **Manual conversion:**
    ```shell
    pnpm debug-filters:convert
    # Under the hood:
    pnpm exec tsurlfilter convert \
        # Enable extended logging about rulesets
        --debug \
        # Path to the directory with text filters
        ./build/dev/chrome-mv3/filters \
        # Path to web-accessible-resources directory (needed for $redirect rules)
        # relative to the root directory of the extension (because they will be
        # loaded during runtime).
        /web-accessible-resources/redirects \
        # Destination path for converted DNR rulesets
        ./build/dev/chrome-mv3/filters/declarative
    ```
- **Extract text filters from DNR rulesets:**
    ```shell
    pnpm debug-filters:extract
    # Under the hood:
    pnpm exec tsurlfilter extract-filters \
        # Path to the directory with DNR rulesets
        ./build/dev/chrome-mv3/filters/declarative \
        # Path to save extracted text filters
        ./build/dev/chrome-mv3/filters
    ```

For all command options, use `--help`, e.g.:
```shell
pnpm exec dnr-rulesets watch --help
pnpm exec tsurlfilter convert --help
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

### <a name="dev-bundle-size-monitoring"></a> Bundle Size Monitoring

The browser extension project includes a comprehensive bundle size monitoring system, located in `tools/bundle-size`. This system helps ensure that our extension bundles remain within defined size limits, and that any significant increases are reviewed and justified.

#### Key Features

- Tracks and compares bundle sizes across different build types (`beta`, `release`, etc.) and browser targets (`chrome`, `chrome-mv3`, `edge`, etc.)
- Detects significant size increases using configurable thresholds (default: 10%)
- Ensures Chrome MV3 bundle stays under the 30MB limit
- Checks for duplicate package versions using `pnpm`
- Stores historical size data in `.bundle-sizes.json`
- Designed for CI/CD integration (Bamboo)
- **For Firefox targets (AMO and Standalone) only**, every individual `.js` file is checked to ensure it does not exceed the 4MB limit imposed by the Firefox Add-ons Store. If any `.js` file is larger than 4MB, the check fails and the offending files are reported.

#### How it works

- On each beta or release build, the system compares the current bundle sizes to the reference values in `.bundle-sizes.json`.
- If any size exceeds the configured threshold, or additionally check for 30MB limit for Chrome MV3 target or 4MB limit for Firefox targets - the check fails.
- Duplicate package versions are detected and reported.

#### To update the bundle sizes manually

We have defined size limits in the project.

1. When we build the `beta` or `release` version, the build process checks if we’re exceeding those limits.
2. If we exceed the limits, the developer should investigate the cause and decide whether the size increase is acceptable.
3. If the new sizes are justified, the developer updates the size values in the package and creates a commit.
4. We then review and approve any changes to the sizes as part of the PR process.

##### Steps

1. Run the build for the desired environment (e.g., `pnpm beta` or `pnpm release`).
2. If the build fails due to bundle size limits, investigate the cause (e.g., new dependencies, large assets).
3. If the increase is justified, update the reference sizes by running:

    ```shell
    pnpm update-bundle-size <buildEnv> [targetBrowser]
    # Example: pnpm update-bundle-size release chrome-mv3
    # Or: pnpm update-bundle-size beta firefox-amo
    # Or: pnpm update-bundle-size dev
    ```

4. Commit the updated `.bundle-sizes.json` file and include justification in your PR.
5. The changes will be reviewed and approved as part of the PR process.

#### Checking bundle size locally

To check bundle sizes locally, use:

```shell
pnpm check-bundle-size <buildEnv> [targetBrowser]
# Example: pnpm check-bundle-size release chrome-mv3
# Or: pnpm check-bundle-size beta firefox-amo
# Or: pnpm check-bundle-size dev
```

For CLI help on parameters, use:

```shell
pnpm check-bundle-size --help
pnpm update-bundle-size --help
```

#### Usage: Custom Threshold

You can override the default threshold for significant bundle size increases using the `--threshold` option:

```sh
pnpm check-bundle-size <buildEnv> [targetBrowser] --threshold 5
# or
pnpm check-bundle-size release chrome-mv3 --threshold=20
# or
pnpm check-bundle-size beta
```

- `--threshold <number>`: Sets the allowed percentage increase in bundle size before the check fails. Default: 10%.

This is useful for temporarily relaxing or tightening the allowed size delta for a specific check/build.

## <a name="permissions-required"></a> Permissions required

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
- `userScripts`                   - this permission is required to let the user subscribe to custom filter lists and evaluate rules from these lists

## <a name="auto-publish-builds"></a> Auto-publish builds

Due to the transition from MV2 to MV3, we cannot update our filters remotely. To keep the filters as fresh as possible, we have configured automated tasks in our CI plans. These tasks will build a new version of the extension with only the updated `@adguard/dnr-rulesets` package, which contains new static rulesets.

### Auto-update cycle

We have set up an automated update cycle that regularly syncs with fresh releases from the [`@adguard/dnr-rulesets`](https://www.npmjs.com/package/@adguard/dnr-rulesets) npm package. The update frequency is configured in our [CI build schedule](../bamboo-specs/auto-build.yaml). This ensures our extension stays up-to-date with the latest filter rules.

To deploy new releases as soon as possible, we have implemented all the steps outlined in Chrome's [Skip Review documentation](https://developer.chrome.com/docs/webstore/skip-review). This allows us to publish updates to the Chrome Web Store without waiting for the full review cycle.

### Skip review restrictions

However, there is an important restriction when using the "skip review" option: **we cannot update the extension with skip review if it contains changes to filtering script rules**. This is because all script rules are collected during build time into a file called `local_script_rules.js` (for safe use them with the scripting API).

Therefore, any updates that include changes to script rules will require the full review cycle in the Chrome Web Store as usual.

### Build process

These automated tasks will run all necessary checks: unit tests, translation checks, and linter. After that, they will update resources, including filters and local script rules, create a build, and run integration tests to ensure the update is safe.

Finally, the new version of the extension will be published to the Chrome Web Store.

## <a name="versioning-schema"></a> Versioning Schema

The extension uses the following versioning schema:

```
major.minor.patch+autoBuildIncrementVersion.buildTag.dnrRulesetsVersion
```

- **major.minor.patch**: Standard semantic versioning for the extension codebase.
- **autoBuildIncrementVersion**: An incrementing number used as the fourth part of the manifest version (e.g., `88` in `5.2.1.88`).
- **buildTag**: A delimiter indicating the build's readiness.
- **dnrRulesetsVersion**: The patch version of the DNR rulesets, which includes the build date for those rulesets.

Example: `5.2.1+88.beta.20251014`

But for build versions we will use following format: `major.minor.patch.autoBuildIncrementVersion` to comply with the browser requirements for version.

## <a name="browser-compatibility"></a> Minimum supported browser versions

<!-- NOTE: see MIN_SUPPORTED_VERSION in ./constants.ts -->

| Browser                     | Version |
|---------------------------- |---------|
| Chromium-based browsers MV2 | ✅ 106  |
| Chromium-based browsers MV3 | ✅ 121  |
| Firefox                     | ✅ 78   |
| Firefox Mobile              | ✅ 113  |
| Opera                       | ✅ 67   |
| Edge Chromium               | ✅ 80   |
| Edge Legacy                 | ❌      |
