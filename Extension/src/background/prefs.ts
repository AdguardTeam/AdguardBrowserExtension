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
import browser from 'webextension-polyfill';

// Variables passed from webpack.DefinePlugin that will be primitive at runtime.
declare const TSWEBEXTENSION_VERSION: string;
declare const TSURLFILTER_VERSION: string;
declare const SCRIPTLETS_VERSION: string;

/**
 * Extension global preferences.
 */
export class Prefs {
    public static id = browser.runtime.id;

    public static baseUrl = browser.runtime.getURL('');

    public static version = browser.runtime.getManifest().version;

    public static language = browser.i18n.getUILanguage();

    public static readonly libVersions = {
        tswebextension: TSWEBEXTENSION_VERSION,
        tsurlfilter: TSURLFILTER_VERSION,
        scriptlets: SCRIPTLETS_VERSION,
    };
}
