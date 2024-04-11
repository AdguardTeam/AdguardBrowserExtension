/**
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
import browser, { WebRequest } from 'webextension-polyfill';
import { RequestType } from '@adguard/tsurlfilter/es/request-type';

import {
    RequestData,
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
import { MessageType, OpenSafebrowsingTrustedMessage } from '../../common/messages';
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

        if (requestType === RequestType.Document && statusCode !== 301 && statusCode !== 302) {
            SafebrowsingApi
                .checkSafebrowsingFilter(requestUrl, referrerUrl)
                .then((safebrowsingUrl) => {
                    if (!safebrowsingUrl) {
                        return;
                    }

                    // Chromium doesn't allow open extension url in incognito mode
                    if (tsWebExtTabsApi.isIncognitoTab(tabId) && UserAgent.isChromium) {
                        // Closing tab before opening a new one may lead to browser crash (Chromium)
                        browser.tabs.create({ url: safebrowsingUrl })
                            .then(() => {
                                browser.tabs.remove(tabId);
                            })
                            .catch((e) => {
                                logger.warn('Cannot open info page about blocked domain. Original error: ', e);
                            });
                    } else {
                        browser.tabs.update(tabId, { url: safebrowsingUrl })
                            .catch((e) => {
                                // eslint-disable-next-line max-len
                                logger.warn(`Cannot update tab with id ${tabId} to show info page about blocked domain. Original error: `, e);
                            });
                    }
                })
                .catch((e) => {
                    // eslint-disable-next-line max-len
                    logger.warn(`Cannot execute safe browsing check for requested url "${requestUrl}". Original error: `, e);
                });
        }
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
