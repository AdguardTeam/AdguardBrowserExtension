/**
 * Firefox AMO build is the same as Firefox-webext build but in this case
 * remote scripts are not allowed.
 * 1. Copying common scripts and htmls (pages, lib, locales)
 * 2. Copying Firefox filters
 * 3. Copying Webkit, Chrome and Firefox_webext scripts
 * 4. Updating version of an extension in manifest and changing update_url if its a beta build
 * 5. Change the extension name in localization files based on a type of a build (dev, beta or release)
 * 6. Preprocessing files with the AMO param for prohibition of remote scripts
 * 7. Creating firefox web-extension pack
 */

/* global process */
import fs from 'fs';
import path from 'path';
import gulp from 'gulp';
import {BUILD_DIR, FIREFOX_WEBEXT_UPDATE_URL, BRANCH_BETA, BRANCH_RELEASE, FIREFOX_WEBEXT, FIREFOX_EXTENSION_ID_BETA, FIREFOX_EXTENSION_ID_RELEASE} from './consts';
import {version} from './parse-package';
import {updateLocalesMSGName, preprocessAll} from './helpers';
import webExt from 'web-ext';
import copyCommonFiles from './copy-common';

const paths = {
    firefox_webext: path.join('Extension/browser/firefox_webext/**/*'),
    filters: path.join('Extension/filters/firefox/**/*'),
    chromeFiles: path.join('Extension/browser/chrome/**/*'),
    webkitFiles: path.join('Extension/browser/webkit/**/*'),
    dest: path.join(BUILD_DIR, process.env.NODE_ENV || '', `firefox-amo-${version}`)
};

const dest = {
    filters: path.join(paths.dest, 'filters'),
    inner: path.join(paths.dest, '**/*'),
    buildDir: path.join(BUILD_DIR, process.env.NODE_ENV || ''),
    manifest: path.join(paths.dest, 'manifest.json')
};

// copy common files
const copyCommon = () => copyCommonFiles(paths.dest);

// copy firefox filters
const copyFilters = () => gulp.src(paths.filters).pipe(gulp.dest(dest.filters));

// copy chromium, webkit files and firefox_webext files
const firefoxWebext = () => gulp.src([paths.webkitFiles, paths.chromeFiles, paths.firefox_webext]).pipe(gulp.dest(paths.dest));

// preprocess with params
const preprocess = (done) => preprocessAll(paths.dest, {browser: 'FIREFOX', build: 'AMO', remoteScripts: false}, done);

// change the extension name based on a type of a build (dev, beta or release)
const localesProcess = (done) => updateLocalesMSGName(process.env.NODE_ENV, paths.dest, done, FIREFOX_WEBEXT);

const updateManifest = (done) => {
    const manifest = JSON.parse(fs.readFileSync(dest.manifest));

    let extensionID = '';

    switch (process.env.NODE_ENV) {
        case BRANCH_BETA:
            extensionID = FIREFOX_EXTENSION_ID_BETA;
            break;
        case BRANCH_RELEASE:
            extensionID = FIREFOX_EXTENSION_ID_RELEASE;
            break;
    }

    manifest.version = version;
    manifest.applications.gecko.id = extensionID;
    fs.writeFileSync(dest.manifest, JSON.stringify(manifest, null, 4));
    return done();
};

const createWebExt = (done) => {
    if (process.env.NODE_ENV !== BRANCH_BETA && process.env.NODE_ENV !== BRANCH_RELEASE) {
        return done();
    }

    return webExt.cmd.build({
        sourceDir: paths.dest,
        artifactsDir: dest.buildDir,
        overwriteDest: true
    }).then(() => done());
};

export default gulp.series(copyCommon, copyFilters, firefoxWebext, updateManifest, localesProcess, preprocess, createWebExt);
