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

/* eslint-disable no-console */

import fs from 'node:fs';
import path from 'node:path';

import {
    CosmeticRuleParser,
    RuleCategory,
    CosmeticRuleType,
} from '@adguard/agtree';

import type { Testcase } from '../browser-test/testcase';
import { TESTCASES_BASE_URL } from '../browser-test/test-constants';

/**
 * Base URL for testcases data API.
 */
const TESTCASES_DATA_URL = `${TESTCASES_BASE_URL}/data.json`;

/**
 * Path to the file where TESTCASES_RULES array should be updated.
 *
 * Update not resulted local_script_rules.js, but array inside code to keep
 * readability and comments.
 */
const TARGET_FILE_PATH = path.join(process.cwd(), 'tools/resources/testcases-rules.ts');

/**
 * All JS rules extracted from testcase.
 */
type ProcessedTestcaseInfo = {
    id: number;
    title: string;
    rulesUrl: string;
    jsRules: string[];
};

/**
 * Fetches testcases data from the API.
 *
 * @returns Array of testcase objects.
 */
const fetchTestcasesData = async (): Promise<Testcase[]> => {
    const response = await fetch(TESTCASES_DATA_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch testcases data: ${response.statusText}`);
    }

    const data = await response.json() as Testcase[];
    console.log(`Fetched ${data.length} testcases`);

    return data;
};

/**
 * Downloads rules from a given URL.
 *
 * @param rulesUrl URL to download rules from.
 *
 * @returns Rules content as string.
 */
const downloadRules = async (rulesUrl: string): Promise<string> => {
    const response = await fetch(rulesUrl);
    if (!response.ok) {
        throw new Error(`Failed to download rules from ${rulesUrl}: ${response.statusText}`);
    }

    return response.text();
};

/**
 * Extracts script and scriptlet rules from raw rules text.
 *
 * @param rulesText Raw rules text.
 *
 * @returns Array of script and scriptlet rules.
 */
const extractScriptRules = (rulesText: string): string[] => {
    const lines = rulesText.split('\n');
    const scriptRules: string[] = [];

    for (const line of lines) {
        const trimmedLine = line.trim();

        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith('!')) {
            continue;
        }

        try {
            // Parse the rule to check if it's a cosmetic rule
            const ruleNode = CosmeticRuleParser.parse(trimmedLine);

            // Check if it's a script rule
            if (ruleNode
                && ruleNode.category === RuleCategory.Cosmetic
                && ruleNode.type === CosmeticRuleType.JsInjectionRule
            ) {
                scriptRules.push(trimmedLine);
            }
        } catch (error) {
            // Skip invalid rules
            continue;
        }
    }

    return scriptRules;
};

/**
 * Processes a single testcase to extract script rules.
 *
 * @param testcase Testcase object to process.
 *
 * @returns Object containing testcase info and extracted script rules.
 */
const processTestcase = async (testcase: Testcase): Promise<ProcessedTestcaseInfo | null> => {
    if (!testcase.rulesUrl) {
        return null;
    }

    try {
        const url = `${TESTCASES_BASE_URL}/${testcase.rulesUrl}`;

        console.log(`Downloading rules from ${url}`);

        const rulesText = await downloadRules(url);
        const jsRules = extractScriptRules(rulesText);

        if (jsRules.length > 0) {
            console.log(`  Found ${jsRules.length} script rules`);

            return {
                id: testcase.id,
                title: testcase.title,
                rulesUrl: url,
                jsRules,
            };
        }

        return null;
    } catch (error) {
        console.error(`Error processing testcase ${testcase.id}:`, error);
        return null;
    }
};

/**
 * Generates the formatted TESTCASES_RULES array content.
 *
 * @param processedTestcases Array of processed testcase info.
 *
 * @returns Formatted array content as string.
 */
const generateTestcasesRulesArray = (
    processedTestcases: ProcessedTestcaseInfo[],
): string => {
    const lines = [
        'export const TESTCASES_RULES = [',
    ];

    // Add all unique rules with comments
    processedTestcases.forEach((testcase) => {
        if (testcase.jsRules.length === 0) {
            return;
        }

        lines.push(`    // Source: ${testcase.rulesUrl}`);
        testcase.jsRules.forEach((rule) => {
            lines.push(`    \`${rule}\`,`);
        });
    });

    lines.push('];');

    return lines.join('\n');
};

/**
 * Updates the TESTCASES_RULES array in the target file with new rules.
 *
 * @param processedTestcases Array of processed testcase info.
 */
const updateTestcasesRulesInFile = async (
    processedTestcases: ProcessedTestcaseInfo[],
): Promise<void> => {
    // Read the current file content
    const fileContent = await fs.promises.readFile(TARGET_FILE_PATH, 'utf8');

    // Generate the new TESTCASES_RULES array content
    const rulesArrayContent = generateTestcasesRulesArray(processedTestcases);

    // Find and replace the TESTCASES_RULES array
    const startMarker = 'export const TESTCASES_RULES = [';
    const endMarker = '];';

    const startIndex = fileContent.indexOf(startMarker);
    if (startIndex === -1) {
        throw new Error('Could not find TESTCASES_RULES array in the target file');
    }

    const endIndex = fileContent.indexOf(endMarker, startIndex + startMarker.length);
    if (endIndex === -1) {
        throw new Error('Could not find end of TESTCASES_RULES array in the target file');
    }

    // Replace the content between markers
    const before = fileContent.substring(0, startIndex);
    const after = fileContent.substring(endIndex + endMarker.length);
    const newContent = before + rulesArrayContent + after;

    // Write the updated content back to file
    await fs.promises.writeFile(TARGET_FILE_PATH, newContent, 'utf8');
};

/**
 * Updates testcases script rules by fetching all testcases data and updating
 * the TESTCASES_RULES array in the target file.
 */
export const updateTestcasesScriptRules = async (): Promise<void> => {
    console.log('Downloading testcases data...');
    const testcasesData = await fetchTestcasesData();

    console.log(`Found ${testcasesData.length} testcases, processing rules...`);

    const processedTestcases: ProcessedTestcaseInfo[] = [];

    for (const testcase of testcasesData) {
        console.log('\n');

        if (!testcase.rulesUrl) {
            console.log(`Skipping testcase #${testcase.id}: no rulesUrl`);
            continue;
        }

        try {
            console.log(`Processing testcase #${testcase.id}: ${testcase.title}`);

            const processed = await processTestcase(testcase);

            if (!processed) {
                console.log(`Processed testcase #${testcase.id} (${testcase.rulesUrl}): no script rules found.`);
                continue;
            }

            processedTestcases.push(processed);

            console.log(`Processed testcase #${testcase.id} (${testcase.rulesUrl}), found ${processed.jsRules.length} script rules.`);
        } catch (error) {
            console.error(`Failed to process testcase #${testcase.id}:`, error);
        }
    }

    // Update the TESTCASES_RULES array in the target file
    await updateTestcasesRulesInFile(processedTestcases);

    const allJsRules = new Set<string>(processedTestcases.flatMap((testcase) => testcase.jsRules));

    console.log('\n');
    console.log(`✓ Successfully processed ${testcasesData.length} testcases`);
    console.log(`✓ Found ${allJsRules.size} unique JS rules`);
    console.log(`✓ Updated TESTCASES_RULES array in ${TARGET_FILE_PATH}`);
};

updateTestcasesScriptRules();
