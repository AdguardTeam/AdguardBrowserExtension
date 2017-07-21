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
 * Entry point for EmbeddedWebExtension.
 * The main purpose of this file is to port stored settings and filters rules.
 * See https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Embedded_WebExtensions
 */

/* global startup, shutdown, install, uninstall, Components */

var {classes: Cc, interfaces: Ci, utils: Cu} = Components; // jshint ignore:line
var Services = Cu.import("resource://gre/modules/Services.jsm").Services;
var FileUtils = Cu.import("resource://gre/modules/FileUtils.jsm").FileUtils;
var NetUtil = Cu.import("resource://gre/modules/NetUtil.jsm").NetUtil;

function startup(options) { // jshint ignore:line

    var simplePrefs = new SimplePrefs(options.id);
    var migrationHelper = new MigrationHelper(simplePrefs);

    var webExtension = options.webExtension;
    webExtension.startup().then(function (api) {
        var browser = api.browser;
        browser.runtime.onMessage.addListener(function (message, sender, callback) {
            if (message.type === 'Adguard:WebExtMigration') {
                migrationHelper.migrate(callback);
            }
            return true;
        });
    });
}

function shutdown() { // jshint ignore:line
}

function install() { // jshint ignore:line
}

function uninstall() { // jshint ignore:line
}

/**
 * Simple prefs wrapper
 * @param id
 * @returns {{get: get, set: set, keys: keys, remove: remove}}
 * @constructor
 */
var SimplePrefs = function (id) {

    var branch = Services.prefs.getBranch('extensions.' + id + '.');

    var get = function (name, defaultValue) {
        var prefType = branch.getPrefType(name);
        switch (prefType) {
            case Ci.nsIPrefBranch.PREF_STRING:
                return branch.getComplexValue(name, Ci.nsISupportsString).data;
            case Ci.nsIPrefBranch.PREF_INT:
                return branch.getIntPref(name);
            case Ci.nsIPrefBranch.PREF_BOOL:
                return branch.getBoolPref(name);
            case Ci.nsIPrefBranch.PREF_INVALID:
                return defaultValue;
            default:
                // This should never happen.
                throw new Error("Error getting pref " + name + "; its value's type is " + prefType + ", which I don't know how to handle.");
        }
    };

    var set = function (name, value) {

        var prefType;
        if (typeof value !== "undefined" && value !== null) {
            prefType = value.constructor.name;
        }

        switch (prefType) {
            case "String":
                var string = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
                string.data = value;
                branch.setComplexValue(name, Ci.nsISupportsString, string);
                break;
            case "Number":
                branch.setIntPref(name, value);
                break;
            case "Boolean":
                branch.setBoolPref(name, value);
                break;
            default:
                throw new Error("can't set pref " + name + " to value '" + value + "'; it isn't a string, integer, or boolean");
        }
    };

    var keys = function () {
        return branch.getChildList('', {});
    };

    var remove = function (name) {
        branch.clearUserPref(name);
    };

    return {
        get: get,
        set: set,
        keys: keys,
        remove: remove
    };
};

/**
 * File storage wrapper
 * @type {{readFromFile, removeFile, list}}
 */
var FileStorage = (function () {

    'use strict';

    var PROFILE_DIR = 'ProfD';
    var ADGUARD_DIR = 'Adguard';

    var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
    converter.charset = "UTF-8";

    /**
     * Reads file's content
     * @param file
     * @param callback
     */
    function readAsync(file, callback) {

        var fetchCallback = function (inputStream, status) {
            if (Components.isSuccessCode(status)) {
                var data = NetUtil.readInputStreamToString(inputStream, inputStream.available());
                data = converter.ConvertToUnicode(data);
                callback(null, data);
            } else {
                callback(status);
            }
        };

        try {
            NetUtil.asyncFetch(file, fetchCallback);
        } catch (ex) {
            var aSource = {
                uri: file,
                loadUsingSystemPrincipal: true
            };
            NetUtil.asyncFetch(aSource, fetchCallback);
        }
    }

    /**
     * Reads file's content
     * @param filename
     * @param callback
     */
    var read = function (filename, callback) {
        var file = FileUtils.getFile(PROFILE_DIR, [ADGUARD_DIR, filename]);
        if (!file.exists() || file.fileSize === 0) {
            callback(null, []);
            return;
        }
        readAsync(file, function (error, data) {
            if (error) {
                callback(error);
            } else {
                if (!data) {
                    callback(null, []);
                } else {
                    var lines = data.split(/[\r\n]+/);
                    callback(null, lines);
                }
            }
        });
    };

    /**
     * List of files in directory
     * @returns {Array}
     */
    var list = function () {
        var adguardDir = FileUtils.getDir(PROFILE_DIR, [ADGUARD_DIR]);
        if (!adguardDir.exists()) {
            return [];
        }
        var entries = adguardDir.directoryEntries;
        var array = [];
        while (entries.hasMoreElements()) {
            var entry = entries.getNext();
            entry.QueryInterface(Components.interfaces.nsIFile);
            if (entry.isFile()) {
                array.push(entry.leafName);
            }
        }
        return array;
    };

    return {
        readFromFile: read,
        list: list
    };

})();

/**
 * Migrate stored settings and rules to new WebExt format
 * @param simplePrefs
 * @returns {{migrate: migrate}}
 * @constructor
 */
var MigrationHelper = function (simplePrefs) {

    var settingsMigrated = simplePrefs.get('adguard-settings-migrated', false);

    var simplePrefsMigrated = false;
    var filesToMigrate = null;

    function onMigrationFinished(callback) {
        settingsMigrated = true;
        callback({
            type: 'finished'
        });
    }

    /**
     * Gets all extension's preferences
     * @returns {{}}
     */
    function getSimplePrefs() {
        var values = {};
        var keys = simplePrefs.keys();
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (key.indexOf('sdk.') === 0) {
                // Skip sdk prefs
                continue;
            }
            values[key] = simplePrefs.get(key);
        }
        return values;
    }

    /**
     * Migration process consists of 2 steps:
     * 1. Migrate extension's preferences.
     * 2. Migrate extension's filter rules. Rules migration is performed for each filter, one by one.
     * @param callback
     */
    var migrate = function (callback) {

        if (settingsMigrated) {
            onMigrationFinished(callback);
            return;
        }

        try {
            if (!simplePrefsMigrated) {
                var values = getSimplePrefs();
                callback({
                    type: 'user-settings',
                    values: values
                });
                simplePrefsMigrated = true;
                return;
            }

            if (filesToMigrate === null) {
                filesToMigrate = FileStorage.list();
            }
            if (filesToMigrate.length === 0) {
                simplePrefs.set('adguard-settings-migrated', true);
                onMigrationFinished(callback);
            } else {
                var file = filesToMigrate.pop();
                FileStorage.readFromFile(file, function (error, lines) {
                    callback({
                        type: 'filter-rules',
                        values: {
                            key: file,
                            value: lines
                        }
                    });
                });
            }

        } catch (ex) {
            onMigrationFinished(callback);
            Cu.reportError('Adguard: Unable to migrate settings...');
            Cu.reportError(ex);
        }

        simplePrefs.set('adguard-settings-migrated', true);
    };

    return {
        migrate: migrate
    };
};
