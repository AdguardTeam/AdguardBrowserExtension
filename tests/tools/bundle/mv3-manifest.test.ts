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

import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { BuildTargetEnv, BACKGROUND_OUTPUT } from '../../../constants';
import { Browser } from '../../../tools/constants';
import { commonManifest } from '../../../tools/bundle/manifest.common';
import { createMv3Manifest } from '../../../tools/bundle/manifest.common.mv3';
import { createBundledMv3Manifest } from '../../../tools/bundle/rspack.common.mv3';
import { updateManifest } from '../../../tools/helpers';

afterEach(() => {
    vi.restoreAllMocks();
});

describe.each([
    { browser: Browser.ChromeMv3, versionKey: 'minimum_chrome_version', minimumVersion: '121' },
    { browser: Browser.EdgeMv3, versionKey: 'minimum_chrome_version', minimumVersion: '121' },
    { browser: Browser.OperaMv3, versionKey: 'minimum_opera_version', minimumVersion: '107' },
] as const)('MV3 manifest for $browser', ({ browser, versionKey, minimumVersion }) => {
    it.each(Object.values(BuildTargetEnv))('uses MV3 permissions and CSP in %s', (env) => {
        const manifest = updateManifest(
            env,
            browser,
            { ...commonManifest, version: '1.0.0' },
            createMv3Manifest(browser),
        );

        expect(manifest.manifest_version).toBe(3);
        expect(manifest.background).toEqual({ service_worker: `${BACKGROUND_OUTPUT}.js` });
        expect(manifest.content_security_policy).toEqual({
            extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
        });
        expect(manifest).toHaveProperty(versionKey, minimumVersion);
        expect(manifest).not.toHaveProperty(versionKey === 'minimum_chrome_version'
            ? 'minimum_opera_version'
            : 'minimum_chrome_version');
        expect(manifest.permissions).toContain('declarativeNetRequest');
        expect(manifest.permissions).toContain('userScripts');
        expect(manifest.permissions).not.toContain('webRequestBlocking');
        expect(manifest).not.toHaveProperty('browser_action');
    });
});

describe.each([
    { browser: Browser.ChromeMv3, directory: 'chromium-mv3' },
    { browser: Browser.OperaMv3, directory: 'opera-mv3' },
    { browser: Browser.EdgeMv3, directory: 'edge-mv3' },
] as const)('bundled rulesets for $browser', ({ browser, directory }) => {
    it('includes the target rulesets and enables the base filter', () => {
        const readdir = fs.readdirSync.bind(fs);
        vi.spyOn(fs, 'readdirSync').mockImplementation((...args) => {
            if (String(args[0]) === `Extension/filters/${directory}/declarative`) {
                return ['ruleset_2', 'ruleset_3', 'README.md'] as unknown as ReturnType<typeof fs.readdirSync>;
            }
            return readdir(...args);
        });

        const content = Buffer.from(JSON.stringify(commonManifest));
        const manifest = JSON.parse(createBundledMv3Manifest(content, browser).toString());

        expect(manifest.declarative_net_request.rule_resources).toEqual([
            { id: 'ruleset_2', enabled: true, path: 'filters/declarative/ruleset_2/ruleset_2.json' },
            { id: 'ruleset_3', enabled: false, path: 'filters/declarative/ruleset_3/ruleset_3.json' },
        ]);
    });

    it('fails when target rulesets are missing instead of falling back', () => {
        vi.spyOn(fs, 'readdirSync').mockImplementation(() => {
            throw new Error('Target rulesets are missing');
        });

        expect(() => createBundledMv3Manifest(Buffer.from(JSON.stringify(commonManifest)), browser))
            .toThrow('Target rulesets are missing');
    });
});

describe('MV3 manifest isolation', () => {
    it('does not retain rulesets from a previous browser build', () => {
        vi.spyOn(fs, 'readdirSync')
            .mockReturnValueOnce(['ruleset_2'] as unknown as ReturnType<typeof fs.readdirSync>)
            .mockReturnValueOnce(['ruleset_3'] as unknown as ReturnType<typeof fs.readdirSync>);
        const content = Buffer.from(JSON.stringify(commonManifest));
        createBundledMv3Manifest(content, Browser.ChromeMv3);
        const manifest = JSON.parse(createBundledMv3Manifest(content, Browser.EdgeMv3).toString());

        expect(manifest.declarative_net_request.rule_resources).toEqual([
            { id: 'ruleset_3', enabled: false, path: 'filters/declarative/ruleset_3/ruleset_3.json' },
        ]);
    });
});
