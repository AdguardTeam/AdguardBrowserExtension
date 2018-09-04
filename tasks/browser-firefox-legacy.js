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
import { BUILD_DIR, LOCALES, LOCALES_PAIRS, LOCALES_DIR, BRANCH_DEV, BRANCH_BETA, BRANCH_RELEASE, FIREFOX_LEGACY_UPDATE_URL, FIREFOX_LEGACY_ID_BETA, FIREFOX_EXTENSION_ID_DEV, FIREFOX_LEGACY } from './consts';
import { version } from './parse-package';
import zip from 'gulp-zip';
import copyCommonFiles from './copy-common';
import { preprocessAll, getExtensionNamePostfix } from './helpers';
import os from 'os';

// set current type of build
const BRANCH = process.env.NODE_ENV || '';

const paths = {
    firefox: path.join('Extension/browser/firefox/**/*'),
    filters: path.join('Extension/filters/firefox/**/*'),
    dest: path.join(BUILD_DIR, BRANCH, (BRANCH === BRANCH_DEV) ? `firefox-legacy-${version}` : `firefox-legacy-${BRANCH}-${version}-unsigned`),
};

const dest = {
    filters: path.join(paths.dest, 'filters'),
    inner: path.join(paths.dest, '**/*'),
    buildDir: path.join(BUILD_DIR, BRANCH),
    rdf: path.join(paths.dest, 'install.rdf'),
    chromeManifest: path.join(paths.dest, 'chrome.manifest')
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

// preprocess with params
const preprocess = (done) => preprocessAll(paths.dest, {browser: 'FIREFOX', remoteScripts: true}, done);

const updateRdf = (done) => {
    let data = fs.readFileSync(dest.rdf).toString();

    data = data.replace(/\$\{version\}/g, version);

    if (BRANCH === BRANCH_BETA) {
        data = data.replace(/\$\{updateUrl\}/g, FIREFOX_LEGACY_UPDATE_URL);
        data = data.replace(/\$\{extensionId\}/g, FIREFOX_LEGACY_ID_BETA);
    } else {
        data = data.replace(/\$\{updateUrl\}/g, '');
        data = data.replace(/\$\{extensionId\}/g, FIREFOX_EXTENSION_ID_DEV);
    }

    data = data.replace(/\$\{localised\}/g, getLocalesToFirefoxInstallRdf());

    fs.writeFileSync(dest.rdf, data);
    return done();
};

const createArchive = (done) => {
    if (BRANCH !== BRANCH_BETA && BRANCH !== BRANCH_RELEASE) {
        return done();
    }

    return gulp.src(dest.inner)
        .pipe(zip(`firefox-legacy-${BRANCH}-${version}-unsigned.xpi`))
        .pipe(gulp.dest((path.join(BUILD_DIR, BRANCH))));
};

/**
 * Get locales list to write in Firefox RDF file. Example of notation:
 * <em:localized>
 * <Description>
 * <em:locale>en</em:locale>
 * <em:name>Adguard AdBlocker</em:name>
 * <em:description>Adguard AdBlocker</em:description>
 * </Description>
 * </em:localized>
 */
const getLocalesToFirefoxInstallRdf = () => {
    const sb = [];
    LOCALES.forEach(locale => {
        locale = LOCALES_PAIRS[locale] || locale;
        const file = path.join(LOCALES_DIR, locale, 'messages.json');
        const messages = JSON.parse(fs.readFileSync(file));

        sb.push('<em:localized>' + os.EOL);
        sb.push('\t<Description>' + os.EOL);
        sb.push('\t\t<em:locale>' + locale + '</em:locale>' + os.EOL);
        sb.push('\t\t<em:name>' + messages.name.message + getExtensionNamePostfix(BRANCH, FIREFOX_LEGACY) + '</em:name>' + os.EOL);
        sb.push('\t\t<em:description>' + messages.description.message + '</em:description>' + os.EOL);
        sb.push('\t</Description>' + os.EOL);
        sb.push('</em:localized>' + os.EOL);
    })

    return sb.join('');
};

const updateChromeManifest = (done) => {
    let data = fs.readFileSync(dest.chromeManifest).toString();

    const sb = [os.EOL, os.EOL];

    LOCALES.forEach(function (locale) {
        locale = LOCALES_PAIRS[locale] || locale;
        sb.push('locale adguard ' + locale.replace('_', '-') + ' ./chrome/locale/' + locale.replace('_', '-') + '/'  + os.EOL);
    });

    data += sb.join('');

    fs.writeFileSync(dest.chromeManifest, data);
    return done();
};

export default gulp.series(copyCommon, copyFilters, convertLocales, firefoxLegacy, updateRdf, preprocess, updateChromeManifest, createArchive);
