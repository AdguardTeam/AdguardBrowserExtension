/* global process */
import fs from 'fs';
import gulp from 'gulp';
import {BUILD_DIR, LOCALES_DIR} from './consts';
import {version} from './parse-package';
import {updateLocalesMSGName, preprocessAll} from './helpers';
import zip from 'gulp-zip';

const paths = {
    entry: 'Extension/browser/edge/**/*',
    filters: 'Extension/filters/edge/**/*',
    pages: 'Extension/pages/**/*',
    lib: 'Extension/lib/**/*',
    chromeFiles: 'Extension/browser/chrome/**/*',
    webkitFiles: 'Extension/browser/webkit/**/*',
    locales: LOCALES_DIR + '**/*',
    dest: `${BUILD_DIR}/${process.env.NODE_ENV}/edge-${version}/`
};

const copyLibs = () => gulp.src(paths.lib).pipe(gulp.dest(paths.dest + 'lib/'));
const copyPages = () => gulp.src(paths.pages).pipe(gulp.dest(paths.dest + 'pages/'));
const copyFilters = () => gulp.src(paths.filters).pipe(gulp.dest(paths.dest + 'filters/'));
const copyLocales = () => gulp.src(paths.locales).pipe(gulp.dest(paths.dest + '_locales/'));
const edge = () => gulp.src([paths.webkitFiles, paths.chromeFiles,paths.entry]).pipe(gulp.dest(paths.dest));

const preprocess = (done) => preprocessAll(paths.dest, {browser: 'EDGE', remoteScripts: true}, done);
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
        .pipe(zip(`edge-${version}.zip`))
        .pipe(gulp.dest(`${BUILD_DIR}/${process.env.NODE_ENV}/`));
};

export default gulp.series(copyLibs, copyPages, copyFilters, copyLocales, edge, updateManifest, localesProcess, preprocess, createArchive);
