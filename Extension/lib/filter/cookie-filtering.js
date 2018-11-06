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
 * @type {{modifyRequestHeaders, modifyResponseHeaders}}
 */
adguard.cookieFiltering = (function (adguard) {

    'use strict';

    const apiRemoveCookie = () => {
        // TODO: implement
    };

    const apiUpdateCookie = () => {
        // TODO: implement
    };

    /**
     * Finds $cookie rules matching Set-Cookie header
     *
     * @param setCookie {Cookie} Set cookie header value
     * @param tab {object} Request tab
     * @param requestUrl {string} Request URL
     * @param referrerUrl {string} Referrer URL
     * @param requestType {string} Request type
     * @return {Array} Collection of rules or null
     */
    const getRulesForSetCookie = (setCookie, tab, requestUrl, referrerUrl, requestType) => {

        if (setCookie.domain) {
            let domain = setCookie.domain;
            if (domain[0] === '.') {
                domain = domain.substring(1);
            }
            requestUrl = 'http://' + domain + (setCookie.path || '/');
        }

        return adguard.webRequestService.getCookieRules(tab, requestUrl, referrerUrl, requestType);
    };

    /**
     * Finds a rule that doesn't modify cookie: i.e. this rule cancels cookie or it's a whitelist rule.
     *
     * @param {string} cookieName Cookie name
     * @param {Array} rules Matching rules
     * @return {object} Found rule or null
     */
    const findNotModifyingRule = (cookieName, rules) => {
        if (rules) {
            return rules
                .map(r => r.getCookieOption())
                .filter(opt => opt.matches(cookieName))
                .filter(opt => {
                    return !(opt.sameSite || typeof opt.maxAge === 'number' && opt.maxAge > 0);
                })[0];
        }
        return null;
    };

    /**
     * Modifies cookie by rules
     *
     * @param {Cookie} setCookie Cookie to modify
     * @param {Array} rules Found $cookie rules
     * @return {boolean} true if cookie was modified
     */
    const modifySetCookieByRules = (setCookie, rules) => {

        if (!rules || rules.length === 0) {
            return false;
        }

        let modified = false;

        const rule = findNotModifyingRule(setCookie.name, rules);
        if (rule) {
            if (!rule.whiteListRule) {
                delete setCookie.expires;
                setCookie.maxAge = 0;
                return true;
            }
            return false;
        }

        for (let i = 0; i < rules.length; i += 1) {

            const rule = rules[i];
            const cookieOption = rule.getCookieOption();

            if (!cookieOption.matches(setCookie.name)) {
                continue;
            }

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
     * Modifies request headers according to matching $cookie rules.
     *
     * @param {string} requestId Request identifier
     * @param {Array} requestHeaders Request headers
     * @return {boolean} True if headers were modified
     */
    var modifyRequestHeaders = function (requestId, requestHeaders) {

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
            const rule = findNotModifyingRule(cookie.name, rules);
            if (rule && !rule.whiteListRule) {
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
     * @param requestId
     * @param responseHeaders
     */
    var modifyResponseHeaders = function (requestId, responseHeaders) {

        const context = adguard.requestContextStorage.get(requestId);
        if (!context) {
            return false;
        }

        const tab = context.tab;
        const requestUrl = context.requestUrl;
        const referrerUrl = context.referrerUrl;
        const requestType = context.requestType;
        const requestDomain = adguard.utils.url.getDomainName(requestUrl);

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
            const rules = getRulesForSetCookie(setCookie, tab, requestUrl, referrerUrl, requestType);
            if (modifySetCookieByRules(setCookie, rules)) {
                header.value = adguard.utils.cookie.serialize(setCookie);
                setCookieModified = true;
            }
        }

        const cookieHeader = adguard.utils.browser.findHeaderByName(context.requestHeaders, 'Cookie');
        const cookies = adguard.utils.cookie.parseCookie(cookieHeader ? cookieHeader.value : null);
        if (cookies) {
            const rules = adguard.webRequestService.getCookieRules(tab, requestUrl, referrerUrl, requestType);
            if (rules) {
                for (let i = 0; i < cookies.length; i += 1) {
                    const cookie = cookies[i];
                    const rule = findNotModifyingRule(cookie.name, rules);
                    if (rule) {
                        if (!rule.whiteListRule) {
                            const setCookie = {
                                name: cookie.name,
                                value: cookie.value,
                                maxAge: 0,
                                domain: '.' + requestDomain,
                                path: '/'
                            };
                            responseHeaders.push({
                                name: 'Set-Cookie',
                                value: adguard.utils.cookie.serialize(setCookie)
                            });
                            setCookieModified = true;
                        }
                        // TODO: temporary for debugging
                        adguard.filteringLog.addHttpRequestEvent(tab, requestUrl, referrerUrl, requestType, rule);
                    }
                }
            }
        }

        return setCookieModified;
    };

    return {
        modifyRequestHeaders,
        modifyResponseHeaders
    };

})(adguard);
