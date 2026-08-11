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

import { RawRuleConverter } from '@adguard/agtree';
import {
    CosmeticRule,
    Request,
    RequestType,
} from '@adguard/tsurlfilter';

import { type CollectedRuleEntry } from './scriptlet-collector';

/** Subset of the collector's `CollectedRuleEntry` used for targeting. */
type CollectedRuleLike = Pick<CollectedRuleEntry, 'scriptletName' | 'scriptletArgs' | 'jsBody'>;

/**
 * Checks whether an exception cancels a collected rule: JS by body equality,
 * scriptlets by name (generic, name-only or exact args match).
 *
 * @param exception Exception cosmetic rule.
 * @param entry Collected blocking rule entry.
 *
 * @returns True if the exception cancels the rule.
 */
const targetsRule = (exception: CosmeticRule, entry: CollectedRuleLike): boolean => {
    if (!exception.isScriptlet) {
        return entry.jsBody != null && exception.getContent() === entry.jsBody;
    }

    const { scriptletName, scriptletArgs } = entry;
    const params = exception.scriptletParams;
    if (!scriptletName || !scriptletArgs || !params) {
        return false;
    }

    // Generic scriptlet exception cancels all scriptlets.
    if (!params.name) {
        return true;
    }

    if (params.name !== scriptletName) {
        return false;
    }

    if (params.args.length === 0) {
        return true;
    }

    return params.args.length === scriptletArgs.length
        && params.args.every((arg, index) => arg === scriptletArgs[index]);
};

/**
 * Throws on `$path`-scoped scriptlet/JS exceptions cancelling collected
 * rules on preregistered hostnames: preregistration is per-hostname and
 * cannot honor path-scoped cancellation (support machinery removed as dead
 * code, AG-52477). If this fires, drop `$path` from the exception.
 *
 * @param rawFilterList Raw filter list text.
 * @param rulesetId Id of the ruleset the list belongs to.
 * @param collectedRules Rules collected so far (this and earlier rulesets).
 * @param hostnames Preregistered hostnames to match exceptions against.
 *
 * @throws When a cancelling exception is found.
 */
export const assertNoPathScopedExceptions = (
    rawFilterList: string,
    rulesetId: string,
    collectedRules: Map<string, CollectedRuleLike>,
    hostnames: readonly string[],
): void => {
    for (const line of rawFilterList.split('\n')) {
        const trimmed = line.trim();

        if (trimmed.startsWith('!') || !trimmed.includes('path=')) {
            continue;
        }

        let candidates: string[];
        try {
            candidates = RawRuleConverter.convertToAdg(trimmed).result;
        } catch {
            // The engine keeps the original line when conversion fails.
            candidates = [trimmed];
        }

        for (const candidate of candidates) {
            let exception: CosmeticRule;
            try {
                exception = new CosmeticRule(candidate, 1);
            } catch {
                continue;
            }

            if (!exception.isAllowlist() || !exception.pathModifier) {
                continue;
            }

            for (const entry of collectedRules.values()) {
                if (!targetsRule(exception, entry)) {
                    continue;
                }

                const matchedHostnames = hostnames.filter((hostname) => exception.match(
                    new Request(`https://${hostname}/`, null, RequestType.Document),
                    true,
                ));
                if (matchedHostnames.length === 0) {
                    continue;
                }

                const ruleText = entry.jsBody ?? `//scriptlet('${entry.scriptletName ?? ''}')`;
                throw new Error(
                    '[ext.assertNoPathScopedExceptions]: '
                    + `"${exception.getText() ?? '<unknown>'}" (ruleset "${rulesetId}") `
                    + `cancels "${ruleText}" on ${matchedHostnames.join(', ')}.`,
                );
            }
        }
    }
};
