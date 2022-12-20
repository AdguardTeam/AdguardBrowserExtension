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

import path from 'path';
import { promises as fsp } from 'fs';
import { BUILD_PATH } from '../constants';
import packageJson from '../../package.json';
import { getEnvConf } from '../helpers';

const config = getEnvConf(process.env.BUILD_ENV);
const OUTPUT_PATH = config.outputPath;

const content = `version=${packageJson.version}`;
const FILE_NAME = 'build.txt';

const filePath = path.join(BUILD_PATH, OUTPUT_PATH, FILE_NAME);

/**
 * Writes build.txt file with current version
 *
 * @returns {Promise<void>}
 */
export const buildInfo = async () => {
    await fsp.writeFile(filePath, content, 'utf-8');
};
