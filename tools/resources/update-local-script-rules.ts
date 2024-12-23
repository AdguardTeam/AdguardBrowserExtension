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

/* eslint-disable no-console */

/**
 * By the rules of AMO, we cannot use remote scripts (and our JS rules can be counted as such).
 * Because of that, we use the following approach (that was accepted by AMO reviewers):
 *
 * 1. We pre-build JS rules from AdGuard filters into the add-on (see the file called "local_script_rules.json").
 * 2. At runtime we check every JS rule if it is included into "local_script_rules.json".
 *    If it is included we allow this rule to work since it is pre-built. Other rules are discarded.
 * 3. We also allow "User rules" and "Custom filters" to work since those rules are added manually by the user.
 *    This way filters maintainers can test new rules before including them in the filters.
 */
import { promises as fs } from 'node:fs';
import { exec as execCallback } from 'node:child_process';
import { promisify } from 'node:util';
import assert from 'node:assert';

import { minify } from 'terser';
import * as _ from 'lodash';

import {
    CosmeticRuleParser,
    FilterListParser,
    defaultParserOptions,
} from '@adguard/agtree';

import { ADGUARD_FILTERS_IDS } from '../../constants';
import {
    AssetsFiltersBrowser,
    FILTERS_DEST,
    LOCAL_SCRIPT_RULES_COMMENT_CHROME_MV3,
    LOCAL_SCRIPT_RULES_COMMENT,
} from '../constants';

const exec = promisify(execCallback);

// Add these helper functions after imports
const AG_FUNCTION_REGEX = /var\s+(AG_[a-zA-Z0-9_]+)\s*=\s*function/;
const AG_USAGE_REGEX = /AG_[a-zA-Z0-9_]+/g;

const LF = '\n';

/**
 * Extracts AG_ function name from the code.
 *
 * @param code JavaScript code.
 *
 * @returns Function name or null if not found.
 */
const extractAgFunctionName = (code: string): string | null => {
    const match = code.match(AG_FUNCTION_REGEX);

    if (!match) {
        return null;
    }

    return match[1] || null;
};

/**
 * Finds all AG_ function usages in the code.
 *
 * @param code JavaScript code.
 *
 * @returns Array of AG_ function names.
 */
const findAgFunctionUsages = (code: string): string[] => {
    const matches = code.match(AG_USAGE_REGEX) || [];
    return [...new Set(matches)];
};

/**
 * Updates `local_script_rules.json` for the specified browser based on rules form the pre-built filters.
 *
 * @param browser Browser name.
 */
const updateLocalScriptRulesForBrowser = async (browser: AssetsFiltersBrowser) => {
    const folder = FILTERS_DEST.replace('%browser', browser);
    const rules: {
        comment: string;
        rules: {
            [key: string]: {
                permittedDomains: string[];
                restrictedDomains: string[];
            }[],
        };
    } = {
        comment: LOCAL_SCRIPT_RULES_COMMENT,
        rules: {},
    };

    // eslint-disable-next-line no-restricted-syntax
    for (const filterId of ADGUARD_FILTERS_IDS) {
        // eslint-disable-next-line no-await-in-loop
        const rawFilterList = (await fs.readFile(`${folder}/filter_${filterId}.txt`)).toString();
        const filterListNode = FilterListParser.parse(rawFilterList, {
            ...defaultParserOptions,
            includeRaws: false,
            isLocIncluded: false,
            tolerant: true,
        });

        filterListNode.children.forEach((ruleNode) => {
            if (
                // TODO: use imported enum instead of strings
                ruleNode.category === 'Cosmetic'
                && (ruleNode.type === 'ScriptletInjectionRule' || ruleNode.type === 'JsInjectionRule')
            ) {
                // Re-generate raw body to make it consistent with TSUrlFilter rule instances
                // (TSUrlFilter also re-generates body from AST in the cosmetic rule constructor)
                const rawBody = CosmeticRuleParser.generateBody(ruleNode);
                const permittedDomains: string[] = [];
                const restrictedDomains: string[] = [];

                ruleNode.domains.children.forEach((domainNode) => {
                    if (domainNode.exception) {
                        restrictedDomains.push(domainNode.value);
                    } else {
                        permittedDomains.push(domainNode.value);
                    }
                });

                const toPush = {
                    permittedDomains,
                    restrictedDomains,
                };

                if (rules.rules[rawBody] === undefined) {
                    rules.rules[rawBody] = [toPush];
                } else if (!_.some(rules.rules[rawBody], toPush)) {
                    rules.rules[rawBody].push(toPush);
                }
            }
        });
    }

    await fs.writeFile(
        `${FILTERS_DEST.replace('%browser', browser)}/local_script_rules.json`,
        JSON.stringify(rules, null, 4),
    );
};

/**
 * Beautifies a raw comment into a JS multi-line comment.
 *
 * @param rawComment Raw comment.
 *
 * @returns Beautified comment.
 */
const beautifyComment = (rawComment: string): string => {
    return `/**
${rawComment.split(LF).map((line) => (line ? ` * ${line}` : ' *')).join(LF)}
 */`;
};

/**
 * Updates `local_script_rules.js` for Chromium MV3 based on JS rules from the pre-built filters.
 *
 * It is possible to follow all places using this logic by searching JS_RULES_EXECUTION.
 *
 * This is STEP 1.
 */
export const updateLocalScriptRulesForChromiumMv3 = async () => {
    const browser = AssetsFiltersBrowser.ChromiumMv3;
    const folder = FILTERS_DEST.replace('%browser', browser);
    const filterFiles = await fs.readdir(folder);
    const rawTxtFiles = filterFiles.filter((file) => file.endsWith('.txt') && file.startsWith('filter_'));
    const jsRules: Set<string> = new Set();

    // eslint-disable-next-line no-restricted-syntax
    for (const file of rawTxtFiles) {
        // eslint-disable-next-line no-await-in-loop
        const rawFilterList = (await fs.readFile(`${folder}/${file}`)).toString();
        const filterListNode = FilterListParser.parse(rawFilterList, {
            ...defaultParserOptions,
            includeRaws: false,
            isLocIncluded: false,
            tolerant: true,
        });

        filterListNode.children.forEach((ruleNode) => {
            if (
                // TODO: use imported enum instead of strings
                ruleNode.category === 'Cosmetic'
                && ruleNode.type === 'JsInjectionRule'
            ) {
                const rawBody = CosmeticRuleParser.generateBody(ruleNode);
                jsRules.add(rawBody);
            }
        });
    }

    const processedRules: string[] = [];
    const errors: string[] = [];
    const agFunctions: Map<string, string> = new Map();

    // First pass: extract AG_ functions
    jsRules.forEach((rule) => {
        const agFunctionName = extractAgFunctionName(rule);
        if (agFunctionName) {
            agFunctions.set(agFunctionName, rule);
            // Remove this rule from further processing as it's a utility function
            jsRules.delete(rule);
        }
    });

    // Second pass: process remaining rules
    // eslint-disable-next-line no-restricted-syntax
    for (const rule of jsRules) {
        try {
            const ruleKey = JSON.stringify(rule);
            let processedCode = rule;

            // Check if this rule uses any AG_ functions
            const usedAgFunctions = findAgFunctionUsages(rule);
            if (usedAgFunctions.length > 0) {
                // Simply prepend the required AG functions to the rule
                const requiredFunctions: string[] = [];
                usedAgFunctions.forEach((funcName) => {
                    const code = agFunctions.get(funcName);
                    if (code) {
                        requiredFunctions.push(code);
                    }
                });

                // insert required functions before the rule to make sure they are available
                processedCode = `${requiredFunctions.join(LF)}${LF}${rule}`;
            }

            // wrap the code into try-catch block
            processedCode = `try {
                ${processedCode}
            } catch(e) { console.error('Error executing AG js: ' + e) }`;

            // eslint-disable-next-line no-await-in-loop
            const minified = await minify(processedCode, {
                compress: {
                    sequences: false,
                },
                format: {
                    beautify: true,
                    indent_level: 4,
                },
            });

            if (minified.code) {
                processedRules.push(`${ruleKey}: () => {${minified.code}}`);
            } else {
                errors.push(`Was not able to minify rule: ${rule}`);
            }
        } catch (error) {
            errors.push(
                `Skipping invalid rule: ${rule}; Error: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    const jsContent = `${beautifyComment(LOCAL_SCRIPT_RULES_COMMENT_CHROME_MV3)}
export const localScriptRules = { ${processedRules.join(`,${LF}`)} };${LF}`;

    const beautifiedJsContent = (await minify(jsContent, {
        mangle: false,
        compress: false,
        format: {
            beautify: true,
            comments: true,
            indent_level: 4,
        },
    })).code;

    if (!beautifiedJsContent) {
        throw new Error('Failed to minify JS content');
    }

    try {
        await fs.writeFile(
            `${FILTERS_DEST.replace('%browser', browser)}/local_script_rules.js`,
            beautifiedJsContent,
        );

        // Run validation with ES modules support
        const result = await exec(
            `node -r @swc-node/register ${FILTERS_DEST.replace('%browser', browser)}/local_script_rules.js`,
        );
        assert.ok(result.stderr === '', 'No errors during execution');
        assert.ok(result.stdout === '', 'No output during execution');
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

export const updateLocalScriptRulesForFirefox = async () => {
    await updateLocalScriptRulesForBrowser(AssetsFiltersBrowser.Firefox);
};
