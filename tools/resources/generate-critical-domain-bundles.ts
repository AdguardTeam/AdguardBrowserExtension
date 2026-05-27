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
import crypto from 'node:crypto';
import { exec as execCallback } from 'node:child_process';
import { promisify } from 'node:util';

import { minify } from 'terser';

import { type AnyRule } from '@adguard/agtree';
import { FilterListParser, defaultParserOptions } from '@adguard/agtree/parser';
import { CosmeticRuleBodyGenerator } from '@adguard/agtree/generator';

import {
    FILTERS_DEST,
    DECLARATIVE_FILTERS_DEST,
    EXTENSION_FILTERS_SUBDIR,
    type Mv3AssetsFiltersBrowser,
} from '../constants';

import { extractPreprocessedRawFilterList, readMetadataRuleSet } from './filter-extractor';
import {
    isJsRule,
    calculateUniqueId,
    wrapScriptCode,
    extractAgFunctionName,
    findAgFunctionUsages,
} from './update-local-script-rules';

const exec = promisify(execCallback);

/**
 * Subdirectory within the filters output folder where critical-domain bundles are written.
 */
const CRITICAL_SCRIPTS_DIR = 'critical-scripts';

/**
 * File that records the content_scripts entries to inject into manifest.json.
 */
const CONTENT_SCRIPTS_MANIFEST_FILE = 'content-scripts.json';

/**
 * Absolute path to the critical-domains configuration file.
 */
const CRITICAL_DOMAINS_CONFIG_PATH = './critical-domains.txt';

const LF = '\n';

/**
 * Represents a manifest content_scripts entry for a critical-domain bundle.
 */
export type ContentScriptEntry = {
    js: string[];
    matches: string[];
    run_at: 'document_start';
    world: 'MAIN';
};

// ---------------------------------------------------------------------------
// Pure helpers (exported for unit tests)
// ---------------------------------------------------------------------------

/**
 * Parses the raw text of the critical-domains config file into a list of
 * domain strings. Strips comment lines (`#`) and blank lines.
 *
 * @param content Raw text content of the config file.
 *
 * @returns Array of domain strings.
 */
export const parseCriticalDomainsFile = (content: string): string[] => {
    return content
        .split('\n')
        .map((line) => line.replace(/#.*/, '').trim())
        .filter((line) => line.length > 0);
};

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
export const ruleTargetsDomain = (
    ruleNode: AnyRule | null,
    criticalDomain: string,
): boolean => {
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
export const isGenericJsRule = (ruleNode: AnyRule | null): boolean => {
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
export const domainToMatchPatterns = (domain: string): string[] => {
    return [`*://${domain}/*`, `*://*.${domain}/*`];
};

/**
 * Returns the output filename for a domain's compiled bundle.
 *
 * @param domain Domain string, e.g. `"youtube.com"`.
 *
 * @returns Filename string, e.g. `"youtube.com.js"`.
 */
export const buildBundleFileName = (domain: string): string => {
    return `${domain}.js`;
};

// ---------------------------------------------------------------------------
// I/O helpers
// ---------------------------------------------------------------------------

/**
 * Reads and parses the critical-domains configuration file.
 *
 * @param configPath Absolute path to `critical-domains.txt`.
 *
 * @returns Array of domain strings.
 */
const readCriticalDomains = async (configPath: string): Promise<string[]> => {
    const content = await fs.readFile(configPath, 'utf-8');
    return parseCriticalDomainsFile(content);
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

                processedCode = `${requiredFunctions.join(LF)}${LF}${rule}`;
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

    return `(function () {${LF}${compiledStatements.join(LF)}${LF}})();${LF}`;
};

/**
 * Writes a compiled bundle string to disk and validates its syntax using
 * `node --check`.
 *
 * @param bundleContent Compiled JavaScript string.
 * @param outputPath Absolute path for the output `.js` file.
 *
 * @throws If the file fails syntax validation.
 */
const writeBundleFile = async (bundleContent: string, outputPath: string): Promise<void> => {
    await fs.writeFile(outputPath, bundleContent, 'utf-8');

    const result = await exec(`node --check ${outputPath}`);

    if (result.stderr.trim()) {
        throw new Error(`Syntax error in bundle ${path.basename(outputPath)}:\n${result.stderr}`);
    }
};

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

/**
 * Generates static JS bundles for each critical domain from the pre-built MV3
 * filter lists and writes a `content-scripts.json` manifest metadata file.
 *
 * This is called from `tools/resources-mv3.ts` during `pnpm resources:mv3`.
 *
 * @param browser Target MV3 browser (e.g. `AssetsFiltersBrowser.ChromiumMv3`).
 */
export const generateCriticalDomainBundles = async (
    browser: Mv3AssetsFiltersBrowser,
): Promise<void> => {
    const configPath = new URL(CRITICAL_DOMAINS_CONFIG_PATH, import.meta.url).pathname;
    const criticalDomains = await readCriticalDomains(configPath);

    if (criticalDomains.length === 0) {
        console.log('[generate-critical-domain-bundles] No critical domains configured, skipping.');
        return;
    }

    const filtersFolder = FILTERS_DEST.replace('%browser', browser);
    const declarativeFolder = DECLARATIVE_FILTERS_DEST.replace('%browser', browser);
    const outputDir = path.join(filtersFolder, CRITICAL_SCRIPTS_DIR);

    await fs.mkdir(outputDir, { recursive: true });

    // Collect all JS rules per domain from every ruleset
    const domainRules: Map<string, Set<string>> = new Map(
        criticalDomains.map((d) => [d, new Set<string>()]),
    );

    const metadataRuleSet = await readMetadataRuleSet(declarativeFolder);
    const ruleSetIds = metadataRuleSet.getRuleSetIds();

    // eslint-disable-next-line no-restricted-syntax
    for (const ruleSetId of ruleSetIds) {
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
                criticalDomains.forEach((domain) => {
                    domainRules.get(domain)!.add(rawBody);
                });
            } else {
                criticalDomains.forEach((domain) => {
                    if (ruleTargetsDomain(ruleNode, domain)) {
                        domainRules.get(domain)!.add(rawBody);
                    }
                });
            }
        });
    }

    // Compile each domain's rules and write bundle + metadata
    const manifestEntries: ContentScriptEntry[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const [domain, jsRules] of domainRules) {
        console.log(
            `[generate-critical-domain-bundles] ${domain}: ${jsRules.size} unique rules`,
        );

        if (jsRules.size === 0) {
            console.log(`[generate-critical-domain-bundles] No rules for ${domain}, skipping bundle.`);
            // eslint-disable-next-line no-continue
            continue;
        }

        // eslint-disable-next-line no-await-in-loop
        const bundleContent = await compileRulesToBundle(jsRules);

        if (!bundleContent) {
            console.warn(`[generate-critical-domain-bundles] No compilable rules for ${domain}, skipping bundle.`);
            // eslint-disable-next-line no-continue
            continue;
        }

        const fileName = buildBundleFileName(domain);
        const outputPathLocal = path.join(outputDir, fileName);

        // eslint-disable-next-line no-await-in-loop
        await writeBundleFile(bundleContent, outputPathLocal);

        const sizeKb = (Buffer.byteLength(bundleContent, 'utf-8') / 1024).toFixed(1);
        console.log(`[generate-critical-domain-bundles] Wrote ${fileName} (${sizeKb} KB)`);

        const extensionRelativePath = `${EXTENSION_FILTERS_SUBDIR}/${CRITICAL_SCRIPTS_DIR}/${fileName}`;

        manifestEntries.push({
            js: [extensionRelativePath],
            matches: domainToMatchPatterns(domain),
            run_at: 'document_start',
            world: 'MAIN',
        });
    }

    // Deduplicate entries with identical JS content
    const seenHashes: Map<string, number> = new Map();

    const deduplicatedEntries: ContentScriptEntry[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const entry of manifestEntries) {
        const entryPath = entry.js[0]!.replace(`${EXTENSION_FILTERS_SUBDIR}/`, '');
        const filePathToRead = path.join(filtersFolder, entryPath);
        // eslint-disable-next-line no-await-in-loop
        const fileContent = await fs.readFile(filePathToRead, 'utf-8');
        const hash = crypto.createHash('sha256').update(fileContent).digest('hex');
        const existingIdx = seenHashes.get(hash);

        if (existingIdx !== undefined) {
            // Merge match patterns into the existing entry rather than creating a duplicate file
            deduplicatedEntries[existingIdx]!.matches.push(...entry.matches);
        } else {
            seenHashes.set(hash, deduplicatedEntries.length);
            deduplicatedEntries.push(entry);
        }
    }

    // Write manifest metadata file
    const manifestFilePath = path.join(outputDir, CONTENT_SCRIPTS_MANIFEST_FILE);

    await fs.writeFile(
        manifestFilePath,
        JSON.stringify(deduplicatedEntries, null, 4),
        'utf-8',
    );

    console.log(
        `[generate-critical-domain-bundles] Wrote ${CONTENT_SCRIPTS_MANIFEST_FILE} with ${deduplicatedEntries.length} entries`,
    );
};
