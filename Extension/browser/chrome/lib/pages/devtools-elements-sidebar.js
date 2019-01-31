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
/* global chrome, DevToolsRulesConstructor */

var browser = window.browser || chrome;

(function () {
    var initPanel = function () {
        initTheme();
        initElements();
        bindEvents();

        var onElementSelected = function () {

            browser.devtools.inspectedWindow.eval("DevToolsRulesConstructor.getElementInfo($0)", {
                useContentScriptContext: true
            }, function (info) {
                if (!info) {
                    return;
                }

                // Sort attributes
                info.attributes.sort(function(a1, a2){
                    var i1 = a1.name === 'id' ? 0 : (a1.name === 'class' ? 1 : 2);
                    var i2 = a2.name === 'id' ? 0 : (a2.name === 'class' ? 1 : 2);
                    return i1 - i2;
                });

                window.selectedElementInfo = info;

                updateRule();
                handleShowBlockSettings(info.haveUrlBlockParameter, info.haveClassAttribute && !info.haveIdAttribute);
                setupAttributesInfo(info);
            });
        };

        var onPageChanged = function () {
            document.getElementById("preview-rule-button").value = 'Preview';
            delete window.adguardDevToolsPreview;
        };

        browser.devtools && browser.devtools.panels.elements.onSelectionChanged.addListener(onElementSelected);
        browser.devtools && browser.devtools.network.onNavigated.addListener(onPageChanged);

        onElementSelected();
    };

    var initTheme = function () {
        var theme = browser.devtools.panels.themeName;
        if (theme === 'dark') {
            document.body.classList.add('-theme-with-dark-background');
        }
    };

    var initElements = function () {
        document.querySelector('#block-by-url-checkbox').checked = false;
        document.querySelector('#create-full-css-path').checked = false;
        document.querySelector('#one-domain-checkbox').checked = true;
        document.querySelector('#filter-rule-text').value = '';

        var placeholder = document.getElementById("attributes-block");
        while (placeholder.firstChild) {
            placeholder.removeChild(placeholder.firstChild);
        }
    };

    var updateRule = function () {
        getInspectedPageUrl(function (url) {
            updateFilterRuleInput(window.selectedElementInfo, url);
        });
    };

    var bindEvents = function () {
        var previewRuleButton = document.getElementById("preview-rule-button");
        previewRuleButton.addEventListener("click", function (e) {
            e.preventDefault();

            if (window.selectedElementInfo) {
                if (window.adguardDevToolsPreview) {
                    // Remove preview
                    cancelPreview();
                    previewRuleButton.value = 'Preview';

                    delete window.adguardDevToolsPreview;
                    return;
                }

                var ruleText = document.getElementById("filter-rule-text").value;
                if (!ruleText) {
                    return;
                }
                applyPreview(ruleText);

                previewRuleButton.value = 'Cancel preview';

                window.adguardDevToolsPreview = true;
            }
        });

        document.getElementById("add-rule-button").addEventListener("click", function (e) {
            e.preventDefault();

            if (window.selectedElementInfo) {
                addRuleForElement();
            }
        });

        const updateRuleBlocks = document.querySelectorAll('.update-rule-block');
        updateRuleBlocks.forEach(block => {
            block.addEventListener('click', () => {
                updatePanelElements();
                updateRule();
            });
        });


        document.getElementById('select-attributes-checkbox').addEventListener('click', function (e) {
            const checked = e.currentTarget.checked;

            const attributeCheckBoxes = document.querySelectorAll('.attribute-check-box');
            attributeCheckBoxes.forEach(el => {
                if (el) {
                    el.checked = checked;
                }
            });

            updatePanelElements();
            updateRule();
        });
    };

    var updatePanelElements = function () {
        const checkboxes = document.querySelectorAll('#one-domain-checkbox, #create-full-css-path, .attribute-check-box');

        // All checkboxes should be disabled if block by url is checked
        if (document.querySelector('#block-by-url-checkbox').checked) {
            checkboxes.forEach(checkbox => {
                checkbox.setAttribute('disabled', 'disabled');
            });
        } else {
            checkboxes.forEach(checkbox => {
                checkbox.removeAttribute('disabled');
            });
        }
    };

    var handleShowBlockSettings = function (showBlockByUrl, createFullCssPath) {
        if (showBlockByUrl) {
            document.querySelector('#block-by-url-checkbox-block').style.display = 'block';
        } else {
            document.querySelector('#block-by-url-checkbox').checked = false;
            document.querySelector('#block-by-url-checkbox-block').style.display = 'none';
        }
        if (createFullCssPath) {
            document.querySelector('#create-full-css-path-block').style.display = 'block';
            document.querySelector('#create-full-css-path').checked = false;
        } else {
            document.querySelector('#create-full-css-path').checked = true;
            document.querySelector('#create-full-css-path-block').style.display = 'none';
        }
    };

    var setupAttributesInfo = function (info) {
        const placeholder = document.getElementById('attributes-block');

        while (placeholder.firstChild) {
            placeholder.removeChild(placeholder.firstChild);
        }

        const createAttributeElement = (attributeName, attributeValue, defaultChecked) => {
            const checked = defaultChecked ? 'checked="true"' : '';

            const elHtml = `
                    <li class="parent">
                        <input class="enabled-button attribute-check-box" type="checkbox" id="attribute-check-box-${attributeName}" ${checked}>
                        <span class="webkit-css-property">${attributeName}</span>:
                        <span class="value attribute-check-box-value">${attributeValue}</span>
                    </li>
            `;

            const tmpEl = document.createElement('div');
            tmpEl.innerHTML = elHtml;
            return tmpEl.firstElementChild;
        };

        if (info.tagName) {
            placeholder.appendChild(createAttributeElement('tag', info.tagName.toLowerCase(), true));
        }

        for (var i = 0; i < info.attributes.length; i++) {
            var attribute = info.attributes[i];

            if (attribute.name === 'class' && attribute.value) {
                var split = attribute.value.split(' ');
                for (var j = 0; j < split.length; j++) {
                    var value = split[j];
                    if (value) { // Skip empty values. Like 'class1 class2   '
                        placeholder.appendChild(createAttributeElement(attribute.name, value, true));
                    }
                }
            } else {
                placeholder.appendChild(createAttributeElement(attribute.name, attribute.value, attribute.name === 'id'));
            }
        }

        if (placeholder.childNodes.length > 2) {
            document.querySelector('#select-attributes-checkbox').style.display = 'inline';
        } else {
            document.querySelector('#select-attributes-checkbox').style.display = 'none';
        }
    };

    var getInspectedPageUrl = function (callback) {
        browser.devtools.inspectedWindow.eval("document.location && document.location.href", function (result) {
            callback(result);
        });
    };

    var updateFilterRuleInput = function (info, url) {
        var isBlockByUrl = document.querySelector('#block-by-url-checkbox').checked;
        var createFullCssPath = document.querySelector('#create-full-css-path').checked;
        var isBlockOneDomain = document.querySelector('#one-domain-checkbox').checked;

        var includeTagName = true;
        var includeElementId = true;
        var selectedClasses = [];
        var attributesSelector = '';
        document.querySelectorAll('.attribute-check-box').forEach(function (el) {
            if (el) {
                var attrName = el.id.substring('attribute-check-box-'.length);
                if (attrName === 'tag') {
                    includeTagName = el.checked;
                } else if (attrName === 'id') {
                    includeElementId = el.checked;
                } else {
                    if (el.checked) {
                        var attrValue = el.parentNode.querySelector('.attribute-check-box-value').innerText;
                        if (attrName === 'class') {
                            selectedClasses.push(attrValue);
                        } else {
                            attributesSelector += '[' + attrName + '="' + attrValue + '"]';
                        }
                    }
                }
            }
        });

        var options = {
            urlMask: info.urlBlockAttributeValue,
            isBlockOneDomain: !isBlockOneDomain,
            url: url,
            ruleType: isBlockByUrl ? 'URL' : 'CSS',
            cssSelectorType: createFullCssPath ? 'STRICT_FULL' : 'STRICT',
            attributes: attributesSelector,
            excludeTagName: !includeTagName,
            excludeId: !includeElementId,
            classList: selectedClasses
        };

        var func = 'DevToolsRulesConstructor.constructRuleText($0, ' + JSON.stringify(options) + ');';
        browser.devtools.inspectedWindow.eval(func, {
            useContentScriptContext: true
        }, function (result) {
            if (result) {
                document.getElementById("filter-rule-text").value = result;
            }
        });
    };

    var applyPreview = function (ruleText) {
        var func = 'DevToolsHelper.applyPreview(' + JSON.stringify({ruleText: ruleText}) + ');';
        browser.devtools.inspectedWindow.eval(func, {useContentScriptContext: true});
    };

    var cancelPreview = function () {
        var func = 'DevToolsHelper.cancelPreview();';
        browser.devtools.inspectedWindow.eval(func, {useContentScriptContext: true});
    };

    var addRuleForElement = function () {
        if (window.adguardDevToolsPreview) {
            // Remove preview
            cancelPreview();
        }

        var ruleText = document.getElementById("filter-rule-text").value;
        if (!ruleText) {
            return;
        }

        var func = 'DevToolsHelper.addRule(' + JSON.stringify({ruleText: ruleText}) + ');';
        browser.devtools.inspectedWindow.eval(func, {
            useContentScriptContext: true
        }, function () {
            applyPreview(ruleText);

            delete window.selectedElementInfo;

            initElements();
        });
    };

    document.addEventListener('DOMContentLoaded', function () {
        initPanel();
    });

})();
