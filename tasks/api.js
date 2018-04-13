/* global process */
import fs from 'fs';
import gulp from 'gulp';
import {BUILD_DIR, LOCALES_DIR, API_SCRIPTS} from './consts';
import {version} from './parse-package';
import concatFiles from 'gulp-concat';
import zip from 'gulp-zip';

const paths = {
    entry: 'Extension/api/sample-extension/**/*',
    assistant: 'Extension/lib/content-script/assistant/js/assistant.js',
    locales: LOCALES_DIR + '**/*',
    sourceManifest: 'Extension/api/chrome/manifest.json',
    contentScriptsStartFile: 'adguard/adguard-content.js',
    filters: ['Extension/filters/chromium/filters_i18n.json', 'Extension/filters/chromium/filters.json'],
    dest: `${BUILD_DIR}/${process.env.NODE_ENV}/adguard-api-${version}/`
};

const sampleApi = () => gulp.src(paths.entry).pipe(gulp.dest(paths.dest));

const copyAssistant = () => gulp.src(paths.assistant).pipe(gulp.dest(paths.dest + 'adguard/assistant/'));

const copyFilters = () => gulp.src(paths.filters).pipe(gulp.dest(paths.dest + 'adguard/'));

const concatStartFiles = () => concat('document_start', 'adguard-content.js');

const concatEndFiles = () => concat('document_end', 'adguard-assistant.js');

const apiConcat = () => gulp.src(API_SCRIPTS).pipe(concatFiles('adguard-api.js')).pipe(gulp.dest(paths.dest + 'adguard/'));

const concat = (runAt, srcFileName) => {
    const manifest = JSON.parse(fs.readFileSync(paths.sourceManifest));
    let files = [];
    for (let i of manifest.content_scripts) {
        if (i.run_at === runAt) {
            files = i.js;
        }
    }

    files = files.map(file => {
        if(file.indexOf('common-script.js') > 0 || file.indexOf('content-script.js') > 0) {
            return 'Extension/browser/chrome/' + file;
        } else {
            return 'Extension/' + file;
        }
    });

    return gulp.src(files)
        .pipe(concatFiles(srcFileName))
        .pipe(gulp.dest(paths.dest + 'adguard/'));
};

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

export default gulp.series(copyAssistant, sampleApi, concatStartFiles, concatEndFiles, apiConcat, copyFilters, updateManifest, createArchive);
