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

	getParamValue: function (url, paramName) {
		var query = StringUtils.substringAfter(url, '?');
		if (query) {
			var params = query.split('&');
			for (var i = 0; i < params.length; i++) {
				var paramAndValue = params[i].split('=');
				if (paramAndValue[0] == paramName) {
					return paramAndValue[1];
				}
			}
		}
		return null;
	},

	getDomainName: function (url) {
		if (!this.linkHelper) {
			this.linkHelper = document.createElement('a');
		}
		this.linkHelper.href = url;
		var host = this.linkHelper.hostname;
		return StringUtils.startWith(host, "www.") ? host.substring(4) : host;
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
	MATCH_CASE_OPTION: "match-case",
	THIRD_PARTY_OPTION: "third-party",
	OPTIONS_DELIMITER: "$"
};

PageController.prototype = {

	init: function () {

		this.logTable = $("#logTable");
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

		//bind on change of selected tab
		this.tabSelectorList.on('click', 'div', function (e) {
			var el = $(e.currentTarget);
			this.currentTabId = el.attr('data-tab-id');
			this.onSelectedTabChange();
		}.bind(this));

		this.searchRequest = null;
		this.searchTypes = [];
		this.searchThirdParty = false;
		this.searchBlocked = false;
		this.searchWhitelisted = false;

		// Bind click to reload tab
		$('.task-manager').on('click', '.reloadTab', function (e) {
			e.preventDefault();
			contentPage.sendMessage({type: 'reloadTabById', tabId: this.currentTabId});
		}.bind(this));

		// Bind click to clear events
		$('#clearTabLog').on('click', function (e) {
			e.preventDefault();
			contentPage.sendMessage({type: 'clearEventsByTabId', tabId: this.currentTabId});
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

		// Synchronize opened tabs
		contentPage.sendMessage({type: 'synchronizeOpenTabs'}, function () {
			this._onOpenedTabsReceived();
		}.bind(this));
	},

	_onOpenedTabsReceived: function () {
		// Try to retrieve tabId from query string
		var tabId = UrlUtils.getParamValue(document.location.href, 'tabId');
		if (tabId) {
			this.currentTabId = tabId;
		}
		this.onSelectedTabChange();
	},

	onTabAdded: function (tabInfo) {
		//don't add not http tabs
		if (!tabInfo.isHttp) {
			return;
		}
		this.tabSelectorList.append($('<div>', {'class': 'task-manager-header-dropdown-select-list-item', text: tabInfo.tab.title, 'data-tab-id': tabInfo.tabId}));
		if (!this.currentTabId) {
			this.onSelectedTabChange();
		}
	},

	onTabUpdated: function (tabInfo) {
		var item = this.tabSelectorList.find('[data-tab-id=' + tabInfo.tabId + ']');
		if (!tabInfo.isHttp) {
			//remove not http tabs
			this.onTabClose(tabInfo);
			return;
		}
		if (item && item.length > 0) {
			item.text(tabInfo.tab.title);
			if (tabInfo.tabId == this.currentTabId) {
				this.tabSelectorValue.text(tabInfo.tab.title);
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
			this.searchTypes.length === 0 &&
			!this.searchThirdParty &&
			!this.searchBlocked && 
			!this.searchWhitelisted) {

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

		contentPage.sendMessage({type: 'getTabInfoById', tabId: tabId}, function (response) {

			var tabInfo = response.tabInfo;

			var filteringEvents = [];
			if (tabInfo) {
				filteringEvents = tabInfo.filteringEvents || [];
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

		var metadata = {data: event, 'class': 'task-manager-content-header-body-row cf'};
		if (event.requestRule) {
			metadata.class += event.requestRule.whiteListRule ? ' green' : ' red';
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
		el.append($('<div>', {text: event.requestUrl, 'class': 'task-manager-content-header-body-col task-manager-content-item-url'}));
		el.append($('<div>', {text: RequestWizard.getRequestType(event.requestType), 'class': requestTypeClass}));
		el.append($('<div>', {text: ruleText, 'class': 'task-manager-content-header-body-col task-manager-content-item-rule'}));
		el.append($('<div>', {text: RequestWizard.getSource(event.frameDomain), 'class': 'task-manager-content-header-body-col task-manager-content-item-source'}));

		return el;
	},

	_handleEventShow: function (el) {

		var filterData = el.data();

		var show = !this.searchRequest || StringUtils.containsIgnoreCase(filterData.requestUrl, this.searchRequest); 
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

	template.find('[attr-text="requestUrl"]').text(filteringEvent.requestUrl);
	template.find('[attr-text="requestType"]').text(RequestWizard.getRequestType(filteringEvent.requestType));
	template.find('[attr-text="frameDomain"]').text(RequestWizard.getSource(filteringEvent.frameDomain));
	if (!filteringEvent.frameDomain || filteringEvent.frameDomain === null) {
		template.find('[attr-text="frameDomain"]').closest('.adg-modal-window-locking-info-left-row').hide();
	}

	if (requestRule) {
		if (requestRule.filterId != AntiBannerFiltersId.WHITE_LIST_FILTER_ID) {
			template.find('[attr-text="requestRule"]').text(requestRule.ruleText);
		} else {
			template.find('[attr-text="requestRule"]').closest('.adg-modal-window-locking-info-left-row').hide();
		}
		template.find('[attr-text="requestRuleFilter"]').text(RequestWizard.getFilterName(requestRule.filterId));
	} else {
		template.find('[attr-text="requestRule"]').closest('.adg-modal-window-locking-info-left-row').hide();
		template.find('[attr-text="requestRuleFilter"]').closest('.adg-modal-window-locking-info-left-row').hide();
	}

	if (filteringEvent.requestType == "IMAGE") {

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
	template.find('#openRequestNewTab').on('click', function (e) {
		e.preventDefault();
		contentPage.sendMessage({type: 'openTab', url: filteringEvent.requestUrl, options: {inNewWindow: true}});
	});

	var blockRequestButton = template.find('#blockRequest');
	var unblockRequestButton = template.find('#unblockRequest');
	var removeWhiteListDomainButton = template.find('#removeWhiteListDomain');
	var removeUserFilterRuleButton = template.find('#removeUserFilterRule');

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
		contentPage.sendMessage({type: 'removeUserFilter', text: requestRule.ruleText});
		if (frameInfo.adguardDetected) {
			// In integration mode rule may be present in whitelist filter
			contentPage.sendMessage({type: 'unWhiteListFrame', frameInfo: frameInfo});
			contentPage.sendMessage({type: 'removeRuleFromApp', ruleText: requestRule.ruleText});
		}
		this.closeModal();
	}.bind(this));

	if (!requestRule) {
		blockRequestButton.removeClass('hidden');
	} else {
		if (requestRule.filterId == AntiBannerFiltersId.USER_FILTER_ID) {
			removeUserFilterRuleButton.removeClass('hidden');
		} else if (requestRule.filterId == AntiBannerFiltersId.WHITE_LIST_FILTER_ID) {
			removeWhiteListDomainButton.removeClass('hidden');
		} else if (!requestRule.whiteListRule) {
			unblockRequestButton.removeClass('hidden');
		}
	}

	this.showModal(template);
};

RequestWizard.prototype.showCreateBlockRuleModal = function (frameInfo, filteringEvent) {

	var template = this.createBlockRuleTemplate.clone();

	var patterns = RequestWizard.splitToPatterns(filteringEvent.requestUrl, UrlFilterRule.MASK_START_URL).reverse();

	this._initCreateRuleDialog(frameInfo, template, patterns, filteringEvent.frameDomain, filteringEvent.requestThirdParty);
};

RequestWizard.prototype.showCreateExceptionRuleModal = function (frameInfo, filteringEvent) {

	var template = this.createExceptionRuleTemplate.clone();

	var prefix = FilterRule.MASK_WHITE_LIST + UrlFilterRule.MASK_START_URL;
	var patterns = RequestWizard.splitToPatterns(filteringEvent.requestUrl, prefix).reverse();

	this._initCreateRuleDialog(frameInfo, template, patterns, filteringEvent.frameDomain, filteringEvent.requestThirdParty);
};

RequestWizard.prototype._initCreateRuleDialog = function (frameInfo, template, patterns, urlDomain, isThirdPartyRequest) {
	var rulePatternsEl = template.find('#rulePatterns');
	for (var i = 0; i < patterns.length; i++) {
		var patternEl = $('<div>', {'class': 'radio radio-patterns'});
		var input = $('<input>', {'class': 'radio-input', type: 'radio', name: 'rulePattern', id: 'pattern' + i, value: patterns[i]});
		var label = $('<label>', {'class': 'radio-label', 'for': 'pattern' + i}).append($('<span>', {'class': 'radio-icon'})).append($('<span>', {'class': 'radio-label-text', text: patterns[i]}));
		patternEl.append(input);
		patternEl.append(label);
		rulePatternsEl.append(patternEl);
		if (i == 0) {
			input.attr('checked', 'checked');
		}
	}

	var rulePatterns = template.find('[name="rulePattern"]');
	var ruleDomainCheckbox = template.find('[name="ruleDomain"]');
	var ruleMatchCaseCheckbox = template.find('[name="ruleMatchCase"]');
	var ruleThirdPartyCheckbox = template.find('[name="ruleThirdParty"]');
	var ruleTextEl = template.find('[name="ruleText"]');

	ruleDomainCheckbox.attr('id', 'ruleDomain');
	ruleDomainCheckbox.parent().find('label').attr('for', 'ruleDomain');
	if (!urlDomain || urlDomain == null) {
		ruleDomainCheckbox.closest('.checkbox').hide();
	}

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
		var matchCase = ruleMatchCaseCheckbox.is(':checked');
		var thirdParty = ruleThirdPartyCheckbox.is(':checked');

		var ruleText = RequestWizard.createRuleFromParams(urlPattern, urlDomain, permitDomain, matchCase, thirdParty);
		ruleTextEl.val(ruleText);
	}

	//update rule text events
	ruleDomainCheckbox.on('change', updateRuleText);
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
		//add rule to user filter
		contentPage.sendMessage({type: 'addUserFilterRule', text: ruleText});
		if (frameInfo.adguardDetected) {
			contentPage.sendMessage({type: 'addRuleToApp', ruleText: ruleText});
		}
		//close modal
		this.closeModal();
	}.bind(this));

	updateRuleText();

	this.showModal(template);
};

RequestWizard.PATTERNS_COUNT = 2; //exclude domain and full request url

RequestWizard.splitToPatterns = function (requestUrl, prefix) {

	var domain = UrlUtils.getDomainName(requestUrl);
	var patterns = [];//domain pattern

	var relative = StringUtils.substringAfter(requestUrl, domain + '/');

	var path = StringUtils.substringBefore(relative, '?');
	//var query = StringUtils.substringAfter(relative, '?');

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
	var url = StringUtils.substringAfter(requestUrl, '//');
	if (StringUtils.startWith(url, 'www.')) {
		url = url.substring(4);
	}
	if (patterns.indexOf(prefix + url) < 0) {
		patterns.push(prefix + url);
	}

	return patterns;
};

RequestWizard.createRuleFromParams = function (urlPattern, urlDomain, permitDomain, matchCase, thirdParty) {

	var ruleText = urlPattern;
	var options = [];

	//add domain option
	if (permitDomain && urlDomain) {
		options.push(UrlFilterRule.DOMAIN_OPTION + '=' + urlDomain);
	}
	//add match case option
	if (matchCase) {
		options.push(UrlFilterRule.MATCH_CASE_OPTION);
	}
	//add third party option
	if (thirdParty) {
		options.push(UrlFilterRule.THIRD_PARTY_OPTION);
	}
	if (options.length > 0) {
		ruleText += UrlFilterRule.OPTIONS_DELIMITER + options.join(',');
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
		case 'OBJECT-SUBREQUEST':
		case 'MEDIA':
			return 'Media';
		case 'FONT':
			return 'Font';
		case 'WEBSOCKET':
			return 'WebSocket';
		case 'OTHER':
			return 'Other';
	}
	return '';
};

RequestWizard.getSource = function (frameDomain) {
	return frameDomain || '';
};

var userSettings;
var enabledFilters;
var environmentOptions;
var AntiBannerFiltersId;
var EventNotifierTypes;
var LogEvents;
var filtersMetadata;

contentPage.sendMessage({type: 'initializeFrameScript'}, function (response) {

	userSettings = response.userSettings;
	enabledFilters = response.enabledFilters;
	filtersMetadata = response.filtersMetadata;
	environmentOptions = response.environmentOptions;

	AntiBannerFiltersId = response.constants.AntiBannerFiltersId;
	EventNotifierTypes = response.constants.EventNotifierTypes;
	LogEvents = response.constants.LogEvents;

	$(document).ready(function () {

		var pageController = new PageController();

		function onEvent(event, tabInfo, filteringEvent) {
			switch (event) {
				case LogEvents.TAB_ADDED:
					pageController.onTabAdded(tabInfo);
					break;
				case LogEvents.TAB_UPDATE:
					pageController.onTabUpdated(tabInfo);
					break;
				case LogEvents.TAB_CLOSE:
					pageController.onTabClose(tabInfo);
					break;
				case LogEvents.TAB_RESET:
					pageController.onTabReset(tabInfo);
					break;
				case LogEvents.EVENT_ADDED:
					pageController.onEventAdded(tabInfo, filteringEvent);
					break;
			}
		}

		var events = [
			LogEvents.TAB_ADDED,
			LogEvents.TAB_UPDATE,
			LogEvents.TAB_CLOSE,
			LogEvents.TAB_RESET,
			LogEvents.EVENT_ADDED
		];

		//set log is open
		contentPage.sendMessage({type: 'onOpenFilteringLogPage'});

		var listenerId;
		//add listener for log events
		contentPage.sendMessage({type: 'addEventListener', events: events}, function (response) {
			listenerId = response.listenerId;
		});

		contentPage.onMessage.addListener(function (message) {
			if (message.type == 'notifyListeners') {
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

		pageController.init();
	});

});
