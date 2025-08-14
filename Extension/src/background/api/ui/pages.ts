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
import browser, { type Runtime, type Windows } from 'webextension-polyfill';
import { format } from 'date-fns';
import { UTCDate } from '@date-fns/utc';

import { getErrorMessage } from '@adguard/logger';

import { UserAgent } from '../../../common/user-agent';
import {
    type AddFilteringSubscriptionMessage,
    type ScriptletCloseWindowMessage,
    type UpdateFullscreenUserRulesThemeMessage,
} from '../../../common/messages';
import {
    Forward,
    ForwardAction,
    ForwardFrom,
    type ForwardParams,
} from '../../../common/forward';
import { UrlUtils } from '../../utils/url';
import {
    browserStorage,
    groupStateStorage,
    settingsStorage,
} from '../../storages';
import { SettingOption } from '../../schema';
import { BrowserUtils } from '../../utils/browser-utils';
import {
    AntiBannerFiltersId,
    AntibannerGroupsId,
    CHROME_EXTENSIONS_SETTINGS_URL,
    FILTERING_LOG_WINDOW_STATE,
} from '../../../common/constants';
import { WindowsApi, TabsApi } from '../../../common/api/extension';
import { Prefs } from '../../prefs';
import { CustomFilterApi, FiltersApi } from '../filters';
import {
    FILTERING_LOG_OUTPUT,
    POST_INSTALL_OUTPUT,
    FULLSCREEN_USER_RULES_OUTPUT,
    OPTIONS_OUTPUT,
} from '../../../../../constants';
import { logger } from '../../../common/logger';
import { OptionsPageSections } from '../../../common/nav';
import { FilterUpdateService } from '../../services/filter-update';
import { CustomFilterUtils } from '../../../common/custom-filter-utils';
import { isUserScriptsApiSupported } from '../../../common/user-scripts-api';

// TODO: We can manipulates tabs directly from content-script and other extension pages context.
// So this API can be shared and used for data flow simplifying (direct calls instead of message passing)
/**
 * Pages API provides methods for managing browser pages.
 */
export class PagesApi {
    /**
     * Product type.
     *
     * It has to be an exact string due to the reports docs.
     *
     * @see {@link https://github.com/AdguardTeam/ReportsWebApp#pre-filling-the-app-with-query-parameters}
     */
    private static readonly PRODUCT_TYPE = 'Ext';

    /**
     * Settings page url.
     */
    public static readonly settingsUrl = PagesApi.getExtensionPageUrl(OPTIONS_OUTPUT);

    /**
     * Filtering log page url.
     */
    public static readonly filteringLogUrl = PagesApi.getExtensionPageUrl(FILTERING_LOG_OUTPUT);

    /**
     * Fullscreen user rule editor page url.
     */
    public static readonly fullscreenUserRulesPageUrl = PagesApi.getExtensionPageUrl(FULLSCREEN_USER_RULES_OUTPUT);

    /**
     * Default state of popup window.
     */
    public static readonly defaultPopupWindowState: Windows.CreateCreateDataType = {
        width: 1280,
        height: 720,
        top: 0,
        left: 0,
    };

    /**
     * Filters download page url.
     */
    public static readonly postInstallPageUrl = PagesApi.getExtensionPageUrl(POST_INSTALL_OUTPUT);

    /**
     * Thank you page url.
     */
    public static readonly thankYouPageUrl = Forward.get({
        action: ForwardAction.ThankYou,
        from: ForwardFrom.Background,
    });

    /**
     * Thank you page url for mv3.
     */
    public static readonly thankYouPageUrlMv3 = Forward.get({
        action: ForwardAction.ThankYouMv3,
        from: ForwardFrom.Background,
    });

    /**
     * Compare page url.
     */
    public static readonly comparePageUrl = Forward.get({
        action: ForwardAction.Compare,
        from: ForwardFrom.Options,
    });

    /**
     *  Extension browser store url.
     */
    public static readonly extensionStoreUrl = PagesApi.getExtensionStoreUrl();

    /**
     * Opens the settings tab and focuses on it if there is no open setting tab.
     * Otherwise only focuses on the open setting tab.
     */
    public static async openSettingsPage(): Promise<void> {
        let tab = await TabsApi.findOne({ url: `${PagesApi.settingsUrl}*` });

        if (!tab) {
            tab = await browser.tabs.create({ url: PagesApi.settingsUrl });
        }

        await TabsApi.focus(tab);
    }

    /**
     * Opens fullscreen user rules page window.
     * If the page has been already opened, focus on window instead creating new one.
     */
    public static async openFullscreenUserRulesPage(): Promise<void> {
        const tab = await TabsApi.findOne({ url: `${PagesApi.fullscreenUserRulesPageUrl}*` });

        if (tab) {
            await TabsApi.focus(tab);
            return;
        }

        const theme = settingsStorage.get(SettingOption.AppearanceTheme);
        const url = `${PagesApi.fullscreenUserRulesPageUrl}?theme=${theme}`;

        // Open a new tab without type to get it as a new tab in a new window
        // with the ability to move and attach it to the current browser window.
        await WindowsApi.create({
            url,
            focused: true,
            ...PagesApi.defaultPopupWindowState,
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
        const tab = await TabsApi.findOne({ url: `${PagesApi.fullscreenUserRulesPageUrl}*` });

        if (!tab) {
            return;
        }

        const { theme } = data;
        const url = `${PagesApi.fullscreenUserRulesPageUrl}?theme=${theme}`;

        await browser.tabs.update(tab.id, { url });
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

        const url = PagesApi.filteringLogUrl + (activeTab.id ? `#${activeTab.id}` : '');

        const tab = await TabsApi.findOne({ url: `${PagesApi.filteringLogUrl}*` });

        if (tab) {
            await browser.tabs.update(tab.id, { url });
            await TabsApi.focus(tab);
            return;
        }

        const windowStateString = await browserStorage.get(FILTERING_LOG_WINDOW_STATE);

        // Firefox does not allow to maximize popup windows on Windows operating system.
        // For more details, see the Bugzilla report:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1756507
        // As a temporary solution, we open the window in a normal state for Firefox on Windows
        // to fix issue reported to us:
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2464
        const windowType = UserAgent.isFirefox && UserAgent.isWindows ? 'normal' : 'popup';

        try {
            const options = typeof windowStateString === 'string'
                ? JSON.parse(windowStateString)
                : PagesApi.defaultPopupWindowState;

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
                    ...PagesApi.defaultPopupWindowState,
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
    public static async getIssueReportUrl(siteUrl: string, from: ForwardFrom): Promise<string> {
        let browserName = UserAgent.browserName;
        let browserDetails: string | undefined;

        if (!UserAgent.isSupportedBrowser) {
            browserDetails = browserName;
            browserName = 'Other';
        }

        const commonFilterIds = FiltersApi.getEnabledFilters()
            .filter((filterId) => !CustomFilterUtils.isCustomFilter(filterId));

        const manifestDetails = browser.runtime.getManifest();

        const params: ForwardParams = {
            action: ForwardAction.IssueReport,
            from,
            product_type: PagesApi.PRODUCT_TYPE,
            manifest_version: encodeURIComponent(manifestDetails.manifest_version),
            product_version: encodeURIComponent(manifestDetails.version),
            url: encodeURIComponent(siteUrl),
        };

        const systemInfo = await UserAgent.getSystemInfo();
        if (systemInfo) {
            params.system_version = encodeURIComponent(systemInfo);
        }

        if (browserName) {
            params.browser = encodeURIComponent(browserName);
        }

        if (browserDetails) {
            params.browser_detail = encodeURIComponent(browserDetails);
        }

        if (commonFilterIds.length > 0) {
            params.filters = encodeURIComponent(commonFilterIds.join('.'));
        }

        const isCustomFiltersEnabled = groupStateStorage.get(AntibannerGroupsId.CustomFiltersGroupId)?.enabled;
        // Ignoring custom filters in MV3 since AG-39385.
        // TODO: fix the condition when custom filters will be supported for MV3
        if (isCustomFiltersEnabled && !__IS_MV3__) {
            const customFilterUrls = CustomFilterApi.getFiltersData()
                .filter(({ enabled }) => enabled)
                .map(({ customUrl }) => UrlUtils.trimFilterFilepath(customUrl));

            if (customFilterUrls.length > 0) {
                params.custom_filters = encodeURIComponent(customFilterUrls.join(','));
            }
        }

        const filtersLastUpdate = await FilterUpdateService.getLastUpdateTimeMs();
        if (filtersLastUpdate) {
            params.filters_last_update = encodeURIComponent(
                PagesApi.convertTimestampToTimeString(filtersLastUpdate),
            );
        }

        Object.assign(
            params,
            PagesApi.getStealthParams(commonFilterIds),
            PagesApi.getBrowserSecurityParams(),
        );

        const reportUrl = Forward.get(params);

        return reportUrl;
    }

    /**
     * Opens abuse page tab.
     *
     * @param siteUrl Target site url.
     * @param from UI which user is forwarded from.
     */
    public static async openAbusePage(siteUrl: string, from: ForwardFrom): Promise<void> {
        const reportUrl = await PagesApi.getIssueReportUrl(siteUrl, from);

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
        await browser.tabs.create({ url: PagesApi.postInstallPageUrl });
    }

    /**
     * Opens compare page.
     */
    public static async openComparePage(): Promise<void> {
        await browser.tabs.create({ url: PagesApi.comparePageUrl });
    }

    /**
     * Opens thank you page.
     */
    public static async openThankYouPage(): Promise<void> {
        const params = BrowserUtils.getExtensionParams();
        params.push(`_locale=${encodeURIComponent(browser.i18n.getUILanguage())}`);

        const pageUrl = __IS_MV3__ ? PagesApi.thankYouPageUrlMv3 : PagesApi.thankYouPageUrl;
        const thankYouUrl = `${pageUrl}?${params.join('&')}`;

        const postInstallPage = await TabsApi.findOne({ url: PagesApi.postInstallPageUrl });

        if (postInstallPage) {
            await browser.tabs.update(postInstallPage.id, { url: thankYouUrl });
        } else {
            await browser.tabs.create({ url: thankYouUrl });
        }
    }

    /**
     * Opens extension store page.
     */
    public static async openExtensionStorePage(): Promise<void> {
        await browser.tabs.create({ url: PagesApi.extensionStoreUrl });
    }

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
        const tab = await TabsApi.findOne({ url: `${PagesApi.settingsUrl}*` });

        if (!tab) {
            const newTab = await browser.tabs.create({ url });
            return newTab;
        }

        const updatedTab = await browser.tabs.update(tab.id, { url });
        return updatedTab;
    }

    /**
     * Opens 'Add custom filter' modal window into settings page.
     * If the page has been already opened, reload it with new custom filter query params, passed from content script.
     *
     * @param message - Content script message with custom filter data.
     */
    public static async openSettingsPageWithCustomFilterModal(message: AddFilteringSubscriptionMessage): Promise<void> {
        if (__IS_MV3__ && !isUserScriptsApiSupported()) {
            logger.debug('[ext.PagesApi.openSettingsPageWithCustomFilterModal]: User scripts API permission is not granted');
            return;
        }

        const { url, title } = message.data;

        let optionalPart = '#filters?group=0';
        if (title) {
            optionalPart += `&title=${title}`;
        }
        optionalPart += `&subscribe=${encodeURIComponent(url)}`;

        const path = PagesApi.getExtensionPageUrl(OPTIONS_OUTPUT, optionalPart);

        const tab = await PagesApi.openTabOnSettingsPage(path);

        await TabsApi.focus(tab);

        // Reload option page for force modal window rerender
        // TODO: track url update in frontend and remove force reloading via webextension API
        await TabsApi.reload(tab.id);
    }

    /**
     * Opens rules limits section on settings page.
     * If the page has been already opened, focus on it.
     */
    public static async openRulesLimitsPage(): Promise<void> {
        const queryPart = `#${OptionsPageSections.ruleLimits}`;

        const path = PagesApi.getExtensionPageUrl(OPTIONS_OUTPUT, queryPart);

        const tab = await PagesApi.openTabOnSettingsPage(path);

        await TabsApi.focus(tab);
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
    private static getExtensionStoreUrl(): string {
        let action = ForwardAction.ChromeStore;

        if (UserAgent.isOpera) {
            action = ForwardAction.OperaStore;
        } else if (UserAgent.isFirefox) {
            action = ForwardAction.FirefoxStore;
        } else if (UserAgent.isEdge) {
            action = ForwardAction.EdgeStore;
        } else if (!__IS_MV3__) {
            action = ForwardAction.ChromeMv2Store;
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
    private static getBrowserSecurityParams(): { [key: string]: string } {
        if (__IS_MV3__) {
            return {};
        }

        const isEnabled = !settingsStorage.get(SettingOption.DisableSafebrowsing);
        return { 'browsing_security.enabled': String(isEnabled) };
    }

    /**
     * Returns stealth url params.
     *
     * @param filterIds List of filter id.
     *
     * @returns Stealth url params record.
     */
    private static getStealthParams(filterIds: number[]): { [key: string]: string } {
        const stealthEnabled = !settingsStorage.get(SettingOption.DisableStealthMode);

        if (!stealthEnabled) {
            return { 'stealth.enabled': 'false' };
        }

        // TODO: Check values of queryKey and maybe move them to some ENUM?
        const stealthOptions = [
            {
                queryKey: 'stealth.ext_hide_referrer',
                settingKey: SettingOption.HideReferrer,
            },
            {
                queryKey: 'stealth.hide_search_queries',
                settingKey: SettingOption.HideSearchQueries,
            },
            {
                queryKey: 'stealth.DNT',
                settingKey: SettingOption.SendDoNotTrack,
            },
            {
                queryKey: 'stealth.x_client',
                settingKey: SettingOption.RemoveXClientData,
            },
            {
                queryKey: 'stealth.webrtc',
                settingKey: SettingOption.BlockWebRTC,
            },
            {
                queryKey: 'stealth.third_party_cookies',
                settingKey: SettingOption.SelfDestructThirdPartyCookies,
                settingValueKey: SettingOption.SelfDestructThirdPartyCookiesTime,
            },
            {
                queryKey: 'stealth.first_party_cookies',
                settingKey: SettingOption.SelfDestructFirstPartyCookies,
                settingValueKey: SettingOption.SelfDestructFirstPartyCookiesTime,
            },
        ];

        const stealthOptionsEntries = [['stealth.enabled', 'true']];

        stealthOptions.forEach((stealthOption) => {
            const { queryKey, settingKey, settingValueKey } = stealthOption;

            const setting = settingsStorage.get(settingKey);

            if (!setting) {
                return;
            }

            let option: string;

            if (!settingValueKey) {
                option = String(setting);
            } else {
                option = String(settingsStorage.get(settingValueKey));
            }

            stealthOptionsEntries.push([queryKey, option]);
        });

        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2721
        const isBlockTrackersEnabled = filterIds.includes(AntiBannerFiltersId.TrackingFilterId);
        if (isBlockTrackersEnabled) {
            stealthOptionsEntries.push(['stealth.block_trackers', 'true']);
        }

        const isRemoveUrlParamsEnabled = filterIds.includes(AntiBannerFiltersId.UrlTrackingFilterId);
        if (isRemoveUrlParamsEnabled) {
            stealthOptionsEntries.push(['stealth.strip_url', 'true']);
        }

        return Object.fromEntries(stealthOptionsEntries);
    }

    /**
     * Converts timestamp in milliseconds to time string.
     *
     * Needed for `filters_last_update` query parameters.
     *
     * @see {@link https://github.com/AdguardTeam/ReportsWebApp#pre-filling-the-app-with-query-parameters}
     *
     * @param timestampMs Timestamp in milliseconds.
     *
     * @returns Time string in format `YYYY-MM-DD-HH-mm-ss` in **UTC+0**.
     */
    private static convertTimestampToTimeString(timestampMs: number): string {
        return format(new UTCDate(timestampMs), 'yyyy-MM-dd-HH-mm-ss');
    }
}
