/**
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import {
    action,
    computed,
    makeObservable,
    observable,
    runInAction,
} from 'mobx';

import { logger } from '../../../common/logger';
import {
    createSavingService,
    SavingFSMEvent,
    SavingFSMState,
} from '../../common/components/Editor/savingFSM';
import { MIN_FILTERS_UPDATE_DISPLAY_DURATION_MS } from '../../common/constants';
import { sleep } from '../../../../../tools/common/sleep';
import { messenger } from '../../services/messenger';
import { SEARCH_FILTERS } from '../components/Filters/Search/constants';
import {
    sortFilters,
    updateFilters,
    updateGroups,
    sortGroupsOnSearch,
} from '../components/Filters/helpers';
import { optionsStorage } from '../options-storage';
import {
    AntibannerGroupsId,
    RECOMMENDED_TAG_ID,
    TRUSTED_TAG_KEYWORD,
    WASTE_CHARACTERS,
} from '../../../common/constants';
import { translator } from '../../../common/translators/translator';
import { UserAgent } from '../../../common/user-agent';

import { NotificationType } from './UiStore';

/**
 * Sometimes the options page might be opened before the background page or
 * service worker is ready to provide data.
 *
 * In this case, we need to retry getting data from the background.
 * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2712
 *
 * @param {Function} fetchFunction Function to fetch data from
 * the background page or service worker.
 *
 * @returns Data for the options page from the background page.
 */
const fetchDataWithRetry = async (fetchFunction) => {
    /**
     * Delay between retries in milliseconds
     */
    const RETRY_DELAY_MS = 500;

    /**
     * Total number of retries.
     */
    const TOTAL_RETRY_TIMES = 10;

    /**
     * Inner function to retry getting data from the background service.
     *
     * @param retryTimes {number} - number of retries left
     */
    const innerRetry = async (retryTimes) => {
        if (retryTimes === 0) {
            logger.error('[ext.SettingsStore]: failed to get from the background service.');
            return null;
        }
        try {
            const data = await fetchFunction();
            if (!data) {
                await sleep(RETRY_DELAY_MS);
                // eslint-disable-next-line @typescript-eslint/return-await
                return innerRetry(retryTimes - 1);
            }

            return data;
        } catch (e) {
            logger.warn('[ext.SettingsStore]: failed to get from the background service, will retry fetch. error: ', e);
            await sleep(RETRY_DELAY_MS);
            return innerRetry(retryTimes - 1);
        }
    };

    return innerRetry(TOTAL_RETRY_TIMES);
};

const DEFAULT_RULES_LIMITS = {
    dynamicRulesEnabledCount: 0,
    dynamicRulesMaximumCount: 0,
    dynamicRulesUnsafeEnabledCount: 0,
    dynamicRulesUnsafeMaximumCount: 0,
    dynamicRulesRegexpsEnabledCount: 0,
    dynamicRulesRegexpsMaximumCount: 0,
    staticFiltersEnabledCount: 0,
    staticFiltersMaximumCount: 0,
    staticRulesEnabledCount: 0,
    staticRulesMaximumCount: 0,
    staticRulesRegexpsEnabledCount: 0,
    staticRulesRegexpsMaxCount: 0,
    expectedEnabledFilters: [],
    actuallyEnabledFilters: [],
    areFilterLimitsExceeded: false,
};

/**
 * @typedef {import('../../common/messages/constants').CustomFilterSubscriptionData} CustomFilterSubscriptionData
 */

class SettingsStore {
    KEYS = {
        ALLOW_ACCEPTABLE_ADS: 'allowAcceptableAds',
        BLOCK_KNOWN_TRACKERS: 'blockKnownTrackers',
        STRIP_TRACKING_PARAMETERS: 'stripTrackingParameters',
    };

    savingAllowlistService = createSavingService({
        id: 'allowlist',
        services: {
            saveData: async ({ event }) => {
                /**
                 * If saveAllowlist executes faster than MIN_EXECUTION_TIME_REQUIRED_MS we increase
                 * execution time for smoother user experience.
                 *
                 * TODO: Can we remove this and set minDelayLoader when we call
                 * saveAllowlist as in the user rules section?
                 */
                const MIN_EXECUTION_TIME_REQUIRED_MS = 500;
                const { value, callback } = event;
                const start = Date.now();

                await messenger.saveAllowlist(value);

                const end = Date.now();
                const timePassed = end - start;
                if (timePassed < MIN_EXECUTION_TIME_REQUIRED_MS) {
                    await sleep(MIN_EXECUTION_TIME_REQUIRED_MS - timePassed);
                }

                await callback();
            },
        },
    });

    @observable settings = null;

    @observable optionsReadyToRender = false;

    @observable version = null;

    @observable libVersions = null;

    @observable filters = [];

    @observable categories = [];

    @observable visibleFilters = [];

    @observable rulesCount = 0;

    @observable allowAcceptableAds = null;

    @observable blockKnownTrackers = null;

    @observable stripTrackingParameters = null;

    @observable allowlist = '';

    @observable savingAllowlistState = this.savingAllowlistService.getSnapshot().value;

    @observable filtersUpdating = false;

    @observable selectedGroupId = null;

    @observable isChrome = null;

    @observable currentChromeVersion = UserAgent.isChromium ? Number(UserAgent.version) : null;

    @observable searchInput = '';

    @observable searchSelect = SEARCH_FILTERS.ALL;

    @observable allowlistEditorContentChanged = false;

    @observable allowlistEditorWrap = null;

    @observable fullscreenUserRulesEditorIsOpen = false;

    @observable allowlistSizeReset = false;

    @observable filtersToGetConsentFor = [];

    @observable isAnnoyancesConsentModalOpen = false;

    @observable filterIdSelectedForConsent = null;

    @observable rulesLimits = DEFAULT_RULES_LIMITS;

    constructor(rootStore) {
        makeObservable(this);
        this.rootStore = rootStore;

        this.updateSetting = this.updateSetting.bind(this);
        this.updateFilterSetting = this.updateFilterSetting.bind(this);
        this.updateGroupSetting = this.updateGroupSetting.bind(this);
        this.setAllowAcceptableAdsState = this.setAllowAcceptableAdsState.bind(this);

        this.savingAllowlistService.subscribe((state) => {
            runInAction(() => {
                this.savingAllowlistState = state.value;
                if (state.value === SavingFSMState.Saving) {
                    this.allowlistEditorContentChanged = false;
                }
            });
        });
    }

    @action
    async getRulesLimitsCounters() {
        // This method should only be called for MV3-based extensions
        // AG-40166
        if (!__IS_MV3__) {
            return;
        }

        const rulesLimits = await fetchDataWithRetry(messenger.getRulesLimitsCounters.bind(messenger));

        // Will use default rules limits if the background service is not ready.
        if (!rulesLimits) {
            return;
        }

        runInAction(() => {
            this.rulesLimits = rulesLimits;
        });
    }

    @action
    async checkLimitations() {
        const currentLimitsMv3 = await messenger.getCurrentLimits();

        const uiStore = this.rootStore.uiStore;

        uiStore.setStaticFiltersLimitsWarning(currentLimitsMv3.staticFiltersData);
        uiStore.setDynamicRulesLimitsWarning(currentLimitsMv3.dynamicRulesData);

        if (uiStore.dynamicRulesLimitsWarning) {
            uiStore.addNotification({
                description: uiStore.dynamicRulesLimitsWarning,
                extra: {
                    link: translator.getMessage('options_rule_limits'),
                },
                type: NotificationType.ERROR,
            });
        }

        return currentLimitsMv3;
    }

    @action
    async requestOptionsData(firstRender) {
        // do not re-render options page if the annoyances consent modal is open.
        // it is needed to prevent switch disabling due to the actual state while the modal is shown
        if (this.isAnnoyancesConsentModalOpen) {
            return;
        }

        let data = null;
        if (firstRender) {
            // on first render background service might not be ready to provide data, so we need to get it with retry
            data = await fetchDataWithRetry(messenger.getOptionsData.bind(messenger));
        } else {
            data = await messenger.getOptionsData();
        }

        runInAction(() => {
            this.settings = data.settings;
            // on first render we sort filters to show enabled on the top
            // filter should remain on the same place event after being enabled or disabled
            if (firstRender) {
                this.setFilters(sortFilters(data.filtersMetadata.filters));
            } else {
                // on the next filters updates, we update filters keeping order
                /**
                 * TODO: Updating filters on background service response can cause filter enable
                 * state mismatch, because we toggle switches on frontend side first, but cannot determine when
                 * action in background service is completed and final result of user action.
                 * It seems that we need to use a new approach with atomic updates instead of global
                 * state synchronization to avoid this kind of problems. This task can be split into two parts:
                 * - Moving specific logic from the background to the settings page.
                 * - Integrate a transparent transaction model with simple collision resolution to prevent
                 * race conditions.
                 */
                this.setFilters(updateFilters(this.filters, data.filtersMetadata.filters));
            }
            // do not rerender groups on its turning on/off while searching
            if (this.isSearching) {
                this.setGroups(updateGroups(this.categories, data.filtersMetadata.categories));
            } else {
                this.setGroups(data.filtersMetadata.categories);
            }
            this.rulesCount = data.filtersInfo.rulesCount;
            this.version = data.appVersion;
            this.libVersions = data.libVersions;
            this.constants = data.constants;
            this.setAllowAcceptableAds(data.filtersMetadata.filters);
            this.setBlockKnownTrackers(data.filtersMetadata.filters);
            this.setStripTrackingParameters(data.filtersMetadata.filters);
            this.isChrome = data.environmentOptions.isChrome;
            this.optionsReadyToRender = true;
            this.fullscreenUserRulesEditorIsOpen = data.fullscreenUserRulesEditorIsOpen;
        });

        return data;
    }

    @action
    setSelectedGroupId(dirtyGroupId) {
        const groupId = Number.parseInt(dirtyGroupId, 10);

        if (Number.isNaN(groupId)) {
            this.selectedGroupId = null;
        } else {
            const groupExists = this.categories.find((category) => category.groupId === groupId);
            if (groupExists) {
                this.selectedGroupId = groupId;
            } else {
                this.selectedGroupId = null;
            }
        }
    }

    @action
    async updateSetting(settingId, value, ignoreBackground = false) {
        this.settings.values[settingId] = value;

        if (!ignoreBackground) {
            await messenger.changeUserSetting(settingId, value);
        }
    }

    async setFilterRelatedSettingState(filterId, optionKey, enabled) {
        const prevValue = this[optionKey];
        this[optionKey] = enabled;
        try {
            const relatedFilter = this.filters
                .find((f) => f.filterId === filterId);

            if (enabled) {
                await messenger.enableFilter(filterId);
                await this.updateGroupSetting(relatedFilter.groupId, enabled);
            } else {
                await messenger.disableFilter(filterId);
            }

            relatedFilter.enabled = enabled;
            this.refreshFilter(relatedFilter);
        } catch (e) {
            runInAction(() => {
                this[optionKey] = prevValue;
            });
        }
    }

    @action
    async setAllowAcceptableAdsState(enabled) {
        const { SearchAndSelfPromoFilterId } = this.constants.AntiBannerFiltersId;
        await this.setFilterRelatedSettingState(
            SearchAndSelfPromoFilterId,
            this.KEYS.ALLOW_ACCEPTABLE_ADS,
            !enabled,
        );
    }

    @action
    async setBlockKnownTrackersState(enabled) {
        const { TrackingFilterId } = this.constants.AntiBannerFiltersId;
        await this.setFilterRelatedSettingState(
            TrackingFilterId,
            this.KEYS.BLOCK_KNOWN_TRACKERS,
            enabled,
        );
    }

    @action
    async setStripTrackingParametersState(enabled) {
        const { UrlTrackingFilterId } = this.constants.AntiBannerFiltersId;
        await this.setFilterRelatedSettingState(
            UrlTrackingFilterId,
            this.KEYS.STRIP_TRACKING_PARAMETERS,
            enabled,
        );
    }

    setSetting(filtersId, settingKey, filters) {
        const relatedFilter = filters
            .find((f) => f.filterId === filtersId);
        this[settingKey] = !!(relatedFilter.enabled);
    }

    @action
    setAllowAcceptableAds(filters) {
        const { SearchAndSelfPromoFilterId } = this.constants.AntiBannerFiltersId;
        this.setSetting(SearchAndSelfPromoFilterId, this.KEYS.ALLOW_ACCEPTABLE_ADS, filters);
    }

    @action
    setBlockKnownTrackers(filters) {
        const { TrackingFilterId } = this.constants.AntiBannerFiltersId;
        this.setSetting(TrackingFilterId, this.KEYS.BLOCK_KNOWN_TRACKERS, filters);
    }

    @action
    setStripTrackingParameters(filters) {
        const { UrlTrackingFilterId } = this.constants.AntiBannerFiltersId;
        this.setSetting(UrlTrackingFilterId, this.KEYS.STRIP_TRACKING_PARAMETERS, filters);
    }

    isFilterEnabled(filterId) {
        const filter = this.filters
            .find((f) => f.filterId === filterId);
        return filter.enabled;
    }

    isCategoryEnabled(categoryId) {
        const category = this.categories
            .find((c) => c.groupId === categoryId);
        return category.enabled;
    }

    /**
     * Checks whether the group is touched.
     *
     * @param {number} groupId Group id.
     *
     * @returns {boolean} True if the group is touched, false otherwise.
     */
    isGroupTouched(groupId) {
        return this.categories.some((c) => c.groupId === groupId && c.touched);
    }

    isAllowAcceptableAdsFilterEnabled() {
        const { SearchAndSelfPromoFilterId } = this.constants.AntiBannerFiltersId;
        return this.isFilterEnabled(SearchAndSelfPromoFilterId);
    }

    isBlockKnownTrackersFilterEnabled() {
        const { TrackingFilterId } = this.constants.AntiBannerFiltersId;
        return this.isFilterEnabled(TrackingFilterId);
    }

    isStripTrackingParametersFilterEnabled() {
        const { UrlTrackingFilterId } = this.constants.AntiBannerFiltersId;
        return this.isFilterEnabled(UrlTrackingFilterId);
    }

    /**
     * List of annoyances filters.
     */
    @computed
    get annoyancesFilters() {
        const annoyancesGroup = this.categories.find((group) => {
            return group.groupId === AntibannerGroupsId.AnnoyancesFiltersGroupId;
        });
        return annoyancesGroup.filters;
    }

    /**
     * List of recommended annoyances filters
     * which are only AdGuard annoyances filters.
     */
    @computed
    get recommendedAnnoyancesFilters() {
        return this.annoyancesFilters.filter((filter) => {
            return filter.tags.includes(RECOMMENDED_TAG_ID);
        });
    }

    /**
     * Used to display the last check time under all rules count.
     *
     * @returns {number} the latest check time of all filters.
     */
    @computed
    get latestCheckTime() {
        return Math.max(...this.filters
            .map(({ lastScheduledCheckTime, lastCheckTime }) => Math.max(
                lastScheduledCheckTime || 0,
                lastCheckTime || 0,
            )));
    }

    @action
    async updateGroupSetting(groupId, enabled) {
        const recommendedFiltersIds = await messenger.updateGroupStatus(groupId, enabled);
        await this.getRulesLimitsCounters();

        runInAction(() => {
            if (groupId === AntibannerGroupsId.OtherFiltersGroupId
                && this.isAllowAcceptableAdsFilterEnabled()) {
                this.allowAcceptableAds = enabled;
            } else if (groupId === AntibannerGroupsId.PrivacyFiltersGroupId) {
                if (this.isBlockKnownTrackersFilterEnabled()) {
                    this.blockKnownTrackers = enabled;
                }
                if (this.isStripTrackingParametersFilterEnabled()) {
                    this.stripTrackingParameters = enabled;
                }
            }
            this.categories.forEach((group) => {
                if (group.groupId === groupId) {
                    if (enabled) {
                        // eslint-disable-next-line no-param-reassign
                        group.enabled = true;
                    } else {
                        // eslint-disable-next-line no-param-reassign
                        delete group.enabled;
                    }
                }
            });

            if (Array.isArray(recommendedFiltersIds)) {
                recommendedFiltersIds.forEach((id) => {
                    this.setFilterEnabledState(id, true);
                });
            }
        });
    }

    @action
    updateGroupStateUI(groupId, enabled) {
        this.categories.forEach((category) => {
            if (category.groupId === groupId) {
                if (enabled) {
                    category.enabled = true;
                } else {
                    delete category.enabled;
                }
            }
        });
    }

    @action
    updateFilterStateUI(filterId, enabled) {
        this.filters.forEach((filter) => {
            if (filter.filterId === filterId) {
                if (enabled) {
                    filter.enabled = true;
                } else {
                    delete filter.enabled;
                }
            }
        });
    }

    @action
    setFiltersToGetConsentFor(filters) {
        this.filtersToGetConsentFor = filters;
    }

    @action
    refreshFilters(updatedFilters) {
        if (updatedFilters && updatedFilters.length) {
            updatedFilters.forEach((filter) => this.refreshFilter(filter));
        }
    }

    @action
    refreshFilter(filter) {
        if (!filter) {
            return;
        }

        const idx = this.filters.findIndex((f) => f.filterId === filter.filterId);
        if (idx !== -1) {
            Object.keys(filter).forEach((key) => {
                this.filters[idx][key] = filter[key];
            });
        }
    }

    @action
    setFilterEnabledState = (rawFilterId, enabled) => {
        const filterId = parseInt(rawFilterId, 10);
        this.filters.forEach((filter) => {
            if (filter.filterId === filterId) {
            // eslint-disable-next-line no-param-reassign
                filter.enabled = !!enabled;
            }
        });
        this.visibleFilters.forEach((filter) => {
            if (filter.filterId === filterId) {
            // eslint-disable-next-line no-param-reassign
                filter.enabled = !!enabled;
            }
        });
    };

    @action
    async updateFilterSetting(filterId, enabled) {
        /**
         * Optimistically set the enabled property to true.
         * The verified state of the filter will be emitted after the engine update.
         */
        // do not update filter state for mv3 optimistically
        if (!__IS_MV3__) {
            this.setFilterEnabledState(filterId, enabled);
        }

        try {
            const groupId = enabled
                ? await messenger.enableFilter(filterId)
                : await messenger.disableFilter(filterId);

            // update allow acceptable ads setting
            if (filterId === this.constants.AntiBannerFiltersId.SearchAndSelfPromoFilterId) {
                this.allowAcceptableAds = enabled;
            } else if (filterId === this.constants.AntiBannerFiltersId.TrackingFilterId) {
                this.blockKnownTrackers = enabled;
            } else if (filterId === this.constants.AntiBannerFiltersId.UrlTrackingFilterId) {
                this.stripTrackingParameters = enabled;
            }

            if (groupId) {
                const group = this.categories.find((group) => group.groupId === groupId);

                if (group) {
                    group.enabled = true;
                    // if any filter in group is enabled, the group is considered as touched
                    group.touched = true;
                }
            }
            if (__IS_MV3__) {
                this.setFilterEnabledState(filterId, enabled);
            }
        } catch (e) {
            logger.error('[ext.SettingsStore.updateFilterSetting]: failed to update filter setting: ', e);
            this.setFilterEnabledState(filterId, !enabled);
        }
    }

    @action
    setFiltersUpdating(value) {
        this.filtersUpdating = value;
    }

    @action
    async updateFilters() {
        this.setFiltersUpdating(true);
        try {
            // In MV3 we do not support checking update for filters.
            const filtersUpdates = __IS_MV3__
                ? []
                : await messenger.updateFilters();
            this.refreshFilters(filtersUpdates);
            setTimeout(() => {
                this.setFiltersUpdating(false);
            }, MIN_FILTERS_UPDATE_DISPLAY_DURATION_MS);
            return filtersUpdates;
        } catch (error) {
            this.setFiltersUpdating(false);
            throw error;
        }
    }

    /**
     * Adds a custom filter but does not enable it.
     *
     * @param {CustomFilterSubscriptionData} filter Custom filter data.
     *
     * @returns {Promise<number>} Custom filter id.
     */
    @action
    async addCustomFilter(filter) {
        const newFilter = await messenger.addCustomFilter(filter);

        if (!newFilter) {
            return;
        }

        runInAction(() => {
            /**
             * This was added because sometimes the filter might already be in the list.
             * It happens in the case where a filter was added and the engine fired an
             * event that it was updated and the options page already fetched options data.
             */
            if (!this.filters.some((f) => f.filterId === newFilter.filterId)) {
                this.filters.push(newFilter);
            }
            if (this.searchSelect !== SEARCH_FILTERS.ALL) {
                this.setSearchSelect(SEARCH_FILTERS.ALL);
            }
        });

        return newFilter.filterId;
    }

    @action
    async removeCustomFilter(filterId) {
        await messenger.removeCustomFilter(filterId);
        runInAction(() => {
            this.setFilters(this.filters.filter((filter) => filter.filterId !== filterId));
            this.setVisibleFilters(this.visibleFilters.filter((filter) => {
                return filter.filterId !== filterId;
            }));
        });
    }

    @action
    setAllowlist = (allowlist) => {
        this.allowlist = allowlist;
    };

    @action
    getAllowlist = async () => {
        try {
            const { content } = await messenger.getAllowlist();
            this.setAllowlist(content);
        } catch (e) {
            logger.error('[ext.SettingsStore]: failed to get allowlist: ', e);
        }
    };

    saveAllowlist = async (value) => {
        return new Promise((resolve, reject) => {
            try {
                this.savingAllowlistService.send({
                    type: SavingFSMEvent.Save,
                    value,
                    callback: resolve,
                });
            } catch (e) {
                reject(e);
            }
        });
    };

    @action
    setAllowlistEditorContentChangedState = (state) => {
        this.allowlistEditorContentChanged = state;
    };

    @action
    setSearchInput = (value) => {
        this.searchInput = value;
        this.sortFilters();
        this.sortSearchGroups();
        this.selectVisibleFilters();
    };

    @action
    setSearchSelect = (value) => {
        this.searchSelect = value;
        this.sortFilters();
        this.sortSearchGroups();
        this.selectVisibleFilters();
    };

    @computed
    get isSearching() {
        return this.searchSelect !== SEARCH_FILTERS.ALL || this.searchInput;
    }

    /**
     * We do not sort filters on every filters data update for better UI experience
     * Filters sort happens when user exits from filters group, or changes search filters
     */
    @action
    sortFilters = () => {
        this.setFilters(sortFilters(this.filters));
    };

    @action
    setFilters = (filters) => {
        this.filters = filters;
    };

    @action
    setVisibleFilters = (visibleFilters) => {
        this.visibleFilters = visibleFilters;
    };

    /**
     * We do not sort groups while search on every groups data update for better UI experience
     * Groups sort happens only when user changes search filters
     */
    @action
    sortSearchGroups = () => {
        this.setGroups(sortGroupsOnSearch(this.categories));
    };

    @action
    setGroups = (categories) => {
        this.categories = categories;
    };

    /**
     * We use visibleFilters for better UI experience, in order not to hide filter
     * when user enables/disables filter when he has chosen search filters
     * We update visibleFilters when search filters are updated
     *
     */
    @action
    selectVisibleFilters = () => {
        this.visibleFilters = this.filters.filter((filter) => {
            let searchMod;
            switch (this.searchSelect) {
                case SEARCH_FILTERS.ENABLED:
                    searchMod = filter.enabled;
                    break;
                case SEARCH_FILTERS.DISABLED:
                    searchMod = !filter.enabled;
                    break;
                default:
                    searchMod = true;
            }

            return searchMod;
        });
    };

    @computed
    get filtersToRender() {
        const searchInputString = this.searchInput.replace(WASTE_CHARACTERS, '\\$&');
        const searchQuery = new RegExp(searchInputString, 'ig');

        let selectedFilters;
        if (this.isSearching) {
            selectedFilters = this.visibleFilters;
        } else {
            selectedFilters = this.filters;
        }

        return selectedFilters.filter((filter) => {
            // If selected group of filters, prevent showing filters from
            // other groups.
            if (Number.isInteger(this.selectedGroupId) && filter.groupId !== this.selectedGroupId) {
                return false;
            }

            const nameIsMatching = filter.name.match(searchQuery);
            if (nameIsMatching) {
                return true;
            }

            if (filter.tagsDetails) {
                const tagKeywordIsMatching = filter.tagsDetails.some((tag) => `#${tag.keyword}`.match(searchQuery));
                if (tagKeywordIsMatching) {
                    return true;
                }
            }

            // AG-10491
            if (filter.trusted) {
                const trustedTagMatching = `#${TRUSTED_TAG_KEYWORD}`.match(searchQuery);
                if (trustedTagMatching) {
                    return true;
                }
            }

            return false;
        });
    }

    @computed
    get appearanceTheme() {
        if (!this.settings) {
            return null;
        }

        return this.settings.values[this.settings.names.AppearanceTheme];
    }

    @computed
    get showAdguardPromoInfo() {
        if (!this.settings) {
            return null;
        }
        return !this.settings.values[this.settings.names.DisableShowAdguardPromoInfo];
    }

    @action
    async hideAdguardPromoInfo() {
        await this.updateSetting(this.settings.names.DisableShowAdguardPromoInfo, true);
    }

    @computed
    get allowlistEditorWrapState() {
        if (this.allowlistEditorWrap === null) {
            this.allowlistEditorWrap = optionsStorage.getItem(
                optionsStorage.KEYS.ALLOWLIST_EDITOR_WRAP,
            );
        }
        return this.allowlistEditorWrap;
    }

    @action
    toggleAllowlistEditorWrap() {
        this.allowlistEditorWrap = !this.allowlistEditorWrap;
        optionsStorage.setItem(
            optionsStorage.KEYS.ALLOWLIST_EDITOR_WRAP,
            this.allowlistEditorWrap,
        );
    }

    @computed
    get footerRateShowState() {
        return !this.settings.values[this.settings.names.HideRateBlock];
    }

    @action
    async hideFooterRateShow() {
        await this.updateSetting(this.settings.names.HideRateBlock, true);
    }

    @action
    setFullscreenUserRulesEditorState(isOpen) {
        this.fullscreenUserRulesEditorIsOpen = isOpen;
    }

    @computed
    get isFullscreenUserRulesEditorOpen() {
        return this.fullscreenUserRulesEditorIsOpen;
    }

    @computed
    get userFilterEnabledSettingId() {
        return this.settings.names.UserFilterEnabled;
    }

    @computed
    get userFilterEnabled() {
        return this.settings.values[this.userFilterEnabledSettingId];
    }

    @action
    setAllowlistSizeReset(value) {
        this.allowlistSizeReset = value;
    }

    @computed
    get isUpdateFiltersButtonActive() {
        return this.filters.some((filter) => filter.enabled
            && this.isCategoryEnabled(filter.groupId));
    }

    @action
    setIsAnnoyancesConsentModalOpen = (value) => {
        this.isAnnoyancesConsentModalOpen = value;
    };

    @action
    setFilterIdSelectedForConsent = (filterId) => {
        this.filterIdSelectedForConsent = filterId;
        this.updateFilterStateUI(filterId, true);
    };

    @action
    handleFilterConsentCancel = () => {
        if (this.filterIdSelectedForConsent) {
            this.updateFilterStateUI(this.filterIdSelectedForConsent, false);
            this.filterIdSelectedForConsent = null;
            return;
        }

        // handle modal for group
        this.updateGroupStateUI(AntibannerGroupsId.AnnoyancesFiltersGroupId, false);
    };

    @action
    handleFilterConsentConfirm = async () => {
        if (this.filterIdSelectedForConsent) {
            await this.updateFilterSetting(this.filterIdSelectedForConsent, true);
            await messenger.setConsentedFilters([this.filterIdSelectedForConsent]);
            this.filterIdSelectedForConsent = null;
            return;
        }
        // handle consent modal for group
        await this.updateGroupSetting(AntibannerGroupsId.AnnoyancesFiltersGroupId, true);
        await messenger.setConsentedFilters(
            this.recommendedAnnoyancesFilters.map((f) => f.filterId),
        );
    };

    @computed
    get shouldShowFilterPolicy() {
        if (this.filterIdSelectedForConsent) {
            return this.recommendedAnnoyancesFilters.some((f) => f.filterId === this.filterIdSelectedForConsent);
        }
        // consent modal for group
        return true;
    }
}

export default SettingsStore;
