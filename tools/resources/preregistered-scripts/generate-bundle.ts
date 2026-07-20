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

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { PREREGISTERED_SCRIPTS_DIR } from '@adguard/tswebextension/mv3/preregistered-scripts';

import {
    FILTERS_DEST,
    DECLARATIVE_FILTERS_DEST,
    type Mv3AssetsFiltersBrowser,
} from '../../constants';

import { ScriptletCollector } from './scriptlet-collector';
import {
    writeSharedBundle,
    writePerHashFiles,
    writeDomainsList,
} from './code-generators';

/**
 * Generates preregistered-script bundles and domains list for a target MV3 browser.
 *
 * Output files (in `filters/<browser>/preregistered-scripts/`):
 *
 * 1. `scriptlets-bundle.js` — shared bundle with all scriptlet function
 *    definitions and the `window._ag` runner.
 * 2. `{hash}.js` — one file per unique rule (scriptlet invocation or JS rule).
 *    Scriptlets: contains `_ag.r(name, source, args, hash)`.
 *    JS rules: contains the rule body wrapped in a dedup guard.
 * 3. `domains.js` — ES module exporting `preregisteredDomains` (string[])
 *    of domains that have at least one blocking rule.
 *
 * @param browser Target MV3 browser identifier (e.g. `"chrome-mv3"`).
 *
 * @returns Promise that resolves when all files have been written.
 */
export const generatePreregisteredDomainBundles = async (
    browser: Mv3AssetsFiltersBrowser,
): Promise<void> => {
    const filtersFolder = FILTERS_DEST.replace('%browser', browser);
    const outputDir = path.join(filtersFolder, PREREGISTERED_SCRIPTS_DIR);
    const declarativeFolder = DECLARATIVE_FILTERS_DEST.replace('%browser', browser);

    const tempDir = `${outputDir}.tmp-${process.pid}`;
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });

    try {
        // 1. Collect rules from all rulesets.
        const collector = new ScriptletCollector(declarativeFolder);
        const { rules, scriptletNames, domains } = await collector.collect();

        // 2. Build and write the shared scriptlets bundle.
        await writeSharedBundle(scriptletNames, tempDir);

        // 3. Write per-hash files (one per unique rule).
        await writePerHashFiles(rules, tempDir);

        // 4. Write the domains list.
        await writeDomainsList(domains, tempDir);

        // 5. Replace the old output with the newly generated one.
        await fs.rm(outputDir, { recursive: true, force: true });
        await fs.rename(tempDir, outputDir);
    } catch (error) {
        await fs.rm(tempDir, { recursive: true, force: true });
        throw error;
    }
};
