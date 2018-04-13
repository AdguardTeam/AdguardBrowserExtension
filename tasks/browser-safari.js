/* global process */
import fs from 'fs';
import gulp from 'gulp';
import {BUILD_DIR, LOCALES_DIR, SAFARI_EXTENSION_ID, SAFARI_UPDATE_URL} from './consts';
import {version} from './parse-package';
import {updateLocalesMSGName, preprocessAll} from './helpers';
import safariextz from 'safariextz';

const paths = {
    entry: 'Extension/browser/safari/**/*',
    filters: 'Extension/filters/safari/**/*',
    pages: 'Extension/pages/**/*',
    lib: 'Extension/lib/**/*',
    webkitFiles: 'Extension/browser/webkit/**/*',
    locales: LOCALES_DIR + '**/*',
    dest: `${BUILD_DIR}/${process.env.NODE_ENV}/safari-${version}.safariextension/`,
};

const copyLibs = () => gulp.src(paths.lib).pipe(gulp.dest(paths.dest + 'lib/'));
const copyPages = () => gulp.src(paths.pages).pipe(gulp.dest(paths.dest + 'pages/'));
const copyFilters = () => gulp.src(paths.filters).pipe(gulp.dest(paths.dest + 'filters/'));
const copyLocales = () => gulp.src(paths.locales).pipe(gulp.dest(paths.dest + '_locales/'));
const safari = () => gulp.src([paths.webkitFiles, paths.entry]).pipe(gulp.dest(paths.dest));

const preprocess = (done) => preprocessAll(paths.dest, {browser: 'SAFARI', remoteScripts: true}, done);
const localesProcess = (done) => updateLocalesMSGName(process.env.NODE_ENV, paths.dest, done);

const updatePlist = (done) => {
    let plist = fs.readFileSync(paths.dest + 'Info.plist').toString();
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

    fs.writeFileSync(paths.dest + 'Info.plist', plist);
    return done();
};

const ext = (done) => {
    if (process.env.NODE_ENV !== 'beta' && process.env.NODE_ENV !== 'release') {
        return done();
    }

    return safariextz(`safari-${version}.safariextz`, `${BUILD_DIR}/${process.env.NODE_ENV}/safari-${version}.safariextension/`, {
        privateKey:   '../../private/safari_certs/key.pem',
        extensionCer: '../../private/safari_certs/cert.pem',
        appleDevCer:  '../../private/safari_certs/AppleWWDRCA.pem',
        appleRootCer: '../../private/safari_certs/AppleIncRootCertificate.pem'
    });
};

export default gulp.series(copyLibs, copyPages, copyFilters, copyLocales, safari, updatePlist, localesProcess, preprocess, ext);
