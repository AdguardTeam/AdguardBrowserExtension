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
 * 4. Wraps in `(function(){...})()` and minifies with terser.
 *
 * ## Runtime (MAIN world, `document_start`)
 *
 * Loaded once per page (guard: `if (window._ag) return`).
 *
 * - Defines all scriptlet functions (registry maps name → function).
 * - Creates `window._ag = { r, b }` — the only public API.
 * - `_ag.r(name, source, args, key)` — deduplicates by `key`, then executes
 *   the scriptlet function. If the function is not found, the call is a no-op.
 * - `_ag.b` — `Set` of executed rule keys for dedup (shared with JS rule guards).
 */
export const BUNDLE_TEMPLATE = () => {
    if (window._ag) {
        return;
    }
    let dedupSet = new Set();
    __FUNCTIONS__ /* replaced with minified scriptlet function sources */
    let functionRegistry = __REGISTRY__; /* replaced with {"name": fnRef, ...} */

    window._ag = {
        r: function agRun(scriptletName, source, args, ruleKey) {
            try {
                if (dedupSet.has(ruleKey)) {
                    return;
                }
                dedupSet.add(ruleKey);
                let fn = functionRegistry[scriptletName];
                if (fn) {
                    fn.apply(null, [source, args]);
                }
            } catch (e) {
                // Swallow — never break the page.
            }
        },
        b: dedupSet,
    };
};
