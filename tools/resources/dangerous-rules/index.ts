/* eslint-disable no-restricted-syntax, no-console */
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

import { scanner } from './scanner';
import { SafetyChecker } from './safety-checker';

const FILTERS_PATH = './Extension/filters';

/**
 * Validator function to check for potentially dangerous rules.
 *
 * @param openAiKey - OpenAI API key.
 *
 * @throws Error if dangerous rules are found.
 */
export const findDangerousRules = async (openAiKey: string): Promise<void> => {
    const safetyChecker = new SafetyChecker(openAiKey);
    const potentialDangerousRules = await scanner(FILTERS_PATH);

    // Extracting script text from each rule for analysis with the OpenAI API
    const scriptTexts = potentialDangerousRules
        .map((rule) => rule.text.split('#%#')[1])
        .filter((rule): rule is string => !!rule);

    // Removing duplicates to optimize the checking process
    const uniqScriptTexts = [...new Set([...scriptTexts])];

    console.log(
        'Number of found unique script texts in the rules that are potentially dangerous:',
        uniqScriptTexts.length,
    );

    console.log('Analyzing script texts...');
    const results = [];
    let rulesLeft = uniqScriptTexts.length; // Initialize the counter with the total number of rules

    for (const rule of uniqScriptTexts) {
        const result = await safetyChecker.checkRuleSafety(rule);
        if (result.type === 'error') {
            throw new Error(`An error occurred while checking the rule: ${rule}`);
        }
        results.push(result);

        // Decrement the counter and log the number of rules left
        rulesLeft -= 1;
        console.log(`Rules left to check: ${rulesLeft}`);
    }

    // Identifying and logging any dangerous rules
    const dangerousRules = results.filter((result) => result.type === 'dangerous');
    if (dangerousRules.length > 0) {
        console.log('Dangerous rules found:', dangerousRules);
        console.log('Please report them to the filter developers');
        throw new Error('Found dangerous rules');
    } else {
        console.log('No dangerous rules found');
    }
};
