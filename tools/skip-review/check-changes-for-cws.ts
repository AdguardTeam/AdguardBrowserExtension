/* eslint-disable no-console */
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
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

import { Command } from 'commander';
import fastDeepEqual from 'fast-deep-equal';
import { type Manifest } from 'webextension-polyfill';

import { type DeclarativeRule, isSafeRule } from '@adguard/dnr-converter';

/**
 * Name of the manifest file.
 */
const MANIFEST_FILE_NAME = 'manifest.json';

/**
 * Name of the _metadata folder in Chrome Web Store, should be ignored.
 */
const CWS_METADATA_FOLDER_NAME = '_metadata';

/**
 * Directory (relative to the extension root) whose contents may change in the
 * standard-review mode.
 */
export const FILTERS_DIR = 'filters';

/**
 * Path (relative to the extension root) of the built MV3 background bundle.
 * It embeds the generated local script rules module, so a JS rules update
 * unavoidably changes it.
 */
export const BACKGROUND_BUNDLE_FILE = 'pages/background.js';

/**
 * Path (relative to the extension root) of the generated local script rules
 * module in the built package. `engine-mv3.ts` imports it statically, so the
 * bundler inlines its contents into {@link BACKGROUND_BUNDLE_FILE}.
 */
export const LOCAL_SCRIPT_RULES_FILE = 'filters/local_script_rules.js';

/**
 * Message of the error thrown when files outside the allowed scope changed.
 */
const SCOPE_ERROR_MESSAGE = '❌ Files outside the allowed scope were changed!';

/**
 * Heading of the DEPLOYMENT.md entry explaining the recovery for the recurring
 * expedited failure. Pinned by a test, so a doc rename cannot leave the error
 * pointing at a missing section.
 */
export const EXPEDITED_SCOPE_HINT_HEADING = 'Auto-build failed on the expedited scope check after an '
    + 'unpublished full-resources build';

/**
 * Heading of the DEPLOYMENT.md entry explaining the ruleset declaration
 * failure. Pinned by a test like {@link EXPEDITED_SCOPE_HINT_HEADING}.
 */
export const RULESET_DECLARATION_HINT_HEADING = 'Auto-build failed on the ruleset declaration check';

/**
 * Hint appended to the scope error in the expedited mode. A full-resources
 * build whose publish was skipped (the CWS channel was unavailable) leaves
 * changes committed to the stable branch that keep failing every expedited
 * check until the next standard-review submission lands.
 */
const EXPEDITED_SCOPE_ERROR_HINT = 'A full-resources build that could not be published is not in '
    + 'the extension published to CWS: its committed changes keep failing expedited checks until the '
    + `next standard-review submission lands. See DEPLOYMENT.md, "${EXPEDITED_SCOPE_HINT_HEADING}".`;

/**
 * Modes of the extension change check, matching the Chrome Web Store review
 * the built extension is submitted for.
 */
export enum CheckMode {
    /**
     * The build is submitted with skip review: only safe rules from the
     * manifest `rule_resources` list may change.
     */
    Expedited = 'expedited',
    /**
     * The build is submitted for the standard review: any file under the
     * `filters/` directory may change (unsafe rules included), and the
     * background bundle may change together with the local script rules
     * module it embeds. Rule safety is not enforced.
     */
    StandardReview = 'standard-review',
}

/**
 * Prefix of an `Only in <dir>: <name>` line of `diff -qr` output.
 */
const DIFF_ONLY_IN_PREFIX = 'Only in ';

/**
 * Prefix and suffix of a `Files <a> and <b> differ` line of `diff -qr` output.
 */
const DIFF_FILES_PREFIX = 'Files ';
const DIFF_FILES_SUFFIX = ' differ';

/**
 * Hint appended to the ruleset declaration error: the manifest is always
 * outside the scope an auto-published build may change, whatever the mode.
 */
const RULESET_DECLARATION_SCOPE_HINT = 'The manifest is outside the change scope of an auto-published build '
    + '(safe rules for skip review, files under `filters/` for the standard review), so this build cannot be '
    + `published automatically. See DEPLOYMENT.md, "${RULESET_DECLARATION_HINT_HEADING}".`;

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
            `❌ Rulesets have been added or removed from manifest declaration!\n  Only in old: ${onlyInOld}\n  Only in new: ${onlyInNew}\n${RULESET_DECLARATION_SCOPE_HINT}`,
        );
    }

    console.log('✅ No rulesets added/removed in manifest');

    return newRulesets;
};

/**
 * Checks rule changes in the manifest `rule_resources` rulesets and ensures
 * that they are safe.
 *
 * @param oldDir Directory containing the old rules.
 * @param newDir Directory containing the new rules.
 * @param rulesets Array of rulesets info from rule_resources in manifest.
 *
 * @throws Error if unsafe rule changes are found.
 */
const checkRuleResources = (
    oldDir: string,
    newDir: string,
    rulesets: Array<{ path: string }>,
) => {
    const rulesetPaths = rulesets.map((r) => r.path);

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
        throw new Error('❌ There are changes NOT in safe rules (see above)');
    }
    console.log('✅ All changes in ruleset files are only safe rules');
};

/**
 * Converts a path reported by `diff` into a path relative to the extension
 * root it belongs to.
 *
 * @param rawPath Path as reported by `diff` (absolute or `./`-prefixed).
 * @param oldDir Path to the old extension directory.
 * @param newDir Path to the new extension directory.
 *
 * @returns Path relative to `oldDir` or `newDir`, or null when the path lies
 * outside both.
 */
export const toExtensionRelativePath = (
    rawPath: string,
    oldDir: string,
    newDir: string,
): string | null => {
    for (const dir of [oldDir, newDir]) {
        const relative = path.relative(path.resolve(dir), path.resolve(rawPath));
        if (relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative)) {
            // Normalize to POSIX separators so scope checks and manifest
            // `rule_resources` paths behave the same on Windows.
            return relative.split(path.sep).join('/');
        }
    }

    return null;
};

/**
 * Extracts the changed file from a `Files <old> and <new> differ` line of
 * `diff -qr` output. File names may contain ` and `, so instead of splitting
 * on the first occurrence, every candidate split is tried and the one whose
 * halves resolve to the same extension-relative path wins.
 *
 * @param line Line of `diff -qr` output.
 * @param oldDir Path to the old extension directory.
 * @param newDir Path to the new extension directory.
 *
 * @returns Path of the changed file relative to the extension roots, or null
 * when this is not a mapping `Files ... differ` line.
 */
const parseDiffFilesLine = (line: string, oldDir: string, newDir: string): string | null => {
    const separator = ' and ';

    if (!line.startsWith(DIFF_FILES_PREFIX) || !line.endsWith(DIFF_FILES_SUFFIX)) {
        return null;
    }

    const body = line.slice(DIFF_FILES_PREFIX.length, -DIFF_FILES_SUFFIX.length);
    for (let index = body.indexOf(separator); index !== -1; index = body.indexOf(separator, index + 1)) {
        const oldPath = body.slice(0, index);
        const newPath = body.slice(index + separator.length);
        const oldRelative = toExtensionRelativePath(oldPath, oldDir, newDir);
        const newRelative = toExtensionRelativePath(newPath, oldDir, newDir);
        if (oldRelative !== null && oldRelative === newRelative) {
            return oldRelative;
        }
    }

    return null;
};

/**
 * Extracts the changed file from an `Only in <dir>: <name>` line of `diff -qr`
 * output. Both the directory and the file name may contain `: `, so a single
 * split is ambiguous (`filters: x/evil.js` against `filters/x: evil.js`). The
 * entry reported by `diff` exists in one of the trees, so the split whose join
 * exists is the real one; when no split resolves, the line fails closed.
 *
 * @param line Line of `diff -qr` output.
 * @param oldDir Path to the old extension directory.
 * @param newDir Path to the new extension directory.
 *
 * @returns Path of the changed file relative to the extension roots, or null
 * when this is not a resolvable `Only in ...` line.
 */
const parseDiffOnlyInLine = (line: string, oldDir: string, newDir: string): string | null => {
    const separator = ': ';

    if (!line.startsWith(DIFF_ONLY_IN_PREFIX)) {
        return null;
    }

    const body = line.slice(DIFF_ONLY_IN_PREFIX.length);
    for (let index = body.indexOf(separator); index !== -1; index = body.indexOf(separator, index + 1)) {
        const candidate = path.join(body.slice(0, index), body.slice(index + separator.length));
        if (!fs.existsSync(candidate)) {
            continue;
        }

        const relativePath = toExtensionRelativePath(candidate, oldDir, newDir);
        if (relativePath !== null) {
            return relativePath;
        }
    }

    return null;
};

/**
 * Checks whether a changed file lies inside the given directory.
 *
 * @param relativeFilePath Changed file path relative to the extension root.
 * @param dir Directory relative to the extension root.
 *
 * @returns True when the file is the directory itself or lies inside it.
 */
export const isInsideDir = (relativeFilePath: string, dir: string): boolean => {
    return relativeFilePath === dir || relativeFilePath.startsWith(`${dir}/`);
};

/**
 * Get the set of changed files between two directories using system diff,
 * as paths relative to the extension root they belong to.
 *
 * @param oldDir Path to the old extension directory.
 * @param newDir Path to the new extension directory.
 *
 * @returns Set of relative file paths that differ between the two directories.
 *
 * @throws Error if a diff entry cannot be mapped to either extension root.
 */
export const getChangedFiles = (oldDir: string, newDir: string): Promise<Set<string>> => {
    return new Promise((resolve, reject) => {
        // '-q' for short output (only report if files differ)
        // '-r' for recursive comparison
        const diff = spawn('diff', ['-qr', oldDir, newDir]);

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

            const changed = new Set<string>();
            const unmappable: string[] = [];

            // `diff -qr` emits one message per changed file:
            // `Files <old> and <new> differ` or `Only in <dir>: <name>`.
            // Anything else means the output cannot be attributed to a file
            // (e.g. a file name containing a newline splits its message across
            // lines), so it must fail closed.
            for (const line of output.split('\n')) {
                if (line === '') {
                    continue;
                }

                const relativePath = parseDiffFilesLine(line, oldDir, newDir);
                if (relativePath !== null) {
                    changed.add(relativePath);
                    continue;
                }

                const onlyInPath = parseDiffOnlyInLine(line, oldDir, newDir);
                if (onlyInPath !== null) {
                    changed.add(onlyInPath);
                    continue;
                }

                unmappable.push(line);
            }

            // Fail closed: an entry that cannot be mapped to either extension
            // root must not be silently skipped by the scope check.
            if (unmappable.length > 0) {
                reject(new Error(`Cannot map diff path(s) to the extension roots: ${unmappable.join(', ')}`));
                return;
            }

            resolve(changed);
        });

        diff.on('error', (err) => {
            reject(err);
        });
    });
};

/**
 * Ensures that only allowed files changed between two extension directories.
 * The CWS `_metadata` folder and insignificant `manifest.json` changes
 * (`version`, `update_url`) are always ignored.
 *
 * @param oldDir Path to the old directory.
 * @param newDir Path to the new directory.
 * @param isAllowedChange Predicate deciding whether a changed file, as a path
 * relative to the extension root, is allowed to change.
 * @param scopeErrorHint Optional hint appended to the scope error, explaining
 * the recovery for a recurring failure.
 * @param changedFiles Optional precomputed set of changed files; computed with
 * {@link getChangedFiles} when omitted. Callers that need the set to build the
 * `isAllowedChange` predicate pass it to avoid diffing the trees twice.
 *
 * @throws Error if files outside the allowed scope were changed.
 */
export const ensureOnlyAllowedChanges = async (
    oldDir: string,
    newDir: string,
    isAllowedChange: (relativeFilePath: string) => boolean,
    scopeErrorHint?: string,
    changedFiles?: Set<string>,
): Promise<void> => {
    // To print all files which changed outside the allowed scope.
    let changedOnlyAllowed = true;

    // Check that only allowed files changed (using system diff).
    const changed = changedFiles ?? await getChangedFiles(oldDir, newDir);
    for (const relativeFilePath of changed) {
        if (isAllowedChange(relativeFilePath)) {
            continue;
        }

        // Ignore CWS metadata folder, it is added by CWS after publishing.
        if (isInsideDir(relativeFilePath, CWS_METADATA_FOLDER_NAME)) {
            continue;
        }

        // Special case for manifest.json, we need to check only `version`
        // and `update_url` fields, because CWS adds `update_url` after
        // publishing the extension, so it will always differ.
        if (relativeFilePath === MANIFEST_FILE_NAME) {
            const manifestChanged = checkManifestForSignificantChanges(
                relativeFilePath,
                oldDir,
                newDir,
            );

            if (!manifestChanged) {
                continue;
            }
        }

        // Every other file should be checked.
        await printExternalFileDiff(relativeFilePath, oldDir, newDir);
        changedOnlyAllowed = false;
    }

    if (!changedOnlyAllowed) {
        throw new Error(scopeErrorHint ? `${SCOPE_ERROR_MESSAGE}\n${scopeErrorHint}` : SCOPE_ERROR_MESSAGE);
    }

    console.log('✅ Only allowed files changed');
};

/**
 * Checks the manifest.json for significant changes: without `version`, since it
 * is always different, and without `update_url`, since it is added by CWS.
 *
 * @param relativeFilePath Relative path to the manifest file.
 * @param oldDir Path to the old directory.
 * @param newDir Path to the new directory.
 *
 * @returns True if significant changes were found.
 */
const checkManifestForSignificantChanges = (
    relativeFilePath: string,
    oldDir: string,
    newDir: string,
): boolean => {
    const oldFile = path.join(oldDir, relativeFilePath);
    const newFile = path.join(newDir, relativeFilePath);

    const oldManifest = readJson(oldFile);
    const newManifest = readJson(newFile);

    // Delete `version` since it is always different.
    delete oldManifest.version;
    // Delete `version` since it is always different.
    delete newManifest.version;

    // Delete `update_url` from both sides since it is added by CWS after
    // publishing and the comparison must not depend on which side carries it.
    delete oldManifest.update_url;
    delete newManifest.update_url;

    // Compare the normalized manifests deeply so key order cannot produce a
    // false positive.
    return !fastDeepEqual(oldManifest, newManifest);
};

/**
 * Print and show diff for a file changed outside the allowed scope.
 *
 * @param relativeFilePath Relative path to the changed file.
 * @param oldDir Path to the old directory.
 * @param newDir Path to the new directory.
 */
const printExternalFileDiff = async (
    relativeFilePath: string,
    oldDir: string,
    newDir: string,
) => {
    const oldFile = path.join(oldDir, relativeFilePath);
    const newFile = path.join(newDir, relativeFilePath);

    console.log(`❌ Detected changes outside the allowed scope, diff between "${oldFile}" and "${newFile}":`);
    if (relativeFilePath === MANIFEST_FILE_NAME) {
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
        console.log(`[File missing in both]: old "${oldFile}", new "${newFile}", filePath "${relativeFilePath}"`);
    }
};

/**
 * Runs all checks step by step.
 *
 * @param oldDir Path to the old extension directory.
 * @param newDir Path to the new extension directory.
 * @param mode Review the built extension is submitted for; controls the
 * allowed change scope and whether rule safety is enforced.
 */
export const compareManifestsAndRules = async (
    oldDir: string,
    newDir: string,
    mode: CheckMode,
) => {
    // Step 1: Read and parse manifests from both directories.
    const { oldManifest, newManifest } = getManifests(oldDir, newDir);

    // Step 2: Check that declarativeNetRequest is present in permissions.
    checkDNRPermission(newManifest);

    // Step 3: Check that no rulesets were added or removed in manifest.
    const ruleResources = checkRulesetDeclaration(oldManifest, newManifest);

    // Step 4: Check that only files allowed for the review mode changed:
    // skip review accepts safe rule resources only, the standard review
    // accepts any change inside filters/ so the submission cannot ship
    // unexpected code changes.
    const changedFiles = await getChangedFiles(oldDir, newDir);
    const isAllowedChange = (relativeFilePath: string): boolean => {
        if (mode === CheckMode.StandardReview) {
            if (isInsideDir(relativeFilePath, FILTERS_DIR)) {
                return true;
            }

            // The MV3 background bundle embeds the generated local script rules
            // module, so a JS rules update unavoidably changes it even though
            // the only changed input is inside `filters/`. Allow the bundle
            // only together with that module: any other bundle change, and any
            // bundle change without a rules update, still fails the check.
            if (
                relativeFilePath === BACKGROUND_BUNDLE_FILE
                && changedFiles.has(LOCAL_SCRIPT_RULES_FILE)
            ) {
                console.log(`ℹ️ ${BACKGROUND_BUNDLE_FILE} changed together with ${LOCAL_SCRIPT_RULES_FILE}, `
                    + 'which it embeds, so the change is within the allowed scope');
                return true;
            }

            return false;
        }

        return ruleResources.some(({ path: rulesetPath }) => rulesetPath === relativeFilePath);
    };
    // Explain the recurring expedited failure caused by an unpublished
    // full-resources build instead of the bare scope error.
    const scopeErrorHint = mode === CheckMode.Expedited ? EXPEDITED_SCOPE_ERROR_HINT : undefined;

    await ensureOnlyAllowedChanges(oldDir, newDir, isAllowedChange, scopeErrorHint, changedFiles);

    // Step 5: Rule safety is enforced only for skip-review submissions: the
    // standard review accepts unsafe rules, which is exactly why such a build
    // cannot be submitted with skip review.
    if (mode === CheckMode.StandardReview) {
        console.log('ℹ️ Standard review mode: rule safety is not enforced');
        return;
    }

    checkRuleResources(oldDir, newDir, ruleResources);
};

// CLI wrapper for parsing arguments and running the checks.
const program = new Command();
program
    .name('check-changes-for-cws')
    .description('Validate extension changes against the published Chrome Web Store build')
    .argument('<oldDir>', 'Old extension directory')
    .argument('<newDir>', 'New extension directory')
    .option(
        '--standard-review',
        'allow any change under filters/ (rule safety is not enforced);'
        + ' used for builds submitted for the standard CWS review',
    )
    .action(async (oldDir: string, newDir: string, options: { standardReview?: boolean }) => {
        try {
            const mode = options.standardReview ? CheckMode.StandardReview : CheckMode.Expedited;
            await compareManifestsAndRules(oldDir, newDir, mode);
        } catch (e) {
            const err = e as any;
            console.log(`Error: ${err && err.message ? err.message : err}`);
            process.exit(1);
        }
    });

/**
 * Is this module being executed as the CLI entry point (rather than imported
 * by a test)?
 *
 * @returns Whether `process.argv[1]` resolves to this file.
 */
const isMain = (): boolean => {
    const entry = process.argv[1];
    if (entry === undefined) {
        return false;
    }

    // tsx executes extensionless entry points without rewriting
    // `process.argv[1]`, so the `.ts` extension may be missing here: the
    // Dockerfile invokes the tool as
    // `pnpm tsx tools/skip-review/check-changes-for-cws ...`. Resolve real
    // paths so a symlinked checkout or entry point compares equal as well.
    const entryPath = path.resolve(entry);
    const modulePath = fs.realpathSync(fileURLToPath(import.meta.url));
    return [entryPath, `${entryPath}.ts`].some((candidate) => {
        try {
            return fs.realpathSync(candidate) === modulePath;
        } catch {
            return false;
        }
    });
};

if (isMain()) {
    program.parse(process.argv);
}
