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

/* global safari */

(function () {

    'use strict';

    var backgroundPage = safari.extension.globalPage.contentWindow;
    var adguard = backgroundPage.adguard;

    // We have some problems with the correct drawing of a popup, so we have to predict popup's size and apply the real size with some delay.
    // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/505
    var popupSizes = {
        compact: {
            width: 340,
            height: 174
        },
        default: {
            width: 340,
            height: 340
        }
    };

    window.i18n = adguard.i18n;

    window.popupPage = {
        sendMessage: function (message, responseCallback) {
            // There is no messaging in popover, call method directly
            var safariTab = safari.application.activeBrowserWindow.activeTab;
            var sender = {tab: adguard.tabsImpl.fromSafariTab(safariTab)};
            var callback = responseCallback || function () {
                };
            adguard.runtime.onMessageHandler(message, sender, callback);
        },
        closePopup: function () {
            document.dispatchEvent(new Event('resizePopup'));
            safari.self.hide();
        },
        resizePopup: function (width, height) {
            safari.self.width = width;
            safari.self.height = height;
        }
    };

    safari.self.addEventListener("popover", function () {

        // Try to predict popup size
        var safariTab = safari.application.activeBrowserWindow.activeTab;
        var url = safariTab.url;
        if (url && url.indexOf('http') === 0) {
            window.popupPage.resizePopup(popupSizes.default.width, popupSizes.default.height);
        } else {
            window.popupPage.resizePopup(popupSizes.compact.width, popupSizes.compact.height);
        }

        document.documentElement.style.display = "none";
        document.location.reload();
    });

    safari.application.addEventListener("activate", function () {
        window.popupPage.closePopup();
    }, true);

})();
