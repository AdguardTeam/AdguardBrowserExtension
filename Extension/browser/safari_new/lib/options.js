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

PageController.prototype._render = function () {
    this._renderAntiBannerFilters();
    this._renderUserFilters();
    this._renderWhiteListFilters();
    var safebrowsingInfo = userSettings.getSafebrowsingInfo();
    this._renderSafebrowsingSection(safebrowsingInfo.enabled, safebrowsingInfo.sendStats);
    this._renderShowPageStatistics(userSettings.showPageStatistic(), Prefs.mobile);
    this._renderAllowAcceptableAds(antiBannerService.isAllowedAcceptableAds());
    this._renderAutodetectFilters(userSettings.isAutodetectFilters());
    this._renderShowInfoAboutAdguardFullVersion(userSettings.isShowInfoAboutAdguardFullVersion());
    this._renderCollectHitsCount(userSettings.collectHitsCount());
    this._renderShowContextMenu(userSettings.showContextMenu());
    this._renderDefaultWhiteListMode(userSettings.isDefaultWhiteListMode());
    if (Prefs.mobile) {
        $('#resetStats').hide();
    }
    this._initializeSubscriptionModal();
    this.checkSubscriptionsCount();

    //Hide Filtering log
    $('#openLog').hide();
    $('#resetStats').hide();
};