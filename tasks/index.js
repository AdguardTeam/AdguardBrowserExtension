import gulp from 'gulp';

import tests from './tests';

// tests
export const runTests = gulp.series(tests, done => done());
