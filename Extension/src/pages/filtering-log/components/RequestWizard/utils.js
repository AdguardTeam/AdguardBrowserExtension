/* eslint-disable no-param-reassign */
import { FilterRule, UrlFilterRule } from './constants';

/**
 * String utils
 * @type {{substringAfter, containsIgnoreCase, substringBefore, startWith}}
 */
export const StringUtils = {
    startWith(str, prefix) {
        return !!(str && str.indexOf(prefix) === 0);
    },

    containsIgnoreCase(str, searchString) {
        return !!(str && searchString && str.toUpperCase()
            .indexOf(searchString.toUpperCase()) >= 0);
    },

    substringAfter(str, separator) {
        if (!str) {
            return str;
        }
        const index = str.indexOf(separator);
        return index < 0 ? '' : str.substring(index + separator.length);
    },

    substringBefore(str, separator) {
        if (!str || !separator) {
            return str;
        }
        const index = str.indexOf(separator);
        return index < 0 ? str : str.substring(0, index);
    },
};

/**
 * Url utils
 * @type {{getUrlWithoutScheme, isHierarchicUrl, getProtocol}}
 */
export const UrlUtils = {
    getProtocol(url) {
        let index = url.indexOf('//');
        if (index >= 0) {
            return url.substring(0, index);
        }
        // It's non hierarchical structured URL (e.g. stun: or turn:)
        index = url.indexOf(':');
        if (index >= 0) {
            return url.substring(0, index);
        }

        return '';
    },

    /**
     * Removes protocol from URL
     */
    getUrlWithoutScheme(url) {
        let index = url.indexOf('//');
        if (index >= 0) {
            url = url.substring(index + 2);
        } else {
            // It's non hierarchical structured URL (e.g. stun: or turn:)
            index = url.indexOf(':');
            if (index >= 0) {
                url = url.substring(index + 1);
            }
        }
        return StringUtils.startWith(url, 'www.') ? url.substring(4) : url;
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

// FIXME whitelist rule
export const splitToPatterns = (requestUrl, domain, whitelist) => {
    const PATTERNS_COUNT = 2;

    const hierarchicUrl = UrlUtils.isHierarchicUrl(requestUrl);
    const protocol = UrlUtils.getProtocol(requestUrl);

    let prefix;
    if (hierarchicUrl) {
        prefix = UrlFilterRule.MASK_START_URL; // Covers default protocols: http, ws
    } else {
        prefix = `${protocol}:`; // Covers non-default protocols: stun, turn
    }

    if (whitelist) {
        prefix = FilterRule.MASK_ALLOWLIST + prefix;
    }

    const patterns = [];

    const relative = StringUtils.substringAfter(requestUrl, `${domain}/`);

    const path = StringUtils.substringBefore(relative, '?');
    if (path) {
        const parts = path.split('/');

        let pattern = `${domain}/`;
        for (let i = 0; i < Math.min(parts.length - 1, PATTERNS_COUNT); i += 1) {
            pattern += `${parts[i]}/`;
            patterns.push(prefix + pattern + UrlFilterRule.MASK_ANY_SYMBOL);
        }
        const file = parts[parts.length - 1];
        if (file && patterns.length < PATTERNS_COUNT) {
            pattern += file;
            patterns.push(prefix + pattern);
        }
    }

    // add domain pattern to start
    patterns.unshift(prefix + domain + UrlFilterRule.MASK_SEPARATOR);

    // push full url pattern
    const url = UrlUtils.getUrlWithoutScheme(requestUrl);
    if (`${domain}/` !== url) { // Don't duplicate: ||example.com/ and ||example.com^
        if (patterns.indexOf(prefix + url) < 0) {
            patterns.push(prefix + url);
        }
    }

    return patterns.reverse();
};
