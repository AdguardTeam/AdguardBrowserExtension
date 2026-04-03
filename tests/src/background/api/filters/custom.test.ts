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
import { mockLocalStorage } from '../../../../helpers';
import { APP_VERSION_KEY } from '../../../../../Extension/src/common/constants';
import {
    fakeFilterWithoutTimeUpdated,
    fakeFilterWithTimeUpdated,
} from '../../../../helpers/fixtures/filterWithoutTimeUpdated';

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
        expect(filter.rulesCount).toBeGreaterThan(0);
    });
});
