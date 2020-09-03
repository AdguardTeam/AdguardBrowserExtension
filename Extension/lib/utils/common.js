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

import * as TSUrlFilter from '@adguard/tsurlfilter';
import { Deferred } from 'simply-deferred';
import { log } from './log';
import { browserUtils } from './browser-utils';
import { cookie } from './cookie';
import { expiringCache } from './expiring-cache';

/**
 * Request types enumeration
 */
export const RequestTypes = {
    /**
     * Document that is loaded for a top-level frame
     */
    DOCUMENT: 'DOCUMENT',

    /**
     * Document that is loaded for an embedded frame (iframe)
     */
    SUBDOCUMENT: 'SUBDOCUMENT',

    SCRIPT: 'SCRIPT',
    STYLESHEET: 'STYLESHEET',
    OBJECT: 'OBJECT',
    IMAGE: 'IMAGE',
    XMLHTTPREQUEST: 'XMLHTTPREQUEST',
    MEDIA: 'MEDIA',
    FONT: 'FONT',
    WEBSOCKET: 'WEBSOCKET',
    WEBRTC: 'WEBRTC',
    OTHER: 'OTHER',
    CSP: 'CSP',
    COOKIE: 'COOKIE',
    PING: 'PING',

    /**
     * Transforms to TSUrlFilter.RequestType
     *
     * @param requestType
     * @return {number}
     */
    transformRequestType(requestType) {
        const contentTypes = RequestTypes;

        switch (requestType) {
            case contentTypes.DOCUMENT:
                return TSUrlFilter.RequestType.Document;
            case contentTypes.SUBDOCUMENT:
                return TSUrlFilter.RequestType.Subdocument;
            case contentTypes.STYLESHEET:
                return TSUrlFilter.RequestType.Stylesheet;
            case contentTypes.FONT:
                return TSUrlFilter.RequestType.Font;
            case contentTypes.IMAGE:
                return TSUrlFilter.RequestType.Image;
            case contentTypes.MEDIA:
                return TSUrlFilter.RequestType.Media;
            case contentTypes.SCRIPT:
                return TSUrlFilter.RequestType.Script;
            case contentTypes.XMLHTTPREQUEST:
                return TSUrlFilter.RequestType.XmlHttpRequest;
            case contentTypes.WEBSOCKET:
                return TSUrlFilter.RequestType.Websocket;
            case contentTypes.PING:
                return TSUrlFilter.RequestType.Ping;
            default:
                return TSUrlFilter.RequestType.Other;
        }
    },
};

/**
 * Background tab id in browsers is defined as -1
 */
export const BACKGROUND_TAB_ID = -1;

/**
 * Main frame id is equal to 0
 */
export const MAIN_FRAME_ID = 0;

/**
 * Utilities namespace
 */
export const utils = (() => ({
    strings: null, // StringUtils
    dates: null, // DateUtils
    collections: null, // CollectionUtils,
    concurrent: null, // ConcurrentUtils,
    channels: null, // EventChannels
    browser: null, // BrowserUtils
    filters: null, // FilterUtils,
    workaround: null, // WorkaroundUtils
    i18n: null, // I18nUtils
    StopWatch: null,
    Promise: null, // Deferred,
}))();

/**
 * Util class for work with strings
 */
(function (api) {
    if (!String.prototype.endsWith) {
        String.prototype.endsWith = function (suffix) {
            const index = this.lastIndexOf(suffix);
            return index !== -1 && index === this.length - suffix.length;
        };
    }

    // noinspection UnnecessaryLocalVariableJS
    const StringUtils = {

        isEmpty(str) {
            return !str || str.trim().length === 0;
        },

        startWith(str, prefix) {
            return str && str.indexOf(prefix) === 0;
        },

        endsWith(str, postfix) {
            return str.endsWith(postfix);
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

        contains(str, searchString) {
            return str && str.indexOf(searchString) >= 0;
        },

        containsIgnoreCase(str, searchString) {
            return str && searchString && str.toUpperCase().indexOf(searchString.toUpperCase()) >= 0;
        },

        replaceAll(str, find, replace) {
            if (!str) {
                return str;
            }
            return str.split(find).join(replace);
        },

        join(array, separator, startIndex, endIndex) {
            if (!array) {
                return null;
            }
            if (!startIndex) {
                startIndex = 0;
            }
            if (!endIndex) {
                endIndex = array.length;
            }
            if (startIndex >= endIndex) {
                return '';
            }
            const buf = [];
            for (let i = startIndex; i < endIndex; i++) {
                buf.push(array[i]);
            }
            return buf.join(separator);
        },

        /**
         * Get string before regexp first match
         * @param {string} str
         * @param {RegExp} rx
         */
        getBeforeRegExp(str, rx) {
            const index = str.search(rx);
            return str.substring(0, index);
        },

        /**
         * Look for any symbol from "chars" array starting at "start" index or from the start of the string
         *
         * @param str   String to search
         * @param chars Chars to search for
         * @param start Start index (optional, inclusive)
         * @return int Index of the element found or null
         */
        indexOfAny(str, chars, start) {
            start = start || 0;

            if (typeof str === 'string' && str.length <= start) {
                return -1;
            }

            for (let i = start; i < str.length; i++) {
                const c = str.charAt(i);
                if (chars.indexOf(c) > -1) {
                    return i;
                }
            }

            return -1;
        },

        /**
         * Splits string by a delimiter, ignoring escaped delimiters
         * @param str               String to split
         * @param delimiter         Delimiter
         * @param escapeCharacter   Escape character
         * @param preserveAllTokens If true - preserve empty entries.
         */
        splitByDelimiterWithEscapeCharacter(str, delimiter, escapeCharacter, preserveAllTokens) {
            const parts = [];

            if (adguard.utils.strings.isEmpty(str)) {
                return parts;
            }

            let sb = [];
            for (let i = 0; i < str.length; i++) {
                const c = str.charAt(i);

                if (c === delimiter) {
                    if (i === 0) {
                        // Ignore
                    } else if (str.charAt(i - 1) === escapeCharacter) {
                        sb.splice(sb.length - 1, 1);
                        sb.push(c);
                    } else if (preserveAllTokens || sb.length > 0) {
                        const part = sb.join('');
                        parts.push(part);
                        sb = [];
                    }
                } else {
                    sb.push(c);
                }
            }

            if (preserveAllTokens || sb.length > 0) {
                parts.push(sb.join(''));
            }

            return parts;
        },

        /**
         * Serialize HTML element
         * @param element
         */
        elementToString(element) {
            const s = [];
            s.push('<');
            s.push(element.localName);
            const { attributes } = element;
            for (let i = 0; i < attributes.length; i++) {
                const attr = attributes[i];
                s.push(' ');
                s.push(attr.name);
                s.push('="');
                const value = attr.value === null ? '' : attr.value.replace(/"/g, '\\"');
                s.push(value);
                s.push('"');
            }
            s.push('>');
            return s.join('');
        },

        /**
         * Checks if the specified string starts with a substr at the specified index.
         * @param str - String to check
         * @param startIndex - Index to start checking from
         * @param substr - Substring to check
         * @return boolean true if it does start
         */
        startsAtIndexWith(str, startIndex, substr) {
            if (str.length - startIndex < substr.length) {
                return false;
            }

            for (let i = 0; i < substr.length; i += 1) {
                if (str.charAt(startIndex + i) !== substr.charAt(i)) {
                    return false;
                }
            }

            return true;
        },

        /**
         * Checks if str has unquoted substr
         * @param str
         * @param substr
         */
        hasUnquotedSubstring(str, substr) {
            const quotes = ['"', "'", '/'];

            const stack = [];
            for (let i = 0; i < str.length; i += 1) {
                const cursor = str[i];

                if (stack.length === 0) {
                    if (this.startsAtIndexWith(str, i, substr)) {
                        return true;
                    }
                }

                if (quotes.indexOf(cursor) >= 0
                    && (i === 0 || str[i - 1] !== '\\')) {
                    const last = stack.pop();
                    if (!last) {
                        stack.push(cursor);
                    } else if (last !== cursor) {
                        stack.push(last);
                        stack.push(cursor);
                    }
                }
            }

            return false;
        },
    };

    api.strings = StringUtils;
})(utils);

/**
 * Util class for dates
 */
(function (api) {
    const DateUtils = {

        isSameHour(a, b) {
            return (
                this.isSameDay(a, b)
                && a.getHours() === b.getHours()
            );
        },
        isSameDay(a, b) {
            return (
                this.isSameMonth(a, b)
                && a.getDate() === b.getDate()
            );
        },
        isSameMonth(a, b) {
            if (!a || !b) {
                return false;
            }

            return (
                a.getYear() === b.getYear()
                && a.getMonth() === b.getMonth()
            );
        },
        getDifferenceInHours(a, b) {
            return (a.getTime() - b.getTime()) / 1000 / 60 / 60;
        },
        getDifferenceInDays(a, b) {
            return this.getDifferenceInHours(a, b) / 24;
        },
        getDifferenceInMonths(a, b) {
            return this.getDifferenceInDays(a, b) / 30;
        },
    };

    api.dates = DateUtils;
})(utils);

/**
 * Util class for work with collections
 */
(function (api) {
    // noinspection UnnecessaryLocalVariableJS
    const CollectionUtils = {

        remove(collection, element) {
            if (!element || !collection) {
                return;
            }
            const index = collection.indexOf(element);
            if (index >= 0) {
                collection.splice(index, 1);
            }
        },

        removeAll(collection, element) {
            if (!element || !collection) {
                return;
            }
            for (let i = collection.length - 1; i >= 0; i--) {
                if (collection[i] == element) {
                    collection.splice(i, 1);
                }
            }
        },

        removeRule(collection, rule) {
            if (!rule || !collection) {
                return;
            }
            for (let i = collection.length - 1; i >= 0; i--) {
                if (rule.getText() === collection[i].getText()) {
                    collection.splice(i, 1);
                }
            }
        },

        removeDuplicates(arr) {
            if (!arr || arr.length == 1) {
                return arr;
            }
            return arr.filter((elem, pos) => arr.indexOf(elem) == pos);
        },

        getRulesText(collection) {
            const text = [];
            if (!collection) {
                return text;
            }
            for (let i = 0; i < collection.length; i++) {
                text.push(collection[i].getText());
            }
            return text;
        },

        /**
         * Find element in array by property
         * @param array
         * @param property
         * @param value
         * @returns {*}
         */
        find(array, property, value) {
            if (typeof array.find === 'function') {
                return array.find(a => a[property] === value);
            }
            for (let i = 0; i < array.length; i++) {
                const elem = array[i];
                if (elem[property] === value) {
                    return elem;
                }
            }
            return null;
        },

        /**
         * Checks if specified object is array
         * We don't use instanceof because it is too slow: http://jsperf.com/instanceof-performance/2
         * @param obj Object
         */
        isArray: Array.isArray || function (obj) {
            return `${obj}` === '[object Array]';
        },

        /**
         * Returns array elements of a, which is not included in b
         *
         * @param a
         * @param b
         */
        getArraySubtraction(a, b) {
            return a.filter(i => b.indexOf(i) < 0);
        },
    };

    api.collections = CollectionUtils;
})(utils);

/**
 * Util class for support timeout, retry operations, debounce
 */
(function (api) {
    // noinspection UnnecessaryLocalVariableJS
    const ConcurrentUtils = {

        runAsync(callback, context) {
            const params = Array.prototype.slice.call(arguments, 2);
            setTimeout(() => {
                callback.apply(context, params);
            }, 0);
        },

        retryUntil(predicate, main, details) {
            if (typeof details !== 'object') {
                details = {};
            }

            let now = 0;
            const next = details.next || 200;
            const until = details.until || 2000;

            var check = function () {
                if (predicate() === true || now >= until) {
                    main();
                    return;
                }
                now += next;
                setTimeout(check, next);
            };

            setTimeout(check, 1);
        },

        debounce(func, wait) {
            let timeout;
            return function () {
                const context = this; const
                    args = arguments;
                const later = function () {
                    timeout = null;
                    func.apply(context, args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        /**
         * Returns a new function that, when invoked, invokes `func` at most once per `wait` milliseconds.
         * https://github.com/component/throttle
         *
         * @param {Function} func Function to wrap.
         * @param {Number} wait Number of milliseconds that must elapse between `func` invocations.
         * @return {Function} A new function that wraps the `func` function passed in.
         */
        throttle(func, wait) {
            let ctx; let args; let rtn; let
                timeoutID; // caching
            let last = 0;

            function call() {
                timeoutID = 0;
                last = +new Date();
                rtn = func.apply(ctx, args);
                ctx = null;
                args = null;
            }

            return function throttled() {
                ctx = this;
                args = arguments;
                const delta = new Date() - last;
                if (!timeoutID) {
                    if (delta >= wait) {
                        call();
                    } else {
                        timeoutID = setTimeout(call, wait - delta);
                    }
                }
                return rtn;
            };
        },
    };

    api.concurrent = ConcurrentUtils;
})(utils);

/**
 * Util class for detect filter type. Includes various filter identifiers
 */
(function (api) {
    const AntiBannerFiltersId = {
        USER_FILTER_ID: 0,
        RUSSIAN_FILTER_ID: 1,
        ENGLISH_FILTER_ID: 2,
        TRACKING_FILTER_ID: 3,
        SOCIAL_FILTER_ID: 4,
        SEARCH_AND_SELF_PROMO_FILTER_ID: 10,
        WHITE_LIST_FILTER_ID: 100,
        EASY_PRIVACY: 118,
        FANBOY_ANNOYANCES: 122,
        FANBOY_SOCIAL: 123,
        FANBOY_ENHANCED: 215,
        MOBILE_ADS_FILTER_ID: 11,
    };

    const FilterUtils = {

        isUserFilterRule(rule) {
            return rule.getFilterListId() === AntiBannerFiltersId.USER_FILTER_ID;
        },

        isWhiteListFilterRule(rule) {
            return rule.getFilterListId() === AntiBannerFiltersId.WHITE_LIST_FILTER_ID;
        },
    };

    // Make accessible only constants without functions. They will be passed to content-page
    FilterUtils.ids = AntiBannerFiltersId;

    // Copy filter ids to api
    for (const key in AntiBannerFiltersId) {
        if (AntiBannerFiltersId.hasOwnProperty(key)) {
            FilterUtils[key] = AntiBannerFiltersId[key];
        }
    }

    api.filters = FilterUtils;
})(utils);

/**
 * Simple time measurement utils
 */
(function (api) {
    const StopWatch = function (name) {
        this.name = name;
    };

    StopWatch.prototype = {

        start() {
            this.startTime = Date.now();
        },

        stop() {
            this.stopTime = Date.now();
        },

        print() {
            const elapsed = this.stopTime - this.startTime;
            console.log(`${this.name}[elapsed: ${elapsed} ms]`);
        },
    };

    api.StopWatch = StopWatch;
})(utils);

/**
 * Simple publish-subscribe implementation
 */
(function (api) {
    const EventChannels = (function () {
        'use strict';

        const EventChannel = function () {
            let listeners = null;
            let listenerCallback = null;

            const addListener = function (callback) {
                if (typeof callback !== 'function') {
                    throw new Error('Illegal callback');
                }
                if (listeners !== null) {
                    listeners.push(callback);
                    return;
                }
                if (listenerCallback !== null) {
                    listeners = [];
                    listeners.push(listenerCallback);
                    listeners.push(callback);
                    listenerCallback = null;
                } else {
                    listenerCallback = callback;
                }
            };

            const removeListener = function (callback) {
                if (listenerCallback !== null) {
                    listenerCallback = null;
                } else {
                    const index = listeners.indexOf(callback);
                    if (index >= 0) {
                        listeners.splice(index, 1);
                    }
                }
            };

            const notify = function () {
                if (listenerCallback !== null) {
                    return listenerCallback.apply(listenerCallback, arguments);
                }
                if (listeners !== null) {
                    for (let i = 0; i < listeners.length; i++) {
                        const listener = listeners[i];
                        listener.apply(listener, arguments);
                    }
                }
            };

            const notifyInReverseOrder = function () {
                if (listenerCallback !== null) {
                    return listenerCallback.apply(listenerCallback, arguments);
                }
                if (listeners !== null) {
                    for (let i = listeners.length - 1; i >= 0; i--) {
                        const listener = listeners[i];
                        listener.apply(listener, arguments);
                    }
                }
            };

            return {
                addListener,
                removeListener,
                notify,
                notifyInReverseOrder,
            };
        };

        const namedChannels = Object.create(null);

        const newChannel = function () {
            return new EventChannel();
        };

        const newNamedChannel = function (name) {
            const channel = newChannel();
            namedChannels[name] = channel;
            return channel;
        };

        const getNamedChannel = function (name) {
            return namedChannels[name];
        };

        return {
            newChannel,
            newNamedChannel,
            getNamedChannel,
        };
    })();

    api.channels = EventChannels;
})(utils);

/**
 * Promises wrapper
 */
(function (api) {
    const defer = Deferred;
    const deferAll = function (arr) {
        return Deferred.when.apply(Deferred, arr);
    };

    const Promise = function () {
        const deferred = defer();
        let promise;
        if (typeof deferred.promise === 'function') {
            promise = deferred.promise();
        } else {
            promise = deferred.promise;
        }

        const resolve = function (arg) {
            deferred.resolve(arg);
        };

        const reject = function (arg) {
            deferred.reject(arg);
        };

        const then = function (onSuccess, onReject) {
            promise.then(onSuccess, onReject);
        };

        return {
            promise,
            resolve,
            reject,
            then,
        };
    };

    Promise.all = function (promises) {
        const defers = [];
        for (let i = 0; i < promises.length; i++) {
            defers.push(promises[i].promise);
        }
        return deferAll(defers);
    };

    api.Promise = Promise;
})(utils, window);

/**
 * We collect here all workarounds and ugly hacks:)
 */
(function (api) {
    // noinspection UnnecessaryLocalVariableJS
    const WorkaroundUtils = {

        /**
         * Converts blocked counter to the badge text.
         * Workaround for FF - make 99 max.
         *
         * @param blocked Blocked requests count
         */
        getBlockedCountText(blocked) {
            let blockedText = blocked == '0' ? '' : blocked;
            if (blocked - 0 > 99) {
                blockedText = '\u221E';
            }

            return blockedText;
        },
    };

    api.workaround = WorkaroundUtils;
})(utils);

/**
 * Simple i18n utils
 */
(function (api) {
    function isArrayElement(array, elem) {
        return array.indexOf(elem) >= 0;
    }

    function isObjectKey(object, key) {
        return key in object;
    }

    api.i18n = {

        /**
         * Tries to find locale in the given collection of locales
         * @param locales Collection of locales (array or object)
         * @param locale Locale (e.g. en, en_GB, pt_BR)
         * @returns matched locale from the locales collection or null
         */
        normalize(locales, locale) {
            if (!locale) {
                return null;
            }

            // Transform Language-Country => Language_Country
            locale = locale.replace('-', '_');

            let search;

            if (api.collections.isArray(locales)) {
                search = isArrayElement;
            } else {
                search = isObjectKey;
            }

            if (search(locales, locale)) {
                return locale;
            }

            // Try to search by the language
            const parts = locale.split('_');
            const language = parts[0];
            if (search(locales, language)) {
                return language;
            }

            return null;
        },
    };
})(utils);

/**
 * Append browser utils
 */
browserUtils(utils);

/**
 * Append cookie utils
 */
cookie(utils);

/**
 * Append expiringCache utils
 */
expiringCache(utils);

/**
 * Unload handler. When extension is unload then 'fireUnload' is invoked.
 * You can add own handler with method 'when'
 * @type {{when, fireUnload}}
 */
export const unload = (function () {
    const unloadChannel = utils.channels.newChannel();

    const when = function (callback) {
        if (typeof callback !== 'function') {
            return;
        }
        unloadChannel.addListener(() => {
            try {
                callback();
            } catch (ex) {
                log.error('Error while invoke unload method');
                log.error(ex);
            }
        });
    };

    const fireUnload = function (reason) {
        log.info(`Unload is fired: ${reason}`);
        unloadChannel.notifyInReverseOrder(reason);
    };

    return {
        when,
        fireUnload,
    };
})();
