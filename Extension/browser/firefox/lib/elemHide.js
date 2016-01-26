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
var {Cc, Ci, Cu} = require('chrome');

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/FileUtils.jsm");

var self = require('sdk/self');

var {EventNotifier} = require('./utils/notifier');
let {FilterStorage} = require('./filter/storage');
var {EventNotifierTypes} = require('./utils/common');
var {ConcurrentUtils} = require('./utils/browser-utils');
var {Log} = require('./utils/log');
var {userSettings} = require('./utils/user-settings');
var {WorkaroundUtils} = require('./utils/workaround');
var {UrlUtils} = require('./utils/url');
var Prefs = require('./prefs').Prefs;
var styleService = require('./styleSheetService');

/**
 * This object manages CSS and JS rules.
 *
 * Depending on the user settings we can use one of the following ways:
 * 1. Registering browser-wide stylesheet
 * 2. Injecting CSS/JS with content-script/preload.js script
 */
var ElemHide = exports.ElemHide = {

    collapsedClass: null,
    collapseStyle: null,
    nodesToCollapse: null,

    /**
     * Init ElemHide object
     */
    init: function (framesMap, antiBannerService, webRequestService) {

        this.framesMap = framesMap;
        this.antiBannerService = antiBannerService;
        this.webRequestService = webRequestService;

        this._registerCollapsedStyle();
        this._registerSelectorStyle();

        EventNotifier.addListener(function (event, settings) {
            switch (event) {
                case EventNotifierTypes.REQUEST_FILTER_UPDATED:
                    if (!userSettings.collectHitsCount()) {
                        // "Send statistics for ad filters usage" option is disabled
                        // Do nothing in this case
                        return;
                    }
                    this._saveStyleSheetToDisk();
                    break;
                case EventNotifierTypes.CHANGE_USER_SETTINGS:
                    this.changeElemhideMethod(settings);
                    break;
            }
        }.bind(this));

        if (userSettings.collectHitsCount()) {
            this._applyCssStyleSheet(FilterStorage.getInjectCssFileURI(), true);
        }
    },

    /**
     * Called if user settings have been changed.
     * In this case we check "Send statistics for ad filters usage" option value.
     * If this flag has been changed - switching CSS injection method.
     *
     * @param settings
     */
    changeElemhideMethod: function (settings) {
        if (settings != userSettings.settings.DISABLE_COLLECT_HITS) {
            return;
        }
        var enableCss = userSettings.collectHitsCount();
        if (enableCss) {
            this._saveStyleSheetToDisk();
        } else {
            this._disableStyleSheet(FilterStorage.getInjectCssFileURI());
        }
    },

    /**
     * Unregister our stylesheet by it's uri
     *
     * @param uri Stylesheet URI
     * @private
     */
    _disableStyleSheet: function (uri) {
        styleService.unloadUserSheetByUri(uri);
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
        Log.info("Collapse style registered successfully");
    },

    /**
     * Registers "assistant" module style.
     * @private
     */
    _registerSelectorStyle: function () {
        this.selectorStyle = Services.io.newURI("data:text/css," + encodeURIComponent(self.data.load('content/content-script/assistant/css/selector.css')), null, null);
        this._applyCssStyleSheet(this.selectorStyle);
        Log.info("Selector style registered successfully");
    },

    /**
     * Saves CSS content built by CssFilter to file.
     * This file is then registered as browser-wide stylesheet.
     * @private
     */
    _saveStyleSheetToDisk: function () {
        ConcurrentUtils.runAsync(function () {
            var content = this.antiBannerService.getRequestFilter().getCssForStyleSheet();
            FilterStorage.saveStyleSheetToDisk(content, function () {
                this._applyCssStyleSheet(FilterStorage.getInjectCssFileURI());
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
                        var existed = uri.file.exists();
                        if (!existed) {
                            Log.info('Css stylesheet does not apply file: ' + uri.path + ' because file does not exist');
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
                Log.debug('styles hiding elements are successfully registered.')
            }
        } catch (ex) {
            Log.error('Error while register stylesheet ' + uri + ':' + ex);
        }
    }
};
