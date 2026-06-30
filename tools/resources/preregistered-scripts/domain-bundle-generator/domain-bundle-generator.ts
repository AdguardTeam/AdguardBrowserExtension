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

import { minify } from 'terser';

import { SCRIPTLETS_VERSION } from '@adguard/scriptlets';

import { NEWLINE_CHAR_UNIX } from '../../../../Extension/src/common/constants';
import {
    calculateUniqueId,
    extractAgFunctionName,
    findAgFunctionUsages,
} from '../../update-local-script-rules';
import { type RuleBody } from '../filter-collector';

/**
 * Wraps code with a Set-based idempotency guard that uses `window._g.b`
 * (defined in the shared `scriptlets-bundle.js`).
 *
 * @param uniqueId Stable hash key used to detect already-executed code.
 * @param code JavaScript code to wrap.
 *
 * @returns Wrapped code string.
 */
const wrapWithGuard = (uniqueId: string, code: string): string => {
    return [
        'try {',
        `var _k = "${uniqueId}";`,
        'if (_g.b.has(_k)) return;',
        '_g.b.add(_k);',
        code,
        '} catch (_e) {}',
    ].join('');
};

/**
 * Compiles a per-domain bundle.
 *
 * Emits JS rules (with AG_ helpers inlined and dedup guards) and scriptlet
 * invocations via `window._g.r()`. Function definitions live in the shared
 * `scriptlets-bundle.js` which must be loaded before this file.
 *
 * @param jsRules Set of unique raw JS rule body strings.
 * @param scriptletMap Map of scriptlet name → Set of JSON-serialized arg arrays.
 *
 * @returns Compiled JavaScript string, or `null` if no rules.
 */
export const compileDomainBundle = async (
    jsRules: Set<RuleBody>,
    scriptletMap: Record<string, Set<string>> | undefined,
): Promise<string | null> => {
    const agFunctions: Map<string, string> = new Map();
    const remainingRules: Set<string> = new Set();

    jsRules.forEach((rule) => {
        const agFunctionName = extractAgFunctionName(rule);
        if (agFunctionName) {
            agFunctions.set(agFunctionName, rule);
        } else {
            remainingRules.add(rule);
        }
    });

    const statements: string[] = [];
    const errors: string[] = [];

    // Compile JS rules with AG_ dependencies
    for (const rule of remainingRules) {
        try {
            const usedAgFunctions = findAgFunctionUsages(rule);
            const deps = usedAgFunctions
                .map((fn) => agFunctions.get(fn))
                .filter(Boolean) as string[];

            const processedCode = deps.length > 0
                ? `${deps.join(NEWLINE_CHAR_UNIX)}${NEWLINE_CHAR_UNIX}${rule}`
                : rule;

            const wrappedCode = wrapWithGuard(calculateUniqueId(rule), processedCode);

            const minified = await minify(wrappedCode, {
                compress: { sequences: false },
                parse: { bare_returns: true },
            });

            if (minified.code) {
                statements.push(minified.code);
            } else {
                errors.push(`Failed to minify rule: ${rule.substring(0, 80)}`);
            }
        } catch (error) {
            errors.push(
                `Skipping invalid rule: ${rule.substring(0, 80)}; `
                + `Error: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    errors.forEach((msg) => console.warn(`[generate-preregistered-domain-bundles] ${msg}`));

    // Scriptlet invocations — delegated to shared runner
    if (scriptletMap && Object.keys(scriptletMap).length > 0) {
        for (const [scriptletName, argsSet] of Object.entries(scriptletMap)) {
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
                statements.push(
                    `_g.r(${JSON.stringify(scriptletName)}, `
                    + `${JSON.stringify(source)}, `
                    + `${JSON.stringify(args)}, `
                    + `"${uniqueId}");`,
                );
            }
        }
    }

    if (statements.length === 0) {
        return null;
    }

    return [
        '(function () {',
        'var _g = window._g;',
        'if (!_g) return;',
        statements.join(NEWLINE_CHAR_UNIX),
        '})();',
        '',
    ].join(NEWLINE_CHAR_UNIX);
};
