/**
 * @file
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */
import type { JestConfigWithTsJest } from 'ts-jest';

const transformedModules = [
    '@adguard/tsurlfilter',
    '@adguard/tswebextension',
];

const config: JestConfigWithTsJest = {
    verbose: true,
    testEnvironment: 'jsdom',
    testRegex: '(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$',
    setupFiles: [
        './testSetup.ts',
    ],
    transformIgnorePatterns: [
        `<rootDir>/node_modules/(?!(${transformedModules.join('|')}))`,
    ],
    transform: {
        '.+\\.(js|ts|jsx|tsx)': 'ts-jest',
    },
};

export default config;
