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

/**
 * Cookie filtering module
 * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/961
 *
 * Modifies Cookie/Set-Cookie headers.
 *
 * Let's look at an example:
 *
 * 1. ||example.org^$cookie=i_track_u should block the i_track_u cookie coming from example.org
 * 2. We've intercepted a request sent to https://example.org/count
 * 3. Cookie header value is i_track_u=1; JSESSIONID=321321
 * 4. First of all, modify the Cookie header so that the server doesn't receive the i_track_u value.
 *    Modified value: JSESSIONID=321321
 * 5. Wait for the response and check all the Set-Cookie headers received from the server.
 * 6. Remove the one that sets the i_track_u cookie (or modify it and strip that cookie if it contains more than one)
 * 7. Now we need to make sure that browser deletes that cookie.
 *    In order to do it, we should add a new Set-Cookie header that sets i_track_u with a negative expiration date: Set-Cookie: i_track_u=1; expires=[CURRENT_DATETIME]; path=/; domain=.example.org.
 *
 * Step 7 must not be executed when the rule has the third-party modifier.
 * third-party means that there is a case (first-party) when cookies must not be removed, i.e. they can be actually useful, and removing them can be counterproductive.
 * For instance, Google and Facebook rely on their SSO cookies and forcing a browser to remove them will also automatically log you out.
 *
 * @type {{filterRequestHeaders, filterResponseHeaders}}
 */
adguard.cookieFiltering = (function (adguard) {

    'use strict';

    /**
     * Cookie with name that matches some URL
     *
     * @typedef {object} RequestCookie
     * @property {string} url
     * @property {string} name
     */

    /**
     * Cookie modification item
     *
     * @typedef {object} ModifyRequestCookie
     * @property {boolean} remove
     * @property {Array} rules
     * @property {RequestCookie} cookie
     */

    /**
     * Contains cookie to modify for each request
     * @type {Map<string, Array.<ModifyRequestCookie>>}
     */
    const cookiesMap = new Map();

    /**
     * Persist cookie name for further processing
     *
     * @param {string} requestId
     * @param {ModifyRequestCookie} value
     */
    const pushCookieForProcessing = (requestId, value) => {
        let values = cookiesMap.get(requestId);
        if (!values) {
            values = [];
            cookiesMap.set(requestId, values);
        }
        values.push(value);
    };

    /**
     * Removes cookie
     *
     * @param {string} name Cookie name
     * @param {string} url Cookie url
     * @return {Promise<any>}
     */
    const apiRemoveCookie = (name, url) => {
        return new Promise((resolve) => {
            browser.cookies.remove({ url, name }, () => {
                const ex = browser.runtime.lastError;
                if (ex) {
                    adguard.console.error('Error remove cookie {0} - {1}: {2}', name, url, ex);
                }
                resolve();
            });
        })
    };

    /**
     * Updates cookie
     *
     * @param {object} apiCookie Cookie for update
     * @param {string} url Cookie url
     * @return {Promise<any>}
     */
    const apiUpdateCookie = (apiCookie, url) => {
        const update = {
            url: url,
            name: apiCookie.name,
            value: apiCookie.value,
            domain: apiCookie.domain,
            path: apiCookie.path,
            secure: apiCookie.secure,
            httpOnly: apiCookie.httpOnly,
            sameSite: apiCookie.sameSite,
            expirationDate: apiCookie.expirationDate,
        };
        return new Promise((resolve => {
            browser.cookies.set(update, () => {
                const ex = browser.runtime.lastError;
                if (ex) {
                    adguard.console.error('Error update cookie {0} - {1}: {2}', apiCookie.name, apiCookie.url, ex);
                }
                resolve();
            });
        }));
    };

    /**
     * Get all cookies by name and url
     * @param {string} name Cookie name
     * @param {string} url Cookie url
     * @return {Promise<Array>} array of cookies
     */
    const apiGetCookies = (name, url) => {
        return new Promise((resolve => {
            browser.cookies.getAll({ name, url }, (cookies) => {
                resolve(cookies || []);
            });
        }));
    };

    /**
     * Retrieves all cookies by name and url, modify by rules and then update
     *
     * @param {string} name Cookie name
     * @param {string} url Cookie url
     * @param {Array} rules Cookie matching rules
     */
    const apiModifyCookiesWithRules = (name, url, rules) => {
        return apiGetCookies(name, url).then(cookies => {
            const promises = [];
            for (let i = 0; i < cookies.length; i += 1) {
                const cookie = cookies[i];
                if (modifyApiCookieByRules(cookie, rules)) {
                    const promise = apiUpdateCookie(cookie, url);
                    promises.push(promise);
                }
            }
            return Promise.all(promises);
        })
    };

    /**
     * Retrieves url for cookie
     * @param {Cookie} setCookie Cookie
     * @param {string} requestUrl Original request url
     * @return {string}
     */
    const getCookieUrl = (setCookie, requestUrl) => {
        if (setCookie.domain) {
            let domain = setCookie.domain;
            if (domain[0] === '.') {
                domain = domain.substring(1);
            }
            const protocol = setCookie.secure ? 'https' : 'http';
            requestUrl = protocol + '://' + domain + (setCookie.path || '/');
        }
        return requestUrl;
    };

    /**
     * Checks if $cookie rule is modifying
     * @param {object} rule $cookie rule
     * @return {boolean}
     */
    const isModifyingRule = (rule) => {
        const opt = rule.getCookieOption();
        return !!opt.sameSite || typeof opt.maxAge === 'number' && opt.maxAge > 0;
    };

    /**
     * Finds a rule that doesn't modify cookie: i.e. this rule cancels cookie or it's a whitelist rule.
     *
     * @param {string} cookieName Cookie name
     * @param {Array} rules Matching rules
     * @return {object} Found rule or null
     */
    const findNotModifyingRule = (cookieName, rules) => {
        if (rules && rules.length > 0) {
            for (let i = 0; i < rules.length; i += 1) {
                const rule = rules[i];
                const opt = rule.getCookieOption();
                if (opt.matches(cookieName) && !isModifyingRule(rule)) {
                    return rule;
                }
            }
        }
        return null;
    };

    /**
     * Finds rules that modify cookie
     *
     * @param {string} cookieName Cookie name
     * @param {Array} rules Matching rules
     * @return {Array} Modifying rules
     */
    const findModifyingRules = (cookieName, rules) => {
        let result = null;
        if (rules && rules.length > 0) {
            for (let i = 0; i < rules.length; i += 1) {
                const rule = rules[i];
                const opt = rule.getCookieOption();
                if (opt.matches(cookieName) && isModifyingRule(rule)) {
                    if (result === null) {
                        result = [];
                    }
                    result.push(rule);
                }
            }
            return result;
        }
        return null;
    };

    /**
     * Modifies cookie by rules
     *
     * @param {Cookie} setCookie Cookie to modify
     * @param {Array} rules Cookie matching rules
     * @return {boolean} true if a cookie were modified
     */
    const modifySetCookieByRules = (setCookie, rules) => {

        if (!rules || rules.length === 0) {
            return false;
        }

        let modified = false;
        for (let i = 0; i < rules.length; i += 1) {

            const rule = rules[i];
            const cookieOption = rule.getCookieOption();

            if (cookieOption.sameSite) {
                setCookie.sameSite = cookieOption.sameSite;
                modified = true;
            }

            if (typeof cookieOption.maxAge === 'number') {
                delete setCookie.expires;
                setCookie.maxAge = cookieOption.maxAge;
                modified = true;
            }
        }

        return modified;
    };

    /**
     * Modifies cookie by rules (Cookie is browser.cookies.Cookie object)
     *
     * @param {object} cookie
     * @param {Array} rules
     * @return {boolean} true if a cookie were modified
     */
    const modifyApiCookieByRules = (cookie, rules) => {

        let modified = false;

        for (let i = 0; i < rules.length; i += 1) {

            const rule = rules[i];
            const cookieOption = rule.getCookieOption();

            if (cookieOption.sameSite) {
                const sameSite = cookie.sameSite.toLowerCase();
                switch (sameSite) {
                    case 'lax':
                    case 'strict':
                        cookie.sameSite = sameSite;
                        modified = true;
                        break;
                }
            }

            if (typeof cookieOption.maxAge === 'number') {
                cookie.expirationDate = Date.now() / 1000 + cookieOption.maxAge;
                modified = true;
            }
        }

        return modified;
    };

    /**
     * Finds blocking cookie rule and stores this fact for further processing
     * @param {string} requestId
     * @param {string} name Cookie name
     * @param {string} url
     * @param {Array} rules
     * @return {?object} Blocking rule or null
     */
    const processBlockCookie = (requestId, name, url, rules) => {
        const rule = findNotModifyingRule(name, rules);
        if (rule) {
            // TODO: deal with it and logging
            if (rule.whiteListRule) {
                return null;
            }
            pushCookieForProcessing(requestId, {
                remove: true,
                cookie: { name, url },
                rules: [rule],
            });
            return rule;
        }
        return null;
    };

    /**
     * Find modifying cookies rules and stores this fact for further processing
     * @param {string} requestId
     * @param {string} name Cookie name
     * @param {string} url
     * @param {Array} rules
     * @return {?Array} Modifying rules that match cookie or null
     */
    const processModifyCookie = (requestId, name, url, rules) => {
        const mRules = findModifyingRules(name, rules);
        if (mRules && mRules.length > 0) {
            pushCookieForProcessing(requestId, {
                remove: false,
                cookie: { name, url },
                rules: mRules,
            });
            return mRules;
        }
        return null;
    };

    /**
     * Modifies request headers according to matching $cookie rules.
     *
     * @param {string} requestId Request identifier
     * @param {Array} requestHeaders Request headers
     * @return {boolean} True if headers were modified
     */
    var filterRequestHeaders = function (requestId, requestHeaders) {

        const context = adguard.requestContextStorage.get(requestId);
        if (!context) {
            return false;
        }

        const tab = context.tab;
        const requestUrl = context.requestUrl;
        const referrerUrl = context.referrerUrl;
        const requestType = context.requestType;

        const cookieHeader = adguard.utils.browser.findHeaderByName(requestHeaders, 'Cookie');
        const cookies = adguard.utils.cookie.parseCookie(cookieHeader ? cookieHeader.value : null);
        if (!cookies) {
            return false;
        }

        const rules = adguard.webRequestService.getCookieRules(tab, requestUrl, referrerUrl, requestType);
        if (!rules || rules.length === 0) {
            return false;
        }

        let cookieHeaderModified = false;

        let iCookies = cookies.length;
        while (iCookies--) {
            const cookie = cookies[iCookies];
            const rule = processBlockCookie(requestId, cookie.name, requestUrl, rules);
            if (rule) {
                cookies.splice(iCookies, 1);
                cookieHeaderModified = true;
            }
        }

        if (cookieHeaderModified) {
            cookieHeader.value = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        }

        return cookieHeaderModified;
    };

    /**
     * Modifies response headers according to matching $cookie rules.
     *
     * @param {string} requestId Request identifier
     * @param {Array} responseHeaders Response headers
     * @return {boolean} True if headers were modified
     */
    var filterResponseHeaders = function (requestId, responseHeaders) {

        /**
         * TODO: These two issues might change the way we're going to implement this:
         * https://bugs.chromium.org/p/chromium/issues/detail?id=827582
         * https://bugs.chromium.org/p/chromium/issues/detail?id=898461
         */

        const context = adguard.requestContextStorage.get(requestId);
        if (!context) {
            return false;
        }

        const tab = context.tab;
        const requestUrl = context.requestUrl;
        const referrerUrl = context.referrerUrl;
        const requestType = context.requestType;

        let setCookieModified = false;

        let iResponseHeaders = responseHeaders.length;
        while (iResponseHeaders--) {

            const header = responseHeaders[iResponseHeaders];
            if (header.name.toLowerCase() !== 'set-cookie') {
                continue;
            }

            const setCookie = adguard.utils.cookie.parseSetCookie(header.value);
            if (!setCookie) {
                continue;
            }

            const cookieUrl = getCookieUrl(setCookie, requestUrl);
            const rules = adguard.webRequestService.getCookieRules(tab, cookieUrl, referrerUrl, requestType);

            const bRule = processBlockCookie(requestId, setCookie.name, cookieUrl, rules);
            if (bRule) {
                delete setCookie.expires;
                setCookie.maxAge = 0;
                header.value = adguard.utils.cookie.serialize(setCookie);
                setCookieModified = true;
                continue;
            }

            const mRules = processModifyCookie(requestId, setCookie.name, cookieUrl, rules);
            if (modifySetCookieByRules(setCookie, mRules)) {
                header.value = adguard.utils.cookie.serialize(setCookie);
                setCookieModified = true;
            }
        }

        return setCookieModified;
    };

    /**
     * Modifies cookies with browser.api
     *
     * @param requestId
     */
    const modifyCookies = (requestId) => {

        const context = adguard.requestContextStorage.get(requestId);
        if (!context) {
            return false;
        }

        const tab = context.tab;
        const requestUrl = context.requestUrl;
        const referrerUrl = context.referrerUrl;

        const values = cookiesMap.get(requestId);
        if (!values || values.length === 0) {
            return;
        }

        // Remove cookies
        const promises = [];
        for (let i = 0; i < values.length; i += 1) {
            const value = values[i];
            if (value.remove) {
                const cookie = value.cookie;
                const rule = value.rules[0];
                const promise = apiRemoveCookie(cookie.name, cookie.url);
                promises.push(promise);
                adguard.filteringLog.addHttpRequestEvent(tab, requestUrl, referrerUrl, 'COOKIE', rule);
            }
        }

        // Modify cookies
        for (let i = 0; i < values.length; i += 1) {
            const value = values[i];
            if (!value.remove) {
                const cookie = value.cookie;
                const rules = value.rules;
                const promise = apiModifyCookiesWithRules(cookie.name, cookie.url, rules);
                for (let j = 0; j < rules.length; j += 1) {
                    adguard.filteringLog.addHttpRequestEvent(tab, requestUrl, referrerUrl, 'COOKIE', rules[j]);
                }
                promises.push(promise);
            }
        }

        Promise.all(promises).then(() => {
            cookiesMap.delete(requestId);
        });
    };

    return {
        filterRequestHeaders,
        filterResponseHeaders,
        modifyCookies
    };

})(adguard);
