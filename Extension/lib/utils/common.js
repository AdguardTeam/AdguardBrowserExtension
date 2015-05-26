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
var Cu = require('chrome').Cu;
var Cc = require('chrome').Cc;
var Ci = require('chrome').Ci;
var LS = require('utils/local-storage').LS;
var Prefs = require('prefs').Prefs;
var setTimeout = require('sdk/timers').setTimeout;
var clearTimeout = require('sdk/timers').clearTimeout;
Cu.import("resource://gre/modules/Services.jsm");

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

    getRulesFromTextAsyncUnique: function (rulesFilterMap, callback) {
        if (Prefs.speedupStartup()) {
            setTimeout(function () {
                callback(CollectionUtils.getRulesFromTextUnique(rulesFilterMap));
            }, 500);
        } else {
            callback(CollectionUtils.getRulesFromTextUnique(rulesFilterMap));
        }
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

var Utils = exports.Utils = {

    navigator: Cc["@mozilla.org/network/protocol;1?name=http"].getService(Ci.nsIHttpProtocolHandler),

    getClientId: function () {

        var clientId = LS.getItem("client-id");
        if (!clientId) {
            var result = [];
            var suffix = (Date.now()) % 1e8;
            var symbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890';
            for (var i = 0; i < 8; i++) {
                var symbol = symbols[Math.floor(Math.random() * symbols.length)];
                result.push(symbol);
            }
            clientId = result.join('') + suffix;
            LS.setItem("client-id", clientId);
        }

        return clientId;
    },

    isGreaterVersion: function (leftVersion, rightVersion) {
        var left = new Version(leftVersion);
        var right = new Version(rightVersion);
        return left.compare(right) > 0;
    },

    getAppVersion: function () {
        return LS.getItem("app-version");
    },

    setAppVersion: function (version) {
        LS.setItem("app-version", version);
    },

    isYaBrowser: function () {
        return Prefs.getBrowser() == "YaBrowser";
    },

    isOperaBrowser: function () {
        return Prefs.getBrowser() == "Opera";
    },

    isSafariBrowser: function () {
        return Prefs.getBrowser() == "Safari";
    },

    isFirefoxBrowser: function () {
        return Prefs.getBrowser() == "Firefox" || Prefs.getBrowser() == "Android";
    },

    isChromeBrowser: function () {
        return Prefs.getBrowser() == "Chrome";
    },

    isWindowsOs: function () {
        return Utils.navigator.userAgent.toLowerCase().indexOf("win") >= 0;
    },

    isMacOs: function () {
        return Utils.navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    },

    getExtensionStoreLink: function () {
        var urlBuilder = ["http://adguard.com/"];

        if (Prefs.locale == "ru") {
            urlBuilder.push("ru");
        } else {
            urlBuilder.push("en");
        }
        urlBuilder.push("/extension-page.html?browser=");

        if (Utils.isOperaBrowser()) {
            urlBuilder.push("opera");
        } else if (Utils.isFirefoxBrowser()) {
            urlBuilder.push("firefox");
        } else if (Utils.isYaBrowser()) {
            urlBuilder.push("yabrowser");
        } else if (Utils.isSafariBrowser()) {
            urlBuilder.push("safari");
        } else {
            urlBuilder.push("chrome");
        }

        return urlBuilder.join("");
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
    },

    getFiltersUpdateResultMessage: function (i18nGetMessage, success, updatedFilters) {
        var title = i18nGetMessage("options_popup_update_title");
        var text = [];
        if (success) {
            if (updatedFilters.length == 0) {
                text.push(i18nGetMessage("options_popup_update_not_found"));
            } else {
                updatedFilters.sort(function (a, b) {
                    return a.displayNumber - b.displayNumber;
                });
                for (var i = 0; i < updatedFilters.length; i++) {
                    var filter = updatedFilters[i];
                    text.push(i18nGetMessage("options_popup_update_updated", [filter.name, filter.version]).replace("$1", filter.name).replace("$2", filter.version));
                }
            }
        } else {
            text.push(i18nGetMessage("options_popup_update_error"));
        }

        return {
            title: title,
            text: text
        }
    },

    getFiltersEnabledResultMessage: function (i18nGetMessage, enabledFilters) {
        var title = i18nGetMessage("alert_popup_filter_enabled_title");
        var text = [];
        enabledFilters.sort(function (a, b) {
            return a.displayNumber - b.displayNumber;
        });
        for (var i = 0; i < enabledFilters.length; i++) {
            var filter = enabledFilters[i];
            text.push(i18nGetMessage("alert_popup_filter_enabled_text", [filter.name]).replace("$1", filter.name));
        }
        return {
            title: title,
            text: text
        }
    },

    getAbpSubscribeConfirmMessage: function (i18nGetMessage, filterMetadata, subscriptionTitle) {
        if (filterMetadata) {
            //ok, filter found
            return i18nGetMessage('abp_subscribe_confirm_enable', [filterMetadata.name]).replace("$1", filterMetadata.name);
        } else {
            //filter not found
            return i18nGetMessage('abp_subscribe_confirm_import', [subscriptionTitle]).replace("$1", subscriptionTitle);
        }
    },

    getAbpSubscribeFinishedMessage: function (i18nGetMessage, rulesCount) {
        return {
            title: i18nGetMessage('abp_subscribe_confirm_import_finished_title'),
            text: i18nGetMessage('abp_subscribe_confirm_import_finished_text', [rulesCount]).replace("$1", rulesCount)
        }
    },

    findHeaderByName: function (headers, headerName) {
        if (headers) {
            for (var i = 0; i < headers.length; i++) {
                var header = headers[i];
                if (header.name === headerName) {
                    return header;
                }
            }
        }
        return null;
    },

    getSafebrowsingBackUrl: function (frameData) {
        if (frameData) {
            //https://code.google.com/p/chromium/issues/detail?id=11854
            var previousUrl = frameData.previousUrl;
            if (previousUrl && previousUrl.indexOf('http') === 0) {
                return previousUrl;
            }
            var referrerUrl = frameData.referrerUrl;
            if (referrerUrl && referrerUrl.indexOf('http') === 0) {
                return referrerUrl;
            }
        }
        if (this.isFirefoxBrowser()) {
            return 'about:newtab';
        } else if (this.isSafariBrowser()) {
            return 'about:blank';
        } else {
            return 'about:newtab';
        }
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

var Version = exports.Version = function (version) {

    this.version = Object.create(null);

    var parts = (version || "").split(".");

    function parseVersionPart(part) {
        if (isNaN(part)) {
            return 0;
        }
        return Math.max(part - 0, 0);
    }

    for (var i = 3; i >= 0; i--) {
        this.version[i] = parseVersionPart(parts[i]);
    }
};

Version.prototype.compare = function (o) {
    for (var i = 0; i < 4; i++) {
        if (this.version[i] > o.version[i]) {
            return 1;
        } else if (this.version[i] < o.version[i]) {
            return -1;
        }
    }
    return 0;
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
    REBUILD_REQUEST_FILTER_END: "event.rebuild.request.filter.end",
    CHANGE_USER_SETTINGS: "event.change.user.settings",
    UPDATE_FILTERS_SHOW_POPUP: "event.update.filters.show.popup",
    UPDATE_USER_FILTER_RULES: "event.update.user.filter.rules",
    UPDATE_WHITELIST_FILTER_RULES: "event.update.whitelist.filter.rules"
};

var AntiBannerFiltersId = exports.AntiBannerFiltersId = {
    USER_FILTER_ID: 0,
    ENGLISH_FILTER_ID: 2,
    TRACKING_FILTER_ID: 3,
    SOCIAL_FILTER_ID: 4,
    ACCEPTABLE_ADS_FILTER_ID: 10,
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
        return filter.filterId <= AntiBannerFiltersId.ACCEPTABLE_ADS_FILTER_ID;
    },

    isUserFilterRule: function (rule) {
        return rule.filterId == AntiBannerFiltersId.USER_FILTER_ID;
    },

    isWhiteListFilterRule: function (rule) {
        return rule.filterId == AntiBannerFiltersId.WHITE_LIST_FILTER_ID;
    }
};

var ConcurrentUtils = exports.ConcurrentUtils = {

    runAsync: function (callback, context) {
        var params = Array.prototype.slice.call(arguments, 2);
        setTimeout(function () {
            callback.apply(context, params);
        }, 0);
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