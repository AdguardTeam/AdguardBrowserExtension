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

/* global i18n, contentPage, createEventListener, htmlToElement */

// variables used to spread data received on script initialize
let AntiBannerFiltersId;
let EventNotifierTypes;
let filtersMetadata;

const Messages = {
    OPTIONS_USERFILTER: i18n.getMessage('options_userfilter'),
    OPTIONS_WHITELIST: i18n.getMessage('options_whitelist'),
    IN_WHITELIST: i18n.getMessage('filtering_log_in_whitelist'),
};

const FilterRule = {
    MASK_WHITE_LIST: '@@',
    MASK_CSS_RULE: '##',
    MASK_CSS_INJECT_RULE: '#$#',
    MASK_CSS_EXTENDED_CSS_RULE: '#?#',
    MASK_CSS_INJECT_EXTENDED_CSS_RULE: '#$?#',
    MASK_SCRIPT_RULE: '#%#',
    MASK_SCRIPT_RULE_UBO: '##',
};

const UrlFilterRule = {
    MASK_START_URL: '||',
    MASK_ANY_SYMBOL: '*',
    MASK_SEPARATOR: '^',
    DOMAIN_OPTION: 'domain',
    IMPORTANT_OPTION: 'important',
    MATCH_CASE_OPTION: 'match-case',
    THIRD_PARTY_OPTION: 'third-party',
    OPTIONS_DELIMITER: '$',
    CSP_OPTION: 'csp',
    WEBRTC_OPTION: 'webrtc',
    WEBSOCKET_OPTION: 'websocket',
    COOKIE_OPTION: 'cookie',
    STEALTH_OPTION: 'stealth',
    REPLACE_OPTION: 'replace',
    REDIRECT_OPTION: 'redirect',
    BADFILTER_OPTION: 'badfilter',
    REMOVEPARAM_OPTION: 'removeparam',
};

const STEALTH_ACTIONS = {
    HIDE_REFERRER: 1 << 0,
    HIDE_SEARCH_QUERIES: 1 << 1,
    BLOCK_CHROME_CLIENT_DATA: 1 << 2,
    SEND_DO_NOT_TRACK: 1 << 3,
    FIRST_PARTY_COOKIES: 1 << 4,
    THIRD_PARTY_COOKIES: 1 << 5,
};

const STEALTH_ACTIONS_NAMES = {
    HIDE_REFERRER: i18n.getMessage('filtering_log_hide_referrer'),
    HIDE_SEARCH_QUERIES: i18n.getMessage('filtering_log_hide_search_queries'),
    BLOCK_CHROME_CLIENT_DATA: i18n.getMessage('filtering_log_remove_client_data'),
    SEND_DO_NOT_TRACK: i18n.getMessage('filtering_log_send_not_track'),
    FIRST_PARTY_COOKIES: i18n.getMessage('options_modified_first_party_cookie'),
    THIRD_PARTY_COOKIES: i18n.getMessage('options_modified_third_party_cookie'),
};

/**
 * String utils
 * @type {{substringAfter, containsIgnoreCase, substringBefore, startWith}}
 */
const StringUtils = {

    startWith(str, prefix) {
        return !!(str && str.indexOf(prefix) === 0);
    },

    containsIgnoreCase(str, searchString) {
        return !!(str && searchString && str.toUpperCase().indexOf(searchString.toUpperCase()) >= 0);
    },

    substringAfter(str, separator) {
        if (!str) {
            return str;
        }
        const index = str.indexOf(separator);
        return index < 0 ? '' : str.substring(index + separator.length);
    },

    substringBefore(str, separator) {
        if (!str || !separator) {
            return str;
        }
        const index = str.indexOf(separator);
        return index < 0 ? str : str.substring(0, index);
    },
};

/**
 * Url utils
 * @type {{getUrlWithoutScheme, isHierarchicUrl, getProtocol}}
 */
const UrlUtils = {

    getProtocol(url) {
        let index = url.indexOf('//');
        if (index >= 0) {
            return url.substring(0, index);
        }
        // It's non hierarchical structured URL (e.g. stun: or turn:)
        index = url.indexOf(':');
        if (index >= 0) {
            return url.substring(0, index);
        }

        return '';
    },

    /**
     * Removes protocol from URL
     */
    getUrlWithoutScheme(url) {
        let index = url.indexOf('//');
        if (index >= 0) {
            url = url.substring(index + 2);
        } else {
            // It's non hierarchical structured URL (e.g. stun: or turn:)
            index = url.indexOf(':');
            if (index >= 0) {
                url = url.substring(index + 1);
            }
        }
        return StringUtils.startWith(url, 'www.') ? url.substring(4) : url;
    },

    /**
     * Checks the given URL whether is hierarchical or not
     * @param url
     * @returns {boolean}
     */
    isHierarchicUrl(url) {
        return url.indexOf('//') !== -1;
    },
};

/**
 * Modal window utils
 * @type {{closeModal, showModal}}
 */
const ModalUtils = {
    showModal(element) {
        element.style.display = 'block';
    },

    closeModal(element) {
        element.remove();
    },
};

/**
 * Request wizard
 *
 * @type {{showRequestInfoModal, closeModal, getFilterName, getRequestType, getSource}}
 */
const RequestWizard = (function () {
    // exclude domain and full request url
    const PATTERNS_COUNT = 2;

    let requestInfoTemplate;
    let createBlockRuleTemplate;
    let createExceptionRuleTemplate;

    let currentModal;

    /**
     * Closes current open modal
     */
    const closeModal = function () {
        if (currentModal) {
            ModalUtils.closeModal(currentModal);
            currentModal = null;
        }
    };

    const showModal = function (template) {
        closeModal();

        document.body.appendChild(template);
        ModalUtils.showModal(template);

        template.querySelector('.close').addEventListener('click', closeModal);

        currentModal = template;
    };

    const createDocumentLevelBlockRule = (rule) => {
        const { ruleText } = rule;
        if (ruleText.indexOf(UrlFilterRule.OPTIONS_DELIMITER) > -1) {
            return `${ruleText},${UrlFilterRule.BADFILTER_OPTION}`;
        }
        return ruleText + UrlFilterRule.OPTIONS_DELIMITER + UrlFilterRule.BADFILTER_OPTION;
    };

    const splitToPatterns = function (requestUrl, domain, whitelist) {
        const hierarchicUrl = UrlUtils.isHierarchicUrl(requestUrl);
        const protocol = UrlUtils.getProtocol(requestUrl);

        let prefix;
        if (hierarchicUrl) {
            prefix = UrlFilterRule.MASK_START_URL; // Covers default protocols: http, ws
        } else {
            prefix = `${protocol}:`; // Covers non-default protocols: stun, turn
        }

        if (whitelist) {
            prefix = FilterRule.MASK_WHITE_LIST + prefix;
        }

        const patterns = [];

        const relative = StringUtils.substringAfter(requestUrl, `${domain}/`);

        const path = StringUtils.substringBefore(relative, '?');
        if (path) {
            const parts = path.split('/');

            let pattern = `${domain}/`;
            for (let i = 0; i < Math.min(parts.length - 1, PATTERNS_COUNT); i += 1) {
                pattern += `${parts[i]}/`;
                patterns.push(prefix + pattern + UrlFilterRule.MASK_ANY_SYMBOL);
            }
            const file = parts[parts.length - 1];
            if (file && patterns.length < PATTERNS_COUNT) {
                pattern += file;
                patterns.push(prefix + pattern);
            }
        }

        // add domain pattern to start
        patterns.unshift(prefix + domain + UrlFilterRule.MASK_SEPARATOR);

        // push full url pattern
        const url = UrlUtils.getUrlWithoutScheme(requestUrl);
        if (`${domain}/` !== url) { // Don't duplicate: ||example.com/ and ||example.com^
            if (patterns.indexOf(prefix + url) < 0) {
                patterns.push(prefix + url);
            }
        }

        return patterns;
    };

    const createCssRuleFromParams = function (urlPattern, permitDomain) {
        let ruleText = urlPattern;
        if (!permitDomain) {
            ruleText = ruleText.slice(ruleText.indexOf('#'));
        }

        return ruleText;
    };

    const createRuleFromParams = (urlPattern, urlDomain, matchCase, thirdParty, important, mandatoryOptions) => {
        let ruleText = urlPattern;
        let options = [];

        // add domain option
        if (urlDomain) {
            options.push(`${UrlFilterRule.DOMAIN_OPTION}=${urlDomain}`);
        }
        // add important option
        if (important) {
            options.push(UrlFilterRule.IMPORTANT_OPTION);
        }
        // add match case option
        if (matchCase) {
            options.push(UrlFilterRule.MATCH_CASE_OPTION);
        }
        // add third party option
        if (thirdParty) {
            options.push(UrlFilterRule.THIRD_PARTY_OPTION);
        }
        if (mandatoryOptions) {
            options = options.concat(mandatoryOptions);
        }
        if (options.length > 0) {
            ruleText += UrlFilterRule.OPTIONS_DELIMITER + options.join(',');
        }

        return ruleText;
    };

    const initCreateRuleDialog = function (frameInfo, template, patterns, filteringEvent) {
        const { frameDomain } = filteringEvent;
        const isThirdPartyRequest = filteringEvent.requestThirdParty;

        const rulePatternsEl = template.querySelector('#rulePatterns');

        for (let i = 0; i < patterns.length; i += 1) {
            const pattern = patterns[i];
            const escapedPattern = pattern.replace(/"/g, '&quot;');
            const rulePatternTemplate = `
                <li class="checkb-wrap">
                    <div class="radio">
                        <input
                            class="radio__input"
                            type="radio"
                            name="rulePattern"
                            id="pattern${i}"
                            value="${escapedPattern}"
                            ${i === 0 ? "checked='checked'" : ''}
                        >
                        <label class="radio__label" for="pattern${i}">
                            ${pattern}
                        </label>
                    </div>
                </li>`;

            rulePatternsEl.appendChild(htmlToElement(rulePatternTemplate));
        }

        const rulePatterns = [].slice.call(template.querySelectorAll('[name="rulePattern"]'));
        const ruleDomainCheckbox = template.querySelector('[name="ruleDomain"]');
        const ruleImportantCheckbox = template.querySelector('[name="ruleImportant"]');
        const ruleMatchCaseCheckbox = template.querySelector('[name="ruleMatchCase"]');
        const ruleThirdPartyCheckbox = template.querySelector('[name="ruleThirdParty"]');
        const ruleTextEl = template.querySelector('[name="ruleText"]');

        ruleDomainCheckbox.setAttribute('id', 'ruleDomain');
        ruleDomainCheckbox.parentNode.querySelector('label').setAttribute('for', 'ruleDomain');
        if (!frameDomain) {
            ruleDomainCheckbox.closest('.checkbox').style.display = 'none';
        }

        ruleImportantCheckbox.setAttribute('id', 'ruleImportant');
        ruleImportantCheckbox.parentNode.querySelector('label').setAttribute('for', 'ruleImportant');
        if (filteringEvent.requestRule
            && (filteringEvent.requestRule.whiteListRule || filteringEvent.requestRule.isImportant)) {
            ruleImportantCheckbox.setAttribute('checked', 'checked');
        }

        ruleMatchCaseCheckbox.setAttribute('id', 'ruleMatchCase');
        ruleMatchCaseCheckbox.parentNode.querySelector('label').setAttribute('for', 'ruleMatchCase');

        ruleThirdPartyCheckbox.setAttribute('id', 'ruleThirdParty');
        ruleThirdPartyCheckbox.parentNode.querySelector('label').setAttribute('for', 'ruleThirdParty');
        if (isThirdPartyRequest && !frameDomain) {
            ruleThirdPartyCheckbox.setAttribute('checked', 'checked');
        }

        if (filteringEvent.element || filteringEvent.script) {
            ruleImportantCheckbox.parentNode.style.display = 'none';
            ruleMatchCaseCheckbox.parentNode.style.display = 'none';
            ruleThirdPartyCheckbox.parentNode.style.display = 'none';
            const patternsField = template.querySelector('.filtering-modal-patterns');
            if (patternsField) {
                patternsField.style.display = 'none';
            }
            const optionsField = template.querySelector('.filtering-modal-options');
            if (optionsField) {
                optionsField.style.display = 'none';
            }
        }

        if (filteringEvent.cookieName) {
            ruleImportantCheckbox.parentNode.style.display = 'none';
            ruleMatchCaseCheckbox.parentNode.style.display = 'none';
            ruleDomainCheckbox.parentNode.style.display = 'none';
            const patternsField = template.querySelector('.filtering-modal-patterns');
            if (patternsField) {
                patternsField.style.display = 'none';
            }
        }

        if (filteringEvent.requestRule && filteringEvent.requestRule.documentLevelRule) {
            const optionsField = template.querySelector('.filtering-modal-options');
            if (optionsField) {
                optionsField.style.display = 'none';
            }
            ruleDomainCheckbox.setAttribute('checked', 'checked');
            ruleImportantCheckbox.removeAttribute('checked');
        }

        function updateRuleText() {
            const urlPattern = template.querySelector('[name="rulePattern"]:checked').value;
            const permitDomain = !ruleDomainCheckbox.checked;
            const important = !!ruleImportantCheckbox.checked;
            const matchCase = !!ruleMatchCaseCheckbox.checked;
            const thirdParty = !!ruleThirdPartyCheckbox.checked;

            const domain = permitDomain ? frameDomain : null;

            let mandatoryOptions = null;

            // Deal with csp rule
            const { requestRule } = filteringEvent;
            if (requestRule && requestRule.cspRule) {
                mandatoryOptions = [UrlFilterRule.CSP_OPTION];
            }

            if (requestRule && requestRule.cookieRule) {
                mandatoryOptions = [UrlFilterRule.COOKIE_OPTION];
            }

            if (filteringEvent.requestUrl === 'content-security-policy-check') {
                mandatoryOptions = [UrlFilterRule.WEBRTC_OPTION, UrlFilterRule.WEBSOCKET_OPTION];
            }

            const { replaceRules, removeparamRules } = filteringEvent;
            if (replaceRules) {
                mandatoryOptions = [UrlFilterRule.REPLACE_OPTION];
            }
            if (removeparamRules) {
                mandatoryOptions = [UrlFilterRule.REMOVEPARAM_OPTION];
            }

            let ruleText;
            if (filteringEvent.element) {
                ruleText = createCssRuleFromParams(urlPattern, permitDomain);
            } else if (filteringEvent.cookieName) {
                ruleText = createRuleFromParams(urlPattern, null, null, thirdParty, important, mandatoryOptions);
            } else if (filteringEvent.script) {
                ruleText = createRuleFromParams(urlPattern);
            } else {
                ruleText = createRuleFromParams(urlPattern, domain, matchCase, thirdParty, important, mandatoryOptions);
            }
            ruleTextEl.value = ruleText;
        }

        // update rule text events
        ruleDomainCheckbox.addEventListener('change', updateRuleText);
        ruleImportantCheckbox.addEventListener('change', updateRuleText);
        ruleMatchCaseCheckbox.addEventListener('change', updateRuleText);
        ruleThirdPartyCheckbox.addEventListener('change', updateRuleText);
        // TODO: Link click on radio wrap to 'change' event on input
        rulePatterns.forEach((r) => {
            r.addEventListener('change', updateRuleText);
        });

        // create rule event
        template.querySelector('#createRule').addEventListener('click', (e) => {
            e.preventDefault();
            const ruleText = ruleTextEl.value;
            if (!ruleText) {
                return;
            }
            // Add rule to user filter
            contentPage.sendMessage({ type: 'addUserRule', ruleText });
            // Close modal
            closeModal();
        });

        updateRuleText();

        showModal(template);
    };

    const showCreateBlockRuleModal = function (frameInfo, filteringEvent) {
        const template = createBlockRuleTemplate.cloneNode(true);

        let patterns = splitToPatterns(filteringEvent.requestUrl, filteringEvent.requestDomain, false).reverse();

        if (filteringEvent.requestRule && filteringEvent.requestRule.documentLevelRule) {
            patterns = [createDocumentLevelBlockRule(filteringEvent.requestRule)];
        }

        initCreateRuleDialog(frameInfo, template, patterns, filteringEvent);
    };

    const generateExceptionRule = function (ruleText, mask) {
        const insert = (str, index, value) => str.slice(0, index) + value + str.slice(index);

        const maskIndex = ruleText.indexOf(mask);
        const maskLength = mask.length;
        const rulePart = ruleText.slice(maskIndex + maskLength);
        // insert exception mark after first char
        const exceptionMask = insert(mask, 1, '@');
        return exceptionMask + rulePart;
    };

    const createExceptionCssRule = function (rule, event) {
        const { ruleText } = rule;
        const domainPart = event.frameDomain;
        if (ruleText.indexOf(FilterRule.MASK_CSS_INJECT_RULE) > -1) {
            return domainPart + generateExceptionRule(ruleText, FilterRule.MASK_CSS_INJECT_RULE);
        }
        if (ruleText.indexOf(FilterRule.MASK_CSS_EXTENDED_CSS_RULE) > -1) {
            return domainPart + generateExceptionRule(
                ruleText,
                FilterRule.MASK_CSS_EXTENDED_CSS_RULE
            );
        }
        if (ruleText.indexOf(FilterRule.MASK_CSS_INJECT_EXTENDED_CSS_RULE) > -1) {
            return domainPart + generateExceptionRule(
                ruleText, FilterRule.MASK_CSS_INJECT_EXTENDED_CSS_RULE
            );
        }
        if (ruleText.indexOf(FilterRule.MASK_CSS_RULE) > -1) {
            return domainPart + generateExceptionRule(ruleText, FilterRule.MASK_CSS_RULE);
        }
    };

    const createExceptionScriptRule = function (rule, event) {
        const { ruleText } = rule;
        const domainPart = event.frameDomain;
        if (ruleText.indexOf(FilterRule.MASK_SCRIPT_RULE) > -1) {
            return domainPart + generateExceptionRule(ruleText, FilterRule.MASK_SCRIPT_RULE);
        }
        if (ruleText.indexOf(FilterRule.MASK_SCRIPT_RULE_UBO) > -1) {
            return domainPart + generateExceptionRule(ruleText, FilterRule.MASK_SCRIPT_RULE_UBO);
        }
    };

    const createExceptionCookieRule = function (rule, event) {
        let domain = event.frameDomain;
        if (domain[0] === '.') {
            domain = domain.substring(1);
        }
        return FilterRule.MASK_WHITE_LIST + UrlFilterRule.MASK_START_URL + domain;
    };

    const showCreateExceptionRuleModal = function (frameInfo, filteringEvent) {
        const template = createExceptionRuleTemplate.cloneNode(true);

        let patterns;
        if (filteringEvent.requestUrl) {
            patterns = splitToPatterns(
                filteringEvent.requestUrl,
                filteringEvent.requestDomain,
                true
            ).reverse();
        }
        if (filteringEvent.requestUrl === 'content-security-policy-check') {
            patterns = [FilterRule.MASK_WHITE_LIST];
        }

        if (filteringEvent.element) {
            patterns = [createExceptionCssRule(filteringEvent.requestRule, filteringEvent)];
        }

        if (filteringEvent.cookieName) {
            patterns = [createExceptionCookieRule(filteringEvent.requestRule, filteringEvent)];
        }

        if (filteringEvent.script) {
            patterns = [createExceptionScriptRule(filteringEvent.requestRule, filteringEvent)];
        }

        initCreateRuleDialog(frameInfo, template, patterns, filteringEvent);
    };

    /**
     * Request type map
     *
     * @param {String} requestType
     * @returns {String}
     */
    const getRequestType = function (event) {
        // By default csp requests in firefox have other request type, but if event cspReportBlocked is true
        // we consider such request to have "CSP report" type
        if (event.cspReportBlocked) {
            return 'CSP report';
        }

        const { requestType } = event;
        switch (requestType) {
            case 'DOCUMENT':
            case 'SUBDOCUMENT':
                return 'HTML';
            case 'STYLESHEET':
                return 'CSS';
            case 'SCRIPT':
                return 'JavaScript';
            case 'XMLHTTPREQUEST':
                return 'Ajax';
            case 'IMAGE':
                return 'Image';
            case 'OBJECT':
            case 'MEDIA':
                return 'Media';
            case 'FONT':
                return 'Font';
            case 'WEBSOCKET':
                return 'WebSocket';
            case 'WEBRTC':
                return 'WebRTC';
            case 'CSP':
                return 'CSP';
            case 'COOKIE':
                return 'Cookie';
            case 'OTHER':
                return 'Other';
            default:
                return '';
        }
    };

    /**
     * Frame domain
     *
     * @param {String} frameDomain
     * @returns {String}
     */
    const getSource = function (frameDomain) {
        return frameDomain || '';
    };

    /**
     * Filter's name for filterId
     *
     * @param {Number} filterId
     * @returns {String}
     */
    const getFilterName = function (filterId) {
        if (filterId === AntiBannerFiltersId.USER_FILTER_ID) {
            return Messages.OPTIONS_USERFILTER;
        }
        if (filterId === AntiBannerFiltersId.WHITE_LIST_FILTER_ID) {
            return Messages.OPTIONS_WHITELIST;
        }

        const filterMetadata = filtersMetadata.filter(el => el.filterId === filterId)[0];

        return filterMetadata ? filterMetadata.name : '';
    };

    const getStealthActionNames = (actions) => {
        const result = [];
        Object.keys(STEALTH_ACTIONS).forEach((key) => {
            const action = STEALTH_ACTIONS[key];
            if ((actions & action) === action) {
                result.push(STEALTH_ACTIONS_NAMES[key]);
            }
        });
        return result;
    };

    /**
     * Shows request info
     *
     * @param {Object} frameInfo
     * @param {Object} filteringEvent
     */
    const showRequestInfoModal = function (frameInfo, filteringEvent) {
        const template = requestInfoTemplate.cloneNode(true);

        const {
            requestRule,
            replaceRules,
            stealthActions,
            removeparamRules,
        } = filteringEvent;

        const requestUrlNode = template.querySelector('[attr-text="requestUrl"]');
        if (filteringEvent.requestUrl) {
            requestUrlNode.textContent = filteringEvent.requestUrl;
        } else {
            requestUrlNode.parentNode.style.display = 'none';
        }

        const elementNode = template.querySelector('[attr-text="element"]');
        if (filteringEvent.element) {
            elementNode.textContent = filteringEvent.element;
        } else {
            elementNode.parentNode.style.display = 'none';
        }

        const cookieNode = template.querySelector('[attr-text="cookie"]');
        if (filteringEvent.cookieName) {
            cookieNode.textContent = `${filteringEvent.cookieName} = ${filteringEvent.cookieValue}`;
        } else {
            cookieNode.parentNode.style.display = 'none';
        }

        template.querySelector('[attr-text="requestType"]').textContent = getRequestType(filteringEvent);
        template.querySelector('[attr-text="frameDomain"]').textContent = getSource(filteringEvent.frameDomain);
        if (!filteringEvent.frameDomain) {
            template.querySelector('[attr-text="frameDomain"]').closest('li').style.display = 'none';
        }

        if (requestRule
            && !requestRule.replaceRule
            && typeof requestRule.filterId !== 'undefined') {
            if (requestRule.filterId !== AntiBannerFiltersId.WHITE_LIST_FILTER_ID) {
                const requestRuleNode = template.querySelector('[attr-text="requestRule"]');
                requestRuleNode.textContent = requestRule.ruleText;
                if (requestRule.convertedRuleText) {
                    const convertedRuleHtml = `&nbsp<i>(Converted to: ${requestRule.convertedRuleText})</i>`;
                    requestRuleNode.insertAdjacentHTML('beforeend', convertedRuleHtml);
                }
            } else {
                template.querySelector('[attr-text="requestRule"]').closest('li').style.display = 'none';
            }
            template.querySelector('[attr-text="multipleRules"]').closest('li').style.display = 'none';
            template.querySelector('[attr-text="requestRuleFilter"]').textContent = getFilterName(requestRule.filterId);
        } else {
            template.querySelector('[attr-text="requestRule"]').closest('li').style.display = 'none';
            template.querySelector('[attr-text="requestRuleFilter"]').closest('li').style.display = 'none';
        }

        // we can use replaceRules and removeparamRules together in the condition
        // because we know that they won't be applied together
        if (replaceRules || removeparamRules) {
            const rules = replaceRules || removeparamRules;
            template.querySelector('[attr-text="requestRule"]').closest('li').style.display = 'none';
            template.querySelector('[attr-text="requestRuleFilter"]').closest('li').style.display = 'none';
            if (rules.length > 0) {
                template.querySelector('[attr-text="multipleRules"]').textContent = rules
                    .map(rule => rule.ruleText)
                    .join('\r\n');
            } else {
                template.querySelector('[attr-text="multipleRules"]').closest('li').style.display = 'none';
            }
        } else {
            template.querySelector('[attr-text="multipleRules"]').closest('li').style.display = 'none';
        }

        if (stealthActions) {
            template.querySelector('[attr-text="stealthActions"]').textContent = getStealthActionNames(stealthActions)
                .join('\r\n');
        } else {
            template.querySelector('[attr-text="stealthActions"]').closest('li').style.display = 'none';
        }

        if (filteringEvent.requestType === 'IMAGE') {
            template.classList.remove('compact-view');

            const imagePreview = template.querySelector('[attr-src="requestUrl"]');
            const image = new Image();
            image.src = filteringEvent.requestUrl;
            image.onload = function () {
                const { width } = this;
                const { height } = this;
                if (width > 1 && height > 1) {
                    imagePreview.setAttribute('src', filteringEvent.requestUrl);
                    imagePreview.parentNode.style.display = 'block';
                }
            };
        }

        // bind events
        const openRequestButton = template.querySelector('#openRequestNewTab');
        const blockRequestButton = template.querySelector('#blockRequest');
        const unblockRequestButton = template.querySelector('#unblockRequest');
        const removeWhiteListDomainButton = template.querySelector('#removeWhiteListDomain');
        const removeUserFilterRuleButton = template.querySelector('#removeUserFilterRule');

        openRequestButton.addEventListener('click', (e) => {
            e.preventDefault();

            let { requestUrl } = filteringEvent;
            if (requestUrl === 'content-security-policy-check') {
                requestUrl = filteringEvent.frameUrl;
            }

            contentPage.sendMessage({ type: 'openTab', url: requestUrl, options: { inNewWindow: true } });
        });

        // there is nothing to open if log event reveals blocked element or cookie
        if (filteringEvent.element
            || filteringEvent.cookieName
            || filteringEvent.script
        ) {
            openRequestButton.style.display = 'none';
        }

        blockRequestButton.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal();
            showCreateBlockRuleModal(frameInfo, filteringEvent);
        });

        unblockRequestButton.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal();
            showCreateExceptionRuleModal(frameInfo, filteringEvent);
        });

        removeWhiteListDomainButton.addEventListener('click', (e) => {
            e.preventDefault();
            contentPage.sendMessage({ type: 'unWhiteListFrame', frameInfo });
            closeModal();
        });

        removeUserFilterRuleButton.addEventListener('click', (e) => {
            e.preventDefault();
            contentPage.sendMessage({
                type: 'removeUserRule',
                ruleText: requestRule.ruleText,
            });

            closeModal();
        });

        if (!requestRule) {
            if (!filteringEvent.cspReportBlocked) {
                blockRequestButton.classList.remove('hidden');
            }
        } else if (requestRule.filterId === AntiBannerFiltersId.USER_FILTER_ID) {
            removeUserFilterRuleButton.classList.remove('hidden');
            if (requestRule.whiteListRule) {
                blockRequestButton.classList.remove('hidden');
            }
        } else if (requestRule.filterId === AntiBannerFiltersId.WHITE_LIST_FILTER_ID) {
            removeWhiteListDomainButton.classList.remove('hidden');
        } else if (!requestRule.whiteListRule) {
            unblockRequestButton.classList.remove('hidden');
        } else if (requestRule.whiteListRule) {
            blockRequestButton.classList.remove('hidden');
        }

        showModal(template);
    };

    /**
     * Initialization
     */
    const initRequestWizard = function () {
        requestInfoTemplate = document.querySelector('#modal-request-info');
        createBlockRuleTemplate = document.querySelector('#modal-create-block-rule');
        createExceptionRuleTemplate = document.querySelector('#modal-create-exception-rule');
    };

    return {
        initRequestWizard,
        showRequestInfoModal,
        closeModal,
        getFilterName,
        getRequestType,
        getSource,
    };
})();

const PageController = function () {
};

PageController.prototype = {

    init() {
        RequestWizard.initRequestWizard();

        this.logTable = document.querySelector('#logTable');
        this.logTableEmpty = document.querySelector('#logTableEmpty');
        this.logTableHidden = true;
        this.logoIcon = document.querySelector('#logoIcon');

        this.tabSelector = document.querySelector('#tabSelector');
        this.tabSelector.addEventListener('change', (e) => {
            document.location.hash = `#${e.target.selectedOptions[0].getAttribute('data-tab-id')}`;
        });

        // bind location hash change
        window.addEventListener('hashchange', () => {
            this._updateTabIdFromHash();
            this.onSelectedTabChange();
        });

        // Add preserve log status checkbox
        this.preserveLogEnabled = false;

        this.searchRequest = null;
        this.searchTypes = [];
        this.searchThirdParty = false;
        this.searchBlocked = false;
        this.searchWhitelisted = false;

        // Bind click to reload tab
        const reloadTabs = [].slice.call(document.querySelectorAll('.reloadTab'));
        if (reloadTabs.length <= 0) {
            return;
        }
        reloadTabs.forEach((reloadTab) => {
            reloadTab.addEventListener('click', (e) => {
                e.preventDefault();
                // Unable to reload "background" tab, just clear events
                if (this.currentTabId === -1) {
                    if (this.preserveLogEnabled) {
                        return;
                    }
                    contentPage.sendMessage({ type: 'clearEventsByTabId', tabId: this.currentTabId });
                    this.emptyLogTable();
                    return;
                }
                contentPage.sendMessage({
                    type: 'reloadTabById',
                    tabId: this.currentTabId,
                    preserveLogEnabled: this.preserveLogEnabled,
                });
            });
        });


        // Bind click to clear events
        document.querySelector('#clearTabLog').addEventListener('click', (e) => {
            e.preventDefault();
            this.emptyLogTable();
            contentPage.sendMessage({ type: 'clearEventsByTabId', tabId: this.currentTabId });
        });

        this._bindSearchFilters();

        // Bind click to preserve log
        document.querySelector('#preserveLog').addEventListener('click', (e) => {
            const checkbox = e.currentTarget.querySelector('.checkbox');
            this.preserveLogEnabled = checkbox.classList.contains('active');
        });

        this._updateTabIdFromHash();

        // Synchronize opened tabs
        contentPage.sendMessage({ type: 'synchronizeOpenTabs' }, (response) => {
            const { tabs } = response;
            for (let i = 0; i < tabs.length; i += 1) {
                this.onTabUpdated(tabs[i]);
            }
            this.onSelectedTabChange();
        });

        document.addEventListener('keyup', (e) => {
            if (e.keyCode === 27) {
                RequestWizard.closeModal();
            }
        });

        // On click to event row show RequestInfoModal
        this.logTable.addEventListener('click', (e) => {
            e.preventDefault();
            let element = e.target;
            let foundEventRow = false;
            while (element !== this.logTable && !foundEventRow) {
                if (element.tagName === 'TR') {
                    foundEventRow = true;
                } else {
                    element = element.parentNode;
                }
            }
            const filteringEvent = foundEventRow && element.data;
            if (filteringEvent) {
                contentPage.sendMessage({ type: 'getTabFrameInfoById', tabId: this.currentTabId }, (response) => {
                    const { frameInfo } = response;
                    if (!frameInfo) {
                        return;
                    }
                    RequestWizard.showRequestInfoModal(frameInfo, filteringEvent);
                });
            }
        });
    },

    // Try to retrieve tabId from hash
    _updateTabIdFromHash() {
        // Try to retrieve tabId from hash
        if (document.location.hash) {
            const tabId = document.location.hash.substring(1);
            if (tabId) {
                this.currentTabId = Number(tabId);
            }
        }
    },

    onTabAdded(tabInfo) {
        if (tabInfo.isExtensionTab) {
            return;
        }

        const option = document.createElement('option');
        option.textContent = tabInfo.title;
        option.setAttribute('data-tab-id', tabInfo.tabId);
        this.tabSelector.appendChild(option);

        if (!this.currentTabId) {
            this.onSelectedTabChange();
        }
    },

    onTabUpdated(tabInfo) {
        const item = this.tabSelector.querySelector(`[data-tab-id="${tabInfo.tabId}"]`);

        if (tabInfo.isExtensionTab) {
            this.onTabClose(tabInfo);
            return;
        }

        if (item) {
            item.textContent = tabInfo.title;
            if (tabInfo.tabId === this.currentTabId) {
                document.querySelector(`[data-tab-id="${this.currentTabId}"]`).selected = true;
                // update icon logo
                this._updateLogoIcon();
            }
        } else {
            this.onTabAdded(tabInfo);
        }
    },

    onTabClose(tabInfo) {
        const element = this.tabSelector.querySelector(`[data-tab-id="${tabInfo.tabId}"]`);
        if (!element) {
            return;
        }

        element.parentNode.removeChild(element);

        if (this.currentTabId === tabInfo.tabId) {
            // current tab was removed
            this.currentTabId = null;
            this.onSelectedTabChange();
        }
    },

    emptyLogTable() {
        while (this.logTable.firstChild) {
            this.logTable.removeChild(this.logTable.firstChild);
        }
    },

    onTabReset(tabInfo) {
        if (this.currentTabId === tabInfo.tabId && !this.preserveLogEnabled) {
            this.emptyLogTable();
            this._onEmptyTable();
        }
    },

    onEventAdded(tabInfo, event) {
        if (this.currentTabId !== tabInfo.tabId) {
            // don't relate to the current tab
            return;
        }

        if (event.requestType === 'DOCUMENT'
            && !event.element
            && !event.script
            && !this.preserveLogEnabled) {
            this.onTabReset(tabInfo);
        }

        this._renderEvents([event]);
    },

    onEventUpdated(tabInfo, event) {
        if (this.currentTabId !== tabInfo.tabId) {
            // don't relate to the current tab
            return;
        }

        const element = this.logTable.querySelector(`#request-${event.eventId}`);
        if (element) {
            const updatedTemplate = this._renderTemplate(event);
            this._handleEventShow(updatedTemplate);
            element.parentNode.replaceChild(updatedTemplate, element);
        }
    },

    onSelectedTabChange() {
        let selectedItem = this.tabSelector.querySelector(`[data-tab-id="${this.currentTabId}"]`);
        if (!selectedItem) {
            selectedItem = this.tabSelector.firstChild;
        }

        let selectedTabId = null;
        if (selectedItem) {
            selectedTabId = selectedItem.getAttribute('data-tab-id');
        }

        this.currentTabId = Number(selectedTabId);
        const selectedTab = document.querySelector(`[data-tab-id="${this.currentTabId}"]`);
        if (selectedTab) {
            selectedTab.selected = true;
        }

        this._updateLogoIcon();

        // render events
        this._renderEventsForTab(this.currentTabId);

        // Close modal if it was open
        RequestWizard.closeModal();
    },

    _updateLogoIcon() {
        contentPage.sendMessage({ type: 'getTabFrameInfoById', tabId: this.currentTabId }, (response) => {
            const src = 'images/shield.svg';
            this.logoIcon.setAttribute('src', src);
        });
    },

    removeClass(elements, className) {
        elements.forEach((el) => {
            el.classList.remove(className);
        });
    },

    _bindSearchFilters() {
        const self = this;

        // bind click to search http request
        document.querySelector('[name="searchEventRequest"]').addEventListener('keyup', function () {
            self.searchRequest = this.value.trim();
            self._filterEvents();
        });

        // bind click to filter by type
        const searchEventTypeItems = [].slice.call(document.querySelectorAll('.searchEventType'));
        searchEventTypeItems.forEach((item) => {
            item.addEventListener('click', (e) => {
                e.preventDefault();

                self.removeClass(searchEventTypeItems, 'active');

                const selectedItem = e.currentTarget;
                selectedItem.classList.add('active');
                const selectedValue = selectedItem.getAttribute('attr-type');

                self.searchTypes = selectedValue ? selectedValue.split(',') : [];
                self._filterEvents();
            });
        });

        const radioWraps = [].slice.call(document.querySelectorAll('.checkb-wrap'));
        radioWraps.forEach((w) => {
            w.addEventListener('click', () => {
                const checkbox = w.querySelector('.checkbox');
                checkbox.classList.toggle('active');

                const active = checkbox.classList.contains('active');
                if (w.classList.contains('searchEventThirdParty')) {
                    self.searchThirdParty = active;
                } else if (w.classList.contains('searchEventBlocked')) {
                    self.searchBlocked = active;
                } else if (w.classList.contains('searchEventWhitelisted')) {
                    self.searchWhitelisted = active;
                }

                self._filterEvents();
            });
        });
    },

    _filterEvents() {
        const rows = this.logTable.childNodes;

        // Filters not set
        if (!this.searchRequest
            && this.searchTypes.length === 0
            && !this.searchThirdParty
            && !this.searchBlocked
            && !this.searchWhitelisted) {
            this.removeClass(rows, 'hidden');
            return;
        }

        rows.forEach((row) => {
            this._handleEventShow(row);
        });
    },

    _onEmptyTable() {
        this.logTableHidden = true;
        this.logTable.classList.add('hidden');
        this.logTableEmpty.classList.remove('hidden');
    },

    _onNotEmptyTable() {
        if (this.logTableHidden) {
            this.logTableHidden = false;
            this.logTableEmpty.classList.add('hidden');
            this.logTable.classList.remove('hidden');
        }
    },

    _renderEventsForTab(tabId) {
        this.emptyLogTable();

        contentPage.sendMessage({ type: 'getFilteringInfoByTabId', tabId }, (response) => {
            const { filteringInfo } = response;

            let filteringEvents = [];
            if (filteringInfo) {
                filteringEvents = filteringInfo.filteringEvents || [];
            }

            this._renderEvents(filteringEvents);
        });
    },

    _renderEvents(events) {
        if (!events || events.length === 0) {
            this._onEmptyTable();
            return;
        }

        const templates = [];

        for (let i = 0; i < events.length; i += 1) {
            const template = this._renderTemplate(events[i]);
            this._handleEventShow(template);
            templates.push(template);
        }

        this._onNotEmptyTable();

        templates.forEach(function (t) {
            this.logTable.appendChild(t);
        });
    },

    _escapeHTML(text) {
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

    _renderTemplate(event) {
        const metadata = { data: event, class: '' };

        event.filterName = '';

        if (event.requestRule && event.requestRule.filterId !== undefined) {
            event.filterName = RequestWizard.getFilterName(event.requestRule.filterId);
        } else if (event.stealthActions) {
            event.filterName = i18n.getMessage('filtering_log_privacy_applied_rules');
        }

        if (event.replaceRules) {
            metadata.class += ' yellow';
        }

        if (event.removeparamRules) {
            metadata.class += ' yellow';
        }

        if (event.cspReportBlocked) {
            metadata.class += ' red';
        }

        if (event.requestRule && !event.replaceRules && !event.cspReportBlocked && !event.removeparamRules) {
            if (event.requestRule.whiteListRule) {
                metadata.class += ' green';
            } else if (event.requestRule.cssRule || event.requestRule.scriptRule) {
                metadata.class += ' yellow';
            } else if (event.requestRule.cookieRule) {
                if (event.requestRule.isModifyingCookieRule) {
                    metadata.class += ' yellow';
                } else {
                    metadata.class += ' red';
                }
            } else {
                metadata.class += ' red';
            }
        }

        if (event.eventId) {
            metadata.id = `request-${event.eventId}`;
        }

        let requestInfo;
        if (event.element) {
            requestInfo = this._escapeHTML(event.element);
        } else if (event.cookieName) {
            requestInfo = `${event.cookieName} = ${event.cookieValue}`;
        } else {
            requestInfo = event.requestUrl;
        }

        // Get rule text for requestRule or replaceRules
        let ruleText = '';
        if (event.requestRule) {
            if (event.requestRule.filterId === AntiBannerFiltersId.WHITE_LIST_FILTER_ID) {
                ruleText = Messages.IN_WHITELIST;
            } else {
                ruleText = event.requestRule.ruleText;
            }
        }

        if (event.replaceRules) {
            const rulesCount = event.replaceRules.length;
            ruleText = `${i18n.getMessage('filtering_log_modified_rules')} ${rulesCount}`;
        }

        if (event.removeparamRules) {
            const rulesCount = event.removeparamRules.length;
            ruleText = `${i18n.getMessage('filtering_log_modified_rules')} ${rulesCount}`;
        }

        let thirdPartyDetails = '';
        if (event.requestThirdParty) {
            thirdPartyDetails = '<img src="images/chain-link.svg" class="icon-chain"><small>Third party</small>';
        }

        const eventTemplate = `
            <tr ${metadata.id ? `id="${metadata.id}"` : ''}
                ${metadata.class ? `class="${metadata.class}"` : ''}>
                <td>${requestInfo}</td>
                <td>
                    ${RequestWizard.getRequestType(event)}
                    ${thirdPartyDetails}
                </td>
                <td>${ruleText || ''}</td>
                <td>
                    ${event.filterName}
                </td>
                <td>${RequestWizard.getSource(event.frameDomain)}</td>
            </tr>
        `;

        const element = htmlToElement(eventTemplate);
        element.data = metadata.data;
        return element;
    },

    _handleEventShow(el) {
        const filterData = el.data;

        let show = !this.searchRequest
            || StringUtils.containsIgnoreCase(filterData.requestUrl, this.searchRequest)
            || StringUtils.containsIgnoreCase(filterData.element, this.searchRequest)
            || StringUtils.containsIgnoreCase(filterData.cookieName, this.searchRequest)
            || StringUtils.containsIgnoreCase(filterData.cookieValue, this.searchRequest);

        if (filterData.requestRule && filterData.requestRule.ruleText) {
            show |= StringUtils.containsIgnoreCase(filterData.requestRule.ruleText, this.searchRequest);
        }

        if (filterData.filterName) {
            show |= StringUtils.containsIgnoreCase(filterData.filterName, this.searchRequest);
        }
        show &= this.searchTypes.length === 0 || this.searchTypes.indexOf(filterData.requestType) >= 0;

        let checkboxes = true;
        checkboxes &= !this.searchWhitelisted || (filterData.requestRule && filterData.requestRule.whiteListRule);
        checkboxes &= !this.searchBlocked || (filterData.requestRule && !filterData.requestRule.whiteListRule);
        checkboxes &= !this.searchThirdParty || filterData.requestThirdParty;
        show &= !(this.searchWhitelisted || this.searchBlocked || this.searchThirdParty) || checkboxes;

        if (show) {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    },
};

contentPage.sendMessage({ type: 'initializeFrameScript' }, (response) => {
    filtersMetadata = response.filtersMetadata;
    AntiBannerFiltersId = response.constants.AntiBannerFiltersId;
    EventNotifierTypes = response.constants.EventNotifierTypes;

    const onDocumentReady = function () {
        const pageController = new PageController();
        pageController.init();

        const events = [
            EventNotifierTypes.TAB_ADDED,
            EventNotifierTypes.TAB_UPDATE,
            EventNotifierTypes.TAB_CLOSE,
            EventNotifierTypes.TAB_RESET,
            EventNotifierTypes.LOG_EVENT_ADDED,
            EventNotifierTypes.LOG_EVENT_UPDATED,
        ];

        // set log is open
        contentPage.sendMessage({ type: 'onOpenFilteringLogPage' });

        createEventListener(events, (event, tabInfo, filteringEvent) => {
            switch (event) {
                case EventNotifierTypes.TAB_ADDED:
                case EventNotifierTypes.TAB_UPDATE:
                    pageController.onTabUpdated(tabInfo);
                    break;
                case EventNotifierTypes.TAB_CLOSE:
                    pageController.onTabClose(tabInfo);
                    break;
                case EventNotifierTypes.TAB_RESET:
                    pageController.onTabReset(tabInfo);
                    break;
                case EventNotifierTypes.LOG_EVENT_ADDED:
                    pageController.onEventAdded(tabInfo, filteringEvent);
                    break;
                case EventNotifierTypes.LOG_EVENT_UPDATED:
                    pageController.onEventUpdated(tabInfo, filteringEvent);
                    break;
                default:
                    break;
            }
        }, () => {
            // set log is closed
            contentPage.sendMessage({ type: 'onCloseFilteringLogPage' });
        });
    };

    if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading') {
        onDocumentReady();
    } else {
        document.addEventListener('DOMContentLoaded', onDocumentReady);
    }
});
