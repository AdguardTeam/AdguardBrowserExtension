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

import {
    describe,
    it,
    expect,
} from 'vitest';
import { some } from 'lodash-es';

import { CosmeticRuleType, RuleCategory } from '@adguard/agtree';
import { CosmeticRuleParser } from '@adguard/agtree/parser';
import { CosmeticRuleBodyGenerator } from '@adguard/agtree/generator';

import { TESTCASES_RULES } from '../../../tools/resources/testcases-rules';

/**
 * Simulates the domain extraction logic from `updateLocalScriptRulesForBrowser()`
 * for a single raw rule string.
 *
 * @param rawRule Raw cosmetic rule string.
 *
 * @returns Object with rawBody, permittedDomains, and restrictedDomains.
 *
 * @throws Error if the rule is not a valid JS injection rule.
 */
const parseTestcaseRule = (rawRule: string): {
    rawBody: string;
    permittedDomains: string[];
    restrictedDomains: string[];
} => {
    const ruleNode = CosmeticRuleParser.parse(rawRule);
    if (!ruleNode
        || ruleNode.category !== RuleCategory.Cosmetic
        || ruleNode.type !== CosmeticRuleType.JsInjectionRule) {
        throw new Error(`Invalid testcases rule, expected JS injection rule: ${rawRule}`);
    }

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

    return { rawBody, permittedDomains, restrictedDomains };
};

describe('TESTCASES_RULES parsing for Firefox local_script_rules', () => {
    it('all TESTCASES_RULES parse as JsInjectionRule with non-empty domains', () => {
        TESTCASES_RULES.forEach((rawRule) => {
            const result = parseTestcaseRule(rawRule);
            expect(result.rawBody).toBeTruthy();
            expect(result.permittedDomains.length + result.restrictedDomains.length).toBeGreaterThan(0);
        });
    });

    it('parses $path modifier rule for case 13', () => {
        const rule = '[$path=/subpage1]testcases.agrd.dev,pages.dev#%#window.__case13=true;';
        const result = parseTestcaseRule(rule);

        expect(result.rawBody).toContain('window.__case13=true;');
        expect(result.permittedDomains).toContain('testcases.agrd.dev');
        expect(result.permittedDomains).toContain('pages.dev');
        expect(result.restrictedDomains).toHaveLength(0);
    });

    it('parses $path regex modifier rule for case 15', () => {
        const rule = '[$path=/sub.*/]testcases.agrd.dev,pages.dev#%#window.__case15=true;';
        const result = parseTestcaseRule(rule);

        expect(result.rawBody).toContain('window.__case15=true;');
        expect(result.permittedDomains).toContain('testcases.agrd.dev');
        expect(result.permittedDomains).toContain('pages.dev');
        expect(result.restrictedDomains).toHaveLength(0);
    });

    it('parses wildcard domain rule for case 5', () => {
        const rule = 'testcases.agrd.*,pages.*#%#window.__case5=true;';
        const result = parseTestcaseRule(rule);

        expect(result.rawBody).toContain('window.__case5=true;');
        expect(result.permittedDomains).toContain('testcases.agrd.*');
        expect(result.permittedDomains).toContain('pages.*');
        expect(result.restrictedDomains).toHaveLength(0);
    });

    it('parses exception rule with restricted domains', () => {
        const rule = 'testcases.agrd.dev,pages.dev#@%#window.adg_test=false;';
        const result = parseTestcaseRule(rule);

        expect(result.rawBody).toContain('window.adg_test=false;');
        // Exception rules (#@%#) still have permitted domains in the domain list
        expect(result.permittedDomains).toContain('testcases.agrd.dev');
        expect(result.permittedDomains).toContain('pages.dev');
    });

    it('deduplication works for identical body+domain combos', () => {
        const rules: Record<string, { permittedDomains: string[]; restrictedDomains: string[] }[]> = {};

        // Process all TESTCASES_RULES using the same logic as updateLocalScriptRulesForBrowser
        TESTCASES_RULES.forEach((rawRule) => {
            const { rawBody, permittedDomains, restrictedDomains } = parseTestcaseRule(rawRule);
            const toPush = { permittedDomains, restrictedDomains };

            if (rules[rawBody] === undefined) {
                rules[rawBody] = [toPush];
            } else if (!some(rules[rawBody], toPush)) {
                rules[rawBody].push(toPush);
            }
        });

        // TESTCASES_RULES contains duplicate entries for `console.log('script rule')`
        // and `console.log(Date.now(), "default registered script")`.
        // Verify deduplication: each body+domain combo should appear only once.
        Object.entries(rules).forEach(([body, entries]) => {
            for (let i = 0; i < entries.length; i += 1) {
                for (let j = i + 1; j < entries.length; j += 1) {
                    const isDuplicate = some([entries[j]], entries[i]);
                    expect(isDuplicate, `Duplicate entry found for body "${body}"`).toBe(false);
                }
            }
        });
    });
});
