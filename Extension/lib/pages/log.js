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
/* global i18n, $, contentPage */
var PageController = function () {
    this.requestWizard = new RequestWizard();
};

var Messages = {
    OPTIONS_USERFILTER: i18n.getMessage('options_userfilter'),
    OPTIONS_WHITELIST: i18n.getMessage('options_whitelist'),
    IN_WHITELIST: i18n.getMessage('filtering_log_in_whitelist')
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
        return index < 0 ? "" : str.substring(index + separator.length);
    },

    substringBefore: function (str, separator) {
        if (!str || !separator) {
            return str;
        }
        var index = str.indexOf(separator);
        return index < 0 ? str : str.substring(0, index);
    }
};

var UrlUtils = {

    getProtocol: function (url) {
        var index = url.indexOf('//');
        if (index >= 0) {
            return url.substring(0, index);
        } else {
            // It's non hierarchical structured URL (e.g. stun: or turn:)
            index = url.indexOf(':');
            if (index >= 0) {
                return url.substring(0, index);
            }
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
    isHierarchicUrl: function(url){
        return url.indexOf('//') !== -1;
    }
};

var FilterRule = {
    MASK_WHITE_LIST: '@@',
    MASK_CSS_RULE: '##',
    MASK_CSS_INJECT_RULE: '#$#',
    MASK_CSS_EXTENDED_CSS_RULE: '#?#',
    MASK_CSS_INJECT_EXTENDED_CSS_RULE: '#$?#',
};

var UrlFilterRule = {
    MASK_START_URL: "||",
    MASK_ANY_SYMBOL: "*",
    MASK_SEPARATOR: "^",
    DOMAIN_OPTION: "domain",
    IMPORTANT_OPTION: "important",
    MATCH_CASE_OPTION: "match-case",
    THIRD_PARTY_OPTION: "third-party",
    OPTIONS_DELIMITER: "$",
    CSP_OPTION: "csp",
    WEBRTC_OPTION: "webrtc",
    WEBSOCKET_OPTION: "websocket"
};

PageController.prototype = {

    init: function () {

        this.logTable = $('#logTable');
        this.logTableEmpty = $('#logTableEmpty');
        this.logTableHidden = true;

        this.tabSelector = $('#tabSelector');
        this.tabSelectorValue = this.tabSelector.find('.task-manager-header-dropdown-select-text');
        this.tabSelectorList = this.tabSelector.find('.task-manager-header-dropdown-select-list');

        this.logoIcon = $('#logoIcon');

        this.tabSelectorValue.dropdown();

        this.tabSelector.on('show.bs.dropdown', function () {
            this.tabSelector.addClass('opened');
        }.bind(this));
        this.tabSelector.on('hide.bs.dropdown', function () {
            this.tabSelector.removeClass('opened');
        }.bind(this));

        // bind on change of selected tab
        this.tabSelectorList.on('click', 'div', function (e) {
            var el = $(e.currentTarget);
            document.location.hash = '#' + el.attr('data-tab-id');
        }.bind(this));

        // bind location hash change
        $(window).on('hashchange', function () {
            this._updateTabIdFromHash();
            this.onSelectedTabChange();
        }.bind(this));

        // Add preserve log status checkbox
        this.preserveLogEnabled = false;
        document.querySelector('#preserveLog').addEventListener('change', function (e) {
            this.preserveLogEnabled = e.target.checked;
        }.bind(this));

        this.searchRequest = null;
        this.searchTypes = [];
        this.searchThirdParty = false;
        this.searchBlocked = false;
        this.searchWhitelisted = false;

        // Bind click to reload tab
        $('.task-manager').on('click', '.reloadTab', function (e) {
            e.preventDefault();
            // Unable to reload "background" tab, just clear events
            if (this.currentTabId == -1) {
                if (this.preserveLogEnabled) {
                    return;
                }
                contentPage.sendMessage({ type: 'clearEventsByTabId', tabId: this.currentTabId });
                this.logTable.empty();
                return;
            }
            contentPage.sendMessage({ type: 'reloadTabById', tabId: this.currentTabId, preserveLogEnabled: this.preserveLogEnabled });
        }.bind(this));

        // Bind click to clear events
        $('#clearTabLog').on('click', function (e) {
            e.preventDefault();
            this.logTable.empty();
            contentPage.sendMessage({ type: 'clearEventsByTabId', tabId: this.currentTabId });
        }.bind(this));

        // Bind click to show request info
        var self = this;
        this.logTable.on('click', '.task-manager-content-header-body-row', function () {
            var filteringEvent = $(this).data();
            contentPage.sendMessage({type: 'getTabFrameInfoById', tabId: self.currentTabId}, function (response) {
                var frameInfo = response.frameInfo;
                if (!frameInfo) {
                    return;
                }
                self.requestWizard.showRequestInfoModal(frameInfo, filteringEvent);
            });
        });

        this._bindSearchFilters();

        this._updateTabIdFromHash();

        // Synchronize opened tabs
        contentPage.sendMessage({type: 'synchronizeOpenTabs'}, function (response) {
            var tabs = response.tabs;
            for (var i = 0; i < tabs.length; i++) {
                this.onTabUpdated(tabs[i]);
            }
            this.onSelectedTabChange();
        }.bind(this));
    },

    // Try to retrieve tabId from hash
    _updateTabIdFromHash: function () {
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
        this.tabSelectorList.append($('<div>', {
            'class': 'task-manager-header-dropdown-select-list-item',
            text: tabInfo.title,
            'data-tab-id': tabInfo.tabId
        }));
        if (!this.currentTabId) {
            this.onSelectedTabChange();
        }
    },

    onTabUpdated: function (tabInfo) {
        var item = this.tabSelectorList.find('[data-tab-id=' + tabInfo.tabId + ']');
        if (tabInfo.isExtensionTab) {
            this.onTabClose(tabInfo);
            return;
        }
        if (item && item.length > 0) {
            item.text(tabInfo.title);
            if (tabInfo.tabId == this.currentTabId) {
                this.tabSelectorValue.text(tabInfo.title);
                //update icon logo
                this._updateLogoIcon();
            }
        } else {
            this.onTabAdded(tabInfo);
        }
    },

    onTabClose: function (tabInfo) {
        this.tabSelectorList.find('[data-tab-id=' + tabInfo.tabId + ']').remove();
        if (this.currentTabId == tabInfo.tabId) {
            //current tab was removed
            this.currentTabId = null;
            this.onSelectedTabChange();
        }
    },

    onTabReset: function (tabInfo) {
        if (this.currentTabId == tabInfo.tabId && !this.preserveLogEnabled) {
            this.logTable.empty();
            this._onEmptyTable();
        }
    },

    onEventAdded: function (tabInfo, event) {
        if (this.currentTabId != tabInfo.tabId) {
            //don't relate to the current tab
            return;
        }

        if (event.requestType === 'DOCUMENT' && !event.element && !this.preserveLogEnabled) {
            this.onTabReset(tabInfo);
        }

        this._renderEvents([event]);
    },

    onEventUpdated: function (tabInfo, event) {
        if (this.currentTabId != tabInfo.tabId) {
            //don't relate to the current tab
            return;
        }
        var element = this.logTable.find('#request-' + event.requestId);
        if (element.length > 0) {
            var template = this._renderTemplate(event);
            element.replaceWith(template);
        }
    },

    onSelectedTabChange: function () {
        var selectedItem = this.tabSelectorList.find('[data-tab-id="' + this.currentTabId + '"]');
        if (selectedItem.length === 0) {
            selectedItem = this.tabSelectorList.find(':first');
        }
        var text = '';
        var selectedTabId = null;
        if (selectedItem.length > 0) {
            text = selectedItem.text();
            selectedTabId = selectedItem.attr('data-tab-id');
        }
        this.currentTabId = selectedTabId;
        this.tabSelectorValue.text(text);
        this._updateLogoIcon();
        //render events
        this._renderEventsForTab(this.currentTabId);
    },

    _updateLogoIcon: function () {
        contentPage.sendMessage({type: 'getTabFrameInfoById', tabId: this.currentTabId}, function (response) {
            var frameInfo = response.frameInfo;
            var src = 'skin/logpage/images/dropdown-logo.png';
            if (frameInfo && frameInfo.adguardDetected) {
                src = 'skin/logpage/images/dropdown-logo-blue.png';
            }
            this.logoIcon.attr('src', src);
        }.bind(this));
    },

    _bindSearchFilters: function () {

        var self = this;

        //bind click to search http request
        $('[name="searchEventRequest"]').on('keyup', function () {
            self.searchRequest = this.value.trim();
            self._filterEvents();
        });

        //bind click to filter by type
        var searchEventTypeItems = $('.searchEventType');
        searchEventTypeItems.on('click', function (e) {

            e.preventDefault();

            searchEventTypeItems.parent().removeClass('active');

            var selectedItem = $(e.currentTarget);
            selectedItem.parent().addClass('active');
            var selectedValue = selectedItem.attr('attr-type');

            self.searchTypes = selectedValue ? selectedValue.split(',') : [];
            self._filterEvents();
        });

        //bind click to filter by third party
        $('[name="searchEventThirdParty"]').on('change', function () {
            self.searchThirdParty = this.checked;
            self._filterEvents();
        });

        //bind click to filter by blocked
        $('[name="searchEventBlocked"]').on('change', function () {
            self.searchBlocked = this.checked;
            self._filterEvents();
        });

        //bind click to filter by whitelisted
        $('[name="searchEventWhitelisted"]').on('change', function () {
            self.searchWhitelisted = this.checked;
            self._filterEvents();
        });
    },

    _filterEvents: function () {

        var rows = this.logTable.children();

        // Filters not set
        if (!this.searchRequest &&
            this.searchTypes.length === 0 && !this.searchThirdParty && !this.searchBlocked && !this.searchWhitelisted) {

            rows.removeClass('hidden');
            return;
        }

        var self = this;
        $.each(rows, function () {
            self._handleEventShow($(this));
        });
    },

    _onEmptyTable: function () {
        this.logTableHidden = true;
        this.logTable.addClass('hidden');
        this.logTableEmpty.removeClass('hidden');
    },

    _onNotEmptyTable: function () {
        if (this.logTableHidden) {
            this.logTableHidden = false;
            this.logTableEmpty.addClass('hidden');
            this.logTable.removeClass('hidden');
        }
    },

    _renderEventsForTab: function (tabId) {

        this.logTable.empty();

        contentPage.sendMessage({type: 'getFilteringInfoByTabId', tabId: tabId}, function (response) {

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
        this.logTable.append(templates);
    },

    _renderTemplate: function (event) {
        event.filterName = event.requestRule ?
            RequestWizard.getFilterName(event.requestRule.filterId) :
            '';

        var metadata = {data: event, 'class': 'task-manager-content-header-body-row cf'};
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

        var ruleText = '';
        if (event.requestRule) {
            if (event.requestRule.filterId === AntiBannerFiltersId.WHITE_LIST_FILTER_ID) {
                ruleText = Messages.IN_WHITELIST;
            } else {
                ruleText = event.requestRule.ruleText;
            }
        }

        var requestTypeClass = 'task-manager-content-header-body-col task-manager-content-item-type';
        if (event.requestThirdParty) {
            requestTypeClass += ' third-party';
        }

        var el = $('<div>', metadata);
        el.append($('<div>', {
            text: event.requestUrl ? event.requestUrl : event.element,
            'class': 'task-manager-content-header-body-col task-manager-content-item-url'
        }));
        el.append($('<div>', {text: RequestWizard.getRequestType(event.requestType), 'class': requestTypeClass}));
        el.append($('<div>', {
            text: ruleText,
            'class': 'task-manager-content-header-body-col task-manager-content-item-rule'
        }));
        el.append($('<div>', {
            text: event.filterName,
            'class': 'task-manager-content-header-body-col task-manager-content-item-filter'
        }));
        el.append($('<div>', {
            text: RequestWizard.getSource(event.frameDomain),
            'class': 'task-manager-content-header-body-col task-manager-content-item-source'
        }));

        return el;
    },

    _handleEventShow: function (el) {

        var filterData = el.data();
        var show = !this.searchRequest ||
            StringUtils.containsIgnoreCase(filterData.requestUrl, this.searchRequest) ||
            StringUtils.containsIgnoreCase(filterData.element, this.searchRequest);

        if (filterData.requestRule && filterData.requestRule.ruleText) {
            show |= StringUtils.containsIgnoreCase(filterData.requestRule.ruleText, this.searchRequest);
        }

        if (filterData.filterName) {
            show |= StringUtils.containsIgnoreCase(filterData.filterName, this.searchRequest);
        }

        show &= this.searchTypes.length === 0 || this.searchTypes.indexOf(filterData.requestType) >= 0;

        var checkboxes = !(this.searchWhitelisted || this.searchBlocked || this.searchThirdParty);
        checkboxes |= this.searchWhitelisted && filterData.requestRule && filterData.requestRule.whiteListRule;
        checkboxes |= this.searchBlocked && filterData.requestRule && !filterData.requestRule.whiteListRule;
        checkboxes |= this.searchThirdParty && filterData.requestThirdParty;
        show &= checkboxes;

        if (show) {
            el.removeClass('hidden');
        } else {
            el.addClass('hidden');
        }
    }
};

var RequestWizard = function () {
    this.requestInfoTemplate = $('#modal-request-info');
    this.createBlockRuleTemplate = $('#modal-create-block-rule');
    this.createExceptionRuleTemplate = $('#modal-create-exception-rule');
};

RequestWizard.getFilterName = function (filterId) {
    if (filterId == AntiBannerFiltersId.USER_FILTER_ID) {
        return Messages.OPTIONS_USERFILTER;
    }
    if (filterId == AntiBannerFiltersId.WHITE_LIST_FILTER_ID) {
        return Messages.OPTIONS_WHITELIST;
    }
    var filterMetadata = filtersMetadata.filter(function (el) {
        return el.filterId == filterId;
    })[0];
    return filterMetadata ? filterMetadata.name : "";
};

RequestWizard.prototype.showModal = function (template) {

    $(document.body).append(template);
    template.show();

    template.modal();

    template.on('hidden.bs.modal', function () {
        $(this).remove();
    });

    this.currentModal = template;
};

RequestWizard.prototype.closeModal = function () {
    if (this.currentModal) {
        this.currentModal.modal('hide');
        this.currentModal = null;
    }
};

RequestWizard.prototype.showRequestInfoModal = function (frameInfo, filteringEvent) {

    var template = this.requestInfoTemplate.clone();

    var requestRule = filteringEvent.requestRule;

    var requestUrlNode = template.find('[attr-text="requestUrl"]');
    if (filteringEvent.requestUrl) {
        requestUrlNode.text(filteringEvent.requestUrl);
    } else {
        requestUrlNode.parent().hide();
    }

    var elementNode = template.find('[attr-text="element"]');
    if (filteringEvent.element) {
        elementNode.text(filteringEvent.element);
    } else {
        elementNode.parent().hide();
    }

    template.find('[attr-text="requestType"]').text(RequestWizard.getRequestType(filteringEvent.requestType));
    template.find('[attr-text="frameDomain"]').text(RequestWizard.getSource(filteringEvent.frameDomain));
    if (!filteringEvent.frameDomain) {
        template.find('[attr-text="frameDomain"]').closest('.adg-modal-window-locking-info-left-row').hide();
    }

    if (requestRule) {
        if (requestRule.filterId !== AntiBannerFiltersId.WHITE_LIST_FILTER_ID) {
            template.find('[attr-text="requestRule"]').text(requestRule.ruleText);
        } else {
            template.find('[attr-text="requestRule"]').closest('.adg-modal-window-locking-info-left-row').hide();
        }
        template.find('[attr-text="requestRuleFilter"]').text(RequestWizard.getFilterName(requestRule.filterId));
    } else {
        template.find('[attr-text="requestRule"]').closest('.adg-modal-window-locking-info-left-row').hide();
        template.find('[attr-text="requestRuleFilter"]').closest('.adg-modal-window-locking-info-left-row').hide();
    }

    if (filteringEvent.requestType === "IMAGE") {

        template.removeClass('compact-view');

        var imagePreview = template.find('[attr-src="requestUrl"]');
        var image = new Image();
        image.src = filteringEvent.requestUrl;
        image.onload = function () {
            var width = this.width;
            var height = this.height;
            if (width > 1 && height > 1) {
                imagePreview.attr('src', filteringEvent.requestUrl);
                imagePreview.parent().show();
            }
        };
    }

    //bind events
    var openRequestButton = template.find('#openRequestNewTab');
    var blockRequestButton = template.find('#blockRequest');
    var unblockRequestButton = template.find('#unblockRequest');
    var removeWhiteListDomainButton = template.find('#removeWhiteListDomain');
    var removeUserFilterRuleButton = template.find('#removeUserFilterRule');

    openRequestButton.on('click', function (e) {
        e.preventDefault();

        var requestUrl = filteringEvent.requestUrl;
        if (requestUrl === 'content-security-policy-check') {
            requestUrl = filteringEvent.frameUrl;
        }

        contentPage.sendMessage({type: 'openTab', url: requestUrl, options: {inNewWindow: true}});
    });

    // there is nothing to open if log event reveals blocked element
    if (filteringEvent.element) {
        openRequestButton.hide();
    }

    blockRequestButton.on('click', function (e) {
        e.preventDefault();
        this.closeModal();
        this.showCreateBlockRuleModal(frameInfo, filteringEvent);
    }.bind(this));

    unblockRequestButton.on('click', function (e) {
        e.preventDefault();
        this.closeModal();
        this.showCreateExceptionRuleModal(frameInfo, filteringEvent);
    }.bind(this));

    removeWhiteListDomainButton.on('click', function (e) {
        e.preventDefault();
        contentPage.sendMessage({type: 'unWhiteListFrame', frameInfo: frameInfo});
        this.closeModal();
    }.bind(this));

    removeUserFilterRuleButton.on('click', function (e) {
        e.preventDefault();
        contentPage.sendMessage({
            type: 'removeUserRule',
            ruleText: requestRule.ruleText,
            adguardDetected: frameInfo.adguardDetected
        });
        if (frameInfo.adguardDetected) {
            // In integration mode rule may be present in whitelist filter
            contentPage.sendMessage({type: 'unWhiteListFrame', frameInfo: frameInfo});
        }
        this.closeModal();
    }.bind(this));

    if (!requestRule) {
        blockRequestButton.removeClass('hidden');
    } else {
        if (requestRule.filterId === AntiBannerFiltersId.USER_FILTER_ID) {
            removeUserFilterRuleButton.removeClass('hidden');
        } else if (requestRule.filterId === AntiBannerFiltersId.WHITE_LIST_FILTER_ID) {
            removeWhiteListDomainButton.removeClass('hidden');
        } else if (!requestRule.whiteListRule) {
            unblockRequestButton.removeClass('hidden');
        }
    }

    this.showModal(template);
};

RequestWizard.prototype.showCreateBlockRuleModal = function (frameInfo, filteringEvent) {

    var template = this.createBlockRuleTemplate.clone();

    var patterns = RequestWizard.splitToPatterns(filteringEvent.requestUrl, filteringEvent.requestDomain, false).reverse();

    this._initCreateRuleDialog(frameInfo, template, patterns, filteringEvent);
};

RequestWizard.prototype.showCreateExceptionRuleModal = function (frameInfo, filteringEvent) {

    var template = this.createExceptionRuleTemplate.clone();

    var patterns;
    if (filteringEvent.requestUrl) {
        patterns = RequestWizard.splitToPatterns(filteringEvent.requestUrl, filteringEvent.requestDomain, true).reverse();
    }
    if (filteringEvent.requestUrl === 'content-security-policy-check') {
        patterns = ['@@'];
    }
    if (filteringEvent.element) {
        patterns = [RequestWizard.createExceptionCssRule(filteringEvent.requestRule, filteringEvent)];
    }
    this._initCreateRuleDialog(frameInfo, template, patterns, filteringEvent);
};

const generateExceptionRule = (ruleText, mask) => {
    const insert = (str, index, value) => {
        return str.slice(0, index) + value + str.slice(index);
    }
    const maskIndex = ruleText.indexOf(mask);
    const maskLength = mask.length;
    const rulePart = ruleText.slice(maskIndex + maskLength);
    // insert exception mark after first char
    const exceptionMask = insert(mask, 1, '@');
    return exceptionMask + rulePart;
};

RequestWizard.createExceptionCssRule = function (rule, event) {
    const ruleText = rule.ruleText;
    const domainPart = event.frameDomain;
    if (ruleText.indexOf(FilterRule.MASK_CSS_RULE) > -1) {
        return domainPart + generateExceptionRule(ruleText, FilterRule.MASK_CSS_RULE);
    }
    if (ruleText.indexOf(FilterRule.MASK_CSS_INJECT_RULE > -1)) {
        return domainPart + generateExceptionRule(ruleText, FilterRule.MASK_CSS_INJECT_RULE);
    }
    if (ruleText.indexOf(FilterRule.MASK_CSS_EXTENDED_CSS_RULE > -1)) {
        return domainPart + generateExceptionRule(ruleText, FilterRule.MASK_CSS_EXTENDED_CSS_RULE);
    }
    if (ruleText.indexOf(FilterRule.MASK_CSS_INJECT_EXTENDED_CSS_RULE > -1)) {
        return domainPart + generateExceptionRule(ruleText, FilterRule.MASK_CSS_INJECT_EXTENDED_CSS_RULE);
    }
}

RequestWizard.prototype._initCreateRuleDialog = function (frameInfo, template, patterns, filteringEvent) {
    var frameDomain = filteringEvent.frameDomain;
    var isThirdPartyRequest = filteringEvent.requestThirdParty;
    var rulePatternsEl = template.find('#rulePatterns');
    for (var i = 0; i < patterns.length; i++) {
        var patternEl = $('<div>', {'class': 'radio radio-patterns'});
        var input = $('<input>', {
            'class': 'radio-input',
            type: 'radio',
            name: 'rulePattern',
            id: 'pattern' + i,
            value: patterns[i]
        });
        var label = $('<label>', {
            'class': 'radio-label',
            'for': 'pattern' + i
        }).append($('<span>', {'class': 'radio-icon'})).append($('<span>', {
            'class': 'radio-label-text',
            text: patterns[i]
        }));
        patternEl.append(input);
        patternEl.append(label);
        rulePatternsEl.append(patternEl);
        if (i === 0) {
            input.attr('checked', 'checked');
        }
    }

    // hide options if filteringEvent is element
    var optionsArea = template.find('.addition-rule-row-left-options');
    if (filteringEvent.element) {
        optionsArea.parent().hide();
        rulePatternsEl.parent().hide();
    }

    var rulePatterns = template.find('[name="rulePattern"]');
    var ruleDomainCheckbox = template.find('[name="ruleDomain"]');
    var ruleImportantCheckbox = template.find('[name="ruleImportant"]');
    var ruleMatchCaseCheckbox = template.find('[name="ruleMatchCase"]');
    var ruleThirdPartyCheckbox = template.find('[name="ruleThirdParty"]');
    var ruleTextEl = template.find('[name="ruleText"]');

    ruleDomainCheckbox.attr('id', 'ruleDomain');
    ruleDomainCheckbox.parent().find('label').attr('for', 'ruleDomain');
    if (!frameDomain) {
        ruleDomainCheckbox.closest('.checkbox').hide();
    }

    ruleImportantCheckbox.attr('id', 'ruleImportant');
    ruleImportantCheckbox.parent().find('label').attr('for', 'ruleImportant');
    if (filteringEvent.element) {
        ruleImportantCheckbox.parent().hide();
    }

    ruleMatchCaseCheckbox.attr('id', 'ruleMatchCase');
    ruleMatchCaseCheckbox.parent().find('label').attr('for', 'ruleMatchCase');
    if (filteringEvent.element) {
        ruleMatchCaseCheckbox.parent().hide();
    }

    ruleThirdPartyCheckbox.attr('id', 'ruleThirdParty');
    ruleThirdPartyCheckbox.parent().find('label').attr('for', 'ruleThirdParty');
    if (isThirdPartyRequest) {
        ruleThirdPartyCheckbox.attr('checked', 'checked');
    }
    if (filteringEvent.element) {
        ruleThirdPartyCheckbox.parent().hide();
    }

    //bind events
    function updateRuleText() {

        var urlPattern = rulePatterns.filter(':checked').val();
        var permitDomain = !ruleDomainCheckbox.is(':checked');
        var important = ruleImportantCheckbox.is(':checked');
        var matchCase = ruleMatchCaseCheckbox.is(':checked');
        var thirdParty = ruleThirdPartyCheckbox.is(':checked');

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
            ruleText = RequestWizard.createCssRuleFromParams(urlPattern, permitDomain);
        } else {
            ruleText = RequestWizard.createRuleFromParams(urlPattern, domain, matchCase, thirdParty, important, mandatoryOptions);
        }
        ruleTextEl.val(ruleText);
    }

    //update rule text events
    ruleDomainCheckbox.on('change', updateRuleText);
    ruleImportantCheckbox.on('change', updateRuleText);
    ruleMatchCaseCheckbox.on('change', updateRuleText);
    ruleThirdPartyCheckbox.on('change', updateRuleText);
    rulePatterns.on('change', updateRuleText);

    //create rule event
    template.find('#createRule').on('click', function (e) {
        e.preventDefault();
        var ruleText = ruleTextEl.val();
        if (!ruleText) {
            return;
        }
        // Add rule to user filter
        contentPage.sendMessage({type: 'addUserRule', ruleText: ruleText, adguardDetected: frameInfo.adguardDetected});
        // Close modal
        this.closeModal();
    }.bind(this));

    updateRuleText();

    this.showModal(template);
};

RequestWizard.PATTERNS_COUNT = 2; //exclude domain and full request url

RequestWizard.splitToPatterns = function (requestUrl, domain, whitelist) {

    var hierarchicUrl = UrlUtils.isHierarchicUrl(requestUrl);
    var protocol = UrlUtils.getProtocol(requestUrl);

    var prefix;
    if (hierarchicUrl) {
        prefix = UrlFilterRule.MASK_START_URL; // Covers default protocols: http, ws
    }else {
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
        for (var i = 0; i < Math.min(parts.length - 1, RequestWizard.PATTERNS_COUNT); i++) {
            pattern += parts[i] + '/';
            patterns.push(prefix + pattern + UrlFilterRule.MASK_ANY_SYMBOL);
        }
        var file = parts[parts.length - 1];
        if (file && patterns.length < RequestWizard.PATTERNS_COUNT) {
            pattern += file;
            patterns.push(prefix + pattern);
        }
    }

    //add domain pattern to start
    patterns.unshift(prefix + domain + UrlFilterRule.MASK_SEPARATOR);

    //push full url pattern
    var url = UrlUtils.getUrlWithoutScheme(requestUrl);
    if (domain + '/' !== url) { // Don't duplicate: ||example.com/ and ||example.com^
        if (patterns.indexOf(prefix + url) < 0) {
            patterns.push(prefix + url);
        }
    }

    return patterns;
};

RequestWizard.createRuleFromParams = function (urlPattern, urlDomain, matchCase, thirdParty, important, mandatoryOptions) {

    var ruleText = urlPattern;
    var options = [];

    //add domain option
    if (urlDomain) {
        options.push(UrlFilterRule.DOMAIN_OPTION + '=' + urlDomain);
    }
    //add important option
    if (important) {
        options.push(UrlFilterRule.IMPORTANT_OPTION);
    }
    //add match case option
    if (matchCase) {
        options.push(UrlFilterRule.MATCH_CASE_OPTION);
    }
    //add third party option
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

RequestWizard.createCssRuleFromParams = function (urlPattern, permitDomain) {
    var ruleText = urlPattern;
    if (!permitDomain) {
        const index = ruleText.indexOf('#');
        ruleText = ruleText.slice(index);
    }
    return ruleText;
};

RequestWizard.getRequestType = function (requestType) {
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

RequestWizard.getSource = function (frameDomain) {
    return frameDomain || '';
};

var userSettings;
var environmentOptions;
var AntiBannerFiltersId;
var EventNotifierTypes;
var filtersMetadata;

contentPage.sendMessage({type: 'initializeFrameScript'}, function (response) {

    userSettings = response.userSettings;
    filtersMetadata = response.filtersMetadata;
    environmentOptions = response.environmentOptions;

    AntiBannerFiltersId = response.constants.AntiBannerFiltersId;
    EventNotifierTypes = response.constants.EventNotifierTypes;

    $(document).ready(function () {

        var pageController = new PageController();
        pageController.init(userSettings);

        function onEvent(event, tabInfo, filteringEvent) {
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
        }

        var events = [
            EventNotifierTypes.TAB_ADDED,
            EventNotifierTypes.TAB_UPDATE,
            EventNotifierTypes.TAB_CLOSE,
            EventNotifierTypes.TAB_RESET,
            EventNotifierTypes.LOG_EVENT_ADDED,
            EventNotifierTypes.LOG_EVENT_UPDATED
        ];

        //set log is open
        contentPage.sendMessage({type: 'onOpenFilteringLogPage'});

        var listenerId;
        //add listener for log events
        contentPage.sendMessage({type: 'addEventListener', events: events}, function (response) {
            listenerId = response.listenerId;
        });

        contentPage.onMessage.addListener(function (message) {
            if (message.type === 'notifyListeners') {
                onEvent.apply(this, message.args);
            }
        });

        var onUnload = function () {
            if (listenerId) {
                contentPage.sendMessage({type: 'removeListener', listenerId: listenerId});
                //set log is closed
                contentPage.sendMessage({type: 'onCloseFilteringLogPage'});
                listenerId = null;
            }
        };

        //unload event
        $(window).on('beforeunload', onUnload);
        $(window).on('unload', onUnload);
    });

});
