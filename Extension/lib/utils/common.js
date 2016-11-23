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

    endWithIgnoreCase: function (str, postfix) {
        return str && postfix && StringUtils.endWith(str.toUpperCase(), postfix.toUpperCase());
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
    }
};

var EventNotifierTypes = {
    ADD_RULE: "event.add.rule",
    ADD_RULES: "event.add.rules",
    REMOVE_RULE: "event.remove.rule",
    UPDATE_FILTER_RULES: "event.update.filter.rules",
    DISABLE_FILTER: "event.disable.filter",
    ENABLE_FILTER: "event.enable.filter",
    ADD_FILTER: "event.add.filter",
    REMOVE_FILTER: "event.remove.filter",
    ADS_BLOCKED: "event.ads.blocked",
    ENABLE_FILTERING: "event.enable.filtering",
    DISABLE_FILTERING: "event.disable.filtering",
    START_DOWNLOAD_FILTER: "event.start.download.filter",
    SUCCESS_DOWNLOAD_FILTER: "event.success.download.filter",
    ERROR_DOWNLOAD_FILTER: "event.error.download.filter",
    ENABLE_FILTER_SHOW_POPUP: "event.enable.filter.show.popup",
    LOG_EVENT: "event.log.track",
    UPDATE_TAB_BUTTON_STATE: "event.update.tab.button.state",
    REQUEST_FILTER_UPDATED: "event.request.filter.updated",
    CHANGE_PREFS: "event.change.prefs",
    UPDATE_FILTERS_SHOW_POPUP: "event.update.filters.show.popup",
    UPDATE_USER_FILTER_RULES: "event.update.user.filter.rules",
    UPDATE_WHITELIST_FILTER_RULES: "event.update.whitelist.filter.rules",
    CONTENT_BLOCKER_UPDATED: "event.content.blocker.updated"
};

/**
 * Request types enumeration
 */
var RequestTypes = {

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
    POPUP: "POPUP",

    /**
     * Checks if loaded element could be visible to user
     *
     * @param requestType Request type
     * @returns {boolean} true if request is for some visual element
     */
    isVisual: function (requestType) {
        return requestType === this.DOCUMENT ||
            requestType === this.SUBDOCUMENT ||
            requestType === this.OBJECT ||
            requestType === this.IMAGE;
    }
};

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

var LogEvents = {
    TAB_ADDED: 'log.tab.added',
    TAB_CLOSE: 'log.tab.close',
    TAB_UPDATE: 'log.tab.update',
    TAB_RESET: 'log.tab.reset',
    EVENT_ADDED: 'log.event.added'
};

var FilterUtils = {

    isUserFilter: function (filter) {
        return filter.filterId == AntiBannerFiltersId.USER_FILTER_ID;
    },

    isWhiteListFilter: function (filter) {
        return filter.filterId == AntiBannerFiltersId.WHITE_LIST_FILTER_ID;
    },

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
    }
};

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

(function (global) {

    'use strict';

    global.unload = (function () {

        var unloadChannel = EventChannels.newChannel();

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
    })();

})(window);
