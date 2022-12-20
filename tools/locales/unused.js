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

import fs from 'fs';
import path from 'path';

import { cliLog } from '../cli-log';
import { getLocaleTranslations } from '../helpers';

import {
    BASE_LOCALE,
    SRC_RELATIVE_PATH,
    SRC_FILENAME_EXTENSIONS,
    PERSISTENT_MESSAGES,
    LOCALES_RELATIVE_PATH,
} from './locales-constants';

const LOCALES_DIR = path.resolve(__dirname, LOCALES_RELATIVE_PATH);
const SRC_DIR = path.resolve(__dirname, SRC_RELATIVE_PATH);

/**
 * Checks file extension is it one of source files
 *
 * @param {string} filePath path to file
 * @returns {boolean}
 */
const canContainLocalesStrings = (filePath) => {
    let isSrcFile = false;
    for (let i = 0; i < SRC_FILENAME_EXTENSIONS.length; i += 1) {
        isSrcFile = filePath.endsWith(SRC_FILENAME_EXTENSIONS[i]) || isSrcFile;

        if (isSrcFile) {
            break;
        }
    }

    return isSrcFile && !filePath.includes(LOCALES_DIR);
};

/**
 * Collects contents of source files in given directory
 *
 * @param {string} dirPath path to dir
 * @param {Array} [contents=[]] result acc
 * @returns {Array}
 */
const getSrcFilesContents = (dirPath, contents = []) => {
    fs.readdirSync(dirPath).forEach((file) => {
        const fullPath = path.join(dirPath, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            getSrcFilesContents(fullPath, contents);
        } else if (canContainLocalesStrings(fullPath)) {
            contents.push(fs.readFileSync(fullPath).toString());
        }
    });
    return contents;
};

/**
 * Checks if there are unused base-locale strings in source files
 */
export const checkUnusedMessages = async () => {
    const baseLocaleTranslations = await getLocaleTranslations(BASE_LOCALE);
    const baseMessages = Object.keys(baseLocaleTranslations);

    const filesContents = getSrcFilesContents(SRC_DIR);

    const isPresentInFile = (message, file) => {
        return file.includes(`'${message}'`) || file.includes(`"${message}"`);
    };

    const isMessageUsed = (message) => {
        return !PERSISTENT_MESSAGES.includes(message)
            && !filesContents.some((file) => isPresentInFile(message, file));
    };

    const unusedMessages = baseMessages.filter(isMessageUsed);

    if (unusedMessages.length === 0) {
        cliLog.success('There are no unused messages');
    } else {
        cliLog.warningRed('Unused messages:');
        unusedMessages.forEach((key) => {
            cliLog.warning(`  ${key}`);
        });
    }
};
