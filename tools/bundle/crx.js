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

import { promises as fs } from 'fs';
import path from 'path';
import Crx from 'crx';
import {
    ENVS,
    BROWSERS,
    BUILD_PATH,
    CHROME_CERT,
    CHROME_UPDATE_URL,
    CHROME_CODEBASE_URL,
} from '../constants';
import { getBrowserConf, getEnvConf } from '../helpers';

export const crx = async (browser) => {
    const buildEnv = process.env.BUILD_ENV;

    // Guards
    if (browser === BROWSERS.CHROME && buildEnv !== ENVS.BETA) {
        throw new Error('CRX for chrome is built only for beta');
    }

    const envConf = getEnvConf(buildEnv);
    const browserConf = getBrowserConf(browser);

    const envBuildPath = path.join(BUILD_PATH, envConf.outputPath);
    const browserBuildPath = path.join(envBuildPath, browserConf.buildDir);

    // add update url to the manifest
    const manifestPath = path.join(browserBuildPath, 'manifest.json');
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
    const updatedManifest = { ...manifest, update_url: CHROME_UPDATE_URL };
    await fs.writeFile(manifestPath, JSON.stringify(updatedManifest, null, 4));

    const privateKey = await fs.readFile(CHROME_CERT, 'utf-8');

    const crx = new Crx({
        codebase: CHROME_CODEBASE_URL,
        privateKey,
    });

    await crx.load(browserBuildPath);
    const crxBuffer = await crx.pack();
    const updateXml = await crx.generateUpdateXML();

    const crxBuildPath = path.join(envBuildPath, 'chrome.crx');
    const updateXmlPath = path.join(envBuildPath, 'update.xml');
    await fs.writeFile(crxBuildPath, crxBuffer);
    await fs.writeFile(updateXmlPath, updateXml);

    // revert manifest to prev state
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 4));
};
