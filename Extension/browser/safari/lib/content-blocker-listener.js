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

    if (adguard.utils.browser.isContentBlockerEnabled()) {

        // Subscribe to events which lead to content blocker update
        adguard.listeners.addListener(function (event) {

            if (event === adguard.listeners.REQUEST_FILTER_UPDATED ||
                event === adguard.listeners.UPDATE_WHITELIST_FILTER_RULES) {

                adguard.SafariContentBlocker.updateContentBlocker();
            }
        });

        adguard.settings.onUpdated.addListener(function (setting) {
            if (setting === adguard.settings.DISABLE_FILTERING) {
                adguard.SafariContentBlocker.updateContentBlocker();
            }
        });

        // When content blocker is updated we need to save finally converted rules count and over limit flag
        adguard.listeners.addListener(function (event, info) {
            if (event === adguard.listeners.CONTENT_BLOCKER_UPDATED) {
                adguard.requestFilter.updateContentBlockerInfo(info);
            }
        });
    }

})(adguard);
