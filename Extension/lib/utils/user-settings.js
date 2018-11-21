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
 * Object that manages user settings.
 * @constructor
 */
adguard.settings = (function (adguard) {

    'use strict';

    var settings = {
        DISABLE_DETECT_FILTERS: 'detect-filters-disabled',
        DISABLE_SHOW_PAGE_STATS: 'disable-show-page-statistic',
        DISABLE_SHOW_ADGUARD_PROMO_INFO: 'show-info-about-adguard-disabled',
        DISABLE_SAFEBROWSING: 'safebrowsing-disabled',
        DISABLE_SEND_SAFEBROWSING_STATS: 'safebrowsing-stats-disabled',
        DISABLE_FILTERING: 'adguard-disabled',
        DISABLE_COLLECT_HITS: 'hits-count-disabled',
        DISABLE_SHOW_CONTEXT_MENU: 'context-menu-disabled',
        USE_OPTIMIZED_FILTERS: 'use-optimized-filters',
        DEFAULT_WHITE_LIST_MODE: 'default-whitelist-mode',
    };

    var properties = Object.create(null);
    var propertyUpdateChannel = adguard.utils.channels.newChannel();

    /**
     * Lazy default properties
     */
    var defaultProperties = {
        get defaults() {
            return adguard.lazyGet(this, 'defaults', function () {
                // Initialize default properties
                var defaults = Object.create(null);
                for (var name in settings) {
                    if (settings.hasOwnProperty(name)) {
                        defaults[settings[name]] = false;
                    }
                }
                defaults[settings.DISABLE_SHOW_ADGUARD_PROMO_INFO] = (!adguard.utils.browser.isWindowsOs() && !adguard.utils.browser.isMacOs()) || adguard.utils.browser.isEdgeBrowser();
                defaults[settings.DISABLE_SAFEBROWSING] = true;
                defaults[settings.DISABLE_COLLECT_HITS] = true;
                defaults[settings.DISABLE_SEND_SAFEBROWSING_STATS] = true;
                defaults[settings.DEFAULT_WHITE_LIST_MODE] = true;
                defaults[settings.USE_OPTIMIZED_FILTERS] = adguard.utils.browser.isContentBlockerEnabled() || adguard.prefs.mobile;
                defaults[settings.DISABLE_DETECT_FILTERS] = adguard.utils.browser.isContentBlockerEnabled();
                return defaults;
            });
        }
    };

    var getProperty = function (propertyName) {

        if (propertyName in properties) {
            return properties[propertyName];
        }

        /**
         * Don't cache values in case of uninitialized storage
         */
        if (!adguard.localStorage.isInitialized()) {
            return defaultProperties.defaults[propertyName];
        }

        var propertyValue = null;

        if (adguard.localStorage.hasItem(propertyName)) {
            try {
                propertyValue = JSON.parse(adguard.localStorage.getItem(propertyName));
            } catch (ex) {
                adguard.console.error('Error get property {0}, cause: {1}', propertyName, ex);
            }
        } else if (propertyName in defaultProperties.defaults) {
            propertyValue = defaultProperties.defaults[propertyName];
        }

        properties[propertyName] = propertyValue;

        return propertyValue;
    };

    var setProperty = function (propertyName, propertyValue) {
        adguard.localStorage.setItem(propertyName, propertyValue);
        properties[propertyName] = propertyValue;
        propertyUpdateChannel.notify(propertyName, propertyValue);
    };

    var getAllSettings = function () {

        var result = {
            names: Object.create(null),
            values: Object.create(null)
        };

        for (var key in settings) {
            if (settings.hasOwnProperty(key)) {
                var setting = settings[key];
                result.names[key] = setting;
                result.values[setting] = getProperty(setting);
            }
        }

        return result;
    };

    /**
     * True if filtering is disabled globally.
     *
     * @returns {boolean} true if disabled
     */
    var isFilteringDisabled = function () {
        return getProperty(settings.DISABLE_FILTERING);
    };

    var changeFilteringDisabled = function (disabled) {
        setProperty(settings.DISABLE_FILTERING, disabled);
    };

    var isAutodetectFilters = function () {
        return !getProperty(settings.DISABLE_DETECT_FILTERS);
    };

    var changeAutodetectFilters = function (enabled) {
        setProperty(settings.DISABLE_DETECT_FILTERS, !enabled);
    };

    var showPageStatistic = function () {
        return !getProperty(settings.DISABLE_SHOW_PAGE_STATS);
    };

    var changeShowPageStatistic = function (enabled) {
        setProperty(settings.DISABLE_SHOW_PAGE_STATS, !enabled);
    };

    var isShowInfoAboutAdguardFullVersion = function () {
        return !getProperty(settings.DISABLE_SHOW_ADGUARD_PROMO_INFO);
    };

    var changeShowInfoAboutAdguardFullVersion = function (show) {
        setProperty(settings.DISABLE_SHOW_ADGUARD_PROMO_INFO, !show);
    };

    var changeEnableSafebrowsing = function (enabled) {
        setProperty(settings.DISABLE_SAFEBROWSING, !enabled);
    };

    var changeSendSafebrowsingStats = function (enabled) {
        setProperty(settings.DISABLE_SEND_SAFEBROWSING_STATS, !enabled);
    };

    var getSafebrowsingInfo = function () {
        return {
            enabled: !getProperty(settings.DISABLE_SAFEBROWSING),
            sendStats: !getProperty(settings.DISABLE_SEND_SAFEBROWSING_STATS)
        };
    };

    var collectHitsCount = function () {
        return !getProperty(settings.DISABLE_COLLECT_HITS);
    };

    var changeCollectHitsCount = function (enabled) {
        setProperty(settings.DISABLE_COLLECT_HITS, !enabled);
    };

    var showContextMenu = function () {
        return !getProperty(settings.DISABLE_SHOW_CONTEXT_MENU);
    };

    var changeShowContextMenu = function (enabled) {
        setProperty(settings.DISABLE_SHOW_CONTEXT_MENU, !enabled);
    };

    var isDefaultWhiteListMode = function () {
        return getProperty(settings.DEFAULT_WHITE_LIST_MODE);
    };

    var isUseOptimizedFiltersEnabled = function () {
        return getProperty(settings.USE_OPTIMIZED_FILTERS);
    };

    var changeDefaultWhiteListMode = function (enabled) {
        setProperty(settings.DEFAULT_WHITE_LIST_MODE, enabled);
    };

    var api = {};

    // Expose settings to api
    for (var key in settings) {
        if (settings.hasOwnProperty(key)) {
            api[key] = settings[key];
        }
    }

    api.getProperty = getProperty;
    api.setProperty = setProperty;
    api.getAllSettings = getAllSettings;

    api.onUpdated = propertyUpdateChannel;

    api.isFilteringDisabled = isFilteringDisabled;
    api.changeFilteringDisabled = changeFilteringDisabled;
    api.isAutodetectFilters = isAutodetectFilters;
    api.changeAutodetectFilters = changeAutodetectFilters;
    api.showPageStatistic = showPageStatistic;
    api.changeShowPageStatistic = changeShowPageStatistic;
    api.isShowInfoAboutAdguardFullVersion = isShowInfoAboutAdguardFullVersion;
    api.changeShowInfoAboutAdguardFullVersion = changeShowInfoAboutAdguardFullVersion;
    api.changeEnableSafebrowsing = changeEnableSafebrowsing;
    api.changeSendSafebrowsingStats = changeSendSafebrowsingStats;
    api.getSafebrowsingInfo = getSafebrowsingInfo;
    api.collectHitsCount = collectHitsCount;
    api.changeCollectHitsCount = changeCollectHitsCount;
    api.showContextMenu = showContextMenu;
    api.changeShowContextMenu = changeShowContextMenu;
    api.isDefaultWhiteListMode = isDefaultWhiteListMode;
    api.isUseOptimizedFiltersEnabled = isUseOptimizedFiltersEnabled;
    api.changeDefaultWhiteListMode = changeDefaultWhiteListMode;

    return api;

})(adguard);
