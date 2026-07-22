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
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { FilterListParser, defaultParserOptions } from '@adguard/agtree/parser';
import { type AnyRule, type ScriptletInjectionRule } from '@adguard/agtree';

/* eslint-disable max-len */
import {
    isGenericCosmeticRule,
    isScriptletRule,
    isDomainOrSubdomain,
    isRuleTargetsDomain,
    extractScriptletNameAndArgs,
    ScriptletCollector,
} from '../../../../tools/resources/preregistered-scripts/scriptlet-collector';
import { readMetadataRuleSet, extractPreprocessedRawFilterList } from '../../../../tools/resources/filter-extractor';
/* eslint-enable max-len */

vi.mock('../../../../tools/resources/filter-extractor', () => ({
    readMetadataRuleSet: vi.fn(),
    extractPreprocessedRawFilterList: vi.fn(),
}));

/**
 * Parses a single raw filter rule string into its AST node via the real
 * agtree parser (`tolerant: true`, matching `ScriptletCollector`'s own usage).
 *
 * @param ruleText Raw filter rule text.
 *
 * @returns Parsed rule AST node.
 *
 * @throws If the rule text cannot be parsed into at least one rule node.
 */
const parseRule = (ruleText: string): AnyRule => {
    const filterListNode = FilterListParser.parse(ruleText, {
        ...defaultParserOptions,
        includeRaws: false,
        isLocIncluded: false,
        tolerant: true,
    });
    const [ruleNode] = filterListNode.children;
    if (!ruleNode) {
        throw new Error(`Failed to parse rule: ${ruleText}`);
    }
    return ruleNode;
};

describe('isGenericCosmeticRule', () => {
    it('returns true for a rule with no domains', () => {
        const rule = parseRule('##+js(set-constant, foo, bar)') as ScriptletInjectionRule;
        expect(isGenericCosmeticRule(rule)).toBe(true);
    });

    it('returns true for a rule whose only domain is the wildcard "*"', () => {
        const rule = parseRule('*##+js(set-constant, foo, bar)') as ScriptletInjectionRule;
        expect(isGenericCosmeticRule(rule)).toBe(true);
    });

    it('returns false for a rule with an explicit domain', () => {
        const rule = parseRule('youtube.com##+js(set-constant, foo, bar)') as ScriptletInjectionRule;
        expect(isGenericCosmeticRule(rule)).toBe(false);
    });
});

describe('isScriptletRule', () => {
    it('returns true for a uBO-style scriptlet rule', () => {
        const rule = parseRule('youtube.com##+js(set-constant, foo, bar)');
        expect(isScriptletRule(rule)).toBe(true);
    });

    it('returns true for an ABP-style scriptlet rule', () => {
        const rule = parseRule("youtube.com#%#//scriptlet('set-constant', 'foo', 'bar')");
        expect(isScriptletRule(rule)).toBe(true);
    });

    it('returns false for a plain JS injection rule', () => {
        const rule = parseRule('youtube.com#%#console.log(1);');
        expect(isScriptletRule(rule)).toBe(false);
    });

    it('returns false for null', () => {
        expect(isScriptletRule(null)).toBe(false);
    });

    it('returns false for a non-cosmetic (network) rule', () => {
        const rule = parseRule('||example.com^');
        expect(isScriptletRule(rule)).toBe(false);
    });
});

describe('isDomainOrSubdomain', () => {
    it('returns true for an exact match', () => {
        expect(isDomainOrSubdomain('youtube.com', 'youtube.com')).toBe(true);
    });

    it('returns true for a subdomain', () => {
        expect(isDomainOrSubdomain('m.youtube.com', 'youtube.com')).toBe(true);
    });

    it('returns false for an unrelated domain', () => {
        expect(isDomainOrSubdomain('google.com', 'youtube.com')).toBe(false);
    });

    it('returns false for a domain that merely ends with the target (not a real subdomain)', () => {
        expect(isDomainOrSubdomain('notyoutube.com', 'youtube.com')).toBe(false);
    });

    it('normalizes case and surrounding dots before comparing', () => {
        expect(isDomainOrSubdomain('YouTube.COM', 'youtube.com')).toBe(true);
        expect(isDomainOrSubdomain('.m.youtube.com.', 'youtube.com')).toBe(true);
    });
});

describe('isRuleTargetsDomain', () => {
    it('returns true for a generic rule regardless of domain', () => {
        const rule = parseRule('##+js(set-constant, foo, bar)') as ScriptletInjectionRule;
        expect(isRuleTargetsDomain(rule, 'youtube.com')).toBe(true);
    });

    it('returns true when the rule explicitly lists the domain', () => {
        const rule = parseRule('youtube.com##+js(set-constant, foo, bar)') as ScriptletInjectionRule;
        expect(isRuleTargetsDomain(rule, 'youtube.com')).toBe(true);
    });

    it('returns true when the rule targets a subdomain of the given domain', () => {
        const rule = parseRule('m.youtube.com##+js(set-constant, foo, bar)') as ScriptletInjectionRule;
        expect(isRuleTargetsDomain(rule, 'youtube.com')).toBe(true);
    });

    it('returns false when the rule targets an unrelated domain', () => {
        const rule = parseRule('example.com##+js(set-constant, foo, bar)') as ScriptletInjectionRule;
        expect(isRuleTargetsDomain(rule, 'youtube.com')).toBe(false);
    });

    it('ignores exception (~) domain entries when matching', () => {
        const rule = parseRule('~youtube.com,example.com##+js(set-constant, foo, bar)') as ScriptletInjectionRule;
        expect(isRuleTargetsDomain(rule, 'youtube.com')).toBe(false);
        expect(isRuleTargetsDomain(rule, 'example.com')).toBe(true);
    });

    it('returns true for a negative-only domain list when the target domain is not restricted', () => {
        // Applies everywhere EXCEPT example.com/foo.com — including youtube.com.
        const rule = parseRule('~example.com,~foo.com##+js(set-constant, foo, bar)') as ScriptletInjectionRule;
        expect(isRuleTargetsDomain(rule, 'youtube.com')).toBe(true);
    });

    it('returns false for a negative-only domain list when the target domain itself is restricted', () => {
        const rule = parseRule('~youtube.com,~foo.com##+js(set-constant, foo, bar)') as ScriptletInjectionRule;
        expect(isRuleTargetsDomain(rule, 'youtube.com')).toBe(false);
    });

    it('returns false for a negative-only domain list when a subdomain of the target is restricted', () => {
        const rule = parseRule('~m.youtube.com##+js(set-constant, foo, bar)') as ScriptletInjectionRule;
        expect(isRuleTargetsDomain(rule, 'm.youtube.com')).toBe(false);
        // The apex is unaffected — only the excluded subdomain is restricted.
        expect(isRuleTargetsDomain(rule, 'youtube.com')).toBe(true);
    });
});

describe('extractScriptletNameAndArgs', () => {
    it('extracts name and args from a uBO-style scriptlet rule', () => {
        const rule = parseRule('youtube.com##+js(set-constant, foo, bar)') as ScriptletInjectionRule;
        expect(extractScriptletNameAndArgs(rule)).toEqual({ name: 'set-constant', args: ['foo', 'bar'] });
    });

    it('extracts name and args from an ABP-style scriptlet rule with quoted params', () => {
        const rule = parseRule("youtube.com#%#//scriptlet('set-constant', 'foo', 'bar')") as ScriptletInjectionRule;
        expect(extractScriptletNameAndArgs(rule)).toEqual({ name: 'set-constant', args: ['foo', 'bar'] });
    });

    it('unescapes escaped quotes inside quoted arguments', () => {
        const rule = parseRule(
            String.raw`youtube.com#%#//scriptlet('set-constant', 'it\'s', 'bar')`,
        ) as ScriptletInjectionRule;
        expect(extractScriptletNameAndArgs(rule)).toEqual({ name: 'set-constant', args: ["it's", 'bar'] });
    });

    it('returns an empty args array for a scriptlet with no arguments', () => {
        const rule = parseRule('youtube.com##+js(set-constant)') as ScriptletInjectionRule;
        expect(extractScriptletNameAndArgs(rule)).toEqual({ name: 'set-constant', args: [] });
    });
});

describe('ScriptletCollector.isCollectibleBlockingRule', () => {
    const isCollectible = (
        ruleNode: AnyRule,
        domains: readonly string[] = ['youtube.com'],
    ): boolean => (ScriptletCollector as any).isCollectibleBlockingRule(ruleNode, domains);

    it('returns true for a non-exception scriptlet rule targeting a preregistered domain', () => {
        const rule = parseRule('youtube.com##+js(set-constant, foo, bar)');
        expect(isCollectible(rule)).toBe(true);
    });

    it('returns true for a non-exception JS injection rule targeting a preregistered domain', () => {
        const rule = parseRule('youtube.com#%#console.log(1);');
        expect(isCollectible(rule)).toBe(true);
    });

    it('returns false for an exception scriptlet rule', () => {
        const rule = parseRule('youtube.com#@#+js(set-constant, foo, bar)');
        expect(isCollectible(rule)).toBe(false);
    });

    it('returns false for an exception JS injection rule', () => {
        const rule = parseRule('youtube.com#@%#console.log(1);');
        expect(isCollectible(rule)).toBe(false);
    });

    it('returns false for a rule targeting an unrelated domain', () => {
        const rule = parseRule('example.com##+js(set-constant, foo, bar)');
        expect(isCollectible(rule)).toBe(false);
    });

    it('returns false for a non-JS/scriptlet cosmetic rule (element hiding)', () => {
        const rule = parseRule('youtube.com##.ad-banner');
        expect(isCollectible(rule)).toBe(false);
    });
});

describe('ScriptletCollector.collect', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    /**
     * Configures the mocked `filter-extractor` helpers to return the given
     * raw filter list text for a single ruleset named `ruleset_1`.
     *
     * @param rawFilterLists One raw filter list string per mocked ruleset.
     */
    const setupRulesets = (rawFilterLists: string[]): void => {
        const ruleSetIds = rawFilterLists.map((_, i) => `ruleset_${i + 1}`);
        vi.mocked(readMetadataRuleSet).mockResolvedValue({
            getRuleSetIds: () => ruleSetIds,
        } as any);
        vi.mocked(extractPreprocessedRawFilterList).mockImplementation(
            async (ruleSetId: string) => rawFilterLists[ruleSetIds.indexOf(ruleSetId)] ?? '',
        );
    };

    it('collects a unique scriptlet rule and its target domain', async () => {
        setupRulesets(['youtube.com##+js(set-constant, foo, bar)']);

        const collector = new ScriptletCollector('/fake/declarative');
        const { rules, scriptletNames, domains } = await collector.collect();

        expect(rules.size).toBe(1);
        expect(scriptletNames).toEqual(new Set(['set-constant']));
        expect(domains).toEqual(['youtube.com']);

        const [entry] = [...rules.values()];
        expect(entry).toMatchObject({ scriptletName: 'set-constant', scriptletArgs: ['foo', 'bar'] });
    });

    it('deduplicates identical scriptlet rules across and within rulesets by hash', async () => {
        setupRulesets([
            'youtube.com##+js(set-constant, foo, bar)\nyoutube.com##+js(set-constant, foo, bar)',
            'm.youtube.com##+js(set-constant, foo, bar)',
        ]);

        const collector = new ScriptletCollector('/fake/declarative');
        const { rules } = await collector.collect();

        // Same scriptlet name/args → same hash → single entry, even though it
        // appears 3 times across 2 rulesets and on 2 different domains.
        expect(rules.size).toBe(1);
    });

    it('excludes rules that do not target any preregistered domain', async () => {
        setupRulesets(['unrelated.com##+js(set-constant, foo, bar)']);

        const collector = new ScriptletCollector('/fake/declarative');
        const { rules, domains } = await collector.collect();

        expect(rules.size).toBe(0);
        expect(domains).toEqual([]);
    });

    it('includes generic (domain-less) rules for all preregistered domains', async () => {
        setupRulesets(['##+js(set-constant, foo, bar)']);

        const collector = new ScriptletCollector('/fake/declarative');
        const { rules, domains } = await collector.collect();

        expect(rules.size).toBe(1);
        expect(domains).toEqual(['youtube.com']);
    });

    it('collects JS injection rules with a body-based hash', async () => {
        setupRulesets(["youtube.com#%#console.log('hello');"]);

        const collector = new ScriptletCollector('/fake/declarative');
        const { rules } = await collector.collect();

        expect(rules.size).toBe(1);
        const [entry] = [...rules.values()];
        if (!entry) {
            throw new Error('Expected exactly one rule entry');
        }
        expect(entry.jsBody).toContain("console.log('hello')");
    });

    it('excludes exception rules from the collected rule set', async () => {
        setupRulesets([
            'youtube.com##+js(set-constant, foo, bar)\nyoutube.com#@#+js(set-constant, foo, bar)',
        ]);

        const collector = new ScriptletCollector('/fake/declarative');
        const { rules, domains } = await collector.collect();

        // Only the non-exception rule is collected...
        expect(rules.size).toBe(1);
        // ...but the exception rule's domain is still recorded, so the
        // runtime knows to query the engine for it.
        expect(domains).toEqual(['youtube.com']);
    });

    it('records subdomains with different rule sets as separate domain entries', async () => {
        setupRulesets([
            'youtube.com##+js(set-constant, foo, bar)\nm.youtube.com##+js(set-constant, foo, baz)',
        ]);

        const collector = new ScriptletCollector('/fake/declarative');
        const { rules, domains } = await collector.collect();

        expect(rules.size).toBe(2);
        expect(domains.sort()).toEqual(['m.youtube.com', 'youtube.com']);
    });

    it('collects a rule with a negative-only domain list that does not restrict the preregistered domain', async () => {
        setupRulesets(['~example.com##+js(set-constant, foo, bar)']);

        const collector = new ScriptletCollector('/fake/declarative');
        const { rules, domains } = await collector.collect();

        // The rule applies everywhere except example.com, so it targets
        // youtube.com even though youtube.com is never explicitly mentioned.
        expect(rules.size).toBe(1);
        expect(domains).toEqual(['youtube.com']);
    });

    it('excludes a rule with a negative-only domain list that restricts the preregistered domain', async () => {
        setupRulesets(['~youtube.com##+js(set-constant, foo, bar)']);

        const collector = new ScriptletCollector('/fake/declarative');
        const { rules, domains } = await collector.collect();

        expect(rules.size).toBe(0);
        // youtube.com is still recorded (as the literal excluded domain), so
        // the runtime can query it and populate `excludeMatches` correctly.
        expect(domains).toEqual(['youtube.com']);
    });
});
