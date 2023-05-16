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

import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';

import { Log } from '../../common/log';
import { MessageType, APP_MESSAGE_HANDLER_NAME } from '../../common/messages';

class Messenger {
    onMessage = browser.runtime.onMessage;

    constructor() {
        this.resetCustomRulesForPage = this.resetCustomRulesForPage.bind(this);
        this.updateFilters = this.updateFilters.bind(this);
    }

    // eslint-disable-next-line class-methods-use-this
    async sendMessage(type, data) {
        Log.debug('Request type:', type);
        if (data) {
            Log.debug('Request data:', data);
        }

        const response = await browser.runtime.sendMessage({
            handlerName: APP_MESSAGE_HANDLER_NAME,
            type,
            data,
        });

        if (response) {
            Log.debug('Response type:', type);
            Log.debug('Response data:', response);
        }

        return response;
    }

    /**
     * Creates long lived connections between popup and background page.
     *
     * @param {string} page
     * @param events
     * @param callback
     * @returns {Function}
     */
    createLongLivedConnection = (page, events, callback) => {
        const eventListener = (...args) => {
            callback(...args);
        };

        const port = browser.runtime.connect({ name: `${page}_${nanoid()}` });
        port.postMessage({ type: MessageType.AddLongLivedConnection, data: { events } });

        port.onMessage.addListener((message) => {
            if (message.type === MessageType.NotifyListeners) {
                const [type, ...data] = message.data;
                eventListener({ type, data });
            }
        });

        port.onDisconnect.addListener(() => {
            if (browser.runtime.lastError) {
                Log.error(browser.runtime.lastError.message);
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
     * Method subscribes to notifier module events.
     *
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
            MessageType.CreateEventListener, { events },
        );

        browser.runtime.onMessage.addListener((message) => {
            if (message.type === MessageType.NotifyListeners) {
                const [type, ...data] = message.data;
                eventListener({ type, data });
            }
        });

        const onUnload = async () => {
            if (listenerId) {
                const type = MessageType.RemoveListener;
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
        const res = await this.sendMessage(MessageType.GetOptionsData);
        return res;
    }

    async changeUserSetting(settingId, value) {
        await this.sendMessage(MessageType.ChangeUserSettings, {
            key: settingId,
            value,
        });
    }

    openExtensionStore = async () => {
        return this.sendMessage(MessageType.OpenExtensionStore);
    };

    openComparePage = async () => {
        return this.sendMessage(MessageType.OpenComparePage);
    };

    async enableFilter(filterId) {
        return this.sendMessage(MessageType.AddAndEnableFilter, { filterId });
    }

    async disableFilter(filterId) {
        return this.sendMessage(MessageType.DisableFilter, { filterId });
    }

    async applySettingsJson(json) {
        return this.sendMessage(MessageType.ApplySettingsJson, { json });
    }

    async openFilteringLog() {
        return this.sendMessage(MessageType.OpenFilteringLog);
    }

    async resetStatistics() {
        return this.sendMessage(MessageType.ResetBlockedAdsCount);
    }

    async setFilteringLogWindowState(windowState) {
        return this.sendMessage(MessageType.SetFilteringLogWindowState, { windowState });
    }

    async resetSettings() {
        return this.sendMessage(MessageType.ResetSettings);
    }

    async getUserRules() {
        return this.sendMessage(MessageType.GetUserRules);
    }

    async saveUserRules(value) {
        await this.sendMessage(MessageType.SaveUserRules, { value });
    }

    async getAllowlist() {
        return this.sendMessage(MessageType.GetAllowlistDomains);
    }

    async saveAllowlist(value) {
        await this.sendMessage(MessageType.SaveAllowlistDomains, { value });
    }

    async updateFilters() {
        return this.sendMessage(MessageType.CheckFiltersUpdate);
    }

    async updateGroupStatus(id, data) {
        const type = data
            ? MessageType.EnableFiltersGroup
            : MessageType.DisableFiltersGroup;
        const groupId = id - 0;
        await this.sendMessage(type, { groupId });
    }

    async updateFilterStatus(filterId, data) {
        const type = data
            ? MessageType.AddAndEnableFilter
            : MessageType.DisableFilter;
        await this.sendMessage(type, { filterId });
    }

    async checkCustomUrl(url) {
        return this.sendMessage(MessageType.LoadCustomFilterInfo, { url });
    }

    async addCustomFilter(filter) {
        return this.sendMessage(MessageType.SubscribeToCustomFilter, { filter });
    }

    async removeCustomFilter(filterId) {
        await this.sendMessage(MessageType.RemoveAntiBannerFilter, { filterId });
    }

    async getTabInfoForPopup(tabId) {
        return this.sendMessage(MessageType.GetTabInfoForPopup, { tabId });
    }

    async changeApplicationFilteringDisabled(state) {
        return this.sendMessage(MessageType.ChangeApplicationFilteringDisabled, { state });
    }

    async openSettingsTab() {
        return this.sendMessage(MessageType.OpenSettingsTab);
    }

    async openAssistant() {
        return this.sendMessage(MessageType.OpenAssistant);
    }

    async openAbuseSite(url, from) {
        return this.sendMessage(MessageType.OpenAbuseTab, { url, from });
    }

    async checkSiteSecurity(url, from) {
        return this.sendMessage(MessageType.OpenSiteReportTab, { url, from });
    }

    async resetCustomRulesForPage(url) {
        const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
        return this.sendMessage(
            MessageType.ResetCustomRulesForPage,
            { url, tabId: currentTab?.id },
        );
    }

    async removeAllowlistDomain(tabId, tabRefresh) {
        return this.sendMessage(MessageType.RemoveAllowlistDomain, { tabId, tabRefresh });
    }

    async addAllowlistDomain(tabId) {
        return this.sendMessage(MessageType.AddAllowlistDomainPopup, { tabId });
    }

    async getStatisticsData() {
        return this.sendMessage(MessageType.GetStatisticsData);
    }

    async onOpenFilteringLogPage() {
        await this.sendMessage(MessageType.OnOpenFilteringLogPage);
    }

    async getFilteringLogData() {
        return this.sendMessage(MessageType.GetFilteringLogData);
    }

    async onCloseFilteringLogPage() {
        await this.sendMessage(MessageType.OnCloseFilteringLogPage);
    }

    async getFilteringInfoByTabId(tabId) {
        return this.sendMessage(MessageType.GetFilteringInfoByTabId, { tabId });
    }

    async synchronizeOpenTabs() {
        return this.sendMessage(MessageType.SynchronizeOpenTabs);
    }

    async clearEventsByTabId(tabId, ignorePreserveLog) {
        return this.sendMessage(MessageType.ClearEventsByTabId, { tabId, ignorePreserveLog });
    }

    async refreshPage(tabId, preserveLogEnabled) {
        await this.sendMessage(MessageType.RefreshPage, { tabId, preserveLogEnabled });
    }

    async addUserRule(ruleText) {
        await this.sendMessage(MessageType.AddUserRule, { ruleText });
    }

    async removeUserRule(ruleText) {
        await this.sendMessage(MessageType.RemoveUserRule, { ruleText });
    }

    async setPreserveLogState(state) {
        return this.sendMessage(MessageType.SetPreserveLogState, { state });
    }

    async getEditorStorageContent() {
        return this.sendMessage(MessageType.GetEditorStorageContent);
    }

    async setEditorStorageContent(content) {
        return this.sendMessage(MessageType.SetEditorStorageContent, { content });
    }

    async convertRuleText(content) {
        return this.sendMessage(MessageType.ConvertRulesText, { content });
    }
}

const messenger = new Messenger();

export { messenger };
