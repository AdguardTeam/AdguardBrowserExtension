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
import { ContentType as RequestType } from 'tswebextension';

import { strings } from '../../../../common/strings';
import { type FilteringLogEvent, type FilterMetadata } from '../../../../background/api';
import { getFilterName } from '../../../helpers';

/**
 * Url utils
 *
 * @type {{getUrlWithoutScheme, isHierarchicUrl, getProtocol, getCookieDomain}}
 */
export const UrlUtils = {
    /**
     * Returns protocol for the given URL.
     *
     * @param url URL to process.
     *
     * @returns URL protocol.
     */
    getProtocol(url: string): string {
        try {
            const urlObject = new URL(url);
            return urlObject.protocol;
        } catch (e) {
            return '';
        }
    },

    /**
     * Removes protocol from URL and `www.` if url starts with it.
     *
     * @param url URL to process.
     *
     * @returns URL without protocol and `www.`.
     */
    getUrlWithoutScheme(url: string): string {
        let resultUrl;

        const protocol = this.getProtocol(url);
        if (this.isHierarchicUrl(url)) {
            resultUrl = url.replace(`${protocol}//`, '');
        } else {
            resultUrl = url.replace(protocol, '');
        }

        return strings.startWith(resultUrl, 'www.') ? resultUrl.substring(4) : resultUrl;
    },

    /**
     * Checks the given URL whether is hierarchical or not.
     *
     * @param url Url to check.
     *
     * @returns True if the URL is hierarchical, false otherwise.
     */
    isHierarchicUrl(url: string): boolean {
        return url.indexOf('//') !== -1;
    },

    /**
     * Returns domain for cookie rule.
     *
     * @param frameDomain Frame domain.
     *
     * @returns Domain for cookie rule.
     */
    getCookieDomain(frameDomain: string | undefined): string {
        if (!frameDomain) {
            return '';
        }

        return frameDomain[0] === '.'
            ? frameDomain.substring(1)
            : frameDomain;
    },
};

/**
 * Returns request type for the given event.
 *
 * @param event Filtering log event.
 *
 * @returns Request type for the given event.
 */
export const getRequestEventType = (event: FilteringLogEvent): string => {
    const {
        requestType,
        requestRule,
        cspReportBlocked,
        removeHeader,
        removeParam,
        isModifyingCookieRule,
    } = event;

    let requestEventType = requestType;

    if (requestRule?.cookieRule
        || isModifyingCookieRule) {
        requestEventType = RequestType.Cookie;
    } else if (cspReportBlocked) {
        // By default csp requests in firefox have other request type,
        // but if event cspReportBlocked is true
        // we consider such request to have "CSP report" type
        requestEventType = RequestType.CspReport;
    } else if (removeHeader) {
        return 'REMOVEHEADER';
    } else if (removeParam) {
        return 'REMOVEPARAM';
    }

    switch (requestEventType) {
        case RequestType.Document:
        case RequestType.Subdocument:
            return 'HTML';
        case RequestType.Stylesheet:
            return 'CSS';
        case RequestType.Script:
            return 'JavaScript';
        case RequestType.XmlHttpRequest:
            return 'XHR';
        case RequestType.Image:
            return 'Image';
        case RequestType.Object:
        case RequestType.Media:
            return 'Media';
        case RequestType.Font:
            return 'Font';
        case RequestType.Websocket:
            return 'WebSocket';
        case RequestType.WebRtc:
            return 'WebRTC';
        case RequestType.Csp:
            return 'CSP';
        case RequestType.CspReport:
            return 'CSP report';
        case RequestType.PermissionsPolicy:
            return 'Permissions Policy';
        case RequestType.Cookie:
            return 'Cookie';
        case RequestType.Ping:
            return 'Ping';
        case RequestType.Other:
            return 'Other';
        default:
            return '';
    }
};

/**
 * Returns data for cookie event.
 *
 * @param event Filtering log event.
 *
 * @returns Cookie data as a string or null.
 */
export const getCookieData = (event: FilteringLogEvent): string | null => {
    if (!event.requestRule?.cookieRule || !event?.cookieName) {
        return null;
    }
    return event.cookieValue
        ? `${event.cookieName} = ${event.cookieValue}`
        : event.cookieName;
};

/**
 * Returns filter name for a rule
 *
 * @param selectedEvent filtering event
 * @param {RegularFilterMetadata} filtersMetadata filters metadata
 *
 * @returns {string|null} filter name or null, if filter is not found or there are multiple rules
 */
export const getRuleFilterName = (selectedEvent: FilteringLogEvent, filtersMetadata: FilterMetadata[] | null) => {
    const {
        requestRule,
        replaceRules,
        stealthAllowlistRules,
        declarativeRuleInfo,
    } = selectedEvent;

    if (declarativeRuleInfo?.sourceRules) {
        // Here we assume that the set of triggered rules is always from one
        // filter and therefore we extract the first one and based on it we
        // get the filter name.
        const firstRule = declarativeRuleInfo.sourceRules[0]?.filterId;
        return getFilterName(firstRule, filtersMetadata);
    }

    if (requestRule) {
        return getFilterName(requestRule.filterId, filtersMetadata);
    }

    if (replaceRules?.length === 1) {
        return getFilterName(replaceRules[0]?.filterId, filtersMetadata);
    }

    if (stealthAllowlistRules?.length === 1) {
        return getFilterName(stealthAllowlistRules[0]?.filterId, filtersMetadata);
    }

    return null;
};
