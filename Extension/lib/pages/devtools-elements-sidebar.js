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
/* global chrome */

(function () {
    var debug = function (message) {
        console.log(message);
        var div = document.getElementById("debugDiv");
        if (div) {
            div.innerHTML += message;
            div.innerHTML += '<br/>';
        }
    };

    var initPanel = function () {
        debug('Initializing panel..');

        chrome.devtools.panels.elements.onSelectionChanged.addListener(function () {
            getSelectedElement(function (result) {
                updatePanel(result);
            });
        });

        bindEvents();

        debug('Initializing panel..finished');
    };

    var updatePanel = function (selectedElement) {
        debug('Updating panel..');
        debug('Selected element:');
        debug(selectedElement);

        updatePanelElements(selectedElement);
        updateFilterRuleInput(selectedElement);
    };

    var bindEvents = function () {
        document.getElementById("preview-rule-button").addEventListener("click", function (e) {
            e.preventDefault();

            debug('Preview');

            getSelectedElement(function (selectedElement) {
                var selector = AdguardRulesConstructorLib.constructCssSelector(selectedElement);
                debug(selector);

                //var style = document.createElement("style");
                //style.setAttribute("type", "text/css");
                //settings.lastPreview = style;
                //
                //var head = document.getElementsByTagName('head')[0];
                //if (head) {
                //    style.appendChild(document.createTextNode(selector + " {display: none !important;}"));
                //    head.appendChild(style);
                //}
            });
        });

        document.getElementById("add-rule-button").addEventListener("click", function (e) {
            e.preventDefault();

            debug('Add rule clicked');

            //if (settings.lastPreview == null) {
            //    return;
            //}
            //
            //var head = document.getElementsByTagName("head")[0];
            //if (head) {
            //    head.removeChild(settings.lastPreview);
            //}
            //
            //settings.lastPreview = null;
            //
            var ruleText = document.getElementById("filter-rule-text").value;
            debug(ruleText);
            //TODO: Send rule to background page
            //contentPage.sendMessage({type: 'addUserRule', ruleText: ruleText}, function () {
            //    closeAssistant();
            //});
        });
    };

    var getSelectedElement = function (callback) {
        /**
         * Only serializable data can be passed in callback function
         */
        var serializeElement = function (node) {
            if (!node || !node.tagName) {
                return '';
            }

            if (node.outerHTML) {
                return node.outerHTML;
            }

            // polyfill:
            var wrapper = document.createElement('div');
            wrapper.appendChild(node.cloneNode(true));
            return wrapper.innerHTML;
        };

        var deserializeElement = function (html) {
            var wrapper = document.createElement('div');
            wrapper.innerHTML = html;
            return wrapper.firstChild;
        };

        chrome.devtools.inspectedWindow.eval("(" + serializeElement.toString() + ")($0)", function (result, exceptionInfo) {
            if (exceptionInfo) {
                debug(exceptionInfo);
            }

            callback(deserializeElement(result));
        });
    };

    var updatePanelElements = function (element) {
        //TODO: Set panel elements
    };

    var updateFilterRuleInput = function (element) {
        var options = {
            isBlockByUrl: false,
            isBlockSimilar: false,
            isBlockOneDomain: true
        };

        var ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
        debug(ruleText);
        document.getElementById("filter-rule-text").value = ruleText;
    };

    document.addEventListener('DOMContentLoaded', function () {
        initPanel();
    });
})();


