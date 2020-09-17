/**
 * By the rules of AMO and addons.opera.com we cannot use remote scripts
 * (and our JS injection rules could be counted as remote scripts).
 * So what we do:
 * 1. We gather all current JS rules in the local_script_rules.json
 *      and load into the DEFAULT_SCRIPT_RULES object (see lib/utils/local-script-rules.js)
 * 2. We disable JS rules got from remote server
 * 3. We allow only custom rules got from the User filter (which user creates manually)
 *      or from this DEFAULT_SCRIPT_RULES object
 */
import { promises as fs } from 'fs';
import {
    ADGUARD_FILTERS_IDS,
    FILTERS_DEST,
    LOCAL_SCRIPT_RULES_COMMENT,
} from '../constants';

/**
 * @param arr - array with elements [{domains: '', script: ''}, ...]
 * @param domainsToCheck String
 * @param scriptToCheck String
 * @returns {boolean}
 */
const isInArray = (arr, domainsToCheck, scriptToCheck) => {
    for (let i = 0; i < arr.length; i += 1) {
        const element = arr[i];
        const { domains, script } = element;
        if (domains === domainsToCheck && script === scriptToCheck) {
            return true;
        }
    }
    return false;
};

const updateLocalScriptRulesForBrowser = async (browser) => {
    const folder = FILTERS_DEST.replace('%browser', browser);
    const rules = {
        comment: LOCAL_SCRIPT_RULES_COMMENT,
        rules: [],
    };

    // eslint-disable-next-line no-restricted-syntax
    for (const filterId of ADGUARD_FILTERS_IDS) {
        // eslint-disable-next-line no-await-in-loop
        const filters = (await fs.readFile(`${folder}/filter_${filterId}.txt`)).toString();
        const lines = filters.split('\n');

        lines.forEach((line) => {
            line = line.trim();
            if (line && line[0] !== '!' && line.indexOf('#%#') > -1) {
                const m = line.split('#%#');
                m[0] = m[0] === '' ? '<any>' : m[0];
                // check that rule is not in array already
                if (!isInArray(rules.rules, m[0], m[1])) {
                    rules.rules.push({
                        domains: m[0],
                        script: m[1],
                    });
                }
            }
        });
    }

    await fs.writeFile(
        `${FILTERS_DEST.replace('%browser', browser)}/local_script_rules.json`,
        JSON.stringify(rules, null, 4)
    );
};

export const updateLocalScriptRules = async () => {
    await updateLocalScriptRulesForBrowser('chromium');
    await updateLocalScriptRulesForBrowser('edge');
    await updateLocalScriptRulesForBrowser('firefox');
    await updateLocalScriptRulesForBrowser('opera');
};
