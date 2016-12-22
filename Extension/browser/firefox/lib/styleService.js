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

/* global Services, require */

var Cu = require('chrome').Cu;
Cu.import("resource://gre/modules/Services.jsm");

var self = require('sdk/self');

var Log = require('./utils/log').Log;
var styleService = require('./styleSheetService');

/**
 * This object manages CSS styles
 *
 * 1. Registering assistant style
 */
var StyleService = exports.StyleService = { // jshint ignore:line

    /**
     * Init StyleService object
     */
    init: function () {
        this._registerSelectorStyle();
    },

    /**
     * Registers "assistant" module style.
     * @private
     */
    _registerSelectorStyle: function () {
        var selectorStyle = Services.io.newURI("data:text/css," + encodeURIComponent(self.data.load('content/content-script/assistant/css/selector.css')), null, null);
        this._applyCssStyleSheet(selectorStyle);
        Log.info("Selector style registered successfully");
    },

    /**
     * Registers specified stylesheet
     * @param uri                   Stylesheet URI
     * @private
     */
    _applyCssStyleSheet: function (uri) {
        try {
            if (uri) {
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
