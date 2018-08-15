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
 * Object that contains info about every browser tab.
 */
adguard.frames = (function (adguard) {

	'use strict';

	/**
	 * Adds frame to map. This method is called on first document request.
	 * If this is a main frame - saves this info in frame data.
	 *
	 * @param tab       Tab object
	 * @param frameId   Frame ID
	 * @param url       Page URL
	 * @param type      Request content type (UrlFilterRule.contentTypes)
	 * @returns Frame data
	 */
	var recordFrame = function (tab, frameId, url, type) {

		var frame = adguard.tabs.getTabFrame(tab.tabId, frameId);

		var previousUrl = '';
		if (type === adguard.RequestTypes.DOCUMENT) {
			adguard.tabs.clearTabFrames(tab.tabId);
			adguard.tabs.clearTabMetadata(tab.tabId);
			if (frame) {
				previousUrl = frame.url;
			}
		}

		adguard.tabs.recordTabFrame(tab.tabId, frameId, url, adguard.utils.url.getDomainName(url));

		if (type === adguard.RequestTypes.DOCUMENT) {
			adguard.tabs.updateTabMetadata(tab.tabId, {previousUrl: previousUrl});
			reloadFrameData(tab);
		}
	};

	/**
	 * Gets frame URL
	 *
	 * @param tab       Tab
	 * @param frameId   Frame ID
	 * @returns Frame URL
	 */
	var getFrameUrl = function (tab, frameId) {
		var frame = adguard.tabs.getTabFrame(tab.tabId, frameId);
		return frame ? frame.url : null;
	};

	/**
	 * Gets main frame URL
	 *
	 * @param tab    Tab
	 * @returns Frame URL
	 */
	var getMainFrameUrl = function (tab) {
		return getFrameUrl(tab, adguard.MAIN_FRAME_ID);
	};

	/**
	 * Gets frame Domain
	 *
	 * @param tab       Tab
	 * @returns Frame Domain
	 */
	var getFrameDomain = function (tab) {
		var frame = adguard.tabs.getTabFrame(tab.tabId, 0);
		return frame ? frame.domainName : null;
	};

	/**
	 * @param tab Tab
	 * @returns true if Tab have white list rule
	 */
	var isTabWhiteListed = function (tab) {
		var frameWhiteListRule = adguard.tabs.getTabMetadata(tab.tabId, 'frameWhiteListRule');
		return frameWhiteListRule && frameWhiteListRule.isDocumentWhiteList();
	};

	/**
	 * @param tab Tab
	 * @returns true if Tab have white list rule and white list isn't invert
	 */
	var isTabWhiteListedForSafebrowsing = function (tab) {
		return isTabWhiteListed(tab) && adguard.whitelist.isDefaultMode();
	};

	/**
	 * @param tab Tab
	 * @returns true if protection is paused
	 */
	var isTabProtectionDisabled = function (tab) {
		return adguard.tabs.getTabMetadata(tab.tabId, 'applicationFilteringDisabled');
	};

	/**
	 * Returns true if Adguard for Windows/Android/Mac is detected in this tab.
	 *
	 * @param tab   Tab
	 * @returns true if Adguard for Windows/Android/Mac is detected
	 */
	var isTabAdguardDetected = function (tab) {
		return adguard.integration.isEnabled() && adguard.tabs.getTabMetadata(tab.tabId, 'adguardDetected');
	};

	/**
	 * Returns true if Adguard for Windows/Android/Mac is detected in this tab and tab in white list
	 *
	 * @param tab Tab
	 * @returns true if Adguard for Windows/Android/Mac is detected and tab in white list
	 */
	var isTabAdguardWhiteListed = function (tab) {
		var adguardDetected = isTabAdguardDetected(tab);
		var adguardDocumentWhiteListed = adguard.tabs.getTabMetadata(tab.tabId, 'adguardDocumentWhiteListed');
		return adguardDetected && adguardDocumentWhiteListed;
	};

	/**
	 * @param tab   Tab
	 * @returns Adguard whitelist rule in user filter associated with this tab
	 */
	var getTabAdguardUserWhiteListRule = function (tab) {
		var adguardDetected = isTabAdguardDetected(tab);
		var adguardUserWhiteListed = adguard.tabs.getTabMetadata(tab.tabId, 'adguardUserWhiteListed');
		if (adguardDetected && adguardUserWhiteListed) {
			return adguard.tabs.getTabMetadata(tab.tabId, 'adguardWhiteListRule');
		}
		return null;
	};

	/**
	 * Update tab info if Adguard for Windows/Android/Mac is detected
	 *
	 * @param tab                   Tab
	 * @param adguardDetected       True if Adguard detected
	 * @param documentWhiteListed   True if Tab whitelisted by Adguard rule
	 * @param userWhiteListed       True if Adguard whitelist rule in user filter
	 * @param headerWhiteListRule   Adguard whitelist rule object
	 * @param adguardProductName    Adguard product name
	 * @param adguardRemoveRuleNotSupported True if Adguard Api not supported remove rule
	 */
	var recordAdguardIntegrationForTab = function (tab, adguardDetected, documentWhiteListed, userWhiteListed, headerWhiteListRule, adguardProductName, adguardRemoveRuleNotSupported) {
		adguard.tabs.updateTabMetadata(tab.tabId, {
			adguardDetected: adguardDetected,
			adguardDocumentWhiteListed: documentWhiteListed,
			adguardUserWhiteListed: userWhiteListed,
			adguardWhiteListRule: headerWhiteListRule,
			adguardProductName: adguardProductName,
			adguardRemoveRuleNotSupported: adguardRemoveRuleNotSupported
		});
	};

	/**
	 * Gets whitelist rule for the specified tab
	 * @param tab Tab to check
	 * @returns whitelist rule applied to that tab (if any)
	 */
	var getFrameWhiteListRule = function (tab) {
		return adguard.tabs.getTabMetadata(tab.tabId, 'frameWhiteListRule');
	};

	/**
	 * Reloads tab data (checks whitelist and filtering status)
	 *
	 * @param tab Tab to reload
	 */
	var reloadFrameData = function (tab) {
		var frame = adguard.tabs.getTabFrame(tab.tabId, 0);
		if (frame) {
			var applicationFilteringDisabled = adguard.settings.isFilteringDisabled();
			var frameWhiteListRule = null;
			if (!applicationFilteringDisabled) {
				var url = frame.url;
				frameWhiteListRule = adguard.whitelist.findWhiteListRule(url);
				if (!frameWhiteListRule) {
					frameWhiteListRule = adguard.requestFilter.findWhiteListRule(url, url, adguard.RequestTypes.DOCUMENT);
				}
			}
			adguard.tabs.updateTabMetadata(tab.tabId, {
				frameWhiteListRule: frameWhiteListRule,
				applicationFilteringDisabled: applicationFilteringDisabled
			});
		}
	};

	/**
	 * Attach referrer url to the tab's main frame object.
	 * This referrer is then used on safebrowsing "Access Denied" for proper "Go Back" behavior.
	 *
	 * @param tab Tab
	 * @param referrerUrl Referrer to record
	 */
	var recordFrameReferrerHeader = function (tab, referrerUrl) {
		adguard.tabs.updateTabMetadata(tab.tabId, {referrerUrl: referrerUrl});
	};

	/**
	 * Gets main frame data
	 *
	 * @param tab Tab
	 * @returns frame data
	 */
	var getFrameInfo = function (tab) {

		var tabId = tab.tabId;
		var frame = adguard.tabs.getTabFrame(tabId);

		var url = tab.url;
		if (!url && frame) {
			url = frame.url;
		}

		var urlFilteringDisabled = !adguard.utils.url.isHttpRequest(url);
		var applicationFilteringDisabled;
		var documentWhiteListed = false;
		var userWhiteListed = false;
		var canAddRemoveRule = false;
		var frameRule;

		var adguardDetected = isTabAdguardDetected(tab);
		var adguardProductName = '';

		if (!urlFilteringDisabled) {

			if (adguardDetected) {

				adguardProductName = adguard.tabs.getTabMetadata(tabId, 'adguardProductName');

				documentWhiteListed = adguard.tabs.getTabMetadata(tabId, 'adguardDocumentWhiteListed');
				userWhiteListed = adguard.tabs.getTabMetadata(tabId, 'adguardUserWhiteListed');
				canAddRemoveRule = !adguard.tabs.getTabMetadata(tabId, 'adguardRemoveRuleNotSupported') && !(documentWhiteListed && !userWhiteListed);
				applicationFilteringDisabled = false;

				var adguardWhiteListRule = adguard.tabs.getTabMetadata(tabId, 'adguardWhiteListRule');
				if (adguardWhiteListRule) {
					frameRule = {
						filterId: adguard.utils.filters.WHITE_LIST_FILTER_ID,
						ruleText: adguardWhiteListRule.ruleText
					};
				}

			} else {

				applicationFilteringDisabled = adguard.tabs.getTabMetadata(tabId, 'applicationFilteringDisabled');

				documentWhiteListed = isTabWhiteListed(tab);
				if (documentWhiteListed) {
					var rule = getFrameWhiteListRule(tab);
					userWhiteListed = adguard.utils.filters.isWhiteListFilterRule(rule) || adguard.utils.filters.isUserFilterRule(rule);
					frameRule = {
						filterId: rule.filterId,
						ruleText: rule.ruleText
					};
				}
				// It means site in exception
				canAddRemoveRule = !(documentWhiteListed && !userWhiteListed);
			}
		}

		var totalBlockedTab = adguard.tabs.getTabMetadata(tabId, 'blocked') || 0;
		var totalBlocked = adguard.pageStats.getTotalBlocked();

		return {

			url: url,

			applicationFilteringDisabled: applicationFilteringDisabled,
			urlFilteringDisabled: urlFilteringDisabled,

			documentWhiteListed: documentWhiteListed,
			userWhiteListed: userWhiteListed,
			canAddRemoveRule: canAddRemoveRule,
			frameRule: frameRule,

			adguardDetected: adguardDetected,
			adguardProductName: adguardProductName,

			totalBlockedTab: totalBlockedTab || 0,
			totalBlocked: totalBlocked || 0
		};
	};

	/**
	 * Update count of blocked requests
	 *
	 * @param tab - Tab
	 * @param blocked - count of blocked requests
	 * @returns  updated count of blocked requests
	 */
	var updateBlockedAdsCount = function (tab, blocked) {

		adguard.pageStats.updateTotalBlocked(blocked);

		blocked = (adguard.tabs.getTabMetadata(tab.tabId, 'blocked') || 0) + blocked;
		adguard.tabs.updateTabMetadata(tab.tabId, {blocked: blocked});

		return blocked;
	};

	/**
	 * Reset count of blocked requests for tab or overall stats
	 * @param tab - Tab (optional)
	 */
	var resetBlockedAdsCount = function (tab) {
		if (tab) {
			adguard.tabs.updateTabMetadata(tab.tabId, {blocked: 0});
		} else {
			adguard.pageStats.resetStats();
		}
	};

	/**
	 * Is tab in incognito mode?
	 * @param tab Tab
	 */
	var isIncognitoTab = function (tab) {
		return adguard.tabs.isIncognito(tab.tabId);
	};

	// Records frames on application initialization
	adguard.listeners.addListener(function (event) {
		if (event === adguard.listeners.APPLICATION_INITIALIZED) {
			adguard.tabs.forEach(function (tab) {
				recordFrame(tab, 0, tab.url, adguard.RequestTypes.DOCUMENT);
			});
		}
	});

	return {
		recordFrame: recordFrame,
		getFrameUrl: getFrameUrl,
		getMainFrameUrl: getMainFrameUrl,
		getFrameDomain: getFrameDomain,
		isTabWhiteListed: isTabWhiteListed,
		isTabWhiteListedForSafebrowsing: isTabWhiteListedForSafebrowsing,
		isTabProtectionDisabled: isTabProtectionDisabled,
		isTabAdguardDetected: isTabAdguardDetected,
		isTabAdguardWhiteListed: isTabAdguardWhiteListed,
		getTabAdguardUserWhiteListRule: getTabAdguardUserWhiteListRule,
		recordAdguardIntegrationForTab: recordAdguardIntegrationForTab,
		getFrameWhiteListRule: getFrameWhiteListRule,
		reloadFrameData: reloadFrameData,
		recordFrameReferrerHeader: recordFrameReferrerHeader,
		getFrameInfo: getFrameInfo,
		updateBlockedAdsCount: updateBlockedAdsCount,
		resetBlockedAdsCount: resetBlockedAdsCount,
		isIncognitoTab: isIncognitoTab
	};

})(adguard);