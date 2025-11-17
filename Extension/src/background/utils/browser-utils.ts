/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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
import { Prefs } from '../prefs';
import { appContext, AppContextKey } from '../storages/app';
import { CHROME_EXTENSIONS_SETTINGS_URL } from '../../common/constants';
import { logger } from '../../common/logger';

import { Version } from './version';

/**
 * Helper class for working with browser extension context.
 */
export class BrowserUtils {
    /**
     * Returns extension specified query params.
     * This method called on app metadata, i18n metadata and thankyou page url calculation.
     *
     * @see NetworkSettings#filtersMetadataUrl
     * @see NetworkSettings#filtersI18nMetadataUrl
     * @see PagesApi.openThankYouPage
     *
     * @returns Extension specified query params array.
     *
     * @throws Error if client id is undefined.
     */
    public static getExtensionParams(): string[] {
        const persistedClientId = appContext.get(AppContextKey.ClientId);

        if (typeof persistedClientId !== 'string') {
            throw new Error('client id is not found');
        }

        const clientId = encodeURIComponent(persistedClientId);
        const locale = encodeURIComponent(Prefs.language);
        const version = encodeURIComponent(Prefs.version);
        const id = encodeURIComponent(Prefs.id);

        const params: string[] = [];
        params.push(`v=${version}`);
        params.push(`cid=${clientId}`);
        params.push(`lang=${locale}`);
        params.push(`id=${id}`);
        return params;
    }

    /**
     * Returns extension details url,
     * e.g. `chrome://extensions/?id=<extensionId>`.
     *
     * Needed for User Scripts API toggle.
     *
     * @see https://developer.chrome.com/docs/extensions/reference/api/userScripts#chrome_versions_138_and_newer_allow_user_scripts_toggle
     *
     * @returns Extension details url.
     */
    public static getExtensionDetailsUrl(): string {
        const url = new URL(CHROME_EXTENSIONS_SETTINGS_URL);
        url.searchParams.set('id', Prefs.id);
        return url.toString();
    }

    /**
     * Retrieves locales from navigator.
     *
     * @param limit Limit of returned locales.
     *
     * @returns Array of locales.
     */
    public static getNavigatorLanguages(limit?: number): string[] {
        let languages: string[] = [];
        // https://developer.mozilla.org/ru/docs/Web/API/NavigatorLanguage/languages
        if (Array.isArray(navigator.languages)) {
            // get all languages if 'limit' is not specified
            const langLimit = limit || navigator.languages.length;
            languages = navigator.languages.slice(0, langLimit);
        } else if (navigator.language) {
            languages.push(navigator.language); // .language is first in .languages
        }
        return languages;
    }

    /**
     * Checks if version can be parsed. Our format is different from
     * usual semver format, because it can handle 4 parts (1.1.1.1 usually filters use such
     * format) in version. To find out more details see {@link Version}.
     *
     * @param version Version string.
     *
     * @returns True, if string matches our versioning scheme, otherwise returns false.
     */
    public static isSemver(version?: unknown): boolean {
        try {
            // eslint-disable-next-line no-new
            new Version(version);
        } catch (e: unknown) {
            logger.debug(`[ext.BrowserUtils.isSemver]: can not parse version: "${version}", error:`, e);
            return false;
        }
        return true;
    }

    /**
     * Checks if left version is greater than the right version.
     *
     * @param leftVersion Semver string.
     * @param rightVersion Semver string.
     *
     * @returns True, if left version is greater than the right version, else returns false.
     */
    public static isGreaterVersion(leftVersion: string, rightVersion: string): boolean {
        const left = new Version(leftVersion);
        const right = new Version(rightVersion);
        return left.compare(right) > 0;
    }

    /**
     * Checks if left version is greater than the right version or equals.
     *
     * @param leftVersion Semver string.
     * @param rightVersion Semver string.
     *
     * @returns True, if left version is greater than the right version or equals, else returns false.
     */
    public static isGreaterOrEqualsVersion(leftVersion: string, rightVersion: string): boolean {
        const left = new Version(leftVersion);
        const right = new Version(rightVersion);
        return left.compare(right) >= 0;
    }

    /**
     * Returns major number of version.
     *
     * @param version Semver string.
     *
     * @returns Major part of semver.
     */
    public static getMajorVersionNumber(version: string): string {
        const v = new Version(version);
        return String(v.data[0]);
    }

    /**
     * Returns minor number of version.
     *
     * @param version Semver string.
     *
     * @returns Minor part of semver.
     */
    public static getMinorVersionNumber(version: string): string {
        const v = new Version(version);
        return String(v.data[1]);
    }
}
