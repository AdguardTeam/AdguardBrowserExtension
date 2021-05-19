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

    const DEFAULT_FILTERS_UPDATE_PERIOD = -1;
    const DEFAULT_FIRST_PARTY_COOKIES_SELF_DESTRUCT_MIN = 4320;
    const DEFAULT_THIRD_PARTY_COOKIES_SELF_DESTRUCT_MIN = 2880;

    const settings = {
        DISABLE_DETECT_FILTERS: 'detect-filters-disabled',
        DISABLE_SHOW_PAGE_STATS: 'disable-show-page-statistic',
        DISABLE_SHOW_ADGUARD_PROMO_INFO: 'show-info-about-adguard-disabled',
        DISABLE_SAFEBROWSING: 'safebrowsing-disabled',
        DISABLE_FILTERING: 'adguard-disabled',
        DISABLE_COLLECT_HITS: 'hits-count-disabled',
        DISABLE_SHOW_CONTEXT_MENU: 'context-menu-disabled',
        USE_OPTIMIZED_FILTERS: 'use-optimized-filters',
        DEFAULT_WHITE_LIST_MODE: 'default-whitelist-mode',
        DISABLE_SHOW_APP_UPDATED_NOTIFICATION: 'show-app-updated-disabled',
        FILTERS_UPDATE_PERIOD: 'filters-update-period',
        DISABLE_STEALTH_MODE: 'stealth_disable_stealth_mode',
        HIDE_REFERRER: 'stealth-hide-referrer',
        HIDE_SEARCH_QUERIES: 'stealth-hide-search-queries',
        SEND_DO_NOT_TRACK: 'stealth-send-do-not-track',
        BLOCK_CHROME_CLIENT_DATA: 'stealth-remove-x-client',
        BLOCK_WEBRTC: 'stealth-block-webrtc',
        SELF_DESTRUCT_THIRD_PARTY_COOKIES: 'stealth-block-third-party-cookies',
        SELF_DESTRUCT_THIRD_PARTY_COOKIES_TIME: 'stealth-block-third-party-cookies-time',
        SELF_DESTRUCT_FIRST_PARTY_COOKIES: 'stealth-block-first-party-cookies',
        SELF_DESTRUCT_FIRST_PARTY_COOKIES_TIME: 'stealth-block-first-party-cookies-time',

        // TODO remove after few versions from 3.6.0, currently used only for migration
        // @deprecated
        STRIP_TRACKING_PARAMETERS: 'strip-tracking-parameters',
    };

    const properties = Object.create(null);
    const propertyUpdateChannel = adguard.utils.channels.newChannel();

    /**
     * Lazy default properties
     */
    const defaultProperties = {
        get defaults() {
            return adguard.lazyGet(this, 'defaults', () => {
                // Initialize default properties
                const defaults = Object.create(null);
                for (const name in settings) {
                    if (settings.hasOwnProperty(name)) {
                        defaults[settings[name]] = false;
                    }
                }
                defaults[settings.DISABLE_SHOW_ADGUARD_PROMO_INFO] = (!adguard.utils.browser.isWindowsOs() && !adguard.utils.browser.isMacOs()) || adguard.utils.browser.isEdgeBrowser();
                defaults[settings.DISABLE_SAFEBROWSING] = true;
                defaults[settings.DISABLE_COLLECT_HITS] = true;
                defaults[settings.DEFAULT_WHITE_LIST_MODE] = true;
                defaults[settings.USE_OPTIMIZED_FILTERS] = adguard.prefs.mobile;
                defaults[settings.DISABLE_DETECT_FILTERS] = false;
                defaults[settings.DISABLE_SHOW_APP_UPDATED_NOTIFICATION] = false;
                defaults[settings.FILTERS_UPDATE_PERIOD] = DEFAULT_FILTERS_UPDATE_PERIOD;
                defaults[settings.DISABLE_STEALTH_MODE] = true;
                defaults[settings.HIDE_REFERRER] = true;
                defaults[settings.HIDE_SEARCH_QUERIES] = true;
                defaults[settings.SEND_DO_NOT_TRACK] = true;
                defaults[settings.BLOCK_CHROME_CLIENT_DATA] = !!adguard.utils.browser.isChromeBrowser();
                defaults[settings.BLOCK_WEBRTC] = false;
                defaults[settings.SELF_DESTRUCT_THIRD_PARTY_COOKIES] = true;
                defaults[settings.SELF_DESTRUCT_THIRD_PARTY_COOKIES_TIME] = DEFAULT_THIRD_PARTY_COOKIES_SELF_DESTRUCT_MIN;
                defaults[settings.SELF_DESTRUCT_FIRST_PARTY_COOKIES] = false;
                defaults[settings.SELF_DESTRUCT_FIRST_PARTY_COOKIES_TIME] = DEFAULT_FIRST_PARTY_COOKIES_SELF_DESTRUCT_MIN;
                // TODO remove after few versions from 3.5.39, currently used only for migration
                // @deprecated
                defaults[settings.STRIP_TRACKING_PARAMETERS] = true;
                return defaults;
            });
        },
    };

    const getProperty = function (propertyName) {
        if (propertyName in properties) {
            return properties[propertyName];
        }

        /**
         * Don't cache values in case of uninitialized storage
         */
        if (!adguard.localStorage.isInitialized()) {
            return defaultProperties.defaults[propertyName];
        }

        let propertyValue = null;

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

    const setProperty = (propertyName, propertyValue) => {
        adguard.localStorage.setItem(propertyName, JSON.stringify(propertyValue));
        properties[propertyName] = propertyValue;
        propertyUpdateChannel.notify(propertyName, propertyValue);
        adguard.listeners.notifyListeners(adguard.listeners.SETTING_UPDATED, { propertyName, propertyValue });
    };

    const getAllSettings = function () {
        const result = {
            names: Object.create(null),
            values: Object.create(null),
            defaultValues: Object.create(null),
        };

        for (const key in settings) {
            if (settings.hasOwnProperty(key)) {
                const setting = settings[key];
                result.names[key] = setting;
                result.values[setting] = getProperty(setting);
                result.defaultValues[setting] = defaultProperties.defaults[setting];
            }
        }

        return result;
    };

    /**
     * True if filtering is disabled globally.
     *
     * @returns {boolean} true if disabled
     */
    const isFilteringDisabled = function () {
        return getProperty(settings.DISABLE_FILTERING);
    };

    const changeFilteringDisabled = function (disabled) {
        setProperty(settings.DISABLE_FILTERING, disabled);
    };

    const isAutodetectFilters = function () {
        return !getProperty(settings.DISABLE_DETECT_FILTERS);
    };

    const changeAutodetectFilters = function (enabled, options) {
        setProperty(settings.DISABLE_DETECT_FILTERS, !enabled, options);
    };

    const showPageStatistic = function () {
        return !getProperty(settings.DISABLE_SHOW_PAGE_STATS);
    };

    const changeShowPageStatistic = function (enabled, options) {
        setProperty(settings.DISABLE_SHOW_PAGE_STATS, !enabled, options);
    };

    const isShowInfoAboutAdguardFullVersion = function () {
        return !getProperty(settings.DISABLE_SHOW_ADGUARD_PROMO_INFO);
    };

    const changeShowInfoAboutAdguardFullVersion = function (show, options) {
        setProperty(settings.DISABLE_SHOW_ADGUARD_PROMO_INFO, !show, options);
    };

    const isShowAppUpdatedNotification = function () {
        return !getProperty(settings.DISABLE_SHOW_APP_UPDATED_NOTIFICATION);
    };

    const changeShowAppUpdatedNotification = function (show, options) {
        setProperty(settings.DISABLE_SHOW_APP_UPDATED_NOTIFICATION, !show, options);
    };

    const changeEnableSafebrowsing = function (enabled, options) {
        setProperty(settings.DISABLE_SAFEBROWSING, !enabled, options);
    };

    const safebrowsingInfoEnabled = function () {
        return !getProperty(settings.DISABLE_SAFEBROWSING);
    };

    const collectHitsCount = function () {
        return !getProperty(settings.DISABLE_COLLECT_HITS);
    };

    const changeCollectHitsCount = function (enabled, options) {
        setProperty(settings.DISABLE_COLLECT_HITS, !enabled, options);
    };

    const showContextMenu = function () {
        return !getProperty(settings.DISABLE_SHOW_CONTEXT_MENU);
    };

    const changeShowContextMenu = function (enabled, options) {
        setProperty(settings.DISABLE_SHOW_CONTEXT_MENU, !enabled, options);
    };

    const isDefaultWhiteListMode = function () {
        return getProperty(settings.DEFAULT_WHITE_LIST_MODE);
    };

    const isUseOptimizedFiltersEnabled = function () {
        return getProperty(settings.USE_OPTIMIZED_FILTERS);
    };

    const changeUseOptimizedFiltersEnabled = function (enabled, options) {
        setProperty(settings.USE_OPTIMIZED_FILTERS, !!enabled, options);
    };

    const changeDefaultWhiteListMode = function (enabled) {
        setProperty(settings.DEFAULT_WHITE_LIST_MODE, enabled);
    };

    /**
     * Sets filters update period after conversion in number
     * @param period
     */
    const setFiltersUpdatePeriod = function (period) {
        let parsed = Number.parseInt(period, 10);
        if (Number.isNaN(parsed)) {
            parsed = DEFAULT_FILTERS_UPDATE_PERIOD;
        }
        setProperty(settings.FILTERS_UPDATE_PERIOD, parsed);
    };

    /**
     * Returns filter update period, converted in number
     * @returns {number}
     */
    const getFiltersUpdatePeriod = function () {
        const value = getProperty(settings.FILTERS_UPDATE_PERIOD);
        let parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed)) {
            parsed = DEFAULT_FILTERS_UPDATE_PERIOD;
        }
        return parsed;
    };

    const isWebRTCDisabled = function () {
        return getProperty(settings.BLOCK_WEBRTC);
    };

    const disableShowAdguardPromoInfo = function () {
        setProperty(settings.DISABLE_SHOW_ADGUARD_PROMO_INFO, true);
    };

    const isDisableShowAdguardPromoInfo = function () {
        return getProperty(settings.DISABLE_SHOW_ADGUARD_PROMO_INFO);
    };

    const api = {};

    // Expose settings to api
    for (const key in settings) {
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
    api.isShowAppUpdatedNotification = isShowAppUpdatedNotification;
    api.changeShowAppUpdatedNotification = changeShowAppUpdatedNotification;
    api.changeEnableSafebrowsing = changeEnableSafebrowsing;
    api.safebrowsingInfoEnabled = safebrowsingInfoEnabled;
    api.collectHitsCount = collectHitsCount;
    api.changeCollectHitsCount = changeCollectHitsCount;
    api.showContextMenu = showContextMenu;
    api.changeShowContextMenu = changeShowContextMenu;
    api.isDefaultWhiteListMode = isDefaultWhiteListMode;
    api.isUseOptimizedFiltersEnabled = isUseOptimizedFiltersEnabled;
    api.changeUseOptimizedFiltersEnabled = changeUseOptimizedFiltersEnabled;
    api.changeDefaultWhiteListMode = changeDefaultWhiteListMode;
    api.getFiltersUpdatePeriod = getFiltersUpdatePeriod;
    api.setFiltersUpdatePeriod = setFiltersUpdatePeriod;
    api.isWebRTCDisabled = isWebRTCDisabled;
    api.disableShowAdguardPromoInfo = disableShowAdguardPromoInfo;
    api.isDisableShowAdguardPromoInfo = isDisableShowAdguardPromoInfo;
    api.DEFAULT_FILTERS_UPDATE_PERIOD = DEFAULT_FILTERS_UPDATE_PERIOD;

    return api;
})(adguard);
