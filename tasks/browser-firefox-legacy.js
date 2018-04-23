/**
 * Firefox legacy build.
 * 1. Copying common scripts and htmls (pages, lib, locales)
 * 2. Copying Firefox filters
 * 3. Converting localizations from json to old Firefox format
 * 4. Copying Firefox scripts
 * 5. Creating zip archive with replacing file extension from .zip to .xpi
 */

/* global process */
import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import gulp from 'gulp';
import {BUILD_DIR, LOCALES_DIR, BRANCH_BETA, BRANCH_RELEASE, FIREFOX_LEGACY_UPDATE_URL, FIREFOX_LEGACY_ID_BETA, FIREFOX_EXTENSION_ID_DEV} from './consts';
import {version} from './parse-package';
import zip from 'gulp-zip';
import copyCommonFiles from './copy-common';

const paths = {
    firefox: path.join('Extension/browser/firefox/**/*'),
    filters: path.join('Extension/filters/firefox/**/*'),
    dest: path.join(BUILD_DIR, process.env.NODE_ENV || '', `firefox-legacy-${version}`)
};

const dest = {
    filters: path.join(paths.dest, 'filters'),
    inner: path.join(paths.dest, '**/*'),
    buildDir: path.join(BUILD_DIR, process.env.NODE_ENV || ''),
    rdf: path.join(paths.dest, 'install.rdf')
};

// copy common files except languages
const copyCommon = () => copyCommonFiles(paths.dest, true);

// copy firefox filters
const copyFilters = () => gulp.src(paths.filters).pipe(gulp.dest(dest.filters));

// copy firefox files
const firefoxLegacy = () => gulp.src(paths.firefox).pipe(gulp.dest(paths.dest));

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

const updateRdf = (done) => {
    let data = fs.readFileSync(dest.rdf).toString();

    data = data.replace(/\$\{version\}/g, version);

    if (process.env.NODE_ENV === BRANCH_BETA) {
        data = data.replace(/\$\{updateUrl\}/g, FIREFOX_LEGACY_UPDATE_URL);
        data = data.replace(/\$\{extensionId\}/g, FIREFOX_LEGACY_ID_BETA);
    } else {
        data = data.replace(/\$\{updateUrl\}/g, '');
        data = data.replace(/\$\{extensionId\}/g, FIREFOX_EXTENSION_ID_DEV);
    }

    fs.writeFileSync(dest.rdf, data);
    return done();
};

const createArchive = (done) => {
    if (process.env.NODE_ENV !== BRANCH_BETA && process.env.NODE_ENV !== BRANCH_RELEASE) {
        return done();
    }

    return gulp.src(dest.inner)
        .pipe(zip(`firefox-legacy-${version}.xpi`))
        .pipe(gulp.dest((path.join(BUILD_DIR, process.env.NODE_ENV))));
};

export default gulp.series(copyCommon, copyFilters, convertLocales, firefoxLegacy, updateRdf, createArchive);
