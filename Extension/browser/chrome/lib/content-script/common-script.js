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

/* global chrome, browser */

(function (adguard) {

    'use strict';

    adguard.runtimeImpl = (function () {

        var onMessage = (function () {
            if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.onMessage) {
                // Edge, Firefox WebExtensions
                return browser.runtime.onMessage;
            }
            if (chrome.runtime && chrome.runtime.onMessage) {
                // Chromium
                return chrome.runtime.onMessage;
            } else if (chrome.extension.onMessage) {
                // Old Chromium
                return chrome.extension.onMessage;
            } else {
                // Old Chromium
                return chrome.extension.onRequest;
            }
        })();

        var sendMessage = (function () {
            if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage) {
                // Edge, Firefox WebExtensions
                return browser.runtime.sendMessage;
            }
            if (chrome.runtime && chrome.runtime.sendMessage) {
                // Chromium
                return chrome.runtime.sendMessage;
            } else if (chrome.extension.sendMessage) {
                // Old Chromium
                return chrome.extension.sendMessage;
            } else {
                // Old Chromium
                return chrome.extension.sendRequest;
            }
        })();

        return {
            onMessage: onMessage,
            sendMessage: sendMessage
        };

    })();

})(typeof adguard !== 'undefined' ? adguard : adguardContent);
