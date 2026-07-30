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

    it('declares the coordination key as a top-level `let` binding wrapping an inner IIFE', async () => {
        const result = await compileSharedScriptletsBundle(
            new Set(['abort-on-property-read']),
            TEST_KEY,
        );
        expect(result).not.toBeNull();
        // Terser drops the (syntactically optional, in this position) parens
        // around the function expression, e.g. `let __ag_...;try{__ag_...=function(){...}()}catch...`
        expect(result).toMatch(/^let\s/);
        expect(result).toMatch(/=function\s*\(\)\s*\{/);
        // The IIFE is invoked inside a try block (init-guard fallback on rethrow):
        // minified form is `...=function(){...}()}catch(e){...}`.
        expect(result).toMatch(/\}\(\)\}\s*catch\s*\(\w+\)\s*\{/);
    });

    it('defines the coordination key using the provided key, not a fixed "_ag" name or window property', async () => {
        const result = await compileSharedScriptletsBundle(
            new Set(['abort-on-property-read']),
            TEST_KEY,
        );
        expect(result).not.toBeNull();
        expect(result).toContain(TEST_KEY);
        // The old hardcoded `window._ag` dot-access form, and any `window`
        // reference at all for the coordination key, must be gone.
        expect(result).not.toContain('window._ag');
        expect(result).not.toContain(`window.${TEST_KEY}`);
        expect(result).not.toContain(`window["${TEST_KEY}"]`);
    });

    it('uses a different coordination key per call, and only that key appears in the output', async () => {
        const keyA = '__ag_aaaaaaaaaaaaaaaa';
        const keyB = '__ag_bbbbbbbbbbbbbbbb';
        const resultA = await compileSharedScriptletsBundle(new Set(['abort-on-property-read']), keyA);
        const resultB = await compileSharedScriptletsBundle(new Set(['abort-on-property-read']), keyB);
        expect(resultA).toContain(keyA);
        expect(resultA).not.toContain(keyB);
        expect(resultB).toContain(keyB);
        expect(resultB).not.toContain(keyA);
    });

    it('throws if evaluated twice in the same realm (redeclaration = implicit re-injection guard)', async () => {
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

        // A second evaluation in the SAME realm conflicts with the already-declared
        // top-level `let` and throws — instead of silently overwriting state. This
        // scenario isn't expected in practice (chrome.scripting.registerContentScripts
        // injects each file at most once per matching document), but the failure
        // mode is a loud one, not a silent one.
        expect(() => vm.runInContext(result as string, sandbox)).toThrow(/already been declared/);
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

    it('declares the coordination key as a lexical binding invisible to window enumeration', async () => {
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

        // Reachable directly as a bare identifier (lexical binding, not a
        // `window` property)...
        expect(vm.runInContext(`typeof ${TEST_KEY}`, sandbox)).not.toBe('undefined');
        // ...but not an own property of `window` at all — invisible to every
        // enumeration mechanism, including `Object.getOwnPropertyNames` (unlike
        // the old `Object.defineProperty`-based approach, which was only
        // non-*enumerable*, still discoverable via `getOwnPropertyNames`).
        expect(TEST_KEY in sandbox.window).toBe(false);
        expect(Object.getOwnPropertyNames(sandbox.window)).not.toContain(TEST_KEY);
        expect(Object.keys(sandbox.window)).not.toContain(TEST_KEY);
        expect(JSON.stringify(sandbox.window)).not.toContain(TEST_KEY);

        // Cleanup (mirrors what cleanup.js does) reassigns it to `undefined` —
        // a lexical `let`/`const` binding has no `delete` operation, so this is
        // the closest equivalent, and it's just as effective: `typeof` can't
        // tell "declared and undefined" apart from "never declared", even for
        // a page that already knows the exact identifier.
        vm.runInContext(`${TEST_KEY} = undefined;`, sandbox);
        expect(vm.runInContext(`typeof ${TEST_KEY}`, sandbox)).toBe('undefined');
    });
});
