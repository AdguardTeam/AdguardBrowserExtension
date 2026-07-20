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
    type ScriptletInjectionRule,
    QuoteUtils,
    RuleCategory,
    type JsInjectionRule,
    getScriptletName,
} from '@adguard/agtree';
import { FilterListParser, defaultParserOptions } from '@adguard/agtree/parser';
import { CosmeticRuleBodyGenerator } from '@adguard/agtree/generator';
import { isJsInjectionRule } from '@adguard/dnr-rulesets';
import {
    computeJsRuleHash,
    computeScriptletHash,
    normalizeDomain,
} from '@adguard/tswebextension/mv3/preregistered-scripts';

import { extractPreprocessedRawFilterList, readMetadataRuleSet } from '../filter-extractor';

import { preregisteredDomains as rawPreregisteredDomains } from './config';

/**
 * Normalized preregistered domains list — the single source of truth used
 * for all domain comparisons in this module.
 */
const preregisteredDomains: readonly string[] = rawPreregisteredDomains.map(normalizeDomain);

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
 * Returns `true` if `domain` is equal to `preregisteredDomain` or a subdomain of it.
 *
 * @param domain Domain to check.
 * @param preregisteredDomain Apex domain to match against (e.g. `"youtube.com"`).
 *
 * @returns `true` if `domain` is the preregistered domain or its subdomain.
 */
export const isDomainOrSubdomain = (
    domain: string,
    preregisteredDomain: string,
): boolean => {
    const normalizedDomain = normalizeDomain(domain);
    return normalizedDomain === preregisteredDomain || normalizedDomain.endsWith(`.${preregisteredDomain}`);
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
    if (isGenericCosmeticRule(ruleNode)) {
        return true;
    }

    // `isGenericCosmeticRule` already covers a missing/empty domain list for
    // well-formed rules. `domains` is typed as always present on the AST, but
    // guard explicitly (rather than with a non-null assertion) since malformed
    // input parsed with `tolerant: true` could theoretically produce a node
    // without it.
    const { domains } = ruleNode;
    if (!domains) {
        return false;
    }

    return domains.children.some((domainNode) => {
        if (domainNode.exception) {
            return false;
        }
        return isDomainOrSubdomain(domainNode.value, preregisteredDomain);
    });
};

/**
 * Extracts scriptlet name and arguments from a scriptlet injection rule AST node.
 *
 * The name is extracted via agtree's {@link getScriptletName} (the same helper
 * agtree's own converters use), so build-time hashing matches runtime hashing
 * from `rule.getScriptletData().params`. Arguments are extracted the same way
 * agtree extracts the name, for consistency.
 *
 * @note Only the first scriptlet call in the rule body is extracted.
 * Multi-scriptlet rules (multiple calls separated by `;`) are rare in practice,
 * but additional calls beyond the first are silently ignored.
 *
 * @param ruleNode Parsed scriptlet injection rule AST node.
 *
 * @returns Object with `name` (string) and `args` (string array).
 *
 * @throws If the rule body has no scriptlet call, or the scriptlet name is empty.
 */
export const extractScriptletNameAndArgs = (
    ruleNode: ScriptletInjectionRule,
): { name: string; args: string[] } => {
    const paramList = ruleNode.body.children[0];
    if (!paramList) {
        throw new Error('ScriptletInjectionRule has no scriptlet calls in body');
    }

    const name = QuoteUtils.removeQuotesAndUnescape(getScriptletName(paramList));
    const args = paramList.children.slice(1).map(
        (param) => (param === null ? '' : QuoteUtils.removeQuotesAndUnescape(param.value)),
    );

    return { name, args };
};

/**
 * Raw generated body of a JS injection rule.
 * Produced by {@link CosmeticRuleBodyGenerator.generate} — ready to be inlined
 * into a per-hash file with a deduplication guard.
 */
export type RuleBody = string;

/**
 * Unique scriptlet descriptor: name + JSON-serialised args.
 * Used as a Map key for deduplication.
 */
export type ScriptletKey = string;

/**
 * A unique rule entry (scriptlet or JS rule) collected from the rulesets.
 */
export interface CollectedRuleEntry {
    /**
     * Stable hash of the rule (SHA-256 of name+args for scriptlets, SHA-256 of body for JS rules).
     */
    hash: string;

    /**
     * JS rule body (only for JS injection rules).
     */
    jsBody?: string | null;

    /**
     * Scriptlet name (only for scriptlet rules).
     */
    scriptletName?: string;

    /**
     * Scriptlet arguments (only for scriptlet rules).
     */
    scriptletArgs?: string[];
}

/**
 * Result of {@link ScriptletCollector.collect}: all unique rules hashed,
 * plus the set of unique scriptlet names for the shared bundle and the list
 * of domains that have at least one rule.
 */
export interface CollectedScriptlets {
    /**
     * Unique rule entries (one per distinct hash).
     * Used to generate `{hash}.js` files.
     */
    rules: Map<string, CollectedRuleEntry>;

    /**
     * Unique scriptlet names across all rules (for shared bundle generation).
     */
    scriptletNames: Set<string>;

    /**
     * Domains that have at least one blocking rule (scriptlet or JS rule).
     */
    domains: string[];
}

/**
 * Walks all DNR rulesets in the declarative filter folder and collects
 * scriptlet invocations and JS injection rules.
 *
 * Unlike the previous `FilterCollector`, this class does NOT perform any
 * exception cancellation. Exceptions are handled at runtime by the engine
 * (via `getCosmeticResult`), which correctly accounts for filter enable/disable,
 * user rules, and allowlist entries.
 *
 * {@link collect} resets its accumulators on every call, so a single instance
 * can safely be reused for repeated collection runs.
 */
export class ScriptletCollector {
    /** Path to the DNR declarative filter folder. */
    private readonly declarativeFolder: string;

    /** Accumulator: unique rule entries keyed by hash. */
    private rules: Map<string, CollectedRuleEntry>;

    /** Accumulator: unique scriptlet names (for shared bundle generation). */
    private scriptletNames: Set<string>;

    /** Accumulator: domains that have at least one blocking rule. */
    private domainsWithRules: Set<string>;

    /**
     * @param declarativeFolder Path to the DNR declarative filter folder.
     */
    constructor(declarativeFolder: string) {
        this.declarativeFolder = declarativeFolder;
        this.rules = new Map();
        this.scriptletNames = new Set();
        this.domainsWithRules = new Set();
    }

    /**
     * Walks all rulesets and collects rules into the accumulators.
     *
     * Resets the accumulators first, so calling this more than once on the
     * same instance does not produce duplicate entries.
     *
     * @returns Collected unique rules, scriptlet names, and domains with rules.
     */
    public async collect(): Promise<CollectedScriptlets> {
        this.rules = new Map();
        this.scriptletNames = new Set();
        this.domainsWithRules = new Set();

        const metadataRuleSet = await readMetadataRuleSet(this.declarativeFolder);
        const ruleSetIds = metadataRuleSet.getRuleSetIds();

        for (const ruleSetId of ruleSetIds) {
            await this.processRuleSet(ruleSetId);
        }

        return {
            rules: this.rules,
            scriptletNames: this.scriptletNames,
            domains: [...this.domainsWithRules].sort(),
        };
    }

    /**
     * Processes a single ruleset: parses the filter list and collects
     * blocking JS rules and scriptlet invocations.
     *
     * Exception rules (`#@%#...`, `#@#+js(...)`) are silently skipped —
     * they are handled by the engine at runtime.
     *
     * @param ruleSetId Ruleset identifier (e.g. `"ruleset_2"`).
     */
    private async processRuleSet(ruleSetId: string): Promise<void> {
        const rawFilterList = await extractPreprocessedRawFilterList(ruleSetId, this.declarativeFolder);
        const filterListNode = FilterListParser.parse(rawFilterList, {
            ...defaultParserOptions,
            includeRaws: false,
            isLocIncluded: false,
            tolerant: true,
        });

        for (const ruleNode of filterListNode.children) {
            if (isJsInjectionRule(ruleNode) || isScriptletRule(ruleNode)) {
                this.recordTargetDomains(ruleNode);
            }

            if (!ScriptletCollector.isCollectibleBlockingRule(ruleNode, preregisteredDomains)) {
                continue;
            }

            if (isJsInjectionRule(ruleNode)) {
                const rawBody = CosmeticRuleBodyGenerator.generate(ruleNode);
                const hash = await computeJsRuleHash(rawBody);
                this.addRule(hash, { jsBody: rawBody });
            } else if (isScriptletRule(ruleNode)) {
                try {
                    const { name, args } = extractScriptletNameAndArgs(ruleNode);
                    const hash = await computeScriptletHash(name, args);
                    this.scriptletNames.add(name);
                    this.addRule(hash, {
                        scriptletName: name,
                        scriptletArgs: args,
                    });
                } catch (error) {
                    console.warn(
                        `[ext.ScriptletCollector.processRuleSet]: Failed to extract scriptlet data: ${error instanceof Error ? error.message : String(error)}`,
                    );
                    throw error;
                }
            }
        }
    }

    /**
     * Determines whether a rule should be collected.
     *
     * Checks that the rule is a non-exception JS injection or scriptlet rule
     * that applies to at least one preregistered domain.
     *
     * @param ruleNode Parsed rule AST node.
     * @param domains List of preregistered domains.
     *
     * @returns `true` if the rule is a collectible blocking rule.
     */
    private static isCollectibleBlockingRule(
        ruleNode: AnyRule,
        domains: readonly string[],
    ): ruleNode is JsInjectionRule | ScriptletInjectionRule {
        return (isJsInjectionRule(ruleNode) || isScriptletRule(ruleNode))
                && !ruleNode.exception
                && ScriptletCollector.ruleAppliesToPreregisteredDomains(ruleNode, domains);
    }

    /**
     * Checks whether a rule applies to at least one preregistered domain.
     *
     * Generic rules (no domain restriction) apply to all domains.
     * Domain-specific rules are checked against the preregistered domain list.
     *
     * @param ruleNode Parsed rule AST node (JS or scriptlet injection).
     * @param domains List of preregistered domains.
     *
     * @returns `true` if the rule applies to at least one preregistered domain.
     */
    private static ruleAppliesToPreregisteredDomains(
        ruleNode: ScriptletInjectionRule | JsInjectionRule,
        domains: readonly string[],
    ): boolean {
        return domains.some((d) => isRuleTargetsDomain(ruleNode, d));
    }

    /**
     * Records ALL domains from a rule (including exception domains) into
     * the domains list.
     *
     * Exception domains are needed so the runtime can query the engine for
     * them and add them to `excludeMatches` of their parent domain's
     * wildcard registration.
     *
     * For generic rules: adds all preregistered domains.
     * For domain-specific rules: adds each domain from the rule that is a
     * subdomain of (or equal to) a preregistered domain.
     *
     * @param ruleNode Parsed rule AST node (JS or scriptlet injection).
     */
    private recordTargetDomains(
        ruleNode: ScriptletInjectionRule | JsInjectionRule,
    ): void {
        if (isGenericCosmeticRule(ruleNode)) {
            preregisteredDomains.forEach((d) => this.domainsWithRules.add(d));
            return;
        }

        ruleNode.domains.children.forEach((domainNode) => {
            const { value: domain } = domainNode;
            if (preregisteredDomains.some((d) => isDomainOrSubdomain(domain, d))) {
                this.domainsWithRules.add(normalizeDomain(domain));
            }
        });
    }

    /**
     * Adds a rule entry if not already present (dedup by hash).
     *
     * @param hash Stable hash of the rule.
     * @param rule Rule data: `jsBody` for JS rules, `scriptletName` + `scriptletArgs` for scriptlets.
     */
    private addRule(
        hash: string,
        rule: Pick<CollectedRuleEntry, 'jsBody' | 'scriptletName' | 'scriptletArgs'>,
    ): void {
        if (!this.rules.has(hash)) {
            this.rules.set(hash, { hash, ...rule });
        }
    }
}
