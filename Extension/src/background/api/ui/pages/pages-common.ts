/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
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
import browser, { type Runtime, type Windows } from 'webextension-polyfill';
import { format } from 'date-fns';
import { UTCDate } from '@date-fns/utc';
import { z } from 'zod';

import { getErrorMessage } from '@adguard/logger';

import { UserAgent } from '../../../../common/user-agent';
import {
    type AddFilteringSubscriptionMessage,
    type ScriptletCloseWindowMessage,
    type UpdateFullscreenUserRulesThemeMessage,
} from '../../../../common/messages';
import {
    Forward,
    ForwardAction,
    ForwardFrom,
    type ForwardParams,
} from '../../../../common/forward';
import { UrlUtils } from '../../../utils/url';
import { groupStateStorage, settingsStorage } from '../../../storages';
import { SettingOption } from '../../../schema';
import { BrowserUtils } from '../../../utils/browser-utils';
import {
    AntiBannerFiltersId,
    AntibannerGroupsId,
    CHROME_EXTENSIONS_SETTINGS_URL,
    FILTERING_LOG_WINDOW_STATE_KEY,
} from '../../../../common/constants';
import { WindowsApi, TabsApi } from '../../../../common/api/extension';
import { Prefs } from '../../../prefs';
import { CustomFilterApi, FiltersApi } from '../../filters';
import {
    FILTERING_LOG_OUTPUT,
    POST_INSTALL_OUTPUT,
    FULLSCREEN_USER_RULES_OUTPUT,
    OPTIONS_OUTPUT,
} from '../../../../../../constants';
import { logger } from '../../../../common/logger';
import { OptionsPageSections } from '../../../../common/nav';
import { FilterUpdateService } from '../../../services/filter-update';
import { CustomFilterUtils } from '../../../../common/custom-filter-utils';
import { browserStorage } from '../../../storages/shared-instances';
import { browserAction } from '../browser-action';

/**
 * Descriptor of a single stealth cookie option used in issue report URL params.
 */
export type CookieStealthOption = {
    queryKey: string;
    settingKey: SettingOption;
    settingValueKey?: SettingOption;
};

/**
 * Browser name values matching the v4 reports schema enum.
 *
 * @see {@link https://github.com/AdguardTeam/ReportsWebApp#pre-filling-the-app-with-query-parameters}
 */
enum BrowserName {
    Chrome = 'chrome',
    Edge = 'edge',
    Firefox = 'firefox',
    FirefoxMobile = 'firefox mobile',
    Opera = 'opera',
    Yandex = 'yandex',
    Other = 'other',
}

// TODO: We can manipulates tabs directly from content-script and other extension pages context.
// So this API can be shared and used for data flow simplifying (direct calls instead of message passing)
/**
 * Pages API provides methods for managing browser pages.
 */
export abstract class PagesApiCommon {
    /**
     * Product type.
     *
     * It has to be an exact string due to the reports docs.
     *
     * @see {@link https://github.com/AdguardTeam/ReportsWebApp#pre-filling-the-app-with-query-parameters}
     */
    private static readonly PRODUCT_TYPE = 'ext';

    /**
     * Settings page url.
     */
    private static readonly settingsUrl = PagesApiCommon.getExtensionPageUrl(OPTIONS_OUTPUT);

    /**
     * Filtering log page url.
     */
    private static readonly filteringLogUrl = PagesApiCommon.getExtensionPageUrl(FILTERING_LOG_OUTPUT);

    /**
     * Fullscreen user rule editor page url.
     */
    private static readonly fullscreenUserRulesPageUrl = PagesApiCommon.getExtensionPageUrl(
        FULLSCREEN_USER_RULES_OUTPUT,
    );

    /**
     * Default state of popup window.
     */
    private static readonly defaultPopupWindowState: Windows.CreateCreateDataType = {
        width: 1280,
        height: 720,
        top: 0,
        left: 0,
    };

    /**
     * Zod schema for validating window state from storage.
     *
     * Validates either a normal window state with position and size,
     * or a fullscreen window state.
     */
    private static readonly windowStateSchema = z.union([
        z.object({
            width: z.number(),
            height: z.number(),
            top: z.number(),
            left: z.number(),
        }).strict(),
        z.object({
            state: z.literal('fullscreen'),
        }).strict(),
    ]);

    /**
     * Filters download page url.
     */
    private static readonly postInstallPageUrl = PagesApiCommon.getExtensionPageUrl(POST_INSTALL_OUTPUT);

    /**
     * Thank you page url.
     */
    protected abstract thankYouPageUrl: string;

    /**
     * Chrome extension store forward action.
     *
     * Defined as a getter (not a field) so that it lives on the prototype
     * and is available during base class field initialization.
     */
    protected abstract get chromeExtensionStoreForwardAction():
        ForwardAction.ChromeStore | ForwardAction.ChromeMv2Store | ForwardAction.ChromeMv3BetaStore;

    /**
     * Compare page url.
     */
    private static readonly comparePageUrl = Forward.get({
        action: ForwardAction.Compare,
        from: ForwardFrom.Options,
    });

    /**
     * Extension browser store url.
     */
    private readonly extensionStoreUrl = this.getExtensionStoreUrl();

    /**
     * Opens the settings tab and focuses on it if there is no open setting tab.
     * Otherwise only focuses on the open setting tab.
     */
    public static async openSettingsPage(): Promise<void> {
        let tab = await TabsApi.findOne({ url: `${PagesApiCommon.settingsUrl}*` });

        if (!tab) {
            tab = await browser.tabs.create({ url: PagesApiCommon.settingsUrl });
        }

        await TabsApi.focus(tab);
    }

    /**
     * Opens fullscreen user rules page window.
     * If the page has been already opened, focus on window instead creating new one.
     */
    public static async openFullscreenUserRulesPage(): Promise<void> {
        const tab = await TabsApi.findOne({ url: `${PagesApiCommon.fullscreenUserRulesPageUrl}*` });

        if (tab) {
            await TabsApi.focus(tab);
            return;
        }

        const theme = settingsStorage.get(SettingOption.AppearanceTheme);
        const url = `${PagesApiCommon.fullscreenUserRulesPageUrl}?theme=${theme}`;

        // Open a new tab without type to get it as a new tab in a new window
        // with the ability to move and attach it to the current browser window.
        await WindowsApi.create({
            url,
            focused: true,
            ...PagesApiCommon.defaultPopupWindowState,
        });
    }

    /**
     * Updated the theme for the fullscreen user rules page
     * by updating the query parameter with the new theme value.
     *
     * @param message Message of type {@link UpdateFullscreenUserRulesThemeMessage}.
     * @param message.data Contains new theme value.
     */
    public static async updateFullscreenUserRulesPageTheme(
        { data }: UpdateFullscreenUserRulesThemeMessage,
    ): Promise<void> {
        const tab = await TabsApi.findOne({ url: `${PagesApiCommon.fullscreenUserRulesPageUrl}*` });

        if (!tab) {
            return;
        }

        const { theme } = data;
        const url = `${PagesApiCommon.fullscreenUserRulesPageUrl}?theme=${theme}`;

        await browser.tabs.update(tab.id, { url });
    }

    /**
     * Retrieves the window state for the filtering log page.
     *
     * If a saved window state exists, it is validated and returned.
     * Otherwise, the default popup window state is returned.
     *
     * @returns The window state for the filtering log page.
     */
    private static async getFilteringLogWindowState(): Promise<Windows.CreateCreateDataType> {
        const rawWindowState = await browserStorage.get(FILTERING_LOG_WINDOW_STATE_KEY);
        let windowState: Windows.CreateCreateDataType | undefined;

        if (!rawWindowState) {
            return PagesApiCommon.defaultPopupWindowState;
        }

        let parsedState: unknown = rawWindowState;

        if (typeof rawWindowState === 'string') {
            try {
                parsedState = JSON.parse(rawWindowState);
            } catch (e) {
                logger.debug('[ext.PagesApiCommon.getFilteringLogWindowState]: Failed to parse window state JSON', e);
                parsedState = undefined;
            }
        }

        if (parsedState !== undefined) {
            const validationResult = PagesApiCommon.windowStateSchema.safeParse(parsedState);
            if (validationResult.success) {
                windowState = validationResult.data;
            } else {
                logger.debug('[ext.PagesApiCommon.getFilteringLogWindowState]: Invalid window state format, using default', validationResult.error);
            }
        }

        return windowState || PagesApiCommon.defaultPopupWindowState;
    }

    /**
     * Opens filtering log page window.
     * If the page has been already opened, focus on window instead creating new one.
     */
    public static async openFilteringLogPage(): Promise<void> {
        const activeTab = await TabsApi.getActive();
        if (!activeTab) {
            return;
        }

        const url = PagesApiCommon.filteringLogUrl + (activeTab.id ? `#${activeTab.id}` : '');

        const tab = await TabsApi.findOne({ url: `${PagesApiCommon.filteringLogUrl}*` });

        if (tab) {
            await browser.tabs.update(tab.id, { url });
            await TabsApi.focus(tab);
            return;
        }

        // Firefox does not allow to maximize popup windows on Windows operating system.
        // For more details, see the Bugzilla report:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1756507
        // As a temporary solution, we open the window in a normal state for Firefox on Windows
        // to fix issue reported to us:
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2464
        const windowType = UserAgent.isFirefox && UserAgent.isWindows ? 'normal' : 'popup';

        try {
            const options = await PagesApiCommon.getFilteringLogWindowState();

            await WindowsApi.create({
                url,
                type: windowType,
                ...options,
            });
        } catch (e) {
            const message = getErrorMessage(e);

            if (message.includes('Invalid value for bounds.')) {
                // Reopen tab with default pos if it was closed too far beyond the screen
                // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2100
                await WindowsApi.create({
                    url,
                    type: windowType,
                    ...PagesApiCommon.defaultPopupWindowState,
                });
            }
        }
    }

    /**
     * Creates an url with settings in query parameters needed for issue reporting.
     * Query parameters are described here: https://github.com/AdguardTeam/ReportsWebApp.
     *
     * @param siteUrl Target site url.
     * @param from UI which user is forwarded from.
     *
     * @returns Issue report url.
     */
    public async getIssueReportUrl(siteUrl: string, from: ForwardFrom): Promise<string> {
        let browserName = UserAgent.browserName;
        let browserDetails: string | undefined;

        if (!UserAgent.isSupportedBrowser) {
            browserDetails = browserName;
            browserName = 'Other';
        }

        const normalisedBrowserName = PagesApiCommon.normaliseBrowserName(browserName ?? '');
        if (normalisedBrowserName === BrowserName.Other && browserName) {
            browserDetails = browserName;
        }

        const commonFilterIds = FiltersApi.getEnabledFilters()
            .filter((filterId) => !CustomFilterUtils.isCustomFilter(filterId));

        const manifestDetails = browser.runtime.getManifest();

        // Add beta suffix to version so that filter developers can identify
        // which version the issue is reported against.
        const productVersion = IS_BETA ? `${manifestDetails.version}-beta` : manifestDetails.version;

        const params: ForwardParams = {
            action: ForwardAction.IssueReport,
            from,
            scheme_version: '4',
            product_type: PagesApiCommon.PRODUCT_TYPE,
            'ext.manifest_version': encodeURIComponent(manifestDetails.manifest_version),
            product_version: encodeURIComponent(productVersion),
            url: encodeURIComponent(siteUrl),
        };

        const systemInfo = await UserAgent.getSystemInfo();
        if (systemInfo) {
            params.system_version = encodeURIComponent(systemInfo);
        }

        if (normalisedBrowserName) {
            params.browser = encodeURIComponent(normalisedBrowserName);
        }

        if (browserDetails) {
            params.browser_detail = encodeURIComponent(browserDetails);
        }

        if (commonFilterIds.length > 0) {
            params.regular_filters = encodeURIComponent(commonFilterIds.join(','));
        }

        const isCustomFiltersEnabled = groupStateStorage.get(AntibannerGroupsId.CustomFiltersGroupId)?.enabled;
        if (isCustomFiltersEnabled && this.shouldCustomFiltersUrls()) {
            const customFilterEntries = CustomFilterApi.getFiltersData()
                .filter(({ enabled }) => enabled)
                .map(({ title, customUrl }) => `${title} (url: ${UrlUtils.trimFilterFilepath(customUrl)})`);

            if (customFilterEntries.length > 0) {
                params.custom_filters = encodeURIComponent(customFilterEntries.join(','));
            }
        }

        const filtersLastUpdate = await FilterUpdateService.getLastUpdateTimeMs();
        if (filtersLastUpdate) {
            params.filters_last_update = encodeURIComponent(
                PagesApiCommon.convertTimestampToTimeString(filtersLastUpdate),
            );
        }

        Object.assign(
            params,
            this.getStealthParams(commonFilterIds),
            this.getBrowserSecurityParams(),
        );

        const reportUrl = Forward.get(params);

        return reportUrl;
    }

    /**
     * Determines whether custom filter URLs should be included in issue reports.
     *
     * @returns True if custom filter URLs should be sent, false otherwise.
     */
    protected abstract shouldCustomFiltersUrls(): boolean;

    /**
     * Opens abuse page tab.
     *
     * @param siteUrl Target site url.
     * @param from UI which user is forwarded from.
     */
    public async openAbusePage(siteUrl: string, from: ForwardFrom): Promise<void> {
        const reportUrl = await this.getIssueReportUrl(siteUrl, from);

        await browser.tabs.create({ url: reportUrl });
    }

    /**
     * Opens site report page.
     *
     * @param siteUrl Target site url.
     * @param from UI which user is forwarded from.
     */
    public static async openSiteReportPage(siteUrl: string, from: ForwardFrom): Promise<void> {
        const domain = UrlUtils.getDomainName(siteUrl);

        if (!domain) {
            return;
        }

        const punycodeDomain = UrlUtils.toPunyCode(domain);

        await browser.tabs.create({
            url: Forward.get({
                from,
                action: ForwardAction.SiteReport,
                domain: encodeURIComponent(punycodeDomain),
            }),
        });
    }

    /**
     * Create full extension page url, based on precomputed values from webextension API.
     *
     * @param filename Page html filename.
     * @param urlQuery Url query string or/and hash.
     *
     * @returns Full extension page url.
     */
    public static getExtensionPageUrl(filename: string, urlQuery?: string): string {
        let url = `${Prefs.baseUrl}${filename}.html`;

        if (typeof urlQuery === 'string') {
            url += urlQuery;
        }

        return url;
    }

    /**
     * Opens filters download page.
     */
    public static async openPostInstallPage(): Promise<void> {
        await browser.tabs.create({ url: PagesApiCommon.postInstallPageUrl });
    }

    /**
     * Opens compare page.
     */
    public static async openComparePage(): Promise<void> {
        await browser.tabs.create({ url: PagesApiCommon.comparePageUrl });
    }

    /**
     * Opens thank you page.
     */
    public openThankYouPage = async (): Promise<void> => {
        const params = BrowserUtils.getExtensionParams();
        params.push(`_locale=${encodeURIComponent(browser.i18n.getUILanguage())}`);
        // Param for hiding telemetry consent checkbox for old extension versions
        params.push('show_telemetry_consent=true');

        const pageUrl = this.thankYouPageUrl;
        const thankYouUrl = `${pageUrl}?${params.join('&')}`;

        const postInstallPage = await TabsApi.findOne({ url: PagesApiCommon.postInstallPageUrl });

        if (postInstallPage) {
            await browser.tabs.update(postInstallPage.id, { url: thankYouUrl });
        } else {
            await browser.tabs.create({ url: thankYouUrl });
        }
    };

    /**
     * Opens extension store page.
     */
    public openExtensionStorePage = async (): Promise<void> => {
        await browser.tabs.create({ url: this.extensionStoreUrl });
    };

    /**
     * Opens Chrome's extensions settings page.
     */
    public static async openChromeExtensionsSettingsPage(): Promise<void> {
        // if a tab with the same url is already opened, create new tab even
        // because `chrome://extensions` cannot be queried with browser.tabs.query (via TabsApi.findOne)
        await browser.tabs.create({ url: CHROME_EXTENSIONS_SETTINGS_URL });
    }

    /**
     * Opens the extension details page.
     */
    public static async openExtensionDetailsPage(): Promise<void> {
        // if a tab with the same url is already opened, create new tab even
        // because `chrome://extensions` cannot be queried with browser.tabs.query (via TabsApi.findOne)
        // IMPORTANT: extension details url helper is used in options page as well,
        // so it should not be a PagesApi method, otherwise options page bundle size increase
        await browser.tabs.create({ url: BrowserUtils.getExtensionDetailsUrl() });
    }

    /**
     * Opens specified path on settings page.
     *
     * @param url URL path to open on settings page.
     *
     * @returns Opened or updated Tab object.
     */
    private static async openTabOnSettingsPage(url: string): Promise<browser.Tabs.Tab> {
        const tab = await TabsApi.findOne({ url: `${PagesApiCommon.settingsUrl}*` });

        if (!tab) {
            const newTab = await browser.tabs.create({ url });
            return newTab;
        }

        const updatedTab = await browser.tabs.update(tab.id, { url });
        return updatedTab;
    }

    /**
     * Determines whether the settings page should be opened with custom filter modal.
     *
     * This method is implemented differently in MV2 and MV3 versions
     * based on their specific capabilities and restrictions.
     *
     * @returns True if settings page should open with custom filter modal, false otherwise.
     */
    protected abstract shouldOpenSettingsPageWithCustomFilterModal(): boolean;

    /**
     * Opens 'Add custom filter' modal window into settings page.
     * If the page has been already opened, reload it with new custom filter query params, passed from content script.
     *
     * @param message - Content script message with custom filter data.
     */
    public openSettingsPageWithCustomFilterModal = async (message: AddFilteringSubscriptionMessage): Promise<void> => {
        if (!this.shouldOpenSettingsPageWithCustomFilterModal()) {
            return;
        }

        const { url, title } = message.data;

        // TODO: Use shared constants for query parameters
        let optionalPart = '#filters?group=0';
        if (title) {
            optionalPart += `&title=${title}`;
        }
        optionalPart += `&subscribe=${encodeURIComponent(url)}`;

        const path = PagesApiCommon.getExtensionPageUrl(OPTIONS_OUTPUT, optionalPart);

        const tab = await PagesApiCommon.openTabOnSettingsPage(path);

        await TabsApi.focus(tab);

        // Reload option page for force modal window rerender
        // TODO: track url update in frontend and remove force reloading via webextension API
        await TabsApi.reload(tab.id);
    };

    /**
     * Opens settings page with specified query.
     * If the page has been already opened, focus on it.
     *
     * @param query Query string to open on settings page.
     */
    private static async openSettingsPageWithQuery(query: string): Promise<void> {
        const path = PagesApiCommon.getExtensionPageUrl(OPTIONS_OUTPUT, query);

        const tab = await PagesApiCommon.openTabOnSettingsPage(path);

        await TabsApi.focus(tab);
    }

    /**
     * Opens filters section on settings page.
     * If the page has been already opened, focus on it.
     */
    public static async openFiltersOnSettingsPage(): Promise<void> {
        const queryPart = `#${OptionsPageSections.filters}`;

        await PagesApiCommon.openSettingsPageWithQuery(queryPart);
    }

    /**
     * Opens rules limits section on settings page.
     * If the page has been already opened, focus on it.
     */
    public static async openRulesLimitsPage(): Promise<void> {
        const queryPart = `#${OptionsPageSections.ruleLimits}`;

        await PagesApiCommon.openSettingsPageWithQuery(queryPart);
    }

    /**
     * Opens the extension popup in the last focused _normal_ window
     * which is a regular browser window with a toolbar.
     */
    public static async openExtensionPopup(): Promise<void> {
        // opening popup in the window with no toolbar throws an error. AG-46535
        const { id: lastFocusedWindowId } = await chrome.windows.getLastFocused({
            windowTypes: ['normal'],
        });

        if (!lastFocusedWindowId) {
            logger.warn('[ext.PagesApiCommon.openExtensionPopup]: No normal window found to open popup');
            return;
        }

        /**
         * Verify that any browser window is actually *active*.
         * Because if user has switched to another app -> browser window is inactive,
         * we cannot focus it forcibly, and cannot open the popup in it.
         *
         * So here we just gracefully log the reason and exit to avoid errors.
         */
        const window = await chrome.windows.get(lastFocusedWindowId);
        if (!window.focused) {
            logger.warn('[ext.PagesApiCommon.openExtensionPopup]: Window is not focused. User may have switched to another window.');
            return;
        }

        // Ensure the window is focused before opening the popup
        await chrome.windows.update(lastFocusedWindowId, { focused: true });

        try {
            await browserAction.openPopup({
                windowId: lastFocusedWindowId,
            });
        } catch (e) {
            logger.error('[ext.PagesApiCommon.openExtensionPopup]: Failed to open popup', e);
        }
    }

    /**
     * Closes page with {@link Runtime.MessageSender} tab id.
     *
     * @param message - Content script message with custom filter data.
     * @param sender - Sender with type {@link Runtime.MessageSender}.
     */
    public static async closePage(
        message: ScriptletCloseWindowMessage,
        sender: Runtime.MessageSender,
    ): Promise<void> {
        const tabId = sender.tab?.id;

        if (tabId) {
            await browser.tabs.remove(tabId);
        }
    }

    /**
     * Returns extension store url based on UA data.
     *
     * @returns Extension store url.
     */
    private getExtensionStoreUrl(): string {
        let action: ForwardAction = this.chromeExtensionStoreForwardAction;

        if (UserAgent.isOpera) {
            action = ForwardAction.OperaStore;
        } else if (UserAgent.isFirefox) {
            action = ForwardAction.FirefoxStore;
        } else if (UserAgent.isEdge) {
            action = ForwardAction.EdgeStore;
        }

        return Forward.get({
            action,
            from: ForwardFrom.Options,
        });
    }

    /**
     * Returns browser security url params.
     *
     * @returns Browser security url params record.
     */
    protected abstract getBrowserSecurityParams(): { [key: string]: string };

    /**
     * Returns manifest-version-specific stealth cookie options to include
     * in the issue report URL params.
     * MV2 supports self-destructing cookies; MV3 does not.
     *
     * @returns Array of stealth cookie option descriptors.
     */
    protected abstract getCookieStealthOptions(): CookieStealthOption[];

    /**
     * Returns stealth url params.
     *
     * @param filterIds List of filter id.
     *
     * @returns Stealth url params record.
     */
    private getStealthParams(filterIds: number[]): { [key: string]: string } {
        const stealthEnabled = !settingsStorage.get(SettingOption.DisableStealthMode);

        if (!stealthEnabled) {
            return { 'stealth.enabled': '0' };
        }

        const stealthOptions = [
            {
                queryKey: 'stealth.hide_search_queries',
                settingKey: SettingOption.HideSearchQueries,
            },
            {
                queryKey: 'stealth.send_dnt',
                settingKey: SettingOption.SendDoNotTrack,
            },
            {
                queryKey: 'stealth.x_client',
                settingKey: SettingOption.RemoveXClientData,
            },
            {
                queryKey: 'stealth.block_webrtc',
                settingKey: SettingOption.BlockWebRTC,
            },
            ...this.getCookieStealthOptions(),
        ];

        const stealthOptionsEntries = [['stealth.enabled', '1']];

        stealthOptions.forEach((stealthOption) => {
            const { queryKey, settingKey, settingValueKey } = stealthOption;

            const setting = settingsStorage.get(settingKey);

            if (!setting) {
                return;
            }

            let option: string;

            if (!settingValueKey) {
                option = setting ? '1' : '0';
            } else {
                option = String(settingsStorage.get(settingValueKey));
            }

            stealthOptionsEntries.push([queryKey, option]);
        });

        if (settingsStorage.get(SettingOption.HideReferrer)) {
            stealthOptionsEntries.push(['stealth.referrer', '']);
        }

        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2721
        const isBlockTrackersEnabled = filterIds.includes(AntiBannerFiltersId.TrackingFilterId);
        if (isBlockTrackersEnabled) {
            stealthOptionsEntries.push(['stealth.block_trackers', '1']);
        }

        const isRemoveUrlParamsEnabled = filterIds.includes(AntiBannerFiltersId.UrlTrackingFilterId);
        if (isRemoveUrlParamsEnabled) {
            stealthOptionsEntries.push(['stealth.strip_url', '1']);
        }

        return Object.fromEntries(stealthOptionsEntries);
    }

    /**
     * Normalises a browser name to the v4 schema enum value.
     *
     * @param name Raw browser name from {@link UserAgent.browserName}.
     *
     * @returns Lowercase v4 enum value.
     */
    private static normaliseBrowserName(name: string): BrowserName {
        const lower = name.toLowerCase();
        const values: string[] = Object.values(BrowserName);
        return values.includes(lower) ? lower as BrowserName : BrowserName.Other;
    }

    /**
     * Converts timestamp in milliseconds to ISO 8601 UTC time string.
     *
     * Needed for `filters_last_update` query parameters.
     *
     * @see {@link https://github.com/AdguardTeam/ReportsWebApp#pre-filling-the-app-with-query-parameters}
     *
     * @param timestampMs Timestamp in milliseconds.
     *
     * @returns ISO 8601 UTC timestamp string (e.g. `2026-03-17T20:00:00Z`).
     */
    private static convertTimestampToTimeString(timestampMs: number): string {
        return format(new UTCDate(timestampMs), "yyyy-MM-dd'T'HH:mm:ss'Z'");
    }
}
