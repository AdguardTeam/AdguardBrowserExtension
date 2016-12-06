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
var PageController = function () {
};

PageController.prototype = {

	init: function () {

		this._bindEvents();
		this._render();

		$(".sp-table-row-input").toggleCheckbox();
		$("[data-popup]").popupHelp();

		updateDisplayAdguardPromo(!userSettings.values[userSettings.names.DISABLE_SHOW_ADGUARD_PROMO_INFO]);
		customizePopupFooter(environmentOptions.isMacOs);
	},

	_bindEvents: function () {

		this.safebrowsingEnabledCheckbox = $("#safebrowsingEnabledCheckbox");
		this.trackingFilterEnabledCheckbox = $("#trackingFilterEnabledCheckbox");
		this.socialFilterEnabledCheckbox = $("#socialFilterEnabledCheckbox");
		this.sendSafebrowsingStatsCheckbox = $("#sendSafebrowsingStatsCheckbox");
        this.allowAcceptableAdsCheckbox = $("#allowAcceptableAds");

		this.safebrowsingEnabledCheckbox.on('change', this.safebrowsingEnabledChange);
		this.trackingFilterEnabledCheckbox.on('change', this.trackingFilterEnabledChange);
		this.socialFilterEnabledCheckbox.on('change', this.socialFilterEnabledChange);
		this.sendSafebrowsingStatsCheckbox.on('change', this.sendSafebrowsingStatsChange);
        this.allowAcceptableAdsCheckbox.on('change', this.allowAcceptableAdsChange);

		$(".openExtensionStore").on('click', function (e) {
			e.preventDefault();
			contentPage.sendMessage({type: 'openExtensionStore'});
		});
	},

	safebrowsingEnabledChange: function () {
		contentPage.sendMessage({
			type: 'changeUserSetting',
			key: userSettings.names.DISABLE_SAFEBROWSING,
			value: !this.checked
		});
	},

	trackingFilterEnabledChange: function () {
		if (this.checked) {
			contentPage.sendMessage({type: 'addAndEnableFilter', filterId: AntiBannerFiltersId.TRACKING_FILTER_ID});
		} else {
			contentPage.sendMessage({type: 'removeAntiBannerFilter', filterId: AntiBannerFiltersId.TRACKING_FILTER_ID});
		}
	},

	socialFilterEnabledChange: function () {
		if (this.checked) {
			contentPage.sendMessage({type: 'addAndEnableFilter', filterId: AntiBannerFiltersId.SOCIAL_FILTER_ID});
		} else {
			contentPage.sendMessage({type: 'removeAntiBannerFilter', filterId: AntiBannerFiltersId.SOCIAL_FILTER_ID});
		}
	},

	sendSafebrowsingStatsChange: function () {
		contentPage.sendMessage({
			type: 'changeUserSetting',
			key: userSettings.names.DISABLE_SEND_SAFEBROWSING_STATS,
			value: !this.checked
		});
		contentPage.sendMessage({
			type: 'changeUserSetting',
			key: userSettings.names.DISABLE_COLLECT_HITS,
			value: !this.checked
		});
	},
    
    allowAcceptableAdsChange: function() {
		if (this.checked) {
			contentPage.sendMessage({type: 'addAndEnableFilter', filterId: AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID});
		} else {
			contentPage.sendMessage({type: 'disableAntiBannerFilter', filterId: AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID});
		}
    },

	_render: function () {

		var safebrowsingEnabled = !userSettings.values[userSettings.names.DISABLE_SAFEBROWSING];
		var sendSafebrowsingStats = !userSettings.values[userSettings.names.DISABLE_SEND_SAFEBROWSING_STATS];
		var collectHitsCount = !userSettings.values[userSettings.names.DISABLE_COLLECT_HITS];
		var trackingFilterEnabled = AntiBannerFiltersId.TRACKING_FILTER_ID in enabledFilters;
		var socialFilterEnabled = AntiBannerFiltersId.SOCIAL_FILTER_ID in enabledFilters;
        var allowAcceptableAdsEnabled = AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID in enabledFilters;

		this._renderSafebrowsingSection(safebrowsingEnabled, sendSafebrowsingStats, collectHitsCount);
		this._renderFilter(this.trackingFilterEnabledCheckbox, trackingFilterEnabled);
		this._renderFilter(this.socialFilterEnabledCheckbox, socialFilterEnabled);
        this._renderFilter(this.allowAcceptableAdsCheckbox, allowAcceptableAdsEnabled);
	},

	_renderSafebrowsingSection: function (safebrowsingEnabled, sendSafebrowsingStats, collectHitStats) {
		this.safebrowsingEnabledCheckbox.updateCheckbox(safebrowsingEnabled);
		this.sendSafebrowsingStatsCheckbox.updateCheckbox(sendSafebrowsingStats || collectHitStats);
	},

	_renderFilter: function (checkbox, enabled) {
		checkbox.updateCheckbox(enabled);
	}
};

var userSettings;
var AntiBannerFiltersId;
var enabledFilters;
var environmentOptions;

contentPage.sendMessage({type: 'initializeFrameScript'}, function (response) {

	userSettings = response.userSettings;
	enabledFilters = response.enabledFilters;
	environmentOptions = response.environmentOptions;
	AntiBannerFiltersId = response.constants.AntiBannerFiltersId;

	$(document).ready(function () {
		var controller = new PageController();
		controller.init();
	});
});