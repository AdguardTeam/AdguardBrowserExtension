import { ANTIBANNER_FILTERS_ID } from '../../../../common/constants';
import { strings } from '../../../../common/strings';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { RequestTypes } from '../../../../background/utils/request-types';

/**
 * Url utils
 * @type {{getUrlWithoutScheme, isHierarchicUrl, getProtocol}}
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
export const getRequestType = (event) => {
    let { requestType } = event;

    const { requestRule, cspReportBlocked } = event;

    if (requestRule?.cookieRule
        || requestRule?.isModifyingCookieRule) {
        requestType = RequestTypes.COOKIE;
    } else if (cspReportBlocked) {
        // By default csp requests in firefox have other request type,
        // but if event cspReportBlocked is true
        // we consider such request to have "CSP report" type
        requestType = RequestTypes.CSP_REPORT;
    }

    switch (requestType) {
        case 'DOCUMENT':
        case 'SUBDOCUMENT':
            return 'HTML';
        case 'STYLESHEET':
            return 'CSS';
        case 'SCRIPT':
            return 'JavaScript';
        case 'XMLHTTPREQUEST':
            return 'Ajax';
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
            return 'Csp report';
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
