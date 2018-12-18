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

/* global contentPage */

const PageController = function () {
    // Empty
};

let userSettings;
let AntiBannerFiltersId;
let enabledFilters;

PageController.prototype = {

    init: function () {
        this._bindEvents();
        this._render();
    },

    _bindEvents: function () {
        this.safebrowsingEnabledCheckbox = document.getElementById('safebrowsingEnabledCheckbox');
        this.trackingFilterEnabledCheckbox = document.getElementById('trackingFilterEnabledCheckbox');
        this.socialFilterEnabledCheckbox = document.getElementById('socialFilterEnabledCheckbox');
        this.sendSafebrowsingStatsCheckbox = document.getElementById('sendSafebrowsingStatsCheckbox');
        this.allowAcceptableAdsCheckbox = document.getElementById('allowAcceptableAds');

        this.safebrowsingEnabledCheckbox.addEventListener('change', this.safebrowsingEnabledChange);
        this.trackingFilterEnabledCheckbox.addEventListener('change', this.trackingFilterEnabledChange);
        this.socialFilterEnabledCheckbox.addEventListener('change', this.socialFilterEnabledChange);
        this.sendSafebrowsingStatsCheckbox.addEventListener('change', this.sendSafebrowsingStatsChange);
        this.allowAcceptableAdsCheckbox.addEventListener('change', this.allowAcceptableAdsChange);

        const openExtensionStoreBtns = [].slice.call(document.querySelectorAll('.openExtensionStore'));
        openExtensionStoreBtns.forEach(openExtensionStoreBtn => {
            openExtensionStoreBtn.addEventListener('click', function (e) {
                e.preventDefault();
                contentPage.sendMessage({ type: 'openExtensionStore' });
            });
        });
        const openSettingsBtns = [].slice.call(document.querySelectorAll('.openSettings'));
        openSettingsBtns.forEach(openSettingsBtn => {
            openSettingsBtn.addEventListener('click', function (e) {
                e.preventDefault();
                contentPage.sendMessage({ type: 'openSettingsTab' });
            });
        });
    },

    safebrowsingEnabledChange: function () {
        contentPage.sendMessage({
            type: 'changeUserSetting',
            key: userSettings.names.DISABLE_SAFEBROWSING,
            value: !this.checked,
        });
    },

    trackingFilterEnabledChange: function () {
        if (this.checked) {
            contentPage.sendMessage({ type: 'addAndEnableFilter', filterId: AntiBannerFiltersId.TRACKING_FILTER_ID });
        } else {
            contentPage.sendMessage({
                type: 'disableAntiBannerFilter',
                filterId: AntiBannerFiltersId.TRACKING_FILTER_ID,
                remove: true,
            });
        }
    },

    socialFilterEnabledChange: function () {
        if (this.checked) {
            contentPage.sendMessage({ type: 'addAndEnableFilter', filterId: AntiBannerFiltersId.SOCIAL_FILTER_ID });
        } else {
            contentPage.sendMessage({
                type: 'disableAntiBannerFilter',
                filterId: AntiBannerFiltersId.SOCIAL_FILTER_ID,
                remove: true,
            });
        }
    },

    sendSafebrowsingStatsChange: function () {
        contentPage.sendMessage({
            type: 'changeUserSetting',
            key: userSettings.names.DISABLE_SEND_SAFEBROWSING_STATS,
            value: !this.checked,
        });
        contentPage.sendMessage({
            type: 'changeUserSetting',
            key: userSettings.names.DISABLE_COLLECT_HITS,
            value: !this.checked,
        });
    },

    allowAcceptableAdsChange: function () {
        if (this.checked) {
            contentPage.sendMessage({
                type: 'addAndEnableFilter',
                filterId: AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID,
            });
        } else {
            contentPage.sendMessage({
                type: 'disableAntiBannerFilter',
                filterId: AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID,
                remove: true,
            });
        }
    },

    _render: function () {
        const safebrowsingEnabled = !userSettings.values[userSettings.names.DISABLE_SAFEBROWSING];
        const sendSafebrowsingStats = !userSettings.values[userSettings.names.DISABLE_SEND_SAFEBROWSING_STATS];
        const collectHitsCount = !userSettings.values[userSettings.names.DISABLE_COLLECT_HITS];
        const trackingFilterEnabled = AntiBannerFiltersId.TRACKING_FILTER_ID in enabledFilters;
        const socialFilterEnabled = AntiBannerFiltersId.SOCIAL_FILTER_ID in enabledFilters;
        const allowAcceptableAdsEnabled = AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID in enabledFilters;

        this._renderSafebrowsingSection(safebrowsingEnabled, sendSafebrowsingStats, collectHitsCount);
        this._updateCheckbox(this.trackingFilterEnabledCheckbox, trackingFilterEnabled);
        this._updateCheckbox(this.socialFilterEnabledCheckbox, socialFilterEnabled);
        this._updateCheckbox(this.allowAcceptableAdsCheckbox, allowAcceptableAdsEnabled);
    },

    _renderSafebrowsingSection: function (safebrowsingEnabled, sendSafebrowsingStats, collectHitStats) {
        this._updateCheckbox(this.safebrowsingEnabledCheckbox, safebrowsingEnabled);
        this._updateCheckbox(this.sendSafebrowsingStatsCheckbox, sendSafebrowsingStats || collectHitStats);
    },

    _updateCheckbox: function (checkbox, enabled) {
        if (enabled) {
            checkbox.setAttribute('checked', 'checked');
        } else {
            checkbox.removeAttribute('checked');
        }
    },
};

contentPage.sendMessage({ type: 'initializeFrameScript' }, response => {
    userSettings = response.userSettings;
    enabledFilters = response.enabledFilters;
    AntiBannerFiltersId = response.constants.AntiBannerFiltersId;

    if (document.readyState !== 'complete') {
        document.addEventListener('DOMContentLoaded', () => {
            const controller = new PageController();
            controller.init();
        });
    } else {
        const controller = new PageController();
        controller.init();
    }
});
