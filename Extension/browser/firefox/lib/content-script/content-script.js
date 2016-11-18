/* global sendMessageToChrome, addChromeMessageListener, self, i18nMessageApi, I18nHelper */
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

/**
 * contentPage object is used for messaging between a content script and a frame script.
 */
var contentPage = (function (api) {

    var sendMessage;
    if (typeof sendMessageToChrome !== 'undefined') {
        sendMessage = function (message, callback) {
            var wrapper;
            if (callback) {
                wrapper = function (msg) {
                    return callback(JSON.parse(msg));
                };
            }
            return sendMessageToChrome(message, wrapper);
        };
    }

    var addMessageListener;
    if (typeof addChromeMessageListener !== 'undefined') {
        addMessageListener = function (listener) {
            var wrapper = function (msg) {
                return listener(JSON.parse(msg));
            };
            return addChromeMessageListener(window, wrapper);
        };
    }

    /**
     * Expose contentPage public API
     */
    api.sendMessage = sendMessage;
    api.onMessage = {
        addListener: addMessageListener
    };

    return api;

})(contentPage || {});

/**
 * This object is used to pass translations from the chrome process to the content.
 */
var i18n = (function (api) {

    /**
     * Expose i18n public API
     */
    api.getMessage = function (messageId, args) {
        var message;
        if (typeof i18nMessageApi !== 'undefined') {
            message = i18nMessageApi(messageId);
        } else {
            // TODO: Remove this when we finally drop addon SDK
            message = self.options.i18nMessages[messageId];
        }
        if (!message) {
            throw 'Message ' + messageId + ' not found';
        }
        return I18nHelper.replacePlaceholders(message, args);
    };
    return api;
})(i18n || {});