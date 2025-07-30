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
import path from 'node:path';
import crypto from 'node:crypto';

import { minify } from 'terser';
import { some } from 'lodash-es';

import { CosmeticRuleType, RuleCategory } from '@adguard/agtree';
import {
    CosmeticRuleParser,
    defaultParserOptions,
    FilterListParser,
} from '@adguard/agtree/parser';
import { CosmeticRuleBodyGenerator } from '@adguard/agtree/generator';

import { ADGUARD_FILTERS_IDS } from '../../constants';
import {
    AssetsFiltersBrowser,
    FILTERS_DEST,
    LOCAL_SCRIPT_RULES_COMMENT_CHROME_MV3,
    LOCAL_SCRIPT_RULES_COMMENT,
} from '../constants';

import { extractPreprocessedRawFilterList, readMetadataRuleSet } from './filter-extractor';

const exec = promisify(execCallback);

// Add these helper functions after imports
const AG_FUNCTION_REGEX = /var\s+(AG_[a-zA-Z0-9_]+)\s*=\s*function/;
const AG_USAGE_REGEX = /AG_[a-zA-Z0-9_]+/g;

const LF = '\n';

/**
 * File where JS rules from the pre-built filters are saved.
 */
const LOCAL_SCRIPT_RULES_FILE_NAME = 'local_script_rules.js';

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
            }[];
        };
    } = {
        comment: LOCAL_SCRIPT_RULES_COMMENT,
        rules: {},
    };

    // eslint-disable-next-line no-restricted-syntax
    for (const filterId of ADGUARD_FILTERS_IDS) {
        const rawFilterList = (await fs.readFile(`${folder}/filter_${filterId}.txt`)).toString();
        const filterListNode = FilterListParser.parse(rawFilterList, {
            ...defaultParserOptions,
            includeRaws: false,
            isLocIncluded: false,
            tolerant: true,
        });

        filterListNode.children.forEach((ruleNode) => {
            if (
                ruleNode.category === RuleCategory.Cosmetic
                && ruleNode.type === CosmeticRuleType.JsInjectionRule
            ) {
                // Re-generate raw body to make it consistent with TSUrlFilter rule instances
                // (TSUrlFilter also re-generates body from AST in the cosmetic rule constructor)
                const rawBody = CosmeticRuleBodyGenerator.generate(ruleNode);
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
                } else if (!some(rules.rules[rawBody], toPush)) {
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
 * Calculates unique ID for the text.
 *
 * @param text Text to calculate unique ID for.
 *
 * @returns Unique ID.
 */
const calculateUniqueId = (text: string): string => {
    return crypto.createHash('md5').update(text).digest('hex');
};

/**
 * Wraps the script code with a try-catch block and a check to avoid multiple executions of it.
 *
 * @param uniqueId Unique ID for the script.
 * @param code Script code.
 *
 * @returns Wrapped script code.
 */
const wrapScriptCode = (uniqueId: string, code: string): string => {
    return `
        try {
            const flag = 'done';
            if (Window.prototype.toString["${uniqueId}"] === flag) {
                return;
            }
            ${code}
            Object.defineProperty(Window.prototype.toString, "${uniqueId}", {
                value: flag,
                enumerable: false,
                writable: false,
                configurable: false
            });
        } catch (error) {
            console.error('Error executing AG js rule with uniqueId "${uniqueId}" due to: ' + error);
        }
    `;
};

/**
 * Beautifies a raw js-file content, saves it to the file and runs validation.
 *
 * @param rawContent Raw content.
 * @param fileName JS file name.
 */
const saveToJsFile = async (rawContent: string, fileName: string): Promise<void> => {
    const beautifiedJsContent = (await minify(rawContent, {
        mangle: false,
        compress: false,
        format: {
            beautify: true,
            comments: true,
            indent_level: 4,
        },
    })).code;

    if (!beautifiedJsContent) {
        throw new Error(`Failed to minify JS content for saving to ${fileName}`);
    }

    try {
        await fs.writeFile(
            `${FILTERS_DEST.replace('%browser', AssetsFiltersBrowser.ChromiumMv3)}/${fileName}`,
            beautifiedJsContent,
        );

        // Run validation with ES modules support
        const result = await exec(
            `npx tsx ${FILTERS_DEST.replace('%browser', AssetsFiltersBrowser.ChromiumMv3)}/${fileName}`,
        );
        assert.ok(result.stderr === '', 'No errors during execution');
        assert.ok(result.stdout === '', 'No output during execution');
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

/**
 * Updates `local_script_rules.js` for Chromium MV3 based on JS rules from the pre-built filters.
 *
 * This is STEP 1.
 *
 * The whole process is explained below.
 *
 * To fully comply with Chrome Web Store policies regarding remote code execution,
 * we implement a strict security-focused approach for Scriptlet and JavaScript rules execution.
 *
 * 1. Default - regular users that did not grant User scripts API permission explicitly:
 *    - We collect and pre-build script rules from the filters and statically bundle
 *      them into the extension - STEP 1. See 'updateLocalResourcesForChromiumMv3' in our build tools.
 *      IMPORTANT: all scripts and their arguments are local and bundled within the extension.
 *    - These pre-verified local scripts are passed to the engine - STEP 2.
 *    - At runtime before the execution, we check if each script rule is included
 *      in our local scripts list (STEP 3).
 *    - Only pre-verified local scripts are executed via chrome.scripting API (STEP 4.1 and 4.2).
 *      All other scripts are discarded.
 *    - Custom filters are NOT allowed for regular users to prevent any possibility
 *      of remote code execution, regardless of rule interpretation.
 *
 * 2. For advanced users that explicitly granted User scripts API permission -
 *    via enabling the Developer mode or Allow user scripts in the extension details:
 *    - Custom filters are allowed and may contain Scriptlet and JS rules
 *      that can be executed using the browser's built-in userScripts API (STEP 4.3),
 *      which provides a secure sandbox.
 *    - This execution bypasses the local script verification process but remains
 *      isolated and secure through Chrome's native sandboxing.
 *    - This mode requires explicit user activation and is intended for advanced users only.
 *
 * IMPORTANT:
 * Custom filters are ONLY supported when User scripts API permission is explicitly enabled.
 * This strict policy prevents Chrome Web Store rejection due to potential remote script execution.
 * When custom filters are allowed, they may contain:
 * 1. Network rules – converted to DNR rules and applied via dynamic rules.
 * 2. Cosmetic rules – interpreted directly in the extension code.
 * 3. Scriptlet and JS rules – executed via the browser's userScripts API (userScripts.execute)
 *    with Chrome's native sandboxing providing security isolation.
 *
 * For regular users without User scripts API permission (default case):
 * - Only pre-bundled filters with statically verified scripts are supported.
 * - Downloading custom filters or any rules from remote sources is blocked entirely
 *   to ensure compliance with the store policies.
 *
 * This implementation ensures perfect compliance with Chrome Web Store policies
 * by preventing any possibility of remote code execution for regular users.
 *
 * It is possible to follow all places using this logic by searching JS_RULES_EXECUTION.
 *
 * @param jsRules Set of unique JS rules collected from the pre-built filters.
 */
export const updateLocalScriptRulesForChromiumMv3 = async (jsRules: Set<string>) => {
    /**
     * This is a test case rule that is used for integration testing.
     * It should be added explicitly to the list of rules.
     *
     * @see {@link https://testcases.agrd.dev/Filters/generichide-rules/generichide-rules.txt}
     * @see {@link https://testcases.agrd.dev/Filters/injection-speed/test-injection-speed.txt}
     */
    const TESTCASES_RULES = [
        // https://testcases.agrd.dev/Filters/generichide-rules/generichide-rules.txt
        // eslint-disable-next-line max-len
        'testcases.agrd.dev,pages.dev#%#!function(){let e=()=>{document.querySelector("#case-1-generichide > .test-banner1").style.width="200px"};"complete"===document.readyState?e():window.document.addEventListener("readystatechange",e)}();',
        // https://testcases.agrd.dev/Filters/injection-speed/test-injection-speed.txt
        "testcases.agrd.dev,pages.dev#%#console.log(Date.now(), 'script rule is executed');",
    ];

    TESTCASES_RULES.forEach((rawRule) => {
        const ruleNode = CosmeticRuleParser.parse(rawRule);
        if (!ruleNode
            || ruleNode.category !== RuleCategory.Cosmetic
            || ruleNode.type !== CosmeticRuleType.JsInjectionRule) {
            throw new Error('Invalid test rule, expected JS rule');
        }
        const rawBody = CosmeticRuleBodyGenerator.generate(ruleNode);
        jsRules.add(rawBody);
    });

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

            /**
             * Unique ID is needed to prevent multiple execution of the same script.
             *
             * It may happen when script rules are being applied on WebRequest.onResponseStarted
             * and WebNavigation.onCommitted events which are independent of each other,
             * so we need to make sure that the script is executed only once.
             */
            const uniqueId = calculateUniqueId(rule);

            // wrap the code with a try-catch block with extra checking to avoid multiple executions
            processedCode = wrapScriptCode(uniqueId, processedCode);

            const minified = await minify(processedCode, {
                compress: {
                    sequences: false,
                },
                parse: {
                    bare_returns: true,
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

    const jsFileContent = `${beautifyComment(LOCAL_SCRIPT_RULES_COMMENT_CHROME_MV3)}
export const localScriptRules = { ${processedRules.join(`,${LF}`)} };${LF}`;

    await saveToJsFile(jsFileContent, LOCAL_SCRIPT_RULES_FILE_NAME);
};

/**
 *
 */
export const updateLocalResourcesForChromiumMv3 = async () => {
    const folder = path.join(
        FILTERS_DEST.replace('%browser', AssetsFiltersBrowser.ChromiumMv3),
        'declarative',
    );

    const metadataRuleSet = await readMetadataRuleSet(folder);
    const ruleSetIds = metadataRuleSet.getRuleSetIds();

    const jsRules: Set<string> = new Set();

    // eslint-disable-next-line no-restricted-syntax
    for (const ruleSetId of ruleSetIds) {
        const rawFilterList = await extractPreprocessedRawFilterList(ruleSetId, folder);
        const filterListNode = FilterListParser.parse(rawFilterList, {
            ...defaultParserOptions,
            includeRaws: false,
            isLocIncluded: false,
            tolerant: true,
        });

        filterListNode.children.forEach((ruleNode) => {
            if (
                ruleNode.category === RuleCategory.Cosmetic
                && ruleNode.type === CosmeticRuleType.JsInjectionRule
            ) {
                const rawBody = CosmeticRuleBodyGenerator.generate(ruleNode);
                jsRules.add(rawBody);
            }
        });
    }

    await updateLocalScriptRulesForChromiumMv3(jsRules);
};

export const updateLocalScriptRulesForFirefox = async () => {
    await updateLocalScriptRulesForBrowser(AssetsFiltersBrowser.Firefox);
};
