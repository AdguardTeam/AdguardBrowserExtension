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
import { RequestType } from '@adguard/tsurlfilter';
import { RequestData, RequestEvents } from '@adguard/tswebextension';
import { SafebrowsingApi, TabsApi } from '../api';
import { SettingOption } from '../schema';
import { settingsEvents } from '../events';
import { messageHandler } from '../message-handler';
import { MessageType, OpenSafebrowsingTrustedMessage } from '../../common/messages';

export class SafebrowsingService {
    public static async init(): Promise<void> {
        await SafebrowsingApi.initCache();

        settingsEvents.addListener(
            SettingOption.DisableSafebrowsing,
            SafebrowsingApi.clearCache,
        );

        RequestEvents.onHeadersReceived.addListener(SafebrowsingService.onHeaderReceived);

        messageHandler.addListener(MessageType.OpenSafebrowsingTrusted, SafebrowsingService.onAddTrustedDomain);
    }

    private static onHeaderReceived({ context }: RequestData<WebRequest.OnHeadersReceivedDetailsType>): void {
        if (!context) {
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
                    if (safebrowsingUrl) {
                        browser.tabs.update(tabId, { url: safebrowsingUrl });
                    }
                })
                .catch(() => {});
        }
    }

    private static async onAddTrustedDomain({ data }: OpenSafebrowsingTrustedMessage): Promise<void> {
        const { url } = data;
        await SafebrowsingApi.addToSafebrowsingTrusted(url);

        const tab = await TabsApi.getActive();

        if (tab?.id) {
            await browser.tabs.update(tab.id, { url });
        }
    }
}
