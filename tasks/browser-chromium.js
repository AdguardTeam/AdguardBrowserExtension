/* global process */
import fs from 'fs';
import gulp from 'gulp';
import {BUILD_DIR, LOCALES_DIR} from './consts';
import {version} from './parse-package';
import {updateLocalesMSGName, preprocessAll} from './helpers';
import zip from 'gulp-zip';
import crx from 'gulp-crx-pack';

const paths = {
    entry: 'Extension/browser/chrome/**/*',
    filters: 'Extension/filters2/chromium/**/*',
    webkitFiles: 'Extension/browser/webkit/**/*',
    pages: 'Extension/pages/**/*',
    lib: 'Extension/lib/**/*',
    locales: LOCALES_DIR + '**/*',
    cert: 'private/certificate.pem',
    dest: `${BUILD_DIR}/${process.env.NODE_ENV}/chrome-${version}/`
};

const copyLibs = () => gulp.src(paths.lib).pipe(gulp.dest(paths.dest + 'lib/'));
const copyPages = () => gulp.src(paths.pages).pipe(gulp.dest(paths.dest + 'pages/'));
const copyFilters = () => gulp.src(paths.filters).pipe(gulp.dest(paths.dest + 'filters/'));
const copyLocales = () => gulp.src(paths.locales).pipe(gulp.dest(paths.dest + '_locales/'));
const chromiumMainFiles = () => gulp.src([paths.entry, paths.webkitFiles]).pipe(gulp.dest(paths.dest));

const preprocess = (done) => preprocessAll(paths.dest, {browser: 'CHROMIUM', remoteScripts: true}, done);
const localesProcess = (done) => updateLocalesMSGName(process.env.NODE_ENV, paths.dest, done);

const updateManifest = (done) => {
    const manifest = JSON.parse(fs.readFileSync(paths.dest + 'manifest.json'));
    manifest.version = version;
    fs.writeFileSync(paths.dest + 'manifest.json', JSON.stringify(manifest, null, 4));
    return done();
};

const createArchive = (done) => {
    if (process.env.NODE_ENV !== 'beta' && process.env.NODE_ENV !== 'release') {
        return done();
    }

    return gulp.src(paths.dest + '**/*')
        .pipe(zip(`chrome-${version}.zip`))
        .pipe(gulp.dest(`${BUILD_DIR}/${process.env.NODE_ENV}/`));
};

const operaBuild = (done) => {
    if (process.env.NODE_ENV !== 'release') {
        return done();
    }

    return gulp.src(paths.dest + '**/*')
        .pipe(zip(`opera-${version}.zip`))
        .pipe(gulp.dest(`${BUILD_DIR}/${process.env.NODE_ENV}/`));
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
        .pipe(gulp.dest(`${BUILD_DIR}/${process.env.NODE_ENV}/`));
};

export default gulp.series(copyLibs, copyPages, copyFilters, copyLocales, chromiumMainFiles, updateManifest, localesProcess, preprocess, createArchive, operaBuild, crxPack);
