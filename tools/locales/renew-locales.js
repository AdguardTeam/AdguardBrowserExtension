/**
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

/* eslint-disable no-await-in-loop,no-restricted-syntax,no-console */
import { promises as fs } from 'fs';
import path from 'path';
import uniq from 'lodash/uniq';
import xor from 'lodash/xor';

import { cliLog } from '../cli-log';
import { getLocaleTranslations } from '../helpers';

import {
    BASE_LOCALE,
    LOCALES_RELATIVE_PATH,
    LOCALE_DATA_FILENAME,
    SRC_RELATIVE_PATH,
    SRC_FILENAME_EXTENSIONS,
    PERSISTENT_MESSAGES,
} from './locales-constants';

const LOCALES_DIR = path.resolve(__dirname, LOCALES_RELATIVE_PATH);
const SRC_DIR = path.resolve(__dirname, SRC_RELATIVE_PATH);

/**
 * Search configuration
 */
const configuration = {
    src: path.join(LOCALES_DIR, `${BASE_LOCALE}/${LOCALE_DATA_FILENAME}`), // Base language json
    targets: [SRC_DIR], // Directory to search occurrences
    output: path.join(LOCALES_DIR, `${BASE_LOCALE}/${LOCALE_DATA_FILENAME}`), // Place to put result
    filesReg: `(${SRC_FILENAME_EXTENSIONS.join('|')})$`,
    // messages used in extensions localisations e.g. __MSG_short_name__
    persistedMessages: PERSISTENT_MESSAGES,
};

/**
 * Promise wrapper for writing in file
 *
 * @param {string} filename
 * @param {*} body
 */
const writeInFile = (filename, body) => {
    if (typeof body !== 'string') {
        body = JSON.stringify(body, null, 4);
    }
    return fs.writeFile(filename, body);
};

/**
 * Finds files paths within directory corresponding to filesReg
 *
 * @param {string} dir
 * @param {string} filesReg
 * @returns {Promise<*>}
 */
const findFilesPaths = async (dir, filesReg) => {
    const filterRegexp = new RegExp(filesReg);
    const walk = async (dir, filePaths = []) => {
        const files = await fs.readdir(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = await fs.stat(filePath);

            if (stat.isDirectory()) {
                filePaths = await walk(filePath, filePaths);
            } else if (filePath.match(filterRegexp)) {
                filePaths.push(filePath);
            }
        }
        return filePaths;
    };
    return walk(dir);
};

const getFilesPathsList = async (targets, filesReg) => {
    const filesListsPromises = targets.map(async (directory) => {
        return findFilesPaths(directory, filesReg);
    });
    return Promise
        .all(filesListsPromises)
        .then((filesLists) => {
            return filesLists.reduce((uniqueFiles, filesList) => {
                return [...new Set([...uniqueFiles, ...filesList])];
            }, []);
        });
};

const filterMessages = (messages, content) => {
    return messages.filter((message) => {
        return content.indexOf(message) > -1;
    });
};

const chooseMessagesFromFiles = async (messages, targets, filesReg) => {
    const filesPaths = await getFilesPathsList(targets, filesReg);
    const filteredMessages = filesPaths.map(async (filePath) => {
        const fileContent = await fs.readFile(filePath);
        return filterMessages(messages, fileContent);
    });
    return Promise
        .all(filteredMessages)
        .then((messages) => {
            return [...messages.reduce((unique, messageArray) => {
                return new Set([...unique, ...messageArray]);
            }, new Set())];
        });
};

/**
 * Initialization of search process
 */
export const renewLocales = async () => {
    let { targets } = configuration;
    const {
        src,
        output = 'result.json',
        filesReg = '.html$',
        persistedMessages = [],
    } = configuration;

    if (!src) {
        throw new Error('No source path');
    }

    if (!targets || !targets.length) {
        throw new Error('No target directories');
    }

    if (typeof targets === 'string') {
        targets = [targets];
    }

    const source = await getLocaleTranslations(BASE_LOCALE);
    const oldKeys = Object.keys({ ...source });

    chooseMessagesFromFiles(oldKeys, targets, filesReg)
        .then((chosenKeys) => {
            const result = {};
            const resultMessages = uniq([...chosenKeys, ...persistedMessages]);
            resultMessages.forEach((key) => {
                result[key] = source[key];
            });
            const removedKeys = xor(resultMessages, oldKeys);
            if (removedKeys.length === 0) {
                cliLog.info('There is nothing to renew');
            } else {
                cliLog.info(`existing keys number: ${resultMessages.length}`);
                cliLog.info(`old keys number: ${oldKeys.length}`);
                cliLog.warningRed(`${removedKeys.length} keys have been removed:`);
                cliLog.warning(` - ${removedKeys.join('\n - ')}`);
            }
            return writeInFile(output, result);
        })
        .then(() => {
            cliLog.success('Success!');
        })
        .catch((err) => {
            cliLog.error(err);
        });
};
