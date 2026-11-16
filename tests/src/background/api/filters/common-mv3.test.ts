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

import browser from 'webextension-polyfill';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    type MockInstance,
    vi,
} from 'vitest';

import { getRulesetId, getRulesetPath } from '@adguard/dnr-converter';

import { CommonFilterApi } from '../../../../../Extension/src/background/api/filters/common';
import { metadataStorage } from '../../../../../Extension/src/background/storages';
import { FiltersStoragesAdapter } from '../../../../../Extension/src/background/storages/filters-adapter';
import { type RegularFilterMetadata } from '../../../../../Extension/src/background/schema';
import { getMetadataFixture } from '../../../../helpers';

/**
 * Filter id from the metadata that has no ruleset in the mocked manifest.
 * Reproduces filters 26 and 27 from AG-59479.
 */
const phantomFilterId = 26;

describe.skipIf(!__IS_MV3__)('CommonFilterApi (MV3)', () => {
    let getManifestSpy: MockInstance;
    let getFiltersSpy: MockInstance;
    let getFilterSpy: MockInstance;
    let manifestWithoutRulesets: ReturnType<typeof browser.runtime.getManifest>;
    let supportedFilters: RegularFilterMetadata[];
    let phantomFilter: RegularFilterMetadata;
    let filters: RegularFilterMetadata[];

    beforeEach(() => {
        const [firstFilter, secondFilter] = getMetadataFixture().filters;

        if (!firstFilter || !secondFilter) {
            throw new Error('The metadata fixture must contain at least two filters');
        }

        supportedFilters = [firstFilter, secondFilter];

        // The phantom filter is absent from the bundle, but present in the metadata.
        phantomFilter = { ...firstFilter, filterId: phantomFilterId };
        filters = [...supportedFilters, phantomFilter];

        // The adapter caches the ruleset ids, so reset the cache to apply the
        // mocked manifest.
        Reflect.set(FiltersStoragesAdapter, 'staticFilterIds', null);

        manifestWithoutRulesets = browser.runtime.getManifest();

        // Mock the bundled rulesets: only the supported filters have a ruleset.
        getManifestSpy = vi.spyOn(browser.runtime, 'getManifest').mockReturnValue({
            ...manifestWithoutRulesets,
            declarative_net_request: {
                rule_resources: supportedFilters.map((filter) => ({
                    id: getRulesetId(filter.filterId),
                    enabled: true,
                    path: getRulesetPath(filter.filterId),
                })),
            },
        });

        getFiltersSpy = vi.spyOn(metadataStorage, 'getFilters').mockReturnValue(filters);
        getFilterSpy = vi.spyOn(metadataStorage, 'getFilter')
            .mockImplementation((filterId) => filters.find((filter) => filter.filterId === filterId));
    });

    afterEach(() => {
        getManifestSpy.mockRestore();
        getFiltersSpy.mockRestore();
        getFilterSpy.mockRestore();
    });

    it('returns only filters with a bundled ruleset', () => {
        const filterIds = CommonFilterApi.getFiltersMetadata().map((filter) => filter.filterId);

        expect(filterIds).toEqual(supportedFilters.map((filter) => filter.filterId));
    });

    it('returns metadata only for filters with a bundled ruleset', () => {
        supportedFilters.forEach((filter) => {
            expect(CommonFilterApi.getFilterMetadata(filter.filterId)).toEqual(filter);
        });

        expect(CommonFilterApi.getFilterMetadata(phantomFilterId)).toBeUndefined();
    });

    it('reports support based on the bundled rulesets', () => {
        supportedFilters.forEach((filter) => {
            expect(CommonFilterApi.isFilterSupported(filter.filterId)).toBe(true);
        });

        expect(CommonFilterApi.isFilterSupported(phantomFilterId)).toBe(false);
    });

    it('does not filter metadata when the manifest declares no rulesets', () => {
        getManifestSpy.mockReturnValue(manifestWithoutRulesets);

        expect(CommonFilterApi.getFiltersMetadata()).toEqual(filters);
        expect(CommonFilterApi.getFilterMetadata(phantomFilterId)).toEqual(phantomFilter);
        expect(CommonFilterApi.isFilterSupported(phantomFilterId)).toBe(true);
    });
});
