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

/* eslint-disable no-console */

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { NEWLINE_CHAR_UNIX } from '../../../Extension/src/common/constants';

import { type DomainRules, type DomainScriptlets } from './filter-collector';
import { REGISTRY_FILENAME } from './constants';

export type PreregisteredScriptsRegistry = Record<string, string[]>;

/**
 * Builds the preregistered-scripts registry from collected ruleset data.
 */
export const buildRegistry = (
    domainRules: DomainRules,
    domainScriptlets?: DomainScriptlets,
): PreregisteredScriptsRegistry => {
    const registry: PreregisteredScriptsRegistry = {};
    const domainFilterIds = new Map<string, Set<string>>();

    const collect = (source: Map<string, Map<number, unknown>>) => {
        source.forEach((filterMap, domain) => {
            let ids = domainFilterIds.get(domain);
            if (!ids) {
                ids = new Set();
                domainFilterIds.set(domain, ids);
            }
            filterMap.forEach((_rules, filterId) => {
                ids.add(String(filterId));
            });
        });
    };

    collect(domainRules);
    if (domainScriptlets) {
        collect(domainScriptlets);
    }

    domainFilterIds.forEach((filterIds, domain) => {
        if (filterIds.size > 0) {
            registry[domain] = [...filterIds].sort((a, b) => Number(a) - Number(b));
        }
    });

    return registry;
};

/**
 * Writes the registry as an ES module to disk.
 */
export const writeRegistry = async (
    domainRules: DomainRules,
    domainScriptlets: DomainScriptlets,
    outputDir: string,
): Promise<void> => {
    const registry = buildRegistry(domainRules, domainScriptlets);

    const content = [
        '// AUTO-GENERATED — do not edit manually. Re-run pnpm resources:mv3 to update.',
        `export const preregisteredDomainScripts = ${JSON.stringify(registry, null, '\t')};`,
        '',
    ].join(NEWLINE_CHAR_UNIX);

    const outputPath = path.join(outputDir, REGISTRY_FILENAME);

    await fs.writeFile(outputPath, content, 'utf-8');
    console.log(`[generate-preregistered-domain-bundles] Wrote registry.js (${Object.keys(registry).length} domains)`);
};
