# AdGuard Browser Extension Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- TODO: update changelog before 4.2.x hotfix 2 -->
<!-- changed: updated scriptlets to v1.9.72 -->

## [Unreleased]

### Changed
- Update `@adguard/tsurlfitler` to [v2.1.10](https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tsurlfilter/CHANGELOG.md#2110---2023-08-21)
- Update `@adguard/tswebextension` to [v0.3.11](https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tswebextension/CHANGELOG.md#0311---2023-08-21)
- Updated `@adguard/scriptlets` to [v1.9.70](https://github.com/AdguardTeam/Scriptlets/blob/master/CHANGELOG.md)

### Fixed
- Custom filters names not displaying if added while filtering log is open.
- Do not inject content scripts to the chrome web store pages on extension initialization.

## [4.2.151] - 2023-08-11

### Added
- [@adguard/tswebextension](https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tswebextension/README.md) MV2 integration

### Changed
- Moved Adguard API to separate package — [@adguard/api](https://www.npmjs.com/package/@adguard/api)
- Updated `@adguard/tsurlfilter` to [v2.1.7](https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/tsurlfilter/CHANGELOG.md#217---2023-08-10)
- Updated `@adguard/scriptlets` to [v1.9.62](https://github.com/AdguardTeam/Scriptlets/blob/master/CHANGELOG.md)
