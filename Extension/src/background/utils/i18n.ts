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
 * Helper class for working with i18n locales
 */
export class I18n {
    /**
     * Gets matched locale from locales list or dictionary
     *
     * @param locales - list or dictionary of i18n locales
     * @param locale - target locale
     * @returns matched locale or null, if locale is not found
     */
    public static find(
        locales: string[] | Record<string, unknown>,
        locale: string,
    ): string | null {
        const lang = this.normalizeLanguageCode(locale);

        if (I18n.isIncludesLocale(locales, locale)) {
            return lang;
        }

        const [localePart] = lang.split('_');

        if (localePart && I18n.isIncludesLocale(locales, localePart)) {
            return localePart;
        }

        return null;
    }

    /**
     * Checks if {@link locales} includes {@link locale}
     *
     * @param locales Locales array or record.
     * @param locale Target locale.
     * @returns true if {@link locales} includes {@link locale}, else returns false
     */
    private static isIncludesLocale(
        locales: string[] | Record<string, unknown>,
        locale: string,
    ): boolean {
        return Array.isArray(locales) ? locales.includes(locale) : locale in locales;
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
