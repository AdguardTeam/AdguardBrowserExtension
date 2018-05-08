import path from 'path';
import gulp from 'gulp';
import {LOCALES_DIR} from './consts';

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
const copyCommonFiles = (pathDest, exceptLanguages) => 
    gulp.src([paths.lib, paths.pages, ...(exceptLanguages ? [] : [paths.locales])], {base: 'Extension'})
        .pipe(gulp.dest(pathDest));

export default copyCommonFiles;
