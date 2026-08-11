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
        expect(domains).toEqual(['www.youtube.com', 'youtube.com']);

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

    it('throws when the same JS body is collected under different $path modifiers', async () => {
        setupRulesets([
            "[$domain=youtube.com,path=/a]#%#console.log('x');\n"
            + "[$domain=youtube.com,path=/b]#%#console.log('x');",
        ]);

        const collector = new ScriptletCollector('/fake/declarative');

        // One file per hash would run the shared body once per matching
        // rule at runtime, while dynamic injection dedups by body — the
        // build must fail loudly instead of silently diverging.
        await expect(collector.collect()).rejects.toThrow('JS body shared by rules');
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
        expect(domains).toEqual(['www.youtube.com', 'youtube.com']);
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
        // Only the www. hostname matched — the apex is not added, since
        // hostnames are no longer collapsed into one another.
        expect(domains).toEqual(['www.youtube.com']);
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
        expect(domains).toEqual(['www.youtube.com', 'youtube.com']);
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

    it('fails the build when a $path-scoped exception cancels a collected rule', async () => {
        // The blocking rule is uBO-syntax and is resolved to `ubo-set-constant`
        // by the engine, so the ADG-syntax exception targets that name.
        setupRulesets([
            'youtube.com##+js(set-constant, foo, bar)\n'
            + "[$domain=youtube.com,path=/shorts]#@%#//scriptlet('ubo-set-constant', 'foo', 'bar')",
        ]);

        const collector = new ScriptletCollector('/fake/declarative');

        // The guard rejects the whole collection — per-hostname preregistration
        // cannot honor path-scoped exceptions (see path-exception-guard.ts).
        await expect(collector.collect()).rejects.toThrow(/ruleset_1/);
        await expect(collector.collect()).rejects.toThrow(/set-constant/);
    });

    it('fails the build when the $path exception is declared in another ruleset', async () => {
        setupRulesets([
            'youtube.com##+js(set-constant, foo, bar)',
            "[$domain=youtube.com,path=/shorts]#@%#//scriptlet('ubo-set-constant', 'foo', 'bar')",
        ]);

        const collector = new ScriptletCollector('/fake/declarative');

        // The guard checks exceptions from all rulesets against all collected
        // rules — cross-filter cancellation trips it as well.
        await expect(collector.collect()).rejects.toThrow(/ruleset_2/);
    });

    it('fails the build when the $path exception is declared in an EARLIER ruleset than the rule', async () => {
        setupRulesets([
            "[$domain=youtube.com,path=/shorts]#@%#//scriptlet('ubo-set-constant', 'foo', 'bar')",
            'youtube.com##+js(set-constant, foo, bar)',
        ]);

        const collector = new ScriptletCollector('/fake/declarative');

        // The guard runs after ALL rulesets are collected, so the ruleset
        // order does not matter.
        await expect(collector.collect()).rejects.toThrow(/ruleset_1/);
    });

    it('does not fail when the $path exception targets an unused scriptlet', async () => {
        setupRulesets([
            'youtube.com##+js(set-constant, foo, bar)\n'
            + "[$domain=youtube.com,path=/shorts]#@%#//scriptlet('json-prune')",
        ]);

        const collector = new ScriptletCollector('/fake/declarative');
        const { rules, domains } = await collector.collect();

        expect(rules.size).toBe(1);
        expect(domains).toEqual(['www.youtube.com', 'youtube.com']);
    });

    it('does not fail when the $path exception is for an unrelated domain', async () => {
        setupRulesets([
            'youtube.com##+js(set-constant, foo, bar)\n'
            + "[$domain=example.com,path=/shorts]#@%#//scriptlet('ubo-set-constant', 'foo', 'bar')",
        ]);

        const collector = new ScriptletCollector('/fake/declarative');
        const { rules, domains } = await collector.collect();

        expect(rules.size).toBe(1);
        expect(domains).toEqual(['www.youtube.com', 'youtube.com']);
    });

    it('collects rules normally alongside element-hiding $path exceptions', async () => {
        setupRulesets([
            'youtube.com##+js(set-constant, foo, bar)\n'
            + '[$path=/jobs]youtube.com#@#.ad-banner',
        ]);

        const collector = new ScriptletCollector('/fake/declarative');
        const { rules, domains } = await collector.collect();

        expect(rules.size).toBe(1);
        expect(domains).toEqual(['www.youtube.com', 'youtube.com']);
    });
});
