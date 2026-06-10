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

import { criticalDomainScripts } from '../../../../filters/chromium-mv3/critical-scripts/registry.js';
import { logger } from '../../../common/logger';

/** Stable ID prefix for all critical-domain content script registrations. */
const SCRIPT_ID_PREFIX = 'critical_';
const SCRIPT_ID_SEPARATOR = '_';

/** Subdirectory within the filters folder where critical-domain bundles live. */
const CRITICAL_SCRIPTS_DIR = 'critical-scripts';

/** Extension-relative prefix for filter assets. */
const EXTENSION_FILTERS_SUBDIR = 'filters';

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
 * @returns Extension-relative path, e.g. `"filters/critical-scripts/youtube.com-14.js"`.
 */
const buildScriptPath = (domain: string, filterId: string): string => {
    return `${EXTENSION_FILTERS_SUBDIR}/${CRITICAL_SCRIPTS_DIR}/${domain}-${filterId}.js`;
};

/**
 * Derives the stable `chrome.scripting` registration ID for a (domain, filterId) pair.
 *
 * @param domain Apex domain string, e.g. `"youtube.com"`.
 * @param filterId Filter ID as a string, e.g. `"14"`.
 *
 * @returns Registration ID string, e.g. `"critical_youtube.com_14"`.
 */
const scriptIdForDomainFilter = (domain: string, filterId: string): string => {
    return `${SCRIPT_ID_PREFIX}${domain}${SCRIPT_ID_SEPARATOR}${filterId}`;
};

/**
 * Manages persistent content-script registrations for critical domains.
 *
 * Scripts registered here use `persistAcrossSessions: true` so they survive
 * browser restarts without needing to be re-registered on startup.
 */
export class PersistentScriptsService {
    /**
     * Synchronises registered critical-domain content scripts with the given
     * set of enabled filter IDs.
     *
     * Each (domain, filterId) pair maps to its own `chrome.scripting`
     * registration, so disabling a single filter unregisters only that
     * filter's scripts — other filters' scripts for the same domain are
     * left untouched.
     *
     * @param enabledFilterIds Array of currently-enabled AdGuard filter IDs.
     */
    static async sync(enabledFilterIds: number[]): Promise<void> {
        const enabledSet = new Set(enabledFilterIds.map(String));

        // Build the set of (scriptId -> RegisteredContentScript) that should be active
        const shouldBeActive = new Map<string, chrome.scripting.RegisteredContentScript>();

        Object.entries(criticalDomainScripts).forEach(([domain, filterIds]) => {
            filterIds.forEach((filterId) => {
                if (!enabledSet.has(filterId)) {
                    return;
                }

                const id = scriptIdForDomainFilter(domain, filterId);

                shouldBeActive.set(id, {
                    id,
                    js: [buildScriptPath(domain, filterId)],
                    matches: domainToMatchPatterns(domain),
                    runAt: 'document_start',
                    world: 'MAIN',
                    persistAcrossSessions: true,
                });
            });
        });

        // Current registrations that belong to this service
        const registeredScripts = await chrome.scripting.getRegisteredContentScripts();
        const currentIds = new Set(
            registeredScripts
                .map((s) => s.id)
                .filter((id) => id.startsWith(SCRIPT_ID_PREFIX)),
        );

        const toRemoveIds = [...currentIds].filter((id) => !shouldBeActive.has(id));
        const toRegister = [...shouldBeActive.values()].filter((s) => !currentIds.has(s.id));

        logger.info(`[ext.PersistentScriptsService.sync]: critical-domain-bundle: Unregistering ${toRemoveIds.length} script(s): ${toRemoveIds.join(', ')}`);
        if (toRemoveIds.length > 0) {
            await chrome.scripting.unregisterContentScripts({ ids: toRemoveIds });
        }

        logger.info(`[ext.PersistentScriptsService.sync]: critical-domain-bundle: Registering ${toRegister.length} script(s): ${toRegister.map((s) => s.id).join(', ')}`);
        if (toRegister.length > 0) {
            await chrome.scripting.registerContentScripts(toRegister);
        }
    }
}
