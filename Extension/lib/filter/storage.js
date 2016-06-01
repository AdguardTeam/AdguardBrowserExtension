/* global require, exports */
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
var Log = require('../../lib/utils/log').Log;
var RulesStorage = require('../../lib/utils/rules-storage').RulesStorage;
var FS = require('../../lib/utils/file-storage').FS;
var FilterRuleBuilder = require('../../lib/filter/rules/filter-rule-builder').FilterRuleBuilder;

/**
 * This class manages file storage for filters.
 */
var FilterStorage = exports.FilterStorage = {

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
		RulesStorage.write(filePath, filterRules, function (e) {
			if (e) {
				Log.error("Error writing filters to file {0}. Cause: {1}", filePath, e);
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
		RulesStorage.read(filePath, function (e, rules) {
			if (e) {
				Log.error("Error while reading rules from file {0} cause: {1}", filePath, e);
			}
			callback(rules);
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
	if ("lastCheckTime" in obj) {
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
					if (antiBannerFilter !== null) {
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
							var rule = FilterRuleBuilder.createRule(line, this.currentFilter.filterId - 0);
							if (rule !== null) {
								this.currentRules.push(rule);
							}
						}
						break;
				}
		}
	}
};