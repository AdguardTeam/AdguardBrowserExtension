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
    vi,
    beforeEach,
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

vi.mock('node:fs', async (importOriginal) => {
    const actual = await importOriginal() as Record<string, unknown>;
    const promises = (actual as { promises: Record<string, unknown> }).promises;
    return {
        ...actual,
        default: {
            ...actual,
            promises: {
                ...promises,
                readFile: vi.fn().mockResolvedValue(
                    '// header\nexport const TESTCASES_RULES = [\n];\n',
                ),
                writeFile: vi.fn().mockResolvedValue(undefined),
            },
        },
    };
});

/**
 * Creates a fake Testcase object for testing.
 *
 * @param id Testcase ID.
 * @param rulesUrl Optional rules URL path.
 *
 * @returns Fake Testcase object.
 */
const makeTestcase = (id: number, rulesUrl?: string) => ({
    id,
    title: `Testcase ${id}`,
    link: `https://testcases.agrd.dev/${id}`,
    rulesUrl,
    compatibility: [],
});

/**
 * Creates a rules text with a JS injection rule.
 *
 * @param id Testcase ID to embed in the rule body.
 *
 * @returns Rules text string containing a JS injection rule.
 */
const makeRulesWithScript = (id: number) => `! Title: Test ${id}\ntestcases.agrd.dev#%#window.__test${id}=true;\n`;

/**
 * Rules text with no JS injection rules.
 */
const RULES_WITHOUT_SCRIPT = '! Title: No scripts\n||example.com^\n';

describe('updateTestcasesScriptRules', () => {
    const mockedFetch = vi.fn<typeof globalThis.fetch>();

    beforeEach(async () => {
        vi.clearAllMocks();

        globalThis.fetch = mockedFetch;

        // Reset fs mock
        const fs = await import('node:fs');
        vi.mocked(fs.default.promises.readFile).mockResolvedValue(
            '// header\nexport const TESTCASES_RULES = [\n];\n',
        );
        vi.mocked(fs.default.promises.writeFile).mockResolvedValue(undefined);
    });

    it('processes all testcases and writes file once', async () => {
        const testcases = [
            makeTestcase(1, 'Filters/test-1.txt'),
            makeTestcase(2, 'Filters/test-2.txt'),
        ];

        mockedFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(testcases),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(makeRulesWithScript(1)),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(makeRulesWithScript(2)),
            } as Response);

        const { updateTestcasesScriptRules } = await import(
            '../../../tools/resources/update-local-test-script-rules'
        );
        await updateTestcasesScriptRules();

        const fs = await import('node:fs');
        expect(fs.default.promises.writeFile).toHaveBeenCalledTimes(1);
    });

    it('skips testcases without rulesUrl', async () => {
        const testcases = [
            makeTestcase(1), // no rulesUrl
            makeTestcase(2, 'Filters/test-2.txt'),
        ];

        mockedFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(testcases),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(makeRulesWithScript(2)),
            } as Response);

        const { updateTestcasesScriptRules } = await import(
            '../../../tools/resources/update-local-test-script-rules'
        );
        await updateTestcasesScriptRules();

        // Only 1 rules fetch (data.json + 1 rule file = 2 total fetch calls)
        expect(mockedFetch).toHaveBeenCalledTimes(2);
    });

    it('continues when individual download fails', async () => {
        const testcases = [
            makeTestcase(1, 'Filters/test-1.txt'),
            makeTestcase(2, 'Filters/test-2.txt'),
            makeTestcase(3, 'Filters/test-3.txt'),
        ];

        mockedFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(testcases),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(makeRulesWithScript(1)),
            } as Response)
            .mockRejectedValueOnce(new Error('ECONNREFUSED'))
            .mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(makeRulesWithScript(3)),
            } as Response);

        const { updateTestcasesScriptRules } = await import(
            '../../../tools/resources/update-local-test-script-rules'
        );

        // Should NOT throw — errors are caught per testcase
        await updateTestcasesScriptRules();

        const fs = await import('node:fs');
        // File should still be written with results from testcase 1 and 3
        expect(fs.default.promises.writeFile).toHaveBeenCalledTimes(1);
        const written = vi.mocked(fs.default.promises.writeFile).mock.calls[0]?.[1] as string;
        expect(written).toContain('__test1');
        expect(written).toContain('__test3');
        expect(written).not.toContain('__test2');
    });

    it('preserves testcase ID ordering', async () => {
        const testcases = [
            makeTestcase(1, 'Filters/test-1.txt'),
            makeTestcase(2, 'Filters/test-2.txt'),
            makeTestcase(3, 'Filters/test-3.txt'),
        ];

        mockedFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(testcases),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(makeRulesWithScript(1)),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(RULES_WITHOUT_SCRIPT),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(makeRulesWithScript(3)),
            } as Response);

        const { updateTestcasesScriptRules } = await import(
            '../../../tools/resources/update-local-test-script-rules'
        );
        await updateTestcasesScriptRules();

        const fs = await import('node:fs');
        const written = vi.mocked(fs.default.promises.writeFile).mock.calls[0]?.[1] as string;
        const idx1 = written.indexOf('__test1');
        const idx3 = written.indexOf('__test3');
        expect(idx1).toBeLessThan(idx3);
    });

    it('respects concurrency limit', async () => {
        const count = 20;
        const testcases = Array.from({ length: count }, (_, i) => (
            makeTestcase(i + 1, `Filters/test-${i + 1}.txt`)
        ));

        let maxConcurrent = 0;
        let currentConcurrent = 0;

        mockedFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(testcases),
            } as Response)
            .mockImplementation(async () => {
                currentConcurrent += 1;
                maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
                await new Promise((resolve) => {
                    setTimeout(resolve, 1);
                });
                currentConcurrent -= 1;
                return {
                    ok: true,
                    text: () => Promise.resolve(RULES_WITHOUT_SCRIPT),
                } as Response;
            });

        const { updateTestcasesScriptRules } = await import(
            '../../../tools/resources/update-local-test-script-rules'
        );
        await updateTestcasesScriptRules(5);

        expect(maxConcurrent).toBeLessThanOrEqual(5);
        expect(maxConcurrent).toBeGreaterThan(1);
    });
});
