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

import { logger } from '../../common/logger';
import { MessageType, APP_MESSAGE_HANDLER_NAME } from '../../common/messages';

class Messenger {
    onMessage = browser.runtime.onMessage;

    constructor() {
        this.resetUserRulesForPage = this.resetUserRulesForPage.bind(this);
        this.updateFilters = this.updateFilters.bind(this);
    }

    // eslint-disable-next-line class-methods-use-this
    async sendMessage(type, data) {
        logger.debug('Request type:', type);
        if (data) {
            logger.debug('Request data:', data);
        }

        const response = await browser.runtime.sendMessage({
            handlerName: APP_MESSAGE_HANDLER_NAME,
            type,
            data,
        });

        if (response) {
            logger.debug('Response type:', type);
            logger.debug('Response data:', response);
        }

        return response;
    }

    /**
     * Creates long-lived connections between popup and background page.
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

        let port;
        let forceDisconnected = false;

        const connect = () => {
            port = browser.runtime.connect({ name: `${page}_${nanoid()}` });
            port.postMessage({ type: MessageType.AddLongLivedConnection, data: { events } });

            port.onMessage.addListener((message) => {
                if (message.type === MessageType.NotifyListeners) {
                    const [type, ...data] = message.data;
                    eventListener({ type, data });
                }
            });

            port.onDisconnect.addListener(() => {
                if (browser.runtime.lastError) {
                    logger.error(browser.runtime.lastError.message);
                }
                // we try to connect again if the background page was terminated
                if (!forceDisconnected) {
                    connect();
                }
            });
        };

        connect();

        const onUnload = () => {
            if (port) {
                forceDisconnected = true;
                port.disconnect();
            }
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

        const onUpdateListeners = async () => {
            const response = await this.sendMessage(
                MessageType.CreateEventListener, { events },
            );
            listenerId = response.listenerId;
        };

        browser.runtime.onMessage.addListener((message) => {
            if (message.type === MessageType.NotifyListeners) {
                const [type, ...data] = message.data;
                eventListener({ type, data });
            }
            if (message.type === MessageType.UpdateListeners) {
                onUpdateListeners();
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

    /**
     * Sends a message to the background page to update filters.
     *
     * @returns {Promise<[]>} List of filters.
     */
    async updateFilters() {
        if (__IS_MV3__) {
            logger.debug('Filters update is not supported in MV3');
            return [];
        }

        return this.sendMessage(MessageType.CheckFiltersUpdate);
    }

    async updateGroupStatus(id, enabled) {
        const type = enabled
            ? MessageType.EnableFiltersGroup
            : MessageType.DisableFiltersGroup;
        const groupId = Number.parseInt(id, 10);
        return this.sendMessage(type, { groupId });
    }

    async updateFilterStatus(filterId, enabled) {
        return enabled
            ? this.enableFilter(filterId)
            : this.disableFilter(filterId);
    }

    async setConsentedFilters(filterIds) {
        return this.sendMessage(MessageType.SetConsentedFilters, { filterIds });
    }

    async getIsConsentedFilter(filterId) {
        return this.sendMessage(MessageType.GetIsConsentedFilter, { filterId });
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

    // FIXME: Remove tabUrl because this is temporary solution to ensure that
    // tab is not "system" page like "chrome://extensions/" (see AG-32609).
    async getTabInfoForPopup(tabId, tabUrl) {
        return this.sendMessage(MessageType.GetTabInfoForPopup, { tabId, tabUrl });
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

    // FIXME: this method should work in mv2 and mv3
    // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
    async openAbuseSite(url, from) {
        // FIXME: Remove alert
        // eslint-disable-next-line no-alert
        alert('Cannot open because url of tab is empty.');
        // return this.sendMessage(MessageType.OpenAbuseTab, { url, from });
    }

    // FIXME: this method should work in mv2 and mv3
    // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
    async checkSiteSecurity(url, from) {
        // FIXME: Remove alert
        // eslint-disable-next-line no-alert
        alert('Cannot open because url of tab is empty.');
        // return this.sendMessage(MessageType.OpenSiteReportTab, { url, from });
    }

    async resetUserRulesForPage(url) {
        const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
        return this.sendMessage(
            MessageType.ResetUserRulesForPage,
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

    // FIXME: this method should not work in the mv3, since there is no such functionality
    // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
    async onOpenFilteringLogPage() {
        // FIXME: Remove alert
        // eslint-disable-next-line no-alert
        alert('Filtering log is not available in MV3.');
        // await this.sendMessage(MessageType.OnOpenFilteringLogPage);
    }

    async getFilteringLogData() {
        return this.sendMessage(MessageType.GetFilteringLogData);
    }

    // FIXME check why this is not used anymore
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

    // FIXME make sure that this is not used anymore
    async convertRuleText(content) {
        return this.sendMessage(MessageType.ConvertRulesText, { content });
    }

    async getRulesLimits() {
        return this.sendMessage(MessageType.GetRulesLimits);
    }
}

const messenger = new Messenger();

export { messenger };
