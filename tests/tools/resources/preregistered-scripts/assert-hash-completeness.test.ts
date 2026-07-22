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

import { computeJsRuleHash } from '@adguard/tswebextension/mv3/preregistered-scripts/hasher';

/* eslint-disable max-len */
import { assertHashCompleteness } from '../../../../tools/resources/preregistered-scripts/assert-hash-completeness';
import { type CollectedRuleEntry } from '../../../../tools/resources/preregistered-scripts/scriptlet-collector';
import { readMetadataRuleSet, extractPreprocessedRawFilterList } from '../../../../tools/resources/filter-extractor';
/* eslint-enable max-len */

vi.mock('../../../../tools/resources/filter-extractor', () => ({
    readMetadataRuleSet: vi.fn(),
    extractPreprocessedRawFilterList: vi.fn(),
}));

/**
 * Configures the mocked `filter-extractor` helpers to return the given raw
 * filter list text for a single ruleset named `ruleset_1`.
 *
 * @param rawFilterList Raw filter list text.
 */
const setupRuleset = (rawFilterList: string): void => {
    vi.mocked(readMetadataRuleSet).mockResolvedValue({
        getRuleSetIds: () => ['ruleset_1'],
    } as any);
    vi.mocked(extractPreprocessedRawFilterList).mockResolvedValue(rawFilterList);
};

/**
 * Configures the mocked `filter-extractor` helpers to return the given raw
 * filter list text, one per mocked ruleset.
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

describe('assertHashCompleteness', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('does not throw when every engine-matched rule was collected', async () => {
        const jsBody = "console.log('hello');";
        setupRuleset(`youtube.com#%#${jsBody}`);

        const hash = await computeJsRuleHash(jsBody);
        const collectedRules = new Map<string, CollectedRuleEntry>([[hash, { hash, jsBody }]]);

        await expect(assertHashCompleteness('/fake/declarative', collectedRules)).resolves.toBeUndefined();
    });

    it('throws when a rule matched by the real engine was not collected', async () => {
        const jsBody = "console.log('missing');";
        setupRuleset(`youtube.com#%#${jsBody}`);

        // Nothing collected -- simulates the collector's own predicate
        // (wrongly) skipping a rule the real engine still matches.
        const collectedRules = new Map<string, CollectedRuleEntry>();

        await expect(assertHashCompleteness('/fake/declarative', collectedRules)).rejects.toThrow(
            /ext\.assertHashCompleteness/,
        );
    });

    it('detects a negative-only domain list rule that the engine matches but the collector missed', async () => {
        const jsBody = "console.log('applies-everywhere-except-example');";
        // Applies to every domain except example.com -- including youtube.com.
        setupRuleset(`~example.com#%#${jsBody}`);

        const collectedRules = new Map<string, CollectedRuleEntry>();

        await expect(assertHashCompleteness('/fake/declarative', collectedRules)).rejects.toThrow(
            /ext\.assertHashCompleteness/,
        );
    });

    it('does not flag a negative-only domain list rule that excludes the preregistered domain', async () => {
        const jsBody = "console.log('excluded-from-youtube');";
        setupRuleset(`~youtube.com#%#${jsBody}`);

        const collectedRules = new Map<string, CollectedRuleEntry>();

        // The rule doesn't apply to youtube.com at all, so nothing should be
        // expected for it -- no throw even though nothing was collected.
        await expect(assertHashCompleteness('/fake/declarative', collectedRules)).resolves.toBeUndefined();
    });

    it('checks each filter in isolation so one filter\'s exception cannot hide another\'s missing hash', async () => {
        const jsBody = "console.log('only-in-one-filter');";
        setupRulesets([
            `youtube.com#@%#${jsBody}`,
            `youtube.com#%#${jsBody}`,
        ]);

        const collectedRules = new Map<string, CollectedRuleEntry>();

        await expect(assertHashCompleteness('/fake/declarative', collectedRules)).rejects.toThrow(
            /ext\.assertHashCompleteness/,
        );
    });
});
