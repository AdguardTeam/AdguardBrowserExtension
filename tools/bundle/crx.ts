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

import { promises as fs } from 'node:fs';
import path from 'node:path';

// @ts-expect-error - no type declaration
import Crx from 'crx';
import forge from 'node-forge';

import { BuildTargetEnv } from '../../constants';
import {
    Browser,
    BUILD_PATH,
    CHROME_CERT,
    CHROME_CERT_DEV,
    CHROME_UPDATE_URL,
    CHROME_UPDATE_FILE_NAME,
    CHROME_CODEBASE_URL,
    CHROME_CODEBASE_FILE_NAME,
    BUILD_ENV,
} from '../constants';

import { getBrowserConf, getEnvConf } from './helpers';

type PrivateKey = forge.pki.rsa.PrivateKey;

/**
 * Parsed test certificate private key details.
 */
let TEST_CERTIFICATE_PRIVATE_KEY: PrivateKey | null = null;

/**
 * Parses a PEM certificate and extracts private key details
 *
 * @param fileContent Content of the file
 *
 * @returns Parsed private key details
 */
const parsePrivateKey = async (fileContent: Buffer): Promise<PrivateKey> => {
    return forge.pki.privateKeyFromPem(fileContent.toString('utf-8'));
};

/**
 * Compares two private keys by checking modulus (n) and exponent (e)
 *
 * @param keyA First private key
 * @param keyB Second private key
 *
 * @returns True if keys are identical, false otherwise
 */
const arePrivateKeysEqual = (keyA: PrivateKey, keyB: PrivateKey) => {
    return keyA.n.equals(keyB.n) && keyA.e.equals(keyB.e);
};

/**
 * Retrieves certificate private key from specified path.
 *
 * @returns Buffer of the private key
 *
 * @throws Error if the certificate is not found
 */
const getPrivateKey = async (path: string) => {
    const privateKeyBuffer = await fs.readFile(path);

    /**
     * Make sure that the test certificate is not used in the production environment.
     * We perform full parsing of the certificate to avoid any issues with the comparison,
     * like formatting differences.
     */
    if (BUILD_ENV !== BuildTargetEnv.Dev) {
        if (TEST_CERTIFICATE_PRIVATE_KEY === null) {
            const testPrivateKeyBuffer = await fs.readFile(CHROME_CERT_DEV);
            TEST_CERTIFICATE_PRIVATE_KEY = await parsePrivateKey(testPrivateKeyBuffer);
        }

        const privateKey = await parsePrivateKey(privateKeyBuffer);

        if (arePrivateKeysEqual(TEST_CERTIFICATE_PRIVATE_KEY, privateKey)) {
            throw new Error('The test certificate is used in the production environment');
        }
    }

    return privateKeyBuffer;
};

/**
 * Write crx file and update.xml file if needed.
 *
 * @param crx Crx instance.
 * @param browserBuildPath Browser build path.
 * @param envBuildPath Environment build path.
 * @param shouldWriteUpdateXml Whether to write update.xml file or not.
 */
// TODO: remove any when crx will support types
const writeCrx = async (
    crx: any,
    browserBuildPath: string,
    envBuildPath: string,
    shouldWriteUpdateXml: boolean,
) => {
    await crx.load(browserBuildPath);
    const crxBuffer = await crx.pack();
    const crxBuildPath = path.join(envBuildPath, CHROME_CODEBASE_FILE_NAME);
    await fs.writeFile(crxBuildPath, crxBuffer);

    if (shouldWriteUpdateXml) {
        const updateXml = await crx.generateUpdateXML();
        const updateXmlPath = path.join(envBuildPath, CHROME_UPDATE_FILE_NAME);
        await fs.writeFile(updateXmlPath, updateXml);
    }
};

/**
 * Builds the CRX file for specified browser.
 *
 * @param browser The browser for which to build the CRX file.
 */
export const crx = async (browser: Browser) => {
    const buildEnv = BUILD_ENV;

    // Guards
    if (browser !== Browser.Chrome || buildEnv === BuildTargetEnv.Release) {
        throw new Error('CRX is built only for chrome (MV2) in dev and beta env');
    }

    const envConf = getEnvConf(buildEnv);
    const browserConf = getBrowserConf(browser);

    const envBuildPath = path.join(BUILD_PATH, envConf.outputPath);
    const browserBuildPath = path.join(envBuildPath, browserConf.buildDir);
    const privateKeyPath = buildEnv === BuildTargetEnv.Dev
        ? CHROME_CERT_DEV
        : CHROME_CERT;

    const privateKey = await getPrivateKey(privateKeyPath);

    const crx = new Crx({
        codebase: CHROME_CODEBASE_URL,
        privateKey,
    });

    // for dev environment we just create crx file
    if (buildEnv === BuildTargetEnv.Dev) {
        await writeCrx(crx, browserBuildPath, envBuildPath, false);
        return;
    }

    // for beta environment we add the `update_url` property to the `manifest.json`
    // which is needs to be present while creating the crx file for standalone
    const manifestPath = path.join(browserBuildPath, 'manifest.json');
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
    const updatedManifest = { ...manifest, update_url: CHROME_UPDATE_URL };
    await fs.writeFile(manifestPath, JSON.stringify(updatedManifest, null, 4));

    // write crx and update files
    await writeCrx(crx, browserBuildPath, envBuildPath, true);

    // Delete from the chrome manifest `update_url` property
    // after the crx file has been created - reset the manifest
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 4));
};
