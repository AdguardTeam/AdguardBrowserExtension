/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import { redirects } from '@adguard/scriptlets';
import { log } from '../../../common/log';
import { redirectsCache } from '../../utils/redirects-cache';
import { redirectsTokensCache } from '../../utils/redirects-tokens-cache';
import { resources } from '../../utils/resources';

const { Redirects } = redirects;

/**
 * Redirects service class
 */
export const redirectService = (function () {
    let redirects = null;
    // list of blocking type redirects, i.e. for click2load.html
    let blockingRedirects = [];

    /**
     * Initialize service
     */
    const init = (rawYaml) => {
        redirects = new Redirects(rawYaml);
        const redirectsData = redirects.redirects;
        blockingRedirects = Object.keys(redirectsData)
            .filter((r) => redirectsData[r].isBlocking);
    };

    /**
     * Returns blocking redirects titles array
     * @returns {string[]}
     */
    const getBlockingRedirects = () => blockingRedirects;

    /**
     * Check whether redirect creating is needed
     * i.e. for click2load.html it's not needed after button click
     * @param {string} redirectTitle
     * @param {string} requestUrl
     * @returns {boolean}
     */
    const shouldCreateRedirectUrl = (redirectTitle, requestUrl) => {
        if (!blockingRedirects.includes(redirectTitle)) {
            // no further checking is needed for most of redirects
            // except blocking redirects, i.e. click2load.html
            return true;
        }

        // unblock token passed to redirect by createRedirectFileUrl and returned back.
        // it should be last parameter in url
        const UNBLOCK_TOKEN_PARAM = '__unblock';
        let cleanRequestUrl = requestUrl;
        const url = new URL(requestUrl);
        const params = new URLSearchParams(url.search);
        const unblockToken = params.get(UNBLOCK_TOKEN_PARAM);
        if (unblockToken) {
            // if redirect has returned unblock token back,
            // add url to cache for no further redirecting on button click;
            // save cleaned origin url so unblock token parameter should be cut off
            params.delete(UNBLOCK_TOKEN_PARAM);
            cleanRequestUrl = `${url.origin}${url.pathname}?${params.toString}`;
            redirectsCache.add(cleanRequestUrl);
        }
        return !redirectsCache.hasUrl(cleanRequestUrl)
            || !redirectsTokensCache.hasToken(unblockToken);
    };

    /**
     * Creates url
     *
     * @param title
     * @param requestUrl
     * @return string|null
     */
    const createRedirectUrl = (title, requestUrl) => {
        if (!title) {
            return null;
        }

        const shouldRedirect = shouldCreateRedirectUrl(title, requestUrl);
        if (!shouldRedirect) {
            return null;
        }

        const redirectSource = redirects.getRedirect(title);
        if (!redirectSource) {
            log.debug(`There is no redirect source with title: "${title}"`);
            return null;
        }

        return resources.createRedirectFileUrl(redirectSource.file, requestUrl);
    };

    const hasRedirect = (title) => {
        return !!redirects.getRedirect(title);
    };

    return {
        init,
        hasRedirect,
        createRedirectUrl,
        getBlockingRedirects,
    };
})();
