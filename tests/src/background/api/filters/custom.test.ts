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

import { type DownloadResult, FiltersDownloader } from '@adguard/filters-downloader/browser';

import { CustomFilterApi } from '../../../../../Extension/src/background/api';
import { App } from '../../../../../Extension/src/background/app';
import { customFilterMetadataStorage } from '../../../../../Extension/src/background/storages/custom-filter-metadata';
import { filterVersionStorage } from '../../../../../Extension/src/background/storages/filter-version';
import { FiltersStoragesAdapter } from '../../../../../Extension/src/background/storages/filters-adapter';
import { type FilterVersionData } from '../../../../../Extension/src/background/schema';
import { mockLocalStorage } from '../../../../helpers';
import { APP_VERSION_KEY, CUSTOM_FILTER_DOWNLOAD_TIMEOUT_MS } from '../../../../../Extension/src/common/constants';
import { logger } from '../../../../../Extension/src/common/logger';
import {
    fakeFilterWithoutTimeUpdated,
    fakeFilterWithTimeUpdated,
} from '../../../../helpers/fixtures/filter-without-time-updated';

vi.mock('../../../../../Extension/src/background/engine');
vi.mock('../../../../../Extension/src/background/api/ui/icons');
vi.mock('../../../../../Extension/src/background/storages/notification');

const filterUrl = 'https://example.com/custom-filter.txt';
const filterWithDiffPath = `! Diff-Path: patches/filter-s-1-1.patch
${fakeFilterWithoutTimeUpdated}`;

let storage: Storage.StorageArea;

beforeEach(async () => {
    vi.clearAllMocks();
    storage = mockLocalStorage({
        [APP_VERSION_KEY]: '5.2.0.0',
    });
    await App.init();
});

afterEach(async () => {
    vi.useRealTimers();
    await storage.clear();
    vi.restoreAllMocks();
});

/**
 * Builds a mocked download result from raw filter text.
 *
 * @param rawFilter Raw filter content.
 *
 * @returns Download result with the filter split into lines.
 */
const downloadResult = (rawFilter: string): DownloadResult => ({
    filter: rawFilter.split('\n'),
    rawFilter,
});

/**
 * Creates a custom filter and clears its initial download from the spy's history.
 *
 * @param rawFilter Initial filter content.
 * @param customUrl Subscription URL.
 *
 * @returns Created filter ID.
 */
const createTestFilter = async (
    rawFilter = fakeFilterWithoutTimeUpdated,
    customUrl = filterUrl,
): Promise<number> => {
    vi.spyOn(FiltersDownloader, 'downloadWithRaw')
        .mockResolvedValue(downloadResult(rawFilter));

    const created = await CustomFilterApi.createFilter({
        customUrl,
        title: 'Test filter',
        trusted: false,
        enabled: true,
    });

    vi.mocked(FiltersDownloader.downloadWithRaw).mockClear();

    return created.filterId;
};

/**
 * Marks a custom filter as suspended until the next full update and resets
 * its check time.
 *
 * @param filterId Custom filter id.
 *
 * @returns Version data before the suspension.
 */
const suspendFilterForFullUpdate = (filterId: number): FilterVersionData => {
    const filterVersion = filterVersionStorage.get(filterId)!;
    filterVersionStorage.set(filterId, {
        ...filterVersion,
        lastCheckTime: 0,
        shouldWaitFullUpdate: true,
    });
    return filterVersion;
};

describe('CustomFilterApi.getFilterInfo — Last-Modified header integration', () => {
    it('uses Last-Modified header when filter has no TimeUpdated metadata', async () => {
        const lastModified = 'Wed, 21 Oct 2015 07:28:00 GMT';

        vi.spyOn(FiltersDownloader, 'downloadWithRaw')
            .mockResolvedValue({
                filter: fakeFilterWithoutTimeUpdated.split('\n'),
                rawFilter: fakeFilterWithoutTimeUpdated,
                headers: { lastModified },
            });

        const result = await CustomFilterApi.getFilterInfo('https://example.com/filter-1.txt');

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

        expect(result).toHaveProperty('filter');

        const { filter } = result as { filter: { timeUpdated: string } };
        // TimeUpdated from metadata
        expect(filter.timeUpdated).toBe('2024-06-15T10:30:00+00:00');
    });

    it('falls back to current timestamp when no headers and no TimeUpdated', async () => {
        vi.spyOn(FiltersDownloader, 'downloadWithRaw')
            .mockResolvedValue(downloadResult(fakeFilterWithoutTimeUpdated));

        const beforeCall = Date.now();
        const result = await CustomFilterApi.getFilterInfo('https://example.com/filter-3.txt');
        const afterCall = Date.now();

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

    it('rejects when filter rules cannot be downloaded', async () => {
        vi.spyOn(FiltersDownloader, 'downloadWithRaw').mockRejectedValue(new Error('Network error'));

        await expect(CustomFilterApi.getFilterInfo(filterUrl)).rejects.toThrow('Network error');
    });
});

/**
 * Updated filter text with bumped version and no TimeUpdated metadata.
 * Used by custom filter update tests.
 */
const updatedFilterWithoutTimeUpdated = `! Title: Fake filter without TimeUpdated
! Description: Filter for testing Last-Modified header fallback
! Version: 2.0.0.0
! Expires: 4 days (update frequency)
!
||example.com^$document
||example.org^##h1
||example.net^`;

describe('CustomFilterApi.updateFilter — differential update recovery', () => {
    it('suspends failed patches until a full update without replacing stored rules', async () => {
        const filterId = await createTestFilter(filterWithDiffPath);
        const lastCheckTime = filterVersionStorage.get(filterId)!.lastCheckTime;
        const downloadSpy = vi.mocked(FiltersDownloader.downloadWithRaw);

        downloadSpy.mockResolvedValueOnce({
            filter: filterWithDiffPath.split('\n'),
            rawFilter: filterWithDiffPath,
            isPatchUpdateFailed: true,
        });

        await expect(CustomFilterApi.updateFilter({
            filterId,
            ignorePatches: false,
        })).rejects.toThrow('Patch update failed');

        expect(downloadSpy).toHaveBeenCalledTimes(1);
        expect(downloadSpy.mock.calls[0]?.[1]).toMatchObject({ force: false });
        expect(filterVersionStorage.get(filterId)).toMatchObject({
            shouldWaitFullUpdate: true,
            lastCheckTime,
        });
        expect(await FiltersStoragesAdapter.getOriginal(filterId)).toBe(filterWithDiffPath);
        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining(`custom filter ${filterId}`),
            expect.any(Error),
        );

        await expect(CustomFilterApi.updateFilter({ filterId, ignorePatches: false })).resolves.toBeNull();
        expect(downloadSpy).toHaveBeenCalledTimes(1);

        downloadSpy.mockResolvedValueOnce(downloadResult(updatedFilterWithoutTimeUpdated));

        const updated = await CustomFilterApi.updateFilter({
            filterId,
            ignorePatches: true,
        });

        expect(updated?.version).toBe('2.0.0.0');
        expect(downloadSpy).toHaveBeenCalledTimes(2);
        expect(downloadSpy.mock.calls[1]?.[1]).toMatchObject({ force: true });
        expect(filterVersionStorage.get(filterId)?.shouldWaitFullUpdate).toBe(false);
        expect(await FiltersStoragesAdapter.getOriginal(filterId)).toBe(updatedFilterWithoutTimeUpdated);
    });

    it.each(['Cannot parse the patch name', 'DNS failure', '503 Service Unavailable'])(
        'waits for full sync instead of retrying a patch error: %s',
        async (message) => {
            const filterId = await createTestFilter(filterWithDiffPath);
            const downloadSpy = vi.mocked(FiltersDownloader.downloadWithRaw);
            downloadSpy.mockRejectedValueOnce(new Error(message));

            await expect(CustomFilterApi.updateFilter({
                filterId,
                ignorePatches: false,
            })).rejects.toThrow(message);

            expect(downloadSpy).toHaveBeenCalledTimes(1);
            expect(filterVersionStorage.get(filterId)?.shouldWaitFullUpdate).toBe(true);
            expect(await FiltersStoragesAdapter.getOriginal(filterId)).toBe(filterWithDiffPath);
        },
    );

    it('does not retry or suspend filters without a Diff-Path when a full download fails', async () => {
        const filterId = await createTestFilter();
        const downloadSpy = vi.mocked(FiltersDownloader.downloadWithRaw);
        downloadSpy.mockRejectedValueOnce(new Error('Network error'));

        await expect(CustomFilterApi.updateFilter({
            filterId,
            ignorePatches: false,
        })).rejects.toThrow('Network error');

        expect(downloadSpy).toHaveBeenCalledTimes(1);
        expect(downloadSpy.mock.calls[0]?.[1]).toMatchObject({ force: true });
        expect(filterVersionStorage.get(filterId)?.shouldWaitFullUpdate).not.toBe(true);
    });

    it('forces a full download and advances the clock when the stored base has no Diff-Path', async () => {
        const filterId = await createTestFilter();
        const filterVersion = filterVersionStorage.get(filterId)!;
        // The version record still points to patches, but the stored raw base
        // has no Diff-Path header, so the downloader would fall back to a full
        // download internally. The update must report it as a full update.
        filterVersionStorage.set(filterId, {
            ...filterVersion,
            diffPath: 'patches/filter-s-1-1.patch',
            lastCheckTime: 0,
        });
        const beforeUpdate = Date.now();
        const downloadSpy = vi.mocked(FiltersDownloader.downloadWithRaw);
        downloadSpy.mockResolvedValueOnce(downloadResult(updatedFilterWithoutTimeUpdated));

        const updated = await CustomFilterApi.updateFilter({ filterId, ignorePatches: false });

        expect(updated?.version).toBe('2.0.0.0');
        expect(downloadSpy.mock.calls[0]?.[1]).toMatchObject({ force: true });
        expect(filterVersionStorage.get(filterId)?.lastCheckTime).toBeGreaterThanOrEqual(beforeUpdate);
        expect(filterVersionStorage.get(filterId)?.shouldWaitFullUpdate).toBe(false);
    });

    it('forces a full download when the stored Diff-Path value is empty', async () => {
        // An empty Diff-Path is not a patchable base: the downloader treats it
        // as absent, so the update must be requested as a full download.
        const emptyDiffPathFilter = filterWithDiffPath.replace('patches/filter-s-1-1.patch', '');
        const filterId = await createTestFilter(emptyDiffPathFilter);
        const downloadSpy = vi.mocked(FiltersDownloader.downloadWithRaw);
        downloadSpy.mockResolvedValueOnce(downloadResult(updatedFilterWithoutTimeUpdated));

        const updated = await CustomFilterApi.updateFilter({ filterId, ignorePatches: false });

        expect(updated?.version).toBe('2.0.0.0');
        expect(downloadSpy.mock.calls[0]?.[1]).toMatchObject({ force: true });
    });

    it('does not retry a failing full download or clear the suspended patch state', async () => {
        const filterId = await createTestFilter(filterWithDiffPath);
        const filterVersion = filterVersionStorage.get(filterId)!;
        filterVersionStorage.set(filterId, { ...filterVersion, shouldWaitFullUpdate: true });
        const downloadSpy = vi.mocked(FiltersDownloader.downloadWithRaw);
        downloadSpy.mockRejectedValue(new Error('Network error'));

        await expect(CustomFilterApi.updateFilter({
            filterId,
            ignorePatches: true,
        })).rejects.toThrow('Network error');

        expect(downloadSpy).toHaveBeenCalledTimes(1);
        expect(filterVersionStorage.get(filterId)?.shouldWaitFullUpdate).toBe(true);
        expect(await FiltersStoragesAdapter.getOriginal(filterId)).toBe(filterWithDiffPath);
    });

    it('preserves the full-sync clock and expiry after a successful patch', async () => {
        const filterId = await createTestFilter(filterWithDiffPath);
        const filterVersion = filterVersionStorage.get(filterId)!;
        const lastCheckTime = filterVersion.lastCheckTime - 60 * 60 * 1000;
        filterVersionStorage.set(filterId, { ...filterVersion, lastCheckTime });
        const patchedFilter = filterWithDiffPath
            .replace('1.0.0.0', '2.0.0.0')
            .replace('4 days', '8 days');

        vi.mocked(FiltersDownloader.downloadWithRaw).mockResolvedValueOnce(downloadResult(patchedFilter));

        await CustomFilterApi.updateFilter({ filterId, ignorePatches: false });

        expect(filterVersionStorage.get(filterId)).toMatchObject({
            version: '2.0.0.0',
            lastCheckTime,
            expires: filterVersion.expires,
            shouldWaitFullUpdate: false,
        });
        expect(await FiltersStoragesAdapter.getOriginal(filterId)).toBe(patchedFilter);
    });

    it('resets the full-sync clock and suspended state even if the full download is unchanged', async () => {
        const filterId = await createTestFilter(filterWithDiffPath);
        suspendFilterForFullUpdate(filterId);
        const beforeUpdate = Date.now();

        await expect(CustomFilterApi.updateFilter({ filterId, ignorePatches: true })).resolves.toBeNull();

        expect(filterVersionStorage.get(filterId)?.lastCheckTime).toBeGreaterThanOrEqual(beforeUpdate);
        expect(filterVersionStorage.get(filterId)?.shouldWaitFullUpdate).toBe(false);
        expect(await FiltersStoragesAdapter.getOriginal(filterId)).toBe(filterWithDiffPath);
    });

    it('persists the fresh raw base and Diff-Path after an unchanged full download', async () => {
        const filterId = await createTestFilter(filterWithDiffPath);
        const filterVersion = suspendFilterForFullUpdate(filterId);
        const beforeUpdate = Date.now();
        // Same filter version, but the Diff-Path moved, e.g. after the
        // subscription URL was redirected.
        const renewedFilter = filterWithDiffPath.replace(
            'patches/filter-s-1-1.patch',
            'patches/filter-s-2-1.patch',
        );
        const downloadSpy = vi.mocked(FiltersDownloader.downloadWithRaw);
        downloadSpy.mockResolvedValueOnce(downloadResult(renewedFilter));

        await expect(CustomFilterApi.updateFilter({ filterId, ignorePatches: true })).resolves.toBeNull();

        expect(filterVersionStorage.get(filterId)).toMatchObject({
            version: filterVersion.version,
            diffPath: 'patches/filter-s-2-1.patch',
            shouldWaitFullUpdate: false,
        });
        expect(filterVersionStorage.get(filterId)?.lastCheckTime).toBeGreaterThanOrEqual(beforeUpdate);
        expect(await FiltersStoragesAdapter.getOriginal(filterId)).toBe(renewedFilter);

        // The next patch update must resolve against the renewed raw base,
        // otherwise the stale Diff-Path would be retried on every run.
        const patchedFilter = renewedFilter.replace('1.0.0.0', '2.0.0.0');
        downloadSpy.mockResolvedValueOnce(downloadResult(patchedFilter));

        const updated = await CustomFilterApi.updateFilter({ filterId, ignorePatches: false });

        expect(updated?.version).toBe('2.0.0.0');
        expect(downloadSpy.mock.calls[1]?.[1]).toMatchObject({
            force: false,
            rawFilter: renewedFilter,
        });
    });

    it('does not replace the stored base when a full download carries an older version', async () => {
        const updatedFilterWithDiffPath = `! Diff-Path: patches/filter-s-2-1.patch\n${updatedFilterWithoutTimeUpdated}`;
        const filterId = await createTestFilter(updatedFilterWithDiffPath);
        suspendFilterForFullUpdate(filterId);
        const beforeUpdate = Date.now();
        // The remote list was rolled back: the same URL serves an older
        // version with a different Diff-Path.
        const rolledBackFilter = filterWithDiffPath.replace(
            'patches/filter-s-1-1.patch',
            'patches/filter-s-0-1.patch',
        );
        vi.mocked(FiltersDownloader.downloadWithRaw).mockResolvedValueOnce(downloadResult(rolledBackFilter));

        await expect(CustomFilterApi.updateFilter({ filterId, ignorePatches: true })).resolves.toBeNull();

        // The stored base still matches the stored rules: the older download
        // must not replace it, but the full-sync clock still advances.
        expect(await FiltersStoragesAdapter.getOriginal(filterId)).toBe(updatedFilterWithDiffPath);
        expect(filterVersionStorage.get(filterId)).toMatchObject({
            version: '2.0.0.0',
            diffPath: 'patches/filter-s-2-1.patch',
            shouldWaitFullUpdate: false,
        });
        expect(filterVersionStorage.get(filterId)?.lastCheckTime).toBeGreaterThanOrEqual(beforeUpdate);
    });

    it('does not rewrite the stored base when an unchanged full download is identical to it', async () => {
        const filterId = await createTestFilter(filterWithDiffPath);
        const setRawSpy = vi.spyOn(FiltersStoragesAdapter, 'setRaw');
        vi.mocked(FiltersDownloader.downloadWithRaw).mockResolvedValueOnce(downloadResult(filterWithDiffPath));

        await expect(CustomFilterApi.updateFilter({ filterId, ignorePatches: true })).resolves.toBeNull();

        expect(setRawSpy).not.toHaveBeenCalled();
        expect(await FiltersStoragesAdapter.getOriginal(filterId)).toBe(filterWithDiffPath);
        expect(filterVersionStorage.get(filterId)?.shouldWaitFullUpdate).toBe(false);
    });

    it('preserves stored rules after a patch timeout and allows a subsequent manual full update', async () => {
        const filterId = await createTestFilter(filterWithDiffPath);
        const downloadSpy = vi.mocked(FiltersDownloader.downloadWithRaw);
        let resolvePatchDownload!: (result: DownloadResult) => void;
        downloadSpy.mockImplementationOnce(() => new Promise<DownloadResult>((resolve) => {
            resolvePatchDownload = resolve;
        }));
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

        const timedOutUpdate = expect(CustomFilterApi.updateFilter({
            filterId,
            ignorePatches: false,
        })).rejects.toThrow('Fetch timeout is over');

        await vi.advanceTimersByTimeAsync(CUSTOM_FILTER_DOWNLOAD_TIMEOUT_MS);
        await timedOutUpdate;
        vi.useRealTimers();

        expect(downloadSpy).toHaveBeenCalledTimes(1);
        expect(await FiltersStoragesAdapter.getOriginal(filterId)).toBe(filterWithDiffPath);
        expect(filterVersionStorage.get(filterId)?.shouldWaitFullUpdate).toBe(true);

        downloadSpy.mockResolvedValueOnce(downloadResult(updatedFilterWithoutTimeUpdated));
        await CustomFilterApi.updateFilter({ filterId, ignorePatches: true });

        resolvePatchDownload({
            filter: filterWithDiffPath.split('\n'),
            rawFilter: filterWithDiffPath,
        });
        expect(await FiltersStoragesAdapter.getOriginal(filterId)).toBe(updatedFilterWithoutTimeUpdated);
        expect(filterVersionStorage.get(filterId)?.shouldWaitFullUpdate).toBe(false);
    });

    it.each(['success', 'failure'])(
        'ignores a late patch %s after a versionless filter has been fully updated',
        async (outcome) => {
            const initialFilter = filterWithDiffPath.replace('! Version: 1.0.0.0\n', '');
            const filterId = await createTestFilter(initialFilter);
            const downloadSpy = vi.mocked(FiltersDownloader.downloadWithRaw);
            let resolvePatchDownload!: (result: DownloadResult) => void;
            let rejectPatchDownload!: (error: Error) => void;
            downloadSpy.mockImplementationOnce(() => new Promise<DownloadResult>((resolve, reject) => {
                resolvePatchDownload = resolve;
                rejectPatchDownload = reject;
            }));

            const patchUpdate = CustomFilterApi.updateFilter({ filterId, ignorePatches: false });
            await vi.waitFor(() => expect(downloadSpy).toHaveBeenCalledTimes(1));

            const fullFilter = `${initialFilter}\n||latest.example^`;
            downloadSpy.mockResolvedValueOnce(downloadResult(fullFilter));
            await CustomFilterApi.updateFilter({ filterId, ignorePatches: true });

            if (outcome === 'success') {
                const staleFilter = `${initialFilter}\n||outdated.example^`;
                resolvePatchDownload({
                    filter: staleFilter.split('\n'),
                    rawFilter: staleFilter,
                });
                await expect(patchUpdate).resolves.toBeNull();
            } else {
                rejectPatchDownload(new Error('Patch error'));
                await expect(patchUpdate).rejects.toThrow('Patch error');
            }

            expect(await FiltersStoragesAdapter.getOriginal(filterId)).toBe(fullFilter);
            expect(filterVersionStorage.get(filterId)?.shouldWaitFullUpdate).toBe(false);
        },
    );

    it.each([404, 204, 200])('retries an unavailable patch and repairs via a redirected list (%s)', async (status) => {
        const customUrl = `https://example.com/patch-${status}/filter.txt`;
        const filterId = await createTestFilter(filterWithDiffPath, customUrl);
        vi.mocked(FiltersDownloader.downloadWithRaw).mockRestore();

        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
            const url = String(input);
            if (url.endsWith('.patch')) {
                return new Response(status === 204 ? null : '', { status });
            }
            expect(url).toBe(customUrl);
            const response = new Response(updatedFilterWithoutTimeUpdated, {
                headers: { 'Content-Type': 'text/plain' },
            });
            Object.defineProperties(response, {
                url: { value: 'https://moved.example.com/filter.txt' },
                redirected: { value: true },
            });
            return response;
        });

        // An unavailable patch (404, 204 or an empty 200) also means "no
        // update available" for a healthy filter, so it is not treated as a
        // broken chain: the filter is not suspended and the patch is retried
        // on the next run.
        await expect(CustomFilterApi.updateFilter({ filterId, ignorePatches: false })).resolves.toBeNull();
        expect(fetchSpy.mock.calls.some(([url]) => String(url).endsWith('.patch'))).toBe(true);
        expect(filterVersionStorage.get(filterId)?.shouldWaitFullUpdate).not.toBe(true);
        expect(await FiltersStoragesAdapter.getOriginal(filterId)).toBe(filterWithDiffPath);

        fetchSpy.mockClear();
        await expect(CustomFilterApi.updateFilter({ filterId, ignorePatches: false })).resolves.toBeNull();
        expect(fetchSpy.mock.calls.some(([url]) => String(url).endsWith('.patch'))).toBe(true);
        expect(filterVersionStorage.get(filterId)?.shouldWaitFullUpdate).not.toBe(true);

        fetchSpy.mockClear();
        const updated = await CustomFilterApi.updateFilter({ filterId, ignorePatches: true });

        expect(updated?.version).toBe('2.0.0.0');
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(String(fetchSpy.mock.calls[0]?.[0])).toBe(customUrl);
        expect(await FiltersStoragesAdapter.getOriginal(filterId)).toBe(updatedFilterWithoutTimeUpdated);
    });

    it('keeps updating a filter without a Diff-Path served from a redirected URL', async () => {
        // A filter list without a Diff-Path header is checked by a full
        // download and a checksum compare on every run, so a moved URL must
        // not affect it: unchanged content causes no suspension, and new
        // content applies on the next check.
        const redirectedFilter = [
            '! Title: Redirected filter',
            '! Expires: 1 day',
            '||example.com^',
        ].join('\n');
        const filterId = await createTestFilter(redirectedFilter);
        const downloadSpy = vi.mocked(FiltersDownloader.downloadWithRaw);

        // The redirect serves byte-identical content: no update, no suspension.
        downloadSpy.mockResolvedValueOnce(downloadResult(redirectedFilter));

        await expect(CustomFilterApi.updateFilter({ filterId, ignorePatches: false })).resolves.toBeNull();

        expect(downloadSpy.mock.calls[0]?.[1]).toMatchObject({ force: true });
        expect(filterVersionStorage.get(filterId)?.shouldWaitFullUpdate).not.toBe(true);

        // New content published at the new location applies on the next check.
        const updatedRedirectedFilter = `${redirectedFilter}\n||example.org^`;
        downloadSpy.mockResolvedValueOnce(downloadResult(updatedRedirectedFilter));

        await CustomFilterApi.updateFilter({ filterId, ignorePatches: false });

        expect(await FiltersStoragesAdapter.getOriginal(filterId)).toBe(updatedRedirectedFilter);
        expect(filterVersionStorage.get(filterId)?.shouldWaitFullUpdate).not.toBe(true);
    });
});

describe('CustomFilterApi.updateFilters', () => {
    it.each([false, true])('downloads once per filter and isolates failures (force=%s)', async (ignorePatches) => {
        const failedId = await createTestFilter(filterWithDiffPath, 'https://example.com/broken.txt');
        const healthyId = await createTestFilter(filterWithDiffPath, 'https://example.com/healthy.txt');
        const downloadSpy = vi.mocked(FiltersDownloader.downloadWithRaw);
        downloadSpy.mockImplementation(async (url) => {
            if (url.endsWith('/broken.txt')) {
                throw new Error('Network error');
            }
            return {
                filter: updatedFilterWithoutTimeUpdated.split('\n'),
                rawFilter: updatedFilterWithoutTimeUpdated,
            };
        });

        const updated = await CustomFilterApi.updateFilters([
            { filterId: failedId, ignorePatches },
            { filterId: healthyId, ignorePatches },
        ]);

        expect(updated.map(({ filterId }) => filterId)).toEqual([healthyId]);
        expect(downloadSpy).toHaveBeenCalledTimes(2);
        expect(await FiltersStoragesAdapter.getOriginal(failedId)).toBe(filterWithDiffPath);
        expect(await FiltersStoragesAdapter.getOriginal(healthyId)).toBe(updatedFilterWithoutTimeUpdated);
        expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining(`custom filter ${failedId}`),
            expect.any(Error),
        );
    });
});

describe('CustomFilterApi.updateFilter — Last-Modified header persisted on update', () => {
    it('persists timeUpdated from Last-Modified header into storages on filter update', async () => {
        const filterId = await createTestFilter();

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
        const filterId = await createTestFilter();

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
