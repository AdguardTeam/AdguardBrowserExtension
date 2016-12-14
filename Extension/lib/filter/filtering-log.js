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

/* global require, exports */

var LogEvents = require('../../lib/utils/common').LogEvents;
var UrlUtils = require('../../lib/utils/url').UrlUtils;
var EventNotifier = require('../../lib/utils/notifier').EventNotifier;

var FilteringLog = exports.FilteringLog = function (BrowserTabsClass, framesMap, UI) {
	this.tabsInfo = new BrowserTabsClass();
	this.framesMap = framesMap;
	this.UI = UI;
	this.lastTabId = 1;
	this.openedFilteringLogsPage = 0;
};

FilteringLog.REQUESTS_SIZE_PER_TAB = 1000;

FilteringLog.prototype.synchronizeOpenTabs = function (callback) {
	var openTabsCallback = function (tabs) {
		var tabsToRemove = this.tabsInfo.collection().slice(0);
		for (var i = 0; i < tabs.length; i++) {
			var openTab = tabs[i];
			var tabInfo = this.tabsInfo.get(openTab);
			if (!tabInfo) {
				//add tab
				this.addTab(openTab);
			} else {
				//update tab
				this.updateTab(openTab);
			}
			var index = tabsToRemove.indexOf(tabInfo);
			if (index >= 0) {
				tabsToRemove.splice(index, 1);
			}
		}
		for (var j = 0; j < tabsToRemove.length; j++) {
			this.removeTab(tabsToRemove[j].tab);
		}
		if (callback) {
			callback();
		}
	}.bind(this);
	this.UI.getAllOpenedTabs(openTabsCallback);
};

FilteringLog.prototype.addTab = function (tab) {
	var tabInfo = this._updateTabInfo(tab);
	if (tabInfo) {
		EventNotifier.notifyListeners(LogEvents.TAB_ADDED, this.serializeTabInfo(tabInfo));
	}
};

FilteringLog.prototype.removeTab = function (tab) {
	var tabInfo = this.tabsInfo.get(tab);
	if (tabInfo) {
		EventNotifier.notifyListeners(LogEvents.TAB_CLOSE, this.serializeTabInfo(tabInfo));
	}
	this.tabsInfo.remove(tab);
};

FilteringLog.prototype.updateTab = function (tab) {
	var tabInfo = this._updateTabInfo(tab);
	if (tabInfo) {
		EventNotifier.notifyListeners(LogEvents.TAB_UPDATE, this.serializeTabInfo(tabInfo));
	}
};

FilteringLog.prototype._updateTabInfo = function (tab) {
	var tabInfo = this.tabsInfo.get(tab) || Object.create(null);
	if (!tabInfo.tabId) {
		tabInfo.tabId = this.lastTabId++;
	}
	tabInfo.tab = tab;
	tabInfo.isHttp = UrlUtils.isHttpRequest(tab.url);
	this.tabsInfo.set(tab, tabInfo);
	return tabInfo;
};

FilteringLog.prototype.reloadTabById = function (tabId) {
	var tabInfo = this.getTabInfoById(tabId);
	if (tabInfo) {
		tabInfo.tab.reload();
	}
};

FilteringLog.prototype.getTabInfoById = function (tabId) {
	var tabsInfo = this.tabsInfo.collection();
	for (var i = 0; i < tabsInfo.length; i++) {
		if (tabsInfo[i].tabId == tabId) {
			return tabsInfo[i];
		}
	}
	return null;
};

FilteringLog.prototype.getTabFrameInfoById = function (tabId) {
	var tabInfo = this.getTabInfoById(tabId);
	return tabInfo ? this.framesMap.getFrameInfo(tabInfo.tab) : null;
};

FilteringLog.prototype.getTabInfo = function (tab) {
	var tabInfo = this.tabsInfo.get(tab);
	return this.serializeTabInfo(tabInfo);
};

FilteringLog.prototype.clearEventsForTab = function (tab) {
	var tabInfo = this.tabsInfo.get(tab);
	if (!tabInfo) {
		return;
	}
	//remove previous events
	delete tabInfo.filteringEvents;
	EventNotifier.notifyListeners(LogEvents.TAB_RESET, this.serializeTabInfo(tabInfo));
};

FilteringLog.prototype.addEvent = function (tab, requestUrl, frameUrl, requestType, requestRule) {

	if (this.openedFilteringLogsPage === 0) {
		return;
	}

	var tabInfo = this.tabsInfo.get(tab);
	if (!tabInfo) {
		return;
	}

	if (!tabInfo.filteringEvents) {
		tabInfo.filteringEvents = [];
	}

	var requestDomain = UrlUtils.getDomainName(requestUrl);
	var frameDomain = UrlUtils.getDomainName(frameUrl);

	var filteringEvent = {
		requestUrl: requestUrl,
		requestDomain: requestDomain,
		frameUrl: frameUrl,
		frameDomain: frameDomain,
		requestType: requestType,
		requestThirdParty: UrlUtils.isThirdPartyRequest(requestUrl, frameUrl),
		requestRule: requestRule
	};
	if (requestRule) {
		filteringEvent.requestRule = Object.create(null);
		filteringEvent.requestRule.filterId = requestRule.filterId;
		filteringEvent.requestRule.ruleText = requestRule.ruleText;
		filteringEvent.requestRule.whiteListRule = requestRule.whiteListRule;
	}
	tabInfo.filteringEvents.push(filteringEvent);

	if (tabInfo.filteringEvents.length > FilteringLog.REQUESTS_SIZE_PER_TAB) {
		//don't remove first item, cause it's request to main frame
		tabInfo.filteringEvents.splice(1, 1);
	}

	EventNotifier.notifyListeners(LogEvents.EVENT_ADDED, this.serializeTabInfo(tabInfo), filteringEvent);
};

FilteringLog.prototype.clearEventsByTabId = function (tabId) {
	var tabInfo = this.getTabInfoById(tabId);
	if (tabInfo) {
		delete tabInfo.filteringEvents;
		EventNotifier.notifyListeners(LogEvents.TAB_RESET, this.serializeTabInfo(tabInfo));
	}
};

FilteringLog.prototype.onOpenFilteringLogPage = function () {
	this.openedFilteringLogsPage++;
};

FilteringLog.prototype.onCloseFilteringLogPage = function () {
	this.openedFilteringLogsPage = Math.max(this.openedFilteringLogsPage - 1, 0);
	if (this.openedFilteringLogsPage == 0) {
		//clear events
		var tabsInfo = this.tabsInfo.collection();
		for (var i = 0; i < tabsInfo.length; i++) {
			delete tabsInfo[i].filteringEvents;
		}
	}
};

FilteringLog.prototype.serializeTabInfo = function (tabInfo) {
	if (!tabInfo) {
		return null;
	}
	return {
		tabId: tabInfo.tabId,
		isHttp: tabInfo.isHttp,
		filteringEvents: tabInfo.filteringEvents,
		tab: {
			title: tabInfo.tab.title
		}
	};
};
