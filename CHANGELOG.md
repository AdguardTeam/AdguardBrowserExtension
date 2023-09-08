# AdGuard Browser Extension Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [Unreleased]

### Fixed
- Rule wizard bug with advanced modifier rules[#2456](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2456).
- Csp rules breaking rule wizard on unblocking. [#2448](https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2448)


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

[Unreleased]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.2.168...HEAD
[4.2.168]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.2.162...v4.2.168
[4.2.162]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.2.151...v4.2.162
[4.2.151]: https://github.com/AdguardTeam/AdguardBrowserExtension/compare/v4.1.57...v4.2.151
