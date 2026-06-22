# Preregistered Scripts Configuration

This directory contains the preregistered-domain script bundle generator and its
configuration. The system produces pre-compiled JavaScript bundles for
domains that are preregistered to user experience (e.g. `youtube.com`). These
bundles are injected early via MV3's `chrome.scripting.registerContentScripts`
and persist across browser sessions, ensuring ad-blocking rules run before
the page's own scripts.

## How it works

1. **config.json** defines per-domain exclusions and source replacements.
2. **config.ts** loads and validates `config.json`, converting string regex
   patterns into `RegExp` objects at build time.
3. **generate-bundle.ts** reads pre-built MV3 filter lists, filters rules
   against the config, and emits per-(domain, filterId) JavaScript bundles
   plus a registry mapping domains to filter IDs.
4. At runtime, **PreregisteredScriptsService** reads the registry and registers
   each bundle via `chrome.scripting.registerContentScripts` with
   `persistAcrossSessions: true`.

## Key concepts

All fields in `config.json` are **optional** — omit any field you don't need.
An empty domain entry `{}` is valid and means "include everything with defaults".

### Scriptlet inclusions (whitelist mode)

When you know exactly which scriptlets should run on a domain, use a whitelist
instead of excluding individual scriptlets. When `includedScriptlets` is set
to a non-empty array, **only** the listed scriptlet names are included in
bundles. `scriptletExclusions` is ignored in whitelist mode.

```json
{
  "youtube.com": {
    "includedScriptlets": [
      "set-constant",
      "json-prune"
    ]
  }
}
```

### Custom JS rule inclusions

Filter lists contain complex custom JavaScript rules (raw `#%#(()=>{...})()`
blocks) that are not named scriptlets. Use `includedCustomRules` to control
which custom JS rules are included:

- **Omitted** → all custom JS rules are included (backward compatible).
- **Empty array `[]`** → no custom JS rules at all.
- **Array with patterns** → only custom JS rules whose body matches at least one pattern are included.

```json
{
  "youtube.com": {
    "includedCustomRules": []
  }
}
```

Each pattern entry:
- `pattern` — a regex in `/pattern/flags` format to test against the rule body.
- `description` (optional) — human-readable note about what the pattern matches.

### Filter ID whitelist

By default, all filter IDs are processed for each domain. Use
`includedFilterIds` to restrict which filters' rules go into bundles:

```json
{
  "youtube.com": {
    "includedFilterIds": ["1", "2", "3"]
  }
}
```

When set, only rules from the listed filter IDs are considered for the domain.

### Scriptlet exclusions (blacklist mode — default)

Some scriptlets use patterns that are detectable by anti-adblock systems
(e.g. YouTube's). When a scriptlet rule is excluded, it is **omitted** from
the preregistered-domain bundle for that domain. The rule still runs normally
through the standard content-script injection path — it just won't be
injected via the preregistered early-injection mechanism.

Each exclusion specifies:
- `name` — the scriptlet name (e.g. `"abort-current-inline-script"`).
- `argMatch` (optional) — a regex in `/pattern/flags` format. If present,
  only rules whose **first argument** matches the pattern are excluded.
  If absent, **all** rules with that scriptlet name are excluded.

> **Note**: `includedScriptlets` (whitelist) takes precedence over
> `scriptletExclusions` (blacklist). When `includedScriptlets` is non-empty,
> `scriptletExclusions` is ignored.

### Scriptlet source replacements

Anti-adblock systems may scan injected code for identifiable strings like
`"AdGuard"`, `"scriptlet"`, or known function names. Source replacements
allow scrubbing these strings from scriptlet function bodies before they
are injected into preregistered-domain pages.

Each replacement specifies:
- `pattern` — a regex in `/pattern/flags` format to find in the source.
- `replacement` — the string to substitute.

## File reference

| File | Purpose |
| --- | --- |
| `config.json` | Per-domain config (hand-edited). All fields optional. |
| `config.ts` | Typed loader: parses `config.json`, converts string regex → `RegExp`, exports `preregisteredDomains`. |
| `generate-bundle.ts` | Generates `.js` bundles and `registry.js` from MV3 filter lists. |

Downstream consumers:

| File | Purpose |
| --- | --- |
| `tools/gen.ts` | Entry point that invokes `generatePreregisteredDomainBundles` for each MV3 browser. |
| `tools/resources-mv3.ts` | Calls `gen.ts` during `pnpm resources:mv3`. |
| `Extension/src/background/services/preregistered-scripts/preregistered-scripts-service-mv3.ts` | Runtime service that registers bundles from the registry. |

## Adding a new preregistered domain

1. Add a top-level key to `config.json` for the new domain:

   ```json
   {
     "youtube.com": { ... },
     "new-domain.com": {}
   }
   ```

   All fields are optional — an empty object `{}` includes everything.

2. Run `pnpm resources:mv3` to regenerate the bundles. Verify output in
   `Extension/filters/chromium-mv3/preregistered-scripts/` and
   `Extension/filters/opera-mv3/preregistered-scripts/`.

3. Test the extension on the new domain to confirm bundles are injected
   correctly and the domain's anti-adblock systems are not triggered.

## Adding a scriptlet exclusion

When YouTube (or another preregistered domain) detects a scriptlet and breaks
functionality, exclude it from the early-injection bundle.

1. Open `config.json`.
2. Add an entry to the domain's `scriptletExclusions` array:

   ```json
   { "name": "scriptlet-name" }
   ```

   To exclude only rules with a specific first argument:

   ```json
   { "name": "scriptlet-name", "argMatch": "/^somePattern/" }
   ```

3. Run `pnpm resources:mv3` to regenerate bundles.
4. Verify the scriptlet no longer appears in the bundle for that domain by
   inspecting the generated `.js` files in
   `Extension/filters/chromium-mv3/preregistered-scripts/` and
   `Extension/filters/opera-mv3/preregistered-scripts/`.

## Adding a source replacement

When JavaScript's anti-adblock detects identifiable strings in injected
scriptlet source code, add replacements to obscure them.

1. Open `config.json`.
2. Add an entry to the domain's `scriptletSourceReplacements` array:

   ```json
   {
     "pattern": "/identifiableString/g",
     "replacement": "_x"
   }
   ```

   **Important**: Use the global flag (`/g`) to replace all occurrences.

3. Run `pnpm resources:mv3` to regenerate bundles.
4. Inspect the bundle output to confirm the string is replaced. If the
   pattern is not found, the build will emit a warning — this means the
   upstream scriptlet source has changed and the replacement may no longer
   be needed (or needs updating).

## Updating existing rules

### When a scriptlet source changes upstream

Scriptlet functions come from `@adguard/scriptlets`. When a scriptlet is
updated, the source replacements defined in `config.json` may no longer
match. The build warns about missing patterns:

```
[generate-preregistered-domain-bundles] Expected pattern "/Window\.prototype\.toString/g" not found in scriptlet source
```

To fix:

1. Check the current source of the scriptlet function (browse
   `@adguard/scriptlets` source or inspect the built output).
2. Update the `pattern` in `config.json` to match the new source.
3. Run `pnpm resources:mv3` and confirm the warning disappears.

### When a new anti-adblock check appears

If YouTube starts detecting a scriptlet that was previously safe:

1. Identify which scriptlet is being detected (check browser console for
   errors or YouTube's behavior changes).
2. Add a `scriptletExclusions` entry (see above).
3. If only specific strings within the scriptlet are detected, add
   `scriptletSourceReplacements` instead of excluding the whole scriptlet.

### When an exclusion is no longer needed

If the upstream situation changes (e.g. YouTube removes a detection
mechanism), remove the corresponding entry from `config.json` and run
`pnpm resources:mv3` to include the scriptlet in bundles again.

## Configuration schema

All fields are optional. Omit any field you don't need.

```typescript
// Top-level: domain → config
type JsonConfig = Record<string, {
    // Whitelist mode: only these named scriptlets are included.
    // When non-empty, scriptletExclusions is ignored.
    includedScriptlets?: string[];

    // Custom JS rule whitelist. Omitted = include all. [] = exclude all.
    includedCustomRules?: Array<{
        pattern: string;        // Regex in /pattern/flags format
        description?: string;   // Human-readable note (optional)
    }>;

    // Only process rules from these filter IDs. Omitted = all filters.
    includedFilterIds?: string[];

    // Blacklist mode (default): scriptlets to exclude.
    // Ignored when includedScriptlets is non-empty.
    scriptletExclusions?: Array<{
        name: string;           // Scriptlet name to exclude
        argMatch?: string;      // Optional regex to match first argument
    }>;

    // String replacements applied to scriptlet source code.
    scriptletSourceReplacements?: Array<{
        pattern: string;        // Regex in /pattern/flags format
        replacement: string;    // Substitution string
    }>;
}>;
```

Regex strings must use the `/pattern/flags` format (e.g.
`"/^document\\.write/"`, `"/Window\\.prototype\\.toString/g"`). The config
loader (`config.ts`) validates this format at build time and throws if a
string is malformed.

## Build integration

The preregistered-scripts bundle generation runs automatically as part of
`pnpm resources:mv3`. You do not need to invoke it separately.

```bash
pnpm resources:mv3
```

This command:
1. Downloads the latest filter lists (`@adguard/dnr-rulesets`).
2. Extracts unsafe rules (`dnr-rulesets exclude-unsafe-rules`).
3. Generates preregistered-domain bundles (invokes `generate-bundle.ts` via
   `tools/resources-mv3.ts`).

Generated output lands in:
- `Extension/filters/chromium-mv3/preregistered-scripts/` — per-filter `.js`
  bundles and `registry.js`.
- `Extension/filters/opera-mv3/preregistered-scripts/` — same for Opera MV3.

These files are committed to the repository and shipped with the extension.
