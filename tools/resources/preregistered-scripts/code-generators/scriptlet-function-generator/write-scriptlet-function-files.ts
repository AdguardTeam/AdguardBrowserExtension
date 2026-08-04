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

import path from 'node:path';

import { writeBundle } from '../../write-helpers';

import {
    collectUniqueFunctions,
    compileScriptletFunctionFile,
    getScriptletFunctionFilename,
} from './scriptlet-function-generator';

/**
 * Builds and writes one file per unique scriptlet function, so runtime
 * registrations can include only the functions their rules actually use
 * instead of the whole scriptlets library.
 *
 * @param scriptletNames Set of unique scriptlet names used across all domains.
 * @param outputDir Directory to write the files into.
 * @param coordinationKey Identifier declared by the shared bundle.
 *
 * @returns Map of scriptlet name to its function filename, for the manifest.
 */
export const writeScriptletFunctionFiles = async (
    scriptletNames: Set<string>,
    outputDir: string,
    coordinationKey: string,
): Promise<Record<string, string>> => {
    const uniqueFunctions = collectUniqueFunctions(scriptletNames);
    const scriptletFiles: Record<string, string> = {};

    await Promise.all([...uniqueFunctions.entries()].map(async ([fn, aliases]) => {
        const filename = await getScriptletFunctionFilename(fn.toString());
        const content = await compileScriptletFunctionFile(fn, aliases, coordinationKey);
        await writeBundle(content, path.join(outputDir, filename));

        for (const alias of aliases) {
            scriptletFiles[alias] = filename;
        }
    }));

    console.log(
        '[generate-preregistered-domain-bundles]'
        + ` Wrote ${uniqueFunctions.size} scriptlet function file(s) for ${scriptletNames.size} name(s)`,
    );

    return scriptletFiles;
};
