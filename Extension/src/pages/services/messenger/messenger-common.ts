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

import { logger } from '../../../common/logger';
import {
    APP_MESSAGE_HANDLER_NAME,
    MessageType,
    messageHasTypeAndDataFields,
    messageHasTypeField,
    type MessageWithoutHandlerName,
    type ChangeUserSettingMessage,
    type AddAndEnableFilterMessage,
    type DisableFilterMessage,
    type ApplySettingsJsonMessage,
    type SetFilteringLogWindowStateMessage,
    type SaveUserRulesMessage,
    type SetConsentedFiltersMessage,
    type GetIsConsentedFilterMessage,
    type LoadCustomFilterInfoMessage,
    type SubscribeToCustomFilterMessage,
    type RemoveAntiBannerFilterMessage,
    type GetTabInfoForPopupMessage,
    type ChangeApplicationFilteringPausedMessage,
    type OpenAbuseTabMessage,
    type OpenSiteReportTabMessage,
    type ResetUserRulesForPageMessage,
    type RemoveAllowlistDomainMessage,
    type AddAllowlistDomainForTabIdMessage,
    type AddAllowlistDomainForUrlMessage,
    type GetFilteringInfoByTabIdMessage,
    type ClearEventsByTabIdMessage,
    type RefreshPageMessage,
    type AddUserRuleMessage,
    type RemoveUserRuleMessage,
    type SetPreserveLogStateMessage,
    type SetEditorStorageContentMessage,
    type CanEnableStaticFilterMv3Message,
    type CanEnableStaticGroupMv3Message,
    type ExtractMessageResponse,
    type ValidMessageTypes,
    type SetNotificationViewedMessage,
    type UpdateFullscreenUserRulesThemeMessage,
    type AddUrlToTrustedMessage,
    type ExtractedMessage,
    type OpenSafebrowsingTrustedMessage,
    type UpdateExtensionMessageMv3,
} from '../../../common/messages';
import { type NotifierType } from '../../../common/constants';
import { type CreateEventListenerResponse } from '../../../background/services';

/**
 * @typedef {import('../../../common/messages').MessageMap} MessageMap
 */

/**
 * Type of message for long-lived connection listener callback message argument.
 */
export type LongLivedConnectionCallbackMessage = {
    /**
     * Type of notifier.
     */
    type: NotifierType;

    /**
     * Data of notifier.
     */
    data: any;
};

export const enum Page {
    FullscreenUserRules = 'fullscreen-user-rules',
    FilteringLog = 'filtering-log',
}

type UnloadCallback = () => void;

/**
 * MessengerCommon class, used to communicate with the background page from the UI.
 * Actually, it's a wrapper around the browser.runtime.sendMessage method.
 */
export abstract class MessengerCommon {
    onMessage = browser.runtime.onMessage;

    /**
     * Creates an instance of the MessengerCommon class.
     */
    constructor() {
        this.resetUserRulesForPage = this.resetUserRulesForPage.bind(this);
        this.updateFiltersMV2 = this.updateFiltersMV2.bind(this);
        this.removeAllowlistDomain = this.removeAllowlistDomain.bind(this);
        this.addAllowlistDomainForTabId = this.addAllowlistDomainForTabId.bind(this);
        this.addAllowlistDomainForUrl = this.addAllowlistDomainForUrl.bind(this);
    }

    /**
     * Sends a message to the background page.
     *
     * All messages described in the {@link MessageType} enum.
     * All answers described in the {@link MessageMap} type.
     *
     * @param type Message type.
     * @param data Message data. Optional because not all messages have data.
     *
     * @returns Promise that resolves with the response from the background page.
     * Type of the response depends on the message type. Go to {@link MessageMap}
     * to see all possible message types and their responses.
     */
    // eslint-disable-next-line class-methods-use-this
    protected async sendMessage<T extends ValidMessageTypes>(
        type: MessageWithoutHandlerName<T>['type'],
        data?: 'data' extends keyof MessageWithoutHandlerName<T> ? MessageWithoutHandlerName<T>['data'] : undefined,
    ): Promise<ExtractMessageResponse<T>> {
        const response = await browser.runtime.sendMessage({
            handlerName: APP_MESSAGE_HANDLER_NAME,
            type,
            data,
        });

        return response as ExtractMessageResponse<T>;
    }

    /**
     * Creates long-lived connections between an extension page and the background page.
     *
     * @param page Page name.
     * @param events List of events to which subscribe.
     * @param callback Callback called when event fires.
     *
     * @returns Function to remove listener on unload.
     */
    static createLongLivedConnection = (
        page: Page,
        events: NotifierType[],
        callback: (message: LongLivedConnectionCallbackMessage) => void,
    ): UnloadCallback => {
        let port: browser.Runtime.Port;
        let forceDisconnected = false;

        const connect = (): void => {
            port = browser.runtime.connect({ name: `${page}_${nanoid()}` });
            port.postMessage({ type: MessageType.AddLongLivedConnection, data: { events } });

            port.onMessage.addListener((message) => {
                if (!messageHasTypeField(message)) {
                    logger.error('[ext.MessengerCommon]: received message in MessengerCommon.createLongLivedConnection has no type field:', message);
                    return;
                }

                if (message.type === MessageType.NotifyListeners) {
                    if (!messageHasTypeAndDataFields(message)) {
                        logger.error('[ext.MessengerCommon]: received message with type MessageType.NotifyListeners has no data:', message);
                        return;
                    }

                    const castedMessage = message as ExtractedMessage<MessageType.NotifyListeners>;

                    const [type, ...data] = castedMessage.data;
                    callback({ type, data });
                }
            });

            port.onDisconnect.addListener(() => {
                if (browser.runtime.lastError) {
                    logger.error('[ext.MessengerCommon]: received error on disconnect:', browser.runtime.lastError.message);
                }
                // we try to connect again if the background page was terminated
                if (!forceDisconnected) {
                    connect();
                }
            });
        };

        connect();

        const onUnload = (): void => {
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
     * @param events List of events to which subscribe.
     * @param callback Callback called when event fires.
     * @param onUnloadCallback Callback used to remove listener on unload.
     *
     * @returns Function to remove listener on unload.
     */
    createEventListener = async (
        events: NotifierType[],
        callback: (message: LongLivedConnectionCallbackMessage) => void,
        onUnloadCallback?: () => void,
    ): Promise<UnloadCallback> => {
        let listenerId: number | null;

        const response: CreateEventListenerResponse = await this.sendMessage(
            MessageType.CreateEventListener,
            { events },
        );

        listenerId = response.listenerId;

        const onUpdateListeners = async (): Promise<void> => {
            const updatedResponse: CreateEventListenerResponse = await this.sendMessage(
                MessageType.CreateEventListener,
                { events },
            );

            listenerId = updatedResponse.listenerId;
        };

        const messageHandler = (message: unknown) => {
            if (!messageHasTypeField(message)) {
                logger.error('[ext.MessengerCommon]: received message in MessengerCommon.createEventListener has no type field:', message);
                return undefined;
            }

            if (message.type === MessageType.NotifyListeners) {
                if (!messageHasTypeAndDataFields(message)) {
                    logger.error('[ext.MessengerCommon]: received message with type MessageType.NotifyListeners has no data:', message);
                    return undefined;
                }

                const castedMessage = message as ExtractedMessage<MessageType.NotifyListeners>;

                const [type, ...data] = castedMessage.data;

                if (events.includes(type)) {
                    callback({ type, data });
                }
            }
            if (message.type === MessageType.UpdateListeners) {
                onUpdateListeners();
            }
        };

        const onUnload = (): void => {
            if (!listenerId) {
                return;
            }

            browser.runtime.onMessage.removeListener(messageHandler);
            window.removeEventListener('beforeunload', onUnload);
            window.removeEventListener('unload', onUnload);

            this.sendMessage(
                MessageType.RemoveListener,
                { listenerId },
            );

            listenerId = null;

            if (typeof onUnloadCallback === 'function') {
                onUnloadCallback();
            }
        };

        browser.runtime.onMessage.addListener(messageHandler);
        window.addEventListener('beforeunload', onUnload);
        window.addEventListener('unload', onUnload);

        return onUnload;
    };

    /**
     * Sends a message from background page to update listeners on the UI.
     *
     * @returns Promise that resolves when the message is sent.
     */
    async updateListeners(): Promise<ExtractMessageResponse<MessageType.UpdateListeners>> {
        return this.sendMessage(MessageType.UpdateListeners);
    }

    /**
     * Sends a message to the background page to get the settings data for
     * the options page with some additional info.
     *
     * @returns Promise that resolves with the settings data for
     * the options page with some additional info.
     */
    async getOptionsData(): Promise<ExtractMessageResponse<MessageType.GetOptionsData>> {
        return this.sendMessage(MessageType.GetOptionsData);
    }

    /**
     * Sends a message to the background page to change the user setting.
     *
     * @param settingId Setting identifier.
     * @param value Setting value.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async changeUserSetting(
        settingId: ChangeUserSettingMessage['data']['key'],
        value: ChangeUserSettingMessage['data']['value'],
    ): Promise<ExtractMessageResponse<MessageType.ChangeUserSettings>> {
        await this.sendMessage(
            MessageType.ChangeUserSettings,
            {
                key: settingId,
                value,
            },
        );
    }

    /**
     * Sends a message to the background page to open the extension store.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async openExtensionStore(): Promise<ExtractMessageResponse<MessageType.OpenExtensionStore>> {
        return this.sendMessage(MessageType.OpenExtensionStore);
    }

    /**
     * Sends a message to the background page to open the compare page.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async openComparePage(): Promise<ExtractMessageResponse<MessageType.OpenComparePage>> {
        return this.sendMessage(MessageType.OpenComparePage);
    }

    /**
     * Sends a message to the background page to open the Chrome extensions settings page.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async openChromeExtensionsPage(): Promise<ExtractMessageResponse<MessageType.OpenChromeExtensionsSettingsPage>> {
        return this.sendMessage(MessageType.OpenChromeExtensionsSettingsPage);
    }

    /**
     * Sends a message to the background page to open the extension details page.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async openExtensionDetailsPage(): Promise<ExtractMessageResponse<MessageType.OpenExtensionDetailsPage>> {
        return this.sendMessage(MessageType.OpenExtensionDetailsPage);
    }

    /**
     * Sends a message to the background page to enable a filter by filter id.
     *
     * @param filterId Filter identifier.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async enableFilter(
        filterId: AddAndEnableFilterMessage['data']['filterId'],
    ): Promise<ExtractMessageResponse<MessageType.AddAndEnableFilter>> {
        return this.sendMessage(MessageType.AddAndEnableFilter, { filterId });
    }

    /**
     * Sends a message to the background page to disable a filter by filter id.
     *
     * @param filterId Filter identifier.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async disableFilter(
        filterId: DisableFilterMessage['data']['filterId'],
    ): Promise<ExtractMessageResponse<MessageType.DisableFilter>> {
        return this.sendMessage(MessageType.DisableFilter, { filterId });
    }

    /**
     * Sends a message to the background page to apply settings from a JSON object.
     *
     * @param json JSON object representing the settings to apply.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async applySettingsJson(
        json: ApplySettingsJsonMessage['data']['json'],
    ): Promise<ExtractMessageResponse<MessageType.ApplySettingsJson>> {
        return this.sendMessage(MessageType.ApplySettingsJson, { json });
    }

    /**
     * Sends a message to the background page to open the filtering log.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async openFilteringLog(): Promise<ExtractMessageResponse<MessageType.OpenFilteringLog>> {
        return this.sendMessage(MessageType.OpenFilteringLog);
    }

    /**
     * Sends a message to the background page to reset the blocked ads statistics.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async resetStatistics(): Promise<ExtractMessageResponse<MessageType.ResetBlockedAdsCount>> {
        return this.sendMessage(MessageType.ResetBlockedAdsCount);
    }

    /**
     * Sends a message to the background page to set the filtering log window state.
     *
     * @param windowState State of the filtering log window.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async setFilteringLogWindowState(
        windowState: SetFilteringLogWindowStateMessage['data']['windowState'],
    ): Promise<ExtractMessageResponse<MessageType.SetFilteringLogWindowState>> {
        return this.sendMessage(MessageType.SetFilteringLogWindowState, { windowState });
    }

    /**
     * Sends a message to the background page to reset the settings.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async resetSettings(): Promise<ExtractMessageResponse<MessageType.ResetSettings>> {
        return this.sendMessage(MessageType.ResetSettings);
    }

    /**
     * Sends a message to the background page to get the user rules.
     *
     * @returns Promise that resolves with the user rules.
     */
    async getUserRules(): Promise<ExtractMessageResponse<MessageType.GetUserRules>> {
        return this.sendMessage(MessageType.GetUserRules);
    }

    /**
     * Sends a message to the background page to save user rules.
     *
     * @param value User rules value to save.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async saveUserRules(
        value: SaveUserRulesMessage['data']['value'],
    ): Promise<ExtractMessageResponse<MessageType.SaveUserRules>> {
        await this.sendMessage(MessageType.SaveUserRules, { value });
    }

    /**
     * Sends a message to the background page to open user rules editor in fullscreen.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async openFullscreenUserRules(): Promise<ExtractMessageResponse<MessageType.OpenFullscreenUserRules>> {
        return this.sendMessage(MessageType.OpenFullscreenUserRules);
    }

    /**
     * Sends a message to the background page to get the allowlist domains.
     *
     * @returns Promise that resolves with the list of allowlist domains.
     */
    async getAllowlist(): Promise<ExtractMessageResponse<MessageType.GetAllowlistDomains>> {
        return this.sendMessage(MessageType.GetAllowlistDomains);
    }

    /**
     * Sends a message to the background page to save the allowlist domains.
     *
     * @param value Allowlist domains value to save.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async saveAllowlist(
        value: SaveUserRulesMessage['data']['value'],
    ): Promise<ExtractMessageResponse<MessageType.SaveAllowlistDomains>> {
        await this.sendMessage(MessageType.SaveAllowlistDomains, { value });
    }

    /**
     * Sends a message to the background page to mark a notification as viewed.
     *
     * @param withDelay Whether the notification should be marked as viewed after a delay.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async setNotificationViewed(
        withDelay: SetNotificationViewedMessage['data']['withDelay'],
    ): Promise<ExtractMessageResponse<MessageType.SetNotificationViewed>> {
        await this.sendMessage(MessageType.SetNotificationViewed, { withDelay });
    }

    /**
     * Sends a message to the background page to update filters.
     *
     * @returns Promise that resolves with the list of filters.
     */
    abstract updateFiltersMV2(): Promise<ExtractMessageResponse<MessageType.CheckFiltersUpdate>>;

    /**
     * Sends a message to the background page to check for extension updates.
     */
    abstract checkUpdatesMV3(): Promise<ExtractMessageResponse<MessageType.CheckExtensionUpdateMv3>>;

    /**
     * Sends a message to the background page to update extension.
     */
    abstract updateExtensionMV3(
        { from }: UpdateExtensionMessageMv3['data'],
    ): Promise<ExtractMessageResponse<MessageType.UpdateExtensionMv3>>;

    /**
     * Sends a message to the background page to update the status of a filter group.
     *
     * @param groupId Group identifier.
     * @param enabled Whether the group should be enabled or disabled.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async updateGroupStatus(
        groupId: number,
        enabled: boolean,
    ): Promise<ExtractMessageResponse<MessageType.EnableFiltersGroup | MessageType.DisableFiltersGroup>> {
        const type = enabled ? MessageType.EnableFiltersGroup : MessageType.DisableFiltersGroup;

        return this.sendMessage(type, { groupId });
    }

    /**
     * Sends a message to the background page to set consented filters.
     *
     * @param filterIds List of filter identifiers.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async setConsentedFilters(
        filterIds: SetConsentedFiltersMessage['data']['filterIds'],
    ): Promise<ExtractMessageResponse<MessageType.SetConsentedFilters>> {
        return this.sendMessage(MessageType.SetConsentedFilters, { filterIds });
    }

    /**
     * Sends a message to the background page to check if a filter is consented.
     *
     * @param filterId Filter identifier.
     *
     * @returns Promise that resolves with the result of the check.
     */
    async getIsConsentedFilter(
        filterId: GetIsConsentedFilterMessage['data']['filterId'],
    ): Promise<ExtractMessageResponse<MessageType.GetIsConsentedFilter>> {
        return this.sendMessage(MessageType.GetIsConsentedFilter, { filterId });
    }

    /**
     * Sends a message to the background page to check a custom filter URL.
     *
     * @param url Custom filter URL.
     *
     * @returns Promise that resolves with the result of the check.
     */
    async checkCustomUrl(
        url: LoadCustomFilterInfoMessage['data']['url'],
    ): Promise<ExtractMessageResponse<MessageType.LoadCustomFilterInfo>> {
        return this.sendMessage(MessageType.LoadCustomFilterInfo, { url });
    }

    /**
     * Sends a message to the background page to add a custom filter.
     *
     * @param {CustomFilterSubscriptionData} filter Custom filter data.
     *
     * @returns {Promise<CustomFilterMetadata>} Custom filter metadata.
     */
    async addCustomFilter(
        filter: SubscribeToCustomFilterMessage['data']['filter'],
    ): Promise<ExtractMessageResponse<MessageType.SubscribeToCustomFilter>> {
        return this.sendMessage(MessageType.SubscribeToCustomFilter, { filter });
    }

    /**
     * Sends a message to the background page to remove a custom filter.
     *
     * @param filterId Custom filter ID.
     *
     * @returns Promise that resolves after the filter is removed.
     */
    async removeCustomFilter(
        filterId: RemoveAntiBannerFilterMessage['data']['filterId'],
    ): Promise<ExtractMessageResponse<MessageType.RemoveAntiBannerFilter>> {
        await this.sendMessage(MessageType.RemoveAntiBannerFilter, { filterId });
    }

    /**
     * Sends a message to the background page to check if the engine is started.
     *
     * @returns Promise that resolves to a boolean value:
     * true if the engine is started, false otherwise.
     */
    async getIsEngineStarted(): Promise<ExtractMessageResponse<MessageType.GetIsEngineStarted>> {
        return this.sendMessage(MessageType.GetIsEngineStarted);
    }

    /**
     * Sends a message to the background to get the tab info for the popup.
     *
     * @param tabId Tab ID.
     *
     * @returns Promise that resolves with the tab info or undefined.
     */
    async getTabInfoForPopup(
        tabId: GetTabInfoForPopupMessage['data']['tabId'],
    ): Promise<ExtractMessageResponse<MessageType.GetTabInfoForPopup>> {
        return this.sendMessage(MessageType.GetTabInfoForPopup, { tabId });
    }

    /**
     * Sends a message to the background page to change application filtering state.
     *
     * @param state Application filtering state.
     *
     * @returns Promise that resolves after the state is changed.
     */
    async changeApplicationFilteringPaused(
        state: ChangeApplicationFilteringPausedMessage['data']['state'],
    ): Promise<ExtractMessageResponse<MessageType.ChangeApplicationFilteringPaused>> {
        return this.sendMessage(MessageType.ChangeApplicationFilteringPaused, { state });
    }

    /**
     * Sends a message to the background page to update the theme of the fullscreen user rules.
     *
     * @param theme Theme to set.
     *
     * @returns Promise that resolves after the theme is updated.
     */
    async updateFullscreenUserRulesTheme(
        theme: UpdateFullscreenUserRulesThemeMessage['data']['theme'],
    ): Promise<ExtractMessageResponse<MessageType.UpdateFullscreenUserRulesTheme>> {
        return this.sendMessage(MessageType.UpdateFullscreenUserRulesTheme, { theme });
    }

    /**
     * Sends a message to the background page to open the rules limits tab.
     *
     * @returns Promise that resolves after the tab is opened.
     */
    async openRulesLimitsTab(): Promise<ExtractMessageResponse<MessageType.OpenRulesLimitsTab>> {
        return this.sendMessage(MessageType.OpenRulesLimitsTab);
    }

    /**
     * Sends a message to the background page to open the settings tab.
     *
     * @returns Promise that resolves after the tab is opened.
     */
    async openSettingsTab(): Promise<ExtractMessageResponse<MessageType.OpenSettingsTab>> {
        return this.sendMessage(MessageType.OpenSettingsTab);
    }

    /**
     * Sends a message to the background page to open the assistant.
     *
     * @returns Promise that resolves after the assistant is opened.
     */
    async openAssistant(): Promise<ExtractMessageResponse<MessageType.OpenAssistant>> {
        return this.sendMessage(MessageType.OpenAssistant);
    }

    /**
     * Sends a message to the background page to open the abuse reporting tab for a site.
     *
     * @param url The URL of the site to report abuse for.
     * @param from The source of the request.
     *
     * @returns Promise that resolves after the tab is opened.
     */
    async openAbuseSite(
        url: OpenAbuseTabMessage['data']['url'],
        from: OpenAbuseTabMessage['data']['from'],
    ): Promise<ExtractMessageResponse<MessageType.OpenAbuseTab>> {
        return this.sendMessage(MessageType.OpenAbuseTab, { url, from });
    }

    /**
     * Sends a message to the background page to check site security.
     *
     * @param url The URL of the site to check.
     * @param from The source of the request.
     *
     * @returns Promise that resolves with the site security info.
     */
    async checkSiteSecurity(
        url: OpenSiteReportTabMessage['data']['url'],
        from: OpenSiteReportTabMessage['data']['from'],
    ): Promise<ExtractMessageResponse<MessageType.OpenSiteReportTab>> {
        return this.sendMessage(MessageType.OpenSiteReportTab, { url, from });
    }

    /**
     * Sends a message to the background page to reset user rules for a specific page.
     *
     * @param url The URL of the page.
     *
     * @returns Promise that resolves after the user rules are reset.
     */
    async resetUserRulesForPage(
        url: ResetUserRulesForPageMessage['data']['url'],
    ): Promise<ExtractMessageResponse<MessageType.ResetUserRulesForPage>> {
        const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });

        if (!currentTab?.id) {
            logger.warn('[ext.MessengerCommon.resetUserRulesForPage]: cannot get current tab id');
            return;
        }

        return this.sendMessage(
            MessageType.ResetUserRulesForPage,
            { url, tabId: currentTab?.id },
        );
    }

    /**
     * Sends a message to the background page to remove an allowlist domain.
     *
     * @param tabId The ID of the tab.
     * @param tabRefresh Whether the tab should be refreshed.
     *
     * @returns Promise that resolves after the domain is removed.
     */
    async removeAllowlistDomain(
        tabId: RemoveAllowlistDomainMessage['data']['tabId'],
        tabRefresh: RemoveAllowlistDomainMessage['data']['tabRefresh'],
    ): Promise<ExtractMessageResponse<MessageType.RemoveAllowlistDomain>> {
        return this.sendMessage(MessageType.RemoveAllowlistDomain, { tabId, tabRefresh });
    }

    /**
     * Sends a message to the background page to add an allowlist domain for a specific tab.
     *
     * @param tabId The ID of the tab.
     *
     * @returns Promise that resolves after the domain is added.
     */
    async addAllowlistDomainForTabId(
        tabId: AddAllowlistDomainForTabIdMessage['data']['tabId'],
    ): Promise<ExtractMessageResponse<MessageType.AddAllowlistDomainForTabId>> {
        return this.sendMessage(MessageType.AddAllowlistDomainForTabId, { tabId });
    }

    /**
     * Sends a message to the background page to add an allowlist domain for a specific URL.
     *
     * Please note that after adding an allowlist domain, the tab will not be reloaded,
     * it should be done separately later if needed.
     *
     * @param url The URL of the page.
     *
     * @returns Promise that resolves after the domain is added.
     */
    async addAllowlistDomainForUrl(
        url: AddAllowlistDomainForUrlMessage['data']['url'],
    ): Promise<ExtractMessageResponse<MessageType.AddAllowlistDomainForUrl>> {
        return this.sendMessage(MessageType.AddAllowlistDomainForUrl, { url });
    }

    /**
     * Works only in MV2, since MV3 doesn't support filtering log yet.
     *
     * @returns Promise that resolves after the filtering log page is opened.
     */
    async onOpenFilteringLogPage(): Promise<ExtractMessageResponse<MessageType.OnOpenFilteringLogPage>> {
        await this.sendMessage(MessageType.OnOpenFilteringLogPage);
    }

    /**
     * Sends a message to the background page to get filtering log data.
     *
     * @returns Promise that resolves with filtering log data.
     */
    async getFilteringLogData(): Promise<ExtractMessageResponse<MessageType.GetFilteringLogData>> {
        return this.sendMessage(MessageType.GetFilteringLogData);
    }

    /**
     * Sends a message to the background page to close the filtering log page.
     *
     * @returns Promise that resolves after the page is closed.
     */
    async onCloseFilteringLogPage(): Promise<ExtractMessageResponse<MessageType.OnCloseFilteringLogPage>> {
        await this.sendMessage(MessageType.OnCloseFilteringLogPage);
    }

    /**
     * Sends a message to the background page to get filtering info by tab ID.
     *
     * @param tabId The ID of the tab.
     *
     * @returns Promise that resolves with filtering info about the tab.
     */
    async getFilteringInfoByTabId(
        tabId: GetFilteringInfoByTabIdMessage['data']['tabId'],
    ): Promise<ExtractMessageResponse<MessageType.GetFilteringInfoByTabId>> {
        return this.sendMessage(MessageType.GetFilteringInfoByTabId, { tabId });
    }

    /**
     * Sends a message to the background page to synchronize the list of open tabs.
     *
     * @returns Promise that resolves with an array of filtering info about open tabs.
     */
    async synchronizeOpenTabs(): Promise<ExtractMessageResponse<MessageType.SynchronizeOpenTabs>> {
        return this.sendMessage(MessageType.SynchronizeOpenTabs);
    }

    /**
     * Sends a message to the background page to clear events by tab ID.
     *
     * @param tabId The ID of the tab.
     * @param ignorePreserveLog Optional flag to ignore the preserve log state.
     *
     * @returns Promise that resolves after the events are cleared.
     */
    async clearEventsByTabId(
        tabId: ClearEventsByTabIdMessage['data']['tabId'],
        ignorePreserveLog?: ClearEventsByTabIdMessage['data']['ignorePreserveLog'],
    ): Promise<ExtractMessageResponse<MessageType.ClearEventsByTabId>> {
        return this.sendMessage(MessageType.ClearEventsByTabId, { tabId, ignorePreserveLog });
    }

    /**
     * Sends a message to the background page to refresh the current page by tab ID.
     *
     * @param tabId The ID of the tab.
     *
     * @returns Promise that resolves after the page is refreshed.
     */
    async refreshPage(
        tabId: RefreshPageMessage['data']['tabId'],
    ): Promise<ExtractMessageResponse<MessageType.RefreshPage>> {
        await this.sendMessage(MessageType.RefreshPage, { tabId });
    }

    /**
     * Sends a message to the background page to add a user rule.
     *
     * @param ruleText User rule text to be added.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async addUserRule(
        ruleText: AddUserRuleMessage['data']['ruleText'],
    ): Promise<ExtractMessageResponse<MessageType.AddUserRule>> {
        await this.sendMessage(MessageType.AddUserRule, { ruleText });
    }

    /**
     * Sends a message to the background page to remove a user rule.
     *
     * @param ruleText User rule text to be removed.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async removeUserRule(
        ruleText: RemoveUserRuleMessage['data']['ruleText'],
    ): Promise<ExtractMessageResponse<MessageType.RemoveUserRule>> {
        await this.sendMessage(MessageType.RemoveUserRule, { ruleText });
    }

    /**
     * Sends a message to the background page to set the preserve log state.
     *
     * @param state State indicating whether to preserve the log.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async setPreserveLogState(
        state: SetPreserveLogStateMessage['data']['state'],
    ): Promise<ExtractMessageResponse<MessageType.SetPreserveLogState>> {
        return this.sendMessage(MessageType.SetPreserveLogState, { state });
    }

    /**
     * Sends a message to the background page to get the editor storage content.
     *
     * @returns Promise that resolves with the editor storage content.
     */
    async getEditorStorageContent(): Promise<ExtractMessageResponse<MessageType.GetEditorStorageContent>> {
        return this.sendMessage(MessageType.GetEditorStorageContent);
    }

    /**
     * Sends a message to the background page to set the editor storage content.
     *
     * @param content Content to be stored in the editor.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async setEditorStorageContent(
        content: SetEditorStorageContentMessage['data']['content'],
    ): Promise<ExtractMessageResponse<MessageType.SetEditorStorageContent>> {
        return this.sendMessage(MessageType.SetEditorStorageContent, { content });
    }

    /**
     * Sends a message to the background page to get the rules limits counters for MV3.
     *
     * @returns Promise that resolves with the rules limits counters for MV3.
     */
    async getRulesLimitsCounters(): Promise<ExtractMessageResponse<MessageType.GetRulesLimitsCountersMv3>> {
        return this.sendMessage(MessageType.GetRulesLimitsCountersMv3);
    }

    /**
     * Sends a message to the background page to check if it is possible to enable a static filter.
     *
     * @param filterId Filter ID to check.
     *
     * @returns Promise that resolves with the result of the static filter check.
     *
     * @throws Error If the filter is not static.
     */
    async canEnableStaticFilter(
        filterId: CanEnableStaticFilterMv3Message['data']['filterId'],
    ): Promise<ExtractMessageResponse<MessageType.CanEnableStaticFilterMv3>> {
        return this.sendMessage(MessageType.CanEnableStaticFilterMv3, { filterId });
    }

    /**
     * Sends a message to the background page to check if all dynamic rules for a user rules' group can be enabled.
     *
     * @param groupId Group identifier to check.
     *
     * @returns Promise that resolves with the result of the static group check.
     */
    async canEnableStaticGroup(
        groupId: CanEnableStaticGroupMv3Message['data']['groupId'],
    ): Promise<ExtractMessageResponse<MessageType.CanEnableStaticGroupMv3>> {
        return this.sendMessage(MessageType.CanEnableStaticGroupMv3, { groupId });
    }

    /**
     * Sends a message to the background page to get the current static filters limits.
     *
     * @returns Promise that resolves with the current static filters limits.
     */
    async getCurrentLimits(): Promise<ExtractMessageResponse<MessageType.CurrentLimitsMv3>> {
        return this.sendMessage(MessageType.CurrentLimitsMv3);
    }

    /**
     * Sends a message to the background page to check if the request filter is ready.
     *
     * @returns Promise that resolves to a boolean indicating if the request filter is ready.
     */
    async checkRequestFilterReady(): Promise<ExtractMessageResponse<MessageType.CheckRequestFilterReady>> {
        return this.sendMessage(MessageType.CheckRequestFilterReady);
    }

    /**
     * Sends a message to the background page to add a URL to the trusted list.
     *
     * @param url URL to be added to the trusted list.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async addUrlToTrusted(
        url: AddUrlToTrustedMessage['data']['url'],
    ): Promise<ExtractMessageResponse<MessageType.AddUrlToTrusted>> {
        return this.sendMessage(MessageType.AddUrlToTrusted, { url });
    }

    /**
     * Sends a message to the background page to get user rules editor data.
     *
     * @returns Promise that resolves with the user rules editor data.
     */
    async getUserRulesEditorData(): Promise<ExtractMessageResponse<MessageType.GetUserRulesEditorData>> {
        return this.sendMessage(MessageType.GetUserRulesEditorData);
    }

    /**
     * Sends a message to the background page to restore filters in MV3.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async restoreFiltersMv3(): Promise<ExtractMessageResponse<MessageType.RestoreFiltersMv3>> {
        return this.sendMessage(MessageType.RestoreFiltersMv3);
    }

    /**
     * Sends a message to the background page to clear the rules limits warning in MV3.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async clearRulesLimitsWarningMv3(): Promise<ExtractMessageResponse<MessageType.ClearRulesLimitsWarningMv3>> {
        return this.sendMessage(MessageType.ClearRulesLimitsWarningMv3);
    }

    /**
     * Sends a message to the background page to get the allowlist domains.
     *
     * @returns Promise that resolves with the allowlist domains.
     */
    async getAllowlistDomains(): Promise<ExtractMessageResponse<MessageType.GetAllowlistDomains>> {
        return this.sendMessage(MessageType.GetAllowlistDomains);
    }

    /**
     * Sends a message to the background page to load the settings JSON.
     *
     * @returns Promise that resolves with the loaded settings JSON.
     */
    async loadSettingsJson(): Promise<ExtractMessageResponse<MessageType.LoadSettingsJson>> {
        return this.sendMessage(MessageType.LoadSettingsJson);
    }

    /**
     * Sends a message to the background page to open the thank you page.
     *
     * @returns Promise that resolves after the message is sent.
     */
    async openThankYouPage(): Promise<ExtractMessageResponse<MessageType.OpenThankYouPage>> {
        return this.sendMessage(MessageType.OpenThankYouPage);
    }

    /**
     * Sends a message to the background page to initialize the frame script.
     *
     * @returns Promise that resolves with the initialization data for the frame script.
     */
    async initializeFrameScript(): Promise<ExtractMessageResponse<MessageType.InitializeFrameScript>> {
        return this.sendMessage(MessageType.InitializeFrameScript);
    }

    /**
     * Sends a message to the background page to initialize the blocking page script.
     *
     * @returns Promise that resolves with the initialization data for the blocking page script.
     */
    async initializeBlockingPageScript(): Promise<ExtractMessageResponse<MessageType.InitializeBlockingPageScript>> {
        return this.sendMessage(MessageType.InitializeBlockingPageScript);
    }

    /**
     * Sends a message to the background page to mark url as trusted and ignore
     * safebrowsing checks for it.
     *
     * @returns Promise that resolves with the initialization data for the frame script.
     */
    async openSafebrowsingTrusted(
        url: OpenSafebrowsingTrustedMessage['data']['url'],
    ): Promise<ExtractMessageResponse<MessageType.OpenSafebrowsingTrusted>> {
        return this.sendMessage(MessageType.OpenSafebrowsingTrusted, { url });
    }
}
