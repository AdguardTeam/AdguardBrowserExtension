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

import fs from 'node:fs';
import path from 'node:path';

import unzipper from 'unzipper';

import { type BuildTargetEnv } from '../../../constants';
import { type BrowserConfig, BROWSERS_CONF } from '../../bundle/common-constants';
import { BUILD_PATH } from '../../constants';

import { type E2EMatrixEntry } from './types';

/**
 * Returns the browser config for an E2E matrix entry from BROWSERS_CONF.
 * E2E matrix only targets browsers present in BROWSERS_CONF (never ChromeCrx).
 *
 * @param entry E2E matrix entry.
 *
 * @returns Browser config.
 */
const getBrowserConfig = (entry: E2EMatrixEntry): BrowserConfig => {
    return BROWSERS_CONF[entry.buildTarget as keyof typeof BROWSERS_CONF];
};

/**
 * Returns the zip artifact path for an E2E matrix entry.
 *
 * @param entry E2E matrix entry.
 * @param env Build target environment.
 *
 * @returns Absolute path to the build artifact zip.
 */
export const getE2EZipPath = (entry: E2EMatrixEntry, env: BuildTargetEnv): string => {
    const { zipName } = getBrowserConfig(entry);

    return path.join(BUILD_PATH, env, `${zipName}.zip`);
};

/**
 * Returns the temporary unpacked extension path for an E2E matrix entry.
 *
 * @param entry E2E matrix entry.
 * @param env Build target environment.
 *
 * @returns Absolute path to the unpacked extension directory.
 */
export const getE2EUnpackedPath = (entry: E2EMatrixEntry, env: BuildTargetEnv): string => {
    const { buildDir } = getBrowserConfig(entry);

    return path.resolve('tmp', 'e2e', env, entry.id, buildDir);
};

/**
 * Unpacks an E2E test artifact zip into a temporary extension directory.
 *
 * @param entry E2E matrix entry.
 * @param env Build target environment.
 *
 * @returns Absolute path to the unpacked extension directory.
 */
export const unpackE2EArtifact = async (entry: E2EMatrixEntry, env: BuildTargetEnv): Promise<string> => {
    const zipPath = getE2EZipPath(entry, env);
    const unpackedPath = getE2EUnpackedPath(entry, env);

    if (!fs.existsSync(zipPath)) {
        throw new Error(`E2E artifact not found: ${zipPath}`);
    }

    fs.rmSync(unpackedPath, { recursive: true, force: true });
    fs.mkdirSync(unpackedPath, { recursive: true });

    await fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: unpackedPath }))
        .promise();

    return unpackedPath;
};
