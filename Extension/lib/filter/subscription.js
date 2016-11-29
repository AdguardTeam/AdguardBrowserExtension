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
 * Service that loads and parses filters metadata from backend server.
 * For now we just store filters metadata in an XML file within the extension.
 * In future we'll add an opportunity to update metadata along with filter rules update.
 */
adguard.subscriptions = (function (adguard) {

    'use strict';

    var groups = [];
    var filters = [];

    /**
     * Group metadata
     */
    var SubscriptionGroup = function (groupId, groupName, displayNumber) {
        this.groupId = groupId;
        this.groupName = groupName;
        this.displayNumber = displayNumber;
    };

    /**
     * Filter metadata
     */
    var SubscriptionFilter = function (filterId, groupId, name, description, homepage, version, timeUpdated, displayNumber, languages, expires, subscriptionUrl) {

        this.filterId = filterId;
        this.groupId = groupId;
        this.name = name;
        this.description = description;
        this.homepage = homepage;
        this.version = version;
        this.timeUpdated = timeUpdated;
        this.displayNumber = displayNumber;
        this.languages = languages;
        this.expires = expires;
        this.subscriptionUrl = subscriptionUrl;
    };

    /**
     * Create group from object
     * @param group Object
     * @returns {SubscriptionGroup}
     */
    function createSubscriptionGroupFromJSON(group) {

        var groupId = group.groupId - 0;
        var defaultGroupName = group.groupName;
        var displayNumber = group.displayNumber - 0;

        return new SubscriptionGroup(groupId, defaultGroupName, displayNumber);
    }

    /**
     * Create filter from object
     * @param filter Object
     */
    function createSubscriptionFilterFromJSON(filter) {

        var filterId = filter.filterId - 0;
        var groupId = filter.groupId - 0;
        var defaultName = filter.name;
        var defaultDescription = filter.description;
        var homepage = filter.homepage;
        var version = filter.version;
        var timeUpdated = new Date(filter.timeUpdated).getTime();
        var expires = filter.expires - 0;
        var subscriptionUrl = filter.subscriptionUrl;
        var languages = filter.languages;
        var displayNumber = filter.displayNumber - 0;

        return new SubscriptionFilter(filterId, groupId, defaultName, defaultDescription, homepage, version, timeUpdated, displayNumber, languages, expires, subscriptionUrl);
    }

    /**
     * Load groups and filters metadata
     *
     * @param successCallback
     * @param errorCallback
     * @private
     */
    function loadMetadata(successCallback, errorCallback) {

        adguard.backend.loadLocalFiltersMetadata(function (metadata) {

            groups = [];
            filters = [];

            for (var i = 0; i < metadata.groups.length; i++) {
                groups.push(createSubscriptionGroupFromJSON(metadata.groups[i]));
            }

            for (var j = 0; j < metadata.filters.length; j++) {
                filters.push(createSubscriptionFilterFromJSON(metadata.filters[j]));
            }

            adguard.console.info('Filters metadata loaded');
            successCallback();

        }, errorCallback);
    }

    /**
     * Loads groups and filters localizations
     * @param successCallback
     * @param errorCallback
     */
    function loadMetadataI18n(successCallback, errorCallback) {

        adguard.backend.loadLocalFiltersI18Metadata(function (i18nMetadata) {

            var groupsI18n = i18nMetadata.groups;
            var filtersI18n = i18nMetadata.filters;

            for (var i = 0; i < groups.length; i++) {
                applyGroupLocalization(groups[i], groupsI18n);
            }

            for (var j = 0; j < filters.length; j++) {
                applyFilterLocalization(filters[j], filtersI18n);
            }

            adguard.console.info('Filters i18n metadata loaded');
            successCallback();

        }, errorCallback);
    }

    /**
     * Localize group
     * @param group
     * @param i18nMetadata
     * @private
     */
    function applyGroupLocalization(group, i18nMetadata) {
        var groupId = group.groupId;
        var localizations = i18nMetadata[groupId];
        var locale = adguard.app.getLocale();
        if (localizations && locale in localizations) {
            var localization = localizations[locale];
            group.groupName = localization.name;
        }
    }

    /**
     * Localize filter
     * @param filter
     * @param i18nMetadata
     * @private
     */
    function applyFilterLocalization(filter, i18nMetadata) {
        var filterId = filter.filterId;
        var localizations = i18nMetadata[filterId];
        var locale = adguard.app.getLocale();
        if (localizations && locale in localizations) {
            var localization = localizations[locale];
            filter.name = localization.name;
            filter.description = localization.description;
        }
    }

    /**
     * Initialize subscription service, loading local filters metadata
     *
     * @param callback Called on operation success
     */
    var init = function (callback) {

        var errorCallback = function (request, cause) {
            adguard.console.error('Error loading metadata, cause: {0} {1}', request.statusText, cause);
        };

        loadMetadata(function () {
            loadMetadataI18n(callback, errorCallback);
        }, errorCallback);
    };

    /**
     * @returns Array of Filters metadata
     */
    var getFilters = function () {
        return filters;
    };

    /**
     * @returns Array of Groups metadata
     */
    var getGroups = function () {
        return groups;
    };

    /**
     * @returns Filters languages metadata
     */
    var getFiltersLanguages = function () {
        var filtersLanguages = Object.create(null);
        for (var i = 0; i < filters.length; i++) {
            var languages = filters[i].languages;
            if (languages && languages.length > 0) {
                filtersLanguages[filters[i].filterId] = languages;
            }
        }
        return filtersLanguages;
    };


    return {
        init: init,
        getFiltersLanguages: getFiltersLanguages,
        getGroups: getGroups,
        getFilters: getFilters
    };

})(adguard);

