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

import fs from 'fs';
import path from 'path';
import gulp from 'gulp';
import webExt from 'web-ext';
import zip from 'gulp-zip';
import {
    BUILD_DIR,
    BRANCH_DEV,
    BRANCH_BETA,
    BRANCH_RELEASE,
    FIREFOX_WEBEXT,
    FIREFOX_EXTENSION_ID_BETA,
    FIREFOX_EXTENSION_ID_RELEASE,
    FIREFOX_EXTENSION_ID_DEV,
} from './consts';
import { version } from './parse-package';
import { updateLocalesMSGName, preprocessAll } from './helpers';
import copyCommonFiles from './copy-common';
import copyExternal from './copy-external';

// set current type of build
const BRANCH = process.env.NODE_ENV || '';

const paths = {
    firefox_webext: path.join('Extension/browser/firefox_webext/**/*'),
    filters: path.join('Extension/filters/firefox/**/*'),
    chromeFiles: path.join('Extension/browser/chrome/**/*'),
    webkitFiles: path.join('Extension/browser/webkit/**/*'),
    dest: path.join(BUILD_DIR, BRANCH, (BRANCH === BRANCH_DEV)
        ? `firefox-amo-${version}`
        : `firefox-amo-${BRANCH}-${version}-unsigned`),
};

const dest = {
    filters: path.join(paths.dest, 'filters'),
    inner: path.join(paths.dest, '**/*'),
    buildDir: path.join(BUILD_DIR, BRANCH),
    manifest: path.join(paths.dest, 'manifest.json'),
    webext: path.join(BUILD_DIR, BRANCH, `firefox-amo-${BRANCH}-${version}-unsigned.zip`),
    assistant: path.join(paths.dest, 'lib', 'content-script', 'assistant', 'js'),
};

// copy common files
const copyCommon = () => copyCommonFiles(paths.dest);

// copy firefox filters
const copyFilters = () => gulp.src(paths.filters)
    .pipe(gulp.dest(dest.filters));

// copy chromium, webkit files and firefox_webext files
const firefoxWebext = () => gulp.src([paths.webkitFiles, paths.chromeFiles, paths.firefox_webext])
    .pipe(gulp.dest(paths.dest));

// preprocess with params
const preprocess = done => preprocessAll(paths.dest, {
    browser: FIREFOX_WEBEXT,
    remoteScripts: false,
}, done);

// change the extension name based on a type of a build (dev, beta or release)
const localesProcess = done => updateLocalesMSGName(BRANCH, paths.dest, done, FIREFOX_WEBEXT);

const updateManifest = (done) => {
    const manifest = JSON.parse(fs.readFileSync(dest.manifest));

    let extensionID = '';

    switch (BRANCH) {
        case BRANCH_BETA:
            extensionID = FIREFOX_EXTENSION_ID_BETA;
            break;
        case BRANCH_RELEASE:
            extensionID = FIREFOX_EXTENSION_ID_RELEASE;
            break;
        case BRANCH_DEV:
            extensionID = FIREFOX_EXTENSION_ID_DEV;
            break;
        default:
            throw new Error(`This is impossible branch: ${BRANCH}`);
    }

    manifest.version = version;
    manifest.applications.gecko.id = extensionID;
    fs.writeFileSync(dest.manifest, JSON.stringify(manifest, null, 4));
    return done();
};

const createArtifactBuild = (done) => {
    if (BRANCH !== BRANCH_BETA && BRANCH !== BRANCH_RELEASE) {
        return done();
    }
    return gulp.src(dest.inner)
        .pipe(zip('firefox.zip'))
        .pipe(gulp.dest(BUILD_DIR));
};

const createWebExt = (done) => {
    if (BRANCH !== BRANCH_BETA && BRANCH !== BRANCH_RELEASE) {
        return done();
    }

    return webExt.cmd.build({
        sourceDir: paths.dest,
        artifactsDir: dest.buildDir,
        overwriteDest: true,
    }).then((file) => {
        fs.renameSync(file.extensionPath, dest.webext);
        done();
    });
};

export default gulp.series(
    () => copyExternal(dest.assistant),
    copyCommon,
    copyFilters,
    firefoxWebext,
    updateManifest,
    localesProcess,
    preprocess,
    createArtifactBuild,
    createWebExt
);
