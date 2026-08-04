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
 * Template for the shared scriptlets bundle.
 *
 * `__PROP__` is replaced with the coordination key.
 *
 * The bundle carries only the runner — scriptlet implementations live in
 * per-function files registered separately, so each host downloads just the
 * functions its rules actually use. Per-function files populate the `.f`
 * registry before per-hash files invoke `.r`.
 *
 * The coordination object is a `window` property: per-hash files and the
 * cleanup file reference it as a bare identifier, and cleanup can fully
 * `delete` it (a lexical `let` binding would survive forever).
 *
 * `.r(name, source, args, key)` runs a scriptlet once per `key` (dedup via
 * `.b`, shared with JS-rule guards).
 */
export const BUNDLE_TEMPLATE = () => {
    // __BODY_START__
    try {
        window.__PROP__ = (function () {
            let dedupSet = new Set();

            return {
                r: function agRun(scriptletName, source, args, ruleKey) {
                    try {
                        if (dedupSet.has(ruleKey)) {
                            return;
                        }
                        dedupSet.add(ruleKey);
                        let fn = window.__PROP__.f[scriptletName];
                        if (fn) {
                            source.domainName = document.location.hostname;
                            fn.apply(null, [source, args]);
                        }
                    } catch (e) {
                        // Swallow — never break the page.
                    }
                },
                b: dedupSet,
                f: {},
            };
        })();
    } catch (e) {
        // Corrupted bundle (e.g. truncated write) must not break the page
        // or the per-hash files referencing __PROP__ — install a no-op shim.
        window.__PROP__ = {
            r: function () {},
            b: new Set(),
            f: {},
        };
    }
    // __BODY_END__
};
