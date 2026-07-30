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
    expect,
    it,
} from 'vitest';

/* eslint-disable max-len */
import { assertNoPathScopedExceptions } from '../../../../tools/resources/preregistered-scripts/path-exception-guard';
/* eslint-enable max-len */

describe('assertNoPathScopedExceptions', () => {
    const HASH = 'hash1';
    const entry = {
        scriptletName: 'ubo-set-constant',
        scriptletArgs: ['foo', 'bar'],
    };
    const hostnames = ['youtube.com', 'www.youtube.com'];

    /**
     * Runs the guard for one filter list against one collected entry.
     *
     * @param filterList Raw filter list text.
     * @param ruleEntry Collected rule entry.
     */
    const runGuard = (
        filterList: string,
        ruleEntry: { scriptletName?: string; scriptletArgs?: string[]; jsBody?: string } = entry,
    ): void => {
        assertNoPathScopedExceptions(filterList, 'ruleset_2', new Map([[HASH, ruleEntry]]), hostnames);
    };

    it('skips blocking rules, no-path exceptions, comments and junk', () => {
        expect(() => runGuard([
            "[$domain=youtube.com,path=/watch]#%#//scriptlet('ubo-set-constant', 'foo', 'bar')",
            "youtube.com#@%#//scriptlet('ubo-set-constant', 'foo', 'bar')",
            '! [$domain=youtube.com,path=/shorts]#@%#//scriptlet("ubo-set-constant", "foo", "bar")',
            'not a rule with path= inside',
            '',
        ].join('\n'))).not.toThrow();
    });

    it('throws when a name+args exception cancels the collected scriptlet', () => {
        expect(() => runGuard(
            "[$domain=youtube.com,path=/shorts]#@%#//scriptlet('ubo-set-constant', 'foo', 'bar')",
        )).toThrow(/ruleset_2/);
        expect(() => runGuard(
            "[$domain=youtube.com,path=/shorts]#@%#//scriptlet('ubo-set-constant', 'foo', 'bar')",
        )).toThrow(/youtube\.com/);
        expect(() => runGuard(
            "[$domain=youtube.com,path=/shorts]#@%#//scriptlet('ubo-set-constant', 'foo', 'bar')",
        )).toThrow(/ubo-set-constant/);
    });

    it('throws on a generic scriptlet exception (cancels all scriptlets)', () => {
        expect(() => runGuard('[$domain=youtube.com,path=/shorts]#@%#//scriptlet()'))
            .toThrow(/cancels/);
    });

    it('throws on a name-only exception matching the collected scriptlet', () => {
        expect(() => runGuard("[$domain=youtube.com,path=/shorts]#@%#//scriptlet('ubo-set-constant')"))
            .toThrow(/cancels/);
    });

    it('does not throw when the exception targets a different scriptlet', () => {
        expect(() => runGuard("[$domain=youtube.com,path=/shorts]#@%#//scriptlet('json-prune')"))
            .not.toThrow();
    });

    it('does not throw on same name with different args', () => {
        expect(() => runGuard("[$domain=youtube.com,path=/shorts]#@%#//scriptlet('ubo-set-constant', 'foo', 'baz')"))
            .not.toThrow();
    });

    it('does not throw when the exception domain matches no preregistered hostname', () => {
        expect(() => runGuard("[$domain=example.com,path=/shorts]#@%#//scriptlet('ubo-set-constant', 'foo', 'bar')"))
            .not.toThrow();
    });

    it('throws when a domain-less exception matches any collected hostname', () => {
        expect(() => runGuard("[$path=/shorts]#@%#//scriptlet('ubo-set-constant', 'foo', 'bar')"))
            .toThrow(/cancels/);
    });

    it('throws when a JS exception matches the collected JS rule body', () => {
        expect(() => runGuard(
            "[$domain=youtube.com,path=/live]#@%#console.log('x');",
            { jsBody: "console.log('x');" },
        )).toThrow(/cancels/);
    });

    it('does not throw when a JS exception has a different body', () => {
        expect(() => runGuard(
            "[$domain=youtube.com,path=/live]#@%#console.log('y');",
            { jsBody: "console.log('x');" },
        )).not.toThrow();
    });

    it('does not throw on element-hiding $path exceptions', () => {
        expect(() => runGuard('[$path=/jobs]youtube.com#@#.ad-banner'))
            .not.toThrow();
    });

    it('does not throw on an empty filter list', () => {
        expect(() => runGuard('')).not.toThrow();
    });
});
