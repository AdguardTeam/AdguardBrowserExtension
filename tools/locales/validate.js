import { validator } from '@adguard/translate';

import { cliLog } from '../cli-log';

import {
    getLocaleTranslations,
    areArraysEqual,
} from '../helpers';

import {
    BASE_LOCALE,
    LANGUAGES,
    REQUIRED_LOCALES,
    THRESHOLD_PERCENTAGE,
} from './locales-constants';

const LOCALES = Object.keys(LANGUAGES);

/**
 * @typedef Result
 * @property {string} locale
 * @property {string} level % of translated
 * @property {Array} untranslatedStrings
 * @property {Array} invalidTranslations
 */

/**
 * Logs translations readiness (for main part of validation process)
 * @param {Result[]} results
 */
const printTranslationsResults = (results) => {
    cliLog.info('Translations readiness:');
    results.forEach((r) => {
        const record = `${r.locale} -- ${r.level}%`;
        if (r.level < THRESHOLD_PERCENTAGE) {
            cliLog.warningRed(record);
            if (r.untranslatedStrings.length > 0) {
                cliLog.warning('  untranslated:');
                r.untranslatedStrings.forEach((str) => {
                    cliLog.warning(`    - ${str}`);
                });
            }
            if (r.invalidTranslations.length > 0) {
                cliLog.warning('  invalid:');
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
 * @typedef InvalidTranslation
 * @property {string} key
 * @property {Error} error
 */

/**
 * @typedef CriticalResult
 * @property {string} locale
 * @property {InvalidTranslation[]} invalidTranslations
 */

/**
 * Logs invalid translations (for extra part of validation process)
 * @param {CriticalResult[]} criticals
 */
const printCriticalResults = (criticals) => {
    cliLog.warning('Invalid translated string:');
    criticals.forEach((cr) => {
        cliLog.warningRed(`${cr.locale}:`);
        cr.invalidTranslations.forEach((obj) => {
            cliLog.warning(`   - ${obj.key} -- ${obj.error}`);
        });
    });
};

const validateMessage = (baseKey, baseLocaleTranslations, localeTranslations) => {
    const baseMessageValue = baseLocaleTranslations[baseKey].message;
    const localeMessageValue = localeTranslations[baseKey].message;
    try {
        validator.isTranslationValid(baseMessageValue, localeMessageValue);
    } catch (error) {
        return { key: baseKey, error };
    }
};

/**
 * Checks locales translations readiness
 * @param {string[]} locales - list of locales
 * @param {boolean} [isInfo=false] flag for info script
 * @returns {Result[]} array of object with such properties:
 * locale, level of translation readiness, untranslated strings array and array of invalid translations
 */
export const checkTranslations = async (locales, isInfo = false) => {
    const baseLocaleTranslations = await getLocaleTranslations(BASE_LOCALE);
    const baseMessages = Object.keys(baseLocaleTranslations);
    const baseMessagesCount = baseMessages.length;

    const translationResults = await Promise.all(locales.map(async (locale) => {
        const localeTranslations = await getLocaleTranslations(locale);
        const localeMessages = Object.keys(localeTranslations);
        const localeMessagesCount = localeMessages.length;

        const untranslatedStrings = [];
        const invalidTranslations = [];
        baseMessages.forEach((baseKey) => {
            if (!localeMessages.includes(baseKey)) {
                untranslatedStrings.push(baseKey);
            } else {
                const validationError = validateMessage(baseKey, baseLocaleTranslations, localeTranslations);
                if (validationError) {
                    invalidTranslations.push(validationError);
                }
            }
        });

        const validLocaleMessagesCount = localeMessagesCount - invalidTranslations.length;

        const strictLevel = ((validLocaleMessagesCount / baseMessagesCount) * 100);
        const level = Math.round((strictLevel + Number.EPSILON) * 100) / 100;

        return {
            locale, level, untranslatedStrings, invalidTranslations,
        };
    }));

    const filteredResults = translationResults.filter((result) => {
        return result.level < THRESHOLD_PERCENTAGE;
    });

    if (isInfo) {
        printTranslationsResults(translationResults);
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

    return translationResults;
};

/**
 * Checks locales translations for critical errors
 * @param {string[]} locales - list of locales
 * @returns {CriticalResult[]} array of object with such properties:
 * locale and array of invalid translations
 */
export const checkCriticals = async (locales) => {
    const baseLocaleTranslations = await getLocaleTranslations(BASE_LOCALE);
    const baseMessages = Object.keys(baseLocaleTranslations);

    const criticalCheckResults = await Promise.all(locales.map(async (locale) => {
        const extraLocaleTranslations = await getLocaleTranslations(locale);
        const extraLocaleMessages = Object.keys(extraLocaleTranslations);

        const invalidTranslations = [];
        baseMessages.forEach((baseKey) => {
            // check existing translations
            if (extraLocaleMessages.includes(baseKey)) {
                const validationError = validateMessage(baseKey, baseLocaleTranslations, extraLocaleTranslations);
                if (validationError) {
                    invalidTranslations.push(validationError);
                }
            }
        });

        return { locale, invalidTranslations };
    }));

    const filteredCriticalResults = criticalCheckResults.filter((result) => {
        return result.invalidTranslations.length > 0;
    });

    if (filteredCriticalResults.length === 0) {
        const message = 'No invalid translations found';
        cliLog.success(message);
    } else {
        printCriticalResults(filteredCriticalResults);
        throw new Error('Locales above should not have invalid strings');
    }

    return filteredCriticalResults;
};
