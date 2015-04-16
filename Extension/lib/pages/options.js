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
var PageController = function () {
};

PageController.prototype = {

	DEFAULT_LIMIT: 20,

	isEditRuleNow: false,

	init: function () {

		this._bindEvents();
		this._render();
		this._initTopMenu();

		$(".sp-table-row-input").toggleCheckbox();

		updateDisplayAdguardPromo();
        customizePopupFooter();

		var currentAnchor = null;

		function checkAnchor() {
			var anchor = window.location.hash;
			if (anchor && anchor != currentAnchor) {
				currentAnchor = anchor;
				$('a.top-menu-item[href="' + anchor + '"]').click();
			}
			setTimeout(function () {
				checkAnchor();
			}, 100);
		}

		setTimeout(function () {
			checkAnchor();
		}, 100);
	},

	_bindEvents: function () {

		this.antiBannerFiltersList = $("#antiBannerFiltersList");
		this.antiBannerFiltersListEmpty = $("#antiBannerFiltersListEmpty");
		this.userFilters = $("#userFilters");
		this.wlFilters = $("#whiteListFilters");
		this.safebrowsingEnabledCheckbox = $("#safebrowsingEnabledCheckbox");
		this.sendSafebrowsingStatsCheckbox = $("#sendSafebrowsingStatsCheckbox");
		this.showPageStatisticCheckbox = $("#showPageStatisticCheckbox");
		this.allowAcceptableAdsCheckbox = $("#allowAcceptableAds");
		this.updateAntiBannerFiltersButton = $("#updateAntiBannerFilters");
		this.autodetectFiltersCheckbox = $("#autodetectFiltersCheckbox");
		this.importUserFilterInput = $("#importUserFilterInput");
		this.clearUserFilterButton = $("#clearUserFilter");
		this.importWlFilterInput = $("#importWhiteListFilterInput");
		this.clearWlFilterButton = $("#clearWhiteListFilter");
		this.userFilterSearchInput = $("#user-search");
		this.wlFilterSearchInput = $("#white-search");
		this.showInfoAboutAdguardFullVersionCheckbox = $("#showInfoAboutAdguardFullVersion");
		this.enableHitsCountCheckbox = $("#enableHitsCount");
		this.updatePopup = $("#filtersUpdatePopup");
		this.resetStatsPopup = $("#resetStatsPopup");
		this.enableShowContextMenuCheckbox = $('#enableShowContextMenu');
		if (Utils.isSafariBrowser()) {
			this.enableShowContextMenuCheckbox.closest('.s-page-table-row').hide();
		}
		this.subscriptionModalEl = $('#subscriptionModal');
		this.tooManySubscriptionsEl = $('#tooManySubscriptions');

		this.safebrowsingEnabledCheckbox.on('change', this.safebrowsingEnabledChange);
		this.sendSafebrowsingStatsCheckbox.on('change', this.sendSafebrowsingStatsChange);
		this.showPageStatisticCheckbox.on('change', this.showPageStatisticsChange);
		this.autodetectFiltersCheckbox.on('change', this.autodetectFiltersChange);
		this.allowAcceptableAdsCheckbox.on('change', this.allowAcceptableAdsChange);
		this.updateAntiBannerFiltersButton.on('click', this.updateAntiBannerFilters.bind(this));
		this.showInfoAboutAdguardFullVersionCheckbox.on('change', this.updateShowInfoAboutAdguardFullVersion);
		this.enableHitsCountCheckbox.on('change', this.changeEnableHitsCount);
		this.enableShowContextMenuCheckbox.on('change', this.changeEnableShowContextMenu);
		$("#resetStats").on('click', this.onResetStatsClicked.bind(this));

		$('.settings-page').on('click', '.editAntiBannerFilters', this._openSubscriptionModal.bind(this));

		var listSettings = $(".settings-page-lists");
		listSettings.on('click', '.addWhiteListFilter', this.onAddWhiteListFilterClicked.bind(this));
		listSettings.on('click', '.addUserFilter', this.onAddUserFilterClicked.bind(this));
		listSettings.on('click', '#importUserFilter', this.onImportUserFilterClicked.bind(this));
		listSettings.on('change', '#importUserFilterInput', this.onImportUserFilterInputChange.bind(this));
		listSettings.on('click', '#exportUserFilter', this.onExportUserFilterClicked.bind(this));
		listSettings.on('click', '#clearUserFilter', this.onClearUserFilterClicked.bind(this));
		listSettings.on('click', '#importWhiteListFilter', this.onImportWhiteListFilterClicked.bind(this));
		listSettings.on('change', '#importWhiteListFilterInput', this.onImportWhiteListFilterInputChange.bind(this));
		listSettings.on('click', '#exportWhiteListFilter', this.onExportWhiteListFilterClicked.bind(this));
		listSettings.on('click', '#clearWhiteListFilter', this.onClearWhiteListFilterClicked.bind(this));

		$(".openExtensionStore").on('click', function (e) {
			e.preventDefault();
			UI.openExtensionStore();
		});

		$("#openLog").on('click', function (e) {
			e.preventDefault();
			UI.openFilteringLog();
		});

		$("#openChangelog").on('click', function (e) {
			e.preventDefault();
			UI.openChangeLog();
		});

		this.wlFilters.jScrollPane({
			contentWidth: '0px',
			mouseWheelSpeed: 20
		});
		this.userFilters.jScrollPane({
			contentWidth: '0px',
			mouseWheelSpeed: 20
		});
		this._renderWhiteListOverlay();
		this._renderUserFilterListOverlay();

		var initSearch = function (el, input, listEl, renderFunc) {
			el.find(".sp-lists-user-table.sp-lists-search-table").find(".btn-search").on('click', function (e) {
				e.preventDefault();
				renderFunc.call(this);
			}.bind(this));
			input.on('keyup', Utils.debounce(renderFunc.bind(this), 300));
			listEl.bind('jsp-scroll-y', function (e, posY, isAtTop, isAtBottom) {
				if (isAtBottom) {
					renderFunc.call(this, true);
				}
			}.bind(this));
		}.bind(this);

		initSearch($("#whitelist"), this.wlFilterSearchInput, this.wlFilters, this._renderWhiteListFilters);
		initSearch($("#userfilter"), this.userFilterSearchInput, this.userFilters, this._renderUserFilters);
	},

	_initTopMenu: function () {
		var lastId;
		var topMenu = $(".top-menu");
		var firstItem = $("#general-settings");
		var topMenuHeight = topMenu.outerHeight() + 25;
		var menuItems = topMenu.find("a");
		var scrollItems = menuItems.map(function () {
			var item = $($(this).attr("href"));
			if (item.length) {
				return item;
			}
			return null;
		});

		menuItems.on('click', function (e) {
			e.preventDefault();
			var offsetTop = $(this.hash).offset().top - topMenuHeight + 1;
			$('html, body').stop().animate({
				scrollTop: offsetTop
			}, 300);
		});

		var onscroll = function () {
			var scrollTop = $(this).scrollTop();
			var fromTop = scrollTop + topMenuHeight;
			if (fromTop > topMenuHeight + 100) {
				topMenu.removeClass("affix affix-top").addClass("affix");
				firstItem.removeClass("affix affix-top").addClass("affix");
			} else {
				topMenu.removeClass("affix affix-top").addClass("affix-top");
				firstItem.removeClass("affix affix-top").addClass("affix-top");
			}

			if ($(document).height() - $(window).height() - scrollTop < 10) {
				//get the last item
				id = scrollItems[scrollItems.length - 1][0].id;
			} else {
				// Get id of current scroll item
				var cur = scrollItems.map(function () {
					if ($(this).offset().top < fromTop) {
						return this;
					}
					return null;
				});
				cur = cur[cur.length - 1];
				var id = cur && cur.length ? cur[0].id : "";
			}

			if (lastId !== id) {
				lastId = id;
				// Set/remove active class
				menuItems.removeClass("active");
				menuItems.filter("[href=#" + id + "]").addClass("active");
			}
		};
		$(window).on('scroll', onscroll);
		onscroll();
	},

	_render: function () {
		this._renderAntiBannerFilters();
		this._renderUserFilters();
		this._renderWhiteListFilters();
		var safebrowsingInfo = userSettings.getSafebrowsingInfo();
		this._renderSafebrowsingSection(safebrowsingInfo.enabled, safebrowsingInfo.sendStats);
		this._renderShowPageStatistics(userSettings.showPageStatistic(), Prefs.mobile);
		this._renderAllowAcceptableAds(antiBannerService.isAllowedAcceptableAds());
		this._renderAutodetectFilters(userSettings.isAutodetectFilters());
		this._renderShowInfoAboutAdguardFullVersion(userSettings.isShowInfoAboutAdguardFullVersion());
		this._renderCollectHitsCount(userSettings.collectHitsCount());
		this._renderShowContextMenu(userSettings.showContextMenu());
		if (Prefs.mobile) {
			$('#resetStats').hide();
		}
		this._initializeSubscriptionModal();
		this.checkSubscriptionsCount();
	},

	_onAddRuleEvent: function (filter, rule) {
		if (FilterUtils.isUserFilter(filter)) {
			this._renderUserFilter(rule.ruleText);
		} else if (FilterUtils.isWhiteListFilter(filter)) {
			var domain = Utils.getWhiteListDomain(rule.ruleText);
			if (domain) {
				this._renderWhiteListFilter(domain);
			}
		}
	},

	_onRemoveRuleEvent: function (filter, rule) {
		if (FilterUtils.isUserFilter(filter)) {
			this._removeEditableFilter(this.userFilters, rule.ruleText, this.clearUserFilterButton, this.userSearchResult.searchMode);
		} else if (FilterUtils.isWhiteListFilter(filter)) {
			this._removeEditableFilter(this.wlFilters, Utils.getWhiteListDomain(rule.ruleText), this.clearWlFilterButton, this.wlSearchResult.searchMode);
		}
	},

	_onAntiBannerFilterStateChange: function (antiBannerFilter) {
		var el = $("input[name='filterId'][value='" + antiBannerFilter.filterId + "']").closest(".s-page-table-row");
		var checkbox = el.find("input:checkbox");
		var handler = checkbox.next('.sp-table-row-pseudo');
		if (antiBannerFilter.enabled) {
			checkbox.attr("checked", "checked");
			handler.addClass("active");
			handler.closest(".s-page-table-row").addClass("active");
		} else {
			checkbox.removeAttr("checked");
			handler.removeClass("active");
			handler.closest(".s-page-table-row").removeClass("active");
		}
	},

	_updateAntiBannerFilter: function (antiBannerFilter) {
		var el = $("input[name='filterId'][value='" + antiBannerFilter.filterId + "']").closest(".s-page-table-row");
		if (el && el.length > 0) {
			var rendered = this._renderAntiBannerFilter(antiBannerFilter);
			el.replaceWith(rendered);
		}
	},

	_showFilterLoader: function (antiBannerFilter) {
		var el = $("input[name='filterId'][value='" + antiBannerFilter.filterId + "']").closest(".s-page-table-row");
		var loader = el.find(".preloader");
		loader.removeClass("hidden");
	},

	safebrowsingEnabledChange: function () {
		userSettings.changeEnableSafebrowsing(this.checked);
	},

	sendSafebrowsingStatsChange: function () {
		userSettings.changeSendSafebrowsingStats(this.checked);
	},

	showPageStatisticsChange: function () {
		userSettings.changeShowPageStatistic(this.checked);
	},

	autodetectFiltersChange: function () {
		userSettings.changeAutodetectFilters(this.checked);
	},

	allowAcceptableAdsChange: function () {
		antiBannerService.changeAcceptableAds(this.checked);
	},

	updateAntiBannerFilters: function (e) {
		e.preventDefault();
		antiBannerService.checkAntiBannerFiltersUpdate(true, function (updatedFilters) {
			this._showFiltersUpdatePopup(true, updatedFilters);
		}.bind(this), function () {
			this._showFiltersUpdatePopup(false);
		}.bind(this));
	},

	updateShowInfoAboutAdguardFullVersion: function (e) {
		e.preventDefault();
		userSettings.changeShowInfoAboutAdguardFullVersion(this.checked);
		updateDisplayAdguardPromo();
	},

	changeEnableHitsCount: function (e) {
		e.preventDefault();
		userSettings.changeCollectHitsCount(this.checked);
	},

	changeEnableShowContextMenu: function (e) {
		e.preventDefault();
		userSettings.changeShowContextMenu(this.checked);
	},

	onAddWhiteListFilterClicked: function (e) {
		e.preventDefault();
		this._renderWhiteListFilter(null);
	},

	onAddUserFilterClicked: function (e) {
		e.preventDefault();
		this._renderUserFilter(null);
	},

	onResetStatsClicked: function (e) {
		e.preventDefault();
		framesMap.resetBlockedAdsCount();
		this._onStatsReset();
	},

	onImportUserFilterClicked: function (e) {
		e.preventDefault();
		this.importUserFilterInput.trigger("click");
	},

	onImportWhiteListFilterClicked: function (e) {
		e.preventDefault();
		this.importWlFilterInput.trigger("click");
	},

	onImportUserFilterInputChange: function () {
		var fileInput = this.importUserFilterInput[0];
		var reader = new FileReader();
		reader.onload = function (e) {
			try {
				this._importUserFilterRules(e.target.result);
			} catch (e) {
				Log.error("Error load user rules {0}", e);
			}
			fileInput.value = '';
		}.bind(this);
		reader.onerror = function () {
			Log.error("Error load user rules");
			fileInput.value = '';
		};
		var file = fileInput.files[0];
		if (file) {
			reader.readAsText(file, "utf-8");
		}
	},

	onImportWhiteListFilterInputChange: function () {
		var fileInput = this.importWlFilterInput[0];
		var reader = new FileReader();
		reader.onload = function (e) {
			try {
				this._importWhiteListFilterRules(e.target.result);
			} catch (e) {
				Log.error("Error load whitelist rules {0}", e);
			}
			fileInput.value = '';
		}.bind(this);
		reader.onerror = function () {
			Log.error("Error load whitelist rules");
			fileInput.value = '';
		};
		var file = fileInput.files[0];
		if (file) {
			reader.readAsText(file, "utf-8");
		}
	},

	onExportUserFilterClicked: function (e) {
		e.preventDefault();
		UI.openExportRulesTab();
	},

	onExportWhiteListFilterClicked: function (e) {
		e.preventDefault();
		UI.openExportRulesTab(true);
	},

	onClearUserFilterClicked: function (e) {
		e.preventDefault();
		var message = ext.i18n.getMessage("options_userfilter_clear_confirm");
		if (!confirm(message)) {
			return;
		}
		antiBannerService.clearUserFilter();
	},

	onClearWhiteListFilterClicked: function (e) {
		e.preventDefault();
		var message = ext.i18n.getMessage("options_whitelistfilter_clear_confirm");
		if (!confirm(message)) {
			return;
		}
		antiBannerService.clearWhiteListFilter();
	},

	_renderSearchFilters: function (input, listEl, clearButton, sResult, renderFunc, searchFunc, loadNext) {

		loadNext = loadNext === true;

		if (!loadNext) {
			sResult.offset = 0;
			sResult.allLoaded = false;
		}

		if (this._isLoading || sResult.allLoaded) {
			return;
		}

		var text = input.val().trim();
		sResult.searchMode = !StringUtils.isEmpty(text);

		var rules = antiBannerService[searchFunc](sResult.offset, sResult.limit, text);
		if (rules.length < sResult.limit) {
			sResult.allLoaded = true;
		}
		sResult.offset += rules.length;
		sResult._isLoading = false;

		if (!loadNext) {
			this._clearEditableFilters(listEl, clearButton, sResult.searchMode);
		}
		for (var i = 0; i < rules.length; i++) {
			renderFunc.call(this, rules[i]);
		}
		this._checkOverlayHide(listEl, clearButton, sResult.searchMode);
	},

	_renderWhiteListFilters: function (loadNext) {
		if (!this.wlSearchResult) {
			this.wlSearchResult = {
				offset: 0,
				limit: this.DEFAULT_LIMIT,
				allLoaded: false
			}
		}
		this._renderSearchFilters(this.wlFilterSearchInput, this.wlFilters, this.clearWlFilterButton, this.wlSearchResult, this._renderWhiteListFilter, 'getWhiteListDomains', loadNext);
	},

	_renderWhiteListFilter: function (whiteListFilter) {
		var saveCallback = function (item) {
			var rule;
			if (item.isNew) {
				rule = antiBannerService.addWhiteListDomain(item.text);
			} else {
				//start edit rule
				this.isEditRuleNow = true;

				antiBannerService.removeWhiteListDomain(item.prevText);
				rule = antiBannerService.addWhiteListDomain(item.text);
			}
			return  rule ? Utils.getWhiteListDomain(rule.ruleText) : null;
		}.bind(this);

		var deleteCallback = function (item) {
			antiBannerService.removeWhiteListDomain(item.text);
		};
		this._renderEditableFilter(this.wlFilters, whiteListFilter, saveCallback, deleteCallback, this.clearWlFilterButton, this.wlSearchResult.searchMode);
	},

	_renderUserFilters: function (loadNext) {
		if (!this.userSearchResult) {
			this.userSearchResult = {
				offset: 0,
				limit: this.DEFAULT_LIMIT,
				allLoaded: false
			}
		}
		this._renderSearchFilters(this.userFilterSearchInput, this.userFilters, this.clearUserFilterButton, this.userSearchResult, this._renderUserFilter, 'getUserFilters', loadNext);
	},

	_renderUserFilter: function (userFilter) {
		var saveCallback = function (item) {
			var rule;
			if (item.isNew) {
				rule = antiBannerService.addUserFilterRule(item.text);
			} else {
				//start edit rule
				this.isEditRuleNow = true;

				antiBannerService.removeUserFilter(item.prevText);
				rule = antiBannerService.addUserFilterRule(item.text);
			}
			return rule ? rule.ruleText : null;
		}.bind(this);

		var deleteCallback = function (item) {
			antiBannerService.removeUserFilter(item.text);
		};
		this._renderEditableFilter(this.userFilters, userFilter, saveCallback, deleteCallback, this.clearUserFilterButton, this.userSearchResult.searchMode);
	},

	_renderEditableFilter: function (listEl, ruleText, saveCallback, deleteCallback, clearButton, searchMode) {
		var jScrollPane = listEl.data('jsp');
		if (!jScrollPane) {
			return;
		}

		var isNew = !ruleText;
		var el = this._getFilterRuleTemplate();

		//hide overlay
		this._hideOverlay(listEl);

		jScrollPane.getContentPane().append(el);
		jScrollPane.reinitialise();

		var editButton = el.find('.edit');
		var deleteButton = el.find('.delete');
		var saveButton = el.find('.save');
		var cancelButton = el.find('.cancel');
		var input = el.find("input[type='text']");
		var text = el.find('.rule-text');

		if (isNew) {
			startEdit();
		} else {
			el.data("ruleText", ruleText);
			text.text(ruleText);
			stopEdit();
		}

		function startEdit() {
			el.addClass("editing");
			var ruleText = el.data("ruleText");
			if (ruleText) {
				input.val(ruleText);
			}
			input.focus();
		}

		function stopEdit() {
			el.removeClass("editing");
		}

		function onSaveClicked() {
			var value = input.val().trim();
			if (!value) {
				return;
			}
			var newText = saveCallback({
				isNew: isNew,
				text: value,
				prevText: el.data("ruleText")
			});
			if (isNew) {
				removeEditableItem();
			} else {
				if (newText) {
					el.data("ruleText", newText);
					text.text(newText);
				}
				stopEdit();
			}
		}

		var self = this;

		function removeEditableItem() {
			el.remove();
			jScrollPane.reinitialise();
			self._checkOverlayHide(listEl, clearButton, searchMode);
		}

		function onCancelEditClicked() {
			if (isNew) {
				removeEditableItem();
			} else {
				stopEdit();
			}
		}

		//handle start edit
		editButton.click(function () {
			startEdit();
		});
		//handle save
		saveButton.click(onSaveClicked);
		input.on('keypress', function (e) {
			if (e.keyCode == 13) {
				e.preventDefault();
				onSaveClicked();
			}
		});
		//handle cancel edit
		cancelButton.click(onCancelEditClicked);
		$(document).keydown(function (e) {
			if (e.keyCode == 27) {
				onCancelEditClicked();
			}
		});
		deleteButton.click(function () {
			deleteCallback({text: el.data("ruleText")});
		});

		this._checkOverlayHide(listEl, clearButton, searchMode);
	},

	_removeEditableFilter: function (listEl, ruleText, clearButton, searchMode) {

		var jScrollPane = listEl.data('jsp');
		if (!jScrollPane) {
			return;
		}

		var filters = listEl.find(".spl-user-table-row");
		$.each(filters, function (index, f) {
			var $el = $(f);
			if ($el.data("ruleText") == ruleText) {
				$el.remove();
			}
		});
		jScrollPane.reinitialise();
		this._checkOverlayHide(listEl, clearButton, searchMode);
	},

	_clearEditableFilters: function (listEl, clearButton, searchMode) {
		var jScrollPane = listEl.data('jsp');
		if (!jScrollPane) {
			return;
		}

		var filters = listEl.find(".spl-user-table-row");
		filters.remove();
		jScrollPane.reinitialise();
		this._checkOverlayHide(listEl, clearButton, searchMode);
	},

	_renderAntiBannerFilters: function () {
		var antiBannerFilters = antiBannerService.getAntiBannerFiltersForOptionsPage();
		if (antiBannerFilters.length == 0) {
			this.antiBannerFiltersList.hide();
			this.antiBannerFiltersListEmpty.show();
		} else {
			this.antiBannerFiltersListEmpty.hide();
			this.antiBannerFiltersList.show();
			this.antiBannerFiltersList.empty();
			for (var i = 0; i < antiBannerFilters.length; i++) {
				var el = this._renderAntiBannerFilter(antiBannerFilters[i]);
				this.antiBannerFiltersList.append(el);
			}
		}
	},

	_renderAntiBannerFilter: function (antiBannerFilter) {

		var version = this._getAntiBannerFilterVersion(antiBannerFilter);
		var el = this._getAntiBannerFilterTemplate(antiBannerFilter.filterId, version, antiBannerFilter.name);

		var checkbox = el.find("input:checkbox");
		if (antiBannerFilter.enabled) {
			checkbox.attr("checked", "checked");
		} else {
			checkbox.removeAttr("checked");
		}
		if (antiBannerFilter._isDownloading) {
			el.find(".preloader").removeClass("hidden");
		} else {
			el.find(".preloader").addClass("hidden");
		}
		//apply checkbox
		checkbox.toggleCheckbox();
		//bind event
		checkbox.on("change", this._onAntiBannerFilterChange);

		return el;
	},

	_getAntiBannerFilterVersion: function (antiBannerFilter) {
		var versionTitle = "";
		if (antiBannerFilter.lastUpdateTime) {
			var lastUpdateTime = moment(antiBannerFilter.lastUpdateTime);
			lastUpdateTime.locale(Utils.getSupportedLocale());
			var date = lastUpdateTime.format("D MMMM YYYY").toLowerCase();
			var time = lastUpdateTime.format("HH:mm");
			versionTitle = ext.i18n.getMessage("options_filter_version", [antiBannerFilter.version, date, time]);
		}
		return versionTitle;
	},

	_onAntiBannerFilterChange: function () {
		var filterId = this.value - 0;
		if (this.checked) {
			antiBannerService.enableAntiBannerFilter(filterId);
		} else {
			antiBannerService.disableAntiBannerFilter(filterId);
		}
	},

	_renderSafebrowsingSection: function (safebrowsingEnabled, sendSafebrowsingStats) {
		this.safebrowsingEnabledCheckbox.updateCheckbox(safebrowsingEnabled);
		this.sendSafebrowsingStatsCheckbox.updateCheckbox(sendSafebrowsingStats);
	},

	_renderShowPageStatistics: function (showPageStatistic, isAndroid) {
		if (isAndroid) {
			this.showPageStatisticCheckbox.parent().hide();
			return;
		}
		this.showPageStatisticCheckbox.updateCheckbox(showPageStatistic);
	},

	_renderAutodetectFilters: function (autodectedFilters) {
		this.autodetectFiltersCheckbox.updateCheckbox(autodectedFilters);
	},

	_renderAllowAcceptableAds: function (allowAcceptableAds) {
		this.allowAcceptableAdsCheckbox.updateCheckbox(allowAcceptableAds);
	},

	_renderShowInfoAboutAdguardFullVersion: function (show) {
		this.showInfoAboutAdguardFullVersionCheckbox.updateCheckbox(show);
	},

	_renderCollectHitsCount: function (show) {
		this.enableHitsCountCheckbox.updateCheckbox(show);
	},

	_renderShowContextMenu: function (show) {
		this.enableShowContextMenuCheckbox.updateCheckbox(show);
	},

	_renderWhiteListOverlay: function () {
		this.wlFilters.append($('#whitelist-overlay').children())
	},

	_renderUserFilterListOverlay: function () {
		this.userFilters.append($('#userlist-overlay').children());
	},

	_checkOverlayHide: function (listEl, clearButton, searchMode) {
		var items = listEl.find(".spl-user-table-row");
		if (items.length == 0) {
			this._showOverlay(listEl, searchMode);
			if (!searchMode) {
				clearButton.hide();
			}
		} else {
			this._hideOverlay(listEl);
			clearButton.show();
		}
	},

	_showOverlay: function (listEl, searchMode) {
		this._hideOverlay(listEl);
		if (searchMode) {
			listEl.find(".sp-lists-table-overlay.overlay-search").removeClass("hidden");
		} else {
			listEl.find(".sp-lists-table-overlay:not(.overlay-search)").removeClass("hidden");
		}
	},

	_hideOverlay: function (listEl) {
		listEl.find(".sp-lists-table-overlay").addClass("hidden");
	},

	_importUserFilterRules: function (text) {
		var rules = text ? text.split(/[\r\n]+/) : [];
		antiBannerService.addUserFilterRules(rules);
	},

	_importWhiteListFilterRules: function (text) {
		var rules = text ? text.split(/[\r\n]+/) : [];
		antiBannerService.addWhiteListDomains(rules);
	},

	_onStatsReset: function () {
		this._showPopup(this.resetStatsPopup);
	},

	_showPopup: function (popup) {
		this.updatePopup.hide();
		this.resetStatsPopup.hide();
		popup.show();
		if (this.closePopupTimeoutId) {
			clearTimeout(this.closePopupTimeoutId);
		}
		this.closePopupTimeoutId = setTimeout(function () {
			this.updatePopup.hide();
			this.resetStatsPopup.hide();
		}.bind(this), 4000);
	},

	_showFiltersUpdatePopup: function (success, updatedFilters) {

		var result = UI.getFiltersUpdateResultInfo(success, updatedFilters);

		var $el = this.updatePopup.find('.alert-attention-text');

		$el.empty();

		for (var i = 0; i < result.text.length; i++) {
			if (i > 0) {
				$el.append('<br/>');
			}
			$el.append(document.createTextNode(result.text[i]));
		}

		this._showPopup(this.updatePopup);
	},

	_renderFiltersMetadataModal: function () {

		var groups = antiBannerService.getGroupsMetadata();

		var homepageText = ext.i18n.getMessage('options_modal_homepage');

		var allFilters = [];

		var allGroupsElements = [];

		for (var i = 0; i < groups.length; i++) {

			var group = groups[i];

			var filtersInGroupElements = [];
			var filters = antiBannerService.getFiltersMetadataForGroup(group.groupId);
			for (var j = 0; j < filters.length; j++) {

				var filter = filters[j];
				allFilters.push(filter);

				var filterElement = this._getFilterMetadataTemplate(filter.filterId, filter.name, filter.description, filter.homepage, homepageText);
				filtersInGroupElements.push(filterElement);
			}

			var groupElement = this._getGroupMetadataTemplate(group.groupId, group.groupName, i == 0 ? 'in' : '', filtersInGroupElements);
			allGroupsElements.push(groupElement);
		}

		var $groupsList = $('#groupsList');
		$groupsList.append(allGroupsElements);

		for (i = 0; i < allFilters.length; i++) {
			filter = allFilters[i];
			var checkbox = $groupsList.find('input[name="modalFilterId"][value="' + filter.filterId + '"]');
			if (antiBannerService.isAntiBannerFilterInstalled(filter.filterId) && antiBannerService.isAntiBannerFilterEnabled(filter.filterId)) {
				checkbox.attr("checked", "checked");
			} else {
				checkbox.removeAttr("checked");
			}
			checkbox.toggleCheckbox();
			checkbox.on("change", function (e) {
				this.checkSubscriptionsCount();
				this._renderEnabledFiltersForGroupSection($(e.currentTarget).data('groupId'));
			}.bind(this));

			checkbox.data('filterName', filter.name);
			checkbox.data('groupId', filter.groupId);
		}

		for (i = 0; i < groups.length; i++) {
			this._renderEnabledFiltersForGroupSection(groups[i].groupId);
		}
	},

	_initializeSubscriptionModal: function () {

		this.subscriptionModal = this.subscriptionModalEl.modal({
			backdrop: 'static',
			show: false
		});
		this.subscriptionModalEl.on('shown.bs.modal', this.checkSubscriptionsCount.bind(this));
		this.subscriptionModalEl.on('hidden.bs.modal', this.checkSubscriptionsCount.bind(this));

		this.subscriptionModalEl.find('#submitSubscriptions').on('click', function (e) {
			e.preventDefault();
			var selectedFilterIds = [];
			$.each(this.subscriptionModalEl.find('input[name="modalFilterId"]:checked'), function () {
				selectedFilterIds.push(this.value - 0);
			});
			this.subscriptionModalEl.modal('hide');
			this._onSubscriptionSubmitted(selectedFilterIds);
		}.bind(this));
	},

	_openSubscriptionModal: function (e) {

		e.preventDefault();

		this.subscriptionModalEl.find('#groupsList').empty();
		this._renderFiltersMetadataModal();
		this.subscriptionModal.modal('show');
	},

	_onSubscriptionSubmitted: function (filterIds) {
		antiBannerService.onFiltersSubscriptionChange(filterIds);
	},

	_renderEnabledFiltersForGroupSection: function (groupId) {
		var enabledFilterNames = [];
		var checkboxes = $('[name="modalFilterId"]:checkbox:checked');
		$.each(checkboxes, function () {
			var checkbox = $(this);
			var chGroupId = checkbox.data('groupId');
			if (chGroupId == groupId) {
				var filterName = checkbox.data('filterName');
				enabledFilterNames.push(StringUtils.replaceAll(filterName, ' ', '\u00A0'));
			}
		});
		var section = $('#group' + groupId).closest('.filter-panel').find('.spt-font-small');
		if (enabledFilterNames.length == 0) {
			section.empty();
			section.hide();
		} else {
			section.text(enabledFilterNames.join(', '));
			section.show();
		}
	},

	checkSubscriptionsCount: function () {

		var modalOpen = this.subscriptionModalEl.is('.in');
		if (!modalOpen) {
			this.tooManySubscriptionsEl.hide();
			return;
		}

		var enabledCount = this.subscriptionModalEl.find('input[name="modalFilterId"]:checked').length;

		if (enabledCount >= 9) {
			this.tooManySubscriptionsEl.show();
		} else {
			this.tooManySubscriptionsEl.hide();
		}
	},

	_getAntiBannerFilterTemplate: function (filterId, version, description) {
		return $('<div>', {class: 's-page-table-row cf'})
			.append($('<div>', {class: 'sp-table-row-label', text: description}).append($('<span>', {class: 'sp-table-row-info', text: version})))
			.append($('<input>', {type: 'checkbox', name: 'filterId', class: 'sp-table-row-input', value: filterId}))
			.append($('<div>', {class: 'preloader hidden'}));
	},

	_getFilterRuleTemplate: function () {

		var el = $('<div>', {class: 'spl-user-table-row cf'})
			.append($('<div>', {class: 'splu-table-row-label rule-text'}))
			.append($('<input>', {class: 'splu-table-row-input', type: 'text'}));

		var options = $('<div>', {class: 'splu-table-row-options'})
			.append($('<i>', {class: 'settings-options-icon-edit edit'}))
			.append($('<i>', {class: 'settings-options-icon-delete delete'}))
			.append($('<i>', {class: 'settings-options-icon-tick save'}))
			.append($('<i>', {class: 'settings-options-icon-cross cancel'}));

		el.append(options);
		return el;
	},

	_getGroupMetadataTemplate: function (groupId, groupName, collapseClass, filtersElements) {

		var el = $('<div>', {class: 'panel filter-panel'});

		var header = $('<div>', {class: 'settings-page-title spt-font-s'})
			.append($('<a>', {href: '#group' + groupId, 'data-parent': '#groupsList', 'data-toggle': 'collapse', class: 'spt-link-dashed collapsed', text: groupName}))
			.append($('<div>', {class: 'spt-font-small'}));

		var group = $('<div>', {id: 'group' + groupId, class: 'panel-collapse collapse ' + collapseClass})
			.append($('<div>', {class: 'settings-page-table'}).append(filtersElements));

		el.append(header).append(group);
		return el;
	},

	_getFilterMetadataTemplate: function (filterId, filterName, filterDescription, homepageLink, homepageText) {

		return  $('<div>', {class: 's-page-table-row cf'})
			.append($('<div>', {class: 'sp-table-row-label', text: filterName}).append($('<a>', {class: 'sp-table-row-info', href: homepageLink, text: homepageText, target: '_blank'})))
			.append($('<input>', {type: 'checkbox', name: 'modalFilterId', value: filterId, class: 'sp-table-row-input'}))
			.append($('<div>', {class: 'sp-table-row-descr', text: filterDescription}));

	}
};

var backgroundPage = ext.backgroundPage.getWindow();
var antiBannerService;
var EventNotifier;
var framesMap;
var UI;
var userSettings;
var EventNotifierTypes;
var Utils;
var StringUtils;
var FilterUtils;
var Prefs;

var onInit = function () {

	$(document).ready(function () {

		var controller = new PageController();
		controller.init();

		var events = [
			EventNotifierTypes.ADD_RULE,
			EventNotifierTypes.REMOVE_RULE,
			EventNotifierTypes.ENABLE_FILTER,
			EventNotifierTypes.DISABLE_FILTER,
			EventNotifierTypes.ADD_FILTER,
			EventNotifierTypes.REMOVE_FILTER,
			EventNotifierTypes.START_DOWNLOAD_FILTER,
			EventNotifierTypes.SUCCESS_DOWNLOAD_FILTER,
			EventNotifierTypes.ERROR_DOWNLOAD_FILTER,
			EventNotifierTypes.UPDATE_USER_FILTER_RULES,
			EventNotifierTypes.UPDATE_WHITELIST_FILTER_RULES
		];

		function eventListener(event, filter, rules) {
			switch (event) {
				case EventNotifierTypes.ADD_RULE:
					if (rules.length == 1) {
						if (controller.isEditRuleNow) {
							//edit rule finished
							controller.isEditRuleNow = false;
							break;
						}
						controller._onAddRuleEvent(filter, rules[0]);
					}
					break;
				case EventNotifierTypes.REMOVE_RULE:
					if (rules.length == 1) {
						//don't remove rules in edit mode
						if (controller.isEditRuleNow) {
							break;
						}
						controller._onRemoveRuleEvent(filter, rules[0]);
					}
					break;
				case EventNotifierTypes.ENABLE_FILTER:
				case EventNotifierTypes.DISABLE_FILTER:
					controller._onAntiBannerFilterStateChange(filter);
					controller.checkSubscriptionsCount();
					break;
				case EventNotifierTypes.ADD_FILTER:
				case EventNotifierTypes.REMOVE_FILTER:
					controller._renderAntiBannerFilters();
					break;
				case EventNotifierTypes.START_DOWNLOAD_FILTER:
					controller._showFilterLoader(filter);
					break;
				case EventNotifierTypes.SUCCESS_DOWNLOAD_FILTER:
				case EventNotifierTypes.ERROR_DOWNLOAD_FILTER:
					controller._updateAntiBannerFilter(filter);
					break;
				case EventNotifierTypes.UPDATE_USER_FILTER_RULES:
					controller._renderUserFilters();
					break;
				case EventNotifierTypes.UPDATE_WHITELIST_FILTER_RULES:
					controller._renderWhiteListFilters();
					break;
			}
		}

		//noinspection JSUnusedLocalSymbols
		function updatesListener(event, success, updatedFilters) {
			controller._showFiltersUpdatePopup(success, updatedFilters);
		}

		var listenerIdEvent = EventNotifier.addSpecifiedListener(events, eventListener);
		var listenerIdUpdate = EventNotifier.addSpecifiedListener([EventNotifierTypes.UPDATE_FILTERS_SHOW_POPUP], updatesListener);

		var onUnload = function () {
			if (listenerIdEvent) {
				EventNotifier.removeListener(listenerIdEvent);
				EventNotifier.removeListener(listenerIdUpdate);
				listenerIdEvent = null;
			}
		};

		//unload event
		$(window).on('beforeunload', onUnload);
		$(window).on('unload', onUnload);
	})
};

function init() {

	if (!(backgroundPage.antiBannerService && backgroundPage.antiBannerService.requestFilterReady)) {
		setTimeout(function () {
			init();
		}, 10);
		return;
	}

	antiBannerService = backgroundPage.antiBannerService;
	Prefs = backgroundPage.Prefs;
	EventNotifier = backgroundPage.EventNotifier;
	framesMap = backgroundPage.framesMap;
	UI = backgroundPage.UI;
	userSettings = backgroundPage.userSettings;
	EventNotifierTypes = backgroundPage.EventNotifierTypes;
	Utils = backgroundPage.Utils;
	StringUtils = backgroundPage.StringUtils;
	FilterUtils = backgroundPage.FilterUtils;
	onInit();
}
init();
