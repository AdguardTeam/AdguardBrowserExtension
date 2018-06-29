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

    /**
     * Represents filter metadata
     *
     * @param filterId Filter identifier
     * @constructor
     */
    var AdguardFilter = function (filterId) {
        this.filterId = filterId;
        this.name = null;
        this.description = null;
        this.version = null;
        this.lastUpdateTime = null;
        this.lastCheckTime = null;
        this.enabled = false;
    };

    // List of filters
    var adguardFilters = [];

    // Request filter contains all filter rules
    // This class does the actual filtering (checking URLs, constructing CSS/JS to inject, etc)
    var requestFilter = new adguard.RequestFilter();

    // Service is not initialized yet
    var requestFilterInitTime = 0;

    // Application is running flag
    var applicationRunning = false;

    // Application initialized flag (Sets on first call of 'start' method)
    var applicationInitialized = false;

    /**
     * Period for filters update check -- 48 hours
     */
    var UPDATE_FILTERS_PERIOD = 48 * 60 * 60 * 1000;

    /**
     * Delay before doing first filters update check -- 5 minutes
     */
    var UPDATE_FILTERS_DELAY = 5 * 60 * 1000;

    var FILTERS_CHANGE_DEBOUNCE_PERIOD = 1000;
    var RELOAD_FILTERS_DEBOUNCE_PERIOD = 1000;

    /**
     * List of events which cause RequestFilter re-creation
     * @type {Array}
     */
    var UPDATE_REQUEST_FILTER_EVENTS = [adguard.listeners.UPDATE_FILTER_RULES, adguard.listeners.FILTER_ENABLE_DISABLE];

    var isUpdateRequestFilterEvent = function (el) {
        return UPDATE_REQUEST_FILTER_EVENTS.indexOf(el.event) >= 0;
    };

    /**
     * List of events which cause saving filter rules to the rules storage
     * @type {Array}
     */
    var SAVE_FILTER_RULES_TO_STORAGE_EVENTS = [adguard.listeners.UPDATE_FILTER_RULES, adguard.listeners.ADD_RULES, adguard.listeners.REMOVE_RULE];

    var isSaveRulesToStorageEvent = function (el) {
        return SAVE_FILTER_RULES_TO_STORAGE_EVENTS.indexOf(el.event) >= 0;
    };

    /**
     * Persist state of content blocker
     */
    var contentBlockerInfo = {
        rulesCount: 0,
        rulesOverLimit: false
    };

    var reloadedRules = false;

    /**
     * AntiBannerService initialize method. Process install, update or simple run.
     * @param options Constructor options
     * @param callback
     */
    function initialize(options, callback) {

        /**
         * This method is called when filter subscriptions have been loaded from remote server.
         * It is used to recreate RequestFilter object.
         */
        var initRequestFilter = function () {
            loadFiltersVersionAndStateInfo();
            createRequestFilter(function () {
                addFiltersChangeEventListener();
                callback();
            });
        };

        /**
         * Callback for subscriptions loaded event
         */
        var onSubscriptionLoaded = function (runInfo) {

            // Initialize filters list
            adguardFilters = getAllAdguardFilters();

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
        adguard.applicationUpdateService.getRunInfo(function (runInfo) {
            // Load subscription from the storage
            adguard.subscriptions.init(onSubscriptionLoaded.bind(null, runInfo));
        });
    }

    /**
     * Initialize application (process install or update) . Create and start request filter
     * @param options
     * @param callback
     */
    var start = function (options, callback) {

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
    var stop = function () {
        applicationRunning = false;
        requestFilter = new adguard.RequestFilter();
        adguard.listeners.notifyListeners(adguard.listeners.REQUEST_FILTER_UPDATED, getRequestFilterInfo());
    };

    /**
     * Checks application has been initialized
     * @returns {boolean}
     */
    var isInitialized = function () {
        return applicationInitialized;
    };

    /**
     * Getter for request filter
     */
    var getRequestFilter = function () {
        return requestFilter;
    };

    /**
     * Loads filter from storage (if in extension package) or from backend
     *
     * @param filterId Filter identifier
     * @param callback Called when operation is finished
     */
    var addAntiBannerFilter = function (filterId, callback) {

        var filter = getFilterById(filterId);
        if (filter.installed) {
            callback(true);
            return;
        }

        var onFilterLoaded = function (success) {
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
         * TODO: when we want to load filter from backend, we should retrieve metadata from backend too, but not from local file.
         */
        var filterMetadata = adguard.subscriptions.getFilterMetadata(filterId);
        loadFilterRules(filterMetadata, false, onFilterLoaded);
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
     * Select filters for update. It depends on the time of last update.
     * @param forceUpdate Force update flag.
     * @returns {Array}
     */
    function selectFilterIdsToUpdate(forceUpdate) {
        var filterIds = [];
        for (var i = 0; i < adguardFilters.length; i++) {
            var filter = adguardFilters[i];
            if (filter.installed &&
                filter.filterId != adguard.utils.filters.USER_FILTER_ID &&
                filter.filterId != adguard.utils.filters.WHITE_LIST_FILTER_ID) {
                // Check filters update period (or forceUpdate flag)
                var needUpdate = forceUpdate || (!filter.lastCheckTime || (Date.now() - filter.lastCheckTime) >= UPDATE_FILTERS_PERIOD);
                if (needUpdate) {
                    filterIds.push(filter.filterId);
                }
            }
        }
        return filterIds;
    }

    /**
     * Checks filters updates.
     *
     * @param forceUpdate Normally we respect filter update period. But if this parameter is
     *                    true - we ignore it and check updates for all filters.
     * @param successCallback Called if filters were updated successfully
     * @param errorCallback Called if something gone wrong
     */
    var checkAntiBannerFiltersUpdate = function (forceUpdate, successCallback, errorCallback) {

        successCallback = successCallback || function () {
            // Empty callback
        };
        errorCallback = errorCallback || function () {
            // Empty callback
        };

        // Don't update in background if request filter isn't running
        if (!forceUpdate && !applicationRunning) {
            return;
        }

        adguard.console.info("Start checking filters updates");

        // Select filters for update
        var filterIdsToUpdate = selectFilterIdsToUpdate(forceUpdate);

        if (filterIdsToUpdate.length === 0) {
            if (successCallback) {
                successCallback([]);
                return;
            }
        }

        adguard.console.info("Checking updates for {0} filters", filterIdsToUpdate.length);

        // Load filters with changed version
        var loadFiltersFromBackendCallback = function (filterMetadataList) {
            loadFiltersFromBackend(filterMetadataList, function (success, filterIds) {
                if (success) {
                    var filters = [];
                    for (var i = 0; i < filterIds.length; i++) {
                        var filterId = filterIds[i];
                        if (filterId != adguard.utils.filters.SEARCH_AND_SELF_PROMO_FILTER_ID) {
                            filters.push(getFilterById(filterId));
                        }
                    }
                    successCallback(filters);
                } else {
                    errorCallback();
                }
            });
        };

        // Method is called after we have got server response
        // Now we check filters version and update filter if needed
        var onLoadFilterMetadataList = function (sucess, filterMetadataList) {
            if (sucess) {
                var filterMetadataListToUpdate = [];
                for (var i = 0; i < filterMetadataList.length; i++) {
                    var filterMetadata = filterMetadataList[i];
                    var filter = getFilterById(filterMetadata.filterId);
                    if (filterMetadata.version !== null && adguard.utils.browser.isGreaterVersion(filterMetadata.version, filter.version)) {
                        adguard.console.info("Updating filter {0} to version {1}", filter.filterId, filterMetadata.version);
                        filterMetadataListToUpdate.push(filterMetadata);
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
     * Resets all filters versions
     */
    function resetFiltersVersion() {
        var RESET_VERSION = "0.0.0.0";
        for (var i = 0; i < adguardFilters.length; i++) {
            adguardFilters[i].version = RESET_VERSION;
        }
    }

    /**
     * Creates adguard filter object
     * @param filterMetadata Filter metadata
     * @returns {AdguardFilter}
     */
    function createAdguardFilter(filterMetadata) {
        var filter = new AdguardFilter(filterMetadata.filterId);
        var groupMetadata = adguard.subscriptions.getGroupMetadata(filterMetadata.groupId);
        var displayNumber = filterMetadata.displayNumber;
        if (groupMetadata) {
            displayNumber += 0x0000 | (groupMetadata.displayNumber << 8)
        }
        filter.name = filterMetadata.name || '';
        filter.description = filterMetadata.description || 0;
        filter.displayNumber = displayNumber;
        return filter;
    }

    /**
     * Returns all filters with their metadata
     * @private
     */
    function getAllAdguardFilters() {

        var filters = [];
        var filtersMetadata = adguard.subscriptions.getFilters();
        for (var i = 0; i < filtersMetadata.length; i++) {
            var filterMetadata = filtersMetadata[i];
            filters.push(createAdguardFilter(filterMetadata));
        }

        // Add synthetic user and whitelist filters
        filters.push(createAdguardFilter({filterId: adguard.utils.filters.USER_FILTER_ID}));
        filters.push(createAdguardFilter({filterId: adguard.utils.filters.WHITE_LIST_FILTER_ID}));

        filters.sort(function (f1, f2) {
            return f1.displayNumber - f2.displayNumber;
        });

        return filters;
    }

    /**
     * Updates filters version and state info.
     * Loads this data from the storage and then updates "adguardFilters" property of the AntiBannerService instance.
     *
     * @private
     */
    function loadFiltersVersionAndStateInfo() {

        // Define it here: for jshint to cool down
        var filter = null;

        // Load filters metadata from the storage
        var filtersVersionInfo = adguard.filtersState.getFiltersVersion();
        for (var i = 0; i < adguardFilters.length; i++) {
            filter = adguardFilters[i];
            var versionInfo = filtersVersionInfo[filter.filterId];
            if (versionInfo) {
                filter.version = versionInfo.version;
                filter.lastCheckTime = versionInfo.lastCheckTime;
                filter.lastUpdateTime = versionInfo.lastUpdateTime;
            }
        }

        // Load filters state from the storage
        var filtersStateInfo = adguard.filtersState.getFiltersState();
        for (i = 0; i < adguardFilters.length; i++) {
            filter = adguardFilters[i];
            var stateInfo = filtersStateInfo[filter.filterId];
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

        var start = new Date().getTime();

        // We create filter rules using chunks of the specified length
        // We are doing this for FF as everything in FF is done on the UI thread
        // Request filter creation is rather slow operation so we should
        // use setTimeout calls to give UI thread some time.
        var async = adguard.prefs.speedupStartup() || false;
        var asyncStep = 1000;
        adguard.console.info('Starting request filter initialization. Async={0}', async);

        // Empty request filter
        var newRequestFilter = new adguard.RequestFilter();

        if (requestFilterInitTime === 0) {
            // Setting the time of request filter very first initialization
            requestFilterInitTime = new Date().getTime();
            adguard.listeners.notifyListeners(adguard.listeners.APPLICATION_INITIALIZED);
        }

        // Supplement object to make sure that we use only unique filter rules
        var uniqueRules = Object.create(null);

        /**
         * Checks rulesFilterMap is empty (no one of filters are enabled)
         * @param rulesFilterMap
         * @returns {boolean}
         */
        function isEmptyRulesFilterMap(rulesFilterMap) {

            var enabledFilterIds = Object.keys(rulesFilterMap);
            if (enabledFilterIds.length === 0) {
                return true;
            }

            // User filter is enabled by default, but it may not contain any rules
            var userFilterId = adguard.utils.filters.USER_FILTER_ID;
            if (enabledFilterIds.length === 1 && enabledFilterIds[0] == userFilterId) {
                var userRules = rulesFilterMap[userFilterId];
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
        var requestFilterInitialized = function () {

            // Request filter is ready
            requestFilter = newRequestFilter;

            if (callback && typeof callback === "function") {
                callback();
            }

            adguard.listeners.notifyListeners(adguard.listeners.REQUEST_FILTER_UPDATED, getRequestFilterInfo());
            adguard.console.info("Finished request filter initialization in {0} ms. Rules count: {1}", (new Date().getTime() - start), newRequestFilter.rulesCount);

            /**
             * If no one of filters is enabled, don't reload rules
             */
            if (isEmptyRulesFilterMap(rulesFilterMap)) {
                return;
            }

            if (newRequestFilter.rulesCount === 0 && !reloadedRules) {
                //https://github.com/AdguardTeam/AdguardBrowserExtension/issues/205
                adguard.console.info("No rules have been found - checking filter updates");
                reloadAntiBannerFilters();
                reloadedRules = true;
            } else if (newRequestFilter.rulesCount > 0 && reloadedRules) {
                adguard.console.info("Filters reloaded, deleting reloadRules flag");
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
        var addRules = function (filterId, rulesTexts, startIdx, endIdx) {
            if (!rulesTexts) {
                return;
            }

            for (var i = startIdx; i < rulesTexts.length && i < endIdx; i++) {
                var ruleText = rulesTexts[i];
                if (ruleText in uniqueRules) {
                    // Do not allow duplicates
                    continue;
                }
                uniqueRules[ruleText] = true;
                var rule = adguard.rules.builder.createRule(ruleText, filterId);

                if (rule !== null) {
                    newRequestFilter.addRule(rule);
                }
            }
        };

        /**
         * Asyncronously adds rules to the request filter.
         */
        var addRulesAsync = function (filterId, rulesTexts, startIdx, stopIdx, prevDfd) {

            var dfd = new adguard.utils.Promise();

            prevDfd.then(function () {
                setTimeout(function () {
                    addRules(filterId, rulesTexts, startIdx, stopIdx);
                    dfd.resolve();
                }, 1);
            });

            return dfd;
        };

        /**
         * Asynchronously fills request filter with rules.
         */
        var fillRequestFilterAsync = function () {
            // Async loading starts when we resolve this promise
            var rootDfd = new adguard.utils.Promise();
            var prevDfd = null;
            var dfds = [];

            // Go through all filters in the map
            for (var filterId in rulesFilterMap) { // jshint ignore:line
                // To number
                filterId = filterId - 0;
                if (filterId != adguard.utils.filters.USER_FILTER_ID) {
                    var rulesTexts = rulesFilterMap[filterId];

                    for (var i = 0; i < rulesTexts.length; i += asyncStep) {
                        prevDfd = addRulesAsync(filterId, rulesTexts, i, i + asyncStep, prevDfd || rootDfd);
                        dfds.push(prevDfd);
                    }
                }
            }

            // User filter should be the last
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/117
            var userRules = rulesFilterMap[adguard.utils.filters.USER_FILTER_ID];
            addRulesAsync(adguard.utils.filters.USER_FILTER_ID, userRules, 0, userRules.length, prevDfd || rootDfd);

            adguard.utils.Promise.all(dfds).then(function () {
                requestFilterInitialized();
            });

            // Start execution
            rootDfd.resolve();
        };

        /**
         * Synchronously fills request filter with rules
         */
        var fillRequestFilterSync = function () {

            // Go through all filters in the map
            for (var filterId in rulesFilterMap) { // jshint ignore:line

                // To number
                filterId = filterId - 0;
                if (filterId != adguard.utils.filters.USER_FILTER_ID) {
                    var rulesTexts = rulesFilterMap[filterId];
                    addRules(filterId, rulesTexts, 0, rulesTexts.length);
                }
            }

            // User filter should be the last
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/117
            var userRules = rulesFilterMap[adguard.utils.filters.USER_FILTER_ID];
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

        var start = new Date().getTime();
        adguard.console.info('Starting loading filter rules from the storage');

        // Prepare map for filter rules
        // Map key is filter ID
        // Map value is array with filter rules
        var rulesFilterMap = Object.create(null);

        /**
         * STEP 2: Called when all filter rules have been loaded from storage
         */
        var loadAllFilterRulesDone = function () {
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
        var loadFilterRulesFromStorage = function (filterId, rulesFilterMap) {
            var dfd = new adguard.utils.Promise();

            adguard.rulesStorage.read(filterId, function (rulesText) {
                if (rulesText) {
                    rulesFilterMap[filterId] = rulesText;
                }
                dfd.resolve();
            });

            return dfd;
        };

        /**
         * STEP 1: load all filters from the storage.
         */
        var loadFilterRules = function () {
            var dfds = [];
            for (var i = 0; i < adguardFilters.length; i++) {
                var filter = adguardFilters[i];
                if (filter.enabled) {
                    dfds.push(loadFilterRulesFromStorage(filter.filterId, rulesFilterMap));
                }
            }
            dfds.push(loadUserRulesToRequestFilter(rulesFilterMap));

            // Load all filters and then recreate request filter
            adguard.utils.Promise.all(dfds).then(loadAllFilterRulesDone);
        };

        loadFilterRules();
    }

    /**
     * Adds user rules (got from the storage) to request filter
     *
     * @param rulesFilterMap Map for loading rules
     * @returns {*} Deferred object
     * @private
     */
    function loadUserRulesToRequestFilter(rulesFilterMap) {

        var dfd = new adguard.utils.Promise();

        var filterId = adguard.utils.filters.USER_FILTER_ID;
        adguard.rulesStorage.read(filterId, function (rulesText) {

            adguard.userrules.setRules(rulesText || []);

            if (!rulesText) {
                dfd.resolve();
                return;
            }

            rulesFilterMap[filterId] = rulesText;
            dfd.resolve();
        });

        return dfd;
    }

    /**
     * Request Filter info
     */
    var getRequestFilterInfo = function () {
        var rulesCount = 0;
        if (requestFilter) {
            rulesCount = requestFilter.rulesCount;
        }
        return {
            rulesCount: rulesCount
        };
    };

    /**
     * Update content blocker info
     * We save state of content blocker for properly show in options page (converted rules count and over limit flag)
     * @param info Content blocker info
     */
    var updateContentBlockerInfo = function (info) {
        contentBlockerInfo.rulesCount = info.rulesCount;
        contentBlockerInfo.rulesOverLimit = info.rulesOverLimit;
    };

    /**
     * Content Blocker info
     */
    var getContentBlockerInfo = function () {
        return contentBlockerInfo;
    };

    /**
     * Adds event listener for filters changes.
     * If filter is somehow changed this method checks if we should save changes to the storage
     * and if we should recreate RequestFilter.
     *
     * @private
     */
    function addFiltersChangeEventListener() {

        var filterEventsHistory = [];
        var onFilterChangeTimeout = null;

        var processFilterEvent = function (event, filter, rules) {

            filterEventsHistory.push({event: event, filter: filter, rules: rules});

            if (onFilterChangeTimeout !== null) {
                clearTimeout(onFilterChangeTimeout);
            }

            onFilterChangeTimeout = setTimeout(function () {

                var filterEvents = filterEventsHistory.slice(0);
                filterEventsHistory = [];
                onFilterChangeTimeout = null;

                var needCreateRequestFilter = filterEvents.some(isUpdateRequestFilterEvent);

                // Split by filterId
                var eventsByFilter = Object.create(null);
                for (var i = 0; i < filterEvents.length; i++) {
                    var filterEvent = filterEvents[i];
                    if (!(filterEvent.filter.filterId in eventsByFilter)) {
                        eventsByFilter[filterEvent.filter.filterId] = [];
                    }
                    eventsByFilter[filterEvent.filter.filterId].push(filterEvent);
                }

                var dfds = [];
                for (var filterId in eventsByFilter) { // jshint ignore:line
                    var needSaveRulesToStorage = eventsByFilter[filterId].some(isSaveRulesToStorageEvent);
                    if (!needSaveRulesToStorage) {
                        continue;
                    }
                    var dfd = processSaveFilterRulesToStorageEvents(filterId, eventsByFilter[filterId]);
                    dfds.push(dfd);
                }

                if (needCreateRequestFilter) {
                    // Rules will be added to request filter lazy, listeners will be notified about REQUEST_FILTER_UPDATED later
                    adguard.utils.Promise.all(dfds).then(createRequestFilter);
                } else {
                    // Rules are already in request filter, notify listeners
                    adguard.listeners.notifyListeners(adguard.listeners.REQUEST_FILTER_UPDATED, getRequestFilterInfo());
                }

            }, FILTERS_CHANGE_DEBOUNCE_PERIOD);

        };

        adguard.listeners.addListener(function (event, filter, rules) {
            switch (event) {
                case adguard.listeners.ADD_RULES:
                case adguard.listeners.REMOVE_RULE:
                case adguard.listeners.UPDATE_FILTER_RULES:
                case adguard.listeners.FILTER_ENABLE_DISABLE:
                    processFilterEvent(event, filter, rules);
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

        var dfd = new adguard.utils.Promise();

        adguard.rulesStorage.read(filterId, function (loadedRulesText) {

            for (var i = 0; i < events.length; i++) {

                if (!loadedRulesText) {
                    loadedRulesText = [];
                }

                var event = events[i];
                var eventType = event.event;
                var eventRules = event.rules;

                switch (eventType) {
                    case adguard.listeners.ADD_RULES:
                        loadedRulesText = loadedRulesText.concat(eventRules);
                        adguard.console.debug("Add {0} rules to filter {1}", eventRules.length, filterId);
                        break;
                    case adguard.listeners.REMOVE_RULE:
                        var actionRule = eventRules[0];
                        adguard.utils.collections.removeAll(loadedRulesText, actionRule);
                        adguard.console.debug("Remove {0} rule from filter {1}", actionRule, filterId);
                        break;
                    case adguard.listeners.UPDATE_FILTER_RULES:
                        loadedRulesText = eventRules;
                        adguard.console.debug("Update filter {0} rules count to {1}", filterId, eventRules.length);
                        break;
                }
            }

            adguard.console.debug("Save {0} rules to filter {1}", loadedRulesText.length, filterId);
            adguard.rulesStorage.write(filterId, loadedRulesText, dfd.resolve);

        });

        return dfd;
    }

    /**
     * Subscribe to events which lead to filters update.
     * @private
     */
    function subscribeToFiltersChangeEvents() {

        // on USE_OPTIMIZED_FILTERS setting change we need to reload filters
        var onUsedOptimizedFiltersChange = adguard.utils.concurrent.debounce(reloadAntiBannerFilters, RELOAD_FILTERS_DEBOUNCE_PERIOD);

        adguard.settings.onUpdated.addListener(function (setting) {
            if (setting === adguard.settings.USE_OPTIMIZED_FILTERS) {
                onUsedOptimizedFiltersChange();
                return;
            }
            if (setting === adguard.settings.DISABLE_COLLECT_HITS) {
                getRequestFilter().cssFilter.dirty = true;
            }
        });
    }

    /**
     * Schedules filters update job
     *
     * @param isFirstRun App first run flag
     * @private
     */
    function scheduleFiltersUpdate(isFirstRun) {

        // First run delay
        setTimeout(checkAntiBannerFiltersUpdate, UPDATE_FILTERS_DELAY, isFirstRun === true);

        // Scheduling job
        var scheduleUpdate = function () {
            setTimeout(function () {
                try {
                    checkAntiBannerFiltersUpdate();
                } catch (ex) {
                    adguard.console.error("Error update filters, cause {0}", ex);
                }
                scheduleUpdate();
            }, UPDATE_FILTERS_PERIOD);
        };

        scheduleUpdate();
    }

    /**
     * Gets filter by ID.
     * Throws exception if filter not found.
     *
     * @param filterId Filter identifier
     * @returns {*} Filter got from "adguardFilters" property.
     * @private
     */
    function getFilterById(filterId) {
        for (var i = 0; i < adguardFilters.length; i++) {
            var adguardFilter = adguardFilters[i];
            if (adguardFilter.filterId == filterId) {
                return adguardFilter;
            }
        }
        throw 'Filter with id ' + filterId + ' not found';
    }

    /**
     * Loads filters (ony-by-one) from the remote server
     *
     * @param filterMetadataList List of filter metadata to load
     * @param callback Called when filters have been loaded
     * @private
     */
    function loadFiltersFromBackend(filterMetadataList, callback) {

        var dfds = [];
        var loadedFilters = [];

        filterMetadataList.forEach(function (filterMetadata) {
            var dfd = new adguard.utils.Promise();
            dfds.push(dfd);

            loadFilterRules(filterMetadata, true, function (success) {
                if (!success) {
                    dfd.reject();
                    return;
                }

                loadedFilters.push(filterMetadata.filterId);
                dfd.resolve();
            });
        });

        adguard.utils.Promise.all(dfds).then(function () {
            callback(true, loadedFilters);
        }, function () {
            callback(false);
        });
    }

    /**
     * Loads filter rules
     *
     * @param filterMetadata Filter metadata
     * @param forceRemote Force download filter rules from remote server (if false try to download local copy of rules if it's possible)
     * @param callback Called when filter rules have been loaded
     * @private
     */
    function loadFilterRules(filterMetadata, forceRemote, callback) {

        var filter = getFilterById(filterMetadata.filterId);

        filter._isDownloading = true;
        adguard.listeners.notifyListeners(adguard.listeners.START_DOWNLOAD_FILTER, filter);

        var successCallback = function (filterRules) {
            adguard.console.info("Retrieved response from server for filter {0}, rules count: {1}", filter.filterId, filterRules.length);
            delete filter._isDownloading;
            filter.version = filterMetadata.version;
            filter.lastUpdateTime = filterMetadata.timeUpdated;
            filter.lastCheckTime = Date.now();
            filter.loaded = true;
            //notify listeners
            adguard.listeners.notifyListeners(adguard.listeners.SUCCESS_DOWNLOAD_FILTER, filter);
            adguard.listeners.notifyListeners(adguard.listeners.UPDATE_FILTER_RULES, filter, filterRules);
            callback(true);
        };

        var errorCallback = function (cause) {
            adguard.console.error("Error retrieved response from server for filter {0}, cause: {1}", filter.filterId, cause || "");
            delete filter._isDownloading;
            adguard.listeners.notifyListeners(adguard.listeners.ERROR_DOWNLOAD_FILTER, filter);
            callback(false);
        };

        adguard.backend.loadFilterRules(filter.filterId, forceRemote, adguard.settings.isUseOptimizedFiltersEnabled(), successCallback, errorCallback);
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

        var loadSuccess = function (filterMetadataList) {
            adguard.console.debug("Retrieved response from server for {0} filters, result: {1} metadata", filterIds.length, filterMetadataList.length);
            callback(true, filterMetadataList);
        };

        var loadError = function (request, cause) {
            adguard.console.error("Error retrieved response from server for filters {0}, cause: {1} {2}", filterIds, request.statusText, cause || "");
            callback(false);
        };

        adguard.backend.loadFiltersMetadata(filterIds, loadSuccess, loadError);
    }

    /**
     * Get filter by id
     * @param filterId
     * @returns {*}
     */
    var getAntiBannerFilterById = function (filterId) {
        return getFilterById(filterId);
    };

    /**
     * Get antibanner filters (includes states and versions)
     * @returns {Array}
     */
    var getAntiBannerFilters = function () {
        return adguardFilters;
    };

    /**
     * Get request filter initialization time
     * @returns {number}
     */
    var getRequestFilterInitTime = function () {
        return requestFilterInitTime;
    };

    /**
     * Add rules to filter
     * @param filterId
     * @param rulesText
     * @returns {Array}
     */
    var addFilterRules = function (filterId, rulesText) {
        var rules = [];
        for (var i = 0; i < rulesText.length; i++) {
            var rule = adguard.rules.builder.createRule(rulesText[i], filterId);
            if (rule !== null) {
                rules.push(rule);
            }
        }
        var filter = getFilterById(filterId);
        requestFilter.addRules(rules);
        adguard.listeners.notifyListeners(adguard.listeners.ADD_RULES, filter, rulesText);
        if (filterId === adguard.utils.filters.USER_FILTER_ID) {
            adguard.listeners.notifyListeners(adguard.listeners.UPDATE_USER_FILTER_RULES, getRequestFilterInfo());
        }
        return rules;
    };

    /**
     * Remove rule from filter
     * @param filterId
     * @param ruleText
     */
    var removeFilterRule = function (filterId, ruleText) {
        var rule = adguard.rules.builder.createRule(ruleText, filterId);
        if (rule !== null) {
            requestFilter.removeRule(rule);
        }
        var filter = getFilterById(filterId);
        adguard.listeners.notifyListeners(adguard.listeners.REMOVE_RULE, filter, [ruleText]);
        if (filterId === adguard.utils.filters.USER_FILTER_ID) {
            adguard.listeners.notifyListeners(adguard.listeners.UPDATE_USER_FILTER_RULES, getRequestFilterInfo());
        }
    };

    /**
     * Clear filter rules
     * @param filterId
     */
    var clearFilterRules = function (filterId) {
        var filter = getFilterById(filterId);
        adguard.listeners.notifyListeners(adguard.listeners.UPDATE_FILTER_RULES, filter, []);
        if (filterId === adguard.utils.filters.USER_FILTER_ID) {
            adguard.listeners.notifyListeners(adguard.listeners.UPDATE_USER_FILTER_RULES, getRequestFilterInfo());
        }
    };

    return {

        start: start,
        stop: stop,
        isInitialized: isInitialized,

        getAntiBannerFilterById: getAntiBannerFilterById,
        getAntiBannerFilters: getAntiBannerFilters,
        addAntiBannerFilter: addAntiBannerFilter,

        getRequestFilter: getRequestFilter,
        getRequestFilterInitTime: getRequestFilterInitTime,

        addFilterRules: addFilterRules,
        removeFilterRule: removeFilterRule,
        clearFilterRules: clearFilterRules,

        getRequestFilterInfo: getRequestFilterInfo,
        updateContentBlockerInfo: updateContentBlockerInfo,
        getContentBlockerInfo: getContentBlockerInfo,

        checkAntiBannerFiltersUpdate: checkAntiBannerFiltersUpdate
    };

})(adguard);

/**
 * Api for filtering and elements hiding.
 */
adguard.requestFilter = (function (adguard) {

    'use strict';

    var antiBannerService = adguard.antiBannerService;

    function getRequestFilter() {
        return antiBannerService.getRequestFilter();
    }

    /**
     * @returns boolean true when request filter was initialized first time
     */
    var isReady = function () {
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
    var shouldCollapseAllElements = function () {
        // We assume that if content script is requesting CSS in first 5 seconds after request filter init,
        // then it is possible, that we've missed some elements and now we should collapse these elements
        var requestFilterInitTime = antiBannerService.getRequestFilterInitTime();
        return (requestFilterInitTime > 0) && (requestFilterInitTime + 5000 > new Date().getTime());
    };

    var getRules = function () {
        return getRequestFilter().getRules();
    };
    var findRuleForRequest = function (requestUrl, documentUrl, requestType, documentWhitelistRule) {
        return getRequestFilter().findRuleForRequest(requestUrl, documentUrl, requestType, documentWhitelistRule);
    };
    var findWhiteListRule = function (requestUrl, referrer, requestType) {
        return getRequestFilter().findWhiteListRule(requestUrl, referrer, requestType);
    };

    var getSelectorsForUrl = function (documentUrl, genericHideFlag) {
        return getRequestFilter().getSelectorsForUrl(documentUrl, genericHideFlag);
    };
    var getInjectedSelectorsForUrl = function (documentUrl, genericHideFlag) {
        return getRequestFilter().getInjectedSelectorsForUrl(documentUrl, genericHideFlag);
    };
    var getScriptsForUrl = function (documentUrl) {
        return getRequestFilter().getScriptsForUrl(documentUrl);
    };
    var getScriptsStringForUrl = function (documentUrl) {
        return getRequestFilter().getScriptsStringForUrl(documentUrl);
    };
    var getContentRulesForUrl = function (documentUrl) {
        return getRequestFilter().getContentRulesForUrl(documentUrl);
    };

    var getMatchedElementsForContentRules = function (doc, rules) {
        return getRequestFilter().getMatchedElementsForContentRules(doc, rules);
    };

    var getCspRules = function (requestUrl, referrer, requestType) {
        return getRequestFilter().findCspRules(requestUrl, referrer, requestType);
    };

    var getRequestFilterInfo = function () {
        return antiBannerService.getRequestFilterInfo();
    };
    var updateContentBlockerInfo = function (info) {
        return antiBannerService.updateContentBlockerInfo(info);
    };
    var getContentBlockerInfo = function () {
        return antiBannerService.getContentBlockerInfo();
    };

    return {

        isReady: isReady,
        shouldCollapseAllElements: shouldCollapseAllElements,

        getRules: getRules,
        findRuleForRequest: findRuleForRequest,
        findWhiteListRule: findWhiteListRule,

        getSelectorsForUrl: getSelectorsForUrl,
        getInjectedSelectorsForUrl: getInjectedSelectorsForUrl,
        getScriptsForUrl: getScriptsForUrl,
        getScriptsStringForUrl: getScriptsStringForUrl,
        getContentRulesForUrl: getContentRulesForUrl,
        getMatchedElementsForContentRules: getMatchedElementsForContentRules,
        getCspRules: getCspRules,

        getRequestFilterInfo: getRequestFilterInfo,
        updateContentBlockerInfo: updateContentBlockerInfo,
        getContentBlockerInfo: getContentBlockerInfo
    };

})(adguard);

/**
 * Helper class for working with filters metadata storage (local storage)
 */
adguard.filtersState = (function (adguard) {

    var FILTERS_STATE_PROP = 'filters-state';
    var FILTERS_VERSION_PROP = 'filters-version';

    /**
     * Gets filter version from the local storage
     * @returns {*}
     */
    var getFiltersVersion = function () {
        var filters = Object.create(null);
        try {
            var json = adguard.localStorage.getItem(FILTERS_VERSION_PROP);
            if (json) {
                filters = JSON.parse(json);
            }
        } catch (ex) {
            adguard.console.error("Error retrieve filters version info, cause {0}", ex);
        }
        return filters;
    };

    /**
     * Gets filters state from the local storage
     * @returns {*}
     */
    var getFiltersState = function () {
        var filters = Object.create(null);
        try {
            var json = adguard.localStorage.getItem(FILTERS_STATE_PROP);
            if (json) {
                filters = JSON.parse(json);
            }
        } catch (ex) {
            adguard.console.error("Error retrieve filters state info, cause {0}", ex);
        }
        return filters;
    };

    /**
     * Updates filter version in the local storage
     *
     * @param filter Filter version metadata
     */
    var updateFilterVersion = function (filter) {
        var filters = getFiltersVersion();
        filters[filter.filterId] = {
            version: filter.version,
            lastCheckTime: filter.lastCheckTime,
            lastUpdateTime: filter.lastUpdateTime
        };
        adguard.localStorage.setItem(FILTERS_VERSION_PROP, JSON.stringify(filters));
    };

    /**
     * Updates filter state in the local storage
     *
     * @param filter Filter state object
     */
    var updateFilterState = function (filter) {
        var filters = getFiltersState();
        filters[filter.filterId] = {
            loaded: filter.loaded,
            enabled: filter.enabled,
            installed: filter.installed
        };
        adguard.localStorage.setItem(FILTERS_STATE_PROP, JSON.stringify(filters));
    };

    // Add event listener to persist filter metadata to local storage
    adguard.listeners.addListener(function (event, filter) {
        switch (event) {
            case adguard.listeners.SUCCESS_DOWNLOAD_FILTER:
                updateFilterState(filter);
                updateFilterVersion(filter);
                break;
            case adguard.listeners.FILTER_ADD_REMOVE:
            case adguard.listeners.FILTER_ENABLE_DISABLE:
                updateFilterState(filter);
                break;
        }
    });

    return {
        getFiltersVersion: getFiltersVersion,
        getFiltersState: getFiltersState,
        // These methods are used only for migrate from old versions
        updateFilterVersion: updateFilterVersion,
        updateFilterState: updateFilterState
    };

})(adguard);

/**
 * Class for manage filters state (enable, disable, add, remove, check updates)
 * Also includes method for initializing
 */
adguard.filters = (function (adguard) {

    'use strict';

    var antiBannerService = adguard.antiBannerService;

    var start = function (options, callback) {
        antiBannerService.start(options, callback);
    };

    var stop = function (callback) {
        antiBannerService.stop();
        callback();
    };

    /**
     * Checks application has been initialized
     * @returns {boolean}
     */
    var isInitialized = function () {
        return antiBannerService.isInitialized();
    };

    /**
     * Offer filters on extension install, select default filters and filters by locale and country
     * @param callback
     */
    var offerFilters = function (callback) {

        // These filters are enabled by default
        var filterIds = [adguard.utils.filters.ENGLISH_FILTER_ID, adguard.utils.filters.SEARCH_AND_SELF_PROMO_FILTER_ID];

        // Get language-specific filters by user locale
        var localeFilterIds = adguard.subscriptions.getFilterIdsForLanguage(adguard.app.getLocale());
        filterIds = filterIds.concat(localeFilterIds);

        // Add safari filter for safari browser
        if (adguard.utils.browser.isSafariBrowser()) {
            filterIds.push(adguard.utils.filters.SAFARI_FILTER);
        }

        // Get language-specific filters by navigator languages
        // Get the 2 most commonly used languages
        var languages = adguard.utils.browser.getNavigatorLanguages(2);
        for (var i = 0; i < languages.length; i++) {
            localeFilterIds = adguard.subscriptions.getFilterIdsForLanguage(languages[i]);
            filterIds = filterIds.concat(localeFilterIds);
        }

        callback(filterIds);
    };

    /**
     * List of enabled filters.
     * User filter and whitelist filter are always enabled so they are excluded.
     *
     * @returns {Array} List of enabled filters
     */
    var getEnabledFilters = function () {
        return antiBannerService.getAntiBannerFilters().filter(function (f) {
            return f.installed && f.enabled &&
                f.filterId != adguard.utils.filters.USER_FILTER_ID &&
                f.filterId != adguard.utils.filters.WHITE_LIST_FILTER_ID;
        });
    };

    /**
     * Returns collection of filters for settings page.
     * Private filters (user filter, whitelist filter, useful ads filter) are excluded.
     *
     * @returns {Array} List of filters
     */
    var getFiltersForOptionsPage = function () {
        return antiBannerService.getAntiBannerFilters().filter(function (f) {
            return f.installed &&
                f.filterId != adguard.utils.filters.USER_FILTER_ID &&
                f.filterId != adguard.utils.filters.WHITE_LIST_FILTER_ID &&
                f.filterId != adguard.utils.filters.SEARCH_AND_SELF_PROMO_FILTER_ID;
        });
    };

    /**
     * Checks if specified filter is enabled
     *
     * @param filterId Filter identifier
     * @returns {*} true if enabled
     */
    var isFilterEnabled = function (filterId) {
        return antiBannerService.getAntiBannerFilterById(filterId).enabled;
    };

    /**
     * Checks if specified filter is installed (downloaded)
     *
     * @param filterId Filter id
     * @returns {*} true if installed
     */
    var isFilterInstalled = function (filterId) {
        return antiBannerService.getAntiBannerFilterById(filterId).installed;
    };

    var checkFiltersUpdates = function (successCallback, errorCallback) {
        return antiBannerService.checkAntiBannerFiltersUpdate(true, successCallback, errorCallback);
    };

    /**
     * Enable filter
     *
     * @param filterId Filter identifier
     * @returns {boolean} true if filter was enabled successfully
     */
    var enableFilter = function (filterId) {

        var filter = antiBannerService.getAntiBannerFilterById(filterId);
        if (filter.enabled || !filter.installed) {
            return false;
        }

        filter.enabled = true;
        adguard.listeners.notifyListeners(adguard.listeners.FILTER_ENABLE_DISABLE, filter);
        return true;
    };

    /**
     * Successively add filters from filterIds and then enable successfully added filters
     * @param filterIds Filter identifiers
     * @param callback We pass list of enabled filter identifiers to the callback
     */
    var addAndEnableFilters = function (filterIds, callback) {

        callback = callback || function () {
            // Empty callback
        };

        var enabledFilters = [];

        if (!filterIds || filterIds.length === 0) {
            callback(enabledFilters);
            return;
        }

        filterIds = adguard.utils.collections.removeDuplicates(filterIds.slice(0)); // Copy array to prevent parameter mutation

        var loadNextFilter = function () {
            if (filterIds.length === 0) {
                callback(enabledFilters);
            } else {
                var filterId = filterIds.shift();
                antiBannerService.addAntiBannerFilter(filterId, function (success) {
                    if (success) {
                        var changed = enableFilter(filterId);
                        if (changed) {
                            enabledFilters.push(antiBannerService.getAntiBannerFilterById(filterId));
                        }
                    }
                    loadNextFilter();
                });
            }
        };

        loadNextFilter();
    };

    /**
     * Disables filter by id
     *
     * @param filterId Filter identifier
     * @returns {boolean} true if filter was disabled successfully
     */
    var disableFilter = function (filterId) {

        var filter = antiBannerService.getAntiBannerFilterById(filterId);
        if (!filter.enabled || !filter.installed) {
            return false;
        }

        filter.enabled = false;
        adguard.listeners.notifyListeners(adguard.listeners.FILTER_ENABLE_DISABLE, filter);
        return true;
    };

    /**
     * Removes filter
     *
     * @param filterId Filter identifier
     * @returns {boolean} true if filter was removed successfully
     */
    var removeFilter = function (filterId) {

        var filter = antiBannerService.getAntiBannerFilterById(filterId);
        if (!filter.installed) {
            return false;
        }

        adguard.console.debug("Remove filter {0}", filter.filterId);

        filter.enabled = false;
        filter.installed = false;
        adguard.listeners.notifyListeners(adguard.listeners.FILTER_ENABLE_DISABLE, filter);
        adguard.listeners.notifyListeners(adguard.listeners.FILTER_ADD_REMOVE, filter);
        return true;
    };

    /**
     * This method is called from UI when user changes list of active filters
     * @param filterIds List of active filters identifiers
     */
    var onFiltersListChange = function (filterIds) {

        var filters = antiBannerService.getAntiBannerFilters();
        for (var i = 0; i < filters.length; i++) {
            var filterId = filters[i].filterId;
            // Skip acceptable ads filter
            if (filterId == adguard.utils.filters.SEARCH_AND_SELF_PROMO_FILTER_ID) {
                continue;
            }
            // Remove filter if it is not present in the new list
            if (filterIds.indexOf(filterId) < 0) {
                removeFilter(filterId);
            }
        }

        // Add and enable filters
        addAndEnableFilters(filterIds);
    };

    /**
     * Returns filter metadata by subscription url
     * @param subscriptionUrl - subscription url
     * @returns {*|T}
     */
    var findFilterMetadataBySubscriptionUrl = function (subscriptionUrl) {
        return adguard.subscriptions.getFilters().filter(function (f) {
            return f.subscriptionUrl === subscriptionUrl;
        })[0];
    };

    /**
     * Load rules to user filter by subscription url
     * @param subscriptionUrl
     * @param loadCallback
     */
    var processAbpSubscriptionUrl = function (subscriptionUrl, loadCallback) {

        var filterMetadata = findFilterMetadataBySubscriptionUrl(subscriptionUrl);

        if (filterMetadata) {

            var filter = antiBannerService.getAntiBannerFilterById(filterMetadata.filterId);
            addAndEnableFilters([filter.filterId]);

        } else {

            // Load filter rules
            adguard.backend.loadFilterRulesBySubscriptionUrl(subscriptionUrl, function (rulesText) {
                var rules = adguard.userrules.addRules(rulesText);
                loadCallback(rules.length);
            }, function (request, cause) {
                adguard.console.error("Error download subscription by url {0}, cause: {1}", subscriptionUrl, cause || "");
            });
        }
    };

    return {

        start: start,
        stop: stop,
        isInitialized: isInitialized,

        offerFilters: offerFilters,

        getEnabledFilters: getEnabledFilters,
        getFiltersForOptionsPage: getFiltersForOptionsPage,

        isFilterEnabled: isFilterEnabled,
        isFilterInstalled: isFilterInstalled,

        checkFiltersUpdates: checkFiltersUpdates,

        addAndEnableFilters: addAndEnableFilters,
        disableFilter: disableFilter,
        removeFilter: removeFilter,
        onFiltersListChange: onFiltersListChange,

        findFilterMetadataBySubscriptionUrl: findFilterMetadataBySubscriptionUrl,
        processAbpSubscriptionUrl: processAbpSubscriptionUrl
    };

})(adguard);