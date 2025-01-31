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
import { readFile, open as openFile } from 'fs/promises';

import {
    METADATA_RULESET_ID,
    MetadataRuleSet,
    RuleSetByteRangeCategory,
} from '@adguard/tsurlfilter/es/declarative-converter';
import { getRuleSetPath } from '@adguard/tsurlfilter/es/declarative-converter-utils';
import { ByteRange } from '@adguard/tsurlfilter';

/**
 * Reads a specific byte range from a file.
 *
 * @param filePath The path to the file to read from.
 * @param byteRange The byte range to read, with start and end properties.
 *
 * @returns A Promise that resolves to the string content of the byte range.
 *
 * @throws If the byte range is invalid.
 */
const readByteRangeFromFile = async (filePath: string, byteRange: ByteRange): Promise<string> => {
    const { start, end } = byteRange;

    if (start < 0 || end < start) {
        throw new Error(
            'Invalid byte range: start must be non-negative, and end must be greater than or equal to start.',
        );
    }

    const fileHandle = await openFile(filePath, 'r');

    try {
        const bufferSize = end - start + 1;
        const buffer = new Uint8Array(bufferSize);

        await fileHandle.read(buffer, 0, bufferSize, start);

        return new TextDecoder().decode(buffer);
    } finally {
        // Ensure the file is closed
        await fileHandle.close();
    }
};

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
 * @param metadataRuleSet The metadata rule set.
 * @param folder The folder containing the rule set.
 *
 * @returns A Promise that resolves to the original raw filter list.
 *
 * @throws If the rule set ID cannot be extracted or the byte range for the original raw filter list is not found.
 */
export const extractPreprocessedRawFilterList = async (
    ruleSetId: string,
    metadataRuleSet: MetadataRuleSet,
    folder: string,
): Promise<string> => {
    const preprocessedFilterListRawRange = metadataRuleSet.getByteRange(
        ruleSetId,
        RuleSetByteRangeCategory.PreprocessedFilterListRaw,
    );

    if (!preprocessedFilterListRawRange) {
        throw new Error(
            `Failed to find byte range for preprocessed filter list raw in metadata rule set: ${ruleSetId}`,
        );
    }

    const ruleSetPath = getRuleSetPath(ruleSetId, folder);

    return readByteRangeFromFile(
        ruleSetPath,
        preprocessedFilterListRawRange,
    ).then(JSON.parse);
};
