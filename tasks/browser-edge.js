/*
 * Edge build
 * 1. Copying common scripts and htmls (pages, lib, locales)
 * 2. Copying Edge filters
 * 3. Copying Webkit, Chrome and Edge scripts
 * 4. Updating version of an extension in manifest
 * 5. Change the extension name in localization files based on a type of a build (dev, beta or release)
 * 6. Preprocessing files
 * 7. Creating zip archive of an extension
 */

import fs from 'fs';
import path from 'path';
import gulp from 'gulp';
import zip from 'gulp-zip';
import { BUILD_DIR, BRANCH_BETA, BRANCH_RELEASE } from './consts';
import { version } from './parse-package';
import { updateLocalesMSGName, preprocessAll } from './helpers';
import copyCommonFiles from './copy-common';
import copyExternal from './copy-external';

// set current type of build
const BRANCH = process.env.NODE_ENV || '';

const paths = {
    edge: path.join('Extension/browser/edge/**/*'),
    filters: path.join('Extension/filters/edge/**/*'),
    chromeFiles: path.join('Extension/browser/chrome/**/*'),
    webkitFiles: path.join('Extension/browser/webkit/**/*'),
    dest: path.join(BUILD_DIR, BRANCH, `edge-${version}`),
};

const dest = {
    filters: path.join(paths.dest, 'filters'),
    inner: path.join(paths.dest, '**/*'),
    buildDir: path.join(BUILD_DIR, BRANCH),
    manifest: path.join(paths.dest, 'manifest.json'),
    assistant: path.join(paths.dest, 'lib', 'content-script', 'assistant', 'js'),
};

// copy common filters
const copyCommon = () => copyCommonFiles(paths.dest);

// copy edge filters
const copyFilters = () => gulp.src(paths.filters).pipe(gulp.dest(dest.filters));

// edge extension includes webkit and chromium files
const edge = () => gulp.src([paths.webkitFiles, paths.chromeFiles, paths.edge]).pipe(gulp.dest(paths.dest));

// preprocess with params
const preprocess = done => preprocessAll(paths.dest, { browser: 'EDGE', remoteScripts: true }, done);

// change the extension name based on a type of a build (dev, beta or release)
const localesProcess = done => updateLocalesMSGName(BRANCH, paths.dest, done);

// update current version of extension
const updateManifest = (done) => {
    const manifest = JSON.parse(fs.readFileSync(dest.manifest));
    manifest.version = version;
    fs.writeFileSync(dest.manifest, JSON.stringify(manifest, null, 4));
    return done();
};

const createArchive = (done) => {
    if (BRANCH !== BRANCH_BETA && BRANCH !== BRANCH_RELEASE) {
        return done();
    }

    return gulp.src(dest.inner)
        .pipe(zip(`edge-${BRANCH}-${version}.zip`))
        .pipe(gulp.dest(dest.buildDir));
};

export default gulp.series(
    () => copyExternal(dest.assistant),
    copyCommon,
    copyFilters,
    edge,
    updateManifest,
    localesProcess,
    preprocess,
    createArchive
);
