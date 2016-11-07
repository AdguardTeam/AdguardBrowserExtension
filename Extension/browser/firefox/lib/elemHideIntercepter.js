/* global XPCOMUtils */
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
const {Cu, Ci, Cr, Cc, components} = require('chrome');

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

var PrincipalService = Cc["@mozilla.org/systemprincipal;1"].getService(Ci.nsIPrincipal);

var unload = require('sdk/system/unload');

var filterRulesHitCount = require('./filter/filters-hit').filterRulesHitCount;

var ConcurrentUtils = require('./utils/browser-utils').ConcurrentUtils;
var Log = require('./utils/log').Log;
var FilterUtils = require('./utils/common').FilterUtils;
var WebRequestHelper = require('./contentPolicy').WebRequestHelper;

/**
 * Handler that intercepts requests to about:adg-intercept.
 * Read here for details: https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIAboutModule
 *
 * So this class intercepts requests to this about:adg-intercept and it replaces a channel with out implementation.
 * Inspired by ABP element hiding logic.
 */
var InterceptHandler = exports.InterceptHandler =
{
	classID: components.ID("{ca11cf5f-2b74-4959-b8c5-9202dd859963}"),
	classDescription: "Element hiding protocol handler",
	aboutPrefix: "adg-intercept",
	framesMap: null,

	/**
	 * Registers handler
	 */
	init: function (framesMap, antiBannerService) {
		this.framesMap = framesMap;
		this.antiBannerService = antiBannerService;

		var registrar = components.manager.QueryInterface(Ci.nsIComponentRegistrar);
		registrar.registerFactory(this.classID, this.classDescription, "@mozilla.org/network/protocol/about;1?what=" + this.aboutPrefix, this);

		unload.when(function () {
			var registrar = components.manager.QueryInterface(Ci.nsIComponentRegistrar);
			registrar.unregisterFactory(InterceptHandler.classID, InterceptHandler);
		}.bind(this));
	},

	getURIFlags: function (uri) {
		return ("HIDE_FROM_ABOUTABOUT" in Ci.nsIAboutModule ? Ci.nsIAboutModule.HIDE_FROM_ABOUTABOUT : 0);
	},

	createInstance: function (outer, iid) {
		if (outer != null) {
			throw Cr.NS_ERROR_NO_AGGREGATION;
        }

		return this.QueryInterface(iid);
	},

    newChannel: function (uri, loadInfo) {
        return new HidingChannel(uri, loadInfo, this.framesMap, this.antiBannerService);
    },

	QueryInterface: XPCOMUtils.generateQI([Ci.nsIFactory, Ci.nsIAboutModule])
};


function HidingChannel(uri, loadInfo, framesMap, antiBannerService) {
    this.URI = this.originalURI = uri;
    this.loadInfo = loadInfo;
    this.framesMap = framesMap;
    this.antiBannerService = antiBannerService;
}

/**
 * nsIChannel implementation which is able to hide elements blocked by CSS rules.
 * Inspired by ABP element hiding logic.
 */
HidingChannel.prototype = {

	URI: null,
	framesMap: null,
	antiBannerService: null,
	originalURI: null,
	contentCharset: "utf-8",
	contentLength: 0,
	contentType: "text/xml",
	owner: PrincipalService,
	securityInfo: null,
	notificationCallbacks: null,
	loadFlags: 0,
	loadGroup: null,
	name: null,
	status: Cr.NS_OK,
	notHideData: "<bindings xmlns='http://www.mozilla.org/xbl'><binding id='dummy' bindToUntrustedContent='true'/></bindings>",
	hideData: "<bindings xmlns='http://www.mozilla.org/xbl'/>",

	asyncOpen: function (listener, context) {
		var stream = this.open();
		ConcurrentUtils.runAsync(function () {
			try {
				listener.onStartRequest(this, context);
			} catch (e) {
				Log.error("Error call onStartRequest, cause: {0}", e);
			}
			try {
				listener.onDataAvailable(this, context, stream, 0, stream.available());
			} catch (e) {
				Log.error("Error call onDataAvailable, cause: {0}", e);
			}
			try {
				listener.onStopRequest(this, context, Cr.NS_OK);
			} catch (e) {
				Log.error("Error call onStopRequest, cause: {0}", e);
			}
		}, this);
	},

    asyncOpen2: function (listener) {
        if (this.loadInfo && !this.loadInfo.triggeringPrincipal.equals(PrincipalService)) {
            throw Cr.NS_ERROR_FAILURE;
        }
        this.asyncOpen(listener, null);
    },

	/**
	 * Important note:
	 * If 'Send Filters Statistics' is enabled, here and only here exception rules are applied.
	 *
	 * @returns {*|{}}
	 */
	open: function () {
		var data = this.notHideData;
		try {
			var tabId = WebRequestHelper.getTabIdForChannel(this);
			var tab = {tabId: tabId};

			if (!tabId
				|| this._isTabWhiteListed(tab)
				|| this._isElemHideWhiteListed(tab)) {
				// Return dummy binding if there is an exception rule for this URL
				data = this.notHideData;
			} else {
				// Return empty binding.
				// The element will be collapsed because of empty binding (it does not contain dummy element which is requested by the URL)
				data = this.hideData;

				var rule = this._getRuleByText(this.URI.path);
				if (rule) {
					var domain = this.framesMap.getFrameDomain(tab);
					if (!rule.isPermitted(domain)) {
						data = this.notHideData;
					}

					// Rules without domain should be ignored if there is a $generichide rule applied
					if (this._isGenericHideWhiteListed(tab) && rule.isGeneric()) {
						data = this.notHideData;
					}

					// Track filter rule usage if user has enabled "collect ad filters usage stats"
					if (filterRulesHitCount.collectStatsEnabled) {
						if (!FilterUtils.isUserFilterRule(rule) && !this.framesMap.isIncognitoTab(tab)) {
							filterRulesHitCount.addRuleHit(domain, rule.ruleText, rule.filterId);
						}
					}
				}
			}
		} finally {
			// Write response data to the stream
			var stream = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);
			stream.setData(data, data.length);
			return stream;
		}
	},

	_isTabWhiteListed: function (tab) {
		return (this.framesMap.isTabAdguardDetected(tab) || this.framesMap.isTabProtectionDisabled(tab) || this.framesMap.isTabWhiteListed(tab));
	},

	_isElemHideWhiteListed: function (tab) {
		var elemHideWhiteListRule = adguard.tabs.getTabMetadata(tab.tabId, 'elemHideWhiteListRule');
		if (elemHideWhiteListRule || elemHideWhiteListRule === false) {
			return elemHideWhiteListRule;
		}
		var frame = adguard.tabs.getTabFrame(tab.tabId);
		if (frame) {
			elemHideWhiteListRule = this.antiBannerService.getRequestFilter().findWhiteListRule(frame.url, frame.url, "ELEMHIDE");
			adguard.tabs.updateTabMetadata(tab.tabId, {
				elemHideWhiteListRule: elemHideWhiteListRule || false
			});
		}
	},

	_isGenericHideWhiteListed: function (tab) {
		var genericHideWhiteListRule = adguard.tabs.getTabMetadata(tab.tabId, 'genericHideWhiteListRule');
		if (genericHideWhiteListRule || genericHideWhiteListRule === false) {
			return genericHideWhiteListRule;
		}
		var frame = adguard.tabs.getTabFrame(tab.tabId);
		if (frame) {
			genericHideWhiteListRule = this.antiBannerService.getRequestFilter().findWhiteListRule(frame.url, frame.url, "GENERICHIDE");
			adguard.tabs.updateTabMetadata(tab.tabId, {
				genericHideWhiteListRule: genericHideWhiteListRule || false
			});
		}
	},

	_getRuleByText: function (path) {
		var index = path.lastIndexOf('?');
		if (index > 0) {
			var key = path.substring(index + 1);
			var rule = this.antiBannerService.getRequestFilter().cssFilter.getRuleForKey(key);
			return rule ? rule : null;
		}
		return null;
	},

	isPending: function () {
		return false;
	},
	cancel: function () {
		throw Cr.NS_ERROR_NOT_IMPLEMENTED;
	},
	suspend: function () {
		throw Cr.NS_ERROR_NOT_IMPLEMENTED;
	},
	resume: function () {
		throw Cr.NS_ERROR_NOT_IMPLEMENTED;
	},

	QueryInterface: XPCOMUtils.generateQI([Ci.nsIChannel, Ci.nsIRequest])
};
