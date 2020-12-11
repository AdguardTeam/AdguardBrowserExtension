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

import * as TSUrlFilter from '@adguard/tsurlfilter';
import { RequestFilter } from './request-filter';
import { listeners } from '../notifier';
import { applicationUpdateService } from '../update-service';
import { subscriptions } from './filters/subscription';
import { utils } from '../utils/common';
import { settings } from '../settings/user-settings';
import { filtersState } from './filters/filters-state';
import { log } from '../../common/log';
import { rulesStorage } from '../storage';
import { filtersUpdate } from './filters/filters-update';
import { engine } from './engine';

/**
 * Creating service that manages our filter rules.
 */
export const antiBannerService = (() => {
    // Request filter contains all filter rules
    // This class does the actual filtering (checking URLs, constructing CSS/JS to inject, etc)
    let requestFilter = new RequestFilter();

    // Service is not initialized yet
    let requestFilterInitTime = 0;

    // Application is running flag
    let applicationRunning = false;

    // Application initialized flag (Sets on first call of 'start' method)
    let applicationInitialized = false;

    /**
     * Delay on application updated event
     */
    const APP_UPDATED_NOTIFICATION_DELAY = 60 * 1000;

    const FILTERS_CHANGE_DEBOUNCE_PERIOD = 1000;
    const RELOAD_FILTERS_DEBOUNCE_PERIOD = 1000;

    /**
     * List of events which cause RequestFilter re-creation
     * @type {Array}
     */
    const UPDATE_REQUEST_FILTER_EVENTS = [
        listeners.UPDATE_FILTER_RULES,
        listeners.FILTER_ENABLE_DISABLE,
        listeners.FILTER_GROUP_ENABLE_DISABLE,
        listeners.ADD_RULES,
        listeners.REMOVE_RULE,
    ];

    const isUpdateRequestFilterEvent = el => UPDATE_REQUEST_FILTER_EVENTS.indexOf(el.event) >= 0;

    /**
     * List of events which cause saving filter rules to the rules storage
     * @type {Array}
     */
    const SAVE_FILTER_RULES_TO_STORAGE_EVENTS = [
        listeners.UPDATE_FILTER_RULES,
        listeners.ADD_RULES,
        listeners.REMOVE_RULE,
    ];

    const isSaveRulesToStorageEvent = function (el) {
        return SAVE_FILTER_RULES_TO_STORAGE_EVENTS.indexOf(el.event) >= 0;
    };

    let reloadedRules = false;

    /**
     * AntiBannerService initialize method. Process install, update or simple run.
     * @param options Constructor options
     */
    async function initialize(options) {
        /**
         * Waits and notifies listener with application updated event
         * @param runInfo
         */
        const notifyApplicationUpdated = function (runInfo) {
            setTimeout(() => {
                listeners.notifyListeners(listeners.APPLICATION_UPDATED, runInfo);
            }, APP_UPDATED_NOTIFICATION_DELAY);
        };

        /**
         * This method is called when filter subscriptions have been loaded from remote server.
         * It is used to recreate RequestFilter object.
         */
        const initRequestFilter = async function () {
            loadFiltersVersionAndStateInfo();
            loadGroupsStateInfo();
            await createRequestFilter();
            addFiltersChangeEventListener();
        };

        /**
         * Callback for subscriptions loaded event
         */
        const onSubscriptionLoaded = async function (runInfo) {
            // Subscribe to events which lead to update filters (e.g. switch to optimized and back to default)
            subscribeToFiltersChangeEvents();

            if (runInfo.isFirstRun) {
                // Add event listener for filters change
                addFiltersChangeEventListener();
                // Run callback
                // Request filter will be initialized during install
                if (typeof options.onInstall === 'function') {
                    await options.onInstall();
                }
            } else if (runInfo.isUpdate) {
                // Updating storage schema on extension update (if needed)
                await applicationUpdateService.onUpdate(runInfo);
                await initRequestFilter();
                // Show updated version popup
                notifyApplicationUpdated(runInfo);
            } else {
                // Init RequestFilter object
                await initRequestFilter();
            }
            // Schedule filters update job
            filtersUpdate.scheduleFiltersUpdate(runInfo.isFirstRun);
        };

        /**
         * Init extension common info.
         */
        const runInfo = await applicationUpdateService.getRunInfo();
        await subscriptions.init();
        await onSubscriptionLoaded(runInfo);
    }

    /**
     * Initialize application (process install or update) . Create and start request filter
     * @param options
     */
    const start = async function (options) {
        if (applicationRunning === true) {
            return;
        }

        applicationRunning = true;

        if (!applicationInitialized) {
            await initialize(options);
            applicationInitialized = true;
            return;
        }

        await createRequestFilter();
    };

    /**
     * Request Filter info
     */
    const getRequestFilterInfo = function () {
        let rulesCount = 0;
        if (requestFilter) {
            rulesCount = requestFilter.getRulesCount();
        }
        return {
            rulesCount,
        };
    };

    /**
     * Clear request filter
     */
    const stop = function () {
        applicationRunning = false;
        requestFilter = new RequestFilter();
        listeners.notifyListeners(listeners.REQUEST_FILTER_UPDATED, getRequestFilterInfo());
    };

    /**
     * Checks application has been initialized
     * @returns {boolean}
     */
    const isInitialized = function () {
        return applicationInitialized;
    };

    /**
     * Getter for request filter
     */
    const getRequestFilter = function () {
        return requestFilter;
    };

    /**
     * Gets filter by ID.
     * Throws exception if filter not found.
     *
     * @param filterId Filter identifier
     * @returns {*} Filter got from subscriptions.getFilter
     * @private
     */
    function getFilterById(filterId) {
        const filter = subscriptions.getFilter(filterId);
        if (!filter) {
            throw new Error(`Filter with id: ${filterId} not found`);
        }
        return filter;
    }

    /**
     * Loads filter from storage (if in extension package) or from backend
     *
     * @param filterId Filter identifier
     */
    const addAntiBannerFilter = async (filterId) => {
        const filter = getFilterById(filterId);
        if (filter.installed) {
            return true;
        }

        const onFilterLoaded = (success) => {
            if (success) {
                filter.installed = true;
                listeners.notifyListeners(listeners.FILTER_ADD_REMOVE, filter);
            }
            return success;
        };

        if (filter.loaded) {
            return onFilterLoaded(true);
        }

        /**
         * TODO: when we want to load filter from backend,
         *  we should retrieve metadata from backend too, but not from local file.
         */
        const result = await filtersUpdate.loadFilterRules(filter, false);
        return onFilterLoaded(result);
    };

    /**
     * Resets all filters versions
     */
    function resetFiltersVersion() {
        const RESET_VERSION = '0.0.0.0';

        const filters = subscriptions.getFilters();
        for (let i = 0; i < filters.length; i += 1) {
            const filter = filters[i];
            filter.version = RESET_VERSION;
        }
    }

    /**
     * Reloads filters from backend
     *
     * @private
     */
    async function reloadAntiBannerFilters() {
        resetFiltersVersion();
        await filtersUpdate.checkAntiBannerFiltersUpdate(true);
    }

    /**
     * Updates groups state info
     * Loads state info from the storage and then updates adguard.subscription.groups properly
     * @private
     */
    function loadGroupsStateInfo() {
        // Load filters state from the storage
        const groupsStateInfo = filtersState.getGroupsState();

        const groups = subscriptions.getGroups();

        for (let i = 0; i < groups.length; i += 1) {
            const group = groups[i];
            const { groupId } = group;
            const stateInfo = groupsStateInfo[groupId];
            if (stateInfo) {
                group.enabled = stateInfo.enabled;
            }
        }
    }

    /**
     * Updates filters version and state info.
     * Loads this data from the storage and then updates adguard.subscription.filters property
     *
     * @private
     */
    function loadFiltersVersionAndStateInfo() {
        // Load filters metadata from the storage
        const filtersVersionInfo = filtersState.getFiltersVersion();
        // Load filters state from the storage
        const filtersStateInfo = filtersState.getFiltersState();

        const filters = subscriptions.getFilters();

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
    }

    /**
     * Called when filters were loaded from the storage
     *
     * @param rulesFilterMap Map for populating rules (filterId -> rules collection)
     */
    async function onFiltersLoadedFromStorage(rulesFilterMap) {
        const start = new Date().getTime();

        log.info('Starting request filter initialization..');

        const newRequestFilter = new RequestFilter();

        if (requestFilterInitTime === 0) {
            // Setting the time of request filter very first initialization
            requestFilterInitTime = new Date().getTime();
            listeners.notifyListeners(listeners.APPLICATION_INITIALIZED);
        }

        /**
         * Checks rulesFilterMap is empty (no one of filters are enabled)
         * @param rulesFilterMap
         * @returns {boolean}
         */
        function isEmptyRulesFilterMap(rulesFilterMap) {
            const enabledFilterIds = Object.keys(rulesFilterMap);
            if (enabledFilterIds.length === 0) {
                return true;
            }

            // User filter is enabled by default, but it may not contain any rules
            const userFilterId = utils.filters.USER_FILTER_ID;
            if (enabledFilterIds.length === 1 && enabledFilterIds[0] === userFilterId) {
                const userRules = rulesFilterMap[userFilterId];
                if (!userRules || userRules.length === 0) {
                    return true;
                }
            }

            return false;
        }

        /**
         * STEP 3: Called when request filter has been filled with rules.
         * This is the last step of request filter initialization.
         */
        const requestFilterInitialized = function () {
            // Request filter is ready
            requestFilter = newRequestFilter;

            listeners.notifyListeners(listeners.REQUEST_FILTER_UPDATED, getRequestFilterInfo());
            log.info(
                'Finished request filter initialization in {0} ms. Rules count: {1}',
                (new Date().getTime() - start),
                newRequestFilter.getRulesCount(),
            );

            /**
             * If no one of filters is enabled, don't reload rules
             */
            if (isEmptyRulesFilterMap(rulesFilterMap)) {
                return;
            }

            if (newRequestFilter.getRulesCount() === 0 && !reloadedRules) {
                // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/205
                log.info('No rules have been found - checking filter updates');
                reloadAntiBannerFilters();
                reloadedRules = true;
            } else if (newRequestFilter.getRulesCount() > 0 && reloadedRules) {
                log.info('Filters reloaded, deleting reloadRules flag');
                reloadedRules = false;
            }
        };

        /**
         * Fills engine with rules
         */
        const startTSUrlfilterEngine = async () => {
            const lists = [];

            // eslint-disable-next-line guard-for-in,no-restricted-syntax
            for (let filterId in rulesFilterMap) {
                // To number
                filterId -= 0;

                const isTrustedFilter = subscriptions.isTrustedFilter(filterId);
                const rulesTexts = rulesFilterMap[filterId].join('\n');

                lists.push(new TSUrlFilter.StringRuleList(filterId, rulesTexts, false, !isTrustedFilter));
            }

            await engine.startEngine(lists);

            requestFilterInitialized();
        };

        await startTSUrlfilterEngine();
    }

    /**
     * Create new request filter and add distinct rules from the storage.
     *
     * @private
     */
    async function createRequestFilter() {
        if (applicationRunning === false) {
            return;
        }

        const start = new Date().getTime();
        log.info('Starting loading filter rules from the storage');

        // Prepare map for filter rules
        // Map key is filter ID
        // Map value is array with filter rules
        const rulesFilterMap = Object.create(null);

        /**
         * STEP 2: Called when all filter rules have been loaded from storage
         */
        const loadAllFilterRulesDone = async () => {
            log.info('Finished loading filter rules from the storage in {0} ms', (new Date().getTime() - start));
            await onFiltersLoadedFromStorage(rulesFilterMap);
        };

        /**
         * Loads filter rules from storage
         *
         * @param filterId Filter identifier
         * @param rulesFilterMap Map for loading rules
         * @returns {*} Deferred object
         */
        const loadFilterRulesFromStorage = async (filterId, rulesFilterMap) => {
            const rulesText = await rulesStorage.read(filterId);

            if (rulesText) {
                rulesFilterMap[filterId] = rulesText;
            }
        };

        /**
         * STEP 1: load all filters from the storage.
         */
        const loadFilterRules = async function () {
            const promises = [];
            const filters = subscriptions.getFilters();
            for (let i = 0; i < filters.length; i += 1) {
                const filter = filters[i];
                const group = subscriptions.getGroup(filter.groupId);
                if (filter.enabled && group.enabled) {
                    promises.push(loadFilterRulesFromStorage(filter.filterId, rulesFilterMap));
                }
            }
            // get user filter rules from storage
            promises.push(loadFilterRulesFromStorage(utils.filters.USER_FILTER_ID, rulesFilterMap));

            // Load all filters and then recreate request filter
            await Promise.all(promises);
            await loadAllFilterRulesDone();
        };

        loadFilterRules();
    }

    /**
     * Adds event listener for filters changes.
     * If filter is somehow changed this method checks if we should save changes to the storage
     * and if we should recreate RequestFilter.
     *
     * @private
     */
    function addFiltersChangeEventListener() {
        let filterEventsHistory = [];
        let onFilterChangeTimeout = null;

        const processEventsHistory = async function () {
            const filterEvents = filterEventsHistory.slice(0);
            filterEventsHistory = [];
            onFilterChangeTimeout = null;

            const needCreateRequestFilter = filterEvents.some(isUpdateRequestFilterEvent);

            // Split by filterId
            const eventsByFilter = Object.create(null);
            for (let i = 0; i < filterEvents.length; i += 1) {
                const filterEvent = filterEvents[i];
                // don't add group events
                if (!filterEvent.filter) {
                    continue;
                }
                if (!(filterEvent.filter.filterId in eventsByFilter)) {
                    eventsByFilter[filterEvent.filter.filterId] = [];
                }
                eventsByFilter[filterEvent.filter.filterId].push(filterEvent);
            }

            const promises = [];
            // eslint-disable-next-line no-restricted-syntax
            for (const filterId of Object.keys(eventsByFilter)) {
                const needSaveRulesToStorage = eventsByFilter[filterId].some(isSaveRulesToStorageEvent);
                if (!needSaveRulesToStorage) {
                    continue;
                }
                // eslint-disable-next-line no-use-before-define
                const promise = processSaveFilterRulesToStorageEvents(filterId, eventsByFilter[filterId]);
                promises.push(promise);
            }

            if (needCreateRequestFilter) {
                // Rules will be added to request filter lazy,
                // listeners will be notified about REQUEST_FILTER_UPDATED later
                await Promise.all(promises);
                await createRequestFilter();
            } else {
                // Rules are already in request filter, notify listeners
                listeners.notifyListeners(listeners.REQUEST_FILTER_UPDATED, getRequestFilterInfo());
            }
        };

        const processFilterEvent = function (event, filter, rules) {
            filterEventsHistory.push({ event, filter, rules });

            if (onFilterChangeTimeout !== null) {
                clearTimeout(onFilterChangeTimeout);
            }

            onFilterChangeTimeout = setTimeout(processEventsHistory, FILTERS_CHANGE_DEBOUNCE_PERIOD);
        };

        const processGroupEvent = function (event, group) {
            filterEventsHistory.push({ event, group });

            if (onFilterChangeTimeout !== null) {
                clearTimeout(onFilterChangeTimeout);
            }

            onFilterChangeTimeout = setTimeout(processEventsHistory, FILTERS_CHANGE_DEBOUNCE_PERIOD);
        };

        listeners.addListener((event, filter, rules) => {
            switch (event) {
                case listeners.ADD_RULES:
                case listeners.REMOVE_RULE:
                case listeners.UPDATE_FILTER_RULES:
                case listeners.FILTER_ENABLE_DISABLE:
                    processFilterEvent(event, filter, rules);
                    break;
                default: break;
            }
        });

        listeners.addListener((event, group) => {
            switch (event) {
                case listeners.FILTER_GROUP_ENABLE_DISABLE:
                    processGroupEvent(event, group);
                    break;
                default:
                    break;
            }
        });
    }

    /**
     * Saves updated filter rules to the storage.
     *
     * @param filterId Filter id
     * @param events Events (what has changed?)
     * @private
     */
    async function processSaveFilterRulesToStorageEvents(filterId, events) {
        let loadedRulesText = await rulesStorage.read(filterId);

        for (let i = 0; i < events.length; i += 1) {
            if (!loadedRulesText) {
                loadedRulesText = [];
            }

            const event = events[i];
            const eventType = event.event;
            const eventRules = event.rules;

            // eslint-disable-next-line default-case
            switch (eventType) {
                case listeners.ADD_RULES:
                    loadedRulesText = loadedRulesText.concat(eventRules);
                    log.debug('Add {0} rules to filter {1}', eventRules.length, filterId);
                    break;
                case listeners.REMOVE_RULE: {
                    const actionRule = eventRules[0];
                    utils.collections.removeAll(loadedRulesText, actionRule);
                    log.debug('Remove {0} rule from filter {1}', actionRule, filterId);
                    break;
                }
                case listeners.UPDATE_FILTER_RULES:
                    loadedRulesText = eventRules;
                    log.debug('Update filter {0} rules count to {1}', filterId, eventRules.length);
                    break;
            }
        }

        log.debug('Converting {0} rules for filter {1}', loadedRulesText.length, filterId);
        const converted = TSUrlFilter.RuleConverter.convertRules(loadedRulesText.join('\n')).split('\n');

        log.debug('Saving {0} rules to filter {1}', converted.length, filterId);

        await rulesStorage.write(filterId, converted);
    }

    /**
     * Subscribe to events which lead to filters update.
     * @private
     */
    function subscribeToFiltersChangeEvents() {
        // on USE_OPTIMIZED_FILTERS setting change we need to reload filters
        const onUsedOptimizedFiltersChange = utils.concurrent.debounce(
            reloadAntiBannerFilters,
            RELOAD_FILTERS_DEBOUNCE_PERIOD,
        );

        settings.onUpdated.addListener((setting) => {
            if (setting === settings.USE_OPTIMIZED_FILTERS) {
                onUsedOptimizedFiltersChange();
            } else if (setting === settings.FILTERS_UPDATE_PERIOD) {
                filtersUpdate.scheduleFiltersUpdate();
            }
        });
    }

    /**
     * Get request filter initialization time
     * @returns {number}
     */
    const getRequestFilterInitTime = function () {
        return requestFilterInitTime;
    };

    /**
     * Is Application running
     */
    const isRunning = () => applicationRunning;

    return {

        start,
        stop,
        isInitialized,
        isRunning,

        addAntiBannerFilter,

        getRequestFilter,
        getRequestFilterInitTime,

        getRequestFilterInfo,
    };
})();
