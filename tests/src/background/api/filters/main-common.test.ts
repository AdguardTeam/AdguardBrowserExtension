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

import { CustomFilterApi } from '../../../../../Extension/src/background/api';
import { FiltersApiCommon } from '../../../../../Extension/src/background/api/filters/main/main-common';
import { type RegularFilterMetadata } from '../../../../../Extension/src/background/schema';
import {
    customFilterMetadataStorage,
    filterStateStorage,
    groupStateStorage,
    metadataStorage,
} from '../../../../../Extension/src/background/storages';
import { FiltersStoragesAdapter } from '../../../../../Extension/src/background/storages/filters-adapter';
import { getMetadataFixture } from '../../../../helpers';

/**
 * Filter id from the metadata that has no ruleset in the mocked manifest.
 */
const deprecatedFilterId = 26;

/**
 * Filter id that is absent from the metadata and must be removed as obsolete.
 */
const obsoleteFilterId = 10000;

/**
 * Calls the private migration method of {@link FiltersApiCommon}.
 *
 * @returns Deprecated filters ids.
 */
const migrateDeprecatedFilters = (): Promise<number[]> => {
    const method = Reflect.get(FiltersApiCommon, 'migrateDeprecatedFilters') as () => Promise<number[]>;

    return method.call(FiltersApiCommon);
};

/**
 * Calls the protected method of {@link FiltersApiCommon} which removes
 * obsolete filters.
 *
 * @returns Promise that resolves when the removal is finished.
 */
const removeObsoleteFilters = (): Promise<void> => {
    const method = Reflect.get(FiltersApiCommon, 'removeObsoleteFilters') as () => Promise<void>;

    return method.call(FiltersApiCommon);
};

describe.skipIf(!__IS_MV3__)('FiltersApiCommon.migrateDeprecatedFilters (MV3)', () => {
    let getManifestSpy: MockInstance;
    let getFiltersSpy: MockInstance;
    let getInstalledFiltersSpy: MockInstance;
    let getEnabledFiltersSpy: MockInstance;
    let getEnabledGroupsSpy: MockInstance;
    let createFilterSpy: MockInstance;
    let removeFilter: unknown;
    let removeFilterSpy: MockInstance;
    let deprecatedFilter: RegularFilterMetadata;

    beforeEach(() => {
        const [firstFilter] = getMetadataFixture().filters;

        if (!firstFilter) {
            throw new Error('The metadata fixture must contain at least one filter');
        }

        // The deprecated filter is present in the metadata, but has no ruleset
        // in the extension bundle.
        deprecatedFilter = {
            ...firstFilter,
            filterId: deprecatedFilterId,
            deprecated: true,
            subscriptionUrl: 'https://filters.adtidy.org/extension/chromium/filters/26.txt',
        };

        // The adapter caches the ruleset ids, so reset the cache to apply the
        // mocked manifest.
        Reflect.set(FiltersStoragesAdapter, 'staticFilterIds', null);

        // Mock the bundled rulesets: only the supported filter has a ruleset.
        getManifestSpy = vi.spyOn(browser.runtime, 'getManifest').mockReturnValue({
            ...browser.runtime.getManifest(),
            declarative_net_request: {
                rule_resources: [{
                    id: getRulesetId(firstFilter.filterId),
                    enabled: true,
                    path: getRulesetPath(firstFilter.filterId),
                }],
            },
        });

        getFiltersSpy = vi.spyOn(metadataStorage, 'getFilters')
            .mockReturnValue([firstFilter, deprecatedFilter]);
        getInstalledFiltersSpy = vi.spyOn(filterStateStorage, 'getInstalledFilters')
            .mockReturnValue([deprecatedFilterId]);
        getEnabledFiltersSpy = vi.spyOn(filterStateStorage, 'getEnabledFilters')
            .mockReturnValue([deprecatedFilterId]);
        getEnabledGroupsSpy = vi.spyOn(groupStateStorage, 'getEnabledGroups')
            .mockReturnValue([deprecatedFilter.groupId]);

        removeFilter = Reflect.get(FiltersApiCommon, 'removeFilter');
        removeFilterSpy = vi.fn().mockResolvedValue(undefined);
        Reflect.set(FiltersApiCommon, 'removeFilter', removeFilterSpy);

        createFilterSpy = vi.spyOn(CustomFilterApi, 'createFilter')
            .mockResolvedValue({} as Awaited<ReturnType<typeof CustomFilterApi.createFilter>>);
    });

    afterEach(() => {
        getManifestSpy.mockRestore();
        getFiltersSpy.mockRestore();
        getInstalledFiltersSpy.mockRestore();
        getEnabledFiltersSpy.mockRestore();
        getEnabledGroupsSpy.mockRestore();
        createFilterSpy.mockRestore();
        Reflect.set(FiltersApiCommon, 'removeFilter', removeFilter);
    });

    it('migrates an enabled deprecated filter that has no bundled ruleset', async () => {
        await migrateDeprecatedFilters();

        expect(removeFilterSpy).toHaveBeenCalledWith(deprecatedFilterId);
        expect(createFilterSpy).toHaveBeenCalledWith(expect.objectContaining({
            customUrl: deprecatedFilter.subscriptionUrl,
            enabled: true,
        }));
    });

    it('does not migrate a deprecated filter of a disabled group', async () => {
        getEnabledGroupsSpy.mockReturnValue([]);

        await migrateDeprecatedFilters();

        expect(removeFilterSpy).toHaveBeenCalledWith(deprecatedFilterId);
        expect(createFilterSpy).not.toHaveBeenCalled();
    });
});

describe.skipIf(!__IS_MV3__)('FiltersApiCommon.removeObsoleteFilters (MV3)', () => {
    let getManifestSpy: MockInstance;
    let getFiltersSpy: MockInstance;
    let getInstalledFiltersSpy: MockInstance;
    let removeFilter: unknown;
    let removeFilterSpy: MockInstance;
    let supportedFilter: RegularFilterMetadata;
    let rulesetLessFilter: RegularFilterMetadata;

    beforeEach(() => {
        const [firstFilter, secondFilter] = getMetadataFixture().filters;

        if (!firstFilter || !secondFilter) {
            throw new Error('The metadata fixture must contain at least two filters');
        }

        supportedFilter = firstFilter;
        // The ruleset-less filter is present in the metadata, but has no ruleset
        // in the extension bundle.
        rulesetLessFilter = secondFilter;

        // The custom filters metadata is not used by the method under test, but
        // the storage must be initialized to be readable.
        customFilterMetadataStorage.setCache([]);

        // The adapter caches the ruleset ids, so reset the cache to apply the
        // mocked manifest.
        Reflect.set(FiltersStoragesAdapter, 'staticFilterIds', null);

        // Mock the bundled rulesets: only the supported filter has a ruleset.
        getManifestSpy = vi.spyOn(browser.runtime, 'getManifest').mockReturnValue({
            ...browser.runtime.getManifest(),
            declarative_net_request: {
                rule_resources: [{
                    id: getRulesetId(supportedFilter.filterId),
                    enabled: true,
                    path: getRulesetPath(supportedFilter.filterId),
                }],
            },
        });

        getFiltersSpy = vi.spyOn(metadataStorage, 'getFilters')
            .mockReturnValue([supportedFilter, rulesetLessFilter]);
        getInstalledFiltersSpy = vi.spyOn(filterStateStorage, 'getInstalledFilters')
            .mockReturnValue([rulesetLessFilter.filterId, obsoleteFilterId]);

        removeFilter = Reflect.get(FiltersApiCommon, 'removeFilter');
        removeFilterSpy = vi.fn().mockResolvedValue(undefined);
        Reflect.set(FiltersApiCommon, 'removeFilter', removeFilterSpy);
    });

    afterEach(() => {
        getManifestSpy.mockRestore();
        getFiltersSpy.mockRestore();
        getInstalledFiltersSpy.mockRestore();
        Reflect.set(FiltersApiCommon, 'removeFilter', removeFilter);
    });

    it('does not remove an installed filter that has no bundled ruleset', async () => {
        await removeObsoleteFilters();

        expect(removeFilterSpy).not.toHaveBeenCalledWith(rulesetLessFilter.filterId);
    });

    it('removes an installed filter that is absent from the metadata', async () => {
        await removeObsoleteFilters();

        expect(removeFilterSpy).toHaveBeenCalledTimes(1);
        expect(removeFilterSpy).toHaveBeenCalledWith(obsoleteFilterId);
    });
});
