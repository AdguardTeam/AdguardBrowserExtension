/* eslint-disable max-len,no-console */
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

import OpenAI from 'openai';
import 'dotenv/config';

import { dangerousRules } from './samples/dangerous';
import { safeRules } from './samples/safe';
import { type RuleSample } from './samples/samples-types';

/**
 * Result type.
 */
type SafetyCheckResult = {
    rule: string;
    type: string;
    reason: string;
};

/**
 * Response type.
 */
type AIResponse = {
    type: string;
    reason: string;
};

/**
 * Returns a string with rules and reasons separated by new lines.
 *
 * @param rules Array of rules with reasons.
 *
 * @returns String with rules and reasons separated by new lines.
 */
const getRulesText = (rules: RuleSample[]): string => {
    return rules.map((rule) => `${rule.rule}\nReason: ${rule.reason}`).join('\n');
};

/**
 * Dangerous rules used for creating prompts for the OpenAI API.
 * The number here is lower than that of safe rules due to a smaller sample size of dangerous rules.
 */
const DANGEROUS_RULES_COUNT = 5;

/**
 * Safe rules used for creating prompt to openai api.
 * Not all rules are used because of tokens' limit.
 */
const SAFE_RULES_COUNT = 20;

/**
 * Safety checker class
 * Uses OpenAI API to check if a rule is safe or dangerous.
 */
class SafetyChecker {
    /**
     * OpenAI API client.
     *
     * @private
     */
    private openai: OpenAI;

    /**
     * Cache to store the results of the analysis to avoid repeated calls to the API.
     *
     * @private
     */
    private cache: Map<string, SafetyCheckResult> = new Map();

    /**
     * Constructor.
     * Initializes the OpenAI API client.
     *
     * @param apiKey OpenAI API key.
     */
    constructor(apiKey: string) {
        this.openai = new OpenAI({ apiKey });
    }

    /**
     * Checks if a script text is safe or dangerous via OpenAI API.
     *
     * @param scriptText Script text to check.
     *
     * @returns Response from the API.
     */
    async checkScriptText(scriptText: string): Promise<AIResponse> {
        const prompt = SafetyChecker.buildPrompt();
        const chatCompletion = await this.openai.chat.completions.create({
            model: 'gpt-5.2',
            messages: [
                {
                    role: 'system',
                    content: prompt,
                },
                {
                    role: 'user',
                    content: `For the following rule, start your response with "Type: " followed strictly by lowercase "dangerous" or "not dangerous". Then, explain why by prefixing with "Reason: ".\n${scriptText}`,
                },
            ],
        });

        const analysis = chatCompletion.choices[0]?.message?.content
            ? chatCompletion.choices[0].message.content.trim()
            : 'Analysis unavailable.';

        // Parsing the structured response
        const typeMatch = analysis.match(/Type: (dangerous|not dangerous)/);
        if (!typeMatch) {
            console.error('Type not found in response: ', JSON.stringify(chatCompletion), scriptText);
            throw new Error('Type not found in response');
        }
        const reasonMatch = analysis.match(/Reason: (.+)/);

        const type = typeMatch ? typeMatch[1]! : 'unknown';
        const reason = reasonMatch && reasonMatch[1] ? reasonMatch[1] : 'Reason unavailable.';

        return {
            type,
            reason,
        };
    }

    /**
     * Checks if a rule is safe or dangerous via OpenAI API.
     *
     * @param scriptText Script text to check.
     *
     * @returns SafetyCheckResult with the result of the analysis.
     */
    async checkRuleSafety(scriptText: string): Promise<SafetyCheckResult> {
        if (this.cache.has(scriptText)) {
            return this.cache.get(scriptText)!;
        }

        try {
            const checkResult = await this.checkScriptText(scriptText);
            const result = {
                rule: scriptText,
                type: checkResult.type,
                reason: checkResult.reason,
            };
            this.cache.set(scriptText, result);

            return result;
        } catch (error) {
            console.error('Error analyzing rule:', error);
            const errorResult = {
                rule: scriptText,
                type: 'error',
                reason: 'Error analyzing the rule',
            };
            this.cache.set(scriptText, errorResult);
            return errorResult;
        }
    }

    /**
     * Builds the prompt for the OpenAI API.
     *
     * @returns Prompt string.
     *
     * @private
     */
    private static buildPrompt(): string {
        // Rule examples and explanation as system context
        return `Your task is to assess whether scripts in adblocking scripts are safe or potentially dangerous. The primary criterion for danger is if a script allows downloading from external resources, particularly when it involves absolute URLs that are not the same as the source resource. A script is considered dangerous if it fetches or loads content from external, different origins using absolute URLs. Evaluate each script's safety based on this criterion.
Example of a dangerous rules:
${getRulesText(dangerousRules.slice(0, DANGEROUS_RULES_COUNT))}
Example of safe rules:
${getRulesText(safeRules.slice(0, SAFE_RULES_COUNT))}
---`;
    }
}

// // Example how the checker can be used to check one rule for safety. Uncomment to run.
// const rule = 'AG_onLoad(function(){document.querySelectorAll(\'iframe[src^="https://hdfilmesonlinegratis.com/"][src*="php?url=http"]\').forEach(function(a){var b=a.getAttribute("src").split("?url=");b[1]&&a.setAttribute("src",b[1])})});';
//
// (async () => {
//     try {
//         const result = await safetyChecker.checkRuleSafety(rule);
//         console.log('Rule:', result.rule);
//         console.log('Type:', result.type);
//         console.log('Reason:', result.reason);
//     } catch (error) {
//         console.error('An error occurred:', error);
//     }
// })();

export { SafetyChecker };
