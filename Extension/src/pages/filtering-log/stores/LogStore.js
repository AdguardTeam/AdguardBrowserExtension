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

    @observable preserveLogEnabled = false;

    @observable miscellaneousFilters = {
        searchRegular: false,
        searchWhitelisted: false,
        searchBlocked: false,
        searchModified: false,
        searchUserFilter: false,
        searchFirstThirdParty: true,
        searchFirstParty: false,
        searchThirdParty: false,
    };

    @observable eventTypesFilters = [
        {
            name: 'HTML',
            type: RequestTypes.DOCUMENT,
            value: true,
        },
        {
            name: 'CSS',
            type: RequestTypes.STYLESHEET,
            value: true,
        },
        {
            name: 'JavaScript',
            type: RequestTypes.SCRIPT,
            value: true,
        },
        {
            name: 'Ajax',
            type: RequestTypes.XMLHTTPREQUEST,
            value: true,
        },
        {
            name: 'Image',
            type: RequestTypes.IMAGE,
            value: true,
        },
        {
            name: 'Media',
            type: RequestTypes.MEDIA,
            value: true,
        },
        {
            name: 'Other',
            type: RequestTypes.OTHER,
            value: true,
        },
    ];

    constructor(rootStore) {
        this.rootStore = rootStore;
        makeObservable(this);
    }

    @action
    setMiscellaneousFilterValue = (filter, value) => {
        this.miscellaneousFilters[filter] = value;
    }

    @action
    setEventTypesFiltersValue = (name) => {
        this.eventTypesFilters.forEach((filter) => {
            if (filter.name === name) {
                filter.value = !filter.value;
            }
        });
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

            const eventTypesFilterValue = this.eventTypesFilters
                .find((filter) => filter.type === filteringEvent.requestType)
                ?.value;
            if (!eventTypesFilterValue) {
                return false;
            }

            if ((this.miscellaneousFilters.searchWhitelisted && !filteringEvent.requestRule?.whitelistRule)
                || (this.miscellaneousFilters.searchBlocked && (!filteringEvent.requestRule || filteringEvent.requestRule?.whitelistRule))
                || (this.miscellaneousFilters.searchThirdParty && !filteringEvent.requestThirdParty)
                || (this.miscellaneousFilters.searchFirstParty && filteringEvent.requestThirdParty)
                || (this.miscellaneousFilters.searchModified && !filteringEvent.requestRule?.isModifyingCookieRule)
                // TODO add condition for regular rules
                || (this.miscellaneousFilters.searchUserFilter && (!filteringEvent.requestRule || filteringEvent.requestRule?.filterId !== 0))) {
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
}

export { LogStore };
