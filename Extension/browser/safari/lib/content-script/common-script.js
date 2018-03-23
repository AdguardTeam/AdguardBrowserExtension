/* global safari */

/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.
 */
(function (adguard) {

    'use strict';

    // Safari variable may be undefined in a frame
    (function () {
        if (typeof safari === 'undefined') {
            var w = window;
            while (w.safari === undefined && w !== window.top) {
                w = w.parent;
            }
            window.safari = w.safari;
        }
    })();

    // Message passing implementation
    adguard.runtimeImpl = (function () {

        var sendMessageNextRequestId = 1;

        var sendMessage = function (dispatcher, eventTarget, message, responseCallback) {

            var requestId = sendMessageNextRequestId++;
            var responseReceived = false;

            if (typeof responseCallback === 'function') {
                var responseListener = function (event) {
                    if (event.name === "response-" + requestId) {
                        if (responseReceived) {
                            // Due to some strange bug in Safari removeEventListener triggers the event one more time,
                            // so here we skip these already handled events.
                            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/979
                            return;
                        }

                        responseReceived = true;

                        eventTarget.removeEventListener('message', responseListener, false);
                        responseCallback(event.message);
                    }
                };
                eventTarget.addEventListener('message', responseListener, false);
            }

            dispatcher.dispatchMessage('request-' + requestId, message);
        };

        var onMessage = {

            addListener: function (eventTarget, callback) {

                eventTarget.addEventListener('message', function (event) {

                    if (event.name.indexOf('request-') !== 0) {
                        return;
                    }

                    callback(event);

                }, false);
            }
        };

        return {
            sendMessage: sendMessage,
            onMessage: onMessage
        };

    })();

    // I18n implementation
    adguard.i18n = (function () {

        var DEFAULT_LOCALE = 'en';

        var messages = null;
        var defaultMessages = null;

        var uiLocale = (function () {
            var prefix = navigator.language;
            var parts = prefix.replace('-', '_').split('_');
            var locale = parts[0].toLowerCase();
            if (parts[1]) {
                locale += '_' + parts[1].toUpperCase();
            }
            return locale;
        })();

        function getMessages(locale) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", safari.extension.baseURI + "_locales/" + locale + "/messages.json", false);
            try {
                xhr.send();
            } catch (e) {
                return null;
            }
            return JSON.parse(xhr.responseText);
        }

        var getMessage = function (msgId, substitutions) {

            if (msgId === "@@ui_locale") {
                return getUILanguage();
            }

            if (!messages) {
                // Use locale
                messages = getMessages(uiLocale);
                if (messages === null) {
                    // Use only language from locale
                    uiLocale = uiLocale.substring(0, 2);
                    messages = getMessages(uiLocale);
                }
                if (uiLocale === DEFAULT_LOCALE) {
                    defaultMessages = messages;
                }
            }

            // Load messages for default locale
            if (!defaultMessages) {
                defaultMessages = getMessages(DEFAULT_LOCALE) || Object.create(null);
            }

            return getI18nMessage(msgId, substitutions);
        };

        var getUILanguage = function () {
            return uiLocale;
        };

        function getI18nMessage(msgId, substitutions) {

            var msg = messages[msgId] || defaultMessages[msgId];
            if (!msg) {
                return "";
            }

            var msgstr = msg.message;
            if (!msgstr) {
                return "";
            }

            if (substitutions && substitutions.length > 0) {
                msgstr = msgstr.replace(/\$(\d+)/g, function (match, number) {
                    return typeof substitutions[number - 1] !== 'undefined' ? substitutions[number - 1] : match;
                });
            }
            return msgstr;
        }

        return {
            getUILanguage: getUILanguage,
            getMessage: getMessage
        };
    })();

})(typeof adguardContent !== 'undefined' ? adguardContent : adguard); // jshint ignore:line
