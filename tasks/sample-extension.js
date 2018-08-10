/**
 * Build sample-extension with the AdGuard API, which can be included to another extension.
 * 1. Copying assistant scripts
 * 2. Copying sample-extension directory
 * 3. Concat scripts from `document_start` and `document_end` params getting from manifest.json
 * 4. Concat all scripts from `API_SCRIPTS` files and save in 'adguard-api.js'
 * 5. Copying filters files
 * 6. Updating version of an extension in manifest
 * 7. Creating zip archive of an extension
 */

/* global process */

import fs from 'fs';
import path from 'path';
import gulp from 'gulp';
import {BUILD_DIR, LOCALES_DIR, BRANCH_BETA} from './consts';
import {version} from './parse-package';
import concatFiles from 'gulp-concat';
import zip from 'gulp-zip';

const API_SCRIPTS = [
    // Third party libraries
    'Extension/lib/libs/deferred.min.js',
    'Extension/lib/utils/sha256.patched.js',
    'Extension/lib/utils/punycode.js',
    'Extension/lib/libs/filter-downloader.js',
    // Adguard Global and preferences
    'Extension/lib/adguard.js',
    'Extension/browser/webkit/lib/prefs.js',
    // Utils libraries
    'Extension/lib/utils/common.js',
    'Extension/lib/utils/log.js',
    'Extension/lib/utils/public-suffixes.js',
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

// set current type of build
const BRANCH = process.env.NODE_ENV || '';

const paths = {
    sample: path.join('Extension/api/sample-extension/**/*'),
    assistant: path.join('Extension/lib/content-script/assistant/js/assistant.js'),
    locales: path.join(LOCALES_DIR + '**/*'),
    sourceManifest: path.join('Extension/api/chrome/manifest.json'),
    contentScriptsStartFile: path.join('adguard/adguard-content.js'),
    filters: [
        path.join('Extension/filters/chromium/filters_i18n.json'),
        path.join('Extension/filters/chromium/filters.json')
    ],
    dest: path.join(BUILD_DIR, BRANCH, `adguard-api-${version}`)
};

const dest = {
    adguard: path.join(paths.dest, 'adguard'),
    assistant: path.join(paths.dest, 'adguard', 'assistant'),
    inner: path.join(paths.dest, '**/*'),
    buildDir: path.join(BUILD_DIR, BRANCH),
    manifest: path.join(paths.dest, 'manifest.json')
};

// copy sample files
const sampleApi = () => gulp.src(paths.sample).pipe(gulp.dest(paths.dest));

// copy assistant files
const copyAssistant = () => gulp.src(paths.assistant).pipe(gulp.dest(dest.assistant));

//  copy filters
const copyFilters = () => gulp.src(paths.filters).pipe(gulp.dest(dest.adguard));

const concatStartFiles = () => concat('document_start', 'adguard-content.js');
const concatEndFiles = () => concat('document_end', 'adguard-assistant.js');

const apiConcat = () => gulp.src(API_SCRIPTS).pipe(concatFiles('adguard-api.js')).pipe(gulp.dest(dest.adguard));

/**
 * Concat scripts from `document_start` and `document_end` params getting from manifest.json
 * Scripts from 'document_start' param concatenates in adguard-content.js script.
 * Scripts from 'document_end' param concatenates in adguard-assistant.js script.
 *
 * @param runAt   'document_start' or 'document_start' param
 * @param srcFileName   name of concatenate file to save
 * @return stream
 */
const concat = (runAt, srcFileName) => {
    const manifest = JSON.parse(fs.readFileSync(paths.sourceManifest));
    let files = [];
    for (const i of manifest.content_scripts) {
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
        .pipe(gulp.dest(dest.adguard));
};

const updateManifest = (done) => {
    const manifest = JSON.parse(fs.readFileSync(dest.manifest));
    manifest.version = version;
    fs.writeFileSync(dest.manifest, JSON.stringify(manifest, null, 4));
    return done();
};

const createArchive = (done) => {
    if (BRANCH !== BRANCH_BETA) {
        return done();
    }

    return gulp.src(dest.inner)
        .pipe(zip(`adguard-api-${BRANCH}-${version}.zip`))
        .pipe(gulp.dest(dest.buildDir));
};

export default gulp.series(copyAssistant, sampleApi, concatStartFiles, concatEndFiles, apiConcat, copyFilters, updateManifest, createArchive);
