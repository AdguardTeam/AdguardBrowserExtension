/**
 * @file TypeScript utils.
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
