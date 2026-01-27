# Development

- [Requirements](#dev-requirements)
- [How to build](#dev-build)
   - [Tests and dev build](#dev-tests-and-build)
   - [Linking with the developer build of tsurlfilter/tswebextension](#dev-link)
   - [Linking tsurlfilter on CI (Bamboo)](#dev-ci-link)
   - [Building the beta and release versions](#dev-beta-and-release)
   - [Special building instructions for Firefox reviewers](#dev-for-firefox-reviewers)
   - [Analyzing bundle size](#dev-bundle-size)
   - [Debug MV3 declarative rules](#dev-debug-mv3)
   - [Hotfix filters for MV3 with skip review](#dev-hotfix-mv3)
- [Linter](#dev-linter)
- [TypeScript Configuration](#dev-typescript-configs)
- [Update localizations](#dev-localizations)
- [Bundle Size Monitoring](#dev-bundle-size-monitoring)

### <a name="dev-requirements"></a> Requirements

Ensure that the following software is installed on your computer:

- [Node.js][nodejs]: v22 (you can install multiple versions using [nvm][nvm])
- [pnpm][pnpm]: v10
- [Git][git]

[git]: https://git-scm.com/
[nodejs]: https://nodejs.org/en/download
[nvm]: https://github.com/nvm-sh/nvm
[pnpm]: https://pnpm.io/installation

## <a name="dev-build"></a> How to build

### <a name="dev-tests-and-build"></a> Tests and dev build

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
build/dev/opera-mv3
```

To make a dev build for a specific browser, run:

```shell
pnpm dev <browser>
```

Where `<browser>` is one of the following: `chrome`, `chrome-mv3`, `edge`, `opera`, `opera-mv3`, `firefox-amo`,
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

### <a name="dev-link"></a> Linking with the developer build of tsurlfilter/tswebextension

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

### <a name="dev-ci-link"></a> Linking tsurlfilter on CI (Bamboo)

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

### <a name="dev-beta-and-release"></a> Building the beta and release versions

Before building the release version, you should manually download the necessary
resources that will be included into the build: filters and public suffix list.

```shell
pnpm resources
```

> [!TIP]
> Run `pnpm resources:mv3` to download resources for MV3 version.

### Resources Process

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

#### How to generate credentials for `crx` builds

You can use [Crx CLI `keygen`](https://github.com/thom4parisot/crx#crx-keygen-directory)
to generate credentials for `crx` builds, see the example below:

```bash
# Command will generate `key.pem` credential in the `./private/AdguardBrowserExtension` directory
pnpm crx keygen ./private/AdguardBrowserExtension
```

### <a name="dev-for-firefox-reviewers"></a> Special building instructions for Firefox reviewers

1. To ensure that the extension is built in the same way, use the docker image:

    ```shell
    docker run --rm -it \
        -v "$(pwd)":/workspace \
        -w /workspace \
        adguard/extension-builder:22.17--0.3.0--0 \
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

### <a name="dev-bundle-size"></a> Analyzing bundle size

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

### <a name="dev-debug-mv3"></a> Debug MV3 declarative rules

If you want to debug MV3 declarative rules and check exactly which rules have been applied to requests, you can build and install the extension as described in the sections below. This will allow you to view the applied declarative rules in the filtering log.

Additionally, you can edit filters and rebuild DNR rulesets without rebuilding the entire extension, which may be useful for debugging purposes.

#### <a name="dev-debug-mv3-how-to-build"></a>  How to build the MV3 extension

1. Ensure that you have installed all dependencies as described in the [Requirements](#dev-requirements) section.

    ```shell
    pnpm install
    ```

1. Run the following command in the terminal:

    ```shell
    pnpm dev chrome-mv3 # OR: opera-mv3
    ```

1. The built extension will be located in the following directory:

    ```shell
    ./build/dev/chrome-mv3 # OR: opera-mv3
    ```

#### How to install the unpacked extension in the browser

1. Turn on developer mode:

   ![Developer mode](https://cdn.adtidy.org/content/Kb/ad_blocker/browser_extension/developer_mode.png)

1. Click *Load unpacked*:

   ![Load unpacked](https://cdn.adtidy.org/content/Kb/ad_blocker/browser_extension/load_unpacked.png)

1. Select the extension directory and click `Select`:

   ![Select](https://cdn.adtidy.org/content/Kb/ad_blocker/browser_extension/select.png)

#### How to debug rules

You can debug and update DNR rulesets without rebuilding the entire extension. There are two main workflows:

**A. Automatic (recommended for most cases):**

1. **Build the extension** (if not done yet):

    ```shell
    pnpm install
    pnpm dev chrome-mv3 # OR: opera-mv3
    ```

1. **Start watching for filter changes:**

    ```shell
    pnpm debug-filters:watch
    ```

    - This command has `-b, --browser <browser>` option to specify the browser target.
      Available browsers: `chrome-mv3`, `opera-mv3`.
      Default: `chrome-mv3`.
    - This will extract text filters to `./build/dev/<browser>/filters` and watch for changes.
    - When you edit and save any filter file, DNR rulesets will be rebuilt automatically.

1. **Reload the extension in your browser** to apply new rulesets.

**B. Manual (for advanced/manual control):**

1. **Build the extension** (if not done yet):

    ```shell
    pnpm install
    pnpm dev chrome-mv3 # OR: opera-mv3
    ```

1. **Extract text filters:**

    ```shell
    pnpm debug-filters:extract
    ```

    - This command has `-b, --browser <browser>` option to specify the browser target.
      Available browsers: `chrome-mv3`, `opera-mv3`.
      Default: `chrome-mv3`.

1. **Edit the text filters** in `./build/dev/<browser>/filters` as needed.

1. **Convert filters to DNR rulesets:**

    ```shell
    pnpm debug-filters:convert
    ```

    - This command has `-b, --browser <browser>` option to specify the browser target.
      Available browsers: `chrome-mv3`, `opera-mv3`.
      Default: `chrome-mv3`.

1. **Reload the extension in your browser** to apply new rulesets.

> [!TIP]
> To download the latest available text filters, run:
>
> ```shell
> pnpm debug-filters:load
> ```
>
> - This command has `-b, --browser <browser>` option to specify the browser target.
>   Available browsers: `chrome-mv3`, `opera-mv3`.
>   Default: `chrome-mv3`.

If you see an exclamation mark in the filtering log, it means the assumed rule (calculated by the engine) and the applied rule (converted to DNR) are different. Otherwise, only the applied rule (in DNR and text ways) will be shown.

#### <a name="dev-technical-info-about-debug-commands"></a> Technical information about commands

- **Watch for changes and auto-convert:**

    ```shell
    pnpm debug-filters:watch
    # Under the hood:
    pnpm exec dnr-rulesets watch \
        # Enable extended logging about rulesets, since it is optional - it can be removed
        --debug \
        # Path to the extension manifest
        # Where <browser> is the browser target, can be 'chrome-mv3', 'opera-mv3'
        ./build/dev/<browser>/manifest.json \
        # Path to web-accessible-resources directory (needed for $redirect rules)
        # relative to the root directory of the extension (because they will be
        # loaded during runtime).
        /web-accessible-resources/redirects
    ```

- **Load latest text filters and metadata:**

    ```shell
    pnpm debug-filters:load
    # Under the hood:
    pnpm exec dnr-rulesets load \
        # This will load latest text filters with their metadata
        --latest-filters \
        # Browser target, can be 'chromium-mv3', 'opera-mv3'
        # Note: `chrome-mv3` is automatically converted to `chromium-mv3`
        # when you run `pnpm debug-filters:load chrome-mv3` command.
        --browser <browser> \
        # Destination path for text filters
        # Where <browser> is the browser target, can be 'chrome-mv3', 'opera-mv3'
        ./build/dev/<browser>/filters
    ```

- **Manual conversion:**

    ```shell
    pnpm debug-filters:convert
    # Under the hood:
    pnpm exec tsurlfilter convert \
        # Enable extended logging about rulesets
        --debug \
        # Path to the directory with text filters
        # Where <browser> is the browser target, can be 'chrome-mv3', 'opera-mv3'
        ./build/dev/<browser>/filters \
        # Path to web-accessible-resources directory (needed for $redirect rules)
        # relative to the root directory of the extension (because they will be
        # loaded during runtime).
        /web-accessible-resources/redirects \
        # Destination path for converted DNR rulesets
        # Where <browser> is the browser target, can be 'chrome-mv3', 'opera-mv3'
        ./build/dev/<browser>/filters/declarative
    ```

- **Extract text filters from DNR rulesets:**

    ```shell
    pnpm debug-filters:extract
    # Under the hood:
    pnpm exec tsurlfilter extract-filters \
        # Path to the directory with DNR rulesets
        # Where <browser> is the browser target, can be 'chrome-mv3', 'opera-mv3'
        ./build/dev/<browser>/filters/declarative \
        # Path to save extracted text filters
        # Where <browser> is the browser target, can be 'chrome-mv3', 'opera-mv3'
        ./build/dev/<browser>/filters
    ```

For all command options, use `--help`, e.g.:

```shell
pnpm exec dnr-rulesets watch --help
pnpm exec tsurlfilter convert --help
```
### <a name="dev-hotfix-mv3"></a> Hotfix filters for MV3 with skip review

This guide explains how to update MV3 rulesets and submit them for Chrome Web Store fast-track review (skip review).

#### Prerequisites

- Ensure you're on the branch you want to hotfix (beta or release)
- Have the necessary permissions to upload to Chrome Web Store

#### Steps

1. **Navigate to the filters directory:**

    ```shell
    cd Extension/filters
    ```

2. **Extract text rules from DNR rulesets:**

    ```shell
    npx tsurlfilter extract-filters ./chromium-mv3/declarative ./extracted
    ```

    Text rules are now located in the `./extracted` folder.

3. **Edit the text rules:**

    Open the extracted text files and make your necessary changes to fix the rules.

4. **Convert text rules back to DNR rulesets:**

    ```shell
    npx tsurlfilter convert ./extracted /web-accessible-resources/redirects ./chromium-mv3/declarative --prettify-json=false
    ```

5. **Exclude unsafe rules:**

    ```shell
    npx dnr-rulesets exclude-unsafe-rules ./chromium-mv3/declarative --prettify-json=false
    ```

6. **Review changes:**

    Check `git diff` for anything unusual to ensure everything is correct. Some differences like rule reordering are expected and acceptable.

7. **Return to project root and download the latest extension:**

    ```shell
    cd ../../
    ```

    For **release** version:

    ```shell
    pnpm tsx tools/skip-review/download-latest-extension-mv3.ts release
    ```

    For **beta** version:

    ```shell
    pnpm tsx tools/skip-review/download-latest-extension-mv3.ts beta
    ```

8. **Verify changes are acceptable for skip-review:**

    Make sure you're on the correct branch that is currently deployed as release/beta.

    For **release** version:

    ```shell
    pnpm tsx tools/skip-review/check-changes-for-cws.ts ./tmp/extension-release-latest ./build/release/chrome-mv3
    ```

    For **beta** version:

    ```shell
    pnpm tsx tools/skip-review/check-changes-for-cws.ts ./tmp/extension-beta-latest ./build/beta/chrome-mv3
    ```

9. **Deploy:**

    - Run the manual Bamboo build
    - Upload the extension to Chrome Web Store
    - Submit for fast-track review

### <a name="dev-linter"></a> Linter

Despite our code may not currently comply with new style configuration,
please, setup `eslint` in your editor to follow up with it `.eslintrc`

### <a name="dev-typescript-configs"></a> TypeScript Configuration

The project uses **TypeScript Project References** to completely separate Manifest V2 and V3 codebases into independent TypeScript projects. This architectural approach eliminates the need for empty stub implementations and provides superior IDE support.

### Configuration Files Overview

The project contains **5 TypeScript configuration files**, each serving a specific purpose:

1. **`tsconfig.base.json`** - Shared base configuration
    - Common compiler options for all projects
    - JSX support and module resolution settings

2. **`tsconfig.json`** - Root project references container
    - Contains minimal includes
    - References both MV2 and MV3 projects
    - Enables VS Code to automatically switch between projects

3. **`tsconfig.mv2.json`** - Manifest V2 project
    - Excludes all `**/*-mv3.ts` and `**/*-mv3.tsx` files
    - Contains MV2-specific path aliases
    - Composite project with declaration output

4. **`tsconfig.mv3.json`** - Manifest V3 project
    - Excludes all `**/*-mv2.ts` and `**/*-mv2.tsx` files
    - Contains MV3-specific path aliases
    - Composite project with declaration output

5. **`tsconfig.eslint.json`** - ESLint-specific configuration
    - Includes all files for linting purposes
    - Special path mapping for JSX files
    - Separate from compilation projects

### <a name="dev-localizations"></a> Update localizations

For detailed localization workflow and best practices, see [Locales Documentation](./tools/locales/README.md#dev-locales).

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

### Key Features

- Tracks and compares bundle sizes across different build types (`beta`, `release`, etc.) and browser targets (`chrome`, `chrome-mv3`, `edge`, etc.)
- Detects significant size increases using configurable thresholds (default: 10%)
- Ensures Chrome MV3 bundle stays under the 30MB limit
- Checks for duplicate package versions using `pnpm`
- Stores historical size data in `.bundle-sizes.json`
- Designed for CI/CD integration (Bamboo)
- **For Firefox targets (AMO and Standalone) only**, every individual `.js` file is checked to ensure it does not exceed the 4MB limit imposed by the Firefox Add-ons Store. If any `.js` file is larger than 4MB, the check fails and the offending files are reported.

### How it works

- On each beta or release build, the system compares the current bundle sizes to the reference values in `.bundle-sizes.json`.
- If any size exceeds the configured threshold, or additionally check for 30MB limit for Chrome MV3 target or 4MB limit for Firefox targets - the check fails.
- Duplicate package versions are detected and reported.

### To update the bundle sizes manually

We have defined size limits in the project.

1. When we build the `beta` or `release` version, the build process checks if we’re exceeding those limits.
2. If we exceed the limits, the developer should investigate the cause and decide whether the size increase is acceptable.
3. If the new sizes are justified, the developer updates the size values in the package and creates a commit.
4. We then review and approve any changes to the sizes as part of the PR process.

#### Steps

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

### Checking bundle size locally

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

### Usage: Custom Threshold

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
