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

import { scriptlets } from '@adguard/scriptlets';

import { NEWLINE_CHAR_UNIX } from '../../../../../Extension/src/common/constants';
import { minifyJs } from '../../constants';
import { assertNoTemplateSentinels } from '../../writeHelpers';

import { BUNDLE_TEMPLATE } from './shared-bundle-template';

/**
 * Explicit sentinel comments marking the extractable body inside
 * {@link BUNDLE_TEMPLATE}. Using explicit markers (instead of locating the
 * first `{`/last `}` in the stringified function) keeps extraction correct
 * regardless of how the template's signature or surrounding code is written.
 */
const BODY_START_MARKER = '// __BODY_START__';
const BODY_END_MARKER = '// __BODY_END__';

/**
 * Builds the shared bundle body by filling `__FUNCTIONS__`, `__REGISTRY__`
 * and `__PROP__` markers in {@link BUNDLE_TEMPLATE}.
 *
 * @param functions Compiled scriptlet function definitions (minified).
 * @param registryEntries Comma-separated `"name": fnName` entries.
 * @param coordinationKey Random per-build `window` property name (see
 * `coordination-key.ts`), shared with the per-hash files and the cleanup file.
 *
 * @returns Assembled bundle body.
 */
const assembleTemplate = (
    functions: string[],
    registryEntries: string,
    coordinationKey: string,
): string => {
    const source = BUNDLE_TEMPLATE.toString();
    const bodyStart = source.indexOf(BODY_START_MARKER) + BODY_START_MARKER.length;
    const bodyEnd = source.indexOf(BODY_END_MARKER);

    const propLiteral = JSON.stringify(coordinationKey);

    const filled = source
        .slice(bodyStart, bodyEnd)
        .replace('__FUNCTIONS__', () => functions.join(NEWLINE_CHAR_UNIX))
        .replace('__REGISTRY__', () => `{${registryEntries}}`)
        .replace(/__PROP__/g, () => propLiteral);

    assertNoTemplateSentinels(filled, ['__FUNCTIONS__', '__REGISTRY__', '__PROP__']);

    return filled;
};

/**
 * Compiles the shared scriptlets bundle (`scriptlets-bundle.js`).
 *
 * Loaded once per page. Contains deduplicated scriptlet function definitions
 * and the coordination-key runner. Multiple loads are harmless — the IIFE is
 * guarded by `if (window[__PROP__]) return`.
 *
 * @param scriptletNames Set of unique scriptlet names used across all domains.
 * @param coordinationKey Random per-build `window` property name (see
 * `coordination-key.ts`), shared with the per-hash files and the cleanup file.
 *
 * @returns Compiled shared bundle string, or `null` if no scriptlets.
 */
export const compileSharedScriptletsBundle = async (
    scriptletNames: Set<string>,
    coordinationKey: string,
): Promise<string | null> => {
    const rawFunctions: string[] = [];

    for (const scriptletName of scriptletNames) {
        const scriptletFn = scriptlets.getScriptletFunction(scriptletName);
        if (!scriptletFn) {
            console.warn(`[generate-preregistered-domain-bundles] Unknown scriptlet: "${scriptletName}", skipping`);
            continue;
        }

        rawFunctions.push(scriptletFn.toString());
    }

    if (rawFunctions.length === 0) {
        return null;
    }

    const registryEntries = [...scriptletNames]
        .map((name) => {
            const fn = scriptlets.getScriptletFunction(name);
            if (!fn) {
                return null;
            }
            return `${JSON.stringify(name)}: ${fn.name}`;
        })
        .filter((entry): entry is string => entry !== null)
        .join(',');

    const filled = assembleTemplate(rawFunctions, registryEntries, coordinationKey);
    const source = `(function () {${NEWLINE_CHAR_UNIX}${filled.trim()}${NEWLINE_CHAR_UNIX}})();`;

    const minified = await minifyJs(source);

    return `${minified}${NEWLINE_CHAR_UNIX}`;
};
