/**
 * Chromium build
 * 1. Copying common scripts and htmls (pages, lib, locales)
 * 2. Copying Chromium filters
 * 3. Copying webkit and Chromium scripts
 * 4. Updating version of an extension in manifest
 * 5. Change the extension name in localization files based on a type of a build (dev, beta or release)
 * 6. Preprocessing files
 * 7. Creating zip archive of an extension
 * 8. Creating crx pack
 */

/* global process */
import fs from 'fs';
import path from 'path';
import gulp from 'gulp';
import {BUILD_DIR, BRANCH_BETA, BRANCH_RELEASE, BRANCH_DEV, PRIVATE_FILES} from './consts';
import {version} from './parse-package';
import {updateLocalesMSGName, preprocessAll} from './helpers';
import zip from 'gulp-zip';
import crx from 'gulp-crx-pack';
import copyCommonFiles from './copy-common';

const paths = {
    chrome: path.join('Extension/browser/chrome/**/*'),
    filters: path.join('Extension/filters/chromium/**/*'),
    webkitFiles: path.join('Extension/browser/webkit/**/*'),
    cert: path.join(PRIVATE_FILES, 'certificate.pem'),
    dest: path.join(BUILD_DIR, process.env.NODE_ENV || '', `chrome-${version}`)
};

const dest = {
    filters: path.join(paths.dest, 'filters'),
    inner: path.join(paths.dest, '**/*'),
    buildDir: path.join(BUILD_DIR, process.env.NODE_ENV || ''),
    manifest: path.join(paths.dest, 'manifest.json')
};

// copy common files
const copyCommon = () => copyCommonFiles(paths.dest);

// copy chromium filters
const copyFilters = () => gulp.src(paths.filters).pipe(gulp.dest(dest.filters));

// copy chromium and webkit files
const chromiumMainFiles = () => gulp.src([paths.webkitFiles, paths.chrome]).pipe(gulp.dest(paths.dest));

// preprocess with params
const preprocess = (done) => preprocessAll(paths.dest, {browser: 'CHROMIUM', remoteScripts: true}, done);

// change the extension name based on a type of a build (dev, beta or release)
const localesProcess = (done) => updateLocalesMSGName(process.env.NODE_ENV, paths.dest, done);

// update current version of extension
const updateManifest = (done) => {
    const manifest = JSON.parse(fs.readFileSync(dest.manifest));
    manifest.version = version;
    fs.writeFileSync(dest.manifest, JSON.stringify(manifest, null, 4));
    return done();
};

const createArchive = (done) => {
    if (process.env.NODE_ENV !== BRANCH_BETA && process.env.NODE_ENV !== BRANCH_RELEASE) {
        return done();
    }

    return gulp.src(dest.inner)
        .pipe(zip(`chrome-${version}.zip`))
        .pipe(gulp.dest(dest.buildDir));
};

const crxPack = (done) => {
    if (process.env.NODE_ENV === BRANCH_DEV || process.env.NODE_ENV === BRANCH_RELEASE) {
        return done();
    }

    return gulp.src(paths.dest)
        .pipe(crx({
            privateKey: fs.readFileSync(paths.cert, 'utf8'),
            filename: `chrome-${version}.crx`
        }))
        .pipe(gulp.dest(dest.buildDir));
};

export default gulp.series(copyCommon, copyFilters, chromiumMainFiles, updateManifest, localesProcess, preprocess, createArchive, crxPack);
