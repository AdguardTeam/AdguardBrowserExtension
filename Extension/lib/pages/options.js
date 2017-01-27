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
/* global $, updateDisplayAdguardPromo, customizePopupFooter, contentPage, i18n, moment */

var Utils = {

    debounce: function (func, wait) {
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

var WhiteListFilter = function () {

    var DEFAULT_LIMIT = 200;

    var linkHelper = document.createElement('a');
    var omitRenderEventsCount = 0;

    var wlFilters = $("#whiteListFilters");
    var importWlFilterInput = $("#importWhiteListFilterInput");
    var clearWlFilterButton = $("#clearWhiteListFilter");
    var searchWlFilterInput = $("#white-search");

    var wlSearchResult = {
        offset: 0,
        limit: DEFAULT_LIMIT,
        allLoaded: false
    };

    wlFilters.jScrollPane({
        contentWidth: '0px',
        mouseWheelSpeed: 20
    });
    var jScrollPane = wlFilters.data('jsp');

    function renderEmptyRulesOverlay() {
        var items = wlFilters.find("li");
        if (items.length === 0) {
            showEmptyRulesOverlay();
            if (!wlSearchResult.searchMode) {
                clearWlFilterButton.hide();
            }
        } else {
            hideEmptyRulesOverlay();
            clearWlFilterButton.show();
        }
    }

    function showEmptyRulesOverlay() {
        hideEmptyRulesOverlay();
        if (wlSearchResult.searchMode) {
            wlFilters.find(".sp-lists-table-overlay.overlay-search").removeClass("hidden");
        } else {
            wlFilters.find(".sp-lists-table-overlay:not(.overlay-search)").removeClass("hidden");
        }
    }

    function hideEmptyRulesOverlay() {
        wlFilters.find(".sp-lists-table-overlay").addClass("hidden");
    }

    function onAddWhiteListFilterClicked(e) {
        e.preventDefault();
        renderWhiteListFilterRuleLines([null], {prepend: true});
    }

    function onImportWhiteListFilterClicked(e) {
        e.preventDefault();
        importWlFilterInput.trigger("click");
    }

    function onImportWhiteListFilterInputChange() {
        var fileInput = importWlFilterInput[0];
        var reader = new FileReader();
        reader.onload = function (e) {
            try {
                var text = e.target.result;
                var domains = text ? text.split(/[\r\n]+/) : [];
                contentPage.sendMessage({type: 'addWhiteListDomains', domains: domains});
            } catch (ex) {
                adguard.console.error("Error while loading whitelist rules {0}", ex);
            }
            fileInput.value = '';
        };
        reader.onerror = function () {
            adguard.console.error("Error load whitelist rules");
            fileInput.value = '';
        };
        var file = fileInput.files[0];
        if (file) {
            reader.readAsText(file, "utf-8");
        }
    }

    function onExportWhiteListFilterClicked(e) {
        e.preventDefault();
        contentPage.sendMessage({type: 'openExportRulesTab', whitelist: true});
    }

    function onClearWhiteListFilterClicked(e) {
        e.preventDefault();
        var message = i18n.getMessage("options_whitelistfilter_clear_confirm");
        if (!confirm(message)) {
            return;
        }
        contentPage.sendMessage({type: 'clearWhiteListFilter'});
    }

    function getWhiteListRuleLineTemplate() {

        var el = $('<li>')
            .append($('<div>', {class: 'rule-name rule-text'}))
            .append($('<div>', {class: 'rule-name rule-input'}).append($('<input/>', {type: 'text'})));

        var options = $('<div>', {class: 'rule-ctrl'})
            .append($('<a>', {class: 'icon-pencil edit', href: '#'}))
            .append($('<a>', {class: 'icon-trash delete', href: '#'}))
            .append($('<a>', {class: 'icon-check-green save', href: '#'}))
            .append($('<a>', {class: 'icon-cancel-edit cancel', href: '#'}));

        el.append(options);
        return el;
    }

    function renderWhiteListFilterRuleLines(rulesText, options) {

        hideEmptyRulesOverlay();

        var fragment = document.createDocumentFragment();

        var editItems = [];

        for (var i = 0; i < rulesText.length; i++) {

            var ruleText = rulesText[i];

            var el = getWhiteListRuleLineTemplate();
            fragment.appendChild(el[0]);

            var text = el.find('.rule-text');

            if (!ruleText) {
                el.data("isNew", true);
                editItems.push(el);
            } else {
                el.data("ruleText", ruleText);
                text.text(ruleText);
            }
        }

        if (options && options.prepend) {
            jScrollPane.getContentPane().prepend(fragment);
        } else {
            jScrollPane.getContentPane().append(fragment);
        }
        jScrollPane.reinitialise();

        renderEmptyRulesOverlay();

        wlFilters.removeClass("editing");
        for (var j = 0; j < editItems.length; j++) {
            editItems[j].find('.edit').click();
        }
    }

    function removeWhiteListFilterRuleLine(ruleText) {
        var filters = wlFilters.find("li");
        $.each(filters, function (index, f) {
            var $el = $(f);
            if ($el.data("ruleText") == ruleText) {
                $el.remove();
            }
        });
        jScrollPane.reinitialise();
        renderEmptyRulesOverlay();
    }

    function clearWhiteListFilterRuleLines() {
        var filters = wlFilters.find("li");
        filters.remove();
        jScrollPane.reinitialise();
        renderEmptyRulesOverlay();
    }

    function startEditRuleLine(el) {
        var input = el.find('input');
        wlFilters.addClass("editing");
        el.closest('li').addClass('editing-row');
        var ruleText = el.data("ruleText");
        if (ruleText) {
            input.val(ruleText);
        }
        input.focus();
    }

    function stopEditRuleLine(el) {
        el.closest('li').removeClass('editing-row');
        wlFilters.removeClass("editing");
    }

    function onSaveRuleLineClicked(el) {

        var input = el.find('input');
        var text = el.find('.rule-text');

        normalizeWhiteListInput(input, text);

        var value = input.val().trim();
        if (!value) {
            return;
        }
        var newText = saveWhiteListFilterRule({
            isNew: el.data("isNew"),
            text: value,
            prevText: el.data("ruleText")
        });
        if (newText) {
            el.data("isNew", false);
            el.data("ruleText", newText);
            text.text(newText);
        }
        stopEditRuleLine(el);
    }

    function onCancelEditRuleLineClicked(el) {
        if (el.data("isNew")) {
            el.remove();
            wlFilters.removeClass("editing");
        } else {
            stopEditRuleLine(el);
        }
    }

    function saveWhiteListFilterRule(item) {
        if (item.isNew) {
            omitRenderEventsCount = 1;
            contentPage.sendMessage({type: 'addWhiteListDomains', domains: [item.text]});
        } else {
            //start edit rule
            omitRenderEventsCount = 2;
            contentPage.sendMessage({type: 'removeWhiteListDomain', text: item.prevText}, function () {
                contentPage.sendMessage({type: 'addWhiteListDomains', domains: [item.text]});
            });
        }
        return item.text;
    }

    function deleteWhiteListFilterRule(item) {
        omitRenderEventsCount = 1;
        contentPage.sendMessage({type: 'removeWhiteListDomain', text: item.text}, function () {
            removeWhiteListFilterRuleLine(item.text);
        });
    }

    function normalizeWhiteListInput(input, text) {
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
        linkHelper.href = value;
        var host = linkHelper.hostname;
        input.val(host);
        text.text(host);
    }

    function loadAndRenderWhiteListFilterRuleLines(loadNext) {

        loadNext = loadNext === true;

        if (!loadNext) {
            wlSearchResult.offset = 0;
            wlSearchResult.allLoaded = false;
        }

        if (wlSearchResult._isLoading || wlSearchResult.allLoaded) {
            return;
        }

        var value = searchWlFilterInput.val() || '';
        var text = value.trim();
        wlSearchResult.searchMode = text.length > 0;

        contentPage.sendMessage({
            type: 'getWhiteListDomains',
            offset: wlSearchResult.offset,
            limit: wlSearchResult.limit,
            text: text
        }, function (response) {

            var rules = response.rules;
            if (rules.length < wlSearchResult.limit) {
                wlSearchResult.allLoaded = true;
            }
            wlSearchResult.offset += rules.length;
            wlSearchResult._isLoading = false;

            if (!loadNext) {
                clearWhiteListFilterRuleLines();
            }
            renderWhiteListFilterRuleLines(rules);
            renderEmptyRulesOverlay();
        });
    }

    var updateWhiteListFilterRules = function () {
        if (omitRenderEventsCount > 0) {
            omitRenderEventsCount--;
            return;
        }
        loadAndRenderWhiteListFilterRuleLines();
    };

    var onShown = function () {
        jScrollPane.reinitialise();
    };

    wlFilters.append($('#whitelist-overlay').children());

    var whiteListSection = $("#whitelist");
    whiteListSection.on('click', '.addWhiteListFilter', onAddWhiteListFilterClicked);
    whiteListSection.on('click', '#importWhiteListFilter', onImportWhiteListFilterClicked);
    whiteListSection.on('change', '#importWhiteListFilterInput', onImportWhiteListFilterInputChange);
    whiteListSection.on('click', '#exportWhiteListFilter', onExportWhiteListFilterClicked);
    whiteListSection.on('click', '#clearWhiteListFilter', onClearWhiteListFilterClicked);

    whiteListSection.find("#searchWhitelist").on('click', function (e) {
        e.preventDefault();
        loadAndRenderWhiteListFilterRuleLines();
    });
    searchWlFilterInput.on('keyup', Utils.debounce(loadAndRenderWhiteListFilterRuleLines, 300));
    wlFilters.bind('jsp-scroll-y', function (e, posY, isAtTop, isAtBottom) {
        if (isAtBottom) {
            loadAndRenderWhiteListFilterRuleLines(true);
        }
    });

    wlFilters.on('click', '.edit', function (e) {
        e.preventDefault();
        startEditRuleLine($(this).closest('li'));
    });

    wlFilters.on('click', '.save', function (e) {
        e.preventDefault();
        onSaveRuleLineClicked($(this).closest('li'));
    });

    wlFilters.on('click', '.cancel', function (e) {
        e.preventDefault();
        onCancelEditRuleLineClicked($(this).closest('li'));
        jScrollPane.reinitialise();
        renderEmptyRulesOverlay();
    });

    wlFilters.on('click', '.delete', function (e) {
        e.preventDefault();
        var el = $(this).closest('li');
        deleteWhiteListFilterRule({text: el.data("ruleText")});
    });

    wlFilters.on('keypress', 'input[type="text"]', function (e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            onSaveRuleLineClicked($(this).closest('li'));
        }
    });

    $(document).keydown(function (e) {
        if (e.keyCode == 27) {
            var elements = wlFilters.find('li');
            for (var i = 0; i < elements.length; i++) {
                onCancelEditRuleLineClicked($(elements[i]));
            }
            jScrollPane.reinitialise();
            renderEmptyRulesOverlay();
        }
    });

    return {
        updateWhiteListFilterRules: updateWhiteListFilterRules,
        onShown: onShown
    };
};

var UserFilter = function () {

    var omitRenderEventsCount = 0;

    var editor = ace.edit('userRules');
    editor.setShowPrintMargin(false);
    editor.getSession().setMode("ace/mode/text");

    function loadUserRules() {
        contentPage.sendMessage({
            type: 'getUserRules'
        }, function (response) {
            editor.setValue(response.content || '');
            $('#userFilterApplyChanges').hide();
        });
    }

    function saveUserRules(e) {

        e.preventDefault();

        omitRenderEventsCount = 1;

        editor.setReadOnly(true);
        var text = editor.getValue();

        contentPage.sendMessage({
            type: 'saveUserRules',
            content: text
        }, function () {
            editor.setReadOnly(false);
            $('#userFilterApplyChanges').hide();
        });
    }

    function updateUserFilterRules() {
        if (omitRenderEventsCount > 0) {
            omitRenderEventsCount--;
            return;
        }
        loadUserRules();
    }

    $('#userFilterApplyChanges').on('click', saveUserRules);

    editor.getSession().on('change', function () {
        $('#userFilterApplyChanges').show();
    });

    return {
        updateUserFilterRules: updateUserFilterRules
    };
};

var PageController = function () {
};


PageController.prototype = {

    DEFAULT_LIMIT: 200,

    omitRenderEventsCount: 0,

    linkHelper: null,

    SUBSCRIPTIONS_LIMIT: 9,

    init: function () {

        this.linkHelper = document.createElement('a');

        this._customizeText();
        this._bindEvents();
        this._render();

        $(".opt-state input:checkbox").toggleCheckbox();

        updateDisplayAdguardPromo(!userSettings.values[userSettings.names.DISABLE_SHOW_ADGUARD_PROMO_INFO]);
        customizePopupFooter(environmentOptions.isMacOs);

        this._initTopMenu();
    },

    _customizeText: function () {
        $('a.sp-table-row-info').addClass('question').text('');
        var elements = $('span.sp-table-row-info');
        for (var i = 0; i < elements.length; i++) {
            var element = $(elements[i]);
            var li = element.closest('li');
            element.remove();
            var state = li.find('.opt-state');
            element.addClass('desc');
            state.prepend(element);
        }
    },

    _bindEvents: function () {

        this.antiBannerFiltersList = $("#antiBannerFiltersList");
        this.antiBannerFiltersListEmpty = $("#antiBannerFiltersListEmpty");
        this.safebrowsingEnabledCheckbox = $("#safebrowsingEnabledCheckbox");
        this.sendSafebrowsingStatsCheckbox = $("#sendSafebrowsingStatsCheckbox");
        this.showPageStatisticCheckbox = $("#showPageStatisticCheckbox");
        this.allowAcceptableAdsCheckbox = $("#allowAcceptableAds");
        this.updateAntiBannerFiltersButton = $("#updateAntiBannerFilters");
        this.autodetectFiltersCheckbox = $("#autodetectFiltersCheckbox");
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

        $(".openExtensionStore").on('click', function (e) {
            e.preventDefault();
            contentPage.sendMessage({type: 'openExtensionStore'});
        });

        $("#openLog").on('click', function (e) {
            e.preventDefault();
            contentPage.sendMessage({type: 'openFilteringLog'});
        });
    },

    _initTopMenu: function () {

        $('[data-tab]').on('click', function (e) {
            e.preventDefault();
            document.location.hash = $(this).attr('data-tab');
        });

        window.addEventListener('hashchange', toggleTab);

        var prevTabId;
        var self = this;

        function toggleTab() {

            var tabId = document.location.hash || '#general-settings';
            var tab = $(tabId);

            if (!tab || tab.length === 0) {
                tabId = '#general-settings';
                tab = $(tabId);
            }

            if (prevTabId) {
                $('[data-tab="' + prevTabId + '"]').removeClass('active');
                $(prevTabId).hide();
            }

            $('[data-tab="' + tabId + '"]').addClass('active');
            tab.show();

            if (tabId === '#whitelist') {
                self.whiteListFilter.onShown();
            }

            prevTabId = tabId;
        }

        toggleTab();
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

        // Initialize whitelist filter
        this.whiteListFilter = new WhiteListFilter();
        this.whiteListFilter.updateWhiteListFilterRules();

        // Initialize User filter
        this.userFilter = new UserFilter();
        this.userFilter.updateUserFilterRules();
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
                type: 'addAndEnableFilter',
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
            this.whiteListFilter.updateWhiteListFilterRules();
        }.bind(this));
    },

    onResetStatsClicked: function (e) {
        e.preventDefault();
        contentPage.sendMessage({type: 'resetBlockedAdsCount'});
        this._onStatsReset();
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
            contentPage.sendMessage({type: 'addAndEnableFilter', filterId: filterId});
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

            var filter;

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

                    filter = filters[j];
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
                filter = allFilters[i];
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
            .append($('<div>', {
                class: 'sp-table-row-label',
                text: description
            }).append($('<span>', {class: 'sp-table-row-info', text: version})))
            .append($('<input>', {type: 'checkbox', name: 'filterId', class: 'sp-table-row-input', value: filterId}))
            .append($('<div>', {class: 'preloader hidden'}));
    },

    _getGroupMetadataTemplate: function (groupId, groupName, collapseClass, filtersElements) {

        var el = $('<div>', {class: 'panel filter-panel'});

        var header = $('<div>', {class: 'settings-page-title spt-font-s'})
            .append($('<a>', {
                href: '#group' + groupId,
                'data-parent': '#groupsList',
                'data-toggle': 'collapse',
                class: 'spt-link-dashed collapsed',
                text: groupName
            }))
            .append($('<div>', {class: 'spt-font-small'}));

        var group = $('<div>', {id: 'group' + groupId, class: 'panel-collapse collapse ' + collapseClass})
            .append($('<div>', {class: 'settings-page-table'}).append(filtersElements));

        el.append(header).append(group);
        return el;
    },

    _getFilterMetadataTemplate: function (filterId, filterName, filterDescription, homepageLink, homepageText) {

        return $('<div>', {class: 's-page-table-row cf'})
            .append($('<div>', {
                class: 'sp-table-row-label',
                text: filterName
            }).append($('<a>', {class: 'sp-table-row-info', href: homepageLink, text: homepageText, target: '_blank'})))
            .append($('<input>', {
                type: 'checkbox',
                name: 'modalFilterId',
                value: filterId,
                class: 'sp-table-row-input'
            }))
            .append($('<div>', {class: 'sp-table-row-descr', text: filterDescription}));

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
var initPage = function (response) {

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
            EventNotifierTypes.FILTER_ENABLE_DISABLE,
            EventNotifierTypes.FILTER_ADD_REMOVE,
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
                case EventNotifierTypes.FILTER_ENABLE_DISABLE:
                    controller._onAntiBannerFilterStateChange(filter);
                    controller.checkSubscriptionsCount();
                    break;
                case EventNotifierTypes.FILTER_ADD_REMOVE:
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
                    controller.userFilter.updateUserFilterRules();
                    if (!environmentOptions.isContentBlockerEnabled) {
                        controller.renderFilterRulesInfo(filter);
                    }
                    break;
                case EventNotifierTypes.UPDATE_WHITELIST_FILTER_RULES:
                    controller.whiteListFilter.updateWhiteListFilterRules();
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