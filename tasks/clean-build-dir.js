/**
 * Clean unused folders in Build/beta path
 */

import path from 'path';
import del from 'del';
import { BUILD_DIR } from './consts';
import { version } from './parse-package';

const BRANCH = process.env.NODE_ENV || '';

const paths = [
    path.join(BUILD_DIR, BRANCH, `chrome-${version}`),
    path.join(BUILD_DIR, BRANCH, `opera-${version}`),
    path.join(BUILD_DIR, BRANCH, `firefox-standalone-${version}`),
    path.join(BUILD_DIR, BRANCH, `firefox-amo-${BRANCH}-${version}-unsigned`),
    path.join(BUILD_DIR, BRANCH, `edge-${version}`),
    path.join(BUILD_DIR, BRANCH, `adguard-api-${version}`),
];

const clean = () => del(paths);

export default clean;
