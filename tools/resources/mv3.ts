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
 * Value of {@link LOCAL_RESOURCES_OPTION} which skips the local resources
 * update entirely, e.g. during the expedited Chrome Web Store filter-update
 * flow.
 */
export const LOCAL_RESOURCES_NONE = 'none';

/**
 * Name of the option which restricts the local resources update to the given
 * MV3 targets, e.g. `--local-resources=edge-mv3`, or skips it entirely with
 * `--local-resources=none`.
 */
export const LOCAL_RESOURCES_NAME = '--local-resources';

/**
 * Full form of {@link LOCAL_RESOURCES_NAME} carrying the browser list or
 * {@link LOCAL_RESOURCES_NONE}.
 */
export const LOCAL_RESOURCES_OPTION = `${LOCAL_RESOURCES_NAME}=`;

/**
 * Accepted values of {@link LOCAL_RESOURCES_OPTION} as spelled out in the
 * error messages.
 */
const LOCAL_RESOURCES_VALUES = `<browsers|${LOCAL_RESOURCES_NONE}>`;

/**
 * Option removed in favour of `--local-resources=none`. Kept only to fail fast
 * when a stale caller still passes it: it would otherwise select the default
 * full update, the opposite of the old intent.
 */
const REMOVED_SKIP_LOCAL_RESOURCES_FLAG = '--skip-local-resources';

/**
 * Checks whether the value names an MV3 resource target.
 *
 * @param value Candidate value.
 *
 * @returns True when the value is a {@link Mv3AssetsFiltersBrowser}.
 */
const isMv3AssetsFiltersBrowser = (value: string): value is Mv3AssetsFiltersBrowser => {
    return (MV3_ASSETS_FILTERS_BROWSERS as readonly string[]).includes(value);
};

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
 * @returns Targets to update local resources for; {@link LOCAL_RESOURCES_NONE}
 * returns an empty list which skips the update entirely, duplicated targets are
 * ignored.
 *
 * @throws Error if the option is malformed or repeated, if its value is empty,
 * mixes {@link LOCAL_RESOURCES_NONE} with targets, names an unsupported
 * browser, or when the removed {@link REMOVED_SKIP_LOCAL_RESOURCES_FLAG} is
 * still passed.
 */
export const resolveLocalResourcesBrowsers = (argv: string[]): readonly Mv3AssetsFiltersBrowser[] => {
    if (argv.includes(REMOVED_SKIP_LOCAL_RESOURCES_FLAG)) {
        throw new Error(
            `${REMOVED_SKIP_LOCAL_RESOURCES_FLAG} was removed: use ${LOCAL_RESOURCES_OPTION}${LOCAL_RESOURCES_NONE} instead`,
        );
    }
    // Consider every occurrence: `Array.prototype.find` would silently drop a
    // repeated option, and the run would update fewer targets than typed.
    const occurrences = argv.filter((arg) => arg.startsWith(LOCAL_RESOURCES_NAME));
    const malformed = occurrences.find((arg) => !arg.startsWith(LOCAL_RESOURCES_OPTION));
    if (malformed) {
        throw new Error(`Malformed ${malformed}: expected ${LOCAL_RESOURCES_OPTION}${LOCAL_RESOURCES_VALUES}`);
    }
    if (occurrences.length > 1) {
        throw new Error(`Duplicate ${LOCAL_RESOURCES_NAME} option: ${occurrences.join(' ')}`);
    }
    const [option] = occurrences;
    if (option === undefined) {
        return MV3_ASSETS_FILTERS_BROWSERS;
    }
    const value = option.slice(LOCAL_RESOURCES_OPTION.length);
    const browsers = value.split(',').map((browser) => browser.trim()).filter(Boolean);
    if (browsers.length === 0) {
        throw new Error(`Empty ${LOCAL_RESOURCES_OPTION}${LOCAL_RESOURCES_VALUES} value`);
    }
    // Check the sentinel on the normalized list: `--local-resources=none,` is
    // the only value once trimmed and split.
    if (browsers.includes(LOCAL_RESOURCES_NONE)) {
        if (browsers.length > 1) {
            throw new Error(`${LOCAL_RESOURCES_NONE} must be the only value of ${LOCAL_RESOURCES_OPTION}`);
        }
        return [];
    }
    if (!browsers.every(isMv3AssetsFiltersBrowser)) {
        const unsupported = browsers.filter((browser) => !isMv3AssetsFiltersBrowser(browser));
        throw new Error(
            `Unsupported browsers in ${option}: ${unsupported.join(', ')}; `
            + `supported: ${MV3_ASSETS_FILTERS_BROWSERS.join(', ')}`,
        );
    }
    return [...new Set(browsers)];
};

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
