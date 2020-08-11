import gulp from 'gulp';
import chromium from './browser-chromium';
import opera from './browser-opera';
import edge from './browser-edge';
import firefoxWebext from './browser-firefox-webext';
import firefoxAmo from './browser-firefox-amo';
import api from './sample-extension';
import downloadAllFilters from './download-filters';
import updateLocalScriptRules from './update-local-script-rules';
import updateLocales from './update-locales';
import uploadLocales from './upload-locales';
import buildUpdatesFiles from './build-updates-files';
import tests from './tests';
import clean from './clean-build-dir';
import updatePublicSuffixList from './update-public-suffix-list';
import renewLocales from './renew-locales';
import updateBuildInfo from './update-build-info';

// download filters to repository
export const downloadFilters = gulp.series(downloadAllFilters, updateLocalScriptRules, done => done());

// download localizations to repository
export const updateLocalesStream = gulp.series(updateLocales, done => done());

// upload localizations to oneskyapp
export const uploadLocalesStream = gulp.series(uploadLocales, done => done());

// tests
export const runTests = gulp.series(tests, done => done());

// build updates files
export const buildUpdatesFilesStream = gulp.series(buildUpdatesFiles, done => done());

// dev build
export const buildDev = gulp.series(chromium, firefoxAmo, firefoxWebext, edge, api, done => done());

// beta build
export const buildBeta = gulp.series(chromium, firefoxWebext, edge, api, updateBuildInfo, clean, done => done());

// release build
export const buildRelease = gulp.series(chromium, opera, firefoxAmo, edge, updateBuildInfo, clean, done => done());

// sample api build
export const buildSampleApi = gulp.series(api, done => done());

// download resources
export const downloadResources = gulp.series(downloadFilters, updatePublicSuffixList, done => done());

// renew locales
export const rebuildLocales = gulp.series(renewLocales);
