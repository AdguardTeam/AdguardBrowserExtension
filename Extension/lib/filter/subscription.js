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

/* global exports, require */

/**
 * Initializing required libraries for this file.
 * require method is overridden in Chrome extension (port/require.js).
 */
var Log = require('../../lib/utils/log').Log;
var Prefs = require('../../lib/prefs').Prefs;
var ServiceClient = require('../../lib/utils/service-client').ServiceClient;
var Promise = require('../../lib/utils/promises').Promise;

var Locale = Prefs.locale.substring(0, 2).toLowerCase();

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

		this._loadMetadata(function () {
			this._loadMetadataI18n(callback, errorCallback);
		}.bind(this), errorCallback);
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
	},

	_loadMetadata: function (successCallback, errorCallback) {

		this.serviceClient.loadLocalFiltersMetadata(function (metadata) {

			this.groups = [];
			this.filters = [];

			for (var i = 0; i < metadata.groups.length; i++) {
				this.groups.push(SubscriptionGroup.fromJSON(metadata.groups[i], i));
			}

			for (var j = 0; j < metadata.filters.length; j++) {
				this.filters.push(SubscriptionFilter.fromJSON(metadata.filters[j], j));
			}

			Log.info('Filters metadata loaded');
			successCallback();

		}.bind(this), errorCallback);
	},

	_loadMetadataI18n: function (successCallback, errorCallback) {

		this.serviceClient.loadLocalFiltersI18Metadata(function (i18nMetadata) {

			var groupsI18n = i18nMetadata.groups;
			var filtersI18n = i18nMetadata.filters;

			for (var i = 0; i < this.groups.length; i++) {
				this._applyGroupLocalization(this.groups[i], groupsI18n);
			}

			for (var j = 0; j < this.filters.length; j++) {
				this._applyFilterLocalization(this.filters[j], filtersI18n);
			}

			Log.info('Filters i18n metadata loaded');
			successCallback();

		}.bind(this), errorCallback);
	},

	_applyGroupLocalization: function (group, i18nMetadata) {
		var groupId = group.groupId;
		var localizations = i18nMetadata[groupId];
		if (localizations && Locale in localizations) {
			var localization = localizations[Locale];
			group.groupName = localization.name;
		}
	},

	_applyFilterLocalization: function (filter, i18nMetadata) {
		var filterId = filter.filterId;
		var localizations = i18nMetadata[filterId];
		if (localizations && Locale in localizations) {
			var localization = localizations[Locale];
			filter.name = localization.name;
			filter.description = localization.description;
		}
	}
};
/**
 * @param timeUpdatedString String in format 'yyyy-MM-dd'T'HH:mm:ssZ'
 * @returns timestamp from date string
 */
SubscriptionService.parseTimeUpdated = function (timeUpdatedString) {
    // https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Date/parse
    var timeUpdated = Date.parse(timeUpdatedString);
    if (isNaN(timeUpdated)) {
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/478
        timeUpdated = Date.parse(timeUpdatedString.replace(/\+(\d{2})(\d{2})$/, "+$1:$2"));
    }
    if (isNaN(timeUpdated)) {
        timeUpdated = new Date().getTime();
    }
    return timeUpdated;
};

var SubscriptionGroup = exports.SubscriptionGroup = function (groupId, groupName, displayNumber) {
	this.groupId = groupId;
	this.groupName = groupName;
	this.displayNumber = displayNumber;
};

/**
 * Create group from object
 * @param group Object
 * @param displayNumber Display order
 * @returns {SubscriptionGroup}
 */
SubscriptionGroup.fromJSON = function (group, displayNumber) {

	var groupId = group.groupId - 0;
	var defaultGroupName = group.groupName;

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
 * Create filter from object
 * @param filter Object
 * @param displayNumber Display order
 * @returns {SubscriptionFilter}
 */
SubscriptionFilter.fromJSON = function (filter, displayNumber) {

	var filterId = filter.filterId - 0;
	var groupId = filter.groupId - 0;
	var defaultName = filter.name;
	var defaultDescription = filter.description;
	var homepage = filter.homepage;
	var version = filter.version;
	var timeUpdated = SubscriptionService.parseTimeUpdated(filter.timeUpdated);
	var expires = filter.expires - 0;
	var subscriptionUrl = filter.subscriptionUrl;
	var languages = filter.languages;

	return new SubscriptionFilter(filterId, groupId, defaultName, defaultDescription, homepage, version, timeUpdated, displayNumber, languages, expires, subscriptionUrl);
};
