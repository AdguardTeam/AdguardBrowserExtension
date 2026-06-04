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
    EXTENSION_FILTERS_SUBDIR,
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
 * Subdirectory within the filters output folder where critical-domain bundles are written.
 */
const CRITICAL_SCRIPTS_DIR = 'critical-scripts';

const CRITICAL_DOMAINS = ['youtube.com'];

/**
 * Per-domain entry in the persistent scripts registry.
 *
 * `js` paths are relative to the extension root.
 * `filterIds` lists every AdGuard filter that contributes rules to this domain's bundle.
 */
export type DomainScriptEntry = {
    js: string[];
    matches: string[];
    filterIds: number[];
};

/**
 * Registry of critical-domain persistent content scripts, keyed by apex domain.
 *
 * Generated at build time by {@link buildPersistentScriptsRegistry}.
 */
type PersistentScriptsRegistry = Record<string, DomainScriptEntry>;

/**
 * Returns `true` if the rule's permitted domains include the given critical
 * domain (exact match) or any of its subdomains.
 *
 * Generic rules (no domain list) return `false` — use `isGenericJsRule` to
 * identify those; they are added to every bundle separately.
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
 * specifier. Generic rules apply universally and are included in every
 * domain bundle.
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
 * Converts a domain string into the two URL match patterns used in
 * `content_scripts.matches`:
 * - apex domain: `*://domain/*`
 * - subdomains:  `*://*.domain/*`
 *
 * @param domain Domain string, e.g. `"youtube.com"`.
 *
 * @returns Array of two match pattern strings.
 */
const domainToMatchPatterns = (domain: string): string[] => {
    return [`*://${domain}/*`, `*://*.${domain}/*`];
};

/**
 * Returns the output filename for a domain's compiled bundle.
 *
 * @param domain Domain string, e.g. `"youtube.com"`.
 *
 * @returns Filename string, e.g. `"youtube.com.js"`.
 */
const getBundleFileName = (domain: string): string => {
    return `${domain}.js`;
};

/**
 * Builds the persistent-scripts registry from the set of successfully bundled
 * domains and the filter-to-domain mapping collected during ruleset iteration.
 *
 * Domains that were parsed but yielded no compilable rules (absent from
 * `domainsBundled`) are silently omitted.
 *
 * @param domainFilters Map of filter ID -> set of domains found in that filter.
 * @param extensionFilterSubdir Extension-relative prefix for filter assets (e.g. `"filters"`).
 *
 * @returns Registry object.
 */
const buildPersistentScriptsRegistry = (
    domainFilters: Map<string, Set<number>>,
    extensionFilterSubdir: string,
): PersistentScriptsRegistry => {
    const registry: PersistentScriptsRegistry = {};

    domainFilters.forEach((filterIds, domain) => {
        registry[domain] = {
            js: [`${extensionFilterSubdir}/${CRITICAL_SCRIPTS_DIR}/${getBundleFileName(domain)}`],
            matches: domainToMatchPatterns(domain),
            filterIds: [...filterIds].sort((a, b) => a - b),
        };
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

    // First pass: collect AG_ utility functions
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

    // Second pass: compile each rule with required AG_ dependencies
    // eslint-disable-next-line no-restricted-syntax
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

    validateJavaScriptSyntax(content, `registry ${path.basename(outputPath)}`);

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

    const domainRules = new Map(CRITICAL_DOMAINS.map((d) => [d, new Set<string>()]));
    const domainFilters = new Map(CRITICAL_DOMAINS.map((d) => [d, new Set<number>()]));

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
                // Generic rules (no domain specifier) apply to every critical-domain bundle
                CRITICAL_DOMAINS.forEach((domain) => {
                    domainRules.get(domain)!.add(rawBody);
                });
            } else {
                CRITICAL_DOMAINS.forEach((domain) => {
                    if (!jsRuleTargetsDomain(ruleNode, domain)) {
                        return;
                    }

                    domainRules.get(domain)!.add(rawBody);

                    if (filterId === null) {
                        return;
                    }

                    domainFilters.get(domain)!.add(filterId);
                });
            }
        });
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const [domain, jsRules] of domainRules) {
        console.log(`[generate-critical-domain-bundles] ${domain}: ${jsRules.size} unique rules`);

        if (jsRules.size === 0) {
            console.log(
                `[generate-critical-domain-bundles] No rules for ${domain}, skipping bundle.`,
            );
            // eslint-disable-next-line no-continue
            continue;
        }

        // eslint-disable-next-line no-await-in-loop
        const bundleContent = await compileRulesToBundle(jsRules);

        if (!bundleContent) {
            console.warn(
                `[generate-critical-domain-bundles] No compilable rules for ${domain}, skipping bundle.`,
            );
            // eslint-disable-next-line no-continue
            continue;
        }

        const fileName = getBundleFileName(domain);
        const outputPathLocal = path.join(outputDir, fileName);

        // eslint-disable-next-line no-await-in-loop
        await writeBundleFile(bundleContent, outputPathLocal);

        const sizeKb = (Buffer.byteLength(bundleContent, 'utf-8') / 1024).toFixed(1);
        console.log(`[generate-critical-domain-bundles] Wrote ${fileName} (${sizeKb} KB)`);
    }

    // Build and write the persistent-scripts registry
    const registry = buildPersistentScriptsRegistry(
        domainFilters,
        EXTENSION_FILTERS_SUBDIR,
    );

    const registryPath = path.join(outputDir, 'persistent-scripts-registry.js');
    await writePersistentScriptsRegistry(registry, registryPath);

    const domainCount = Object.keys(registry).length;
    console.log(
        `[generate-critical-domain-bundles] Wrote persistent-scripts-registry.js with ${domainCount} domain(s)`,
    );
};
