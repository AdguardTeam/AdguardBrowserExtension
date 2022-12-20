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
import { promises as fs } from 'fs';
import webExt from 'web-ext';
import {
    BUILD_PATH,
    ENVS,
    FIREFOX_CREDENTIALS,
    FIREFOX_UPDATE_TEMPLATE,
    FIREFOX_WEBEXT_UPDATE_URL,
} from '../constants';
import { getBrowserConf, getEnvConf } from '../helpers';
import { version } from '../../package.json';

// IMPORTANT!!!
// Signing artifacts for Mozilla publishes build to the store simultaneously
// We sign only beta build, because we do not publish it the AMO store
export const xpi = async (browser) => {
    const buildEnv = process.env.BUILD_ENV;
    if (buildEnv !== ENVS.BETA) {
        throw new Error('Xpi is build only for beta');
    }

    const envConf = getEnvConf(buildEnv);
    const browserConf = getBrowserConf(browser);

    const buildDir = path.join(BUILD_PATH, envConf.outputPath);
    const sourceDir = path.join(buildDir, browserConf.buildDir);
    const manifestPath = path.join(sourceDir, 'manifest.json');

    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
    const updatedManifest = { ...manifest };
    updatedManifest.applications.gecko.update_url = FIREFOX_WEBEXT_UPDATE_URL;
    await fs.writeFile(manifestPath, JSON.stringify(updatedManifest, null, 4));

    // require called here in order to escape errors, until this module is really necessary
    // eslint-disable-next-line global-require, import/no-unresolved, @typescript-eslint/no-var-requires
    const cryptor = require('../../private/cryptor/dist');
    const credentialsContent = await cryptor(process.env.CREDENTIALS_PASSWORD)
        .getDecryptedContent(FIREFOX_CREDENTIALS);
    const { apiKey, apiSecret } = JSON.parse(credentialsContent);

    const { downloadedFiles } = await webExt.cmd.sign({
        apiKey,
        apiSecret,
        sourceDir,
        artifactsDir: buildDir,
        timeout: 15 * 60 * 1000, // 15 minutes
    }, {
        shouldExitProgram: false,
    });

    if (!downloadedFiles) {
        throw new Error('An error occurred during xpi signing');
    }

    const [downloadedXpi] = downloadedFiles;
    // Rename
    const basePath = path.dirname(downloadedXpi);
    const xpiPath = path.join(basePath, 'firefox.xpi');
    await fs.rename(downloadedXpi, xpiPath);

    // Revert manifest to prev state
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 4));

    // create update.json
    let updateJsonTemplate = (await fs.readFile(FIREFOX_UPDATE_TEMPLATE)).toString();
    updateJsonTemplate = updateJsonTemplate.replace(/\%VERSION\%/g, version);
    await fs.writeFile(path.join(buildDir, 'update.json'), updateJsonTemplate);
};
