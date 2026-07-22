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

import {
    CosmeticOption,
    Engine,
    Request,
    RequestType,
} from '@adguard/tsurlfilter';
import {
    computeJsRuleHash,
    computeScriptletHash,
    normalizeDomain,
} from '@adguard/tswebextension/mv3/preregistered-scripts/hasher';

import { extractPreprocessedRawFilterList, readMetadataRuleSet } from '../filter-extractor';

import { preregisteredDomains as rawPreregisteredDomains } from './config';
import { type CollectedRuleEntry } from './scriptlet-collector';

const preregisteredDomains: readonly string[] = rawPreregisteredDomains.map(normalizeDomain);

/**
 * A hash the real engine matched for a domain but that has no collected.
 */
interface MissingHashEntry {
    /** Preregistered domain the rule was matched for. */
    domain: string;

    /** Hash of the unmatched rule. */
    hash: string;

    /** Original rule text, for diagnostics. */
    ruleText: string;
}

/**
 * Checks every filter, one at a time, against the real `@adguard/tsurlfilter`
 * engine to make sure a `{hash}.js` file exists for every JS/scriptlet rule
 * it could match on a preregistered domain.
 *
 * @param declarativeFolder Path to the DNR declarative filter folder.
 * @param collectedRules Rules collected by {@link ScriptletCollector.collect}.
 *
 * @throws {Error} If the engine matches a JS/scriptlet rule for a
 * preregistered domain whose hash isn't present in `collectedRules`.
 */
export const assertHashCompleteness = async (
    declarativeFolder: string,
    collectedRules: ReadonlyMap<string, CollectedRuleEntry>,
): Promise<void> => {
    const metadataRuleSet = await readMetadataRuleSet(declarativeFolder);
    const ruleSetIds = metadataRuleSet.getRuleSetIds();

    const missing: MissingHashEntry[] = [];

    await Promise.all(ruleSetIds.map(async (ruleSetId, index) => {
        const content = await extractPreprocessedRawFilterList(ruleSetId, declarativeFolder);
        const engine = Engine.createSync({ filters: [{ id: index + 1, content }] });

        await Promise.all(preregisteredDomains.map(async (domain) => {
            const request = new Request(`https://${domain}/`, null, RequestType.Document);
            const cosmeticResult = engine.getCosmeticResult(request, CosmeticOption.CosmeticOptionJS);

            await Promise.all(cosmeticResult.JS.getRules().map(async (rule) => {
                let hash: string;

                if (rule.isScriptlet) {
                    const data = rule.getScriptletData();
                    if (!data) {
                        return;
                    }
                    hash = await computeScriptletHash(data.params.name, data.params.args);
                } else {
                    hash = await computeJsRuleHash(rule.getContent());
                }

                if (!collectedRules.has(hash)) {
                    missing.push({ domain, hash, ruleText: rule.getText() ?? '<unknown rule text>' });
                }
            }));
        }));
    }));

    if (missing.length > 0) {
        const details = missing
            .map(({ domain, hash, ruleText }) => `  - "${domain}": hash "${hash}" (rule: ${ruleText})`)
            .join('\n');

        throw new Error(
            '[ext.assertHashCompleteness]: The @adguard/tsurlfilter engine matched JS/scriptlet rule(s) for '
            + 'preregistered domain(s) that ScriptletCollector did not collect, so no {hash}.js file would be '
            + 'generated for them. The runtime would fail to register content scripts for these domains once '
            + `the corresponding filter is enabled:\n${details}`,
        );
    }
};
