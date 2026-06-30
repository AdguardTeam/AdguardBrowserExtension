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

/* eslint-disable no-console */

import { minify } from 'terser';

import { scriptlets } from '@adguard/scriptlets';

import { NEWLINE_CHAR_UNIX } from '../../../../Extension/src/common/constants';

import { BUNDLE_TEMPLATE } from './shared-bundle-template';

/**
 * Builds the shared bundle body by filling `__FUNCTIONS__` and `__REGISTRY__`
 * markers in {@link BUNDLE_TEMPLATE}.
 *
 * @param functions Compiled scriptlet function definitions (minified).
 * @param registryEntries Comma-separated `"name": fnName` entries.
 *
 * @returns Assembled bundle body.
 */
const assembleTemplate = (
    functions: string[],
    registryEntries: string,
): string => {
    const source = BUNDLE_TEMPLATE.toString();
    const bodyStart = source.indexOf('{') + 1;
    const bodyEnd = source.lastIndexOf('}');

    return source
        .slice(bodyStart, bodyEnd)
        .replace('// __FUNCTIONS__', functions.join(NEWLINE_CHAR_UNIX))
        .replace('__REGISTRY__', `{${registryEntries}}`);
};

/**
 * Compiles the shared scriptlets bundle (`scriptlets-bundle.js`).
 *
 * Loaded once per page. Contains deduplicated scriptlet function definitions
 * and the `window._g` runner. Multiple loads are harmless — the IIFE is
 * guarded by `window._g._loaded`.
 *
 * @param scriptletNames Set of unique scriptlet names used across all domains.
 *
 * @returns Compiled shared bundle string, or `null` if no scriptlets.
 */
export const compileSharedScriptletsBundle = async (
    scriptletNames: Set<string>,
): Promise<string | null> => {
    const compiledStatements: string[] = [];

    for (const scriptletName of scriptletNames) {
        const scriptletFn = scriptlets.getScriptletFunction(scriptletName);
        if (!scriptletFn) {
            console.warn(`[generate-preregistered-domain-bundles] Unknown scriptlet: "${scriptletName}", skipping`);
            continue;
        }

        const minifiedFn = await minify(scriptletFn.toString(), {
            compress: { sequences: false },
            parse: { bare_returns: true },
        });

        if (minifiedFn.code) {
            compiledStatements.push(minifiedFn.code);
        }
    }

    if (compiledStatements.length === 0) {
        return null;
    }

    const registryEntries = [...scriptletNames]
        .filter((name) => scriptlets.getScriptletFunction(name))
        .map((name) => {
            const fn = scriptlets.getScriptletFunction(name);
            return `${JSON.stringify(name)}: ${fn!.name}`;
        })
        .join(',');

    const filled = assembleTemplate(
        compiledStatements,
        registryEntries,
    );

    return `(function () {${NEWLINE_CHAR_UNIX}${filled.trim()}${NEWLINE_CHAR_UNIX}})();${NEWLINE_CHAR_UNIX}`;
};
