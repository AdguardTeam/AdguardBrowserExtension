/*
 * Edge build
 */

/* global process */
import fs from 'fs';
import path from 'path';
import gulp from 'gulp';
import zip from 'gulp-zip';
import {BUILD_DIR} from './consts';
import {version} from './parse-package';
import {updateLocalesMSGName, preprocessAll} from './helpers';
import copyCommonFiles from './copy-common';
import Logs from './log';

const logs = new Logs();

const paths = {
    entry: path.join('Extension/browser/edge/**/*'),
    filters: path.join('Extension/filters/edge/**/*'),
    chromeFiles: path.join('Extension/browser/chrome/**/*'),
    webkitFiles: path.join('Extension/browser/webkit/**/*'),
    dest: path.join(BUILD_DIR, process.env.NODE_ENV || '', `edge-${version}`)
};

const dest = {
    filters: path.join(paths.dest, 'filters'),
    inner: path.join(paths.dest, '**/*'),
    buildDir: path.join(BUILD_DIR, process.env.NODE_ENV || ''),
    manifest: path.join(paths.dest, 'manifest.json')
};

// copy common filters
const copyCommon = () => copyCommonFiles(paths.dest);

// copy edge filters
const copyFilters = () => gulp.src(paths.filters).pipe(gulp.dest(dest.filters));

// edge extension includes webkit and chromium files
const edge = () => gulp.src([paths.webkitFiles, paths.chromeFiles, paths.entry]).pipe(gulp.dest(paths.dest));

// preprocess with params
const preprocess = (done) => preprocessAll(paths.dest, {browser: 'EDGE', remoteScripts: true}, done);

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
        .pipe(zip(`edge-${version}.zip`))
        .pipe(gulp.dest(dest.buildDir));
};

export default gulp.series(copyCommon, copyFilters, edge, updateManifest, localesProcess, preprocess, createArchive);
