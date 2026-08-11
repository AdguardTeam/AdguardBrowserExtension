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
    writeScriptletFunctionFiles,
    writePerHashFiles,
    writeDomainsList,
    writeCleanupFile,
} from './code-generators';

/**
 * Manifest shape used by this pipeline: the shared runtime contract plus
 * bookkeeping that only the pipeline reads back on the next generation.
 */
type BuildTimeManifest = PreregisteredScriptsManifest & {
    /**
     * Stubbed per-rule hashes kept on disk for persisted registrations of
     * the immediately previous extension version.
     */
    stubHashes?: string[];

    /**
     * Stubbed per-function filenames kept on disk for persisted
     * registrations of the immediately previous extension version.
     */
    retainedScriptletFiles?: string[];
};

/**
 * Reads the previous generation's manifest.
 *
 * @param outputDir Current on-disk output directory.
 *
 * @returns Parsed manifest, or `null` when missing or malformed.
 */
const readPreviousManifest = async (outputDir: string): Promise<BuildTimeManifest | null> => {
    try {
        const raw = await fs.readFile(path.join(outputDir, MANIFEST_FILENAME), 'utf-8');
        const parsed: BuildTimeManifest = JSON.parse(raw);

        return parsed && Array.isArray(parsed.hashes) ? parsed : null;
    } catch {
        return null;
    }
};

/**
 * Content of a stub file replacing a revoked rule or scriptlet function file.
 */
const STUB_FILE_CONTENT = '// Stub for a revoked preregistered artifact;'
    + ' kept for persisted content-script registrations.\n';

/**
 * Writes empty stub files for previous-generation per-rule files dropped
 * from the new rule set. Persisted content-script registrations from the
 * previous extension version still reference those files: a missing file
 * breaks the whole registration at browser startup, while an executable
 * copy would keep running code the current filters have already revoked.
 * Stubs are retained ONE generation back: previous-generation stubs
 * (listed in the manifest's `stubHashes`) are not re-stubbed, so a client
 * skipping a version may reference removed files until the extension's
 * startup sync rewrites its registrations.
 *
 * @param previous Previous generation's manifest.
 * @param rules New rule set (keys are the new hashes).
 * @param tempDir New output directory being assembled.
 *
 * @returns Hashes of the written stub files.
 */
const retainPreviousGenerationFiles = async (
    previous: BuildTimeManifest,
    rules: ReadonlyMap<string, unknown>,
    tempDir: string,
): Promise<string[]> => {
    // Only real previous-generation rules are re-stubbed; hashes already
    // stubbed once expire. Manifests predating `stubHashes` are treated as
    // all-real, which just retains them one extra generation.
    const previousRealHashes = new Set(previous.hashes);
    for (const stubHash of previous.stubHashes ?? []) {
        previousRealHashes.delete(stubHash);
    }

    const stubHashes = [...previousRealHashes].filter((hash) => !rules.has(hash));

    await Promise.all(stubHashes.map(async (hash) => {
        await fs.writeFile(path.join(tempDir, getRuleFilename(hash)), STUB_FILE_CONTENT);
    }));

    return stubHashes;
};

/**
 * Writes empty stub files for previous-generation scriptlet function
 * files no longer referenced by the new name→file map, for the same
 * persisted-registration reason as {@link retainPreviousGenerationFiles}.
 * Like rule stubs, they are retained ONE generation back: files already
 * stubbed once are not re-stubbed.
 *
 * @param previous Previous generation's manifest.
 * @param scriptletFiles New name→filename map.
 * @param tempDir New output directory being assembled.
 *
 * @returns Filenames of the written stub files.
 */
const retainPreviousScriptletFunctionFiles = async (
    previous: BuildTimeManifest,
    scriptletFiles: Readonly<Record<string, string>>,
    tempDir: string,
): Promise<string[]> => {
    const currentFilenames = new Set(Object.values(scriptletFiles));
    const previousFilenames = new Set(Object.values(previous.scriptletFiles ?? {}));

    const stubFilenames = [...previousFilenames].filter((filename) => !currentFilenames.has(filename));

    await Promise.all(stubFilenames.map(async (filename) => {
        await fs.writeFile(path.join(tempDir, filename), STUB_FILE_CONTENT);
    }));

    return stubFilenames;
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
 * @param scriptletFiles Scriptlet name → function filename map.
 * @param stubHashes Stubbed rule hashes kept for persisted registrations
 * of the previous version.
 * @param retainedScriptletFiles Stubbed function filenames kept for
 * persisted registrations of the previous version.
 * @param outputDir Directory to write the manifest into.
 */
const writeManifest = async (
    hashes: string[],
    scriptletFiles: Record<string, string>,
    stubHashes: string[],
    retainedScriptletFiles: string[],
    outputDir: string,
): Promise<void> => {
    const sortedScriptletFiles = Object.fromEntries(
        Object.entries(scriptletFiles).sort(([a], [b]) => a.localeCompare(b)),
    );

    const manifest: BuildTimeManifest = {
        hashes: [...hashes].sort(),
        scriptletFiles: sortedScriptletFiles,
        stubHashes: [...stubHashes].sort(),
        retainedScriptletFiles: [...retainedScriptletFiles].sort(),
    };

    await fs.writeFile(
        path.join(outputDir, MANIFEST_FILENAME),
        `${JSON.stringify(manifest)}\n`,
        'utf-8',
    );
};

/**
 * Generates preregistered-script bundles and the domains list for a target
 * MV3 browser, into `filters/<browser>/preregistered-scripts/`:
 *
 * 1. `scriptlets-bundle.js` — runner with the coordination `window`
 *    property (dedup set, function registry, scriptlet invoker).
 * 2. `s-{hash}.js` — one file per unique scriptlet function; registered
 *    before the rule files that need it.
 * 3. `{hash}.js` — one file per unique rule (scriptlet call or
 *    guarded JS body).
 * 4. `cleanup.js` — deletes the coordination `window` property;
 *    registered last in each domain's `js` array.
 * 5. `domains.js` — ES module with the domains that have blocking rules.
 * 6. `manifest.json` — current hashes, stub hashes and the scriptlet
 *    name→file map, read at runtime and by the next generation.
 *
 * Dropped per-rule and per-function files of the immediately previous
 * generation are replaced with empty stubs because persisted
 * content-script registrations still reference them.
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

        // 2. Build and write the shared runner bundle.
        await writeSharedBundle(tempDir, coordinationKey);

        // 3. Write one file per unique scriptlet function.
        const scriptletFiles = await writeScriptletFunctionFiles(scriptletNames, tempDir, coordinationKey);

        // 4. Write per-hash files (one per unique rule).
        await writePerHashFiles(rules, tempDir, coordinationKey);

        // 5. Replace previous-generation files dropped from the new rule
        // set with empty stubs: persisted content-script registrations
        // from the previous extension version still reference them.
        const previousManifest = await readPreviousManifest(outputDir);

        const stubHashes = previousManifest
            ? await retainPreviousGenerationFiles(previousManifest, rules, tempDir)
            : [];

        const retainedScriptletFiles = previousManifest
            ? await retainPreviousScriptletFunctionFiles(previousManifest, scriptletFiles, tempDir)
            : [];

        // 6. Write the cleanup file that deletes the coordination property
        // before any page script can run.
        await writeCleanupFile(coordinationKey, tempDir);

        // 7. Write the domains list.
        await writeDomainsList(domains, tempDir);

        // 8. Write the manifest describing this generation's artifacts,
        // including the retained stub hashes and function files.
        await writeManifest(
            [...rules.keys()],
            scriptletFiles,
            stubHashes,
            retainedScriptletFiles,
            tempDir,
        );

        // 9. Replace the old output with the newly generated one.
        await fs.rm(outputDir, { recursive: true, force: true });
        await fs.rename(tempDir, outputDir);
    } catch (error) {
        await fs.rm(tempDir, { recursive: true, force: true });
        throw error;
    }
};
