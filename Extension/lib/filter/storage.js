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
var Log = require('utils/log').Log;
var FS = require('utils/file-storage').FS;
var FilterRule = require('filter/rules/base-filter-rule').FilterRule;

/**
 * This class manages file storage for filters.
 */
var FilterStorage = exports.FilterStorage = {

	FILE_PATH: "filters.ini",
	CSS_FILE_PATH: 'elementsHide.css',

	_loading: false,
	_cssSaving: false,

	/**
	 * Saves filter rules to file
	 *
	 * @param filterId      Filter identifier
	 * @param filterRules   Filter rules
	 * @param callback      Called when save operation is finished
	 */
	saveFilterRules: function (filterId, filterRules, callback) {
		var filePath = FilterStorage._getFilePath(filterId);
		FS.writeToFile(filePath, filterRules, function (e) {
			if (e) {
				Log.error("Error write filters to file {0} cause: {1}", filePath, FS.translateError(e));
			}
			if (callback) {
				callback();
			}
		});
	},

	/**
	 * Loads filter from the file storage
	 *
	 * @param filterId  Filter identifier
	 * @param callback  Called when file content has been loaded
	 */
	loadFilterRules: function (filterId, callback) {
		var filePath = FilterStorage._getFilePath(filterId);
		FS.readFromFile(filePath, function (e, rules) {
			if (e) {
				Log.error("Error read rules from file {0} cause: {1}", filePath, FS.translateError(e));
			}
			callback(rules);
		}.bind(this));
	},

	/**
	 * Saves CSS stylesheet to file.
	 *
	 * This method is used in Firefox extension only.
	 * If user has enabled "Send statistics for ad filters usage" option we change the way of applying CSS rules.
	 * In this case we register browser-wide stylesheet using StyleService.registerSheet.
	 * We should save it to file before registering the stylesheet.
	 *
	 * @param cssRules CSS file content
	 * @param callback Called when operation is finished
	 */
	saveStyleSheetToDisk: function (cssRules, callback) {
		if (this._cssSaving) {
			return;
		}
		this._cssSaving = true;

		var filePath = FilterStorage.CSS_FILE_PATH;

		FS.writeToFile(filePath, cssRules, function (e) {
			if (e && e.error) {
				Log.error("Error write css styleSheet to file {0} cause: {1}", filePath, FS.translateError(e.error));
				return;
			} else {
				callback();
			}
			this._cssSaving = false;
		}.bind(this));

	},

	/**
	 * Gets CSS file URI
	 *
	 * This method is used in Firefox extension only.
	 * If user has enabled "Send statistics for ad filters usage" option we change the way of applying CSS rules.
	 * In this case we register browser-wide stylesheet using StyleService.registerSheet.
	 * We should save it to file before registering the stylesheet.
	 *
	 * @returns CSS file URI
	 */
	getInjectCssFileURI: function () {
		if (!this.injectCssUrl) {
			this.injectCssUrl = FS.getFileInAdguardDirUri(this.CSS_FILE_PATH);
		}
		return this.injectCssUrl;
	},

	/**
	 * This method is deprecated, used in previous version until to 1.0.1.0
	 * TODO: Remove it
	 *
	 * @deprecated
	 * @param successCallback
	 */
	loadFromDisk: function (successCallback) {
		var filePath = FilterStorage.FILE_PATH;
		var parser = new FilterParser();
		FS.readFromFileWithListener(filePath, parser, function (e) {
			if (e) {
				Log.error("Error read filters from file {0} cause: {1}", filePath, FS.translateError(e));
			}
			successCallback(parser.antiBannerFilters || []);
		}.bind(this));
	},

	_getFilePath: function (filterId) {
		return "filterrules_" + filterId + ".txt";
	}
};

/**
 * Parser for filter files
 *
 * @constructor
 */
var FilterParser = function () {
	this.currentSection = null;
	this.currentFilter = null;
	this.currentRules = null;
	this.antiBannerFilters = [];
};

FilterParser.Sections = {
	FILTER_START: "[FILTER]",
	FILTER_END: "[/FILTER]",
	RULES_START: "[RULES]",
	RULES_END: "[/RULES]"
};

/**
 * Parses filter metadata
 * @param obj
 * @returns {{filterId: number}}
 */
FilterParser.fromObject = function (obj) {
	var antiBannerFilter = {
		filterId: obj.filterId - 0
	};
	antiBannerFilter.version = "0.0.0.0";
	if ("version" in obj) {
		antiBannerFilter.version = obj.version;
	}
	if ("lastUpdateTime" in obj) {
		antiBannerFilter.lastUpdateTime = obj.lastUpdateTime - 0;
	}
	if ("lastCheckTime"in obj) {
		antiBannerFilter.lastCheckTime = obj.lastCheckTime - 0;
	}
	antiBannerFilter.disabled = (obj.disabled == "true");
	return antiBannerFilter;
};

FilterParser.prototype = {

	process: function (line) {

		switch (line) {
			case FilterParser.Sections.FILTER_START:
				this.currentFilter = Object.create(null);
				this.currentSection = FilterParser.Sections.FILTER_START;
				break;
			case FilterParser.Sections.RULES_START:
				this.currentRules = [];
				this.currentSection = FilterParser.Sections.RULES_START;
				break;
			case FilterParser.Sections.FILTER_END:
				if (this.currentFilter) {
					var antiBannerFilter = FilterParser.fromObject(this.currentFilter);
					if (antiBannerFilter != null) {
						antiBannerFilter.filterRules = this.currentRules;
						this.antiBannerFilters.push(antiBannerFilter);
					}
				}
				this.currentFilter = null;
				this.currentRules = null;
				this.currentSection = null;
				break;
			case FilterParser.Sections.RULES_END:
				//do nothing
				break;
			default :
				switch (this.currentSection) {
					case FilterParser.Sections.FILTER_START:
						if (line && this.currentFilter) {
							var match = /^(\w+)=(.*)$/.exec(line);
							this.currentFilter[match[1]] = match[2];
						}
						break;
					case FilterParser.Sections.RULES_START:
						if (line && this.currentRules) {
							var rule = FilterRule.createRule(line, this.currentFilter.filterId - 0);
							if (rule != null) {
								this.currentRules.push(rule);
							}
						}
						break;
				}
		}
	}
};