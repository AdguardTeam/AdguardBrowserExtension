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
import { readFile } from 'fs/promises';

import {
    METADATA_RULESET_ID,
    MetadataRuleset,
    getRulesetPath,
} from '@adguard/dnr-converter';

/**
 * Reads a metadata ruleset from a folder.
 *
 * @param folder The folder to read the metadata ruleset from.
 *
 * @returns A Promise that resolves to the metadata ruleset.
 */
export const readMetadataRuleset = async (folder: string): Promise<MetadataRuleset> => {
    const metadataRulesetPath = getRulesetPath(METADATA_RULESET_ID, folder);
    const content = await readFile(metadataRulesetPath, 'utf-8');
    return MetadataRuleset.deserialize(content);
};

/**
 * Extracts the original filter content from a ruleset.
 *
 * @param rulesetId The path to the ruleset.
 * @param folder The folder containing the ruleset.
 *
 * @returns A Promise that resolves to the original filter content.
 */
export const extractPreprocessedFilterContent = async (
    rulesetId: string,
    folder: string,
): Promise<string> => {
    const rulesetPath = getRulesetPath(rulesetId, folder);
    const rawRulesetContent = await readFile(rulesetPath, 'utf-8');
    const rulesetContent = JSON.parse(rawRulesetContent);

    return rulesetContent[0].metadata.filterContent;
};
