import {
    action,
    observable,
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

    @observable filtersMetadata = {};

    @observable allowAcceptableAds = null;

    @observable userRules = '';

    @observable savingRulesState = savingRulesService.initialState.value;

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
            const { content } = await messenger.getUserRules();
            this.setUserRules(content);
        } catch (e) {
            log.debug(e);
        }
    }

    @action
    // eslint-disable-next-line class-methods-use-this
    async saveUserRules(value) {
        savingRulesService.send(SAVING_RULES_FSM_EVENTS.SAVE, { value });
    }
}

export default SettingsStore;
