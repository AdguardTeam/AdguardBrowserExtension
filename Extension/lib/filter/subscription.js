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

    var tags = [];
    var filters = [];
    var filtersMap = {};

    /**
     * @param timeUpdatedString String in format 'yyyy-MM-dd'T'HH:mm:ssZ'
     * @returns timestamp from date string
     */
    function parseTimeUpdated(timeUpdatedString) {
        // https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Date/parse
        var timeUpdated = Date.parse(timeUpdatedString);
        if (isNaN(timeUpdated)) {
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/478
            timeUpdated = Date.parse(timeUpdatedString.replace(/\+(\d{2})(\d{2})$/, "+$1:$2"));
        }
        if (isNaN(timeUpdated)) {
            timeUpdated = new Date().getTime();
        }
        return timeUpdated;
    }

    /**
     * Tag metadata
     */
    var FilterTag = function (tagId, keyword) {
        this.tagId = tagId;
        this.keyword = keyword;
    };

    /**
     * Filter metadata
     */
    var SubscriptionFilter = function (filterId, groupId, name, description, homepage, version, timeUpdated, displayNumber, languages, expires, subscriptionUrl, tags) {

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
        this.tags = tags;
    };

    /**
     * Create tag from object
     * @param tag Object
     * @returns {FilterTag}
     */
    function createFilterTagFromJSON(tag) {

        var tagId = tag.tagId - 0;
        var keyword = tag.keyword;

        return new FilterTag(tagId, keyword);
    }

    /**
     * Create filter from object
     * @param filter Object
     */
    var createSubscriptionFilterFromJSON = function (filter) {

        var filterId = filter.filterId - 0;
        var groupId = filter.groupId - 0;
        var defaultName = filter.name;
        var defaultDescription = filter.description;
        var homepage = filter.homepage;
        var version = filter.version;
        var timeUpdated = parseTimeUpdated(filter.timeUpdated);
        var expires = filter.expires - 0;
        var subscriptionUrl = filter.subscriptionUrl;
        var languages = filter.languages;
        var displayNumber = filter.displayNumber - 0;
        var tags = filter.tags;
        if (tags.length === 0) {
            tags.push(0);
        }

        return new SubscriptionFilter(filterId, groupId, defaultName, defaultDescription, homepage, version, timeUpdated, displayNumber, languages, expires, subscriptionUrl, tags);
    };

    /**
     * Parses filter metadata from rules header
     *
     * @param rules
     * @returns object
     */
    var parseFilterDataFromHeader = function (rules) {
        function parseTag(tagName) {
            var result = '';

            //Look up only 50 first lines
            for (var i = 0; i < 50; i++) {
                var r = rules[i];

                var search = '! ' + tagName + ': ';
                var indexOf = r.indexOf(search);
                if (indexOf >= 0) {
                    result = r.substring(indexOf + search.length);
                }
            }

            return result;
        }

        return {
            name: parseTag('Title'),
            description: parseTag('Description'),
            homepage: parseTag('Homepage'),
            version: parseTag('Version'),
            expires: parseTag('Expires')
        }
    };

    var addFilterId = function () {
        var max = 0;
        filters.forEach(function (f) {
            if (f.filterId > max) {
                max = f.filterId;
            }
        });

        return max >= 1000 ? max + 1 : 1000;
    };

    /**
     * Adds or updates custom filter
     *
     * @param url subscriptionUrl
     * @param callback
     */
    var updateCustomFilter = function (url, callback) {

        adguard.backend.loadFilterRulesBySubscriptionUrl(url, function (rules) {
            var filterData = parseFilterDataFromHeader(rules);

            var filterId = addFilterId();
            var groupId = 0;
            var defaultName = filterData.name;
            var defaultDescription = filterData.description;
            var homepage = filterData.homepage;
            var version = filterData.version;
            var timeUpdated = null;
            var expires = filterData.expires;
            var subscriptionUrl = url;
            var languages = [];
            var displayNumber = 0;
            var tags = [0];

            //Check if filter from this url was added before
            var filter = filters.find(function (f) {
                return f.customUrl === url;
            });

            if (filter) {
                if (version && adguard.utils.browser.isGreaterVersion(filter.version, version)) {
                    //Update version is not greater
                    callback();
                    return;
                }
            } else {
                filter = new SubscriptionFilter(filterId, groupId, defaultName, defaultDescription, homepage, version, timeUpdated, displayNumber, languages, expires, subscriptionUrl, tags);
                filter.loaded = true;
                //custom filters have special field
                filter.customUrl = url;

                filters.push(filter);
                filtersMap[filter.filterId] = filter;

                adguard.listeners.notifyListeners(adguard.listeners.SUCCESS_DOWNLOAD_FILTER, filter);
            }

            adguard.listeners.notifyListeners(adguard.listeners.UPDATE_FILTER_RULES, filter, rules);

            callback(filter.filterId);

        }, function (request, cause) {
            adguard.console.error("Error download filter by url {0}, cause: {1} {2}", url, request.statusText, cause || "");
            callback();
        });
    };

    /**
     * Load groups and filters metadata
     *
     * @param successCallback
     * @param errorCallback
     * @private
     */
    function loadMetadata(successCallback, errorCallback) {

        adguard.backend.loadLocalFiltersMetadata(function (metadata) {

            tags = [];
            filters = [];
            filtersMap = {};

            for (var i = 0; i < metadata.tags.length; i++) {
                tags.push(createFilterTagFromJSON(metadata.tags[i]));
            }

            for (var j = 0; j < metadata.filters.length; j++) {
                var filter = createSubscriptionFilterFromJSON(metadata.filters[j]);
                filters.push(filter);
                filtersMap[filter.filterId] = filter;
            }

            filters.sort(function (f1, f2) {
                return f1.displayNumber - f2.displayNumber;
            });

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

            var tagsI18n = i18nMetadata.tags;
            var filtersI18n = i18nMetadata.filters;

            for (var i = 0; i < tags.length; i++) {
                applyFilterTagLocalization(tags[i], tagsI18n);
            }

            for (var j = 0; j < filters.length; j++) {
                applyFilterLocalization(filters[j], filtersI18n);
            }

            adguard.console.info('Filters i18n metadata loaded');
            successCallback();

        }, errorCallback);
    }


    /**
     * Loads script rules from local file
     * @returns {exports.Promise}
     * @private
     */
    function loadLocalScriptRules(successCallback, errorCallback) {
        var localScriptRulesService = adguard.rules.LocalScriptRulesService;
        if (typeof localScriptRulesService !== 'undefined') {
            adguard.backend.loadLocalScriptRules(function (json) {
                localScriptRulesService.setLocalScriptRules(json);
                successCallback();
            }, errorCallback);
        } else {
            // LocalScriptRulesService may be undefined, in this case don't load local script rules
            successCallback();
        }
    }

    /**
     * Localize tag
     * @param tag
     * @param i18nMetadata
     * @private
     */
    function applyFilterTagLocalization(tag, i18nMetadata) {
        var tagId = tag.tagId;
        var localizations = i18nMetadata[tagId];
        var locale = adguard.app.getLocale();
        if (localizations && locale in localizations) {
            var localization = localizations[locale];
            tag.name = localization.name;
            tag.description = localization.description;
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
            loadMetadataI18n(function () {
                loadLocalScriptRules(callback, errorCallback);
            }, errorCallback);
        }, errorCallback);
    };

    /**
     * @returns Array of Filters metadata
     */
    var getFilters = function () {
        return filters;
    };

    /**
     * Gets filter metadata by filter identifier
     */
    var getFilter = function (filterId) {
        return filtersMap[filterId];
    };

    /**
     * @returns Array of Tags metadata
     * @Deprecated
     */
    var getTags = function () {
        return tags;
    };

    /**
     * Gets list of filters for the specified languages
     *
     * @param lang Language to check
     * @returns List of filters identifiers
     */
    var getFilterIdsForLanguage = function (lang) {
        if (!lang) {
            return [];
        }
        lang = lang.substring(0, 2).toLowerCase();
        var filterIds = [];
        for (var i = 0; i < filters.length; i++) {
            var filter = filters[i];
            var languages = filter.languages;
            if (languages && languages.indexOf(lang) >= 0) {
                filterIds.push(filter.filterId);
            }
        }
        return filterIds;
    };

    return {
        init: init,
        getFilterIdsForLanguage: getFilterIdsForLanguage,
        getTags: getTags,
        getFilters: getFilters,
        getFilter: getFilter,
        createSubscriptionFilterFromJSON: createSubscriptionFilterFromJSON,
        updateCustomFilter: updateCustomFilter
    };

})(adguard);

