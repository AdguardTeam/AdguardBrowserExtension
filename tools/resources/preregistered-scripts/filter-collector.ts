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

/* eslint-disable no-console */

import {
    type AnyRule,
    CosmeticRuleType,
    getScriptletName,
    type JsInjectionRule,
    QuoteUtils,
    RuleCategory,
    type ScriptletInjectionRule,
} from '@adguard/agtree';
import { FilterListParser, defaultParserOptions } from '@adguard/agtree/parser';
import { CosmeticRuleBodyGenerator } from '@adguard/agtree/generator';
import { extractRuleSetId } from '@adguard/tsurlfilter/es/declarative-converter-utils';
import { isJsInjectionRule } from '@adguard/dnr-rulesets';

import { extractPreprocessedRawFilterList, readMetadataRuleSet } from '../filter-extractor';

/**
 * Returns `true` if a cosmetic rule is "generic" — not restricted to specific domains.
 *
 * @param ruleNode Parsed cosmetic rule AST node (JS or scriptlet injection).
 *
 * @returns `true` if the rule has no domain restriction or only `*`.
 */
export const isGenericCosmeticRule = (
    ruleNode: JsInjectionRule | ScriptletInjectionRule,
): boolean => {
    return (
        !ruleNode.domains
        || ruleNode.domains.children.length === 0
        || (ruleNode.domains.children.length === 1 && ruleNode.domains.children[0]?.value === '*')
    );
};

/**
 * Returns `true` if the rule node is a scriptlet injection rule.
 *
 * @param ruleNode Rule node to check.
 *
 * @returns `true` if the node is a {@link ScriptletInjectionRule}.
 */
export const isScriptletRule = (
    ruleNode: AnyRule | null,
): ruleNode is ScriptletInjectionRule => {
    return !!ruleNode
        && ruleNode.category === RuleCategory.Cosmetic
        && ruleNode.type === CosmeticRuleType.ScriptletInjectionRule;
};

/**
 * Returns `true` if the rule targets the given domain or its subdomains.
 *
 * @param ruleNode Parsed rule AST node (JS or scriptlet injection).
 * @param preregisteredDomain Apex domain to match against (e.g. `"youtube.com"`).
 *
 * @returns `true` if the rule explicitly permits this domain.
 */
export const isRuleTargetsDomain = (
    ruleNode: ScriptletInjectionRule | JsInjectionRule,
    preregisteredDomain: string,
): boolean => {
    if (!ruleNode.domains || ruleNode.domains.children.length === 0) {
        return false;
    }

    return ruleNode.domains.children.some((domainNode) => {
        if (domainNode.exception) {
            return false;
        }
        const { value } = domainNode;
        return value === preregisteredDomain || value.endsWith(`.${preregisteredDomain}`);
    });
};

/**
 * Extracts scriptlet name and arguments from a scriptlet injection rule AST node.
 *
 * @note Only the first scriptlet call in the rule body is extracted.
 * Multi-scriptlet rules (multiple calls separated by `;`) are rare in practice,
 * but additional calls beyond the first are silently ignored.
 *
 * @param ruleNode Parsed scriptlet injection rule AST node.
 *
 * @returns Object with `name` (string) and `args` (string array).
 *
 * @throws If the rule body has no scriptlet call.
 */
export const extractScriptletNameAndArgs = (
    ruleNode: ScriptletInjectionRule,
): { name: string; args: string[] } => {
    const paramList = ruleNode.body.children[0];
    if (!paramList) {
        throw new Error('ScriptletInjectionRule has no scriptlet calls in body');
    }

    const name = QuoteUtils.removeQuotesAndUnescape(getScriptletName(paramList));
    const args = paramList.children.slice(1)
        .map((child) => child?.value ?? '')
        .filter((value) => value !== '')
        .map((arg) => QuoteUtils.removeQuotesAndUnescape(arg));

    return { name, args };
};

/**
 * Raw generated body of a JS injection rule.
 * Produced by {@link CosmeticRuleBodyGenerator.generate} — ready to be inlined
 * into a per-domain bundle with a deduplication guard.
 */
export type RuleBody = string;

/**
 * JSON-serialised scriptlet arguments.
 * Used as a Set key for deduplication: two rules with the same scriptlet name
 * and identical serialised args are treated as duplicates.
 */
export type ArgsKey = string;

/**
 * Generic helper: groups values by filter ID.
 *
 * Example: `ByFilterId<Set<string>>` is `Map<filterId, Set<string>>`.
 */
type ByFilterId<T> = Map<number, T>;

/**
 * Collected JS injection rules.
 *
 * Structure: `Map<domain, Map<filterId, Set<rawBody>>>`
 *
 * Each raw body is a unique, generated JS rule string that will be wrapped
 * with an idempotency guard and inlined into the per-domain bundle.
 */
export type DomainRules = Map<string, ByFilterId<Set<RuleBody>>>;

/**
 * Collected scriptlet invocations.
 *
 * Structure: `Map<domain, Map<filterId, Record<name, Set<JSON_args>>>>`
 *
 * The innermost `Set<ArgsKey>` stores unique argument combinations per
 * scriptlet name — two rules with the same name and same JSON-serialised
 * args produce only one invocation in the final bundle.
 */
export type DomainScriptlets = Map<string, ByFilterId<Record<string, Set<ArgsKey>>>>;

/**
 * Result of {@link FilterCollector.collect}: all rules grouped by domain and
 * filter, plus the set of unique scriptlet names for the shared bundle.
 */
export interface CollectedRules {
    /**
     * JS rules grouped by domain and filter ID.
     */
    domainRules: DomainRules;

    /**
     * Scriptlet invocations grouped by domain and filter ID.
     */
    domainScriptlets: DomainScriptlets;

    /**
     * Unique scriptlet names across all domains and filters.
     */
    scriptletNames: Set<string>;
}

/**
 * Walks all DNR rulesets in the declarative filter folder and collects
 * JS injection rules and scriptlet invocations, grouped by domain and filter ID.
 *
 * @note Single-use:
 * Accumulators are initialised in the constructor. Call {@link collect} once
 * per instance — subsequent calls would append to the same accumulators,
 * producing duplicate entries.
 */
export class FilterCollector {
    /** Preregistered domain list from {@link config}. */
    private readonly domains: readonly string[];

    /** Path to the DNR declarative filter folder. */
    private readonly declarativeFolder: string;

    /** Accumulator: JS rules grouped by domain and filter ID. */
    private domainRules: DomainRules;

    /** Accumulator: scriptlet invocations grouped by domain and filter ID. */
    private domainScriptlets: DomainScriptlets;

    /** Accumulator: unique scriptlet names (for shared bundle generation). */
    private scriptletNames: Set<string>;

    /**
     * @param domains Preregistered domain list.
     * @param declarativeFolder Path to the DNR declarative filter folder.
     */
    constructor(domains: readonly string[], declarativeFolder: string) {
        this.domains = domains;
        this.declarativeFolder = declarativeFolder;

        this.domainRules = new Map(this.domains.map((d) => [d, new Map()]));
        this.domainScriptlets = new Map(this.domains.map((d) => [d, new Map()]));
        this.scriptletNames = new Set<string>();
    }

    /**
     * Walks all rulesets and collects rules into the accumulators.
     *
     * @returns Collected rules grouped by domain and filter, plus unique scriptlet names.
     */
    public async collect(): Promise<CollectedRules> {
        const metadataRuleSet = await readMetadataRuleSet(this.declarativeFolder);
        const ruleSetIds = metadataRuleSet.getRuleSetIds();

        for (const ruleSetId of ruleSetIds) {
            const filterId = extractRuleSetId(ruleSetId);

            await this.processRuleSet(ruleSetId, filterId);
        }

        return {
            domainRules: this.domainRules,
            domainScriptlets: this.domainScriptlets,
            scriptletNames: this.scriptletNames,
        };
    }

    /**
     * Processes a single ruleset: parses the filter list and adds JS rules
     * and scriptlet invocations to the accumulators for each matching domain.
     *
     * @param ruleSetId Ruleset identifier (e.g. `"ruleset_2"`).
     * @param filterId Extracted filter ID number, or `null` to skip.
     */
    private async processRuleSet(
        ruleSetId: string,
        filterId: number | null,
    ): Promise<void> {
        if (filterId === null) {
            return;
        }

        const rawFilterList = await extractPreprocessedRawFilterList(ruleSetId, this.declarativeFolder);
        const filterListNode = FilterListParser.parse(rawFilterList, {
            ...defaultParserOptions,
            includeRaws: false,
            isLocIncluded: false,
            tolerant: true,
        });

        const targetsOf = (node: JsInjectionRule | ScriptletInjectionRule): string[] => {
            return isGenericCosmeticRule(node)
                ? [...this.domains]
                : this.domains.filter((d) => isRuleTargetsDomain(node, d));
        };

        filterListNode.children.forEach((ruleNode) => {
            if (isJsInjectionRule(ruleNode)) {
                const rawBody = CosmeticRuleBodyGenerator.generate(ruleNode);
                targetsOf(ruleNode).forEach((domain) => {
                    this.ensureRuleSet(domain, filterId).add(rawBody);
                });
                return;
            }

            if (isScriptletRule(ruleNode)) {
                try {
                    const { name, args } = extractScriptletNameAndArgs(ruleNode);
                    this.scriptletNames.add(name);
                    const argsKey = JSON.stringify(args);

                    targetsOf(ruleNode).forEach((domain) => {
                        FilterCollector.addToScriptletMap(
                            this.ensureScriptletMap(domain, filterId),
                            name,
                            argsKey,
                        );
                    });
                } catch (error) {
                    console.warn(
                        '[generate-preregistered-domain-bundles] Skipping invalid scriptlet rule; '
                        + `Error: ${error instanceof Error ? error.message : String(error)}`,
                    );
                }
            }
        });
    }

    /**
     * Returns the `Set<RuleBody>` for the given domain and filter ID,
     * creating it if it does not exist.
     *
     * @param domain Domain name (must be in the pre-populated map).
     * @param filterId Filter ID number.
     *
     * @returns Mutable Set of raw JS rule bodies.
     *
     * @throws If the domain is not found in the pre-populated map.
     */
    private ensureRuleSet(domain: string, filterId: number): Set<string> {
        const filterMap = this.domainRules.get(domain);
        if (!filterMap) {
            throw new Error(`Unknown domain: ${domain}`);
        }
        let result = filterMap.get(filterId);
        if (!result) {
            result = new Set();
            filterMap.set(filterId, result);
        }
        return result;
    }

    /**
     * Returns the scriptlet-name-to-argSets record for the given domain and
     * filter ID, creating it if it does not exist.
     *
     * @param domain Domain name (must be in the pre-populated map).
     * @param filterId Filter ID number.
     *
     * @returns Mutable record mapping scriptlet names to Sets of JSON args.
     *
     * @throws If the domain is not found in the pre-populated map.
     */
    private ensureScriptletMap(domain: string, filterId: number): Record<string, Set<string>> {
        const filterMap = this.domainScriptlets.get(domain);
        if (!filterMap) {
            throw new Error(`Unknown domain: ${domain}`);
        }
        let result = filterMap.get(filterId);
        if (!result) {
            result = {};
            filterMap.set(filterId, result);
        }
        return result;
    }

    /**
     * Adds a serialised argument key to the Set for the given scriptlet name,
     * creating the Set if it does not exist.
     *
     * @param obj Scriptlet-name-to-argSets record.
     * @param name Scriptlet name.
     * @param argsKey JSON-serialised args string.
     */
    private static addToScriptletMap(
        obj: Record<string, Set<string>>,
        name: string,
        argsKey: string,
    ): void {
        (obj[name] ??= new Set()).add(argsKey);
    }
}
