# AdGuard Browser Extension Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Send `system_version` during issues reporting
  (#2535)[https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2535].

### Changed
- Updated `@adguard/filters-downloader` to [v1.1.20](https://github.com/AdguardTeam/FiltersDownloader/blob/master/CHANGELOG.md).
- Updated `@adguard/tswebextension` to [v0.4.1](https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tswebextension/CHANGELOG.md).
- Updated `@adguard/tsurlfilter` to [v2.2.1](https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tsurlfilter/CHANGELOG.md).
- Updated `@adguard/scriptlets` to [v1.9.72](https://github.com/AdguardTeam/Scriptlets/blob/master/CHANGELOG.md)
- Removed gutter of tab buttons on extension's settings page [#2198](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2198).

### Fixed
- Rule patterns and options not being clickable in rule wizard of filtering log [#2204](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2204).


<!-- TODO: update the date after release -->
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

[4.2.189]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.2.168...4.2.189
[4.2.168]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.2.162...v4.2.168
[4.2.162]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.2.151...v4.2.162
[4.2.151]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.1.57...v4.2.151
