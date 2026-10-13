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

/**
 * Option which skips the local resources update entirely, e.g. during the
 * expedited Chrome Web Store filter-update flow.
 */
export const SKIP_LOCAL_RESOURCES_FLAG = '--skip-local-resources';

/**
 * Name of the option which restricts the local resources update to the given
 * MV3 targets, e.g. `--local-resources=edge-mv3`.
 */
export const LOCAL_RESOURCES_NAME = '--local-resources';

/**
 * Full form of {@link LOCAL_RESOURCES_NAME} carrying the browser list.
 */
export const LOCAL_RESOURCES_OPTION = `${LOCAL_RESOURCES_NAME}=`;

/**
 * Checks whether the value names an MV3 resource target.
 *
 * @param value Candidate value.
 *
 * @returns True when the value is a {@link Mv3AssetsFiltersBrowser}.
 */
const isMv3AssetsFiltersBrowser = (value: string): value is Mv3AssetsFiltersBrowser => (
    (MV3_ASSETS_FILTERS_BROWSERS as readonly string[]).includes(value)
);

/**
 * Resolves the MV3 targets whose local resources must be updated from the CLI
 * arguments.
 *
 * Without options, local resources are updated for every MV3 target. The
 * browser list keeps the declarative rulesets of all targets up to date while
 * refreshing the local script rules only for the listed targets — the
 * expedited auto-build uses it to keep the Chrome package eligible for skip
 * review while still refreshing the Edge local script rules.
 *
 * @param argv Process arguments.
 *
 * @returns Targets to update local resources for; an empty list skips the
 * update entirely, duplicated targets are ignored.
 *
 * @throws Error if the option value is empty, names an unsupported browser, or
 * is combined with {@link SKIP_LOCAL_RESOURCES_FLAG}.
 */
export const resolveLocalResourcesBrowsers = (argv: string[]): readonly Mv3AssetsFiltersBrowser[] => {
    const skip = argv.includes(SKIP_LOCAL_RESOURCES_FLAG);
    const option = argv.find((arg) => arg.startsWith(LOCAL_RESOURCES_OPTION));
    if (!option) {
        const malformed = argv.find((arg) => arg.startsWith(LOCAL_RESOURCES_NAME));
        if (malformed) {
            throw new Error(`Malformed ${malformed}: expected ${LOCAL_RESOURCES_OPTION}<browsers>`);
        }
        return skip ? [] : MV3_ASSETS_FILTERS_BROWSERS;
    }
    if (skip) {
        throw new Error(`${LOCAL_RESOURCES_OPTION}<browsers> cannot be combined with ${SKIP_LOCAL_RESOURCES_FLAG}`);
    }
    const value = option.slice(LOCAL_RESOURCES_OPTION.length);
    const browsers = value.split(',').map((browser) => browser.trim()).filter(Boolean);
    if (browsers.length === 0) {
        throw new Error(`Empty ${LOCAL_RESOURCES_OPTION}<browsers> value`);
    }
    const unsupported = browsers.filter((browser) => !isMv3AssetsFiltersBrowser(browser));
    if (unsupported.length > 0) {
        throw new Error(
            `Unsupported browsers in ${option}: ${unsupported.join(', ')}; `
            + `supported: ${MV3_ASSETS_FILTERS_BROWSERS.join(', ')}`,
        );
    }
    return [...new Set(browsers)] as Mv3AssetsFiltersBrowser[];
};

/**
 * Checks whether the local resources of the target must be updated within the
 * given scope.
 *
 * Targets outside the scope keep their committed local script rules, which is
 * what keeps the Chrome package eligible for the CWS skip review during the
 * expedited auto-build.
 *
 * @param browser MV3 resource target.
 * @param browsers MV3 targets in scope.
 *
 * @returns True when the target is in scope.
 */
export const shouldUpdateLocalResources = (
    browser: Mv3AssetsFiltersBrowser,
    browsers: readonly Mv3AssetsFiltersBrowser[],
): boolean => browsers.includes(browser);

/**
 * Updates bundled script registries for the given MV3 resource targets.
 *
 * @param browsers MV3 targets to update local resources for.
 */
export const updateMv3LocalResources = async (
    browsers: readonly Mv3AssetsFiltersBrowser[],
): Promise<void> => {
    await Promise.all(browsers.map((browser) => updateLocalResourcesForMv3(browser)));
};

/** Updates bundled script registries for all MV3 resource targets. */
export const updateAllMv3LocalResources = async (): Promise<void> => {
    await updateMv3LocalResources(MV3_ASSETS_FILTERS_BROWSERS);
};

/** Extracts unsafe rules into ruleset metadata within the session-rule budget. */
export const excludeAllMv3UnsafeRules = async (): Promise<void> => {
    await Promise.all(MV3_ASSETS_FILTERS_BROWSERS.map((browser) => excludeUnsafeRules({
        dir: DECLARATIVE_FILTERS_DEST.replace('%browser', browser),
        limit: UNSAFE_RULES_LIMIT,
    })));
};
