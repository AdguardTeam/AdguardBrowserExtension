import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';

import { log } from '../../common/log';
import { MESSAGE_TYPES } from '../../common/constants';

class Messenger {
    onMessage = browser.runtime.onMessage;

    // eslint-disable-next-line class-methods-use-this
    async sendMessage(type, data) {
        log.debug('Request type:', type);
        if (data) {
            log.debug('Request data:', data);
        }

        const response = await browser.runtime.sendMessage({
            type,
            data,
        });

        if (response) {
            log.debug('Response type:', type);
            log.debug('Response data:', response);
        }

        return response;
    }

    /**
     * Creates long lived connections between popup and background page
     * @param {string} page
     * @param events
     * @param callback
     * @returns {function}
     */
    createLongLivedConnection = (page, events, callback) => {
        const eventListener = (...args) => {
            callback(...args);
        };

        const port = browser.runtime.connect({ name: `${page}_${nanoid()}` });
        port.postMessage({ type: MESSAGE_TYPES.ADD_LONG_LIVED_CONNECTION, data: { events } });

        port.onMessage.addListener((message) => {
            if (message.type === MESSAGE_TYPES.NOTIFY_LISTENERS) {
                const [type, ...data] = message.data;
                eventListener({ type, data });
            }
        });

        port.onDisconnect.addListener(() => {
            if (browser.runtime.lastError) {
                log.error(browser.runtime.lastError.message);
            }
        });

        const onUnload = () => {
            port.disconnect();
        };

        window.addEventListener('beforeunload', onUnload);
        window.addEventListener('unload', onUnload);

        return onUnload;
    };

    /**
     * Method subscribes to notifier module events
     * @param events - list of events to which subscribe
     * @param callback - callback called when event fires
     * @param onUnloadCallback - callback used to remove listener on unload
     * @returns {Promise<function(): Promise<void>>}
     */
    createEventListener = async (events, callback, onUnloadCallback) => {
        const eventListener = (...args) => {
            callback(...args);
        };

        let { listenerId } = await this.sendMessage(
            MESSAGE_TYPES.CREATE_EVENT_LISTENER, { events },
        );

        browser.runtime.onMessage.addListener((message) => {
            if (message.type === MESSAGE_TYPES.NOTIFY_LISTENERS) {
                const [type, ...data] = message.data;
                eventListener({ type, data });
            }
        });

        const onUnload = async () => {
            if (listenerId) {
                const type = MESSAGE_TYPES.REMOVE_LISTENER;
                this.sendMessage(type, { listenerId });
                listenerId = null;
                if (typeof onUnloadCallback === 'function') {
                    onUnloadCallback();
                }
            }
        };

        window.addEventListener('beforeunload', onUnload);
        window.addEventListener('unload', onUnload);

        return onUnload;
    };

    async getOptionsData() {
        return this.sendMessage(MESSAGE_TYPES.GET_OPTIONS_DATA);
    }

    // eslint-disable-next-line class-methods-use-this
    async changeUserSetting(settingId, value) {
        // FIXME refactor message handler to use common message format { type, data }
        await browser.runtime.sendMessage({
            type: MESSAGE_TYPES.CHANGE_USER_SETTING,
            key: settingId,
            value,
        });
    }

    openExtensionStore = async () => {
        return this.sendMessage(MESSAGE_TYPES.OPEN_EXTENSION_STORE);
    };

    openComparePage = async () => {
        return this.sendMessage(MESSAGE_TYPES.OPEN_COMPARE_PAGE);
    };

    async enableFilter(filterId) {
        return this.sendMessage(MESSAGE_TYPES.ADD_AND_ENABLE_FILTER, { filterId });
    }

    async disableFilter(filterId) {
        return this.sendMessage(MESSAGE_TYPES.DISABLE_ANTIBANNER_FILTER, { filterId });
    }

    async applySettingsJson(json) {
        return this.sendMessage(MESSAGE_TYPES.APPLY_SETTINGS_JSON, { json });
    }

    async openFilteringLog() {
        return this.sendMessage(MESSAGE_TYPES.OPEN_FILTERING_LOG);
    }

    async resetStatistics() {
        return this.sendMessage(MESSAGE_TYPES.RESET_BLOCKED_ADS_COUNT);
    }

    async setFilteringLogWindowState(windowState) {
        return this.sendMessage(MESSAGE_TYPES.SET_FILTERING_LOG_WINDOW_STATE, { windowState });
    }

    async resetSettings() {
        return this.sendMessage(MESSAGE_TYPES.RESET_SETTINGS);
    }

    async getUserRules() {
        return this.sendMessage(MESSAGE_TYPES.GET_USER_RULES);
    }

    async saveUserRules(value) {
        await this.sendMessage(MESSAGE_TYPES.SAVE_USER_RULES, { value });
    }

    async getAllowlist() {
        return this.sendMessage(MESSAGE_TYPES.GET_ALLOWLIST_DOMAINS);
    }

    async saveAllowlist(value) {
        await this.sendMessage(MESSAGE_TYPES.SAVE_ALLOWLIST_DOMAINS, { value });
    }

    async updateFilters() {
        return this.sendMessage(MESSAGE_TYPES.CHECK_ANTIBANNER_FILTERS_UPDATE);
    }

    async updateGroupStatus(id, data) {
        const type = data
            ? MESSAGE_TYPES.ENABLE_FILTERS_GROUP
            : MESSAGE_TYPES.DISABLE_FILTERS_GROUP;
        const groupId = id - 0;
        await this.sendMessage(type, { groupId });
    }

    async updateFilterStatus(filterId, data) {
        const type = data
            ? MESSAGE_TYPES.ADD_AND_ENABLE_FILTER
            : MESSAGE_TYPES.DISABLE_ANTIBANNER_FILTER;
        await this.sendMessage(type, { filterId });
    }

    async checkCustomUrl(url) {
        return this.sendMessage(MESSAGE_TYPES.LOAD_CUSTOM_FILTER_INFO, { url });
    }

    async addCustomFilter(filter) {
        return this.sendMessage(MESSAGE_TYPES.SUBSCRIBE_TO_CUSTOM_FILTER, { filter });
    }

    async removeCustomFilter(filterId) {
        await this.sendMessage(MESSAGE_TYPES.REMOVE_ANTIBANNER_FILTER, { filterId });
    }

    async getTabInfoForPopup(tabId) {
        return this.sendMessage(MESSAGE_TYPES.GET_TAB_INFO_FOR_POPUP, { tabId });
    }

    async changeApplicationFilteringDisabled(state) {
        return this.sendMessage(MESSAGE_TYPES.CHANGE_APPLICATION_FILTERING_DISABLED, { state });
    }

    async openSettingsTab() {
        return this.sendMessage(MESSAGE_TYPES.OPEN_SETTINGS_TAB);
    }

    async openAssistant() {
        return this.sendMessage(MESSAGE_TYPES.OPEN_ASSISTANT);
    }

    async openAbuseSite(url, from) {
        return this.sendMessage(MESSAGE_TYPES.OPEN_ABUSE_TAB, { url, from });
    }

    async checkSiteSecurity(url) {
        return this.sendMessage(MESSAGE_TYPES.OPEN_SITE_REPORT_TAB, { url });
    }

    async resetCustomRulesForPage(url) {
        const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
        return this.sendMessage(
            MESSAGE_TYPES.RESET_CUSTOM_RULES_FOR_PAGE,
            { url, tabId: currentTab?.id },
        );
    }

    async removeAllowlistDomain(tabId) {
        return this.sendMessage(MESSAGE_TYPES.REMOVE_ALLOWLIST_DOMAIN, { tabId });
    }

    async addAllowlistDomain(tabId) {
        return this.sendMessage(MESSAGE_TYPES.ADD_ALLOWLIST_DOMAIN_POPUP, { tabId });
    }

    async getStatisticsData() {
        return this.sendMessage(MESSAGE_TYPES.GET_STATISTICS_DATA);
    }

    async onOpenFilteringLogPage() {
        await this.sendMessage(MESSAGE_TYPES.ON_OPEN_FILTERING_LOG_PAGE);
    }

    async getFilteringLogData() {
        return this.sendMessage(MESSAGE_TYPES.GET_FILTERING_LOG_DATA);
    }

    async onCloseFilteringLogPage() {
        await this.sendMessage(MESSAGE_TYPES.ON_CLOSE_FILTERING_LOG_PAGE);
    }

    async getFilteringInfoByTabId(tabId) {
        return this.sendMessage(MESSAGE_TYPES.GET_FILTERING_INFO_BY_TAB_ID, { tabId });
    }

    async synchronizeOpenTabs() {
        return this.sendMessage(MESSAGE_TYPES.SYNCHRONIZE_OPEN_TABS);
    }

    async clearEventsByTabId(tabId, ignorePreserveLog) {
        return this.sendMessage(MESSAGE_TYPES.CLEAR_EVENTS_BY_TAB_ID, { tabId, ignorePreserveLog });
    }

    async refreshPage(tabId, preserveLogEnabled) {
        await this.sendMessage(MESSAGE_TYPES.REFRESH_PAGE, { tabId, preserveLogEnabled });
    }

    async openTab(url, options) {
        await this.sendMessage(MESSAGE_TYPES.OPEN_TAB, { url, options });
    }

    async filteringLogAddUserRule(ruleText) {
        await this.sendMessage(MESSAGE_TYPES.FILTERING_LOG_ADD_USER_RULE, { ruleText });
    }

    async unAllowlistFrame(frameInfo) {
        await this.sendMessage(MESSAGE_TYPES.UN_ALLOWLIST_FRAME, { frameInfo });
    }

    async removeUserRule(ruleText) {
        await this.sendMessage(MESSAGE_TYPES.REMOVE_USER_RULE, { ruleText });
    }

    async getTabFrameInfoById(tabId) {
        return this.sendMessage(MESSAGE_TYPES.GET_TAB_FRAME_INFO_BY_ID, { tabId });
    }

    async setPreserveLogState(state) {
        return this.sendMessage(MESSAGE_TYPES.SET_PRESERVE_LOG_STATE, { state });
    }

    async getEditorStorageContent() {
        return this.sendMessage(MESSAGE_TYPES.GET_EDITOR_STORAGE_CONTENT);
    }

    async setEditorStorageContent(content) {
        return this.sendMessage(MESSAGE_TYPES.SET_EDITOR_STORAGE_CONTENT, { content });
    }

    async convertRuleText(content) {
        return this.sendMessage(MESSAGE_TYPES.CONVERT_RULES_TEXT, { content });
    }
}

const messenger = new Messenger();

export { messenger };
