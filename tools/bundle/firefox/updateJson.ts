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

import fs from 'fs/promises';
import path from 'node:path';

import fse from 'fs-extra';

import {
    BUILD_ENV,
    BUILD_PATH,
    FIREFOX_UPDATE_TEMPLATE,
} from '../../constants';
import { version } from '../../../package.json';
import { getEnvConf } from '../helpers';

export const buildUpdateJson = async () => {
    const envConf = getEnvConf(BUILD_ENV);

    const buildDir = path.join(BUILD_PATH, envConf.outputPath);
    await fse.ensureDir(buildDir);

    // create update.json
    let updateJsonTemplate = (await fs.readFile(FIREFOX_UPDATE_TEMPLATE)).toString();
    updateJsonTemplate = updateJsonTemplate.replace(/\%VERSION\%/g, version);
    await fs.writeFile(path.join(buildDir, 'update.json'), updateJsonTemplate);
};
