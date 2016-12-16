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
 * Request types enumeration
 */
adguard.RequestTypes = (function () {

    'use strict';

    return {

        /**
         * Document that is loaded for a top-level frame
         */
        DOCUMENT: "DOCUMENT",

        /**
         * Document that is loaded for an embedded frame (iframe)
         */
        SUBDOCUMENT: "SUBDOCUMENT",

        SCRIPT: "SCRIPT",
        STYLESHEET: "STYLESHEET",
        OBJECT: "OBJECT",
        IMAGE: "IMAGE",
        XMLHTTPREQUEST: "XMLHTTPREQUEST",
        OBJECT_SUBREQUEST: "OBJECT-SUBREQUEST",
        MEDIA: "MEDIA",
        FONT: "FONT",
        WEBSOCKET: "WEBSOCKET",
        OTHER: "OTHER",

        /**
         * Synthetic request type for requests detected as pop-ups
         */
        POPUP: "POPUP"
    };

})();

/**
 * Utilities namespace
 */
adguard.utils = (function () {

    return {
        strings: null, // StringUtils
        collections: null, // CollectionUtils,
        concurrent: null, // ConcurrentUtils,
        channels: null, // EventChannels
        browser: null, // BrowserUtils
        filters: null, // FilterUtils,
        workaround: null, // WorkaroundUtils
        StopWatch: null,
        Promise: null // Deferred,
    };

})();

/**
 * Util class for work with strings
 */
(function (api) {

    //noinspection UnnecessaryLocalVariableJS
    var StringUtils = {

        isEmpty: function (str) {
            return !str || str.trim().length === 0;
        },

        startWith: function (str, prefix) {
            return str && str.indexOf(prefix) === 0;
        },

        endWith: function (str, postfix) {
            if (!str || !postfix) {
                return false;
            }

            if (str.endsWith) {
                return str.endsWith(postfix);
            }
            var t = String(postfix);
            var index = str.lastIndexOf(t);
            return index >= 0 && index === str.length - t.length;
        },

        substringAfter: function (str, separator) {
            if (!str) {
                return str;
            }
            var index = str.indexOf(separator);
            return index < 0 ? "" : str.substring(index + separator.length);
        },

        substringBefore: function (str, separator) {
            if (!str || !separator) {
                return str;
            }
            var index = str.indexOf(separator);
            return index < 0 ? str : str.substring(0, index);
        },

        contains: function (str, searchString) {
            return str && str.indexOf(searchString) >= 0;
        },

        containsIgnoreCase: function (str, searchString) {
            return str && searchString && str.toUpperCase().indexOf(searchString.toUpperCase()) >= 0;
        },

        replaceAll: function (str, find, replace) {
            if (!str) {
                return str;
            }
            return str.split(find).join(replace);
        },

        join: function (array, separator, startIndex, endIndex) {
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
                return "";
            }
            var buf = [];
            for (var i = startIndex; i < endIndex; i++) {
                buf.push(array[i]);
            }
            return buf.join(separator);
        },

        /**
         * Look for any symbol from "chars" array starting at "start" index
         *
         * @param str   String to search
         * @param start Start index (inclusive)
         * @param chars Chars to search for
         * @return int Index of the element found or null
         */
        indexOfAny: function (str, start, chars) {
            if (typeof str === 'string' && str.length <= start) {
                return -1;
            }

            for (var i = start; i < str.length; i++) {
                var c = str.charAt(i);
                if (chars.indexOf(c) > -1) {
                    return i;
                }
            }

            return -1;
        }
    };

    api.strings = StringUtils;

})(adguard.utils);

/**
 * Util class for work with collections
 */
(function (api) {

    //noinspection UnnecessaryLocalVariableJS
    var CollectionUtils = {

        remove: function (collection, element) {
            if (!element || !collection) {
                return;
            }
            var index = collection.indexOf(element);
            if (index >= 0) {
                collection.splice(index, 1);
            }
        },

        removeAll: function (collection, element) {
            if (!element || !collection) {
                return;
            }
            for (var i = collection.length - 1; i >= 0; i--) {
                if (collection[i] == element) {
                    collection.splice(i, 1);
                }
            }
        },

        removeRule: function (collection, rule) {
            if (!rule || !collection) {
                return;
            }
            for (var i = collection.length - 1; i >= 0; i--) {
                if (rule.ruleText === collection[i].ruleText) {
                    collection.splice(i, 1);
                }
            }
        },

        removeDuplicates: function (arr) {
            if (!arr || arr.length == 1) {
                return arr;
            }
            return arr.filter(function (elem, pos) {
                return arr.indexOf(elem) == pos;
            });
        },

        getRulesText: function (collection) {
            var text = [];
            if (!collection) {
                return text;
            }
            for (var i = 0; i < collection.length; i++) {
                text.push(collection[i].ruleText);
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
        find: function (array, property, value) {
            if (typeof array.find === 'function') {
                return array.find(function (a) {
                    return a[property] === value;
                });
            }
            for (var i = 0; i < array.length; i++) {
                var elem = array[i];
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
            return '' + obj === '[object Array]';
        }
    };

    api.collections = CollectionUtils;

})(adguard.utils);

/**
 * Util class for support timeout, retry operations, debounce
 */
(function (api) {

    //noinspection UnnecessaryLocalVariableJS
    var ConcurrentUtils = {

        runAsync: function (callback, context) {
            var params = Array.prototype.slice.call(arguments, 2);
            setTimeout(function () {
                callback.apply(context, params);
            }, 0);
        },

        retryUntil: function (predicate, main, details) {

            if (typeof details !== 'object') {
                details = {};
            }

            var now = 0;
            var next = details.next || 200;
            var until = details.until || 2000;

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

        debounce: function (func, wait) {
            var timeout;
            return function () {
                var context = this, args = arguments;
                var later = function () {
                    timeout = null;
                    func.apply(context, args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    };

    api.concurrent = ConcurrentUtils;

})(adguard.utils);

/**
 * Util class for detect filter type. Includes various filter identifiers
 */
(function (api) {

    var AntiBannerFiltersId = {
        USER_FILTER_ID: 0,
        ENGLISH_FILTER_ID: 2,
        TRACKING_FILTER_ID: 3,
        SOCIAL_FILTER_ID: 4,
        SEARCH_AND_SELF_PROMO_FILTER_ID: 10,
        SAFARI_FILTER: 12,
        WHITE_LIST_FILTER_ID: 100,
        EASY_PRIVACY: 118,
        FANBOY_ANNOYANCES: 122,
        FANBOY_SOCIAL: 123,
        FANBOY_ENHANCED: 215,
        LAST_ADGUARD_FILTER_ID: 14
    };

    var FilterUtils = {

        isAdguardFilter: function (filter) {
            return filter.filterId <= AntiBannerFiltersId.LAST_ADGUARD_FILTER_ID;
        },

        isUserFilterRule: function (rule) {
            return rule.filterId == AntiBannerFiltersId.USER_FILTER_ID;
        },

        isWhiteListFilterRule: function (rule) {
            return rule.filterId == AntiBannerFiltersId.WHITE_LIST_FILTER_ID;
        }
    };

    // Make accessible only constants without functions. They will be passed to content-page
    FilterUtils.ids = AntiBannerFiltersId;

    // Copy filter ids to api
    for (var key in AntiBannerFiltersId) {
        if (AntiBannerFiltersId.hasOwnProperty(key)) {
            FilterUtils[key] = AntiBannerFiltersId[key];
        }
    }

    api.filters = FilterUtils;

})(adguard.utils);

/**
 * Simple time measurement utils
 */
(function (api) {

    var StopWatch = function (name) {
        this.name = name;
    };

    StopWatch.prototype = {

        start: function () {
            this.startTime = Date.now();
        },

        stop: function () {
            this.stopTime = Date.now();
        },

        print: function () {
            var elapsed = this.stopTime - this.startTime;
            console.log(this.name + "[elapsed: " + elapsed + " ms]");
        }
    };

    api.StopWatch = StopWatch;

})(adguard.utils);

/**
 * Simple publish-subscribe implementation
 */
(function (api) {

    //noinspection UnnecessaryLocalVariableJS
    var EventChannels = (function () {

        'use strict';

        var EventChannel = function () {

            var listeners = null;
            var listenerCallback = null;

            var addListener = function (callback) {
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

            var removeListener = function (callback) {
                if (listenerCallback !== null) {
                    listenerCallback = null;
                } else {
                    var index = listeners.indexOf(callback);
                    if (index >= 0) {
                        listeners.splice(index, 1);
                    }
                }
            };

            var notify = function () {
                if (listenerCallback !== null) {
                    return listenerCallback.apply(listenerCallback, arguments);
                }
                if (listeners !== null) {
                    for (var i = 0; i < listeners.length; i++) {
                        var listener = listeners[i];
                        listener.apply(listener, arguments);
                    }
                }
            };

            var notifyInReverseOrder = function () {
                if (listenerCallback !== null) {
                    return listenerCallback.apply(listenerCallback, arguments);
                }
                if (listeners !== null) {
                    for (var i = listeners.length - 1; i >= 0; i--) {
                        var listener = listeners[i];
                        listener.apply(listener, arguments);
                    }
                }
            };

            return {
                addListener: addListener,
                removeListener: removeListener,
                notify: notify,
                notifyInReverseOrder: notifyInReverseOrder
            };
        };

        var namedChannels = Object.create(null);

        var newChannel = function () {
            return new EventChannel();
        };

        var newNamedChannel = function (name) {
            var channel = newChannel();
            namedChannels[name] = channel;
            return channel;
        };

        var getNamedChannel = function (name) {
            return namedChannels[name];
        };

        return {
            newChannel: newChannel,
            newNamedChannel: newNamedChannel,
            getNamedChannel: getNamedChannel
        };
    })();

    api.channels = EventChannels;

})(adguard.utils);

/**
 * Promises wrapper
 */
(function (api, global) {

    'use strict';

    var defer = global.Deferred;
    var deferAll = function (arr) {
        return global.Deferred.when.apply(global.Deferred, arr);
    };

    var Promise = function () {

        var deferred = defer();
        var promise;
        if (typeof deferred.promise === 'function') {
            promise = deferred.promise();
        } else {
            promise = deferred.promise;
        }

        var resolve = function (arg) {
            deferred.resolve(arg);
        };

        var reject = function () {
            deferred.reject();
        };

        var then = function (onSuccess, onReject) {
            promise.then(onSuccess, onReject);
        };

        return {
            promise: promise,
            resolve: resolve,
            reject: reject,
            then: then
        };
    };

    Promise.all = function (promises) {
        var defers = [];
        for (var i = 0; i < promises.length; i++) {
            defers.push(promises[i].promise);
        }
        return deferAll(defers);
    };

    api.Promise = Promise;

})(adguard.utils, window);

/**
 * We collect here all workarounds and ugly hacks:)
 */
(function (api) {

    //noinspection UnnecessaryLocalVariableJS
    var WorkaroundUtils = {

        /**
         * Converts blocked counter to the badge text.
         * Workaround for FF - make 99 max.
         *
         * @param blocked Blocked requests count
         */
        getBlockedCountText: function (blocked) {
            var blockedText = blocked == "0" ? "" : blocked;
            if (blocked - 0 > 99) {
                blockedText = '\u221E';
            }

            return blockedText;
        },

        /**
         * Checks if it is facebook like button iframe
         * TODO: Ugly, remove this
         *
         * @param url URL
         * @returns true if it is
         */
        isFacebookIframe: function (url) {
            // facebook iframe workaround
            // do not inject anything to facebook frames
            return url.indexOf('www.facebook.com/plugins/like.php') > -1;
        }
    };

    api.workaround = WorkaroundUtils;

})(adguard.utils);

/**
 * Unload handler. When extension is unload then 'fireUnload' is invoked.
 * You can add own handler with method 'when'
 * @type {{when, fireUnload}}
 */
adguard.unload = (function (adguard) {

    'use strict';

    var unloadChannel = adguard.utils.channels.newChannel();

    var when = function (callback) {
        if (typeof callback !== 'function') {
            return;
        }
        unloadChannel.addListener(function () {
            try {
                callback();
            } catch (ex) {
                console.error('Error while invoke unload method');
                console.error(ex);
            }
        });
    };

    var fireUnload = function (reason) {
        console.info('Unload is fired: ' + reason);
        unloadChannel.notifyInReverseOrder(reason);
    };

    return {
        when: when,
        fireUnload: fireUnload
    };

})(adguard);

