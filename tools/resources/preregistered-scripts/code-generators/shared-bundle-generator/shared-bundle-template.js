/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

// @ts-nocheck
/* eslint-disable */

/**
 * Template for the shared scriptlets bundle (`scriptlets-bundle.js`).
 *
 * ## Build-time
 *
 * **Never executed directly.** `shared-bundle-generator.ts`:
 * 1. Calls `.toString()` to extract the body.
 * 2. Replaces `__FUNCTIONS__` with all used scriptlet function sources.
 * 3. Replaces `__REGISTRY__` with `{"name": fnRef, ...}`.
 * 4. Replaces `__PROP__` with `JSON.stringify(coordinationKey)` — a random,
 *    per-build `window` property name (see `coordination-key.ts`).
 * 5. Wraps in `(function(){...})()` and minifies with terser.
 *
 * ## Runtime (MAIN world, `document_start`)
 *
 * Loaded once per page (guard: `if (window[__PROP__]) return`).
 *
 * - Defines all scriptlet functions (registry maps name → function).
 * - Defines `window[__PROP__] = { r, b }` as a non-enumerable property — the
 *   only public API, and only public for the brief window before the
 *   cleanup file (loaded last, see `code-generators/cleanup-generator/`)
 *   deletes it, before any page script runs.
 * - `.r(name, source, args, key)` — deduplicates by `key`, sets
 *   `source.domainName` from `document.location.hostname`, then executes
 *   the scriptlet function (no-op if not found). `source.verbose` stays
 *   baked in as `false` — `debugScriptlets` isn't available in MAIN world.
 * - `.b` — `Set` of executed rule keys for dedup (shared with JS rule guards).
 */
export const BUNDLE_TEMPLATE = () => {
    // __BODY_START__
    if (window[__PROP__]) {
        return;
    }
    let dedupSet = new Set();
    __FUNCTIONS__ /* replaced with minified scriptlet function sources */
    let functionRegistry = __REGISTRY__; /* replaced with {"name": fnRef, ...} */

    Object.defineProperty(window, __PROP__, {
        value: {
            r: function agRun(scriptletName, source, args, ruleKey) {
                try {
                    if (dedupSet.has(ruleKey)) {
                        return;
                    }
                    dedupSet.add(ruleKey);
                    let fn = functionRegistry[scriptletName];
                    if (fn) {
                        source.domainName = document.location.hostname;
                        fn.apply(null, [source, args]);
                    }
                } catch (e) {
                    // Swallow — never break the page.
                }
            },
            b: dedupSet,
        },
        configurable: true,
        enumerable: false,
    });
    // __BODY_END__
};
