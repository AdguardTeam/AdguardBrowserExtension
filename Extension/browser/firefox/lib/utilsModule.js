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

/* global Components */

/* Module with helpful utilities */

var EXPORTED_SYMBOLS = [ // jshint ignore:line
    'I18nUtils',
    'Timers'
];

var Ci = Components.interfaces;
var Cu = Components.utils;
var Cc = Components.classes;

var Services = Cu.import("resource://gre/modules/Services.jsm").Services;

var console;
try {
    console = Cu.import('resource://gre/modules/Console.jsm', {}).console;
} catch (ex) {
    console = Cu.import('resource://gre/modules/devtools/Console.jsm', {}).console;
}

var I18nUtils = (function () { // jshint ignore:line

    'use strict';

    // Randomize URI to work around bug 719376
    var stringBundle = Services.strings.createBundle('chrome://adguard/locale/messages.properties?' + Math.random());

    function getText(text, args) {
        if (!text) {
            return "";
        }
        if (args && args.length > 0) {
            text = text.replace(/\$(\d+)/g, function (match, number) {
                return typeof args[number - 1] !== "undefined" ? args[number - 1] : match;
            });
        }
        return text;
    }

    // MDN says getSimpleEnumeration returns nsIPropertyElement // https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIStringBundle#getSimpleEnumeration%28%29
    var props = stringBundle.getSimpleEnumeration();
    var messagesMap = Object.create(null);
    while (props.hasMoreElements()) {
        var prop = props.getNext();
        var propEl = prop.QueryInterface(Ci.nsIPropertyElement);
        var key = propEl.key;
        messagesMap[key] = propEl.value;
    }

    var getMessage = function (key, args) {
        try {
            return getText(stringBundle.GetStringFromName(key), args);
        } catch (ex) {
            // Key not found, simply return it as a translation
            return key;
        }
    };

    var getMessagesMap = function () {
        return messagesMap;
    };

    return {
        getMessage: getMessage,
        getMessagesMap: getMessagesMap
    };
})();

var Timers = (function () { // jshint ignore:line

    'use strict';

    var TYPE_ONE_SHOT = Ci.nsITimer.TYPE_ONE_SHOT;

    var lastTimerId = 0;

    var timers = Object.create(null);

    var setTimer = function (type, callback, delay) {

        var id = ++lastTimerId;
        var timer = timers[id] = Cc['@mozilla.org/timer;1'].createInstance(Ci.nsITimer);

        timer.initWithCallback({
            notify: function () {
                try {
                    if (type === TYPE_ONE_SHOT) {
                        delete timers[id];
                    }
                    callback.apply(null);
                } catch (error) {
                    console.exception(error);
                }
            }
        }, Math.max(delay || 4), type);

        return id;
    };

    var clearTimer = function (id) {
        var timer = timers[id];
        delete timers[id];
        if (timer) {
            timer.cancel();
        }
    };

    return {
        setTimeout: setTimer.bind(null, TYPE_ONE_SHOT),
        clearTimeout: clearTimer.bind(null)
    };
})();
