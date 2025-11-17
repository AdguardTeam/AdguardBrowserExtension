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
import browser from 'webextension-polyfill';

import { TSURLFILTER_VERSION } from '@adguard/tsurlfilter';
import { SCRIPTLETS_VERSION } from '@adguard/scriptlets';

import { TSWEBEXTENSION_VERSION, EXTENDED_CSS_VERSION } from 'tswebextension';

import type { GetOptionsDataResponse } from './services/settings/types';

/**
 * Extension global preferences.
 */
export class Prefs {
    public static id = browser.runtime.id;

    public static baseUrl = browser.runtime.getURL('');

    /**
     * Version of application, taken from manifest.json, e.g. "7.8.5".
     */
    public static version = browser.runtime.getManifest().version;

    public static language = browser.i18n.getUILanguage();

    public static readonly libVersions: GetOptionsDataResponse['libVersions'] = {
        tswebextension: TSWEBEXTENSION_VERSION,
        tsurlfilter: TSURLFILTER_VERSION,
        scriptlets: SCRIPTLETS_VERSION,
        extendedCss: EXTENDED_CSS_VERSION,
        // DNR Ruleset version will be set later during execution
        // when the metadata for rules is loaded (only for MV3).
        dnrRulesets: undefined,
    };
}
