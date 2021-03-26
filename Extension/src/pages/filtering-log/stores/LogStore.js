import {
    observable,
    makeObservable,
    action,
    computed,
    runInAction,
} from 'mobx';
import findIndex from 'lodash/findIndex';
import find from 'lodash/find';
import identity from 'lodash/identity';

import { reactTranslator } from '../../../common/translators/reactTranslator';
import { RequestTypes } from '../../../background/utils/request-types';
import { messenger } from '../../services/messenger';
import { containsIgnoreCase } from '../../helpers';
import { getFilterName } from '../components/RequestWizard/utils';
import { matchesSearch } from './helpers';

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

    @observable settings = null;

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
            types: [RequestTypes.DOCUMENT, RequestTypes.SUBDOCUMENT],
            enabled: true,
        },
        {
            name: 'CSS',
            title: 'CSS',
            types: [RequestTypes.STYLESHEET],
            enabled: true,
        },
        {
            name: 'JavaScript',
            title: 'JavaScript',
            types: [RequestTypes.SCRIPT],
            enabled: true,
        },
        {
            name: 'Ajax',
            title: 'Ajax',
            types: [RequestTypes.XMLHTTPREQUEST],
            enabled: true,
        },
        {
            name: 'Image',
            title: reactTranslator.getMessage('filtering_type_image'),
            types: [RequestTypes.IMAGE],
            enabled: true,
        },
        {
            name: 'Media',
            title: reactTranslator.getMessage('filtering_type_media'),
            types: [RequestTypes.OBJECT, RequestTypes.MEDIA],
            enabled: true,
        },
        {
            name: 'Other',
            title: reactTranslator.getMessage('filtering_type_other'),
            types: [
                RequestTypes.OTHER,
                RequestTypes.FONT,
                RequestTypes.WEBSOCKET,
                RequestTypes.CSP,
                RequestTypes.COOKIE,
                RequestTypes.PING,
                RequestTypes.WEBRTC,
            ],
            enabled: true,
        },
    ];

    @observable
    selectIsOpen = false;

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
    selectOneEventTypesFilter = (name) => {
        const isMultipleFiltersSelected = this.eventTypesFilters
            .filter((filter) => filter.enabled).length > 1;

        this.eventTypesFilters.forEach((filter) => {
            if (filter.name === name) {
                // eslint-disable-next-line no-param-reassign
                filter.enabled = isMultipleFiltersSelected ? true : !filter.enabled;
            } else {
                // eslint-disable-next-line no-param-reassign
                filter.enabled = false;
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

    formatEvent = (filteringEvent) => {
        const { requestRule } = filteringEvent;

        const ruleText = requestRule?.ruleText;

        if (ruleText) {
            // eslint-disable-next-line no-param-reassign
            filteringEvent.ruleText = ruleText;
        }

        const filterId = requestRule?.filterId;

        if (filterId) {
            // eslint-disable-next-line no-param-reassign
            filteringEvent.filterName = getFilterName(filterId, this.filtersMetadata);
        }

        return filteringEvent;
    };

    @action
    onEventUpdated(tabInfo, filteringEvent) {
        if (tabInfo.tabId !== this.selectedTabId) {
            return;
        }
        const { eventId } = filteringEvent;
        let eventIdx = findIndex(this.filteringEvents, { eventId });
        eventIdx = eventIdx === -1 ? this.filteringEvents.length : eventIdx;
        this.filteringEvents.splice(eventIdx, 1, this.formatEvent(filteringEvent));
    }

    @action
    onSettingUpdated(name, value) {
        if (!this.settings) {
            return;
        }
        this.settings.values[name] = value;
    }

    @action
    onEventAdded(tabInfo, filteringEvent) {
        if (tabInfo.tabId !== this.selectedTabId) {
            return;
        }

        // clear events
        if (filteringEvent.requestType === 'DOCUMENT'
            && !filteringEvent?.requestRule?.isModifyingCookieRule
            && !filteringEvent.element
            && !filteringEvent.script
            && !this.preserveLogEnabled) {
            this.filteringEvents = [];
        }

        this.filteringEvents.push(this.formatEvent(filteringEvent));
    }

    getTabs = () => {
        return Object.values(this.tabsMap)
            .filter((tab) => !tab.isExtensionTab);
    }

    @action
    setSelectIsOpenState = (value) => {
        this.selectIsOpen = value;
    };

    @computed
    get tabs() {
        // while tab select is open we return prev tabs
        // to stop select from re-rendering during selection
        if (this.selectIsOpen) {
            if (!this.prevTabs) {
                this.prevTabs = this.getTabs();
            }
            return this.prevTabs;
        }

        const tabs = this.getTabs();

        this.prevTabs = tabs;
        return tabs;
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
    getFilteringLogData = async () => {
        const { filtersMetadata, settings } = await messenger.getFilteringLogData();

        runInAction(() => {
            this.filtersMetadata = filtersMetadata;
            this.settings = settings;
        });
    };

    @computed
    get events() {
        const filteredEvents = this.filteringEvents.filter((filteringEvent) => {
            const show = matchesSearch(filteringEvent, this.eventsSearchValue);

            // Filter by requestType
            const { requestType } = filteringEvent;
            // check if request type is in eventTypesFilters
            const filterForRequestType = this.eventTypesFilters.find((filter) => {
                // Cookie rules have document request type,
                // but they refer to "other" filtering log events
                if (filteringEvent?.requestRule?.isModifyingCookieRule) {
                    return filter.types.includes(RequestTypes.COOKIE);
                }
                return filter.types.includes(requestType);
            });

            if (!filterForRequestType?.enabled) {
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
            const showByMiscellaneous = !Object.values(this.miscellaneousFilters).some(identity)
                || (this.miscellaneousFilters[MISCELLANEOUS_FILTERS.REGULAR] && isRegular)
                || (this.miscellaneousFilters[MISCELLANEOUS_FILTERS.ALLOWLISTED] && isAllowlisted)
                || (this.miscellaneousFilters[MISCELLANEOUS_FILTERS.BLOCKED] && isBlocked)
                || (this.miscellaneousFilters[MISCELLANEOUS_FILTERS.MODIFIED] && isModified)
                || (this.miscellaneousFilters[MISCELLANEOUS_FILTERS.USER_FILTER] && isUserFilter);

            if (!showByMiscellaneous) {
                return false;
            }

            // filter by request source filter
            const showByRequestSource = !Object.values(this.requestSourceFilters).some(identity)
            || (this.requestSourceFilters[REQUEST_SOURCE_FILTERS.FIRST_PARTY] && isFirstParty)
            || (this.requestSourceFilters[REQUEST_SOURCE_FILTERS.THIRD_PARTY] && isThirdParty);

            if (!showByRequestSource) {
                return false;
            }

            return show;
        });

        return filteredEvents;
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
        this.selectedEvent = find(this.filteringEvents, { eventId });
        this.rootStore.wizardStore.openModal();
    };

    @computed
    get appearanceTheme() {
        if (!this.settings) {
            return null;
        }

        return this.settings.values[this.settings.names.APPEARANCE_THEME];
    }
}

export { LogStore };
