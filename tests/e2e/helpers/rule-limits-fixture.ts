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

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
    type DeclarativeRule,
    ResourceType,
    RuleActionType,
} from '@adguard/tsurlfilter/es/declarative-converter';
import { getRuleSetPath } from '@adguard/tsurlfilter/es/declarative-converter-utils';

/**
 * Number of rules to generate per oversized ruleset.
 * Two rulesets × 200K = 400K total, exceeding Chrome's ~330K static rules budget.
 */
const OVERSIZED_RULESET_RULE_COUNT = 200_000;

/**
 * Declarative filter directory name inside the unpacked extension.
 */
const DECLARATIVE_DIR = 'filters/declarative';

/**
 * Metadata ruleset identifier.
 */
const METADATA_RULESET_ID = 'ruleset_0';

/**
 * Shape of a single generated DNR rule entry in an oversized ruleset.
 */
type GeneratedDnrRule = DeclarativeRule & {
    /**
     * Empty metadata object required by the extension's ruleset JSON format —
     * every rule entry must have it, though the oversized test rules carry no
     * actual metadata.
     */
    metadata: Record<string, never>;
};

/**
 * Generates a single DNR rule entry.
 *
 * @param i Rule index (used for unique id and urlFilter).
 *
 * @returns DNR rule object.
 */
const createRuleEntry = (i: number): GeneratedDnrRule => ({
    id: i,
    action: { type: RuleActionType.BLOCK },
    condition: {
        urlFilter: `test-rule-${i}.adguard.com`,
        resourceTypes: [ResourceType.XmlHttpRequest],
    },
    metadata: {},
});

/**
 * Generates an oversized ruleset JSON file at the given path.
 *
 * @param filePath Absolute path where the JSON file should be written.
 *
 * @returns MD5 hex digest of the written file contents.
 */
const generateOversizedRuleset = async (filePath: string): Promise<string> => {
    const parts: string[] = [];

    parts.push('[\n');

    for (let i = 1; i <= OVERSIZED_RULESET_RULE_COUNT; i += 1) {
        const entry = JSON.stringify(createRuleEntry(i));
        const line = (i < OVERSIZED_RULESET_RULE_COUNT)
            ? `${entry},\n`
            : `${entry}\n`;

        parts.push(line);
    }

    parts.push(']\n');

    const data = parts.join('');
    await fs.writeFile(filePath, data);

    return crypto.createHash('md5').update(data).digest('hex');
};

/**
 * Replaces a ruleset file in the unpacked extension with an oversized version.
 *
 * @param extensionDir Absolute path to the unpacked extension root.
 * @param rulesetName Ruleset identifier (e.g., "ruleset_2").
 * @param oversizedRulesetPath Absolute path to the oversized ruleset JSON file.
 */
const replaceRulesetWithOversized = async (
    extensionDir: string,
    rulesetName: string,
    oversizedRulesetPath: string,
): Promise<void> => {
    const declarativeDir = path.join(extensionDir, DECLARATIVE_DIR);
    const destFile = getRuleSetPath(rulesetName, declarativeDir);

    await fs.copyFile(oversizedRulesetPath, destFile);
};

/**
 * Shape of a single entry in ruleset_0.json.
 *
 * Contains a dummy DNR rule and a metadata section with checksums
 * for all bundled rulesets.
 */
interface MetadataRulesetEntry {
    id: number;
    action: { type: string };
    condition: { urlFilter: string; resourceTypes: string[] };
    metadata: {
        byteRangeMapsCollection: Record<string, unknown>;
        checksums: Record<string, string>;
    };
}

/**
 * Updates checksums in ruleset_0.json to match the replaced oversized rulesets.
 *
 * `RuleSetsLoaderApi.syncRuleSetWithIdb` re-syncs a ruleset from disk only when
 * its checksum changes. Updating the checksum here forces a cache miss so
 * the oversized ruleset is loaded.
 *
 * @param extensionDir Absolute path to the unpacked extension root.
 * @param checksums Map of ruleset name → new MD5 checksum.
 *
 * @throws Error if ruleset_0.json has an unexpected structure.
 */
const updateRulesetZeroChecksums = async (
    extensionDir: string,
    checksums: Record<string, string>,
): Promise<void> => {
    const declarativeDir = path.join(extensionDir, DECLARATIVE_DIR);
    const rulesetZeroPath = getRuleSetPath(METADATA_RULESET_ID, declarativeDir);

    const raw = await fs.readFile(rulesetZeroPath, 'utf-8');
    const parsed: MetadataRulesetEntry[] = JSON.parse(raw);

    const firstEntry = parsed[0];

    if (!firstEntry) {
        throw new Error('ruleset_0.json: expected non-empty array');
    }

    if (!firstEntry.metadata || typeof firstEntry.metadata.checksums !== 'object') {
        throw new Error('ruleset_0.json: metadata.checksums not found or not an object');
    }

    for (const [name, md5] of Object.entries(checksums)) {
        firstEntry.metadata.checksums[name] = md5;
    }

    await fs.writeFile(rulesetZeroPath, `${JSON.stringify(parsed)}\n`);
};

/**
 * Names of the rulesets that will receive oversized versions for the rule limits test.
 */
const OVERSIZED_RULESET_NAMES = ['ruleset_2', 'ruleset_10'];

/**
 * Generates oversized rulesets, replaces the originals in the unpacked extension,
 * and updates checksums in ruleset_0.json — all in one call.
 *
 * @param extensionPath Absolute path to the unpacked extension root.
 */
export const applyOversizedRulesets = async (extensionPath: string): Promise<void> => {
    // Temporary directory for generated oversized rulesets — lives next to the
    // unpacked extension. Cleaned up in the finally block below; the parent
    // tmp/e2e cleanup covers abnormal exits should anything go wrong.
    const tmpDir = path.join(extensionPath, '..', '.oversized-rulesets-tmp');
    await fs.mkdir(tmpDir, { recursive: true });

    try {
        const checksums: Record<string, string> = {};

        for (const name of OVERSIZED_RULESET_NAMES) {
            const oversizedPath = path.join(tmpDir, `${name}.json`);

            checksums[name] = await generateOversizedRuleset(oversizedPath);
            await replaceRulesetWithOversized(extensionPath, name, oversizedPath);
        }

        await updateRulesetZeroChecksums(extensionPath, checksums);
    } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
    }
};
