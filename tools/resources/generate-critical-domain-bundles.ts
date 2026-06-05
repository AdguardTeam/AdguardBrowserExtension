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

import { promises as fs } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { minify } from 'terser';

import { type AnyRule } from '@adguard/agtree';
import { FilterListParser, defaultParserOptions } from '@adguard/agtree/parser';
import { CosmeticRuleBodyGenerator } from '@adguard/agtree/generator';
import { extractRuleSetId } from '@adguard/tsurlfilter/es/declarative-converter-utils';

import {
    FILTERS_DEST,
    DECLARATIVE_FILTERS_DEST,
    type Mv3AssetsFiltersBrowser,
} from '../constants';
import { NEWLINE_CHAR_UNIX } from '../../Extension/src/common/constants';

import { extractPreprocessedRawFilterList, readMetadataRuleSet } from './filter-extractor';
import {
    isJsRule,
    calculateUniqueId,
    wrapScriptCode,
    extractAgFunctionName,
    findAgFunctionUsages,
} from './update-local-script-rules';

/**
 * List of critical domains to generate bundles for.
 */
const CRITICAL_DOMAINS = ['youtube.com'];

/**
 * Subdirectory within the filters output folder where critical-domain bundles are written.
 */
const CRITICAL_SCRIPTS_DIR = 'critical-scripts';

/**
 * Registry of critical-domain persistent content scripts.
 *
 * Key: domain.
 * Value: array of filter ID.
 *
 * Generated at build time by {@link buildPersistentScriptsRegistry}.
 *
 * Example: `{ "youtube.com": ["2", "5"] }`
 */
export type PersistentScriptsRegistry = Record<string, string[]>;

/** Ensures the inner Map<filterId, Set> entry exists and returns the Set. */
const getRuleSet = (
    domainFilterRules: Map<string, Map<number, Set<string>>>,
    domain: string,
    filterId: number,
): Set<string> => {
    const filterMap = domainFilterRules.get(domain)!;
    if (!filterMap.has(filterId)) {
        filterMap.set(filterId, new Set());
    }
    return filterMap.get(filterId)!;
};

/**
 * Returns `true` if the rule's permitted domains include the given critical
 * domain (exact match) or any of its subdomains.
 *
 * Generic rules (no domain list) return `false` — use `isGenericJsRule` to
 * identify those; they are added to each domain's per-filter bundles.
 *
 * @param ruleNode Parsed rule AST node.
 * @param criticalDomain Apex domain to match against, e.g. `"youtube.com"`.
 *
 * @returns Whether the rule targets the critical domain.
 */
const jsRuleTargetsDomain = (ruleNode: AnyRule | null, criticalDomain: string): boolean => {
    if (!isJsRule(ruleNode)) {
        return false;
    }

    if (!ruleNode.domains || ruleNode.domains.children.length === 0) {
        return false;
    }

    return ruleNode.domains.children.some((domainNode) => {
        if (domainNode.exception) {
            return false;
        }

        const v = domainNode.value;

        return v === criticalDomain || v.endsWith(`.${criticalDomain}`);
    });
};

/**
 * Returns `true` if the rule is a generic JS injection rule with no domain
 * specifier. Generic rules apply universally and are included in each
 * domain's per-filter bundles so they can be selectively disabled.
 *
 * @param ruleNode Parsed rule AST node.
 *
 * @returns Whether the rule is a generic (domain-less) JS rule.
 */
const isGenericJsRule = (ruleNode: AnyRule | null): boolean => {
    if (!isJsRule(ruleNode)) {
        return false;
    }

    return (
        !ruleNode.domains
        || ruleNode.domains.children.length === 0
        || (ruleNode.domains.children.length === 1 && ruleNode.domains.children[0]!.value === '*')
    );
};

/**
 * Returns the output filename for a (domain, filterId) compiled bundle.
 *
 * @param domain Domain string, e.g. `"youtube.com"`.
 * @param filterId Filter ID number.
 *
 * @returns Filename string, e.g. `"youtube.com-14.js"`.
 */
const getBundleFileName = (domain: string, filterId: number): string => {
    return `${domain}-${filterId}.js`;
};

/**
 * Builds the persistent-scripts registry from the collected ruleset data.
 *
 * @param domainFilterRules Map of domain -> filterId -> set of raw JS rule bodies.
 *
 * @returns Registry object — flat {@link PersistentScriptsRegistry} mapping domain to filter ID array.
 */
const buildPersistentScriptsRegistry = (
    domainFilterRules: Map<string, Map<number, Set<string>>>,
): PersistentScriptsRegistry => {
    const registry: PersistentScriptsRegistry = {};

    domainFilterRules.forEach((filterMap, domain) => {
        const filterIds: string[] = [];

        filterMap.forEach((jsRules, filterId) => {
            if (jsRules.size > 0) {
                filterIds.push(String(filterId));
            }
        });

        if (filterIds.length > 0) {
            filterIds.sort((a, b) => Number(a) - Number(b));
            registry[domain] = filterIds;
        }
    });

    return registry;
};

/**
 * Validates JavaScript syntax using the Node.js `vm` module.
 *
 * @param code JavaScript code to validate.
 * @param description Optional description for error messages (e.g., filename).
 *
 * @throws If the code has syntax errors.
 */
const validateJavaScriptSyntax = (code: string, description?: string): void => {
    try {
        // eslint-disable-next-line no-new
        new vm.Script(code);
    } catch (error) {
        const prefix = description ? `Syntax error in ${description}` : 'Syntax error';
        throw new Error(`${prefix}: ${error instanceof Error ? error.message : String(error)}`);
    }
};

/**
 * Compiles a set of raw JS rule bodies into a self-executing IIFE bundle,
 * with each rule wrapped in an idempotency guard.
 *
 * AG_ helper functions found in the rule set are prepended before the rules
 * that use them.
 *
 * @param jsRules Set of unique raw JS rule body strings.
 *
 * @returns Compiled JavaScript string, or `null` if no rules could be compiled.
 */
const compileRulesToBundle = async (jsRules: Set<string>): Promise<string | null> => {
    const agFunctions: Map<string, string> = new Map();
    const remainingRules: Set<string> = new Set();

    // AG_ utility functions
    jsRules.forEach((rule) => {
        const agFunctionName = extractAgFunctionName(rule);

        if (agFunctionName) {
            agFunctions.set(agFunctionName, rule);
        } else {
            remainingRules.add(rule);
        }
    });

    const compiledStatements: string[] = [];
    const errors: string[] = [];

    // compile each rule with required AG_ dependencies
    for (const rule of remainingRules) {
        try {
            let processedCode = rule;
            const usedAgFunctions = findAgFunctionUsages(rule);

            if (usedAgFunctions.length > 0) {
                const requiredFunctions: string[] = [];

                usedAgFunctions.forEach((funcName) => {
                    const code = agFunctions.get(funcName);

                    if (code) {
                        requiredFunctions.push(code);
                    }
                });

                processedCode = `${requiredFunctions.join(NEWLINE_CHAR_UNIX)}${NEWLINE_CHAR_UNIX}${rule}`;
            }

            const uniqueId = calculateUniqueId(rule);
            const wrappedCode = wrapScriptCode(uniqueId, processedCode);

            // eslint-disable-next-line no-await-in-loop
            const minified = await minify(wrappedCode, {
                compress: { sequences: false },
                parse: { bare_returns: true },
                format: {
                    beautify: true,
                    indent_level: 4,
                },
            });

            if (minified.code) {
                compiledStatements.push(minified.code);
            } else {
                errors.push(`Failed to minify rule: ${rule.substring(0, 80)}`);
            }
        } catch (error) {
            errors.push(
                `Skipping invalid rule: ${rule.substring(0, 80)}; Error: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    errors.forEach((msg) => console.warn(`[generate-critical-domain-bundles] ${msg}`));

    if (compiledStatements.length === 0) {
        return null;
    }

    return `(function () {${NEWLINE_CHAR_UNIX}${compiledStatements.join(NEWLINE_CHAR_UNIX)}${NEWLINE_CHAR_UNIX}})();${NEWLINE_CHAR_UNIX}`;
};

/**
 * Writes a compiled bundle string to disk and validates its syntax using
 * the Node.js `vm` module.
 *
 * @param bundleContent Compiled JavaScript string.
 * @param outputPath Absolute path for the output `.js` file.
 *
 * @throws If the file fails syntax validation.
 */
const writeBundleFile = async (bundleContent: string, outputPath: string): Promise<void> => {
    validateJavaScriptSyntax(bundleContent, `bundle ${path.basename(outputPath)}`);
    await fs.writeFile(outputPath, bundleContent, 'utf-8');
};

/**
 * Serializes and writes the persistent-scripts registry as an ES module.
 *
 * Validates the output with the Node.js `vm` module.
 *
 * @param registry Registry object returned by {@link buildPersistentScriptsRegistry}.
 * @param outputPath Absolute path for the output `.js` file.
 *
 * @throws If the file fails syntax validation.
 */
const writePersistentScriptsRegistry = async (
    registry: PersistentScriptsRegistry,
    outputPath: string,
): Promise<void> => {
    const content = `// AUTO-GENERATED — do not edit manually. Re-run pnpm resources:mv3 to update.
export const criticalDomainScripts = ${JSON.stringify(registry, null, 4)};${NEWLINE_CHAR_UNIX}`;

    await fs.writeFile(outputPath, content, 'utf-8');
};

/**
 * Generates static JS bundles for each critical domain from the pre-built MV3
 * filter lists.
 *
 * This is called from `tools/resources-mv3.ts` during `pnpm resources:mv3`.
 *
 * @param browser Target MV3 browser (e.g. `AssetsFiltersBrowser.ChromiumMv3`).
 */
export const generateCriticalDomainBundles = async (
    browser: Mv3AssetsFiltersBrowser,
): Promise<void> => {
    const filtersFolder = FILTERS_DEST.replace('%browser', browser);
    const declarativeFolder = DECLARATIVE_FILTERS_DEST.replace('%browser', browser);
    const outputDir = path.join(filtersFolder, CRITICAL_SCRIPTS_DIR);

    await fs.mkdir(outputDir, { recursive: true });

    // Map<domain, Map<filterId, Set<ruleBody>>>
    const domainFilterRules = new Map<string, Map<number, Set<string>>>(
        CRITICAL_DOMAINS.map((d) => [d, new Map()]),
    );

    const metadataRuleSet = await readMetadataRuleSet(declarativeFolder);
    const ruleSetIds = metadataRuleSet.getRuleSetIds();

    // eslint-disable-next-line no-restricted-syntax
    for (const ruleSetId of ruleSetIds) {
        const filterId = extractRuleSetId(ruleSetId);

        // eslint-disable-next-line no-await-in-loop
        const rawFilterList = await extractPreprocessedRawFilterList(ruleSetId, declarativeFolder);
        const filterListNode = FilterListParser.parse(rawFilterList, {
            ...defaultParserOptions,
            includeRaws: false,
            isLocIncluded: false,
            tolerant: true,
        });

        filterListNode.children.forEach((ruleNode) => {
            if (!isJsRule(ruleNode)) {
                return;
            }

            const rawBody = CosmeticRuleBodyGenerator.generate(ruleNode);

            if (isGenericJsRule(ruleNode)) {
                // Generic rules (no domain specifier) apply to every critical domain,
                // tracked per-filter so they can be selectively disabled
                if (filterId !== null) {
                    CRITICAL_DOMAINS.forEach((domain) => {
                        getRuleSet(domainFilterRules, domain, filterId).add(rawBody);
                    });
                }
            } else {
                CRITICAL_DOMAINS.forEach((domain) => {
                    if (!jsRuleTargetsDomain(ruleNode, domain)) {
                        return;
                    }

                    if (filterId === null) {
                        return;
                    }

                    getRuleSet(domainFilterRules, domain, filterId).add(rawBody);
                });
            }
        });
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const [domain, filterMap] of domainFilterRules) {
        // eslint-disable-next-line no-restricted-syntax
        for (const [filterId, jsRules] of filterMap) {
            if (jsRules.size === 0) {
                // eslint-disable-next-line no-continue
                continue;
            }

            console.log(`[generate-critical-domain-bundles] ${domain}-${filterId}: ${jsRules.size} unique rules`);

            // eslint-disable-next-line no-await-in-loop
            const bundleContent = await compileRulesToBundle(jsRules);

            if (!bundleContent) {
                console.warn(`[generate-critical-domain-bundles] No compilable rules for ${domain}-${filterId}, skipping bundle.`);
                // eslint-disable-next-line no-continue
                continue;
            }

            const fileName = getBundleFileName(domain, filterId);
            const outputPathLocal = path.join(outputDir, fileName);

            // eslint-disable-next-line no-await-in-loop
            await writeBundleFile(bundleContent, outputPathLocal);

            const sizeKb = (Buffer.byteLength(bundleContent, 'utf-8') / 1024).toFixed(1);
            console.log(`[generate-critical-domain-bundles] Wrote ${fileName} (${sizeKb} KB)`);
        }
    }

    // Build and write the persistent-scripts registry
    const registry = buildPersistentScriptsRegistry(
        domainFilterRules,
    );

    const registryPath = path.join(outputDir, 'registry.js');
    await writePersistentScriptsRegistry(registry, registryPath);

    const domainCount = Object.keys(registry).length;
    console.log(`[generate-critical-domain-bundles] Wrote registry.js with ${domainCount} domain(s)`);
};
