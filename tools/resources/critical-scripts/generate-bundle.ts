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

import {
    type AnyRule,
    CosmeticRuleType,
    type JsInjectionRule,
    RuleCategory,
    type ScriptletInjectionRule,
} from '@adguard/agtree';
import { FilterListParser, defaultParserOptions } from '@adguard/agtree/parser';
import { CosmeticRuleBodyGenerator } from '@adguard/agtree/generator';
import { scriptlets, SCRIPTLETS_VERSION } from '@adguard/scriptlets';
import { extractRuleSetId } from '@adguard/tsurlfilter/es/declarative-converter-utils';

import {
    FILTERS_DEST,
    CRITICAL_SCRIPTS_DIR,
    DECLARATIVE_FILTERS_DEST,
    type Mv3AssetsFiltersBrowser,
} from '../../constants';
import { NEWLINE_CHAR_UNIX } from '../../../Extension/src/common/constants';
import { extractPreprocessedRawFilterList, readMetadataRuleSet } from '../filter-extractor';
import {
    isJsRule,
    calculateUniqueId,
    extractAgFunctionName,
    findAgFunctionUsages,
} from '../update-local-script-rules';

import { scriptletExclusions, scriptletSourceReplacements } from './config';

/**
 * List of critical domains to generate bundles for.
 */
const CRITICAL_DOMAINS = ['youtube.com'];

/**
 * Returns `true` if a scriptlet rule should be excluded from the
 * critical-domain bundle for the given domain.
 *
 * @param domain Domain name (must match a key in `critical-scripts.json`).
 * @param name Scriptlet name.
 * @param args Scriptlet arguments (first arg checked against optional `argMatch`).
 *
 * @returns Whether the rule is excluded for this domain.
 */
const isScriptletExcluded = (
    domain: string,
    name: string,
    args: string[],
): boolean => {
    const domainExclusions = scriptletExclusions[domain];
    if (!domainExclusions) {
        return false;
    }

    return domainExclusions.some((e) => {
        if (e.name !== name) {
            return false;
        }
        if (!e.argMatch) {
            return true;
        }
        return args.length > 0 && args[0] && e.argMatch.test(args[0]);
    });
};

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
 * Returns `true` if the rule is a generic JS injection rule with no domain
 * specifier. Generic rules apply universally and are included in each
 * domain's per-filter bundles so they can be selectively disabled.
 *
 * @param ruleNode Parsed rule AST node.
 *
 * @returns Whether the rule is a generic (domain-less) JS rule.
 */
const isGenericJsRule = (ruleNode: JsInjectionRule): boolean => {
    return (
        !ruleNode.domains
        || ruleNode.domains.children.length === 0
        || (ruleNode.domains.children.length === 1 && ruleNode.domains.children[0]!.value === '*')
    );
};

/**
 * Returns `true` if the rule node is a scriptlet injection rule.
 *
 * @param ruleNode Rule node to check.
 *
 * @returns Whether the rule node is a {@link ScriptletInjectionRule}.
 */
const isScriptletRule = (
    ruleNode: AnyRule | null,
): ruleNode is ScriptletInjectionRule => {
    return !!ruleNode
        && ruleNode.category === RuleCategory.Cosmetic
        && ruleNode.type === CosmeticRuleType.ScriptletInjectionRule;
};

/**
 * Returns `true` if the rule's permitted domains include the given
 * critical domain (exact match) or any of its subdomains.
 *
 * @param ruleNode Parsed rule AST node.
 * @param criticalDomain Apex domain to match against, e.g. `"youtube.com"`.
 *
 * @returns Whether the rule targets the critical domain.
 */
const isRuleTargetsDomain = (
    ruleNode: ScriptletInjectionRule | JsInjectionRule,
    criticalDomain: string,
): boolean => {
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
 * Returns `true` if the rule is a generic scriptlet injection rule with no
 * domain specifier. Generic rules apply universally and are included in each
 * domain's per-filter bundles so they can be selectively disabled.
 *
 * @param ruleNode Parsed rule AST node.
 *
 * @returns Whether the rule is a generic (domain-less) scriptlet rule.
 */
const isGenericScriptletRule = (ruleNode: AnyRule | null): boolean => {
    if (!isScriptletRule(ruleNode)) {
        return false;
    }

    return (
        !ruleNode.domains
        || ruleNode.domains.children.length === 0
        || (ruleNode.domains.children.length === 1 && ruleNode.domains.children[0]!.value === '*')
    );
};

/**
 * Extracts scriptlet name and arguments from a scriptlet injection rule AST node.
 *
 * AST stores values with surrounding quotes (e.g. "'set-constant'" → "set-constant").
 *
 * @param ruleNode Parsed scriptlet injection rule AST node.
 *
 * @returns Object with `name` and `args` properties.
 *
 * @throws If the rule body has no children or the scriptlet name is missing.
 */
const extractScriptletNameAndArgs = (
    ruleNode: ScriptletInjectionRule,
): { name: string; args: string[] } => {
    const paramList = ruleNode.body.children[0];
    if (!paramList || paramList.children.length === 0) {
        throw new Error('ScriptletInjectionRule has no scriptlet calls in body');
    }

    // AST stores values with surrounding quotes (e.g. "'set-constant'" → "set-constant")
    const stripQuotes = (s: string): string => {
        return s.replace(/^['"]|['"]$/g, '');
    };

    const scriptletName = paramList.children[0]?.value;
    if (!scriptletName) {
        throw new Error('ScriptletInjectionRule has no scriptlet name');
    }

    const args = paramList.children.slice(1)
        .map((v) => v?.value ?? '')
        .filter((v) => v !== '')
        .map(stripQuotes);

    return {
        name: stripQuotes(scriptletName),
        args,
    };
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
 * @param domainFilterScriptlets Map of domain -> filterId -> Map of scriptlet name -> Set of arg arrays.
 *
 * @returns Registry object — flat {@link PersistentScriptsRegistry} mapping domain to filter ID array.
 */
const buildPersistentScriptsRegistry = (
    domainFilterRules: Map<string, Map<number, Set<string>>>,
    domainFilterScriptlets?: Map<string, Map<number, Map<string, Set<string>>>>,
): PersistentScriptsRegistry => {
    const registry: PersistentScriptsRegistry = {};

    // Collect all (domain, filterId) pairs that have any rules
    const domainFilterIds = new Map<string, Set<string>>();

    const collectFrom = (source: Map<string, Map<number, unknown>>) => {
        source.forEach((filterMap, domain) => {
            if (!domainFilterIds.has(domain)) {
                domainFilterIds.set(domain, new Set());
            }
            const domainIds = domainFilterIds.get(domain)!;

            filterMap.forEach((_rules, filterId) => {
                domainIds.add(String(filterId));
            });
        });
    };

    collectFrom(domainFilterRules);

    if (domainFilterScriptlets) {
        collectFrom(domainFilterScriptlets);
    }

    domainFilterIds.forEach((filterIds, domain) => {
        if (filterIds.size > 0) {
            const sorted = [...filterIds].sort((a, b) => Number(a) - Number(b));
            registry[domain] = sorted;
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
 * Scrubs identifiable strings from a scriptlet function's source code
 * before it is injected into critical-domain bundles. Warns if any
 * expected pattern is missing from the source (e.g. due to upstream
 * library changes).
 *
 * @param source The `.toString()` output of a scriptlet function.
 *
 * @returns Scrubed source string.
 */
const scrubScriptletSource = (source: string, domain: string): string => {
    let result = source;

    const replacements = scriptletSourceReplacements[domain];
    if (!replacements) {
        return result;
    }

    replacements.forEach(({ pattern, replacement }) => {
        if (!pattern.test(result)) {
            console.warn(`[generate-critical-domain-bundles] Expected pattern "${pattern}" not found in scriptlet source`);
        }

        result = result.replace(pattern, replacement);
    });

    return result;
};

/**
 * Compiles a set of raw JS rule bodies into a self-executing IIFE bundle,
 * with each rule wrapped in an idempotency guard.
 *
 * AG_ helper functions found in the rule set are prepended before the rules
 * that use them.
 *
 * Scriptlet rules are compiled with deduplication: each unique scriptlet
 * function is emitted once as a named function, then invoked once per
 * distinct argument list.
 *
 * The codebase uses two different idempotency guards that coexist
 * because no single approach satisfies all constraints:
 *
 * - Host-object (used in `local_script_rules.js`): stamps a marker onto
 *   `Window.prototype.toString`. This provides cross-context visibility
 *   (a rule that ran in the top page won't re-run inside a same-origin
 *   iframe), but touching built-in prototypes is detectable by anti-adblock
 *   systems that scan host objects for tampering.
 *
 * - Private-scope (used in critical-domain bundles): uses an IIFE-local
 *   `Set` (`_b`) and plain object (`_c`). This is invisible to host-object
 *   scanning but has no cross-context visibility — each script context
 *   (top page, iframe, etc.) gets its own independent guard. Since bundles
 *   are injected early enough that each context receives its own copy, this
 *   limitation is acceptable in practice.
 *
 * @param jsRules Set of unique raw JS rule body strings.
 * @param scriptletMap Map of scriptlet name → Set of JSON-serialized arg arrays.
 *
 * @returns Compiled JavaScript string, or `null` if no rules could be compiled.
 */
const compileRulesToBundle = async (
    jsRules: Set<string>,
    scriptletMap: Map<string, Set<string>> | undefined,
    domain: string,
): Promise<string | null> => {
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

    /**
     * Wraps code with a private Set-based idempotency guard instead of
     * touching host objects — avoids YouTube anti-adblock detection.
     */
    const wrapWithPrivateGuard = (uniqueId: string, code: string): string => {
        return `
            try {
                var _k = "${uniqueId}";
                if (_b.has(_k)) return;
                _b.add(_k);
                ${code}
            } catch (_e) {}
        `;
    };

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
            const wrappedCode = wrapWithPrivateGuard(uniqueId, processedCode);

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

    // Compile scriptlet rules with deduplication
    if (scriptletMap && scriptletMap.size > 0) {
        for (const [scriptletName, argsSet] of scriptletMap) {
            const scriptletFn = scriptlets.getScriptletFunction(scriptletName);
            if (!scriptletFn) {
                console.warn(`[generate-critical-domain-bundles] Unknown scriptlet: "${scriptletName}", skipping`);
                continue;
            }

            // Emit function definition once per unique scriptlet name.
            // Scrub identifiable strings from the function body to avoid
            // YouTube anti-adblock detection.
            const fnSource = scrubScriptletSource(scriptletFn.toString(), domain);
            // eslint-disable-next-line no-await-in-loop
            const minifiedFn = await minify(fnSource, {
                compress: { sequences: false },
                parse: { bare_returns: true },
                format: {
                    beautify: true,
                    indent_level: 4,
                },
            });

            if (minifiedFn.code) {
                compiledStatements.push(minifiedFn.code);
            }

            // Emit one invocation per distinct argument list
            for (const argsJson of argsSet) {
                const args: string[] = JSON.parse(argsJson);
                const source = {
                    name: scriptletName,
                    args,
                    engine: 'extension' as const,
                    version: SCRIPTLETS_VERSION,
                    verbose: false,
                };

                const uniqueId = calculateUniqueId(`${scriptletName}_${argsJson}`);
                const sourceObj = JSON.stringify(source);
                const argsArr = JSON.stringify(args);

                // Use the original function name (scriptletFn.name) for invocation
                const invocationCode = `${scriptletFn.name}.apply(this, [${sourceObj}].concat(${argsArr}));`;
                const wrappedInvocation = wrapWithPrivateGuard(uniqueId, invocationCode);

                // eslint-disable-next-line no-await-in-loop
                const minifiedInv = await minify(wrappedInvocation, {
                    compress: { sequences: false },
                    parse: { bare_returns: true },
                    format: {
                        beautify: true,
                        indent_level: 4,
                    },
                });

                if (minifiedInv.code) {
                    compiledStatements.push(minifiedInv.code);
                } else {
                    console.warn(`[generate-critical-domain-bundles] Failed to minify scriptlet invocation: ${scriptletName}`);
                }
            }
        }
    }

    if (compiledStatements.length === 0) {
        return null;
    }

    return `(function () {${NEWLINE_CHAR_UNIX}var _b = new Set(), _c = {};${NEWLINE_CHAR_UNIX}${compiledStatements.join(NEWLINE_CHAR_UNIX)}${NEWLINE_CHAR_UNIX}})();${NEWLINE_CHAR_UNIX}`;
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

    // Remove stale bundles from previous runs before generating new ones
    const existingFiles = await fs.readdir(outputDir);
    await Promise.all(existingFiles.map((f) => fs.unlink(path.join(outputDir, f))));

    // JS injection rules: Map<domain, Map<filterId, Set<rawBody>>>
    const domainFilterRules = new Map<string, Map<number, Set<string>>>(
        CRITICAL_DOMAINS.map((d) => [d, new Map()]),
    );

    // Scriptlet injection rules: Map<domain, Map<filterId, Map<scriptletName, Set<JSON_args>>>>
    const domainFilterScriptlets = new Map<string, Map<number, Map<string, Set<string>>>>(
        CRITICAL_DOMAINS.map((d) => [d, new Map()]),
    );

    /** Ensures the inner Map<filterId, Map<name, Set<args>>> entry exists and returns the Map for scriptlet names. */
    const getScriptletMap = (
        source: Map<string, Map<number, Map<string, Set<string>>>>,
        domain: string,
        filterId: number,
    ): Map<string, Set<string>> => {
        const filterMap = source.get(domain)!;
        if (!filterMap.has(filterId)) {
            filterMap.set(filterId, new Map());
        }
        return filterMap.get(filterId)!;
    };

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
            if (isJsRule(ruleNode)) {
                const rawBody = CosmeticRuleBodyGenerator.generate(ruleNode);

                if (isGenericJsRule(ruleNode)) {
                    if (filterId !== null) {
                        CRITICAL_DOMAINS.forEach((domain) => {
                            getRuleSet(domainFilterRules, domain, filterId).add(rawBody);
                        });
                    }
                } else {
                    CRITICAL_DOMAINS.forEach((domain) => {
                        if (!isRuleTargetsDomain(ruleNode, domain)) {
                            return;
                        }

                        if (filterId === null) {
                            return;
                        }

                        getRuleSet(domainFilterRules, domain, filterId).add(rawBody);
                    });
                }

                return;
            }

            if (isScriptletRule(ruleNode)) {
                try {
                    const { name, args } = extractScriptletNameAndArgs(ruleNode);

                    // Serialize args for deduplication in Set
                    const argsKey = JSON.stringify(args);

                    if (isGenericScriptletRule(ruleNode)) {
                        if (filterId !== null) {
                            CRITICAL_DOMAINS.forEach((domain) => {
                                if (isScriptletExcluded(domain, name, args)) {
                                    return;
                                }

                                const map = getScriptletMap(domainFilterScriptlets, domain, filterId);
                                if (!map.has(name)) {
                                    map.set(name, new Set());
                                }
                                map.get(name)!.add(argsKey);
                            });
                        }
                    } else {
                        CRITICAL_DOMAINS.forEach((domain) => {
                            if (!isRuleTargetsDomain(ruleNode, domain)) {
                                return;
                            }

                            if (filterId === null) {
                                return;
                            }

                            if (isScriptletExcluded(domain, name, args)) {
                                return;
                            }

                            const map = getScriptletMap(domainFilterScriptlets, domain, filterId);
                            if (!map.has(name)) {
                                map.set(name, new Set());
                            }
                            map.get(name)!.add(argsKey);
                        });
                    }
                } catch (error) {
                    console.warn(`[generate-critical-domain-bundles] Skipping invalid scriptlet rule; Error: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        });
    }

    // Merge all (domain, filterId) pairs from both JS rules and scriptlet rules
    const allDomainIds = new Map<string, Set<number>>();
    const addToAllDomainIds = (source: Map<string, Map<number, unknown>>) => {
        source.forEach((filterMap, domain) => {
            if (!allDomainIds.has(domain)) {
                allDomainIds.set(domain, new Set());
            }
            const ids = allDomainIds.get(domain)!;
            filterMap.forEach((_rules, filterId) => {
                ids.add(filterId);
            });
        });
    };
    addToAllDomainIds(domainFilterRules);
    addToAllDomainIds(domainFilterScriptlets);

    // eslint-disable-next-line no-restricted-syntax
    for (const [domain, filterIds] of allDomainIds) {
        // eslint-disable-next-line no-restricted-syntax
        for (const filterId of filterIds) {
            const jsRules = domainFilterRules.get(domain)?.get(filterId);
            const scriptletMap = domainFilterScriptlets.get(domain)?.get(filterId);

            const scriptletCount = scriptletMap
                ? [...scriptletMap.values()].reduce((sum, argsSet) => sum + argsSet.size, 0)
                : 0;
            const totalRuleCount = (jsRules?.size ?? 0) + scriptletCount;
            if (totalRuleCount === 0) {
                // eslint-disable-next-line no-continue
                continue;
            }

            console.log(`[generate-critical-domain-bundles] ${domain}-${filterId}: ${totalRuleCount} unique rules (${jsRules?.size ?? 0} JS + ${scriptletCount} scriptlets)`);

            // eslint-disable-next-line no-await-in-loop
            const bundleContent = await compileRulesToBundle(
                jsRules ?? new Set(),
                scriptletMap ?? undefined,
                domain,
            );

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
        domainFilterScriptlets,
    );

    const registryPath = path.join(outputDir, 'registry.js');
    await writePersistentScriptsRegistry(registry, registryPath);

    const domainCount = Object.keys(registry).length;
    console.log(`[generate-critical-domain-bundles] Wrote registry.js with ${domainCount} domain(s)`);
};
