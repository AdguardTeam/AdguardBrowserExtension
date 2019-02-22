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
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1272
        if (Number.isInteger(timeUpdatedString)) {
            return new Date(timeUpdatedString);
        }

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
     * object containing filter data
     * @typedef {Object} FilterData
     * @property {number} filterId - filter id
     * @property {number} groupId - filter group id
     * @property {String} name - filter name
     * @property {String} description - filter description
     * @property {String} homepage - filter homepage url
     * @property {String} version - filter version
     * @property {number} timeUpdated - filter update time
     * @property {number} displayNumber - filter display number used to sort filters in the group
     * @property {array.<string>} languages - filter base languages
     * @property {number} expires - filter update interval
     * @property {String} subscriptionUrl - filter update url
     * @property {array.<number>} tags - filter tags ids
     * @property {String} [customUrl] - custom filter url
     * @property {Boolean} [trusted] - filter is trusted or not
     */

    /**
     * Filter metadata
     * @param {FilterData} filterData
     */
    var SubscriptionFilter = function (filterData) {
        const {
            filterId,
            groupId,
            name,
            description,
            homepage,
            version,
            timeUpdated,
            displayNumber,
            languages,
            expires,
            subscriptionUrl,
            tags,
            customUrl,
            trusted,
            checksum,
        } = filterData;

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
        // Custom filters data
        if (typeof customUrl !== 'undefined') {
            this.customUrl = customUrl;
        }
        if (typeof trusted !== 'undefined') {
            this.trusted = trusted;
        }
        if (typeof checksum !== 'undefined') {
            this.checksum = checksum;
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
    const createSubscriptionFilterFromJSON = function (filter) {
        const filterId = filter.filterId - 0;
        const groupId = filter.groupId - 0;
        const defaultName = filter.name;
        const defaultDescription = filter.description;
        const homepage = filter.homepage;
        const version = filter.version;
        const timeUpdated = parseTimeUpdated(filter.timeUpdated);
        const expires = filter.expires - 0;
        const subscriptionUrl = filter.subscriptionUrl;
        const languages = filter.languages;
        const displayNumber = filter.displayNumber - 0;
        const tags = filter.tags;
        const customUrl = filter.customUrl;
        const trusted = filter.trusted;
        const checksum = filter.checksum;
        if (tags.length === 0) {
            tags.push(0);
        }

        return new SubscriptionFilter({
            filterId,
            groupId,
            name: defaultName,
            description: defaultDescription,
            homepage,
            version,
            timeUpdated,
            displayNumber,
            languages,
            expires,
            subscriptionUrl,
            tags,
            customUrl,
            trusted,
            checksum,
        });
    };

    /**
     * Parses filter metadata from rules header
     *
     * @param rules
     * @returns object
     */
    const parseFilterDataFromHeader = (rules) => {
        const parseTag = (tagName) => {
            let result = '';

            // Look up no more than 50 first lines
            const maxLines = Math.min(50, rules.length);
            for (let i = 0; i < maxLines; i += 1) {
                const rule = rules[i];
                const search = '! ' + tagName + ': ';
                const indexOfSearch = rule.indexOf(search);
                if (indexOfSearch >= 0) {
                    result = rule.substring(indexOfSearch + search.length);
                }
            }

            return result;
        };

        return {
            name: parseTag('Title'),
            description: parseTag('Description'),
            homepage: parseTag('Homepage'),
            version: parseTag('Version'),
            expires: parseTag('Expires'),
            timeUpdated: parseTag('TimeUpdated'),
        };
    };

    const CUSTOM_FILTERS_START_ID = 1000;

    const addFilterId = () => {
        let max = 0;
        filters.forEach(function (f) {
            if (f.filterId > max) {
                max = f.filterId;
            }
        });

        return max >= CUSTOM_FILTERS_START_ID ? max + 1 : CUSTOM_FILTERS_START_ID;
    };


    const CUSTOM_FILTERS_JSON_KEY = 'custom_filters';

    /**
     * Loads custom filters from storage
     *
     * @returns {Array}
     */
    const loadCustomFilters = () => {
        const customFilters = adguard.localStorage.getItem(CUSTOM_FILTERS_JSON_KEY);
        return customFilters ? JSON.parse(customFilters) : [];
    };

    /**
     * Saves custom filter to storage or updates it if filter with same id was found
     *
     * @param filter
     */
    const saveCustomFilterInStorage = (filter) => {
        const customFilters = loadCustomFilters();
        // check if filter exists
        let found = false;
        const updatedCustomFilters = customFilters.map(f => {
            if (f.filterId === filter.filterId) {
                found = true;
                return filter;
            }
            return f;
        });
        if (!found) {
            updatedCustomFilters.push(filter);
        }
        adguard.localStorage.setItem(CUSTOM_FILTERS_JSON_KEY, JSON.stringify(updatedCustomFilters));
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
     * Compares filter version or filter checksum
     * @param newVersion
     * @param newChecksum
     * @param oldFilter
     * @returns {*}
     */
    function didFilterUpdate(newVersion, newChecksum, oldFilter) {
        if (newVersion) {
            return !adguard.utils.browser.isGreaterOrEqualsVersion(oldFilter.version, newVersion);
        }
        if (!oldFilter.checksum) {
            return true;
        }
        return newChecksum !== oldFilter.checksum;
    }

    /**
     * Count md5 checksum for the filter content
     * @param {Array<String>} rules
     * @returns {String} checksum string
     */
    const getChecksum = (rules) => {
        const rulesText = rules.join('\n');
        return CryptoJS.MD5(rulesText).toString();
    };

    /**
     * Updates filter checksum and version in the storage and internal structures
     * @param version
     * @param checksum
     * @param filter
     */
    const updateVersionAndChecksum = (version, checksum, filter) => {
        // set last checksum and version
        filter.checksum = checksum;
        filter.version = version;
        filters = filters.map(f => {
            if (f.filterId === filter.filterId) {
                f.version = version;
                f.checksum = checksum;
                return f;
            }
            return f;
        });
        filtersMap[filter.filterId] = filter;
        saveCustomFilterInStorage(filter);
    };

    /**
     * Adds or updates custom filter
     *
     * @param url subscriptionUrl
     * @param options
     * @param callback
     */
    const updateCustomFilter = function (url, options, callback) {
        const { title, trusted, syncSuppress } = options;
        adguard.backend.loadFilterRulesBySubscriptionUrl(url, function (rules) {
            const filterId = addFilterId();
            let {
                name,
                description,
                homepage,
                version,
                expires,
                timeUpdated,
            } = parseFilterDataFromHeader(rules);
            name = title;
            timeUpdated = timeUpdated || new Date().toISOString();
            const groupId = CUSTOM_FILTERS_GROUP_ID;
            const subscriptionUrl = url;
            const languages = [];
            const displayNumber = 0;
            const tags = [0];

            let checksum;
            if (!version) {
                checksum = getChecksum(rules);
            }

            // Check if filter from this url was added before
            let filter = filters.find(function (f) {
                return f.customUrl === url;
            });

            if (filter) {
                if (!didFilterUpdate(version, checksum, filter)) {
                    callback();
                    return;
                }
            } else {
                filter = new SubscriptionFilter({
                    filterId,
                    groupId,
                    name,
                    description,
                    homepage,
                    version,
                    timeUpdated,
                    displayNumber,
                    languages,
                    expires,
                    subscriptionUrl,
                    tags,
                    customUrl: url,
                    checksum,
                    trusted,
                });

                filter.loaded = true;
                filters.push(filter);
                filtersMap[filter.filterId] = filter;

                // Save filter in separate storage
                saveCustomFilterInStorage(filter);
                adguard.listeners.notifyListeners(adguard.listeners.SUCCESS_DOWNLOAD_FILTER, filter);
            }

            updateVersionAndChecksum(version, checksum, filter);
            adguard.listeners.notifyListeners(adguard.listeners.UPDATE_FILTER_RULES, filter, rules);
            adguard.listeners.notifyListeners(adguard.listeners.SYNC_REQUIRED, { syncSuppress });

            callback(filter.filterId);
        }, function (cause) {
            adguard.console.error(`Error download filter by url ${url}, cause: ${cause || ''}`);
            callback();
        });
    };

    const getCustomFilterInfo = (url, options, callback) => {
        const { title } = options;

        adguard.backend.loadFilterRulesBySubscriptionUrl(url, function (rules) {
            let {
                name,
                description,
                homepage,
                version,
                expires,
                timeUpdated,
            } = parseFilterDataFromHeader(rules);

            name = name || title;
            timeUpdated = timeUpdated || new Date().toISOString();

            const groupId = CUSTOM_FILTERS_GROUP_ID;
            const subscriptionUrl = url;
            const languages = [];
            const displayNumber = 0;
            const tags = [0];
            let rulesCount = rules.filter(rule => rule.trim().indexOf('!') !== 0).length;

            // Check if filter from this url was added before
            let filter = filters.find(function (f) {
                return f.customUrl === url;
            });

            if (filter) {
                callback({ error: adguard.i18n.getMessage('options_antibanner_custom_filter_already_exists') });
                return;
            }

            filter = new SubscriptionFilter({
                groupId,
                name,
                description,
                homepage,
                version,
                timeUpdated,
                displayNumber,
                languages,
                expires,
                subscriptionUrl,
                tags,
            });

            filter.loaded = true;
            // custom filters have special fields
            filter.customUrl = url;
            filter.rulesCount = rulesCount;

            callback({ filter });
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

            const customFiltersGroup = new SubscriptionGroup(
                CUSTOM_FILTERS_GROUP_ID,
                adguard.i18n.getMessage('options_antibanner_custom_group'),
                CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER,
            );
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

    const getCustomFilters = function () {
        return filters.filter(f => f.customUrl);
    };

    /**
     * Gets filter metadata by filter identifier
     */
    var getFilter = function (filterId) {
        return filtersMap[filterId];
    };

    const isTrustedFilter = (filterId) => {
        if (filterId < CUSTOM_FILTERS_START_ID) {
            return true;
        }
        const filter = filtersMap[filterId];
        return !!(filter && filter.trusted && filter.trusted === true);
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
    const getGroup = groupId => groupsMap[groupId];

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
        getCustomFilters: getCustomFilters,
        getFilter: getFilter,
        isTrustedFilter: isTrustedFilter,
        createSubscriptionFilterFromJSON: createSubscriptionFilterFromJSON,
        updateCustomFilter: updateCustomFilter,
        getCustomFilterInfo: getCustomFilterInfo,
        getLangSuitableFilters: getLangSuitableFilters,
        CUSTOM_FILTERS_START_ID: CUSTOM_FILTERS_START_ID,
    };

})(adguard);

