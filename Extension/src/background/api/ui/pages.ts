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
import browser, { Windows } from 'webextension-polyfill';
import { UserAgent } from '../../../common/user-agent';
import { AddFilteringSubscriptionMessage } from '../../../common/messages';
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

export class PagesApi {
    public static settingsUrl = PagesApi.getExtensionPageUrl('options.html');

    public static filteringLogUrl = PagesApi.getExtensionPageUrl('filtering-log.html');

    public static defaultFilteringLogWindowState: Windows.CreateCreateDataType = {
        width: 1000,
        height: 650,
        top: 0,
        left: 0,
    };

    public static filtersDownloadPageUrl = PagesApi.getExtensionPageUrl('filter-download.html');

    public static thankYouPageUrl = Forward.get({
        action: ForwardAction.ThankYou,
        from: ForwardFrom.Background,
    });

    public static comparePageUrl = Forward.get({
        action: ForwardAction.Compare,
        from: ForwardFrom.Options,
    });

    public static extensionStoreUrl = PagesApi.getExtensionStoreUrl();

    static async openSettingsPage(): Promise<void> {
        await TabsApi.openTab({
            focusIfOpen: true,
            url: PagesApi.settingsUrl,
        });
    }

    static async openFullscreenUserRulesPage(): Promise<void> {
        const theme = settingsStorage.get(SettingOption.AppearanceTheme);
        const url = PagesApi.getExtensionPageUrl(`fullscreen-user-rules.html?theme=${theme}`);

        await TabsApi.openWindow({
            url,
            type: 'popup',
            focused: true,
            state: 'fullscreen',
        });
    }

    static async openFilteringLogPage(): Promise<void> {
        const activeTab = await TabsApi.getActive();

        if (!activeTab) {
            return;
        }

        const url = PagesApi.filteringLogUrl + (activeTab.id ? `#${activeTab.id}` : '');

        const windowStateString = await storage.get(FILTERING_LOG_WINDOW_STATE) as string | undefined;

        await TabsApi.openWindow({
            focusIfOpen: true,
            url,
            type: 'popup',
            ...(windowStateString ? JSON.parse(windowStateString) : PagesApi.defaultFilteringLogWindowState),
        });
    }

    static async openAbusePage(siteUrl: string, from: ForwardFrom): Promise<void> {
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

        await TabsApi.openTab({
            url: reportUrl,
        });
    }

    static async openSiteReportPage(siteUrl: string, from: ForwardFrom): Promise<void> {
        const domain = UrlUtils.getDomainName(siteUrl);

        if (!domain) {
            return;
        }

        const punycodeDomain = UrlUtils.toPunyCode(domain);

        await TabsApi.openTab({
            url: Forward.get({
                from,
                action: ForwardAction.SiteReport,
                domain: encodeURIComponent(punycodeDomain),
            }),
        });
    }

    public static getExtensionPageUrl(path: string): string {
        return `${Prefs.baseUrl}pages/${path}`;
    }

    public static async openFiltersDownloadPage(): Promise<void> {
        await TabsApi.openTab({ url: PagesApi.filtersDownloadPageUrl });
    }

    public static async openComparePage(): Promise<void> {
        await TabsApi.openTab({ url: PagesApi.comparePageUrl });
    }

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

    public static async openExtensionStorePage(): Promise<void> {
        await TabsApi.openTab({ url: PagesApi.extensionStoreUrl });
    }

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

    public static async openSettingsPageWithCustomFilterModal(message: AddFilteringSubscriptionMessage): Promise<void> {
        const { url, title } = message.data;

        let path = 'options.html#filters?group=0';
        if (title) {
            path += `&title=${title}`;
        }
        path += `&subscribe=${encodeURIComponent(url)}`;

        path = PagesApi.getExtensionPageUrl(path);

        await TabsApi.openTab({
            focusIfOpen: true,
            url: path,
        });
    }

    private static getBrowserSecurityParams(): { [key: string]: string } {
        const isEnabled = !settingsStorage.get(SettingOption.DisableSafebrowsing);
        return { 'browsing_security.enabled': String(isEnabled) };
    }

    private static getStealthParams(filterIds: number[]): { [key: string]: string } {
        const stealthEnabled = !settingsStorage.get(SettingOption.DisableStealthMode);

        if (!stealthEnabled) {
            return { 'stealth.enabled': 'false' };
        }

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

        const isRemoveUrlParamsEnabled = filterIds.includes(AntiBannerFiltersId.UrlTrackingFilterId);

        if (isRemoveUrlParamsEnabled) {
            stealthOptionsEntries.push(['stealth.strip_url', 'true']);
        }

        return Object.fromEntries(stealthOptionsEntries);
    }
}
