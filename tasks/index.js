import gulp from 'gulp';
import chromium from './browser-chromium';
import edge from './browser-edge';
import firefoxWebext from './browser-firefox-standalone';
import firefoxAmo from './browser-firefox-amo';
import firefoxLegacy from './browser-firefox-legacy';
import safari from './browser-safari';
import api from './sample-extension';
import downloadAllFilters from './download-filters';
import updateLocalScriptRules from './update-local-script-rules';
import downloadLocales from './download-locales';
import tests from './tests';

export const build = gulp.series(chromium, edge, firefoxWebext, firefoxAmo, firefoxLegacy, safari, api, (done) => done());

export const downloadFilters = gulp.series(downloadAllFilters, updateLocalScriptRules, (done) => done());

export const downloadLocalesStream = gulp.series(downloadLocales, (done) => done());

export const runTests = gulp.series(tests, (done) => done());

export default build;
