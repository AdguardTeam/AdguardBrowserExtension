/**
 * Firefox webextension build
 * 1. Copying common scripts and htmls (pages, lib, locales)
 * 2. Copying Firefox filters
 * 3. Copying Webkit, Chrome and Firefox_webext scripts
 * 4. Updating version of an extension in manifest and changing update_url if its a beta build
 * 5. Change the extension name in localization files based on a type of a build (dev, beta or release)
 * 6. Preprocessing files
 * 7. Creating firefox web-extension pack
 */

import fs from 'fs';
import path from 'path';
import gulp from 'gulp';
import zip from 'gulp-zip';
import rename from 'gulp-rename';
import webExt from 'web-ext';
import {
    BUILD_DIR,
    FIREFOX_WEBEXT_UPDATE_URL,
    FIREFOX_WEBEXT,
    BRANCH_BETA,
    BRANCH_RELEASE,
    BRANCH_DEV,
    FIREFOX_EXTENSION_ID_DEV,
    FIREFOX_EXTENSION_ID_BETA,
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
    pages: path.join('Extension/pages/**/*'),
    lib: path.join('Extension/lib/**/*'),
    chromeFiles: path.join('Extension/browser/chrome/**/*'),
    webkitFiles: path.join('Extension/browser/webkit/**/*'),
    dest: path.join(BUILD_DIR, BRANCH, `firefox-standalone-${version}`),
};

const dest = {
    filters: path.join(paths.dest, 'filters'),
    inner: path.join(paths.dest, '**/*'),
    buildDir: path.join(BUILD_DIR, BRANCH),
    manifest: path.join(paths.dest, 'manifest.json'),
    assistant: path.join(paths.dest, 'lib', 'content-script', 'assistant', 'js'),
};

// copy common files
const copyCommon = () => copyCommonFiles(paths.dest);

// copy firefox filters
const copyFilters = () => gulp.src(paths.filters).pipe(gulp.dest(dest.filters));

// copy chromium, webkit and firefox files
const firefoxWebext = () => gulp.src([paths.webkitFiles, paths.chromeFiles, paths.firefox_webext])
    .pipe(gulp.dest(paths.dest));

// preprocess with params
const preprocess = done => preprocessAll(paths.dest, { browser: FIREFOX_WEBEXT, remoteScripts: true }, done);

// change the extension name based on a type of a build (dev, beta or release)
const localesProcess = done => updateLocalesMSGName(BRANCH, paths.dest, done, FIREFOX_WEBEXT, true);

const updateManifest = (done) => {
    const manifest = JSON.parse(fs.readFileSync(dest.manifest));
    manifest.version = version;

    let extensionID = '';

    switch (process.env.NODE_ENV) {
        case BRANCH_BETA:
            extensionID = FIREFOX_EXTENSION_ID_BETA;
            break;
        case BRANCH_DEV:
            extensionID = FIREFOX_EXTENSION_ID_DEV;
            break;
        default:
            throw new Error(`This task used only in dev and beta builds and received: ${process.env.NODE_ENV}`);
    }

    manifest.applications.gecko.id = extensionID;

    if (BRANCH === BRANCH_BETA) {
        manifest.applications.gecko.update_url = FIREFOX_WEBEXT_UPDATE_URL;
    }
    fs.writeFileSync(dest.manifest, JSON.stringify(manifest, null, 4));
    return done();
};

const createUpdateJson = async (done) => {
    if (BRANCH !== BRANCH_BETA && BRANCH !== BRANCH_RELEASE) {
        return done();
    }
    const templatePath = path.resolve(__dirname, './resources/firefox_updates.json');
    let updateJsonTemplate = (await fs.promises.readFile(templatePath)).toString();
    updateJsonTemplate = updateJsonTemplate.replace(/\%VERSION\%/g, version);
    await fs.promises.writeFile(path.join(BUILD_DIR, 'update.json'), updateJsonTemplate);
    return done;
};

// IMPORTANT!!!
// Signing artifacts for Mozilla publishes build to the store simultaneously
// We sign only beta build, because we do not publish it the AMO store
const createArtifact = async (done) => {
    if (BRANCH !== BRANCH_BETA) {
        return done();
    }
    // eslint-disable-next-line global-require
    const credentialsPath = path.resolve(__dirname, '../private/AdguardBrowserExtension/mozilla_credentials.json');
    const { apiKey, apiSecret } = JSON.parse(await fs.promises.readFile(credentialsPath));
    const { downloadedFiles } = await webExt.cmd.sign({
        apiKey,
        apiSecret,
        sourceDir: paths.dest,
        artifactsDir: BUILD_DIR,
        timeout: 5 * 60 * 1000, // 5 minutes
    }, {
        shouldExitProgram: false,
    });

    if (downloadedFiles) {
        const [downloadedXpi] = downloadedFiles;
        // Rename
        const basePath = path.dirname(downloadedXpi);
        const xpiPath = path.join(basePath, 'firefox.xpi');
        await fs.promises.rename(downloadedXpi, xpiPath);
    }
    return done;
};

const createArchive = (done) => {
    if (BRANCH !== BRANCH_BETA && BRANCH !== BRANCH_RELEASE) {
        return done();
    }

    return gulp.src(dest.inner)
        .pipe(zip(`firefox-standalone-${BRANCH}-${version}-unsigned.zip`))
        .pipe(gulp.dest(dest.buildDir))
        // copy artifact in the build dir
        .pipe(rename('firefox.zip'))
        .pipe(gulp.dest(BUILD_DIR));
};

export default gulp.series(
    () => copyExternal(dest.assistant),
    copyCommon,
    copyFilters,
    firefoxWebext,
    updateManifest,
    localesProcess,
    preprocess,
    createArtifact,
    createArchive,
    createUpdateJson
);
