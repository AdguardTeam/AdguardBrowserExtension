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

import { validator } from '@adguard/translate';

import { cliLog } from '../cli-log';

import { getLocaleTranslations, areArraysEqual } from '../helpers';

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
 * Logs translations readiness (default validation process)
 *
 * @param {Result[]} results
 * @param {boolean} [isMinimum=false]
 */
const printTranslationsResults = (results, isMinimum = false) => {
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
            if (!isMinimum) {
                if (r.invalidTranslations.length > 0) {
                    cliLog.warning('  invalid:');
                    r.invalidTranslations.forEach((obj) => {
                        cliLog.warning(`    - ${obj.key} -- ${obj.error}`);
                    });
                }
            }
        } else {
            cliLog.success(record);
        }
    });
};

/**
 * Logs invalid translations (critical errors)
 *
 * @param {Result[]} criticals
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
        const isTranslationValid = validator.isTranslationValid(baseMessageValue, localeMessageValue);
        if (!isTranslationValid) {
            throw new Error('Invalid translated string');
        }
    } catch (error) {
        return { key: baseKey, error };
    }
};

/**
 * @typedef ValidationFlags
 * @property {boolean} [isMinimum=false] for minimum level of validation:
 * critical errors for all and full translations level for our locales
 * @property {boolean} [isInfo=false] for logging translations info without throwing the error
 */

/**
 * Checks locales translations readiness
 *
 * @param {string[]} locales - list of locales
 * @param {ValidationFlags} flags
 * @returns {Result[]} array of object with such properties:
 * locale, level of translation readiness, untranslated strings array and array of invalid translations
 */
export const checkTranslations = async (locales, flags) => {
    const { isMinimum = false, isInfo = false } = flags;
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

    const filteredCriticalResults = translationResults.filter((result) => {
        return result.invalidTranslations.length > 0;
    });

    const filteredReadinessResults = translationResults.filter((result) => {
        return isMinimum
            ? result.level < THRESHOLD_PERCENTAGE && REQUIRED_LOCALES.includes(result.locale)
            : result.level < THRESHOLD_PERCENTAGE;
    });

    if (isInfo) {
        printTranslationsResults(translationResults);
    } else {
        // critical errors and required locales translations levels check
        if (isMinimum) {
            let isSuccess = true;
            // check for invalid strings
            if (filteredCriticalResults.length === 0) {
                cliLog.success('No invalid translations found');
            } else {
                isSuccess = false;
                printCriticalResults(filteredCriticalResults);
                cliLog.warningRed('Locales above should not have invalid strings');
            }
            // check for translations readiness for required locales
            if (filteredReadinessResults.length === 0) {
                cliLog.success('Our locales have required level of translations');
            } else {
                isSuccess = false;
                printTranslationsResults(filteredReadinessResults, isMinimum);
                cliLog.warningRed('Our locales should be done for 100%');
            }
            if (!isSuccess) {
                // throw error finally
                throw new Error('Locales validation failed!');
            }
        }
        // common translations check
        if (filteredReadinessResults.length === 0) {
            let message = `Level of translations is required for locales: ${locales.join(', ')}`;
            if (areArraysEqual(locales, LOCALES)) {
                message = 'All locales have required level of translations';
            }
            cliLog.success(message);
        } else {
            printTranslationsResults(filteredReadinessResults);
            throw new Error('Locales above should be done for 100%');
        }
    }

    return translationResults;
};
