# Preregistered Scripts

Build tool that pre-compiles scriptlet/JS bundles for domains where rules
must run before the page's own scripts (e.g. `youtube.com`). Bundles are
registered via MV3's `chrome.scripting.registerContentScripts` at
`document_start` and persist across browser sessions.

## Pipeline

`generate-bundle.ts` runs per MV3 browser target:

1. **Collect** (`scriptlet-collector.ts`) — builds a real
   `@adguard/tsurlfilter` `Engine` per DNR ruleset and queries
   `Engine.getCosmeticResult()` with `CosmeticOptionJS` and `ignorePath`
   for each configured domain and its `www.` alias, deduping matched rules
   by hash. Filter enable/disable and allowlist state are runtime concerns;
   collection only records what local filters contain.
2. **Guard** (`path-exception-guard.ts`) — fails the build if a
   `$path`-scoped scriptlet/JS exception cancels a collected rule:
   per-hostname preregistration cannot honor it.
3. **Shared bundle** (`code-generators/shared-bundle-generator/`) —
   `scriptlets-bundle.js`: assigns `window.<key> = { r, b, f }` where `r`
   runs a scriptlet from the `f` registry deduped by rule hash via `b`.
   Emitted even for an empty name set — JS rule files still need `<key>.b`.
   `r` normalizes `source.domainName` with the same `stripWwwLabel`
   function the dynamic path uses via `getDomain` — its source is embedded
   from `@adguard/tswebextension`, so the two paths cannot drift apart.
4. **Per-function files** (`code-generators/scriptlet-function-generator/`)
   — one `s-{hash}.js` per unique scriptlet implementation (aliases share a
   file), registering it under every alias in `<key>.f`. A host loads only
   the functions its rules use.
5. **Per-hash files** (`code-generators/per-hash-generator/`) — one
   `{hash}.js` per unique rule: scriptlets call `<key>.r(...)`; JS rules
   are dedup-guarded against `<key>.b`; a `$path` modifier adds a runtime
   `location.pathname + search + hash` regex guard matching tsurlfilter's
   `$path` semantics.
6. **Cleanup** (`code-generators/cleanup-generator/`) — `cleanup.js`,
   always last: deletes `window.<key>` before page scripts can observe it.
7. **Manifest** — `manifest.json`:
   `{ schemaVersion, hashes, scriptletFiles, stubHashes, retainedScriptletFiles }`.
   The runtime registers only rules with a listed hash and attaches the
   function file mapped to each scriptlet name.
8. **Domains list** (`code-generators/domains-list.ts`) — `domains.js`:
   hostnames with at least one collected rule.
9. **Atomic swap + retention** — output goes to a temp dir, then replaces
   the old output. Files dropped from the previous generation are replaced
   with empty stubs for one generation: persisted registrations in users'
   browsers still reference them, and a missing file would break the whole
   registration at browser startup. Stubs stay listed in the manifest.
   Stale `.tmp-*` dirs are swept.

`config.ts` (`preregisteredDomains`) defines the domain set.
`constants.ts` holds the shared minifier config: compress and mangle are
disabled, so executed bytes are a purely lexical transform of the hashed
rule source.

## Generated files

Each domain loads, in order: `scriptlets-bundle.js` → the `s-{hash}.js`
function files of its scriptlets → its `{hash}.js` rule files →
`cleanup.js` (see `PreregisteredScriptsService.buildDomainScripts`).

## Hash contract

`hashString`, `computeScriptletHash`, `computeJsRuleHash`,
`computeRuleHash`, `normalizeDomain`, filename helpers and
`PREREGISTERED_SCRIPTS_DIR` live in `@adguard/tswebextension`'s
`mv3/preregistered-scripts/hasher` entry point, imported by this tool, so
build time and runtime hash rules identically. The coordination key
(`COORDINATION_KEY`) is fixed forever: cleanup deletes the property before
page scripts run, so rotation buys no stealth, and a stable key keeps
filenames stable for persisted registrations.

## Adding a domain

1. Add it to `config.ts`.
2. Run `pnpm resources:mv3`.
3. Output lands in `Extension/filters/<browser>/preregistered-scripts/`
   for each MV3 target (`chromium-mv3`, `opera-mv3`).

## Runtime

`@adguard/tswebextension`'s `PreregisteredScriptsService` syncs
registrations: `TsWebExtension.configure()` passes
`preregisteredScripts: { domains, path }`, the service loads
`manifest.json`, hashes the live engine's rules per domain and registers
content scripts. `CosmeticApi` skips dynamic injection for covered rules;
on sync failure the dynamic path stays as fallback. Scriptlets must be
idempotent — coverage windows and the dynamic fallback can both re-run a
rule (dedup via `<key>.b` covers repeats within a document).
