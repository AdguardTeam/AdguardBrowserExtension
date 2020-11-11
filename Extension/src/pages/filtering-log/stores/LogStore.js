import {
    observable,
    makeObservable,
    action,
    computed,
    runInAction,
} from 'mobx';
import _ from 'lodash';

import { messenger } from '../../services/messenger';
import { containsIgnoreCase } from '../../helpers';
import { RequestTypes } from '../../../background/utils/request-types';

class LogStore {
    @observable filteringEvents = [];

    @observable tabsMap = {};

    @observable selectedTabId = null;

    @observable eventsSearchValue = '';

    @observable filterByEventType = null;

    @observable searchRegular = false;

    @observable searchBlocked = false;

    @observable searchModified = false;

    @observable searchUserFilter = false;

    @observable searchThirdParty = false;

    @observable searchFirstParty = false;

    @observable searchFirstThirdParty = false;

    @observable searchWhitelisted = false;

    eventTypes = {
        All: null,
        HTML: RequestTypes.DOCUMENT,
        CSS: RequestTypes.STYLESHEET,
        JavaScript: RequestTypes.SCRIPT,
        Ajax: RequestTypes.XMLHTTPREQUEST,
        Image: RequestTypes.IMAGE,
        Media: RequestTypes.MEDIA,
        Other: RequestTypes.OTHER,
    };

    @observable preserveLogEnabled = false;

    constructor(rootStore) {
        this.rootStore = rootStore;
        makeObservable(this);
    }

    @action
    onTabUpdate(tabInfo) {
        const { tabId } = tabInfo;
        this.tabsMap[tabId] = tabInfo;
    }

    @action
    async onTabClose(tabInfo) {
        delete this.tabsMap[tabInfo.tabId];
        const [firstTabInfo] = Object.values(this.tabsMap);
        await this.setSelectedTabId(firstTabInfo.tabId);
    }

    @action
    onTabReset(tabInfo) {
        if (this.selectedTabId === tabInfo.tabId && !this.preserveLogEnabled) {
            this.filteringEvents = [];
        }
    }

    @action
    onEventUpdated(tabInfo, filteringEvent) {
        if (tabInfo.tabId !== this.selectedTabId) {
            return;
        }
        const { eventId } = filteringEvent;
        let eventIdx = _.findIndex(this.filteringEvents, { eventId });
        eventIdx = eventIdx === -1 ? this.filteringEvents.length : eventIdx;
        this.filteringEvents.splice(eventIdx, 1, filteringEvent);
    }

    @action
    onEventAdded(tabInfo, filteringEvent) {
        const { tabId } = tabInfo;
        if (tabId !== this.selectedTabId) {
            return;
        }

        // clear events
        if (filteringEvent.requestType === 'DOCUMENT'
            && !filteringEvent.element
            && !filteringEvent.script
            && !this.preserveLogEnabled) {
            this.filteringEvents = [];
        }

        this.filteringEvents.push(filteringEvent);
    }

    @computed
    get tabs() {
        return Object.values(this.tabsMap)
            .filter((tab) => !tab.isExtensionTab);
    }

    @action
    getEventsByTabId = async (tabId) => {
        const filteringInfo = await messenger.getFilteringInfoByTabId(tabId);
        runInAction(() => {
            this.filteringEvents = filteringInfo?.filteringEvents || [];
        });
    }

    @action
    setSelectedTabId = async (tabId) => {
        this.selectedTabId = Number.parseInt(tabId, 10);
        await this.getEventsByTabId(tabId);
    }

    @action
    synchronizeOpenTabs = async () => {
        const tabsInfo = await messenger.synchronizeOpenTabs();
        runInAction(() => {
            tabsInfo.forEach((tabInfo) => {
                const { tabId } = tabInfo;
                this.tabsMap[tabId] = tabInfo;
            });
        });
    }

    @computed
    get events() {
        const filteredEvents = this.filteringEvents.filter((filteringEvent) => {
            let show = !this.eventsSearchValue
                || containsIgnoreCase(filteringEvent.requestUrl, this.eventsSearchValue)
                || containsIgnoreCase(filteringEvent.element, this.eventsSearchValue)
                || containsIgnoreCase(filteringEvent.cookieName, this.eventsSearchValue)
                || containsIgnoreCase(filteringEvent.cookieValue, this.eventsSearchValue);

            const ruleText = filteringEvent?.requestRule?.ruleText;
            if (ruleText) {
                show = show || containsIgnoreCase(ruleText, this.eventsSearchValue);
            }

            if (filteringEvent.filterName) {
                show = show
                    || containsIgnoreCase(filteringEvent.filterName, this.eventsSearchValue);
            }

            // console.log(JSON.stringify(filteringEvent.requestRule, null, 4));

            if ((this.filterByEventType && filteringEvent.requestType !== this.filterByEventType)
                || (this.searchWhitelisted && !filteringEvent.requestRule?.whitelistRule)
                || (this.searchBlocked && (!filteringEvent.requestRule || filteringEvent.requestRule?.whitelistRule))
                || (this.searchThirdParty && !filteringEvent.requestThirdParty)
                || (this.searchFirstParty && filteringEvent.requestThirdParty)
                || (this.searchModified && !filteringEvent.requestRule?.isModifyingCookieRule)
                // TODO add condition for regular rules
                || (this.searchUserFilter && (!filteringEvent.requestRule || filteringEvent.requestRule?.filterId !== 0))) {
                return false;
            }
            return show;
        });

        const events = filteredEvents.map((filteringEvent) => {
            const {
                requestUrl: url,
                requestType: type,
                requestRule: rule,
                frameDomain: source,
            } = filteringEvent;

            return {
                url,
                type,
                rule: rule?.ruleText,
                filter: rule?.filterId, // TODO get filter title,
                source,
            };
        });

        return events;
    }

    @action
    clearFilteringEvents = async () => {
        await messenger.clearEventsByTabId(this.selectedTabId);
        runInAction(() => {
            this.filteringEvents = [];
        });
    }

    @action
    setEventsSearchValue = (value) => {
        this.eventsSearchValue = value;
    };

    @action
    setFilterEventType = (type) => {
        this.filterByEventType = this.eventTypes[type];
    };

    @action
    refreshPage = async () => {
        if (this.selectedTabId === -1) {
            if (this.preserveLogEnabled) {
                return;
            }
            await messenger.clearEventsByTabId(this.selectedTabId);
            return;
        }
        await messenger.refreshPage(this.selectedTabId, this.preserveLogEnabled);
    }

    @action
    setPreserveLog = (value) => {
        this.preserveLogEnabled = value;
    }

    @action
    setSearchRegular = (enabled) => {
        this.searchRegular = enabled;
    }

    @action
    setSearchBlocked = (enabled) => {
        this.searchBlocked = enabled;
    }

    @action
    setSearchModified = (enabled) => {
        this.searchModified = enabled;
    }

    @action
    setSearchUserFilter = (enabled) => {
        this.searchUserFilter = enabled;
    }

    @action
    setSearchFirstParty = (enabled) => {
        this.searchFirstParty = enabled;
    }

    @action
    setSearchThirdParty = (enabled) => {
        this.searchThirdParty = enabled;
    }

    @action
    setSearchFirstThirdParty = (enabled) => {
        this.searchFirstThirdParty = enabled;
    }

    @action
    setSearchWhitelisted = (enabled) => {
        this.searchWhitelisted = enabled;
    }
}

export { LogStore };
