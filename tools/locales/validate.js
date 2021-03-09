import { validator } from '@adguard/translate'
import path from 'path';

import { cliLog } from '../cli-log';

import {
    getLocaleTranslations,
    areArraysEqual,
} from '../helpers';

import {
    BASE_LOCALE,
    LANGUAGES,
    LOCALES_RELATIVE_PATH,
    LOCALE_DATA_FILENAME,
    REQUIRED_LOCALES,
    THRESHOLD_PERCENTAGE,
} from './locales-constants';

const LOCALES = Object.keys(LANGUAGES);
const LOCALES_DIR = path.resolve(__dirname, LOCALES_RELATIVE_PATH);

/**
 * @typedef Result
 * @property {string} locale
 * @property {string} level % of translated
 * @property {Array} untranslatedStrings
 */

/**
 * Logs translations readiness
 * @param {Result[]} results
 */
const printTranslationsResults = (results) => {
    cliLog.info('Translations readiness:');
    results.forEach((r) => {
        const record = `${r.locale} -- ${r.level}%`;
        if (r.level < THRESHOLD_PERCENTAGE) {
            cliLog.warningRed(record);
            if (r.untranslatedStrings.length > 0) {
                cliLog.warning(`  untranslated:`);
                r.untranslatedStrings.forEach((str) => {
                    cliLog.warning(`    - ${str}`);
                });
            }
            if (r.invalidTranslations.length > 0) {
                cliLog.warning(`  invalid:`);
                r.invalidTranslations.forEach((obj) => {
                    cliLog.warning(`    - ${obj.key} -- ${obj.error}`);
                });
            }
        } else {
            cliLog.success(record);
        }
    });
};

/**
 * Checks locales translations readiness
 * @param {string[]} locales - list of locales
 * @param {boolean} [isInfo=false] flag for info script
 * @returns {Result[]} array of object with such properties:
 * locale, level of translation readiness and untranslated strings array
 */
export const checkTranslations = async (locales, isInfo = false) => {
    const baseLocaleTranslations = await getLocaleTranslations(
        LOCALES_DIR, BASE_LOCALE, LOCALE_DATA_FILENAME,
    );
    const baseMessages = Object.keys(baseLocaleTranslations);
    const baseMessagesCount = baseMessages.length;

    const results = await Promise.all(locales.map(async (locale) => {
        const localeTranslations = await getLocaleTranslations(
            LOCALES_DIR, locale, LOCALE_DATA_FILENAME,
        );
        const localeMessages = Object.keys(localeTranslations);
        const localeMessagesCount = localeMessages.length;

        const untranslatedStrings = [];
        const invalidTranslations = [];
        baseMessages.forEach((baseKey) => {
            if (!localeMessages.includes(baseKey)) {
                untranslatedStrings.push(baseKey);
            } else {
                // validate available translations
                const baseMessageValue = baseLocaleTranslations[baseKey].message;
                const localeMessageValue = localeTranslations[baseKey].message;
                try {
                    validator.isTranslationValid(baseMessageValue, localeMessageValue);
                } catch (error) {
                    invalidTranslations.push({ key: baseKey, error });
                }
            }
        });

        const validLocaleMessagesCount = localeMessagesCount - invalidTranslations.length;

        const strictLevel = ((validLocaleMessagesCount / baseMessagesCount) * 100);
        const level = Math.round((strictLevel + Number.EPSILON) * 100) / 100;

        return { locale, level, untranslatedStrings, invalidTranslations };
    }));

    const filteredResults = results.filter((result) => {
        return result.level < THRESHOLD_PERCENTAGE;
    });

    if (isInfo) {
        printTranslationsResults(results);
    } else if (filteredResults.length === 0) {
        let message = `Level of translations is required for locales: ${locales.join(', ')}`;
        if (areArraysEqual(locales, LOCALES)) {
            message = 'All locales have required level of translations';
        } else if (areArraysEqual(locales, REQUIRED_LOCALES)) {
            message = 'Our locales have required level of translations';
        }
        cliLog.success(message);
    } else {
        printTranslationsResults(filteredResults);
        throw new Error('Locales above should be done for 100%');
    }

    return results;
};
