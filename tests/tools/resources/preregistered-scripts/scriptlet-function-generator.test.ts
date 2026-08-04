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

import vm from 'node:vm';

import {
    describe,
    it,
    expect,
} from 'vitest';

import { scriptlets } from '@adguard/scriptlets';

/* eslint-disable max-len */
import {
    collectUniqueFunctions,
    compileScriptletFunctionFile,
    getScriptletFunctionFilename,
} from '../../../../tools/resources/preregistered-scripts/code-generators/scriptlet-function-generator/scriptlet-function-generator';
import {
    compileSharedScriptletsBundle,
} from '../../../../tools/resources/preregistered-scripts/code-generators/shared-bundle-generator/shared-bundle-generator';
/* eslint-enable max-len */

/**
 * Fixed coordination key used across tests.
 */
const TEST_KEY = '__ag_test0123456789ab';

/**
 * Returns the implementation function for a known scriptlet.
 *
 * @param name Scriptlet name.
 *
 * @returns Scriptlet function.
 *
 * @throws If the name is unknown to the scriptlets library.
 */
const getFn = (name: string): (...args: unknown[]) => unknown => {
    const fn = scriptlets.getScriptletFunction(name);
    if (!fn) {
        throw new Error(`Test setup failed: unknown scriptlet ${name}`);
    }
    return fn;
};

/**
 * Creates a vm sandbox emulating a page's MAIN world.
 *
 * @returns Contextified sandbox.
 */
const createPageSandbox = (): Record<string, unknown> => {
    const sandbox: Record<string, unknown> = {
        document: { location: { hostname: 'example.com' } },
    };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    return sandbox;
};

describe('collectUniqueFunctions', () => {
    it('throws on an unknown scriptlet name (a bundled rule would silently no-op otherwise)', () => {
        expect(() => collectUniqueFunctions(
            new Set(['abort-on-property-read', 'totally-unknown-scriptlet']),
        )).toThrow(/totally-unknown-scriptlet/);
    });

    it('groups alias names sharing one implementation function', () => {
        // Both names resolve to the same library function.
        const names = new Set(['google-analytics', 'googletagmanager-gtm']);
        const groups = collectUniqueFunctions(names);

        const allAliases = [...groups.values()].flat();
        expect(allAliases.sort()).toEqual([...names].sort());
        expect(groups.size).toBe(1);
    });
});

describe('getScriptletFunctionFilename', () => {
    it('is stable for identical sources and differs for different ones', async () => {
        const sourceA = getFn('abort-on-property-read').toString();
        const sourceB = getFn('set-constant').toString();

        expect(await getScriptletFunctionFilename(sourceA))
            .toBe(await getScriptletFunctionFilename(sourceA));
        expect(await getScriptletFunctionFilename(sourceA))
            .not.toBe(await getScriptletFunctionFilename(sourceB));
    });

    it('never collides with the per-rule hex-only filename pattern', async () => {
        const filename = await getScriptletFunctionFilename(getFn('set-constant').toString());
        expect(filename).toMatch(/^s-[0-9a-f]{16}\.js$/);
    });
});

describe('compileScriptletFunctionFile', () => {
    it('registers the function under each alias name in the shared bundle registry', async () => {
        const bundle = await compileSharedScriptletsBundle(TEST_KEY);
        const file = await compileScriptletFunctionFile(
            getFn('abort-on-property-read'),
            ['abort-on-property-read', 'aopr'],
            TEST_KEY,
        );

        const sandbox = createPageSandbox();
        vm.runInContext(bundle, sandbox);
        vm.runInContext(file, sandbox);

        const coordination = sandbox[TEST_KEY] as { f: Record<string, unknown> };
        expect(typeof coordination.f['abort-on-property-read']).toBe('function');
        expect(coordination.f.aopr).toBe(coordination.f['abort-on-property-read']);
    });

    it('produces valid JavaScript syntax', async () => {
        const file = await compileScriptletFunctionFile(
            getFn('abort-on-property-read'),
            ['abort-on-property-read'],
            TEST_KEY,
        );
        expect(() => {
            // eslint-disable-next-line no-new
            new vm.Script(file);
        }).not.toThrow();
    });

    it('does not corrupt scriptlet source containing "$&" via String.replace special patterns', async () => {
        const file = await compileScriptletFunctionFile(
            getFn('json-prune'),
            ['json-prune'],
            TEST_KEY,
        );
        expect(file).not.toContain('__FUNCTION__');
        expect(file).not.toContain('__ASSIGNMENTS__');
        expect(file).not.toContain('__PROP__');
        // The regex-escaping helper's replacement string must survive intact.
        expect(file).toContain('\\$&');
    });

    it('does not throw when the shared bundle never ran (no registry)', async () => {
        const file = await compileScriptletFunctionFile(
            getFn('set-constant'),
            ['set-constant'],
            TEST_KEY,
        );
        expect(() => {
            vm.runInNewContext(file, { window: {} });
        }).not.toThrow();
    });
});
