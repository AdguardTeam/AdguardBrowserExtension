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
 * literal (JSON-stringified) form in the compiled output.
 */
const TEST_KEY = '__ag_test0123456789ab';

describe('compileSharedScriptletsBundle', () => {
    it('returns null for an empty scriptlet names set', async () => {
        const result = await compileSharedScriptletsBundle(new Set(), TEST_KEY);
        expect(result).toBeNull();
    });

    it('returns null when all scriptlet names are unknown', async () => {
        const result = await compileSharedScriptletsBundle(
            new Set(['nonexistent-scriptlet-xyz', 'another-unknown-one']),
            TEST_KEY,
        );
        expect(result).toBeNull();
    });

    it('wraps output in an IIFE', async () => {
        const result = await compileSharedScriptletsBundle(
            new Set(['abort-on-property-read']),
            TEST_KEY,
        );
        expect(result).not.toBeNull();
        expect(result).toMatch(/^\(function\s*\(\)/);
        expect(result).toContain('})();');
    });

    it('defines the coordination property using the provided key, not a fixed "_ag" name', async () => {
        const result = await compileSharedScriptletsBundle(
            new Set(['abort-on-property-read']),
            TEST_KEY,
        );
        expect(result).not.toBeNull();
        expect(result).toContain(JSON.stringify(TEST_KEY));
        // The old hardcoded `window._ag` dot-access form must be gone.
        expect(result).not.toContain('window._ag');
    });

    it('uses a different coordination key per call, and only that key appears in the output', async () => {
        const keyA = '__ag_aaaaaaaaaaaaaaaa';
        const keyB = '__ag_bbbbbbbbbbbbbbbb';
        const resultA = await compileSharedScriptletsBundle(new Set(['abort-on-property-read']), keyA);
        const resultB = await compileSharedScriptletsBundle(new Set(['abort-on-property-read']), keyB);
        expect(resultA).toContain(JSON.stringify(keyA));
        expect(resultA).not.toContain(keyB);
        expect(resultB).toContain(JSON.stringify(keyB));
        expect(resultB).not.toContain(keyA);
    });

    it('includes a guard against double execution keyed off the coordination property', async () => {
        const result = await compileSharedScriptletsBundle(
            new Set(['abort-on-property-read']),
            TEST_KEY,
        );
        expect(result).not.toBeNull();
        // Member access on `window` for a valid-identifier key gets minified to
        // dot notation (`window.__ag_...`) by terser — functionally identical to
        // `window["__ag_..."]`, just shorter.
        expect(result).toContain(`window.${TEST_KEY}`);
    });

    it('includes the deduplication Set in the output', async () => {
        const result = await compileSharedScriptletsBundle(
            new Set(['abort-on-property-read']),
            TEST_KEY,
        );
        expect(result).not.toBeNull();
        // Terser outputs `new Set` without parens for no-arg constructor
        expect(result).toMatch(/new Set/);
    });

    it('exposes a runner function as the "r" property of the coordination object', async () => {
        const result = await compileSharedScriptletsBundle(
            new Set(['abort-on-property-read']),
            TEST_KEY,
        );
        expect(result).not.toBeNull();
        // The runner is defined as the `r` property on the coordination object
        expect(result).toMatch(/\br:/);
    });

    it('includes the scriptlet function definition in the output', async () => {
        const result = await compileSharedScriptletsBundle(
            new Set(['abort-on-property-read']),
            TEST_KEY,
        );
        expect(result).not.toBeNull();
        // The scriptlet function should appear somewhere in the compiled output
        expect(result!.length).toBeGreaterThan(100);
    });

    it('includes all requested scriptlet functions when multiple names are provided', async () => {
        const result = await compileSharedScriptletsBundle(
            new Set(['abort-on-property-read', 'set-constant']),
            TEST_KEY,
        );
        expect(result).not.toBeNull();
        // Both functions should be registered in the registry object
        expect(result).toContain('"abort-on-property-read"');
        expect(result).toContain('"set-constant"');
    });

    it('skips unknown scriptlet names and still compiles the known ones', async () => {
        const result = await compileSharedScriptletsBundle(
            new Set(['abort-on-property-read', 'totally-unknown-scriptlet']),
            TEST_KEY,
        );
        expect(result).not.toBeNull();
        expect(result).toContain('"abort-on-property-read"');
        expect(result).not.toContain('totally-unknown-scriptlet');
    });

    it('produces valid JavaScript syntax', async () => {
        const result = await compileSharedScriptletsBundle(
            new Set(['abort-on-property-read']),
            TEST_KEY,
        );
        expect(result).not.toBeNull();
        // If syntax were invalid, vm.Script would throw.
        expect(() => {
            // eslint-disable-next-line no-new
            new vm.Script(result as string);
        }).not.toThrow();
    });

    it('does not corrupt scriptlet source containing "$&" via String.replace special patterns', async () => {
        const result = await compileSharedScriptletsBundle(
            new Set(['abort-on-property-read', 'set-constant', 'json-prune']),
            TEST_KEY,
        );
        expect(result).not.toBeNull();
        expect(result).not.toContain('__FUNCTIONS__');
        expect(result).not.toContain('__REGISTRY__');
        expect(result).not.toContain('__PROP__');
        // The regex-escaping helper's replacement string must survive intact.
        expect(result).toContain('\\$&');
    });

    it('defines the coordination property as non-enumerable, and deletable by the cleanup file', async () => {
        const result = await compileSharedScriptletsBundle(
            new Set(['abort-on-property-read']),
            TEST_KEY,
        );
        expect(result).not.toBeNull();

        const sandbox: { window: Record<string, unknown>; document: { location: { hostname: string } } } = {
            window: {},
            document: { location: { hostname: 'example.com' } },
        };
        vm.createContext(sandbox);
        vm.runInContext(result as string, sandbox);

        // The property exists and is reachable by direct access...
        expect(TEST_KEY in sandbox.window).toBe(true);
        // ...but does not show up via enumeration (for...in / Object.keys / JSON.stringify)...
        expect(Object.keys(sandbox.window)).not.toContain(TEST_KEY);
        expect(JSON.stringify(sandbox.window)).not.toContain(TEST_KEY);
        // ...while still being discoverable via Object.getOwnPropertyNames, and
        // therefore still needing the cleanup file's deletion for real protection.
        expect(Object.getOwnPropertyNames(sandbox.window)).toContain(TEST_KEY);

        // Cleanup (mirrors what cleanup.js does) must be able to delete it.
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete sandbox.window[TEST_KEY];
        expect(TEST_KEY in sandbox.window).toBe(false);
    });
});
