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
/* global require, exports */
/**
 * Initializing required libraries for this file.
 * require method is overridden in Chrome extension (port/require.js).
 */
var Utils = require('../../lib/utils/browser-utils').Utils;
var LS = require('../../lib/utils/local-storage').LS;
var Log = require('../../lib/utils/log').Log;
var EventNotifier = require('../../lib/utils/notifier').EventNotifier;
var EventNotifierTypes = require('../../lib/utils/common').EventNotifierTypes;

/**
 * Object that manages user settings.
 * @constructor
 */
var UserSettings = function () {

    this.settings = {

        DISABLE_DETECT_FILTERS: 'detect-filters-disabled',
        DISABLE_SHOW_PAGE_STATS: 'disable-show-page-statistic',
        DISABLE_SHOW_ADGUARD_PROMO_INFO: 'show-info-about-adguard-disabled',
        DISABLE_SAFEBROWSING: 'safebrowsing-disabled',
        DISABLE_SEND_SAFEBROWSING_STATS: 'safebrowsing-stats-disabled',
        DISABLE_FILTERING: 'adguard-disabled',
        DISABLE_COLLECT_HITS: 'hits-count-disabled',
        DISABLE_SHOW_CONTEXT_MENU: 'context-menu-disabled',
        USE_OPTIMIZED_FILTERS: 'use-optimized-filters',
        DEFAULT_WHITE_LIST_MODE: 'default-whitelist-mode'
    };

    this.defaultProperties = Object.create(null);
    for (var name in this.settings) { // jshint ignore: line
        this.defaultProperties[this.settings[name]] = false;
    }
    this.defaultProperties[this.settings.DISABLE_SHOW_ADGUARD_PROMO_INFO] = (!Utils.isWindowsOs() && !Utils.isMacOs()) || Utils.isEdgeBrowser();
    this.defaultProperties[this.settings.DISABLE_SAFEBROWSING] = true;
    this.defaultProperties[this.settings.DISABLE_COLLECT_HITS] = true;
    this.defaultProperties[this.settings.DISABLE_SEND_SAFEBROWSING_STATS] = true;
    this.defaultProperties[this.settings.DEFAULT_WHITE_LIST_MODE] = true;
    this.defaultProperties[this.settings.USE_OPTIMIZED_FILTERS] = Utils.isContentBlockerEnabled();

    this.properties = Object.create(null);
};

UserSettings.prototype.getProperty = function (propertyName) {

    if (propertyName in this.properties) {
        return this.properties[propertyName];
    }

    var propertyValue = null;

    if (propertyName in LS.storage) {
        try {
            propertyValue = JSON.parse(LS.getItem(propertyName));
        } catch (ex) {
            Log.error('Error get property {0}, cause: {1}', propertyName, ex);
        }
    } else if (propertyName in this.defaultProperties) {
        propertyValue = this.defaultProperties[propertyName];
    }

    this.properties[propertyName] = propertyValue;

    return propertyValue;
};

UserSettings.prototype.setProperty = function (propertyName, propertyValue) {
    LS.setItem(propertyName, propertyValue);
    this.properties[propertyName] = propertyValue;
    EventNotifier.notifyListeners(EventNotifierTypes.CHANGE_USER_SETTINGS, propertyName, propertyValue);
};

UserSettings.prototype.isFilteringDisabled = function () {
    return this.getProperty(this.settings.DISABLE_FILTERING);
};

UserSettings.prototype.changeFilteringDisabled = function (disabled) {
    this.setProperty(this.settings.DISABLE_FILTERING, disabled);
};

UserSettings.prototype.isAutodetectFilters = function () {
    return !this.getProperty(this.settings.DISABLE_DETECT_FILTERS);
};

UserSettings.prototype.changeAutodetectFilters = function (enabled) {
    this.setProperty(this.settings.DISABLE_DETECT_FILTERS, !enabled);
};

UserSettings.prototype.showPageStatistic = function () {
    return !this.getProperty(this.settings.DISABLE_SHOW_PAGE_STATS);
};

UserSettings.prototype.changeShowPageStatistic = function (enabled) {
    this.setProperty(this.settings.DISABLE_SHOW_PAGE_STATS, !enabled);
};

UserSettings.prototype.isShowInfoAboutAdguardFullVersion = function () {
    return !this.getProperty(this.settings.DISABLE_SHOW_ADGUARD_PROMO_INFO);
};

UserSettings.prototype.changeShowInfoAboutAdguardFullVersion = function (show) {
    this.setProperty(this.settings.DISABLE_SHOW_ADGUARD_PROMO_INFO, !show);
};

UserSettings.prototype.changeEnableSafebrowsing = function (enabled) {
    this.setProperty(this.settings.DISABLE_SAFEBROWSING, !enabled);
};

UserSettings.prototype.changeSendSafebrowsingStats = function (enabled) {
    this.setProperty(this.settings.DISABLE_SEND_SAFEBROWSING_STATS, !enabled);
};

UserSettings.prototype.getSafebrowsingInfo = function () {
    return {
        enabled: !this.getProperty(this.settings.DISABLE_SAFEBROWSING),
        sendStats: !this.getProperty(this.settings.DISABLE_SEND_SAFEBROWSING_STATS)
    };
};

UserSettings.prototype.collectHitsCount = function () {
    return !this.getProperty(this.settings.DISABLE_COLLECT_HITS);
};

UserSettings.prototype.changeCollectHitsCount = function (enabled) {
    this.setProperty(this.settings.DISABLE_COLLECT_HITS, !enabled);
};

UserSettings.prototype.showContextMenu = function () {
    return !this.getProperty(this.settings.DISABLE_SHOW_CONTEXT_MENU);
};

UserSettings.prototype.changeShowContextMenu = function (enabled) {
    this.setProperty(this.settings.DISABLE_SHOW_CONTEXT_MENU, !enabled);
};

UserSettings.prototype.isDefaultWhiteListMode = function () {
    return this.getProperty(this.settings.DEFAULT_WHITE_LIST_MODE);
};

UserSettings.prototype.isUseOptimizedFiltersEnabled = function () {
    return this.getProperty(this.settings.USE_OPTIMIZED_FILTERS);
};

UserSettings.prototype.changeDefaultWhiteListMode = function (enabled) {
    this.setProperty(this.settings.DEFAULT_WHITE_LIST_MODE, enabled);
};

UserSettings.prototype.getAllSettings = function () {

    var result = {
        names: Object.create(null),
        values: Object.create(null),
    };

    for (var key in this.settings) {
        if (this.settings.hasOwnProperty(key)) {
            var setting = this.settings[key];
            result.names[key] = setting;
            result.values[setting] = this.getProperty(setting);
        }
    }

    return result;
};

var userSettings = exports.userSettings = new UserSettings();