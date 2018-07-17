import gulp from 'gulp';
import qunit from 'node-qunit-phantomjs';

// qunit error handler: to fail gulp execution on tests failure
const errorHandler = (done) => (code) => {
    if(code === 1) {
        throw new Error('Unit Tests Failure');
    }
    return done();
};

const runQunit = (path, done) => {
    return qunit(path, null, errorHandler(done));
};

// Rule constructor tests
const testRule = (done) => {
    runQunit('Extension/tests/rule-constructor/test-rule-constructor.html', done);
};

// Safebrowsing filter tests
const testSB = (done) => {
    runQunit('Extension/tests/sb-filter/test-sb-filter.html', done);
};

// Url filter tests
const testURL = (done) => {
    runQunit('Extension/tests/url-filter/test-url-filter.html', done);
};

// Css filter tests
const testCSSfilter = (done) => {
    runQunit('Extension/tests/css-filter/test-css-filter.html', done);
};

// Content filter tests
const testContent = (done) => {
    runQunit('Extension/tests/content-filter/test-content-filter.html', done);
};

// Css hits tests
const testCSShits = (done) => {
    runQunit('Extension/tests/css-filter/test-css-hits.html', done);
};

// Request filter tests
const testReq = (done) => {
    runQunit('Extension/tests/request-filter/test-request-filter.html', done);
};

// Element collapser tests
const testEl = (done) => {
    runQunit('Extension/tests/miscellaneous/test-element-collapser.html', done);
};

// Ring buffer tests
const testRing = (done) => {
    runQunit('Extension/tests/miscellaneous/test-ring-buffer.html', done);
};

// Encoding tests
const testEncoding = (done) => {
    runQunit('Extension/tests/miscellaneous/test-encoding.html', done);
};

export default gulp.parallel(testRule, testSB, testURL, testCSSfilter, testContent, testCSShits, testReq, testEl, testRing, testEncoding);
