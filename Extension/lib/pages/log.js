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

/* global i18n, contentPage, createEventListener */

var PageController = function () {
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
    MASK_WHITE_LIST: "@@"
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

        this.logTable = $("#logTable");
        this.logTableEmpty = $('#logTableEmpty');
        this.logTableHidden = true;

        this.tabSelector = $('#tabSelector');

        this.logoIcon = $('#logoIcon');

        // bind location hash change
        $(window).on('hashchange', function () {
            this._updateTabIdFromHash();
            this.onSelectedTabChange();
        }.bind(this));

        this.searchRequest = null;
        this.searchTypes = [];
        this.searchThirdParty = false;
        this.searchBlocked = false;
        this.searchWhitelisted = false;

		// Bind click to reload tab
		$('body').on('click', '.reloadTab', function (e) {
			e.preventDefault();
			if (this.currentTabId == -1) {
                // Unable to reload "background" tab, just clear events
                contentPage.sendMessage({type: 'clearEventsByTabId', tabId: this.currentTabId});
                return;
            }
			// Unable to reload "background" tab, just clear events
            if (this.currentTabId == -1) {
                contentPage.sendMessage({type: 'clearEventsByTabId', tabId: this.currentTabId});
                return;
            }contentPage.sendMessage({type: 'reloadTabById', tabId: this.currentTabId});
		}.bind(this));

        // Bind click to clear events
        $('#clearTabLog').on('click', function (e) {
            e.preventDefault();
            contentPage.sendMessage({type: 'clearEventsByTabId', tabId: this.currentTabId});
        }.bind(this));

        // Bind click to show request info
        var self = this;
        this.logTable.on('click', 'tr', function () {
            var filteringEvent = $(this).data();
            contentPage.sendMessage({type: 'getTabFrameInfoById', tabId: self.currentTabId}, function (response) {
                var frameInfo = response.frameInfo;
                if (!frameInfo) {
                    return;
                }
                RequestWizard.showRequestInfoModal(frameInfo, filteringEvent);
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

        $(document).keyup(function (e) {
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
		this.tabSelector.append($('<option>',{
			text: tabInfo.title,
			'data-tab-id': tabInfo.tabId
		}));
		if (!this.currentTabId) {
			this.onSelectedTabChange();
		}
	},

	onTabUpdated: function (tabInfo) {
		var item = this.tabSelector.find('[data-tab-id=' + tabInfo.tabId + ']');
		if (tabInfo.isExtensionTab) {
			this.onTabClose(tabInfo);
			return;
		}
		if (item && item.length > 0) {
			item.text(tabInfo.title);
			if (tabInfo.tabId == this.currentTabId) {
                document.querySelector('[data-tab-id="' + this.currentTabId + '"]').selected = true;
				//update icon logo
				this._updateLogoIcon();
			}
		} else {
			this.onTabAdded(tabInfo);
		}
	},

    onTabClose: function (tabInfo) {
        this.tabSelector.find('[data-tab-id=' + tabInfo.tabId + ']').remove();
        if (this.currentTabId == tabInfo.tabId) {
            //current tab was removed
            this.currentTabId = null;
            this.onSelectedTabChange();
        }
    },

    onTabReset: function (tabInfo) {
        if (this.currentTabId == tabInfo.tabId) {
            this.logTable.empty();
            this._onEmptyTable();
        }
    },

    onEventAdded: function (tabInfo, event) {
        if (this.currentTabId != tabInfo.tabId) {
            //don't relate to the current tab
            return;
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
		var selectedItem = this.tabSelector.find('[data-tab-id="' + this.currentTabId + '"]');
		if (selectedItem.length === 0) {
			selectedItem = this.tabSelector.find(':first');
		}
		var text = '';
		var selectedTabId = null;
		if (selectedItem.length > 0) {
			text = selectedItem.text();
			selectedTabId = selectedItem.attr('data-tab-id');
		}
		this.currentTabId = selectedTabId;
		document.querySelector('[data-tab-id="' + this.currentTabId + '"]').selected = true;
		this._updateLogoIcon();
		//render events
		this._renderEventsForTab(this.currentTabId);
	},

    _updateLogoIcon: function () {
        contentPage.sendMessage({type: 'getTabFrameInfoById', tabId: this.currentTabId}, function (response) {
            var frameInfo = response.frameInfo;
            var src = 'images/icon-adguard.png';
            if (frameInfo && frameInfo.adguardDetected) {
                src = 'skin/logpage/images/dropdown-logo-blue.png'; // TODO: integration icon
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

            searchEventTypeItems.removeClass('active');

            var selectedItem = $(e.currentTarget);
            selectedItem.addClass('active');
            var selectedValue = selectedItem.attr('attr-type');

            self.searchTypes = selectedValue ? selectedValue.split(',') : [];
            self._filterEvents();
        });

        $('.checkb-wrap').on('click', function () {
            var el = $(this);
            var checkbox = el.find('.checkbox');
            checkbox.toggleClass('active');
            var active = checkbox.is('.active');
            if (el.is('.searchEventThirdParty')) {
                self.searchThirdParty = active;
            } else if (el.is('.searchEventBlocked')) {
                self.searchBlocked = active;
            } else if (el.is('.searchEventWhitelisted')) {
                self.searchWhitelisted = active;
            }
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

        var metadata = {data: event};
        if (event.requestRule) {
            metadata.class += event.requestRule.whiteListRule ? ' green' : ' red';
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

        var el = $('<tr>', metadata);
        // Url
        el.append($('<td>', {text: event.requestUrl}));
        // Type
        var typeEl = $('<td>', {text: RequestWizard.getRequestType(event.requestType)});
        if (event.requestThirdParty) {
            typeEl.append($('<img/>', {src: "images/icon-chain-link.png", class: "icon-chain"}));
            typeEl.append($('<small>', {text: 'Third party'}));
        }
        el.append(typeEl);
        // Rule
        el.append($('<td>', {text: ruleText}));
        // Source
        el.append($('<td>', {text: event.requestRule ? RequestWizard.getFilterName(event.requestRule.filterId) : '',
			'class': 'task-manager-content-header-body-col task-manager-content-item-filter'
		}));
		el.append($('<div>', {
			text: RequestWizard.getSource(event.frameDomain)}));

        return el;
    },

    _handleEventShow: function (el) {

        var filterData = el.data();

        var show = !this.searchRequest || StringUtils.containsIgnoreCase(filterData.requestUrl, this.searchRequest);
        show &= this.searchTypes.length === 0 || this.searchTypes.indexOf(filterData.requestType) >= 0; // jshint ignore:line

        var checkboxes = true;
        checkboxes &= !this.searchWhitelisted || (filterData.requestRule && filterData.requestRule.whiteListRule); // jshint ignore:line
        checkboxes &= !this.searchBlocked || (filterData.requestRule && !filterData.requestRule.whiteListRule); // jshint ignore:line
        checkboxes &= !this.searchThirdParty || filterData.requestThirdParty; // jshint ignore:line
        show &= !(this.searchWhitelisted || this.searchBlocked || this.searchThirdParty) || checkboxes; // jshint ignore:line

        if (show) {
            el.removeClass('hidden');
        } else {
            el.addClass('hidden');
        }
    }
};

/**
 * Request wizard
 *
 * @type {{showRequestInfoModal, closeModal, getFilterName, getRequestType, getSource}}
 */
var RequestWizard = (function () {

    //exclude domain and full request url
    var PATTERNS_COUNT = 2;

    var requestInfoTemplate = $('#modal-request-info');
    var createBlockRuleTemplate = $('#modal-create-block-rule');
    var createExceptionRuleTemplate = $('#modal-create-exception-rule');

    var currentModal;

    var showModal = function (template) {
        closeModal();

        $(document.body).append(template);
        template.show();

        template.modal();

        template.on('hidden.bs.modal', function () {
            $(this).remove();
        });

        currentModal = template;
    };

    var showCreateBlockRuleModal = function (frameInfo, filteringEvent) {

        var template = createBlockRuleTemplate.clone();

        var patterns = splitToPatterns(filteringEvent.requestUrl, filteringEvent.requestDomain, false).reverse();

        initCreateRuleDialog(frameInfo, template, patterns, filteringEvent);
    };

    var showCreateExceptionRuleModal = function (frameInfo, filteringEvent) {

        var template = createExceptionRuleTemplate.clone();

        var patterns = splitToPatterns(filteringEvent.requestUrl, filteringEvent.requestDomain, true).reverse();

        if (filteringEvent.requestUrl === 'content-security-policy-check') {
            patterns = ['@@'];
        }

        initCreateRuleDialog(frameInfo, template, patterns, filteringEvent);
    };

    var initCreateRuleDialog = function (frameInfo, template, patterns, filteringEvent) {

        var frameDomain = filteringEvent.frameDomain;
        var isThirdPartyRequest = filteringEvent.requestThirdParty;

        var rulePatternsEl = template.find('#rulePatterns');
        for (var i = 0; i < patterns.length; i++) {
            var patternEl = $('<li>', {'class': 'checkb-wrap'});
            var input = $('<input>', {
                type: 'radio',
                name: 'rulePattern',
                id: 'pattern' + i,
                value: patterns[i]
            });
            var div = $('<div>', {class: 'radio'});
            var label = $('<label>', {'for': 'pattern' + i});
            patternEl.append(input);
            patternEl.append(label);
            label.append(div);
            label.append(document.createTextNode(patterns[i]));
            rulePatternsEl.append(patternEl);
            if (i === 0) {
                input.attr('checked', 'checked');
            }
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

        ruleMatchCaseCheckbox.attr('id', 'ruleMatchCase');
        ruleMatchCaseCheckbox.parent().find('label').attr('for', 'ruleMatchCase');

        ruleThirdPartyCheckbox.attr('id', 'ruleThirdParty');
        ruleThirdPartyCheckbox.parent().find('label').attr('for', 'ruleThirdParty');
        if (isThirdPartyRequest) {
            ruleThirdPartyCheckbox.attr('checked', 'checked');
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

            var ruleText = createRuleFromParams(urlPattern, domain, matchCase, thirdParty, important, mandatoryOptions);
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
            closeModal();
        }.bind(this));

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

    var createRuleFromParams = function (urlPattern, urlDomain, matchCase, thirdParty, important, mandatoryOptions) {

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
        var template = requestInfoTemplate.clone();

        var requestRule = filteringEvent.requestRule;

        template.find('[attr-text="requestUrl"]').text(filteringEvent.requestUrl);
        template.find('[attr-text="requestType"]').text(getRequestType(filteringEvent.requestType));
        template.find('[attr-text="frameDomain"]').text(getSource(filteringEvent.frameDomain));
        if (!filteringEvent.frameDomain) {
            template.find('[attr-text="frameDomain"]').closest('li').hide();
        }

        if (requestRule) {
            if (requestRule.filterId !== AntiBannerFiltersId.WHITE_LIST_FILTER_ID) {
                template.find('[attr-text="requestRule"]').text(requestRule.ruleText);
            } else {
                template.find('[attr-text="requestRule"]').closest('li').hide();
            }
            template.find('[attr-text="requestRuleFilter"]').text(getFilterName(requestRule.filterId));
        } else {
            template.find('[attr-text="requestRule"]').closest('li').hide();
            template.find('[attr-text="requestRuleFilter"]').closest('li').hide();
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

        blockRequestButton.on('click', function (e) {
            e.preventDefault();
            closeModal();
            showCreateBlockRuleModal(frameInfo, filteringEvent);
        });

        unblockRequestButton.on('click', function (e) {
            e.preventDefault();
            closeModal();
            showCreateExceptionRuleModal(frameInfo, filteringEvent);
        });

        removeWhiteListDomainButton.on('click', function (e) {
            e.preventDefault();
            contentPage.sendMessage({type: 'unWhiteListFrame', frameInfo: frameInfo});
            closeModal();
        });

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
            closeModal();
        });

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

        showModal(template);
    };

    /**
     * Closes current open modal
     */
    var closeModal = function () {
        if (currentModal) {
            currentModal.modal('hide');
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

        return filterMetadata ? filterMetadata.name : "";
    };

    return {
        showRequestInfoModal: showRequestInfoModal,
        closeModal: closeModal,
        getFilterName: getFilterName,
        getRequestType: getRequestType,
        getSource: getSource
    };

})();

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
        pageController.init();

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
                case EventNotifierTypes.LOG_EVENT_ADDED :
                    pageController.onEventAdded(tabInfo, filteringEvent);
                    break;
                case EventNotifierTypes.LOG_EVENT_UPDATED:
                    pageController.onEventUpdated(tabInfo, filteringEvent);
                    break;
            }
        }, function () {
            //set log is closed
            contentPage.sendMessage({type: 'onCloseFilteringLogPage'});
        });
	});
});
