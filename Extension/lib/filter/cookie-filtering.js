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
 *    In order to do it, we should add a new Set-Cookie header that sets i_track_u with a negative
 *    expiration date: Set-Cookie: i_track_u=1; expires=[CURRENT_DATETIME]; path=/; domain=.example.org.
 *
 * Step 7 must not be executed when the rule has the third-party modifier.
 * third-party means that there is a case (first-party) when cookies must not be removed, i.e.
 * they can be actually useful, and removing them can be counterproductive.
 * For instance, Google and Facebook rely on their SSO cookies and forcing a browser to remove
 * them will also automatically log you out.
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
     * @property {boolean} thirdParty
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
     * API cookie
     *
     * @typedef {object} BrowserApiCookie
     * @property {string} name
     * @property {string} value
     * @property {string} domain
     * @property {string} path
     * @property {boolean} secure
     * @property {boolean} httpOnly
     * @property {boolean} sameSite
     * @property {number} expirationDate
     * @property {boolean} hostOnly
     */

    /**
     * Contains cookie to modify for each request
     * @type {Map<string, Array.<ModifyRequestCookie>>}
     */
    const cookiesMap = new Map();

    /**
     * Persist cookie for further processing
     *
     * @param {string} requestId
     * @param {string} name
     * @param {string} url
     * @param {boolean} thirdParty
     * @param {Array} rules
     * @param {boolean} remove
     */
    const scheduleProcessingCookie = (requestId, name, url, thirdParty, rules, remove) => {
        let values = cookiesMap.get(requestId);
        if (!values) {
            values = [];
            cookiesMap.set(requestId, values);
        }
        values.push({
            remove,
            cookie: { name, url, thirdParty },
            rules,
        });
    };

    /**
     * Removes cookies from processing
     *
     * @param {string} requestId
     * @param {Array.<string>} cookieNames Cookies to remove
     */
    const removeProcessingCookies = (requestId, cookieNames) => {
        const values = cookiesMap.get(requestId);
        if (!values) {
            return;
        }

        let iValues = values.length;
        // no-cond-assign disabled because we iterate in
        // the reverse order
        // eslint-disable-next-line no-cond-assign
        while (iValues -= 1) {
            const value = values[iValues];
            // eslint-disable-next-line prefer-destructuring
            const cookie = value.cookie;
            if (cookieNames.indexOf(cookie.name) >= 0) {
                values.splice(iValues, 1);
            }
        }
        if (values.length === 0) {
            cookiesMap.delete(requestId);
        }
    };

    /**
     * Adds cookie rule to filtering log
     *
     * @callback AddCookieLogEvent
     * @param {Object} tab
     * @param {string} cookieName
     * @param {string} cookieValue
     * @param {string} cookieDomain
     * @param {boolean} cookieThirdParty
     * @param {Array} rules
     * @param {boolean} isModifyingCookieRule
     */
    const addCookieLogEvent = (tab, cookieName, cookieValue, cookieDomain, cookieThirdParty,
        rules, isModifyingCookieRule) => {
        for (let i = 0; i < rules.length; i += 1) {
            adguard.filteringLog.addCookieEvent(tab, cookieName, cookieValue,
                cookieDomain, adguard.RequestTypes.COOKIE, rules[i],
                isModifyingCookieRule, cookieThirdParty);
        }
    };

    /**
     * Removes cookie
     *
     * @param {string} name Cookie name
     * @param {string} url Cookie url
     * @return {Promise<any>}
     */
    const apiRemoveCookie = (name, url) => new Promise((resolve) => {
        browser.cookies.remove({ url, name }, () => {
            const ex = browser.runtime.lastError;
            if (ex) {
                adguard.console.error('Error remove cookie {0} - {1}: {2}', name, url, ex);
            }
            resolve();
        });
    });

    /**
     * Updates cookie
     *
     * @param {BrowserApiCookie} apiCookie Cookie for update
     * @param {string} url Cookie url
     * @return {Promise<any>}
     */
    const apiUpdateCookie = (apiCookie, url) => {
        const update = {
            url,
            name: apiCookie.name,
            value: apiCookie.value,
            domain: apiCookie.domain,
            path: apiCookie.path,
            secure: apiCookie.secure,
            httpOnly: apiCookie.httpOnly,
            sameSite: apiCookie.sameSite,
            expirationDate: apiCookie.expirationDate,
        };
        /**
         * Removes domain for host-only cookies:
         * https://developer.chrome.com/extensions/cookies#method-set
         * The domain of the cookie. If omitted, the cookie becomes a host-only cookie.
         */
        if (apiCookie.hostOnly) {
            delete update.domain;
        }
        return new Promise((resolve) => {
            browser.cookies.set(update, () => {
                const ex = browser.runtime.lastError;
                if (ex) {
                    adguard.console.error('Error update cookie {0} - {1}: {2}', apiCookie.name, url, ex);
                }
                resolve();
            });
        });
    };

    /**
     * Get all cookies by name and url
     *
     * @param {string} name Cookie name
     * @param {string} url Cookie url
     * @return {Promise<Array.<BrowserApiCookie>>} array of cookies
     */
    const apiGetCookies = (name, url) => new Promise((resolve) => {
        browser.cookies.getAll({ name, url }, (cookies) => {
            resolve(cookies || []);
        });
    });


    /**
     * Retrieves all cookies by name and url and removes its
     *
     * @param {object} tab
     * @param {string} name Cookie name
     * @param {string} url Cookie url
     * @param {boolean} thirdParty
     * @param {object} rule
     * @param {AddCookieLogEvent} addCookieLogEvent
     * @return {Promise<any[] | never>}
     */
    // eslint-disable-next-line arrow-body-style
    const apiRemoveCookieByRule = (tab, name, url, thirdParty, rule, addCookieLogEvent) => {
        return apiGetCookies(name, url).then((cookies) => {
            const promises = [];
            if (cookies.length > 0) {
                const cookie = cookies[0];
                if (!rule.whiteListRule) {
                    const promise = apiRemoveCookie(name, url);
                    promises.push(promise);
                }
                addCookieLogEvent(tab, cookie.name, cookie.value, cookie.domain, thirdParty, [rule], false);
            }
            return Promise.all(promises);
        });
    };

    /**
     * Retrieves all cookies by name and url, modify by rules and then update
     *
     * @param {object} tab
     * @param {string} name Cookie name
     * @param {string} url Cookie url
     * @param {boolean} thirdParty
     * @param {AddCookieLogEvent} addCookieLogEvent
     * @param {Array} rules Cookie matching rules
     */
    // eslint-disable-next-line arrow-body-style
    const apiModifyCookiesWithRules = (tab, name, url, thirdParty, rules, addCookieLogEvent) => {
        return apiGetCookies(name, url).then((cookies) => {
            const promises = [];
            for (let i = 0; i < cookies.length; i += 1) {
                const cookie = cookies[i];
                // eslint-disable-next-line no-use-before-define
                const mRules = modifyApiCookieByRules(cookie, rules);
                if (mRules && mRules.length > 0) {
                    const promise = apiUpdateCookie(cookie, url);
                    promises.push(promise);
                    addCookieLogEvent(tab, cookie.name, cookie.value, cookie.domain, thirdParty, mRules, true);
                }
            }
            return Promise.all(promises);
        });
    };

    /**
     * Retrieves url for cookie
     * @param {Cookie} setCookie Cookie
     * @param {string} cookieDomain Domain
     * @return {string}
     */
    const getCookieUrl = (setCookie, cookieDomain) => {
        let domain = cookieDomain;
        if (domain[0] === '.') {
            domain = domain.substring(1);
        }
        const protocol = setCookie.secure ? 'https' : 'http';
        return `${protocol}://${domain}${setCookie.path || '/'}`;
    };

    /**
     * Checks if $cookie rule is modifying
     * @param {object} rule $cookie rule
     * @return {boolean}
     */
    const isModifyingRule = (rule) => {
        const opt = rule.getCookieOption();
        return !!opt.sameSite || (typeof opt.maxAge === 'number' && opt.maxAge > 0);
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
                if (!opt.matches(cookieName)) {
                    continue;
                }
                // Blocking or whitelist rule exists
                if (!isModifyingRule(rule)) {
                    return null;
                }
                if (result === null) {
                    result = [];
                }
                result.push(rule);
            }
            return result;
        }
        return null;
    };

    /**
     * Updates set-cookie maxAge value
     * @param {Cookie} setCookie Cookie to modify
     * @param {number} maxAge
     * @return {boolean} if cookie was modified
     */
    const updateSetCookieMaxAge = (setCookie, maxAge) => {
        const currentTimeSec = Date.now() / 1000;
        let cookieExpiresTimeSec = null;
        if (setCookie.maxAge) {
            cookieExpiresTimeSec = currentTimeSec + setCookie.maxAge;
        } else if (setCookie.expires) {
            cookieExpiresTimeSec = setCookie.expires.getTime() / 1000;
        }
        const newCookieExpiresTimeSec = currentTimeSec + maxAge;
        if (cookieExpiresTimeSec === null || cookieExpiresTimeSec > newCookieExpiresTimeSec) {
            if (setCookie.expires) {
                setCookie.expires = new Date(newCookieExpiresTimeSec * 1000);
            } else {
                setCookie.maxAge = maxAge;
            }
            return true;
        }
        return false;
    };

    /**
     * Updates API cookie expirationDate value
     * @param {BrowserApiCookie} cookie Cookie to modify
     * @param {number} maxAge
     * @return {boolean} if cookie was modified
     */
    const updateApiCookieMaxAge = (cookie, maxAge) => {
        let cookieExpiresTimeSec = null;
        if (cookie.expirationDate) {
            cookieExpiresTimeSec = cookie.expirationDate;
        }
        const newCookieExpiresTimeSec = Date.now() / 1000 + maxAge;
        if (cookieExpiresTimeSec === null || cookieExpiresTimeSec > newCookieExpiresTimeSec) {
            cookie.expirationDate = newCookieExpiresTimeSec;
            return true;
        }
        return false;
    };

    /**
     * Modifies cookie by rules
     *
     * @param {Cookie} setCookie Cookie to modify
     * @param {Array} rules Cookie matching rules
     * @return {Array} applied rules
     */
    const modifySetCookieByRules = (setCookie, rules) => {
        if (!rules || rules.length === 0) {
            return null;
        }

        const appliedRules = [];
        for (let i = 0; i < rules.length; i += 1) {
            const rule = rules[i];
            const cookieOption = rule.getCookieOption();

            let modified = false;

            // eslint-disable-next-line prefer-destructuring
            const sameSite = cookieOption.sameSite;
            if (sameSite && setCookie.sameSite !== sameSite) {
                setCookie.sameSite = sameSite;
                modified = true;
            }

            if (typeof cookieOption.maxAge === 'number'
                && updateSetCookieMaxAge(setCookie, cookieOption.maxAge)) {
                modified = true;
            }

            if (modified) {
                appliedRules.push(rule);
            }
        }

        return appliedRules;
    };

    /**
     * Process Set-Cookie header modification by rules.
     * Adds corresponding event to the filtering log.
     *
     * @param {object} tab Tab
     * @param {Cookie} setCookie Cookie to modify
     * @param {string} cookieDomain Cookie domain
     * @param {boolean} thirdParty Is Third party request
     * @param {{name: string, value: string}} header Header to modify
     * @param {Array} rules Cookie matching rules
     * @return {boolean} True if Set-Cookie header were modified
     */
    const processModifySetCookieByRules = (tab, setCookie, cookieDomain, thirdParty, header, rules) => {
        const cookieName = setCookie.name;
        const cookieValue = setCookie.value;

        rules = modifySetCookieByRules(setCookie, rules);

        if (rules && rules.length > 0) {
            header.value = adguard.utils.cookie.serialize(setCookie);
            addCookieLogEvent(tab, cookieName, cookieValue, cookieDomain, thirdParty, rules, true);
            return true;
        }

        return false;
    };

    /**
     * Modifies cookie by rules (Cookie is browser.cookies.Cookie object)
     *
     * @param {BrowserApiCookie} cookie
     * @param {Array} rules
     * @return {Array} applied rules
     */
    const modifyApiCookieByRules = (cookie, rules) => {
        const appliedRules = [];

        for (let i = 0; i < rules.length; i += 1) {
            const rule = rules[i];
            const cookieOption = rule.getCookieOption();

            let modified = false;

            // eslint-disable-next-line prefer-destructuring
            const sameSite = cookieOption.sameSite;
            if (sameSite && cookie.sameSite !== sameSite) {
                cookie.sameSite = sameSite;
                modified = true;
            }

            if (typeof cookieOption.maxAge === 'number'
                && updateApiCookieMaxAge(cookie, cookieOption.maxAge)) {
                modified = true;
            }

            if (modified) {
                appliedRules.push(rule);
            }
        }

        return appliedRules;
    };

    /**
     * Modifies request headers according to matching $cookie rules.
     *
     * @param {string} requestId Request identifier
     * @param {Array} requestHeaders Request headers
     * @return {boolean} True if headers were modified
     */
    const filterRequestHeaders = function (requestId, requestHeaders) {
        // Permission is not granted
        if (!browser.cookies) {
            return false;
        }

        const context = adguard.requestContextStorage.get(requestId);
        if (!context) {
            return false;
        }

        const tab = context.tab || {};
        const requestUrl = context.requestUrl || '';
        // Sometimes requests are fired in a refreshed tab, and leading to wrong use
        // referrerUrl of the new tab instead of the origin initiator
        const referrerUrl = context.originUrl || context.referrerUrl;
        const requestType = context.requestType || adguard.RequestTypes.DOCUMENT;

        const cookieHeader = adguard.utils.browser.findHeaderByName(requestHeaders, 'Cookie');
        const cookies = adguard.utils.cookie.parseCookie(cookieHeader ? cookieHeader.value : null);
        if (!cookies) {
            return false;
        }

        // Marks requests without referrer as first-party.
        // It's important to prevent removing google auth cookies. (for requests in background tab)
        const thirdParty = referrerUrl && adguard.utils.url.isThirdPartyRequest(requestUrl, referrerUrl);
        const rules = adguard.webRequestService.getCookieRules(tab, requestUrl, referrerUrl, requestType);
        const stealthRules = adguard.stealthService.getCookieRules(requestUrl, referrerUrl, requestType);
        if ((!rules || rules.length === 0)
            && (!stealthRules || stealthRules.length === 0)) {
            // Nothing to apply
            return false;
        }

        let cookieHeaderModified = false;

        let iCookies = cookies.length;
        // modifying cookies here is safe because we're iterating in reverse order
        // eslint-disable-next-line no-cond-assign
        while (iCookies -= 1) {
            const cookie = cookies[iCookies];
            const cookieName = cookie.name;
            const bRule = findNotModifyingRule(cookieName, rules);
            if (bRule) {
                if (!bRule.whiteListRule) {
                    cookies.splice(iCookies, 1);
                    cookieHeaderModified = true;
                }
                scheduleProcessingCookie(requestId, cookieName, requestUrl, thirdParty, [bRule], true);
            }

            const mRules = findModifyingRules(cookieName, rules);
            if (mRules && mRules.length > 0) {
                scheduleProcessingCookie(requestId, cookieName, requestUrl, thirdParty, mRules, false);
            }

            // If cookie rules found - ignore stealth cookie rules
            const ignoreStealthRules = !!((bRule && !bRule.whiteListRule) || (mRules && mRules.length > 0));
            if (!ignoreStealthRules && stealthRules && stealthRules.length > 0) {
                scheduleProcessingCookie(requestId, cookieName, requestUrl, thirdParty, stealthRules, false);
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
    const filterResponseHeaders = function (requestId, responseHeaders) {
        // Permission is not granted
        if (!browser.cookies) {
            return false;
        }

        /**
         * TODO: These two issues might change the way we're going to implement this:
         * https://bugs.chromium.org/p/chromium/issues/detail?id=827582
         * https://bugs.chromium.org/p/chromium/issues/detail?id=898461
         */

        const context = adguard.requestContextStorage.get(requestId);
        if (!context) {
            return false;
        }

        const tab = context.tab || {};
        const requestUrl = context.requestUrl || '';
        const referrerUrl = context.originUrl || context.referrerUrl;
        const requestType = context.requestType || adguard.RequestTypes.DOCUMENT;
        const requestHost = adguard.utils.url.getHost(requestUrl);

        /**
         * Collects cookies that will be blocked or modified via Set-Cookie header
         * @type {Array.<string>}
         */
        const processedCookies = [];

        let setCookieHeaderModified = false;

        let iResponseHeaders = responseHeaders.length;
        // modifying responseHeaders array here is safe because we're iterating
        // in reverse order
        while (iResponseHeaders > 0) {
            iResponseHeaders -= 1;
            const header = responseHeaders[iResponseHeaders];
            if (!header.name || header.name.toLowerCase() !== 'set-cookie') {
                continue;
            }

            const setCookie = adguard.utils.cookie.parseSetCookie(header.value);
            if (!setCookie) {
                continue;
            }

            const cookieName = setCookie.name;
            const cookieValue = setCookie.value;

            // If not specified, defaults to the host portion of the current document location
            const cookieDomain = setCookie.domain || requestHost;

            const cookieUrl = getCookieUrl(setCookie, cookieDomain);
            // Marks requests without referrer as first-party.
            // It's important to prevent removing google auth cookies. (for requests in background tab)
            const thirdParty = referrerUrl && adguard.utils.url.isThirdPartyRequest(cookieUrl, referrerUrl);
            const rules = adguard.webRequestService.getCookieRules(tab, cookieUrl, referrerUrl, requestType);

            const bRule = findNotModifyingRule(cookieName, rules);
            if (bRule) {
                if (!bRule.whiteListRule) {
                    delete setCookie.expires;
                    setCookie.maxAge = 0;
                    header.value = adguard.utils.cookie.serialize(setCookie);
                    setCookieHeaderModified = true;
                }
                processedCookies.push(cookieName);
                addCookieLogEvent(tab, cookieName, cookieValue, cookieDomain, thirdParty, [bRule], false);
            }

            const mRules = findModifyingRules(cookieName, rules);
            if (processModifySetCookieByRules(tab, setCookie, cookieDomain, thirdParty, header, mRules)) {
                setCookieHeaderModified = true;
                processedCookies.push(cookieName);
            }

            // If cookie rules found - ignore stealth cookie rules
            const ignoreStealthRules = !!((bRule && !bRule.whiteListRule) || (mRules && mRules.length > 0));
            if (!ignoreStealthRules) {
                const stealthRules = adguard.stealthService.getCookieRules(cookieUrl, referrerUrl, requestType);
                if (processModifySetCookieByRules(tab, setCookie, cookieDomain, thirdParty, header, stealthRules)) {
                    setCookieHeaderModified = true;
                    processedCookies.push(cookieName);
                }
            }
        }

        removeProcessingCookies(requestId, processedCookies);
        return setCookieHeaderModified;
    };

    /**
     * Modifies cookies with browser.api
     *
     * @param requestId
     */
    const modifyCookies = (requestId) => {
        // Permission is not granted
        if (!browser.cookies) {
            return false;
        }

        const context = adguard.requestContextStorage.get(requestId);
        if (!context) {
            return false;
        }

        const tab = context.tab || {};

        if (adguard.frames.shouldStopRequestProcess(tab)) {
            adguard.console.debug('Tab is whitelisted or protection is disabled');
            cookiesMap.delete(requestId);
            return false;
        }

        const values = cookiesMap.get(requestId);
        if (!values || values.length === 0) {
            return;
        }

        const promises = [];
        for (let i = 0; i < values.length; i += 1) {
            const value = values[i];
            const cookie = value.cookie || {};
            const rules = value.rules || [];

            let promise;
            if (value.remove) {
                promise = apiRemoveCookieByRule(tab, cookie.name, cookie.url,
                    cookie.thirdParty, rules[0], addCookieLogEvent);
            } else {
                promise = apiModifyCookiesWithRules(tab, cookie.name, cookie.url,
                    cookie.thirdParty, rules, addCookieLogEvent);
            }
            promises.push(promise);
        }

        Promise.all(promises).then(() => {
            cookiesMap.delete(requestId);
        });
    };

    return {
        filterRequestHeaders,
        filterResponseHeaders,
        modifyCookies,
    };
})(adguard);
