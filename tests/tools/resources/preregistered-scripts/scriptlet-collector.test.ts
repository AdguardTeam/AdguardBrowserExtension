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

/* eslint-disable max-len */
import { ScriptletCollector } from '../../../../tools/resources/preregistered-scripts/scriptlet-collector';
import { readMetadataRuleSet, extractPreprocessedRawFilterList } from '../../../../tools/resources/filter-extractor';
/* eslint-enable max-len */

vi.mock('../../../../tools/resources/filter-extractor', () => ({
    readMetadataRuleSet: vi.fn(),
    extractPreprocessedRawFilterList: vi.fn(),
}));

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
        // The real engine resolves uBO-syntax scriptlet calls to their
        // dialect-specific `ubo-` counterpart during filter list conversion
        // (`RawRuleConverter.convertToAdg`) — going through the real `Engine`
        // (instead of hand-constructing a `CosmeticRule` from a raw AST node)
        // picks this up automatically.
        expect(scriptletNames).toEqual(new Set(['ubo-set-constant']));
        expect(domains).toEqual(['youtube.com']);

        const [entry] = [...rules.values()];
        expect(entry).toMatchObject({ scriptletName: 'ubo-set-constant', scriptletArgs: ['foo', 'bar'] });
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

    it('excludes a generic rule cancelled by a domain-specific exception', async () => {
        setupRulesets([
            '##+js(set-constant, foo, bar)\nyoutube.com#@#+js(set-constant, foo, bar)',
        ]);

        const collector = new ScriptletCollector('/fake/declarative');
        const { rules, domains } = await collector.collect();

        // The domain-specific exception cancels the generic rule for
        // youtube.com specifically, so no rule is collected for it.
        expect(rules.size).toBe(0);
        expect(domains).toEqual([]);
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

    it('excludes rules cancelled by a matching exception rule', async () => {
        setupRulesets([
            'youtube.com##+js(set-constant, foo, bar)\nyoutube.com#@#+js(set-constant, foo, bar)',
        ]);

        const collector = new ScriptletCollector('/fake/declarative');
        const { rules, domains } = await collector.collect();

        // The exception cancels the matching scriptlet rule entirely — neither
        // contributes a collected rule or a domain.
        expect(rules.size).toBe(0);
        expect(domains).toEqual([]);
    });

    it('does not collect a rule scoped only to an unrelated subdomain (e.g. m.youtube.com)', async () => {
        setupRulesets(['m.youtube.com##+js(set-constant, foo, bar)']);

        const collector = new ScriptletCollector('/fake/declarative');
        const { rules, domains } = await collector.collect();

        // Subdomains other than `www.` are intentionally not covered.
        expect(rules.size).toBe(0);
        expect(domains).toEqual([]);
    });

    it('collects a rule scoped only to the www. alias of a preregistered domain', async () => {
        setupRulesets(['www.youtube.com##+js(set-constant, foo, bar)']);

        const collector = new ScriptletCollector('/fake/declarative');
        const { rules, domains } = await collector.collect();

        expect(rules.size).toBe(1);
        expect(domains).toEqual(['youtube.com']);
    });

    it('captures the $path modifier pattern on the collected rule entry', async () => {
        setupRulesets(["[$domain=youtube.com,path=/watch]#%#//scriptlet('set-constant', 'foo', 'bar')"]);

        const collector = new ScriptletCollector('/fake/declarative');
        const { rules } = await collector.collect();

        expect(rules.size).toBe(1);
        const [entry] = [...rules.values()];
        expect(entry).toMatchObject({ pathPattern: '/watch' });
    });

    it('leaves pathPattern undefined for a rule without a $path modifier', async () => {
        setupRulesets(['youtube.com##+js(set-constant, foo, bar)']);

        const collector = new ScriptletCollector('/fake/declarative');
        const { rules } = await collector.collect();

        const [entry] = [...rules.values()];
        expect(entry?.pathPattern).toBeUndefined();
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
        expect(domains).toEqual([]);
    });

    it('excludes a non-JS/scriptlet cosmetic rule (element hiding)', async () => {
        setupRulesets(['youtube.com##.ad-banner']);

        const collector = new ScriptletCollector('/fake/declarative');
        const { rules, domains } = await collector.collect();

        expect(rules.size).toBe(0);
        expect(domains).toEqual([]);
    });
});
