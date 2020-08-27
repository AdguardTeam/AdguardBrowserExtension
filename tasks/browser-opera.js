/*
 * Opera build is the same as Chromium build but includes it own filters.
 * This task is running after Chromium build, so we need to copy Chromium folder
 * and include Opera filters files. To zip Opera build folder if release.
 */

import fs from 'fs';
import path from 'path';
import gulp from 'gulp';
import modifyFile from 'gulp-modify-file';
import zip from 'gulp-zip';
import Crx from 'crx';
import {
    BUILD_DIR, BRANCH_RELEASE, PRIVATE_FILES,
} from './consts';

// set current type of build
const BRANCH = process.env.NODE_ENV || '';

const paths = {
    filtersOpera: path.join('Extension/filters/opera/**/*'),
    chromium: path.join(BUILD_DIR, BRANCH, 'chrome', '**/*'),
    chromiumManifest: path.join(BUILD_DIR, BRANCH, 'chrome', 'manifest.json'),
    cert: path.join(PRIVATE_FILES, 'certificate.pem'),
    dest: path.join(BUILD_DIR, BRANCH, 'opera'),
};

const dest = {
    filters: path.join(paths.dest, 'filters'),
    inner: path.join(paths.dest, '**/*'),
    buildDir: path.join(BUILD_DIR, BRANCH),
};

// copy chromium build dir
const copyChromiumFiles = () => gulp.src(paths.chromium).pipe(gulp.dest(paths.dest));

// replace chromium filters by opera filters
const copyFiltersOpera = () => gulp.src(paths.filtersOpera).pipe(gulp.dest(dest.filters));

// copy chromium manifest, and update it
const modifyManifest = () => gulp
    .src(paths.chromiumManifest)
    .pipe(modifyFile((content) => {
        const manifest = JSON.parse(content);
        const updatedManifest = {
            ...manifest,
            minimum_opera_version: '42',
        };
        return JSON.stringify(updatedManifest, null, 4);
    }))
    .pipe(gulp.dest(paths.dest));

const createArtifactBuild = () => gulp.src(dest.inner)
    .pipe(zip('opera.zip'))
    .pipe(gulp.dest(BUILD_DIR));

const crxPack = async (done) => {
    if (BRANCH !== BRANCH_RELEASE) {
        return done();
    }

    const privateKey = await fs.promises.readFile(paths.cert, 'utf-8');

    const crx = new Crx({
        privateKey,
    });

    await crx.load(paths.dest);
    const crxBuffer = await crx.pack();

    const crxBuildFilename = `opera-${BRANCH}.crx`;
    const crxBuildPath = path.join(dest.buildDir, crxBuildFilename);
    await fs.promises.writeFile(crxBuildPath, crxBuffer);

    return done;
};

export default gulp.series(copyChromiumFiles, copyFiltersOpera, modifyManifest, createArtifactBuild, crxPack);
