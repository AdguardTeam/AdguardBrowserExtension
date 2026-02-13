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
- [Development](DEVELOPMENT.md)
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

## <a name="permissions-required"></a> Permissions required

### Common permissions for all browsers and manifest versions

- `tabs`                          - this permission is required in order to get the URL of the options page tab
- `webRequest`                    - this permission is necessary to apply complicated rules (cosmetic for instance), detecting and removing tracking cookies, counting blocked resources
- `cookies`                       - this permissions is required to delete cookies from requests or changing their lifetime
- `contextMenus`                  - this permission is required in order to create a context menu
- `storage`                       - this permission is required in order to save user settings, user rules and custom filters
- `unlimitedStorage`              - this permission is required in order to save large filters
- `webNavigation`                 - this permission is required in order to catch the moment for injecting scriptlets
- `privacy`                       - this permission allows access to browser privacy settings; required in Firefox, optional in Chrome/Edge/Opera

### Permissions for MV2 only

- `<all_urls>`                    - this permission grants access to all websites to apply content scripts and filtering rules
- `webRequestBlocking`            - this permission is required to block or modify HTTP requests synchronously

### Permissions for MV3 only

- `host_permissions`              - this permission grants access to all websites (MV3 uses this instead of `<all_urls>`)
- `userScripts`                   - this permission is required to let the user subscribe to custom filter lists and evaluate rules from these lists
- `scripting`                     - this permission is required in order to inject assistant script only in the required pages
- `declarativeNetRequest`         - this permission is required in order to block, redirect and modify URL requests
- `declarativeNetRequestFeedback` - this permission is required in order to create a log of the blocked, redirected or modified URL requests

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
