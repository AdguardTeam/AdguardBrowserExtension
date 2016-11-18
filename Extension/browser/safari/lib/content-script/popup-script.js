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

/* global $, safari, controller, uiService */

(function () {

	'use strict';

	var backgroundPage = safari.extension.globalPage.contentWindow;

	safari.self.addEventListener("popover", function () {

		safari.self.width = 320;
		safari.self.height = 340;

		document.documentElement.style.display = "none";
		document.location.reload();
	});

	safari.application.addEventListener("activate", function () {
		controller.resizePopupWindow();
		safari.self.hide();
	}, true);

	var adguard = window.adguard = Object.create(backgroundPage.adguard);
	adguard.closePopup =  function () {
		controller.resizePopupWindow();
		safari.self.hide();
	};
	adguard.resizePopup =  function (width, height) {
		safari.self.width = width;
		safari.self.height = height;
	};
	window.i18n = adguard.i18n;

	$(window).on('blur', function () {
		if (window.tab) {
			uiService.updateTabIconAndContextMenu(window.tab, true);
		}
	});
})();
