/**
 * Firefox AMO
 */

/* global process */
import fs from 'fs';
import path from 'path';
import gulp from 'gulp';
import {BUILD_DIR, FIREFOX_EXTENSION_ID, FIREFOX_WEBEXT_UPDATE_URL} from './consts';
import {version} from './parse-package';
import {updateLocalesMSGName, preprocessAll} from './helpers';
import webExt from 'web-ext';
import copyCommonFiles from './copy-common';

const paths = {
    entry: path.join('Extension/browser/firefox_webext/**/*'),
    filters: path.join('Extension/filters/firefox/**/*'),
    pages: path.join('Extension/pages/**/*'),
    lib: path.join('Extension/lib/**/*'),
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
const firefoxWebext = () => gulp.src([paths.webkitFiles, paths.chromeFiles, paths.entry]).pipe(gulp.dest(paths.dest));

// preprocess with params
const preprocess = (done) => preprocessAll(paths.dest, {browser: 'FIREFOX', build: 'AMO', remoteScripts: false}, done);

// change the extension name based on a type of a build (dev, beta or release)
const localesProcess = (done) => updateLocalesMSGName(process.env.NODE_ENV, paths.dest, done, 'FIREFOX_WEBEXT');

const updateManifest = (done) => {
    const manifest = JSON.parse(fs.readFileSync(dest.manifest));
    manifest.version = version;
    manifest.applications.gecko.id = FIREFOX_EXTENSION_ID;
    if (process.env.NODE_ENV === 'beta') {
        manifest.applications.gecko.update_url = FIREFOX_WEBEXT_UPDATE_URL;
    }
    fs.writeFileSync(dest.manifest, JSON.stringify(manifest, null, 4));
    return done();
};

const createWebExt = (done) => {
    if (process.env.NODE_ENV !== 'beta' && process.env.NODE_ENV !== 'release') {
        return done();
    }

    return webExt.cmd.build({
        sourceDir: paths.dest,
        artifactsDir: dest.buildDir,
        overwriteDest: true
    }).then(() => done());
};

export default gulp.series(copyCommon, copyFilters, firefoxWebext, updateManifest, localesProcess, preprocess, createWebExt);
