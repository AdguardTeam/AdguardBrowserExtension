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

/**
 * Initializing required libraries for this file.
 * require method is overridden in Chrome extension (port/require.js).
 */
var LS = require('../../lib/utils/local-storage').LS;
var Log = require('../../lib/utils/log').Log;
var Prefs = require('../../lib/prefs').Prefs;
var Locale = Prefs.locale.substring(0, 2).toLowerCase();
var ServiceClient = require('../../lib/utils/service-client').ServiceClient;
var Promise = require('../../lib/utils/promises').Promise;

/**
 * Service that loads and parses filters metadata from backend server.
 * For now we just store filters metadata in an XML file within the extension.
 * In future we'll add an opportunity to update metadata along with filter rules update.
 */
var SubscriptionService = exports.SubscriptionService = function () {

	this.serviceClient = new ServiceClient();
	this.groups = [];
	this.filters = [];
};

SubscriptionService.prototype = {

	/**
	 * Initialize subscription service, loading local filters metadata
	 *
	 * @param callback Called on operation success
	 */
	init: function (callback) {

		var errorCallback = function (request, cause) {
			Log.error('Error loading metadata, cause: {0} {1}', request.statusText, cause);
		};

		var dfd1 = new Promise();
		this.serviceClient.loadLocalGroupsMetadata(function (groups) {
			this.groups = groups.sort(function (g1, g2) {
				return g1.displayNumber - g2.displayNumber
			});
			Log.info('Groups metadata loaded');
			dfd1.resolve();
		}.bind(this), errorCallback);

		var dfd2 = new Promise();
		this.serviceClient.loadLocalFiltersMetadata(function (filters) {
			this.filters = filters.sort(function (f1, f2) {
				return f1.displayNumber - f2.displayNumber;
			});
			Log.info('Filters metadata loaded');
			dfd2.resolve();
		}.bind(this), errorCallback);

		Promise.all([dfd1, dfd2]).then(callback);
	},

	/**
	 * @returns Filters metadata
	 */
	getFilters: function () {
		return this.filters;
	},

	/**
	 * @returns Groups metadata
	 */
	getGroups: function () {
		return this.groups;
	},

	/**
	 * @returns Filters languages metadata
	 */
	getFiltersLanguages: function () {
		var filtersLanguages = Object.create(null);
		for (var i = 0; i < this.filters.length; i++) {
			var languages = this.filters[i].languages;
			if (languages && languages.length > 0) {
				filtersLanguages[this.filters[i].filterId] = languages;
			}
		}
		return filtersLanguages;
	}
};

var SubscriptionGroup = exports.SubscriptionGroup = function (groupId, groupName, displayNumber) {
	this.groupId = groupId;
	this.groupName = groupName;
	this.displayNumber = displayNumber;
};

/**
 * Parsing filters metadata from XML
 * @param group XML element
 * @returns {SubscriptionGroup}
 */
SubscriptionGroup.fromXml = function (group) {

	var groupId = getChildTextContent(group, 'groupId') - 0;
	var defaultGroupName = getChildTextContent(group, 'groupName');
	var displayNumber = getChildTextContent(group, 'displayNumber') - 0;

	var i18n = Object.create(null);
	var i18nElement = getChild(group, 'i18n');
	if (i18nElement) {
		var localizations = i18nElement.getElementsByTagName('localization');
		for (var i = 0; i < localizations.length; i++) {
			var localization = localizations[i];
			var language = getChildTextContent(localization, 'language');
			i18n[language] = Object.create(null);
			i18n[language].groupName = getChildTextContent(localization, 'groupName');
		}
	}

	if (Locale in i18n) {
		defaultGroupName = i18n[Locale].groupName;
	}

	return new SubscriptionGroup(groupId, defaultGroupName, displayNumber);
};

/**
 * Filter metadata
 * @type {Function}
 */
var SubscriptionFilter = exports.SubscriptionFilter = function (filterId, groupId, name, description, homepage, version, timeUpdated, displayNumber, languages, expires, subscriptionUrl) {

	this.filterId = filterId;
	this.groupId = groupId;
	this.name = name;
	this.description = description;
	this.homepage = homepage;
	this.version = version;
	this.timeUpdated = timeUpdated;
	this.displayNumber = displayNumber;
	this.languages = languages;
	this.expires = expires;
	this.subscriptionUrl = subscriptionUrl;
};

/**
 * Parses filter metadata
 * @param filter XML element
 * @returns {SubscriptionFilter}
 */
SubscriptionFilter.fromXml = function (filter) {

	var filterId = getChildTextContent(filter, 'filterId') - 0;
	var groupId = getChildTextContent(filter, 'groupId') - 0;
	var defaultName = getChildTextContent(filter, 'name');
	var defaultDescription = getChildTextContent(filter, 'description');
	var homepage = getChildTextContent(filter, 'homepage');
	var version = getChildTextContent(filter, 'version');
	var timeUpdated = new Date(getChildTextContent(filter, 'timeUpdated')).getTime();
	var displayNumber = getChildTextContent(filter, 'displayNumber') - 0;
	var expires = getChildTextContent(filter, 'expires') - 0;
	var subscriptionUrl = getChildTextContent(filter, 'subscriptionUrl');

	var languages = [];
	var languagesEl = getChild(filter, 'languages');
	if (languagesEl) {
		var languagesElChildNodes = languagesEl.getElementsByTagName('language');
		for (var i = 0; i < languagesElChildNodes.length; i++) {
			languages.push(languagesElChildNodes[i].textContent);
		}
	}

	var i18n = Object.create(null);
	var i18nElement = getChild(filter, 'i18n');
	if (i18nElement) {
		var localizations = i18nElement.getElementsByTagName('localization');
		for (i = 0; i < localizations.length; i++) {
			var localization = localizations[i];
			var language = getChildTextContent(localization, 'language');
			i18n[language] = Object.create(null);
			i18n[language].name = getChildTextContent(localization, 'name');
			i18n[language].description = getChildTextContent(localization, 'description');
		}
	}

	if (Locale in i18n) {
		defaultName = i18n[Locale].name;
		defaultDescription = i18n[Locale].description;
	}

	return new SubscriptionFilter(filterId, groupId, defaultName, defaultDescription, homepage, version, timeUpdated, displayNumber, languages, expires, subscriptionUrl);
};


function getChild(element, localName) {

	if (!element || !element.childNodes) {
		return null;
	}
	var childs = element.childNodes;
	for (var i = 0; i < childs.length; i++) {
		var child = childs[i];
		if (child.localName == localName) {
			return child;
		}
	}
	return null;
}

function getChildTextContent(element, localName) {
	var child = getChild(element, localName);
	return child ? child.textContent : null;
}
