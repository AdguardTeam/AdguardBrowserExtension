/* global require, exports */
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
 * Initializing required libraries for this file.
 * require method is overridden in Chrome extension (port/require.js).
 */
var setTimeout = require('sdk/timers').setTimeout;
var clearTimeout = require('sdk/timers').clearTimeout;

var Promise = require('../../lib/utils/promises').Promise;
var ServiceClient = require('../../lib/utils/service-client').ServiceClient;
var RequestFilter = require('../../lib/filter/filters').RequestFilter;
var LocaleDetectService = require('../../lib/filter/locale-detect').LocaleDetectService;
var Log = require('../../lib/utils/log').Log;
var AntiBannerFiltersId = require('../../lib/utils/common').AntiBannerFiltersId;
var StringUtils = require('../../lib/utils/common').StringUtils;
var FilterUtils = require('../../lib/utils/common').FilterUtils;
var EventNotifierTypes = require('../../lib/utils/common').EventNotifierTypes;
var Utils = require('../../lib/utils/browser-utils').Utils;
var CollectionUtils = require('../../lib/utils/common').CollectionUtils;
var FilterStorage = require('../../lib/filter/storage').FilterStorage;
var userSettings = require('../../lib/utils/user-settings').userSettings;
var EventNotifier = require('../../lib/utils/notifier').EventNotifier;
var FilterRuleBuilder = require('../../lib/filter/rules/filter-rule-builder').FilterRuleBuilder;
var LS = require('../../lib/utils/local-storage').LS;
var Prefs = require('../../lib/prefs').Prefs;
var SubscriptionService = require('../../lib/filter/subscription').SubscriptionService;
var ApplicationUpdateService = require('../../lib/filter/update-service').ApplicationUpdateService;
var whiteListService = require('../../lib/filter/whitelist').whiteListService;
var UI = require('../../lib/ui').UI;

/**
 * Creating service that manages our filter rules.
 */
var AntiBannerService = exports.AntiBannerService = function () {
    // List of filters
    this.adguardFilters = [];

    // This object is used to communicate with out backend servers (mostly to get filter updates)
    this.serviceClient = new ServiceClient();

    // Request filter contains all filter rules
    // This class does the actual filtering (checking URLs, constructing CSS/JS to inject, etc)
    this.requestFilter = new RequestFilter();

    // Initialize service that detects webpage locale
    // Depending on the locale we can enable language-specific filter
    this.localeDetectorService = new LocaleDetectService(this._onFilterDetectedByLocale.bind(this));

    // Initialize service that manages filters subscriptions
    this.subscriptionService = new SubscriptionService();

    // Custom user rules
    this.userRules = [];

    // Retrieve filtering state
    this.applicationFilteringDisabled = userSettings.isFilteringDisabled();

    // Service is not initialized yet
    this._requestFilterInitTime = 0;
};

/**
 * Define AntiBannerService init methods
 */
AntiBannerService.prototype = {

    /**
     * Period for filters update check -- 48 hours
     */
    UPDATE_FILTERS_PERIOD: 48 * 60 * 60 * 1000,

    /**
     * Delay before doing first filters update check -- 5 minutes
     */
    UPDATE_FILTERS_DELAY: 5 * 60 * 1000,

    FILTERS_CHANGE_DEBOUNCE_PERIOD: 1000,
    RELOAD_FILTERS_DEBOUNCE_PERIOD: 1000,

    /**
     * Persist state of content blocker
     */
    contentBlockerInfo: {
        rulesCount: 0,
        rulesOverLimit: false
    },

    /**
     * AntiBannerService constructor
     * @param options Constructor options
     */
    init: function (options) {

        var context = this;

        /**
         * Init extension common info.
         * @type {{isFirstRun: boolean, isUpdate: (boolean|*), currentVersion: (exports.Prefs.version|*), prevVersion: *}}
         */
        var runInfo = ApplicationUpdateService.getRunInfo();

        /**
         * We need this wrapper for one and only purpose: to track install/update on the first run.
         * Then it just calls a callback from constructor parameters.
         */
        var onServiceInitialized = function (runInfo) {

            if (this._requestFilterInitTime === 0) {
                // Setting the time of request filter very first initialization
                this._requestFilterInitTime = new Date().getTime();                
            }

            if (options.runCallback) {
                options.runCallback(runInfo);
            }

            /**
             * Tracking extension install or update according to http://adguard.com/en/privacy.html#browsers
             * We do this with a single purpose: to know the number of unique installations of our extension.
             * This information is stored for 24 hours and then it is deleted.
             *
             * The only thing which is not deleted is the aggregated info: installs count and active users count.
             */
            if (runInfo.isFirstRun) {
                this.serviceClient.trackInstall(this.isAllowedAcceptableAds());
            }
        }.bind(this);

        /**
         * This method is called when filter subscriptions have been loaded from remote server.
         * It is used to recreate RequestFilter object.
         */
        var initRequestFilter = function () {
            context._loadFiltersVersionAndStateInfo();
            // init white list filter
            whiteListService.initWhiteListFilters();
            context._createRequestFilter(function () {
                this._addFiltersChangeEventListener();
                onServiceInitialized(runInfo);
            }.bind(this));
        }.bind(this);

        /**
         * Callback for subscriptions loaded event
         */
        var onSubscriptionLoaded = function () {

            // Initialize filters list
            this.adguardFilters = context._getAllAdguardFilters();

            // Set filters languages for locale detector.
            // Filters list got from the server may contain language mapping.
            // For instance "Dutch filter" linked to "nl" language code.
            // These mappings are then used by LocaleDetectorService to auto-enable language-specific filter.
            this.localeDetectorService.setFiltersLanguages(this.subscriptionService.getFiltersLanguages());

            // Subscribe to events which lead to update filters (e.g. switсh to optimized and back to default)
            this._subscribeToFiltersChangeEvents();

            if (runInfo.isFirstRun) {
                // Add event listener for filters change
                context._addFiltersChangeEventListener();
                // Run callback
                onServiceInitialized(runInfo);
            } else if (runInfo.isUpdate) {
                // Updating storage schema on extension update (if needed)
                ApplicationUpdateService.onUpdate(runInfo, initRequestFilter);
            } else {
                // Init RequestFilter object
                initRequestFilter();
            }

            // Schedule filters update job
            context._scheduleFiltersUpdate();

        }.bind(this);

        // Load subscription from the storage
        this.subscriptionService.init(onSubscriptionLoaded);
    },

    /**
     * Enable filters on extension install, select default filters and filters by locale and country
     * @param callback
     */
    initializeFiltersOnInstall: function (callback) {

        // These filters are enabled by default
        var filterIds = [AntiBannerFiltersId.ENGLISH_FILTER_ID, AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID];

        // Get language-specific filters by user locale
        var localeFilterIds = this.localeDetectorService.getFilterIdsForLanguage(Prefs.locale);
        filterIds = filterIds.concat(localeFilterIds);

        // Add safari filter for safari browser
        if (Utils.isSafariBrowser()) {
            filterIds.push(AntiBannerFiltersId.SAFARI_FILTER);
        }

        // This callback is used to activate language-specific filter after user's country is detected
        // Country detection is done on the server side.
        var onCountryDetected = function (countryCode) {
            var countryFilterIds = this.localeDetectorService.getFilterIdsForLanguage(countryCode);
            filterIds = filterIds.concat(countryFilterIds);
            this._addAndEnableFilters(filterIds, callback);
        }.bind(this);

        // Detect user country
        this.serviceClient.getCountry(onCountryDetected);
    },

    /**
     * Successively add filters from filterIds and then enable successfully added filters
     * @param filterIds Filter identifiers
     * @param callback We pass list of enabled filter identifiers to the callback
     * @private
     */
    _addAndEnableFilters: function (filterIds, callback) {

        callback = callback || function () {
            // Empty callback
        };

        var enabledFilterIds = [];

        if (!filterIds || filterIds.length === 0) {
            callback(enabledFilterIds);
            return;
        }


        var loadNextFilter = function () {
            if (filterIds.length === 0) {
                callback(enabledFilterIds);
            } else {
                var filterId = filterIds.shift();
                this.addAntiBannerFilter(filterId, function (success) {
                    if (success) {
                        var changed = this.enableAntiBannerFilter(filterId);
                        if (changed) {
                            enabledFilterIds.push(filterId);
                        }
                    }
                    loadNextFilter();
                }.bind(this));
            }
        }.bind(this);

        loadNextFilter();
    },
    
    /**
     * Getter for request filter
     */
    getRequestFilter: function () {
        return this.requestFilter;
    },

    /**
     * @returns boolean true when request filter was initialized first time
     */
    isRequestFilterReady: function () {
        return this._requestFilterInitTime > 0;
    },

    /**
     * When browser just started we need some time on request filter initialization.
     * This could be a problem in case when browser has a homepage and it is just started.
     * In this case request filter is not yet initalized so we don't block requests and inject css.
     * To fix this, content script will repeat requests for selectors until request filter is ready
     * and it will also collapse all elements which should have been blocked.  
     *
     * @returns boolean true if we should collapse elements with content script
     */
    shouldCollapseAllElements: function () {
        // We assume that if content script is requesting CSS in first 5 seconds after request filter init,
        // then it is possible, that we've missed some elements and now we should collapse these elements        
        return (this._requestFilterInitTime > 0) && (this._requestFilterInitTime + 5000 > new Date().getTime());
    },

    /**
     * Method is used to detect language of the page opened in the browser tab.
     * LocaleDetectorService then checks if we need to auto-enable language specific filter.
     *
     * @param tabId Tab ID
     * @param url Webpage URL
     */
    checkTabLanguage: function (tabId, url) {
        this.localeDetectorService.detectTabLanguage(tabId, url);
    },

    /**
     * Searching for user's custom filter rules.
     *
     * @param offset Offset
     * @param limit Limit
     * @param text Search string
     * @returns {Array} List of filter rules found
     */
    getUserFilters: function (offset, limit, text) {
        var rules = this.userRules;
        var result = [];
        for (var i = 0; i < rules.length; i++) {
            var ruleText = rules[i];
            if (!text || StringUtils.containsIgnoreCase(ruleText, text)) {
                result.push(ruleText);
            }
        }
        return limit ? result.slice(offset, offset + limit) : result;
    },

    /**
     * Removes all user's custom rules
     */
    clearUserFilter: function () {
        this.userRules = [];
        var filter = this._getFilterById(AntiBannerFiltersId.USER_FILTER_ID);
        EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_FILTER_RULES, filter, []);
        EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_USER_FILTER_RULES, this.getRequestFilterInfo());
    },

    /**
     * Adds new rule to the user filter
     *
     * @param ruleText Rule text
     * @returns Rule created
     */
    addUserFilterRule: function (ruleText) {
        var rule = FilterRuleBuilder.createRule(ruleText, AntiBannerFiltersId.USER_FILTER_ID);
        if (rule !== null) {
            this._addRuleToFilter(AntiBannerFiltersId.USER_FILTER_ID, rule);
            this.userRules.push(rule.ruleText);
        }
        EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_USER_FILTER_RULES, this.getRequestFilterInfo());
    },

    /**
     * Adds list of rules to the user filter
     *
     * @param rulesToAdd List of rules to add
     */
    addUserFilterRules: function (rulesToAdd) {
        var rules = [];
        for (var i = 0; i < rulesToAdd.length; i++) {
            var rule = FilterRuleBuilder.createRule(rulesToAdd[i], AntiBannerFiltersId.USER_FILTER_ID);
            if (rule !== null) {
                rules.push(rule);
                this.userRules.push(rule.ruleText);
            }
        }
        this._addRulesToFilter(AntiBannerFiltersId.USER_FILTER_ID, rules);
        EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_USER_FILTER_RULES, this.getRequestFilterInfo());
        return rules;
    },

    /**
     * Removes user's custom rule
     *
     * @param ruleText Rule text
     */
    removeUserFilter: function (ruleText) {
        var rule = FilterRuleBuilder.createRule(ruleText, AntiBannerFiltersId.USER_FILTER_ID);
        if (rule !== null) {
            var filter = this._getFilterById(AntiBannerFiltersId.USER_FILTER_ID);
            this.requestFilter.removeRule(rule);
            EventNotifier.notifyListeners(EventNotifierTypes.REMOVE_RULE, filter, [rule]);
        }
        CollectionUtils.removeAll(this.userRules, ruleText);
        EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_USER_FILTER_RULES, this.getRequestFilterInfo());
    },

    /**
     * Searches for whitelisted domains.
     *
     * @param offset Offset
     * @param limit Limit
     * @param text Search string
     * @returns {Array} Domains found
     */
    getWhiteListDomains: function (offset, limit, text) {
        var domains = whiteListService.getWhiteList();
        var result = [];
        for (var i = 0; i < domains.length; i++) {
            var domain = domains[i];
            if (!text || StringUtils.containsIgnoreCase(domain, text)) {
                result.push(domain);
            }
        }
        return limit ? result.slice(offset, offset + limit) : result;
    },

    whiteListFrame: function (frameInfo) {
        whiteListService.whiteListUrl(frameInfo.url);
        EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_WHITELIST_FILTER_RULES);
    },

    unWhiteListFrame: function (frameInfo) {
        if (frameInfo.frameRule) {
            if (frameInfo.frameRule.filterId === AntiBannerFiltersId.WHITE_LIST_FILTER_ID) {
                whiteListService.unWhiteListUrl(frameInfo.url);
                EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_WHITELIST_FILTER_RULES);
            } else {
                this.removeUserFilter(frameInfo.frameRule.ruleText);
            }
        }
    },

    /**
     * Adds domain to whitelist
     *
     * @param domain Domain name
     * @returns {*}
     */
    addWhiteListDomain: function (domain) {
        whiteListService.addToWhiteList(domain);
        EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_WHITELIST_FILTER_RULES);
    },

    /**
     * Adds list of domains to the whitelist.
     *
     * @param domains List of domains to add
     */
    addWhiteListDomains: function (domains) {
        whiteListService.addToWhiteListArray(domains);
        EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_WHITELIST_FILTER_RULES);
    },

    /**
     * Removes domain from the whitelist
     *
     * @param domain   Domain to remove
     */
    removeWhiteListDomain: function (domain) {
        whiteListService.removeFromWhiteList(domain);
        EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_WHITELIST_FILTER_RULES);
    },

    /**
     * Removes all domains from the whitelist
     */
    clearWhiteListFilter: function () {
        whiteListService.clearWhiteList();
        EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_WHITELIST_FILTER_RULES);
    },

    changeDefaultWhiteListMode: function (enabled) {
        whiteListService.changeDefaultWhiteListMode(enabled);
        EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_WHITELIST_FILTER_RULES);
    },

    /**
     * True if filtering is disabled globally.
     * At the moment you can't disable filtering from the UI.
     * But this option will be available in future update.
     *
     * @returns {boolean} true if disabled
     */
    isApplicationFilteringDisabled: function () {
        return this.applicationFilteringDisabled;
    },

    changeApplicationFilteringDisabled: function (disabled) {
        userSettings.changeFilteringDisabled(disabled);
        this.applicationFilteringDisabled = disabled;
    },

    /**
     * Returns collection of filters for settings page.
     * Private filters (user filter, whitelist filter, useful ads filter) are excluded.
     *
     * @returns {Array} List of filters
     */
    getAntiBannerFiltersForOptionsPage: function () {
        return this.adguardFilters.filter(function (f) {
            return f.installed && 
                f.filterId != AntiBannerFiltersId.USER_FILTER_ID &&
                f.filterId != AntiBannerFiltersId.WHITE_LIST_FILTER_ID &&
                f.filterId != AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID;
        });
    },

    /**
     * List of enabled filters.
     * User filter and whitelist filter are always enabled so they are excluded.
     *
     * @returns {Array} List of enabled filters
     */
    getEnabledAntiBannerFilters: function () {
        return this.adguardFilters.filter(function (f) {
            return f.installed && f.enabled &&
                f.filterId != AntiBannerFiltersId.USER_FILTER_ID &&
                f.filterId != AntiBannerFiltersId.WHITE_LIST_FILTER_ID;
        });
    },

    /**
     * List of filter groups.
     * This information is used on UI side only.
     *
     * At the moment we have three groups: Adguard Filters, EasyList, Other.
     *
     * @returns {*} List of groups
     */
    getGroupsMetadata: function () {
        return this.subscriptionService.getGroups();
    },

    /**
     * Returns collection of filters for selected group to display for user
     * @param groupId Group identifier
     * @returns {*|Array} List of filters
     */
    getFiltersMetadataForGroup: function (groupId) {
        return this.subscriptionService.getFilters().filter(function (f) {
            return f.groupId == groupId &&
                f.filterId != AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID;
        });
    },

    /**
     * Returns filter metadata
     * @param filterId Filter identifier
     * @returns {*}
     */
    getFilterMetadata: function (filterId) {
        return this.subscriptionService.getFilters().filter(function (f) {
            return f.filterId == filterId;
        })[0];
    },

    /**
     * Returns all filters metadata
     * @returns {*}
     */
    getFiltersMetadata: function () {
        return this.subscriptionService.getFilters();
    },

    /**
     * Returns filter metadata by subscription url
     * @param subscriptionUrl - subscription url
     * @returns {*|T}
     */
    findFilterMetadataBySubscriptionUrl: function (subscriptionUrl) {
        return this.subscriptionService.getFilters().filter(function (f) {
            return f.subscriptionUrl === subscriptionUrl;
        })[0];
    },

    /**
     * This method is called from UI when user changes list of active filters
     * @param filterIds List of active filters identifiers
     */
    onFiltersSubscriptionChange: function (filterIds) {

        for (var i = 0; i < this.adguardFilters.length; i++) {
            var filterId = this.adguardFilters[i].filterId;

            // Skip acceptable ads filter
            if (filterId == AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID) {
                continue;
            }

            // Remove filter if it is not present in the new list
            if (filterIds.indexOf(filterId) < 0) {
                this.removeAntiBannerFilter(filterId);
            }
        }

        // Add and enable filter
        this._addAndEnableFilters(filterIds);
    },

    /**
     * Checks if specified filter is enabled
     *
     * @param filterId Filter identifier
     * @returns {*} true if enabled
     */
    isAntiBannerFilterEnabled: function (filterId) {
        return this._getFilterById(filterId).enabled;
    },

    /**
     * Checks if specified filter is installed (downloaded)
     *
     * @param filterId Filter id
     * @returns {*} true if installed
     */
    isAntiBannerFilterInstalled: function (filterId) {
        return this._getFilterById(filterId).installed;
    },

    /**
     * Disables filter by id
     *
     * @param filterId Filter identifier
     * @returns {boolean} true if filter was disabled successfully
     */
    disableAntiBannerFilter: function (filterId) {

        var filter = this._getFilterById(filterId);
        if (!filter.enabled || !filter.installed) {
            return false;
        }

        filter.enabled = false;
        FilterLSUtils.updateFilterStateInfo(filter);
        EventNotifier.notifyListeners(EventNotifierTypes.DISABLE_FILTER, filter);
        return true;
    },

    /**
     * Add and enable filter by ID
     *
     * @param filterId Filter identifier
     */
    addAndEnableFilter: function (filterId) {
        this._addAndEnableFilters([filterId]);
    },

    /**
     * Enable filter
     *
     * @param filterId Filter identifier
     * @returns {boolean} true if filter was enabled successfully
     */
    enableAntiBannerFilter: function (filterId) {

        var filter = this._getFilterById(filterId);
        if (filter.enabled || !filter.installed) {
            return false;
        }

        filter.enabled = true;
        FilterLSUtils.updateFilterStateInfo(filter);
        EventNotifier.notifyListeners(EventNotifierTypes.ENABLE_FILTER, filter);
        return true;
    },

    /**
     * Loads filter from storage (if in extension package) or from backend
     *
     * @param filterId Filter identifier
     * @param callback Called when operation is finished
     */
    addAntiBannerFilter: function (filterId, callback) {

        var filter = this._getFilterById(filterId);
        if (filter.installed) {
            callback(true);
            return;
        }

        var onFilterLoaded = function (success) {
            if (success) {
                filter.installed = true;
                FilterLSUtils.updateFilterStateInfo(filter);
                EventNotifier.notifyListeners(EventNotifierTypes.ADD_FILTER, filter);
            }
            callback(success);
        };

        if (filter.loaded) {
            onFilterLoaded(true);
            return;
        }

        var filterMetadata = this.getFilterMetadata(filterId);

        if (FilterUtils.isAdguardFilter(filter)) {
            this._loadFilterFromRulesStorage(filterMetadata, onFilterLoaded);
        } else {
            this._loadFilterFromBackend(filterMetadata, onFilterLoaded);
        }
    },

    /**
     * Removes filter
     *
     * @param filterId Filter identifier
     * @returns {boolean} true if filter was removed successfully
     */
    removeAntiBannerFilter: function (filterId) {

        var filter = this._getFilterById(filterId);
        if (!filter.installed) {
            return false;
        }

        Log.debug("Remove filter {0}", filter.filterId);

        filter.enabled = false;
        filter.installed = false;
        FilterLSUtils.updateFilterStateInfo(filter);
        EventNotifier.notifyListeners(EventNotifierTypes.DISABLE_FILTER, filter);
        EventNotifier.notifyListeners(EventNotifierTypes.REMOVE_FILTER, filter);
        return true;
    },

    /**
     * Checks if userful ads filter is enabled or not
     *
     * @returns {*} true if useful ads filter is enabled
     */
    isAllowedAcceptableAds: function () {
        return this._getFilterById(AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID).enabled;
    },

    /**
     * Sends user feedback
     *
     * @param url URL
     * @param messageType Message type
     * @param comment Message text
     */
    sendFeedback: function (url, messageType, comment) {
        this.serviceClient.sendUrlReport(url, messageType, comment);
    },

    /**
     * Reloads filters from backend
     *
     * @param successCallback
     * @param errorCallback
     * @private
     */
    _reloadAntiBannerFilters: function (successCallback, errorCallback) {
        this._resetFiltersVersion();
        this.checkAntiBannerFiltersUpdate(true, successCallback, errorCallback);
    },

    /**
     * Checks filters updates.
     *
     * @param forceUpdate Normally we respect filter update period. But if this parameter is
     *                    true - we ignore it and check updates for all filters.
     * @param successCallback Called if filters were updated successfully
     * @param errorCallback Called if something gone wrong
     */
    checkAntiBannerFiltersUpdate: function (forceUpdate, successCallback, errorCallback) {

        successCallback = successCallback || function () {
            // Empty callback
        };
        errorCallback = errorCallback || function () {
            // Empty callback
        };
        
        Log.info("Start checking filters updates");

        // Select filters for update
        var filterIdsToUpdate = [];
        for (var i = 0; i < this.adguardFilters.length; i++) {
            var filter = this.adguardFilters[i];
            if (filter.installed && 
                filter.filterId != AntiBannerFiltersId.USER_FILTER_ID && 
                filter.filterId != AntiBannerFiltersId.WHITE_LIST_FILTER_ID) {
                // Check filters update period (or forceUpdate flag)
                var needUpdate = forceUpdate || (!filter.lastCheckTime || (Date.now() - filter.lastCheckTime) >= this.UPDATE_FILTERS_PERIOD);
                if (needUpdate) {
                    filterIdsToUpdate.push(filter.filterId);
                }
            }
        }

        if (filterIdsToUpdate.length === 0) {
            if (successCallback) {
                successCallback([]);
                return;
            }
        }
        
        Log.info("Checking updates for {0} filters", filterIdsToUpdate.length);

        // Load filters with changed version
        var loadFiltersFromBackend = function (filterMetadataList) {
            this._loadFiltersFromBackend(filterMetadataList, function (success, filterIds) {
                if (success) {
                    var filters = [];
                    for (var i = 0; i < filterIds.length; i++) {
                        var filterId = filterIds[i];
                        if (filterId != AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID) {
                            filters.push(this._getFilterById(filterId));
                        }
                    }
                    successCallback(filters);
                } else {
                    errorCallback();
                }
            }.bind(this));
        }.bind(this);

        // Method is called after we have got server response
        // Now we check filters version and update filter if needed
        var onLoadMetadataList = function (success, filterMetadataList) {
            if (success) {
                // Collection of filters metadata to update.
                var filtersMetadataListToUpdate = [];
                for (var i = 0; i < filterMetadataList.length; i++) {
                    var filterMetadata = filterMetadataList[i];
                    var filter = this._getFilterById(filterMetadata.filterId);
                    if (filterMetadata.version !== null && Utils.isGreaterVersion(filterMetadata.version, filter.version)) {
                        Log.info("Updating filter {0} to version {1}", filter.filterId, filterMetadata.version);
                        filtersMetadataListToUpdate.push(filterMetadata);
                    }
                }
                loadFiltersFromBackend(filtersMetadataListToUpdate);
            } else {
                errorCallback();
            }
        }.bind(this);

        // Retrieve current versions for update
        this._loadFiltersMetadataFromBackend(filterIdsToUpdate, onLoadMetadataList);
    },

    /**
     * @returns Extension version
     */
    getAppVersion: function () {
        return Utils.getAppVersion();
    },

    /**
     * Load rules to user filter by subscription url
     * @param subscriptionUrl
     * @param loadCallback
     */
    processAbpSubscriptionUrl: function (subscriptionUrl, loadCallback) {

        var filterMetadata = this.findFilterMetadataBySubscriptionUrl(subscriptionUrl);

        if (filterMetadata) {
            var filter = this._getFilterById(filterMetadata.filterId);
            this.addAndEnableFilter(filter.filterId);
        } else {
            //load filter
            var successCallback = function (rulesText) {
                var rules = this.addUserFilterRules(rulesText);
                loadCallback(rules.length);
            }.bind(this);
            var errorCallback = function (request, cause) {
                Log.error("Error download subscription by url {0}, cause: {1} {2}", subscriptionUrl, request.statusText, cause || "");
            };
            this.serviceClient.loadFilterRulesBySubscriptionUrl(subscriptionUrl, successCallback, errorCallback);
        }
    },

    /**
     * Resets all filters versions
     */
    _resetFiltersVersion: function () {
        var RESET_VERSION = "0.0.0.0";

        for (var i = 0; i < this.adguardFilters.length; i++) {
            this.adguardFilters[i].version = RESET_VERSION;
        }
    },

    /**
     * Returns all filters with their metadata
     * @private
     */
    _getAllAdguardFilters: function () {

        function createFilter(filterId, title, description, displayNumber) {
            var filter = new AdguardFilter(filterId);
            filter.name = title;
            filter.description = description;
            filter.displayNumber = displayNumber;
            return filter;
        }

        var filters = [];
        var filtersMetadata = this.subscriptionService.getFilters();
        for (var i = 0; i < filtersMetadata.length; i++) {
            var filterMetadata = filtersMetadata[i];
            filters.push(createFilter(filterMetadata.filterId, filterMetadata.name, filterMetadata.description, filterMetadata.displayNumber));
        }

        filters.push(createFilter(AntiBannerFiltersId.USER_FILTER_ID, "", "", 0));
        filters.push(createFilter(AntiBannerFiltersId.WHITE_LIST_FILTER_ID, "", "", 0));

        filters.sort(function (f1, f2) {
            return f1.displayNumber - f2.displayNumber;
        });

        return filters;
    },

    /**
     * Updates filters version and state info.
     * Loads this data from the storage and then updates "adguardFilters" property of the AntiBannerService instance.
     *
     * @private
     */
    _loadFiltersVersionAndStateInfo: function () {

        // Define it here: for jshint to cool down
        var filter = null;

        // Load filters metadata from the storage
        var filtersVersionInfo = FilterLSUtils.getFiltersVersionInfo();
        for (var i = 0; i < this.adguardFilters.length; i++) {
            filter = this.adguardFilters[i];
            var versionInfo = filtersVersionInfo[filter.filterId];
            if (versionInfo) {
                filter.version = versionInfo.version;
                filter.lastCheckTime = versionInfo.lastCheckTime;
                filter.lastUpdateTime = versionInfo.lastUpdateTime;
            }
        }

        // Load filters state from the storage
        var filtersStateInfo = FilterLSUtils.getFiltersStateInfo();
        for (i = 0; i < this.adguardFilters.length; i++) {
            filter = this.adguardFilters[i];
            var stateInfo = filtersStateInfo[filter.filterId];
            if (stateInfo) {
                filter.enabled = stateInfo.enabled;
                filter.installed = stateInfo.installed;
                filter.loaded = stateInfo.loaded;
            }
        }
    },

    /**
     * Called when LocaleDetectorService has detected language-specific filters we can enable.
     *
     * @param filterIds List of detected language-specific filters identifiers
     * @private
     */
    _onFilterDetectedByLocale: function (filterIds) {
        if (!filterIds) {
            return;
        }
        this._addAndEnableFilters(filterIds, function (enabledFilterIds) {
            var enabledFilters = [];
            for (var i = 0; i < enabledFilterIds.length; i++) {
                enabledFilters.push(this._getFilterById(enabledFilterIds[i]));
            }
            if (enabledFilters.length > 0) {
                EventNotifier.notifyListeners(EventNotifierTypes.ENABLE_FILTER_SHOW_POPUP, enabledFilters);
            }
        }.bind(this));
    },
    
    /**
     * Called when filters were loaded from the storage
     * 
     * @param callback Called when request filter is initialized
     */
    _onFiltersLoadedFromStorage: function (rulesFilterMap, callback) {
        
        var start = new Date().getTime();
        
        // We create filter rules using chunks of the specified length
        // We are doing this for FF as everything in FF is done on the UI thread
        // Request filter creation is rather slow operation so we should
        // use setTimeout calls to give UI thread some time.
        var async = Prefs.speedupStartup();
        var asyncStep = 1000;
        Log.info('Starting request filter initialization. Async={0}', async);
        
        // Empty request filter
        var requestFilter = new RequestFilter();
        
        // Supplement object to make sure that we use only unique filter rules
        var uniqueRules = Object.create(null);        
        
        /**
         * STEP 3: Called when request filter has been filled with rules.
         * This is the last step of request filter initialization.
         */
        var requestFilterInitialized = function() {
            
            // Request filter is ready
            this.requestFilter = requestFilter;
            
            if (callback && typeof callback === "function") {		
                callback();		
            }
            
            EventNotifier.notifyListeners(EventNotifierTypes.REQUEST_FILTER_UPDATED, this.getRequestFilterInfo());            
            Log.info("Finished request filter initialization in {0} ms. Rules count: {1}", (new Date().getTime() - start), requestFilter.rulesCount);

            if (requestFilter.rulesCount == 0 && !this.reloadedRules) {
                //https://github.com/AdguardTeam/AdguardBrowserExtension/issues/205
                Log.info("No rules have been found - checking filter updates");
                this._reloadAntiBannerFilters();
                this.reloadedRules = true;
            } else if (requestFilter.rulesCount > 0 && this.reloadedRules) {
                Log.info("Filters reloaded, deleting reloadRules flag");
                delete this.reloadedRules;
            }

        }.bind(this);
        
        /**
         * Supplement function for adding rules to the request filter
         * 
         * @param filterId Filter identifier
         * @param rulesTexts Array with filter rules
         * @param startIdx Start index of the rules array
         * @param endIdx End index of the rules array
         */
        var addRules = function(filterId, rulesTexts, startIdx, endIdx) {
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
                var rule = FilterRuleBuilder.createRule(ruleText, filterId);

                if (rule !== null) {
                    requestFilter.addRule(rule);
                }
            }
        };
        
        /**
         * Asyncronously adds rules to the request filter.
         */
        var addRulesAsync = function(filterId, rulesTexts, startIdx, stopIdx, prevDfd) {
            
            var dfd = new Promise();
            
            prevDfd.then(function() {
                setTimeout(function() {
                    addRules(filterId, rulesTexts, startIdx, stopIdx);
                    dfd.resolve();    
                }, 1);
            });

            return dfd;            
        };
        
        /**
         * Asynchronously fills request filter with rules.
         */
        var fillRequestFilterAsync = function() {
            // Async loading starts when we resolve this promise
            var rootDfd = new Promise();
            var prevDfd = null;
            var dfds = [];
            
            // Go through all filters in the map
            for (var filterId in rulesFilterMap) {
                // To number
                filterId = filterId - 0;
                if (filterId != AntiBannerFiltersId.USER_FILTER_ID) {
                    var rulesTexts = rulesFilterMap[filterId];
                    
                    for (var i = 0; i < rulesTexts.length; i += asyncStep) {
                        prevDfd = addRulesAsync(filterId, rulesTexts, i, i + asyncStep, prevDfd || rootDfd);
                        dfds.push(prevDfd);
                    }
                }
            }
            
            // User filter should be the last
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/117
            var userRules = rulesFilterMap[AntiBannerFiltersId.USER_FILTER_ID];
            addRulesAsync(AntiBannerFiltersId.USER_FILTER_ID, userRules, 0, userRules.length, prevDfd || rootDfd);

            Promise.all(dfds).then(function() {
                requestFilterInitialized();
            });
            
            // Start execution
            rootDfd.resolve();            
        };
        
        /**
         * Synchronously fills request filter with rules
         */
        var fillRequestFilterSync = function() {
            
            // Go through all filters in the map
            for (var filterId in rulesFilterMap) {
                
                // To number
                filterId = filterId - 0;
                if (filterId != AntiBannerFiltersId.USER_FILTER_ID) {
                    var rulesTexts = rulesFilterMap[filterId];
                    addRules(filterId, rulesTexts, 0, rulesTexts.length);
                }
            }
            
            // User filter should be the last
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/117
            var userRules = rulesFilterMap[AntiBannerFiltersId.USER_FILTER_ID];
            addRules(AntiBannerFiltersId.USER_FILTER_ID, userRules, 0, userRules.length);
            requestFilterInitialized();
        };
        
        if (async) {
            fillRequestFilterAsync();
        } else {
            fillRequestFilterSync();
        }
    },

    /**
     * Create new request filter and add distinct rules from the storage.
     *
     * @param callback Called after request filter has been created
     * @private
     */
    _createRequestFilter: function (callback) {

        var start = new Date().getTime();
        Log.info('Starting loading filter rules from the storage');
        
        // Prepare map for filter rules
        // Map key is filter ID
        // Map value is array with filter rules
        var rulesFilterMap = Object.create(null);

        /**
         * STEP 2: Called when all filter rules have been loaded from storage
         */
        var loadAllFilterRulesDone = function() {            
            Log.info('Finished loading filter rules from the storage in {0} ms', (new Date().getTime() - start));
            this._onFiltersLoadedFromStorage(rulesFilterMap, callback);
        }.bind(this);

        /**
         * Loads filter rules from storage
         *
         * @param filterId Filter identifier
         * @param rulesFilterMap Map for loading rules
         * @returns {*} Deferred object
         */
        var loadFilterRulesFromStorage = function (filterId, rulesFilterMap) {
            var dfd = new Promise();

            FilterStorage.loadFilterRules(filterId, function (rulesText) {
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
        var loadFilterRules = function() {
            var dfds = [];
            for (var i = 0; i < this.adguardFilters.length; i++) {
                var filter = this.adguardFilters[i];
                if (filter.enabled) {
                    dfds.push(loadFilterRulesFromStorage(filter.filterId, rulesFilterMap));
                }
            }
            dfds.push(this._loadUserRulesToRequestFilter(rulesFilterMap));

            // Load all filters and then recreate request filter
            Promise.all(dfds).then(loadAllFilterRulesDone);            
        }.bind(this);

        loadFilterRules();
    },

    /**
     * Adds user rules (got from the storage) to request filter
     *
     * @param rulesFilterMap Map for loading rules
     * @returns {*} Deferred object
     * @private
     */
    _loadUserRulesToRequestFilter: function (rulesFilterMap) {

        var dfd = new Promise();

        var filterId = AntiBannerFiltersId.USER_FILTER_ID;
        FilterStorage.loadFilterRules(filterId, function (rulesText) {

            this.userRules = rulesText || [];

            if (!rulesText) {
                dfd.resolve();
                return;
            }

            rulesFilterMap[filterId] = rulesText;
            dfd.resolve();
        }.bind(this));

        return dfd;
    },

    /**
     * @returns Request Filter info
     */
    getRequestFilterInfo: function () {
        var rulesCount = 0;
        if (this.requestFilter) {
            rulesCount = this.requestFilter.rulesCount;
        }
        return {
            rulesCount: rulesCount
        };
    },

    /**
     * Update content blocker info
     * We save state of content blocker for properly show in options page (converted rules count and over limit flag)
     * @param info Content blocker info
     */
    updateContentBlockerInfo: function (info) {
        this.contentBlockerInfo.rulesCount = info.rulesCount;
        this.contentBlockerInfo.rulesOverLimit = info.rulesOverLimit;
    },

    /**
     * @returns Content Blocker info
     */
    getContentBlockerInfo: function () {
        return this.contentBlockerInfo;
    },

    /**
     * Adds event listener for filters changes.
     * If filter is somehow changed this method checks if we should save changes to the storage
     * and if we should recreate RequestFilter.
     *
     * @private
     */
    _addFiltersChangeEventListener: function () {

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

                var needCreateRequestFilter = filterEvents.some(function (el) {
                    return UPDATE_REQUEST_FILTER_EVENTS.indexOf(el.event) >= 0;
                });

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
                var filterFunction = function (el) {
                    return SAVE_FILTER_RULES_TO_STORAGE_EVENTS.indexOf(el.event) >= 0;
                };
                for (var filterId in eventsByFilter) {
                    var needSaveRulesToStorage = eventsByFilter[filterId].some(filterFunction);
                    if (!needSaveRulesToStorage) {
                        continue;
                    }
                    var dfd = this._processSaveFilterRulesToStorageEvents(filterId, eventsByFilter[filterId]);
                    dfds.push(dfd);
                }

                if (needCreateRequestFilter) {
                    // Rules will be added to request filter lazy, listeners will be notified about REQUEST_FILTER_UPDATED later
                    Promise.all(dfds).then(this._createRequestFilter.bind(this));
                } else {
                    // Rules are already in request filter, notify listeners
                    EventNotifier.notifyListeners(EventNotifierTypes.REQUEST_FILTER_UPDATED, this.getRequestFilterInfo());
                }

            }.bind(this), this.FILTERS_CHANGE_DEBOUNCE_PERIOD);

        }.bind(this);

        EventNotifier.addListener(function (event, filter, rules) {
            switch (event) {
                case EventNotifierTypes.ADD_RULE:
                case EventNotifierTypes.ADD_RULES:
                case EventNotifierTypes.REMOVE_RULE:
                case EventNotifierTypes.UPDATE_FILTER_RULES:
                case EventNotifierTypes.ENABLE_FILTER:
                case EventNotifierTypes.DISABLE_FILTER:
                    processFilterEvent(event, filter, rules);
                    break;
            }
        });
    },

    /**
     * Saves updated filter rules to the storage.
     *
     * @param filterId Filter id
     * @param events Events (what has changed?)
     * @private
     */
    _processSaveFilterRulesToStorageEvents: function (filterId, events) {

        var dfd = new Promise();

        FilterStorage.loadFilterRules(filterId, function (loadedRulesText) {

            for (var i = 0; i < events.length; i++) {

                if (!loadedRulesText) {
                    loadedRulesText = [];
                }

                var event = events[i];
                var eventType = event.event;
                var eventRules = event.rules;

                switch (eventType) {
                    case EventNotifierTypes.ADD_RULE:
                    case EventNotifierTypes.ADD_RULES:
                        loadedRulesText = loadedRulesText.concat(CollectionUtils.getRulesText(eventRules));
                        Log.debug("Add {0} rules to filter {1}", eventRules.length, filterId);
                        break;
                    case EventNotifierTypes.REMOVE_RULE:
                        var actionRule = eventRules[0];
                        CollectionUtils.removeAll(loadedRulesText, actionRule.ruleText);
                        Log.debug("Remove {0} rule from filter {1}", actionRule.ruleText, filterId);
                        break;
                    case EventNotifierTypes.UPDATE_FILTER_RULES:
                        loadedRulesText = CollectionUtils.getRulesText(eventRules);
                        Log.debug("Update filter {0} rules count to {1}", filterId, eventRules.length);
                        break;
                }
            }

            Log.debug("Save {0} rules to filter {1}", loadedRulesText.length, filterId);
            FilterStorage.saveFilterRules(filterId, loadedRulesText, dfd.resolve);

        }.bind(this));

        return dfd;
    },

    /**
     * Subscribe to events which lead to filters update.
     * @private
     */
    _subscribeToFiltersChangeEvents: function () {

        // on USE_OPTIMIZED_FILTERS setting change we need to reload filters
        var onUsedOptimizedFiltersChange = Utils.debounce(this._reloadAntiBannerFilters.bind(this), this.RELOAD_FILTERS_DEBOUNCE_PERIOD);

        EventNotifier.addListener(function (event, setting) {
            if (event === EventNotifierTypes.CHANGE_USER_SETTINGS && setting === userSettings.settings.USE_OPTIMIZED_FILTERS) {
                onUsedOptimizedFiltersChange();
                return;
            }
            if (event == EventNotifierTypes.CHANGE_USER_SETTINGS && setting == userSettings.settings.DISABLE_COLLECT_HITS) {
                this.getRequestFilter().cssFilter.dirty = true;
            }
        }.bind(this));
    },

    /**
     * Schedules filters update job
     * @isFirstRun
     * @private
     */
    _scheduleFiltersUpdate: function () {
        var updateFunc = this.checkAntiBannerFiltersUpdate.bind(this);

        // First run delay
        setTimeout(updateFunc, this.UPDATE_FILTERS_DELAY);

        // Scheduling job
        var scheduleUpdate = function () {
            setTimeout(function () {
                try {
                    updateFunc();
                } catch (ex) {
                    Log.error("Error update filters, cause {0}", ex);
                }
                scheduleUpdate();
            }, this.UPDATE_FILTERS_PERIOD);
        }.bind(this);

        scheduleUpdate();
    },

    /**
     * Gets filter by ID.
     * Throws exception if filter not found.
     *
     * @param filterId Filter identifier
     * @returns {*} Filter got from "adguardFilters" property.
     * @private
     */
    _getFilterById: function (filterId) {
        for (var i = 0; i < this.adguardFilters.length; i++) {
            var adguardFilter = this.adguardFilters[i];
            if (adguardFilter.filterId == filterId) {
                return adguardFilter;
            }
        }
        throw 'Filter with id ' + filterId + ' not found';
    },

    /**
     * Adds rule to filter
     *
     * @param filterId Filter ID
     * @param rule     Rule object
     * @private
     */
    _addRuleToFilter: function (filterId, rule) {
        var filter = this._getFilterById(filterId);
        this.requestFilter.addRule(rule);
        EventNotifier.notifyListeners(EventNotifierTypes.ADD_RULE, filter, [rule]);
    },

    /**
     * Add rules list to filter
     *
     * @param filterId Filter identifier
     * @param rules Rules list
     * @private
     */
    _addRulesToFilter: function (filterId, rules) {
        var filter = this._getFilterById(filterId);
        this.requestFilter.addRules(rules);
        EventNotifier.notifyListeners(EventNotifierTypes.ADD_RULES, filter, rules);
    },

    /**
     * Loads filters (ony-by-one) from the remote server
     *
     * @param filterMetadataList List of filter metadata to load
     * @param callback Called when filters have been loaded
     * @private
     */
    _loadFiltersFromBackend: function (filterMetadataList, callback) {

        var loadedFilters = [];

        var loadNextFilter = function () {
            if (filterMetadataList.length === 0) {
                callback(true, loadedFilters);
            } else {
                var filterMetadata = filterMetadataList.shift();
                this._loadFilterFromBackend(filterMetadata, function (success) {
                    if (!success) {
                        callback(false);
                        return;
                    }
                    loadedFilters.push(filterMetadata.filterId);
                    loadNextFilter();
                });
            }
        }.bind(this);

        loadNextFilter();
    },

    /**
     * Loads filter rules from remote server
     *
     * @param filterMetadata Filter metadata
     * @param callback Called when filter rules have been loaded
     * @private
     */
    _loadFilterFromBackend: function (filterMetadata, callback) {

        var filter = this._getFilterById(filterMetadata.filterId);

        filter._isDownloading = true;
        EventNotifier.notifyListeners(EventNotifierTypes.START_DOWNLOAD_FILTER, filter);

        var successCallback = function (filterRules) {
            Log.info("Retrieved response from server for filter {0}, rules count: {1}", filter.filterId, filterRules.length);
            delete filter._isDownloading;
            filter.version = filterMetadata.version;
            filter.lastUpdateTime = filterMetadata.timeUpdated;
            filter.lastCheckTime = Date.now();
            filter.loaded = true;
            //persist to LS
            FilterLSUtils.updateFilterStateInfo(filter);
            FilterLSUtils.updateFilterVersionInfo(filter);
            //notify listeners
            EventNotifier.notifyListeners(EventNotifierTypes.SUCCESS_DOWNLOAD_FILTER, filter);
            EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_FILTER_RULES, filter, filterRules);
            callback(true);
        }.bind(this);

        var errorCallback = function (request, cause) {
            Log.error("Error retrieved response from server for filter {0}, cause: {1} {2}", filter.filterId, request.statusText, cause || "");
            delete filter._isDownloading;
            EventNotifier.notifyListeners(EventNotifierTypes.ERROR_DOWNLOAD_FILTER, filter);
            callback(false);
        };

        this.serviceClient.loadFilterRules(filter.filterId, userSettings.isUseOptimizedFiltersEnabled(), successCallback, errorCallback);
    },

    /**
     * Loads filter versions from remote server
     *
     * @param filterIds Filter identifiers
     * @param callback Callback (called when load is finished)
     * @private
     */
    _loadFiltersMetadataFromBackend: function (filterIds, callback) {

        if (filterIds.length === 0) {
            callback(true, []);
            return;
        }

        var loadSuccess = function (filterMetadataList) {
            Log.debug("Retrieved response from server for {0} filters, result: {1} metadata", filterIds.length, filterMetadataList.length);
            callback(true, filterMetadataList);
        };

        var loadError = function (request, cause) {
            Log.error("Error retrieved response from server for filters {0}, cause: {1} {2}", filterIds, request.statusText, cause || "");
            callback(false);
        };

        this.serviceClient.loadFiltersMetadata(filterIds, loadSuccess, loadError);
    },

    /**
     * Load filter rules from rules storage
     * @param filterMetadata
     * @param callback
     * @private
     */
    _loadFilterFromRulesStorage: function (filterMetadata, callback) {

        var filter = this._getFilterById(filterMetadata.filterId);

        filter._isDownloading = true;
        EventNotifier.notifyListeners(EventNotifierTypes.START_DOWNLOAD_FILTER, filter);

        var successCallback = function (filterRules) {
            Log.info("Load local filter {0}, rules count: {1}", filter.filterId, filterRules.length);
            delete filter._isDownloading;
            filter.version = filterMetadata.version;
            filter.lastUpdateTime = filterMetadata.timeUpdated;
            filter.loaded = true;
            //persist to LS
            FilterLSUtils.updateFilterStateInfo(filter);
            FilterLSUtils.updateFilterVersionInfo(filter);
            //notify listeners
            EventNotifier.notifyListeners(EventNotifierTypes.SUCCESS_DOWNLOAD_FILTER, filter);
            EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_FILTER_RULES, filter, filterRules);
            callback(true);
        }.bind(this);

        var errorCallback = function () {
            delete filter._isDownloading;
            EventNotifier.notifyListeners(EventNotifierTypes.ERROR_DOWNLOAD_FILTER, filter);
            callback(false);
        };

        this.serviceClient.loadLocalFilter(filter.filterId, userSettings.isUseOptimizedFiltersEnabled(), successCallback, errorCallback);
    }
};

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

/**
 * Helper class for working with filters metadata storage (local storage)
 */
var FilterLSUtils = exports.FilterLSUtils = {

    FILTERS_STATE_PROP: 'filters-state',
    FILTERS_VERSION_PROP: 'filters-version',

    /**
     * Gets filter version from the local storage
     * @returns {*}
     */
    getFiltersVersionInfo: function () {
        var filters = Object.create(null);
        try {
            var json = LS.getItem(FilterLSUtils.FILTERS_VERSION_PROP);
            if (json) {
                filters = JSON.parse(json);
            }
        } catch (ex) {
            Log.error("Error retrieve filters version info, cause {0}", ex);
        }
        return filters;
    },

    /**
     * Gets filters state from the local storage
     * @returns {*}
     */
    getFiltersStateInfo: function () {
        var filters = Object.create(null);
        try {
            var json = LS.getItem(FilterLSUtils.FILTERS_STATE_PROP);
            if (json) {
                filters = JSON.parse(json);
            }
        } catch (ex) {
            Log.error("Error retrieve filters state info, cause {0}", ex);
        }
        return filters;
    },

    /**
     * Updates filter version in the local storage
     *
     * @param filter Filter version metadata
     */
    updateFilterVersionInfo: function (filter) {
        var filters = FilterLSUtils.getFiltersVersionInfo();
        filters[filter.filterId] = {
            version: filter.version,
            lastCheckTime: filter.lastCheckTime,
            lastUpdateTime: filter.lastUpdateTime
        };
        LS.setItem(FilterLSUtils.FILTERS_VERSION_PROP, JSON.stringify(filters));
    },

    /**
     * Updates filter state in the local storage
     *
     * @param filter Filter state object
     */
    updateFilterStateInfo: function (filter) {
        var filters = FilterLSUtils.getFiltersStateInfo();
        filters[filter.filterId] = {
            loaded: filter.loaded,
            enabled: filter.enabled,
            installed: filter.installed
        };
        LS.setItem(FilterLSUtils.FILTERS_STATE_PROP, JSON.stringify(filters));
    }
};

/**
 * List of events which cause RequestFilter re-creation
 * @type {Array}
 */
var UPDATE_REQUEST_FILTER_EVENTS = [EventNotifierTypes.UPDATE_FILTER_RULES, EventNotifierTypes.ENABLE_FILTER, EventNotifierTypes.DISABLE_FILTER];

/**
 * List of events which cause saving filter rules to the rules storage
 * @type {Array}
 */
var SAVE_FILTER_RULES_TO_STORAGE_EVENTS = [EventNotifierTypes.UPDATE_FILTER_RULES, EventNotifierTypes.ADD_RULE, EventNotifierTypes.ADD_RULES, EventNotifierTypes.REMOVE_RULE];

// Events
// TODO: move to UI.js.
(function () {

    //on filter auto-enabled event
    EventNotifier.addListener(function (event, enabledFilters) {
        if (event == EventNotifierTypes.ENABLE_FILTER_SHOW_POPUP) {
            var result = Utils.getFiltersEnabledResultMessage(enabledFilters);
            UI.showAlertMessagePopup(result.title, result.text);
        }
    });

    //on filters updated event
    EventNotifier.addListener(function (event, success, updatedFilters) {
        if (event == EventNotifierTypes.UPDATE_FILTERS_SHOW_POPUP) {
            var result = Utils.getFiltersUpdateResultMessage(success, updatedFilters);
            UI.showAlertMessagePopup(result.title, result.text);
        }
    });
})();
