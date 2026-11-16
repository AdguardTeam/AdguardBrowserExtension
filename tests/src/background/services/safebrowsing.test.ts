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

import browser, { type Tabs, type WebRequest } from 'webextension-polyfill';
import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import {
    type EventCallback,
    RequestEvents,
    type RequestContext,
    type RequestData,
    tabsApi,
} from '@adguard/tswebextension';
import { RequestType } from '@adguard/tsurlfilter/es/request-type';

import { SafebrowsingApi, SettingsApi } from '../../../../Extension/src/background/api';
import { SettingOption } from '../../../../Extension/src/background/schema';
import { SafebrowsingService } from '../../../../Extension/src/background/services/safebrowsing';
import { UserAgent } from '../../../../Extension/src/common/user-agent';

/**
 * We do not use Safebrowsing API in MV3.
 */
describe.skipIf(__IS_MV3__)('SafebrowsingService', () => {
    const referrerUrl = 'https://referrer.example/';
    const tabId = 1;
    const blockingPageUrl = 'chrome-extension://test/pages/blocking/safebrowsing.html';
    const originalIsChromium = UserAgent.isChromium;

    let handler: EventCallback<WebRequest.OnHeadersReceivedDetailsType>;
    let checkSafebrowsingFilterSpy: ReturnType<typeof vi.spyOn>;
    let settingsGetSettingSpy: ReturnType<typeof vi.spyOn>;
    let tabsUpdateSpy: ReturnType<typeof vi.spyOn>;

    /**
     * Flushes pending microtasks and timers.
     *
     * @returns Promise resolved after pending callbacks are executed.
     */
    const flushPromises = (): Promise<void> => new Promise((resolve) => {
        setTimeout(resolve, 0);
    });

    /**
     * Creates request data for the `onHeadersReceived` listener.
     *
     * @param params Request data overrides.
     * @param params.url URL of the received response.
     * @param params.requestUrl URL stored in the request context.
     * @param params.requestId Request id.
     * @param params.requestType Request type.
     * @param params.statusCode Response status code.
     *
     * @returns Request data.
     */
    const createRequestData = ({
        url = 'https://example.org/',
        requestUrl = url,
        requestId = '1',
        requestType = RequestType.Document,
        statusCode = 200,
    }: {
        url?: string;
        requestUrl?: string;
        requestId?: string;
        requestType?: RequestType;
        statusCode?: number;
    } = {}): RequestData<WebRequest.OnHeadersReceivedDetailsType> => ({
        details: {
            url,
            requestId,
            tabId,
            statusCode,
            type: 'main_frame',
        } as unknown as WebRequest.OnHeadersReceivedDetailsType,
        context: {
            requestUrl,
            requestId,
            tabId,
            requestType,
            referrerUrl,
            statusCode,
        } as unknown as RequestContext,
    });

    beforeAll(async () => {
        vi.spyOn(SafebrowsingApi, 'initCache').mockResolvedValue();

        const addListenerSpy = vi.spyOn(RequestEvents.onHeadersReceived, 'addListener');
        addListenerSpy.mockImplementation(() => {});
        await SafebrowsingService.init();

        const [capturedHandler] = addListenerSpy.mock.calls[0] ?? [];
        if (!capturedHandler) {
            throw new Error('SafebrowsingService did not register the onHeadersReceived listener');
        }
        handler = capturedHandler;
    });

    beforeEach(() => {
        checkSafebrowsingFilterSpy = vi
            .spyOn(SafebrowsingApi, 'checkSafebrowsingFilter')
            .mockResolvedValue(undefined);
        settingsGetSettingSpy = vi
            .spyOn(SettingsApi, 'getSetting')
            .mockImplementation(() => false);
        vi.spyOn(tabsApi, 'isIncognitoTab').mockReturnValue(false);
        tabsUpdateSpy = vi
            .spyOn(browser.tabs, 'update')
            .mockResolvedValue({} as Tabs.Tab);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        SafebrowsingService.clearBlockedRequestIds();
        UserAgent.isChromium = originalIsChromium;
    });

    it('checks the URL of a successful document navigation', async () => {
        handler(createRequestData({ url: 'https://example.org/' }));
        await flushPromises();

        expect(checkSafebrowsingFilterSpy).toHaveBeenCalledTimes(1);
        expect(checkSafebrowsingFilterSpy).toHaveBeenCalledWith('https://example.org/', referrerUrl);
    });

    it('checks the URL of a document navigation with a 301 redirect response', async () => {
        handler(createRequestData({
            url: 'https://phishing.example/',
            statusCode: 301,
        }));
        await flushPromises();

        expect(checkSafebrowsingFilterSpy).toHaveBeenCalledTimes(1);
        expect(checkSafebrowsingFilterSpy).toHaveBeenCalledWith('https://phishing.example/', referrerUrl);
    });

    it('checks the URL of a document navigation with a 302 redirect response', async () => {
        handler(createRequestData({
            url: 'https://phishing.example/',
            statusCode: 302,
        }));
        await flushPromises();

        expect(checkSafebrowsingFilterSpy).toHaveBeenCalledTimes(1);
        expect(checkSafebrowsingFilterSpy).toHaveBeenCalledWith('https://phishing.example/', referrerUrl);
    });

    it('checks the URL of the received response rather than the request context URL', async () => {
        handler(createRequestData({
            url: 'https://phishing.example/',
            requestUrl: 'https://safe.example/',
            statusCode: 302,
        }));
        await flushPromises();

        expect(checkSafebrowsingFilterSpy).toHaveBeenCalledTimes(1);
        expect(checkSafebrowsingFilterSpy).toHaveBeenCalledWith('https://phishing.example/', referrerUrl);
    });

    it('does not check non-document requests', async () => {
        handler(createRequestData({ requestType: RequestType.SubDocument }));
        await flushPromises();

        expect(checkSafebrowsingFilterSpy).not.toHaveBeenCalled();
    });

    it('does not check when safebrowsing is disabled', async () => {
        settingsGetSettingSpy.mockImplementation(
            (option: SettingOption) => option === SettingOption.DisableSafebrowsing,
        );

        handler(createRequestData());
        await flushPromises();

        expect(checkSafebrowsingFilterSpy).not.toHaveBeenCalled();
    });

    it('does not check when filtering is disabled', async () => {
        settingsGetSettingSpy.mockImplementation(
            (option: SettingOption) => option === SettingOption.DisableFiltering,
        );

        handler(createRequestData());
        await flushPromises();

        expect(checkSafebrowsingFilterSpy).not.toHaveBeenCalled();
    });

    it('opens the warning page only once per navigation request id', async () => {
        checkSafebrowsingFilterSpy.mockResolvedValue(blockingPageUrl);

        // Emulates a redirect chain: the same request id is used for the
        // intermediate 302 response and for the final response.
        handler(createRequestData({ requestId: 'redirect-chain', statusCode: 302 }));
        handler(createRequestData({ requestId: 'redirect-chain', statusCode: 200 }));
        await flushPromises();

        expect(checkSafebrowsingFilterSpy).toHaveBeenCalledTimes(2);
        expect(tabsUpdateSpy).toHaveBeenCalledTimes(1);
        expect(tabsUpdateSpy).toHaveBeenCalledWith(tabId, { url: blockingPageUrl });
    });

    it('retries opening the warning page when the previous attempt failed', async () => {
        checkSafebrowsingFilterSpy.mockResolvedValue(blockingPageUrl);
        tabsUpdateSpy.mockRejectedValueOnce(new Error('cannot update tab'));

        // Emulates a redirect chain in which opening the warning page for the
        // intermediate response fails.
        handler(createRequestData({ requestId: 'failed-navigation', statusCode: 302 }));
        await flushPromises();
        handler(createRequestData({ requestId: 'failed-navigation', statusCode: 200 }));
        await flushPromises();

        expect(tabsUpdateSpy).toHaveBeenCalledTimes(2);
        expect(tabsUpdateSpy).toHaveBeenLastCalledWith(tabId, { url: blockingPageUrl });
    });

    it('retries opening the warning page when the next response arrives first', async () => {
        checkSafebrowsingFilterSpy.mockResolvedValue(blockingPageUrl);

        let rejectFirstAttempt: (error: Error) => void = () => {};
        tabsUpdateSpy.mockImplementationOnce(() => new Promise<Tabs.Tab>((_resolve, reject) => {
            rejectFirstAttempt = reject;
        }));

        // Emulates a redirect chain in which the next response is processed
        // while the first attempt to open the warning page is still pending.
        handler(createRequestData({ requestId: 'pending-navigation', statusCode: 302 }));
        await flushPromises();
        handler(createRequestData({ requestId: 'pending-navigation', statusCode: 200 }));
        await flushPromises();

        expect(tabsUpdateSpy).toHaveBeenCalledTimes(1);

        // The pending attempt fails, so the second response should retry.
        rejectFirstAttempt(new Error('cannot update tab'));
        await flushPromises();

        expect(tabsUpdateSpy).toHaveBeenCalledTimes(2);
        expect(tabsUpdateSpy).toHaveBeenLastCalledWith(tabId, { url: blockingPageUrl });
    });

    it('does not open a second warning page when closing the original tab fails', async () => {
        checkSafebrowsingFilterSpy.mockResolvedValue(blockingPageUrl);
        vi.spyOn(tabsApi, 'isIncognitoTab').mockReturnValue(true);
        UserAgent.isChromium = true;
        const tabsCreateSpy = vi.spyOn(browser.tabs, 'create').mockResolvedValue({} as Tabs.Tab);
        const tabsRemoveSpy = vi.spyOn(browser.tabs, 'remove').mockRejectedValue(new Error('cannot remove tab'));

        // Emulates a redirect chain in which the warning page is opened in a
        // new tab, but the original tab cannot be closed.
        handler(createRequestData({ requestId: 'remove-failure', statusCode: 302 }));
        handler(createRequestData({ requestId: 'remove-failure', statusCode: 200 }));
        await flushPromises();

        expect(tabsCreateSpy).toHaveBeenCalledTimes(1);
        expect(tabsRemoveSpy).toHaveBeenCalledTimes(1);
        expect(tabsUpdateSpy).not.toHaveBeenCalled();
    });

    it('opens the warning page for each new navigation request id', async () => {
        checkSafebrowsingFilterSpy.mockResolvedValue(blockingPageUrl);

        handler(createRequestData({ requestId: 'navigation-1' }));
        handler(createRequestData({ requestId: 'navigation-2' }));
        await flushPromises();

        expect(tabsUpdateSpy).toHaveBeenCalledTimes(2);
    });
});
