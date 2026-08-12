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

import { minify as terserMinify } from 'terser';

/**
 * File names for generated bundles (tools-only).
 */
export const DOMAINS_LIST_FILENAME = 'domains.js';

/**
 * Minifies JavaScript code with Terser.
 *
 * The coverage hash attests the raw rule source, while the page executes the
 * minified output, so the transform must stay purely lexical: `compress` and
 * `mangle` are disabled to keep executed semantics identical to the hashed
 * source by construction. `bare_returns` stays disabled for the same reason —
 * a stray top-level `return` must not change semantics.
 *
 * @param code JavaScript source to minify.
 *
 * @returns Minified code.
 *
 * @throws If minification fails.
 */
export const minifyJs = async (code: string): Promise<string> => {
    const result = await terserMinify(code, {
        compress: false,
        mangle: false,
    });

    if (!result.code) {
        throw new Error('Terser minification failed');
    }

    return result.code;
};
