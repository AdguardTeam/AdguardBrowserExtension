import { createContext } from 'react';
import browser from 'webextension-polyfill';
import {
    action,
    computed,
    configure,
    observable,
    runInAction,
    makeObservable,
} from 'mobx';

import { messenger } from '../../services/messenger';
import { POPUP_STATES, TIME_RANGES, VIEW_STATES } from '../constants';
import { reactTranslator } from '../../reactCommon/reactTranslator';

// Do not allow property change outside of store actions
configure({ enforceActions: 'observed' });

class PopupStore {
    @observable
    applicationFilteringDisabled = null;

    @observable
    applicationAvailable = true;

    @observable
    url = null;

    @observable
    viewState = VIEW_STATES.ACTIONS;

    @observable
    totalBlocked = 0;

    @observable
    totalBlockedTab = 0;

    @observable
    documentAllowlisted = null;

    @observable
    userAllowlisted = null;

    @observable
    showInfoAboutFullVersion = true;

    @observable
    isEdgeBrowser = false;

    @observable
    stats = null;

    @observable
    range = TIME_RANGES.WEEK

    constructor() {
        makeObservable(this);
    }

    @action
    getPopupData = async () => {
        // get current tab id
        const tabs = await browser.tabs.query({
            active: true,
            currentWindow: true,
        });
        const currentTab = tabs?.[0];

        const response = await messenger.getTabInfoForPopup(currentTab?.id);
        const { stats } = await messenger.getStatisticsData();

        runInAction(() => {
            const { frameInfo, options } = response;

            // frame info
            this.applicationFilteringDisabled = frameInfo.applicationFilteringDisabled;
            this.applicationAvailable = frameInfo.applicationAvailable;
            this.url = frameInfo.url;
            this.totalBlocked = frameInfo.totalBlocked;
            this.totalBlockedTab = frameInfo.totalBlockedTab;
            this.domainName = frameInfo.domainName;
            this.documentAllowlisted = frameInfo.documentAllowlisted;
            this.userAllowlisted = frameInfo.userAllowlisted;
            this.canAddRemoveRule = frameInfo.canAddRemoveRule;

            // options
            this.showInfoAboutFullVersion = options.showInfoAboutFullVersion;
            this.isEdgeBrowser = options.isEdgeBrowser;

            // stats
            this.stats = stats;
        });
    };

    @action
    changeApplicationFilteringDisabled = async (state) => {
        await messenger.changeApplicationFilteringDisabled(state);

        runInAction(() => {
            this.applicationFilteringDisabled = state;
        });
    };

    @action
    setViewState = (state) => {
        this.viewState = state;
    };

    @computed
    get currentSite() {
        if (this.applicationAvailable) {
            return this.domainName ? this.domainName : this.url;
        }
        return this.url;
    }

    @computed
    get currentStatusMessage() {
        let messageKey = '';

        if (!this.applicationAvailable) {
            messageKey = 'popup_site_filtering_state_secure_page';
        } else if (this.documentAllowlisted && !this.userAllowlisted) {
            messageKey = '';
        } else if (this.applicationFilteringDisabled) {
            messageKey = 'popup_site_filtering_state_paused';
        } else if (this.documentAllowlisted) {
            messageKey = 'popup_site_filtering_state_disabled';
        } else {
            messageKey = 'popup_site_filtering_state_enabled';
        }

        if (messageKey) {
            return reactTranslator.translate(messageKey);
        }

        return null;
    }

    @action
    toggleAllowlisted = () => {
        if (!this.applicationAvailable || this.applicationFilteringDisabled) {
            return;
        }
        if (!this.canAddRemoveRule) {
            return;
        }

        let isAllowlisted = this.documentAllowlisted;

        if (isAllowlisted) {
            messenger.removeAllowlistDomain();
            isAllowlisted = false;
        } else {
            messenger.addAllowlistDomain();
            isAllowlisted = true;
        }

        runInAction(() => {
            this.documentAllowlisted = isAllowlisted;
            this.userAllowlisted = isAllowlisted;
            this.totalBlockedTab = 0;
        });
    }

    @computed
    get popupState() {
        if (this.applicationFilteringDisabled) {
            return POPUP_STATES.APPLICATION_FILTERING_DISABLED;
        }

        if (!this.applicationAvailable) {
            return POPUP_STATES.APPLICATION_UNAVAILABLE;
        }

        if (!this.canAddRemoveRule) {
            return POPUP_STATES.SITE_IN_EXCEPTION;
        }

        if (this.documentAllowlisted) {
            return POPUP_STATES.SITE_ALLOWLISTED;
        }

        return POPUP_STATES.APPLICATION_ENABLED;
    }

    @action
    getStatisticsData = async () => {
        const { stats } = await messenger.getStatisticsData();
        runInAction(() => {
            this.stats = stats;
        });
    }

    @computed
    get statsDataByType() {
        const { stats } = this;

        if (!stats) {
            return null;
        }

        let result = {};

        switch (this.range) {
            case TIME_RANGES.DAY:
                result = stats.lastMonth[stats.lastMonth.length - 1];
                break;
            case TIME_RANGES.WEEK: {
                for (let i = 0; i < stats.lastWeek.length; i += 1) {
                    const day = stats.lastWeek[i];
                    // eslint-disable-next-line no-restricted-syntax
                    for (const type in Object.keys(day)) {
                        if (day[type]) {
                            result[type] = (result[type] ? result[type] : 0) + day[type];
                        }
                    }
                }
                break;
            }
            case TIME_RANGES.MONTH:
                result = stats.lastYear[stats.lastYear.length - 1];
                break;
            case TIME_RANGES.YEAR: {
                for (let i = 0; i < stats.lastYear.length; i += 1) {
                    const month = stats.lastYear[i];
                    // eslint-disable-next-line no-restricted-syntax
                    for (const type in Object.keys(month)) {
                        if (month[type]) {
                            result[type] = (result[type] ? result[type] : 0) + month[type];
                        }
                    }
                }
                break;
            }
            default:
                throw new Error('There is no such time range type');
        }

        const { blockedGroups } = stats;

        return blockedGroups
            .slice()
            .sort((groupA, groupB) => groupA.displayNumber - groupB.displayNumber)
            .map((group) => {
                const { groupId, groupName } = group;
                const blocked = result[group.groupId];
                return {
                    groupId, blocked, groupName,
                };
            })
            .filter((group) => group.blocked > 0);
    }
}

export const popupStore = createContext(new PopupStore());
