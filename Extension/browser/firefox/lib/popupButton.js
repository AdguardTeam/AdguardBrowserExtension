/* global Cu, Cc, Ci, Services, unload, ConcurrentUtils, WorkaroundUtils */

var toolbarButtonWidget = (function () {

    var widget = {
        id: 'adguard-button',
        type: 'view',
        viewId: 'adguard-panel',
        label: 'Adguard',
        tooltiptext: 'Adguard'
    };

    // Only useful for views; a function that will be invoked when a user shows your view. (source: CustomizableUI.jsm)
    widget.onViewShowing = function (event) {
        var iframe = event.target.firstChild;
        iframe.setAttribute('src', adguard.extension.url('content/popup.html'));
    };

    // Only useful for views; a function that will be invoked when a user hides your view. (source: CustomizableUI.jsm)
    widget.onViewHiding = function (event) {
        var panel = event.target;
        var iframe = panel.firstChild;
        panel.parentNode.style.maxWidth = '';
        iframe.setAttribute('src', 'about:blank');
    };

    // Custom function. Updates button icon
    widget.updateIconState = function (win, options) {
        var button = win.document.getElementById(this.id);
        if (!button) {
            return;
        }
        if (options.disabled) {
            button.classList.remove('enabled');
            button.classList.remove('adguardDetected');
        } else if (options.adguardDetected) {
            button.classList.remove('enabled');
            button.classList.add('adguardDetected');
        } else {
            button.classList.add('enabled');
            button.classList.remove('adguardDetected');
        }
    };

    // Custom function. Updates button badge text
    widget.updateBadgeText = function (win, badge) {
        var button = win.document.getElementById(this.id);
        if (!button) {
            return;
        }
        button.setAttribute('badge', badge || '');
    };

    // Custom function. Resizes panel and iframe
    widget.resizePopup = function (win, width, height) {

        var panel = win.document.getElementById(this.viewId);
        if (!panel) {
            return;
        }
        var iframe = panel.firstChild;
        if (!iframe) {
            return;
        }

        panel.parentNode.style.maxWidth = 'none';

        iframe.style.width = width + 'px';
        iframe.style.height = height + 'px';

        panel.style.width = (width + panel.boxObject.width - panel.clientWidth) + 'px';
        panel.style.height = (height + panel.boxObject.height - panel.clientHeight) + 'px';
    };

    // Custom function. Closes popup
    widget.closePopup = function (win) {
        var panel = win.document.getElementById(this.viewId);
        if (panel) {
            panel.hidePopup();
        }
    };

    // Custom function. Append iframe to panel
    widget.populatePanel = function (doc, panel) {

        panel.setAttribute('id', this.viewId);

        var iframe = doc.createElement('iframe');
        iframe.setAttribute('type', 'content');

        panel.appendChild(iframe);

        var onPopupReady = function () {

            var win = this.contentWindow;

            if (!win || win.location.host !== location.host) {
                return;
            }

            if (typeof widget.onBeforePopupReady === 'function') {
                widget.onBeforePopupReady.call(this);
            }
        };

        iframe.addEventListener('load', onPopupReady, true);
    };

    return widget;

})();

/**
 * Legacy toolbar button (CustomizableUI.jsm isn't present)
 */
(function (widget) {

    var CustomizableUI = null;
    try {
        CustomizableUI = Cu.import('resource:///modules/CustomizableUI.jsm', null).CustomizableUI;
    } catch (ex) {
    }
    if (CustomizableUI !== null) {
        return;
    }

    Log.info('Adguard addon: Initializing legacy toolbar button');

    function forEach(items, callback) {
        for (var i = 0; i < items.length; i++) {
            if (callback(items[i]) === false) {
                break;
            }
        }
    }

    function findToolbox(document) {
        return document.getElementById('navigator-toolbox'); // || document.getElementById('mail-toolbox');
    }

    var createToolbarButton = function (window) {

        var document = window.document;

        var button = document.createElement('toolbarbutton');
        button.setAttribute('id', widget.id);
        // type = panel would be more accurate, but doesn't look as good
        button.setAttribute('type', 'menu');
        button.setAttribute('removable', 'true');
        button.setAttribute('class', 'toolbarbutton-1 chromeclass-toolbar-additional legacy-badge');
        button.setAttribute('label', widget.label);
        button.setAttribute('tooltiptext', widget.label);

        var panel = document.createElement('panel');
        widget.populatePanel(document, panel);
        panel.addEventListener('popupshowing', widget.onViewShowing);
        panel.addEventListener('popuphiding', widget.onViewHiding);
        button.appendChild(panel);

        return button;
    };

    var styleSheetService = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);

    var styleSheetUri = null;

    function canAddToolbarButton(window) {
        var document = window.document;
        if (!document || document.readyState !== 'complete' || document.getElementById('nav-bar') === null) {
            return false;
        }
        var toolbox = findToolbox(document);
        return toolbox !== null && !!toolbox.palette;
    }

    function addToolbarButtonAndRegisterStyle(window) {

        if (styleSheetUri === null) {

            styleSheetUri = Services.io.newURI(adguard.extension.url('content/skin/badge.css'), null, null);

            // Register global so it works in all windows, including palette
            if (!styleSheetService.sheetRegistered(styleSheetUri, styleSheetService.AUTHOR_SHEET)) {
                styleSheetService.loadAndRegisterSheet(styleSheetUri, styleSheetService.AUTHOR_SHEET);
            }
        }

        var document = window.document;
        if (document.getElementById(widget.id) !== null) {
            return;
        }

        var toolbox = findToolbox(document);
        if (!toolbox) {
            return;
        }

        var toolbarButton = createToolbarButton(window);

        // https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XUL/toolbarpalette
        var palette = toolbox.palette;
        if (palette && palette.querySelector('#' + widget.id) === null) {
            palette.appendChild(toolbarButton);
        }

        // Pale Moon: `toolbox.externalToolbars` can be undefined in Pale Moon
        var toolbars = toolbox.externalToolbars ? toolbox.externalToolbars.slice() : [];
        forEach(toolbox.children, function (child) {
            if (child.localName === 'toolbar') {
                toolbars.push(child);
            }
        });

        forEach(toolbars, function (toolbar) {
            var currentsetString = toolbar.getAttribute('currentset');
            if (!currentsetString) {
                return;
            }
            var currentset = currentsetString.split(/\s*,\s*/);
            var index = currentset.indexOf(widget.id);
            if (index === -1) {
                return;
            }
            // toolbar.insertItem is undefined in Pale Moon
            if (typeof toolbar.insertItem !== 'function') {
                return;
            }
            var before = null;
            for (var i = index + 1; i < currentset.length; i++) {
                before = toolbar.querySelector('[id="' + currentset[i] + '"]');
                if (before !== null) {
                    break;
                }
            }
            // https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XUL/Method/insertItem
            toolbar.insertItem(widget.id, before);
            return false;
        });

        // We are done if our toolbar button is already installed in one of the toolbar.
        if (palette !== null && toolbarButton.parentElement !== palette) {
            return;
        }

        // Try to locate button
        var navbar = document.getElementById('nav-bar');
        if (navbar !== null) {
            // Find a child customizable palette, if any.
            navbar = navbar.querySelector('.customization-target') || navbar;
            navbar.appendChild(toolbarButton);
            navbar.setAttribute('currentset', navbar.currentSet);
            document.persist(navbar.id, 'currentset');
        }
    }

    var shutdown = function () {

        adguard.windows.forEach(function (win, domWin) {
            var button = domWin.document.getElementById(widget.id);
            if (button && button.parentNode) {
                button.parentNode.removeChild(button);
            }
        });

        if (styleSheetUri !== null) {
            if (styleSheetService.sheetRegistered(styleSheetUri, styleSheetService.AUTHOR_SHEET)) {
                styleSheetService.unregisterSheet(styleSheetUri, styleSheetService.AUTHOR_SHEET);
            }
            styleSheetUri = null;
        }
    };

    function attachToNewWindow(win) {
        ConcurrentUtils.retryUntil(
            canAddToolbarButton.bind(null, win),
            addToolbarButtonAndRegisterStyle.bind(null, win)
        );
    }

    widget.init = function () {
        adguard.windows.forEach(function (win, domWin) {
            attachToNewWindow(domWin);
        });
        adguard.windows.onUpdated.addListener(function (win, domWin, event) {
            if (event === 'ChromeWindowLoad') {
                attachToNewWindow(domWin);
            }
        });
        unload.when(shutdown);
    };

})(toolbarButtonWidget);

/**
 * Default toolbar button (CustomizableUI.jsm is present)
 */
(function (widget) {

    var CustomizableUI = null;
    try {
        CustomizableUI = Cu.import('resource:///modules/CustomizableUI.jsm', null).CustomizableUI;
    } catch (ex) {
    }
    if (CustomizableUI === null) {
        return;
    }

    Log.info('Adguard addon: Initializing default toolbar button');

    var badgeClassName = 'badged-button'; // default class for badge
    if (Services.vc.compare(Services.appinfo.platformVersion, '36.0') < 0) {
        badgeClassName = 'legacy-badge'; // legacy class for badge
    }

    widget.CustomizableUI = CustomizableUI;
    // https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/CustomizableUI.jsm#Areas
    widget.defaultArea = CustomizableUI.AREA_NAVBAR;

    var Listeners = {};

    var badgeStyle = [
        'background-color: #555;',
        'border-radius: 2px;',
        'color: #FFFFFF;',
        'font-size: 8px;',
        'line-height: 12px;',
        'text-align: center;',
        'min-width: 12px;',
        'background: -moz-linear-gradient(top, #555 0%, #000000 100%);'
    ].join('');

    var updateBadgeStyle = function () {
        adguard.windows.forEach(function (win, domWin) {
            var button = domWin.document.getElementById(widget.id);
            if (!button) {
                return;
            }
            var badge = button.ownerDocument.getAnonymousElementByAttribute(
                button,
                'class',
                'toolbarbutton-badge'
            );
            if (!badge) {
                return;
            }
            badge.style.cssText = badgeStyle;
        });
    };

    var updateBadge = function () {

        var widgetId = widget.id;
        var buttonInPanel = CustomizableUI.getWidget(widgetId).areaType === CustomizableUI.TYPE_MENU_PANEL;

        adguard.windows.forEach(function (win, domWin) {
            var button = domWin.document.getElementById(widgetId);
            if (!button) {
                return;
            }
            if (buttonInPanel) {
                button.classList.remove(badgeClassName);
                return;
            }
            button.classList.add(badgeClassName);
        });

        if (buttonInPanel) {
            return;
        }

        // Anonymous elements need some time to be reachable
        setTimeout(updateBadgeStyle, 250);

    }.bind(Listeners);

    // https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/CustomizableUI.jsm#Listeners
    Listeners.onCustomizeEnd = updateBadge;
    Listeners.onWidgetAdded = updateBadge;
    Listeners.onWidgetUnderflow = updateBadge;

    var styleURI = null;

    // https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/CustomizableUI.jsm/API-provided_widgets#Event_handlers
    widget.onBeforeCreated = function (doc) {

        var panel = doc.createElement('panelview');

        this.populatePanel(doc, panel);

        doc.getElementById('PanelUI-multiView').appendChild(panel);

        doc.defaultView.QueryInterface(Ci.nsIInterfaceRequestor)
            .getInterface(Ci.nsIDOMWindowUtils)
            .loadSheet(styleURI, 1);
    };

    // https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/CustomizableUI.jsm/API-provided_widgets#Event_handlers
    widget.onCreated = function (button) {
        button.setAttribute('badge', '');
        setTimeout(updateBadge, 250);
    };

    widget.onBeforePopupReady = function () {
        try {
            // Add `portrait` class if width is constrained.
            this.contentDocument.body.classList.toggle('portrait', CustomizableUI.getWidget(widget.id).areaType === CustomizableUI.TYPE_MENU_PANEL);
        } catch (ex) {
        }
    };

    widget.closePopup = function (win) {
        var panel = win.document.getElementById(widget.viewId);
        if (panel) {
            CustomizableUI.hidePanelForNode(panel);
        }
    };

    widget.init = function () {

        CustomizableUI.addListener(Listeners);

        styleURI = Services.io.newURI(
            'data:text/css,' + encodeURIComponent(adguard.extension.load('content/skin/badge.css')),
            null,
            null
        );

        CustomizableUI.createWidget(this);

        unload.when(shutdown);
    };

    function shutdown() {

        adguard.windows.forEach(function (win, domWin) {
            var panel = domWin.document.getElementById(widget.viewId);
            if (panel && panel.parentNode) {
                panel.parentNode.removeChild(panel);
            }
            domWin.QueryInterface(Ci.nsIInterfaceRequestor)
                .getInterface(Ci.nsIDOMWindowUtils)
                .removeSheet(styleURI, 1);
        });

        CustomizableUI.removeListener(Listeners);
        CustomizableUI.destroyWidget(widget.id);
    }

})(toolbarButtonWidget);

var PopupButton = (function (widget) {

    var init = function () {
        if (typeof widget.init === 'function') {
            widget.init();
        }
    };

    var resizePopup = function (width, height) {
        if (typeof widget.resizePopup === 'function') {
            var win = adguard.winWatcher.getCurrentBrowserWindow();
            if (win) {
                widget.resizePopup(win, width, height);
            }
        }
    };

    var closePopup = function () {
        if (typeof widget.closePopup === 'function') {
            var win = adguard.winWatcher.getCurrentBrowserWindow();
            if (win) {
                widget.closePopup(win);
            }
        }
    };

    var updateBadgeText = function (blocked) {
        if (typeof widget.updateBadgeText === 'function') {
            var win = adguard.winWatcher.getCurrentBrowserWindow();
            if (win) {
                widget.updateBadgeText(win, WorkaroundUtils.getBlockedCountText(blocked));
            }
        }
    };

    var updateIconState = function (options) {
        if (typeof widget.updateIconState === 'function') {
            var win = adguard.winWatcher.getCurrentBrowserWindow();
            if (win) {
                widget.updateIconState(win, options);
            }
        }
    };

    return {
        init: init,
        resizePopup: resizePopup,
        closePopup: closePopup,
        updateBadgeText: updateBadgeText,
        updateIconState: updateIconState
    };

})(toolbarButtonWidget);