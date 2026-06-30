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

import { preregisteredDomainScripts } from 'preregistered-scripts-registry';

import { TsWebExtension } from 'tswebextension';

import { logger } from '../../../common/logger';
import { FiltersApi } from '../../api';
import { CommonFilterUtils } from '../../../common/common-filter-utils';

/**
 * Extension-relative prefix for filter assets.
 */
const EXTENSION_FILTERS_SUBDIR = 'filters';

/**
 * Subdirectory within the filters folder where preregistered-domain bundles live.
 */
const PREREGISTERED_SCRIPTS_DIR = 'preregistered-scripts';

/**
 * Namespace passed to {@link TsWebExtension.syncContentScripts} to scope all
 * preregistered-domain registrations. Must be stable across sessions.
 */
const PREREGISTERED_SCRIPTS_NAMESPACE = 'preregistered';

/**
 * Filename of the shared scriptlets bundle loaded before every
 * per-domain bundle. Contains deduplicated scriptlet function
 * definitions and the `window._g` runner.
 */
const SHARED_BUNDLE_FILENAME = 'scriptlets-bundle.js';

/**
 * Returns the extension-relative path for the shared scriptlets bundle.
 *
 * @returns Extension-relative path, e.g. `"filters/preregistered-scripts/scriptlets-bundle.js"`.
 */
const buildSharedBundlePath = (): string => {
    return `${EXTENSION_FILTERS_SUBDIR}/${PREREGISTERED_SCRIPTS_DIR}/${SHARED_BUNDLE_FILENAME}`;
};

/**
 * Converts a domain string into the two URL match patterns used in
 * `content_scripts.matches`.
 *
 * @param domain Domain string, e.g. `"youtube.com"`.
 *
 * @returns Array of two match pattern strings.
 */
const domainToMatchPatterns = (domain: string): string[] => {
    return [`*://${domain}/*`, `*://*.${domain}/*`];
};

/**
 * Returns the extension-relative script path for a (domain, filterId) bundle.
 *
 * @param domain Apex domain string, e.g. `"youtube.com"`.
 * @param filterId Filter ID as a string, e.g. `"14"`.
 *
 * @returns Extension-relative path, e.g. `"filters/preregistered-scripts/youtube.com-14.js"`.
 */
const buildScriptPath = (domain: string, filterId: string): string => {
    return `${EXTENSION_FILTERS_SUBDIR}/${PREREGISTERED_SCRIPTS_DIR}/${domain}-${filterId}.js`;
};

/**
 * Derives the stable `chrome.scripting` registration ID for a (domain, filterId) pair.
 *
 * @param domain Apex domain string, e.g. `"youtube.com"`.
 * @param filterId Filter ID as a string, e.g. `"14"`.
 *
 * @returns Registration ID string, e.g. `"youtube.com_14"`.
 */
const scriptIdForDomainFilter = (domain: string, filterId: string): string => {
    return `${domain}_${filterId}`;
};

/**
 * Manages preregistered content-script registrations for preregistered domains.
 *
 * Scripts registered here use `persistAcrossSessions: true` so they survive
 * browser restarts without needing to be re-registered on startup.
 */
export class PreregisteredScriptsService {
    /**
     * Cache of the last synchronised state.
     *
     * Used to short-circuit {@link sync} when nothing has changed, avoiding
     * unnecessary `chrome.scripting` calls on every debounced `update()`.
     */
    private static lastSyncedKey: string | null = null;

    /**
     * Registers preregistered domains with tswebextension so that the
     * cosmetic API skips dynamic scriptlet injection on those domains,
     * avoiding double execution with the preregistered bundles.
     */
    public static registerDomains(): void {
        TsWebExtension.setPreregisteredScriptDomains(PreregisteredScriptsService.getDomains());
    }

    /**
     * Returns the list of domains that have preregistered-script bundles.
     *
     * @returns Array of domain strings (e.g. `["youtube.com"]`).
     */
    private static getDomains(): string[] {
        return Object.keys(preregisteredDomainScripts);
    }

    /**
     * Synchronises registered preregistered-domain content scripts with the
     * current enabled-filter set.
     *
     * Each (domain, filterId) pair maps to its own `chrome.scripting`
     * registration, so disabling a single filter unregisters only that
     * filter's scripts — other filters' scripts for the same domain are
     * left untouched.
     *
     * When `filteringEnabled` is `false` (AdGuard is paused), all
     * preregistered scripts are unregistered by passing an empty
     * desired set to the sync call.
     *
     * Short-circuits when the enabled-filter set is identical to the
     * previous call, avoiding redundant `chrome.scripting` work.
     *
     * @param filteringEnabled Whether global filtering is enabled.
     */
    public static async sync(filteringEnabled: boolean): Promise<void> {
        // When filtering is paused, pass an empty set to unregister all
        // preregistered scripts.
        const enabledSet = filteringEnabled
            ? new Set(
                FiltersApi.getEnabledFilters()
                    .filter((id) => CommonFilterUtils.isCommonFilter(id))
                    .map(String),
            )
            : new Set<string>();

        const syncKey = `${filteringEnabled}|${[...enabledSet].sort((a, b) => Number(a) - Number(b)).join(',')}`;
        if (syncKey === PreregisteredScriptsService.lastSyncedKey) {
            return;
        }
        PreregisteredScriptsService.lastSyncedKey = syncKey;

        const allScripts: chrome.scripting.RegisteredContentScript[] = [];

        for (const [domain, filterIds] of Object.entries(preregisteredDomainScripts)) {
            const scripts: chrome.scripting.RegisteredContentScript[] = filterIds
                .filter((filterId) => enabledSet.has(filterId))
                .map((filterId) => ({
                    id: scriptIdForDomainFilter(domain, filterId),
                    js: [
                        buildSharedBundlePath(),
                        buildScriptPath(domain, filterId),
                    ],
                    matches: domainToMatchPatterns(domain),
                    runAt: 'document_start',
                    world: 'MAIN',
                    allFrames: true,
                    persistAcrossSessions: true,
                }));

            allScripts.push(...scripts);
        }

        try {
            await TsWebExtension.syncContentScripts(PREREGISTERED_SCRIPTS_NAMESPACE, allScripts);
        } catch (e) {
            logger.error('[ext.PreregisteredScriptsService.sync]: Failed to sync preregistered scripts', e);
        }
    }
}
