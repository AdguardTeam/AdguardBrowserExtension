/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
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
import browser from 'webextension-polyfill';

/** Represents an individual message entry */
type MessageEntry = { message: string };

/** Represents the structure of base messages, where any string can be a key */
type BaseMessages = { [key: string]: MessageEntry };

const BASE_LOCALE = 'en';

const baseMessages: BaseMessages = require('../../../_locales/en/messages.json');

const uiLanguage = browser.i18n.getUILanguage();

/**
 * Retrieves the localized message for the given key.
 *
 * @param key - The key corresponding to the message in the localization files
 *
 * @returns The localized message, or an empty string if the message is the same as the base locale (indicating no
 * translation)
 *
 * @throws {Error} If there is no such key in the messages
 */
const getMessage = (key: string) => {
    const receivedMessage = browser.i18n.getMessage(key);

    if (uiLanguage !== BASE_LOCALE) {
        const baseMessage = baseMessages[key]?.message;

        if (!baseMessage) {
            throw new Error(`There is no such key "${key}" in the messages`);
        }

        // The same strings mean that the message is not translated.
        // We return an empty string for @adguard/translator to fall back to the base message and base locale.
        // Without this, browser.i18n.getMessage returns the base locale message and the wrong UI language,
        // and @adguard/translator fails on plural forms validations.
        if (receivedMessage === baseMessage) {
            return '';
        }
    }

    return receivedMessage;
};

export const i18n = {
    getMessage,
    /**
     * Retrieves the UI language, truncated to a 2-letter code.
     * This is because react translator supports only 2-letter codes.
     *
     * @returns The 2-letter UI language code
     */
    getUILanguage: () => {
        return uiLanguage.substring(0, 2);
    },
    getBaseMessage: (key: string) => {
        // thus we can test the base messages with keys without translations
        if (process.env.NODE_ENV === 'test') {
            return key;
        }

        return browser.i18n.getMessage(key);
    },
    getBaseUILanguage: () => BASE_LOCALE,
};
