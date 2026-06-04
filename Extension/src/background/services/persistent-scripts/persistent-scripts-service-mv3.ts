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

import { type DomainScriptEntry } from '../../../../../tools/resources/generate-critical-domain-bundles';
import { criticalDomainScripts } from '../../../../filters/chromium-mv3/critical-scripts/persistent-scripts-registry';
import { logger } from '../../../common/logger';

/** Stable ID prefix for all critical-domain content script registrations. */
const SCRIPT_ID_PREFIX = 'critical_';

/**
 * Derives the stable `chrome.scripting` registration ID for a given domain.
 *
 * @param domain Apex domain string.
 *
 * @returns Registration ID string.
 */
const scriptIdForDomain = (domain: string): string => `${SCRIPT_ID_PREFIX}${domain}`;

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
     * A domain script is active when at least one of its associated filter IDs
     * appears in `enabledFilterIds`. Scripts that should no longer be active
     * are unregistered; newly-active scripts are registered.
     * Already-correct registrations are left untouched.
     *
     * @param enabledFilterIds Array of currently-enabled AdGuard filter IDs.
     */
    static async sync(enabledFilterIds: number[]): Promise<void> {
        const enabledSet = new Set(enabledFilterIds);

        // Determine which domains should have active scripts
        const shouldBeActive = new Set<string>();

        const scripts = criticalDomainScripts as Record<string, DomainScriptEntry>;

        Object.entries(scripts).forEach(([domain, entry]) => {
            if (entry.filterIds.some((id) => enabledSet.has(id))) {
                shouldBeActive.add(domain);
            }
        });

        const allRegistered = await chrome.scripting.getRegisteredContentScripts();
        const currentIds = new Set(
            allRegistered
                .map((s) => s.id)
                .filter((id) => id.startsWith(SCRIPT_ID_PREFIX)),
        );

        const toRegister: chrome.scripting.RegisteredContentScript[] = [];

        shouldBeActive.forEach((domain) => {
            const id = scriptIdForDomain(domain);

            if (!currentIds.has(id)) {
                const entry = scripts[domain]!;
                toRegister.push({
                    id,
                    js: entry.js,
                    matches: entry.matches,
                    runAt: 'document_start',
                    world: 'MAIN',
                    persistAcrossSessions: true,
                });
            }
        });

        // Script IDs to remove (currently registered but should not be active)
        const toRemoveIds: string[] = [];

        currentIds.forEach((id) => {
            const domain = id.slice(SCRIPT_ID_PREFIX.length);

            if (!shouldBeActive.has(domain)) {
                toRemoveIds.push(id);
            }
        });

        if (toRemoveIds.length > 0) {
            logger.debug(`[ext.PersistentScriptsService.sync]: Unregistering ${toRemoveIds.length} domain script(s): ${toRemoveIds.join(', ')}`);
            await chrome.scripting.unregisterContentScripts({ ids: toRemoveIds });
        }

        if (toRegister.length > 0) {
            logger.debug(`[ext.PersistentScriptsService.sync]: Registering ${toRegister.length} domain script(s): ${toRegister.map((s) => s.id).join(', ')}`);
            await chrome.scripting.registerContentScripts(toRegister);
        }
    }
}
