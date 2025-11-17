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
import { readFile } from 'fs/promises';

import { METADATA_RULESET_ID, MetadataRuleSet } from '@adguard/tsurlfilter/es/declarative-converter';
import { getRuleSetPath } from '@adguard/tsurlfilter/es/declarative-converter-utils';

/**
 * Reads a metadata rule set from a folder.
 *
 * @param folder The folder to read the metadata rule set from.
 *
 * @returns A Promise that resolves to the metadata rule set.
 */
export const readMetadataRuleSet = async (folder: string): Promise<MetadataRuleSet> => {
    const metadataRuleSetPath = getRuleSetPath(METADATA_RULESET_ID, folder);
    const content = await readFile(metadataRuleSetPath, 'utf-8');
    return MetadataRuleSet.deserialize(content);
};

/**
 * Extracts the original raw filter list from a rule set.
 *
 * @param ruleSetId The path to the rule set.
 * @param folder The folder containing the rule set.
 *
 * @returns A Promise that resolves to the original raw filter list.
 */
export const extractPreprocessedRawFilterList = async (
    ruleSetId: string,
    folder: string,
): Promise<string> => {
    const ruleSetPath = getRuleSetPath(ruleSetId, folder);
    const rawRuleSetContent = await readFile(ruleSetPath, 'utf-8');
    const ruleSetContent = JSON.parse(rawRuleSetContent);

    return ruleSetContent[0].metadata.rawFilterList;
};
