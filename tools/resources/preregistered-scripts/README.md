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
   for each preregistered domain (+ its
   `www.` alias), deduping matched rules by hash. After all rulesets are
   collected, the `$path`-exception guard (`path-exception-guard.ts`) fails
   the build if a `$path`-scoped scriptlet/JS exception cancels a collected
   rule — per-hostname preregistration cannot honor it.
2. **Coordination key** — a fixed constant (`COORDINATION_KEY` in
   `@adguard/tswebextension`'s hasher), shared by every generated file as a
   `window` property name. Fixed forever: the cleanup file deletes the
   property before any page script runs, so rotation buys no stealth, and a
   stable key keeps filenames stable across releases.
3. **Shared bundle** (`code-generators/shared-bundle-generator/`) —
   `scriptlets-bundle.js`, runner only (no embedded functions, so it stays
   small). Assigns `window.<key> = { r, b, f }`: `r(name, source, args,
   hash)` runs a scriptlet from the `f` registry (deduped by hash), `b` is
   the dedup `Set` shared with JS rule guards, `f` is the name→function
   registry populated by per-function files. Emitted even for an empty
   name set — JS rule files still need `<key>.b`.
4. **Per-function files** (`code-generators/scriptlet-function-generator/`)
   — one `s-{hash}.js` per unique scriptlet function (aliases sharing an
   implementation get one file; the filename is a content hash, stable
   across generations). Each file registers its function under every alias
   in `window.<key>.f`. A host's registration includes only the function
   files its rules use, instead of the whole scriptlets library.
5. **Per-hash files** (`code-generators/per-hash-generator/`) — one
   `{hash}.js` per unique rule. Scriptlets call `<key>.r(...)`; JS
   rules are wrapped in a dedup guard against `<key>.b`, plus a runtime
   `location.pathname + search + hash` guard if the rule has a `$path`
   modifier (matching tsurlfilter's `$path` semantics).
6. **Cleanup file** (`code-generators/cleanup-generator/`) —
   `cleanup.js`, `delete window.<key>` in a try/catch — always last,
   so the page's own scripts cannot observe the injected code.
7. **Manifest** — `manifest.json` with `{ hashes, scriptletFiles,
   retainedScriptletFiles }`. Required at sync time: the runtime registers
   only rules with a matching generated file, and includes the function
   file mapped to each scriptlet name.
8. **Domains list** (`code-generators/domains-list.ts`) — `domains.js`,
   hostnames with at least one collected rule.
9. **Atomic swap + retention** — output goes to a temp dir, then replaces
   the old output. Dropped per-rule and per-function files of the previous
   generation are replaced with empty stubs (persisted registrations in
   users' browsers still reference them): a missing file would break the
   whole registration at browser startup, while an executable copy would
   keep running already-revoked code. Stub hashes/filenames stay listed in
   the manifest, so later builds keep the stubs until every client has
   synced its registrations. Stale `.tmp-*` dirs are swept.

Collection only records which rules/domains exist in the local filters —
domain-wide exceptions are already resolved by the collection engine, while
filter enable/disable and allowlist state are handled at runtime by
`PreregisteredScriptsService`, which queries the live, fully-configured
engine.

## Generated files

Each domain loads, in order: `scriptlets-bundle.js` → the `s-{hash}.js`
function files of the scriptlets its rules use → its `{hash}.js` rule
files → `cleanup.js` (see
`PreregisteredScriptsService.buildDomainScripts`).

## Files

| File | Purpose |
|------|---------|
| `config.ts` | `preregisteredDomains` — domains to generate bundles for. Add a domain here to register it. |
| `constants.ts` | Shared Terser options |
| `generate-bundle.ts` | Orchestrates the pipeline above |
| `scriptlet-collector.ts` | `ScriptletCollector` — collects rules per domain via a real Engine |
| `path-exception-guard.ts` | Fails the build when a `$path`-scoped exception cancels a collected rule |
| `code-generators/` | One subfolder per generated file (shared bundle, per-function files, per-hash files, cleanup, domains list) |
| `write-helpers.ts` | Validates generated JS syntax and writes it to disk |

The hash contract (`hashString`, `computeScriptletHash`,
`computeJsRuleHash`, `computeRuleHash`, `normalizeDomain`, filename
helpers, `PREREGISTERED_SCRIPTS_DIR`) lives in `@adguard/tswebextension`
(`src/lib/mv3/background/preregistered-scripts/hasher.ts`) and is imported
here via the Node-safe
`@adguard/tswebextension/mv3/preregistered-scripts/hasher` entry point, so
build time and runtime always hash rules identically.

## Adding a domain

1. Add it to `config.ts`.
2. Run `pnpm resources:mv3`.
3. Output appears under `Extension/filters/<browser>/preregistered-scripts/`
   for each MV3 target (`chromium-mv3`, `opera-mv3`).

## Runtime

`@adguard/tswebextension`'s `PreregisteredScriptsService` handles
registration. The extension passes a `preregisteredScripts: { domains,
path }` MV3 `Configuration` field; `TsWebExtension.configure()` calls
`PreregisteredScriptsService.sync()`, which loads `manifest.json`, queries
the engine per domain, hashes matching rules with the same `hasher.ts`, and
registers content scripts via `chrome.scripting.registerContentScripts`.

`CosmeticApi` skips dynamic scriptlet/JS injection for domains covered by a
successfully synced registration, avoiding double execution. If sync fails,
the dynamic injection path stays active as a fallback.
