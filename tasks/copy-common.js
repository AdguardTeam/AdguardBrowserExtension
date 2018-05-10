import path from 'path';
import gulp from 'gulp';
import replace from 'gulp-replace';
import {LOCALES_DIR} from './consts';
import {getReservedDomains} from './helpers';

const paths = {
    pages: path.join('Extension/pages/**/*'),
    lib: path.join('Extension/lib/**/*'),
    locales: path.join(LOCALES_DIR, '**/*')
};

/**
 * Copy common files into `pathDest` directory.
 * `base` param is for saving copying folders structure
 *
 * @param pathDest   destination folder
 * @param {Boolean} exceptLanguages   do not copy languages if true
 * @return stream
 */
const copyCommonFiles = async (pathDest, exceptLanguages) => 
    gulp.src([paths.lib, paths.pages, ...(exceptLanguages ? [] : [paths.locales])], {base: 'Extension'})
        .pipe(replace(/\%RESERVED_DOMAINS\%/g, await getReservedDomains()))
        .pipe(gulp.dest(pathDest));

export default copyCommonFiles;
