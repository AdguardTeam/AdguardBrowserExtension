import {
    action,
    computed,
    makeObservable,
    observable,
    runInAction,
} from 'mobx';

import { log } from '../../../common/log';
import { createSavingService, EVENTS as SAVING_FSM_EVENTS, STATES } from '../components/Editor/savingFSM';
import { sleep } from '../../helpers';
import { messenger } from '../../services/messenger';
import { OTHER_FILTERS_GROUP_ID } from '../../../../../tools/constants';
import { SEARCH_FILTERS } from '../components/Filters/Search/constants';
import { sortFilters, updateFilters } from '../components/Filters/helpers';

const savingUserRulesService = createSavingService({
    id: 'userRules',
    services: {
        saveData: (_, e) => messenger.saveUserRules(e.value),
    },
});

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
    @observable settings = null;

    @observable optionsReadyToRender = false;

    @observable version = null;

    @observable filters = [];

    @observable categories = [];

    @observable visibleFilters = [];

    @observable rulesCount = 0;

    @observable allowAcceptableAds = null;

    @observable userRules = '';

    @observable allowlist = '';

    @observable savingRulesState = savingUserRulesService.initialState.value;

    @observable savingAllowlistState = savingAllowlistService.initialState.value;

    @observable filtersUpdating = false;

    @observable selectedGroupId = null;

    @observable isChrome = null;

    @observable searchInput = '';

    @observable searchSelect = SEARCH_FILTERS.ALL;

    @observable userRulesEditorContentChanged = false;

    @observable allowlistEditorContentChanged = false;

    constructor(rootStore) {
        makeObservable(this);
        this.rootStore = rootStore;

        savingUserRulesService.onTransition((state) => {
            runInAction(() => {
                this.savingRulesState = state.value;
                if (state.value === STATES.SAVING) {
                    this.userRulesEditorContentChanged = false;
                }
            });
        });

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
            this.categories = data.filtersMetadata.categories;
            this.rulesCount = data.filtersInfo.rulesCount;
            this.version = data.appVersion;
            this.constants = data.constants;
            this.setAllowAcceptableAds(data.filtersMetadata.filters);
            this.isChrome = data.environmentOptions.isChrome;
            this.optionsReadyToRender = true;
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
    async updateSetting(settingId, value) {
        await messenger.changeUserSetting(settingId, value);
        runInAction(() => {
            this.settings.values[settingId] = value;
        });
    }

    @action
    setAllowAcceptableAds(filters) {
        const { SEARCH_AND_SELF_PROMO_FILTER_ID } = this.constants.AntiBannerFiltersId;
        const allowAcceptableAdsFilter = filters
            .find((f) => f.filterId === SEARCH_AND_SELF_PROMO_FILTER_ID);
        this.allowAcceptableAds = !!(allowAcceptableAdsFilter.enabled);
    }

    @action
    async setAllowAcceptableAdsState(enabled) {
        const { SEARCH_AND_SELF_PROMO_FILTER_ID } = this.constants.AntiBannerFiltersId;
        const prevValue = this.allowAcceptableAds;
        this.allowAcceptableAds = enabled;
        try {
            const allowAcceptableAdsFilter = this.filters
                .find((f) => f.filterId === SEARCH_AND_SELF_PROMO_FILTER_ID);

            if (enabled) {
                await messenger.enableFilter(SEARCH_AND_SELF_PROMO_FILTER_ID);
                await this.updateGroupSetting(allowAcceptableAdsFilter.groupId, enabled);
            } else {
                await messenger.disableFilter(SEARCH_AND_SELF_PROMO_FILTER_ID);
            }

            allowAcceptableAdsFilter.enabled = enabled;
            this.refreshFilter(allowAcceptableAdsFilter);
        } catch (e) {
            runInAction(() => {
                this.allowAcceptableAds = prevValue;
            });
        }
    }

    isAllowAcceptableAdsFilterEnabled() {
        const { SEARCH_AND_SELF_PROMO_FILTER_ID } = this.constants.AntiBannerFiltersId;
        const allowAcceptableAdsFilter = this.filters
            .find((f) => f.filterId === SEARCH_AND_SELF_PROMO_FILTER_ID);
        return allowAcceptableAdsFilter.enabled;
    }

    @computed
    get lastUpdateTime() {
        return Math.max(...this.filters.map((filter) => filter.lastCheckTime || 0));
    }

    @action
    async updateGroupSetting(id, enabled) {
        await messenger.updateGroupStatus(id, enabled);
        runInAction(() => {
            const groupId = parseInt(id, 10);
            if (groupId === OTHER_FILTERS_GROUP_ID && this.isAllowAcceptableAdsFilterEnabled()) {
                this.allowAcceptableAds = enabled;
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
            if (filterId === this.constants.AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID) {
                this.allowAcceptableAds = enabled;
            }
        } catch (e) {
            log.error(e);
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
            }, 2000);
            return filtersUpdates;
        } catch (error) {
            this.setFiltersUpdating(false);
            throw error;
        }
    }

    @action
    async addCustomFilter(filter) {
        const newFilter = await messenger.addCustomFilter(filter);
        runInAction(() => {
            this.filters.push(newFilter);
        });
    }

    @action
    async removeCustomFilter(filterId) {
        await messenger.removeCustomFilter(filterId);
        runInAction(() => {
            this.setFilters(this.filters.filter((filter) => filter.filterId !== filterId));
        });
    }

    @action
    setUserRules = (userRules) => {
        this.userRules = userRules;
    };

    @action
    async getUserRules() {
        try {
            const { content } = await messenger.getUserRules();
            this.setUserRules(content);
        } catch (e) {
            log.debug(e);
        }
    }

    @action
    async saveUserRules(value) {
        this.userRules = value;
        savingUserRulesService.send(SAVING_FSM_EVENTS.SAVE, { value });
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
            log.debug(e);
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
    setUserRulesEditorContentChangedState = (state) => {
        this.userRulesEditorContentChanged = state;
    };

    @action
    setAllowlistEditorContentChangedState = (state) => {
        this.allowlistEditorContentChanged = state;
    };

    @action
    setSearchInput = (value) => {
        this.searchInput = value;
        this.sortFilters();
        this.selectVisibleFilters();
    };

    @action
    setSearchSelect = (value) => {
        this.searchSelect = value;
        this.sortFilters();
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
        const searchInputString = this.searchInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
                return filter.name.match(searchQuery);
            });
    }

    @computed
    get appearanceTheme() {
        if (!this.settings) {
            return null;
        }

        return this.settings.values[this.settings.names.APPEARANCE_THEME];
    }

    @computed
    get showAdguardPromoInfo() {
        if (!this.settings) {
            return null;
        }
        return !this.settings.values[this.settings.names.DISABLE_SHOW_ADGUARD_PROMO_INFO];
    }

    @action
    async hideAdguardPromoInfo() {
        await this.updateSetting(this.settings.names.DISABLE_SHOW_ADGUARD_PROMO_INFO, true);
    }
}

export default SettingsStore;
