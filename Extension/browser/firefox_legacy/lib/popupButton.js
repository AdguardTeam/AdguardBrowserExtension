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
var {Cu, Cc, Ci} = require('chrome');

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

var versionChecker = Cc["@mozilla.org/xpcom/version-comparator;1"].getService(Ci.nsIVersionComparator);

var self = require('sdk/self');
var system = require('sdk/system');
var unload = require('sdk/system/unload');

var {WindowObserver} = require('./uiUtils');
var WorkaroundUtils = require('./utils/workaround').WorkaroundUtils;

function findEl(id, element) {
	for (var i = 0; i < element.children.length; i++) {
		var child = element.children[i];
		if (child.getAttribute('id') == id) {
			return child;
		}
	}
	return null;
}

function getElInCurrentWindow(id) {
	var win = adguard.winWatcher.getCurrentBrowserWindow();
	return win && win.document.getElementById(id);
}

/**
 * Object that manages toolbar button rendering.
 */
var PopupButton = exports.PopupButton = {

	nodesToRemove: [],

	TOOLBAR_BUTTON_ID: "adguard-toolbarbutton",
	TOOLBAR_DROPDOWN_ID: "adguard-toolbardropdown",
	TOOLBAR_FRAME_ID: "adguard-toolbarframe",

	init: function (UI, SdkButton) {

		this.UI = UI;

		this.handlePopupState = this.handlePopupState.bind(this);

		this.windowObserver = new WindowObserver(this);

		this.addToolbarButton();
	},

	closePopup: function () {
		var toolbarDropdown = getElInCurrentWindow(PopupButton.TOOLBAR_DROPDOWN_ID);
		if (toolbarDropdown) {
			toolbarDropdown.hidePopup();
		}
	},

	resizePopup: function (width, height) {
		var toolbarFrame = getElInCurrentWindow(PopupButton.TOOLBAR_FRAME_ID);
		if (toolbarFrame) {
			toolbarFrame.style.width = width + "px";
			toolbarFrame.style.height = height + "px";
		}
	},

	addToolbarButton: function () {

		this.CustomizableUI = null;
		try {
			this.CustomizableUI = Cu.import("resource:///modules/CustomizableUI.jsm").CustomizableUI;
		} catch (e) {
			// No built-in CustomizableUI API, use our own implementation.
			this.CustomizableUI = require('./customizableUI').CustomizableUI;
		}

		var window = adguard.winWatcher.getCurrentBrowserWindow();
		var version = "";
		if (versionChecker.compare(system.version, "29.0") < 0) {
			version = "version-28";
		}
		var platform = "";
		if (window.navigator.platform.indexOf("Mac") == 0) {
			platform = "mac";
		} else if (window.navigator.platform.indexOf("Linux") == 0) {
			platform = "linux";
		}

		var options = {

			id: PopupButton.TOOLBAR_BUTTON_ID,
			type: 'custom',
			positionAttribute: "adguard-toolbarbutton-position",
			defaultArea: this.CustomizableUI.AREA_NAVBAR,
			removable: true,

			onBuild: function (doc) {

				var toolbarItem = doc.createElement("toolbarbutton");
				toolbarItem.setAttribute("id", PopupButton.TOOLBAR_BUTTON_ID);
				toolbarItem.setAttribute("class", "toolbarbutton-1 " + (version ? version : "") + " " + (platform ? platform : ""));
				toolbarItem.setAttribute("label", "Adguard");

				var toolbarPopup = doc.createElement("menupopup");
				toolbarPopup.setAttribute("id", PopupButton.TOOLBAR_DROPDOWN_ID);
				toolbarPopup.setAttribute("position", "after_end");
				toolbarPopup.setAttribute("placespopup", "true");
				toolbarItem.appendChild(toolbarPopup);

				toolbarItem.setAttribute("adguardRootNode", true);

				return toolbarItem;
			}
		};

		this.CustomizableUI.createWidget(options);

		// Cleanup on unload
		unload.when(function () {
			this.CustomizableUI.destroyWidget(this.TOOLBAR_BUTTON_ID);
		}.bind(this));
	},

	applyToWindow: function (window) {
		var isCustomizeToolbarWindow = window.document.documentElement.id == "CustomizeToolbarWindow";
		if (!isCustomizeToolbarWindow) {
			return;
		}

		var doc = window.document;

		PopupButton.insertStyle(doc, 'chrome://adguard/content/skin/overlay.css');

		window.addEventListener("popupshowing", this.onPopupShowing, false);
		window.addEventListener("popupshown", this.handlePopupState, false);
		window.addEventListener("popuphidden", this.handlePopupState, false);
	},

	removeFromWindow: function (window) {
		var isCustomizeToolbarWindow = window.document.documentElement.id == "CustomizeToolbarWindow";
		if (!isCustomizeToolbarWindow) {
			return;
		}

		function getElements(el) {
			return Array.slice(el.querySelectorAll("[adguardRootNode]"));
		}

		[getElements(window.document), getElements(window.gNavToolbox.palette), PopupButton.nodesToRemove].forEach(function (list) {
			for (var i = 0; i < list.length; i++) {
				var el = list[i];
				if (el && el.parentNode)
					el.parentNode.removeChild(el);
			}
		});

		window.removeEventListener("popupshowing", this.onPopupShowing, false);
		window.removeEventListener("popupshown", this.handlePopupState, false);
		window.removeEventListener("popuphidden", this.handlePopupState, false);
	},

	onPopupShowing: function (event) {

		var dropdown = event.originalTarget;

		if (dropdown.getAttribute("id") == PopupButton.TOOLBAR_DROPDOWN_ID) {

			var ifr = findEl(PopupButton.TOOLBAR_FRAME_ID, dropdown);
			if (ifr) {
				dropdown.removeChild(ifr);
			}
			ifr = dropdown.ownerDocument.createElement("iframe");
			ifr.type = "content";
			ifr.setAttribute('src', 'chrome://adguard/content/popup.html');
			ifr.style.width = "320px";
			ifr.style.height = "244px";
			ifr.id = PopupButton.TOOLBAR_FRAME_ID;
			dropdown.appendChild(ifr);
		}
	},

	handlePopupState: function (event) {
		var dropdown = event.originalTarget;
		if (dropdown.getAttribute("id") == PopupButton.TOOLBAR_DROPDOWN_ID) {
			var button = getElInCurrentWindow(PopupButton.TOOLBAR_BUTTON_ID);
			if (!button) {
				return;
			}
			if (event.type == "popupshown") {
				button.setAttribute("open", true);
			} else {
				button.removeAttribute("open");
				this.UI.updateCurrentTabButtonState();
			}
		}
	},

	updateBadgeText: function (blocked) {
		var toolbarButton = getElInCurrentWindow(PopupButton.TOOLBAR_BUTTON_ID);
		if (!toolbarButton) {
			return;
		}

		var blockedText = WorkaroundUtils.getBlockedCountText(blocked);

		if (!blockedText) {
			toolbarButton.removeAttribute('showBlocked');
		} else {
			toolbarButton.setAttribute('showBlocked', 'true');
		}
		toolbarButton.setAttribute('countBlocked', blockedText);
	},

	updateIconState: function (options) {
		var toolbarButton = getElInCurrentWindow(PopupButton.TOOLBAR_BUTTON_ID);
		if (toolbarButton) {
			if (options.disabled) {
				toolbarButton.removeAttribute('enabled');
				toolbarButton.removeAttribute('adguardDetected');
			} else if (options.adguardDetected) {
				toolbarButton.removeAttribute('enabled');
				toolbarButton.setAttribute('adguardDetected', 'true');
			} else {
				toolbarButton.setAttribute('enabled', 'true');
				toolbarButton.removeAttribute('adguardDetected');
			}
		}
	},

	insertStyle: function (doc, stylePath) {
		var style = doc.createProcessingInstruction("xml-stylesheet", 'href="' + stylePath + '" type="text/css"');
		doc.insertBefore(style, doc.firstChild);
		PopupButton.nodesToRemove.push(style);
	}
};
