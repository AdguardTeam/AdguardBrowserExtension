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

PopupController.prototype._renderTopMessageBlock = function (parent, tabInfo) {
    function formatNumber(v) {
        return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    var template;
    if (tabInfo.adguardDetected) {
        template = this.adguardDetectedMessageTemplate;
        if (tabInfo.adguardProductName) {
            this.translateElement(template.children()[0], 'popup_ads_has_been_removed_by_adguard', [tabInfo.adguardProductName])
        } else {
            this.translateElement(template.children()[0], 'popup_ads_has_been_removed');
        }
    } else if (tabInfo.applicationFilteringDisabled) {
        template = this.siteProtectionDisabledMessageTemplate;
    } else if (tabInfo.urlFilteringDisabled) {
        template = this.siteFilteringDisabledMessageTemplate;
    } else {
        //template = this.siteStatsTemplate;
        //var titleBlocked = template.find('.w-popup-filter-title-blocked');
        //this.translateElement(titleBlocked[0], 'popup_tab_blocked', [formatNumber(tabInfo.totalBlockedTab || 0)]);
        //this.translateElement(template.find('.w-popup-filter-title-blocked-all')[0], 'popup_tab_blocked_all', [formatNumber(tabInfo.totalBlocked || 0)]);
        //if (tabInfo.totalBlocked >= 10000000) {
        //    titleBlocked.closest('.widjet-popup-filter').addClass('db');
        //} else {
        //    titleBlocked.closest('.widjet-popup-filter').removeClass('db');
        //}
    }
    parent.append(template);
};