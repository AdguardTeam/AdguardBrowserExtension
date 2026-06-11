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
 * Shape of a per-domain config section in the JSON.
 */
interface JsonDomainConfig {
    scriptletExclusions: JsonExclusion[];
    scriptletSourceReplacements: JsonSourceReplacement[];
}

/**
 * Shape of the full critical-scripts.json file.
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
        throw new Error(`Invalid regex string in critical-scripts.json: "${raw}"`);
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
    description: string;
}

/**
 * Loaded critical-scripts config, with string patterns converted to RegExp.
 */
interface CriticalScriptsConfig {
    /** Scriptlet exclusions keyed by domain. */
    scriptletExclusions: Record<string, ExclusionEntry[]>;
    /** Scriptlet source replacements keyed by domain. */
    scriptletSourceReplacements: Record<string, SourceReplacementEntry[]>;
}

/** Path to the JSON config, relative to this module. */
// eslint-disable-next-line @typescript-eslint/naming-convention
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.resolve(__dirname, 'critical-scripts.json');

/**
 * Loads and parses `critical-scripts.json`, converting all string-based
 * regex patterns into `RegExp` objects.
 *
 * @returns Parsed config with `scriptletExclusions` and `scriptletSourceReplacements`.
 *
 * @throws If the JSON file is missing, malformed, or contains invalid regex strings.
 */
const loadCriticalScriptsConfig = (): CriticalScriptsConfig => {
    const raw = readFileSync(CONFIG_PATH, 'utf-8');

    let config: JsonConfig;
    try {
        config = JSON.parse(raw) as JsonConfig;
    } catch (error) {
        throw new Error(`Failed to parse critical-scripts.json: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Parse scriptlet exclusions and source replacements for each domain
    const scriptletExclusions: Record<string, ExclusionEntry[]> = {};
    const scriptletSourceReplacements: Record<string, SourceReplacementEntry[]> = {};

    Object.entries(config).forEach(([domain, domainConfig]) => {
        if (!domainConfig.scriptletExclusions || !Array.isArray(domainConfig.scriptletExclusions)) {
            throw new Error(`Missing "scriptletExclusions" array for domain "${domain}" in critical-scripts.json`);
        }

        scriptletExclusions[domain] = domainConfig.scriptletExclusions.map((entry) => {
            const parsed: ExclusionEntry = { name: entry.name };
            if (entry.argMatch) {
                parsed.argMatch = parseRegexString(entry.argMatch);
            }
            return parsed;
        });

        if (
            domainConfig.scriptletSourceReplacements
            && Array.isArray(domainConfig.scriptletSourceReplacements)
        ) {
            scriptletSourceReplacements[domain] = domainConfig.scriptletSourceReplacements.map((entry) => ({
                pattern: parseRegexString(entry.pattern),
                replacement: entry.replacement,
                description: entry.description,
            }));
        }
    });

    return { scriptletExclusions, scriptletSourceReplacements };
};

/**
 * Scriptlet exclusions per domain (parsed from critical-scripts.json).
 */
export const scriptletExclusions = loadCriticalScriptsConfig().scriptletExclusions;

/**
 * Scriptlet source replacement patterns (parsed from critical-scripts.json).
 */
export const scriptletSourceReplacements = loadCriticalScriptsConfig().scriptletSourceReplacements;
