import MD5 from 'crypto-js/md5';
import { metadataCache } from './metadata-cache';
import { localStorage } from '../../storage';
import { browserUtils } from '../../utils/browser-utils';
import { backend } from './service-client';
import { log } from '../../../common/log';
import {
    ANTIBANNER_GROUPS_ID,
    CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER,
    CUSTOM_FILTERS_START_ID,
} from '../../../common/constants';
import { SubscriptionFilter } from './metadata';
import { listeners } from '../../notifier';

/**
 * Custom filters module
 */
export const customFilters = (() => {
    /**
     * Amount of lines to parse metadata from filter's header
     * @type {number}
     */
    const AMOUNT_OF_LINES_TO_PARSE = 50;

    /**
     * Storage key for custom filter's data
     * @type {string}
     */
    const CUSTOM_FILTERS_STORAGE_KEY = 'custom_filters';

    /**
     * Parses expires string in meta
     *
     * @param str
     * @return {number}
     */
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
            const maxLines = Math.min(AMOUNT_OF_LINES_TO_PARSE, rules.length);
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

    /**
     * Gets new filter id for custom filter
     * @return {number}
     */
    const addCustomFilterId = () => {
        let max = 0;
        const filters = metadataCache.getFilters();
        filters.forEach((f) => {
            if (f.filterId > max) {
                max = f.filterId;
            }
        });

        return max >= CUSTOM_FILTERS_START_ID ? max + 1 : CUSTOM_FILTERS_START_ID;
    };

    /**
     * Loads custom filters from storage
     *
     * @returns {Array}
     */
    const loadCustomFilters = () => {
        const customFilters = localStorage.getItem(CUSTOM_FILTERS_STORAGE_KEY);
        return customFilters ? JSON.parse(customFilters) : [];
    };

    /**
     * Saves custom filter to storage or updates it if filter with same id was found
     *
     * @param filter
     */
    const saveCustomFilterInStorage = (filter) => {
        const customFilters = loadCustomFilters();

        const updatedCustomFilters = customFilters.filter(f => f.filterId !== filter.filterId);
        updatedCustomFilters.push(filter);

        localStorage.setItem(CUSTOM_FILTERS_STORAGE_KEY, JSON.stringify(updatedCustomFilters));
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

        localStorage.setItem(CUSTOM_FILTERS_STORAGE_KEY, JSON.stringify(updatedCustomFilters));
    };

    /**
     * Compares filter version or filter checksum
     * @param newVersion
     * @param newChecksum
     * @param oldFilter
     * @returns Boolean
     */
    const isFilterUpdated = (newVersion, newChecksum, oldFilter) => {
        if (browserUtils.isSemver(oldFilter.version)
            && browserUtils.isSemver(newVersion)
        ) {
            return !browserUtils.isGreaterOrEqualsVersion(oldFilter.version, newVersion);
        }

        if (!oldFilter.checksum) {
            return true;
        }

        return newChecksum !== oldFilter.checksum;
    };

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

        filter.checksum = checksum || filter.checksum;
        filter.version = version || filter.version;
        filter.timeUpdated = timeUpdated || filter.timeUpdated;
        filter.lastCheckTime = lastCheckTime || filter.lastCheckTime;
        filter.expires = expires || filter.expires;

        if ('enabled' in info) {
            filter.enabled = info.enabled;
        }

        metadataCache.updateFilters(filter);

        saveCustomFilterInStorage(filter);
    };

    /**
     * Safe download rules from subscription url
     *
     * @param url
     * @return {Promise<null|*>}
     */
    const downloadRules = async (url) => {
        let rules;
        try {
            rules = await backend.downloadFilterRulesBySubscriptionUrl(url);
            return rules;
        } catch (e) {
            log.error(`Error download filter by url ${url}, cause: ${e || ''}`);
            return null;
        }
    };

    /**
     * Limits filter download with timeout
     * @param url
     */
    const downloadRulesWithTimeout = async (url) => {
        const DOWNLOAD_LIMIT_MS = 3 * 1000;
        return Promise.race([
            downloadRules(url),
            new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Fetch timeout is over')), DOWNLOAD_LIMIT_MS);
            }),
        ]);
    };

    /**
     * Adds or updates custom filter
     *
     * @param url subscriptionUrl
     * @param options
     */
    const updateCustomFilter = async (url, options) => {
        const { title, trusted, enabled } = options;

        const rules = await downloadRulesWithTimeout(url);
        if (!rules) {
            return null;
        }

        const parsedData = parseFilterDataFromHeader(rules);
        const {
            description,
            homepage,
            version,
            expires,
            timeUpdated = new Date().toISOString(),
        } = parsedData;

        const checksum = !version || !browserUtils.isSemver(version) ? getChecksum(rules) : null;
        // Check if filter from this url was added before
        let filter = metadataCache.getFilters().find(f => f.customUrl === url);
        if (filter) {
            if (!isFilterUpdated(version, checksum, filter)) {
                updateCustomFilterInfo(filter, {
                    lastCheckTime: Date.now(),
                });
                return null;
            }

            updateCustomFilterInfo(filter, {
                version,
                checksum,
                timeUpdated,
                expires,
                lastCheckTime: Date.now(),
            });
        } else {
            filter = new SubscriptionFilter({
                filterId: addCustomFilterId(),
                groupId: ANTIBANNER_GROUPS_ID.CUSTOM_FILTERS_GROUP_ID,
                name: title,
                description,
                homepage,
                version,
                timeUpdated,
                expires,
                subscriptionUrl: url,
                tags: [0],
                customUrl: url,
                checksum,
                trusted,
            });

            filter.lastCheckTime = Date.now();
            filter.loaded = true;
            filter.enabled = enabled === true;

            metadataCache.updateFilters(filter);
            saveCustomFilterInStorage(filter);
        }

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
        // Check if filter from this url was added before
        if (metadataCache.getFilters().find(f => f.customUrl === url)) {
            return { errorAlreadyExists: true };
        }

        const rules = await downloadRules(url);
        if (!rules) {
            return {};
        }

        const parsedData = parseFilterDataFromHeader(rules);
        const {
            name = options.title,
            description,
            homepage,
            version,
            expires,
            timeUpdated = new Date().toISOString(),
        } = parsedData;

        const filter = new SubscriptionFilter({
            groupId: ANTIBANNER_GROUPS_ID.CUSTOM_FILTERS_GROUP_ID,
            name,
            description,
            homepage,
            version,
            timeUpdated,
            expires,
            subscriptionUrl: url,
            tags: [0],
            customUrl: url,
        });

        filter.loaded = true;
        filter.rulesCount = rules.filter(rule => rule.trim().indexOf('!') !== 0).length;

        return { filter };
    };

    /**
     * Removes filter
     *
     * @param filter
     */
    const removeCustomFilter = (filter) => {
        if (filter && filter.filterId) {
            metadataCache.removeFilter(filter.filterId);
        }
    };

    /**
     * Returns custom filters
     *
     * @returns Array
     */
    const getCustomFilters = function () {
        return metadataCache.getFilters().filter(f => f.customUrl);
    };

    // Add event listener to persist filter metadata to local storage
    listeners.addListener((event, payload) => {
        if (event === listeners.FILTER_ADD_REMOVE) {
            if (payload && payload.removed) {
                removeCustomFilter(payload);
                removeCustomFilterFromStorage(payload);
            }
        }
    });

    return {
        getCustomFilters,
        loadCustomFilters,
        updateCustomFilter,
        getCustomFilterInfo,
        CUSTOM_FILTERS_START_ID,
        CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER,
    };
})();
