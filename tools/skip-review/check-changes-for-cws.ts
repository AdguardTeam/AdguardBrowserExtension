/* eslint-disable no-console */
/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

import { Command } from 'commander';
import fastDeepEqual from 'fast-deep-equal';
import { type Manifest } from 'webextension-polyfill';

import { type DeclarativeRule } from '@adguard/tsurlfilter/es/declarative-converter';
import { isSafeRule } from '@adguard/tsurlfilter/es/declarative-converter-utils';

/**
 * Name of the manifest file.
 */
const MANIFEST_FILE_NAME = 'manifest.json';

/**
 * Name of the _metadata folder in Chrome Web Store, should be ignored.
 */
const CWS_METADATA_FOLDER_NAME = '_metadata';

/**
 * Read and parse JSON file.
 *
 * @param file Path to the JSON file.
 *
 * @returns Parsed JSON object.
 */
const readJson = (file: string): any => {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
};

/**
 * Find manifest.json in the given directory.
 *
 * @param dir Directory to search for manifest.json.
 *
 * @returns Path to the manifest.json file.
 *
 * @throws Error if manifest.json is not found.
 */
const findManifest = (dir: string): string => {
    const manifestPath = path.join(dir, MANIFEST_FILE_NAME);
    if (!fs.existsSync(manifestPath)) {
        throw new Error(`Manifest not found in ${dir}`);
    }
    return manifestPath;
};

/**
 * Build a map of rules by id.
 *
 * @param rules Array of DeclarativeRule objects.
 *
 * @returns Map of rule id to DeclarativeRule.
 */
const buildRulesMap = (rules: DeclarativeRule[]): Map<number, DeclarativeRule> => {
    const map = new Map<number, DeclarativeRule>();
    if (Array.isArray(rules)) {
        for (const rule of rules) {
            map.set(rule.id, rule);
        }
    }
    return map;
};

/**
 * Check that all changed files are only from rule_resources.
 *
 * @param changedFiles Set of changed file paths.
 * @param ruleResources Array of rule_resources objects with path property.
 *
 * @returns True if only rule_resources files changed, false otherwise.
 */
const onlyRuleResourcesChanged = (
    changedFiles: Set<string>,
    ruleResources: Array<{ path: string }>,
): boolean => {
    const allowed = new Set(ruleResources.map((r) => r.path));
    for (const file of changedFiles) {
        if (!allowed.has(file)) {
            return false;
        }
    }
    return true;
};

/**
 * Print info about unsafe rules and set onlySafeRef.value = false if found.
 *
 * @param changes Array of added/removed/updated rules or rule diffs.
 * @param changeType Change type label (Added/Removed/Updated).
 * @param rulesetFilePath Path to the ruleset file.
 *
 * @returns True if any unsafe rules found, false otherwise.
 */
const hasUnsafeRuleChanges = (
    changes: DeclarativeRule[] | { before: DeclarativeRule; after: DeclarativeRule }[],
    changeType: string,
    rulesetFilePath: string,
): boolean => {
    let foundUnsafe = false;

    for (const change of changes) {
        const newRule = 'after' in change ? change.after : change;
        const oldRule = 'before' in change ? change.before : undefined;
        if (oldRule) {
            if (isSafeRule(oldRule) && isSafeRule(newRule)) {
                continue;
            }
        } else if (isSafeRule(newRule)) {
            continue;
        }

        foundUnsafe = true;

        console.log(`\n[${rulesetFilePath}] ${changeType} UNSAFE rule id=${newRule.id} (action.type=${newRule.action.type}):`);
        console.log(`\n  New value:\n${JSON.stringify(newRule, null, 2)}`);
        if (oldRule) {
            console.log(`\n  Old value:\n${JSON.stringify(oldRule, null, 2)}`);
        }
    }

    return foundUnsafe;
};

/**
 * Extracts manifests from the given directories.
 *
 * @param oldDir Directory containing the old manifest.
 * @param newDir Directory containing the new manifest.
 *
 * @returns Object containing both manifests.
 */
const getManifests = (oldDir: string, newDir: string) => {
    const oldManifest: Manifest.WebExtensionManifest = readJson(findManifest(oldDir));
    const newManifest: Manifest.WebExtensionManifest = readJson(findManifest(newDir));

    return { oldManifest, newManifest };
};

/**
 * Checks that declarativeNetRequest is present in permissions.
 *
 * @param manifest Manifest object to check.
 *
 * @throws Error if declarativeNetRequest is not present in permissions.
 */
const checkDNRPermission = (manifest: Manifest.WebExtensionManifest) => {
    const permissions = manifest.permissions || [];
    const optPermissions = manifest.optional_permissions || [];
    const allPermissions = [...permissions, ...optPermissions];
    if (!allPermissions.includes('declarativeNetRequest')) {
        throw new Error('❌ Manifest does not require declarativeNetRequest');
    }
    console.log('✅ declarativeNetRequest permission present');
};

/**
 * Checks that no rulesets were added or removed in manifest.
 *
 * @param oldManifest Old manifest.
 * @param newManifest New manifest.
 *
 * @returns Array of ruleset objects from the new manifest.
 *
 * @throws Error if rulesets were added or removed.
 */
const checkRulesetDeclaration = (
    oldManifest: Manifest.WebExtensionManifest,
    newManifest: Manifest.WebExtensionManifest,
) => {
    const oldRulesets = oldManifest.declarative_net_request!.rule_resources;
    const newRulesets = newManifest.declarative_net_request!.rule_resources;

    const oldSet = new Set(oldRulesets.map((r) => r.path));
    const newSet = new Set(newRulesets.map((r) => r.path));

    const onlyInOld = oldSet.difference(newSet);
    const onlyInNew = newSet.difference(oldSet);

    if (onlyInOld.size > 0 || onlyInNew.size > 0) {
        throw new Error(
            `❌ Rulesets have been added or removed from manifest declaration!\n  Only in old: ${onlyInOld}\n  Only in new: ${onlyInNew}`,
        );
    }

    console.log('✅ No rulesets added/removed in manifest');

    return newRulesets;
};

/**
 * Checks that only rule_resources rulesets changed and all rule changes are safe.
 *
 * @param oldDir Directory containing the old rules.
 * @param newDir Directory containing the new rules.
 * @param rulesets Array of rulesets info from rule_resources in manifest.
 *
 * @throws Error if files outside rule_resources were changed or unsafe rules found.
 */
const checkRuleResources = (
    oldDir: string,
    newDir: string,
    rulesets: Array<{ path: string }>,
) => {
    const rulesetPaths = rulesets.map((r) => r.path);

    const changedRulesets = new Set<string>();
    let changesAreSafe = true;

    for (const rulesetPath of rulesetPaths) {
        const oldFile = path.join(oldDir, rulesetPath);
        const newFile = path.join(newDir, rulesetPath);
        if (!fs.existsSync(oldFile) || !fs.existsSync(newFile)) {
            console.log(`⚠️ File ${rulesetPath} missing in one of the directories`);
            changesAreSafe = false;
            continue;
        }

        const dataOld = fs.readFileSync(oldFile, 'utf8');
        const dataNew = fs.readFileSync(newFile, 'utf8');
        if (dataOld === dataNew) {
            continue;
        }

        changedRulesets.add(rulesetPath);

        let rulesOld: DeclarativeRule[] = [];
        let rulesNew: DeclarativeRule[] = [];
        try {
            rulesOld = JSON.parse(dataOld);
            rulesNew = JSON.parse(dataNew);
        } catch (e: any) {
            console.log(`Parse error in ${rulesetPath}: ${e.message}`);
            changesAreSafe = false;
            continue;
        }

        const mapOld = buildRulesMap(rulesOld);
        const mapNew = buildRulesMap(rulesNew);

        const added: DeclarativeRule[] = [];
        const removed: DeclarativeRule[] = [];
        const updated: {
            before: DeclarativeRule;
            after: DeclarativeRule;
        }[] = [];

        for (const [id, ruleNew] of mapNew.entries()) {
            const ruleOld = mapOld.get(id);
            if (!ruleOld) {
                added.push(ruleNew);
            } else if (!fastDeepEqual(ruleOld, ruleNew)) {
                updated.push({ before: ruleOld, after: ruleNew });
            }
        }

        for (const [id, ruleOld] of mapOld.entries()) {
            if (!mapNew.has(id)) {
                removed.push(ruleOld);
            }
        }

        if (hasUnsafeRuleChanges(added, 'Added', rulesetPath)) {
            changesAreSafe = false;
        }
        if (hasUnsafeRuleChanges(removed, 'Removed', rulesetPath)) {
            changesAreSafe = false;
        }
        if (hasUnsafeRuleChanges(updated, 'Updated', rulesetPath)) {
            changesAreSafe = false;
        }
    }

    if (!changesAreSafe) {
        console.log('\n❌ There are changes NOT in safe rules (see above)');
        process.exit(4);
    }
    console.log('✅ All changes in ruleset files are only safe rules');

    if (!onlyRuleResourcesChanged(changedRulesets, rulesets)) {
        throw new Error('❌ Rulesets outside rule_resources were changed!');
    }
    console.log('✅ All changed rulesets specified in rule_resources');
};

/**
 * Get the set of changed files between two directories using system diff
 * or between two files.
 *
 * @param oldDir Path to the old directory or file.
 * @param newDir Path to the new directory or file.
 *
 * @returns Set of relative file paths that differ between the two directories
 * or files.
 */
const getChangedFiles = (oldDir: string, newDir: string): Promise<Set<string>> => {
    return new Promise((resolve, reject) => {
        // '-q' for short output (only report if files differ)
        // '-r' for recursive comparison
        const diff = spawn('diff', ['-qr', oldDir, newDir]);

        // Set encoding for stdout and stderr to 'utf-8'
        diff.stdout.setEncoding('utf-8');
        diff.stderr.setEncoding('utf-8');

        let output = '';
        let errorOutput = '';

        diff.stdout.on('data', (data) => {
            output += data.toString();
        });

        diff.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        diff.on('close', (code) => {
            // 0 - no differences, 1 - differences found
            if (code !== 0 && code !== 1) {
                reject(new Error(`diff failed with code ${code}: ${errorOutput.trim()}`));
                return;
            }

            // output format: "Files oldDir/path/file and newDir/path/file differ"
            const changed = new Set<string>();
            const regex = /^Files\s+.+?\/(.+?)\s+and\s+.+?\/(.+?)\s+differ$/gm;
            let match: RegExpExecArray | null;
            for (match = regex.exec(output); match !== null; match = regex.exec(output)) {
                if (match[1]) {
                    changed.add(match[1]);
                }
            }

            // Also handle files only in one directory
            const onlyRegex = /^Only in (.+?): (.+)$/gm;
            for (match = onlyRegex.exec(output); match !== null; match = onlyRegex.exec(output)) {
                if (match[1] && match[2]) {
                    const baseDir = match[1].endsWith('/') ? match[1].slice(0, -1) : match[1];
                    let relPath = path.relative(oldDir, path.join(baseDir, match[2]));
                    if (relPath.startsWith('..')) {
                        relPath = path.relative(newDir, path.join(baseDir, match[2]));
                    }
                    changed.add(relPath);
                }
            }

            resolve(changed);
        });

        diff.on('error', (err) => {
            reject(err);
        });
    });
};

/**
 * Ensures that only rule_resources files changed between two directories.
 *
 * @param oldDir Path to the old directory.
 * @param newDir Path to the new directory.
 * @param rulesetsPaths Array of allowed ruleset file paths.
 *
 * @throws Error if files outside rule_resources were changed.
 */
const ensureOnlyRulesetsChanged = async (
    oldDir: string,
    newDir: string,
    rulesetsPaths: Array<string>,
): Promise<void> => {
    // To print all files which changed outside rule_resources.
    let changedOnlyRulesets = true;

    // Check that only rule_resources files changed (using system diff).
    const changedFiles = await getChangedFiles(oldDir, newDir);
    for (const filePath of changedFiles) {
        // Ignore rulesets which specified in the package.json, because they are
        // allowed to change.
        if (Array.from(rulesetsPaths).some((p) => filePath.endsWith(p))) {
            continue;
        }

        // Ignore CWS metadata folder, it is added by CWS after publishing.
        if (filePath.startsWith(CWS_METADATA_FOLDER_NAME)) {
            continue;
        }

        // Special case for manifest.json, we need to check only `version`
        // and `update_url` fields, because CWS adds `update_url` after
        // publishing the extension, so it will always differ.
        if (filePath.endsWith(MANIFEST_FILE_NAME)) {
            const manifestChanged = await checkManifestForSignificantChanges(filePath, oldDir, newDir);

            if (!manifestChanged) {
                continue;
            }
        }

        // Every other file should be checked.
        await printExternalFileDiff(filePath, oldDir, newDir);
        changedOnlyRulesets = false;
    }

    if (!changedOnlyRulesets) {
        throw new Error('❌ Files outside rule_resources were changed!');
    }

    console.log('✅ Only rule_resources files changed');
};

/**
 * Checks the manifest.json for significant changes: without `version`, since it
 * is always different, and without `update_url`, since it is added by CWS.
 *
 * @param filePath Relative path to the manifest file.
 * @param oldDir Path to the old directory.
 * @param newDir Path to the new directory.
 *
 * @returns Promise that resolves to true if significant changes were found.
 */
const checkManifestForSignificantChanges = async (
    filePath: string,
    oldDir: string,
    newDir: string,
): Promise<boolean> => {
    const relativeFilePath = path.relative(oldDir, filePath);
    const oldFile = path.join(oldDir, relativeFilePath);
    const newFile = path.join(newDir, relativeFilePath);

    const oldManifest = readJson(oldFile);
    const newManifest = readJson(newFile);

    // Delete `version` since it is always different.
    delete oldManifest.version;
    // Delete `version` since it is always different.
    delete newManifest.version;

    // Delete `update_url` since it is added by CWS after publishing.
    delete oldManifest.update_url;

    const systemTmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'cws-check-manifest-'));

    const oldManifestTmpPath = path.join(systemTmpDir, 'old_manifest.json');
    const newManifestTmpPath = path.join(systemTmpDir, 'new_manifest.json');

    await fs.promises.writeFile(oldManifestTmpPath, JSON.stringify(oldManifest));
    await fs.promises.writeFile(newManifestTmpPath, JSON.stringify(newManifest));

    const changedLines = await getChangedFiles(oldManifestTmpPath, newManifestTmpPath);

    return changedLines.size > 0;
};

/**
 * Print and show diff for a file changed outside rule_resources.
 *
 * @param filePath Relative path to the changed file.
 * @param oldDir Path to the old directory.
 * @param newDir Path to the new directory.
 */
const printExternalFileDiff = async (
    filePath: string,
    oldDir: string,
    newDir: string,
) => {
    const relativeFilePath = path.relative(oldDir, filePath);
    const oldFile = path.join(oldDir, relativeFilePath);
    const newFile = path.join(newDir, relativeFilePath);

    console.log(`❌ Detected changes outside rule_resources, diff between "${oldFile}" and "${newFile}":`);
    if (relativeFilePath.endsWith(MANIFEST_FILE_NAME)) {
        console.log('❌ Please ignore changes in `version` and `update_url` fields, they are expected.');
    }

    if (fs.existsSync(oldFile) && fs.existsSync(newFile)) {
        // Both files exist, show diff
        try {
            const diffResult = await new Promise<string>((resolve, reject) => {
                // "-u" for unified diff format to show context
                const diff = spawn('diff', ['-u', oldFile, newFile]);

                // Set encoding for stdout and stderr to 'utf-8'
                diff.stdout.setEncoding('utf-8');
                diff.stderr.setEncoding('utf-8');

                let out = '';

                diff.stdout.on('data', (data) => {
                    out += data.toString();
                });

                diff.stderr.on('data', (data) => {
                    out += data.toString();
                });

                diff.on('close', () => resolve(out));
                diff.on('error', reject);
            });

            console.log('[File changed]\n', diffResult.trim());
        } catch (e) {
            console.log('[Error running diff]');
        }
    } else if (fs.existsSync(oldFile)) {
        console.log('[File removed]');
    } else if (fs.existsSync(newFile)) {
        console.log('[File added]');
    } else {
        console.log(`[File missing in both]: old "${oldFile}", new "${newFile}", filePath "${filePath}"`);
    }
};

/**
 * Runs all checks step by step.
 *
 * @param oldDir Path to the old extension directory.
 * @param newDir Path to the new extension directory.
 */
const compareManifestsAndRules = async (oldDir: string, newDir: string) => {
    // Step 1: Read and parse manifests from both directories.
    const { oldManifest, newManifest } = getManifests(oldDir, newDir);

    // Step 2: Check that declarativeNetRequest is present in permissions.
    checkDNRPermission(newManifest);

    // Step 3: Check that no rulesets were added or removed in manifest.
    const ruleResources = checkRulesetDeclaration(oldManifest, newManifest);

    // Step 4: Check that only rule_resources files changed (using system diff).
    await ensureOnlyRulesetsChanged(oldDir, newDir, ruleResources.map(({ path }) => path));

    // Step 5: Check that all rule changes are safe.
    checkRuleResources(oldDir, newDir, ruleResources);
};

// CLI wrapper for parsing arguments and running the checks.
const program = new Command();
program
    .name('check-changes-for-cws')
    .description('Validate extension static ruleset changes for Chrome Web Store')
    .argument('<oldDir>', 'Old extension directory')
    .argument('<newDir>', 'New extension directory')
    .action(async (oldDir: string, newDir: string) => {
        try {
            await compareManifestsAndRules(oldDir, newDir);
        } catch (e) {
            const err = e as any;
            console.log(`Error: ${err && err.message ? err.message : err}`);
            process.exit(1);
        }
    });

program.parse(process.argv);
