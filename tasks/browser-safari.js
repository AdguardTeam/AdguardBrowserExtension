/* global process */
import fs from 'fs';
import path from 'path';
import gulp from 'gulp';
import {BUILD_DIR, SAFARI_EXTENSION_ID, SAFARI_UPDATE_URL} from './consts';
import {version} from './parse-package';
import {updateLocalesMSGName, preprocessAll} from './helpers';
import safariextz from 'safariextz';
import copyCommonFiles from './copy-common';

const paths = {
    entry: path.join('Extension/browser/safari/**/*'),
    filters: path.join('Extension/filters/safari/**/*'),
    webkitFiles: path.join('Extension/browser/webkit/**/*'),
    dest: path.join(BUILD_DIR, process.env.NODE_ENV || '', `safari-${version}.safariextension`),
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
const safari = () => gulp.src([paths.webkitFiles, paths.entry]).pipe(gulp.dest(paths.dest));

// preprocess with params
const preprocess = (done) => preprocessAll(paths.dest, {browser: 'SAFARI', remoteScripts: true}, done);

// change the extension name based on a type of a build (dev, beta or release)
const localesProcess = (done) => updateLocalesMSGName(process.env.NODE_ENV, paths.dest, done);

// update Info.plist file data
const updatePlist = (done) => {
    let plist = fs.readFileSync(dest.plist).toString();
    let updateFromGallery = SAFARI_EXTENSION_ID.indexOf('beta' > 0) ? 'false' : 'true';

    plist = plist.replace(/\$\{version\}/g, version);
    plist = plist.replace(/\$\{extensionId\}/g, SAFARI_EXTENSION_ID);
    plist = plist.replace(/\$\{updateURL\}/g, SAFARI_UPDATE_URL);
    plist = plist.replace(/\$\{updateFromGallery\}/g, updateFromGallery);

    switch (process.env.NODE_ENV) {
        case 'dev':
            plist = plist.replace(/\$\{extensionNamePostfix\}/g, ' (Dev)');
            break;
        case 'beta':
            plist = plist.replace(/\$\{extensionNamePostfix\}/g, ' (Beta)');
            break;
    }

    fs.writeFileSync(dest.plist, plist);
    return done();
};

// create safariextz which required private keys
const ext = (done) => {
    if (process.env.NODE_ENV !== 'beta' && process.env.NODE_ENV !== 'release') {
        return done();
    }

    return safariextz(`safari-${version}.safariextz`, paths.dest, {
        privateKey:   '../../private/safari_certs/key.pem',
        extensionCer: '../../private/safari_certs/cert.pem',
        appleDevCer:  '../../private/safari_certs/AppleWWDRCA.pem',
        appleRootCer: '../../private/safari_certs/AppleIncRootCertificate.pem'
    });
};

export default gulp.series(copyCommon, copyFilters, safari, updatePlist, localesProcess, preprocess, ext);
