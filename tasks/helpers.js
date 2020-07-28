import fs from 'fs';
import path from 'path';
import pp from 'preprocess';
import {
    FIREFOX_WEBEXT, BRANCH_DEV, BRANCH_BETA, BRANCH_RELEASE,
} from './consts';

/**
 * Get the extension name postfix
 *
 * @param branch    branch of a build
 * @param browser   browser name
 * @param allowRemoteScripts   param for Firefox browser
 * @return {string}  postfix
 */
export function getExtensionNamePostfix(branch, browser, allowRemoteScripts) {
    switch (browser) {
        case FIREFOX_WEBEXT:
            if (allowRemoteScripts) {
                if (branch == BRANCH_BETA) {
                    return ' (Standalone)';
                } if (branch == BRANCH_DEV) {
                    return ' (Standalone Dev)';
                }
            } else {
                if (branch == BRANCH_BETA) {
                    return ' (Beta)';
                } if (branch == BRANCH_DEV) {
                    return ' (AMO Dev)';
                }
            }
            break;
        default:
            if (branch != BRANCH_RELEASE) {
                return ` (${capitalize(branch)})`;
            }
            break;
    }
}

/**
 * Change the extension name in localization files based on a type of a build (dev, beta or release) and browser
 *
 * @param branch    branch of a build
 * @param dest      locales folder
 * @param done      done function which is returning of gulp stream
 * @param browser   browser name
 * @param allowRemoteScripts   param for Firefox browser
 * @return done
 */
export function updateLocalesMSGName(branch, dest, done, browser, allowRemoteScripts) {
    const extensionNamePostfix = getExtensionNamePostfix(branch, browser, allowRemoteScripts) || '';

    const locales = fs.readdirSync(path.join(dest, '_locales'));

    for (const i of locales) {
        const file = path.join(dest, '_locales', i, 'messages.json');
        const messages = JSON.parse(fs.readFileSync(file));

        if (messages.name) {
            messages.name.message = messages.name.message + extensionNamePostfix;
        }

        if (messages.short_name) {
            messages.short_name.message = messages.short_name.message + extensionNamePostfix;
        }

        fs.writeFileSync(file, JSON.stringify(messages, null, 4));
    }

    return done();
}

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

export function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export const chunkArray = (arr, size) => arr.reduce((chunks, el, idx) => {
    if (idx % size === 0) {
        chunks.push([el]);
    } else {
        chunks[chunks.length - 1].push(el);
    }
    return chunks;
}, []);
