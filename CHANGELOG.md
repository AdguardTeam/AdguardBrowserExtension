# AdGuard Browser Extension Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Check diff updates once in a hour.
- Updated `@adguard/tswebextension` to [v1.0.14](https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tswebextension/CHANGELOG.md).
- Updated `@adguard/tsurlfilter` to [v2.2.14](https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tsurlfilter/CHANGELOG.md).
- Updated `@adguard/scriptlets` to [v1.10.1](https://github.com/AdguardTeam/Scriptlets/blob/master/CHANGELOG.md).

### Fixed
- Memory leak with parsed tags from filter rules.
- Applying of `$all` modifier rules [#2620](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2620).


## [4.3.14] - 2024-06-02

### Fixed
- Cosmetic rules do not work in Opera [#2704](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2704) and [#2705](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2705).


## [4.3.13] - 2024-01-30

### Added
- Added Edge and Opera dev build.
- Detecting dangerous rules.

### Fixed
- Not all Custom filters shown [#2693](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2693)


## [4.3.10] - 2024-01-20

### Fixed
- Automatic filters update does not work in mobile browsers [#2423](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2423)

## Changed
- Updated `@adguard/filters-downloader` to [v2.0.7](https://github.com/AdguardTeam/FiltersDownloader/blob/master/CHANGELOG.md).


## [4.3.4] - 2024-01-16

### Added
- Getting user consent on annoyances filter enabling.

### Fixed
- Fixed compatibility for minimum supported versions [#2661](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2661)
- Filters group not opening if some text is selected on the page [#2662](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2662)

### Changed
- Download and apply differential updates [2586](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2586)
- Updated `@adguard/tswebextension` to [v1.0.8](https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tswebextension/CHANGELOG.md).
- Updated `@adguard/tsurlfilter` to [v2.2.9](https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tsurlfilter/CHANGELOG.md).
- Updated `@adguard/scriptlets` to [v1.9.105](https://github.com/AdguardTeam/Scriptlets/blob/master/CHANGELOG.md).
- Updated `@adguard/filters-downloader` to [v2.0.4](https://github.com/AdguardTeam/FiltersDownloader/blob/master/CHANGELOG.md).


## [4.2.240] - 2023-12-15

### Added
- Info about `@adguard/tswebextension`, `@adguard/tsurlfilter`, `@adguard/extended-css` and `@adguard/scriptlets` versions to the options page's About tab [#2237](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2237)

### Changed
- Updated `@adguard/tswebextension` to [v1.0.5](https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tswebextension/CHANGELOG.md).
- Updated `@adguard/tsurlfilter` to [v2.2.8](https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tsurlfilter/CHANGELOG.md).
- Updated `@adguard/scriptlets` to [v1.9.101](https://github.com/AdguardTeam/Scriptlets/blob/master/CHANGELOG.md)

### Fixed
- $$ rules break encoding on some websites [#2249](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2249)
- TSUrlFilter library loading by Fullscreen User Rules Editor
  [#2412](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2412).
- Displaying of Stealth Mode modified cookie rules in Filtering log as "Modified"
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
- Remove "AdGuard settings..." from context menu on options.html [#2258](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2258)
- Updated `@adguard/tswebextension` to [v0.4.6](https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tswebextension/CHANGELOG.md).
- Updated `@adguard/tsurlfilter` to [v2.2.6](https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tsurlfilter/CHANGELOG.md).
- Updated `@adguard/filters-downloader` to [v1.1.23](https://github.com/AdguardTeam/FiltersDownloader/blob/master/CHANGELOG.md).
- Updated `@adguard/scriptlets` to [v1.9.96](https://github.com/AdguardTeam/Scriptlets/blob/master/CHANGELOG.md)

### Fixed
- Filtering log not opening on Firefox for Android [#2563](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2536)
- Firefox Mobile not being correctly picked on a `Report an issue` page [2250](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2250)
- Filtering log crash on blocking requests, which were already allowlisted from applying `$removeparam`, `$removeheader` or `$csp` rules [#2534](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2534).
- Do not use `zh-CN` localized metadata for `zh-TW` browser language
  [#2504](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2504)
- Collect logs only when filtering log is open [#2544](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2544)
- Cannot add a custom filter list with a .php URL [#1723](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1723)


## [4.2.209] - 2023-11-01

### Fixed
- Resync event listeners after background page wakes up


## [4.2.208] - 2023-10-23

### Added
- Send `system_version` during issues reporting
  [#2535](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2535).

### Changed
- Updated `@adguard/filters-downloader` to [v1.1.20](https://github.com/AdguardTeam/FiltersDownloader/blob/master/CHANGELOG.md).
- Updated `@adguard/tswebextension` to [v0.4.1](https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tswebextension/CHANGELOG.md).
- Updated `@adguard/tsurlfilter` to [v2.2.1](https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tsurlfilter/CHANGELOG.md).
- Updated `@adguard/scriptlets` to [v1.9.72](https://github.com/AdguardTeam/Scriptlets/blob/master/CHANGELOG.md)
- Removed gutter of tab buttons on extension's settings page [#2198](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2198).

### Fixed
- Rule patterns and options not being clickable in rule wizard of filtering log [#2204](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2204).


## [4.2.189] - 2023-10-09

### Added
- Fixed stealth mode toggle not triggering configuration reload.
- CSP `trusted-types` directive modifying for response headers
  [#2068](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2068).

### Changed
- Update `@adguard/tswebextension` to [v0.3.21](https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tswebextension/CHANGELOG.md#0321---2023-09-25).
- Update `@adguard/tsurlfilter` to [v2.1.12](https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tsurlfilter/CHANGELOG.md#2112---2023-09-25).

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
- Update `@adguard/tsurlfilter` to [v2.1.11](https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tsurlfilter/CHANGELOG.md#2111---2023-08-25)
- Update `@adguard/tswebextension` to [v0.3.16](https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tswebextension/CHANGELOG.md#0316---2023-09-05)
- Updated `@adguard/scriptlets` to [v1.9.72](https://github.com/AdguardTeam/Scriptlets/blob/master/CHANGELOG.md#v1972---2023-08-25)

### Fixed
- Extension started downloading filters too often
- Custom filters names not displaying if added while filtering log is open.
- Do not inject content scripts to the chrome web store pages on extension initialization.
- Blocked CSP reports are not filtered by "Blocked" in the filtering log.
- Redirects are not included into tab's blocked requests count
  [#2443](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2443).


## [4.2.162] - 2023-08-28

### Changed
- Update `@adguard/tsurlfilter` to [v2.1.10](https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tsurlfilter/CHANGELOG.md#2110---2023-08-21)
- Update `@adguard/tswebextension` to [v0.3.11](https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tswebextension/CHANGELOG.md#0311---2023-08-21)
- Updated `@adguard/scriptlets` to [v1.9.70](https://github.com/AdguardTeam/Scriptlets/blob/master/CHANGELOG.md)

### Fixed
- Custom filters names not being displayed if added while filtering log is open.
- Do not inject content scripts to the chrome web store pages on extension initialization.


## [4.2.151] - 2023-08-11

### Added
- [@adguard/tswebextension](https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tswebextension/README.md) MV2 integration

### Changed
- Moved Adguard API to separate package — [@adguard/api](https://www.npmjs.com/package/@adguard/api)
- Updated `@adguard/tsurlfilter` to [v2.1.7](https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tsurlfilter/CHANGELOG.md#217---2023-08-10)
- Updated `@adguard/scriptlets` to [v1.9.62](https://github.com/AdguardTeam/Scriptlets/blob/master/CHANGELOG.md)

[Unreleased]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.3.14...HEAD
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
