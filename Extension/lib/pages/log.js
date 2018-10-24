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

var PageController = function () {
};

var Messages = {
    OPTIONS_USERFILTER: i18n.getMessage('options_userfilter'),
    OPTIONS_WHITELIST: i18n.getMessage('options_whitelist'),
    IN_WHITELIST: i18n.getMessage('filtering_log_in_whitelist'),
};

var StringUtils = {

    startWith: function (str, prefix) {
        return str && str.indexOf(prefix) === 0;
    },

    containsIgnoreCase: function (str, searchString) {
        return str && searchString && str.toUpperCase().indexOf(searchString.toUpperCase()) >= 0;
    },

    substringAfter: function (str, separator) {
        if (!str) {
            return str;
        }
        var index = str.indexOf(separator);
        return index < 0 ? '' : str.substring(index + separator.length);
    },

    substringBefore: function (str, separator) {
        if (!str || !separator) {
            return str;
        }
        var index = str.indexOf(separator);
        return index < 0 ? str : str.substring(0, index);
    },
};

var UrlUtils = {

    getProtocol: function (url) {
        var index = url.indexOf('//');
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
    getUrlWithoutScheme: function (url) {
        var index = url.indexOf('//');
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
    isHierarchicUrl: function (url) {
        return url.indexOf('//') !== -1;
    },
};

/**
 * Modal window utils
 */
var ModalUtils = {
    showModal: function (element) {
        element.style.display = 'block';
    },

    closeModal: function (element) {
        element.remove();
    },
};

var FilterRule = {
    MASK_WHITE_LIST: '@@',
    MASK_CSS_RULE: '##',
    MASK_CSS_INJECT_RULE: '#$#',
    MASK_CSS_EXTENDED_CSS_RULE: '#?#',
    MASK_CSS_INJECT_EXTENDED_CSS_RULE: '#$?#',
};

var UrlFilterRule = {
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
};

PageController.prototype = {

    init: function () {
        RequestWizard.initRequestWizard();

        this.logTable = document.querySelector('#logTable');
        this.logTableEmpty = document.querySelector('#logTableEmpty');
        this.logTableHidden = true;
        this.logoIcon = document.querySelector('#logoIcon');

        this.tabSelector = document.querySelector('#tabSelector');
        this.tabSelector.addEventListener('change', function (e) {
            document.location.hash = '#' + e.target.selectedOptions[0].getAttribute('data-tab-id');
        });

        // bind location hash change
        window.addEventListener('hashchange', function () {
            this._updateTabIdFromHash();
            this.onSelectedTabChange();
        }.bind(this));

        // Add preserve log status checkbox
        this.preserveLogEnabled = false;

        this.searchRequest = null;
        this.searchTypes = [];
        this.searchThirdParty = false;
        this.searchBlocked = false;
        this.searchWhitelisted = false;

        // Bind click to reload tab
        document.querySelector('.reloadTab').addEventListener('click', function (e) {
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
            contentPage.sendMessage({ type: 'reloadTabById', tabId: this.currentTabId, preserveLogEnabled: this.preserveLogEnabled });
        }.bind(this));

        // Bind click to clear events
        document.querySelector('#clearTabLog').addEventListener('click', function (e) {
            e.preventDefault();
            this.emptyLogTable();
            contentPage.sendMessage({ type: 'clearEventsByTabId', tabId: this.currentTabId });
        }.bind(this));

        this._bindSearchFilters();

        // Bind click to preserve log
        document.querySelector('#preserveLog').addEventListener('click', function (e) {
            const checkbox = e.currentTarget.querySelector('.checkbox');
            this.preserveLogEnabled = checkbox.classList.contains('active');
        }.bind(this));

        this._updateTabIdFromHash();

        // Synchronize opened tabs
        contentPage.sendMessage({ type: 'synchronizeOpenTabs' }, function (response) {
            var tabs = response.tabs;
            for (let i = 0; i < tabs.length; i += 1) {
                this.onTabUpdated(tabs[i]);
            }
            this.onSelectedTabChange();
        }.bind(this));

        document.addEventListener('keyup', function (e) {
            if (e.keyCode === 27) {
                RequestWizard.closeModal();
            }
        });
    },

    // Try to retrieve tabId from hash
    _updateTabIdFromHash: function () {
        // Try to retrieve tabId from hash
        if (document.location.hash) {
            var tabId = document.location.hash.substring(1);
            if (tabId) {
                this.currentTabId = tabId;
            }
        }
    },

    onTabAdded: function (tabInfo) {
        if (tabInfo.isExtensionTab) {
            return;
        }

        var option = document.createElement('option');
        option.textContent = tabInfo.title;
        option.setAttribute('data-tab-id', tabInfo.tabId);
        this.tabSelector.appendChild(option);

        if (!this.currentTabId) {
            this.onSelectedTabChange();
        }
    },

    onTabUpdated: function (tabInfo) {
        var item = this.tabSelector.querySelector('[data-tab-id="' + tabInfo.tabId + '"]');
        if (tabInfo.isExtensionTab) {
            this.onTabClose(tabInfo);
            return;
        }

        if (item) {
            item.textContent = tabInfo.title;
            if (tabInfo.tabId == this.currentTabId) {
                document.querySelector('[data-tab-id="' + this.currentTabId + '"]').selected = true;
                // update icon logo
                this._updateLogoIcon();
            }
        } else {
            this.onTabAdded(tabInfo);
        }
    },

    onTabClose: function (tabInfo) {
        var element = this.tabSelector.querySelector('[data-tab-id="' + tabInfo.tabId + '"]');
        if (!element) {
            return;
        }

        element.parentNode.removeChild(element);

        if (this.currentTabId == tabInfo.tabId) {
            // current tab was removed
            this.currentTabId = null;
            this.onSelectedTabChange();
        }
    },

    emptyLogTable: function () {
        while (this.logTable.firstChild) {
            this.logTable.removeChild(this.logTable.firstChild);
        }
    },

    onTabReset: function (tabInfo) {
        if (this.currentTabId == tabInfo.tabId) {
            this.emptyLogTable();
            this._onEmptyTable();
        }
    },

    onEventAdded: function (tabInfo, event) {
        if (this.currentTabId != tabInfo.tabId) {
            // don't relate to the current tab
            return;
        }
        this._renderEvents([event]);
    },

    onEventUpdated: function (tabInfo, event) {
        if (this.currentTabId != tabInfo.tabId) {
            // don't relate to the current tab
            return;
        }

        const elements = this.logTable.querySelectorAll('#request-' + event.requestId);

        if (elements.length > 0) {
            for (let i = 0; i < elements.length; i += 1) {
                const element = elements[i];
                const elementData = element.data;
                const elementRequestUrl = elementData && elementData.requestUrl;
                if (elementRequestUrl && elementRequestUrl === event.requestUrl) {
                    element.parentNode.replaceChild(this._renderTemplate(event), element);
                }
            }
        }
    },

    onSelectedTabChange: function () {
        var selectedItem = this.tabSelector.querySelector('[data-tab-id="' + this.currentTabId + '"]');
        if (!selectedItem) {
            selectedItem = this.tabSelector.firstChild;
        }

        var text = '';
        var selectedTabId = null;
        if (selectedItem) {
            text = selectedItem.textContent;
            selectedTabId = selectedItem.getAttribute('data-tab-id');
        }

        this.currentTabId = selectedTabId;
        var selectedTab = document.querySelector('[data-tab-id="' + this.currentTabId + '"]');
        if (selectedTab) {
            selectedTab.selected = true;
        }

        this._updateLogoIcon();

        // render events
        this._renderEventsForTab(this.currentTabId);
    },

    _updateLogoIcon: function () {
        contentPage.sendMessage({ type: 'getTabFrameInfoById', tabId: this.currentTabId }, function (response) {
            var frameInfo = response.frameInfo;
            var src = 'images/icon-adguard.png';
            if (frameInfo && frameInfo.adguardDetected) {
                src = 'skin/logpage/images/dropdown-logo-blue.png'; // TODO: integration icon
            }

            this.logoIcon.setAttribute('src', src);
        }.bind(this));
    },

    removeClass: function (elements, className) {
        elements.forEach(function (el) {
            el.classList.remove(className);
        });
    },

    _bindSearchFilters: function () {
        var self = this;

        // bind click to search http request
        document.querySelector('[name="searchEventRequest"]').addEventListener('keyup', function () {
            self.searchRequest = this.value.trim();
            self._filterEvents();
        });

        // bind click to filter by type
        var searchEventTypeItems = document.querySelectorAll('.searchEventType');
        searchEventTypeItems.forEach(function (item) {
            item.addEventListener('click', function (e) {
                e.preventDefault();

                self.removeClass(searchEventTypeItems, 'active');

                var selectedItem = e.currentTarget;
                selectedItem.classList.add('active');
                var selectedValue = selectedItem.getAttribute('attr-type');

                self.searchTypes = selectedValue ? selectedValue.split(',') : [];
                self._filterEvents();
            });
        });

        var radioWraps = document.querySelectorAll('.checkb-wrap');
        radioWraps.forEach(function (w) {
            w.addEventListener('click', function () {
                var checkbox = w.querySelector('.checkbox');
                checkbox.classList.toggle('active');

                var active = checkbox.classList.contains('active');
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

    _filterEvents: function () {
        var rows = this.logTable.childNodes;

        // Filters not set
        if (!this.searchRequest &&
            this.searchTypes.length === 0 && !this.searchThirdParty && !this.searchBlocked && !this.searchWhitelisted) {
            this.removeClass(rows, 'hidden');
            return;
        }

        var self = this;
        rows.forEach(function (row) {
            self._handleEventShow(row);
        });
    },

    _onEmptyTable: function () {
        this.logTableHidden = true;
        this.logTable.classList.add('hidden');
        this.logTableEmpty.classList.remove('hidden');
    },

    _onNotEmptyTable: function () {
        if (this.logTableHidden) {
            this.logTableHidden = false;
            this.logTableEmpty.classList.add('hidden');
            this.logTable.classList.remove('hidden');
        }
    },

    _renderEventsForTab: function (tabId) {
        this.emptyLogTable();

        contentPage.sendMessage({ type: 'getFilteringInfoByTabId', tabId: tabId }, function (response) {
            var filteringInfo = response.filteringInfo;

            var filteringEvents = [];
            if (filteringInfo) {
                filteringEvents = filteringInfo.filteringEvents || [];
            }

            this._renderEvents(filteringEvents);
        }.bind(this));
    },

    _renderEvents: function (events) {
        if (!events || events.length === 0) {
            this._onEmptyTable();
            return;
        }
        var templates = [];
        for (var i = 0; i < events.length; i++) {
            var template = this._renderTemplate(events[i]);
            this._handleEventShow(template);
            templates.push(template);
        }
        this._onNotEmptyTable();

        // Bind click to show request info
        var self = this;
        templates.forEach(function (t) {
            t.addEventListener('click', function () {
                var filteringEvent = t.data;
                contentPage.sendMessage({ type: 'getTabFrameInfoById', tabId: self.currentTabId }, function (response) {
                    var frameInfo = response.frameInfo;
                    if (!frameInfo) {
                        return;
                    }

                    RequestWizard.showRequestInfoModal(frameInfo, filteringEvent);
                });
            });
        });

        templates.forEach(function (t) {
            this.logTable.appendChild(t);
        });
    },

    _escapeHTML: function (text) {
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

    _renderTemplate: function (event) {
        event.filterName = event.requestRule ? RequestWizard.getFilterName(event.requestRule.filterId) : '';
        var metadata = { data: event, class: '' };
        if (event.requestRule) {
            if (event.requestRule.whiteListRule) {
                metadata.class += ' green';
            } else if (event.requestRule.cssRule) {
                metadata.class += ' yellow';
            } else {
                metadata.class += ' red';
            }
        }
        if (event.requestId) {
            metadata.id = 'request-' + event.requestId;
        }

        var requestInfo = event.requestUrl ? event.requestUrl : this._escapeHTML(event.element);

        var ruleText = '';
        if (event.requestRule) {
            if (event.requestRule.filterId === AntiBannerFiltersId.WHITE_LIST_FILTER_ID) {
                ruleText = Messages.IN_WHITELIST;
            } else {
                ruleText = event.requestRule.ruleText;
            }
        }

        var thirdPartyDetails = '';
        if (event.requestThirdParty) {
            thirdPartyDetails = '<img src="images/chain-link.svg" class="icon-chain"><small>Third party</small>';
        }

        var eventTemplate = `
            <tr ${metadata.id ? 'id="' + metadata.id + '"' : ''}
                ${metadata.class ? 'class="' + metadata.class + '"' : ''}>
                <td>${requestInfo}</td>
                <td>
                    ${RequestWizard.getRequestType(event.requestType)}
                    ${thirdPartyDetails}
                </td>
                <td>${ruleText || ''}</td>
                <td>
                    ${event.filterName}
                </td>
                <td>${RequestWizard.getSource(event.frameDomain)}</td>
            </tr>`;

        var element = htmlToElement(eventTemplate);
        element.data = metadata.data;
        return element;
    },

    _handleEventShow: function (el) {
        var filterData = el.data;

        var show = !this.searchRequest ||
            StringUtils.containsIgnoreCase(filterData.requestUrl, this.searchRequest) ||
            StringUtils.containsIgnoreCase(filterData.element, this.searchRequest);

        if (filterData.requestRule && filterData.requestRule.ruleText) {
            show |= StringUtils.containsIgnoreCase(filterData.requestRule.ruleText, this.searchRequest);
        }

        if (filterData.filterName) {
            show |= StringUtils.containsIgnoreCase(filterData.filterName, this.searchRequest);
        }
        show &= this.searchTypes.length === 0 || this.searchTypes.indexOf(filterData.requestType) >= 0; // jshint ignore:line

        var checkboxes = true;
        checkboxes &= !this.searchWhitelisted || (filterData.requestRule && filterData.requestRule.whiteListRule); // jshint ignore:line
        checkboxes &= !this.searchBlocked || (filterData.requestRule && !filterData.requestRule.whiteListRule); // jshint ignore:line
        checkboxes &= !this.searchThirdParty || filterData.requestThirdParty; // jshint ignore:line
        show &= !(this.searchWhitelisted || this.searchBlocked || this.searchThirdParty) || checkboxes; // jshint ignore:line

        if (show) {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    },
};

/**
 * Request wizard
 *
 * @type {{showRequestInfoModal, closeModal, getFilterName, getRequestType, getSource}}
 */
var RequestWizard = (function () {
    // exclude domain and full request url
    var PATTERNS_COUNT = 2;

    var requestInfoTemplate;
    var createBlockRuleTemplate;
    var createExceptionRuleTemplate;

    var currentModal;

    var showModal = function (template) {
        closeModal();

        document.body.appendChild(template);
        ModalUtils.showModal(template);

        template.querySelector('.close').addEventListener('click', closeModal);

        currentModal = template;
    };

    var showCreateBlockRuleModal = function (frameInfo, filteringEvent) {
        var template = createBlockRuleTemplate.cloneNode(true);

        var patterns = splitToPatterns(filteringEvent.requestUrl, filteringEvent.requestDomain, false).reverse();

        initCreateRuleDialog(frameInfo, template, patterns, filteringEvent);
    };

    var showCreateExceptionRuleModal = function (frameInfo, filteringEvent) {
        var template = createExceptionRuleTemplate.cloneNode(true);

        var patterns;
        if (filteringEvent.requestUrl) {
            patterns = splitToPatterns(filteringEvent.requestUrl, filteringEvent.requestDomain, true).reverse();
        }
        if (filteringEvent.requestUrl === 'content-security-policy-check') {
            patterns = [FilterRule.MASK_WHITE_LIST];
        }

        if (filteringEvent.element) {
            patterns = [createExceptionCssRule(filteringEvent.requestRule, filteringEvent)];
        }

        initCreateRuleDialog(frameInfo, template, patterns, filteringEvent);
    };

    const generateExceptionRule = function (ruleText, mask) {
        const insert = (str, index, value) => {
            return str.slice(0, index) + value + str.slice(index);
        };

        const maskIndex = ruleText.indexOf(mask);
        const maskLength = mask.length;
        const rulePart = ruleText.slice(maskIndex + maskLength);
        // insert exception mark after first char
        const exceptionMask = insert(mask, 1, '@');
        return exceptionMask + rulePart;
    };

    const createExceptionCssRule = function (rule, event) {
        const ruleText = rule.ruleText;
        const domainPart = event.frameDomain;
        if (ruleText.indexOf(FilterRule.MASK_CSS_INJECT_RULE) > -1) {
            return domainPart + generateExceptionRule(ruleText, FilterRule.MASK_CSS_INJECT_RULE);
        }
        if (ruleText.indexOf(FilterRule.MASK_CSS_EXTENDED_CSS_RULE) > -1) {
            return domainPart + generateExceptionRule(ruleText, FilterRule.MASK_CSS_EXTENDED_CSS_RULE);
        }
        if (ruleText.indexOf(FilterRule.MASK_CSS_INJECT_EXTENDED_CSS_RULE) > -1) {
            return domainPart + generateExceptionRule(ruleText, FilterRule.MASK_CSS_INJECT_EXTENDED_CSS_RULE);
        }
        if (ruleText.indexOf(FilterRule.MASK_CSS_RULE) > -1) {
            return domainPart + generateExceptionRule(ruleText, FilterRule.MASK_CSS_RULE);
        }
    };

    var createCssRuleFromParams = function (urlPattern, permitDomain) {
        var ruleText = urlPattern;
        if (!permitDomain) {
            ruleText = ruleText.slice(ruleText.indexOf('#'));
        }

        return ruleText;
    };

    var initCreateRuleDialog = function (frameInfo, template, patterns, filteringEvent) {
        var frameDomain = filteringEvent.frameDomain;
        var isThirdPartyRequest = filteringEvent.requestThirdParty;

        var rulePatternsEl = template.querySelector('#rulePatterns');

        for (var i = 0; i < patterns.length; i++) {
            var rulePatternTemplate = `
                <li class="checkb-wrap">
                    <div class="radio">
                        <input class="radio__input" type="radio" name="rulePattern" id="pattern${i}" value="${patterns[i]}" ${i === 0 ? "checked='checked'" : ''}>
                        <label class="radio__label" for="pattern${i}">
                            ${patterns[i]}
                        </label>
                    </div>
                </li>`;

            rulePatternsEl.appendChild(htmlToElement(rulePatternTemplate));
        }

        var rulePatterns = template.querySelectorAll('[name="rulePattern"]');
        var ruleDomainCheckbox = template.querySelector('[name="ruleDomain"]');
        var ruleImportantCheckbox = template.querySelector('[name="ruleImportant"]');
        var ruleMatchCaseCheckbox = template.querySelector('[name="ruleMatchCase"]');
        var ruleThirdPartyCheckbox = template.querySelector('[name="ruleThirdParty"]');
        var ruleTextEl = template.querySelector('[name="ruleText"]');

        ruleDomainCheckbox.setAttribute('id', 'ruleDomain');
        ruleDomainCheckbox.parentNode.querySelector('label').setAttribute('for', 'ruleDomain');
        if (!frameDomain) {
            ruleDomainCheckbox.closest('.checkbox').style.display = 'none';
        }

        ruleImportantCheckbox.setAttribute('id', 'ruleImportant');
        ruleImportantCheckbox.parentNode.querySelector('label').setAttribute('for', 'ruleImportant');
        if (filteringEvent.requestRule &&
            filteringEvent.requestRule.whiteListRule) {
            ruleImportantCheckbox.setAttribute('checked', 'checked');
        }

        ruleMatchCaseCheckbox.setAttribute('id', 'ruleMatchCase');
        ruleMatchCaseCheckbox.parentNode.querySelector('label').setAttribute('for', 'ruleMatchCase');

        ruleThirdPartyCheckbox.setAttribute('id', 'ruleThirdParty');
        ruleThirdPartyCheckbox.parentNode.querySelector('label').setAttribute('for', 'ruleThirdParty');
        if (isThirdPartyRequest) {
            ruleThirdPartyCheckbox.setAttribute('checked', 'checked');
        }

        if (filteringEvent.element) {
            ruleImportantCheckbox.parentNode.style.display = 'none';
            ruleMatchCaseCheckbox.parentNode.style.display = 'none';
            ruleThirdPartyCheckbox.parentNode.style.display = 'none';
            var patternsField = template.querySelector('.filtering-modal-patterns');
            if (patternsField) {
                patternsField.style.display = 'none';
            }
            var optionsField = template.querySelector('.filtering-modal-options');
            if (optionsField) {
                optionsField.style.display = 'none';
            }
        }

        function updateRuleText() {
            var urlPattern = template.querySelector('[name="rulePattern"]:checked').value;
            var permitDomain = !ruleDomainCheckbox.checked;
            var important = !!ruleImportantCheckbox.checked;
            var matchCase = !!ruleMatchCaseCheckbox.checked;
            var thirdParty = !!ruleThirdPartyCheckbox.checked;

            var domain = permitDomain ? frameDomain : null;

            var mandatoryOptions = null;

            // Deal with csp rule
            var requestRule = filteringEvent.requestRule;
            if (requestRule && requestRule.cspRule) {
                mandatoryOptions = [UrlFilterRule.CSP_OPTION];
            }

            if (filteringEvent.requestUrl === 'content-security-policy-check') {
                mandatoryOptions = [UrlFilterRule.WEBRTC_OPTION, UrlFilterRule.WEBSOCKET_OPTION];
            }

            var ruleText;
            if (filteringEvent.element) {
                ruleText = createCssRuleFromParams(urlPattern, permitDomain);
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
        rulePatterns.forEach(function (r) {
            r.addEventListener('change', updateRuleText);
        });

        // create rule event
        template.querySelector('#createRule').addEventListener('click', function (e) {
            e.preventDefault();
            var ruleText = ruleTextEl.value;
            if (!ruleText) {
                return;
            }
            // Add rule to user filter
            contentPage.sendMessage({ type: 'addUserRule', ruleText: ruleText, adguardDetected: frameInfo.adguardDetected });
            // Close modal
            closeModal();
        });

        updateRuleText();

        showModal(template);
    };

    var splitToPatterns = function (requestUrl, domain, whitelist) {
        var hierarchicUrl = UrlUtils.isHierarchicUrl(requestUrl);
        var protocol = UrlUtils.getProtocol(requestUrl);

        var prefix;
        if (hierarchicUrl) {
            prefix = UrlFilterRule.MASK_START_URL; // Covers default protocols: http, ws
        } else {
            prefix = protocol + ':'; // Covers non-default protocols: stun, turn
        }

        if (whitelist) {
            prefix = FilterRule.MASK_WHITE_LIST + prefix;
        }

        var patterns = [];

        var relative = StringUtils.substringAfter(requestUrl, domain + '/');

        var path = StringUtils.substringBefore(relative, '?');
        if (path) {
            var parts = path.split('/');

            var pattern = domain + '/';
            for (var i = 0; i < Math.min(parts.length - 1, PATTERNS_COUNT); i++) {
                pattern += parts[i] + '/';
                patterns.push(prefix + pattern + UrlFilterRule.MASK_ANY_SYMBOL);
            }
            var file = parts[parts.length - 1];
            if (file && patterns.length < PATTERNS_COUNT) {
                pattern += file;
                patterns.push(prefix + pattern);
            }
        }

        // add domain pattern to start
        patterns.unshift(prefix + domain + UrlFilterRule.MASK_SEPARATOR);

        // push full url pattern
        var url = UrlUtils.getUrlWithoutScheme(requestUrl);
        if (domain + '/' !== url) { // Don't duplicate: ||example.com/ and ||example.com^
            if (patterns.indexOf(prefix + url) < 0) {
                patterns.push(prefix + url);
            }
        }

        return patterns;
    };

    var createRuleFromParams = function (urlPattern, urlDomain, matchCase, thirdParty, important, mandatoryOptions) {
        var ruleText = urlPattern;
        var options = [];

        // add domain option
        if (urlDomain) {
            options.push(UrlFilterRule.DOMAIN_OPTION + '=' + urlDomain);
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

    /**
     * Request type map
     *
     * @param {String} requestType
     * @returns {String}
     */
    var getRequestType = function (requestType) {
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
            case 'OBJECT_SUBREQUEST':
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
            case 'OTHER':
                return 'Other';
        }

        return '';
    };

    /**
     * Frame domain
     *
     * @param {String} frameDomain
     * @returns {String}
     */
    var getSource = function (frameDomain) {
        return frameDomain || '';
    };

    /**
     * Shows request info
     *
     * @param {Object} frameInfo
     * @param {Object} filteringEvent
     */
    var showRequestInfoModal = function (frameInfo, filteringEvent) {
        var template = requestInfoTemplate.cloneNode(true);

        var requestRule = filteringEvent.requestRule;

        var requestUrlNode = template.querySelector('[attr-text="requestUrl"]');
        if (filteringEvent.requestUrl) {
            requestUrlNode.textContent = filteringEvent.requestUrl;
        } else {
            requestUrlNode.parentNode.style.display = 'none';
        }

        var elementNode = template.querySelector('[attr-text="element"]');
        if (filteringEvent.element) {
            elementNode.textContent = filteringEvent.element;
        } else {
            elementNode.parentNode.style.display = 'none';
        }

        template.querySelector('[attr-text="requestType"]').textContent = getRequestType(filteringEvent.requestType);
        template.querySelector('[attr-text="frameDomain"]').textContent = getSource(filteringEvent.frameDomain);
        if (!filteringEvent.frameDomain) {
            template.querySelector('[attr-text="frameDomain"]').closest('li').style.display = 'none';
        }

        if (requestRule) {
            if (requestRule.filterId !== AntiBannerFiltersId.WHITE_LIST_FILTER_ID) {
                template.querySelector('[attr-text="requestRule"]').textContent = requestRule.ruleText;
            } else {
                template.querySelector('[attr-text="requestRule"]').closest('li').style.display = 'none';
            }
            template.querySelector('[attr-text="requestRuleFilter"]').textContent = getFilterName(requestRule.filterId);
        } else {
            template.querySelector('[attr-text="requestRule"]').closest('li').style.display = 'none';
            template.querySelector('[attr-text="requestRuleFilter"]').closest('li').style.display = 'none';
        }

        if (filteringEvent.requestType === 'IMAGE') {
            template.classList.remove('compact-view');

            var imagePreview = template.querySelector('[attr-src="requestUrl"]');
            var image = new Image();
            image.src = filteringEvent.requestUrl;
            image.onload = function () {
                var width = this.width;
                var height = this.height;
                if (width > 1 && height > 1) {
                    imagePreview.setAttribute('src', filteringEvent.requestUrl);
                    imagePreview.parentNode.style.display = 'block';
                }
            };
        }

        // bind events
        var openRequestButton = template.querySelector('#openRequestNewTab');
        var blockRequestButton = template.querySelector('#blockRequest');
        var unblockRequestButton = template.querySelector('#unblockRequest');
        var removeWhiteListDomainButton = template.querySelector('#removeWhiteListDomain');
        var removeUserFilterRuleButton = template.querySelector('#removeUserFilterRule');

        openRequestButton.addEventListener('click', function (e) {
            e.preventDefault();

            var requestUrl = filteringEvent.requestUrl;
            if (requestUrl === 'content-security-policy-check') {
                requestUrl = filteringEvent.frameUrl;
            }

            contentPage.sendMessage({ type: 'openTab', url: requestUrl, options: { inNewWindow: true } });
        });

        // there is nothing to open if log event reveals blocked element
        if (filteringEvent.element) {
            openRequestButton.style.display = 'none';
        }

        blockRequestButton.addEventListener('click', function (e) {
            e.preventDefault();
            closeModal();
            showCreateBlockRuleModal(frameInfo, filteringEvent);
        });

        unblockRequestButton.addEventListener('click', function (e) {
            e.preventDefault();
            closeModal();
            showCreateExceptionRuleModal(frameInfo, filteringEvent);
        });

        removeWhiteListDomainButton.addEventListener('click', function (e) {
            e.preventDefault();
            contentPage.sendMessage({ type: 'unWhiteListFrame', frameInfo: frameInfo });
            closeModal();
        });

        removeUserFilterRuleButton.addEventListener('click', function (e) {
            e.preventDefault();
            contentPage.sendMessage({
                type: 'removeUserRule',
                ruleText: requestRule.ruleText,
                adguardDetected: frameInfo.adguardDetected,
            });

            if (frameInfo.adguardDetected) {
                // In integration mode rule may be present in whitelist filter
                contentPage.sendMessage({ type: 'unWhiteListFrame', frameInfo: frameInfo });
            }

            closeModal();
        });

        if (!requestRule) {
            blockRequestButton.classList.remove('hidden');
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
     * Closes current open modal
     */
    var closeModal = function () {
        if (currentModal) {
            ModalUtils.closeModal(currentModal);
            currentModal = null;
        }
    };

    /**
     * Filter's name for filterId
     *
     * @param {Number} filterId
     * @returns {String}
     */
    var getFilterName = function (filterId) {
        if (filterId === AntiBannerFiltersId.USER_FILTER_ID) {
            return Messages.OPTIONS_USERFILTER;
        }
        if (filterId === AntiBannerFiltersId.WHITE_LIST_FILTER_ID) {
            return Messages.OPTIONS_WHITELIST;
        }

        var filterMetadata = filtersMetadata.filter(function (el) {
            return el.filterId === filterId;
        })[0];

        return filterMetadata ? filterMetadata.name : '';
    };

    /**
     * Initialization
     */
    var initRequestWizard = function () {
        requestInfoTemplate = document.querySelector('#modal-request-info');
        createBlockRuleTemplate = document.querySelector('#modal-create-block-rule');
        createExceptionRuleTemplate = document.querySelector('#modal-create-exception-rule');
    };

    return {
        initRequestWizard: initRequestWizard,
        showRequestInfoModal: showRequestInfoModal,
        closeModal: closeModal,
        getFilterName: getFilterName,
        getRequestType: getRequestType,
        getSource: getSource,
    };
})();

var userSettings;
var environmentOptions;
var AntiBannerFiltersId;
var EventNotifierTypes;
var filtersMetadata;

contentPage.sendMessage({ type: 'initializeFrameScript' }, function (response) {
    userSettings = response.userSettings;
    filtersMetadata = response.filtersMetadata;
    environmentOptions = response.environmentOptions;

    AntiBannerFiltersId = response.constants.AntiBannerFiltersId;
    EventNotifierTypes = response.constants.EventNotifierTypes;

    var onDocumentReady = function () {
        var pageController = new PageController();
        pageController.init();

        var events = [
            EventNotifierTypes.TAB_ADDED,
            EventNotifierTypes.TAB_UPDATE,
            EventNotifierTypes.TAB_CLOSE,
            EventNotifierTypes.TAB_RESET,
            EventNotifierTypes.LOG_EVENT_ADDED,
            EventNotifierTypes.LOG_EVENT_UPDATED,
        ];

        // set log is open
        contentPage.sendMessage({ type: 'onOpenFilteringLogPage' });

        createEventListener(events, function onEvent(event, tabInfo, filteringEvent) {
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
            }
        }, function () {
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
