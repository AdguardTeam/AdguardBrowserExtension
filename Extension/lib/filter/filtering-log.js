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

var FilteringLog = function () {
	this.tabsInfo = Object.create(null);
	this.openedFilteringLogsPage = 0;
};

FilteringLog.REQUESTS_SIZE_PER_TAB = 1000;

FilteringLog.prototype.tabsInfoCollection = function () {
	var result = [];
	for (var tabId in this.tabsInfo) {
		result.push(this.tabsInfo[tabId]);
	}
	return result;
};

FilteringLog.prototype.synchronizeOpenTabs = function (callback) {
	var openTabsCallback = function (tabs) {
		var tabsToRemove = this.tabsInfoCollection();
		for (var i = 0; i < tabs.length; i++) {
			var openTab = tabs[i];
			var tabInfo = this.tabsInfo[openTab.tabId];
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
	adguard.tabs.getAll(openTabsCallback);
};

FilteringLog.prototype.addTab = function (tab) {
	var tabInfo = this._updateTabInfo(tab);
	if (tabInfo) {
		EventNotifier.notifyListeners(LogEvents.TAB_ADDED, this.serializeTabInfo(tabInfo));
	}
};

FilteringLog.prototype.removeTab = function (tab) {
	var tabInfo = this.tabsInfo[tab.tabId];
	if (tabInfo) {
		EventNotifier.notifyListeners(LogEvents.TAB_CLOSE, this.serializeTabInfo(tabInfo));
	}
	delete this.tabsInfo[tab.tabId];
};

FilteringLog.prototype.updateTab = function (tab) {
	var tabInfo = this._updateTabInfo(tab);
	if (tabInfo) {
		EventNotifier.notifyListeners(LogEvents.TAB_UPDATE, this.serializeTabInfo(tabInfo));
	}
};

FilteringLog.prototype._updateTabInfo = function (tab) {
	var tabInfo = this.tabsInfo[tab.tabId] || Object.create(null);
	tabInfo.tabId = tab.tabId;
	tabInfo.tab = tab;
	tabInfo.isHttp = UrlUtils.isHttpRequest(tab.url);
	this.tabsInfo[tab.tabId] = tabInfo;
	return tabInfo;
};

FilteringLog.prototype.reloadTabById = function (tabId) {
	var tabInfo = this.tabsInfo[tabId];
	if (tabInfo) {
		adguard.tabs.reload(tabInfo.tabId);
	}
};

FilteringLog.prototype.getTabInfoById = function (tabId) {
	return this.tabsInfo[tabId];
};

FilteringLog.prototype.getTabFrameInfoById = function (tabId) {
	var tabInfo = this.getTabInfoById(tabId);
	return tabInfo ? framesMap.getFrameInfo(tabInfo.tab) : null;
};

FilteringLog.prototype.getTabInfo = function (tab) {
	var tabInfo = this.tabsInfo[tab.tabId];
	return this.serializeTabInfo(tabInfo);
};

FilteringLog.prototype.clearEventsForTab = function (tab) {
	var tabInfo = this.tabsInfo[tab.tabId];
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

	var tabInfo = this.tabsInfo[tab.tabId];
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
	if (this.openedFilteringLogsPage === 0) {
		//clear events
		var tabsInfo = this.tabsInfoCollection();
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

var filteringLog = new FilteringLog();