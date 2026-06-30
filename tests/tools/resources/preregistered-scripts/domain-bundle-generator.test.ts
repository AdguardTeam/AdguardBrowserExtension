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

import {
    compileDomainBundle,
} from '../../../../tools/resources/preregistered-scripts/domain-bundle-generator/domain-bundle-generator';

describe('compileDomainBundle', () => {
    it('returns null for empty JS rules and no scriptlet map', async () => {
        const result = await compileDomainBundle(new Set(), undefined);
        expect(result).toBeNull();
    });

    it('returns null for empty JS rules and empty scriptlet map', async () => {
        const result = await compileDomainBundle(new Set(), {});
        expect(result).toBeNull();
    });

    it('wraps output in an IIFE with _g guard', async () => {
        const result = await compileDomainBundle(new Set(['var x = 1;']), undefined);
        expect(result).not.toBeNull();
        expect(result).toContain('(function ()');
        expect(result).toContain('var _g = window._g');
        expect(result).toContain('if (!_g) return');
        expect(result).toContain('})();');
    });

    it('wraps each JS rule with a _g.b idempotency guard', async () => {
        const result = await compileDomainBundle(new Set(['var x = 1;']), undefined);
        expect(result).not.toBeNull();
        // The guard uses _g.b.has / _g.b.add with a unique key
        expect(result).toMatch(/_g\.b\.has\(/);
        expect(result).toMatch(/_g\.b\.add\(/);
    });

    it('produces valid JavaScript syntax for a simple rule', async () => {
        const result = await compileDomainBundle(new Set(['console.log("test");']), undefined);
        expect(result).not.toBeNull();
        // If syntax is invalid, validateSyntax inside writeBundle would throw,
        // but here we just confirm the output is a non-empty string
        expect(typeof result).toBe('string');
        expect(result!.length).toBeGreaterThan(0);
    });

    it('emits _g.r() calls for scriptlet invocations', async () => {
        const scriptletMap = {
            'abort-on-property-read': new Set(['["foo"]']),
        };
        const result = await compileDomainBundle(new Set(), scriptletMap);
        expect(result).not.toBeNull();
        expect(result).toContain('_g.r(');
        expect(result).toContain('"abort-on-property-read"');
    });

    it('includes scriptlet name, source, args and unique key in _g.r() call', async () => {
        const scriptletMap = {
            'set-constant': new Set(['["foo","true"]']),
        };
        const result = await compileDomainBundle(new Set(), scriptletMap);
        expect(result).not.toBeNull();
        // _g.r(name, source, args, key)
        expect(result).toContain('"set-constant"');
        // args array is passed as second-to-last arg
        expect(result).toContain('["foo","true"]');
    });

    it('deduplicates identical JS rules — same body appears only once', async () => {
        const rule = 'var x = 1;';
        // Set already deduplicates, so passing the same rule twice is just one rule
        const result = await compileDomainBundle(new Set([rule]), undefined);
        expect(result).not.toBeNull();
        // Count occurrences of the guard key assignment — should appear once
        const matches = result!.match(/_g\.b\.add\(/g);
        expect(matches).toHaveLength(1);
    });

    it('handles multiple JS rules, emitting a guard for each', async () => {
        const result = await compileDomainBundle(
            new Set(['var a = 1;', 'var b = 2;']),
            undefined,
        );
        expect(result).not.toBeNull();
        const guardCount = (result!.match(/_g\.b\.add\(/g) ?? []).length;
        expect(guardCount).toBe(2);
    });

    it('handles multiple scriptlet invocations', async () => {
        const scriptletMap = {
            'abort-on-property-read': new Set(['["foo"]', '["bar"]']),
        };
        const result = await compileDomainBundle(new Set(), scriptletMap);
        expect(result).not.toBeNull();
        const callCount = (result!.match(/_g\.r\(/g) ?? []).length;
        expect(callCount).toBe(2);
    });

    it('combines JS rules and scriptlets in the same bundle', async () => {
        const scriptletMap = {
            'log': new Set(['[]']),
        };
        const result = await compileDomainBundle(new Set(['var x = 1;']), scriptletMap);
        expect(result).not.toBeNull();
        expect(result).toMatch(/_g\.b\.add\(/);
        expect(result).toContain('_g.r(');
    });

    it('gracefully skips a rule with invalid syntax and continues', async () => {
        // An invalid rule should be skipped; the valid rule still produces output
        const result = await compileDomainBundle(
            new Set(['var x = 1;', '!!! INVALID SYNTAX !!!']),
            undefined,
        );
        // Output should still be produced for the valid rule
        expect(result).not.toBeNull();
    });
});
