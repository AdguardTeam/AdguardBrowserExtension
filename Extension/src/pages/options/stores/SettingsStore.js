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
import { debounce } from 'lodash';

import { Log } from '../../../common/log';
import {
    createSavingService,
    EVENTS as SAVING_FSM_EVENTS,
    STATES,
} from '../../common/components/Editor/savingFSM';
import { MIN_FILTERS_UPDATE_DISPLAY_DURATION_MS } from '../../common/constants';
import { sleep } from '../../helpers';
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
    TRUSTED_TAG,
    WASTE_CHARACTERS,
} from '../../../common/constants';

const savingAllowlistService = createSavingService({
    id: 'allowlist',
    services: {
        saveData: async (_, e) => {
            /**
             * If saveAllowlist executes faster than MIN_EXECUTION_TIME_REQUIRED_MS we increase
             * execution time for smoother user experience
             */
            const MIN_EXECUTION_TIME_REQUIRED_MS = 500;
            const start = Date.now();
            await messenger.saveAllowlist(e.value);
            const end = Date.now();
            const timePassed = end - start;
            if (timePassed < MIN_EXECUTION_TIME_REQUIRED_MS) {
                await sleep(MIN_EXECUTION_TIME_REQUIRED_MS - timePassed);
            }
        },
    },
});

class SettingsStore {
    KEYS = {
        ALLOW_ACCEPTABLE_ADS: 'allowAcceptableAds',
        BLOCK_KNOWN_TRACKERS: 'blockKnownTrackers',
        STRIP_TRACKING_PARAMETERS: 'stripTrackingParameters',
    };

    @observable settings = null;

    @observable optionsReadyToRender = false;

    @observable version = null;

    @observable filters = [];

    @observable categories = [];

    @observable visibleFilters = [];

    @observable rulesCount = 0;

    @observable allowAcceptableAds = null;

    @observable blockKnownTrackers = null;

    @observable stripTrackingParameters = null;

    @observable allowlist = '';

    @observable savingAllowlistState = savingAllowlistService.initialState.value;

    @observable filtersUpdating = false;

    @observable selectedGroupId = null;

    @observable isChrome = null;

    @observable searchInput = '';

    @observable searchSelect = SEARCH_FILTERS.ALL;

    @observable allowlistEditorContentChanged = false;

    @observable allowlistEditorWrap = null;

    @observable fullscreenUserRulesEditorIsOpen = false;

    @observable allowlistSizeReset = false;

    static UPDATE_SETTINGS_DEBOUNCE_MS = 1000;

    debounceChangeUserSetting = debounce((settingId, value) => {
        messenger.changeUserSetting(settingId, value);
    }, SettingsStore.UPDATE_SETTINGS_DEBOUNCE_MS);

    constructor(rootStore) {
        makeObservable(this);
        this.rootStore = rootStore;

        savingAllowlistService.onTransition((state) => {
            runInAction(() => {
                this.savingAllowlistState = state.value;
                if (state.value === STATES.SAVING) {
                    this.allowlistEditorContentChanged = false;
                }
            });
        });
    }

    @action
    async requestOptionsData(firstRender) {
        const data = await messenger.getOptionsData();
        runInAction(() => {
            this.settings = data.settings;
            // on first render we sort filters to show enabled on the top
            // filter should remain on the same place event after being enabled or disabled
            if (firstRender) {
                this.setFilters(sortFilters(data.filtersMetadata.filters));
            } else {
                // on the next filters updates, we update filters keeping order
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
            this.constants = data.constants;
            this.setAllowAcceptableAds(data.filtersMetadata.filters);
            this.setBlockKnownTrackers(data.filtersMetadata.filters);
            this.setStripTrackingParameters(data.filtersMetadata.filters);
            this.isChrome = data.environmentOptions.isChrome;
            this.optionsReadyToRender = true;
            this.fullscreenUserRulesEditorIsOpen = data.fullscreenUserRulesEditorIsOpen;
        });
    }

    @action
    updateRulesCount(rulesCount) {
        this.rulesCount = rulesCount;
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
    updateSetting(settingId, value, ignoreBackground = false) {
        this.settings.values[settingId] = value;

        if (!ignoreBackground) {
            this.debounceChangeUserSetting(settingId, value);
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

    isAllowAcceptableAdsFilterEnabled() {
        const { SearchAndSelfPromoFilterId } = this.constants.AntiBannerFiltersId;
        this.isFilterEnabled(SearchAndSelfPromoFilterId);
    }

    isBlockKnownTrackersFilterEnabled() {
        const { TrackingFilterId } = this.constants.AntiBannerFiltersId;
        this.isFilterEnabled(TrackingFilterId);
    }

    isStripTrackingParametersFilterEnabled() {
        const { UrlTrackingFilterId } = this.constants.AntiBannerFiltersId;
        this.isFilterEnabled(UrlTrackingFilterId);
    }

    @computed
    get lastUpdateTime() {
        // TODO: lastCheckTime or lastUpdateTime?
        return Math.max(...this.filters.map((filter) => filter.lastCheckTime || 0));
    }

    @action
    async updateGroupSetting(id, enabled) {
        await messenger.updateGroupStatus(id, enabled);
        runInAction(() => {
            const groupId = parseInt(id, 10);
            if (groupId === AntibannerGroupsId.OtherFiltersGroupId
                && this.isAllowAcceptableAdsFilterEnabled()) {
                this.allowAcceptableAds = enabled;
            } else if (groupId === AntibannerGroupsId.PrivacyFilterGroupId) {
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
        });
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
    async updateFilterSetting(rawFilterId, enabled) {
        const filterId = Number.parseInt(rawFilterId, 10);
        this.setFilterEnabledState(filterId, enabled);
        try {
            const filters = await messenger.updateFilterStatus(filterId, enabled);
            this.refreshFilters(filters);
            // update allow acceptable ads setting
            if (filterId === this.constants.AntiBannerFiltersId.SearchAndSelfPromoFilterId) {
                this.allowAcceptableAds = enabled;
            } else if (filterId === this.constants.AntiBannerFiltersId.TrackingFilterId) {
                this.blockKnownTrackers = enabled;
            } else if (filterId === this.constants.AntiBannerFiltersId.UrlTrackingFilterId) {
                this.stripTrackingParameters = enabled;
            }
        } catch (e) {
            Log.error(e);
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
            const filtersUpdates = await messenger.updateFilters();
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

    @action
    async addCustomFilter(filter) {
        const newFilter = await messenger.addCustomFilter(filter);

        if (!newFilter) {
            return;
        }

        runInAction(() => {
            this.filters.push(newFilter);
            /**
             * Optimistically set the enabled property to true.
             * The verified state of the filter will be emitted after the engine update.
             */
            this.setFilterEnabledState(newFilter.filterId, true);

            if (this.searchSelect !== SEARCH_FILTERS.ALL) {
                this.setSearchSelect(SEARCH_FILTERS.ALL);
            }
        });
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
            Log.debug(e);
        }
    };

    @action
    appendAllowlist = async (allowlist) => {
        await this.saveAllowlist(this.allowlist.concat('\n', allowlist));
    };

    @action
    saveAllowlist = async (allowlist) => {
        await savingAllowlistService.send(SAVING_FSM_EVENTS.SAVE, { value: allowlist });
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

        return selectedFilters
            .filter((filter) => {
                if (Number.isInteger(this.selectedGroupId)) {
                    return filter.groupId === this.selectedGroupId;
                }
                return true;
            })
            .filter((filter) => {
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
                if (filter.trusted && filter.trusted === true) {
                    const trustedTagMatching = `#${TRUSTED_TAG}`.match(searchQuery);
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
}

export default SettingsStore;
