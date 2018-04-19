/**
 * Chromium build
 */

/* global process */
import fs from 'fs';
import path from 'path';
import gulp from 'gulp';
import {BUILD_DIR} from './consts';
import {version} from './parse-package';
import {updateLocalesMSGName, preprocessAll} from './helpers';
import zip from 'gulp-zip';
import crx from 'gulp-crx-pack';
import copyCommonFiles from './copy-common';

const paths = {
    entry: path.join('Extension/browser/chrome/**/*'),
    filters: path.join('Extension/filters/chromium/**/*'),
    webkitFiles: path.join('Extension/browser/webkit/**/*'),
    cert: path.join('private/certificate.pem'),
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
const chromiumMainFiles = () => gulp.src([paths.entry, paths.webkitFiles]).pipe(gulp.dest(paths.dest));

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
    if (process.env.NODE_ENV !== 'beta' && process.env.NODE_ENV !== 'release') {
        return done();
    }

    return gulp.src(dest.inner)
        .pipe(zip(`chrome-${version}.zip`))
        .pipe(gulp.dest(dest.buildDir));
};

const crxPack = (done) => {
    if (process.env.NODE_ENV !== 'release') {
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
