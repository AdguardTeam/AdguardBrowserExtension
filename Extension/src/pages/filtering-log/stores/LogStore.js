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

    searchPartyFilter = {
        SEARCH_FIRST_PARTY: 'searchFirstParty',
        SEARCH_THIRD_PARTY: 'searchThirdParty',
        SEARCH_ALL: 'searchAll',
    }

    @observable miscellaneousFilters = {
        searchRegular: false,
        searchWhitelisted: false,
        searchBlocked: false,
        searchModified: false,
        searchUserFilter: false,
        searchParty: this.searchPartyFilter.SEARCH_ALL,
    };

    @observable eventTypesFilters = [
        {
            name: 'HTML',
            type: RequestTypes.DOCUMENT,
            enabled: true,
        },
        {
            name: 'CSS',
            type: RequestTypes.STYLESHEET,
            enabled: true,
        },
        {
            name: 'JavaScript',
            type: RequestTypes.SCRIPT,
            enabled: true,
        },
        {
            name: 'Ajax',
            type: RequestTypes.XMLHTTPREQUEST,
            enabled: true,
        },
        {
            name: 'Image',
            type: RequestTypes.IMAGE,
            enabled: true,
        },
        {
            name: 'Media',
            type: RequestTypes.MEDIA,
            enabled: true,
        },
        {
            name: 'Other',
            type: RequestTypes.OTHER,
            enabled: true,
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
    toggleEventTypesFilter = (name) => {
        this.eventTypesFilters.forEach((filter) => {
            if (filter.name === name) {
                filter.enabled = !filter.enabled;
            }
        });
    }

    @action
    toggleAllEventTypesFilters = () => {
        // enable all filters if any filter disabled
        // or disable all filters if all filters enabled
        const enabled = this.eventTypesFilters.some((filter) => !filter.enabled);
        this.eventTypesFilters.forEach((filter) => { filter.enabled = enabled; });
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
                ?.enabled;
            if (!eventTypesFilterValue) {
                return false;
            }

            // TODO add condition for regular rules
            // whitelisted events filter
            if ((this.miscellaneousFilters.searchWhitelisted && !filteringEvent.requestRule?.whitelistRule)
                // blocked events filter
                || (this.miscellaneousFilters.searchBlocked && (!filteringEvent.requestRule || filteringEvent.requestRule?.whitelistRule))
                // first party events filter
                || (this.miscellaneousFilters.searchParty === this.searchPartyFilter.SEARCH_FIRST_PARTY && filteringEvent.requestThirdParty)
                // third party events filter
                || (this.miscellaneousFilters.searchParty === this.searchPartyFilter.SEARCH_THIRD_PARTY && !filteringEvent.requestThirdParty)
                // modifying cookie events filter
                || (this.miscellaneousFilters.searchModified && !filteringEvent.requestRule?.isModifyingCookieRule)
                // user rules events filter
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
