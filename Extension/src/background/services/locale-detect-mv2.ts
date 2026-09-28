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

import browser, { type Tabs } from 'webextension-polyfill';

import { getDomain, isHttpRequest } from '../tswebextension';
import { UserAgent } from '../../common/user-agent';
import { type RegularFilterMetadata, SettingOption } from '../schema';
import {
    filterStateStorage,
    groupStateStorage,
    metadataStorage,
    settingsStorage,
} from '../storages';
import { engine } from '../engine';
import { toasts } from '../api/ui';
import { FiltersApi } from '../api/filters/main';
import { CommonFilterApi } from '../api/filters/common';
import { Categories } from '../api/filters/categories';
import { AntibannerGroupsId } from '../../common/constants';
import { logger } from '../../common/logger';
import { getZodErrorMessage } from '../../common/error';

import { AutoDisableFiltersService } from './auto-disable-filters-mv2';

type BrowsingLanguage = {
    language: string;
    time: number;
};

/**
 * Language code returned by the browser when it cannot determine the page language.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/detectLanguage}
 */
export const UNDETERMINED_LANGUAGE = 'und';

/**
 * This service is used to auto-enable language-specific filters and to record
 * page visits for auto-disabling unused language-specific filters.
 *
 * @note This service is only used in Manifest V2 extensions.
 */
class LocaleDetect {
    static SUCCESS_HIT_COUNT = 3;

    static MAX_HISTORY_LENGTH = 10;

    static domainToLanguagesMap: Record<string, string> = {
        // Russian
        'ru': 'ru',
        'by': 'ru',
        'kz': 'ru',
        'uz': 'ru',
        'kg': 'ru',
        // Ukrainian
        'ua': 'uk',
        // English
        'com': 'en',
        'au': 'en',
        'uk': 'en',
        'nz': 'en',
        // German
        'de': 'de',
        'at': 'de',
        'li': 'de',
        // Japanese
        'jp': 'ja',
        // Dutch
        'nl': 'nl',
        // French
        'fr': 'fr',
        'mc': 'fr',
        'ht': 'fr',
        // Spanish
        'es': 'es',
        'mx': 'es',
        'ar': 'es',
        'cl': 'es',
        'uy': 'es',
        'pe': 'es',
        've': 'es',
        'ec': 'es',
        'bo': 'es',
        'py': 'es',
        'pa': 'es',
        'cr': 'es',
        'ni': 'es',
        'hn': 'es',
        'gt': 'es',
        'sv': 'es',
        'do': 'es',
        'pr': 'es',
        'cat': 'es',
        // Italian
        'it': 'it',
        'sm': 'it',
        // Portuguese
        'pt': 'pt',
        'br': 'pt',
        'ao': 'pt',
        'mz': 'pt',
        'cv': 'pt',
        // Polish
        'pl': 'pl',
        // Czech
        'cz': 'cs',
        // Bulgarian
        'bg': 'bg',
        // Lithuanian
        'lt': 'lt',
        // Latvian
        'lv': 'lv',
        // Arabic
        'eg': 'ar',
        'dz': 'ar',
        'kw': 'ar',
        'ae': 'ar',
        'ma': 'ar',
        'jo': 'ar',
        'lb': 'ar',
        'bh': 'ar',
        'qa': 'ar',
        'iq': 'ar',
        'tn': 'ar',
        // Slovakian
        'sk': 'sk',
        // Romanian
        'ro': 'ro',
        'md': 'ro',
        // Suomi
        'fi': 'fi',
        // Icelandic
        'is': 'is',
        // Norwegian
        'no': 'no',
        // Greek
        'gr': 'el',
        // Hungarian
        'hu': 'hu',
        // Hebrew
        'il': 'he',
        // Chinese
        'cn': 'zh',
        'tw': 'zh',
        // Indonesian
        'id': 'id',
        // Malaysian
        'my': 'id',
        // Turkish
        'tr': 'tr',
        // Serbian
        'sr': 'sr',
        'ba': 'sr',
        // Croatian
        'hr': 'hr',
        // Hindi
        'in': 'hi',
        // Bangla:
        'bd': 'hi',
        // Sri Lanka
        'lk': 'hi',
        // Nepal:
        'np': 'hi',
        // Estonian:
        'ee': 'et',
        // Persian:
        'ir': 'fa',
        // Tajik:
        'tj': 'fa',
        // Korean:
        'kr': 'ko',
        // Danish:
        'dk': 'da',
        // Faroese:
        'fo': 'fo',
        // Vietnamese:
        'vn': 'vi',
        // Thai:
        'th': 'th',
        // Swedish:
        'se': 'sv',
        'ax': 'sv',
    };

    private browsingLanguages: BrowsingLanguage[] = [];

    /**
     * Because listener for tab updates cannot be paused during filter loading,
     * we should save status of loading for each language to exclude double loading.
     */
    private loadingLanguagesMutex: Record<string, boolean> = {};

    /**
     * Creates new {@link LocaleDetect}.
     */
    constructor() {
        this.onTabUpdated = this.onTabUpdated.bind(this);
    }

    /**
     * Adds listener for tab update message.
     */
    public init(): void {
        browser.tabs.onUpdated.addListener(this.onTabUpdated);
    }

    /**
     * Called when tab is updated.
     *
     * @param tabId Tab id. Unused.
     * @param changeInfo Info about tab changed ({@link Tabs.OnUpdatedChangeInfoType}). Unused.
     * @param tab Item of {@link Tabs.Tab}.
     */
    private async onTabUpdated(
        tabId: number,
        changeInfo: Tabs.OnUpdatedChangeInfoType,
        tab: Tabs.Tab,
    ): Promise<void> {
        if (tab.status === 'complete') {
            await this.detectTabLanguage(tab);
        }
    }

    /**
     * Detects the tab language and records each eligible page for active-day tracking,
     * including pages whose language could not be determined.
     *
     * @param tab Tab details.
     */
    private async detectTabLanguage(tab: Tabs.Tab): Promise<void> {
        const isLanguageFilterAutodetectEnabled = !settingsStorage.get(SettingOption.DisableDetectFilters);
        const isFilteringDisabled = settingsStorage.get(SettingOption.DisableFiltering);

        if (!isLanguageFilterAutodetectEnabled
            || isFilteringDisabled
            || !tab.url
            // Check language only for http://... tabs
            || !isHttpRequest(tab.url)
        ) {
            return;
        }

        const language = await LocaleDetect.getTabLanguage(tab.id, tab.url);
        // Count activity without a language visit when the language is unknown.
        const detectedLanguage = language && language !== UNDETERMINED_LANGUAGE ? language : undefined;

        await AutoDisableFiltersService.recordVisit(detectedLanguage);

        if (detectedLanguage) {
            await this.detectLanguage(detectedLanguage);
        }
    }

    /**
     * Gets the page language from the browser API or the top-level domain.
     *
     * @param tabId Tab id.
     * @param url Page URL.
     *
     * @returns Detected language (possibly 'und' for unknown), or undefined if detection is unavailable or fails.
     */
    private static async getTabLanguage(tabId: number | undefined, url: string): Promise<string | undefined> {
        // tabs.detectLanguage doesn't work in Opera
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/997
        if (!UserAgent.isOpera) {
            if (tabId && browser.tabs && browser.tabs.detectLanguage) {
                // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/detectLanguage
                try {
                    return await browser.tabs.detectLanguage(tabId);
                } catch (e) {
                    return undefined;
                }
            }
        }

        // Detecting language by top-level domain if extension API language detection is unavailable
        // Ignore hostnames which length is less or equal to 8
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1354
        const host = getDomain(url);
        if (host && host.length > 8) {
            const parts = host.split('.');
            const tld = parts.at(-1);

            return tld && Object.prototype.hasOwnProperty.call(LocaleDetect.domainToLanguagesMap, tld)
                ? LocaleDetect.domainToLanguagesMap[tld]
                : undefined;
        }

        return undefined;
    }

    /**
     * Stores language in the special array containing languages of the last visited pages.
     * If user has visited enough pages with a specified language we call special callback
     * to auto-enable filter for this language.
     *
     * @param language Page language.
     *
     * @private
     */
    private async detectLanguage(language: string): Promise<void> {
        this.browsingLanguages.push({
            language,
            time: Date.now(),
        });

        if (this.browsingLanguages.length > LocaleDetect.MAX_HISTORY_LENGTH) {
            this.browsingLanguages.shift();
        }

        const history = this.browsingLanguages.filter((h) => {
            return h.language === language;
        });

        if (history.length >= LocaleDetect.SUCCESS_HIT_COUNT && !this.loadingLanguagesMutex[language]) {
            // Lock mutex to exclude double loading.
            this.loadingLanguagesMutex[language] = true;

            try {
                const filterIds = metadataStorage.getFilterIdsForLanguage(language);
                await LocaleDetect.onFilterDetectedByLocale(filterIds);
            } catch (e) {
                logger.error(`[ext.LocaleDetect.detectLanguage]: cannot enable filters for language '${language}':`, getZodErrorMessage(e));
            } finally {
                delete this.loadingLanguagesMutex[language];
            }
        }
    }

    /**
     * Called when LocaleDetector has detected language-specific filters we can enable.
     *
     * @param filterIds List of detected language-specific filter identifiers.
     *
     * @private
     */
    private static async onFilterDetectedByLocale(filterIds: number[]): Promise<void> {
        if (!filterIds || filterIds.length === 0) {
            return;
        }

        const disabledFiltersIds = filterIds.filter((filterId) => !FiltersApi.isFilterEnabled(filterId));

        // TODO: Check, do we really need always enable language group,
        // even if user disabled it manually?
        // Always enable language filters group.
        const groupId = AntibannerGroupsId.LanguageFiltersGroupId;
        const wasGroupEnabled = groupStateStorage.get(groupId)?.enabled;
        groupStateStorage.enableGroups([groupId]);
        if (!wasGroupEnabled) {
            // Enabling a group clears the 'disabled as unused' statuses of its filters.
            filterStateStorage.clearUnused(Categories.getFiltersIdsByGroupId(groupId));
        }

        if (disabledFiltersIds.length === 0) {
            return;
        }

        await FiltersApi.loadAndEnableFilters(disabledFiltersIds, true);
        engine.debounceUpdate();

        const filters: RegularFilterMetadata[] = [];

        disabledFiltersIds.forEach((filterId) => {
            const filter = CommonFilterApi.getFilterMetadata(filterId);

            if (filter) {
                filters.push(filter);
            }
        });

        toasts.showFiltersEnabledAlertMessage(filters);
    }
}

export const localeDetect = new LocaleDetect();
