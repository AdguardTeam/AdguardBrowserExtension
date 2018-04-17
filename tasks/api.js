/* global process */
import fs from 'fs';
import gulp from 'gulp';
import {BUILD_DIR, LOCALES_DIR} from './consts';
import {version} from './parse-package';
import concatFiles from 'gulp-concat';
import zip from 'gulp-zip';

const API_SCRIPTS = [
    // Third party libraries
    'Extension/lib/libs/deferred.min.js',
    'Extension/lib/utils/sha256.patched.js',
    'Extension/lib/utils/punycode.js',
    // Adguard Global and preferences
    'Extension/lib/adguard.js',
    'Extension/browser/webkit/lib/prefs.js',
    // Utils libraries
    'Extension/lib/utils/common.js',
    'Extension/lib/utils/log.js',
    'Extension/lib/utils/url.js',
    'Extension/lib/utils/notifier.js',
    'Extension/lib/utils/browser-utils.js',
    'Extension/lib/utils/service-client.js',
    'Extension/lib/utils/page-stats.js',
    'Extension/lib/utils/user-settings.js',
    'Extension/lib/utils/frames.js',
    // Local storage and rules storage libraries
    'Extension/browser/chrome/lib/utils/local-storage.js',
    'Extension/browser/chrome/lib/utils/rules-storage.js',
    'Extension/lib/storage.js',
    // Chromium api adapter libraries
    'Extension/browser/chrome/lib/content-script/common-script.js',
    'Extension/browser/chrome/lib/api/background-page.js',
    // Tabs api library
    'Extension/browser/chrome/lib/api/tabs.js',
    'Extension/lib/tabs/tabs-api.js',
    // Rules and filters libraries
    'Extension/lib/filter/rules/rules.js',
    'Extension/lib/filter/rules/shortcuts-lookup-table.js',
    'Extension/lib/filter/rules/domains-lookup-table.js',
    'Extension/lib/filter/rules/url-filter-lookup-table.js',
    'Extension/lib/filter/rules/simple-regex.js',
    'Extension/lib/filter/rules/base-filter-rule.js',
    'Extension/lib/filter/rules/css-filter-rule.js',
    'Extension/lib/filter/rules/css-filter.js',
    'Extension/lib/filter/rules/script-filter-rule.js',
    'Extension/lib/filter/rules/script-filter.js',
    'Extension/lib/filter/rules/url-filter-rule.js',
    'Extension/lib/filter/rules/url-filter.js',
    'Extension/lib/filter/rules/content-filter-rule.js',
    'Extension/lib/filter/rules/content-filter.js',
    'Extension/lib/filter/rules/csp-filter.js',
    'Extension/lib/filter/rules/filter-rule-builder.js',
    // Filters metadata and filtration modules
    'Extension/lib/filter/subscription.js',
    'Extension/lib/filter/update-service.js',
    'Extension/lib/filter/whitelist.js',
    'Extension/lib/filter/userrules.js',
    'Extension/lib/filter/filters.js',
    'Extension/lib/filter/antibanner.js',
    'Extension/lib/filter/request-blocking.js',
    // Content messaging
    'Extension/lib/content-message-handler.js',
    'Extension/lib/webrequest.js',
    'Extension/lib/blockpopup.js',
    'Extension/api/chrome/lib/api.js'
];

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
