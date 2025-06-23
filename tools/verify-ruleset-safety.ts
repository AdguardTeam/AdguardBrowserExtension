/* eslint-disable no-console */
/**
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

/**
 * Script to verify that ruleset changes contain only safe changes.
 *
 * This is used as part of the CI/CD pipeline to ensure hourly updates
 * don't contain unsafe changes that would require manual review.
 */

import * as fs from 'fs';
import * as path from 'path';

import { DeclarativeRulesConverter, type DeclarativeRule } from '@adguard/tsurlfilter/es/declarative-converter';

const MANIFEST = 'manifest.json';

interface RuleResource {
    path?: string;
    file?: string;
    id?: string;
    enabled?: boolean;
}

interface Manifest {
    permissions?: string[];
    optional_permissions?: string[];
    declarative_net_request?: {
        rule_resources?: RuleResource[];
    };
    [key: string]: any;
}

interface UpdatedRule {
    before: DeclarativeRule;
    after: DeclarativeRule;
}

function readJson(file: string): any {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * Finds the manifest file in the specified directory.
 *
 * @param dir Directory to search in.
 *
 * @returns Path to the manifest file.
 *
 * @throws Error if the manifest is not found.
 */
function findManifest(dir: string): string {
    const manifestPath = path.join(dir, MANIFEST);
    if (!fs.existsSync(manifestPath)) {
        throw new Error(`Manifest not found in ${dir}`);
    }

    return manifestPath;
}

/**
 * Builds a map of rules from an array of rules.
 *
 * @param rules Array of rules.
 *
 * @returns Map of rules indexed by their ID.
 */
function buildRulesMap(rules: DeclarativeRule[] | undefined): Map<number, DeclarativeRule> {
    if (!Array.isArray(rules)) {
        return new Map();
    }
    const map = new Map<number, DeclarativeRule>();
    for (const rule of rules) {
        map.set(rule.id, rule);
    }
    return map;
}

/**
 * Helper function to report unsafe rules.
 *
 * @param arr Array of rules or updated rules.
 * @param label Label for the type of rule.
 * @param relPath Relative path of the file.
 * @param isSafe Whether the rules are safe.
 * @param transform Optional transform function to apply to each rule.
 * @param dual Whether to report dual rules.
 *
 * @returns Whether the rules are safe.
 */
function reportUnsafeRules(
    arr: (DeclarativeRule | UpdatedRule)[],
    label: string,
    relPath: string,
    isSafe: boolean,
    transform: (r: DeclarativeRule | UpdatedRule) => DeclarativeRule = (r) => r as DeclarativeRule,
    dual: boolean = false,
): boolean {
    let result = isSafe;
    for (const r of arr) {
        const rule = transform(r);
        if (!DeclarativeRulesConverter.isSafeRule(rule)) {
            result = false;
            console.log(`\n[${relPath}] ${label} UNSAFE rule id=${rule.id} (action.type=${rule.action.type}):`);
            console.log(JSON.stringify(rule, null, 2));
            if (dual && 'before' in r && 'after' in r) {
                console.log(`\n  Old value:\n${JSON.stringify((r as UpdatedRule).before, null, 2)}`);
                console.log(`\n  New value:\n${JSON.stringify((r as UpdatedRule).after, null, 2)}`);
            }
        }
    }
    return result;
}

function main(): void {
    if (process.argv.length !== 4) {
        console.error('Usage: node verify-ruleset-safety.js <dir1> <dir2>');
        process.exit(1);
    }

    const [, , dir1, dir2] = process.argv;

    if (!dir1 || !dir2) {
        console.error('Usage: node verify-ruleset-safety.js <dir1> <dir2>');
        process.exit(1);
    }

    try {
        // 1. Find manifests
        const manifest1Path = findManifest(dir1);
        const manifest2Path = findManifest(dir2);
        const manifest1: Manifest = readJson(manifest1Path);
        const manifest2: Manifest = readJson(manifest2Path);

        // 2. Check: is declarativeNetRequest in required_permissions
        const permissions = manifest2.permissions || [];
        const optPermissions = manifest2.optional_permissions || [];
        const allPermissions = [...permissions, ...optPermissions];
        if (!allPermissions.includes('declarativeNetRequest')) {
            console.error('❌ Manifest does not require declarativeNetRequest');
            process.exit(1);
        } else {
            console.log('✅ declarativeNetRequest permission present');
        }

        // 3. Compare rule_resources (cannot add/remove ruleset)
        const rr1 = (manifest1.declarative_net_request && manifest1.declarative_net_request.rule_resources) || [];
        const rr2 = (manifest2.declarative_net_request && manifest2.declarative_net_request.rule_resources) || [];

        const set1 = new Set(rr1.map((r) => r.path || r.file || r.id || ''));
        const set2 = new Set(rr2.map((r) => r.path || r.file || r.id || ''));

        const onlyIn1 = [...set1].filter((x) => !set2.has(x));
        const onlyIn2 = [...set2].filter((x) => !set1.has(x));
        if (onlyIn1.length > 0 || onlyIn2.length > 0) {
            console.error('❌ Rulesets have been added or removed from manifest declaration!');
            console.error('  Only in old:', onlyIn1);
            console.error('  Only in new:', onlyIn2);
            process.exit(1);
        } else {
            console.log('✅ No rulesets added/removed in manifest');
        }

        // 4. Check that only rule_resources were changed
        // Collect list of files from rule_resources
        const ruleFiles = rr2.map((r) => r.path || r.file || r.id || '');
        // Go through all files, compare ruleset files between folders

        const changedRuleFiles = new Set<string>();
        let onlySafe = true;

        for (const relPath of ruleFiles) {
            const f1 = path.join(dir1, relPath);
            const f2 = path.join(dir2, relPath);

            if (!fs.existsSync(f1) || !fs.existsSync(f2)) {
                console.warn(`⚠️ File ${relPath} missing in one of the directories`);
                continue;
            }

            const data1 = fs.readFileSync(f1, 'utf8');
            const data2 = fs.readFileSync(f2, 'utf8');

            if (data1 === data2) {
                // No changes
                continue;
            }

            changedRuleFiles.add(relPath);

            // Detailed check of changes - only safe rules
            let rules1: DeclarativeRule[];
            let rules2: DeclarativeRule[];
            try {
                rules1 = JSON.parse(data1);
                rules2 = JSON.parse(data2);
            } catch (e) {
                const error = e as Error;
                console.error(`Error parsing ${relPath}: ${error.message}`);
                onlySafe = false;
                continue;
            }

            const map1 = buildRulesMap(rules1);
            const map2 = buildRulesMap(rules2);

            const added: DeclarativeRule[] = [];
            const removed: DeclarativeRule[] = [];
            const updated: UpdatedRule[] = [];

            for (const [id, rule2] of map2.entries()) {
                const rule1 = map1.get(id);
                if (!rule1) {
                    added.push(rule2);
                } else if (JSON.stringify(rule1) !== JSON.stringify(rule2)) {
                    updated.push({ before: rule1, after: rule2 });
                }
            }
            for (const [id, rule1] of map1.entries()) {
                if (!map2.has(id)) {
                    removed.push(rule1);
                }
            }

            onlySafe = reportUnsafeRules(added, 'Added', relPath, onlySafe);
            onlySafe = reportUnsafeRules(removed, 'Removed', relPath, onlySafe);
            onlySafe = reportUnsafeRules(updated, 'Updated', relPath, onlySafe, (r) => (r as UpdatedRule).after, true);
        }

        if (!onlySafe) {
            console.log('\n❌ There are changes in unsafe rules (see above)');
            process.exit(1);
        } else {
            console.log('✅ All changes in ruleset files are only in safe rules');
        }
    } catch (e: unknown) {
        console.error('Error:', e);
        process.exit(1);
    }
}

main();
