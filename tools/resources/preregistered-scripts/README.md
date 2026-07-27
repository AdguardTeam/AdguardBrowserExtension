# Preregistered Scripts

Build tool that produces pre-compiled JavaScript bundles for domains where
ad-blocking rules must run before the page's own scripts (e.g. `youtube.com`).
Bundles are injected at `document_start` via MV3's
`chrome.scripting.registerContentScripts` and persist across browser sessions.

## Architecture

```mermaid
flowchart TD
    CFG[config.ts] -->|preregisteredDomains| GEN[generate-bundle.ts]
    GEN -->|1 collect| SC[scriptlet-collector.ts]
    SC -->|builds a real Engine per ruleset| TSURL["@adguard/tsurlfilter Engine"]
    SC -->|hash matched rules| HASH[hasher.ts]
    GEN -->|2 coordination key| CK[coordination-key.ts]
    GEN -->|3 shared bundle| SB[shared-bundle-generator]
    GEN -->|4 per-hash files| PH[per-hash-generator]
    GEN -->|5 cleanup file| CL[cleanup-generator]
    GEN -->|6 domains list| DL[domains-list.ts]
    RT[PreregisteredScriptsService] -->|same hasher.ts| HASH
    RT --> CP[chrome.scripting]
    PH --> CP
    SB --> CP
    CL --> CP
```

Build-time (this folder) and runtime
(`@adguard/tswebextension`'s `PreregisteredScriptsService`) both import the
**same** `hasher.ts` from `@adguard/tswebextension/mv3/preregistered-scripts/hasher`
to compute rule hashes. This shared contract is what lets the runtime map
"cosmetic rules the engine returns for a domain" to "which `{hash}.js` files
to register", without ever transmitting rule content at runtime — only
hashes.

## Pipeline

`generate-bundle.ts` runs the following steps per MV3 browser target:

| Step | Function | Purpose |
|------|----------|---------|
| 1. Collect | `ScriptletCollector.collect()` (`scriptlet-collector.ts`) | For each DNR ruleset, build a real `@adguard/tsurlfilter` `Engine` from its raw filter list text and query `Engine.getJsRulesIgnoringPath(request)` per preregistered domain (+ `www.` alias); dedup matched rules by hash |
| 2. Coordination key | `generateCoordinationKey()` (`code-generators/coordination-key.ts`) | Generate a random per-build identifier shared by the shared bundle, per-hash files, and the cleanup file |
| 3. Shared bundle | `writeSharedBundle` (`code-generators/shared-bundle-generator/`) | Compile `scriptlets-bundle.js` — every unique scriptlet function used, deduplicated |
| 4. Per-hash files | `writePerHashFiles` (`code-generators/per-hash-generator/`) | Compile one `{hash}.js` per unique rule (scriptlet invocation or JS rule body); wraps the body in a runtime `location.pathname` guard when the rule has a `$path` modifier |
| 5. Cleanup file | `writeCleanupFile` (`code-generators/cleanup-generator/`) | Compile `cleanup.js`, which reassigns the coordination binding to `undefined` before any page script can run |
| 6. Domains list | `writeDomainsList` (`code-generators/domains-list.ts`) | Write `domains.js` — the list of domains that have at least one collected rule |
| 7. Atomic swap | `generatePreregisteredDomainBundles` (`generate-bundle.ts`) | Write everything to a temp dir, then `fs.rename` it over the old output dir, so a failure never leaves partially-written output in place |

`ScriptletCollector` does **not** resolve filter enable/disable, allowlist, or
user-rule state at build time — it only records which domains/rules exist in
the local filters. Exceptions (`#@#`/`#@%#`) and all other engine-side
resolution are handled at runtime by `PreregisteredScriptsService`, which
queries the live engine (`getCosmeticResult`) per domain.

Step 1 queries the *same* real engine that resolves rules at runtime
(`Engine.getJsRulesIgnoringPath`, type-isolated to JS/scriptlet rules and
already excluding exception/allowlist rules) — there is no separate
hand-rolled domain-matching predicate to keep in sync with the engine, and
therefore no separate completeness-check step: what the engine matches *is*
what gets collected. This also means filter list conversion (e.g. uBO-syntax
scriptlet calls resolved to their AdGuard `ubo-`-prefixed counterpart via
`RawRuleConverter.convertToAdg`) is applied consistently, since collection
goes through the exact same `FilterList` loading path the runtime engine uses.

## Generated bundle structure

Each domain's registration loads three kinds of files, always in this order:
`scriptlets-bundle.js` → its `{hash}.js` files → `cleanup.js` (see
`PreregisteredScriptsService.buildDomainScripts`). All of them coordinate
through a single random top-level `let` variable, generated once per build
(`coordination-key.ts`) — never a fixed name like `_ag`. See
[Why a random coordination key + cleanup file](#why-a-random-coordination-key--cleanup-file).

### `scriptlets-bundle.js`

Declares `let <coordinationKey> = (...)` at the top level (not inside any
wrapping IIFE, not a `window` property) — a lexical binding, invisible to
`Object.keys`/`getOwnPropertyNames`/`for...in`. Other classic scripts in the
same realm (per-hash files, `cleanup.js`) reference the bare identifier
directly (standard JS semantics for scripts sharing one realm).

- `.r(name, source, args, key)` — run a scriptlet, deduped by `key`.
- `.b` — `Set` used for dedup, shared with JS rule guards.

No double-injection guard needed: `registerContentScripts` injects each
file once per document; redeclaring the `let` would throw `SyntaxError`
anyway if it somehow ran twice.

### `{hash}.js`

One file per unique rule, named after its SHA-256 hash (see `hasher.ts`):

- Scriptlet rules: `<coordinationKey>.r("name", {...source}, [...args], "hash")`.
- JS injection rules: rule body wrapped in a dedup guard against
  `<coordinationKey>.b` (see `js-rule-guard-template.js`).

### `cleanup.js`

`<coordinationKey> = undefined;` in a try/catch — reassigns the bundle's
`let` (lexical bindings can't be `delete`d). Always the last entry in a
domain's `js` array; `document_start` guarantees it runs before any page
script, so `typeof <name>` is already `'undefined'` by the time the page
runs, indistinguishable from never having existed — even if the page knows
the exact identifier.

### Why a random coordination key + cleanup file

A fixed global like `window._ag` would let any page detect the extension,
read `.b` to see which rule hashes fired, and call `.r(...)` directly with
attacker-controlled args. Randomizing the name alone isn't enough against an
attacker who extracts the literal identifier from a published build. Using
a lexical `let` (not a `window` property) closes enumeration; reassigning it
to `undefined` in cleanup (instead of `delete`, which `let` doesn't support)
closes the remaining "does it still exist" signal, since `typeof` can't tell
"declared and `undefined`" apart from "never declared".

### `domains.js`

```typescript
export const preregisteredDomains = ["youtube.com", ...];
```

## Files

| File | Purpose |
|------|---------|
| `config.ts` | `preregisteredDomains` — domains to generate bundles for. Add a domain here to register it. |
| `constants.ts` | `DOMAINS_LIST_FILENAME` and `minifyJs` (shared Terser options) |
| `generate-bundle.ts` | Orchestrator — runs collect → coordination key → shared bundle → per-hash files → cleanup file → domains list |
| `scriptlet-collector.ts` | `ScriptletCollector` — builds a real `@adguard/tsurlfilter` `Engine` per ruleset and queries it per preregistered domain |
| `code-generators/coordination-key.ts` | `generateCoordinationKey` — random per-build top-level `let` identifier |
| `code-generators/shared-bundle-generator/` | `shared-bundle-template.js` (runtime template) + `shared-bundle-generator.ts` (compiler) |
| `code-generators/per-hash-generator/` | `js-rule-guard-template.js` (runtime template) + `write-per-hash-files.ts` (compiler) |
| `code-generators/cleanup-generator/` | `cleanup-template.js` (runtime template) + `write-cleanup-file.ts` (compiler) |
| `code-generators/domains-list.ts` | `writeDomainsList` |
| `writeHelpers.ts` | `writeBundle` — validates JS syntax (`vm.Script`) and writes to disk |

The shared hash contract (`hashString`, `computeScriptletHash`,
`computeJsRuleHash`, `normalizeDomain`, `SHARED_BUNDLE_FILENAME`,
`CLEANUP_BUNDLE_FILENAME`, `PREREGISTERED_SCRIPTS_DIR`) lives in
`@adguard/tswebextension`
(`src/lib/mv3/background/preregistered-scripts/hasher.ts`), exported via the
`@adguard/tswebextension/mv3/preregistered-scripts/hasher` entry point (a
separate, Node-safe entry — importing it does not pull in the browser-only
`PreregisteredScriptsService`) — not in this folder.

## Adding a new domain

1. Add the domain to `config.ts`:

   ```typescript
   export const preregisteredDomains: readonly string[] = [
       'youtube.com',
       'new-domain.com', // ← add here
   ];
   ```

2. Run `pnpm resources:mv3` to regenerate bundles.

3. Output appears in
   `Extension/filters/<browser>/preregistered-scripts/` for each MV3 browser
   target (e.g. `chromium-mv3`, `opera-mv3`).

## Runtime

At runtime, `@adguard/tswebextension` handles preregistered script
registration. The extension passes `preregisteredScriptDomains` and
`preregisteredScriptsPath` via the MV3 `Configuration` object;
`TsWebExtension.configure()` calls `PreregisteredScriptsService.sync()`,
which queries the engine per domain, computes rule hashes with the same
`hasher.ts`, and registers content scripts via
`chrome.scripting.registerContentScripts`. Each registration includes the
shared bundle, the per-hash files, and the cleanup file for that domain, in
that order:

```typescript
js: [
    'filters/preregistered-scripts/scriptlets-bundle.js',
    'filters/preregistered-scripts/{hash}.js',
    // ...one entry per unique rule hash active on this domain
    'filters/preregistered-scripts/cleanup.js',
]
```

`CosmeticApi` skips dynamic script/scriptlet injection for domains covered by
a successfully synced preregistered registration, avoiding double execution.
Filter enable/disable state, user rules, and allowlist entries are resolved
by the engine on every `configure()` call, so registrations stay in sync
without any additional build step.
