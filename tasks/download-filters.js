import gulp from 'gulp';
import download from 'gulp-download2';
import {METADATA_DOWNLOAD_URL_FORMAT, FILTERS_DEST, METADATA_I18N_DOWNLOAD_URL_FORMAT, LAST_ADGUARD_FILTER_ID, FILTER_DOWNLOAD_URL_FORMAT, OPTIMIZED_FILTER_DOWNLOAD_URL_FORMAT} from './consts';

const startDownload = (browser) => {
    return download(files(browser))
        .pipe(gulp.dest(FILTERS_DEST.replace('%b', browser)));
};

const files = (browser) => {
    const filters = [];
    const filtersMobile = [];
    const meta = [];

    meta.push(METADATA_DOWNLOAD_URL_FORMAT.replace('%b', browser));
    meta.push(METADATA_I18N_DOWNLOAD_URL_FORMAT.replace('%b', browser));

    for (let i = 1; i <= LAST_ADGUARD_FILTER_ID; i++) {
        filters.push({
            url: FILTER_DOWNLOAD_URL_FORMAT.replace('%b', browser).replace('%f', i),
            file: `filter_${i}.txt`
        });

        filtersMobile.push({
            url: OPTIMIZED_FILTER_DOWNLOAD_URL_FORMAT.replace('%b', browser).replace('%s', i),
            file: `filter_mobile_${i}.txt`
        });
    }

    return [
        ...meta,
        ...filters,
        ...filtersMobile
    ];
};

const chromium = () => startDownload('chromium');
const edge = () => startDownload('edge');
const firefox = () => startDownload('firefox');
const safari = () => startDownload('safari');
const operaBrowser = () => startDownload('opera');

export default gulp.series(chromium, edge, firefox, safari, operaBrowser);
