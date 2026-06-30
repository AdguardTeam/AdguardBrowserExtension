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
    type DomainRules,
    type DomainScriptlets,
} from '../../../../tools/resources/preregistered-scripts/filter-collector';
import { buildRegistry } from '../../../../tools/resources/preregistered-scripts/registry';

describe('buildRegistry', () => {
    it('returns an empty object when both maps are empty', () => {
        const domainRules: DomainRules = new Map();
        expect(buildRegistry(domainRules)).toEqual({});
    });

    it('returns an empty object when domainRules has a domain with no filter IDs', () => {
        const domainRules: DomainRules = new Map([['youtube.com', new Map()]]);
        expect(buildRegistry(domainRules)).toEqual({});
    });

    it('builds registry from domainRules alone', () => {
        const domainRules: DomainRules = new Map([
            ['youtube.com', new Map([[2, new Set(['body1'])], [14, new Set(['body2'])]])],
        ]);
        const result = buildRegistry(domainRules);
        expect(result).toEqual({ 'youtube.com': ['2', '14'] });
    });

    it('sorts filter IDs numerically (not lexicographically)', () => {
        const domainRules: DomainRules = new Map([
            ['youtube.com', new Map([[9, new Set()], [10, new Set()], [2, new Set()]])],
        ]);
        const result = buildRegistry(domainRules);
        // 2, 9, 10 — numeric sort, not ['10', '2', '9'] lexicographic
        expect(result['youtube.com']).toEqual(['2', '9', '10']);
    });

    it('merges domainRules and domainScriptlets for the same domain', () => {
        const domainRules: DomainRules = new Map([
            ['youtube.com', new Map([[2, new Set(['body1'])]])],
        ]);
        const domainScriptlets: DomainScriptlets = new Map([
            ['youtube.com', new Map([[14, { 'abort-on-property-read': new Set(['["foo"]']) }]])],
        ]);
        const result = buildRegistry(domainRules, domainScriptlets);
        expect(result['youtube.com']).toEqual(['2', '14']);
    });

    it('deduplicates filter IDs present in both rules and scriptlets', () => {
        const domainRules: DomainRules = new Map([
            ['youtube.com', new Map([[2, new Set(['body1'])]])],
        ]);
        const domainScriptlets: DomainScriptlets = new Map([
            ['youtube.com', new Map([[2, { log: new Set(['[]']) }]])],
        ]);
        const result = buildRegistry(domainRules, domainScriptlets);
        expect(result['youtube.com']).toEqual(['2']);
    });

    it('handles multiple domains independently', () => {
        const domainRules: DomainRules = new Map([
            ['youtube.com', new Map([[2, new Set(['body1'])], [14, new Set(['body2'])]])],
            ['example.com', new Map([[5, new Set(['body3'])]])],
        ]);
        const result = buildRegistry(domainRules);
        expect(result['youtube.com']).toEqual(['2', '14']);
        expect(result['example.com']).toEqual(['5']);
    });

    it('includes domains present only in domainScriptlets', () => {
        const domainRules: DomainRules = new Map();
        const domainScriptlets: DomainScriptlets = new Map([
            ['example.com', new Map([[3, { log: new Set(['[]']) }]])],
        ]);
        const result = buildRegistry(domainRules, domainScriptlets);
        expect(result).toEqual({ 'example.com': ['3'] });
    });

    it('omits domains where all filter maps are empty', () => {
        const domainRules: DomainRules = new Map([
            ['youtube.com', new Map()],
        ]);
        const domainScriptlets: DomainScriptlets = new Map([
            ['youtube.com', new Map()],
        ]);
        const result = buildRegistry(domainRules, domainScriptlets);
        expect(result).toEqual({});
    });
});
