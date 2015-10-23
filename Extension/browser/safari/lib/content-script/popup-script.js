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
(function () {

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

	window.ext = {
		__proto__: backgroundPage.ext,
		closePopup: function () {
			controller.resizePopupWindow();
			safari.self.hide();
		},
		resizePopup: function (width, height) {
			safari.self.width = width;
			safari.self.height = height;
		}
	};
	window.BrowserTabs = backgroundPage.BrowserTabs;

	window.i18n = new backgroundPage.I18NSupport();

	$(window).on('blur', function () {
		if (window.tab) {
			UI.updateTabIconAndContextMenu(tab, true);
		}
	});
})();
