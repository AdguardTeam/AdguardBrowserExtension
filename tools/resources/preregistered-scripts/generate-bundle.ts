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

import {
    COORDINATION_KEY,
    getRuleFilename,
    MANIFEST_FILENAME,
    PREREGISTERED_SCRIPTS_DIR,
    type PreregisteredScriptsManifest,
} from '@adguard/tswebextension/mv3/preregistered-scripts/hasher';

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
    writeCleanupFile,
} from './code-generators';

/**
 * Reads the previous generation's manifest.
 *
 * @param outputDir Current on-disk output directory.
 *
 * @returns Parsed manifest, or `null` when missing or malformed.
 */
const readPreviousManifest = async (outputDir: string): Promise<PreregisteredScriptsManifest | null> => {
    try {
        const raw = await fs.readFile(path.join(outputDir, MANIFEST_FILENAME), 'utf-8');
        const parsed = JSON.parse(raw) as PreregisteredScriptsManifest;

        return parsed && Array.isArray(parsed.hashes) ? parsed : null;
    } catch {
        return null;
    }
};

/**
 * Copies previous-generation per-rule files into the new output: persisted
 * content-script registrations from the previous extension version still
 * reference them. Applies for one release: retained files are absent from
 * the new manifest's `hashes`, so the next build does not re-retain them.
 * Only files dropped from the new rule set are copied — the bundle, the
 * cleanup file and surviving per-rule files are regenerated under the same
 * stable names.
 *
 * @param previous Previous generation's manifest.
 * @param rules New rule set (keys are the new hashes).
 * @param outputDir Previous output directory (source of the old files).
 * @param tempDir New output directory being assembled.
 */
const retainPreviousGenerationFiles = async (
    previous: PreregisteredScriptsManifest,
    rules: ReadonlyMap<string, unknown>,
    outputDir: string,
    tempDir: string,
): Promise<void> => {
    const copies = previous.hashes
        .filter((hash) => !rules.has(hash))
        .map((hash) => {
            const filename = getRuleFilename(hash);

            // A missing retained file degrades to dynamic injection for that rule.
            return fs.copyFile(path.join(outputDir, filename), path.join(tempDir, filename))
                .catch((e) => {
                    // eslint-disable-next-line no-console
                    console.warn(`[generate-preregistered-domain-bundles] Could not retain ${filename}: ${e}`);
                });
        });

    await Promise.all(copies);
};

/**
 * Removes stale temp directories left by crashed previous generations.
 *
 * @param filtersFolder Parent folder of the output directory.
 */
const sweepStaleTempDirs = async (filtersFolder: string): Promise<void> => {
    const prefix = `${PREREGISTERED_SCRIPTS_DIR}.tmp-`;
    const entries = await fs.readdir(filtersFolder, { withFileTypes: true });

    await Promise.all(entries
        .filter((entry) => entry.isDirectory() && entry.name.startsWith(prefix))
        .map((entry) => fs.rm(path.join(filtersFolder, entry.name), { recursive: true, force: true })));
};

/**
 * Writes the manifest describing the generation's artifacts.
 *
 * @param hashes Hashes of this generation's per-rule files.
 * @param outputDir Directory to write the manifest into.
 */
const writeManifest = async (
    hashes: string[],
    outputDir: string,
): Promise<void> => {
    const manifest: PreregisteredScriptsManifest = {
        hashes: [...hashes].sort(),
    };

    await fs.writeFile(
        path.join(outputDir, MANIFEST_FILENAME),
        JSON.stringify(manifest),
        'utf-8',
    );
};

/**
 * Generates preregistered-script bundles and the domains list for a target
 * MV3 browser, into `filters/<browser>/preregistered-scripts/`:
 *
 * 1. `scriptlets-bundle.js` — scriptlet functions + runner.
 * 2. `{hash}.js` — one file per unique rule (scriptlet call or
 *    guarded JS body).
 * 3. `cleanup.js` — deletes the coordination `window` property;
 *    registered last in each domain's `js` array.
 * 4. `domains.js` — ES module with the domains that have blocking rules.
 * 5. `manifest.json` — current hashes, read at runtime.
 *
 * Dropped per-rule files of the previous generation are retained for one
 * release because persisted content-script registrations still reference
 * them.
 *
 * @param browser Target MV3 browser identifier (e.g. `"chromium-mv3"`).
 *
 * @returns Promise that resolves when all files have been written.
 */
export const generatePreregisteredDomainBundles = async (
    browser: Mv3AssetsFiltersBrowser,
): Promise<void> => {
    const filtersFolder = FILTERS_DEST.replace('%browser', browser);
    const outputDir = path.join(filtersFolder, PREREGISTERED_SCRIPTS_DIR);
    const declarativeFolder = DECLARATIVE_FILTERS_DEST.replace('%browser', browser);

    await sweepStaleTempDirs(filtersFolder);

    const tempDir = `${outputDir}.tmp-${process.pid}`;
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });

    try {
        // 1. Collect rules from all rulesets.
        const collector = new ScriptletCollector(declarativeFolder);
        const {
            rules,
            scriptletNames,
            domains,
        } = await collector.collect();

        const coordinationKey = COORDINATION_KEY;

        // 2. Build and write the shared scriptlets bundle.
        await writeSharedBundle(scriptletNames, tempDir, coordinationKey);

        // 3. Write per-hash files (one per unique rule).
        await writePerHashFiles(rules, tempDir, coordinationKey);

        // 4. Retain previous-generation files still referenced by persisted
        // content-script registrations from the previous extension version.
        const previousManifest = await readPreviousManifest(outputDir);

        if (previousManifest) {
            await retainPreviousGenerationFiles(previousManifest, rules, outputDir, tempDir);
        }

        // 5. Write the cleanup file that deletes the coordination property
        // before any page script can run.
        await writeCleanupFile(coordinationKey, tempDir);

        // 6. Write the domains list.
        await writeDomainsList(domains, tempDir);

        // 7. Write the manifest describing this generation's artifacts.
        await writeManifest([...rules.keys()], tempDir);

        // 8. Replace the old output with the newly generated one.
        await fs.rm(outputDir, { recursive: true, force: true });
        await fs.rename(tempDir, outputDir);
    } catch (error) {
        await fs.rm(tempDir, { recursive: true, force: true });
        throw error;
    }
};
