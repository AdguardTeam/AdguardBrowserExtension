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

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import forge from 'node-forge';
import { Open } from 'unzipper';
import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { BuildTargetEnv } from '../../../constants';
import * as buildConstants from '../../../tools/constants';

let workspace: string;

afterEach(async () => {
    vi.doUnmock('../../../tools/constants');
    vi.resetModules();
    if (workspace) {
        await fs.rm(workspace, { recursive: true, force: true });
    }
});

describe('Chrome MV2 CRX packaging', () => {
    it.each([BuildTargetEnv.Dev, BuildTargetEnv.Beta])(
        'writes a manifest-specific CRX and preserves the public update URL in %s',
        async (env) => {
            workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'crx-package-'));
            const buildDir = path.join(workspace, env, 'chrome-mv2');
            await fs.mkdir(buildDir, { recursive: true });
            const manifest = { manifest_version: 2, name: 'Test extension', version: '1.0.0' };
            await fs.writeFile(path.join(buildDir, 'manifest.json'), JSON.stringify(manifest));

            // Use an ephemeral key for beta so the production test-key rejection
            // remains enabled; no deployment credentials are needed for packaging.
            const key = forge.pki.rsa.generateKeyPair(1024).privateKey;
            const certificatePath = path.join(workspace, 'certificate.pem');
            await fs.writeFile(certificatePath, forge.pki.privateKeyToPem(key));
            vi.doMock('../../../tools/constants', async (importOriginal) => ({
                ...await importOriginal<typeof buildConstants>(),
                BUILD_PATH: workspace,
                BUILD_ENV: env,
                CHROME_CERT: certificatePath,
            }));
            const { crx } = await import('../../../tools/bundle/crx');
            await crx(buildConstants.Browser.ChromeMv2);

            const files = await fs.readdir(path.join(workspace, env));
            expect(files.sort()).toEqual([
                'chrome-mv2', 'chrome-mv2.crx', ...(env === BuildTargetEnv.Beta ? ['update.xml'] : []),
            ].sort());
            const crxBuffer = await fs.readFile(path.join(workspace, env, 'chrome-mv2.crx'));
            // CRX3 stores the protobuf header length at byte 8, after magic and
            // version. The ZIP payload follows the 12-byte prefix and that header.
            expect(crxBuffer.readUInt32LE(4)).toBe(3);
            const archive = await Open.buffer(crxBuffer.subarray(12 + crxBuffer.readUInt32LE(8)));
            const manifestEntry = archive.files.find((file) => file.path === 'manifest.json')!;
            const packagedManifest = JSON.parse((await manifestEntry.buffer()).toString('utf8'));
            expect(packagedManifest).toEqual(env === BuildTargetEnv.Beta ? {
                ...manifest,
                update_url: 'https://static.adtidy.org/extensions/adguardadblocker/beta/update.xml',
            } : manifest);
            expect(JSON.parse(await fs.readFile(path.join(buildDir, 'manifest.json'), 'utf8'))).toEqual(manifest);
            if (env === BuildTargetEnv.Beta) {
                const xml = new DOMParser().parseFromString(
                    await fs.readFile(path.join(workspace, env, 'update.xml'), 'utf8'),
                    'application/xml',
                );
                expect(xml.querySelector('parsererror')).toBeNull();
                expect(xml.querySelector('updatecheck')?.getAttribute('codebase')).toBe(
                    'https://static.adtidy.org/extensions/adguardadblocker/beta/chrome.crx',
                );
            }
        },
    );
});
