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

import { excludeUnsafeRules, type BrowserFilters } from '@adguard/dnr-rulesets';

import {
    DECLARATIVE_FILTERS_DEST,
    MV3_ASSETS_FILTERS_BROWSERS,
    MV3_ASSETS_FILTERS_BROWSER_TO_DNR_BROWSER_MAP,
    type Mv3AssetsFiltersBrowser,
} from '../constants';

import { updateLocalResourcesForMv3 } from './update-local-script-rules';

/**
 * Leave room within the 5000 session-rule quota for other rules, including $stealth rules.
 */
const UNSAFE_RULES_LIMIT = 4900;

/**
 * Resolves package support before AssetsLoader can default to Chromium resources.
 *
 * @param browser Resource target.
 *
 * @returns The package's browser identifier.
 *
 * @throws Error if the installed package does not support the target.
 */
export const getDnrRulesetsBrowser = (browser: Mv3AssetsFiltersBrowser): BrowserFilters => {
    const dnrBrowser = MV3_ASSETS_FILTERS_BROWSER_TO_DNR_BROWSER_MAP[browser];
    if (!dnrBrowser) {
        throw new Error(`Installed @adguard/dnr-rulesets does not support ${browser}; update the package before loading resources`);
    }
    return dnrBrowser;
};

/** Updates bundled script registries for all MV3 resource targets. */
export const updateAllMv3LocalResources = async (): Promise<void> => {
    await Promise.all(MV3_ASSETS_FILTERS_BROWSERS.map((browser) => updateLocalResourcesForMv3(browser)));
};

/** Extracts unsafe rules into ruleset metadata within the session-rule budget. */
export const excludeAllMv3UnsafeRules = async (): Promise<void> => {
    await Promise.all(MV3_ASSETS_FILTERS_BROWSERS.map((browser) => excludeUnsafeRules({
        dir: DECLARATIVE_FILTERS_DEST.replace('%browser', browser),
        limit: UNSAFE_RULES_LIMIT,
    })));
};
