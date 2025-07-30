# AdGuard Browser Extension Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased <!-- release/v5.2 -->

### Added

- Support for Chrome's User Scripts API that allows more reliable script injection in MV3.
- Support for custom filters is back again due to User Scripts API usage.
- Send last filters update time during issue reporting [#3055].
- Ability to exit editor by pressing `Escape` keyboard button [#2333].
- Blocking page for requests blocked by `$document` rules in MV3.
- Compatibility of `$header` modifier with `$match-case`
  and `$third-party` modifiers in MV2 [#2942].
- `zip` and `crx` artifacts for the extension builds [#3163], [#2488].

### Changed

- Updated blocking pages in MV2 extension for Safebrowsing and for web pages blocked by `$document` rules.
- Improved accessibility for visually impaired users [#3035], [#2315], [#2332].
- Updated [@adguard/agtree] to v3.2.2.
- Updated [@adguard/assistant] to v4.3.75.
- Updated [@adguard/dnr-rulesets] to v3.2.0.
- Updated [@adguard/filters-downloader] to v2.4.2.
- Updated [@adguard/logger] to v2.0.0.
- Updated [@adguard/scriptlets] to v2.2.8.
- Updated [@adguard/tsurlfilter] to v3.4.5.
- Updated [@adguard/tswebextension] to v3.2.7.

### Removed

- AdGuard DNS filter and AdGuard Annoyances filter as deprecated.

### Fixed

- Cursor moves to the end when saving user rules [#3145].
- Cannot maximize Filtering log in Firefox for Windows [#2464].
- Unable to paste text into user rules input field on Android [#3061].
- Invalid HTML rule selectors are breaking site loading [#2646], [#2826].
- Stealth mode's `Hide Referer from third parties` option may break some websites [#2839].
- Filtering log: Resizing the right panel selects its contents [#2305].
- Types of the blocked requests are not displayed in the popup (Firefox for Android) [#3157].
- Switching to the "Statistics" tab shifts the "Actions" and "Statistics" buttons (Edge for Android) [#3158].
- Filtering log: Request details panel is automatically closed when loading
  a website in another window/tab [#2327].
- Scriptlet rules are not displayed in the filtering log [#3164].
- The filtering in Edge's split screen doesn't work [#2832].
- Total blocked popup string translated incorrectly [#3204].
- `$replace` rules may break some websites [#3122].
- Increase file size limit to 10MB for `$replace` rules in Firefox [#3192].
- Allow to specify attributes without value in selector for HTML filtering rules [tsurlfilter#147].
- Missing space in the description of AdGuard German filter in the `de` locale [#3216].
- OOM errors may occur when applying too many patches in a row in MV2 [#3230].
- Extension initialization on browser startup in Firefox [#3189].
- Wrong rule is displayed for page blocked by `$document` rule in MV3 [#3260].
- Overflowing notification text in the options page.

[#2305]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2305
[#2315]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2315
[#2327]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2327
[#2332]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2332
[#2333]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2333
[#2464]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2464
[#2488]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2488
[#2646]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2646
[#2826]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2826
[#2832]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2832
[#2839]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2839
[#2942]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2942
[#3035]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3035
[#3055]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3055
[#3061]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3061
[#3122]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3122
[#3192]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3192
[#3145]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3145
[#3157]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3157
[#3158]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3158
[#3216]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3216
[#3163]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3163
[#3164]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3164
[#3189]: https://github.com/AdguardTeam/AdguardBrowserExtension/pull/3189
[#3204]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3204
[#3260]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3260
[tsurlfilter#147]: https://github.com/AdguardTeam/tsurlfilter/issues/147

## [5.1.102] - 2025-06-15

### Changed

- Updated [@adguard/filters-downloader] to v2.4.1.

## Fixed

- OOM errors may occur when applying too many patches in a row in MV2 [#3230].

[5.1.102]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v5.1.94...v5.1.102
[#3230]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3230

## [5.1.94] - 2025-05-29

### Changed

- Updated [@adguard/agtree] to v3.2.0.
- Updated [@adguard/tsurlfilter] to v3.3.3.
- Updated [@adguard/tswebextension] to v3.1.0-alpha.3.

[5.1.94]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v5.1.88...v5.1.94

## [5.1.88] - 2025-05-23

### Changed

- Updated [@adguard/agtree] to v3.1.3.
- Updated [@adguard/dnr-rulesets] to v3.0.0-alpha.3.
- Updated [@adguard/tsurlfilter] to v3.3.1.
- Updated [@adguard/tswebextension] to v3.1.0-alpha.1.

[5.1.88]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v5.1.79...v5.1.88

## [5.1.79] - 2025-04-28

### Changed

- Updated [@adguard/tsurlfilter] to v3.2.3.
- Updated [@adguard/tswebextension] to v3.0.2.

[5.1.79]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v5.1.70...v5.1.79

## [5.1.70] - 2025-03-19

### Fixed

- Popup size issues in Android Edge.

[5.1.70]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v5.1.68...v5.1.70

## [5.1.68] - 2025-03-07

### Changed

- Updated [@adguard/scriptlets] to v2.1.6.
- Updated [@adguard/tsurlfilter] to v3.2.1.
- Updated [@adguard/tswebextension] to v3.0.1.

[5.1.68]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v5.1.62...v5.1.68

## [5.1.62] - 2025-02-28

### Added

- Unsafe dynamic rules limit for MV3 with value 5000.
- Display dnr-rulesets version on About tab [#3054].
- Ability to search tabs by domain in the Filtering log [#3028].
- Ability to add filters from Google Drive [#2908].

### Changed

- Minimum supported Chromium-based MV2 browsers version now 106+ for support
  prerender requests.
- Increased all dynamic rules limit to 30000 for MV3.
- Error throwing for empty modifier list in network rules.
- Store filter data in ruleset files exclusively for the MV3 extension
  to allow updates where only the rulesets are modified.
- Updated [@adguard/agtree] to v3.0.1.
- Updated [@adguard/scriptlets] to v2.1.5.
- Updated [@adguard/tsurlfilter] to v3.2.0.
- Updated [@adguard/tswebextension] to v3.0.0.

### Fixed

- Once allowlisted tab considers all following websites in the tab as allowlisted [#3020] [#3048].
- Handling missing children data in the deserializer for certain nodes.
- A rule from a disabled filter list disables another rule [#3002].
- Notify user that rule was not applied because of the chrome limitations [#3004].
- URI encoded `$removeparam` value is not removed in MV3 [#3014].
- Cosmetic rules injecting into `about:blank` iframes in MV2.
- Shortened name translation in `pt_BR` locale [#3075].
- Allowlisted stealth rules are not shown in the filtering log [#2950].
- `$removeparam` incorrectly removes parameters from encoded URLs [#3076].
- Update extension icon on engine update.
- Closing rule limits warning updates the extension icon for MV3.
- Blocked counter on the popup updates for blocked requests from other tabs [#3050].
- `$popup,third-party` modifiers cause document blocking [#3012].
- Don't show lines for absent metadata when adding a custom filter [#3057].
- Filtering log does not observe tab changes, openings, or closings.
- Scriptlets and scripts are executed too late on website reload or navigation in MV2 [#2855].
- Do not inject cosmetic rules into the Assistant frame in MV3.

### Removed

- Storage classes, because they were moved to the `@adguard/tswebextension` package.

[5.1.62]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v5.0.188...v5.1.62
[#2855]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2855
[#2908]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2908
[#2950]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2950
[#3002]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3002
[#3004]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3004
[#3012]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3012
[#3014]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3014
[#3020]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3020
[#3028]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3028
[#3048]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3048
[#3050]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3050
[#3054]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3054
[#3057]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3057
[#3075]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3075
[#3076]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3076

## [5.0.188] - 2025-02-05

### Changed

- Scriptlet rules are not limited to ones from the pre-built filters.
- Updated [@adguard/tswebextension] to v2.4.0-alpha.11.

### Removed

- AdGuard Quick Fixes filter.
- Custom filters are not available temporarily.

[5.0.188]: https://github.com/AdguardTeam/AdguardBrowserExtension/releases/tag/v5.0.188

## [5.0.185] - 2025-01-22

### Added

- AdGuard Quick Fixes filter is back.

### Changed

- Scriptlet rules are available only from the pre-built filters now.
- Updated [@adguard/tswebextension] to v2.4.0-alpha.10.

### Removed

- Injection of remotely hosted scripts.

[5.0.185]: https://github.com/AdguardTeam/AdguardBrowserExtension/releases/tag/v5.0.185

## [5.0.183] - 2025-01-14

### Removed

- AdGuard Quick Fixes filter.
- Filters metadata update on the extension install.

[5.0.183]: https://github.com/AdguardTeam/AdguardBrowserExtension/releases/tag/v5.0.183

## [5.0.178] - 2024-12-24

### Changed

- Remade JS rules injections in MV3:
    - use `chrome.scripting` API for injecting functions for script rules from the pre-built filters,
    - use script tag injection only for script rules manually added by users —
      rules from *User rules* and *Custom filters*.
- Updated [@adguard/tswebextension] to v2.4.0-alpha.8.

### Removed

- Ability to execute new `AG_` script rules from *User rules* and *Custom filters* in MV3.

[5.0.178]: https://github.com/AdguardTeam/AdguardBrowserExtension/releases/tag/v5.0.178

## [4.4.48] - 2024-11-25

### Added

- Send `manifest_version` during issues reporting for MV2.

### Changed

- Updated [@adguard/agtree] to v2.1.3.
- Updated [@adguard/tsurlfilter] to v3.0.7.
- Updated [@adguard/tswebextension] to v2.0.7.

### Fixed

- Optimized performance of parsing uBlock filter parameters [#2962].
- `$removeparam` fails to match encoded URL params in MV2 [#3015].
- Memory leak caused by multiple script injections on the same pages
  after an event page in Firefox restarts in MV2 [#2594].

[4.4.48]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.4.41...v4.4.48
[#2962]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2962
[#3015]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/3015

## [5.0.170] - 2024-10-30

### Changed

- Updated [@adguard/tswebextension] to v2.4.0-alpha.7.

### Fixed

- Memory leak caused by multiple script injections on the same pages
  after a service worker or event page restart in MV3 [#2594].

[5.0.170]: https://github.com/AdguardTeam/AdguardBrowserExtension/releases/tag/v5.0.170
[#2594]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2594

## [5.0.162] - 2024-10-30

### Added

- Send `manifest_version` during issues reporting for MV3.

[5.0.162]: https://github.com/AdguardTeam/AdguardBrowserExtension/releases/tag/v5.0.162

## [5.0.159] - 2024-10-23

### Changed

- Updated [@adguard/logger] to v1.1.1.
- Updated [@adguard/tsurlfilter] to v3.1.0-alpha.7.
- Updated [@adguard/tswebextension] to v2.4.0-alpha.6.

### Fixed

- Correct import of `EXTENDED_CSS_VERSION`.
- Excluding request types causes document blocking [#2992].
- Selecting a single `$permissions` filtering log event selects all `$permissions` events.

[5.0.159]: https://github.com/AdguardTeam/AdguardBrowserExtension/releases/tag/v5.0.159
[#2992]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2992

## [4.4.39] - 2024-10-21

### Changed

- Updated [@adguard/logger] to v1.1.1.
- Updated [@adguard/tswebextension] to v2.0.4.

### Fixed

- User rules scanning breaks extension popup [#2989].
- Selecting a single `$permissions` filtering log event selects all `$permissions` events.

[4.4.39]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.4.30...v4.4.39
[#2989]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2989

## [5.0.138] - 2024-10-10

### Changed

- Updated [@adguard/logger] to v1.1.0.
- Updated [@adguard/tsurlfilter] to v3.1.0-alpha.6.
- Updated [@adguard/tswebextension] to v2.4.0-alpha.3.

### Fixed

- Use MV3-specific filters in Edge browser if MV3 extension is installed [#2985].
- Unable to add AdGuard Quick Fixes filter in MS Edge [#2963].
- Cosmetic rules are not applied sometimes or are applied also to wrong domain [#2984].
- JS rules are blocked by Trusted Types on some websites [#2980].
- MV3 extension cannot apply rules to about:blank iframes [#2975].
- Scriptlets logging does not work [#2977].
- Content-type matching of `$permissions` and `$removeparam` rules [#2954].

[5.0.138]: https://github.com/AdguardTeam/AdguardBrowserExtension/releases/tag/v5.0.138
[#2985]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2985
[#2984]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2984
[#2980]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2980
[#2975]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2975
[#2977]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2977
[#2963]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2963
[#2954]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2954

## [5.0.128] - 2024-10-04

### Changed

- Updated [@adguard/scriptlets] to v1.12.1.
- Updated [@adguard/tsurlfilter] to v3.1.0-alpha.5.
- Updated [@adguard/tswebextension] to v2.3.0-alpha.1.

[5.0.128]: https://github.com/AdguardTeam/AdguardBrowserExtension/releases/tag/v5.0.128

## [4.4.30] - 2024-10-02

### Changed

- Updated [@adguard/agtree] to v2.1.2.
- Updated [@adguard/logger] to v1.0.2.
- Updated [@adguard/scriptlets] to v1.12.1.
- Updated [@adguard/tsurlfilter] to v3.0.5.
- Updated [@adguard/tswebextension] to v2.0.3.

### Fixed

- The exception `$domain=~` filter rule is not working properly [#2912].
- Scriptlets exclusion matching is not working properly for rules with arguments [#2947].

[4.4.30]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.4.22...v4.4.30
[#2912]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2912
[#2947]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2947

## [5.0.112] - 2024-09-27

### Changed

- Disabled option in tracking protection for hiding search queries [#2969].

[5.0.112]: https://github.com/AdguardTeam/AdguardBrowserExtension/releases/tag/v5.0.112
[#2969]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2969

## [5.0.97] - 2024-09-23

### Fixed

- The list of custom filters is passed to ReportsWebApp even if the Custom group is disabled [#2951].
- The extension stopped working because of intersection of dynamic rules IDs [#2953].

[5.0.97]: https://github.com/AdguardTeam/AdguardBrowserExtension/releases/tag/v5.0.97
<!-- TODO: worth changing url after v5.0 branch merging into master -->
<!-- [5.0.97]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v5.0.91...v5.0.97 -->
[#2951]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2951
[#2953]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2953

## [5.0.91] - 2024-09-19

The extension is now fully compatible with MV3.

[5.0.91]: https://github.com/AdguardTeam/AdguardBrowserExtension/releases/tag/v5.0.91

## [4.4.22] - 2024-08-30

### Changed

- Updated [@adguard/tsurlfilter] to v3.0.1.
- Updated [@adguard/tswebextension] to v2.0.1.
- Updated [@adguard/scriptlets] to v1.11.16.

### Fixed

- Negated domains in the `$to` modifier are not working as expected [#2910].
- Redirect rule blocks request in the Spotify player instead of redirecting [#2913].

[4.4.22]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.4.18...v4.4.22
[#2910]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2910
[#2913]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2913

## [4.4.18] - 2024-08-19

### Added

- `HybridStorage` for storing data via IndexedDB with fallback to `chrome.storage.local`.
- Syntax highlighting for `$permissions` modifier in the rule editor.
- [@adguard/agtree] for working with rules tree.

### Changed

- Exported settings file name to standardized way to make it consistent with other AdGuard products [#2607].
- Filter lists are now stored in a pre-processed format, which makes the engine start more efficiently,
  since the engine does not need to convert or parse the rules.
- Updated [@adguard/tswebextension] to v2.0.0.
- Updated [@adguard/tsurlfilter] to v3.0.0.
- Updated [@adguard/scriptlets] to v1.11.6.

### Fixed

- Filtering log gets refreshed when navigating yandex maps [#2519].
- Filtering log is broken by `history.replaceState` [#2598].
- Style filter is applied, but scriptlet filter is not in Firefox [#2782].
- Missing info on custom filters when reporting issues [#2793].
- Some filters are not updated when enabled [#2818].
- Can't set notifications viewed.
- Console errors on the background page when opening `chrome://new-tab-page/`.
- `$permissions` rules are not shown in the filtering log.
- Extension's action icon flickering on tab change.
- Filters auto updates not refreshing `last updated date` field [#2726].
- Extension's action icon flickering on tab change.

[4.4.18]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.3.64...v4.4.18
[#2519]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2519
[#2598]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2598
[#2607]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2607
[#2726]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2726
[#2782]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2782
[#2793]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2793
[#2818]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2818

## [4.3.64] - 2024-07-10

### Fixed

- Popup menu does not open in Firefox Nightly [#2817].

[4.3.64]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.3.53...v4.3.64
[#2817]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2817

## [4.3.53]

### Changed

- Updated [@adguard/tswebextension] to v1.0.24.

### Fixed

- Do not throw an error during cookie setting if a cookie domain mismatches a request URL [#2683].
- Script rules are not applied in Firefox due to CSP [#1733].

[4.3.53]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.3.46...v4.3.53
[#2683]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2683
[#1733]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1733

## [4.3.46] - 2024-04-08

### Added

- [@adguard/logger] for logging messages.

### Changed

- Raw filters are stored as strings.
- Updated [@adguard/filters-downloader] to v2.2.0.
- Updated [@adguard/tsurlfilter] to v2.2.18.
- Updated [@adguard/tswebextension] to v1.0.22.
- Updated [@adguard/scriptlets] to v1.10.25.

### Fixed

- The install process stops if filters.js is unreachable [#2761].
- Do not fetch diff updates until the next full update, if some fatal error occurred during the last update [#2717].
- Check filter checksum after it was downloaded [#2681].
- Assistant iframe styles are affected by cosmetic rules specific for websites [#1848].
- Applying of modifiers `$popup` and `$all` [#2620], [#2728].
- Update recommended filters on enabling group of filters and on locale detection [#2714].

[4.3.46]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.3.35...v4.3.46
[#2761]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2761
[#2717]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2717
[#2714]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2714
[#2681]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2681
[#1848]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1848

## [4.3.35] - 2024-03-28

### Fixed

- Update notification leading to release notes when on beta [#2682].
- The filters revert to the pre-installed ones when importing settings [#2735].

[4.3.35]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.3.31...v4.3.35
[#2682]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2682
[#2735]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2735

## [4.3.31] - 2024-03-11

### Changed

- Check diff updates once in a hour.
- Updated [@adguard/tswebextension] to v1.0.16.
- Updated [@adguard/tsurlfilter] to v2.2.15.
- Updated [@adguard/scriptlets] to v1.10.1.

### Fixed

- Memory leak with parsed tags from filter rules.
- Applying of `$all` modifier rules [#2620].
- Settings fail to open on the very first attempt [#2712].
- All groups and filters are disabled after installation [#2713].
- Custom filter adding modal [#2715].
- Send `stealth.block_trackers` during issues reporting [#2721].
- `$popup` modifier block other types of resources [#2723].
- `$popup` should not disable simple blocking rule [#2728].

[4.3.31]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.3.13...v4.3.31
[#2620]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2620
[#2712]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2712
[#2713]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2713
[#2715]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2715
[#2721]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2721
[#2723]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2723
[#2728]: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2728

## [4.3.14] - 2024-06-02

### Fixed

- Cosmetic rules do not work in Opera [#2704](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2704) and [#2705](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2705).

## [4.3.13] - 2024-01-30

### Added

- Added Edge and Opera dev build.
- Detecting dangerous rules.

### Fixed

- Not all Custom filters shown [#2693](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2693).

## [4.3.10] - 2024-01-20

### Fixed

- Automatic filters update does not work in mobile browsers [#2423](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2423).

## Changed

- Updated [@adguard/filters-downloader] to v2.0.7.

## [4.3.4] - 2024-01-16

### Added

- Getting user consent on annoyances filter enabling.

### Fixed

- Fixed compatibility for minimum supported versions [#2661](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2661).
- Filters group not opening if some text is selected on the page [#2662](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2662).

### Changed

- Download and apply differential updates [#2586](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2586).
- Updated [@adguard/tswebextension] to v1.0.8.
- Updated [@adguard/tsurlfilter] to v2.2.9.
- Updated [@adguard/scriptlets] to v1.9.105.
- Updated [@adguard/filters-downloader] to v2.0.4.

## [4.2.240] - 2023-12-15

### Added

- Info about `@adguard/tswebextension`, `@adguard/tsurlfilter`, `@adguard/extended-css` and `@adguard/scriptlets` versions to the options page's About tab [#2237](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2237).

### Changed

- Updated [@adguard/tswebextension] to v1.0.5.
- Updated [@adguard/tsurlfilter] to v2.2.8.
- Updated [@adguard/scriptlets] to v1.9.101.

### Fixed

- `$$` rules break encoding on some websites [#2249](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2249).
- TSUrlFilter library loading by Fullscreen User Rules Editor
  [#2412](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2412).
- Displaying of Stealth Mode modified cookie rules in Filtering log as "Modified".
  [#2512](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2512).
- Highlighting of `$inline-font` and `$inline-script`
  [#2609](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2609).
- Scriptlets logging in browser console only if Filtering log is opened
  [#2584](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2584).
- Filters updating notification styles
  [#2309](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2309).

## [4.2.228] - 2023-11-27

### Fixed

- Logging of cosmetic rules applying.

## [4.2.226] - 2023-11-22

### Added

- Macedonian language support [#2574](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2574).

### Changed

- Remove "AdGuard settings..." from context menu on options.html [#2258](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2258).
- Updated [@adguard/tswebextension] to v0.4.6.
- Updated [@adguard/tsurlfilter] to v2.2.6.
- Updated [@adguard/filters-downloader] to v1.1.23.
- Updated [@adguard/scriptlets] to v1.9.96.

### Fixed

- Filtering log not opening on Firefox for Android [#2563](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2536).
- Firefox Mobile not being correctly picked on a `Report an issue` page [2250](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2250).
- Filtering log crash on blocking requests, which were already allowlisted from applying `$removeparam`, `$removeheader` or `$csp` rules [#2534](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2534).
- Do not use `zh-CN` localized metadata for `zh-TW` browser language
  [#2504](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2504).
- Collect logs only when filtering log is open [#2544](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2544).
- Cannot add a custom filter list with a .php URL [#1723](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1723).

## [4.2.209] - 2023-11-01

### Fixed

- Resync event listeners after background page wakes up.

## [4.2.208] - 2023-10-23

### Added

- Send `system_version` during issues reporting
  [#2535](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2535).

### Changed

- Updated [@adguard/filters-downloader] to v1.1.20.
- Updated [@adguard/tswebextension] to v0.4.1.
- Updated [@adguard/tsurlfilter] to v2.2.1.
- Updated [@adguard/scriptlets] to v1.9.72.
- Removed gutter of tab buttons on extension's settings page [#2198](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2198).

### Fixed

- Rule patterns and options not being clickable in rule wizard of filtering log [#2204](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2204).

## [4.2.189] - 2023-10-09

### Added

- Fixed stealth mode toggle not triggering configuration reload.
- CSP `trusted-types` directive modifying for response headers
  [#2068](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2068).

### Changed

- Updated [@adguard/tswebextension] to v0.3.21.
- Updated [@adguard/tsurlfilter] to v2.1.12.

### Fixed

- Slow enabling of recommended filters on first group activation
  [#2431](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2431).
- User rules not filtering duplicates on importing
  [#2446](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2446).
- Rule wizard bug with advanced modifier rules
  [#2456](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2456).
- Translation language detection for Filter download page
  [#2430](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2430)
- Do not block a tab loading by `$popup` modifier rule on direct url navigation
  [#2449](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2449).
- Filtering log focus on the active tab
  [#2482](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2482).
- Displaying of applied Stealth Mode options in filtering log request details
  [#2455](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2455).
- Updating of tab title in Filtering log's Tab selector
  [#2428](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2428).
- Displaying of Stealth Mode cookie filtering log events as applied by Stealth Mode
  [#2487](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2487).
- Csp rules breaking rule wizard on unblocking
  [#2448](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2448).
- AdGuard v4.2.168 is not working in the Firefox after update
  [#2501](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2501).

## [4.2.168] - 2023-09-07

### Changed

- Updated [@adguard/tsurlfilter] to v2.1.11.
- Updated [@adguard/tswebextension] to v0.3.16.
- Updated [@adguard/scriptlets] to v1.9.72.

### Fixed

- Extension started downloading filters too often.
- Custom filters names not displaying if added while filtering log is open.
- Do not inject content scripts to the chrome web store pages on extension initialization.
- Blocked CSP reports are not filtered by "Blocked" in the filtering log.
- Redirects are not included into tab's blocked requests count
  [#2443](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2443).

## [4.2.162] - 2023-08-28

### Changed

- Updated [@adguard/tsurlfilter] to v2.1.10.
- Updated [@adguard/tswebextension] to v0.3.11.
- Updated [@adguard/scriptlets] to v1.9.70.

### Fixed

- Custom filters names not being displayed if added while filtering log is open.
- Do not inject content scripts to the chrome web store pages on extension initialization.

## [4.2.151] - 2023-08-11

### Added

- [@adguard/tswebextension](https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tswebextension/README.md) MV2 integration.

### Changed

- Moved Adguard API to separate package — [@adguard/api](https://www.npmjs.com/package/@adguard/api).
- Updated [@adguard/tsurlfilter] to v2.1.7.
- Updated [@adguard/scriptlets] to v1.9.62.

[4.3.14]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.3.13...v4.3.14
[4.3.13]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.3.10...v4.3.13
[4.3.10]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.3.4...v4.3.10
[4.3.4]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.2.240...v4.3.4
[4.2.240]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.2.228...v4.2.240
[4.2.228]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.2.226...v4.2.228
[4.2.226]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.2.209...v4.2.226
[4.2.209]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/561737249b2c50c39b8e0ee6eefa5d19726c97b3...v4.2.209
[4.2.208]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.2.189...561737249b2c50c39b8e0ee6eefa5d19726c97b3
[4.2.189]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.2.168...v4.2.189
[4.2.168]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.2.162...v4.2.168
[4.2.162]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.2.151...v4.2.162
[4.2.151]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.1.57...v4.2.151

[@adguard/agtree]: https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/agtree/CHANGELOG.md
[@adguard/assistant]: https://github.com/AdguardTeam/AdguardAssistant/blob/master/CHANGELOG.md
[@adguard/filters-downloader]: https://github.com/AdguardTeam/FiltersDownloader/blob/master/CHANGELOG.md
[@adguard/logger]: https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/logger/CHANGELOG.md
[@adguard/scriptlets]: https://github.com/AdguardTeam/Scriptlets/blob/master/CHANGELOG.md
[@adguard/tswebextension]: https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tswebextension/CHANGELOG.md
[@adguard/tsurlfilter]: https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tsurlfilter/CHANGELOG.md
