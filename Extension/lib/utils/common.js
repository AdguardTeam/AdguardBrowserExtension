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
 * Initializing required libraries for this file.
 * require method is overridden in Chrome extension (port/require.js).
 */
var Log = require('utils/log').Log;

var StringUtils = exports.StringUtils = {

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
    }
};

var CollectionUtils = exports.CollectionUtils = {

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
            if (rule.ruleText == collection[i].ruleText) {
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

    getRulesFromTextUnique: function (rulesFilterMap) {

        var rules = Object.create(null);

        for (var filterId in rulesFilterMap) {
            var rulesTexts = rulesFilterMap[filterId];
            for (var i = 0; i < rulesTexts.length; i++) {
                var ruleText = rulesTexts[i];
                if (ruleText in rules) {
                    continue;
                }
                rules[ruleText] = filterId - 0;
            }
        }
        return rules;
    }
};

var EventNotifierTypes = exports.EventNotifierTypes = {
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
    CHANGE_USER_SETTINGS: "event.change.user.settings",
    UPDATE_FILTERS_SHOW_POPUP: "event.update.filters.show.popup",
    UPDATE_USER_FILTER_RULES: "event.update.user.filter.rules",
    UPDATE_WHITELIST_FILTER_RULES: "event.update.whitelist.filter.rules",
    CONTENT_BLOCKER_UPDATED: "event.content.blocker.updated"
};

/**
 * Request types enumeration
 */
var RequestTypes = exports.RequestTypes = {

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

    /**
     * Synthetic request type for requests detected as pop-ups
     */
    POPUP: "POPUP",
    OTHER: "OTHER",

    /**
     * Checks if loaded element could be visible to user
     *
     * @param requestType Request type
     * @returns {boolean} true if request is for some visual element
     */
    isVisual: function (requestType) {
        return requestType == this.DOCUMENT ||
            requestType == this.SUBDOCUMENT ||
            requestType == this.OBJECT ||
            requestType == this.IMAGE;
    }
};

var AntiBannerFiltersId = exports.AntiBannerFiltersId = {
    USER_FILTER_ID: 0,
    ENGLISH_FILTER_ID: 2,
    TRACKING_FILTER_ID: 3,
    SOCIAL_FILTER_ID: 4,
    ACCEPTABLE_ADS_FILTER_ID: 10,
    SAFARI_FILTER: 12,
    WHITE_LIST_FILTER_ID: 100,
    EASY_PRIVACY: 118,
    FANBOY_ANNOYANCES: 122,
    FANBOY_SOCIAL: 123,
    FANBOY_ENHANCED: 215
};

var LogEvents = exports.LogEvents = {
    TAB_ADDED: 'log.tab.added',
    TAB_CLOSE: 'log.tab.close',
    TAB_UPDATE: 'log.tab.update',
    TAB_RESET: 'log.tab.reset',
    EVENT_ADDED: 'log.event.added'
};

var FilterUtils = exports.FilterUtils = {

    isUserFilter: function (filter) {
        return filter.filterId == AntiBannerFiltersId.USER_FILTER_ID;
    },

    isWhiteListFilter: function (filter) {
        return filter.filterId == AntiBannerFiltersId.WHITE_LIST_FILTER_ID;
    },

    isAdguardFilter: function (filter) {
        return filter.filterId <= AntiBannerFiltersId.ACCEPTABLE_ADS_FILTER_ID ||
            filter.filterId == AntiBannerFiltersId.SAFARI_FILTER;
    },

    isUserFilterRule: function (rule) {
        return rule.filterId == AntiBannerFiltersId.USER_FILTER_ID;
    },

    isWhiteListFilterRule: function (rule) {
        return rule.filterId == AntiBannerFiltersId.WHITE_LIST_FILTER_ID;
    }
};

var StopWatch = exports.StopWatch = function (name) {
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
