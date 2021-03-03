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
import { getFilterName } from '../components/RequestWizard/utils';
import { reactTranslator } from '../../../common/translators/reactTranslator';

export const MISCELLANEOUS_FILTERS = {
    REGULAR: 'regular',
    ALLOWLISTED: 'allowlisted',
    BLOCKED: 'blocked',
    MODIFIED: 'modified',
    USER_FILTER: 'user_filter',
};

export const REQUEST_SOURCE_FILTERS = {
    FIRST_PARTY: 'first_party',
    THIRD_PARTY: 'third_party',
};

class LogStore {
    @observable filteringEvents = [];

    @observable tabsMap = {};

    @observable selectedTabId = null;

    @observable eventsSearchValue = '';

    @observable preserveLogEnabled = false;

    @observable selectedEvent = null;

    @observable filtersMetadata = null;

    @observable miscellaneousFilters = {
        [MISCELLANEOUS_FILTERS.REGULAR]: false,
        [MISCELLANEOUS_FILTERS.ALLOWLISTED]: false,
        [MISCELLANEOUS_FILTERS.BLOCKED]: false,
        [MISCELLANEOUS_FILTERS.MODIFIED]: false,
        [MISCELLANEOUS_FILTERS.USER_FILTER]: false,
    };

    @observable requestSourceFilters = {
        [REQUEST_SOURCE_FILTERS.FIRST_PARTY]: false,
        [REQUEST_SOURCE_FILTERS.FIRST_PARTY]: false,
    };

    @observable eventTypesFilters = [
        {
            name: 'HTML',
            title: 'HTML',
            type: RequestTypes.DOCUMENT,
            enabled: true,
        },
        {
            name: 'CSS',
            title: 'CSS',
            type: RequestTypes.STYLESHEET,
            enabled: true,
        },
        {
            name: 'JavaScript',
            title: 'JavaScript',
            type: RequestTypes.SCRIPT,
            enabled: true,
        },
        {
            name: 'Ajax',
            title: 'Ajax',
            type: RequestTypes.XMLHTTPREQUEST,
            enabled: true,
        },
        {
            name: 'Image',
            title: reactTranslator.getMessage('filtering_type_image'),
            type: RequestTypes.IMAGE,
            enabled: true,
        },
        {
            name: 'Media',
            title: reactTranslator.getMessage('filtering_type_media'),
            type: RequestTypes.MEDIA,
            enabled: true,
        },
        {
            name: 'Other',
            title: reactTranslator.getMessage('filtering_type_other'),
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
    };

    @action
    setRequestSourceFilterValue = (filter, value) => {
        this.requestSourceFilters[filter] = value;
    };

    @action
    toggleEventTypesFilter = (name) => {
        this.eventTypesFilters.forEach((filter) => {
            if (filter.name === name) {
                // eslint-disable-next-line no-param-reassign
                filter.enabled = !filter.enabled;
            }
        });
    };

    @action
    toggleAllEventTypesFilters = () => {
        // enable all filters if any filter disabled
        // or disable all filters if all filters enabled
        const enabled = this.eventTypesFilters.some((filter) => !filter.enabled);
        this.eventTypesFilters.forEach((filter) => {
            // eslint-disable-next-line no-param-reassign
            filter.enabled = enabled;
        });
    };

    @action
    onTabUpdate(tabInfo) {
        const { tabId } = tabInfo;
        this.tabsMap[tabId] = tabInfo;
    }

    @action
    async onTabClose(tabInfo) {
        delete this.tabsMap[tabInfo.tabId];
        if (tabInfo.tabId === this.selectedTabId) {
            const [firstTabInfo] = Object.values(this.tabsMap);
            await this.setSelectedTabId(firstTabInfo.tabId);
        }
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
        if (tabInfo.tabId !== this.selectedTabId) {
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
    };

    @action
    setSelectedTabId = async (tabId) => {
        this.selectedTabId = Number.parseInt(tabId, 10);
        await this.getEventsByTabId(tabId);
    };

    @action
    synchronizeOpenTabs = async () => {
        const tabsInfo = await messenger.synchronizeOpenTabs();
        runInAction(() => {
            tabsInfo.forEach((tabInfo) => {
                const { tabId } = tabInfo;
                this.tabsMap[tabId] = tabInfo;
            });
        });
    };

    @action
    getLogInitData = async () => {
        const initData = await messenger.getLogInitData();
        const { filtersMetadata } = initData;

        runInAction(() => {
            this.filtersMetadata = filtersMetadata;
        });
    };

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

            const isAllowlisted = filteringEvent.requestRule?.whitelistRule;
            const isBlocked = filteringEvent.requestRule
                && !filteringEvent.requestRule.whitelistRule;
            const isModified = filteringEvent.requestRule?.isModifyingCookieRule;
            const isUserFilter = filteringEvent.requestRule?.filterId === 0;
            const isFirstParty = !filteringEvent.requestThirdParty;
            const isThirdParty = filteringEvent.requestThirdParty;
            const isRegular = !isAllowlisted && !isBlocked && !isModified;

            // filter by miscellaneous filters
            const showByMiscellaneous = !Object.values(this.miscellaneousFilters).some(_.identity)
                || (this.miscellaneousFilters[MISCELLANEOUS_FILTERS.REGULAR] && isRegular)
                || (this.miscellaneousFilters[MISCELLANEOUS_FILTERS.ALLOWLISTED] && isAllowlisted)
                || (this.miscellaneousFilters[MISCELLANEOUS_FILTERS.BLOCKED] && isBlocked)
                || (this.miscellaneousFilters[MISCELLANEOUS_FILTERS.MODIFIED] && isModified)
                || (this.miscellaneousFilters[MISCELLANEOUS_FILTERS.USER_FILTER] && isUserFilter);

            if (!showByMiscellaneous) {
                return false;
            }

            // filter by request source filter
            const showByRequestSource = !Object.values(this.requestSourceFilters).some(_.identity)
            || (this.requestSourceFilters[REQUEST_SOURCE_FILTERS.FIRST_PARTY] && isFirstParty)
            || (this.requestSourceFilters[REQUEST_SOURCE_FILTERS.THIRD_PARTY] && isThirdParty);

            if (!showByRequestSource) {
                return false;
            }

            return show;
        });

        const events = filteredEvents.map((filteringEvent) => {
            const {
                requestRule,
            } = filteringEvent;

            return {
                ...filteringEvent,
                ruleText: requestRule?.ruleText,
                filterName: getFilterName(requestRule?.filterId, this.filtersMetadata),
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
    };

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
    };

    @action
    setPreserveLog = (value) => {
        this.preserveLogEnabled = value;
    };

    @action
    setSelectedEventById = (eventId) => {
        this.selectedEvent = _.find(this.filteringEvents, { eventId });
        this.rootStore.wizardStore.openModal();
    };
}

export { LogStore };
