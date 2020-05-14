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

import fs from 'fs';
import path from 'path';
import gulp from 'gulp';
import zip from 'gulp-zip';
import Crx from 'crx';
import rename from 'gulp-rename';
import {
    BUILD_DIR,
    BRANCH_BETA,
    BRANCH_RELEASE,
    BRANCH_DEV,
    PRIVATE_FILES,
    CHROME_UPDATE_URL,
    CHROME_CODEBASE_URL,
} from './consts';
import { version } from './parse-package';
import { updateLocalesMSGName, preprocessAll } from './helpers';
import copyCommonFiles from './copy-common';
import copyExternal from './copy-external';

// set current type of build
const BRANCH = process.env.NODE_ENV || '';

const paths = {
    chrome: path.join('Extension/browser/chrome/**/*'),
    filters: path.join('Extension/filters/chromium/**/*'),
    webkitFiles: path.join('Extension/browser/webkit/**/*'),
    cert: path.join(PRIVATE_FILES, 'certificate.pem'),
    dest: path.join(BUILD_DIR, BRANCH, 'chrome'),
};

const dest = {
    filters: path.join(paths.dest, 'filters'),
    inner: path.join(paths.dest, '**/*'),
    buildDir: path.join(BUILD_DIR, BRANCH),
    manifest: path.join(paths.dest, 'manifest.json'),
};

// copy common files
const copyCommon = () => copyCommonFiles(paths.dest);

// copy chromium filters
const copyFilters = () => gulp.src(paths.filters)
    .pipe(gulp.dest(dest.filters));

// copy chromium and webkit files
const chromiumMainFiles = () => gulp.src([paths.webkitFiles, paths.chrome])
    .pipe(gulp.dest(paths.dest));

// preprocess with params
const preprocess = done => preprocessAll(paths.dest, {
    browser: 'CHROMIUM',
    remoteScripts: true,
}, done);

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
        .pipe(zip(`chrome-${BRANCH}.zip`))
        .pipe(gulp.dest(dest.buildDir))
        // chrome.zip artifact
        .pipe(rename('chrome.zip'))
        .pipe(gulp.dest(BUILD_DIR))
        // edge.zip artifact
        .pipe(rename('edge.zip'))
        .pipe(gulp.dest(BUILD_DIR));
};

const crxPack = async (done) => {
    if (BRANCH === BRANCH_DEV || BRANCH === BRANCH_RELEASE) {
        return done();
    }

    const manifest = JSON.parse(await fs.promises.readFile(dest.manifest));
    manifest.update_url = CHROME_UPDATE_URL;
    await fs.promises.writeFile(dest.manifest, JSON.stringify(manifest, null, 4));

    const privateKey = await fs.promises.readFile(paths.cert, 'utf-8');

    const crx = new Crx({
        codebase: CHROME_CODEBASE_URL,
        privateKey,
    });

    await crx.load(paths.dest);
    const crxBuffer = await crx.pack();
    const updateXml = await crx.generateUpdateXML();

    const crxBuildFilename = `chrome-standalone-${BRANCH}.crx`;
    const crxBuildPath = path.join(dest.buildDir, crxBuildFilename);
    const updateXmlPath = path.join(dest.buildDir, 'update.xml');
    await fs.promises.writeFile(crxBuildPath, crxBuffer);
    await fs.promises.writeFile(updateXmlPath, updateXml);

    return gulp.src(crxBuildPath)
        .pipe(rename('chrome.crx'))
        .pipe(gulp.src(updateXmlPath))
        .pipe(gulp.dest(BUILD_DIR));
};

export default gulp.series(
    copyExternal,
    copyCommon,
    copyFilters,
    chromiumMainFiles,
    updateManifest,
    localesProcess,
    preprocess,
    createArchive,
    crxPack
);
