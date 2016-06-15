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
    };

    var initPanel = function () {
        initElements();

        chrome.devtools.panels.elements.onSelectionChanged.addListener(function () {
            getSelectedElement(function (result) {
                if (!result) {
                    return;
                }

                window.selectedElement = result;
                window.selectedElementInfo = AdguardRulesConstructorLib.getElementInfo(result);

                updateRule();
                updatePanelElements();
            });
        });

        bindEvents();
    };

    var initElements = function () {
        $('#block-by-url-checkbox').get(0).checked = false;
        $('#block-similar-checkbox').get(0).checked = false;
        $('#one-domain-checkbox').get(0).checked = false;

        $("#filter-rule-text").get(0).value = '';

        var placeholder = document.getElementById("attributes-block");
        while (placeholder.firstChild) {
            placeholder.removeChild(placeholder.firstChild);
        }
    };

    var updateRule = function () {
        getInspectedPageUrl(function(res) {
            updateFilterRuleInput(window.selectedElement, window.selectedElementInfo, res);
        });
    };

    var bindEvents = function () {
        var previewRuleButton = document.getElementById("preview-rule-button");
        previewRuleButton.addEventListener("click", function (e) {
            e.preventDefault();

            if (window.selectedElement) {
                if (window.adguardDevToolsPreview) {
                    // Remove preview
                    togglePreview();
                    previewRuleButton.value = 'Preview';

                    delete window.adguardDevToolsPreview;
                    return;
                }

                togglePreview(window.selectedElement);
                previewRuleButton.value = 'Cancel preview';

                window.adguardDevToolsPreview = selectedElement;
            }
        });

        document.getElementById("add-rule-button").addEventListener("click", function (e) {
            e.preventDefault();

            if (window.selectedElement) {
                addRuleForElement(window.selectedElement);
            }
        });

        $('.update-rule-block').on('click', function (e) {
            updateRule();
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

    var updatePanelElements = function () {
        handleShowBlockSettings(window.selectedElementInfo.haveUrlBlockParameter, window.selectedElementInfo.haveClassAttribute);
        setupAttributesInfo(window.selectedElementInfo);
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
        var placeholder = document.getElementById("attributes-block");
        while (placeholder.firstChild) {
            placeholder.removeChild(placeholder.firstChild);
        }

        for (var i = 0; i < info.attributes.length; i++) {
            var attribute = info.attributes[i];
            var el = $(
                '<li class="parent">'
                    + '<input class="enabled-button attribute-check-box" type="checkbox" id="' + 'attribute-check-box-' + attribute.name + '">'
                    + '<span class="webkit-css-property">' + attribute.name + '</span>: '
                    + '<span class="value">' + attribute.value + '</span>'
                + '</li>');
            placeholder.appendChild(el.get(0));
        }

    };

    var getInspectedPageUrl = function (callback) {
        chrome.devtools.inspectedWindow.eval("document.location && document.location.href", function (result, exceptionInfo) {
            if (exceptionInfo) {
                debug(exceptionInfo);
            }

            callback(result);
        });
    };

    var updateFilterRuleInput = function (element, info, url) {
        var isBlockByUrl = $('#block-by-url-checkbox').get(0).checked;
        var isBlockSimilar = $("#block-similar-checkbox").get(0).checked;
        var isBlockOneDomain = $("#one-domain-checkbox").get(0).checked;

        var attributesSelector = '';
        $('.attribute-check-box').forEach(function(el) {
            if (el && el.checked) {

                var attrName = el.id.substring('attribute-check-box-'.length);
                if (info.attributes) {
                    var attr = info.attributes[attrName];
                    if (attr) {
                        attributesSelector += '[' + attr.name + '="' + attr.value + '"]';
                    }
                }
            }
        });

        var options = {
            isBlockByUrl: isBlockByUrl,
            urlMask: info.urlBlockAttributeValue,
            isBlockSimilar : isBlockSimilar,
            isBlockOneDomain: isBlockOneDomain,
            url: url,
            attributes: attributesSelector
        };

        var ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
        if (ruleText) {
            document.getElementById("filter-rule-text").value = ruleText;
        } else {
            debug('Error creating rule for:' + element);
        }
    };

    var togglePreview = function (element) {

        var togglePreviewStyle = function (selector) {
            var PREVIEW_STYLE_ID = "adguard-preview-style";

            var head = document.getElementsByTagName('head')[0];
            if (head) {
                if (selector && selector != 'null') {
                    var style = document.createElement("style");
                    style.setAttribute("type", "text/css");
                    style.setAttribute("id", PREVIEW_STYLE_ID);
                    style.appendChild(document.createTextNode(selector + " {display: none !important;}"));

                    head.appendChild(style);
                } else {
                    head.removeChild(document.getElementById(PREVIEW_STYLE_ID));
                }
            }
        };

        var selector = element ? AdguardRulesConstructorLib.constructCssSelector(element) : null;
        chrome.devtools.inspectedWindow.eval("(" + togglePreviewStyle.toString() + ")('" + selector + "')", function (result, exceptionInfo) {
            if (exceptionInfo) {
                debug(exceptionInfo);
            }
        });
    };

    var addRuleForElement = function (element) {
        if (window.adguardDevToolsPreview) {
            // Remove preview
            togglePreview();
        }

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

            togglePreview(element);

            delete window.selectedElement;
            delete window.selectedElementInfo;

            initElements();
        });
    };

    document.addEventListener('DOMContentLoaded', function () {
        initPanel();
    });

})(balalaika);


