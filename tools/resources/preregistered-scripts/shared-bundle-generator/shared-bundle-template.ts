/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * Template for the shared scriptlets bundle IIFE.
 *
 * Written as readable JavaScript. `.toString()` extracts the body,
 * then markers `__FUNCTIONS__` and `__REGISTRY__` are replaced at build time.
 *
 * This file exists separately to keep `@ts-nocheck` and `eslint-disable`
 * self-contained — the template IS JavaScript, not TypeScript.
 */

// @ts-nocheck
/* eslint-disable */

/**
 * IIFE template for the shared scriptlets bundle (`scriptlets-bundle.js`).
 *
 * ## How it works
 *
 * **Never executed** — only `.toString()` is called at build time.
 * The function body is extracted, markers are replaced with generated
 * content, and the result is wrapped in `(function () { ... })();`.
 *
 * | Marker | Replaced with |
 * |---|---|
 * | `// __FUNCTIONS__` | Minified source of every used scriptlet function |
 * | `__REGISTRY__` | `{"name": fnName, ...}` object literal |
 *
 * ## Variable roles (in generated output)
 *
 * - `_b: Set` — deduplication guard. `_g.r` checks `_b.has(key)` before
 *   executing a scriptlet. Per-domain JS rules check `_g.b.has(key)`.
 * - `_c: Object` — private placeholder for scrubbed references. When
 *   scriptlet source replaces `Window.prototype.toString` with `_c`, this
 *   object serves as the replacement target.
 * - `_f: Record<string, Function>` — function registry. Maps scriptlet
 *   names (e.g. `"abort-on-property-read"`) to their minified function
 *   references so `_g.r` can dispatch by name.
 * - `_g: { r, b, c, _loaded }` — global API exposed on `window`.
 *   `_g.r(name, source, args, key)` is called by per-domain bundles.
 *   `_g.b` and `_g.c` alias `_b` and `_c` for cross-file access.
 *   `_g._loaded` prevents double execution when multiple registrations
 *   load this file on the same page.
 */
const BUNDLE_TEMPLATE = () => {
    if (window._g && window._g._loaded) { return; }
    var _b = new Set();
    var _c = {};
    // __FUNCTIONS__
    var _f = __REGISTRY__;
    window._g = {
        r: function _agRun(n, s, a, k) {
            try {
                if (_b.has(k)) { return; }
                _b.add(k);
                var fn = _f[n];
                if (fn) { fn.apply(null, [s].concat(a)); }
            } catch (e) {}
        },
        b: _b,
        c: _c,
        _loaded: true,
    };
};

export { BUNDLE_TEMPLATE };
