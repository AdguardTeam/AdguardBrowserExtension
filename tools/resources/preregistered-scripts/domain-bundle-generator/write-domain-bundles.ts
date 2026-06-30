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
import path from 'node:path';

import { getBundleFileName } from '../constants';
import { writeBundle } from '../writeHelpers';

import { compileDomainBundle } from './domain-bundle-generator';

/* eslint-disable no-console */

/**
 * Merges domain rules and scriptlets into a map of domain IDs to sets of filter IDs.
 */
const mergeDomainIds = (
    domainRules: Map<string, Map<number, unknown>>,
    domainScriptlets: Map<string, Map<number, unknown>>,
): Map<string, Set<number>> => {
    const allIds = new Map<string, Set<number>>();

    /**
     * Collects filter IDs from a single accumulator source into `allIds`.
     * Used for both domainRules (JS rules) and domainScriptlets (scriptlets).
     *
     * @param src Either `domainRules` or `domainScriptlets` — both have the
     *   same outer shape: `Map<domain, Map<filterId, ...>>`.
     */
    const merge = (src: Map<string, Map<number, unknown>>) => {
        src.forEach((fm, domain) => {
            const ids = allIds.get(domain) || new Set<number>();
            if (!allIds.has(domain)) {
                allIds.set(domain, ids);
            }
            fm.forEach((_, filterId) => ids.add(filterId));
        });
    };

    merge(domainRules);
    merge(domainScriptlets);

    return allIds;
};

/**
 * Writes per-domain bundles for every (domain, filterId) pair that has rules.
 *
 * @param domainRules JS rules grouped by domain and filter.
 * @param domainScriptlets Scriptlets grouped by domain and filter.
 * @param outputDir Directory to write bundles into.
 */
export const writeDomainBundles = async (
    domainRules: Map<string, Map<number, Set<string>>>,
    domainScriptlets: Map<string, Map<number, Record<string, Set<string>>>>,
    outputDir: string,
): Promise<void> => {
    const allIds = mergeDomainIds(domainRules, domainScriptlets);

    for (const [domain, filterIds] of allIds) {
        for (const filterId of filterIds) {
            const jsRules = domainRules.get(domain)?.get(filterId);
            const scriptletMap = domainScriptlets.get(domain)?.get(filterId);
            const nScriptlets = scriptletMap
                ? Object.values(scriptletMap).reduce((s, a) => s + a.size, 0)
                : 0;
            const total = (jsRules?.size ?? 0) + nScriptlets;
            if (total === 0) {
                continue;
            }

            const content = await compileDomainBundle(jsRules ?? new Set(), scriptletMap ?? undefined);
            if (!content) {
                continue;
            }

            const fileName = getBundleFileName(domain, filterId);
            await writeBundle(content, path.join(outputDir, fileName));

            const kb = (Buffer.byteLength(content, 'utf-8') / 1024).toFixed(1);
            console.log(`[generate-preregistered-domain-bundles] Wrote ${fileName} (${kb} KB)`);
        }
    }
};
