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

import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Shape of a single scriptlet exclusion entry in the JSON config.
 */
interface JsonExclusion {
    name: string;
    argMatch?: string;
}

/**
 * Shape of a single source replacement entry in the JSON config.
 */
interface JsonSourceReplacement {
    pattern: string;
    replacement: string;
    description: string;
}

/**
 * Shape of a custom JS rule pattern for whitelist matching.
 */
interface JsonCustomRulePattern {
    pattern: string;
    description?: string;
}

/**
 * Shape of a per-domain config section in the JSON.
 */
interface JsonDomainConfig {
    scriptletExclusions?: JsonExclusion[];
    scriptletSourceReplacements?: JsonSourceReplacement[];
    includedScriptlets?: string[];
    includedCustomRules?: JsonCustomRulePattern[];
    includedFilterIds?: string[];
}

/**
 * Shape of the full config.json file.
 */
type JsonConfig = Record<string, JsonDomainConfig>;

/**
 * Parses a regex string in `/pattern/flags` format into a RegExp object.
 *
 * Examples:
 * - `"/^document\\.write/"` → `/^document\.write/`
 * - `"/Window\\.prototype\\.toString/g"` → `/Window\.prototype\.toString/g`
 *
 * @param raw The raw regex string from JSON, e.g. `"/pattern/flags"`.
 *
 * @returns A RegExp object.
 *
 * @throws If the string is not a valid regex literal.
 */
const parseRegexString = (raw: string): RegExp => {
    const match = raw.match(/^\/(.+)\/([gimsuy]*)$/);
    if (!match) {
        throw new Error(`Invalid regex string in config.json: "${raw}"`);
    }
    // Non-null assertion is safe: match succeeded so both capture groups are present
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const body = match[1]!;
    const flags = match[2] ?? '';
    return new RegExp(body, flags);
};

/**
 * Parsed exclusion entry (after regex conversion).
 */
interface ExclusionEntry {
    name: string;
    argMatch?: RegExp;
}

/**
 * Parsed source replacement entry (after regex conversion).
 */
interface SourceReplacementEntry {
    pattern: RegExp;
    replacement: string;
}

/**
 * Parsed custom JS rule pattern entry (after regex conversion).
 */
interface CustomRulePatternEntry {
    pattern: RegExp;
    description?: string;
}

/**
 * Loaded preregistered-scripts config, with string patterns converted to RegExp.
 */
interface PreregisteredScriptsConfig {
    /** Scriptlet exclusions keyed by domain. */
    scriptletExclusions: Record<string, ExclusionEntry[]>;
    /** Scriptlet source replacements keyed by domain. */
    scriptletSourceReplacements: Record<string, SourceReplacementEntry[]>;
    /** Scriptlet whitelist keyed by domain. When non-empty, only listed scriptlets are included. */
    includedScriptlets: Record<string, string[]>;
    /** Custom JS rule whitelist keyed by domain. When set (even to empty), only matching rules included. */
    includedCustomRules: Record<string, CustomRulePatternEntry[] | undefined>;
    /** Filter ID whitelist keyed by domain. When set, only rules from these filter IDs are processed. */
    includedFilterIds: Record<string, string[] | undefined>;
    /** List of domains in the config. */
    domains: string[];
}

/** Path to the JSON config, relative to this module. */
// eslint-disable-next-line @typescript-eslint/naming-convention
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.resolve(__dirname, 'config.json');

/**
 * Loads and parses `config.json`, converting all string-based
 * regex patterns into `RegExp` objects.
 *
 * @returns Parsed config with `scriptletExclusions` and `scriptletSourceReplacements`.
 *
 * @throws If the JSON file is missing, malformed, or contains invalid regex strings.
 */
const loadPreregisteredScriptsConfig = (): PreregisteredScriptsConfig => {
    const raw = readFileSync(CONFIG_PATH, 'utf-8');

    let config: JsonConfig;
    try {
        config = JSON.parse(raw) as JsonConfig;
    } catch (error) {
        throw new Error(`Failed to parse config.json: ${error instanceof Error ? error.message : String(error)}`);
    }

    const domains: string[] = [];

    // Parse scriptlet exclusions and source replacements for each domain
    const scriptletExclusions: Record<string, ExclusionEntry[]> = {};
    const scriptletSourceReplacements: Record<string, SourceReplacementEntry[]> = {};
    const includedScriptlets: Record<string, string[]> = {};
    const includedCustomRules: Record<string, CustomRulePatternEntry[] | undefined> = {};
    const includedFilterIds: Record<string, string[] | undefined> = {};

    Object.entries(config).forEach(([domain, domainConfig]) => {
        domains.push(domain);

        // Parse scriptletExclusions (optional, defaults to empty)
        if (domainConfig.scriptletExclusions && Array.isArray(domainConfig.scriptletExclusions)) {
            scriptletExclusions[domain] = domainConfig.scriptletExclusions.map((entry) => {
                const parsed: ExclusionEntry = { name: entry.name };
                if (entry.argMatch) {
                    parsed.argMatch = parseRegexString(entry.argMatch);
                }
                return parsed;
            });
        } else {
            scriptletExclusions[domain] = [];
        }

        if (
            domainConfig.scriptletSourceReplacements
            && Array.isArray(domainConfig.scriptletSourceReplacements)
        ) {
            scriptletSourceReplacements[domain] = domainConfig.scriptletSourceReplacements.map((entry) => ({
                pattern: parseRegexString(entry.pattern),
                replacement: entry.replacement,
            }));
        }

        // Parse includedScriptlets whitelist
        if (domainConfig.includedScriptlets && Array.isArray(domainConfig.includedScriptlets)) {
            includedScriptlets[domain] = domainConfig.includedScriptlets;
        }

        // Parse includedCustomRules whitelist
        if (domainConfig.includedCustomRules !== undefined) {
            if (Array.isArray(domainConfig.includedCustomRules)) {
                includedCustomRules[domain] = domainConfig.includedCustomRules.map((entry) => ({
                    pattern: parseRegexString(entry.pattern),
                    description: entry.description,
                }));
            } else {
                includedCustomRules[domain] = undefined;
            }
        }

        // Parse includedFilterIds whitelist
        if (domainConfig.includedFilterIds && Array.isArray(domainConfig.includedFilterIds)) {
            includedFilterIds[domain] = domainConfig.includedFilterIds;
        }
    });

    return {
        scriptletExclusions,
        scriptletSourceReplacements,
        includedScriptlets,
        includedCustomRules,
        includedFilterIds,
        domains,
    };
};

const config = loadPreregisteredScriptsConfig();

/**
 * Scriptlet exclusions per domain.
 */
export const scriptletExclusions = config.scriptletExclusions;

/**
 * Scriptlet source replacement patterns.
 */
export const scriptletSourceReplacements = config.scriptletSourceReplacements;

/**
 * Scriptlet whitelist per domain.
 * When a domain has a non-empty array, only the listed scriptlet names
 * are included in the preregistered bundle. {@link scriptletExclusions} is ignored.
 */
export const includedScriptlets = config.includedScriptlets;

/**
 * Custom JS rule whitelist per domain.
 * When set (including to an empty array), only custom JS rules whose
 * body matches at least one pattern are included.
 * When `undefined` for a domain, all custom JS rules are included.
 */
export const includedCustomRules = config.includedCustomRules;

/**
 * Filter ID whitelist per domain.
 * When set, only rules from the listed filter IDs are considered
 * for the domain's preregistered bundle.
 * When `undefined` for a domain, all filter IDs are processed.
 */
export const includedFilterIds = config.includedFilterIds;

/**
 * List of domains for which preregistered scriptlet bundles
 * should be generated.
 */
export const preregisteredDomains = config.domains;
