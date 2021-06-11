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

import MD5 from 'crypto-js/md5';
import { listeners } from '../../notifier';
import { log } from '../../../common/log';
import { backend } from './service-client';
import { backgroundPage } from '../../extension-api/background-page';
import { localStorage } from '../../storage';
import { utils } from '../../utils/common';
import { localScriptRulesService } from '../rules/local-script-rules';
import { redirectService } from '../services/redirect-service';
import { browserUtils } from '../../utils/browser-utils';
import { translator } from '../../../common/translators/translator';
import { ANTIBANNER_GROUPS_ID } from '../../../common/constants';
import { filtersState } from './filters-state';
import { SubscriptionFilter, SubscriptionGroup } from './metadata';
import { metadataFactory } from './metadata-factory';

/**
 * Service that loads and parses filters metadata from backend server.
 * For now we just store filters metadata in an XML file within the extension.
 * In future we'll add an opportunity to update metadata along with filter rules update.
 */
export const subscriptions = (() => {
    /**
     * Storage key for metadata object
     * @type {string}
     */
    const METADATA_STORAGE_KEY = 'filters-metadata';

    /**
     * Custom filters group display number
     *
     * @type {number}
     */
    const CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER = 99;

    let tags = [];
    let groups = [];
    let groupsMap = {};
    let filters = [];
    let filtersMap = {};

    const parseExpiresStr = (str) => {
        const regexp = /(\d+)\s+(day|hour)/;

        const parseRes = str.match(regexp);

        if (!parseRes) {
            const parsed = Number.parseInt(str, 10);
            return Number.isNaN(parsed) ? 0 : parsed;
        }

        const [, num, period] = parseRes;

        let multiplier = 1;
        switch (period) {
            case 'day': {
                multiplier = 24 * 60 * 60;
                break;
            }
            case 'hour': {
                multiplier = 60 * 60;
                break;
            }
            default: {
                break;
            }
        }

        return num * multiplier;
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
                const search = `! ${tagName}: `;
                const indexOfSearch = rule.indexOf(search);
                if (indexOfSearch >= 0) {
                    result = rule.substring(indexOfSearch + search.length);
                }
            }

            if (tagName === 'Expires') {
                result = parseExpiresStr(result);
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
        filters.forEach((f) => {
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
        const customFilters = localStorage.getItem(CUSTOM_FILTERS_JSON_KEY);
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
        const updatedCustomFilters = customFilters.map((f) => {
            if (f.filterId === filter.filterId) {
                found = true;
                return filter;
            }
            return f;
        });
        if (!found) {
            updatedCustomFilters.push(filter);
        }
        localStorage.setItem(CUSTOM_FILTERS_JSON_KEY, JSON.stringify(updatedCustomFilters));
    };

    /**
     * Remove custom filter data from storage
     *
     * @param filter
     */
    const removeCustomFilterFromStorage = (filter) => {
        const customFilters = loadCustomFilters();
        const updatedCustomFilters = customFilters.filter((f) => {
            if (f.filterId === filter.filterId) {
                return filter.installed;
            }
            return true;
        });
        localStorage.setItem(CUSTOM_FILTERS_JSON_KEY, JSON.stringify(updatedCustomFilters));
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
            return !browserUtils.isGreaterOrEqualsVersion(oldFilter.version, newVersion);
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
        return MD5(rulesText).toString();
    };

    /**
     * Updates filter checksum and version in the storage and internal structures
     * @param filter
     * @param {object} info
     */
    const updateCustomFilterInfo = (filter, info) => {
        const {
            checksum,
            version,
            timeUpdated,
            lastCheckTime,
            expires,
        } = info;
        // set last checksum and version
        filter.checksum = checksum || filter.checksum;
        filter.version = version || filter.version;
        filter.timeUpdated = timeUpdated || filter.timeUpdated;
        filter.lastCheckTime = lastCheckTime || filter.lastCheckTime;
        filter.expires = expires || filter.expires;

        filters = filters.map((f) => {
            if (f.filterId === filter.filterId) {
                f.version = version || f.version;
                f.checksum = checksum || f.checksum;
                f.timeUpdated = timeUpdated || f.timeUpdated;
                f.lastCheckTime = lastCheckTime || filter.lastCheckTime;
                f.expires = expires || filter.expires;
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
     */
    const updateCustomFilter = async function (url, options) {
        const { title, trusted } = options;

        let rules;
        try {
            rules = await backend.loadFilterRulesBySubscriptionUrl(url);
        } catch (e) {
            log.error(`Error download filter by url ${url}, cause: ${e || ''}`);
            return null;
        }

        const filterId = addFilterId();
        const parsedData = parseFilterDataFromHeader(rules);
        let { timeUpdated } = parsedData;
        const {
            description,
            homepage,
            version,
            expires,
        } = parsedData;

        const name = title;

        timeUpdated = timeUpdated || new Date().toISOString();
        const groupId = ANTIBANNER_GROUPS_ID.CUSTOM_FILTERS_GROUP_ID;
        const subscriptionUrl = url;
        const languages = [];
        const displayNumber = 0;
        const tags = [0];

        let checksum;
        if (!version) {
            checksum = getChecksum(rules);
        }

        // Check if filter from this url was added before
        let filter = filters.find(f => f.customUrl === url);

        let updateFilter = true;
        if (filter) {
            if (!didFilterUpdate(version, checksum, filter)) {
                updateCustomFilterInfo(filter, { lastCheckTime: Date.now() });
                return null;
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
            updateFilter = false;
        }

        if (updateFilter) {
            updateCustomFilterInfo(filter, {
                version,
                checksum,
                timeUpdated,
                expires,
            });
        }

        updateCustomFilterInfo(filter, { lastCheckTime: Date.now() });

        listeners.notifyListeners(listeners.SUCCESS_DOWNLOAD_FILTER, filter);
        listeners.notifyListeners(listeners.UPDATE_FILTER_RULES, filter, rules);

        return filter.filterId;
    };

    /**
     * Retrieves custom filter information
     * @param url
     * @param options
     * @returns {Promise<{filter: SubscriptionFilter}|{}|{error: *}>}
     */
    const getCustomFilterInfo = async (url, options) => {
        const { title } = options;

        let rules;
        try {
            rules = await backend.loadFilterRulesBySubscriptionUrl(url);
        } catch (e) {
            log.error(`Error download filter by url ${url}, cause: ${e || ''}`);
            return {};
        }

        const parsedData = parseFilterDataFromHeader(rules);
        let { name, timeUpdated } = parsedData;
        const {
            description,
            homepage,
            version,
            expires,
        } = parsedData;

        name = name || title;
        timeUpdated = timeUpdated || new Date().toISOString();

        const groupId = ANTIBANNER_GROUPS_ID.CUSTOM_FILTERS_GROUP_ID;
        const subscriptionUrl = url;
        const languages = [];
        const displayNumber = 0;
        const tags = [0];
        const rulesCount = rules.filter(rule => rule.trim().indexOf('!') !== 0).length;

        // Check if filter from this url was added before
        let filter = filters.find(f => f.customUrl === url);

        if (filter) {
            return ({ error: translator.getMessage('options_antibanner_custom_filter_already_exists') });
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

        return ({ filter });
    };

    /**
     * Refreshes subscription's objects with metadata
     * @param metadata
     */
    const saveMetadata = (metadata) => {
        tags = [];
        groups = [];
        groupsMap = {};
        filters = [];
        filtersMap = {};

        for (let i = 0; i < metadata.tags.length; i += 1) {
            tags.push(metadataFactory.createFilterTagFromJSON(metadata.tags[i]));
        }

        for (let j = 0; j < metadata.filters.length; j += 1) {
            const filter = metadataFactory.createSubscriptionFilterFromJSON(metadata.filters[j]);
            filters.push(filter);
            filtersMap[filter.filterId] = filter;
        }

        for (let k = 0; k < metadata.groups.length; k += 1) {
            const group = metadataFactory.createSubscriptionGroupFromJSON(metadata.groups[k]);
            groups.push(group);
            groupsMap[group.groupId] = group;
        }

        const customFiltersGroup = new SubscriptionGroup(
            ANTIBANNER_GROUPS_ID.CUSTOM_FILTERS_GROUP_ID,
            translator.getMessage('options_antibanner_custom_group'),
            CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER,
        );
        groups.push(customFiltersGroup);
        groupsMap[customFiltersGroup.groupId] = customFiltersGroup;

        // Load custom filters
        const customFilters = loadCustomFilters();
        customFilters.forEach((f) => {
            const customFilter = metadataFactory.createSubscriptionFilterFromJSON(f);
            filters.push(customFilter);
            filtersMap[customFilter.filterId] = customFilter;
        });

        filters.sort((f1, f2) => f1.displayNumber - f2.displayNumber);

        groups.sort((f1, f2) => f1.displayNumber - f2.displayNumber);
    };

    /**
     * Load groups and filters metadata
     * @returns {Promise} returns promise
     */
    const loadMetadata = async () => {
        let metadata;

        // Load from storage first
        const data = localStorage.getItem(METADATA_STORAGE_KEY);
        if (data) {
            metadata = JSON.parse(data);
        } else {
            metadata = await backend.loadLocalFiltersMetadata();
        }

        saveMetadata(metadata);

        log.info('Filters metadata loaded');
    };

    /**
     * Reloads groups and filters metadata from backend
     * @returns {Promise} returns promise
     */
    const reloadMetadataFromBackend = async () => {
        const metadata = await backend.downloadMetadataFromBackend();
        localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(metadata));

        saveMetadata(metadata);

        loadFiltersVersionAndStateInfo();
        loadGroupsStateInfo();

        log.info('Filters metadata reloaded from backend');
    };

    /**
     * Load metadata of the specified filters
     *
     * @param filterIds         Filters identifiers
     */
    const loadFiltersMetadata = async (filterIds) => {
        if (!filterIds || filterIds.length === 0) {
            return [];
        }

        const metadata = await backend.downloadMetadataFromBackend();

        const filterMetadataList = [];
        for (let i = 0; i < filterIds.length; i += 1) {
            const filter = utils.collections.find(metadata.filters, 'filterId', filterIds[i]);
            if (filter) {
                filterMetadataList.push(metadataFactory.createSubscriptionFilterFromJSON(filter));
            }
        }

        return filterMetadataList;
    };

    /**
     * Localize tag
     * @param tag
     * @param i18nMetadata
     * @private
     */
    function applyFilterTagLocalization(tag, i18nMetadata) {
        const { tagId } = tag;
        const localizations = i18nMetadata[tagId];
        if (localizations) {
            const locale = utils.i18n.normalize(localizations, backgroundPage.app.getLocale());
            const localization = localizations[locale];
            if (localization) {
                tag.name = localization.name;
                tag.description = localization.description;
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
        const { filterId } = filter;
        const localizations = i18nMetadata[filterId];
        if (localizations) {
            const locale = utils.i18n.normalize(localizations, backgroundPage.app.getLocale());
            const localization = localizations[locale];
            if (localization) {
                filter.name = localization.name;
                filter.description = localization.description;
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
        const { groupId } = group;
        const localizations = i18nMetadata[groupId];
        if (localizations) {
            const locale = utils.i18n.normalize(localizations, backgroundPage.app.getLocale());
            const localization = localizations[locale];
            if (localization) {
                group.groupName = localization.name;
            }
        }
    }

    /**
     * Loads groups and filters localizations
     * @return {Promise} returns promise
     */
    async function loadMetadataI18n() {
        const i18nMetadata = await backend.loadLocalFiltersI18Metadata();
        const tagsI18n = i18nMetadata.tags;
        const filtersI18n = i18nMetadata.filters;
        const groupsI18n = i18nMetadata.groups;

        for (let i = 0; i < tags.length; i += 1) {
            applyFilterTagLocalization(tags[i], tagsI18n);
        }

        for (let j = 0; j < filters.length; j += 1) {
            applyFilterLocalization(filters[j], filtersI18n);
        }

        for (let k = 0; k < groups.length; k += 1) {
            applyGroupLocalization(groups[k], groupsI18n);
        }

        log.info('Filters i18n metadata loaded');
    }

    /**
     * Loads script rules from local file
     * @returns {Promise}
     * @private
     */
    async function loadLocalScriptRules() {
        const json = await backend.loadLocalScriptRules();
        localScriptRulesService.setLocalScriptRules(json);
        log.info('Filters local script rules loaded');
    }

    /**
     * Loads redirect sources from local file
     * @returns {Promise}
     * @private
     */
    async function loadRedirectSources() {
        const txt = await backend.loadRedirectSources();
        redirectService.init(txt);
        log.info('Filters redirect sources loaded');
    }

    /**
     * Initialize subscription service, loading local filters metadata
     * @return {Promise}
     */
    const init = async function () {
        try {
            await loadMetadata();
            await loadMetadataI18n();
            await loadLocalScriptRules();
            await loadRedirectSources();
        } catch (e) {
            log.error(`Error loading metadata, cause: ${e.message}`);
        }
    };

    /**
     * @returns Array of Filters metadata
     */
    const getFilters = function () {
        return filters;
    };

    const getCustomFilters = function () {
        return filters.filter(f => f.customUrl);
    };

    /**
     * Gets filter metadata by filter identifier
     */
    const getFilter = function (filterId) {
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
    const getTags = function () {
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
    const getFilterIdsForLanguage = function (locale) {
        if (!locale) {
            return [];
        }
        const filterIds = [];
        for (let i = 0; i < filters.length; i += 1) {
            const filter = filters[i];
            const { languages } = filter;
            if (languages && languages.length > 0) {
                const language = utils.i18n.normalize(languages, locale);
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

        let localeFilterIds = getFilterIdsForLanguage(backgroundPage.app.getLocale());
        filterIds = filterIds.concat(localeFilterIds);

        // Get language-specific filters by navigator languages
        // Get the 2 most commonly used languages
        const languages = browserUtils.getNavigatorLanguages(2);
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

    /**
     * Updates filters version and state info.
     * Loads this data from the storage and then updates adguard.subscription.filters property
     *
     * @private
     */
    const loadFiltersVersionAndStateInfo = () => {
        // Load filters metadata from the storage
        const filtersVersionInfo = filtersState.getFiltersVersion();
        // Load filters state from the storage
        const filtersStateInfo = filtersState.getFiltersState();

        for (let i = 0; i < filters.length; i += 1) {
            const filter = filters[i];
            const { filterId } = filter;
            const versionInfo = filtersVersionInfo[filterId];
            const stateInfo = filtersStateInfo[filterId];
            if (versionInfo) {
                filter.version = versionInfo.version;
                filter.lastCheckTime = versionInfo.lastCheckTime;
                filter.lastUpdateTime = versionInfo.lastUpdateTime;
                if (versionInfo.expires) {
                    filter.expires = versionInfo.expires;
                }
            }
            if (stateInfo) {
                filter.enabled = stateInfo.enabled;
                filter.installed = stateInfo.installed;
                filter.loaded = stateInfo.loaded;
            }
        }
    };

    /**
     * Updates groups state info
     * Loads state info from the storage and then updates adguard.subscription.groups properly
     * @private
     */
    const loadGroupsStateInfo = () => {
        // Load filters state from the storage
        const groupsStateInfo = filtersState.getGroupsState();

        for (let i = 0; i < groups.length; i += 1) {
            const group = groups[i];
            const { groupId } = group;
            const stateInfo = groupsStateInfo[groupId];
            if (stateInfo) {
                group.enabled = stateInfo.enabled;
            }
        }
    };

    // Add event listener to persist filter metadata to local storage
    listeners.addListener((event, payload) => {
        switch (event) {
            case listeners.FILTER_ADD_REMOVE:
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
        init,
        reloadMetadataFromBackend,
        loadFiltersMetadata,
        getFilterIdsForLanguage,
        getTags,
        getGroups,
        getGroup,
        groupHasEnabledStatus,
        getFilters,
        getCustomFilters,
        getFilter,
        isTrustedFilter,
        updateCustomFilter,
        getCustomFilterInfo,
        getLangSuitableFilters,
        loadFiltersVersionAndStateInfo,
        loadGroupsStateInfo,
        CUSTOM_FILTERS_START_ID,
    };
})();
