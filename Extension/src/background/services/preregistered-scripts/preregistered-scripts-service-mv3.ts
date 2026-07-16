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

import { preregisteredDomains } from 'preregistered-scripts-registry';

import { CosmeticOption } from '@adguard/tsurlfilter';

import { TsWebExtension } from 'tswebextension';

import { PREREGISTERED_SCRIPTS_DIR, SHARED_BUNDLE_FILENAME } from '../../../common/preregistered-scripts/constants';
import { computeJsRuleHash, computeScriptletHash } from '../../../common/preregistered-scripts/hasher';
import { logger } from '../../../common/logger';
import { engine } from '../../engine';

/** Extension-relative prefix for filter assets. */
const EXTENSION_FILTERS_SUBDIR = 'filters';

/** Namespace for {@link TsWebExtension.syncContentScripts}. Must be stable across sessions. */
const PREREGISTERED_SCRIPTS_NAMESPACE = 'preregistered';

/** @returns Extension-relative path to the shared scriptlets bundle. */
const getSharedBundlePath = (): string => {
    return `${EXTENSION_FILTERS_SUBDIR}/${PREREGISTERED_SCRIPTS_DIR}/${SHARED_BUNDLE_FILENAME}`;
};

/**
 * @param hash SHA-256 hash of the scriptlet name + args (or JS rule body).
 *
 * @returns Extension-relative path to the per-hash scriptlet file.
 */
const getScriptPath = (hash: string): string => {
    return `${EXTENSION_FILTERS_SUBDIR}/${PREREGISTERED_SCRIPTS_DIR}/${hash}.js`;
};

/**
 * Converts a domain into URL match patterns for `matches`/`excludeMatches`.
 *
 * @param domain Domain string.
 *
 * @returns Two match patterns: `*://domain/*` and `*://*.domain/*`.
 */
const domainToMatchPatterns = (domain: string): string[] => {
    return [`*://${domain}/*`, `*://*.${domain}/*`];
};

/**
 * Finds the longest domain in the list that is a parent of `domain`.
 *
 * @param domain Domain to find parent for.
 * @param allDomains All preregistered domains.
 *
 * @returns Closest parent, or `null` if none.
 */
const findClosestParentDomain = (
    domain: string,
    allDomains: readonly string[],
): string | null => {
    let parent: string | null = null;
    for (const d of allDomains) {
        if (d !== domain && domain.endsWith(`.${d}`)) {
            if (parent === null || d.length > parent.length) {
                parent = d;
            }
        }
    }

    return parent;
};

/**
 * @returns `true` if both sets contain the same elements.
 */
const setsEqual = <T>(a: Set<T>, b: Set<T>): boolean => {
    if (a.size !== b.size) {
        return false;
    }
    for (const item of a) {
        if (!b.has(item)) {
            return false;
        }
    }

    return true;
};

/**
 * Manages preregistered content-script registrations for preregistered domains.
 *
 * Scripts use `persistAcrossSessions: true` so they survive browser restarts.
 *
 * Build-time (`tools/resources/preregistered-scripts/`) generates per-rule
 * `{hash}.js` files, a shared `scriptlets-bundle.js`, and `domains.js` listing
 * domains that have rules.
 *
 * At runtime, this service queries the engine per domain to get applicable
 * cosmetic rules, computes their hashes, and registers content scripts with
 * wildcard `matches` and `excludeMatches` for subdomains with different rule
 * sets. Apex domains cover all subdomains via wildcards; subdomains with
 * exceptions or extra rules get their own registration.
 */
export class PreregisteredScriptsService {
    /**
     * Registers preregistered domains with tswebextension to skip dynamic scriptlet injection.
     */
    public static registerDomains(): void {
        TsWebExtension.setPreregisteredScriptDomains(preregisteredDomains);
    }

    /**
     * Synchronises preregistered content scripts with the current engine state.
     *
     * All scripts are unregistered when filtering is disabled. The sync call
     * diffs against current browser registrations, so repeated calls with same
     * state are safe.
     *
     * @param filteringEnabled Whether global filtering is enabled.
     */
    public static async sync(filteringEnabled: boolean): Promise<void> {
        let scripts: chrome.scripting.RegisteredContentScript[] = [];

        if (filteringEnabled) {
            scripts = await PreregisteredScriptsService.buildDomainScripts();
        }

        try {
            await TsWebExtension.syncContentScripts(PREREGISTERED_SCRIPTS_NAMESPACE, scripts);
        } catch (e) {
            logger.error('[ext.PreregisteredScriptsService.sync]: Failed to sync preregistered scripts', e);
        }
    }

    /**
     * Builds MAIN-world content-script descriptors with wildcard `matches`
     * and `excludeMatches` for subdomains with different rule sets.
     *
     * @returns Array of content-script descriptors.
     */
    private static async buildDomainScripts(): Promise<chrome.scripting.RegisteredContentScript[]> {
        const scripts: chrome.scripting.RegisteredContentScript[] = [];
        const sharedBundlePath = getSharedBundlePath();
        const allDomains = preregisteredDomains;

        // Pre-compute hashes for all domains
        const hashCache = new Map<string, Set<string>>();
        for (const domain of allDomains) {
            const hashes = await PreregisteredScriptsService.getDomainRuleHashes(domain);
            hashCache.set(domain, hashes);
        }

        for (const domain of allDomains) {
            const domainHashes = hashCache.get(domain)!;

            if (domainHashes.size === 0) {
                continue;
            }

            // Skip if same hashes as closest parent (parent's wildcard covers it)
            const parent = findClosestParentDomain(domain, allDomains);
            if (parent && setsEqual(domainHashes, hashCache.get(parent)!)) {
                continue;
            }

            // Find subdomains with different hash sets → excludeMatches
            const excludeMatches: string[] = [];
            for (const other of allDomains) {
                if (other === domain || !other.endsWith(`.${domain}`)) {
                    continue;
                }
                const otherHashes = hashCache.get(other)!;
                if (!setsEqual(otherHashes, domainHashes)) {
                    excludeMatches.push(...domainToMatchPatterns(other));
                }
            }

            const js = [sharedBundlePath, ...[...domainHashes].map(getScriptPath)];

            scripts.push({
                id: domain,
                js,
                matches: domainToMatchPatterns(domain),
                excludeMatches: excludeMatches.length > 0 ? excludeMatches : undefined,
                runAt: 'document_start',
                world: 'MAIN',
                allFrames: true,
                persistAcrossSessions: true,
            });
        }

        return scripts;
    }

    /**
     * Queries the engine for cosmetic rules applicable to `domain` and computes
     * their hashes.
     *
     * @param domain Domain string.
     *
     * @returns Set of rule hash strings.
     */
    private static async getDomainRuleHashes(domain: string): Promise<Set<string>> {
        const url = `https://${domain}/`;
        const cosmeticResult = engine.api.getCosmeticResult(url, CosmeticOption.CosmeticOptionJS);
        const rules = cosmeticResult.JS.getRules();

        const hashes = new Set<string>();

        for (const rule of rules) {
            try {
                if (rule.isScriptlet) {
                    const data = rule.getScriptletData();
                    if (!data) {
                        throw new Error('getScriptletData() returned null');
                    }
                    const hash = await computeScriptletHash(data.params.name, data.params.args);
                    hashes.add(hash);
                } else {
                    const content = rule.getContent();
                    const hash = await computeJsRuleHash(content);
                    hashes.add(hash);
                }
            } catch (e) {
                logger.warn(
                    `[ext.PreregisteredScriptsService.getDomainRuleHashes]: Failed to hash rule for domain ${domain}`,
                    e,
                );
            }
        }

        return hashes;
    }
}
