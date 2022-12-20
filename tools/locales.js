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

/* eslint-disable no-console */
import { program } from 'commander';
import { downloadAndSave } from './locales/download-locales';
import { uploadLocales } from './locales/upload-locales';
import { renewLocales } from './locales/renew-locales';
import { checkTranslations } from './locales/validate';
import { checkUnusedMessages } from './locales/unused';

import { cliLog } from './cli-log';

import { LANGUAGES } from './locales/locales-constants';

const LOCALES = Object.keys(LANGUAGES);

const download = async (locales) => {
    try {
        await downloadAndSave(locales);
        cliLog.success('Download was successful');
    } catch (e) {
        cliLog.error(e.message);
        process.exit(1);
    }
};

const upload = async () => {
    try {
        // check for unused base-locale strings before uploading
        await checkUnusedMessages();
        const result = await uploadLocales();
        cliLog.success(`Upload was successful with response: ${JSON.stringify(result)}`);
    } catch (e) {
        cliLog.error(e.message);
        process.exit(1);
    }
};

const renew = async () => {
    try {
        await renewLocales();
    } catch (e) {
        cliLog.error(e.message);
        process.exit(1);
    }
};

const validate = async (locales, isMinimum) => {
    try {
        await checkTranslations(locales, { isMinimum });
    } catch (e) {
        cliLog.error(e.message);
        process.exit(1);
    }
};

const summary = async (isInfo) => {
    try {
        await checkTranslations(LOCALES, { isInfo });
    } catch (e) {
        cliLog.error(e.message);
        process.exit(1);
    }
};

const unused = async () => {
    try {
        await checkUnusedMessages();
    } catch (e) {
        cliLog.error(e.message);
        process.exit(1);
    }
};

program
    .command('download')
    .description('Downloads messages from localization service')
    .option('-l,--locales [list...]', 'specific list of space-separated locales')
    .action(async (opts) => {
        // defaults to download all locales
        // and validate: all for critical errors and ours for full translations readiness
        let locales = LOCALES;
        let isMinimum = true;
        // but if list_of_locales is specified, use them for download and validation
        if (opts.locales && opts.locales.length > 0) {
            locales = opts.locales;
            isMinimum = false;
        }
        await download(locales);
        await validate(locales, isMinimum);
    });

program
    .command('upload')
    .description('Uploads base messages to the localization service')
    .action(upload);

program
    .command('renew')
    .description('Removes old messages from locale messages')
    .action(renew);

program
    .command('validate')
    .description('Validates translations')
    .option('-R,--min', 'for critical errors of all locales and translations readiness of ours')
    .option('-l,--locales [list...]', 'for specific list of space-separated locales')
    .action((opts) => {
        // defaults to validate all locales
        let locales = LOCALES;
        let isMinimum;
        if (opts.min) {
            isMinimum = true;
        } else if (opts.locales && opts.locales.length > 0) {
            locales = opts.locales;
        }
        validate(locales, isMinimum);
    });

program
    .command('info')
    .description('Shows locales info')
    .option('-s,--summary', 'for all locales translations readiness')
    .option('-N,--unused', 'for unused base-lang strings')
    .action((opts) => {
        const IS_INFO = true;
        if (opts.summary) {
            summary(IS_INFO);
        } else if (opts.unused) {
            unused();
        } else if (!opts.summary && !opts.unused) {
            summary(IS_INFO);
            unused();
        }
    });

program.parse(process.argv);
