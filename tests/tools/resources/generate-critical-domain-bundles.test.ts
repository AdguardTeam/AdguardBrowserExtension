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

import { CosmeticRuleParser } from '@adguard/agtree/parser';

import {
    parseCriticalDomainsFile,
    ruleTargetsDomain,
    isGenericJsRule,
    domainToMatchPatterns,
    buildBundleFileName,
} from '../../../tools/resources/generate-critical-domain-bundles';

// ---------------------------------------------------------------------------
// parseCriticalDomainsFile
// ---------------------------------------------------------------------------
describe('parseCriticalDomainsFile', () => {
    it('returns non-empty, non-comment lines', () => {
        const content = [
            '# comment',
            'youtube.com',
            '',
            '  # another comment  ',
            'twitch.tv',
            '  ',
        ].join('\n');
        expect(parseCriticalDomainsFile(content)).toEqual(['youtube.com', 'twitch.tv']);
    });

    it('returns empty array for an all-comment file', () => {
        expect(parseCriticalDomainsFile('# nothing here\n')).toEqual([]);
    });

    it('trims whitespace from domain entries', () => {
        expect(parseCriticalDomainsFile('  youtube.com  \n')).toEqual(['youtube.com']);
    });
});

// ---------------------------------------------------------------------------
// ruleTargetsDomain
// ---------------------------------------------------------------------------
describe('ruleTargetsDomain', () => {
    /**
     * Parses a raw rule string into a JsInjectionRule node for testing.
     */
    const parseRule = (raw: string) => {
        return CosmeticRuleParser.parse(raw);
    };

    it('returns true for an exact domain match', () => {
        const node = parseRule('youtube.com#%#window._y=1;');
        expect(ruleTargetsDomain(node, 'youtube.com')).toBe(true);
    });

    it('returns true when rule targets a subdomain of the critical domain', () => {
        const node = parseRule('www.youtube.com#%#window._y=1;');
        expect(ruleTargetsDomain(node, 'youtube.com')).toBe(true);
    });

    it('returns true when rule targets multiple domains including the critical one', () => {
        const node = parseRule('youtube.com,example.com#%#window._y=1;');
        expect(ruleTargetsDomain(node, 'youtube.com')).toBe(true);
    });

    it('returns false when rule targets a different domain', () => {
        const node = parseRule('example.com#%#window._y=1;');
        expect(ruleTargetsDomain(node, 'youtube.com')).toBe(false);
    });

    it('returns false for a domain that shares a suffix but is not a subdomain', () => {
        // "notyoutube.com" should not match "youtube.com"
        const node = parseRule('notyoutube.com#%#window._y=1;');
        expect(ruleTargetsDomain(node, 'youtube.com')).toBe(false);
    });

    it('returns false when the rule has no domains (generic rule)', () => {
        // Generic JS rules are handled separately by isGenericJsRule
        const node = parseRule('#%#window._y=1;');
        expect(ruleTargetsDomain(node, 'youtube.com')).toBe(false);
    });

    it('returns false for a null node', () => {
        expect(ruleTargetsDomain(null as any, 'youtube.com')).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// isGenericJsRule
// ---------------------------------------------------------------------------
describe('isGenericJsRule', () => {
    const parseRule = (raw: string) => {
        return CosmeticRuleParser.parse(raw);
    };

    it('returns true when the rule has no domain specifier', () => {
        const node = parseRule('#%#window._y=1;');
        expect(isGenericJsRule(node)).toBe(true);
    });

    it('returns false when the rule has a domain specifier', () => {
        const node = parseRule('youtube.com#%#window._y=1;');
        expect(isGenericJsRule(node)).toBe(false);
    });

    it('returns false for a null node', () => {
        expect(isGenericJsRule(null as any)).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// domainToMatchPatterns
// ---------------------------------------------------------------------------
describe('domainToMatchPatterns', () => {
    it('produces apex and wildcard patterns', () => {
        expect(domainToMatchPatterns('youtube.com')).toEqual([
            '*://youtube.com/*',
            '*://*.youtube.com/*',
        ]);
    });

    it('works for a subdomain input', () => {
        expect(domainToMatchPatterns('music.youtube.com')).toEqual([
            '*://music.youtube.com/*',
            '*://*.music.youtube.com/*',
        ]);
    });
});

// ---------------------------------------------------------------------------
// buildBundleFileName
// ---------------------------------------------------------------------------
describe('buildBundleFileName', () => {
    it('appends .js to the domain', () => {
        expect(buildBundleFileName('youtube.com')).toBe('youtube.com.js');
    });
});
