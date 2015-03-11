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
var backgroundPage = ext.backgroundPage.getWindow();
var Prefs;
var UI;

var onInit = function () {

	$(document).ready(function () {

		$(".openExtensionStore").on('click', function (e) {
			e.preventDefault();
			UI.openExtensionStore();
		});
		if (Prefs.locale.toLowerCase() == 'ru') {
			$('#locale-ru').show();
		} else {
			$('#locale-en').show();
		}
	});
};

function init() {

	Prefs = backgroundPage.Prefs;
	UI = backgroundPage.UI;
	onInit();
}
init();