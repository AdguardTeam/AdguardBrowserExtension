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

import * as z from 'zod';

import { OutputByteBuffer, RuleCategory } from '@adguard/agtree';
import { RuleConverter } from '@adguard/agtree/converter';
import { RuleGenerator } from '@adguard/agtree/generator';
import { defaultParserOptions, RuleParser } from '@adguard/agtree/parser';
import { RuleSerializer } from '@adguard/agtree/serializer';
import { findNextLineBreakIndex } from '@adguard/tsurlfilter';

import { logger } from '../../../../../common/logger';

const LF = '\n';
const EMPTY_STRING = '';

/**
 * Source map.
 *
 * @note Since serialized rule nodes are not store original rule text, we need this source map between the
 * serialized filter list and the raw filter list.
 */
export const filterListSourceMapValidator = z.record(
    /**
     * Rule start index in the converted list's byte buffer.
     */
    z.string(),

    /**
     * Rule start index in the raw converted list.
     */
    z.number(),
);

export type FilterListSourceMap = z.infer<typeof filterListSourceMapValidator>;

/**
 * Validator for filter list conversion map.
 *
 * @note This is only needed to show the original rule text in the filtering log if a converted rule is applied.
 */
export const filterListConversionMapValidator = z.record(
    /**
     * Converted rule line start offset.
     */
    z.string(),

    /**
     * Original rule text.
     */
    z.string(),
);

export type FilterListConversionMap = z.infer<typeof filterListConversionMapValidator>;

/**
 * Validator for filter list chunks.
 */
export const filterListChunksValidator = z.array(z.custom<Uint8Array>((val) => val instanceof Uint8Array));

/**
 * Validator for preprocessed filter list.
 */
export const preprocessedFilterListValidator = z.object({
    /**
     * Raw processed filter list.
     */
    rawFilterList: z.string(),

    /**
     * Processed filter list, but in a serialized form.
     */
    filterList: filterListChunksValidator,

    /**
     * Map of converted rules to original rules.
     */
    conversionMap: filterListConversionMapValidator,

    /**
     * Source map.
     */
    sourceMap: filterListSourceMapValidator,
});

export type PreprocessedFilterList = z.infer<typeof preprocessedFilterListValidator>;

/**
 * AGTree parser options for the preprocessor.
 */
export const PREPROCESSOR_AGTREE_OPTIONS = {
    ...defaultParserOptions,
    includeRaws: false,
    isLocIncluded: false,
    ignoreComments: false,
    // TODO: Add support for host rules + in the converter
    parseHostRules: false,
};

/**
 * A "lightweight" version of the {@link PreprocessedFilterList} type,
 * which contains only the "rawFilterList" and "conversionMap" fields.
 */
export type LightweightPreprocessedFilterList = Pick<PreprocessedFilterList, 'rawFilterList' | 'conversionMap'>;

/**
 * Utility class for pre-processing filter lists before they are used by the AdGuard filtering engine.
 *
 * Concept:
 *
 * Right after a filter list is downloaded, we iterate over its rules and do the following:
 *   1. Parse rule text to AST (Abstract Syntax Tree) (if possible).
 *   2. Convert rule node to AdGuard format (if possible / needed).
 *
 * During this conversion, we also produce two maps:
 *    - Source map:     For performance reasons, we don't store the original rule text in the AST.
 *                      We store AST in a binary serialized format.
 *                      This source map is used to map the rule start index from the serialized filter list to
 *                      its start index in the raw filter list (converted filter list). This is needed to show
 *                      the exact applied rule in the filtering log. This rule text maybe a converted rule,
 *                      but in this case, we can get its original rule text from the conversion map
 *                      (for filtering engine, only the converted filter list is needed).
 *    - Conversion map: Maps the converted rule text to its original rule text. This is needed to show the
 *                      original rule text in the filtering log if a converted rule is applied.
 */
export class FilterListPreprocessor {
    /**
     * Processes the raw filter list and converts it to the AdGuard format.
     *
     * @param filterList Raw filter list to convert.
     * @param parseHosts If true, the preprocessor will parse host rules.
     *
     * @returns A {@link PreprocessedFilterList} object which contains the converted filter list,
     * the mapping between the original and converted rules, and the source map.
     */
    public static preprocess(filterList: string, parseHosts = false): PreprocessedFilterList {
        const filterListLength = filterList.length;

        const sourceMap: FilterListSourceMap = {};
        const conversionMap: FilterListConversionMap = {};
        const rawFilterList: string[] = [];
        const convertedFilterList = new OutputByteBuffer();
        const firstLineBreakData = findNextLineBreakIndex(filterList);

        let inputOffset = 0;
        let outputOffset = 0;
        let previousLineBreak = firstLineBreakData[1] > 0
            ? filterList.slice(firstLineBreakData[0], firstLineBreakData[0] + firstLineBreakData[1])
            : LF;

        while (inputOffset < filterListLength) {
            const [lineBreakIndex, lineBreakLength] = findNextLineBreakIndex(filterList, inputOffset);
            const ruleText = filterList.slice(inputOffset, lineBreakIndex);
            const lineBreak = filterList.slice(lineBreakIndex, lineBreakIndex + lineBreakLength);

            // parse and convert can throw an error, so we need to catch them
            try {
                const ruleNode = RuleParser.parse(ruleText, {
                    ...PREPROCESSOR_AGTREE_OPTIONS,
                    parseHostRules: parseHosts,
                });

                if (ruleNode.category === RuleCategory.Empty || ruleNode.category === RuleCategory.Comment) {
                    // Add empty lines and comments as is to the converted filter list,
                    // but not to the output byte buffer / source map.
                    rawFilterList.push(ruleText);
                    rawFilterList.push(lineBreak);

                    outputOffset += ruleText.length + lineBreakLength;
                    inputOffset = lineBreakIndex + lineBreakLength;
                    previousLineBreak = lineBreak;
                    continue;
                }

                const conversionResult = RuleConverter.convertToAdg(ruleNode);

                if (conversionResult.isConverted) {
                    // Maybe the rule is the last line without a line break in the input filter list
                    // but we need to convert it to multiple rules.
                    // In this case, we should use the last used line break before the conversion.
                    const convertedRulesLineBreak = lineBreakLength > 0 ? lineBreak : previousLineBreak;
                    const numberOfConvertedRules = conversionResult.result.length;

                    // Note: 1 rule can be converted to multiple rules
                    for (let i = 0; i < conversionResult.result.length; i += 1) {
                        const convertedRuleNode = conversionResult.result[i]!;

                        // In this case we should generate the rule text from the AST, because its converted,
                        // i.e. it's not the same as the original rule text.
                        const convertedRuleText = RuleGenerator.generate(convertedRuleNode);
                        rawFilterList.push(convertedRuleText);
                        rawFilterList.push(i === numberOfConvertedRules - 1 ? lineBreak : convertedRulesLineBreak);

                        const bufferOffset = convertedFilterList.currentOffset;

                        // Store the converted rules and the mapping between the original and converted rules
                        conversionMap[outputOffset] = ruleText;
                        sourceMap[bufferOffset] = outputOffset;

                        RuleSerializer.serialize(convertedRuleNode, convertedFilterList);

                        outputOffset += convertedRuleText.length + (
                            i === numberOfConvertedRules - 1
                                ? lineBreakLength
                                : convertedRulesLineBreak.length
                        );
                    }
                } else {
                    // If the rule is not converted, we should store the original rule text in the raw filter list.
                    rawFilterList.push(ruleText);
                    rawFilterList.push(lineBreak);

                    const bufferOffset = convertedFilterList.currentOffset;

                    // Store the converted rules and the mapping between the original and converted rules
                    sourceMap[bufferOffset] = outputOffset;

                    RuleSerializer.serialize(ruleNode, convertedFilterList);

                    outputOffset += ruleText.length + lineBreakLength;
                }
            } catch (error: unknown) {
                // Log issues to info channel to make them visible for
                // filter maintainers. See AG-37460.
                logger.info(`[ext.FilterListPreprocessor.preprocess]: failed to process rule: '${ruleText}' due to:`, error);

                // Add invalid rules as is to the converted filter list,
                // but not to the output byte buffer / source map.
                rawFilterList.push(ruleText);
                rawFilterList.push(lineBreak);

                outputOffset += ruleText.length + lineBreakLength;
            }

            // Move to the next line
            inputOffset = lineBreakIndex + lineBreakLength;
            previousLineBreak = lineBreak;
        }

        return {
            filterList: convertedFilterList.getChunks(),
            rawFilterList: rawFilterList.join(EMPTY_STRING),
            conversionMap,
            sourceMap,
        };
    }

    /**
     * A "lightweight" version of the preprocess method. This method is necessary because, in the rulesets,
     * we store the converted raw list and the conversion map, but not the entire preprocessed filter list.
     * This method helps us regenerate the serialized filter list and the source map fields with less overhead
     * compared to the full preprocess method.
     *
     * @param preprocessedFilterList Preprocessed filter list,
     * which contains the raw filter list and the conversion map.
     * @param parseHosts If true, the preprocessor will parse host rules.
     *
     * @returns Preprocessed filter list with the "filterList" and "sourceMap" fields.
     */
    public static preprocessLightweight(
        preprocessedFilterList: LightweightPreprocessedFilterList,
        parseHosts = false,
    ): PreprocessedFilterList {
        const { rawFilterList, conversionMap } = preprocessedFilterList;
        const { length } = rawFilterList;

        const sourceMap: FilterListSourceMap = {};
        const filterList = new OutputByteBuffer();

        let inputOffset = 0;
        let outputOffset = 0;

        while (inputOffset < length) {
            const [lineBreakIndex, lineBreakLength] = findNextLineBreakIndex(rawFilterList, inputOffset);
            const ruleText = rawFilterList.slice(inputOffset, lineBreakIndex);

            try {
                const ruleNode = RuleParser.parse(ruleText, {
                    ...PREPROCESSOR_AGTREE_OPTIONS,
                    parseHostRules: parseHosts,
                });

                // Ignore empty lines and comments from the binary filter list
                if (ruleNode.category !== RuleCategory.Empty && ruleNode.category !== RuleCategory.Comment) {
                    const bufferOffset = filterList.currentOffset;

                    sourceMap[bufferOffset] = outputOffset;

                    RuleSerializer.serialize(ruleNode, filterList);
                }
            } catch (error: unknown) {
                // Log issues to info channel to make them visible for
                // filter maintainers. See AG-37460.
                logger.info(`[ext.FilterListPreprocessor.preprocessLightweight]: failed to process rule: '${ruleText}' due to:`, error);
            }

            outputOffset += ruleText.length + lineBreakLength;

            // Move to the next line
            inputOffset = lineBreakIndex + lineBreakLength;
        }

        return {
            // TODO: consider returning an empty array if the filter list is empty
            filterList: filterList.getChunks(),
            rawFilterList,
            conversionMap,
            sourceMap,
        };
    }

    /**
     * Gets the original filter list text from the preprocessed filter list.
     *
     * @param preprocessedFilterList Preprocessed filter list.
     *
     * @returns Original filter list text.
     */
    public static getOriginalFilterListText(preprocessedFilterList: LightweightPreprocessedFilterList): string {
        const { rawFilterList, conversionMap } = preprocessedFilterList;
        const { length } = rawFilterList;
        const result: string[] = [];

        let offset = 0;
        let prevLineStart = -1;

        let lineBreakIndex = -1;
        let lineBreakLength = 0;

        while (offset < length) {
            [lineBreakIndex, lineBreakLength] = findNextLineBreakIndex(rawFilterList, offset);
            const lineBreak = rawFilterList.slice(lineBreakIndex, lineBreakIndex + lineBreakLength);

            const originalRule = conversionMap[offset];

            // One rule can be converted to multiple rules - in this case we should put the original rule text only once
            // If there is such a case, these rules follow one after the other
            if (!(originalRule && originalRule === conversionMap[prevLineStart])) {
                result.push(originalRule ?? rawFilterList.slice(offset, lineBreakIndex));
                result.push(lineBreak);
            }

            prevLineStart = offset;
            offset = lineBreakIndex + lineBreakLength;
        }

        // Add an empty rule if final new line is present
        if (lineBreakLength > 0) {
            result.push(EMPTY_STRING);
        }

        return result.join(EMPTY_STRING);
    }

    /**
     * Gets the original rules from the preprocessed filter list.
     *
     * @param preprocessedFilterList Preprocessed filter list.
     *
     * @returns Array of original rules.
     */
    public static getOriginalRules(preprocessedFilterList: LightweightPreprocessedFilterList): string[] {
        const { rawFilterList, conversionMap } = preprocessedFilterList;
        const { length } = rawFilterList;
        const result: string[] = [];

        let offset = 0;
        let prevLineStart = -1;

        let lineBreakIndex = -1;
        let lineBreakLength = 0;

        while (offset < length) {
            [lineBreakIndex, lineBreakLength] = findNextLineBreakIndex(rawFilterList, offset);

            const originalRule = conversionMap[offset];

            // One rule can be converted to multiple rules - in this case we should put the original rule text only once
            // If there is such a case, these rules follow one after the other
            if (!(originalRule && originalRule === conversionMap[prevLineStart])) {
                result.push(originalRule ?? rawFilterList.slice(offset, lineBreakIndex));
            }

            prevLineStart = offset;
            offset = lineBreakIndex + lineBreakLength;
        }

        // Add an empty rule if final new line is present
        if (lineBreakLength > 0) {
            result.push(EMPTY_STRING);
        }

        return result;
    }

    /**
     * Creates an empty preprocessed filter list.
     *
     * @note It gives the same result as the {@link preprocess} method with an empty filter list:
     * ```ts
     * FilterListPreprocessor.preprocess('');
     * ```
     *
     * @returns An empty preprocessed filter list.
     */
    public static createEmptyPreprocessedFilterList(): PreprocessedFilterList {
        // Note: need to use OutputByteBuffer, because it writes the schema version to the buffer
        const buffer = new OutputByteBuffer();
        return {
            // TODO: consider returning an empty array
            filterList: buffer.getChunks(),
            rawFilterList: '',
            conversionMap: {},
            sourceMap: {},
        };
    }
}
