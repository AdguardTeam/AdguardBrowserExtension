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
import { hashString } from '@adguard/tswebextension/mv3/preregistered-scripts/hasher';

import { NEWLINE_CHAR_UNIX } from '../../../../../Extension/src/common/constants';
import { minifyJs } from '../../constants';
import { assertNoTemplateSentinels, extractTemplateBody } from '../../write-helpers';

import { FUNCTION_TEMPLATE } from './scriptlet-function-template';

/**
 * Scriptlet function type as returned by the scriptlets library.
 */
type ScriptletFunction = (...args: unknown[]) => unknown;

/**
 * Prefix of per-function filenames. Keeps them apart from per-rule
 * `{hash}.js` files, which match a hex-only pattern.
 */
const FUNCTION_FILENAME_PREFIX = 's-';

/**
 * Groups scriptlet names by their implementation function, so aliases
 * (multiple names backed by the same function) share one generated file.
 *
 * @param scriptletNames Unique scriptlet names used across all domains.
 *
 * @returns Map of function to the names it implements.
 *
 * @throws If a name is unknown to the scriptlets library.
 */
export const collectUniqueFunctions = (
    scriptletNames: Set<string>,
): Map<ScriptletFunction, string[]> => {
    const uniqueFunctions = new Map<ScriptletFunction, string[]>();

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

    return uniqueFunctions;
};

/**
 * Returns the filename for a scriptlet function file: a content hash, so
 * an unchanged function keeps its filename across generations (persisted
 * content-script registrations keep referencing a valid path).
 *
 * @param functionSource Scriptlet function source code.
 *
 * @returns `s-{hash}.js` filename.
 */
export const getScriptletFunctionFilename = async (functionSource: string): Promise<string> => {
    const hash = await hashString(functionSource);
    return `${FUNCTION_FILENAME_PREFIX}${hash}.js`;
};

/**
 * Compiles a per-function scriptlet file: the function source plus
 * registration statements for each of its alias names.
 *
 * @param fn Scriptlet function.
 * @param aliases Scriptlet names implemented by `fn`.
 * @param coordinationKey Identifier of the shared bundle's registry.
 *
 * @returns Compiled file content.
 */
export const compileScriptletFunctionFile = async (
    fn: ScriptletFunction,
    aliases: string[],
    coordinationKey: string,
): Promise<string> => {
    const assignments = aliases
        .map((name) => `registry[${JSON.stringify(name)}] = fn;`)
        .join(NEWLINE_CHAR_UNIX);

    const filled = extractTemplateBody(FUNCTION_TEMPLATE)
        .replace('__FUNCTION__', () => fn.toString())
        .replace('__ASSIGNMENTS__', () => assignments)
        .replace(/__PROP__/g, () => coordinationKey);

    assertNoTemplateSentinels(filled, ['__FUNCTION__', '__ASSIGNMENTS__', '__PROP__']);

    const source = `${filled.trim()}${NEWLINE_CHAR_UNIX}`;
    const minified = await minifyJs(source);

    return `${minified}${NEWLINE_CHAR_UNIX}`;
};
