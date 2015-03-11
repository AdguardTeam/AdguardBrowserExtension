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

		updateDisplayAdguardPromo();
	},

	_bindEvents: function () {

		this.safebrowsingEnabledCheckbox = $("#safebrowsingEnabledCheckbox");
		this.trackingFilterEnabledCheckbox = $("#trackingFilterEnabledCheckbox");
		this.socialFilterEnabledCheckbox = $("#socialFilterEnabledCheckbox");
		this.sendSafebrowsingStatsCheckbox = $("#sendSafebrowsingStatsCheckbox");

		this.safebrowsingEnabledCheckbox.on('change', this.safebrowsingEnabledChange);
		this.trackingFilterEnabledCheckbox.on('change', this.trackingFilterEnabledChange);
		this.socialFilterEnabledCheckbox.on('change', this.socialFilterEnabledChange);
		this.sendSafebrowsingStatsCheckbox.on('change', this.sendSafebrowsingStatsChange);

		$(".openExtensionStore").on('click', function (e) {
			e.preventDefault();
			UI.openExtensionStore();
		});
	},

	safebrowsingEnabledChange: function () {
		userSettings.changeEnableSafebrowsing(this.checked);
	},

	trackingFilterEnabledChange: function () {
		if (this.checked) {
			antiBannerService.addAndEnableFilter(AntiBannerFiltersId.TRACKING_FILTER_ID);
		} else {
			antiBannerService.removeAntiBannerFilter(AntiBannerFiltersId.TRACKING_FILTER_ID);
		}
	},

	socialFilterEnabledChange: function () {
		if (this.checked) {
			antiBannerService.addAndEnableFilter(AntiBannerFiltersId.SOCIAL_FILTER_ID);
		} else {
			antiBannerService.removeAntiBannerFilter(AntiBannerFiltersId.SOCIAL_FILTER_ID);
		}
	},

	sendSafebrowsingStatsChange: function () {
		userSettings.changeSendSafebrowsingStats(this.checked);
		userSettings.changeCollectHitsCount(this.checked);
	},

	_render: function () {
		var safebrowsingInfo = userSettings.getSafebrowsingInfo();
		this._renderSafebrowsingSection(safebrowsingInfo.enabled, safebrowsingInfo.sendStats, userSettings.collectHitsCount());
		this._renderFilter(this.trackingFilterEnabledCheckbox, antiBannerService.isAntiBannerFilterEnabled(AntiBannerFiltersId.TRACKING_FILTER_ID));
		this._renderFilter(this.socialFilterEnabledCheckbox, antiBannerService.isAntiBannerFilterEnabled(AntiBannerFiltersId.SOCIAL_FILTER_ID));
	},

	_renderSafebrowsingSection: function (safebrowsingEnabled, sendSafebrowsingStats, collectHitStats) {
		this.safebrowsingEnabledCheckbox.updateCheckbox(safebrowsingEnabled);
		this.sendSafebrowsingStatsCheckbox.updateCheckbox(sendSafebrowsingStats || collectHitStats);
	},

	_renderFilter: function (checkbox, enabled) {
		checkbox.updateCheckbox(enabled);
	}
};

var backgroundPage = ext.backgroundPage.getWindow();
var antiBannerService;
var UI;
var userSettings;
var AntiBannerFiltersId;

var onInit = function () {

	$(document).ready(function () {
		var controller = new PageController();
		controller.init();
	});
};

function init() {

	if (!(backgroundPage.antiBannerService && backgroundPage.antiBannerService.initialized)) {
		setTimeout(function () {
			init();
		}, 10);
		return;
	}

	antiBannerService = backgroundPage.antiBannerService;
	UI = backgroundPage.UI;
	userSettings = backgroundPage.userSettings;
	AntiBannerFiltersId = backgroundPage.AntiBannerFiltersId;
	onInit();
}
init();