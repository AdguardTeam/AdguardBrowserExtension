/**
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
import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import escapeStringRegexp from 'escape-string-regexp';

import { MANIFEST_ENV } from './tools/constants';

// eslint-disable-next-line no-console
console.log(`Run test with manifest version (MANIFEST_ENV) ${MANIFEST_ENV}.\n`);

// eslint-disable-next-line import/no-dynamic-require
const TsConfigWithManifestDependantTypes = require(`./tsconfig.with_types_mv${MANIFEST_ENV}.json`);

const transformedModules = [
    '@adguard/tsurlfilter',
    '@adguard/tswebextension',
    '@adguard/filters-downloader',
    'lodash-es',
    'nanoid',
];

const config: Config = {
    verbose: true,
    testEnvironment: 'jsdom',
    testEnvironmentOptions: {
        // eslint-disable-next-line max-len
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 YaBrowser/22.11.0.2468 Yowser/2.5 Safari/537.36',
    },
    testRegex: '(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$',
    setupFiles: [
        './testSetup.ts',
    ],
    transformIgnorePatterns: [
        // We should ignore packages from:
        // - node_modules
        // - node_modules/.pnpm
        // - node_modules/.pnpm/node_modules
        // - node_modules/.pnpm/<pnpm-generated-folder>/node_modules

        // eslint-disable-next-line max-len
        `<rootDir>/node_modules/(?!(?:.pnpm(?:/(?:[^/]+)?/node_modules/)?)?(${transformedModules.map(escapeStringRegexp).join('|')}))`,
        '.*\\.json',
    ],
    // Use same aliases as in tsconfig.
    moduleNameMapper: pathsToModuleNameMapper(
        TsConfigWithManifestDependantTypes.compilerOptions.paths,
        { prefix: '<rootDir>/' },
    ),
    transform: {
        '.+\\.(js|ts|jsx|tsx)': '@swc/jest',
    },
    globals: {
        // TODO: (AG-20414) Add tests for Firefox AMO
        IS_FIREFOX_AMO: false,
        // For run tests like it's release.
        IS_RELEASE: true,
        IS_BETA: false,
        __IS_MV3__: MANIFEST_ENV === '3',
    },
};

export default config;
