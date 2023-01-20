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

const transformedModules = [
    '@adguard/tsurlfilter',
    '@adguard/tswebextension',
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
        `<rootDir>/node_modules/(?!(${transformedModules.join('|')}))`,
        '.*\\.json',
    ],
    transform: {
        '.+\\.(js|ts|jsx|tsx)': '@swc/jest',
    },
};

export default config;
