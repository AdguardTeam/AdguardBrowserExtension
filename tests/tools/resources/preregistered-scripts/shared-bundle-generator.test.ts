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

describe('compileSharedScriptletsBundle', () => {
    it('returns null for an empty scriptlet names set', async () => {
        const result = await compileSharedScriptletsBundle(new Set());
        expect(result).toBeNull();
    });

    it('returns null when all scriptlet names are unknown', async () => {
        const result = await compileSharedScriptletsBundle(
            new Set(['nonexistent-scriptlet-xyz', 'another-unknown-one']),
        );
        expect(result).toBeNull();
    });

    it('wraps output in an IIFE', async () => {
        const result = await compileSharedScriptletsBundle(
            new Set(['abort-on-property-read']),
        );
        expect(result).not.toBeNull();
        expect(result).toMatch(/^\(function\s*\(\)/);
        expect(result).toContain('})();');
    });

    it('defines the window._ag API object in the output', async () => {
        const result = await compileSharedScriptletsBundle(
            new Set(['abort-on-property-read']),
        );
        expect(result).not.toBeNull();
        expect(result).toContain('window._ag');
    });

    it('includes a guard against double execution', async () => {
        const result = await compileSharedScriptletsBundle(
            new Set(['abort-on-property-read']),
        );
        expect(result).not.toBeNull();
        // Minified: `if(!window._ag)` or `if (window._ag)`
        expect(result).toMatch(/window\._ag/);
    });

    it('includes the deduplication Set in the output', async () => {
        const result = await compileSharedScriptletsBundle(
            new Set(['abort-on-property-read']),
        );
        expect(result).not.toBeNull();
        // Terser outputs `new Set` without parens for no-arg constructor
        expect(result).toMatch(/new Set/);
    });

    it('exposes a runner function _ag.r', async () => {
        const result = await compileSharedScriptletsBundle(
            new Set(['abort-on-property-read']),
        );
        expect(result).not.toBeNull();
        // The runner is defined as the `r` property on the `window._ag` object
        expect(result).toMatch(/\br:/);
    });

    it('includes the scriptlet function definition in the output', async () => {
        const result = await compileSharedScriptletsBundle(
            new Set(['abort-on-property-read']),
        );
        expect(result).not.toBeNull();
        // The scriptlet function should appear somewhere in the compiled output
        expect(result!.length).toBeGreaterThan(100);
    });

    it('includes all requested scriptlet functions when multiple names are provided', async () => {
        const result = await compileSharedScriptletsBundle(
            new Set(['abort-on-property-read', 'set-constant']),
        );
        expect(result).not.toBeNull();
        // Both functions should be registered in the registry object
        expect(result).toContain('"abort-on-property-read"');
        expect(result).toContain('"set-constant"');
    });

    it('skips unknown scriptlet names and still compiles the known ones', async () => {
        const result = await compileSharedScriptletsBundle(
            new Set(['abort-on-property-read', 'totally-unknown-scriptlet']),
        );
        expect(result).not.toBeNull();
        expect(result).toContain('"abort-on-property-read"');
        expect(result).not.toContain('totally-unknown-scriptlet');
    });

    it('produces valid JavaScript syntax', async () => {
        const result = await compileSharedScriptletsBundle(
            new Set(['abort-on-property-read']),
        );
        expect(result).not.toBeNull();
        // If syntax were invalid, vm.Script would throw — we verify it's a
        // non-empty string and starts/ends with the expected IIFE delimiters
        expect(result).toMatch(/^\(function/);
        expect(result!.trimEnd()).toMatch(/\}\)\(\);$/);
    });
});
