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

import { type DownloadResult, FiltersDownloader } from '@adguard/filters-downloader/browser';

import { network } from '../../../../../Extension/src/background/api/network';
import { CUSTOM_FILTER_DOWNLOAD_TIMEOUT_MS } from '../../../../../Extension/src/common/constants';
import { mockFilterPath } from '../../../../helpers';

const createPendingDownload = () => {
    let resolve!: (result: DownloadResult) => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<DownloadResult>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
};

/**
 * Calls {@link network.downloadFilterRulesBySubscriptionUrl} with the
 * custom-filter timeout, so in-flight entries expire within the test.
 *
 * @param url Subscription url.
 * @param rawFilter Raw filter rules.
 * @param force Boolean flag to download filter fully or by patches.
 *
 * @returns Downloaded filter rules.
 */
const downloadFilterRules = (
    url: string,
    rawFilter?: string,
    force?: boolean,
): Promise<DownloadResult> => network.downloadFilterRulesBySubscriptionUrl(
    url,
    rawFilter,
    force,
    CUSTOM_FILTER_DOWNLOAD_TIMEOUT_MS,
);

/**
 * Creates a spy for two sequential downloads with controllable promises.
 *
 * @param result Result both pending downloads resolve with.
 *
 * @returns First and second pending downloads, their result and the download spy.
 */
const createTwoStepDownloadMock = (
    result: DownloadResult = { filter: ['||example.org^'], rawFilter: '||example.org^' },
) => {
    const oldDownload = createPendingDownload();
    const newDownload = createPendingDownload();
    const downloadSpy = vi
        .spyOn(FiltersDownloader, 'downloadWithRaw')
        .mockReturnValueOnce(oldDownload.promise)
        .mockReturnValueOnce(newDownload.promise);

    return {
        oldDownload,
        newDownload,
        result,
        downloadSpy,
    };
};

describe('network', () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('loads filters considering conditions', async () => {
        // This mock needs to simulate external request in the filters downloader
        const mockNetworkRequestPrefix = 'mock:/';
        const filePath = `${mockNetworkRequestPrefix}${mockFilterPath}`;
        const { filter } = await downloadFilterRules(filePath);
        expect(filter).toHaveLength(2);
    });

    it('reuses the in-flight download for concurrent requests of the same filter', async () => {
        const filterUrl = 'https://example.com/concurrent-download.txt';
        const downloadedFilter = '||example.org^';

        const download = createPendingDownload();

        const downloadSpy = vi
            .spyOn(FiltersDownloader, 'downloadWithRaw')
            .mockReturnValue(download.promise);

        // Both requests are made while the download is still in flight.
        const firstRequest = downloadFilterRules(filterUrl);
        const secondRequest = downloadFilterRules(filterUrl);

        download.resolve({
            filter: [downloadedFilter],
            rawFilter: downloadedFilter,
        });

        const [firstDownloadResult, secondDownloadResult] = await Promise.all([
            firstRequest,
            secondRequest,
        ]);

        // The second request should not be resolved with empty data, it should
        // receive the result of the in-flight download.
        expect(downloadSpy).toHaveBeenCalledTimes(1);
        expect(secondDownloadResult).toEqual(firstDownloadResult);
        expect(secondDownloadResult.filter).toEqual([downloadedFilter]);

        await downloadFilterRules(filterUrl);
        expect(downloadSpy).toHaveBeenCalledTimes(2);
    });

    it('starts a new request for a full download while a patch-based download is in flight', async () => {
        const filterUrl = 'https://example.com/full-download.txt';
        const rawFilter = '||example.org^';
        const downloadedFilter = '||example.com^';

        const patchDownload = createPendingDownload();

        const downloadSpy = vi
            .spyOn(FiltersDownloader, 'downloadWithRaw')
            .mockImplementation(async (_url, options) => {
                // Simulate a patch-based download which does not settle.
                if (!options.force) {
                    return patchDownload.promise;
                }
                return {
                    filter: [downloadedFilter],
                    rawFilter: downloadedFilter,
                };
            });

        const patchRequest = downloadFilterRules(filterUrl, rawFilter);
        const fullDownloadResult = await downloadFilterRules(
            filterUrl,
            rawFilter,
            true,
        );

        // The full download must not be resolved with the result of the
        // in-flight patch-based download.
        expect(downloadSpy).toHaveBeenCalledTimes(2);
        expect(fullDownloadResult.filter).toEqual([downloadedFilter]);

        patchDownload.resolve({
            filter: [rawFilter],
            rawFilter,
        });

        expect((await patchRequest).filter).toEqual([rawFilter]);
    });

    it('rejects every shared waiter and starts a fresh request after failure', async () => {
        const filterUrl = 'https://example.com/failed-download.txt';
        const download = createPendingDownload();
        const result = { filter: ['||fresh.example^'], rawFilter: '||fresh.example^' };
        const downloadSpy = vi.spyOn(FiltersDownloader, 'downloadWithRaw')
            .mockReturnValueOnce(download.promise)
            .mockResolvedValue(result);
        const outcomes = Promise.allSettled([
            downloadFilterRules(filterUrl),
            downloadFilterRules(filterUrl),
        ]);
        const error = new Error('Download failed');
        download.reject(error);

        const results = await outcomes;
        expect(downloadSpy).toHaveBeenCalledTimes(1);
        expect(results).toEqual([
            { status: 'rejected', reason: expect.objectContaining({ message: error.message, cause: error }) },
            { status: 'rejected', reason: expect.objectContaining({ message: error.message, cause: error }) },
        ]);
        expect(results[1]).toEqual(results[0]);

        await expect(downloadFilterRules(filterUrl)).resolves.toEqual(result);
        expect(downloadSpy).toHaveBeenCalledTimes(2);
    });

    it('does not share patch results across raw bases or let an old result evict the new request', async () => {
        const filterUrl = 'https://example.com/new-base.txt';
        const oldDownload = createPendingDownload();
        const newDownload = createPendingDownload();
        const oldResult = { filter: ['||old.example^'], rawFilter: '||old.example^' };
        const newResult = { filter: ['||new.example^'], rawFilter: '||new.example^' };
        const downloadSpy = vi.spyOn(FiltersDownloader, 'downloadWithRaw')
            .mockReturnValueOnce(oldDownload.promise)
            .mockReturnValueOnce(newDownload.promise);

        const oldRequest = downloadFilterRules(filterUrl, oldResult.rawFilter);
        const newRequest = downloadFilterRules(filterUrl, newResult.rawFilter);
        oldDownload.resolve(oldResult);
        await oldRequest;
        const sharedNewRequest = downloadFilterRules(filterUrl, newResult.rawFilter);

        expect(downloadSpy).toHaveBeenCalledTimes(2);
        newDownload.resolve(newResult);
        expect(await Promise.all([newRequest, sharedNewRequest])).toEqual([newResult, newResult]);
    });

    it.each([false, true])('expires a hanging download when force is %s', async (force) => {
        vi.useFakeTimers();
        const filterUrl = 'https://example.com/hanging-download.txt';
        const {
            oldDownload,
            newDownload,
            result,
            downloadSpy,
        } = createTwoStepDownloadMock();

        const oldRequest = downloadFilterRules(filterUrl, result.rawFilter, force);
        await vi.advanceTimersByTimeAsync(CUSTOM_FILTER_DOWNLOAD_TIMEOUT_MS);
        const newRequest = downloadFilterRules(filterUrl, result.rawFilter, force);

        expect(downloadSpy).toHaveBeenCalledTimes(2);
        oldDownload.resolve(result);
        await oldRequest;
        const sharedNewRequest = downloadFilterRules(filterUrl, result.rawFilter, force);

        expect(downloadSpy).toHaveBeenCalledTimes(2);
        newDownload.resolve(result);
        await Promise.all([newRequest, sharedNewRequest]);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('does not let a late rejection evict the replacement download', async () => {
        vi.useFakeTimers();
        const filterUrl = 'https://example.com/late-rejection.txt';
        const {
            oldDownload,
            newDownload,
            result,
            downloadSpy,
        } = createTwoStepDownloadMock();
        const oldOutcome = Promise.allSettled([downloadFilterRules(filterUrl)]);

        await vi.advanceTimersByTimeAsync(CUSTOM_FILTER_DOWNLOAD_TIMEOUT_MS);
        const newRequest = downloadFilterRules(filterUrl);
        oldDownload.reject(new Error('Late failure'));
        await oldOutcome;
        const sharedNewRequest = downloadFilterRules(filterUrl);

        expect(downloadSpy).toHaveBeenCalledTimes(2);
        newDownload.resolve(result);
        await Promise.all([newRequest, sharedNewRequest]);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('does not let an old base expiry timer evict a newer base download', async () => {
        vi.useFakeTimers();
        const filterUrl = 'https://example.com/base-expiry.txt';
        const {
            oldDownload,
            newDownload,
            result,
            downloadSpy,
        } = createTwoStepDownloadMock();

        const oldRequest = downloadFilterRules(filterUrl, 'old base');
        await vi.advanceTimersByTimeAsync(CUSTOM_FILTER_DOWNLOAD_TIMEOUT_MS / 2);
        const newRequest = downloadFilterRules(filterUrl, 'new base');
        await vi.advanceTimersByTimeAsync(CUSTOM_FILTER_DOWNLOAD_TIMEOUT_MS / 2);
        const sharedNewRequest = downloadFilterRules(filterUrl, 'new base');

        expect(downloadSpy).toHaveBeenCalledTimes(2);
        oldDownload.resolve(result);
        newDownload.resolve(result);
        await Promise.all([oldRequest, newRequest, sharedNewRequest]);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('does not reuse an expired entry if its eviction timer has not run yet', async () => {
        vi.useFakeTimers();
        const filterUrl = 'https://example.com/delayed-timer.txt';
        const {
            oldDownload,
            newDownload,
            result,
            downloadSpy,
        } = createTwoStepDownloadMock();

        const oldRequest = downloadFilterRules(filterUrl);
        vi.setSystemTime(Date.now() + CUSTOM_FILTER_DOWNLOAD_TIMEOUT_MS);
        const newRequest = downloadFilterRules(filterUrl);

        expect(downloadSpy).toHaveBeenCalledTimes(2);
        oldDownload.resolve(result);
        newDownload.resolve(result);
        await Promise.all([oldRequest, newRequest]);
        expect(vi.getTimerCount()).toBe(0);
    });
});
