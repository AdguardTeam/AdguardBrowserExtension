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
 * Creating service that manages our filter rules.
 */
adguard.antiBannerService = (function (adguard) {
    // Request filter contains all filter rules
    // This class does the actual filtering (checking URLs, constructing CSS/JS to inject, etc)
    let requestFilter = new adguard.RequestFilter();

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
        adguard.listeners.UPDATE_FILTER_RULES,
        adguard.listeners.FILTER_ENABLE_DISABLE,
        adguard.listeners.FILTER_GROUP_ENABLE_DISABLE,
    ];

    const isUpdateRequestFilterEvent = el => UPDATE_REQUEST_FILTER_EVENTS.indexOf(el.event) >= 0;

    /**
     * List of events which cause saving filter rules to the rules storage
     * @type {Array}
     */
    const SAVE_FILTER_RULES_TO_STORAGE_EVENTS = [
        adguard.listeners.UPDATE_FILTER_RULES,
        adguard.listeners.ADD_RULES,
        adguard.listeners.REMOVE_RULE,
    ];

    const isSaveRulesToStorageEvent = function (el) {
        return SAVE_FILTER_RULES_TO_STORAGE_EVENTS.indexOf(el.event) >= 0;
    };

    let reloadedRules = false;

    /**
     * AntiBannerService initialize method. Process install, update or simple run.
     * @param options Constructor options
     * @param callback
     */
    function initialize(options, callback) {
        /**
         * Waits and notifies listener with application updated event
         *
         * @param runInfo
         */
        const notifyApplicationUpdated = function (runInfo) {
            setTimeout(() => {
                adguard.listeners.notifyListeners(adguard.listeners.APPLICATION_UPDATED, runInfo);
            }, APP_UPDATED_NOTIFICATION_DELAY);
        };

        /**
         * This method is called when filter subscriptions have been loaded from remote server.
         * It is used to recreate RequestFilter object.
         */
        const initRequestFilter = function () {
            loadFiltersVersionAndStateInfo();
            loadGroupsStateInfo();
            createRequestFilter(() => {
                addFiltersChangeEventListener();
                callback();
            });
        };

        /**
         * Callback for subscriptions loaded event
         */
        const onSubscriptionLoaded = function (runInfo) {
            // Subscribe to events which lead to update filters (e.g. switсh to optimized and back to default)
            subscribeToFiltersChangeEvents();

            if (runInfo.isFirstRun) {
                // Add event listener for filters change
                addFiltersChangeEventListener();
                // Run callback
                // Request filter will be initialized during install
                if (typeof options.onInstall === 'function') {
                    options.onInstall(callback);
                } else {
                    callback();
                }
            } else if (runInfo.isUpdate) {
                // Updating storage schema on extension update (if needed)
                adguard.applicationUpdateService.onUpdate(runInfo, initRequestFilter);
                // Show updated version popup
                notifyApplicationUpdated(runInfo);
            } else {
                // Init RequestFilter object
                initRequestFilter();
            }
            // Schedule filters update job
            adguard.filtersUpdate.scheduleFiltersUpdate(runInfo.isFirstRun);
        };

        /**
         * Init extension common info.
         */
        adguard.applicationUpdateService.getRunInfo(async (runInfo) => {
            // Load subscription from the storage
            await adguard.subscriptions.init();
            onSubscriptionLoaded(runInfo);
        });
    }

    /**
     * Initialize application (process install or update) . Create and start request filter
     * @param options
     * @param callback
     */
    const start = function (options, callback) {
        if (applicationRunning === true) {
            callback();
            return;
        }
        applicationRunning = true;

        if (!applicationInitialized) {
            initialize(options, callback);
            applicationInitialized = true;
            return;
        }

        createRequestFilter(callback);
    };

    /**
     * Clear request filter
     */
    const stop = function () {
        applicationRunning = false;
        requestFilter = new adguard.RequestFilter();
        adguard.listeners.notifyListeners(adguard.listeners.REQUEST_FILTER_UPDATED, getRequestFilterInfo());
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
     * Loads filter from storage (if in extension package) or from backend
     *
     * @param filterId Filter identifier
     * @param callback Called when operation is finished
     */
    const addAntiBannerFilter = (filterId, callback) => {
        const filter = getFilterById(filterId);
        if (filter.installed) {
            callback(true);
            return;
        }

        const onFilterLoaded = (success) => {
            if (success) {
                filter.installed = true;
                adguard.listeners.notifyListeners(adguard.listeners.FILTER_ADD_REMOVE, filter);
            }
            callback(success);
        };

        if (filter.loaded) {
            onFilterLoaded(true);
            return;
        }

        /**
         * TODO: when we want to load filter from backend,
         *  we should retrieve metadata from backend too, but not from local file.
         */
        adguard.filtersUpdate.loadFilterRules(filter, false, onFilterLoaded);
    };

    /**
     * Reloads filters from backend
     *
     * @param successCallback
     * @param errorCallback
     * @private
     */
    function reloadAntiBannerFilters(successCallback, errorCallback) {
        resetFiltersVersion();
        adguard.filtersUpdate.checkAntiBannerFiltersUpdate(true, successCallback, errorCallback);
    }

    /**
     * Resets all filters versions
     */
    function resetFiltersVersion() {
        const RESET_VERSION = '0.0.0.0';

        const filters = adguard.subscriptions.getFilters();
        for (let i = 0; i < filters.length; i += 1) {
            const filter = filters[i];
            filter.version = RESET_VERSION;
        }
    }

    /**
     * Updates groups state info
     * Loads state info from the storage and then updates adguard.subscription.groups properly
     * @private
     */
    function loadGroupsStateInfo() {
        // Load filters state from the storage
        const groupsStateInfo = adguard.filtersState.getGroupsState();

        const groups = adguard.subscriptions.getGroups();

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
        const filtersVersionInfo = adguard.filtersState.getFiltersVersion();
        // Load filters state from the storage
        const filtersStateInfo = adguard.filtersState.getFiltersState();

        const filters = adguard.subscriptions.getFilters();

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
     * @param callback Called when request filter is initialized
     */
    function onFiltersLoadedFromStorage(rulesFilterMap, callback) {
        const start = new Date().getTime();

        adguard.console.info('Starting request filter initialization..');

        const newRequestFilter = new adguard.RequestFilter();

        if (requestFilterInitTime === 0) {
            // Setting the time of request filter very first initialization
            requestFilterInitTime = new Date().getTime();
            adguard.listeners.notifyListeners(adguard.listeners.APPLICATION_INITIALIZED);
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
            const userFilterId = adguard.utils.filters.USER_FILTER_ID;
            if (enabledFilterIds.length === 1 && enabledFilterIds[0] == userFilterId) {
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

            if (callback && typeof callback === 'function') {
                callback();
            }

            adguard.listeners.notifyListeners(adguard.listeners.REQUEST_FILTER_UPDATED, getRequestFilterInfo());
            adguard.console.info(
                'Finished request filter initialization in {0} ms. Rules count: {1}',
                (new Date().getTime() - start),
                newRequestFilter.getRulesCount()
            );

            /**
             * If no one of filters is enabled, don't reload rules
             */
            if (isEmptyRulesFilterMap(rulesFilterMap)) {
                return;
            }

            if (newRequestFilter.getRulesCount() === 0 && !reloadedRules) {
                // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/205
                adguard.console.info('No rules have been found - checking filter updates');
                reloadAntiBannerFilters();
                reloadedRules = true;
            } else if (newRequestFilter.getRulesCount() > 0 && reloadedRules) {
                adguard.console.info('Filters reloaded, deleting reloadRules flag');
                reloadedRules = false;
            }
        };

        /**
         * Synchronously fills engine with rules
         */
        const startTSUrlfilterEngine = function () {
            const lists = [];

            // eslint-disable-next-line guard-for-in,no-restricted-syntax
            for (let filterId in rulesFilterMap) {
                // To number
                filterId -= 0;

                const isTrustedFilter = adguard.subscriptions.isTrustedFilter(filterId);
                const rulesTexts = rulesFilterMap[filterId].join('\n');

                lists.push(new StringRuleList(filterId, rulesTexts, false, !isTrustedFilter));
            }

            adguard.engine.startEngine(lists);

            requestFilterInitialized();
        };

        startTSUrlfilterEngine();
    }

    /**
     * Create new request filter and add distinct rules from the storage.
     *
     * @param callback Called after request filter has been created
     * @private
     */
    function createRequestFilter(callback) {
        if (applicationRunning === false) {
            if (typeof callback === 'function') {
                callback();
            }
            return;
        }

        const start = new Date().getTime();
        adguard.console.info('Starting loading filter rules from the storage');

        // Prepare map for filter rules
        // Map key is filter ID
        // Map value is array with filter rules
        const rulesFilterMap = Object.create(null);

        /**
         * STEP 2: Called when all filter rules have been loaded from storage
         */
        const loadAllFilterRulesDone = function () {
            adguard.console.info('Finished loading filter rules from the storage in {0} ms',
                (new Date().getTime() - start));
            onFiltersLoadedFromStorage(rulesFilterMap, callback);
        };

        /**
         * Loads filter rules from storage
         *
         * @param filterId Filter identifier
         * @param rulesFilterMap Map for loading rules
         * @returns {*} Deferred object
         */
        const loadFilterRulesFromStorage = (filterId, rulesFilterMap) => new Promise((resolve) => {
            adguard.rulesStorage.read(filterId, (rulesText) => {
                if (rulesText) {
                    rulesFilterMap[filterId] = rulesText;
                }
                resolve();
            });
        });

        /**
         * STEP 1: load all filters from the storage.
         */
        const loadFilterRules = function () {
            const promises = [];
            const filters = adguard.subscriptions.getFilters();
            for (let i = 0; i < filters.length; i += 1) {
                const filter = filters[i];
                const group = adguard.subscriptions.getGroup(filter.groupId);
                if (filter.enabled && group.enabled) {
                    promises.push(loadFilterRulesFromStorage(filter.filterId, rulesFilterMap));
                }
            }
            // get user filter rules from storage
            promises.push(loadFilterRulesFromStorage(adguard.utils.filters.USER_FILTER_ID, rulesFilterMap));

            // Load all filters and then recreate request filter
            Promise.all(promises).then(loadAllFilterRulesDone);
        };

        loadFilterRules();
    }

    /**
     * Request Filter info
     */
    var getRequestFilterInfo = function () {
        let rulesCount = 0;
        if (requestFilter) {
            rulesCount = requestFilter.getRulesCount();
        }
        return {
            rulesCount,
        };
    };

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

        const processEventsHistory = function () {
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

            const dfds = [];
            for (const filterId in eventsByFilter) {
                const needSaveRulesToStorage = eventsByFilter[filterId].some(isSaveRulesToStorageEvent);
                if (!needSaveRulesToStorage) {
                    continue;
                }
                const dfd = processSaveFilterRulesToStorageEvents(filterId, eventsByFilter[filterId]);
                dfds.push(dfd);
            }

            if (needCreateRequestFilter) {
                // Rules will be added to request filter lazy, listeners will be notified about REQUEST_FILTER_UPDATED later
                adguard.utils.Promise.all(dfds).then(createRequestFilter);
            } else {
                // Rules are already in request filter, notify listeners
                adguard.listeners.notifyListeners(adguard.listeners.REQUEST_FILTER_UPDATED, getRequestFilterInfo());
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

        adguard.listeners.addListener((event, filter, rules) => {
            switch (event) {
                case adguard.listeners.ADD_RULES:
                case adguard.listeners.REMOVE_RULE:
                case adguard.listeners.UPDATE_FILTER_RULES:
                case adguard.listeners.FILTER_ENABLE_DISABLE:
                    processFilterEvent(event, filter, rules);
                    break;
                default: break;
            }
        });

        adguard.listeners.addListener((event, group) => {
            switch (event) {
                case adguard.listeners.FILTER_GROUP_ENABLE_DISABLE:
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
    function processSaveFilterRulesToStorageEvents(filterId, events) {
        const dfd = new adguard.utils.Promise();

        adguard.rulesStorage.read(filterId, (loadedRulesText) => {
            for (let i = 0; i < events.length; i += 1) {
                if (!loadedRulesText) {
                    loadedRulesText = [];
                }

                const event = events[i];
                const eventType = event.event;
                const eventRules = event.rules;

                switch (eventType) {
                    case adguard.listeners.ADD_RULES:
                        loadedRulesText = loadedRulesText.concat(eventRules);
                        adguard.console.debug('Add {0} rules to filter {1}', eventRules.length, filterId);
                        break;
                    case adguard.listeners.REMOVE_RULE:
                        var actionRule = eventRules[0];
                        adguard.utils.collections.removeAll(loadedRulesText, actionRule);
                        adguard.console.debug('Remove {0} rule from filter {1}', actionRule, filterId);
                        break;
                    case adguard.listeners.UPDATE_FILTER_RULES:
                        loadedRulesText = eventRules;
                        adguard.console.debug('Update filter {0} rules count to {1}', filterId, eventRules.length);
                        break;
                }
            }

            adguard.console.debug('Converting {0} rules for filter {1}', loadedRulesText.length, filterId);
            const converted = RuleConverter.convertRules(loadedRulesText.join('\n')).split('\n');

            adguard.console.debug('Saving {0} rules to filter {1}', converted.length, filterId);
            adguard.rulesStorage.write(filterId, converted, () => {
                dfd.resolve();
                if (filterId === adguard.utils.filters.USER_FILTER_ID) {
                    adguard.listeners.notifyListeners(
                        adguard.listeners.UPDATE_USER_FILTER_RULES,
                        getRequestFilterInfo()
                    );
                }
            });
        });

        return dfd;
    }

    /**
     * Subscribe to events which lead to filters update.
     * @private
     */
    function subscribeToFiltersChangeEvents() {
        // on USE_OPTIMIZED_FILTERS setting change we need to reload filters
        const onUsedOptimizedFiltersChange = adguard.utils.concurrent.debounce(
            reloadAntiBannerFilters,
            RELOAD_FILTERS_DEBOUNCE_PERIOD
        );

        adguard.settings.onUpdated.addListener((setting) => {
            if (setting === adguard.settings.USE_OPTIMIZED_FILTERS) {
                onUsedOptimizedFiltersChange();
            } else if (setting === adguard.settings.FILTERS_UPDATE_PERIOD) {
                adguard.filtersUpdate.scheduleFiltersUpdate();
            }
        });
    }

    /**
     * Gets filter by ID.
     * Throws exception if filter not found.
     *
     * @param filterId Filter identifier
     * @returns {*} Filter got from adguard.subscriptions.getFilter
     * @private
     */
    function getFilterById(filterId) {
        const filter = adguard.subscriptions.getFilter(filterId);
        if (!filter) {
            throw new Error(`Filter with id: ${filterId} not found`);
        }
        return filter;
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
})(adguard);
