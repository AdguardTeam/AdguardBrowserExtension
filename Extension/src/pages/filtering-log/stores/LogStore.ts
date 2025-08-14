/**
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

/* eslint-disable no-param-reassign */
import {
    observable,
    makeObservable,
    action,
    computed,
    runInAction,
} from 'mobx';
import { find, truncate } from 'lodash-es';

import { ContentType as RequestType } from 'tswebextension';

import {
    type FilteringLogTabInfo,
    type FilterMetadata,
    type SettingsData,
    type UIFilteringLogEvent,
} from '../../../background/api';
import { translator } from '../../../common/translators/translator';
import { messenger } from '../../services/messenger';
import { getRuleFilterName } from '../components/RequestWizard/utils';
import { BACKGROUND_TAB_ID } from '../../../common/constants';
import { getStatusMode, StatusMode } from '../filteringLogStatus';
import { logger } from '../../../common/logger';
import { getFilterName } from '../../helpers';

import { matchesSearch } from './helpers';
import { type RootStore } from './RootStore';

const enum MiscellaneousFilters {
    Regular = 'regular',
    Allowlisted = 'allowlisted',
    Blocked = 'blocked',
    Modified = 'modified',
    UserFilter = 'user_filter',
}

const enum RequestSourceFilters {
    FirstParty = 'first_party',
    ThirdParty = 'third_party',
}

const enum EventTypeFilters {
    Html = 'html',
    Css = 'css',
    JavaScript = 'java_script',
    Xhr = 'xmlhttprequest',
    Image = 'image',
    Media = 'media',
    Other = 'other',
}

/**
 * Filter for the filtering log.
 */
type SingleLogFilter = {
    /**
     * Filter id.
     */
    id: string;

    /**
     * Filter state.
     */
    enabled: boolean;

    /**
     * Filter title.
     */
    title: string;

    /**
     * Filter tooltip.
     */
    tooltip: string;

    /**
     * Request types related to the filter.
     */
    types?: RequestType[];
};

/**
 * Group of filters for the filtering log.
 */
type LogFilters = {
    /**
     * Flag that indicates whether all filters are enabled.
     */
    allButtonEnabled: boolean;

    /**
     * List of filters.
     */
    filters: SingleLogFilter[];
};

const initMiscellaneousFilters: LogFilters = {
    allButtonEnabled: true,
    filters: [
        {
            id: MiscellaneousFilters.Regular,
            enabled: true,
            title: translator.getMessage('filtering_log_filter_regular'),
            tooltip: translator.getMessage('filtering_log_tag_tooltip_regular'),
        },
        {
            id: MiscellaneousFilters.Allowlisted,
            enabled: true,
            title: translator.getMessage('filtering_log_filter_allowed'),
            tooltip: translator.getMessage('filtering_log_tag_tooltip_allowed'),
        },
        {
            id: MiscellaneousFilters.Blocked,
            enabled: true,
            title: translator.getMessage('filtering_log_filter_blocked'),
            tooltip: translator.getMessage('filtering_log_tag_tooltip_blocked'),
        },
        {
            id: MiscellaneousFilters.Modified,
            enabled: true,
            title: translator.getMessage('filtering_log_filter_modified'),
            tooltip: translator.getMessage('filtering_log_tag_tooltip_modified'),
        },
        {
            id: MiscellaneousFilters.UserFilter,
            enabled: true,
            title: translator.getMessage('filtering_log_filter_user_rules'),
            tooltip: translator.getMessage('filtering_log_tag_tooltip_user_rules'),
        },
    ],
};

const initRequestSourceFilters: LogFilters = {
    allButtonEnabled: true,
    filters: [
        {
            id: RequestSourceFilters.FirstParty,
            enabled: true,
            title: '1P',
            tooltip: translator.getMessage('filtering_log_tag_tooltip_first_party'),
        },
        {
            id: RequestSourceFilters.ThirdParty,
            enabled: true,
            title: '3P',
            tooltip: translator.getMessage('filtering_log_tag_tooltip_third_party'),
        },
    ],
};

const initEventTypesFilters: LogFilters = {
    allButtonEnabled: true,
    filters: [
        {
            id: EventTypeFilters.Html,
            enabled: true,
            title: 'HTML',
            tooltip: translator.getMessage('filtering_log_tag_tooltip_html'),
            types: [RequestType.Document, RequestType.Subdocument],
        },
        {
            id: EventTypeFilters.Css,
            enabled: true,
            title: 'CSS',
            tooltip: translator.getMessage('filtering_log_tag_tooltip_css'),
            types: [RequestType.Stylesheet],
        },
        {
            id: EventTypeFilters.JavaScript,
            enabled: true,
            title: 'JS',
            tooltip: translator.getMessage('filtering_log_tag_tooltip_js'),
            types: [RequestType.Script],
        },
        {
            id: EventTypeFilters.Xhr,
            enabled: true,
            title: 'XHR',
            tooltip: translator.getMessage('filtering_log_tag_tooltip_xhr'),
            types: [RequestType.XmlHttpRequest],
        },
        {
            id: EventTypeFilters.Image,
            enabled: true,
            title: 'Img',
            tooltip: translator.getMessage('filtering_log_tag_tooltip_img'),
            types: [RequestType.Image],
        },
        {
            id: EventTypeFilters.Media,
            enabled: true,
            title: 'Media',
            tooltip: translator.getMessage('filtering_log_tag_tooltip_media'),
            types: [RequestType.Object, RequestType.Media],
        },
        {
            id: EventTypeFilters.Other,
            enabled: true,
            title: translator.getMessage('filtering_type_other'),
            tooltip: translator.getMessage('filtering_log_tag_tooltip_other'),
            types: [
                RequestType.Other,
                RequestType.Font,
                RequestType.Websocket,
                RequestType.Csp,
                RequestType.PermissionsPolicy,
                RequestType.Cookie,
                RequestType.Ping,
                RequestType.WebRtc,
                RequestType.CspReport,
            ],
        },
    ],
};

const matchesFilter = (
    { filters }: LogFilters,
    filterId: MiscellaneousFilters | RequestSourceFilters,
    check: boolean,
) => {
    const filter = filters.find((f) => f.id === filterId);

    if (!filter) {
        return false;
    }

    return filter.enabled && check;
};

/**
 * Tabs map type where:
 * - key is tabId,
 * - value is {@link FilteringLogTabInfo}.
 */
type TabsMap = Record<string, FilteringLogTabInfo>;

/**
 * Selector tab type.
 */
type SelectorTab = {
    /**
     * Tab title.
     */
    title: string;

    /**
     * Tab id.
     */
    tabId: number;

    /**
     * Tab domain or null if it is not defined.
     */
    domain: string | null;
};

class LogStore {
    @observable
    filteringEvents: UIFilteringLogEvent[] = [];

    @observable
    tabsMap: TabsMap = {};

    @observable
    selectedTabId: number | null = null;

    @observable
    eventsSearchValue = '';

    @observable
    preserveLogEnabled = false;

    @observable
    selectedEvent: UIFilteringLogEvent | null = null;

    @observable
    filtersMetadata: FilterMetadata[] | null = null;

    @observable
    settings: SettingsData | null = null;

    @observable
    miscellaneousFilters = initMiscellaneousFilters;

    @observable
    requestSourceFilters = initRequestSourceFilters;

    @observable
    eventTypesFilters = initEventTypesFilters;

    @observable
    selectIsOpen = false;

    @observable
    prevTabs: SelectorTab[] = [];

    private rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
        makeObservable(this);
    }

    @action
    setMiscellaneousFilters = (payload: LogFilters) => {
        this.miscellaneousFilters = payload;
    };

    @action
    setRequestSourceFilters = (payload: LogFilters) => {
        this.requestSourceFilters = payload;
    };

    @action
    setEventTypesFilters = (payload: LogFilters) => {
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
    onTabUpdate(tabInfo: FilteringLogTabInfo) {
        const { tabId } = tabInfo;
        this.tabsMap[tabId] = tabInfo;
    }

    @action
    async onTabClose(tabInfo: FilteringLogTabInfo) {
        delete this.tabsMap[tabInfo.tabId];
        if (tabInfo.tabId === this.selectedTabId) {
            this.rootStore.wizardStore.closeModal();
            const [firstTabInfo] = Object.values(this.tabsMap);
            if (!firstTabInfo) {
                return;
            }
            await this.setSelectedTabId(firstTabInfo.tabId);
        }
    }

    @action
    onTabReset(tabInfo: FilteringLogTabInfo) {
        if (this.selectedTabId === tabInfo.tabId) {
            this.rootStore.wizardStore.closeModal();
            this.filteringEvents = [];
        }
    }

    /**
     * For each event tries to add filterName, originalRuleText and appliedRuleText,
     * extracted from requestRule or replaceRules or stealthAllowlistRules.
     * This is like helper to move rule's texts to upper level, inside event
     * itself to make other code easier to access these rule's texts.
     *
     * @param filteringEvent Filtering event to format.
     *
     * @returns Same filtering event, but with extracted rules texts if found any.
     */
    formatEvent = (filteringEvent: UIFilteringLogEvent): UIFilteringLogEvent => {
        const { requestRule } = filteringEvent;

        const { originalRuleText, appliedRuleText } = requestRule ?? {};

        // For $replace and $stealth rules, which will be grouped in RequestInfo with filter names specified,
        // we only show filter name on a main log screen for a single rule.
        if (requestRule) {
            filteringEvent.filterName = getFilterName(requestRule?.filterId, this.filtersMetadata);
        }

        const { filterName } = filteringEvent;

        if (originalRuleText) {
            filteringEvent.originalRuleText = originalRuleText;
        }

        if (appliedRuleText) {
            filteringEvent.appliedRuleText = appliedRuleText;
        }

        if (!filterName) {
            filteringEvent.filterName = getRuleFilterName(filteringEvent, this.filtersMetadata);
        }

        return filteringEvent;
    };

    @action
    // @ts-ignore
    onSettingUpdated(name, value) {
        if (!this.settings) {
            return;
        }
        // @ts-ignore
        this.settings.values[name] = value;
    }

    getTabs = (): SelectorTab[] => {
        const MAX_TITLE_LENGTH = 60;
        return Object.values(this.tabsMap)
            .filter((tab) => !tab.isExtensionTab)
            .map((tab) => {
                const { title, tabId, domain } = tab;
                const updatedTitle = truncate(title, { length: MAX_TITLE_LENGTH });

                return {
                    title: updatedTitle,
                    tabId,
                    domain,
                };
            });
    };

    @action
    setSelectIsOpenState = (value: boolean) => {
        this.selectIsOpen = value;
    };

    @computed
    get tabs() {
        // while tab select is open we return prev tabs
        // to stop select from re-rendering during selection
        if (this.selectIsOpen) {
            if (!this.prevTabs) {
                runInAction(() => {
                    this.prevTabs = this.getTabs();
                });
            }
            return this.prevTabs;
        }

        const tabs = this.getTabs();

        runInAction(() => {
            this.prevTabs = tabs;
        });
        return tabs;
    }

    @action
    getEventsByTabId = async (tabId: number) => {
        const filteringInfo = await messenger.getFilteringInfoByTabId(tabId);
        runInAction(() => {
            this.filteringEvents = filteringInfo?.filteringEvents
                .map((filteringEvent) => this.formatEvent(filteringEvent)) || [];
        });
    };

    @action
    setSelectedTabId = async (tabId: string | number) => {
        this.selectedTabId = typeof tabId === 'string'
            ? Number.parseInt(tabId, 10)
            : tabId;
        await this.getEventsByTabId(this.selectedTabId);
        /**
         * Hash of filtering log window should be updated to focus on the active browser tab.
         * Because after manual changing of TabSelector's tab,
         * location.hash of the filtering log window does not change.
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2482
         */
        document.location.hash = String(tabId);
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
        if (!this.selectedTabId) {
            return;
        }
        await this.getEventsByTabId(this.selectedTabId);
    };

    @computed
    get events() {
        const filteredEvents = this.filteringEvents.filter((filteringEvent) => {
            const show = matchesSearch(filteringEvent, this.eventsSearchValue);

            // Filter by requestType
            const { requestType } = filteringEvent;

            // check if request type is in eventTypesFilters
            const filterForRequestType = this.eventTypesFilters.filters.find((filter) => {
                // Cookie rules have document request type,
                // but they refer to "other" filtering log events
                if (filteringEvent?.isModifyingCookieRule) {
                    return filter.types && filter.types.includes(RequestType.Cookie);
                }

                if (filteringEvent?.cspReportBlocked) {
                    return filter.types && filter.types.includes(RequestType.CspReport);
                }

                return requestType && filter.types && filter.types.includes(requestType);
            });

            if (!filterForRequestType?.enabled) {
                return false;
            }

            // blocked CSP reports should be filtered as blocked requests in the filtering log. AG-24613
            const filteringEventType = getStatusMode(filteringEvent);

            const isAllowlisted = filteringEventType === StatusMode.ALLOWED
                || filteringEventType === StatusMode.ALLOWED_STEALTH;
            const isBlocked = filteringEventType === StatusMode.BLOCKED;
            const isModified = filteringEventType === StatusMode.MODIFIED;
            const isRegular = !isAllowlisted && !isBlocked && !isModified;

            const { sourceRules } = filteringEvent?.declarativeRuleInfo || {};
            const isUserFilter = filteringEvent.requestRule?.filterId === 0
                // Here we assume that the set of triggered rules is always from one
                // filter and therefore we extract the first one and based on it we
                // get the filter name.
                || !!(sourceRules && sourceRules.length > 0 && sourceRules[0]?.filterId === 0);

            // filter by miscellaneous filters
            const showByMiscellaneous = this.miscellaneousFilters.filters.every((f) => f.enabled)
                || matchesFilter(this.miscellaneousFilters, MiscellaneousFilters.Regular, isRegular)
                || matchesFilter(this.miscellaneousFilters, MiscellaneousFilters.Allowlisted, isAllowlisted)
                || matchesFilter(this.miscellaneousFilters, MiscellaneousFilters.Blocked, isBlocked)
                || matchesFilter(this.miscellaneousFilters, MiscellaneousFilters.Modified, isModified)
                || matchesFilter(this.miscellaneousFilters, MiscellaneousFilters.UserFilter, isUserFilter);

            if (!showByMiscellaneous) {
                return false;
            }

            const isFirstParty = !filteringEvent.requestThirdParty;
            const isThirdParty = !!filteringEvent.requestThirdParty;

            // filter by request source filter
            const showByRequestSource = this.requestSourceFilters.filters.every((f) => f.enabled)
                || matchesFilter(this.requestSourceFilters, RequestSourceFilters.FirstParty, isFirstParty)
                || matchesFilter(this.requestSourceFilters, RequestSourceFilters.ThirdParty, isThirdParty);

            if (!showByRequestSource) {
                return false;
            }

            return show;
        });

        return filteredEvents;
        /* eslint-enable max-len */
    }

    /**
     * Clears filtering events ignoring preserve log.
     *
     * @returns {Promise<void>}
     */
    @action
    clearFilteringEvents = async () => {
        if (this.selectedTabId === null) {
            logger.error('[ext.LogStore]: selected tab id is not defined');
            return;
        }

        const ignorePreserveLog = true;

        await messenger.clearEventsByTabId(this.selectedTabId, ignorePreserveLog);
        runInAction(() => {
            this.filteringEvents = [];
        });
    };

    @action
    setEventsSearchValue = (value: string) => {
        this.eventsSearchValue = value;
    };

    @action
    refreshPage = async () => {
        if (this.selectedTabId === null) {
            logger.error('[ext.LogStore]: selected tab id is not defined');
            return;
        }

        if (this.selectedTabId === BACKGROUND_TAB_ID) {
            await messenger.clearEventsByTabId(this.selectedTabId);
            return;
        }

        await messenger.refreshPage(this.selectedTabId);
    };

    @action
    setPreserveLog = async (state: boolean) => {
        await messenger.setPreserveLogState(state);
        runInAction(() => {
            this.preserveLogEnabled = state;
        });
    };

    @action
    handleSelectEvent = (eventId: string) => {
        if (this.selectedEvent
        && this.rootStore.wizardStore.isModalOpen
        && eventId === this.selectedEvent.eventId) {
            this.selectedEvent = null;
            this.rootStore.wizardStore.closeModal();
            return;
        }

        this.rootStore.wizardStore.setAddedRuleState(null);
        this.setSelectedEventById(eventId);
        this.rootStore.wizardStore.openModal();
    };

    @action
    setSelectedEventById = (eventId: string) => {
        this.selectedEvent = find(this.filteringEvents, { eventId }) || null;
    };

    @action
    removeSelectedEvent = () => {
        this.selectedEvent = null;
    };

    @computed
    get appearanceTheme() {
        if (!this.settings) {
            return null;
        }

        return this.settings.values[this.settings.names.AppearanceTheme];
    }
}

export { LogStore };
