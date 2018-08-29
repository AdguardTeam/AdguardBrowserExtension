/**
 * Safari build
 * 1. Copying common scripts and htmls (pages, lib, locales)
 * 2. Copying Safari filters
 * 3. Copying Webkit and Safari scripts
 * 4. Updating version, extensionId, updateURL and other data in Info.plist file
 * 5. Change the extension name in localization files based on a type of a build (dev, beta or release)
 * 6. Preprocessing files
 * 7. Creating safariextz pack using
 */

/* global process, __dirname */
import fs from 'fs';
import path from 'path';
import gulp from 'gulp';
import {BUILD_DIR, SAFARI_UPDATE_URL, BRANCH_BETA, BRANCH_DEV, BRANCH_RELEASE, SAFARI_EXTENSION_ID_DEV, SAFARI_EXTENSION_ID_BETA, SAFARI_EXTENSION_ID_RELEASE, SAFARI_CERTS_PRIVATE_FILES} from './consts';
import {version} from './parse-package';
import {updateLocalesMSGName, preprocessAll} from './helpers';
import safariextz from 'safariextz';
import copyCommonFiles from './copy-common';

// set current type of build
const BRANCH = process.env.NODE_ENV || '';

const paths = {
    safari: path.join('Extension/browser/safari/**/*'),
    filters: path.join('Extension/filters/safari/**/*'),
    webkitFiles: path.join('Extension/browser/webkit/**/*'),
    dest: path.join(BUILD_DIR, BRANCH, `safari-${version}.safariextension`),
};

const dest = {
    filters: path.join(paths.dest, 'filters'),
    plist: path.join(paths.dest, 'Info.plist')
};

// copy common files
const copyCommon = () => copyCommonFiles(paths.dest);

// copy safari filters
const copyFilters = () => gulp.src(paths.filters).pipe(gulp.dest(dest.filters));

// copy webkit and safari files
const safari = () => gulp.src([paths.webkitFiles, paths.safari]).pipe(gulp.dest(paths.dest));

// preprocess with params
const preprocess = (done) => preprocessAll(paths.dest, {browser: 'SAFARI', remoteScripts: true}, done);

// change the extension name based on a type of a build (dev, beta or release)
const localesProcess = (done) => updateLocalesMSGName(BRANCH, paths.dest, done);

// update Info.plist file data
const updatePlist = (done) => {
    let plist = fs.readFileSync(dest.plist).toString();

    let extensionID = '';
    let updateUrl = '';
    let updateFromGallery = 'true';

    switch (BRANCH) {
        case BRANCH_BETA:
            extensionID = SAFARI_EXTENSION_ID_BETA;
            updateUrl = SAFARI_UPDATE_URL;
            updateFromGallery = 'false';
            break;
        case BRANCH_DEV:
            extensionID = SAFARI_EXTENSION_ID_DEV;
            break;
        default:
            extensionID = SAFARI_EXTENSION_ID_RELEASE;
    }

    plist = plist.replace(/\$\{version\}/g, version);
    plist = plist.replace(/\$\{extensionId\}/g, extensionID);
    plist = plist.replace(/\$\{updateURL\}/g, updateUrl);
    plist = plist.replace(/\$\{updateFromGallery\}/g, updateFromGallery);

    switch (BRANCH) {
        case BRANCH_DEV:
            plist = plist.replace(/\$\{extensionNamePostfix\}/g, ' (Dev)');
            break;
        case BRANCH_BETA:
            plist = plist.replace(/\$\{extensionNamePostfix\}/g, ' (Beta)');
            break;
        default:
            plist = plist.replace(/\$\{extensionNamePostfix\}/g, '');
    }

    fs.writeFileSync(dest.plist, plist);
    return done();
};

// create safariextz which required private keys
const ext = (done) => {
    if (BRANCH !== BRANCH_BETA && BRANCH !== BRANCH_RELEASE) {
        return done();
    }

    return safariextz(`safari-${BRANCH}-${version}.safariextz`, paths.dest, {
        privateKey:   path.resolve(SAFARI_CERTS_PRIVATE_FILES, 'key.pem'),
        extensionCer: path.resolve(SAFARI_CERTS_PRIVATE_FILES, 'cert.pem'),
        appleDevCer:  path.resolve(SAFARI_CERTS_PRIVATE_FILES, 'AppleWWDRCA.pem'),
        appleRootCer: path.resolve(SAFARI_CERTS_PRIVATE_FILES, 'AppleIncRootCertificate.pem')
    });
};

export default gulp.series(copyCommon, copyFilters, safari, updatePlist, localesProcess, preprocess, ext);
