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
import { type CategoriesGroupData, type CategoriesFilterData } from 'filter-categories-api';

import {
    AntibannerGroupsId,
    AntiBannerFiltersId,
    RECOMMENDED_TAG_ID,
    TRUSTED_TAG_KEYWORD,
    WASTE_CHARACTERS,
} from '../../../../common/constants';
import { logger } from '../../../../common/logger';
import { sleep } from '../../../../common/sleep-utils';
import { UserAgent } from '../../../../common/user-agent';
import { type SettingOption, type Settings } from '../../../../background/schema/settings';
import { type GetOptionsDataResponse } from '../../../../background/services/settings';
import { type CustomFilterSubscriptionData } from '../../../../common/messages/constants';
import { type FilterMetadata } from '../../../../background/api/filters/main';
import {
    createSavingService,
    SavingFSMEvent,
    SavingFSMState,
    type SavingFSMStateType,
} from '../../../common/components/Editor/savingFSM';
import { messenger } from '../../../services/messenger';
import { SEARCH_FILTERS } from '../../components/Filters/Search/constants';
import {
    sortFilters,
    updateFilters,
    updateGroups,
    sortGroupsOnSearch,
} from '../../components/Filters/helpers';
import { optionsStorage } from '../../options-storage';
import { type AppearanceTheme } from '../../../../common/constants';
import { type RootStore } from '../RootStore';
import { type default as UiStore } from '../UiStore';

/**
 * Sometimes the options page might be opened before the background page or
 * service worker is ready to provide data.
 *
 * In this case, we need to retry getting data from the background.
 * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2712
 *
 * @param fetchFunction Function to fetch data from
 * the background page or service worker.
 *
 * @returns Data for the options page from the background page.
 */
export const fetchDataWithRetry = async <T>(
    fetchFunction: () => Promise<T>,
): Promise<T | null> => {
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
     * @param retryTimes - number of retries left
     */
    const innerRetry = async (retryTimes: number): Promise<T | null> => {
        if (retryTimes === 0) {
            logger.error('[ext.SettingsStore-common]: failed to get from the background service.');
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
            logger.warn('[ext.SettingsStore-common]: failed to get from the background service, will retry fetch. error: ', e);
            await sleep(RETRY_DELAY_MS);
            return innerRetry(retryTimes - 1);
        }
    };

    return innerRetry(TOTAL_RETRY_TIMES);
};

// Constants for filter-related setting keys
const FILTER_SETTING_KEYS = {
    ALLOW_ACCEPTABLE_ADS: 'allowAcceptableAds',
    BLOCK_KNOWN_TRACKERS: 'blockKnownTrackers',
    STRIP_TRACKING_PARAMETERS: 'stripTrackingParameters',
} as const;

// Type derived from constants
type FilterRelatedSettingKey = typeof FILTER_SETTING_KEYS[keyof typeof FILTER_SETTING_KEYS];

export abstract class SettingsStoreCommon {
    FILTER_SETTING_KEYS = FILTER_SETTING_KEYS;

    rootStore: RootStore;

    uiStore: UiStore;

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
                    // TODO: consider using sleepIfNecessary
                    await sleep(MIN_EXECUTION_TIME_REQUIRED_MS - timePassed);
                }

                await callback();
            },
        },
    });

    @observable
    settings: GetOptionsDataResponse['settings'] | null = null;

    @observable
    optionsReadyToRender = false;

    @observable
    appVersion: string | null = null;

    @observable
    libVersions: GetOptionsDataResponse['libVersions'] | null = null;

    @observable
    filters: CategoriesFilterData[] = [];

    @observable
    categories: CategoriesGroupData[] = [];

    @observable
    visibleFilters: CategoriesFilterData[] = [];

    @observable
    allowAcceptableAds: boolean | null = null;

    @observable
    blockKnownTrackers: boolean | null = null;

    @observable
    stripTrackingParameters: boolean | null = null;

    @observable
    allowlist = '';

    @observable
    savingAllowlistState: SavingFSMStateType = this.savingAllowlistService.getSnapshot().value;

    @observable
    selectedGroupId: number | null = null;

    @observable
    isChrome: boolean | null = null;

    @observable
    currentChromeVersion: number | null = UserAgent.isChromium ? Number(UserAgent.version) : null;

    @observable
    searchInput = '';

    @observable
    searchSelect = SEARCH_FILTERS.ALL;

    @observable
    allowlistEditorContentChanged = false;

    @observable
    allowlistEditorWrap: boolean | null = null;

    @observable
    fullscreenUserRulesEditorIsOpen = false;

    @observable
    allowlistSizeReset = false;

    @observable
    filtersToGetConsentFor: FilterMetadata[] = [];

    @observable
    isAnnoyancesConsentModalOpen = false;

    @observable
    filterIdSelectedForConsent: number | null = null;

    constructor(rootStore: RootStore) {
        makeObservable(this);
        this.rootStore = rootStore;
        this.uiStore = rootStore.uiStore;

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
    async checkLimitations() {
        const currentLimitsMv3 = await messenger.getCurrentLimits();

        this.uiStore.setStaticFiltersLimitsWarning(currentLimitsMv3.staticFiltersData);
        this.uiStore.setDynamicRulesLimitsWarning(currentLimitsMv3.dynamicRulesData);

        if (this.uiStore.dynamicRulesLimitsWarning) {
            this.uiStore.addRuleLimitsNotification(this.uiStore.dynamicRulesLimitsWarning);
        }

        return currentLimitsMv3;
    }

    @action
    async requestOptionsData(firstRender?: boolean): Promise<GetOptionsDataResponse | null> {
        // do not re-render options page if the annoyances consent modal is open.
        // it is needed to prevent switch disabling due to the actual state while the modal is shown
        if (this.isAnnoyancesConsentModalOpen) {
            return null;
        }

        let data: GetOptionsDataResponse | null = null;
        if (firstRender) {
            // on first render background service might not be ready to provide data, so we need to get it with retry
            data = await fetchDataWithRetry(messenger.getOptionsData.bind(messenger));
        } else {
            data = await messenger.getOptionsData();
        }

        if (!data) {
            return null;
        }

        this.applyOptionsData(data, firstRender);

        return data;
    }

    /**
     * Applies options data from the background to the options store state.
     *
     * @param data Options data payload for the page.
     * @param firstRender Whether this is the first render.
     */
    @action
    protected applyOptionsData(data: GetOptionsDataResponse, firstRender?: boolean): void {
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
        this.appVersion = data.appVersion;
        this.libVersions = data.libVersions;
        this.setAllowAcceptableAds(data.filtersMetadata.filters);
        this.setBlockKnownTrackers(data.filtersMetadata.filters);
        this.setStripTrackingParameters(data.filtersMetadata.filters);
        this.isChrome = data.environmentOptions.isChrome;
        this.optionsReadyToRender = true;
        this.fullscreenUserRulesEditorIsOpen = data.fullscreenUserRulesEditorIsOpen;
    }

    @action
    setSelectedGroupId(groupId: number | null): void {
        if (groupId === null) {
            this.selectedGroupId = null;
            return;
        }

        const groupExists = this.categories.find((category) => category.groupId === groupId);
        if (groupExists) {
            this.selectedGroupId = groupId;
        } else {
            this.selectedGroupId = null;
        }
    }

    @action
    async updateSetting<T extends SettingOption>(
        settingId: T,
        value: Settings[T],
        ignoreBackground = false,
    ): Promise<void> {
        if (!this.settings) {
            logger.debug('[ext.SettingsStoreCommon.updateSetting]: settings is not initialized yet');
            return;
        }
        this.settings.values[settingId] = value;

        if (!ignoreBackground) {
            await messenger.changeUserSetting(settingId, value);
        }
    }

    async setFilterRelatedSettingState(
        filterId: number,
        optionKey: FilterRelatedSettingKey,
        enabled: boolean,
    ): Promise<void> {
        const prevValue = this[optionKey];
        this[optionKey] = enabled;
        try {
            const relatedFilter = this.filters
                .find((f) => f.filterId === filterId);

            if (!relatedFilter) {
                logger.debug('[ext.SettingsStoreCommon.setFilterRelatedSettingState]: related filter not found');
                return;
            }

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
    async setAllowAcceptableAdsState(enabled: boolean): Promise<void> {
        await this.setFilterRelatedSettingState(
            AntiBannerFiltersId.SearchAndSelfPromoFilterId,
            this.FILTER_SETTING_KEYS.ALLOW_ACCEPTABLE_ADS,
            !enabled,
        );
    }

    @action
    async setBlockKnownTrackersState(enabled: boolean): Promise<void> {
        await this.setFilterRelatedSettingState(
            AntiBannerFiltersId.TrackingFilterId,
            this.FILTER_SETTING_KEYS.BLOCK_KNOWN_TRACKERS,
            enabled,
        );
    }

    @action
    async setStripTrackingParametersState(enabled: boolean): Promise<void> {
        await this.setFilterRelatedSettingState(
            AntiBannerFiltersId.UrlTrackingFilterId,
            this.FILTER_SETTING_KEYS.STRIP_TRACKING_PARAMETERS,
            enabled,
        );
    }

    private setSetting(
        filtersId: number,
        settingKey: FilterRelatedSettingKey,
        filters: CategoriesFilterData[],
    ): void {
        const relatedFilter = filters
            .find((f) => f.filterId === filtersId);
        this[settingKey] = !!(relatedFilter?.enabled);
    }

    @action
    setAllowAcceptableAds(filters: CategoriesFilterData[]): void {
        this.setSetting(AntiBannerFiltersId.SearchAndSelfPromoFilterId, 'allowAcceptableAds', filters);
    }

    @action
    setBlockKnownTrackers(filters: CategoriesFilterData[]): void {
        this.setSetting(AntiBannerFiltersId.TrackingFilterId, 'blockKnownTrackers', filters);
    }

    @action
    setStripTrackingParameters(filters: CategoriesFilterData[]): void {
        this.setSetting(AntiBannerFiltersId.UrlTrackingFilterId, 'stripTrackingParameters', filters);
    }

    private isFilterEnabled(filterId: number): boolean {
        const filter = this.filters
            .find((f) => f.filterId === filterId);
        return filter?.enabled === true;
    }

    private isCategoryEnabled(categoryId: number): boolean {
        const category = this.categories
            .find((c) => c.groupId === categoryId);
        return category?.enabled === true;
    }

    /**
     * Checks whether the group is touched.
     *
     * @param groupId Group id.
     *
     * @returns True if the group is touched, false otherwise.
     */
    isGroupTouched(groupId: number): boolean {
        return this.categories.some((c) => c.groupId === groupId && c.touched);
    }

    /**
     * List of annoyances filters.
     */
    @computed
    get annoyancesFilters(): CategoriesFilterData[] {
        const annoyancesGroup = this.categories.find((group) => {
            return group.groupId === AntibannerGroupsId.AnnoyancesFiltersGroupId;
        });
        return annoyancesGroup?.filters || [];
    }

    /**
     * List of recommended annoyances filters
     * which are only AdGuard annoyances filters.
     */
    @computed
    get recommendedAnnoyancesFilters(): CategoriesFilterData[] {
        return this.annoyancesFilters.filter((filter) => {
            return filter.tags.includes(RECOMMENDED_TAG_ID);
        });
    }

    @action
    async updateGroupSetting(groupId: number, enabled: boolean): Promise<void> {
        const recommendedFiltersIds = await messenger.updateGroupStatus(groupId, enabled);

        runInAction(() => {
            if (groupId === AntibannerGroupsId.OtherFiltersGroupId
                && this.isFilterEnabled(AntiBannerFiltersId.SearchAndSelfPromoFilterId)) {
                this.allowAcceptableAds = enabled;
            } else if (groupId === AntibannerGroupsId.PrivacyFiltersGroupId) {
                if (this.isFilterEnabled(AntiBannerFiltersId.TrackingFilterId)) {
                    this.blockKnownTrackers = enabled;
                }
                if (this.isFilterEnabled(AntiBannerFiltersId.UrlTrackingFilterId)) {
                    this.stripTrackingParameters = enabled;
                }
            }
            this.categories.forEach((group) => {
                if (group.groupId === groupId) {
                    group.enabled = enabled;
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
    updateGroupStateUI(groupId: number, enabled: boolean): void {
        this.categories.forEach((category) => {
            if (category.groupId === groupId) {
                category.enabled = enabled;
            }
        });
    }

    @action
    updateFilterStateUI(filterId: number, enabled: boolean): void {
        this.filters.forEach((filter) => {
            if (filter.filterId === filterId) {
                filter.enabled = enabled;
            }
        });
    }

    @action
    setFiltersToGetConsentFor(filters: FilterMetadata[]): void {
        this.filtersToGetConsentFor = filters;
    }

    @action
    refreshFilters(updatedFilters?: FilterMetadata[]): void {
        if (updatedFilters && updatedFilters.length) {
            updatedFilters.forEach((filter) => this.refreshFilter(filter));
        }
    }

    @action
    refreshFilter(filter: Partial<CategoriesFilterData>): void {
        if (!filter || typeof filter.filterId !== 'number') {
            return;
        }

        const idx = this.filters.findIndex((f) => f.filterId === filter.filterId);
        if (idx === -1) {
            logger.debug('[ext.SettingsStoreCommon.refreshFilter]: filter not found', filter);
            return;
        }

        const targetFilter = this.filters[idx];
        if (!targetFilter) {
            return;
        }

        SettingsStoreCommon.updateObjectProperties(targetFilter, filter);
    }

    @action
    setFilterEnabledState = (filterId: number, enabled: boolean): void => {
        this.filters.forEach((filter) => {
            if (filter.filterId === filterId) {
                filter.enabled = !!enabled;
            }
        });

        this.visibleFilters.forEach((filter) => {
            if (filter.filterId === filterId) {
                filter.enabled = !!enabled;
            }
        });
    };

    /**
     * Core logic for updating filter setting.
     * Sends request to backend, updates related states and UI.
     *
     * @param filterId Target filter id.
     * @param enabled Desired enabled state.
     *
     * @returns True if update was successful, false otherwise.
     */
    @action
    async updateFilterSettingCore(filterId: number, enabled: boolean): Promise<boolean> {
        try {
            const groupId = enabled
                ? await messenger.enableFilter(filterId)
                : await messenger.disableFilter(filterId);

            // update allow acceptable ads setting
            if (filterId === AntiBannerFiltersId.SearchAndSelfPromoFilterId) {
                this.allowAcceptableAds = enabled;
            } else if (filterId === AntiBannerFiltersId.TrackingFilterId) {
                this.blockKnownTrackers = enabled;
            } else if (filterId === AntiBannerFiltersId.UrlTrackingFilterId) {
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

            return true;
        } catch (e) {
            logger.error('[ext.SettingsStoreCommon.updateFilterSettingCore]: failed to update filter setting: ', e);
            this.setFilterEnabledState(filterId, !enabled);

            return false;
        }
    }

    /**
     * Toggles a single filter and updates related settings and groups state.
     *
     * @param filterId Target filter id.
     * @param enabled Desired enabled state.
     */
    abstract updateFilterSetting(filterId: number, enabled: boolean): Promise<void>;

    /**
     * Adds a custom filter but does not enable it.
     *
     * @param {CustomFilterSubscriptionData} filter Custom filter data.
     *
     * @returns {Promise<number>} Custom filter id.
     */
    @action
    async addCustomFilter(filter: CustomFilterSubscriptionData): Promise<number | undefined> {
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
    async removeCustomFilter(filterId: number): Promise<void> {
        await messenger.removeCustomFilter(filterId);
        runInAction(() => {
            this.setFilters(this.filters.filter((filter) => filter.filterId !== filterId));
            this.setVisibleFilters(this.visibleFilters.filter((filter) => {
                return filter.filterId !== filterId;
            }));
        });
    }

    @action
    setAllowlist = (allowlist: string): void => {
        this.allowlist = allowlist;
    };

    @action
    getAllowlist = async () => {
        try {
            const { content } = await messenger.getAllowlist();
            this.setAllowlist(content);
        } catch (e) {
            logger.error('[ext.SettingsStoreCommon]: failed to get allowlist: ', e);
        }
    };

    saveAllowlist = async (value: string): Promise<void> => {
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
    setAllowlistEditorContentChangedState = (state: boolean): void => {
        this.allowlistEditorContentChanged = state;
    };

    @action
    setSearchInput = (value: string): void => {
        this.searchInput = value;
        this.sortFilters();
        this.sortSearchGroups();
        this.selectVisibleFilters();
    };

    @action
    setSearchSelect = (value: string): void => {
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
    setFilters = (filters: CategoriesFilterData[]): void => {
        this.filters = filters;
    };

    @action
    setVisibleFilters = (visibleFilters: CategoriesFilterData[]): void => {
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
    setGroups = (categories: CategoriesGroupData[]): void => {
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
            if ('trusted' in filter && filter.trusted) {
                const trustedTagMatching = `#${TRUSTED_TAG_KEYWORD}`.match(searchQuery);
                if (trustedTagMatching) {
                    return true;
                }
            }

            return false;
        });
    }

    @computed
    get appearanceTheme(): AppearanceTheme | null {
        if (!this.settings) {
            logger.debug('[ext.SettingsStoreCommon.appearanceTheme]: settings is not initialized yet');
            return null;
        }

        return this.settings.values[this.settings.names.AppearanceTheme];
    }

    @computed
    get showAdguardPromoInfo(): boolean | null {
        if (!this.settings) {
            logger.debug('[ext.SettingsStoreCommon.showAdguardPromoInfo]: settings is not initialized yet');
            return null;
        }
        return !this.settings.values[this.settings.names.DisableShowAdguardPromoInfo];
    }

    @action
    async hideAdguardPromoInfo(): Promise<void> {
        if (!this.settings) {
            logger.debug('[ext.SettingsStoreCommon.hideAdguardPromoInfo]: settings is not initialized yet');
            return;
        }
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
    get footerRateShowState(): boolean {
        if (!this.settings) {
            logger.debug('[ext.SettingsStoreCommon.footerRateShowState]: settings is not initialized yet');
            return false;
        }
        return !this.settings.values[this.settings.names.HideRateBlock];
    }

    @action
    async hideFooterRateShow(): Promise<void> {
        if (!this.settings) {
            logger.debug('[ext.SettingsStoreCommon.hideFooterRateShow]: settings is not initialized yet');
            return;
        }
        await this.updateSetting(this.settings.names.HideRateBlock, true);
    }

    @action
    setFullscreenUserRulesEditorState(isOpen: boolean): void {
        this.fullscreenUserRulesEditorIsOpen = isOpen;
    }

    @computed
    get isFullscreenUserRulesEditorOpen(): boolean {
        return this.fullscreenUserRulesEditorIsOpen;
    }

    @computed
    get userFilterEnabledSettingId(): SettingOption.UserFilterEnabled | null {
        if (!this.settings) {
            logger.debug('[ext.SettingsStoreCommon.userFilterEnabledSettingId]: settings is not initialized yet');
            return null;
        }
        return this.settings.names.UserFilterEnabled;
    }

    @computed
    get userFilterEnabled(): boolean | null {
        if (!this.settings || !this.userFilterEnabledSettingId) {
            logger.debug('[ext.SettingsStoreCommon.userFilterEnabled]: settings is not initialized yet');
            return null;
        }

        return this.settings.values[this.userFilterEnabledSettingId];
    }

    @action
    setAllowlistSizeReset(value: boolean): void {
        this.allowlistSizeReset = value;
    }

    @computed
    get isUpdateFiltersButtonActive() {
        return this.filters.some((filter) => filter.enabled
            && this.isCategoryEnabled(filter.groupId));
    }

    @action
    setIsAnnoyancesConsentModalOpen = (value: boolean): void => {
        this.isAnnoyancesConsentModalOpen = value;
    };

    @action
    setFilterIdSelectedForConsent = (filterId: number): void => {
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

    /**
     * Type-safe method to update object properties for MobX reactivity.
     * Updates each property individually to ensure MobX observers are triggered.
     */
    private static updateObjectProperties<T extends Record<string, any>>(
        target: T,
        source: Partial<T>,
    ): void {
        const keys = Object.keys(source) as Array<keyof T>;
        keys.forEach((key) => {
            const value = source[key];
            if (value !== undefined) {
                target[key] = value;
            }
        });
    }
}
