import {
    action,
    observable,
    computed,
    runInAction,
    makeObservable,
} from 'mobx';

import messenger from '../../services/messenger';

class SettingsStore {
    @observable settings = null;

    @observable optionsReadyToRender = false;

    @observable version = null;

    @observable filters = {};

    @observable categories = {};

    @observable rulesCount = 0;

    @observable allowAcceptableAds = null;

    @observable filtersUpdating = false;

    constructor(rootStore) {
        makeObservable(this);
        this.rootStore = rootStore;
    }

    @action
    async requestOptionsData() {
        const data = await messenger.getOptionsData();
        runInAction(() => {
            this.settings = data.settings;
            this.filters = data.filtersMetadata.filters;
            this.categories = data.filtersMetadata.categories;
            // this.rulesCount = data.filtersStats.rulesCount;
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
        return Math.max(...this.filters.map((filter) => filter.lastUpdateTime || 0));
    }

    @action
    async updateGroupSetting(id, data) {
        await messenger.updateGroupStatus(id, data);
        // console.log(JSON.stringify(this.categories, null, 4));
        runInAction(() => {
            this.categories.forEach((group) => {
                if (group.groupId === id - 0) {
                    // eslint-disable-next-line no-unused-expressions, no-param-reassign
                    data ? group.enabled = true : delete group.enabled;
                }
            });
        });
    }

    @action
    async updateFilterSetting(id, data) {
        await messenger.updateFilterStatus(id, data);
        runInAction(() => {
            this.filters.forEach((filter) => {
                if (filter.filterId === id - 0) {
                    // eslint-disable-next-line no-unused-expressions, no-param-reassign
                    data ? filter.enabled = true : delete filter.enabled;
                }
            });
        });
    }

    @action
    async updateFilters() {
        this.filtersUpdating = true;
        try {
            const filtersUpdates = await messenger.updateFilters();
            this.filtersUpdating = false;
            return filtersUpdates;
        } catch (error) {
            this.filtersUpdating = false;
            return false;
        }
    }
}

export default SettingsStore;
