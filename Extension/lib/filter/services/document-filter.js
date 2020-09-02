/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.
 */

import { utils } from '../../utils/common';
import { adguard } from '../../adguard';
import { backgroundPage } from '../../../browser/chrome/lib/api/background-page';
import { tabsApi } from '../../tabs/tabs-api';
import { ui } from '../../ui-service';
import { frames } from '../../tabs/frames';

export const documentFilterService = (function () {
    const trustedCache = {
        get cache() {
            return adguard.lazyGet(
                trustedCache,
                'cache',
                () => new utils.ExpiringCache('document-block-cache')
            );
        },
    };

    function documentFilterService() {
        const TRUSTED_TTL_MS = 1000 * 60 * 40; // 40 minutes
        const DOCUMENT_BLOCKED_URL = 'pages/blocking-pages/adBlockedPage.html';

        /**
         * Checks if url is trusted
         * @param url
         * @returns {boolean}
         */
        const isTrusted = (url) => {
            const host = utils.url.getHost(url);
            if (!host) {
                return false;
            }
            const value = trustedCache.cache.getValue(host);
            return !!(value);
        };

        /**
         * Return url of the document block page and ads there parameters with rule and url
         * @param url
         * @param ruleText
         * @returns {null|string}
         */
        const getDocumentBlockPageUrl = (url, ruleText) => {
            if (isTrusted(url)) {
                return null;
            }

            let blockingUrl = backgroundPage.getURL(DOCUMENT_BLOCKED_URL);

            blockingUrl += `?url=${encodeURIComponent(url)}`;
            blockingUrl += `&rule=${encodeURIComponent(ruleText)}`;

            return blockingUrl;
        };

        /**
         * Gets url host and adds it to the cache of trusted domains
         * @param url
         */
        const addToTrusted = (url) => {
            const host = utils.url.getHost(url);
            if (!host) {
                return;
            }
            trustedCache.cache.saveValue(host, { host }, Date.now() + TRUSTED_TTL_MS);
            // Reloads ad-blocked page with trusted url
            tabsApi.tabs.getActive((tab) => {
                tabsApi.tabs.reload(tab.tabId, url);
            });
        };

        /**
         * Shows document block page
         * @param tabId
         * @param url
         */
        const showDocumentBlockPage = (tabId, url) => {
            const incognitoTab = frames.isIncognitoTab({ tabId });
            // Chrome doesn't allow to show extension pages in incognito mode
            if (utils.browser.isChromium() && incognitoTab) {
                // Closing tab before opening a new one may lead to browser crash (Chromium)
                ui.openTab(url, {}, () => {
                    tabsApi.tabs.remove(tabId);
                });
            } else {
                tabsApi.tabs.updateUrl(tabId, url);
            }
        };

        return {
            getDocumentBlockPageUrl,
            addToTrusted,
            showDocumentBlockPage,
        };
    }

    return documentFilterService();
})();
