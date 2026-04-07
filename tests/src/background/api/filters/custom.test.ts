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

import { type Storage } from 'webextension-polyfill';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { FiltersDownloader } from '@adguard/filters-downloader/browser';

import { CustomFilterApi } from '../../../../../Extension/src/background/api';
import { App } from '../../../../../Extension/src/background/app';
import { customFilterMetadataStorage } from '../../../../../Extension/src/background/storages/custom-filter-metadata';
import { filterVersionStorage } from '../../../../../Extension/src/background/storages/filter-version';
import { mockLocalStorage } from '../../../../helpers';
import { APP_VERSION_KEY } from '../../../../../Extension/src/common/constants';
import {
    fakeFilterWithoutTimeUpdated,
    fakeFilterWithTimeUpdated,
} from '../../../../helpers/fixtures/filter-without-time-updated';

vi.mock('../../../../../Extension/src/background/engine');
vi.mock('../../../../../Extension/src/background/api/ui/icons');
vi.mock('../../../../../Extension/src/background/storages/notification');

describe('CustomFilterApi.getFilterInfo — Last-Modified header integration', () => {
    let storage: Storage.StorageArea;

    beforeEach(async () => {
        storage = mockLocalStorage({
            [APP_VERSION_KEY]: '5.2.0.0',
        });
        await App.init();
    });

    afterEach(async () => {
        await storage.clear();
        vi.restoreAllMocks();
    });

    it('uses Last-Modified header when filter has no TimeUpdated metadata', async () => {
        const lastModified = 'Wed, 21 Oct 2015 07:28:00 GMT';

        vi.spyOn(FiltersDownloader, 'downloadWithRaw')
            .mockResolvedValue({
                filter: fakeFilterWithoutTimeUpdated.split('\n'),
                rawFilter: fakeFilterWithoutTimeUpdated,
                headers: { lastModified },
            });

        const result = await CustomFilterApi.getFilterInfo('https://example.com/filter-1.txt');

        expect(result).not.toBeNull();
        expect(result).toHaveProperty('filter');

        const { filter } = result as { filter: { timeUpdated: string } };
        expect(filter.timeUpdated).toBe('2015-10-21T07:28:00.000Z');
    });

    it('prioritizes TimeUpdated metadata over Last-Modified header', async () => {
        const lastModified = 'Wed, 21 Oct 2015 07:28:00 GMT';

        vi.spyOn(FiltersDownloader, 'downloadWithRaw')
            .mockResolvedValue({
                filter: fakeFilterWithTimeUpdated.split('\n'),
                rawFilter: fakeFilterWithTimeUpdated,
                headers: { lastModified },
            });

        const result = await CustomFilterApi.getFilterInfo('https://example.com/filter-2.txt');

        expect(result).not.toBeNull();
        expect(result).toHaveProperty('filter');

        const { filter } = result as { filter: { timeUpdated: string } };
        // TimeUpdated from metadata
        expect(filter.timeUpdated).toBe('2024-06-15T10:30:00+00:00');
    });

    it('falls back to current timestamp when no headers and no TimeUpdated', async () => {
        vi.spyOn(FiltersDownloader, 'downloadWithRaw')
            .mockResolvedValue({
                filter: fakeFilterWithoutTimeUpdated.split('\n'),
                rawFilter: fakeFilterWithoutTimeUpdated,
            });

        const beforeCall = Date.now();
        const result = await CustomFilterApi.getFilterInfo('https://example.com/filter-3.txt');
        const afterCall = Date.now();

        expect(result).not.toBeNull();
        expect(result).toHaveProperty('filter');

        const { filter } = result as { filter: { timeUpdated: string } };
        const parsedTime = new Date(filter.timeUpdated).getTime();
        expect(parsedTime).toBeGreaterThanOrEqual(beforeCall);
        expect(parsedTime).toBeLessThanOrEqual(afterCall);
    });

    it('falls back to current timestamp when Last-Modified header is invalid', async () => {
        vi.spyOn(FiltersDownloader, 'downloadWithRaw')
            .mockResolvedValue({
                filter: fakeFilterWithoutTimeUpdated.split('\n'),
                rawFilter: fakeFilterWithoutTimeUpdated,
                headers: { lastModified: 'not a valid date' },
            });

        const beforeCall = Date.now();
        const result = await CustomFilterApi.getFilterInfo('https://example.com/filter-4.txt');
        const afterCall = Date.now();

        expect(result).not.toBeNull();
        expect(result).toHaveProperty('filter');

        const { filter } = result as { filter: { timeUpdated: string } };
        const parsedTime = new Date(filter.timeUpdated).getTime();
        expect(parsedTime).toBeGreaterThanOrEqual(beforeCall);
        expect(parsedTime).toBeLessThanOrEqual(afterCall);
    });

    it('falls back to current timestamp when headers object has no lastModified', async () => {
        vi.spyOn(FiltersDownloader, 'downloadWithRaw')
            .mockResolvedValue({
                filter: fakeFilterWithoutTimeUpdated.split('\n'),
                rawFilter: fakeFilterWithoutTimeUpdated,
                headers: { lastModified: undefined },
            });

        const beforeCall = Date.now();
        const result = await CustomFilterApi.getFilterInfo('https://example.com/filter-5.txt');
        const afterCall = Date.now();

        expect(result).not.toBeNull();
        expect(result).toHaveProperty('filter');

        const { filter } = result as { filter: { timeUpdated: string } };
        const parsedTime = new Date(filter.timeUpdated).getTime();
        expect(parsedTime).toBeGreaterThanOrEqual(beforeCall);
        expect(parsedTime).toBeLessThanOrEqual(afterCall);
    });

    it('returns correct rulesCount and filter metadata alongside timeUpdated', async () => {
        const lastModified = 'Mon, 01 Jan 2024 12:00:00 GMT';

        vi.spyOn(FiltersDownloader, 'downloadWithRaw')
            .mockResolvedValue({
                filter: fakeFilterWithoutTimeUpdated.split('\n'),
                rawFilter: fakeFilterWithoutTimeUpdated,
                headers: { lastModified },
            });

        const result = await CustomFilterApi.getFilterInfo('https://example.com/filter-6.txt');

        expect(result).not.toBeNull();
        expect(result).toHaveProperty('filter');

        const { filter } = result as {
            filter: {
                name: string;
                timeUpdated: string;
                rulesCount: number;
                customUrl: string;
            };
        };

        expect(filter.name).toBe('Fake filter without TimeUpdated');
        expect(filter.timeUpdated).toBe('2024-01-01T12:00:00.000Z');
        expect(filter.customUrl).toBe('https://example.com/filter-6.txt');
        // rulesCount excludes comment lines (lines starting with '!')
        expect(filter.rulesCount).toBe(2);
    });
});

/**
 * Updated filter text with bumped version and no TimeUpdated metadata.
 * Used to verify that Last-Modified header is persisted on update.
 */
const updatedFilterWithoutTimeUpdated = `! Title: Fake filter without TimeUpdated
! Description: Filter for testing Last-Modified header fallback
! Version: 2.0.0.0
! Expires: 4 days (update frequency)
!
||example.com^$document
||example.org^##h1
||example.net^`;

describe('CustomFilterApi.updateFilter — Last-Modified header persisted on update', () => {
    let storage: Storage.StorageArea;

    const filterUrl = 'https://example.com/custom-filter.txt';

    beforeEach(async () => {
        storage = mockLocalStorage({
            [APP_VERSION_KEY]: '5.2.0.0',
        });
        await App.init();
    });

    afterEach(async () => {
        await storage.clear();
        vi.restoreAllMocks();
    });

    it('persists timeUpdated from Last-Modified header into storages on filter update', async () => {
        // Step 1: Create the filter initially (v1, with current timestamp).
        vi.spyOn(FiltersDownloader, 'downloadWithRaw')
            .mockResolvedValue({
                filter: fakeFilterWithoutTimeUpdated.split('\n'),
                rawFilter: fakeFilterWithoutTimeUpdated,
            });

        const created = await CustomFilterApi.createFilter({
            customUrl: filterUrl,
            title: 'Test filter',
            trusted: false,
            enabled: true,
        });
        const { filterId } = created;

        // Step 2: Mock the download to return an updated filter (v2)
        // with a Last-Modified header and no TimeUpdated metadata.
        const lastModified = 'Sat, 15 Mar 2025 14:00:00 GMT';

        vi.spyOn(FiltersDownloader, 'downloadWithRaw')
            .mockResolvedValue({
                filter: updatedFilterWithoutTimeUpdated.split('\n'),
                rawFilter: updatedFilterWithoutTimeUpdated,
                headers: { lastModified },
            });

        // Step 3: Force-update the filter.
        const updated = await CustomFilterApi.updateFilter({
            filterId,
            ignorePatches: true,
        });

        expect(updated).not.toBeNull();

        // Step 4: Verify timeUpdated is persisted from Last-Modified header.
        const expectedTimestamp = new Date('Sat, 15 Mar 2025 14:00:00 GMT').getTime();

        // Check customFilterMetadataStorage
        const metadata = customFilterMetadataStorage.getById(filterId);
        expect(metadata).toBeDefined();
        expect(metadata!.timeUpdated).toBe(expectedTimestamp);
        expect(metadata!.version).toBe('2.0.0.0');

        // Check filterVersionStorage
        const versionData = filterVersionStorage.get(filterId);
        expect(versionData).toBeDefined();
        expect(versionData!.lastUpdateTime).toBe(expectedTimestamp);
        expect(versionData!.version).toBe('2.0.0.0');
    });

    it('persists timeUpdated from TimeUpdated metadata (not Last-Modified) on update', async () => {
        // Step 1: Create the filter initially.
        vi.spyOn(FiltersDownloader, 'downloadWithRaw')
            .mockResolvedValue({
                filter: fakeFilterWithoutTimeUpdated.split('\n'),
                rawFilter: fakeFilterWithoutTimeUpdated,
            });

        const created = await CustomFilterApi.createFilter({
            customUrl: filterUrl,
            title: 'Test filter',
            trusted: false,
            enabled: true,
        });
        const { filterId } = created;

        // Step 2: Updated filter has TimeUpdated metadata AND Last-Modified header.
        const updatedFilterWithMetadata = `! Title: Fake filter with TimeUpdated
! Description: Updated filter
! Version: 2.0.0.0
! TimeUpdated: 2025-03-10T08:00:00+00:00
! Expires: 4 days (update frequency)
!
||example.com^$document
||example.org^##h1
||example.net^`;

        const lastModified = 'Sat, 15 Mar 2025 14:00:00 GMT';

        vi.spyOn(FiltersDownloader, 'downloadWithRaw')
            .mockResolvedValue({
                filter: updatedFilterWithMetadata.split('\n'),
                rawFilter: updatedFilterWithMetadata,
                headers: { lastModified },
            });

        // Step 3: Force-update the filter.
        const updated = await CustomFilterApi.updateFilter({
            filterId,
            ignorePatches: true,
        });

        expect(updated).not.toBeNull();

        // Step 4: Verify timeUpdated comes from metadata, not Last-Modified.
        const expectedTimestamp = new Date('2025-03-10T08:00:00+00:00').getTime();

        const metadata = customFilterMetadataStorage.getById(filterId);
        expect(metadata).toBeDefined();
        expect(metadata!.timeUpdated).toBe(expectedTimestamp);

        const versionData = filterVersionStorage.get(filterId);
        expect(versionData).toBeDefined();
        expect(versionData!.lastUpdateTime).toBe(expectedTimestamp);
    });
});
