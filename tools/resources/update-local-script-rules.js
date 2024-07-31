/**
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

/**
 * By the rules of AMO we cannot use remote scripts (and our JS rules can be counted as such).
 * Because of that we use the following approach (that was accepted by AMO reviewers):
 *
 * 1. We pre-build JS rules from AdGuard filters into the add-on (see the file called "local_script_rules.json").
 * 2. At runtime we check every JS rule if it's included into "local_script_rules.json".
 *  If it is included we allow this rule to work since it's pre-built. Other rules are discarded.
 * 3. We also allow "User rules" to work since those rules are added manually by the user.
 *  This way filters maintainers can test new rules before including them in the filters.
 */
import { promises as fs } from 'fs';

import * as _ from 'lodash';

import {
    CosmeticRuleParser,
    FilterListParser,
    defaultParserOptions,
} from '@adguard/agtree';

import { FILTERS_DEST, LOCAL_SCRIPT_RULES_COMMENT } from '../constants';
import { ADGUARD_FILTERS_IDS } from '../../constants';

const updateLocalScriptRulesForBrowser = async (browser) => {
    const folder = FILTERS_DEST.replace('%browser', browser);
    const rules = {
        comment: LOCAL_SCRIPT_RULES_COMMENT,
        rules: {},
    };

    // eslint-disable-next-line no-restricted-syntax
    for (const filterId of ADGUARD_FILTERS_IDS) {
        // eslint-disable-next-line no-await-in-loop
        const rawFilterList = (await fs.readFile(`${folder}/filter_${filterId}.txt`)).toString();
        const filterListNode = FilterListParser.parse(rawFilterList, {
            ...defaultParserOptions,
            includeRaws: false,
            isLocIncluded: false,
            tolerant: true,
        });

        filterListNode.children.forEach((ruleNode) => {
            if (
                ruleNode.category === 'Cosmetic'
                && (ruleNode.type === 'ScriptletInjectionRule' || ruleNode.type === 'JsInjectionRule')
            ) {
                // Re-generate raw body to make it consistent with TSUrlFilter rule instances
                // (TSUrlFilter also re-generates body from AST in the cosmetic rule constructor)
                const rawBody = CosmeticRuleParser.generateBody(ruleNode);
                const permittedDomains = [];
                const restrictedDomains = [];

                ruleNode.domains.children.forEach((domainNode) => {
                    if (domainNode.exception) {
                        restrictedDomains.push(domainNode.value);
                    } else {
                        permittedDomains.push(domainNode.value);
                    }
                });

                const toPush = {
                    permittedDomains,
                    restrictedDomains,
                };

                if (rules.rules[rawBody] === undefined) {
                    rules.rules[rawBody] = [toPush];
                } else if (!_.some(rules.rules[rawBody], toPush)) {
                    rules.rules[rawBody].push(toPush);
                }
            }
        });
    }

    await fs.writeFile(
        `${FILTERS_DEST.replace('%browser', browser)}/local_script_rules.json`,
        JSON.stringify(rules, null, 4),
    );
};

export const updateLocalScriptRules = async () => {
    await updateLocalScriptRulesForBrowser('firefox');
};
