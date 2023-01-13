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

export const enum ForwardAction {
    UninstallExtension = 'adguard_uninstal_ext',
    ThankYou = 'thank_you_page',
    SiteReport = 'site_report_page',
    Report = 'report',
    Privacy = 'privacy',
    Acknowledgments = 'acknowledgments',
    Github = 'github_options',
    Website = 'adguard_site',
    Discuss = 'discuss',
    Compare = 'compare',
    Changelog = 'github_version_popup',
    GlobalPrivacyControl = 'global_privacy_control',
    DoNotTrack = 'do_not_track',
    HowToCreateRules = 'userfilter_description',
    AdguardSite = 'adguard_site',
    SelfPromotion = 'self_promotion',
    ProtectionWorks = 'protection_works',
    CollectHitsLearnMore = 'filter_rules',
    OperaStore = 'opera_store',
    FirefoxStore = 'firefox_store',
    ChromeStore = 'chrome_store',
    EdgeStore = 'edge_store',
    IOS = 'ios_about',
    Android = 'android_about',
    GithubVersion = 'github_version_popup',
}

export const enum ForwardFrom {
    Background = 'background',
    Options = 'options_screen',
    OptionsFooter = 'options_screen_footer',
    ContextMenu = 'context_menu',
    Popup = 'popup',
    Safebrowsing = 'safebrowsing',
    Adblocker = 'adblocked',
    VersionPopup = 'version_popup',
}

export const enum ForwardApp {
    BrowserExtension = 'browser_extension',
}

export type ForwardParams = {
    action: ForwardAction;
    from?: ForwardFrom;
    app?: ForwardApp;
} & { [key: string] : string; };

/**
 * Class for creating forward links
 */
export class Forward {
    static url = 'https://link.adtidy.org/forward.html';

    static defaultParams = {
        app: ForwardApp.BrowserExtension,
    };

    static get(params: ForwardParams): string {
        const queryString = Object
            .entries({ ...Forward.defaultParams, ...params })
            .map(([key, value]) => `${key}=${value}`).join('&');

        return `${Forward.url}?${queryString}`;
    }
}
