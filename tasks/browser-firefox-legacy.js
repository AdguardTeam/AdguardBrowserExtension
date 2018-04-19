/**
 * Firefox legacy
 */

/* global process */
import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import gulp from 'gulp';
import {BUILD_DIR, LOCALES_DIR} from './consts';
import {version} from './parse-package';
import zip from 'gulp-zip';
import copyCommonFiles from './copy-common';

const paths = {
    entry: path.join('Extension/browser/firefox/**/*'),
    filters: path.join('Extension/filters/firefox/**/*'),
    dest: path.join(BUILD_DIR, process.env.NODE_ENV || '', `firefox-legacy-${version}`)
};

const dest = {
    filters: path.join(paths.dest, 'filters'),
    inner: path.join(paths.dest, '**/*'),
    buildDir: path.join(BUILD_DIR, process.env.NODE_ENV || ''),
    manifest: path.join(paths.dest, 'manifest.json')
};

// copy common files except languages
const copyCommon = () => copyCommonFiles(paths.dest, true);

// copy firefox filters
const copyFilters = () => gulp.src(paths.filters).pipe(gulp.dest(dest.filters));

// copy firefox files
const firefoxLegacy = () => gulp.src(paths.entry).pipe(gulp.dest(paths.dest));

const propsToString = (messages, prev, key) => `${prev}${key}=${messages[key].message}\n`;

// converting localizations from json to firefox oldest format
const convertLocales = (done) => {
    const locales = fs.readdirSync(path.join(LOCALES_DIR));

    for (const i of locales) {
        const file = path.join(LOCALES_DIR, i, 'messages.json');
        const messages = JSON.parse(fs.readFileSync(file));

        // converting from json structure to string
        const cont = Object.keys(messages).reduce(propsToString.bind(this, messages), '');

        // Ensures that the directory exists. If the directory structure does not exist, it is created
        const dir = path.join(paths.dest, 'chrome/locale', i);
        fse.ensureDirSync(dir);

        fs.writeFileSync(path.join(dir, 'messages.properties'), cont);
    }

    return done();
};

const createArchive = (done) => {
    if (process.env.NODE_ENV !== 'beta' && process.env.NODE_ENV !== 'release') {
        return done();
    }

    return gulp.src(dest.inner)
        .pipe(zip(`firefox-legacy-${version}.zip`))
        .pipe(gulp.dest((path.join(BUILD_DIR, process.env.NODE_ENV))));
};

export default gulp.series(copyCommon, copyFilters, convertLocales, firefoxLegacy, createArchive);
