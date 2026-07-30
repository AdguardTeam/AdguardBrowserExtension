# Preregistered Scripts

Build tool that pre-compiles scriptlet/JS bundles for domains where
ad-blocking rules must run before the page's own scripts (e.g.
`youtube.com`). Bundles are registered via MV3's
`chrome.scripting.registerContentScripts` at `document_start` and persist
across browser sessions.

## Pipeline

`generate-bundle.ts` runs the following steps per MV3 browser target:

1. **Collect** (`scriptlet-collector.ts`) — builds a real
   `@adguard/tsurlfilter` `Engine` per DNR ruleset and queries
   `Engine.getJsRulesIgnoringPath()` for each preregistered domain (+ its
   `www.` alias), deduping matched rules by hash. Each hostname lookup also
   passes the `$path`-exception guard (`path-exception-guard.ts`): if a
   `$path`-scoped scriptlet/JS exception cancels a collected rule, the build
   fails, because per-hostname preregistration cannot honor it (harmless
   exceptions don't trip it — see the guard file for the rationale).
2. **Coordination key** (`code-generators/coordination-key.ts`) — a random
   per-build identifier shared by every generated file.
3. **Shared bundle** (`code-generators/shared-bundle-generator/`) —
   `scriptlets-bundle.js`, one copy of every unique scriptlet function used.
4. **Per-hash files** (`code-generators/per-hash-generator/`) — one
   `{hash}.js` per unique rule; JS rules get a runtime `location.pathname`
   guard if the rule has a `$path` modifier.
5. **Cleanup file** (`code-generators/cleanup-generator/`) — `cleanup.js`,
   clears the coordination binding before the page's own scripts run.
6. **Domains list** (`code-generators/domains-list.ts`) — `domains.js`,
   hostnames with at least one collected rule.
7. **Atomic swap** — everything is written to a temp dir, then renamed over
   the old output, so a failed build never leaves partial output in place.

Collection only records which rules/domains exist in the local filters —
domain-wide exceptions are already resolved by the collection engine, while
filter enable/disable and allowlist state are handled at runtime by
`PreregisteredScriptsService`, which queries the live, fully-configured
engine.

## Generated files

Each domain loads, in order: `scriptlets-bundle.js` → its `{hash}.js` files
→ `cleanup.js` (see `PreregisteredScriptsService.buildDomainScripts`). All
three coordinate through one random top-level `let` binding — a lexical
variable, not a `window` property, so it's invisible to enumeration —
generated fresh every build (`coordination-key.ts`).

- **`scriptlets-bundle.js`** — declares `let <key> = {...}` with
  `.r(name, source, args, hash)` (runs a scriptlet, deduped by hash) and
  `.b` (the dedup `Set`, shared with JS rule guards).
- **`{hash}.js`** — one file per unique rule, named after its hash
  (`hasher.ts`). Scriptlets call `<key>.r(...)`; JS rules are wrapped in a
  dedup guard against `<key>.b`.
- **`cleanup.js`** — `<key> = undefined` in a try/catch, always last, so by
  the time the page's own scripts run the binding looks like it never
  existed. A random key + reassign-to-`undefined` (instead of a fixed name,
  a `window` property, or `delete`) keeps pages from detecting or calling
  into the injected code.
- **`domains.js`** — `export const preregisteredDomains = [...]`.

## Files

| File | Purpose |
|------|---------|
| `config.ts` | `preregisteredDomains` — domains to generate bundles for. Add a domain here to register it. |
| `constants.ts` | Output filenames and shared Terser options |
| `generate-bundle.ts` | Orchestrates the pipeline above |
| `scriptlet-collector.ts` | `ScriptletCollector` — collects rules per domain via a real Engine |
| `path-exception-guard.ts` | Fails the build when a `$path`-scoped exception cancels a collected rule |
| `code-generators/` | One subfolder per generated file (coordination key, shared bundle, per-hash files, cleanup, domains list) |
| `writeHelpers.ts` | Validates generated JS syntax and writes it to disk |

The hash contract (`hashString`, `computeScriptletHash`,
`computeJsRuleHash`, `computeRuleHash`, `normalizeDomain`, filenames/dir
constants) lives in `@adguard/tswebextension`
(`src/lib/mv3/background/preregistered-scripts/hasher.ts`) and is imported
here via the Node-safe `@adguard/tswebextension/mv3/preregistered-scripts/hasher`
entry point, so build time and runtime always hash rules identically.

## Adding a domain

1. Add it to `config.ts`.
2. Run `pnpm resources:mv3`.
3. Output appears under `Extension/filters/<browser>/preregistered-scripts/`
   for each MV3 target (`chromium-mv3`, `opera-mv3`).

## Runtime

`@adguard/tswebextension`'s `PreregisteredScriptsService` handles
registration. The extension passes a `preregisteredScripts: { domains, path }`
MV3 `Configuration` field; `TsWebExtension.configure()` calls
`PreregisteredScriptsService.sync()`, which queries the engine per domain,
hashes matching rules with the same `hasher.ts`, and registers content
scripts via `chrome.scripting.registerContentScripts`.

`CosmeticApi` skips dynamic scriptlet/JS injection for domains covered by a
successfully synced registration, avoiding double execution. If sync fails,
the dynamic injection path stays active as a fallback.
