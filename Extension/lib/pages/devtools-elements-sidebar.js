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

(function ($) {
    var debug = function (message) {
        console.log(message);
        var div = document.getElementById("debugDiv");
        if (div) {
            div.innerHTML += message;
            div.innerHTML += '<br/>';
        }
    };

    var initPanel = function () {
        chrome.devtools.panels.elements.onSelectionChanged.addListener(function () {
            getSelectedElement(function (result) {
                updatePanel(result);
            });
        });

        bindEvents();
    };

    var updatePanel = function (selectedElement) {
        debug('Updating panel..');
        debug('Selected element:');
        debug(selectedElement);

        var info = AdguardRulesConstructorLib.getElementInfo(selectedElement);

        updatePanelElements(info);
        updateFilterRuleInput(selectedElement, info);
    };

    var bindEvents = function () {
        document.getElementById("preview-rule-button").addEventListener("click", function (e) {
            e.preventDefault();

            getSelectedElement(function (selectedElement) {
                previewElement(selectedElement);
            });

            //TODO: Add an ability to remove preview
        });

        document.getElementById("add-rule-button").addEventListener("click", function (e) {
            e.preventDefault();

            getSelectedElement(function (selectedElement) {
                addRuleForElement(selectedElement);
            });
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

    var updatePanelElements = function (info) {
        handleShowBlockSettings(info.haveUrlBlockParameter, info.haveClassAttribute);
        setupAttributesInfo(info);
    };

    var handleShowBlockSettings = function (showBlockByUrl, showBlockSimilar) {
        if (showBlockByUrl) {
            $('#block-by-url-checkbox-block').show();
        } else {
            $('#block-by-url-checkbox').get(0).checked = false;
            $('#block-by-url-checkbox-block').hide();
        }
        if (showBlockSimilar) {
            $('#block-similar-checkbox-block').show();
        } else {
            $('#block-similar-checkbox').get(0).checked = false;
            $('#block-similar-checkbox-block').hide();
        }
    };

    var setupAttributesInfo = function (info) {
        //TODO: Setup attributes elements
    };

    var getInspectedPageUrl = function () {
        //TODO: Get inspected page url
        return 'test.com';
    };

    var updateFilterRuleInput = function (element, info) {
        var isBlockByUrl = $('#block-by-url-checkbox').get(0).checked;
        var isBlockSimilar = $("#block-similar-checkbox").get(0).checked;
        var isBlockOneDomain = $("#one-domain-checkbox").get(0).checked;
        var url = getInspectedPageUrl();

        var options = {
            isBlockByUrl: isBlockByUrl,
            urlMask: info.urlBlockAttributeValue,
            isBlockSimilar : isBlockSimilar,
            isBlockOneDomain: isBlockOneDomain,
            url: url
        };

        debug(options);

        var ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
        if (ruleText) {
            document.getElementById("filter-rule-text").value = ruleText;
        } else {
            debug('Error creating rule for:' + element);
        }
    };

    var previewElement = function (element) {
        var selector = AdguardRulesConstructorLib.constructCssSelector(element);

        var togglePreview = function (selector) {
            var style = document.createElement("style");
            style.setAttribute("type", "text/css");

            var head = document.getElementsByTagName('head')[0];
            if (head) {
                style.appendChild(document.createTextNode(selector + " {display: none !important;}"));
                head.appendChild(style);
            }
        };

        chrome.devtools.inspectedWindow.eval("(" + togglePreview.toString() + ")('" + selector + "')", function (result, exceptionInfo) {
            if (exceptionInfo) {
                debug(exceptionInfo);
            }
        });
    };

    var addRuleForElement = function (element) {
        //if (window.lastPreview) {
        //    removePreview();
        //}

        var ruleText = document.getElementById("filter-rule-text").value;

        var addRule = function (ruleText) {
            contentPage.sendMessage({type: 'addUserRule', ruleText: ruleText});
        };

        chrome.devtools.inspectedWindow.eval("(" + addRule.toString() + ")('" + ruleText + "')", {
            useContentScriptContext: true
        }, function (result, exceptionInfo) {
            if (exceptionInfo) {
                debug(exceptionInfo);
            }

            previewElement(element);
        });
    };

    var removePreview = function () {
        //  var hidePreview = function () {
        //  var head = document.getElementsByTagName("head")[0];
        //  if (head) {
        //        head.removeChild(window.lastPreview);
        //  }
        //};

        //chrome.devtools.inspectedWindow.eval("(" + hidePreview.toString() + ")()", function (result, exceptionInfo) {
        //    if (exceptionInfo) {
        //        debug(exceptionInfo);
        //    }
        //});
    };


    document.addEventListener('DOMContentLoaded', function () {
        initPanel();
    });

})(balalaika);


