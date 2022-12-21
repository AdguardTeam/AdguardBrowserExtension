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
import { Prefs } from '../prefs';
import { appContext, AppContextKey } from '../storages';

import { Version } from './version';
import { Log } from '../../common/log';

/**
 * Helper class for working with browser extension context
 */
export class BrowserUtils {
    /**
     * {@link BrowserUtils.getExtensionParams} gets extension specified query params
     *
     * This method called on app metadata, i18n metadata and thankyou page url calculation
     *
     * @see NetworkSettings#filtersMetadataUrl
     * @see NetworkSettings#filtersI18nMetadataUrl
     * @see PagesApi.openThankYouPage
     *
     * @returns extension specified query params array
     * @throws error if client id is undefined
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
     * {@link BrowserUtils.getNavigatorLanguages} retrieves locales from navigator
     *
     * @param limit - limit of returned locales
     *
     * @returns array of locales
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
     * {@link BrowserUtils.isSemver} checks if version can be parsed. Our format is different from
     * usual semver format, because it can handle 4 parts (1.1.1.1 - usually filters use such
     * format) in version. To find out more details see {@link Version}
     *
     * @param version - version string
     *
     * @returns true, if string matches our versioning scheme, otherwise returns false
     */
    public static isSemver(version?: unknown): boolean {
        try {
            // eslint-disable-next-line no-new
            new Version(version);
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'unknown error';
            Log.debug(`Can\'t parse version: "${version}", error: "${errorMessage}"`);
            return false;
        }
        return true;
    }

    /**
     * {@link BrowserUtils.isGreaterVersion} checks if left version is greater than the right version
     *
     * @param leftVersion - semver string
     * @param rightVersion - semver string
     *
     * @returns true, if left version is greater than the right version, else returns false
     */
    public static isGreaterVersion(leftVersion: string, rightVersion: string): boolean {
        const left = new Version(leftVersion);
        const right = new Version(rightVersion);
        return left.compare(right) > 0;
    }

    /**
     * {@link BrowserUtils.isGreaterOrEqualsVersion} checks if left version is greater than the right version or equals
     *
     * @param leftVersion - semver string
     * @param rightVersion - semver string
     *
     * @returns true, if left version is greater than the right version or equals, else returns false
     */
    public static isGreaterOrEqualsVersion(leftVersion: string, rightVersion: string): boolean {
        const left = new Version(leftVersion);
        const right = new Version(rightVersion);
        return left.compare(right) >= 0;
    }

    /**
     * {@link BrowserUtils.getMajorVersionNumber} gets major number of version
     *
     * @param version - semver string
     *
     * @returns major part of semver
     */
    public static getMajorVersionNumber(version: string): string {
        const v = new Version(version);
        return String(v.data[0]);
    }

    /**
     * {@link BrowserUtils.getMinorVersionNumber} gets minor number of version
     *
     * @param version - semver string
     *
     * @returns minor part of semver
     */
    public static getMinorVersionNumber(version: string): string {
        const v = new Version(version);
        return String(v.data[1]);
    }
}
