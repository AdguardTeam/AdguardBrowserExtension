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
import { assertNoTemplateSentinels, extractTemplateBody } from '../../writeHelpers';

import { BUNDLE_TEMPLATE } from './shared-bundle-template';

/**
 * Builds the shared bundle body by filling `__FUNCTIONS__`, `__REGISTRY__`
 * and `__PROP__` markers in {@link BUNDLE_TEMPLATE}.
 *
 * @param functions Compiled scriptlet function definitions (minified).
 * @param registryEntries Comma-separated `"name": fnName` entries.
 * @param coordinationKey Substituted into the `window.<key>` assignment.
 *
 * @returns Assembled bundle body.
 */
const assembleTemplate = (
    functions: string[],
    registryEntries: string,
    coordinationKey: string,
): string => {
    const filled = extractTemplateBody(BUNDLE_TEMPLATE)
        .replace('__FUNCTIONS__', () => functions.join(NEWLINE_CHAR_UNIX))
        .replace('__REGISTRY__', () => `{${registryEntries}}`)
        .replace(/__PROP__/g, () => coordinationKey);

    assertNoTemplateSentinels(filled, ['__FUNCTIONS__', '__REGISTRY__', '__PROP__']);

    return filled;
};

/**
 * Compiles the shared scriptlets bundle: deduped scriptlet function
 * definitions plus the coordination-key runner, assigned to a `window`
 * property so the cleanup file can fully `delete` it.
 *
 * The bundle is emitted even for an empty name set: per-hash JS-rule files
 * still need `<key>.b` for deduplication.
 *
 * @param scriptletNames Set of unique scriptlet names used across all domains.
 * @param coordinationKey Identifier shared with the per-hash files and the
 * cleanup file.
 *
 * @returns Compiled shared bundle string.
 */
export const compileSharedScriptletsBundle = async (
    scriptletNames: Set<string>,
    coordinationKey: string,
): Promise<string> => {
    const uniqueFunctions = new Map<(...args: unknown[]) => unknown, string[]>();

    for (const scriptletName of scriptletNames) {
        const scriptletFn = scriptlets.getScriptletFunction(scriptletName);
        if (!scriptletFn) {
            throw new Error(
                `Unknown scriptlet "${scriptletName}" — update @adguard/scriptlets or fix the filter rule`,
            );
        }

        const aliases = uniqueFunctions.get(scriptletFn);
        if (aliases) {
            aliases.push(scriptletName);
        } else {
            uniqueFunctions.set(scriptletFn, [scriptletName]);
        }
    }

    const rawFunctions = [...uniqueFunctions.keys()].map((fn) => fn.toString());

    const registryEntries = [...uniqueFunctions.entries()]
        .flatMap(([fn, aliases]) => aliases.map((name) => `${JSON.stringify(name)}: ${fn.name}`))
        .join(',');

    const filled = assembleTemplate(rawFunctions, registryEntries, coordinationKey);
    const source = `${filled.trim()}${NEWLINE_CHAR_UNIX}`;

    const minified = await minifyJs(source);

    return `${minified}${NEWLINE_CHAR_UNIX}`;
};
