import {
    action,
    observable,
    computed,
    runInAction,
    makeObservable,
} from 'mobx';

import { log } from '../../../background/utils/log';
import messenger from '../../services/messenger';
import { savingRulesService, EVENTS as SAVING_RULES_FSM_EVENTS } from '../components/UserRules/savingRulesFSM';

class SettingsStore {
    @observable settings = null;

    @observable optionsReadyToRender = false;

    @observable version = null;

    @observable filters = {};

    @observable categories = {};

    @observable rulesCount = 0;

    @observable allowAcceptableAds = null;

    @observable userRules = '';

    @observable savingRulesState = savingRulesService.initialState.value;

    @observable filtersUpdating = false;

    constructor(rootStore) {
        makeObservable(this);
        this.rootStore = rootStore;

        savingRulesService.onTransition((state) => {
            runInAction(() => {
                this.savingRulesState = state.value;
            });
        });
    }

    @action
    async requestOptionsData() {
        const data = await messenger.getOptionsData();
        runInAction(() => {
            this.settings = data.settings;
            this.filters = data.filtersMetadata.filters;
            this.categories = data.filtersMetadata.categories;
            this.rulesCount = data.filtersInfo.rulesCount;
            this.version = data.appVersion;
            this.constants = data.constants;
            this.optionsReadyToRender = true;
            this.setAllowAcceptableAds(data.filtersMetadata.filters);
        });
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
    async setAllowAcceptableAdsValue(value) {
        const { SEARCH_AND_SELF_PROMO_FILTER_ID } = this.constants.AntiBannerFiltersId;
        const prevValue = this.allowAcceptableAds;
        this.allowAcceptableAds = value;
        try {
            if (value) {
                await messenger.enableFilter(SEARCH_AND_SELF_PROMO_FILTER_ID);
            } else {
                await messenger.disableFilter(SEARCH_AND_SELF_PROMO_FILTER_ID);
            }
        } catch (e) {
            runInAction(() => {
                this.allowAcceptableAds = prevValue;
            });
        }
    }

    @computed
    get lastUpdateTime() {
        return Math.max(...this.filters.map((filter) => filter.lastCheckTime || 0));
    }

    @action
    async updateGroupSetting(id, enabled) {
        await messenger.updateGroupStatus(id, enabled);
        runInAction(() => {
            this.categories.forEach((group) => {
                if (group.groupId === id - 0) {
                    // eslint-disable-next-line no-unused-expressions, no-param-reassign
                    enabled ? group.enabled = true : delete group.enabled;
                }
            });
        });
    }

    @action
    async updateFilterSetting(id, enabled) {
        await messenger.updateFilterStatus(id, enabled);
        runInAction(() => {
            this.filters.forEach((filter) => {
                if (filter.filterId === parseInt(id, 10)) {
                    if (enabled) {
                        filter.enabled = true;
                    } else {
                        delete filter.enabled;
                    }
                }
            });
        });
    }

    @action
    setFiltersUpdating(value) {
        this.filtersUpdating = value;
    }

    @action
    async updateFilters() {
        this.setFiltersUpdating(true);
        try {
            const filtersUpdates = await messenger.updateFilters(this.filters);
            this.setFiltersUpdating(false);
            return filtersUpdates;
        } catch (error) {
            this.setFiltersUpdating(false);
            // TODO: add localization
            return 'Filters update error';
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
            this.filters = this.filters.filter((filter) => filter.filterId !== filterId);
        });
    }

    @action
    setUserRules = (userRules) => {
        this.userRules = userRules;
    }

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
        savingRulesService.send(SAVING_RULES_FSM_EVENTS.SAVE, { value });
    }
}

export default SettingsStore;
