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

import path from 'node:path';
import { promises as fsp } from 'node:fs';

import { BUILD_ENV, BUILD_PATH } from '../constants';
import { getFormattedVersion } from '../helpers';
import packageJson from '../../package.json';

import { getEnvConf } from './helpers';

const config = getEnvConf(BUILD_ENV);
const OUTPUT_PATH = config.outputPath;

const FILE_NAME = 'build.txt';

const filePath = path.join(BUILD_PATH, OUTPUT_PATH, FILE_NAME);

/**
 * Writes build.txt file with current version in format major.minor.patch.increment
 * (same format as used in manifest.json).
 *
 * @returns Promise which resolves when the file is written.
 *
 * @throws Error when package version cannot be parsed or has invalid format.
 */
export const buildInfo = async () => {
    const version = getFormattedVersion(packageJson.version);
    const content = `version=${version}`;

    await fsp.writeFile(filePath, content, 'utf-8');
};
