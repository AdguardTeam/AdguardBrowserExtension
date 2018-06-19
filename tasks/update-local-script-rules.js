/**
 * By the rules of AMO and addons.opera.com we cannot use remote scripts (and our JS injection rules could be counted as remote scripts).
 * So what we do:
 * 1. We gather all current JS rules in the local_script_rules.json and load into the DEFAULT_SCRIPT_RULES object (see lib/utils/local-script-rules.js)
 * 2. We disable JS rules got from remote server
 * 3. We allow only custom rules got from the User filter (which user creates manually) or from this DEFAULT_SCRIPT_RULES object
 */

import fs from 'fs';
import gulp from 'gulp';
import {FILTERS_DEST, LAST_ADGUARD_FILTER_ID, LOCAL_SCRIPT_RULES_COMMENT} from './consts';

const updateLocalScriptRules = (browser, done) => {
    const folder = FILTERS_DEST.replace('%browser', browser);
    const rules = {
        comment: LOCAL_SCRIPT_RULES_COMMENT,
        rules: []
    };

    for (let i = 1; i <= LAST_ADGUARD_FILTER_ID; i++) {
        const filters = fs.readFileSync(`${folder}/filter_${i}.txt`).toString();
        const lines = filters.split('\n');

        for (let rule of lines) {
            rule = rule.trim();

            if (rule && rule[0] !== '!' && rule.indexOf('#%#') > 0) {
                let m = rule.split('#%#');

                rules.rules.push({
                    'domains': m[0],
                    'script': m[1]
                });
            }
        }
    }

    fs.writeFileSync(FILTERS_DEST.replace('%browser', browser) + '/local_script_rules.json', JSON.stringify(rules, null, 4));

    return done();
};

const chromium = (done) => updateLocalScriptRules('chromium', done);
const edge = (done) => updateLocalScriptRules('edge', done);
const firefox = (done) => updateLocalScriptRules('firefox', done);
const operaBrowser = (done) => updateLocalScriptRules('opera', done);

export default gulp.series(chromium, edge, firefox, operaBrowser);
