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
var showAlertPopupMessage; // Global;
if (window === window.top) {

	(function () {
		var MAIN_DIV_STYLE = "position: fixed !important;top: 10px !important;right: 0px !important;z-index: 9999999999 !important;" +
			"width: 390px !important;padding: 30px 20px 30px 36px !important;border-right: 6px solid #409e56 !important;-webkit-border-radius: 9px 0 0 9px !important;border-radius: 9px 0 0 9px !important;" +
			"background: rgba(0, 0, 0, 0.93) !important;color: #fff !important;text-align: left !important;";
		var TITLE_STYLE = "margin: 0 0 10px !important; font: 400 18px/100% 'gotham_proregular', 'opensans_semibold', sans-serif !important;";
		var TEXT_STYLE = "font: 400 13px/150% 'gotham_proregular', 'opensans_semibold', sans-serif !important; margin-top: 10px !important;";

		/**
		 * Shows alert popup.
		 * Popup content is added right to the page content.
		 *
		 * @param message Message text
		 */
		function showAlertPopup(message) {

			var alertPopup = document.createElement('div');

			var mainDiv = document.createElement('div');
			mainDiv.setAttribute('style', MAIN_DIV_STYLE);
			var titleDiv = document.createElement('div');
			titleDiv.setAttribute('style', TITLE_STYLE);
			titleDiv.appendChild(document.createTextNode(message.title));
			var textDiv = document.createElement('div');
			textDiv.setAttribute('style', TEXT_STYLE);

			var messages = [];
			if (Array.isArray(message.text)) {
				messages = message.text;
			} else {
				messages = [message.text];
			}
			for (var i = 0; i < messages.length; i++) {
				if (i > 0) {
					textDiv.appendChild(document.createElement('br'));
				}
				textDiv.appendChild(document.createTextNode(messages[i]));
			}

			mainDiv.appendChild(titleDiv);
			mainDiv.appendChild(textDiv);
			alertPopup.appendChild(mainDiv);

			var triesCount = 10;

			function appendPopup(count) {
				if (count >= triesCount) {
					return;
				}
				if (document.body) {
					document.body.appendChild(alertPopup);
					setTimeout(function () {
						if (alertPopup && alertPopup.parentNode) {
							alertPopup.parentNode.removeChild(alertPopup);
						}
					}, 4000);
				} else {
					setTimeout(function () {
						appendPopup(count + 1);
					}, 500);
				}
			}

			appendPopup(0);
		}

		/**
		 * Reload page without cache
		 */
		function noCacheReload() {
			var xhr = new XMLHttpRequest();
			xhr.open('GET', document.location.href);
			xhr.setRequestHeader('Pragma', 'no-cache');
			xhr.setRequestHeader('Expires', '-1');
			xhr.setRequestHeader('Expires', 'no-cache');
			xhr.onload = xhr.onerror = xhr.onabort = xhr.ontimeout = function () {
				document.location.reload(true);
			};
			xhr.send(null);
		}

		contentPage.onMessage.addListener(function (message) {
			if (message.type == 'show-alert-popup') {
				showAlertPopup(message);
			} else if (message.type == 'no-cache-reload') {
				noCacheReload();
			} else if (message.type == 'update-tab-url') {
				window.location = message.url;
			}
		});

		showAlertPopupMessage = showAlertPopup;
	})();
}