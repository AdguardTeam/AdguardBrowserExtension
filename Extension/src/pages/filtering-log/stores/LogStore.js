/* eslint-disable no-param-reassign */
import {
    observable,
    makeObservable,
    action,
    computed,
    runInAction,
} from 'mobx';
import find from 'lodash/find';
import truncate from 'lodash/truncate';

import { reactTranslator } from '../../../common/translators/reactTranslator';
import { RequestTypes } from '../../../background/utils/request-types';
import { messenger } from '../../services/messenger';
import { getFilterName } from '../components/RequestWizard/utils';
import { matchesSearch } from './helpers';

const MISCELLANEOUS_FILTERS = {
    REGULAR: 'regular',
    ALLOWLISTED: 'allowlisted',
    BLOCKED: 'blocked',
    MODIFIED: 'modified',
    USER_FILTER: 'user_filter',
};

const REQUEST_SOURCE_FILTERS = {
    FIRST_PARTY: 'first_party',
    THIRD_PARTY: 'third_party',
};

const EVENT_TYPE_FILTERS = {
    HTML: 'html',
    CSS: 'css',
    JAVA_SCRIPT: 'java_script',
    XHR: 'xmlhttprequest',
    IMAGE: 'image',
    MEDIA: 'media',
    OTHER: 'other',
};

const initMiscellaneousFilters = {
    allButtonEnabled: true,
    filters: [
        {
            id: MISCELLANEOUS_FILTERS.REGULAR,
            enabled: true,
            title: reactTranslator.getMessage('filtering_log_filter_regular'),
            tooltip: reactTranslator.getMessage('filtering_log_tag_tooltip_regular'),
        },
        {
            id: MISCELLANEOUS_FILTERS.ALLOWLISTED,
            enabled: true,
            title: reactTranslator.getMessage('filtering_log_filter_allowed'),
            tooltip: reactTranslator.getMessage('filtering_log_tag_tooltip_allowed'),
        },
        {
            id: MISCELLANEOUS_FILTERS.BLOCKED,
            enabled: true,
            title: reactTranslator.getMessage('filtering_log_filter_blocked'),
            tooltip: reactTranslator.getMessage('filtering_log_tag_tooltip_blocked'),
        },
        {
            id: MISCELLANEOUS_FILTERS.MODIFIED,
            enabled: true,
            title: reactTranslator.getMessage('filtering_log_filter_modified'),
            tooltip: reactTranslator.getMessage('filtering_log_tag_tooltip_modified'),
        },
        {
            id: MISCELLANEOUS_FILTERS.USER_FILTER,
            enabled: true,
            title: reactTranslator.getMessage('filtering_log_filter_user_rules'),
            tooltip: reactTranslator.getMessage('filtering_log_tag_tooltip_user_rules'),
        },
    ],
};

const initRequestSourceFilters = {
    allButtonEnabled: true,
    filters: [
        {
            id: REQUEST_SOURCE_FILTERS.FIRST_PARTY,
            title: '1P',
            enabled: true,
            tooltip: reactTranslator.getMessage('filtering_log_tag_tooltip_first_party'),
        },
        {
            id: REQUEST_SOURCE_FILTERS.THIRD_PARTY,
            title: '3P',
            enabled: true,
            tooltip: reactTranslator.getMessage('filtering_log_tag_tooltip_third_party'),
        },
    ],
};

const initEventTypesFilters = {
    allButtonEnabled: true,
    filters: [
        {
            id: EVENT_TYPE_FILTERS.HTML,
            title: 'HTML',
            types: [RequestTypes.DOCUMENT, RequestTypes.SUBDOCUMENT],
            enabled: true,
            tooltip: reactTranslator.getMessage('filtering_log_tag_tooltip_html'),
        },
        {
            id: EVENT_TYPE_FILTERS.CSS,
            title: 'CSS',
            types: [RequestTypes.STYLESHEET],
            enabled: true,
            tooltip: reactTranslator.getMessage('filtering_log_tag_tooltip_css'),
        },
        {
            id: EVENT_TYPE_FILTERS.JAVA_SCRIPT,
            title: 'JS',
            types: [RequestTypes.SCRIPT],
            enabled: true,
            tooltip: reactTranslator.getMessage('filtering_log_tag_tooltip_js'),
        },
        {
            id: EVENT_TYPE_FILTERS.XHR,
            title: 'XHR',
            types: [RequestTypes.XMLHTTPREQUEST],
            enabled: true,
            tooltip: reactTranslator.getMessage('filtering_log_tag_tooltip_xhr'),
        },
        {
            id: EVENT_TYPE_FILTERS.IMAGE,
            title: 'Img',
            types: [RequestTypes.IMAGE],
            enabled: true,
            tooltip: reactTranslator.getMessage('filtering_log_tag_tooltip_img'),
        },
        {
            id: EVENT_TYPE_FILTERS.MEDIA,
            title: 'Media',
            types: [RequestTypes.OBJECT, RequestTypes.MEDIA],
            enabled: true,
            tooltip: reactTranslator.getMessage('filtering_log_tag_tooltip_media'),
        },
        {
            id: EVENT_TYPE_FILTERS.OTHER,
            title: reactTranslator.getMessage('filtering_type_other'),
            types: [
                RequestTypes.OTHER,
                RequestTypes.FONT,
                RequestTypes.WEBSOCKET,
                RequestTypes.CSP,
                RequestTypes.COOKIE,
                RequestTypes.PING,
                RequestTypes.WEBRTC,
                RequestTypes.CSP_REPORT,
            ],
            enabled: true,
            tooltip: reactTranslator.getMessage('filtering_log_tag_tooltip_other'),
        },
    ],
};

const matchesFilter = ({ filters }, filterId, check) => {
    return filters.find((f) => f.id === filterId).enabled && check;
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

    @observable miscellaneousFilters = initMiscellaneousFilters;

    @observable requestSourceFilters = initRequestSourceFilters;

    @observable eventTypesFilters = initEventTypesFilters;

    @observable
    selectIsOpen = false;

    constructor(rootStore) {
        this.rootStore = rootStore;
        makeObservable(this);
    }

    @action
    setMiscellaneousFilters = (payload) => {
        this.miscellaneousFilters = payload;
    };

    @action
    setRequestSourceFilters = (payload) => {
        this.requestSourceFilters = payload;
    };

    @action
    setEventTypesFilters = (payload) => {
        this.eventTypesFilters = payload;
    };

    @action
    resetAllFilters = () => {
        // enable all eventTypesFilters
        this.eventTypesFilters = initEventTypesFilters;
        // disable all miscellaneousFilters
        this.miscellaneousFilters = initMiscellaneousFilters;
        // disable all requestSourceFilters
        this.requestSourceFilters = initRequestSourceFilters;
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
        if (this.selectedTabId === tabInfo.tabId) {
            this.filteringEvents = [];
        }
    }

    formatEvent = (filteringEvent) => {
        const { requestRule } = filteringEvent;

        const ruleText = requestRule?.ruleText;

        if (ruleText) {
            filteringEvent.ruleText = ruleText;
        }

        const filterId = requestRule?.filterId;

        if (filterId !== undefined) {
            filteringEvent.filterName = getFilterName(filterId, this.filtersMetadata);
        }

        return filteringEvent;
    };

    @action
    onSettingUpdated(name, value) {
        if (!this.settings) {
            return;
        }
        this.settings.values[name] = value;
    }

    getTabs = () => {
        const MAX_TITLE_LENGTH = 60;
        return Object.values(this.tabsMap)
            .filter((tab) => !tab.isExtensionTab)
            .map(({ title, tabId }) => {
                const updatedTitle = truncate(title, { length: MAX_TITLE_LENGTH });
                return { title: updatedTitle, tabId };
            });
    };

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
            const filteringEvents = filteringInfo?.filteringEvents;
            if (filteringEvents) {
                this.filteringEvents = filteringEvents
                    .map((filteringEvent) => this.formatEvent(filteringEvent));
            } else {
                this.filteringEvents = [];
            }
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
                this.tabsMap[tabInfo.tabId] = tabInfo;
            });
        });
    };

    @action
    getFilteringLogData = async () => {
        const {
            filtersMetadata,
            settings,
            preserveLogEnabled,
        } = await messenger.getFilteringLogData();

        runInAction(() => {
            this.filtersMetadata = filtersMetadata;
            this.settings = settings;
            this.preserveLogEnabled = preserveLogEnabled;
        });
    };

    @action
    getFilteringLogEvents = async () => {
        await this.getEventsByTabId(this.selectedTabId);
    };

    @computed
    get events() {
        /* eslint-disable max-len */
        const filteredEvents = this.filteringEvents.filter((filteringEvent) => {
            const show = matchesSearch(filteringEvent, this.eventsSearchValue);

            // Filter by requestType
            const { requestType } = filteringEvent;
            // check if request type is in eventTypesFilters
            const filterForRequestType = this.eventTypesFilters.filters.find((filter) => {
                // Cookie rules have document request type,
                // but they refer to "other" filtering log events
                if (filteringEvent?.requestRule?.isModifyingCookieRule) {
                    return filter.types.includes(RequestTypes.COOKIE);
                }
                if (filteringEvent?.cspReportBlocked) {
                    return filter.types.includes(RequestTypes.CSP_REPORT);
                }
                return filter.types.includes(requestType);
            });

            if (!filterForRequestType?.enabled) {
                return false;
            }

            const isAllowlisted = filteringEvent.requestRule?.allowlistRule;
            const isBlocked = filteringEvent.requestRule
                && !filteringEvent.requestRule.allowlistRule
                && !filteringEvent.requestRule.cssRule
                && !filteringEvent.requestRule.scriptRule
                && !filteringEvent.requestRule.cspRule
                && !filteringEvent.replaceRules
                && !filteringEvent.removeParam
                && !filteringEvent.removeHeader;
            const isModified = filteringEvent.requestRule?.isModifyingCookieRule
                || filteringEvent.requestRule?.cssRule
                || filteringEvent.requestRule?.scriptRule
                || filteringEvent.requestRule?.cspRule
                || filteringEvent.replaceRules
                || filteringEvent.removeParam
                || filteringEvent.removeHeader;
            const isUserFilter = filteringEvent.requestRule?.filterId === 0;
            const isFirstParty = !filteringEvent.requestThirdParty;
            const isThirdParty = filteringEvent.requestThirdParty;
            const isRegular = !isAllowlisted && !isBlocked && !isModified;

            // filter by miscellaneous filters
            const showByMiscellaneous = this.miscellaneousFilters.filters.every((f) => f.enabled)
                || matchesFilter(this.miscellaneousFilters, MISCELLANEOUS_FILTERS.REGULAR, isRegular)
                || matchesFilter(this.miscellaneousFilters, MISCELLANEOUS_FILTERS.ALLOWLISTED, isAllowlisted)
                || matchesFilter(this.miscellaneousFilters, MISCELLANEOUS_FILTERS.BLOCKED, isBlocked)
                || matchesFilter(this.miscellaneousFilters, MISCELLANEOUS_FILTERS.MODIFIED, isModified)
                || matchesFilter(this.miscellaneousFilters, MISCELLANEOUS_FILTERS.USER_FILTER, isUserFilter);

            if (!showByMiscellaneous) {
                return false;
            }

            // filter by request source filter
            const showByRequestSource = this.requestSourceFilters.filters.every((f) => f.enabled)
                || matchesFilter(this.requestSourceFilters, REQUEST_SOURCE_FILTERS.FIRST_PARTY, isFirstParty)
                || matchesFilter(this.requestSourceFilters, REQUEST_SOURCE_FILTERS.THIRD_PARTY, isThirdParty);

            if (!showByRequestSource) {
                return false;
            }

            return show;
        });

        return filteredEvents;
        /* eslint-enable max-len */
    }

    /**
     * Clears filtering events ignoring preserve log
     * @return {Promise<void>}
     */
    @action
    clearFilteringEvents = async () => {
        const ignorePreserveLog = true;
        await messenger.clearEventsByTabId(this.selectedTabId, ignorePreserveLog);
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
            await messenger.clearEventsByTabId(this.selectedTabId);
            return;
        }
        await messenger.refreshPage(this.selectedTabId, this.preserveLogEnabled);
    };

    @action
    setPreserveLog = async (state) => {
        await messenger.setPreserveLogState(state);
        runInAction(() => {
            this.preserveLogEnabled = state;
        });
    };

    toNumberOrString = (dirtyString) => {
        const num = Number.parseInt(dirtyString, 10);
        if (Number.isNaN(num)) {
            return dirtyString;
        }
        return String(num) === dirtyString ? num : dirtyString;
    };

    @action
    setSelectedEventById = (eventIdString) => {
        const eventId = this.toNumberOrString(eventIdString);
        if (this.selectedEvent && eventId !== this.selectedEvent.eventId) {
            this.rootStore.wizardStore.setAddedRuleState(false);
        }
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
