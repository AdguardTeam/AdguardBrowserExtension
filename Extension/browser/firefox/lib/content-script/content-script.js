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

var ext = (function () {

	/**
	 * Load a module from Adguard core
	 * @param module
	 */
	function loadAdguardModule(module) {
		Components.utils.import("resource://gre/modules/Services.jsm");
		var result = Object.create(Object.prototype);
		result.wrappedJSObject = result;
		Services.obs.notifyObservers(result, "adguard-load-module", module);
		return result.exports;
	}

	return {

		onMessage: {

			addListener: function (listener, type) {
				self.port.on(type, function (message) {
					if (!message) {
						message = Object.create(null);
					}
					message.type = type;
					listener(message);
				});
			}
		},

		backgroundPage: {

			sendMessage: function (message, callback) {
				if (callback) {
					self.port.once(message.type, function (response) {
						callback(response);
					});
				}
				self.port.emit(message.type, message);
			},

			getWindow: function () {

				if (!ext.backgroundPage.windowModules) {

					ext.backgroundPage.windowModules = {

						antiBannerService: loadAdguardModule('antiBannerService'),
						adguardApplication: loadAdguardModule('adguardApplication'),
						userSettings: loadAdguardModule('userSettings'),
						framesMap: loadAdguardModule('framesMap'),
						filteringLog: loadAdguardModule('filteringLog'),

						EventNotifier: loadAdguardModule('EventNotifier'),
						Prefs: loadAdguardModule('Prefs'),
						UI: loadAdguardModule('UI'),

						l10n: loadAdguardModule('l10n'),

						FilterUtils: loadAdguardModule('FilterUtils'),
						UrlUtils: loadAdguardModule('UrlUtils'),
						StringUtils: loadAdguardModule('StringUtils'),
						Utils: loadAdguardModule('Utils'),

						EventNotifierTypes: loadAdguardModule('EventNotifierTypes'),
						AntiBannerFiltersId: loadAdguardModule('AntiBannerFiltersId'),
						LogEvents: loadAdguardModule('LogEvents'),

						FilterRule: loadAdguardModule('FilterRule'),
						UrlFilterRule: loadAdguardModule('UrlFilterRule')
					};
				}

				return ext.backgroundPage.windowModules;
			}
		},

		windows: {
			getLastFocused: function (callback) {
				var win = {
					getActiveTab: function (callback) {
						var activeTab = loadAdguardModule('tabs').activeTab;
						activeTab.sendMessage = function (message, callback) {
							if (message.type == 'open-assistant') {
								ext.backgroundPage.getWindow().UI.openAssistant();
							}
							callback();
						};
						callback(activeTab);
					}
				};
				callback(win);
			}
		},

		closePopup: function () {
			ext.backgroundPage.getWindow().UI.closePopup();
		},

		resizePopup: function (width, height) {
			ext.backgroundPage.getWindow().UI.resizePopup(width, height);
		}
	}

})();