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

import { MANIFEST_FILENAME, PREREGISTERED_SCRIPTS_DIR } from '@adguard/tswebextension/mv3/preregistered-scripts/hasher';

import {
    FILTERS_DEST,
    DECLARATIVE_FILTERS_DEST,
    type Mv3AssetsFiltersBrowser,
} from '../../constants';

import { ScriptletCollector } from './scriptlet-collector';
import { generateCoordinationKey } from './code-generators/coordination-key';
import {
    writeSharedBundle,
    writePerHashFiles,
    writeDomainsList,
    writeCleanupFile,
} from './code-generators';

/** Shape of the `manifest.json` written next to the generated artifacts. */
interface PreregisteredScriptsManifest {
    /** Coordination key baked into this generation's shared bundle. */
    coordinationKey: string;

    /** Hashes of this generation's per-rule files. */
    hashes: string[];
}

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
 * Copies previous-generation per-hash files absent from the new rule set
 * into the new output: persisted content-script registrations from the
 * previous extension version still reference them. Applies only while both
 * generations share the coordination key.
 *
 * @param previous Previous generation's manifest.
 * @param rules New rule set (keys are the new hashes).
 * @param coordinationKey This generation's coordination key.
 * @param outputDir Previous output directory (source of the old files).
 * @param tempDir New output directory being assembled.
 */
const retainPreviousGenerationFiles = async (
    previous: PreregisteredScriptsManifest,
    rules: ReadonlyMap<string, unknown>,
    coordinationKey: string,
    outputDir: string,
    tempDir: string,
): Promise<void> => {
    if (previous.coordinationKey !== coordinationKey) {
        return;
    }

    await Promise.all(previous.hashes.map(async (hash) => {
        if (rules.has(hash)) {
            return;
        }

        await fs.copyFile(path.join(outputDir, `${hash}.js`), path.join(tempDir, `${hash}.js`));
    }));
};

/**
 * Writes the manifest describing the generation's artifacts.
 *
 * @param coordinationKey This generation's coordination key.
 * @param hashes Hashes of this generation's per-rule files.
 * @param outputDir Directory to write the manifest into.
 */
const writeManifest = async (
    coordinationKey: string,
    hashes: string[],
    outputDir: string,
): Promise<void> => {
    const manifest: PreregisteredScriptsManifest = {
        coordinationKey,
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
 * 1. `scriptlets-bundle.js` — scriptlet functions + coordination-key runner.
 * 2. `{hash}.js` — one file per unique rule (scriptlet call or guarded JS body).
 * 3. `cleanup.js` — reassigns the coordination binding to `undefined`;
 *    registered last in each domain's `js` array.
 * 4. `domains.js` — ES module with the domains that have blocking rules.
 * 5. `manifest.json` — coordination key plus current hashes, read at
 *    runtime.
 *
 * Previous-generation per-hash files dropped from the rule set are retained
 * for one release.
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

        // 2. Deterministic coordination key (derived from the scriptlets
        // library version), shared by the bundle below, the per-hash files,
        // and the cleanup file.
        const coordinationKey = generateCoordinationKey();

        // 3. Build and write the shared scriptlets bundle.
        await writeSharedBundle(scriptletNames, tempDir, coordinationKey);

        // 4. Write per-hash files (one per unique rule).
        await writePerHashFiles(rules, tempDir, coordinationKey);

        // 5. Retain previous-generation per-hash files still referenced by
        // persisted content-script registrations from the previous extension
        // version. Retained files are absent from the new manifest's
        // `hashes`, so the next build does not re-retain them.
        const previousManifest = await readPreviousManifest(outputDir);

        if (previousManifest) {
            await retainPreviousGenerationFiles(previousManifest, rules, coordinationKey, outputDir, tempDir);
        }

        // 6. Write the cleanup file that deletes the coordination property
        // before any page script can run.
        await writeCleanupFile(coordinationKey, tempDir);

        // 7. Write the domains list.
        await writeDomainsList(domains, tempDir);

        // 8. Write the manifest describing this generation's artifacts.
        await writeManifest(coordinationKey, [...rules.keys()], tempDir);

        // 9. Replace the old output with the newly generated one.
        await fs.rm(outputDir, { recursive: true, force: true });
        await fs.rename(tempDir, outputDir);
    } catch (error) {
        await fs.rm(tempDir, { recursive: true, force: true });
        throw error;
    }
};
