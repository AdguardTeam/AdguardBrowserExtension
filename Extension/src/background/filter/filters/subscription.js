/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

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
import { SubscriptionGroup } from './metadata';
import { metadataFactory } from './metadata-factory';
import { metadataCache } from './metadata-cache';
import { customFilters } from './custom-filters';

/**
 * Service that loads and parses filters metadata from backend server.
 * For now we just store filters metadata in an XML file within the extension.
 * In future we'll add an opportunity to update metadata along with filter rules update.
 */
export const subscriptions = (() => {
    /**
     * Storage keys for metadata objects
     * @type {string}
     */
    const METADATA_STORAGE_KEY = 'filters-metadata';
    const I18N_METADATA_STORAGE_KEY = 'filters-i18n-metadata';

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

        const filters = metadataCache.getFilters();
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

            metadataCache.updateFilters(filter);
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
        const groups = metadataCache.getGroups();

        for (let i = 0; i < groups.length; i += 1) {
            const group = groups[i];
            const { groupId } = group;
            const stateInfo = groupsStateInfo[groupId];
            if (stateInfo) {
                group.enabled = stateInfo.enabled;

                metadataCache.getGroup(group);
            }
        }
    };

    /**
     * Refreshes subscription's objects with metadata
     * @param metadata
     */
    const saveMetadata = (metadata) => {
        const tags = [];
        const groups = [];
        const groupsMap = {};
        const filters = [];
        const filtersMap = {};

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
            customFilters.CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER,
        );
        groups.push(customFiltersGroup);
        groupsMap[customFiltersGroup.groupId] = customFiltersGroup;

        // Load custom filters
        const customFiltersList = customFilters.loadCustomFilters();
        customFiltersList.forEach((f) => {
            const customFilter = metadataFactory.createSubscriptionFilterFromJSON(f);
            filters.push(customFilter);
            filtersMap[customFilter.filterId] = customFilter;
        });

        filters.sort((f1, f2) => f1.displayNumber - f2.displayNumber);

        groups.sort((f1, f2) => f1.displayNumber - f2.displayNumber);

        metadataCache.setData({
            tags, groups, groupsMap, filters, filtersMap,
        });
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
            metadata = await backend.getLocalFiltersMetadata();
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
    const getFiltersMetadata = async (filterIds) => {
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
    const applyFilterTagLocalization = (tag, i18nMetadata) => {
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
    };

    /**
     * Localize filter
     * @param filter
     * @param i18nMetadata
     * @private
     */
    const applyFilterLocalization = (filter, i18nMetadata) => {
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
    };

    /**
     * Localize group
     * @param group
     * @param i18nMetadata
     * @private
     */
    const applyGroupLocalization = (group, i18nMetadata) => {
        const { groupId } = group;
        const localizations = i18nMetadata[groupId];
        if (localizations) {
            const locale = utils.i18n.normalize(localizations, backgroundPage.app.getLocale());
            const localization = localizations[locale];
            if (localization) {
                group.groupName = localization.name;
            }
        }
    };

    /**
     * Refreshes subscription's objects with i18n metadata
     * @param i18nMetadata
     */
    const saveI18nMetadata = (i18nMetadata) => {
        const tagsI18n = i18nMetadata.tags;
        const filtersI18n = i18nMetadata.filters;
        const groupsI18n = i18nMetadata.groups;

        const { tags, groups, filters } = metadataCache.getData();

        for (let i = 0; i < tags.length; i += 1) {
            applyFilterTagLocalization(tags[i], tagsI18n);
        }

        for (let j = 0; j < filters.length; j += 1) {
            applyFilterLocalization(filters[j], filtersI18n);
        }

        for (let k = 0; k < groups.length; k += 1) {
            applyGroupLocalization(groups[k], groupsI18n);
        }

        metadataCache.setData({ tags, groups, filters });
    };

    /**
     * Loads groups and filters localizations
     * @return {Promise} returns promise
     */
    const loadMetadataI18n = async () => {
        log.info('Loading filters i18n metadata..');

        let metadata;

        // Load from storage first
        const data = localStorage.getItem(I18N_METADATA_STORAGE_KEY);
        if (data) {
            metadata = JSON.parse(data);
        } else {
            metadata = await backend.getLocalFiltersI18Metadata();
        }

        saveI18nMetadata(metadata);

        log.info('Filters i18n metadata loaded');
    };

    /**
     * Reloads i18n metadata localizations from backend
     * @returns {Promise} returns promise
     */
    const reloadI18nMetadataFromBackend = async () => {
        const metadata = await backend.downloadI18nMetadataFromBackend();
        localStorage.setItem(I18N_METADATA_STORAGE_KEY, JSON.stringify(metadata));

        saveI18nMetadata(metadata);

        log.info('Filters i18n metadata reloaded from backend');
    };

    /**
     * Loads script rules from local file
     * @returns {Promise}
     * @private
     */
    const loadLocalScriptRules = async () => {
        if (browserUtils.isFirefoxBrowser()) {
            const json = await backend.getLocalScriptRules();
            localScriptRulesService.setLocalScriptRules(json);
            log.info('Filters local script rules loaded');
        }
    };

    /**
     * Loads redirect sources from local file
     * @returns {Promise}
     * @private
     */
    const loadRedirectSources = async () => {
        const txt = await backend.getRedirectSources();
        redirectService.init(txt);
        log.info('Filters redirect sources loaded');
    };

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
        return metadataCache.getFilters();
    };

    /**
     * Gets filter metadata by filter identifier
     */
    const getFilter = function (filterId) {
        return metadataCache.getFilter(filterId);
    };

    const isTrustedFilter = (filterId) => {
        if (filterId < customFilters.CUSTOM_FILTERS_START_ID) {
            return true;
        }
        const filter = metadataCache.getFilter(filterId);
        return !!(filter && filter.trusted && filter.trusted === true);
    };

    /**
     * @returns Array of Tags metadata
     */
    const getTags = function () {
        return metadataCache.getTags();
    };

    /**
     * @returns Array of Groups metadata
     */
    const getGroups = () => metadataCache.getGroups();

    /**
     * @returns Group metadata
     */
    const getGroup = groupId => metadataCache.getGroup(groupId);

    /**
     * Checks if group has enabled status true or false
     * @param groupId
     * @returns {boolean}
     */
    const groupHasEnabledStatus = (groupId) => {
        const group = metadataCache.getGroup(groupId);
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

        const filters = metadataCache.getFilters();
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

    /**
     * @return list of filters
     */
    const getLangSuitableFilters = () => {
        // Get language-specific filters by user locale
        let filterIds = [];

        let localeFilterIds = getFilterIdsForLanguage(backgroundPage.app.getLocale());
        filterIds = filterIds.concat(localeFilterIds);

        // Get language-specific filters by navigator languages
        // Get all used languages
        const languages = browserUtils.getNavigatorLanguages();
        for (let i = 0; i < languages.length; i += 1) {
            localeFilterIds = getFilterIdsForLanguage(languages[i]);
            filterIds = filterIds.concat(localeFilterIds);
        }
        return [...new Set(filterIds)];
    };

    return {
        init,
        reloadMetadataFromBackend,
        reloadI18nMetadataFromBackend,
        loadFiltersVersionAndStateInfo,
        loadGroupsStateInfo,

        getFiltersMetadata,
        getFilterIdsForLanguage,
        getLangSuitableFilters,

        getTags,
        getGroups,
        getGroup,
        getFilters,
        getFilter,

        isTrustedFilter,
        groupHasEnabledStatus,
    };
})();
