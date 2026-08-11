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

/* eslint-disable max-len */
import {
    compileSharedScriptletsBundle,
} from '../../../../tools/resources/preregistered-scripts/code-generators/shared-bundle-generator/shared-bundle-generator';
/* eslint-enable max-len */

/**
 * Fixed coordination key used across tests so assertions can check for its
 * literal form in the compiled output.
 */
const TEST_KEY = '__ag_test0123456789ab';

/**
 * Creates a vm sandbox emulating a page's MAIN world: `window` IS the
 * global object, so `window.<key> = ...` creates a global binding reachable
 * as a bare identifier.
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

describe('compileSharedScriptletsBundle', () => {
    it('assigns the coordination object to a window property named by the key, surviving minification', async () => {
        const result = await compileSharedScriptletsBundle(TEST_KEY);

        // Terser never mangles property names — the key must appear verbatim.
        expect(result).toContain(`window.${TEST_KEY}=`);
        expect(result).toMatch(/\}\(\)\}\s*catch\s*\(\w+\)\s*\{/);
    });

    it('uses the given coordination key, and only that key appears in the output', async () => {
        const keyA = '__ag_aaaaaaaaaaaaaaaa';
        const keyB = '__ag_bbbbbbbbbbbbbbbb';
        const resultA = await compileSharedScriptletsBundle(keyA);
        const resultB = await compileSharedScriptletsBundle(keyB);
        expect(resultA).toContain(keyA);
        expect(resultA).not.toContain(keyB);
        expect(resultB).toContain(keyB);
        expect(resultB).not.toContain(keyA);
    });

    it('contains no scriptlet implementations — those live in per-function files', async () => {
        const result = await compileSharedScriptletsBundle(TEST_KEY);

        expect(result).not.toContain('__FUNCTIONS__');
        expect(result).not.toContain('__REGISTRY__');
    });

    it('exposes the runner, the dedup set and the function registry on the coordination object', async () => {
        const result = await compileSharedScriptletsBundle(TEST_KEY);

        const sandbox = createPageSandbox();
        vm.runInContext(result, sandbox);

        // Reachable both as a bare identifier and via window — they are the
        // same global object in a page's MAIN world.
        expect(vm.runInContext(`typeof ${TEST_KEY}`, sandbox)).toBe('object');
        const coordination = sandbox[TEST_KEY] as { r: unknown; b: unknown; f: unknown };
        expect(typeof coordination.r).toBe('function');
        // Cross-realm check: the sandbox's Set is not the host realm's Set.
        expect(vm.runInContext(`${TEST_KEY}.b instanceof Set`, sandbox)).toBe(true);
        expect(coordination.f).toEqual({});

        // Deletable — the cleanup file relies on it.
        vm.runInContext(`delete window.${TEST_KEY}`, sandbox);
        expect(vm.runInContext(`typeof ${TEST_KEY}`, sandbox)).toBe('undefined');
    });

    it('runs scriptlets registered in the function registry once per rule key', async () => {
        const result = await compileSharedScriptletsBundle(TEST_KEY);

        const sandbox = createPageSandbox();
        vm.runInContext(result, sandbox);

        vm.runInContext(`
            hits = [];
            ${TEST_KEY}.f['noop'] = function (source, args) {
                hits.push([source.domainName, args[0]]);
            };
            ${TEST_KEY}.r('noop', {}, ['x'], 'rule-1');
            ${TEST_KEY}.r('noop', {}, ['x'], 'rule-1');
            ${TEST_KEY}.r('noop', {}, ['y'], 'rule-2');
            ${TEST_KEY}.r('missing', {}, [], 'rule-3');
        `, sandbox);

        expect(sandbox.hits).toEqual([['example.com', 'x'], ['example.com', 'y']]);
    });

    it('strips one leading "www." label from domainName, mirroring the dynamic injection path', async () => {
        const result = await compileSharedScriptletsBundle(TEST_KEY);

        const sandbox = createPageSandbox();
        sandbox.document = { location: { hostname: 'www.example.com' } };
        vm.runInContext(result, sandbox);

        vm.runInContext(`
            hits = [];
            ${TEST_KEY}.f['noop'] = function (source) {
                hits.push(source.domainName);
            };
            ${TEST_KEY}.r('noop', {}, [], 'rule-1');
        `, sandbox);

        expect(sandbox.hits).toEqual(['example.com']);
    });

    it('produces valid JavaScript syntax', async () => {
        const result = await compileSharedScriptletsBundle(TEST_KEY);
        // If syntax were invalid, vm.Script would throw.
        expect(() => {
            // eslint-disable-next-line no-new
            new vm.Script(result);
        }).not.toThrow();
    });
});
