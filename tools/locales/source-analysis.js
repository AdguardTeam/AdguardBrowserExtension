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

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { cliLog } from '../cli-log';
import { getLocaleTranslations } from '../helpers';

import {
    BASE_LOCALE,
    SRC_RELATIVE_PATH,
    SRC_FILENAME_EXTENSIONS,
    PERSISTENT_MESSAGES,
    LOCALES_RELATIVE_PATH,
} from './locales-constants';

/* eslint-disable @typescript-eslint/naming-convention */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* eslint-enable @typescript-eslint/naming-convention */

const LOCALES_DIR = path.resolve(__dirname, LOCALES_RELATIVE_PATH);
const SRC_DIR = path.resolve(__dirname, SRC_RELATIVE_PATH);

/**
 * Checks file extension is it one of source files
 *
 * @param {string} filePath path to file
 *
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
 *
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

/**
 * Checks if all locale keys used in source code exist in base locale
 */
export const checkMissingLocaleKeys = async () => {
    const baseLocaleTranslations = await getLocaleTranslations(BASE_LOCALE);
    const baseMessages = new Set(Object.keys(baseLocaleTranslations));

    const filesContents = getSrcFilesContents(SRC_DIR);

    const getMessagePattern = /(getMessage|getPlural)\s*\(\s*['"`]([^'"`]+)['"`]/g;

    const usedKeys = new Set();

    filesContents.forEach((fileContent) => {
        let match = getMessagePattern.exec(fileContent);

        while (match !== null) {
            usedKeys.add(match[2]);
            match = getMessagePattern.exec(fileContent);
        }
    });

    const missingKeys = Array.from(usedKeys.difference(baseMessages));

    if (missingKeys.length === 0) {
        cliLog.success('All used locale keys exist in base locale');
    } else {
        cliLog.warningRed('Found locale keys used in code but missing from base locale:');
        missingKeys.forEach((key) => {
            cliLog.warning(`  ${key}`);
        });
        throw new Error('Some locale keys used in code are missing from base locale');
    }
};
