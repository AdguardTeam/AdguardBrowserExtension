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
    CosmeticRuleParser,
    CosmeticRuleType,
    type AnyCosmeticRule,
} from '@adguard/agtree';
import {
    type CosmeticRule,
    CosmeticOption,
    Request,
    RequestType,
} from '@adguard/tsurlfilter';
import { computeRuleHash, normalizeDomain } from '@adguard/tswebextension/mv3/preregistered-scripts/hasher';

import { extractPreprocessedRawFilterList, readMetadataRuleSet } from '../filter-extractor';

import { preregisteredDomains } from './config';
import { getEngineForFilterList } from './engine-cache';
import { assertNoPathScopedExceptions } from './path-exception-guard';

/**
 * Hostnames queried against the engine: each preregistered domain
 * (normalized via {@link normalizeDomain}) plus its `www.` alias when not
 * already prefixed. Other subdomains are not covered. Apex and alias stay
 * separate entries — the runtime registers a content script per hostname.
 */
const preregisteredHostnames: readonly string[] = (
    preregisteredDomains
        .map(normalizeDomain)
        .flatMap((domain) => (domain.startsWith('www.') ? [domain] : [domain, `www.${domain}`]))
);

/** A unique rule entry (scriptlet or JS rule) collected from the rulesets. */
export interface CollectedRuleEntry {
    /** SHA-256 of name+args (scriptlets) or body (JS rules). */
    hash: string;

    /** JS rule body (JS injection rules only). */
    jsBody?: string | null;

    /** Scriptlet name (scriptlet rules only). */
    scriptletName?: string;

    /** Scriptlet arguments (scriptlet rules only). */
    scriptletArgs?: string[];

    /**
     * Raw `$path` pattern, embedded as a runtime guard in the generated
     * file (collection is domain-only).
     */
    pathPattern?: string;
}

/**
 * Result of {@link ScriptletCollector.collect}: all unique rules hashed,
 * plus the set of unique scriptlet names and the list of domains that have
 * at least one rule.
 */
export interface CollectedScriptlets {
    /** Unique rule entries keyed by hash; one `{hash}.js` file each. */
    rules: Map<string, CollectedRuleEntry>;

    /** Unique scriptlet names, for shared bundle generation. */
    scriptletNames: Set<string>;

    /** Hostnames (apex and/or `www.` alias, kept separate) with rules. */
    domains: string[];
}

/**
 * Collects scriptlet invocations and JS injection rules from all DNR
 * rulesets: builds a real tsurlfilter `Engine` per ruleset and queries
 * `Engine.getCosmeticResult(request, CosmeticOption.CosmeticOptionJS, true)`
 * per preregistered hostname — the same lookup the runtime performs.
 *
 * Domain-wide exceptions are already applied by the engine during
 * collection; a `$path`-scoped exception cancelling a collected rule is a
 * hard error (see {@link assertNoPathScopedExceptions}) — preregistered
 * scripts are registered per hostname and cannot honor it.
 * A single instance can be reused: `collect` resets its accumulators.
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

    /** JS body → first-seen hash, for {@link addRule}'s same-body check. */
    private jsBodyHashes: Map<string, string>;

    /**
     * @param declarativeFolder Path to the DNR declarative filter folder.
     */
    constructor(declarativeFolder: string) {
        this.declarativeFolder = declarativeFolder;
        this.rules = new Map();
        this.scriptletNames = new Set();
        this.domainsWithRules = new Set();
        this.jsBodyHashes = new Map();
    }

    /**
     * Walks all rulesets and collects rules into the accumulators (reset
     * first). The `$path`-exception guard runs after ALL rulesets are
     * collected: an exception must cancel its rule globally, not just
     * within its own ruleset.
     *
     * @returns Collected unique rules, scriptlet names, and domains with rules.
     */
    public async collect(): Promise<CollectedScriptlets> {
        this.rules = new Map();
        this.scriptletNames = new Set();
        this.domainsWithRules = new Set();
        this.jsBodyHashes = new Map();

        const metadataRuleSet = await readMetadataRuleSet(this.declarativeFolder);
        const ruleSetIds = metadataRuleSet.getRuleSetIds();

        const rawFilterLists = new Map<string, string>();

        for (const ruleSetId of ruleSetIds) {
            rawFilterLists.set(ruleSetId, await this.processRuleSet(ruleSetId));
        }

        for (const [ruleSetId, rawFilterList] of rawFilterLists) {
            assertNoPathScopedExceptions(rawFilterList, ruleSetId, this.rules, preregisteredHostnames);
        }

        return {
            rules: this.rules,
            scriptletNames: this.scriptletNames,
            domains: [...this.domainsWithRules].sort(),
        };
    }

    /**
     * Queries one ruleset's engine for the JS/scriptlet rules of every
     * preregistered hostname. The JS-only cosmetic match with `ignorePath`
     * already excludes domain-wide exceptions.
     *
     * @param ruleSetId Ruleset identifier (e.g. `"ruleset_2"`).
     *
     * @returns The ruleset's raw filter list, for the deferred
     * `$path`-exception guard.
     */
    private async processRuleSet(ruleSetId: string): Promise<string> {
        const rawFilterList = await extractPreprocessedRawFilterList(ruleSetId, this.declarativeFolder);
        // Shared across browser targets: identical lists compile only once.
        const engine = getEngineForFilterList(rawFilterList);

        const seenRules = new Set<CosmeticRule>();

        await Promise.all(
            preregisteredHostnames.map(async (hostname) => {
                const request = new Request(`https://${hostname}/`, null, RequestType.Document);
                const matchedRules = engine
                    .getCosmeticResult(request, CosmeticOption.CosmeticOptionJS, true)
                    .getScriptRules();

                if (matchedRules.length === 0) {
                    return;
                }
                this.domainsWithRules.add(hostname);

                for (const rule of matchedRules) {
                    if (seenRules.has(rule)) {
                        continue;
                    }
                    seenRules.add(rule);
                    this.recordRule(await computeRuleHash(rule), rule);
                }
            }),
        );

        return rawFilterList;
    }

    /**
     * Records a matched rule in the accumulators.
     *
     * @param hash Precomputed stable hash of the rule.
     * @param rule Matched cosmetic rule (scriptlet or JS injection).
     *
     * @throws When a scriptlet rule has no scriptlet data.
     */
    private recordRule(hash: string, rule: CosmeticRule): void {
        const pathPattern = rule.pathModifier?.pattern;
        if (rule.isScriptlet) {
            const data = rule.getScriptletData();
            if (!data) {
                throw new Error('getScriptletData() returned null');
            }
            ScriptletCollector.warnOnMultipleScriptletCalls(rule);
            this.scriptletNames.add(data.params.name);
            this.addRule(hash, {
                scriptletName: data.params.name,
                scriptletArgs: data.params.args,
                pathPattern,
            });
        } else {
            this.addRule(hash, { jsBody: rule.getContent(), pathPattern });
        }
    }

    /**
     * Warns when a scriptlet rule body packs several scriptlet calls into
     * one rule: only the first call is collected (matching tsurlfilter,
     * which also reads `body.children[0]` only), so the remaining calls
     * would silently never run on a preregistered domain.
     *
     * @param rule Scriptlet rule to check.
     */
    private static warnOnMultipleScriptletCalls(rule: CosmeticRule): void {
        // Engine rules do not retain their source text (`getText()` returns
        // `undefined` for indexed rules), so re-parse the normalized ADG
        // body the engine generated for the rule. Any parse failure means
        // the body is not a multi-call scriptlet — nothing to warn about.
        const content = rule.getContent();
        let parsed: AnyCosmeticRule | null = null;
        try {
            parsed = CosmeticRuleParser.parse(`example.com#%#${content}`);
        } catch {
            return;
        }

        if (parsed?.type !== CosmeticRuleType.ScriptletInjectionRule) {
            return;
        }

        const callCount = parsed.body.children.length;
        if (callCount > 1) {
            console.warn(
                `[scriptlet-collector] Rule '${content}' has ${callCount} scriptlet calls;`
                + ' only the first one will be preregistered',
            );
        }
    }

    /**
     * Adds a rule entry if not already present (dedup by hash).
     *
     * @param hash Stable hash of the rule.
     * @param rule Rule data.
     *
     * @throws When the same JS body appears under different hashes: that is
     * the same rule with different `$path` modifiers. Dynamic injection
     * dedups by body, while the preregistered path runs one guarded file
     * per hash, so such pairs would execute twice. Never observed in
     * filters today — fix by merging the rules in the source filter list
     * or by adding body-hash dedup to the generated bundle.
     */
    private addRule(
        hash: string,
        rule: Pick<CollectedRuleEntry, 'jsBody' | 'scriptletName' | 'scriptletArgs' | 'pathPattern'>,
    ): void {
        if (rule.jsBody != null) {
            const firstHash = this.jsBodyHashes.get(rule.jsBody);
            if (firstHash === undefined) {
                this.jsBodyHashes.set(rule.jsBody, hash);
            } else if (firstHash !== hash) {
                throw new Error(
                    `[scriptlet-collector] JS body shared by rules ${firstHash} and ${hash};`
                    + ' it would run once per matching rule instead of once per page.'
                    + ' Merge the rules in the filter list or add body-hash dedup to the bundle.',
                );
            }
        }

        if (!this.rules.has(hash)) {
            this.rules.set(hash, { hash, ...rule });
        }
    }
}
