/* eslint-disable no-param-reassign */
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
