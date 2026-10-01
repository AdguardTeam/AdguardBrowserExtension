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
    extractRulesetId,
    getRulesetPath,
    METADATA_RULESET_ID,
    MetadataRuleset,
} from '@adguard/dnr-converter';

import { buildRulesetFile } from '../../helpers/dnr-ruleset-file';

/**
 * Number of rules to generate per oversized ruleset.
 * Each ruleset alone exceeds Chrome's ~330K static rules budget, so Chrome
 * cannot enable either of them. With smaller rulesets the test depends on
 * Chrome's accounting across restarts: `ruleset_2` is enabled by default in
 * the manifest, and after a browser restart Chrome does not count an already
 * enabled ruleset, so a second 200K ruleset still gets enabled.
 */
const OVERSIZED_RULESET_RULE_COUNT = 340_000;

/**
 * Declarative filter directory name inside the unpacked extension.
 */
const DECLARATIVE_DIR = 'filters/declarative';

/**
 * Names of the rulesets that will receive oversized versions for the rule limits test.
 */
const OVERSIZED_RULESET_NAMES = ['ruleset_2', 'ruleset_10'];

/**
 * Creates filter text with {@link OVERSIZED_RULESET_RULE_COUNT} unique
 * blocking rules; each converts to one declarative rule.
 *
 * @returns Filter list text.
 */
const createOversizedFilterText = (): string => {
    const rules: string[] = [];

    for (let i = 1; i <= OVERSIZED_RULESET_RULE_COUNT; i += 1) {
        rules.push(`||test-rule-${i}.adguard.com^$xmlhttprequest`);
    }

    return rules.join('\n');
};

/**
 * Replaces a ruleset file in the unpacked extension with an oversized
 * ruleset in the chunked format.
 *
 * @param declarativeDir Absolute path to the declarative filters directory.
 * @param rulesetName Ruleset identifier (e.g., "ruleset_2").
 * @param filterText Filter text to convert.
 *
 * @returns MD5 hex digest of the written file contents.
 *
 * @throws Error if the ruleset name has no filter id.
 */
const writeOversizedRuleset = async (
    declarativeDir: string,
    rulesetName: string,
    filterText: string,
): Promise<string> => {
    const filterId = extractRulesetId(rulesetName);
    if (filterId === null) {
        throw new Error(`Cannot extract filter id from ${rulesetName}`);
    }

    const content = await buildRulesetFile(filterId, filterText);
    await fs.writeFile(getRulesetPath(rulesetName, declarativeDir), content);

    return crypto.createHash('md5').update(content).digest('hex');
};

/**
 * Updates checksums in ruleset_0 to match replaced oversized rulesets.
 * Forces RulesetsLoaderApi to reload the oversized rulesets (cache miss on
 * checksum change).
 *
 * @param declarativeDir Absolute path to the declarative filters directory.
 * @param checksums Map of ruleset name → new MD5 checksum.
 */
const updateRulesetZeroChecksums = async (
    declarativeDir: string,
    checksums: Record<string, string>,
): Promise<void> => {
    const rulesetZeroPath = getRulesetPath(METADATA_RULESET_ID, declarativeDir);
    const metadataRuleset = MetadataRuleset.deserialize(await fs.readFile(rulesetZeroPath, 'utf-8'));

    for (const [name, md5] of Object.entries(checksums)) {
        metadataRuleset.setChecksum(name, md5);
    }

    await fs.writeFile(rulesetZeroPath, metadataRuleset.serialize());
};

/**
 * Generates oversized rulesets, replaces the originals in the unpacked extension,
 * and updates checksums in ruleset_0 — all in one call.
 *
 * @param extensionPath Absolute path to the unpacked extension root.
 */
export const applyOversizedRulesets = async (extensionPath: string): Promise<void> => {
    const declarativeDir = path.join(extensionPath, DECLARATIVE_DIR);
    const filterText = createOversizedFilterText();
    const checksums: Record<string, string> = {};

    for (const name of OVERSIZED_RULESET_NAMES) {
        checksums[name] = await writeOversizedRuleset(declarativeDir, name, filterText);
    }

    await updateRulesetZeroChecksums(declarativeDir, checksums);
};
