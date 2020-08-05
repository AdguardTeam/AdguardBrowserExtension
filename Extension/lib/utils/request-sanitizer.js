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

/* global browser, adguard */

/**
 * Request sanitizer helper
 * Removes track-able data from extension initiated requests
 */
(function (adguard) {
    /**
     * On before send headers listener
     *
     * @param req
     * @return {{requestHeaders: *}}
     */
    const safeFilter = (req) => {
        const {
            requestHeaders,
            initiator,
            tabId,
            originUrl,
        } = req;

        if (tabId !== adguard.BACKGROUND_TAB_ID) {
            return;
        }

        let requestHeadersModified = false;

        // Chrome provides "initiator" and firefox "originUrl"
        const origin = initiator || originUrl;
        if (adguard.app.isOwnRequest(origin)) {
            requestHeadersModified = adguard.utils.browser.removeHeader(requestHeaders, 'Cookie');
        }

        if (requestHeadersModified) {
            return {
                requestHeaders,
            };
        }
    };

    // Firefox doesn't allow to use "extraHeaders" extra option,
    //  but chrome requires it in order to get access to "Cookie" header
    const onBeforeSendHeadersExtraInfoSpec = ['requestHeaders', 'blocking'];
    if (typeof browser.webRequest.OnBeforeSendHeadersOptions !== 'undefined'
        && browser.webRequest.OnBeforeSendHeadersOptions.hasOwnProperty('EXTRA_HEADERS')) {
        onBeforeSendHeadersExtraInfoSpec.push('extraHeaders');
    }

    browser.webRequest.onBeforeSendHeaders.addListener(
        safeFilter,
        {
            urls: ['<all_urls>'],
            tabId: adguard.BACKGROUND_TAB_ID,
        },
        onBeforeSendHeadersExtraInfoSpec
    );
})(adguard, browser);
