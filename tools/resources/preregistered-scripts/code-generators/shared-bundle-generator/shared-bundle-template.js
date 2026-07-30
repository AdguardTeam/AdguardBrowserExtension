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
 * `__FUNCTIONS__`/`__REGISTRY__`/`__PROP__` are replaced with the scriptlet
 * sources, the name→fn registry and the bare coordination key identifier,
 * then minified (Terser keeps top-level names, so `__PROP__` stays
 * identical across the independently-minified files).
 *
 * `let __PROP__` must stay top-level: other classic scripts (per-hash
 * files, cleanup.js) reference it directly, and a lexical binding is
 * invisible to `window` enumeration.
 *
 * `.r(name, source, args, key)` runs a scriptlet once per `key` (dedup via
 * `.b`, shared with JS-rule guards).
 */
export const BUNDLE_TEMPLATE = () => {
    // __BODY_START__
    let __PROP__;
    try {
        __PROP__ = (function () {
            let dedupSet = new Set();
            __FUNCTIONS__ /* replaced with minified scriptlet function sources */
            let functionRegistry = __REGISTRY__; /* replaced with {"name": fnRef, ...} */

            return {
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
            };
        })();
    } catch (e) {
        // Corrupted bundle (e.g. truncated write) must not break the page
        // or the per-hash files referencing __PROP__ — install a no-op shim.
        __PROP__ = {
            r: function () {},
            b: new Set(),
        };
    }
    // __BODY_END__
};
