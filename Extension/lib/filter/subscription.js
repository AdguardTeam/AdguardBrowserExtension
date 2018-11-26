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

    /**
     * Custom filters group identifier
     *
     * @type {number}
     */
    const CUSTOM_FILTERS_GROUP_ID = 0;

    /**
     * Custom filters group display number
     *
     * @type {number}
     */
    const CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER = 99;

    var tags = [];
    var groups = [];
    var groupsMap = {};
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
    var SubscriptionFilter = function (filterId, groupId, name, description, homepage, version, timeUpdated, displayNumber, languages, expires, subscriptionUrl, tags, customUrl) {

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
        if (customUrl) {
            this.customUrl = customUrl;
        }
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
        var customUrl = filter.customUrl;
        if (tags.length === 0) {
            tags.push(0);
        }

        return new SubscriptionFilter(filterId, groupId, defaultName, defaultDescription, homepage, version, timeUpdated, displayNumber, languages, expires, subscriptionUrl, tags, customUrl);
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

            //Look up no more than 50 first lines
            var maxLines = Math.min(50, rules.length);
            for (var i = 0; i < maxLines; i++) {
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
            expires: parseTag('Expires'),
            timeUpdated: parseTag('TimeUpdated')
        };
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


    const CUSTOM_FILTERS_JSON_KEY = 'custom_filters';

    /**
     * Loads custom filters from storage
     *
     * @returns {Array}
     */
    const loadCustomFilters = () => {
        let customFilters = adguard.localStorage.getItem(CUSTOM_FILTERS_JSON_KEY);
        return customFilters ? JSON.parse(customFilters) : [];
    };

    /**
     * Saves custom filter to storage
     *
     * @param filter
     */
    const saveCustomFilter = (filter) => {
        let customFilters = loadCustomFilters();
        customFilters.push(filter);
        adguard.localStorage.setItem(CUSTOM_FILTERS_JSON_KEY, JSON.stringify(customFilters));
    };

    /**
     * Remove custom filter data from storage
     *
     * @param filter
     */
    const removeCustomFilterFromStorage = (filter) => {
        let customFilters = loadCustomFilters();
        const updatedCustomFilters = customFilters.filter(f => {
            if (f.filterId === filter.filterId) {
                return filter.installed;
            }
            return true;
        });
        adguard.localStorage.setItem(CUSTOM_FILTERS_JSON_KEY, JSON.stringify(updatedCustomFilters));
    };

    /**
     * Adds or updates custom filter
     *
     * @param url subscriptionUrl
     * @param callback
     */
    const updateCustomFilter = function (url, callback) {
        adguard.backend.loadFilterRulesBySubscriptionUrl(url, function (rules) {
            const filterData = parseFilterDataFromHeader(rules);
            const filterId = addFilterId();
            const groupId = CUSTOM_FILTERS_GROUP_ID;
            const defaultName = filterData.name;
            const defaultDescription = filterData.description;
            const homepage = filterData.homepage;
            const version = filterData.version;
            const timeUpdated = filterData.timeUpdated || new Date().toString();
            const expires = filterData.expires;
            const subscriptionUrl = url;
            const languages = [];
            const displayNumber = 0;
            const tags = [0];
            let rulesCount = rules.length;

            // Check if filter from this url was added before
            let filter = filters.find(function (f) {
                return f.customUrl === url;
            });

            if (filter) {
                if (version && adguard.utils.browser.isGreaterOrEqualsVersion(filter.version, version)) {
                    // Update version is not greater
                    callback();
                    return;
                }
            } else {
                filter = new SubscriptionFilter(filterId, groupId, defaultName, defaultDescription, homepage, version, timeUpdated, displayNumber, languages, expires, subscriptionUrl, tags);
                filter.loaded = true;

                // custom filters have special fields
                filter.customUrl = url;
                filter.rulesCount = rulesCount;

                filters.push(filter);
                filtersMap[filter.filterId] = filter;

                // Save filter in separate storage
                saveCustomFilter(filter);

                adguard.listeners.notifyListeners(adguard.listeners.SUCCESS_DOWNLOAD_FILTER, filter);
            }

            adguard.listeners.notifyListeners(adguard.listeners.UPDATE_FILTER_RULES, filter, rules);

            callback(filter.filterId);
        }, function (cause) {
            adguard.console.error(`Error download filter by url ${url}, cause: ${cause || ''}`);
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
            groups = [];
            groupsMap = {};
            filters = [];
            filtersMap = {};

            for (var i = 0; i < metadata.tags.length; i++) {
                tags.push(createFilterTagFromJSON(metadata.tags[i]));
            }

            for (var j = 0; j < metadata.filters.length; j += 1) {
                var filter = createSubscriptionFilterFromJSON(metadata.filters[j]);
                filters.push(filter);
                filtersMap[filter.filterId] = filter;
            }

            for (let k = 0; k < metadata.groups.length; k += 1) {
                const group = createSubscriptionGroupFromJSON(metadata.groups[k]);
                groups.push(group);
                groupsMap[group.groupId] = group;
            }

            const customFiltersGroup
                = new SubscriptionGroup(CUSTOM_FILTERS_GROUP_ID, 'Custom', CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER);
            groups.push(customFiltersGroup);
            groupsMap[customFiltersGroup.groupId] = customFiltersGroup;

            // Load custom filters
            const customFilters = loadCustomFilters();
            customFilters.forEach(f => {
                const customFilter = createSubscriptionFilterFromJSON(f);
                filters.push(customFilter);
                filtersMap[customFilter.filterId] = customFilter;
            });

            filters.sort((f1, f2) => f1.displayNumber - f2.displayNumber);

            groups.sort((f1, f2) => f1.displayNumber - f2.displayNumber);

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
            var groupsI18n = i18nMetadata.groups;

            for (var i = 0; i < tags.length; i++) {
                applyFilterTagLocalization(tags[i], tagsI18n);
            }

            for (var j = 0; j < filters.length; j++) {
                applyFilterLocalization(filters[j], filtersI18n);
            }

            for (var k = 0; k < groups.length; k++) {
                applyGroupLocalization(groups[k], groupsI18n);
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
        if (localizations) {
            var locale = adguard.utils.i18n.normalize(localizations, adguard.app.getLocale());
            var localization = localizations[locale];
            if (localization) {
                tag.name = localization.name;
                tag.description = localization.description;
            }
        }
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
        if (localizations) {
            var locale = adguard.utils.i18n.normalize(localizations, adguard.app.getLocale());
            var localization = localizations[locale];
            if (localization) {
                group.groupName = localization.name;
            }
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
        if (localizations) {
            var locale = adguard.utils.i18n.normalize(localizations, adguard.app.getLocale());
            var localization = localizations[locale];
            if (localization) {
                filter.name = localization.name;
                filter.description = localization.description;
            }
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
     */
    var getTags = function () {
        return tags;
    };

    /**
     * @returns Array of Groups metadata
     */
    const getGroups = () => groups;

    /**
     * @returns Group metadata
     */
    const getGroup = (groupId) => groupsMap[groupId];

    /**
     * Checks if group has enabled status true or false
     * @param groupId
     * @returns {boolean}
     */
    const groupHasEnabledStatus = (groupId) => {
        const group = groupsMap[groupId];
        return typeof group.enabled !== 'undefined';
    };

    /**
     * Gets list of filters for the specified languages
     *
     * @param locale Locale to check
     * @returns {Array} List of filters identifiers
     */
    var getFilterIdsForLanguage = function (locale) {
        if (!locale) {
            return [];
        }
        var filterIds = [];
        for (var i = 0; i < filters.length; i++) {
            var filter = filters[i];
            var languages = filter.languages;
            if (languages && languages.length > 0) {
                var language = adguard.utils.i18n.normalize(languages, locale);
                if (language) {
                    filterIds.push(filter.filterId);
                }
            }
        }
        return filterIds;
    };

    const getLangSuitableFilters = () => {
        // Get language-specific filters by user locale
        let filterIds = [];

        let localeFilterIds = getFilterIdsForLanguage(adguard.app.getLocale());
        filterIds = filterIds.concat(localeFilterIds);

        // Get language-specific filters by navigator languages
        // Get the 2 most commonly used languages
        const languages = adguard.utils.browser.getNavigatorLanguages(2);
        for (let i = 0; i < languages.length; i += 1) {
            localeFilterIds = getFilterIdsForLanguage(languages[i]);
            filterIds = filterIds.concat(localeFilterIds);
        }
        return [...new Set(filterIds)];
    };

    const removeCustomFilter = (filter) => {
        if (filter && filter.filterId) {
            delete filtersMap[filter.filterId];
            filters = filters.filter(f => f.filterId !== filter.filterId);
        }
    };

    // Add event listener to persist filter metadata to local storage
    adguard.listeners.addListener(function (event, payload) {
        switch (event) {
            case adguard.listeners.FILTER_ADD_REMOVE:
                if (payload && payload.removed) {
                    removeCustomFilter(payload);
                    removeCustomFilterFromStorage(payload);
                }
                break;
            default:
                break;
        }
    });

    return {
        init: init,
        getFilterIdsForLanguage: getFilterIdsForLanguage,
        getTags: getTags,
        getGroups: getGroups,
        getGroup: getGroup,
        groupHasEnabledStatus: groupHasEnabledStatus,
        getFilters: getFilters,
        getFilter: getFilter,
        createSubscriptionFilterFromJSON: createSubscriptionFilterFromJSON,
        updateCustomFilter: updateCustomFilter,
        getLangSuitableFilters: getLangSuitableFilters,
    };

})(adguard);

