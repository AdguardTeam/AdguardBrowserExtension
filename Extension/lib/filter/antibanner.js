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
    // Add synthetic user filter
    const userFilter = { filterId: adguard.utils.filters.USER_FILTER_ID };

    // Request filter contains all filter rules
    // This class does the actual filtering (checking URLs, constructing CSS/JS to inject, etc)
    let requestFilter = new adguard.RequestFilter();

    // Service is not initialized yet
    let requestFilterInitTime = 0;

    // Application is running flag
    let applicationRunning = false;

    // Application initialized flag (Sets on first call of 'start' method)
    let applicationInitialized = false;

    // Get filters update period
    let filtersUpdatePeriod = adguard.settings.getFiltersUpdatePeriod();

    /**
     * Delay before doing first filters update check -- 5 minutes
     */
    const UPDATE_FILTERS_DELAY = 5 * 60 * 1000;

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
            scheduleFiltersUpdate(runInfo.isFirstRun);
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
        loadFilterRules(filter, false, onFilterLoaded);
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
        checkAntiBannerFiltersUpdate(true, successCallback, errorCallback);
    }

    /**
     * Gets expires in sec end return in ms
     * If expires was less then minimumExpiresTime or we couldn't parse its value,
     * then return minimumExpiresTime
     * @param {*} expires
     * @returns {number}
     */
    const normalizeExpires = (expires) => {
        const minimumExpiresSec = 60 * 60;

        expires = Number.parseInt(expires, 10);

        if (Number.isNaN(expires) || expires < minimumExpiresSec) {
            expires = minimumExpiresSec;
        }

        return expires * 1000;
    };

    /**
     * Select filters for update. It depends on the time of last update,
     * on the filter enable status and group enable status
     * @param forceUpdate Force update flag.
     * @param filtersToUpdate Optional array of filters
     * @returns object
     */
    function selectFilterIdsToUpdate(forceUpdate, filtersToUpdate) {
        const filterIds = [];
        const customFilterIds = [];
        const filters = filtersToUpdate || adguard.subscriptions.getFilters();

        const needUpdate = (filter) => {
            const { lastCheckTime } = filter;
            let { expires } = filter;

            if (!lastCheckTime) {
                return true;
            }

            expires = normalizeExpires(expires);
            if (filtersUpdatePeriod === adguard.settings.DEFAULT_FILTERS_UPDATE_PERIOD) {
                return lastCheckTime + expires <= Date.now();
            }

            return lastCheckTime + filtersUpdatePeriod <= Date.now();
        };

        for (let i = 0; i < filters.length; i += 1) {
            const filter = filters[i];
            const group = adguard.subscriptions.getGroup(filter.groupId);
            if (filter.installed && filter.enabled && group.enabled) {
                if (forceUpdate || needUpdate(filter)) {
                    if (filter.customUrl) {
                        customFilterIds.push(filter.filterId);
                    } else {
                        filterIds.push(filter.filterId);
                    }
                }
            }
        }

        return {
            filterIds,
            customFilterIds,
        };
    }

    /**
     * Checks filters updates.
     *
     * @param forceUpdate Normally we respect filter update period. But if this parameter is
     *                    true - we ignore it and check updates for all filters.
     * @param successCallback Called if filters were updated successfully
     * @param errorCallback Called if something gone wrong
     * @param filters     Optional Array of filters to update
     */
    const checkAntiBannerFiltersUpdate = (forceUpdate, successCallback, errorCallback, filters) => {
        const noop = () => {}; // empty callback
        successCallback = successCallback || noop;
        errorCallback = errorCallback || noop;

        // Don't update in background if request filter isn't running
        if (!forceUpdate && !applicationRunning) {
            return;
        }

        adguard.console.info('Start checking filters updates');

        // Select filters for update
        const toUpdate = selectFilterIdsToUpdate(forceUpdate, filters);
        const filterIdsToUpdate = toUpdate.filterIds;
        const customFilterIdsToUpdate = toUpdate.customFilterIds;

        const totalToUpdate = filterIdsToUpdate.length + customFilterIdsToUpdate.length;
        if (totalToUpdate === 0) {
            successCallback([]);
            adguard.console.info('There is no filters to update');
            return;
        }

        adguard.console.info('Checking updates for {0} filters', totalToUpdate);

        // Load filters with changed version
        const loadFiltersFromBackendCallback = (filterMetadataList) => {
            loadFiltersFromBackend(filterMetadataList, (success, filterIds) => {
                if (success) {
                    const filters = filterIds
                        .map(adguard.subscriptions.getFilter)
                        .filter(f => f);

                    updateCustomFilters(customFilterIdsToUpdate, (customFilters) => {
                        successCallback(filters.concat(customFilters));
                    });
                } else {
                    errorCallback();
                }
            });
        };


        /**
         * Method is called after we have got server response
         * Now we check filters version and update filter if needed
         * @param success
         * @param filterMetadataList
         */
        const onLoadFilterMetadataList = (success, filterMetadataList) => {
            if (success) {
                const filterMetadataListToUpdate = [];
                for (let i = 0; i < filterMetadataList.length; i += 1) {
                    const filterMetadata = filterMetadataList[i];
                    const filter = adguard.subscriptions.getFilter(filterMetadata.filterId);
                    if (filter && filterMetadata.version && adguard.utils.browser.isGreaterVersion(filterMetadata.version, filter.version)) {
                        adguard.console.info(`Updating filter ${filter.filterId} to version ${filterMetadata.version}`);
                        filterMetadataListToUpdate.push(filterMetadata);
                    } else {
                        // remember that this filter version was checked
                        filter.lastCheckTime = Date.now();
                    }
                }
                loadFiltersFromBackendCallback(filterMetadataListToUpdate);
            } else {
                errorCallback();
            }
        };

        // Retrieve current filters metadata for update
        loadFiltersMetadataFromBackend(filterIdsToUpdate, onLoadFilterMetadataList);
    };

    /**
     * Update filters with custom urls
     *
     * @param customFilterIds
     * @param callback
     */
    function updateCustomFilters(customFilterIds, callback) {
        if (customFilterIds.length === 0) {
            callback([]);
            return;
        }

        const promises = customFilterIds.map(filterId => new Promise((resolve) => {
            const filter = adguard.subscriptions.getFilter(filterId);
            const onUpdate = (updatedFilterId) => {
                if (updatedFilterId) {
                    return resolve(filter);
                }
                return resolve();
            };
            adguard.subscriptions.updateCustomFilter(filter.customUrl, {}, onUpdate);
        }));

        Promise.all(promises).then((filters) => {
            const updatedFilters = filters.filter(f => f);
            if (updatedFilters.length > 0) {
                const filterIdsString = updatedFilters.map(f => f.filterId).join(', ');
                adguard.console.info(`Updated custom filters with ids: ${filterIdsString}`);
            }

            callback(updatedFilters);
        });
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

        // UI thread becomes blocked on the options page while request filter is created
        // that't why we create filter rules using chunks of the specified length
        // Request filter creation is rather slow operation so we should
        // use setTimeout calls to give UI thread some time.
        const async = adguard.requestFilter.isReady();
        const asyncStep = 1000;
        adguard.console.info('Starting request filter initialization. Async={0}', async);

        // Empty request filter
        const newRequestFilter = new adguard.RequestFilter();

        if (requestFilterInitTime === 0) {
            // Setting the time of request filter very first initialization
            requestFilterInitTime = new Date().getTime();
            adguard.listeners.notifyListeners(adguard.listeners.APPLICATION_INITIALIZED);
        }

        // Supplement object to make sure that we use only unique filter rules
        const uniqueRules = Object.create(null);

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
                newRequestFilter.rulesCount
            );

            /**
             * If no one of filters is enabled, don't reload rules
             */
            if (isEmptyRulesFilterMap(rulesFilterMap)) {
                return;
            }

            if (newRequestFilter.rulesCount === 0 && !reloadedRules) {
                // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/205
                adguard.console.info('No rules have been found - checking filter updates');
                reloadAntiBannerFilters();
                reloadedRules = true;
            } else if (newRequestFilter.rulesCount > 0 && reloadedRules) {
                adguard.console.info('Filters reloaded, deleting reloadRules flag');
                reloadedRules = false;
            }
        };

        /**
         * Supplement function for adding rules to the request filter
         *
         * @param filterId Filter identifier
         * @param rulesTexts Array with filter rules
         * @param startIdx Start index of the rules array
         * @param endIdx End index of the rules array
         */
        const addRules = function (filterId, rulesTexts, startIdx, endIdx) {
            if (!rulesTexts) {
                return;
            }

            const isTrustedFilter = adguard.subscriptions.isTrustedFilter(filterId);

            for (let i = startIdx; i < rulesTexts.length && i < endIdx; i += 1) {
                const ruleText = rulesTexts[i];
                if (ruleText in uniqueRules) {
                    // Do not allow duplicates
                    continue;
                }
                uniqueRules[ruleText] = true;
                const rule = adguard.rules.builder.createRule(ruleText, filterId, isTrustedFilter);

                if (rule !== null) {
                    newRequestFilter.addRule(rule);
                }
            }
        };

        /**
         * Asynchronously adds rules to the request filter.
         */
        const addRulesAsync = (filterId, rulesTexts, startIdx, stopIdx, prevPromise) => new Promise((resolve) => {
            prevPromise.then(() => {
                setTimeout(() => {
                    addRules(filterId, rulesTexts, startIdx, stopIdx);
                    resolve();
                }, 1);
            });
        });

        /**
         * Asynchronously fills request filter with rules.
         */
        const fillRequestFilterAsync = function () {
            const rootPromise = Promise.resolve();
            let prevPromise = null;
            const promises = [];

            // Go through all filters in the map
            for (let filterId in rulesFilterMap) { // jshint ignore:line
                // To number
                filterId -= 0;
                if (filterId !== adguard.utils.filters.USER_FILTER_ID) {
                    const rulesTexts = rulesFilterMap[filterId];

                    for (let i = 0; i < rulesTexts.length; i += asyncStep) {
                        prevPromise = addRulesAsync(filterId, rulesTexts, i, i + asyncStep, prevPromise || rootPromise);
                        promises.push(prevPromise);
                    }
                }
            }

            // User filter should be the last
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/117
            const userFilterId = adguard.utils.filters.USER_FILTER_ID;
            const userRules = rulesFilterMap[userFilterId];
            const startIndex = 0;
            const endIndex = userRules.length;
            prevPromise = addRulesAsync(userFilterId, userRules, startIndex, endIndex, prevPromise || rootPromise);
            promises.push(prevPromise);

            Promise.all(promises).then(() => {
                requestFilterInitialized();
            });
        };

        /**
         * Synchronously fills request filter with rules
         */
        const fillRequestFilterSync = function () {
            // Go through all filters in the map
            for (let filterId in rulesFilterMap) { // jshint ignore:line
                // To number
                filterId -= 0;
                if (filterId != adguard.utils.filters.USER_FILTER_ID) {
                    const rulesTexts = rulesFilterMap[filterId];
                    addRules(filterId, rulesTexts, 0, rulesTexts.length);
                }
            }

            // User filter should be the last
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/117
            const userRules = rulesFilterMap[adguard.utils.filters.USER_FILTER_ID];
            addRules(adguard.utils.filters.USER_FILTER_ID, userRules, 0, userRules.length);
            requestFilterInitialized();
        };

        if (async) {
            fillRequestFilterAsync();
        } else {
            fillRequestFilterSync();
        }
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
            adguard.console.info('Finished loading filter rules from the storage in {0} ms', (new Date().getTime() - start));
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
            rulesCount = requestFilter.rulesCount;
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

            adguard.console.debug('Save {0} rules to filter {1}', loadedRulesText.length, filterId);
            adguard.rulesStorage.write(filterId, loadedRulesText, () => {
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
                return;
            }
            if (setting === adguard.settings.DISABLE_COLLECT_HITS) {
                getRequestFilter().cssFilter.dirty = true;
            }
            if (setting === adguard.settings.FILTERS_UPDATE_PERIOD) {
                scheduleFiltersUpdate();
            }
        });
    }

    // Scheduling job
    let scheduleUpdateTimeoutId;
    function scheduleUpdate() {
        const checkTimeout = 1000 * 60 * 30;
        if (scheduleUpdateTimeoutId) {
            clearTimeout(scheduleUpdateTimeoutId);
        }

        // don't update filters if filters update period is equal to 0
        if (filtersUpdatePeriod === 0) {
            return;
        }

        scheduleUpdateTimeoutId = setTimeout(() => {
            try {
                checkAntiBannerFiltersUpdate();
            } catch (ex) {
                adguard.console.error('Error update filters, cause {0}', ex);
            }
            scheduleUpdate();
        }, checkTimeout);
    }

    /**
     * Schedules filters update job
     *
     * @param isFirstRun App first run flag
     * @private
     */
    function scheduleFiltersUpdate(isFirstRun) {
        filtersUpdatePeriod = adguard.settings.getFiltersUpdatePeriod();
        // First run delay
        if (isFirstRun) {
            setTimeout(checkAntiBannerFiltersUpdate, UPDATE_FILTERS_DELAY, isFirstRun);
        }
        scheduleUpdate();
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
     * Loads filters (ony-by-one) from the remote server
     *
     * @param filterMetadataList List of filter metadata to load
     * @param callback Called when filters have been loaded
     * @private
     */
    function loadFiltersFromBackend(filterMetadataList, callback) {
        const promises = filterMetadataList
            .map(filterMetadata => new Promise((resolve, reject) => {
                loadFilterRules(filterMetadata, true, (success) => {
                    if (!success) {
                        return reject();
                    }
                    return resolve(filterMetadata.filterId);
                });
            }));

        Promise.all(promises)
            .then((filterIds) => {
                callback(true, filterIds);
            })
            .catch(() => {
                callback(false);
            });
    }

    /**
     * Loads filter rules
     *
     * @param filterMetadata Filter metadata
     * @param forceRemote Force download filter rules from remote server
     * (if false try to download local copy of rules if it's possible)
     * @param callback Called when filter rules have been loaded
     * @private
     */
    function loadFilterRules(filterMetadata, forceRemote, callback) {
        const filter = getFilterById(filterMetadata.filterId);

        filter._isDownloading = true;
        adguard.listeners.notifyListeners(adguard.listeners.START_DOWNLOAD_FILTER, filter);

        const successCallback = (filterRules) => {
            adguard.console.info('Retrieved response from server for filter {0}, rules count: {1}',
                filter.filterId,
                filterRules.length);
            delete filter._isDownloading;
            filter.version = filterMetadata.version;
            filter.lastUpdateTime = filterMetadata.timeUpdated;
            filter.lastCheckTime = forceRemote ? Date.now() : filterMetadata.timeUpdated;
            filter.loaded = true;
            filter.expires = filterMetadata.expires;
            // notify listeners
            adguard.listeners.notifyListeners(adguard.listeners.SUCCESS_DOWNLOAD_FILTER, filter);
            adguard.listeners.notifyListeners(adguard.listeners.UPDATE_FILTER_RULES, filter, filterRules);
            callback(true);
        };

        const errorCallback = (cause) => {
            adguard.console.error(
                'Error retrieving response from the server for filter {0}, cause: {1}:',
                filter.filterId,
                cause || ''
            );
            delete filter._isDownloading;
            adguard.listeners.notifyListeners(adguard.listeners.ERROR_DOWNLOAD_FILTER, filter);
            callback(false);
        };

        adguard.backend.loadFilterRules(filter.filterId,
            forceRemote,
            adguard.settings.isUseOptimizedFiltersEnabled()).then(successCallback, errorCallback);
    }

    /**
     * Loads filter versions from remote server
     *
     * @param filterIds Filter identifiers
     * @param callback Callback (called when load is finished)
     * @private
     */
    function loadFiltersMetadataFromBackend(filterIds, callback) {
        if (filterIds.length === 0) {
            callback(true, []);
            return;
        }

        const loadSuccess = (filterMetadataList) => {
            adguard.console.debug(
                'Retrieved response from server for {0} filters, result: {1} metadata',
                filterIds.length, filterMetadataList.length
            );
            callback(true, filterMetadataList);
        };

        const loadError = (request, cause) => {
            adguard.console.error(
                'Error retrieved response from server for filters {0}, cause: {1} {2}',
                filterIds, request.statusText,
                cause || ''
            );
            callback(false);
        };

        adguard.backend.loadFiltersMetadata(filterIds, loadSuccess, loadError);
    }

    /**
     * Get request filter initialization time
     * @returns {number}
     */
    const getRequestFilterInitTime = function () {
        return requestFilterInitTime;
    };

    /**
     * Add rules to filter
     * @param rulesText
     * @returns {Array}
     */
    const addUserFilterRules = function (rulesText) {
        const rules = [];
        for (let i = 0; i < rulesText.length; i += 1) {
            const rule = adguard.rules.builder.createRule(rulesText[i], adguard.utils.filters.USER_FILTER_ID);
            if (rule !== null) {
                rules.push(rule);
            }
        }
        requestFilter.addRules(rules);

        adguard.listeners.notifyListeners(adguard.listeners.ADD_RULES, userFilter, rulesText);
        adguard.listeners.notifyListeners(adguard.listeners.UPDATE_USER_FILTER_RULES, getRequestFilterInfo());

        return rules;
    };

    /**
     * Updates filter rules
     * @param rulesText Rules text
     */
    const updateUserFilterRules = function (rulesText) {
        adguard.listeners.notifyListeners(adguard.listeners.UPDATE_FILTER_RULES, userFilter, rulesText);
        adguard.listeners.notifyListeners(adguard.listeners.UPDATE_USER_FILTER_RULES, getRequestFilterInfo());
    };

    /**
     * Remove rule from filter
     * @param ruleText
     */
    const removeUserFilterRule = function (ruleText) {
        const rule = adguard.rules.builder.createRule(ruleText, adguard.utils.filters.USER_FILTER_ID);
        if (rule !== null) {
            requestFilter.removeRule(rule);
        }
        adguard.listeners.notifyListeners(adguard.listeners.REMOVE_RULE, userFilter, [ruleText]);
    };

    return {

        start,
        stop,
        isInitialized,

        addAntiBannerFilter,

        getRequestFilter,
        getRequestFilterInitTime,

        addUserFilterRules,
        updateUserFilterRules,
        removeUserFilterRule,

        getRequestFilterInfo,

        checkAntiBannerFiltersUpdate,
    };
})(adguard);

/**
 * Api for filtering and elements hiding.
 */
adguard.requestFilter = (function (adguard) {
    'use strict';

    const { antiBannerService } = adguard;

    function getRequestFilter() {
        return antiBannerService.getRequestFilter();
    }

    /**
     * @returns boolean true when request filter was initialized first time
     */
    const isReady = function () {
        return antiBannerService.getRequestFilterInitTime() > 0;
    };

    /**
     * When browser just started we need some time on request filter initialization.
     * This could be a problem in case when browser has a homepage and it is just started.
     * In this case request filter is not yet initalized so we don't block requests and inject css.
     * To fix this, content script will repeat requests for selectors until request filter is ready
     * and it will also collapse all elements which should have been blocked.
     *
     * @returns boolean true if we should collapse elements with content script
     */
    const shouldCollapseAllElements = function () {
        // We assume that if content script is requesting CSS in first 5 seconds after request filter init,
        // then it is possible, that we've missed some elements and now we should collapse these elements
        const requestFilterInitTime = antiBannerService.getRequestFilterInitTime();
        return (requestFilterInitTime > 0) && (requestFilterInitTime + 5000 > new Date().getTime());
    };

    const getRules = function () {
        return getRequestFilter().getRules();
    };

    const findRuleForRequest = function (requestUrl, documentUrl, requestType, documentWhitelistRule) {
        return getRequestFilter().findRuleForRequest(requestUrl, documentUrl, requestType, documentWhitelistRule);
    };

    const findWhiteListRule = function (requestUrl, referrer, requestType) {
        return getRequestFilter().findWhiteListRule(requestUrl, referrer, requestType);
    };

    const findStealthWhiteListRule = function (requestUrl, referrer, requestType) {
        return getRequestFilter().findStealthWhiteListRule(requestUrl, referrer, requestType);
    };

    const getSelectorsForUrl = function (documentUrl, genericHideFlag) {
        return getRequestFilter().getSelectorsForUrl(documentUrl, genericHideFlag);
    };

    const getInjectedSelectorsForUrl = function (documentUrl, genericHideFlag) {
        return getRequestFilter().getInjectedSelectorsForUrl(documentUrl, genericHideFlag);
    };

    const getScriptsForUrl = function (documentUrl) {
        return getRequestFilter().getScriptsForUrl(documentUrl);
    };

    const getScriptsStringForUrl = function (documentUrl, tab) {
        return getRequestFilter().getScriptsStringForUrl(documentUrl, tab);
    };

    const getContentRulesForUrl = function (documentUrl) {
        return getRequestFilter().getContentRulesForUrl(documentUrl);
    };

    const getMatchedElementsForContentRules = function (doc, rules) {
        return getRequestFilter().getMatchedElementsForContentRules(doc, rules);
    };

    const getCspRules = function (requestUrl, referrer, requestType) {
        return getRequestFilter().findCspRules(requestUrl, referrer, requestType);
    };

    const getCookieRules = function (requestUrl, referrer, requestType) {
        return getRequestFilter().findCookieRules(requestUrl, referrer, requestType);
    };

    const getReplaceRules = function (requestUrl, referrer, requestType) {
        return getRequestFilter().findReplaceRules(requestUrl, referrer, requestType);
    };

    const getRemoveparamRules = function (requestUrl, referrer, requestType) {
        return getRequestFilter().findRemoveparamRules(requestUrl, referrer, requestType);
    };

    const getRequestFilterInfo = function () {
        return antiBannerService.getRequestFilterInfo();
    };

    return {

        isReady,
        shouldCollapseAllElements,

        getRules,
        findRuleForRequest,
        findWhiteListRule,

        getSelectorsForUrl,
        getInjectedSelectorsForUrl,
        getScriptsForUrl,
        getScriptsStringForUrl,
        getContentRulesForUrl,
        getMatchedElementsForContentRules,
        getCspRules,
        getCookieRules,
        getReplaceRules,
        findStealthWhiteListRule,
        getRequestFilterInfo,
        getRemoveparamRules,
    };
})(adguard);

/**
 * Helper class for working with filters metadata storage (local storage)
 * //TODO: Duplicated in filters-storage.js
 */
adguard.filtersState = (function (adguard) {
    const FILTERS_STATE_PROP = 'filters-state';
    const FILTERS_VERSION_PROP = 'filters-version';
    const GROUPS_STATE_PROP = 'groups-state';

    /**
     * Gets filter version from the local storage
     * @returns {*}
     */
    const getFiltersVersion = function () {
        let filters = Object.create(null);
        try {
            const json = adguard.localStorage.getItem(FILTERS_VERSION_PROP);
            if (json) {
                filters = JSON.parse(json);
            }
        } catch (ex) {
            adguard.console.error('Error retrieve filters version info, cause {0}', ex);
        }
        return filters;
    };

    /**
     * Gets filters state from the local storage
     * @returns {*}
     */
    const getFiltersState = function () {
        let filters = Object.create(null);
        try {
            const json = adguard.localStorage.getItem(FILTERS_STATE_PROP);
            if (json) {
                filters = JSON.parse(json);
            }
        } catch (ex) {
            adguard.console.error('Error retrieve filters state info, cause {0}', ex);
        }
        return filters;
    };

    /**
     * Gets groups state from the local storage
     * @returns {any}
     */
    const getGroupsState = function () {
        let groups = Object.create(null);
        try {
            const json = adguard.localStorage.getItem(GROUPS_STATE_PROP);
            if (json) {
                groups = JSON.parse(json);
            }
        } catch (e) {
            adguard.console.error('Error retrieve groups state info, cause {0}', e);
        }
        return groups;
    };

    /**
     * Updates filter version in the local storage
     *
     * @param filter Filter version metadata
     */
    const updateFilterVersion = function (filter) {
        const filters = getFiltersVersion();
        filters[filter.filterId] = {
            version: filter.version,
            lastCheckTime: filter.lastCheckTime,
            lastUpdateTime: filter.lastUpdateTime,
            expires: filter.expires,
        };

        adguard.localStorage.setItem(FILTERS_VERSION_PROP, JSON.stringify(filters));
    };

    /**
     * Updates filter state in the local storage
     *
     * @param filter Filter state object
     */
    const updateFilterState = function (filter) {
        const filters = getFiltersState();
        filters[filter.filterId] = {
            loaded: filter.loaded,
            enabled: filter.enabled,
            installed: filter.installed,
        };
        adguard.localStorage.setItem(FILTERS_STATE_PROP, JSON.stringify(filters));
    };

    const removeFilter = (filterId) => {
        const filters = getFiltersState();
        delete filters[filterId];
        adguard.localStorage.setItem(FILTERS_STATE_PROP, JSON.stringify(filters));
    };

    /**
     * Updates group enable state in the local storage
     *
     * @param group - SubscriptionGroup object
     */
    const updateGroupState = function (group) {
        const groups = getGroupsState();
        groups[group.groupId] = {
            enabled: group.enabled,
        };
        adguard.localStorage.setItem(GROUPS_STATE_PROP, JSON.stringify(groups));
    };

    // Add event listener to persist filter metadata to local storage
    adguard.listeners.addListener((event, payload) => {
        switch (event) {
            case adguard.listeners.SUCCESS_DOWNLOAD_FILTER:
                updateFilterState(payload);
                updateFilterVersion(payload);
                break;
            case adguard.listeners.FILTER_ADD_REMOVE:
            case adguard.listeners.FILTER_ENABLE_DISABLE:
                updateFilterState(payload);
                break;
            case adguard.listeners.FILTER_GROUP_ENABLE_DISABLE:
                updateGroupState(payload);
                break;
            default:
                break;
        }
    });

    return {
        getFiltersVersion,
        getFiltersState,
        getGroupsState,
        // These methods are used only for migrate from old versions
        updateFilterVersion,
        updateFilterState,
        removeFilter,
    };
})(adguard);

/**
 * Class for manage filters state (enable, disable, add, remove, check updates)
 * Also includes method for initializing
 */
adguard.filters = (function (adguard) {
    'use strict';

    /**
     * TImeout for recently updated filters and again enabled filters - 5 minutes
     */
    const ENABLED_FILTERS_SKIP_TIMEOUT = 5 * 60 * 1000;

    const { antiBannerService } = adguard;

    const start = function (options, callback) {
        antiBannerService.start(options, callback);
    };

    const stop = function (callback) {
        antiBannerService.stop();
        callback();
    };

    /**
     * Checks application has been initialized
     * @returns {boolean}
     */
    const isInitialized = function () {
        return antiBannerService.isInitialized();
    };

    /**
     * Offer filters on extension install, select default filters and filters by locale and country
     * @param callback
     */
    const offerFilters = (callback) => {
        // These filters are enabled by default
        const filterIds = [
            adguard.utils.filters.ENGLISH_FILTER_ID,
            adguard.utils.filters.SEARCH_AND_SELF_PROMO_FILTER_ID,
        ];
        if (adguard.prefs.mobile) {
            filterIds.push(adguard.utils.filters.MOBILE_ADS_FILTER_ID);
        }
        filterIds.concat(adguard.subscriptions.getLangSuitableFilters());
        callback(filterIds);
    };

    /**
     * List of enabled filters.
     * User filter and whitelist filter are always enabled so they are excluded.
     *
     * @returns {Array} List of enabled filters
     */
    const getEnabledFilters = () => adguard.subscriptions.getFilters()
        .filter(f => f.installed && f.enabled);

    const getEnabledFiltersFromEnabledGroups = () => {
        const filters = adguard.subscriptions.getFilters();
        const enabledGroupsIds = adguard.subscriptions.getGroups()
            .filter(g => g.enabled)
            .map(g => g.groupId);
        return filters.filter(f => f.enabled && enabledGroupsIds.includes(f.groupId));
    };

    /**
     * Checks if specified filter is enabled
     *
     * @param filterId Filter identifier
     * @returns {*} true if enabled
     */
    const isFilterEnabled = function (filterId) {
        const filter = adguard.subscriptions.getFilter(filterId);
        return filter && filter.enabled;
    };

    /**
     * Checks if specified filter is installed (downloaded)
     *
     * @param filterId Filter id
     * @returns {*} true if installed
     */
    const isFilterInstalled = function (filterId) {
        const filter = adguard.subscriptions.getFilter(filterId);
        return filter && filter.installed;
    };

    /**
     * Force checks updates for filters if specified or all filters
     *
     * @param successCallback
     * @param errorCallback
     * @param {Object[]} [filters] optional list of filters
     */
    const checkFiltersUpdates = (successCallback, errorCallback, filters) => {
        if (filters) {
            // Skip recently downloaded filters
            const outdatedFilter = filters.filter(f => (f.lastCheckTime
                ? Date.now() - f.lastCheckTime > ENABLED_FILTERS_SKIP_TIMEOUT
                : true));

            if (outdatedFilter.length > 0) {
                antiBannerService.checkAntiBannerFiltersUpdate(
                    true,
                    successCallback,
                    errorCallback,
                    outdatedFilter
                );
            }
        } else {
            antiBannerService.checkAntiBannerFiltersUpdate(true, successCallback, errorCallback);
        }
    };

    /**
     * Enable group
     * @param {number} groupId filter group identifier
     */
    const enableGroup = function (groupId) {
        const group = adguard.subscriptions.getGroup(groupId);
        if (!group || group.enabled) {
            return;
        }
        group.enabled = true;
        adguard.listeners.notifyListeners(adguard.listeners.FILTER_GROUP_ENABLE_DISABLE, group);
    };

    /**
     * Disable group
     * @param {number} groupId filter group identifier
     */
    const disableGroup = function (groupId) {
        const group = adguard.subscriptions.getGroup(groupId);
        if (!group || !group.enabled) {
            return;
        }
        group.enabled = false;
        adguard.listeners.notifyListeners(adguard.listeners.FILTER_GROUP_ENABLE_DISABLE, group);
    };

    /**
     * Enable filter
     *
     * @param {Number} filterId Filter identifier
     * @param {{forceGroupEnable: boolean}} [options]
     * @returns {boolean} true if filter was enabled successfully
     */
    const enableFilter = (filterId, options) => {
        const filter = adguard.subscriptions.getFilter(filterId);
        if (!filter || filter.enabled || !filter.installed) {
            return false;
        }
        filter.enabled = true;
        /**
         * we enable group if it was never enabled or disabled early
         */
        const { groupId } = filter;
        const forceGroupEnable = options && options.forceGroupEnable;
        if (!adguard.subscriptions.groupHasEnabledStatus(groupId) || forceGroupEnable) {
            enableGroup(groupId);
        }
        adguard.listeners.notifyListeners(adguard.listeners.FILTER_ENABLE_DISABLE, filter);
        return true;
    };

    /**
     * Successively add filters from filterIds and then enable successfully added filters
     * @param filterIds Filter identifiers
     * @param {{forceGroupEnable: boolean}} [options]
     * @param callback We pass list of enabled filter identifiers to the callback
     */
    const addAndEnableFilters = (filterIds, callback, options) => {
        callback = callback || function noop() {}; // empty callback

        const enabledFilters = [];

        if (!filterIds || filterIds.length === 0) {
            callback(enabledFilters);
            return;
        }

        filterIds = adguard.utils.collections.removeDuplicates(filterIds.slice(0));
        const loadNextFilter = () => {
            if (filterIds.length === 0) {
                callback(enabledFilters);
            } else {
                const filterId = filterIds.shift();
                antiBannerService.addAntiBannerFilter(filterId, (success) => {
                    if (success) {
                        const changed = enableFilter(filterId, options);
                        if (changed) {
                            const filter = adguard.subscriptions.getFilter(filterId);
                            enabledFilters.push(filter);
                        }
                    }
                    loadNextFilter();
                });
            }
        };

        loadNextFilter();
    };

    /**
     * Disables filters by id
     *
     * @param {Array.<Number>} filterIds Filter identifiers
     * @returns {boolean} true if filter was disabled successfully
     */
    const disableFilters = function (filterIds) {
        // Copy array to prevent parameter mutation
        filterIds = adguard.utils.collections.removeDuplicates(filterIds.slice(0));
        for (let i = 0; i < filterIds.length; i += 1) {
            const filterId = filterIds[i];
            const filter = adguard.subscriptions.getFilter(filterId);
            if (!filter || !filter.enabled || !filter.installed) {
                continue;
            }
            filter.enabled = false;
            adguard.listeners.notifyListeners(adguard.listeners.FILTER_ENABLE_DISABLE, filter);
        }
    };

    /**
     * Uninstalls filters
     *
     * @param {Array.<Number>} filterIds Filter identifiers
     * @returns {boolean} true if filter was removed successfully
     */
    const uninstallFilters = function (filterIds) {
        // Copy array to prevent parameter mutation
        filterIds = adguard.utils.collections.removeDuplicates(filterIds.slice(0));

        for (let i = 0; i < filterIds.length; i += 1) {
            const filterId = filterIds[i];
            const filter = adguard.subscriptions.getFilter(filterId);
            if (!filter || !filter.installed) {
                continue;
            }

            adguard.console.debug('Uninstall filter {0}', filter.filterId);

            filter.enabled = false;
            filter.installed = false;
            adguard.listeners.notifyListeners(adguard.listeners.FILTER_ENABLE_DISABLE, filter);
            adguard.listeners.notifyListeners(adguard.listeners.FILTER_ADD_REMOVE, filter);
        }
    };

    /**
     * Removes filter
     *
     * @param {Number} filterId Filter identifier
     */
    const removeFilter = function (filterId) {
        const filter = adguard.subscriptions.getFilter(filterId);
        if (!filter || filter.removed) {
            return;
        }

        if (!filter.customUrl) {
            adguard.console.error('Filter {0} is not custom and could not be removed', filter.filterId);
            return;
        }

        adguard.console.debug('Remove filter {0}', filter.filterId);

        filter.enabled = false;
        filter.installed = false;
        filter.removed = true;
        adguard.listeners.notifyListeners(adguard.listeners.FILTER_ENABLE_DISABLE, filter);
        adguard.listeners.notifyListeners(adguard.listeners.FILTER_ADD_REMOVE, filter);
    };

    /**
     * Loads filter rules from url, then tries to parse header to filter metadata
     * and adds filter object to subscriptions from it.
     * These custom filters will have special attribute customUrl, from there it could be downloaded and updated.
     *
     * @param url custom url, there rules are
     * @param options object containing title of custom filter
     * @param successCallback
     * @param errorCallback
     */
    const loadCustomFilter = function (url, options, successCallback, errorCallback) {
        adguard.console.info('Downloading custom filter from {0}', url);

        if (!url) {
            errorCallback();
            return;
        }

        adguard.subscriptions.updateCustomFilter(url, options, (filterId) => {
            if (filterId) {
                adguard.console.info('Custom filter downloaded');

                const filter = adguard.subscriptions.getFilter(filterId);
                // In case filter is loaded again and was removed before
                delete filter.removed;
                successCallback(filter);
            } else {
                errorCallback();
            }
        });
    };

    const loadCustomFilterInfo = (url, options, successCallback, errorCallback) => {
        adguard.console.info(`Downloading custom filter info from ${url}`);
        if (!url) {
            errorCallback();
            return;
        }

        adguard.subscriptions.getCustomFilterInfo(url, options, (result = {}) => {
            const { error, filter } = result;
            if (filter) {
                adguard.console.info('Custom filter data downloaded');
                successCallback(filter);
                return;
            }
            errorCallback(error);
        });
    };

    return {

        start,
        stop,
        isInitialized,

        offerFilters,

        getEnabledFilters,

        isFilterEnabled,
        isFilterInstalled,

        checkFiltersUpdates,

        addAndEnableFilters,
        disableFilters,
        uninstallFilters,
        removeFilter,

        enableGroup,
        disableGroup,

        loadCustomFilter,
        loadCustomFilterInfo,
        getEnabledFiltersFromEnabledGroups,
    };
})(adguard);
