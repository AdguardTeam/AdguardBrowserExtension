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

import {
    CosmeticRuleType,
    RuleCategory,
    type JsInjectionRule,
    type ScriptletInjectionRule,
    type AnyRule,
} from '@adguard/agtree';
import { CosmeticRuleParser } from '@adguard/agtree/parser';

import {
    isGenericCosmeticRule,
    isScriptletRule,
    isRuleTargetsDomain,
    extractScriptletNameAndArgs,
} from '../../../../tools/resources/preregistered-scripts/filter-collector';

/**
 * Parses a raw cosmetic rule string and asserts it is a JS injection rule.
 *
 * @param raw Raw cosmetic rule string.
 *
 * @returns Parsed JS injection rule node.
 *
 * @throws If the string does not parse as a JS injection rule.
 */
const parseJsRule = (raw: string): JsInjectionRule => {
    const node = CosmeticRuleParser.parse(raw);
    if (
        !node
        || node.category !== RuleCategory.Cosmetic
        || node.type !== CosmeticRuleType.JsInjectionRule
    ) {
        throw new Error(`Expected JS injection rule, got: ${raw}`);
    }
    return node as JsInjectionRule;
};

/**
 * Parses a raw cosmetic rule string and asserts it is a scriptlet injection rule.
 *
 * @param raw Raw cosmetic rule string.
 *
 * @returns Parsed scriptlet injection rule node.
 *
 * @throws If the string does not parse as a scriptlet injection rule.
 */
const parseScriptletRule = (raw: string): ScriptletInjectionRule => {
    const node = CosmeticRuleParser.parse(raw);
    if (
        !node
        || node.category !== RuleCategory.Cosmetic
        || node.type !== CosmeticRuleType.ScriptletInjectionRule
    ) {
        throw new Error(`Expected scriptlet injection rule, got: ${raw}`);
    }
    return node as ScriptletInjectionRule;
};

describe('isGenericCosmeticRule', () => {
    it('returns true for a JS rule with no domains', () => {
        const rule = parseJsRule('#%#var x = 1;');
        expect(isGenericCosmeticRule(rule)).toBe(true);
    });

    it('returns true for a JS rule with a single wildcard domain', () => {
        const rule = parseJsRule('*#%#var x = 1;');
        expect(isGenericCosmeticRule(rule)).toBe(true);
    });

    it('returns false for a JS rule targeting a specific domain', () => {
        const rule = parseJsRule('youtube.com#%#var x = 1;');
        expect(isGenericCosmeticRule(rule)).toBe(false);
    });

    it('returns false for a JS rule targeting multiple specific domains', () => {
        const rule = parseJsRule('youtube.com,example.com#%#var x = 1;');
        expect(isGenericCosmeticRule(rule)).toBe(false);
    });

    it('returns true for a scriptlet rule with no domains', () => {
        const rule = parseScriptletRule('##+js(abort-on-property-read, foo)');
        expect(isGenericCosmeticRule(rule)).toBe(true);
    });

    it('returns false for a scriptlet rule targeting a specific domain', () => {
        const rule = parseScriptletRule('youtube.com##+js(abort-on-property-read, foo)');
        expect(isGenericCosmeticRule(rule)).toBe(false);
    });
});

describe('isScriptletRule', () => {
    it('returns false for null', () => {
        expect(isScriptletRule(null)).toBe(false);
    });

    it('returns false for a JS injection rule', () => {
        const rule: AnyRule = parseJsRule('youtube.com#%#var x = 1;');
        expect(isScriptletRule(rule)).toBe(false);
    });

    it('returns true for a scriptlet injection rule', () => {
        const rule: AnyRule = parseScriptletRule('youtube.com##+js(abort-on-property-read, foo)');
        expect(isScriptletRule(rule)).toBe(true);
    });

    it('returns true for a generic scriptlet rule', () => {
        const rule: AnyRule = parseScriptletRule('##+js(set-constant, foo, true)');
        expect(isScriptletRule(rule)).toBe(true);
    });
});

describe('isRuleTargetsDomain', () => {
    it('returns true when the rule explicitly targets the exact domain', () => {
        const rule = parseScriptletRule('youtube.com##+js(abort-on-property-read, foo)');
        expect(isRuleTargetsDomain(rule, 'youtube.com')).toBe(true);
    });

    it('returns true when the rule targets a subdomain of the given domain', () => {
        const rule = parseScriptletRule('www.youtube.com##+js(abort-on-property-read, foo)');
        expect(isRuleTargetsDomain(rule, 'youtube.com')).toBe(true);
    });

    it('returns false when the rule targets a different domain', () => {
        const rule = parseScriptletRule('example.com##+js(abort-on-property-read, foo)');
        expect(isRuleTargetsDomain(rule, 'youtube.com')).toBe(false);
    });

    it('returns false for a generic rule with no domains', () => {
        const rule = parseScriptletRule('##+js(abort-on-property-read, foo)');
        expect(isRuleTargetsDomain(rule, 'youtube.com')).toBe(false);
    });

    it('returns false when the domain is an exception (negated)', () => {
        const rule = parseScriptletRule('example.com,~youtube.com##+js(abort-on-property-read, foo)');
        expect(isRuleTargetsDomain(rule, 'youtube.com')).toBe(false);
    });

    it('returns false when domain appears only as an exception and not a permitted domain', () => {
        const rule = parseScriptletRule('~youtube.com##+js(abort-on-property-read, foo)');
        expect(isRuleTargetsDomain(rule, 'youtube.com')).toBe(false);
    });

    it('returns false when the query domain is a prefix but not a suffix match', () => {
        // 'youtube' is not '*.youtube.com'
        const rule = parseScriptletRule('youtube.com##+js(abort-on-property-read, foo)');
        expect(isRuleTargetsDomain(rule, 'tube.com')).toBe(false);
    });

    it('returns true when the rule has multiple domains including the target', () => {
        const rule = parseJsRule('example.com,youtube.com#%#var x = 1;');
        expect(isRuleTargetsDomain(rule, 'youtube.com')).toBe(true);
    });
});

describe('extractScriptletNameAndArgs', () => {
    it('extracts name and empty args for a zero-argument scriptlet', () => {
        const rule = parseScriptletRule('youtube.com##+js(prevent-fab-3.2.0)');
        const { name, args } = extractScriptletNameAndArgs(rule);
        expect(name).toBe('prevent-fab-3.2.0');
        expect(args).toEqual([]);
    });

    it('extracts name and single arg', () => {
        const rule = parseScriptletRule('youtube.com##+js(abort-on-property-read, foo)');
        const { name, args } = extractScriptletNameAndArgs(rule);
        expect(name).toBe('abort-on-property-read');
        expect(args).toEqual(['foo']);
    });

    it('extracts name and multiple args', () => {
        const rule = parseScriptletRule('youtube.com##+js(set-constant, foo, true)');
        const { name, args } = extractScriptletNameAndArgs(rule);
        expect(name).toBe('set-constant');
        expect(args).toEqual(['foo', 'true']);
    });

    it('strips quotes from args', () => {
        const rule = parseScriptletRule("youtube.com##+js(abort-on-property-read, 'foo.bar')");
        const { name, args } = extractScriptletNameAndArgs(rule);
        expect(name).toBe('abort-on-property-read');
        expect(args).toEqual(['foo.bar']);
    });

    it('filters out empty-string args', () => {
        // A scriptlet rule with only a name and no args should produce empty args array
        const rule = parseScriptletRule('##+js(log)');
        const { args } = extractScriptletNameAndArgs(rule);
        expect(args).toEqual([]);
    });
});
