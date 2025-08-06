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
import path from 'node:path';

import tsconfigPaths from 'vite-tsconfig-paths';
import {
    defineConfig,
    defineProject,
    type UserWorkspaceConfig,
} from 'vitest/config';

import { loadAliases } from './tools/typescript';
import { ManifestVersionEnv } from './tools/constants';

/**
 * Creates a test configuration for a specific manifest version.
 *
 * @param manifestVersion The manifest version to create the test for.
 *
 * @returns The test configuration.
 */
const createProjectForManifestVersion = (
    manifestVersion: ManifestVersionEnv,
): UserWorkspaceConfig => defineProject({
    define: {
        IS_FIREFOX_AMO: false,
        // For run tests like it's release.
        IS_RELEASE: true,
        IS_BETA: false,
        __IS_MV3__: manifestVersion === ManifestVersionEnv.Third,
    },
    plugins: [tsconfigPaths()],
    resolve: {
        alias: loadAliases(
            path.resolve(__dirname),
            `./tsconfig.with_types_mv${manifestVersion}.json`,
        ),
    },
    test: {
        name: `mv${manifestVersion}`,
        setupFiles: [
            // Setup all needed stuff: mocks, etc.
            'fake-indexeddb/auto',
            './vitest.setup.ts',
        ],
        // Enables jsdom environment for tests.
        environment: 'jsdom',
        environmentOptions: {
            jsdom: {
                // eslint-disable-next-line max-len
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 YaBrowser/22.11.0.2468 Yowser/2.5 Safari/537.36',
            },
        },
    },
});

export default defineConfig({
    test: {
        projects: [
            createProjectForManifestVersion(ManifestVersionEnv.Second),
            createProjectForManifestVersion(ManifestVersionEnv.Third),
        ],
    },
});
