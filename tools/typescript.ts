/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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

/**
 * TypeScript utils.
 */

import path from 'node:path';

import ts from 'typescript';

/**
 * Load aliases from tsconfig file.
 *
 * @param basePath Base path.
 * @param tsconfigFilename tsconfig filename.
 *
 * @returns Aliases object.
 *
 * @throws Error if cannot read or parse tsconfig file.
 */
export const loadAliases = (basePath: string, tsconfigFilename: string): Record<string, string> => {
    const pathToTsConfig = path.resolve(basePath, tsconfigFilename);
    const rawTsconfig = ts.readConfigFile(pathToTsConfig, ts.sys.readFile);

    if (rawTsconfig.error) {
        throw new Error(
            `Cannot read tsconfig file: ${pathToTsConfig}. Got error: ${rawTsconfig.error.messageText}`,
        );
    }

    const tsconfig = ts.parseJsonConfigFileContent(
        rawTsconfig.config,
        ts.sys,
        basePath,
    );

    if (tsconfig.errors.length) {
        throw new Error(
            `Cannot parse tsconfig file: ${pathToTsConfig}. Got errors: ${
                tsconfig.errors
                    .map((e) => e.messageText)
                    .join(', ')
            }`,
        );
    }

    const aliases: Record<string, string> = {};

    if (tsconfig.options.paths) {
        Object.entries(tsconfig.options.paths).forEach(([key, [value]]) => {
            if (value) {
                aliases[key] = path.resolve(basePath, value);
            }
        });
    }

    return aliases;
};
