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
import { MESSAGE_TYPES } from '../../../common/constants';

// Do not allow property change outside of store actions
configure({ enforceActions: 'observed' });

class PopupStore {
    TOTAL_BLOCKED_GROUP_ID = 'total';

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
    selectedTimeRange = TIME_RANGES.WEEK;

    @observable
    selectedBlockedType = this.TOTAL_BLOCKED_GROUP_ID;

    @observable
    promoNotification = null;

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
            this.promoNotification = options.notification;

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
    };

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
    };

    getDataByRange = (stats, range) => {
        switch (range) {
            case TIME_RANGES.DAY:
                return stats.lastMonth[stats.lastMonth.length - 1];
            case TIME_RANGES.WEEK: {
                const result = {};
                for (let i = 0; i < stats.lastWeek.length; i += 1) {
                    const day = stats.lastWeek[i];
                    // eslint-disable-next-line no-restricted-syntax
                    for (const type of Object.keys(day)) {
                        result[type] = (result[type] || 0) + day[type];
                    }
                }
                return result;
            }
            case TIME_RANGES.MONTH:
                return stats.lastYear[stats.lastYear.length - 1];
            case TIME_RANGES.YEAR: {
                const result = {};
                for (let i = 0; i < stats.lastYear.length; i += 1) {
                    const month = stats.lastYear[i];
                    // eslint-disable-next-line no-restricted-syntax
                    for (const type of Object.keys(month)) {
                        result[type] = (result[type] || 0) + month[type];
                    }
                }
                return result;
            }
            default:
                throw new Error('There is no such time range type');
        }
    }

    @computed
    get statsDataByType() {
        const { stats } = this;

        if (!stats) {
            return null;
        }

        const statsDataForCurrentRange = this.getDataByRange(stats, this.selectedTimeRange);

        const { blockedGroups } = stats;

        return blockedGroups
            .slice()
            .sort((groupA, groupB) => groupA.displayNumber - groupB.displayNumber)
            .map((group) => {
                const { groupId, groupName } = group;
                const blocked = statsDataForCurrentRange[group.groupId];
                return {
                    groupId,
                    blocked,
                    groupName,
                };
            })
            .filter((group) => group.blocked > 0 || group.groupId === this.TOTAL_BLOCKED_GROUP_ID);
    }

    @action
    setSelectedBlockedType = (value) => {
        this.selectedBlockedType = value;
    };

    @action
    setSelectedTimeRange = (value) => {
        this.selectedTimeRange = value;
    };

    @action
    closePromoNotification = async () => {
        this.promoNotification = null;
        await messenger.sendMessage(MESSAGE_TYPES.SET_NOTIFICATION_VIEWED, { withDelay: false });
    }

    @action
    openPromoNotificationUrl = async () => {
        const { url } = this.promoNotification;
        runInAction(() => {
            this.promoNotification = null;
        });
        await messenger.sendMessage(MESSAGE_TYPES.SET_NOTIFICATION_VIEWED, { withDelay: false });
        await messenger.sendMessage('openTab', { url });
    }

    @action
    updateBlockedStats = (tabInfo) => {
        this.totalBlocked = tabInfo.totalBlocked;
        this.totalBlockedTab = tabInfo.totalBlockedTab;
    }
}

export const popupStore = createContext(new PopupStore());
