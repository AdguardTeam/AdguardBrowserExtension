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

var SafariContentBlocker = require('content-blocker').SafariContentBlocker;
var EventNotifier = require('utils/notifier').EventNotifier;
var EventNotifierTypes = require('utils/common').EventNotifierTypes;
var Utils = require('utils/browser-utils').Utils;

(function () {

    if (Utils.isContentBlockerEnabled()) {

        // Subscribe to events which lead to content blocker update
        EventNotifier.addListener(function (event, params) {

            if (event == EventNotifierTypes.REQUEST_FILTER_UPDATED
                || event == EventNotifierTypes.UPDATE_WHITELIST_FILTER_RULES
                || (event == EventNotifierTypes.CHANGE_USER_SETTINGS && params == userSettings.settings.DISABLE_FILTERING)) {

                SafariContentBlocker.updateContentBlocker();
            }
        });

        // When content blocker is updated we need to save finally converted rules count and over limit flag
        EventNotifier.addListener(function (event, info) {
            if (event === EventNotifierTypes.CONTENT_BLOCKER_UPDATED) {
                antiBannerService.updateContentBlockerInfo(info);
            }
        });
    }

})();
