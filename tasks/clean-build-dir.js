/**
 * Clean unused folders in Build/beta path
 */

import path from 'path';
import del from 'del';
import { BUILD_DIR } from './consts';

const BRANCH = process.env.NODE_ENV || '';

const paths = [
    path.join(BUILD_DIR, BRANCH, 'chrome'),
    path.join(BUILD_DIR, BRANCH, 'opera'),
    path.join(BUILD_DIR, BRANCH, 'firefox-standalone'),
    path.join(BUILD_DIR, BRANCH, `firefox-amo-${BRANCH}-unsigned`),
    path.join(BUILD_DIR, BRANCH, 'edge'),
    path.join(BUILD_DIR, BRANCH, 'adguard-api'),
];

const clean = () => del(paths);

export default clean;
