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
import browser, { Runtime, Windows } from 'webextension-polyfill';

import { UserAgent } from '../../../common/user-agent';
import { AddFilteringSubscriptionMessage, ScriptletCloseWindowMessage } from '../../../common/messages';
import {
    Forward,
    ForwardAction,
    ForwardFrom,
    ForwardParams,
} from '../../../common/forward';
import { Engine } from '../../engine';
import { UrlUtils } from '../../utils/url';
import { storage, settingsStorage } from '../../storages';
import { SettingOption } from '../../schema';
import { BrowserUtils } from '../../utils/browser-utils';
import { AntiBannerFiltersId, FILTERING_LOG_WINDOW_STATE } from '../../../common/constants';
import { TabsApi } from '../extension';
import { Prefs } from '../../prefs';
import {
    FILTERING_LOG_OUTPUT,
    FILTER_DOWNLOAD_OUTPUT,
    FULLSCREEN_USER_RULES_OUTPUT,
    OPTIONS_OUTPUT,
} from '../../../../../constants';

// TODO: We can manipulates tabs directly from content-script and other extension pages context.
// So this API can be shared and used for data flow simplifying (direct calls instead of message passing)
/**
 * Pages API provides methods for managing browser pages.
 */
export class PagesApi {
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
     * Default state of filtering log window.
     */
    public static defaultFilteringLogWindowState: Windows.CreateCreateDataType = {
        width: 1000,
        height: 650,
        top: 0,
        left: 0,
    };

    /**
     * Filters download page url.
     */
    public static readonly filtersDownloadPageUrl = PagesApi.getExtensionPageUrl(FILTER_DOWNLOAD_OUTPUT);

    /**
     * Thank you page page url.
     */
    public static readonly thankYouPageUrl = Forward.get({
        action: ForwardAction.ThankYou,
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
     * Opens settings page tab.
     * If the page has been already opened, focus on tab instead creating new one.
     */
    public static async openSettingsPage(): Promise<void> {
        const tab = await TabsApi.findOne({ url: `${PagesApi.settingsUrl}*` });

        if (tab) {
            await TabsApi.focus(tab);
            return;
        }

        await browser.tabs.create({ url: PagesApi.settingsUrl });
    }

    /**
     * Opens fullscreen user rules page window.
     * If the page has been already opened, focus on window instead creating new one.
     */
    public static async openFullscreenUserRulesPage(): Promise<void> {
        const theme = settingsStorage.get(SettingOption.AppearanceTheme);
        const url = `${PagesApi.fullscreenUserRulesPageUrl}?theme=${theme}`;

        const tab = await TabsApi.findOne({ url: `${PagesApi.fullscreenUserRulesPageUrl}*` });

        if (tab) {
            await TabsApi.focus(tab);
            return;
        }

        await browser.windows.create({
            url,
            type: 'popup',
            focused: true,
            state: 'fullscreen',
        });
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

        const windowStateString = await storage.get(FILTERING_LOG_WINDOW_STATE) as string | undefined;

        await browser.windows.create({
            url,
            type: 'popup',
            ...(windowStateString ? JSON.parse(windowStateString) : PagesApi.defaultFilteringLogWindowState),
        });
    }

    /**
     * Opens abuse page tab.
     *
     * @param siteUrl Target site url.
     * @param from UI which user is forwarded from.
     */
    public static async openAbusePage(siteUrl: string, from: ForwardFrom): Promise<void> {
        let { browserName } = UserAgent;
        let browserDetails: string | undefined;

        if (!UserAgent.isSupportedBrowser) {
            browserDetails = browserName;
            browserName = 'Other';
        }

        const filterIds = Engine.api.configuration?.filters || [];

        const params: ForwardParams = {
            action: ForwardAction.Report,
            from,
            product_type: 'Ext',
            product_version: encodeURIComponent(browser.runtime.getManifest().version),
            url: encodeURIComponent(siteUrl),
        };

        if (browserName) {
            params.browser = encodeURIComponent(browserName);
        }

        if (browserDetails) {
            params.browser_detail = encodeURIComponent(browserDetails);
        }

        if (filterIds.length > 0) {
            params.filters = encodeURIComponent(filterIds.join('.'));
        }

        Object.assign(
            params,
            PagesApi.getStealthParams(filterIds),
            PagesApi.getBrowserSecurityParams(),
        );

        const reportUrl = Forward.get(params);

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
     * @param optionalPart Url query string or/and hash.
     * @returns Full extension page url.
     */
    public static getExtensionPageUrl(filename: string, optionalPart?: string): string {
        let url = `${Prefs.baseUrl}${filename}.html`;

        if (typeof optionalPart === 'string') {
            url += optionalPart;
        }

        return url;
    }

    /**
     * Opens filters download page.
     */
    public static async openFiltersDownloadPage(): Promise<void> {
        await browser.tabs.create({ url: PagesApi.filtersDownloadPageUrl });
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
        const thankYouUrl = `${PagesApi.thankYouPageUrl}?${params.join('&')}`;

        const filtersDownloadPage = await TabsApi.findOne({ url: PagesApi.filtersDownloadPageUrl });

        if (filtersDownloadPage) {
            await browser.tabs.update(filtersDownloadPage.id, { url: thankYouUrl });
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
     * Opens 'Add custom filter' modal window into settings page.
     * If the page has been already opened, reload it with new custom filter query params, passed from content script.
     *
     * @param message - Content script message with custom filter data.
     */
    public static async openSettingsPageWithCustomFilterModal(message: AddFilteringSubscriptionMessage): Promise<void> {
        const { url, title } = message.data;

        let optionalPart = '#filters?group=0';
        if (title) {
            optionalPart += `&title=${title}`;
        }
        optionalPart += `&subscribe=${encodeURIComponent(url)}`;

        const path = PagesApi.getExtensionPageUrl(OPTIONS_OUTPUT, optionalPart);

        const tab = await TabsApi.findOne({ url: `${PagesApi.settingsUrl}*` });

        if (!tab) {
            await browser.tabs.create({ url: path });
            return;
        }

        await browser.tabs.update(tab.id, { url: path });
        // Reload option page for force modal window rerender
        // TODO: track url update in frontend and remove force reloading via webextension API
        await browser.tabs.reload(tab.id);
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
     * Gets extension store url based on UA data.
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
        }

        return Forward.get({
            action,
            from: ForwardFrom.Options,
        });
    }

    /**
     * Gets browser security url params.
     *
     * @returns Browser security url params record.
     */
    private static getBrowserSecurityParams(): { [key: string]: string } {
        const isEnabled = !settingsStorage.get(SettingOption.DisableSafebrowsing);
        return { 'browsing_security.enabled': String(isEnabled) };
    }

    /**
     * Gets stealth url params.
     *
     * @param filterIds List of filters id.
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
                settingKey: SettingOption.BlockChromeClientData,
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

        // TODO: Check, maybe obsoleted because we don't have option 'strip url'
        // in the Stealth Mode options.
        const isRemoveUrlParamsEnabled = filterIds.includes(AntiBannerFiltersId.UrlTrackingFilterId);
        if (isRemoveUrlParamsEnabled) {
            stealthOptionsEntries.push(['stealth.strip_url', 'true']);
        }

        return Object.fromEntries(stealthOptionsEntries);
    }
}
