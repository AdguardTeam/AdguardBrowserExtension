/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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
     * Called with every web request when the headers are received.
     *
     * @param event Item of {@link RequestData<WebRequest.OnHeadersReceivedDetailsType>}.
     * @param event.context Context of the request: status code, request url, tab id, etc.
     */
    private static onHeadersReceived({ context }: RequestData<WebRequest.OnHeadersReceivedDetailsType>): void {
        const isSafebrowsingDisabled = SettingsApi.getSetting(SettingOption.DisableSafebrowsing);
        const isFilteringDisabled = SettingsApi.getSetting(SettingOption.DisableFiltering);

        if (!context
            || isSafebrowsingDisabled
            || isFilteringDisabled) {
            return;
        }

        const {
            requestType,
            statusCode,
            requestUrl,
            referrerUrl,
            tabId,
        } = context;

        const isDocumentRequestAndNotRedirect = requestType === RequestType.Document
            && statusCode !== 301
            && statusCode !== 302;

        if (!isDocumentRequestAndNotRedirect) {
            return;
        }

        const onOk = (safebrowsingUrl: string | undefined): void => {
            if (!safebrowsingUrl) {
                return;
            }

            // Chromium does not allow to open extension url in incognito mode
            if (tsWebExtTabsApi.isIncognitoTab(tabId) && UserAgent.isChromium) {
                // Closing tab before opening a new one may lead to browser crash (Chromium)
                browser.tabs.create({ url: safebrowsingUrl })
                    .then(() => browser.tabs.remove(tabId))
                    .catch((e) => {
                        logger.warn(`[ext.SafebrowsingService.onHeadersReceived]: cannot open info page about blocked domain in tab with id ${tabId}, original error:`, e);
                    });
            } else {
                browser.tabs.update(tabId, { url: safebrowsingUrl })
                    .catch((e) => {
                        logger.warn(`[ext.SafebrowsingService.onHeadersReceived]: cannot update tab with id ${tabId} to show info page about blocked domain, original error:`, e);
                    });
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
