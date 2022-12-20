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

/**
 * DevTools rules constructor helper
 */
export const DevToolsRulesConstructor = (function () {
    const CSS_RULE_MARK = '##';
    const RULE_OPTIONS_MARK = '$';

    const URLBLOCK_ATTRIBUTES = ['src', 'data'];

    const linkHelper = document.createElement('a');

    /**
     * Constructs css selector for element using tag name, id and classed, like: tagName#id.class1.class2
     *
     * @param element Element
     * @param classList Override element classes (If classList is null, element classes will be used)
     * @param excludeTagName Omit tag name in selector
     * @param excludeId Omit element id in selector
     * @returns {string}
     */
    const makeDefaultCssFilter = function (element, classList, excludeTagName, excludeId) {
        let cssSelector = excludeTagName ? '' : element.tagName.toLowerCase();
        if (element.id && !excludeId) {
            cssSelector += `#${CSS.escape(element.id)}`;
        }
        cssSelector += constructClassCssSelectorByAND(classList || element.classList);
        return cssSelector;
    };

    /**
     * Constructs css selector for element using parent elements and nth-child (first-child, last-child) pseudo classes.
     *
     * @param element Element
     * @param options Construct options. For example: {excludeTagName: false, excludeId: false, classList: []}
     * @returns {string}
     */
    const makeCssNthChildFilter = function (element, options) {
        options = options || {};

        const { classList } = options;

        const excludeTagNameOverride = 'excludeTagName' in options;
        const { excludeTagName } = options;

        const excludeIdOverride = 'excludeId' in options;
        const { excludeId } = options;

        const path = [];
        let el = element;
        while (el.parentNode) {
            const nodeName = el && el.nodeName ? el.nodeName.toUpperCase() : '';
            if (nodeName === 'BODY' && path.length === 0) {
                const bodySelector = makeDefaultCssFilter(
                    el,
                    classList,
                    excludeTagNameOverride ? excludeTagName : false,
                    excludeId,
                );
                path.unshift(bodySelector);
                break;
            }
            if (nodeName === 'BODY') {
                break;
            }
            if (el.id) {
                /**
                 * Be default we don't include tag name and classes to selector for element with id attribute
                 */
                let cssSelector = '';
                if (el === element) {
                    cssSelector = makeDefaultCssFilter(
                        el,
                        classList || [],
                        excludeTagNameOverride ? excludeTagName : true,
                        excludeIdOverride ? excludeId : false,
                    );
                } else {
                    cssSelector = makeDefaultCssFilter(el, [], true, false);
                }
                path.unshift(cssSelector);
                break;
            } else {
                let c = 1;
                for (let e = el; e.previousSibling; e = e.previousSibling) {
                    if (e.previousSibling.nodeType === 1) {
                        c += 1;
                    }
                }

                let cldCount = 0;
                for (let i = 0; el.parentNode && i < el.parentNode.childNodes.length; i += 1) {
                    cldCount += el.parentNode.childNodes[i].nodeType === 1 ? 1 : 0;
                }

                let ch;
                if (cldCount === 0 || cldCount === 1) {
                    ch = '';
                } else if (c === 1) {
                    ch = ':first-child';
                } else if (c === cldCount) {
                    ch = ':last-child';
                } else {
                    ch = `:nth-child(${c})`;
                }

                /**
                 * By default we include tag name and element classes to selector for element without id attribute
                 */
                if (el === element) {
                    let p = makeDefaultCssFilter(
                        el,
                        classList,
                        excludeTagNameOverride ? excludeTagName : false,
                        excludeId,
                    );
                    p += ch;
                    path.unshift(p);
                } else {
                    path.unshift(makeDefaultCssFilter(el, el.classList, false, false) + ch);
                }

                el = el.parentNode;
            }
        }
        return path.join(' > ');
    };

    /**
     * Constructs css selector by combining classes by AND
     *
     * @param classList
     * @returns {string}
     */
    const constructClassCssSelectorByAND = function (classList) {
        const selectors = [];
        if (classList) {
            for (let i = 0; i < classList.length; i += 1) {
                selectors.push(`.${CSS.escape(classList[i])}`);
            }
        }
        return selectors.join('');
    };

    /**
     * Constructs css selector by combining classes by OR
     *
     * @param classList
     * @returns {string}
     */
    const constructClassCssSelectorByOR = function (classList) {
        const selectors = [];
        if (classList) {
            for (let i = 0; i < classList.length; i += 1) {
                selectors.push(`.${CSS.escape(classList[i])}`);
            }
        }
        return selectors.join(', ');
    };

    /**
     * Constructs element selector for matching elements that contain any of classes in original element
     * For example <el class="cl1 cl2 cl3"></el> => .cl1, .cl2, .cl3
     *
     * @param element Element
     * @param classList Override element classes (If classList is null, element classes will be used)
     * @returns {string}
     */
    const makeSimilarCssFilter = function (element, classList) {
        return constructClassCssSelectorByOR(classList || element.classList);
    };

    /**
     * Creates css rule text
     *
     * @param element Element
     * @param options Construct options.
     * For example: {cssSelectorType: 'STRICT_FULL', excludeTagName: false, excludeId: false, classList: []}
     * @returns {string}
     */
    const constructCssRuleText = function (element, options) {
        if (!element) {
            return;
        }

        options = options || {};
        const cssSelectorType = options.cssSelectorType || 'STRICT_FULL';

        let selector;
        switch (cssSelectorType) {
            case 'STRICT_FULL':
                selector = makeCssNthChildFilter(element, options);
                break;
            case 'STRICT':
                selector = makeDefaultCssFilter(element, options.classList, options.excludeTagName, options.excludeId);
                break;
            case 'SIMILAR':
                selector = makeSimilarCssFilter(element, options.classList, true);
                break;
            default:
                // do nothing
        }

        return selector ? CSS_RULE_MARK + selector : '';
    };

    const isValidUrl = function (value) {
        if (value) {
            linkHelper.href = value;
            if (linkHelper.hostname) {
                return true;
            }
        }

        return false;
    };

    const haveUrlBlockParameter = function (element) {
        const value = getUrlBlockAttribute(element);
        return value && value !== '';
    };

    const haveClassAttribute = function (element) {
        return element.classList && element.classList.length > 0;
    };

    const haveIdAttribute = function (element) {
        return element.id && element.id.trim() !== '';
    };

    const cropDomain = function (url) {
        const domain = getUrl(url).host;
        return domain.replace('www.', '').replace(/:\d+/, '');
    };

    const getUrl = function (url) {
        const pattern = '^(([^:/\\?#]+):)?(//(([^:/\\?#]*)(?::([^/\\?#]*))?))?([^\\?#]*)(\\?([^#]*))?(#(.*))?$';
        const rx = new RegExp(pattern);
        const parts = rx.exec(url);

        return {
            host: parts[4] || '',
            path: parts[7] || '',
        };
    };

    const constructUrlBlockRuleText = function (element, urlBlockAttribute, oneDomain, domain) {
        if (!urlBlockAttribute) {
            return null;
        }

        let blockUrlRuleText = urlBlockAttribute.replace(/^http:\/\/(www\.)?/, '||');
        if (blockUrlRuleText.indexOf('.') === 0) {
            blockUrlRuleText = blockUrlRuleText.substring(1);
        }

        if (!oneDomain) {
            blockUrlRuleText = `${blockUrlRuleText + RULE_OPTIONS_MARK}domain=${domain}`;
        }

        return blockUrlRuleText;
    };

    const getUrlBlockAttribute = function (element) {
        if (!element || !element.getAttribute) {
            return null;
        }

        for (let i = 0; i < URLBLOCK_ATTRIBUTES.length; i += 1) {
            const attr = URLBLOCK_ATTRIBUTES[i];
            const value = element.getAttribute(attr);
            if (isValidUrl(value)) {
                return value;
            }
        }

        return null;
    };

    /**
     * Returns detailed element info
     *
     * @param element
     */
    const getElementInfo = function (element) {
        // Convert attributes to array
        const attributes = [];
        const elementAttributes = element.attributes;
        if (elementAttributes) {
            for (let i = 0; i < elementAttributes.length; i += 1) {
                const attr = elementAttributes[i];
                attributes.push({
                    name: attr.name,
                    value: attr.value,
                });
            }
        }

        return {
            tagName: element.tagName,
            attributes,
            urlBlockAttributeValue: getUrlBlockAttribute(element),
            haveUrlBlockParameter: haveUrlBlockParameter(element),
            haveClassAttribute: haveClassAttribute(element),
            haveIdAttribute: haveIdAttribute(element),
        };
    };

    /**
     * Constructs css selector for specified rule
     *
     * @param ruleText rule text
     * @returns {string} css style selector
     */
    const constructRuleCssSelector = function (ruleText) {
        if (!ruleText) {
            return null;
        }

        const index = ruleText.indexOf(CSS_RULE_MARK);
        const optionsIndex = ruleText.indexOf(RULE_OPTIONS_MARK);

        if (index >= 0) {
            return ruleText.substring(index + CSS_RULE_MARK.length, optionsIndex >= 0 ? optionsIndex : ruleText.length);
        }

        let s = ruleText.substring(0, optionsIndex);
        s = s.replace(/[\|]|[\^]/g, '');

        if (isValidUrl(s)) {
            return `[src*="${s}"]`;
        }

        return null;
    };

    /**
     * Constructs adguard rule text from element node and specified options
     *
     * var options = {
     *  urlBlockAttribute: url mask,
     *  isBlockOneDomain: boolean,
     *  url: url,
     *  attributes: attributesSelectorText,
     *  ruleType: (URL, CSS)
     *  cssSelectorType: (STRICT_FULL, STRICT, SIMILAR),
     *  excludeTagName: false, (Exclude element tag name from selector)
     *  excludeId: false, (Exclude element identifier from selector)
     *  classList: [] (Override element classes (If classList is null, element classes will be used))
     * }
     *
     * @param element
     * @param options
     * @returns {*}
     */
    const constructRuleText = function (element, options) {
        const croppedDomain = cropDomain(options.url);

        const { ruleType } = options;

        if (ruleType === 'URL') {
            const blockUrlRuleText = constructUrlBlockRuleText(
                element,
                options.urlMask,
                options.isBlockOneDomain,
                croppedDomain,
            );
            if (blockUrlRuleText) {
                return blockUrlRuleText;
            }
        }

        let result;

        if (ruleType === 'CSS') {
            result = constructCssRuleText(element, options);

            // Append html attributes to css selector
            if (options.attributes) {
                result = (result || CSS_RULE_MARK + result) + options.attributes;
            }
        }

        if (!options.isBlockOneDomain) {
            result = croppedDomain + result;
        }

        return result;
    };

    return {
        getElementInfo,
        constructRuleCssSelector,
        constructRuleText,
    };
})();
