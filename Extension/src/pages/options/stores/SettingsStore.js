import {
    action,
    observable,
    runInAction,
    makeObservable,
} from 'mobx';

import { log } from '../../../background/utils/log';
import messenger from '../../services/messenger';

class SettingsStore {
    @observable settings = null;

    @observable optionsReadyToRender = false;

    @observable version = null;

    @observable filtersMetadata = {};

    @observable allowAcceptableAds = null;

    @observable userRules = '';

    constructor(rootStore) {
        makeObservable(this);
        this.rootStore = rootStore;
    }

    @action
    async requestOptionsData() {
        const data = await messenger.getOptionsData();
        runInAction(() => {
            this.settings = data.settings;
            this.filtersMetadata = data.filtersMetadata;
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

    @action
    setUserRules = (userRules) => {
        this.userRules = userRules;
    }

    @action
    async getUserRules() {
        try {
            const userRules = await messenger.getUserRules();
            this.setUserRules(userRules);
        } catch (e) {
            log.debug(e);
        }
    }

    @action
    // eslint-disable-next-line class-methods-use-this
    async saveUserRules(value) {
        try {
            await messenger.saveUserRules(value);
        } catch (e) {
            log.debug(e);
        }
    }
}

export default SettingsStore;
