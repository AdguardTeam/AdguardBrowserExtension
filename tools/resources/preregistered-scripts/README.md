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
    SC -->|AST predicates| AG[agtree / dnr-rulesets]
    SC -->|hash rules| HASH[hasher.ts]
    GEN -->|2 completeness check| AHC[assert-hash-completeness.ts]
    GEN -->|3 coordination key| CK[coordination-key.ts]
    GEN -->|4 shared bundle| SB[shared-bundle-generator]
    GEN -->|5 per-hash files| PH[per-hash-generator]
    GEN -->|6 cleanup file| CL[cleanup-generator]
    GEN -->|7 domains list| DL[domains-list.ts]
    RT[PreregisteredScriptsService] -->|same hasher.ts| HASH
    RT --> CP[chrome.scripting]
    PH --> CP
    SB --> CP
    CL --> CP
```

Build-time (this folder) and runtime
(`@adguard/tswebextension`'s `PreregisteredScriptsService`) both import the
**same** `hasher.ts` from `@adguard/tswebextension/mv3/preregistered-scripts`
to compute rule hashes. This shared contract is what lets the runtime map
"cosmetic rules the engine returns for a domain" to "which `{hash}.js` files
to register", without ever transmitting rule content at runtime — only
hashes.

## Pipeline

`generate-bundle.ts` runs the following steps per MV3 browser target:

| Step | Function | Purpose |
|------|----------|---------|
| 1. Collect | `ScriptletCollector.collect()` (`scriptlet-collector.ts`) | Walk all DNR rulesets, extract JS/scriptlet rules targeting preregistered domains, dedup by hash |
| 2. Completeness check | `assertHashCompleteness()` (`assert-hash-completeness.ts`) | Independently re-derive, using the real `@adguard/tsurlfilter` `Engine`, which hashes are reachable per domain, and fail the build if any of them wasn't collected in step 1 |
| 3. Coordination key | `generateCoordinationKey()` (`code-generators/coordination-key.ts`) | Generate a random per-build `window` property name shared by the shared bundle, per-hash files, and the cleanup file |
| 4. Shared bundle | `writeSharedBundle` (`code-generators/shared-bundle-generator/`) | Compile `scriptlets-bundle.js` — every unique scriptlet function used, deduplicated |
| 5. Per-hash files | `writePerHashFiles` (`code-generators/per-hash-generator/`) | Compile one `{hash}.js` per unique rule (scriptlet invocation or JS rule body) |
| 6. Cleanup file | `writeCleanupFile` (`code-generators/cleanup-generator/`) | Compile `cleanup.js`, which deletes the coordination property before any page script can run |
| 7. Domains list | `writeDomainsList` (`code-generators/domains-list.ts`) | Write `domains.js` — the list of domains that have at least one collected rule |
| 8. Atomic swap | `generatePreregisteredDomainBundles` (`generate-bundle.ts`) | Write everything to a temp dir, then `fs.rename` it over the old output dir, so a failure never leaves partially-written output in place |

`ScriptletCollector` does **not** resolve filter enable/disable, allowlist, or
user-rule state at build time — it only records which domains/rules exist in
the local filters. Exceptions (`#@#`/`#@%#`) and all other engine-side
resolution are handled at runtime by `PreregisteredScriptsService`, which
queries the live engine (`getCosmeticResult`) per domain.

`isRuleTargetsDomain` (used by step 1) mirrors the engine's own domain-list
semantics: a domain list made up **only** of exception entries (e.g.
`~a.com,~b.com##...`) applies globally except on the listed domains, exactly
like a fully generic rule minus the exclusions — it is *not* treated as
"matches nothing". Step 2 exists specifically to catch future regressions
of this kind before they reach production: if the build-time predicate ever
diverges from the engine's real matching again, the build fails instead of
silently shipping a domain registration that references a missing
`{hash}.js` file (which Chrome rejects at runtime).

## Generated bundle structure

Each domain's registration loads three kinds of files, always in this order:
`scriptlets-bundle.js` → its `{hash}.js` files → `cleanup.js` (see
`PreregisteredScriptsService.buildDomainScripts`, which builds this exact
`js` array). All of them coordinate through a **single random `window`
property**, generated once per build (`coordination-key.ts`) — never a fixed
name like `_ag`. This exists to avoid leaving a stable, guessable,
page-readable global behind: see [Why a random coordination key + cleanup
file](#why-a-random-coordination-key--cleanup-file) below.

### `scriptlets-bundle.js`

An IIFE loaded once per page (guard: `if (window[coordinationKey]) return`).
Defines the coordination object as a **non-enumerable** property (so it
doesn't show up via `for...in`/`Object.keys`/`JSON.stringify`, though it's
still visible via `Object.getOwnPropertyNames` — hence the cleanup file):

- `.r(name, source, args, key)` — run a scriptlet with dedup by `key`.
- `.b` — `Set` used for dedup, shared with JS rule guards.

### `{hash}.js`

One file per unique rule, named after its SHA-256 hash (see `hasher.ts`):

- Scriptlet rules: `window[coordinationKey].r("name", {...source}, [...args], "hash")`.
- JS injection rules: rule body wrapped in a dedup guard against
  `window[coordinationKey].b` (see `js-rule-guard-template.js`).

### `cleanup.js`

`delete window[coordinationKey];` wrapped in a try/catch. Always registered
as the **last** entry in a domain's `js` array. Content scripts registered
with `runAt: 'document_start'` all run, in order, before the page's own
scripts get a chance to run — so by the time page code executes, the
coordination property is already gone; page code never observes it.

### Why a random coordination key + cleanup file

Without this, a fixed global like `window._ag` would let any page detect the
extension (`window._ag?.b instanceof Set && typeof window._ag?.r === 'function'`),
read `.b` to learn which specific rule hashes fired on the page, and call
`.r(name, source, args, key)` directly with attacker-controlled arguments to
invoke any bundled scriptlet by name. Randomizing the property name alone,
or making it non-enumerable alone, is insufficient — page code can still
enumerate `Object.getOwnPropertyNames(window)` to find it. Deleting it before
any page script runs closes that gap regardless of the name.

### `domains.js`

```typescript
export const preregisteredDomains = ["youtube.com", "m.youtube.com", ...];
```

## Files

| File | Purpose |
|------|---------|
| `config.ts` | `preregisteredDomains` — domains to generate bundles for. Add a domain here to register it. |
| `constants.ts` | `DOMAINS_LIST_FILENAME` and `minifyJs` (shared Terser options) |
| `generate-bundle.ts` | Orchestrator — runs collect → completeness check → coordination key → shared bundle → per-hash files → cleanup file → domains list |
| `scriptlet-collector.ts` | AST predicates (`isGenericCosmeticRule`, `isScriptletRule`, `isRuleTargetsDomain`, `extractScriptletNameAndArgs`) + the `ScriptletCollector` class |
| `assert-hash-completeness.ts` | `assertHashCompleteness` — cross-validates collected hashes against a real `@adguard/tsurlfilter` `Engine` instance |
| `code-generators/coordination-key.ts` | `generateCoordinationKey` — random per-build `window` property name |
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
`@adguard/tswebextension/mv3/preregistered-scripts` entry point — not in this
folder.

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
