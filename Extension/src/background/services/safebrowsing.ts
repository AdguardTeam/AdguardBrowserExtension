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
import browser, { type WebRequest } from 'webextension-polyfill';
import { LRUCache } from 'lru-cache';

import { RequestType } from '@adguard/tsurlfilter/es/request-type';
// Note: we don't use alias here, because we don't use safebrowsing service in MV3.
import {
    type RequestData,
    RequestEvents,
    tabsApi as tsWebExtTabsApi,
} from '@adguard/tswebextension';

import {
    SafebrowsingApi,
    SettingsApi,
    TabsApi,
} from '../api';
import { SettingOption } from '../schema';
import { settingsEvents } from '../events';
import { messageHandler } from '../message-handler';
import { MessageType, type OpenSafebrowsingTrustedMessage } from '../../common/messages';
import { UserAgent } from '../../common/user-agent';
import { logger } from '../../common/logger';

/**
 * SafebrowsingService adds listeners for correct work of {@link SafebrowsingApi} module.
 */
export class SafebrowsingService {
    /**
     * Maximum number of blocked navigation request ids stored in
     * {@link SafebrowsingService.blockedRequestIds}.
     */
    private static readonly BLOCKED_REQUEST_IDS_LIMIT = 100;

    /**
     * Promises of opening the safebrowsing warning page per navigation request
     * id. All requests of a redirect chain share the same request id, so this
     * prevents opening several warning pages for a single navigation and
     * allows the next response of the chain to await the pending attempt and
     * retry it if it failed.
     *
     * @see {@link https://github.com/AdguardTeam/AdguardBrowserExtension/issues/995}
     */
    private static readonly blockedRequestIds = new LRUCache<string, Promise<boolean>>({
        max: SafebrowsingService.BLOCKED_REQUEST_IDS_LIMIT,
    });

    /**
     * Initializes the cache in {@link SafebrowsingApi} and registers listeners:
     * - for disabling secure browsing in settings;
     * - for {@link RequestEvents.onHeadersReceived};
     * - for adding a trusted domain.
     */
    public static async init(): Promise<void> {
        await SafebrowsingApi.initCache();

        settingsEvents.addListener(SettingOption.DisableSafebrowsing, SafebrowsingApi.clearCache);

        RequestEvents.onHeadersReceived.addListener(SafebrowsingService.onHeadersReceived);

        messageHandler.addListener(MessageType.OpenSafebrowsingTrusted, SafebrowsingService.onAddTrustedDomain);
    }

    /**
     * Clears {@link SafebrowsingService.blockedRequestIds}.
     *
     * Public for test purposes.
     */
    public static clearBlockedRequestIds(): void {
        SafebrowsingService.blockedRequestIds.clear();
    }

    /**
     * Called with every web request when the headers are received.
     *
     * The URL of the received response is checked, including intermediate
     * responses of a redirect chain, so that a phishing domain is detected
     * anywhere in the chain.
     *
     * @param event Item of {@link RequestData<WebRequest.OnHeadersReceivedDetailsType>}.
     * @param event.details Details of the received response.
     * @param event.context Context of the request: request type, referrer, tab id, etc.
     */
    private static onHeadersReceived({
        details,
        context,
    }: RequestData<WebRequest.OnHeadersReceivedDetailsType>): void {
        const isSafebrowsingDisabled = SettingsApi.getSetting(SettingOption.DisableSafebrowsing);
        const isFilteringDisabled = SettingsApi.getSetting(SettingOption.DisableFiltering);

        if (!context
            || isSafebrowsingDisabled
            || isFilteringDisabled) {
            return;
        }

        const {
            requestType,
            referrerUrl,
            tabId,
        } = context;

        if (requestType !== RequestType.Document) {
            return;
        }

        // Use the URL from the event details instead of the request context
        // URL, because `details.url` always points to the response being
        // processed, including intermediate responses of a redirect chain.
        const { url: requestUrl, requestId } = details;

        const onOk = async (safebrowsingUrl: string | undefined): Promise<void> => {
            if (!safebrowsingUrl) {
                return;
            }

            // Opens the warning page. Resolves with `true` if the page was
            // opened successfully, `false` otherwise.
            const openWarningPage = async (): Promise<boolean> => {
                // Chromium does not allow to open extension url in incognito mode
                if (tsWebExtTabsApi.isIncognitoTab(tabId) && UserAgent.isChromium) {
                    try {
                        // Closing tab before opening a new one may lead to browser crash (Chromium)
                        await browser.tabs.create({ url: safebrowsingUrl });
                    } catch (e) {
                        logger.warn(`[ext.SafebrowsingService.onHeadersReceived]: cannot open info page about blocked domain in tab with id ${tabId}, original error:`, e);
                        return false;
                    }

                    try {
                        await browser.tabs.remove(tabId);
                    } catch (e) {
                        // The warning page is already opened, so the navigation
                        // stays blocked even if the original tab was not closed.
                        logger.warn(`[ext.SafebrowsingService.onHeadersReceived]: cannot close tab with id ${tabId} after opening info page about blocked domain, original error:`, e);
                    }

                    return true;
                }

                try {
                    await browser.tabs.update(tabId, { url: safebrowsingUrl });
                } catch (e) {
                    logger.warn(`[ext.SafebrowsingService.onHeadersReceived]: cannot update tab with id ${tabId} to show info page about blocked domain, original error:`, e);
                    return false;
                }

                return true;
            };

            // A redirect chain shares a single request id, so the warning page
            // should be opened only once per navigation.
            // @see {@link https://github.com/AdguardTeam/AdguardBrowserExtension/issues/995}
            let pendingOpen = SafebrowsingService.blockedRequestIds.get(requestId);

            // Wait for a pending attempt: if it succeeded, the warning page is
            // already opened; if it failed, this response can try to open the
            // warning page again.
            while (pendingOpen) {
                const isOpened = await pendingOpen;

                if (isOpened) {
                    return;
                }

                // Another response could have already started a new attempt
                // while this one was awaiting the failed attempt.
                const currentOpen = SafebrowsingService.blockedRequestIds.get(requestId);

                if (currentOpen === pendingOpen) {
                    break;
                }

                pendingOpen = currentOpen;
            }

            const openAttempt = openWarningPage();
            SafebrowsingService.blockedRequestIds.set(requestId, openAttempt);

            const isOpened = await openAttempt;

            // If the warning page could not be opened, unmark the navigation,
            // so that the next response of the redirect chain can try again.
            if (!isOpened && SafebrowsingService.blockedRequestIds.get(requestId) === openAttempt) {
                SafebrowsingService.blockedRequestIds.delete(requestId);
            }
        };

        const onFailure = (e: unknown): void => {
            logger.warn(`[ext.SafebrowsingService.onHeadersReceived]: cannot execute safe browsing check for requested url "${requestUrl}", original error:`, e);
        };

        SafebrowsingApi
            .checkSafebrowsingFilter(requestUrl, referrerUrl)
            .then(onOk)
            .catch(onFailure);
    }

    /**
     * Called when a trusted domain is added.
     *
     * @param message Message of type {@link OpenSafebrowsingTrustedMessage}.
     * @param message.data Trusted domain url.
     */
    private static async onAddTrustedDomain({ data }: OpenSafebrowsingTrustedMessage): Promise<void> {
        const { url } = data;
        await SafebrowsingApi.addToSafebrowsingTrusted(url);

        const tab = await TabsApi.getActive();

        if (tab?.id) {
            await browser.tabs.update(tab.id, { url });
        }
    }
}
