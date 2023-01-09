/**
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

/* eslint-disable no-nested-ternary */

import { MessageType, APP_MESSAGE_HANDLER_NAME } from '../common/messages';

const browser = window.browser || chrome;

export const devtoolsElementsSidebar = (() => {
    const initPanel = function () {
        initTheme();
        initElements();
        bindEvents();

        const onElementSelected = function () {
            browser.devtools.inspectedWindow.eval('DevToolsRulesConstructor.getElementInfo($0)', {
                useContentScriptContext: true,
            }, (info) => {
                if (!info) {
                    return;
                }

                // Sort attributes
                info.attributes.sort((a1, a2) => {
                    const i1 = a1.name === 'id' ? 0 : (a1.name === 'class' ? 1 : 2);
                    const i2 = a2.name === 'id' ? 0 : (a2.name === 'class' ? 1 : 2);
                    return i1 - i2;
                });

                window.selectedElementInfo = info;

                updateRule();
                handleShowBlockSettings(
                    info.haveUrlBlockParameter,
                    info.haveClassAttribute && !info.haveIdAttribute,
                );
                setupAttributesInfo(info);
            });
        };

        const onPageChanged = function () {
            document.getElementById('preview-rule-button').value = 'Preview';
            delete window.adguardDevToolsPreview;
        };

        if (browser.devtools) {
            browser.devtools.panels.elements.onSelectionChanged.addListener(onElementSelected);
            browser.devtools.network.onNavigated.addListener(onPageChanged);
        }

        onElementSelected();
    };

    const initTheme = function () {
        const theme = browser.devtools.panels.themeName;
        if (theme === 'dark') {
            document.body.classList.add('-theme-with-dark-background');
        }
    };

    const initElements = function () {
        document.querySelector('#block-by-url-checkbox').checked = false;
        document.querySelector('#create-full-css-path').checked = false;
        document.querySelector('#one-domain-checkbox').checked = true;
        document.querySelector('#filter-rule-text').value = '';

        const placeholder = document.getElementById('attributes-block');
        while (placeholder.firstChild) {
            placeholder.removeChild(placeholder.firstChild);
        }
    };

    const updateRule = function () {
        getInspectedPageUrl((url) => {
            updateFilterRuleInput(window.selectedElementInfo, url);
        });
    };

    const bindEvents = function () {
        const previewRuleButton = document.getElementById('preview-rule-button');
        previewRuleButton.addEventListener('click', (e) => {
            e.preventDefault();

            if (window.selectedElementInfo) {
                if (window.adguardDevToolsPreview) {
                    // Remove preview
                    cancelPreview();
                    previewRuleButton.value = 'Preview';

                    delete window.adguardDevToolsPreview;
                    return;
                }

                const ruleText = document.getElementById('filter-rule-text').value;
                if (!ruleText) {
                    return;
                }
                applyPreview(ruleText);

                previewRuleButton.value = 'Cancel preview';

                window.adguardDevToolsPreview = true;
            }
        });

        document.getElementById('add-rule-button').addEventListener('click', (e) => {
            e.preventDefault();

            if (window.selectedElementInfo) {
                addRuleForElement();
            }
        });

        const updateRuleBlocks = document.querySelectorAll('.update-rule-block');
        updateRuleBlocks.forEach((block) => {
            block.addEventListener('click', () => {
                updatePanelElements();
                updateRule();
            });
        });

        document.getElementById('select-attributes-checkbox').addEventListener('click', (e) => {
            const { checked } = e.currentTarget;

            const attributeCheckBoxes = document.querySelectorAll('.attribute-check-box');
            attributeCheckBoxes.forEach((el) => {
                el.checked = checked;
            });

            updatePanelElements();
            updateRule();
        });
    };

    const updatePanelElements = function () {
        const checkboxes = document.querySelectorAll('#one-domain-checkbox, #create-full-css-path, .attribute-check-box');

        // All checkboxes should be disabled if block by url is checked
        if (document.querySelector('#block-by-url-checkbox').checked) {
            checkboxes.forEach((checkbox) => {
                checkbox.setAttribute('disabled', 'disabled');
            });
        } else {
            checkboxes.forEach((checkbox) => {
                checkbox.removeAttribute('disabled');
            });
        }
    };

    const handleShowBlockSettings = function (showBlockByUrl, createFullCssPath) {
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

    const setupAttributesInfo = function (info) {
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

        for (let i = 0; i < info.attributes.length; i += 1) {
            const attribute = info.attributes[i];

            if (attribute.name === 'class' && attribute.value) {
                const split = attribute.value.split(' ');
                for (let j = 0; j < split.length; j += 1) {
                    const value = split[j];
                    if (value) { // Skip empty values. Like 'class1 class2   '
                        placeholder.appendChild(
                            createAttributeElement(attribute.name, value, true),
                        );
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

    const getInspectedPageUrl = function (callback) {
        browser.devtools.inspectedWindow.eval('document.location && document.location.href', (result) => {
            callback(result);
        });
    };

    const updateFilterRuleInput = function (info, url) {
        const isBlockByUrl = document.querySelector('#block-by-url-checkbox').checked;
        const createFullCssPath = document.querySelector('#create-full-css-path').checked;
        const isBlockOneDomain = document.querySelector('#one-domain-checkbox').checked;

        let includeTagName = true;
        let includeElementId = true;
        const selectedClasses = [];
        let attributesSelector = '';
        document.querySelectorAll('.attribute-check-box').forEach((el) => {
            if (el) {
                const attrName = el.id.substring('attribute-check-box-'.length);
                if (attrName === 'tag') {
                    includeTagName = el.checked;
                } else if (attrName === 'id') {
                    includeElementId = el.checked;
                } else if (el.checked) {
                    const attrValue = el.parentNode.querySelector('.attribute-check-box-value').innerText;
                    if (attrName === 'class') {
                        selectedClasses.push(attrValue);
                    } else {
                        attributesSelector += `[${attrName}="${attrValue}"]`;
                    }
                }
            }
        });

        const options = {
            urlMask: info.urlBlockAttributeValue,
            isBlockOneDomain: !isBlockOneDomain,
            url,
            ruleType: isBlockByUrl ? 'URL' : 'CSS',
            cssSelectorType: createFullCssPath ? 'STRICT_FULL' : 'STRICT',
            attributes: attributesSelector,
            excludeTagName: !includeTagName,
            excludeId: !includeElementId,
            classList: selectedClasses,
        };

        const func = `DevToolsRulesConstructor.constructRuleText($0, ${JSON.stringify(options)});`;
        browser.devtools.inspectedWindow.eval(func, {
            useContentScriptContext: true,
        }, (result) => {
            if (result) {
                document.getElementById('filter-rule-text').value = result;
            }
        });
    };

    const applyPreview = function (ruleText) {
        const func = `DevToolsHelper.applyPreview(${JSON.stringify({ ruleText })});`;
        browser.devtools.inspectedWindow.eval(func, { useContentScriptContext: true });
    };

    const cancelPreview = function () {
        const func = 'DevToolsHelper.cancelPreview();';
        browser.devtools.inspectedWindow.eval(func, { useContentScriptContext: true });
    };

    /**
     * Adds userrule via background page
     * We add rule via background page to mitigate vulnerabilities
     * related with messages from content script
     *
     * @param {string} ruleText
     * @returns {Promise<void>}
     */
    const addRule = async (ruleText) => {
        return browser.runtime.sendMessage({
            handlerName: APP_MESSAGE_HANDLER_NAME,
            type: MessageType.AddUserRule,
            data: { ruleText },
        });
    };

    const addRuleForElement = async () => {
        if (window.adguardDevToolsPreview) {
            // Remove preview
            cancelPreview();
        }

        const ruleText = document.getElementById('filter-rule-text').value;
        if (!ruleText) {
            return;
        }

        await addRule(ruleText);

        applyPreview(ruleText);
        delete window.selectedElementInfo;
        initElements();
    };

    const init = () => {
        document.addEventListener('DOMContentLoaded', () => {
            initPanel();
        });
    };

    return {
        init,
    };
})();
