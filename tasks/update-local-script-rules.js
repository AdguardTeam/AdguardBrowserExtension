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
const safari = (done) => updateLocalScriptRules('safari', done);
const operaBrowser = (done) => updateLocalScriptRules('opera', done);

export default gulp.series(chromium, edge, firefox, safari, operaBrowser);
