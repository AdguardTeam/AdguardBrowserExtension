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
import { readFile } from 'fs/promises';

import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

import { MANIFEST_ENV } from './tools/constants';

async function loadJson(pathToFile: string) {
    const jsonData = await readFile(new URL(pathToFile, import.meta.url));
    const data = JSON.parse(jsonData.toString());

    return data;
}

const aliases = (async () => {
    const TsConfigWithManifestDependantTypes = await loadJson(`./tsconfig.with_types_mv${MANIFEST_ENV}.json`);

    const res = Object.entries(TsConfigWithManifestDependantTypes.compilerOptions.paths).map(([key, value]) => {
        return [key, path.resolve(__dirname, (value as any)[0])];
    });

    return Object.fromEntries(res);
})();

export default defineConfig({
    define: {
        IS_FIREFOX_AMO: false,
        // For run tests like it's release.
        IS_RELEASE: true,
        IS_BETA: false,
        __IS_MV3__: MANIFEST_ENV === '3',
    },
    plugins: [tsconfigPaths()],
    resolve: {
        alias: await aliases,
    },
    test: {
        setupFiles: './vitest.setup.ts', // Setup file for tests.
        environment: 'jsdom', // Enables jsdom environment for tests.
        environmentOptions: {
            // FIXME: Insert minimal supported browser version here.
            // eslint-disable-next-line max-len
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 YaBrowser/22.11.0.2468 Yowser/2.5 Safari/537.36',
        },
        reporters: [
            // FIXME: memory leak node error right after running tests
            // [ 'junit', { outputFile: './tests-reports/unit-tests.xml' } ]
        ],
    },
});
