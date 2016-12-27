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

/* global WeakMap */

// https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XUL/PopupGuide/Extensions#Modifying_the_context_menu
// http://kb.mozillazine.org/Adding_items_to_menus

adguard.contextMenus = (function (adguard) {

    'use strict';

    var menuWidget = (function () {

        function noop() {
        }

        var widget = {
            populated: false,
            contextMenuProperties: [],
            removeContextMenu: noop,
            canCreateContextMenu: noop,
            createContextMenu: noop
        };

        widget.insertContextMenuToWindow = function (win) {
            adguard.utils.concurrent.retryUntil(
                widget.canCreateContextMenu.bind(null, win),
                widget.createContextMenu.bind(null, win)
            );
        };

        widget.updateProperties = function (properties) {
            this.contextMenuProperties.push(properties);
        };

        widget.clearProperties = function () {
            this.contextMenuProperties = [];
            this.populated = false;
        };

        widget.init = function () {

            adguard.windowsImpl.onUpdated.addListener(function (adgWin, domWin, event) {
                if (event === 'ChromeWindowLoad') {
                    widget.insertContextMenuToWindow(domWin);
                }
            });

            adguard.windowsImpl.onRemoved.addListener(function (windowId, domWin) {
                widget.removeContextMenu(domWin);
            });

            adguard.windowsImpl.forEachNative(function (domWin) {
                widget.insertContextMenuToWindow(domWin);
            });

            adguard.unload.when(function () {
                adguard.windowsImpl.forEachNative(function (domWin) {
                    widget.removeContextMenu(domWin);
                });
            });
        };

        return widget;

    })();

    (function (adguard, widget) {

        if (adguard.prefs.mobile) {
            return;
        }

        var CONTENT_AREA_CONTEXT_MENU = 'contentAreaContextMenu';
        var MENU_ITEM_ATTR = 'adguard-menu-item';

        var MENU_ITEM = 'menuitem';
        var MENU_ITEM_MENU = 'menu';
        var MENU_ITEM_POPUP = 'menupopup';

        function getMenuItems(doc, type) {
            if (type) {
                return doc.querySelectorAll('[' + MENU_ITEM_ATTR + '="' + type + '"]');
            } else {
                return doc.querySelectorAll('[' + MENU_ITEM_ATTR + ']');
            }
        }

        /**
         * Returns context for element
         */
        function getElementContext(gContextMenu) {
            var contexts = [];
            if (gContextMenu.onImage) {
                return 'image';
            } else if (gContextMenu.onAudio) {
                return 'audio';
            } else if (gContextMenu.onLink) {
                return 'video';
            }

            return contexts;
        }

        function updateItemsVisibility(doc, gContextMenu) {

            // Check context
            for (var i = 0; i < widget.contextMenuProperties.length; i++) {
                var prop = widget.contextMenuProperties[i];
                var item = prop.title ? doc.getElementById(prop.title) : null;
                if (!item) {
                    continue;
                }
                if (prop.contexts && prop.contexts.indexOf('all') < 0) {
                    var context = getElementContext(gContextMenu);
                    if (prop.contexts.indexOf(context) < 0) {
                        item.setAttribute('hidden', 'true');
                        continue;
                    }
                }
                item.removeAttribute('hidden');
            }
        }

        function onCommand() {

            var itemId = this.id; // jshint ignore:line
            var properties = widget.contextMenuProperties.find(function (prop) {
                return prop.title == itemId;
            });
            if (properties && typeof properties.onclick === 'function') {
                properties.onclick();
            }
        }

        function populate(doc, contextMenu) {

            var mainMenu = getMenuItems(contextMenu, MENU_ITEM_MENU)[0];

            // Remove menu if empty
            if (widget.contextMenuProperties.length === 0) {
                if (mainMenu) {
                    mainMenu.parentNode.removeChild(mainMenu);
                }
                return;
            }

            if (!mainMenu) {
                mainMenu = doc.createElement('menu');
                mainMenu.setAttribute(MENU_ITEM_ATTR, MENU_ITEM_MENU);
                mainMenu.setAttribute('label', 'Adguard');
                mainMenu.setAttribute('class', 'addon-context-menu-item addon-context-menu-item-toplevel menu-iconic');
                mainMenu.setAttribute('image', adguard.prefs.ICONS.ICON_GREEN['16']);
                contextMenu.appendChild(mainMenu);
            }

            var mainMenuPopup = getMenuItems(contextMenu, MENU_ITEM_POPUP)[0];
            if (!mainMenuPopup) {
                mainMenuPopup = doc.createElement('menupopup');
                mainMenuPopup.setAttribute(MENU_ITEM_ATTR, MENU_ITEM_POPUP);
                mainMenu.appendChild(mainMenuPopup);
            }

            var subMenus = Object.create(null);

            for (var i = 0; i < widget.contextMenuProperties.length; i++) {

                var prop = widget.contextMenuProperties[i];
                var item;

                if ('id' in prop) {

                    // It's sub-menu
                    item = doc.createElement('menu');

                    // Create popup for this sub-menu
                    var subMenuPopup = doc.createElement('menupopup');
                    subMenuPopup.setAttribute(MENU_ITEM_ATTR, MENU_ITEM);

                    item.appendChild(subMenuPopup);
                    subMenus[prop.id] = subMenuPopup;

                } else if (prop.type === 'separator') {
                    item = doc.createElement('menuseparator');
                } else {
                    item = doc.createElement('menuitem');
                    if (prop.enabled === false) {
                        item.setAttribute('hidden', true);
                    }
                    item.addEventListener('command', onCommand);
                }

                item.setAttribute(MENU_ITEM_ATTR, MENU_ITEM);
                item.setAttribute('class', 'addon-context-menu-item');

                if (prop.type !== 'separator') {
                    item.setAttribute('id', prop.title);
                    item.setAttribute('label', prop.title);
                }

                if ('parentId' in prop) {
                    subMenus[prop.parentId].appendChild(item);
                } else {
                    mainMenuPopup.appendChild(item);
                }
            }
        }

        function onContextMenuMenuShowing(e) {

            var doc = e.target.ownerDocument;
            var gContextMenu = doc.defaultView.gContextMenu;
            if (!gContextMenu || !gContextMenu.browser) {
                return;
            }

            if (e.target.getAttribute(MENU_ITEM_ATTR)) {
                return;
            }

            var contextMenu = doc.getElementById(CONTENT_AREA_CONTEXT_MENU);
            if (!contextMenu) {
                return;
            }

            if (widget.populated) {
                updateItemsVisibility(doc, gContextMenu);
                return;
            }

            removeMenuItems(contextMenu, MENU_ITEM);
            populate(doc, contextMenu);
            updateItemsVisibility(doc, gContextMenu);

            widget.populated = true;
        }

        function removeMenuItems(doc, type) {
            var items = getMenuItems(doc, type);
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                if (item.parentNode) {
                    item.parentNode.removeChild(item);
                }
                item.removeEventListener('command', onCommand);
            }
        }

        widget.canCreateContextMenu = function (win) {
            return win && win.document.readyState === 'complete';
        };

        widget.createContextMenu = function (win) {

            if (!widget.canCreateContextMenu(win)) {
                return;
            }

            var contextMenu = win.document.getElementById(CONTENT_AREA_CONTEXT_MENU);
            if (contextMenu === null) {
                return;
            }
            contextMenu.addEventListener('popupshowing', onContextMenuMenuShowing);
        };

        widget.removeContextMenu = function (win) {

            var contextMenu = win.document.getElementById(CONTENT_AREA_CONTEXT_MENU);
            if (contextMenu) {
                contextMenu.removeEventListener('popupshowing', onContextMenuMenuShowing);
            }
            removeMenuItems(win.document);
        };

    })(adguard, menuWidget);

    /**
     * Context menu mobile implementation
     */
    (function (adguard, widget) {

        if (!adguard.prefs.mobile) {
            return;
        }

        var mobilMenuItemsMap = new WeakMap();

        function populate(win) {

            if (mobilMenuItemsMap.has(win)) {
                widget.removeContextMenu(win);
            }

            if (widget.contextMenuProperties.length === 0) {
                return;
            }

            var menuId = win.NativeWindow.menu.add({
                name: "Adguard",
                icon: null
            });
            mobilMenuItemsMap.set(win, menuId);

            for (var i = 0; i < widget.contextMenuProperties.length; i++) {
                var prop = widget.contextMenuProperties[i];
                if (prop.type === 'separator') {
                    continue;
                }
                var options = {
                    name: prop.title,
                    icon: null,
                    parent: menuId,
                    visible: true
                };
                if ('checked' in prop) {
                    options.checked = prop.checked;
                }
                if ('checkable' in prop) {
                    options.checkable = prop.checkable;
                }
                if (typeof prop.onclick === 'function') {
                    options.callback = prop.onclick;
                }
                win.NativeWindow.menu.add(options);
            }
        }

        widget.canCreateContextMenu = function (win) {
            return !!win.NativeWindow;
        };

        /**
         * @param win
         */
        widget.createContextMenu = function (win) {
            if (widget.populated) {
                return;
            }
            populate(win);
            widget.populated = true;
        };

        /**
         * @param win
         */
        widget.removeContextMenu = function (win) {
            var menuId = mobilMenuItemsMap.get(win);
            if (menuId) {
                win.NativeWindow.menu.remove(menuId);
                mobilMenuItemsMap.delete(win);
            }
        };

        widget.render = function () {
            adguard.windowsImpl.getLastFocused(function (winId, win) {
                widget.insertContextMenuToWindow(win);
            });
        };

    })(adguard, menuWidget);

    /**
     * Clear context menu items
     */
    var removeAll = function () {
        if (menuWidget && typeof menuWidget.clearProperties === 'function') {
            menuWidget.clearProperties();
        }
    };

    /**
     * Updates context menu items
     * @param properties
     */
    var create = function (properties) {
        if (menuWidget && typeof menuWidget.updateProperties === 'function') {
            menuWidget.updateProperties(properties);
        }
    };

    /**
     * Render context menu
     */
    var render = function () {
        if (menuWidget && typeof menuWidget.render === 'function') {
            menuWidget.render();
        }
    };

    menuWidget.init();

    return {
        removeAll: removeAll,
        create: create,
        render: render
    };

})(adguard);
