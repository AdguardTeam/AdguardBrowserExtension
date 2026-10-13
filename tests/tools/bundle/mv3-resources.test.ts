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
import vm from 'node:vm';

import { rspack } from '@rspack/core';
import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { Browser } from '../../../tools/constants';
import { getRspackConfig } from '../../../tools/bundle/get-rspack-config';

let workspace: string;

afterEach(async () => {
    vi.restoreAllMocks();
    if (workspace) {
        await fs.rm(workspace, { recursive: true, force: true });
    }
});

describe('MV3 bundled local script rules', () => {
    it.each([
        [Browser.ChromeMv3, 'chromium-mv3'],
        [Browser.OperaMv3, 'opera-mv3'],
        [Browser.EdgeMv3, 'edge-mv3'],
    ])('bundles the matching script registry for %s', async (browser, expected) => {
        workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'mv3-script-rules-'));
        await Promise.all(['chromium-mv3', 'opera-mv3', 'edge-mv3'].map(async (target) => {
            const directory = path.join(workspace, 'Extension/filters', target);
            await fs.mkdir(directory, { recursive: true });
            await fs.writeFile(
                path.join(directory, 'local_script_rules.js'),
                `export const localScriptRules = { platform: '${target}' };`,
            );
        }));
        const entry = path.join(workspace, 'entry.js');
        await fs.writeFile(entry, "export { localScriptRules } from 'local-script-rules';");

        const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(workspace);
        const config = getRspackConfig(browser);
        cwdSpy.mockRestore();

        const compiler = rspack({
            mode: 'none',
            target: 'node',
            context: workspace,
            entry,
            resolve: config.resolve,
            output: {
                path: path.join(workspace, 'output'),
                filename: 'registry.cjs',
                library: { type: 'commonjs2' },
            },
        });

        await new Promise<void>((resolve, reject) => {
            compiler.run((error, stats) => {
                compiler.close((closeError) => {
                    if (error || closeError || stats?.hasErrors()) {
                        reject(error || closeError || new Error(stats?.toString({ all: false, errors: true })));
                    } else {
                        resolve();
                    }
                });
            });
        });

        const context = { module: { exports: { localScriptRules: { platform: '' } } } };
        vm.runInNewContext(await fs.readFile(path.join(workspace, 'output/registry.cjs'), 'utf8'), context);
        expect(context.module.exports.localScriptRules.platform).toBe(expected);
    });
});
