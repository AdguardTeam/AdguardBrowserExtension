import gulp from 'gulp';
import qunit from 'node-qunit-phantomjs';

// Rule constructor tests
const testRule = (done) => {
    qunit('Extension/tests/rule-constructor/test-rule-constructor.html');
    return done();
};

// Safari converter tests
const testSafari = (done) => {
    qunit('Extension/tests/safari-converter/test-safari-converter.html');
    return done();
};

// Safebrowsing filter tests
const testSB = (done) => {
    qunit('Extension/tests/sb-filter/test-sb-filter.html');
    return done();
};

// Url filter tests
const testURL = (done) => {
    qunit('Extension/tests/url-filter/test-url-filter.html');
    return done();
};

// Css filter tests
const testCSSfilter = (done) => {
    qunit('Extension/tests/css-filter/test-css-filter.html');
    return done();
};

// Content filter tests
const testContent = (done) => {
    qunit('Extension/tests/content-filter/test-content-filter.html');
    return done();
};

// Css hits tests
const testCSShits = (done) => {
    qunit('Extension/tests/css-filter/test-css-hits.html');
    return done();
};

// Request filter tests
const testReq = (done) => {
    qunit('Extension/tests/request-filter/test-request-filter.html');
    return done();
};

// Element collapser tests
const testEl = (done) => {
    qunit('Extension/tests/miscellaneous/test-element-collapser.html');
    return done();
};

// Ring buffer tests
const testRing = (done) => {
    qunit('Extension/tests/miscellaneous/test-ring-buffer.html');
    return done();
};

export default gulp.series(testSafari, testRule, testSB, testURL, testCSSfilter, testContent, testCSShits, testReq, testEl, testRing);
