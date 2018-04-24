/**
 * Clean unused folders in Build/beta path
 */

/* global process */

import path from 'path';
import del from 'del';
import {BUILD_DIR} from './consts';
import {version} from './parse-package';

const branch = process.env.NODE_ENV || '';

const paths = [
    path.join(BUILD_DIR, branch, `chrome-${version}`),
    path.join(BUILD_DIR, branch, `firefox-standalone-${version}`),
    path.join(BUILD_DIR, branch, `firefox-legacy-${version}`),
    path.join(BUILD_DIR, branch, `safari-${version}.safariextension`),
    path.join(BUILD_DIR, branch, `edge-${version}`),
    path.join(BUILD_DIR, branch, `adguard-api-${version}`)
];

const clean = () => del(paths);

export default clean;
