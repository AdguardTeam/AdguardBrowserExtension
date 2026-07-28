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
    type CosmeticRule,
    Engine,
    Request,
    RequestType,
} from '@adguard/tsurlfilter';
import { computeRuleHash, normalizeDomain } from '@adguard/tswebextension/mv3/preregistered-scripts/hasher';

import { extractPreprocessedRawFilterList, readMetadataRuleSet } from '../filter-extractor';

import { preregisteredDomains } from './config';

/**
 * Hostnames queried against the real `@adguard/tsurlfilter` `Engine` — each
 * preregistered domain (normalized via {@link normalizeDomain} so config
 * typos/casing/`www.` prefixes can't cause a mismatch) contributes two
 * entries: the apex itself and its `www.` alias. Subdomains other than
 * `www.` are intentionally NOT covered.
 *
 * Each hostname is recorded independently in {@link CollectedScriptlets.domains}
 * — apex and `www.` are never collapsed into one another, since
 * `PreregisteredScriptsService` registers a separate content script per
 * hostname.
 */
const preregisteredHostnames: readonly string[] = (
    preregisteredDomains
        .map(normalizeDomain)
        .flatMap((domain) => [domain, `www.${domain}`])
);

/**
 * Raw generated body of a JS injection rule — ready to be inlined into a
 * per-hash file with a deduplication guard.
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

    /**
     * Raw `$path` modifier pattern text (`rule.pathModifier.pattern`), if the
     * rule has one. The rule was collected regardless of path (domain-only
     * match, see {@link ScriptletCollector}) — this is embedded as a runtime
     * guard in the generated `{hash}.js` file so the path condition is still
     * enforced, just deferred to the browser instead of the collector.
     */
    pathPattern?: string;
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
     * Hostnames (apex domain and/or its `www.` alias, kept as separate
     * entries) that have at least one blocking rule.
     */
    domains: string[];
}

/**
 * Walks all DNR rulesets in the declarative filter folder and collects
 * scriptlet invocations and JS injection rules.
 *
 * Domain applicability and rule type filtering are NOT done by hand — for
 * each ruleset, a real `@adguard/tsurlfilter` `Engine` is built from its raw
 * filter list text, and `Engine.getJsRulesIgnoringPath(request)` is queried
 * once per preregistered domain (+ its `www.` alias). This is the exact same
 * lookup the runtime engine performs, so there is no separate hand-rolled
 * matching implementation that could drift from it.
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

    /** Accumulator: hostnames that have at least one blocking rule. */
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
     * Processes a single ruleset: builds a real `Engine` from its raw filter
     * list text and, for every preregistered hostname, queries
     * `Engine.getJsRulesIgnoringPath(request)` for the JS/scriptlet rules
     * that hostname matches.
     *
     * `getJsRulesIgnoringPath` is already type-isolated to JS/scriptlet rules
     * and excludes exception/allowlist rules, so no separate rule-type or
     * exception filtering is needed here.
     *
     * @param ruleSetId Ruleset identifier (e.g. `"ruleset_2"`).
     */
    private async processRuleSet(ruleSetId: string): Promise<void> {
        const rawFilterList = await extractPreprocessedRawFilterList(ruleSetId, this.declarativeFolder);
        const engine = Engine.createSync({ filters: [{ id: 1, content: rawFilterList }] });

        const seenRules = new Set<CosmeticRule>();

        await Promise.all(
            preregisteredHostnames.map(async (hostname) => {
                const request = new Request(`https://${hostname}/`, null, RequestType.Document);
                const matchedRules = engine.getJsRulesIgnoringPath(request);

                if (matchedRules.length === 0) {
                    return;
                }
                this.domainsWithRules.add(hostname);

                for (const rule of matchedRules) {
                    if (seenRules.has(rule)) {
                        continue;
                    }
                    seenRules.add(rule);
                    await this.recordRule(rule);
                }
            }),
        );
    }

    /**
     * Hashes a matched rule and records it in the accumulators.
     *
     * @param rule Matched cosmetic rule (scriptlet or JS injection).
     */
    private async recordRule(rule: CosmeticRule): Promise<void> {
        try {
            const hash = await computeRuleHash(rule);
            const pathPattern = rule.pathModifier?.pattern;
            if (rule.isScriptlet) {
                const data = rule.getScriptletData();
                if (!data) {
                    throw new Error('getScriptletData() returned null');
                }
                this.scriptletNames.add(data.params.name);
                this.addRule(hash, {
                    scriptletName: data.params.name,
                    scriptletArgs: data.params.args,
                    pathPattern,
                });
            } else {
                this.addRule(hash, { jsBody: rule.getContent(), pathPattern });
            }
        } catch (error) {
            console.warn(
                `[ext.ScriptletCollector.recordRule]: Failed to hash rule: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw error;
        }
    }

    /**
     * Adds a rule entry if not already present (dedup by hash).
     *
     * @param hash Stable hash of the rule.
     * @param rule Rule data: `jsBody` for JS rules, `scriptletName` + `scriptletArgs` for
     * scriptlets, and an optional `pathPattern` for either.
     */
    private addRule(
        hash: string,
        rule: Pick<CollectedRuleEntry, 'jsBody' | 'scriptletName' | 'scriptletArgs' | 'pathPattern'>,
    ): void {
        if (!this.rules.has(hash)) {
            this.rules.set(hash, { hash, ...rule });
        }
    }
}
