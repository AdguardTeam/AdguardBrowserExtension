import MD5 from 'crypto-js/md5';
import { metadataCache } from './metadata-cache';
import { localStorage } from '../../storage';
import { browserUtils } from '../../utils/browser-utils';
import { backend } from './service-client';
import { log } from '../../../common/log';
import { ANTIBANNER_GROUPS_ID } from '../../../common/constants';
import { SubscriptionFilter } from './metadata';
import { listeners } from '../../notifier';
import { translator } from '../../../common/translators/translator';

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
     * Custom filters group display number
     *
     * @type {number}
     */
    const CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER = 99;

    const CUSTOM_FILTERS_START_ID = 1000;

    const CUSTOM_FILTERS_JSON_KEY = 'custom_filters';

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
    const addFilterId = () => {
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
    const didFilterUpdate = (newVersion, newChecksum, oldFilter) => {
        if (newVersion) {
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
        // set last checksum and version
        filter.checksum = checksum || filter.checksum;
        filter.version = version || filter.version;
        filter.timeUpdated = timeUpdated || filter.timeUpdated;
        filter.lastCheckTime = lastCheckTime || filter.lastCheckTime;
        filter.expires = expires || filter.expires;

        metadataCache.updateFilters(filter);

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
            rules = await backend.downloadFilterRulesBySubscriptionUrl(url);
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
        let filter = metadataCache.getFilters().find(f => f.customUrl === url);

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
            metadataCache.updateFilters(filter);

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
            rules = await backend.downloadFilterRulesBySubscriptionUrl(url);
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
        let filter = metadataCache.getFilters().find(f => f.customUrl === url);

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
     * @returns custom filters
     */
    const getCustomFilters = function () {
        return metadataCache.getFilters().filter(f => f.customUrl);
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
        getCustomFilters,
        loadCustomFilters,
        updateCustomFilter,
        getCustomFilterInfo,
        CUSTOM_FILTERS_START_ID,
        CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER,
    };
})();
