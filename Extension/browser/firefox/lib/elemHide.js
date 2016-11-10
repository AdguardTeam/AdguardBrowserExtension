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
/* global Ci, Services */

/**
 * This object manages CSS and JS rules.
 *
 * Depending on the user settings we can use one of the following ways:
 * 1. Registering browser-wide stylesheet
 * 2. Injecting CSS/JS with content-script/preload.js script
 */
var ElemHide = {

    collapsedClass: null,
    collapseStyle: null,
    nodesToCollapse: null,

    /**
     * Init ElemHide object
     */
    init: function () {

        this._registerCollapsedStyle();
        this._registerSelectorStyle();

        EventNotifier.addListener(function (event, settings) {
            switch (event) {
                case EventNotifierTypes.REQUEST_FILTER_UPDATED:
                    if (!this._isGlobalStyleSheetEnabled()) {
                        // Do nothing if global stylesheet is disabled
                        return;
                    }
                    this._saveStyleSheetToDisk();
                    break;
                case EventNotifierTypes.CHANGE_USER_SETTINGS:
                    if (settings === userSettings.settings.DISABLE_COLLECT_HITS) {
                        this.changeElemhideMethod(settings);
                    }
                    break;
                case EventNotifierTypes.CHANGE_PREFS:
                    if (settings === 'use_global_style_sheet') {
                        this.changeElemhideMethod(settings);
                    }
                    break;
            }
        }.bind(this));

        if (this._isGlobalStyleSheetEnabled()) {
            this._applyCssStyleSheet(FS.getInjectCssFileURI(), true);
        }
    },

    /**
     * Called if user settings or prefs have been changed.
     * In this case we check "Send statistics for ad filters usage" option value or "use_global_style_sheet" preference.
     * If this flag has been changed - switching CSS injection method.
     */
    changeElemhideMethod: function () {
        if (this._isGlobalStyleSheetEnabled()) {
            this._saveStyleSheetToDisk();
        } else {
            this._disableStyleSheet(FS.getInjectCssFileURI());
        }
    },

    /**
     * Unregister our stylesheet by it's uri
     *
     * @param uri Stylesheet URI
     * @private
     */
    _disableStyleSheet: function (uri) {
        if (styleService.sheetRegistered(uri)) {
            styleService.unloadUserSheetByUri(uri);
        }
    },

    /**
     * Returns true if we should register global style sheet
     */
    _isGlobalStyleSheetEnabled: function () {
        return userSettings.collectHitsCount() || Prefs.useGlobalStyleSheet;
    },

    /**
     * Collapses specified node.
     * This method is used from contentPolicy.js
     *
     * @param node Node
     */
    collapseNode: function (node) {
        if (Prefs.collapseByContentScript) {
            return;
        }

        if (this.nodesToCollapse) {
            this.nodesToCollapse.push(node);
        } else {
            this.nodesToCollapse = [node];
            ConcurrentUtils.runAsync(this._hideNodes, this);
        }
    },

    /**
     * Hides nodes from "nodesToCollapse" field
     *
     *
     * @private
     */
    _hideNodes: function () {

        var nodes = this.nodesToCollapse;
        this.nodesToCollapse = null;

        if (!nodes) {
            return;
        }

        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var parentNode = node.parentNode;
            if (parentNode && parentNode instanceof Ci.nsIDOMHTMLFrameSetElement) {
                // It's not that simple to collapse frame node without breaking page layout
                // We should also change the parent node.
                var hasCols = (parentNode.cols && parentNode.cols.indexOf(",") > 0);
                var hasRows = (parentNode.rows && parentNode.rows.indexOf(",") > 0);
                if ((hasCols || hasRows) && !(hasCols && hasRows)) {
                    var index = -1;
                    for (var frame = node; frame; frame = frame.previousSibling) {
                        if (frame instanceof Ci.nsIDOMHTMLFrameElement ||
                            frame instanceof Ci.nsIDOMHTMLFrameSetElement) {
                            index++;
                        }
                    }

                    var property = (hasCols ? "cols" : "rows");
                    var weights = parentNode[property].split(",");
                    weights[index] = "0";
                    parentNode[property] = weights.join(",");
                }
            } else {
                // Add "collapsedClass" to node's class list
                if (node.classList) {
                    node.classList.add(this.collapsedClass);
                }
            }
        }
    },

    /**
     * Registers style for collapsing page node.
     * @private
     */
    _registerCollapsedStyle: function () {
        var offset = "a".charCodeAt(0);
        this.collapsedClass = "";
        for (var i = 0; i < 20; i++) {
            this.collapsedClass += String.fromCharCode(offset + Math.random() * 26);
        }
        this.collapseStyle = Services.io.newURI("data:text/css," + encodeURIComponent("." + this.collapsedClass + "{-moz-binding: url(chrome://global/content/bindings/general.xml#dummy) !important;}"), null, null);
        this._applyCssStyleSheet(this.collapseStyle);
        Log.info("Adguard addon: Collapse style registered successfully");
    },

    /**
     * Registers "assistant" module style.
     * @private
     */
    _registerSelectorStyle: function () {
        this.selectorStyle = Services.io.newURI("data:text/css," + encodeURIComponent(adguard.extension.load('content/content-script/assistant/css/selector.css')), null, null);
        this._applyCssStyleSheet(this.selectorStyle);
        Log.info("Adguard addon: Selector style registered successfully");
    },

    /**
     * Saves CSS content built by CssFilter to file.
     * This file is then registered as browser-wide stylesheet.
     * @private
     */
    _saveStyleSheetToDisk: function () {
        ConcurrentUtils.runAsync(function () {
            var content = antiBannerService.getRequestFilter().getCssForStyleSheet();
            FS.saveStyleSheetToDisk(content, function () {
                this._applyCssStyleSheet(FS.getInjectCssFileURI());
            }.bind(this));
        }, this);
    },

    /**
     * Registers specified stylesheet
     * @param uri                   Stylesheet URI
     * @param needCheckFileExist    If true - check if file exists
     * @private
     */
    _applyCssStyleSheet: function (uri, needCheckFileExist) {
        try {
            if (uri) {
                if (needCheckFileExist) {
                    if (uri.file) {
                        var exists = uri.file.exists();
                        if (!exists) {
                            Log.info('Adguard addon: Css stylesheet cannot apply file: ' + uri.path + ' because file does not exist');
                            return;
                        }
                    }
                }
                //disable previous registered sheet
                if (styleService.sheetRegistered(uri)) {
                    styleService.unloadUserSheetByUri(uri);
                }
                //load new stylesheet
                styleService.loadUserSheetByUri(uri);
                Log.debug('styles hiding elements are successfully registered.');
            }
        } catch (ex) {
            Log.error('Error while register stylesheet ' + uri + ':' + ex);
        }
    }
};