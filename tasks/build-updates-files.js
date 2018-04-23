/**
 * Build files for browsers updating
 */

import fs from 'fs';
import gulp from 'gulp';
import {version} from './parse-package';

const copyFiles = () => gulp.src('./tasks/resources/**').pipe(gulp.dest('./'));

const chromeUpdate = (done) => {
    let chrome_updates = fs.readFileSync('./chrome_updates.xml').toString();

    chrome_updates = chrome_updates.replace(/\%VERSION\%/g, version);
    chrome_updates = chrome_updates.replace(/\%TAGNAME\%/g, `v${version}-beta`);
    chrome_updates = chrome_updates.replace(/\%NAME\%/g, `chrome-beta-${version}.crx`);

    fs.writeFileSync('./chrome_updates.xml', chrome_updates);

    return done();
};

const firefoxJSONupdate = (done) => {
    let firefox_updates = fs.readFileSync('./firefox_updates.json').toString();

    firefox_updates = firefox_updates.replace(/\%VERSION\%/g, version);
    firefox_updates = firefox_updates.replace(/\%TAGNAME\%/g, `v${version}-beta`);
    firefox_updates = firefox_updates.replace(/\%STANDALONE_NAME\%/g, `firefox-standalone-beta-${version}.xpi`);

    fs.writeFileSync('./firefox_updates.json', firefox_updates);

    return done();
};

const firefoxRDFupdate = (done) => {
    let firefox_updates = fs.readFileSync('./firefox_updates.rdf').toString();

    firefox_updates = firefox_updates.replace(/\%VERSION\%/g, version);
    firefox_updates = firefox_updates.replace(/\%TAGNAME\%/g, `v${version}-beta`);
    firefox_updates = firefox_updates.replace(/\%STANDALONE_NAME\%/g, `firefox-standalone-beta-${version}.xpi`);
    firefox_updates = firefox_updates.replace(/\%LEGACY_NAME\%/g, `firefox-legacy-beta-${version}.xpi`);

    fs.writeFileSync('./firefox_updates.rdf', firefox_updates);

    return done();
};

const safariUpdate = (done) => {
    let safari_updates = fs.readFileSync('./safari_updates.xml').toString();

    safari_updates = safari_updates.replace(/\%VERSION\%/g, version);
    safari_updates = safari_updates.replace(/\%TAGNAME\%/g, `v${version}-beta`);
    safari_updates = safari_updates.replace(/\%NAME\%/g, `safari-beta-${version}.safariextz`);

    fs.writeFileSync('./safari_updates.xml', safari_updates);

    return done();
};

export default gulp.series(copyFiles, chromeUpdate, firefoxJSONupdate, firefoxRDFupdate, safariUpdate);
