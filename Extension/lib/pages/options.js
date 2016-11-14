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
/* global $, updateDisplayAdguardPromo, customizePopupFooter, contentPage, i18n, Log, moment */
var PageController = function () {
};

PageController.prototype = {

    DEFAULT_LIMIT: 200,

    omitRenderEventsCount: 0,

    linkHelper: null,

    SUBSCRIPTIONS_LIMIT: 9,

    init: function () {

        this.linkHelper = document.createElement('a');

        this._bindEvents();
        this._render();
        this._initTopMenu();

        $(".sp-table-row-input").toggleCheckbox();

        updateDisplayAdguardPromo(!userSettings.values[userSettings.names.DISABLE_SHOW_ADGUARD_PROMO_INFO]);
        customizePopupFooter(environmentOptions.isMacOs);

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
        this.resetStatsPopup = $("#resetStatsPopup");
        this.enableShowContextMenuCheckbox = $('#enableShowContextMenu');
        this.useOptimizedFiltersCheckbox = $('#useOptimizedFilters');
        this.changeDefaultWhiteListModeCheckbox = $('#changeDefaultWhiteListMode');
        if (environmentOptions.isSafariBrowser) {
            this.enableShowContextMenuCheckbox.closest('.s-page-table-row').hide();
        }
        this.subscriptionModalEl = $('#subscriptionModal');
        this.tooManySubscriptionsEl = $('#tooManySubscriptions');
        this.tooManyRulesEl = $('#tooManyRules');

        this.safebrowsingEnabledCheckbox.on('change', this.safebrowsingEnabledChange);
        this.sendSafebrowsingStatsCheckbox.on('change', this.sendSafebrowsingStatsChange);
        this.showPageStatisticCheckbox.on('change', this.showPageStatisticsChange);
        this.autodetectFiltersCheckbox.on('change', this.autodetectFiltersChange);
        this.allowAcceptableAdsCheckbox.on('change', this.allowAcceptableAdsChange);
        this.updateAntiBannerFiltersButton.on('click', this.updateAntiBannerFilters.bind(this));
        this.showInfoAboutAdguardFullVersionCheckbox.on('change', this.updateShowInfoAboutAdguardFullVersion);
        this.enableHitsCountCheckbox.on('change', this.changeEnableHitsCount);
        this.enableShowContextMenuCheckbox.on('change', this.changeEnableShowContextMenu);
        this.useOptimizedFiltersCheckbox.on('change', this.changeUseOptimizedFilters);
        this.changeDefaultWhiteListModeCheckbox.on('change', this.changeDefaultWhiteListMode.bind(this));
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
            contentPage.sendMessage({type: 'openExtensionStore'});
        });

        $("#openLog").on('click', function (e) {
            e.preventDefault();
            contentPage.sendMessage({type: 'openFilteringLog'});
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
            input.on('keyup', this._debounce(renderFunc.bind(this), 300));
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
                menuItems.filter("[href='#" + id + "']").addClass("active");
            }
        };
        $(window).on('scroll', onscroll);
        onscroll();
    },

    _render: function () {

        var safebrowsingEnabled = !userSettings.values[userSettings.names.DISABLE_SAFEBROWSING];
        var sendSafebrowsingStats = !userSettings.values[userSettings.names.DISABLE_SEND_SAFEBROWSING_STATS];
        var showPageStats = !userSettings.values[userSettings.names.DISABLE_SHOW_PAGE_STATS];
        var autodetectFilters = !userSettings.values[userSettings.names.DISABLE_DETECT_FILTERS];
        var showAdguardPromo = !userSettings.values[userSettings.names.DISABLE_SHOW_ADGUARD_PROMO_INFO];
        var collectHitsCount = !userSettings.values[userSettings.names.DISABLE_COLLECT_HITS];
        var showContextMenu = !userSettings.values[userSettings.names.DISABLE_SHOW_CONTEXT_MENU];
        var useOptimizedFilters = userSettings.values[userSettings.names.USE_OPTIMIZED_FILTERS];
        var defaultWhitelistMode = userSettings.values[userSettings.names.DEFAULT_WHITE_LIST_MODE];
        var acceptableAdsEnabled = AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID in enabledFilters;

        this._renderAntiBannerFilters();
        this._renderUserFilters();
        this._renderWhiteListFilters();
        this._renderSafebrowsingSection(safebrowsingEnabled, sendSafebrowsingStats);
        this._renderShowPageStatistics(showPageStats, environmentOptions.Prefs.mobile);
        this._renderAllowAcceptableAds(acceptableAdsEnabled);
        this._renderAutodetectFilters(autodetectFilters);
        this._renderShowInfoAboutAdguardFullVersion(showAdguardPromo);
        this._renderCollectHitsCount(collectHitsCount);
        this._renderShowContextMenu(showContextMenu);
        this._renderUseOptimizedFilters(useOptimizedFilters);
        this._renderDefaultWhiteListMode(defaultWhitelistMode);

        var rulesInfo = environmentOptions.isContentBlockerEnabled ? contentBlockerInfo : requestFilterInfo;
        this.renderFilterRulesInfo(rulesInfo);

        if (environmentOptions.Prefs.mobile) {
            $('#resetStats').hide();
        }
        //Hide some functionality for content blocker safari browsers
        if (environmentOptions.isContentBlockerEnabled) {
            $('#openLog').hide();
            $('#resetStats').hide();
            $('.page-stats-switch-block').hide();
        }
        this._initializeSubscriptionModal();
        this.checkSubscriptionsCount();
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
        var acceptableAdsFilter = antiBannerFilter.filterId == AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID; // Don't render for acceptable ads filter
        if (el.length === 0 && !acceptableAdsFilter) {
            el = this._renderAntiBannerFilter(antiBannerFilter);
            this.antiBannerFiltersList.append(el);
        }

        var loader = el.find(".preloader");
        loader.removeClass("hidden");
    },

    safebrowsingEnabledChange: function () {
        contentPage.sendMessage({
            type: 'changeUserSetting',
            key: userSettings.names.DISABLE_SAFEBROWSING,
            value: !this.checked
        });
    },

    sendSafebrowsingStatsChange: function () {
        contentPage.sendMessage({
            type: 'changeUserSetting',
            key: userSettings.names.DISABLE_SEND_SAFEBROWSING_STATS,
            value: !this.checked
        });
    },

    showPageStatisticsChange: function () {
        contentPage.sendMessage({
            type: 'changeUserSetting',
            key: userSettings.names.DISABLE_SHOW_PAGE_STATS,
            value: !this.checked
        });
    },

    autodetectFiltersChange: function () {
        contentPage.sendMessage({
            type: 'changeUserSetting',
            key: userSettings.names.DISABLE_DETECT_FILTERS,
            value: !this.checked
        });
    },

    allowAcceptableAdsChange: function () {
        if (this.checked) {
            contentPage.sendMessage({
                type: 'enableAntiBannerFilter',
                filterId: AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID
            });
        } else {
            contentPage.sendMessage({
                type: 'disableAntiBannerFilter',
                filterId: AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID
            });
        }
    },

    updateAntiBannerFilters: function (e) {
        e.preventDefault();
        contentPage.sendMessage({type: 'checkAntiBannerFiltersUpdate'}, function () {
        });
    },

    updateShowInfoAboutAdguardFullVersion: function (e) {
        e.preventDefault();
        var showPromo = this.checked;
        contentPage.sendMessage({
            type: 'changeUserSetting',
            key: userSettings.names.DISABLE_SHOW_ADGUARD_PROMO_INFO,
            value: !showPromo
        });
        userSettings.values[userSettings.names.DISABLE_SHOW_ADGUARD_PROMO_INFO] = !showPromo;
        updateDisplayAdguardPromo(showPromo);
    },

    changeEnableHitsCount: function (e) {
        e.preventDefault();
        contentPage.sendMessage({
            type: 'changeUserSetting',
            key: userSettings.names.DISABLE_COLLECT_HITS,
            value: !this.checked
        });
    },

    changeEnableShowContextMenu: function (e) {
        e.preventDefault();
        contentPage.sendMessage({
            type: 'changeUserSetting',
            key: userSettings.names.DISABLE_SHOW_CONTEXT_MENU,
            value: !this.checked
        });
    },

    changeUseOptimizedFilters: function (e) {
        e.preventDefault();
        contentPage.sendMessage({
            type: 'changeUserSetting',
            key: userSettings.names.USE_OPTIMIZED_FILTERS,
            value: this.checked
        });
    },

    changeDefaultWhiteListMode: function (e) {
        e.preventDefault();
        contentPage.sendMessage({type: 'changeDefaultWhiteListMode', enabled: !e.currentTarget.checked}, function () {
            this._renderWhiteListFilters();
        }.bind(this));
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
        contentPage.sendMessage({type: 'resetBlockedAdsCount'});
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
            } catch (ex) {
                Log.error("Error while loading user rules {0}", ex);
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
            } catch (ex) {
                Log.error("Error while loading whitelist rules {0}", ex);
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
        contentPage.sendMessage({type: 'openExportRulesTab', whitelist: false});
    },

    onExportWhiteListFilterClicked: function (e) {
        e.preventDefault();
        contentPage.sendMessage({type: 'openExportRulesTab', whitelist: true});
    },

    onClearUserFilterClicked: function (e) {
        e.preventDefault();
        var message = i18n.getMessage("options_userfilter_clear_confirm");
        if (!confirm(message)) {
            return;
        }
        contentPage.sendMessage({type: 'clearUserFilter'});
    },

    onClearWhiteListFilterClicked: function (e) {
        e.preventDefault();
        var message = i18n.getMessage("options_whitelistfilter_clear_confirm");
        if (!confirm(message)) {
            return;
        }
        contentPage.sendMessage({type: 'clearWhiteListFilter'});
    },

    /**
     * Checks Safari content blocker rules limit, shows alert message for rules overlimit.
     * It's important to check that limit because of Safari limitations.
     * Content blocker with too many rules won't work at all.
     *
     * @param rulesOverLimit True if loaded rules more than limit
     * @private
     */
    _checkSafariContentBlockerRulesLimit: function (rulesOverLimit) {
        if (rulesOverLimit) {
            this.tooManyRulesEl.show();
        } else {
            this.tooManyRulesEl.hide();
        }
    },

    /**
     * Renders rules info panel
     *
     * @param info Object contains loaded rules count
     */
    renderFilterRulesInfo: function (info) {
        var el = $('.settings-page-title-info');
        if (!info.rulesCount) {
            el.hide();
            return;
        }

        //Prevent translating on document loaded
        el.removeAttr('i18n');

        var message = i18n.getMessage("options_antibanner_info", [String(info.rulesCount)]);
        el.text(message);
        el.show();

        if (environmentOptions.isContentBlockerEnabled) {
            this._checkSafariContentBlockerRulesLimit(info.rulesOverLimit);
        }
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
        sResult.searchMode = text.length > 0;

        contentPage.sendMessage({
            type: searchFunc,
            offset: sResult.offset,
            limit: sResult.limit,
            text: text
        }, function (response) {

            var rules = response.rules;
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

        }.bind(this));
    },

    _renderWhiteListFilters: function (loadNext) {
        if (!this.wlSearchResult) {
            this.wlSearchResult = {
                offset: 0,
                limit: this.DEFAULT_LIMIT,
                allLoaded: false
            };
        }
        this._renderSearchFilters(this.wlFilterSearchInput, this.wlFilters, this.clearWlFilterButton, this.wlSearchResult, this._renderWhiteListFilter, 'getWhiteListDomains', loadNext);
    },

    _renderWhiteListFilter: function (whiteListFilter) {
        var saveCallback = function (item) {
            if (item.isNew) {
                this.omitRenderEventsCount = 1;
                contentPage.sendMessage({type: 'addWhiteListDomain', text: item.text});
            } else {
                //start edit rule
                this.omitRenderEventsCount = 2;
                contentPage.sendMessage({type: 'removeWhiteListDomain', text: item.prevText}, function () {
                    contentPage.sendMessage({type: 'addWhiteListDomain', text: item.text});
                });
            }
            return item.text;
        }.bind(this);

        var deleteCallback = function (item) {
            this.omitRenderEventsCount = 1;
            contentPage.sendMessage({type: 'removeWhiteListDomain', text: item.text}, function () {
                this._removeEditableFilter(this.wlFilters, item.text, this.clearWlFilterButton, this.wlSearchResult.searchMode);
            }.bind(this));
        }.bind(this);

        var transformInput = function (input, text) {
            var value = input.val().trim();
            if (!value) {
                return;
            }
            if (value.indexOf('http://') < 0 && value.indexOf('https://') < 0) {
                if (value.indexOf('//') === 0) {
                    value = 'http:' + value;
                } else {
                    value = 'http://' + value;
                }
            }
            this.linkHelper.href = value;
            var host = this.linkHelper.hostname;
            input.val(host);
            text.text(host);
        }.bind(this);

        this._renderEditableFilter(this.wlFilters, whiteListFilter, saveCallback, deleteCallback, this.clearWlFilterButton, this.wlSearchResult.searchMode, transformInput);
    },

    _renderUserFilters: function (loadNext) {
        if (!this.userSearchResult) {
            this.userSearchResult = {
                offset: 0,
                limit: this.DEFAULT_LIMIT,
                allLoaded: false
            };
        }
        this._renderSearchFilters(this.userFilterSearchInput, this.userFilters, this.clearUserFilterButton, this.userSearchResult, this._renderUserFilter, 'getUserFilters', loadNext);
    },

    _renderUserFilter: function (userFilter) {
        var saveCallback = function (item) {
            if (item.isNew) {
                this.omitRenderEventsCount = 1;
                contentPage.sendMessage({type: 'addUserFilterRule', text: item.text});
            } else {
                this.omitRenderEventsCount = 2;
                contentPage.sendMessage({type: 'removeUserFilter', text: item.prevText}, function () {
                    contentPage.sendMessage({type: 'addUserFilterRule', text: item.text});
                });
            }
            return item.text;
        }.bind(this);

        var deleteCallback = function (item) {
            this.omitRenderEventsCount = 1;
            contentPage.sendMessage({type: 'removeUserFilter', text: item.text}, function () {
                this._removeEditableFilter(this.userFilters, item.text, this.clearUserFilterButton, this.userSearchResult.searchMode);
            }.bind(this));
        }.bind(this);

        this._renderEditableFilter(this.userFilters, userFilter, saveCallback, deleteCallback, this.clearUserFilterButton, this.userSearchResult.searchMode);
    },

    _renderEditableFilter: function (listEl, ruleText, saveCallback, deleteCallback, clearButton, searchMode, transformInput) {
        var jScrollPane = listEl.data('jsp');
        if (!jScrollPane) {
            return;
        }

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

        if (!ruleText) {
            el.data("isNew", true);
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
            if (transformInput) {
                transformInput(input, text);
            }
            var value = input.val().trim();
            if (!value) {
                return;
            }
            var newText = saveCallback({
                isNew: el.data("isNew"),
                text: value,
                prevText: el.data("ruleText")
            });
            if (newText) {
                el.data("isNew", false);
                el.data("ruleText", newText);
                text.text(newText);
            }
            stopEdit();
        }

        var self = this;

        function removeEditableItem() {
            el.remove();
            jScrollPane.reinitialise();
            self._checkOverlayHide(listEl, clearButton, searchMode);
        }

        function onCancelEditClicked() {
            if (el.data("isNew")) {
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
        contentPage.sendMessage({type: 'getAntiBannerFiltersForOptionsPage'}, function (response) {
            var antiBannerFilters = response.filters;
            if (antiBannerFilters.length === 0) {
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
        }.bind(this));
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
            lastUpdateTime.locale(environmentOptions.Prefs.locale);
            var date = lastUpdateTime.format("D MMMM YYYY").toLowerCase();
            var time = lastUpdateTime.format("HH:mm");
            versionTitle = i18n.getMessage("options_filter_version", [antiBannerFilter.version, date, time]);
        }
        return versionTitle;
    },

    _onAntiBannerFilterChange: function () {
        var filterId = this.value - 0;
        if (this.checked) {
            contentPage.sendMessage({type: 'enableAntiBannerFilter', filterId: filterId});
        } else {
            contentPage.sendMessage({type: 'disableAntiBannerFilter', filterId: filterId});
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

    _renderUseOptimizedFilters: function (show) {
        this.useOptimizedFiltersCheckbox.updateCheckbox(show);
    },

    _renderDefaultWhiteListMode: function (defaultWhiteListMode) {
        this.changeDefaultWhiteListModeCheckbox.updateCheckbox(!defaultWhiteListMode);
    },

    _renderWhiteListOverlay: function () {
        this.wlFilters.append($('#whitelist-overlay').children())
    },

    _renderUserFilterListOverlay: function () {
        this.userFilters.append($('#userlist-overlay').children());
    },

    _checkOverlayHide: function (listEl, clearButton, searchMode) {
        var items = listEl.find(".spl-user-table-row");
        if (items.length === 0) {
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
        contentPage.sendMessage({type: 'addUserFilterRules', rules: rules});
    },

    _importWhiteListFilterRules: function (text) {
        var domains = text ? text.split(/[\r\n]+/) : [];
        contentPage.sendMessage({type: 'addWhiteListDomains', domains: domains});
    },

    _onStatsReset: function () {
        this.resetStatsPopup.show();
        if (this.closePopupTimeoutId) {
            clearTimeout(this.closePopupTimeoutId);
        }
        this.closePopupTimeoutId = setTimeout(function () {
            this.resetStatsPopup.hide();
        }.bind(this), 4000);
    },

    _renderFiltersMetadataModal: function () {

        contentPage.sendMessage({type: 'getFiltersMetadata'}, function (response) {

            var groups = response.groups;
            var filtersMeta = response.filters;
            var enabledFilters = response.enabledFilters;
            var installedFilters = response.installedFilters;

            var homepageText = i18n.getMessage('options_modal_homepage');

            var allFilters = [];

            var allGroupsElements = [];

            for (var i = 0; i < groups.length; i++) {

                var group = groups[i];

                var filtersInGroupElements = [];
                var filters = filtersMeta[group.groupId];
                for (var j = 0; j < filters.length; j++) {

                    var filter = filters[j];
                    allFilters.push(filter);

                    var filterElement = this._getFilterMetadataTemplate(filter.filterId, filter.name, filter.description, filter.homepage, homepageText);
                    filtersInGroupElements.push(filterElement);
                }

                var groupElement = this._getGroupMetadataTemplate(group.groupId, group.groupName, i === 0 ? 'in' : '', filtersInGroupElements);
                allGroupsElements.push(groupElement);
            }

            var $groupsList = $('#groupsList');
            $groupsList.append(allGroupsElements);

            for (i = 0; i < allFilters.length; i++) {
                var filter = allFilters[i];
                var checkbox = $groupsList.find('input[name="modalFilterId"][value="' + filter.filterId + '"]');
                var installed = filter.filterId in installedFilters;
                var enabled = filter.filterId in enabledFilters;
                if (installed && enabled) {
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

        }.bind(this));
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
        contentPage.sendMessage({type: 'onFiltersSubscriptionChange', filterIds: filterIds});
    },

    _renderEnabledFiltersForGroupSection: function (groupId) {
        var enabledFilterNames = [];
        var checkboxes = $('[name="modalFilterId"]:checkbox:checked');
        $.each(checkboxes, function () {
            var checkbox = $(this);
            var chGroupId = checkbox.data('groupId');
            if (chGroupId == groupId) {
                var filterName = checkbox.data('filterName');
                enabledFilterNames.push(filterName.split(' ').join('\u00A0'));
            }
        });
        var section = $('#group' + groupId).closest('.filter-panel').find('.spt-font-small');
        if (enabledFilterNames.length === 0) {
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

        if (environmentOptions.isContentBlockerEnabled) {
            return;
        }

        var enabledCount = this.subscriptionModalEl.find('input[name="modalFilterId"]:checked').length;

        if (enabledCount >= this.SUBSCRIPTIONS_LIMIT) {
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

        return $('<div>', {class: 's-page-table-row cf'})
            .append($('<div>', {class: 'sp-table-row-label', text: filterName}).append($('<a>', {class: 'sp-table-row-info', href: homepageLink, text: homepageText, target: '_blank'})))
            .append($('<input>', {type: 'checkbox', name: 'modalFilterId', value: filterId, class: 'sp-table-row-input'}))
            .append($('<div>', {class: 'sp-table-row-descr', text: filterDescription}));

    },

    _debounce: function (func, wait) {
        var timeout;
        return function () {
            var context = this, args = arguments;
            var later = function () {
                timeout = null;
                func.apply(context, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

var userSettings;
var enabledFilters;
var environmentOptions;
var AntiBannerFiltersId;
var EventNotifierTypes;
var requestFilterInfo;
var contentBlockerInfo;

/**
 * Initializes page
 */
var initPage = function(response) {

    userSettings = response.userSettings;
    enabledFilters = response.enabledFilters;
    environmentOptions = response.environmentOptions;
    requestFilterInfo = response.requestFilterInfo;
    contentBlockerInfo = response.contentBlockerInfo;

    AntiBannerFiltersId = response.constants.AntiBannerFiltersId;
    EventNotifierTypes = response.constants.EventNotifierTypes;

    $(document).ready(function () {

        var controller = new PageController();
        controller.init();

        var events = [
            EventNotifierTypes.ENABLE_FILTER,
            EventNotifierTypes.DISABLE_FILTER,
            EventNotifierTypes.ADD_FILTER,
            EventNotifierTypes.REMOVE_FILTER,
            EventNotifierTypes.START_DOWNLOAD_FILTER,
            EventNotifierTypes.SUCCESS_DOWNLOAD_FILTER,
            EventNotifierTypes.ERROR_DOWNLOAD_FILTER,
            EventNotifierTypes.UPDATE_USER_FILTER_RULES,
            EventNotifierTypes.UPDATE_WHITELIST_FILTER_RULES,
            EventNotifierTypes.CONTENT_BLOCKER_UPDATED,
            EventNotifierTypes.REQUEST_FILTER_UPDATED
        ];

        function eventListener(event, filter) {
            switch (event) {
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
                    if (controller.omitRenderEventsCount > 0) {
                        controller.omitRenderEventsCount--;
                        break;
                    }
                    controller._renderUserFilters();
                    if (!environmentOptions.isContentBlockerEnabled) {
                        controller.renderFilterRulesInfo(filter);
                    }
                    break;
                case EventNotifierTypes.UPDATE_WHITELIST_FILTER_RULES:
                    if (controller.omitRenderEventsCount > 0) {
                        controller.omitRenderEventsCount--;
                        break;
                    }
                    controller._renderWhiteListFilters();
                    break;
                case EventNotifierTypes.REQUEST_FILTER_UPDATED:
                    // Don't react on this event. If ContentBlockerEnabled CONTENT_BLOCKER_UPDATED event will be received.
                    if (environmentOptions.isContentBlockerEnabled) {
                        break;
                    }
                    controller.renderFilterRulesInfo(filter);
                    break;
                case EventNotifierTypes.CONTENT_BLOCKER_UPDATED:
                    controller.renderFilterRulesInfo(filter);
                    break;
            }
        }

        var listenerId;
        contentPage.sendMessage({type: 'addEventListener', events: events}, function (response) {
            listenerId = response.listenerId;
        });

        contentPage.onMessage.addListener(function (message) {
            if (message.type == 'notifyListeners') {
                eventListener.apply(this, message.args);
            }
        });

        var onUnload = function () {
            if (listenerId) {
                contentPage.sendMessage({type: 'removeListener', listenerId: listenerId});
                listenerId = null;
            }
        };

        // unload event
        $(window).on('beforeunload', onUnload);
        $(window).on('unload', onUnload);
    });
};

contentPage.sendMessage({type: 'initializeFrameScript'}, initPage);