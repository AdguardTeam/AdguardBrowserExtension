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
 * Adapter for old versions of Firefox.
 * The same way ABP does it.
 */


var ConcurrentUtils = require('../lib/utils/browser-utils').ConcurrentUtils;
var {UiUtils, WindowObserver} = require('../lib/uiUtils');

var widgets = Object.create(null);

function getToolbox(window, widget) {

	if (!("defaultArea" in widget) || !widget.defaultArea) {
		return null;
	}

	var toolbar = window.document.getElementById(widget.defaultArea);
	if (!toolbar) {
		return null;
	}

	var toolbox = toolbar.toolbox;
	if (toolbox && ("palette" in toolbox) && toolbox.palette) {
		return toolbox;
	}

	return null;
}

function getToolbar(element) {

	for (var parent = element.parentNode; parent; parent = parent.parentNode) {
		if (parent.localName == "toolbar") {
			return parent;
		}
	}

	return null;
}

function getPaletteItem(toolbox, id) {

	var childs = toolbox.palette.children;
	for (var i = 0; i < childs.length; i++) {
		var child = childs[i];
		if (child.id == id) {
			return child;
		}
	}

	return null;
}

function restoreWidget(toolbox, widget) {

	var node = widget.onBuild(toolbox.ownerDocument);

	toolbox.palette.insertBefore(node, toolbox.palette.firstChild);

	var position = toolbox.getAttribute(widget.positionAttribute);
	if (!/^\S*,\S*,\S*$/.test(position)) {
		position = null;
	}

	if (position == null) {

		var toolbars = toolbox.externalToolbars.slice();
		for (var i = 0; i < toolbox.children.length; i++) {
			var child = toolbox.children[i];
			if (child.localName == "toolbar") {
				toolbars.push(child);
			}
		}

		for (var j = 0; j < toolbars.length; j++) {

			var toolbar = toolbars[j];

			var currentSet = toolbar.getAttribute("currentset");
			if (!currentSet) {
				continue
			}

			var items = currentSet.split(",");
			var index = items.indexOf(widget.id);
			if (index >= 0) {
				var before = (index + 1 < items.length ? items[index + 1] : "");
				position = "visible," + toolbar.id + "," + before;
				toolbox.setAttribute(widget.positionAttribute, position);
				toolbox.ownerDocument.persist(toolbox.id, widget.positionAttribute);
				break;
			}
		}
	}

	showWidget(toolbox, widget, position);
}

function showWidget(toolbox, widget, position) {

	var visible = "visible", parent = null, before = null;
	if (position) {
		[visible, parent, before] = position.split(",", 3);
		parent = toolbox.ownerDocument.getElementById(parent);
		if (before == "") {
			before = null;
		} else {
			before = toolbox.ownerDocument.getElementById(before);
		}
		if (before && before.parentNode != parent) {
			before = null;
		}
	}

	if (visible == "visible" && !parent) {
		var window = toolbox.ownerDocument.defaultView;
		parent = window.document.getElementById(widget.defaultArea);
	}

	if (parent && parent.localName != "toolbar") {
		parent = null;
	}

	if (visible != "visible") {
		var node = toolbox.ownerDocument.getElementById(widget.id);
		if (node) {
			toolbox.palette.appendChild(node);
		}
	} else if (parent) {
		var items = parent.currentSet.split(",");
		var index = (before ? items.indexOf(before.id) : -1);
		if (index < 0) {
			before = null;
		}
		parent.insertItem(widget.id, before, null, false);
	}

	saveState(toolbox, widget);
}

function removeWidget(window, widget) {
	var element = window.document.getElementById(widget.id);
	if (element) {
		element.parentNode.removeChild(element);
	}

	var toolbox = getToolbox(window, widget);
	if (toolbox) {
		var paletteItem = getPaletteItem(toolbox, widget.id);
		if (paletteItem) {
			paletteItem.parentNode.removeChild(paletteItem);
		}
	}
}

function afterToolbarCustomization(event) {
	var toolbox = event.currentTarget;
	for (var key in widgets) {
		var widget = widgets[key];
		saveState(toolbox, widget);
	}
}

function saveState(toolbox, widget) {

	var node = toolbox.ownerDocument.getElementById(widget.id);

	var position = toolbox.getAttribute(widget.positionAttribute) || "hidden,,";
	if (node && node.parentNode.localName != "toolbarpalette") {
		if (typeof widget.onAdded == "function") {
			widget.onAdded(node);
		}

		var toolbar = getToolbar(node);
		position = "visible," + toolbar.id + "," + (node.nextSibling ? node.nextSibling.id : "");
	} else {
		position = position.replace(/^visible,/, "hidden,");
	}

	toolbox.setAttribute(widget.positionAttribute, position);
	toolbox.ownerDocument.persist(toolbox.id, widget.positionAttribute);
}

var CustomizableUI = exports.CustomizableUI = {

	AREA_NAVBAR: "nav-bar",

	createWidget: function (widget) {

		this._initWindowObserver();

		widgets[widget.id] = widget;

		var windows = UiUtils.getBrowserWindows();
		for (var i = 0; i < windows.length; i++) {
			var window = windows[i];
			var toolbox = getToolbox(window, widget);
			if (toolbox) {
				toolbox.addEventListener("aftercustomization", afterToolbarCustomization, false);
				restoreWidget(toolbox, widget);
			}
		}
	},

	destroyWidget: function () {
		//already cleanup in WindowObserver
	},

	_initWindowObserver: function () {

		if (this.windowObserver) {
			return;
		}

		this.windowObserver = new WindowObserver({

			applyToWindow: function (window) {

				if (!UiUtils.isBrowserWindow(window)) {
					return;
				}

				for (var id in widgets) {
					var widget = widgets[id];
					var toolbox = getToolbox(window, widget);
					if (toolbox) {
						toolbox.addEventListener("aftercustomization", afterToolbarCustomization, false);
						ConcurrentUtils.runAsync(restoreWidget.bind(null, toolbox, widget));
					}
				}
			},

			removeFromWindow: function (window) {

				if (!UiUtils.isBrowserWindow(window)) {
					return;
				}

				for (var id in widgets) {
					var widget = widgets[id];
					var toolbox = getToolbox(window, widget);
					if (toolbox) {
						toolbox.removeEventListener("aftercustomization", afterToolbarCustomization, false);
					}
					removeWidget(window, widget);
				}
			}
		});
	}
};


