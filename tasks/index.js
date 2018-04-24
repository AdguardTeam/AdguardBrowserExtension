import gulp from 'gulp';
import chromium from './browser-chromium';
import opera from './browser-opera';
import edge from './browser-edge';
import firefoxWebext from './browser-firefox-webext ';
import firefoxAmo from './browser-firefox-amo';
import firefoxLegacy from './browser-firefox-legacy';
import safari from './browser-safari';
import api from './sample-extension';
import downloadAllFilters from './download-filters';
import updateLocalScriptRules from './update-local-script-rules';
import downloadLocales from './download-locales';
import uploadLocales from './upload-locales';
import buildUpdatesFiles from './build-updates-files';
import tests from './tests';
import clean from './clean-build-dir';

// download filters to repository
export const downloadFilters = gulp.series(downloadAllFilters, updateLocalScriptRules, (done) => done());

// download localizations to repository
export const downloadLocalesStream = gulp.series(downloadLocales, (done) => done());

// upload localizations to oneskyapp
export const uploadLocalesStream = gulp.series(uploadLocales, (done) => done());

// tests
export const runTests = gulp.series(tests, (done) => done());

// build updates files
export const buildUpdatesFilesStream = gulp.series(buildUpdatesFiles, (done) => done());

// dev build
export const buildDev = gulp.series(chromium, firefoxAmo, firefoxWebext, firefoxLegacy, safari, edge, api, (done) => done());

// beta build
export const buildBeta = gulp.series(chromium, firefoxWebext, firefoxLegacy, safari, edge, api, clean, (done) => done());

// release build
export const buildRelease = gulp.series(downloadFilters, chromium, opera, firefoxAmo, safari, edge, (done) => done());
