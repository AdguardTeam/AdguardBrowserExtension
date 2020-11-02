import {
    observable,
    makeObservable,
    action,
    computed, runInAction,
} from 'mobx';
import { messenger } from '../../services/messenger';

class LogStore {
    @observable filteringEvents = [];

    @observable tabsMap = {};

    constructor(rootStore) {
        this.rootStore = rootStore;
        makeObservable(this);
    }

    @action
    onTabUpdate(tabInfo) {
        const { tabId } = tabInfo;
        this.tabsMap[tabId] = tabInfo;
    }

    @computed
    get tabs() {
        return Object.values(this.tabsMap);
    }

    @action
    getEventsByTabId = async (tabId) => {
        const filteringInfo = await messenger.getFilteringInfoByTabId(tabId);
        runInAction(() => {
            this.filteringEvents = filteringInfo.filteringEvents;
        });
    }

    @action
    setSelectedTabId = async (tabId) => {
        this.selectedTabId = tabId;
        await this.getEventsByTabId(tabId);
    }

    @action
    synchronizeOpenTabs = async () => {
        const tabsInfo = await messenger.synchronizeOpenTabs();
        tabsInfo.forEach((tabInfo) => {
            const { tabId } = tabInfo;
            this.tabsMap[tabId] = tabInfo;
        });
    }

    @computed
    get events() {
        const events = this.filteringEvents.map((filteringEvent) => {
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
}

export { LogStore };
