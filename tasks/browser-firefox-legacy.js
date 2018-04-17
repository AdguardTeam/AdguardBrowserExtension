/* global process */
import fs from 'fs';
import gulp from 'gulp';
import {BUILD_DIR, LOCALES_DIR} from './consts';
import {version} from './parse-package';
import zip from 'gulp-zip';

const paths = {
    entry: 'Extension/browser/firefox/**/*',
    filters: 'Extension/filters/firefox/**/*',
    pages: 'Extension/pages/**/*',
    lib: 'Extension/lib/**/*',
    locales: LOCALES_DIR + '**/*',
    dest: `${BUILD_DIR}/${process.env.NODE_ENV}/firefox-legacy-${version}/`
};

const copyLibs = () => gulp.src(paths.lib).pipe(gulp.dest(paths.dest + 'lib/'));
const firefoxLegacy = () => gulp.src(paths.entry).pipe(gulp.dest(paths.dest));
const copyPages = () => gulp.src(paths.pages).pipe(gulp.dest(paths.dest + 'pages/'));
const copyFilters = () => gulp.src(paths.filters).pipe(gulp.dest(paths.dest + 'filters/'));

const propsToString = (messages, prev, key) => `${prev}${key}=${messages[key].message}\n`;

const convertLocales = (done) => {
    const locales = fs.readdirSync(LOCALES_DIR);

    if (!fs.existsSync(paths.dest + 'chrome')) {
        fs.mkdirSync(paths.dest + 'chrome');
    }

    if (!fs.existsSync(paths.dest + 'chrome/locale')) {
        fs.mkdirSync(paths.dest + 'chrome/locale');
    }

    for (let i of locales) {
        let file = LOCALES_DIR + i + '/messages.json';
        let messages = JSON.parse(fs.readFileSync(file));
        let cont = Object.keys(messages).reduce(propsToString.bind(this, messages), '');

        if (!fs.existsSync(paths.dest + 'chrome/locale/' + i)) {
            fs.mkdirSync(paths.dest + 'chrome/locale/' + i);
        }

        fs.writeFileSync(paths.dest + 'chrome/locale/' + i + '/messages.properties', cont);
    }

    return done();
};

const createWebExt = (done) => {
    if (process.env.NODE_ENV !== 'beta' && process.env.NODE_ENV !== 'release') {
        return done();
    }

    return gulp.src(paths.dest + '**/*')
        .pipe(zip(`firefox-legacy-${version}.zip`))
        .pipe(gulp.dest(`${BUILD_DIR}/${process.env.NODE_ENV}/`));
};

export default gulp.series(copyLibs, copyPages, copyFilters, convertLocales, firefoxLegacy, createWebExt);
