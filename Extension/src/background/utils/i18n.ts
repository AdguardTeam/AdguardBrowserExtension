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

/**
 * Helper class for working with i18n locales.
 */
export class I18n {
    /**
     * Returns matched `locale` from `locales` list.
     *
     * @param locales Array of locale codes represented as strings.
     * @param locale Target locale.
     *
     * @returns Normalized locale code if found, otherwise null.
     */
    public static find(locales: string[], locale: string): string | null {
        const normalizedLocales = locales.map((l) => I18n.normalizeLanguageCode(l));
        const lang = this.normalizeLanguageCode(locale);

        if (normalizedLocales.includes(lang)) {
            return lang;
        }

        const [localePart] = lang.split('_');

        if (localePart && normalizedLocales.includes(localePart)) {
            return localePart;
        }

        return null;
    }

    /**
     * Normalizes language code.
     *
     * @param locale Language code.
     *
     * @returns Normalized language code.
     */
    public static normalizeLanguageCode(locale: string): string {
        return locale.toLowerCase().replace('-', '_');
    }
}
