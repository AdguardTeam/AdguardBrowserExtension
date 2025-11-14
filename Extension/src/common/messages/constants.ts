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

/**
 * Important: do not use z.inferOf, because it brings a lot of side effects with
 * many dependencies to the bundle.
 *
 * Also please try, if possible, to not import here external modules
 * other that types.
 */
import { type Windows } from 'webextension-polyfill';

import { type ForwardFrom } from '../forward';
import { type SettingOption, type Settings } from '../../background/schema/settings';
import { type CategoriesFilterData } from '../../background/api/filters/categories';
import { type AppearanceTheme, type NotifierType } from '../constants';
import { type FilteringLogTabInfo } from '../../background/api/filtering-log';
import {
    type GetExtensionStatusForPopupResponse,
    type GetTabInfoForPopupResponse,
} from '../../background/services/ui/popup';
import { type GetFilteringLogDataResponse } from '../../background/services/filtering-log';
import {
    type IRulesLimits,
    type Mv3LimitsCheckResult,
    type StaticLimitsCheckResult,
} from '../../background/services/rules-limits/interface';
import { type BlockingPageInitAppData, type PageInitAppData } from '../../background/services/ui/main';
import { type ExportMessageResponse, type GetOptionsDataResponse } from '../../background/services/settings/types';
import { type CreateEventListenerResponse } from '../../background/services/event';
import { type FilterMetadata } from '../../background/api/filters/main';
import { type GetAllowlistDomainsResponse } from '../../background/services/allowlist';
import { type GetUserRulesEditorDataResponse, type GetUserRulesResponse } from '../../background/services/userrules';
import { type GetCustomFilterInfoResult } from '../../background/api/filters/custom';
import { type ManualUpdateMetadata } from '../../background/services/extension-update/types';

export const APP_MESSAGE_HANDLER_NAME = 'app';

export type MessageCommonProps = {
    handlerName: typeof APP_MESSAGE_HANDLER_NAME;
};

/**
 * Message types used for message passing between extension contexts
 * (popup, filtering log, content scripts, background)
 */
export enum MessageType {
    CreateEventListener = 'createEventListener',
    RemoveListener = 'removeListener',
    OpenExtensionStore = 'openExtensionStore',
    AddAndEnableFilter = 'addAndEnableFilter',
    ApplySettingsJson = 'applySettingsJson',
    OpenFilteringLog = 'openFilteringLog',
    OpenFullscreenUserRules = 'openFullscreenUserRules',
    UpdateFullscreenUserRulesTheme = 'updateFullscreenUserRulesTheme',
    ResetBlockedAdsCount = 'resetBlockedAdsCount',
    ResetSettings = 'resetSettings',
    GetUserRules = 'getUserRules',
    SaveUserRules = 'saveUserRules',
    GetAllowlistDomains = 'getAllowlistDomains',
    SaveAllowlistDomains = 'saveAllowlistDomains',
    CheckFiltersUpdate = 'checkFiltersUpdate',
    CheckExtensionUpdateMv3 = 'checkExtensionUpdateMv3',
    UpdateExtensionMv3 = 'updateExtensionMv3',
    DisableFiltersGroup = 'disableFiltersGroup',
    DisableFilter = 'disableFilter',
    LoadCustomFilterInfo = 'loadCustomFilterInfo',
    SubscribeToCustomFilter = 'subscribeToCustomFilter',
    RemoveAntiBannerFilter = 'removeAntiBannerFilter',
    GetIsAppInitialized = 'getIsAppInitialized',
    GetTabInfoForPopup = 'getTabInfoForPopup',
    ChangeApplicationFilteringPaused = 'changeApplicationFilteringPaused',
    OpenRulesLimitsTab = 'openRulesLimitsTab',
    OpenSettingsTab = 'openSettingsTab',
    OpenAssistant = 'openAssistant',
    OpenAbuseTab = 'openAbuseTab',
    OpenSiteReportTab = 'openSiteReportTab',
    OpenComparePage = 'openComparePage',
    OpenChromeExtensionsSettingsPage = 'openChromeExtensionsSettingsPage',
    OpenExtensionDetailsPage = 'openExtensionDetailsPage',
    ResetUserRulesForPage = 'resetUserRulesForPage',
    RemoveAllowlistDomain = 'removeAllowlistDomain',
    AddAllowlistDomainForTabId = 'addAllowlistDomainForTabId',
    AddAllowlistDomainForUrl = 'addAllowlistDomainForUrl',
    OnOpenFilteringLogPage = 'onOpenFilteringLogPage',
    GetFilteringLogData = 'getFilteringLogData',
    InitializeFrameScript = 'initializeFrameScript',
    InitializeBlockingPageScript = 'initializeBlockingPageScript',
    OnCloseFilteringLogPage = 'onCloseFilteringLogPage',
    GetFilteringInfoByTabId = 'getFilteringInfoByTabId',
    SynchronizeOpenTabs = 'synchronizeOpenTabs',
    ClearEventsByTabId = 'clearEventsByTabId',
    RefreshPage = 'refreshPage',
    AddUserRule = 'addUserRule',
    RemoveUserRule = 'removeUserRule',
    EnableFiltersGroup = 'enableFiltersGroup',
    NotifyListeners = 'notifyListeners',
    AddLongLivedConnection = 'addLongLivedConnection',
    GetOptionsData = 'getOptionsData',
    ChangeUserSettings = 'changeUserSetting',
    CheckRequestFilterReady = 'checkRequestFilterReady',
    OpenThankYouPage = 'openThankYouPage',
    OpenSafebrowsingTrusted = 'openSafebrowsingTrusted',
    GetSelectorsAndScripts = 'getSelectorsAndScripts',
    CheckPageScriptWrapperRequest = 'checkPageScriptWrapperRequest',
    ProcessShouldCollapse = 'processShouldCollapse',
    ProcessShouldCollapseMany = 'processShouldCollapseMany',
    AddFilteringSubscription = 'addFilterSubscription',
    SetNotificationViewed = 'setNotificationViewed',
    SaveCssHitsStats = 'saveCssHitStats',
    GetCookieRules = 'getCookieRules',
    SaveCookieLogEvent = 'saveCookieRuleEvent',
    LoadSettingsJson = 'loadSettingsJson',
    AddUrlToTrusted = 'addUrlToTrusted',
    SetPreserveLogState = 'setPreserveLogState',
    GetUserRulesEditorData = 'getUserRulesEditorData',
    GetEditorStorageContent = 'getEditorStorageContent',
    SetEditorStorageContent = 'setEditorStorageContent',
    SetFilteringLogWindowState = 'setFilteringLogWindowState',
    AppInitialized = 'appInitialized',
    UpdateTotalBlocked = 'updateTotalBlocked',
    ScriptletCloseWindow = 'scriptletCloseWindow',
    ShowRuleLimitsAlert = 'showRuleLimitsAlert',
    ShowAlertPopup = 'showAlertPopup',
    ShowVersionUpdatedPopup = 'showVersionUpdatedPopup',
    UpdateListeners = 'updateListeners',
    SetConsentedFilters = 'setConsentedFilters',
    GetIsConsentedFilter = 'getIsConsentedFilter',
    GetRulesLimitsCountersMv3 = 'getRulesLimitsCountersMv3',
    CanEnableStaticFilterMv3 = 'canEnableStaticFilterMv3',
    CanEnableStaticGroupMv3 = 'canEnableStaticGroupMv3',
    ClearRulesLimitsWarningMv3 = 'clearRulesLimitsWarningMv3',
    RestoreFiltersMv3 = 'restoreFiltersMv3',
    CurrentLimitsMv3 = 'currentLimitsMv3',
    GetExtensionStatusForPopupMV3 = 'getExtensionStatusForPopupMV3',
}

export type ApplySettingsJsonMessage = {
    type: MessageType.ApplySettingsJson;
    data: {
        json: string;
    };
};

export type LoadSettingsJsonMessage = {
    type: MessageType.LoadSettingsJson;
    data: {
        json: string;
    };
};

export type AddFilteringSubscriptionMessage = {
    type: MessageType.AddFilteringSubscription;
    data: {
        url: string;
        title?: string;
    };
};

export type CreateEventListenerMessage = {
    type: MessageType.CreateEventListener;
    data: {
        events: NotifierType[];
    };
};

export type RemoveListenerMessage = {
    type: MessageType.RemoveListener;
    data: {
        listenerId: number;
    };
};

export type GetIsAppInitializedMessage = {
    type: MessageType.GetIsAppInitialized;
};

export type GetTabInfoForPopupMessage = {
    type: MessageType.GetTabInfoForPopup;
    data: {
        tabId: number;
    };
};

export type ChangeApplicationFilteringPausedMessage = {
    type: MessageType.ChangeApplicationFilteringPaused;
    data: {
        state: boolean;
    };
};

export type OpenRulesLimitsTabMessage = {
    type: MessageType.OpenRulesLimitsTab;
};

export type OpenSettingsTabMessage = {
    type: MessageType.OpenSettingsTab;
};

export type OpenAssistantMessage = {
    type: MessageType.OpenAssistant;
};

export type UpdateFullscreenUserRulesThemeMessage = {
    type: MessageType.UpdateFullscreenUserRulesTheme;
    data: {
        theme: AppearanceTheme;
    };
};

export type AddLongLivedConnectionMessage = {
    type: MessageType.AddLongLivedConnection;
    data: {
        events: NotifierType[];
    };
};

export type NotifyListenersMessage = {
    type: MessageType.NotifyListeners;
    data: any;
};

export type UpdateListenersMessage = {
    type: MessageType.UpdateListeners;
};

export type CheckFiltersUpdateMessage = {
    type: MessageType.CheckFiltersUpdate;
};

export type CheckExtensionUpdateMessageMv3 = {
    type: MessageType.CheckExtensionUpdateMv3;
};

export type UpdateExtensionMessageMv3 = {
    type: MessageType.UpdateExtensionMv3;
    data: {
        from: ManualUpdateMetadata['pageToOpenAfterReload'];
    };
};

export type GetAllowlistDomainsMessage = {
    type: MessageType.GetAllowlistDomains;
};

export type ResetBlockedAdsCountMessage = {
    type: MessageType.ResetBlockedAdsCount;
};

export type OpenComparePageMessage = {
    type: MessageType.OpenComparePage;
};

export type OpenChromeExtensionsSettingsPageMessage = {
    type: MessageType.OpenChromeExtensionsSettingsPage;
};

export type OpenExtensionDetailsPageMessage = {
    type: MessageType.OpenExtensionDetailsPage;
};

export type OpenFullscreenUserRulesMessage = {
    type: MessageType.OpenFullscreenUserRules;
};

export type OpenExtensionStoreMessage = {
    type: MessageType.OpenExtensionStore;
};

export type OpenFilteringLogMessage = {
    type: MessageType.OpenFilteringLog;
};

export type OpenAbuseTabMessage = {
    type: MessageType.OpenAbuseTab;
    data: {
        url: string;
        from: ForwardFrom;
    };
};

export type OpenSiteReportTabMessage = {
    type: MessageType.OpenSiteReportTab;
    data: {
        url: string;
        from: ForwardFrom;
    };
};

export type OpenThankYouPageMessage = {
    type: MessageType.OpenThankYouPage;
};

export type GetOptionsDataMessage = {
    type: MessageType.GetOptionsData;
};

export type ChangeUserSettingMessage<T extends SettingOption = SettingOption> = {
    type: MessageType.ChangeUserSettings;
    data: {
        key: T;
        value: Settings[T];
    };
};

export type ResetSettingsMessage = {
    type: MessageType.ResetSettings;
};

export type AddAndEnableFilterMessage = {
    type: MessageType.AddAndEnableFilter;
    data: {
        filterId: number;
    };
};

export type DisableFilterMessage = {
    type: MessageType.DisableFilter;
    data: {
        filterId: number;
    };
};

export type RemoveAntiBannerFilterMessage = {
    type: MessageType.RemoveAntiBannerFilter;
    data: {
        filterId: number;
    };
};

export type SaveAllowlistDomainsMessage = {
    type: MessageType.SaveAllowlistDomains;
    data: {
        value: string;
    };
};

export type SaveUserRulesMessage = {
    type: MessageType.SaveUserRules;
    data: {
        value: string;
    };
};

export type GetUserRulesMessage = {
    type: MessageType.GetUserRules;
};

export type GetUserRulesEditorDataMessage = {
    type: MessageType.GetUserRulesEditorData;
};

export type AddUserRuleMessage = {
    type: MessageType.AddUserRule;
    data: {
        ruleText: string;
    };
};

export type RemoveUserRuleMessage = {
    type: MessageType.RemoveUserRule;
    data: {
        ruleText: string;
    };
};

export type ResetUserRulesForPageMessage = {
    type: MessageType.ResetUserRulesForPage;
    data: {
        url: string;
        tabId: number;
    };
};

export type GetEditorStorageContentMessage = {
    type: MessageType.GetEditorStorageContent;
};

export type SetEditorStorageContentMessage = {
    type: MessageType.SetEditorStorageContent;
    data: {
        content: string;
    };
};

export type AddAllowlistDomainForTabIdMessage = {
    type: MessageType.AddAllowlistDomainForTabId;
    data: {
        tabId: number;
    };
};

export type AddAllowlistDomainForUrlMessage = {
    type: MessageType.AddAllowlistDomainForUrl;
    data: {
        url: string;
    };
};

export type RemoveAllowlistDomainMessage = {
    type: MessageType.RemoveAllowlistDomain;
    data: {
        tabId: number;
        tabRefresh: boolean;
    };
};

export type LoadCustomFilterInfoMessage = {
    type: MessageType.LoadCustomFilterInfo;
    data: {
        url: string;
        title?: string;
    };
};

export type CustomFilterSubscriptionData = {
    customUrl: string;
    name: string;
    trusted: boolean;
};

export type SubscribeToCustomFilterMessage = {
    type: MessageType.SubscribeToCustomFilter;
    data: {
        filter: CustomFilterSubscriptionData;
    };
};

export type AppInitializedMessage = {
    type: MessageType.AppInitialized;
};

export type UpdateTotalBlockedMessage = {
    type: MessageType.UpdateTotalBlocked;
    data: {
        tabId: number;
        totalBlocked: number;
        totalBlockedTab: number;
    };
};

export type CheckRequestFilterReadyMessage = {
    type: MessageType.CheckRequestFilterReady;
};

export type GetFilteringLogDataMessage = {
    type: MessageType.GetFilteringLogData;
};

export type SynchronizeOpenTabsMessage = {
    type: MessageType.SynchronizeOpenTabs;
};

export type OpenFilteringLogPageMessage = {
    type: MessageType.OnOpenFilteringLogPage;
};

export type CloseFilteringLogPageMessage = {
    type: MessageType.OnCloseFilteringLogPage;
};

export type ClearEventsByTabIdMessage = {
    type: MessageType.ClearEventsByTabId;
    data: {
        tabId: number;
        ignorePreserveLog?: boolean;
    };
};

export type SetPreserveLogStateMessage = {
    type: MessageType.SetPreserveLogState;
    data: {
        state: boolean;
    };
};

export type SetFilteringLogWindowStateMessage = {
    type: MessageType.SetFilteringLogWindowState;
    data: {
        windowState: Windows.CreateCreateDataType;
    };
};

export type RefreshPageMessage = {
    type: MessageType.RefreshPage;
    data: {
        tabId: number;
    };
};

export type GetFilteringInfoByTabIdMessage = {
    type: MessageType.GetFilteringInfoByTabId;
    data: {
        tabId: number;
    };
};

export type EnableFiltersGroupMessage = {
    type: MessageType.EnableFiltersGroup;
    data: {
        groupId: number;
    };
};

export type DisableFiltersGroupMessage = {
    type: MessageType.DisableFiltersGroup;
    data: {
        groupId: number;
    };
};

export type InitializeFrameScriptMessage = {
    type: MessageType.InitializeFrameScript;
};

export type InitializeBlockingPageScript = {
    type: MessageType.InitializeBlockingPageScript;
};

export type SetConsentedFiltersMessage = {
    type: MessageType.SetConsentedFilters;
    data: {
        filterIds: number[];
    };
};

export type GetIsConsentedFilterMessage = {
    type: MessageType.GetIsConsentedFilter;
    data: {
        filterId: number;
    };
};

export type OpenSafebrowsingTrustedMessage = {
    type: MessageType.OpenSafebrowsingTrusted;
    data: {
        url: string;
    };
};

export type AddUrlToTrustedMessage = {
    type: MessageType.AddUrlToTrusted;
    data: {
        url: string;
    };
};

export type SetNotificationViewedMessage = {
    type: MessageType.SetNotificationViewed;
    data: {
        withDelay: boolean;
    };
};

export type ScriptletCloseWindowMessage = {
    type: MessageType.ScriptletCloseWindow;
};

export type ShowAlertPopupMessage = {
    type: MessageType.ShowAlertPopup;
    data: {
        isAdguardTab: boolean;
        title: string;
        text: string | string[];
        alertStyles: string;
        alertContainerStyles: string;
    };
};

export type ShowRuleLimitsAlertMessage = {
    type: MessageType.ShowRuleLimitsAlert;
    data: {
        isAdguardTab: boolean;
        mainText: string;
        linkText: string;
        alertStyles: string;
        alertContainerStyles: string;
    };
};

export type ShowVersionUpdatedPopupMessage = {
    type: MessageType.ShowVersionUpdatedPopup;
    data: {
        isAdguardTab: boolean;
        title: string;
        description: string;
        changelogHref: string;
        changelogText: string;
        showPromoNotification: boolean;
        offer: string;
        offerDesc: string;
        offerButtonText: string;
        offerButtonHref: string;
        offerBgImage: string;
        disableNotificationText: string;
        alertStyles: string;
        iframeStyles: string;
    };
};

export type CanEnableStaticFilterMv3Message = {
    type: MessageType.CanEnableStaticFilterMv3;
    data: {
        filterId: number;
    };
};

export type CanEnableStaticGroupMv3Message = {
    type: MessageType.CanEnableStaticGroupMv3;
    data: {
        groupId: number;
    };
};

export type CurrentLimitsMv3Message = {
    type: MessageType.CurrentLimitsMv3;
};

export type RestoreFiltersMv3Message = {
    type: MessageType.RestoreFiltersMv3;
};

export type ClearRulesLimitsWarningMv3Message = {
    type: MessageType.ClearRulesLimitsWarningMv3;
};

export type GetRulesLimitsCountersMv3Message = {
    type: MessageType.GetRulesLimitsCountersMv3;
};

export type GetExtensionStatusForPopupMV3Message = {
    type: MessageType.GetExtensionStatusForPopupMV3;
};

// Unified message map that includes both message structure and response types
export type MessageMap = {
    [MessageType.CreateEventListener]: {
        message: CreateEventListenerMessage;
        response: CreateEventListenerResponse;
    };
    [MessageType.AddLongLivedConnection]: {
        message: AddLongLivedConnectionMessage;
        response: void;
    };
    [MessageType.ApplySettingsJson]: {
        message: ApplySettingsJsonMessage;
        response: boolean;
    };
    [MessageType.LoadSettingsJson]: {
        message: LoadSettingsJsonMessage;
        response: ExportMessageResponse;
    };
    [MessageType.AddFilteringSubscription]: {
        message: AddFilteringSubscriptionMessage;
        response: void;
    };
    [MessageType.GetIsAppInitialized]: {
        message: GetIsAppInitializedMessage;
        response: boolean;
    };
    [MessageType.GetTabInfoForPopup]: {
        message: GetTabInfoForPopupMessage;
        response: GetTabInfoForPopupResponse | undefined;
    };
    [MessageType.ChangeApplicationFilteringPaused]: {
        message: ChangeApplicationFilteringPausedMessage;
        response: void;
    };
    [MessageType.OpenRulesLimitsTab]: {
        message: OpenRulesLimitsTabMessage;
        response: void;
    };
    [MessageType.OpenSettingsTab]: {
        message: OpenSettingsTabMessage;
        response: void;
    };
    [MessageType.OpenAssistant]: {
        message: OpenAssistantMessage;
        response: void;
    };
    [MessageType.UpdateFullscreenUserRulesTheme]: {
        message: UpdateFullscreenUserRulesThemeMessage;
        response: void;
    };
    [MessageType.SynchronizeOpenTabs]: {
        message: SynchronizeOpenTabsMessage;
        response: FilteringLogTabInfo[];
    };
    [MessageType.CheckFiltersUpdate]: {
        message: CheckFiltersUpdateMessage;
        response: FilterMetadata[] | undefined;
    };
    [MessageType.CheckExtensionUpdateMv3]: {
        message: CheckExtensionUpdateMessageMv3;
        response: void;
    };
    [MessageType.UpdateExtensionMv3]: {
        message: UpdateExtensionMessageMv3;
        response: void;
    };
    [MessageType.GetAllowlistDomains]: {
        message: GetAllowlistDomainsMessage;
        response: GetAllowlistDomainsResponse;
    };
    [MessageType.OpenExtensionStore]: {
        message: OpenExtensionStoreMessage;
        response: void;
    };
    [MessageType.OpenComparePage]: {
        message: OpenComparePageMessage;
        response: void;
    };
    [MessageType.OpenChromeExtensionsSettingsPage]: {
        message: OpenChromeExtensionsSettingsPageMessage;
        response: void;
    };
    [MessageType.OpenExtensionDetailsPage]: {
        message: OpenExtensionDetailsPageMessage;
        response: void;
    };
    [MessageType.OpenFullscreenUserRules]: {
        message: OpenFullscreenUserRulesMessage;
        response: void;
    };
    [MessageType.ResetBlockedAdsCount]: {
        message: ResetBlockedAdsCountMessage;
        response: void;
    };
    [MessageType.OpenFilteringLog]: {
        message: OpenFilteringLogMessage;
        response: void;
    };
    [MessageType.OpenAbuseTab]: {
        message: OpenAbuseTabMessage;
        response: void;
    };
    [MessageType.OpenSiteReportTab]: {
        message: OpenSiteReportTabMessage;
        response: void;
    };
    [MessageType.OpenThankYouPage]: {
        message: OpenThankYouPageMessage;
        response: void;
    };
    [MessageType.GetOptionsData]: {
        message: GetOptionsDataMessage;
        response: GetOptionsDataResponse;
    };
    [MessageType.ChangeUserSettings]: {
        message: ChangeUserSettingMessage;
        response: void;
    };
    [MessageType.ResetSettings]: {
        message: ResetSettingsMessage;
        response: boolean;
    };
    [MessageType.AddAndEnableFilter]: {
        message: AddAndEnableFilterMessage;
        response: number | undefined;
    };
    [MessageType.DisableFilter]: {
        message: DisableFilterMessage;
        response: void;
    };
    [MessageType.RemoveAntiBannerFilter]: {
        message: RemoveAntiBannerFilterMessage;
        response: void;
    };
    [MessageType.SaveAllowlistDomains]: {
        message: SaveAllowlistDomainsMessage;
        response: void;
    };
    [MessageType.SaveUserRules]: {
        message: SaveUserRulesMessage;
        response: void;
    };
    [MessageType.GetUserRules]: {
        message: GetUserRulesMessage;
        response: GetUserRulesResponse;
    };
    [MessageType.GetUserRulesEditorData]: {
        message: GetUserRulesEditorDataMessage;
        response: GetUserRulesEditorDataResponse;
    };
    [MessageType.AddUserRule]: {
        message: AddUserRuleMessage;
        response: void;
    };
    [MessageType.RemoveUserRule]: {
        message: RemoveUserRuleMessage;
        response: void;
    };
    [MessageType.ResetUserRulesForPage]: {
        message: ResetUserRulesForPageMessage;
        response: void;
    };
    [MessageType.GetEditorStorageContent]: {
        message: GetEditorStorageContentMessage;
        response: string | undefined;
    };
    [MessageType.SetEditorStorageContent]: {
        message: SetEditorStorageContentMessage;
        response: void;
    };
    [MessageType.RemoveAllowlistDomain]: {
        message: RemoveAllowlistDomainMessage;
        response: void;
    };
    [MessageType.AddAllowlistDomainForTabId]: {
        message: AddAllowlistDomainForTabIdMessage;
        response: void;
    };
    [MessageType.AddAllowlistDomainForUrl]: {
        message: AddAllowlistDomainForUrlMessage;
        response: void;
    };
    [MessageType.LoadCustomFilterInfo]: {
        message: LoadCustomFilterInfoMessage;
        response: GetCustomFilterInfoResult;
    };
    [MessageType.SubscribeToCustomFilter]: {
        message: SubscribeToCustomFilterMessage;
        response: CategoriesFilterData;
    };
    // This message is sent from background and handled on UI side.
    [MessageType.AppInitialized]: {
        message: AppInitializedMessage;
        response: never;
    };
    // This message is sent from background and handled on UI side.
    [MessageType.UpdateTotalBlocked]: {
        message: UpdateTotalBlockedMessage;
        response: never;
    };
    [MessageType.GetFilteringLogData]: {
        message: GetFilteringLogDataMessage;
        response: GetFilteringLogDataResponse;
    };
    [MessageType.CheckRequestFilterReady]: {
        message: CheckRequestFilterReadyMessage;
        response: boolean;
    };
    [MessageType.OnOpenFilteringLogPage]: {
        message: OpenFilteringLogPageMessage;
        response: void;
    };
    [MessageType.OnCloseFilteringLogPage]: {
        message: CloseFilteringLogPageMessage;
        response: void;
    };
    [MessageType.ClearEventsByTabId]: {
        message: ClearEventsByTabIdMessage;
        response: void;
    };
    [MessageType.SetPreserveLogState]: {
        message: SetPreserveLogStateMessage;
        response: void;
    };
    [MessageType.RefreshPage]: {
        message: RefreshPageMessage;
        response: void;
    };
    [MessageType.GetFilteringInfoByTabId]: {
        message: GetFilteringInfoByTabIdMessage;
        response: FilteringLogTabInfo | undefined;
    };
    [MessageType.SetFilteringLogWindowState]: {
        message: SetFilteringLogWindowStateMessage;
        response: void;
    };
    [MessageType.EnableFiltersGroup]: {
        message: EnableFiltersGroupMessage;
        response: number[] | undefined;
    };
    [MessageType.DisableFiltersGroup]: {
        message: DisableFiltersGroupMessage;
        response: void;
    };
    [MessageType.OpenSafebrowsingTrusted]: {
        message: OpenSafebrowsingTrustedMessage;
        response: void;
    };
    [MessageType.SetNotificationViewed]: {
        message: SetNotificationViewedMessage;
        response: Promise<void>;
    };
    [MessageType.RemoveListener]: {
        message: RemoveListenerMessage;
        response: void;
    };
    [MessageType.ScriptletCloseWindow]: {
        message: ScriptletCloseWindowMessage;
        response: void;
    };
    [MessageType.ShowRuleLimitsAlert]: {
        message: ShowRuleLimitsAlertMessage;
        response: boolean;
    };
    // This message is sent from background and handled on UI side.
    [MessageType.NotifyListeners]: {
        message: NotifyListenersMessage;
        response: never;
    };
    // This message is sent from background and handled on UI side.
    [MessageType.UpdateListeners]: {
        message: UpdateListenersMessage;
        response: never;
    };
    [MessageType.ShowAlertPopup]: {
        message: ShowAlertPopupMessage;
        response: void;
    };
    [MessageType.ShowVersionUpdatedPopup]: {
        message: ShowVersionUpdatedPopupMessage;
        response: boolean;
    };
    [MessageType.GetIsConsentedFilter]: {
        message: GetIsConsentedFilterMessage;
        response: boolean;
    };
    [MessageType.SetConsentedFilters]: {
        message: SetConsentedFiltersMessage;
        response: void;
    };
    [MessageType.AddUrlToTrusted]: {
        message: AddUrlToTrustedMessage;
        response: void;
    };
    [MessageType.CurrentLimitsMv3]: {
        message: CurrentLimitsMv3Message;
        response: Mv3LimitsCheckResult;
    };
    [MessageType.GetRulesLimitsCountersMv3]: {
        message: GetRulesLimitsCountersMv3Message;
        response: IRulesLimits | undefined;
    };
    [MessageType.CanEnableStaticFilterMv3]: {
        message: CanEnableStaticFilterMv3Message;
        response: StaticLimitsCheckResult;
    };
    [MessageType.CanEnableStaticGroupMv3]: {
        message: CanEnableStaticGroupMv3Message;
        response: StaticLimitsCheckResult;
    };
    [MessageType.RestoreFiltersMv3]: {
        message: RestoreFiltersMv3Message;
        response: void;
    };
    [MessageType.ClearRulesLimitsWarningMv3]: {
        message: ClearRulesLimitsWarningMv3Message;
        response: void;
    };
    [MessageType.GetExtensionStatusForPopupMV3]: {
        message: GetExtensionStatusForPopupMV3Message;
        response: GetExtensionStatusForPopupResponse;
    };
    [MessageType.InitializeFrameScript]: {
        message: InitializeFrameScriptMessage;
        response: PageInitAppData;
    };
    [MessageType.InitializeBlockingPageScript]: {
        message: InitializeBlockingPageScript;
        response: BlockingPageInitAppData;
    };
};

/**
 * Helper type to check if a given type is a valid message type.
 */
export type ValidMessageTypes = keyof MessageMap;

/**
 * All messages that can be sent.
 */
export type Message = MessageMap[ValidMessageTypes]['message'] & MessageCommonProps;

/**
 * Helper type to extract the message type for a given message.
 */
export type ExtractedMessage<T> = Extract<Message, { type: T }>;

/**
 * Helper type to extract the response type for a given message type
 */
export type ExtractMessageResponse<T extends ValidMessageTypes> = MessageMap[T]['response'];

/**
 * Helper type to extract the message type for a given message without handlerName.
 */
export type MessageWithoutHandlerName<T> = { type: T } & Omit<ExtractedMessage<T>, 'handlerName'>;
