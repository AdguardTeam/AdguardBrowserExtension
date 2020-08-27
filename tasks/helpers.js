import path from 'path';
import pp from 'preprocess';

/**
 * Preprocess files. See docs: https://github.com/jsoverson/preprocess#what-does-it-look-like
 *
 * @param dest   src folder. In our task src and destination folder are the same
 * @param data   params to preprocess
 * @param done   stream
 * @return done
 */
export function preprocessAll(dest, data, done) {
    const filesToPreprocess = [
        path.join(dest, 'pages/popup.html'),
        path.join(dest, 'pages/filter-download.html'),
        path.join(dest, 'pages/export.html'),
        path.join(dest, 'pages/log.html'),
        path.join(dest, 'pages/options.html'),
        path.join(dest, 'lib/filter/request-filter.js'),
    ];

    for (const filePath of filesToPreprocess) {
        pp.preprocessFileSync(filePath, filePath, data);
    }

    return done();
}
