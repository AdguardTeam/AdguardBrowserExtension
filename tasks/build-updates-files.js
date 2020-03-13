/**
 * Build files for browsers updating.
 * Version received automatically from package.json.
 */

// TODO remove this task for builds after v3.5.0

import fs from 'fs';
import gulp from 'gulp';
import { version } from './parse-package';

const copyFiles = () => gulp.src('./tasks/resources/**').pipe(gulp.dest('./'));

const chromeUpdate = (done) => {
    let chromeUpdates = fs.readFileSync('./chrome_updates.xml').toString();
    chromeUpdates = chromeUpdates.replace(/\%VERSION\%/g, version);
    fs.writeFileSync('./chrome_updates.xml', chromeUpdates);
    return done();
};

const firefoxJSONUpdate = (done) => {
    let firefoxUpdates = fs.readFileSync('./firefox_updates.json').toString();
    firefoxUpdates = firefoxUpdates.replace(/\%VERSION\%/g, version);
    fs.writeFileSync('./firefox_updates.json', firefoxUpdates);
    return done();
};

export default gulp.series(copyFiles, chromeUpdate, firefoxJSONUpdate);
