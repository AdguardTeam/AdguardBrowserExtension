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

/* global chrome, Prefs */

chrome.storage.local.get(null, function (items) {
    if (Prefs.browserVersion > 47) {
        if (items.rtcIPHandling == undefined) {
            chrome.storage.local.set({
                rtcIPHandling: 'default_public_interface_only'
            }, function () {
                chrome.privacy.network.webRTCIPHandlingPolicy.set({
                    value: 'default_public_interface_only'
                });
            })
        }
    } else if (Prefs.browserVersion > 41 && Prefs.browserVersion < 48) {
        if (items.rtcMultipleRoutes == undefined) {
            chrome.storage.local.set({
                rtcMultipleRoutes: true
            }, function () {
                chrome.privacy.network.webRTCMultipleRoutesEnabled.set({
                    value: false,
                    scope: 'regular'
                });
            })
        }
    }
});