import { ANTIBANNER_FILTERS_ID } from '../../../../common/constants';
import { strings } from '../../../../common/strings';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { RequestTypes } from '../../../../background/utils/request-types';

/**
 * Url utils
 * @type {{getUrlWithoutScheme, isHierarchicUrl, getProtocol, getCookieDomain}}
 */
export const UrlUtils = {
    getProtocol(url) {
        try {
            const urlObject = new URL(url);
            return urlObject.protocol;
        } catch (e) {
            return '';
        }
    },

    /**
     * Removes protocol from URL and "www." if url starts with it
     */
    getUrlWithoutScheme(url) {
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
     * Checks the given URL whether is hierarchical or not
     * @param url
     * @returns {boolean}
     */
    isHierarchicUrl(url) {
        return url.indexOf('//') !== -1;
    },

    /**
     * Gets domain for cookie rule
     * @param {string} frameDomain
     * @returns {string}
     */
    getCookieDomain(frameDomain) {
        return frameDomain[0] === '.'
            ? frameDomain.substring(1)
            : frameDomain;
    },
};

/**
 * Filter's name for filterId
 *
 * @param {Number} filterId
 * @param filtersMetadata
 * @returns {String}
 */
export const getFilterName = (filterId, filtersMetadata) => {
    if (filterId === ANTIBANNER_FILTERS_ID.USER_FILTER_ID) {
        return reactTranslator.getMessage('options_userfilter');
    }

    if (filterId === ANTIBANNER_FILTERS_ID.ALLOWLIST_FILTER_ID) {
        return reactTranslator.getMessage('options_allowlist');
    }

    const filterMetadata = filtersMetadata?.filter((el) => el.filterId === filterId)[0];

    return filterMetadata ? filterMetadata.name : null;
};

/**
 * Request type map
 *
 * @param event
 * @returns {String}
 */
export const getRequestEventType = (event) => {
    const {
        requestType,
        requestRule,
        cspReportBlocked,
        removeHeader,
        removeParam,
    } = event;

    let requestEventType = requestType;

    if (requestRule?.cookieRule
        || requestRule?.isModifyingCookieRule) {
        requestEventType = RequestTypes.COOKIE;
    } else if (cspReportBlocked) {
        // By default csp requests in firefox have other request type,
        // but if event cspReportBlocked is true
        // we consider such request to have "CSP report" type
        requestEventType = RequestTypes.CSP_REPORT;
    } else if (removeHeader) {
        return 'REMOVEHEADER';
    } else if (removeParam) {
        return 'REMOVEPARAM';
    }

    switch (requestEventType) {
        case 'DOCUMENT':
        case 'SUBDOCUMENT':
            return 'HTML';
        case 'STYLESHEET':
            return 'CSS';
        case 'SCRIPT':
            return 'JavaScript';
        case 'XMLHTTPREQUEST':
            return 'XHR';
        case 'IMAGE':
            return 'Image';
        case 'OBJECT':
        case 'MEDIA':
            return 'Media';
        case 'FONT':
            return 'Font';
        case 'WEBSOCKET':
            return 'WebSocket';
        case 'WEBRTC':
            return 'WebRTC';
        case 'CSP':
            return 'CSP';
        case 'CSP_REPORT':
            return 'CSP report';
        case 'COOKIE':
            return 'Cookie';
        case 'PING':
            return 'Ping';
        case 'OTHER':
            return 'Other';
        default:
            return '';
    }
};

/**
 * Returns data for cookie event
 * @param event
 * @return {string|null}
 */
export const getCookieData = (event) => {
    if (!event.requestRule?.cookieRule || !event?.cookieName) {
        return null;
    }
    return event.cookieValue
        ? `${event.cookieName} = ${event.cookieValue}`
        : event.cookieName;
};
