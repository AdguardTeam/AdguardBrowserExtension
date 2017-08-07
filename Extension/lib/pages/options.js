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

/* global $, updateDisplayAdguardPromo, contentPage, i18n, moment, ace */

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

var TopMenu = (function () {

    var prevTabId;
    var onHashUpdatedCallback;

    var toggleTab = function () {

        var tabId = document.location.hash || '#general-settings';
        var tab = $(tabId);

        if (tabId.indexOf('#antibanner') === 0 && tab.length === 0) {
            // AntiBanner groups and filters are loaded and rendered async
            return;
        }

        if (tab.length === 0) {
            tabId = '#general-settings';
            tab = $(tabId);
        }

        if (prevTabId) {
            $('[data-tab="' + prevTabId + '"]').removeClass('active');
            if (prevTabId.indexOf('#antibanner') === 0) {
                $('[data-tab="#antibanner"]').removeClass('active');
            }
            $(prevTabId).hide();
        }

        $('[data-tab="' + tabId + '"]').addClass('active');
        if (tabId.indexOf('#antibanner') === 0) {
            $('[data-tab="#antibanner"]').addClass('active');
        }

        tab.show();

        if (tabId === '#whitelist') {
            if (typeof onHashUpdatedCallback === 'function') {
                onHashUpdatedCallback(tabId);
            }
        }

        prevTabId = tabId;
    };

    var init = function (options) {
        onHashUpdatedCallback = options.onHashUpdated;
        window.addEventListener('hashchange', toggleTab);
        $('[data-tab]').on('click', function (e) {
            e.preventDefault();
            document.location.hash = $(this).attr('data-tab');
        });
        toggleTab();
    };

    return {
        init: init,
        toggleTab: toggleTab
    };

})();

var WhiteListFilter = function (options) {

    var DEFAULT_LIMIT = 200;

    var linkHelper = document.createElement('a');
    var omitRenderEventsCount = 0;

    var wlFilters = $("#whiteListFilters");
    var importWlFilterInput = $("#importWhiteListFilterInput");
    var clearWlFilterButton = $("#clearWhiteListFilter");
    var searchWlFilterInput = $("#white-search");
    var changeDefaultWhiteListModeCheckbox = $('#changeDefaultWhiteListMode');

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

    function changeDefaultWhiteListMode(e) {
        e.preventDefault();
        contentPage.sendMessage({type: 'changeDefaultWhiteListMode', enabled: !e.currentTarget.checked}, function () {
            updateWhiteListFilterRules();
        });
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
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/521#issuecomment-274470832
            $(this).blur();
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

    changeDefaultWhiteListModeCheckbox.on('change', changeDefaultWhiteListMode);
    changeDefaultWhiteListModeCheckbox.updateCheckbox(!options.defaultWhiteListMode);

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

var AntiBannerFilters = function (options) {

    var loadedFiltersInfo = {
        filters: [],
        filtersById: {},
        lastUpdateTime: 0,
        isEnabled: function (filterId) {
            var info = this.filtersById[filterId];
            return info && info.enabled;
        },
        updateEnabled: function (filterId, enabled) {
            var info = this.filtersById[filterId];
            if (info) {
                info.enabled = enabled;
            }
        }
    };

    var groupsList = $('#groupsList');

    function getFiltersInGroup(groupId, filters) {
        return filters.filter(function (f) {
            return f.groupId === groupId;
        });
    }

    function countEnabledFilters(filters) {
        var count = 0;
        for (var i = 0; i < filters.length; i++) {
            var filterId = filters[i].filterId;
            if (loadedFiltersInfo.isEnabled(filterId)) {
                count++;
            }
        }
        return count;
    }

    function getGroupElement(groupId) {
        return $('#group' + groupId);
    }

    function getGroupCheckbox(groupId) {
        return getGroupElement(groupId).find('input');
    }

    function getFilterElement(filterId) {
        return $('#filter' + filterId);
    }

    function getFilterCheckbox(filterId) {
        return getFilterElement(filterId).find('input');
    }

    function updateGroupFiltersInfo(groupId) {

        var groupFilters = getFiltersInGroup(groupId, loadedFiltersInfo.filters);
        var enabledFiltersCount = countEnabledFilters(groupFilters);

        var element = getGroupElement(groupId);
        var checkbox = getGroupCheckbox(groupId);
        element.find('.desc').text('Enabled filters: ' + enabledFiltersCount);
        checkbox.updateCheckbox(enabledFiltersCount > 0);
    }

    function getGroupTemplate(group) {

        return $('<li>', {id: 'group' + group.groupId})
            .append($('<div>', {class: 'block-type'})
                .append($('<img>', {src: 'images/icon-block-ads.png'}))
                .append($('<a>', {
                    href: '#antibanner' + group.groupId,
                    text: group.groupName
                })))
            .append($('<div>', {class: 'opt-state'})
                .append($('<div>', {class: 'preloader'}))
                .append($('<div>', {class: 'desc'}))
                .append($('<input>', {type: 'checkbox', name: 'groupId', value: group.groupId})));
    }

    function getFilterTemplate(filter, enabled) {
        return $('<li>', {id: 'filter' + filter.filterId})
            .append($('<div>', {class: 'opt-name'})
                .append($('<div>', {class: 'title', text: filter.name}))
                .append($('<div>', {class: 'desc', text: filter.description})))
            .append($('<div>', {class: 'opt-state'})
                .append($('<div>', {class: 'preloader'}))
                .append($('<a>', {class: 'icon-home', target: '_blank', href: filter.homepage}))
                .append($('<input>', {type: 'checkbox', name: 'filterId', value: filter.filterId, checked: enabled})));
    }

    function getFiltersContentTemplate(group, filters) {

        var pageTitleEl = $('<div>', {class: 'page-title'})
            .append($('<a>', {href: '#antibanner'})
                .append($('<img>', {
                    src: 'images/icon-back.png',
                    class: 'back'
                })))
            .append(document.createTextNode(group.groupName));

        var tabsBar = $('<div>', {class: 'tabs-bar'})
            .append($('<a>', {href: '', class: 'tab active', text: 'Recommended'}))
            .append($('<a>', {href: '', class: 'tab', text: 'Other'}));

        var filtersList = $('<ul>', {class: 'opts-list'});

        for (var i = 0; i < filters.length; i++) {

            var filter = filters[i];
            var enabled = loadedFiltersInfo.isEnabled(filter.filterId);
            var filterTemplate = getFilterTemplate(filter, enabled);
            filtersList.append(filterTemplate);
        }

        return $('<div>', {id: 'antibanner' + group.groupId, class: 'settings-content tab-pane filters-list'})
            .append(pageTitleEl)
            .append($('<div>', {class: 'settings-body'})
                .append(tabsBar)
                .append(filtersList));
    }

    function renderCategoriesAndFilters() {

        contentPage.sendMessage({type: 'getFiltersMetadata'}, function (response) {

            var i;

            loadedFiltersInfo.filters = response.filters;

            var groups = response.groups;
            var filters = response.filters;

            var lastUpdateTime = 0;
            var filtersById = Object.create(null);
            for (i = 0; i < filters.length; i++) {
                var filter = filters[i];
                filtersById[filter.filterId] = filter;
                if (filter.lastUpdateTime && filter.lastUpdateTime > lastUpdateTime) {
                    lastUpdateTime = filter.lastUpdateTime;
                }
            }
            loadedFiltersInfo.filtersById = filtersById;
            setLastUpdatedTimeText(lastUpdateTime);

            for (i = 0; i < groups.length; i++) {

                var group = groups[i];
                var groupFilters = getFiltersInGroup(group.groupId, filters);

                var groupTemplate = getGroupTemplate(group);
                groupsList.append(groupTemplate);
                updateGroupFiltersInfo(group.groupId);

                var filtersContentTemplate = getFiltersContentTemplate(group, groupFilters);

                $('#antibanner').parent().append(filtersContentTemplate);
            }

            $(".opt-state input:checkbox").toggleCheckbox();

            // check document hash
            var hash = document.location.hash;
            if (hash && hash.indexOf('#antibanner') === 0) {
                TopMenu.toggleTab();
            }
        });
    }

    function toggleFilterState() {
        var filterId = this.value - 0;
        if (this.checked) {
            contentPage.sendMessage({type: 'addAndEnableFilter', filterId: filterId});
        } else {
            contentPage.sendMessage({type: 'disableAntiBannerFilter', filterId: filterId});
        }
    }

    /**
     * Checks Safari content blocker rules limit, shows alert message for rules overlimit.
     * It's important to check that limit because of Safari limitations.
     * Content blocker with too many rules won't work at all.
     *
     * @param rulesOverLimit True if loaded rules more than limit
     * @private
     */
    function checkSafariContentBlockerRulesLimit(rulesOverLimit) {
        if (rulesOverLimit) {
            this.tooManyRulesEl.show();
        } else {
            this.tooManyRulesEl.hide();
        }
    }

    function updateAntiBannerFilters(e) {
        e.preventDefault();
        contentPage.sendMessage({type: 'checkAntiBannerFiltersUpdate'}, function () {
        });
    }

    function setLastUpdatedTimeText(lastUpdateTime) {
        if (lastUpdateTime && lastUpdateTime > loadedFiltersInfo.lastUpdateTime) {
            loadedFiltersInfo.lastUpdateTime = lastUpdateTime;
        }
        var updateText = "";
        lastUpdateTime = loadedFiltersInfo.lastUpdateTime;
        if (lastUpdateTime) {
            lastUpdateTime = moment(lastUpdateTime);
            lastUpdateTime.locale(environmentOptions.Prefs.locale);
            updateText = lastUpdateTime.format("D MMMM YYYY HH:mm").toLowerCase();
            //TODO: localization (options_filter_version)
        }
        $('#lastUpdateTime').text(updateText);
    }

    var updateRulesCountInfo = function (info) {

        var message = i18n.getMessage("options_antibanner_info", [String(info.rulesCount || 0)]);

        var el = $('#filtersRulesInfo');
        el.text(message);

        if (environmentOptions.isContentBlockerEnabled) {
            checkSafariContentBlockerRulesLimit(info.rulesOverLimit);
        }
    };

    var onFilterStateChanged = function (filter) {
        var filterId = filter.filterId;
        var enabled = filter.enabled;
        loadedFiltersInfo.updateEnabled(filterId, enabled);
        updateGroupFiltersInfo(filter.groupId);
        getFilterCheckbox(filterId).updateCheckbox(enabled);
    };

    var onFilterDownloadStarted = function (filter) {
        getGroupElement(filter.groupId).find('.preloader').addClass('active');
        getFilterElement(filter.filterId).find('.preloader').addClass('active');
    };

    var onFilterDownloadFinished = function (filter) {
        getGroupElement(filter.groupId).find('.preloader').removeClass('active');
        getFilterElement(filter.filterId).find('.preloader').removeClass('active');
        setLastUpdatedTimeText(filter.lastUpdateTime);
    };

    // Bind events
    $(document).on('change', '.filters-list [name="filterId"]', toggleFilterState);
    $('#updateAntiBannerFilters').on('click', updateAntiBannerFilters);

    updateRulesCountInfo(options.rulesInfo);

    return {
        render: renderCategoriesAndFilters,
        updateRulesCountInfo: updateRulesCountInfo,
        onFilterStateChanged: onFilterStateChanged,
        onFilterDownloadStarted: onFilterDownloadStarted,
        onFilterDownloadFinished: onFilterDownloadFinished
    };
};

var SyncSettings = function (options) {

    var syncStatus = options.syncStatusInfo;
    var currentProvider = options.syncStatusInfo.currentProvider;

    var unauthorizedBlock = $('#unauthorizedBlock');
    var authorizedBlock = $('#authorizedBlock');
    var signInButton = $('#signInButton');
    var signOutButton = $('#signOutButton');
    var startSyncButton = $('#startSyncButton');
    var syncNowButton = $('#syncNowButton');
    var lastSyncTimeInfo = $('#lastSyncTimeInfo');
    var selectProviderButton = $('#selectProviderButton');

    var providersDropdown = $('#selectProviderDropdown');

    bindControls();

    function bindControls() {

        selectProviderButton.on('click', function () {
            providersDropdown.show();
        }.bind(this));

        signInButton.on('click', function (e) {
            e.preventDefault();
            if (currentProvider) {
                contentPage.sendMessage({
                    type: 'authSync',
                    provider: currentProvider.name
                });
            }
        }.bind(this));

        signOutButton.on('click', function (e) {
            e.preventDefault();
            if (currentProvider && currentProvider.isOAuthSupported) {
                contentPage.sendMessage({
                    type: 'dropAuthSync',
                    provider: currentProvider.name
                });
            } else {
                contentPage.sendMessage({type: 'toggleSync'});
            }
        }.bind(this));

        startSyncButton.on('click', function (e) {
            e.preventDefault();
            contentPage.sendMessage({type: 'toggleSync'});
        });

        syncNowButton.on('click', function (e) {
            e.preventDefault();
            updateSyncState();
            contentPage.sendMessage({type: 'syncNow'});
        }.bind(this));

        $('#changeDeviceNameButton').on('click', function (e) {
            e.preventDefault();
            var deviceName = $('#deviceNameInput').val();
            contentPage.sendMessage({
                type: 'syncChangeDeviceName',
                deviceName: deviceName
            });
        });

        $('#adguardSelectProvider').on('click', onProviderSelected('ADGUARD_SYNC'));
        $('#dropboxSelectProvider').on('click', onProviderSelected('DROPBOX'));
        $('#browserStorageSelectProvider').on('click', onProviderSelected('BROWSER_SYNC'));
    }

    function onProviderSelected(providerName) {
        return function (e) {
            e.preventDefault();
            providersDropdown.hide();
            contentPage.sendMessage({type: 'setSyncProvider', provider: providerName}, function () {
                document.location.reload();
            });
        }.bind(this);
    }

    function renderSelectProviderBlock() {
        unauthorizedBlock.show();
        authorizedBlock.hide();
        signInButton.hide();
        startSyncButton.hide();
    }

    function renderUnauthorizedBlock() {

        unauthorizedBlock.show();
        authorizedBlock.hide();

        if (currentProvider.isOAuthSupported && !currentProvider.isAuthorized) {
            signInButton.show();
        } else {
            signInButton.hide();
        }

        if (!syncStatus.enabled && currentProvider.isAuthorized) {
            startSyncButton.show();
        } else {
            startSyncButton.hide();
        }

        selectProviderButton.text(currentProvider.title);
    }

    function renderAuthorizedBlock() {

        unauthorizedBlock.hide();
        authorizedBlock.show();

        $('#providerNameInfo').text(currentProvider.title);

        var manageAccountButton = $('#manageAccountButton');
        var deviceNameBlock = $('#deviceNameBlock');

        updateSyncState();

        if (currentProvider.isOAuthSupported && currentProvider.name === 'ADGUARD_SYNC') {
            manageAccountButton.show();
            deviceNameBlock.show();
            $('#deviceNameInput').val(currentProvider.deviceName);
        } else {
            manageAccountButton.hide();
            deviceNameBlock.hide();
        }

        //TODO: Handle sync settings checkboxes
    }

    function renderSyncSettings() {

        if (!currentProvider) {
            renderSelectProviderBlock();
            return;
        }

        if (!currentProvider.isAuthorized || !syncStatus.enabled) {
            renderUnauthorizedBlock();
        } else {
            renderAuthorizedBlock();
        }

        var browserStorageSupported = syncStatus.providers.filter(function (p) {
                return p.name === 'BROWSER_SYNC';
            }).length > 0;

        if (!browserStorageSupported) {
            $('#browserStorageSelectProvider').hide();
        }

        if (currentProvider) {
            var activeClass = 'dropdown__item--active';

            switch (currentProvider.name) {
                case 'ADGUARD_SYNC':
                    $('#adguardSelectProvider').addClass(activeClass);
                    break;
                case 'DROPBOX':
                    $('#dropboxSelectProvider').addClass(activeClass);
                    break;
                case 'BROWSER_SYNC':
                    $('#browserStorageSelectProvider').addClass(activeClass);
                    break;
            }
        }
    }

    function updateSyncSettings(options) {
        syncStatus = options.status;
        currentProvider = options.status.currentProvider;
        renderSyncSettings();
    }

    function updateSyncState() {
        if (syncStatus.syncInProgress) {
            syncNowButton.attr('disabled', 'disabled');
            syncNowButton.text(i18n.getMessage('sync_in_progress_button_text'));
        } else {
            syncNowButton.removeAttr('disabled');
            syncNowButton.text(i18n.getMessage('sync_now_button_text'));
        }

        if (currentProvider) {
            var lastSyncTime = currentProvider.lastSyncTime;
            if (lastSyncTime) {
                lastSyncTimeInfo.text(new Date(parseInt(lastSyncTime)).toLocaleString());
            } else {
                lastSyncTimeInfo.text(i18n.getMessage('sync_last_sync_time_never_sync_text'));
            }
        }
    }

    return {
        renderSyncSettings: renderSyncSettings,
        updateSyncSettings: updateSyncSettings
    };
};

var Settings = function () {

    var Checkbox = function (id, property, options) {

        options = options || {};
        var negate = options.negate;
        var hidden = options.hidden;

        var element = $(id);
        if (!hidden) {
            element.on('change', function () {
                contentPage.sendMessage({
                    type: 'changeUserSetting',
                    key: property,
                    value: negate ? !this.checked : this.checked
                });
                if (property === userSettings.names.DISABLE_SHOW_ADGUARD_PROMO_INFO) {
                    updateDisplayAdguardPromo(this.checked);
                }
            });
        }
        var render = function () {
            if (hidden) {
                element.closest('li').hide();
                return;
            }
            var checked = userSettings.values[property];
            if (negate) {
                checked = !checked;
            }
            element.updateCheckbox(checked);
        };
        return {
            render: render
        };
    };

    var checkboxes = [];
    checkboxes.push(new Checkbox('#safebrowsingEnabledCheckbox', userSettings.names.DISABLE_SAFEBROWSING, {negate: true}));
    checkboxes.push(new Checkbox('#sendSafebrowsingStatsCheckbox', userSettings.names.DISABLE_SEND_SAFEBROWSING_STATS, {negate: true}));
    checkboxes.push(new Checkbox('#autodetectFiltersCheckbox', userSettings.names.DISABLE_DETECT_FILTERS, {negate: true}));
    checkboxes.push(new Checkbox('#enableHitsCount', userSettings.names.DISABLE_COLLECT_HITS, {negate: true}));
    checkboxes.push(new Checkbox('#useOptimizedFilters', userSettings.names.USE_OPTIMIZED_FILTERS));
    checkboxes.push(new Checkbox('#showPageStatisticCheckbox', userSettings.names.DISABLE_SHOW_PAGE_STATS, {
        negate: true,
        hidden: environmentOptions.Prefs.mobile
    }));
    checkboxes.push(new Checkbox('#enableShowContextMenu', userSettings.names.DISABLE_SHOW_CONTEXT_MENU, {
        negate: true,
        hidden: environmentOptions.isSafariBrowser
    }));
    checkboxes.push(new Checkbox('#showInfoAboutAdguardFullVersion', userSettings.names.DISABLE_SHOW_ADGUARD_PROMO_INFO, {
        negate: true
    }));

    var allowAcceptableAdsCheckbox = $("#allowAcceptableAds");
    allowAcceptableAdsCheckbox.on('change', function () {
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
    });

    var render = function () {
        for (var i = 0; i < checkboxes.length; i++) {
            checkboxes[i].render();
        }
        allowAcceptableAdsCheckbox.updateCheckbox(AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID in enabledFilters);
    };

    return {
        render: render
    };
};

var PageController = function () {
};

PageController.prototype = {

    SUBSCRIPTIONS_LIMIT: 9,

    init: function () {

        this._customizeText();
        this._bindEvents();
        this._render();

        $(".opt-state input:checkbox").toggleCheckbox();

        // Initialize top menu
        TopMenu.init({
            onHashUpdated: function (tabId) {
                if (tabId === '#whitelist') {
                    this.whiteListFilter.onShown();
                }
            }.bind(this)
        });

        //updateDisplayAdguardPromo(!userSettings.values[userSettings.names.DISABLE_SHOW_ADGUARD_PROMO_INFO]);
        //customizePopupFooter(environmentOptions.isMacOs);
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

        this.resetStatsPopup = $("#resetStatsPopup");
        this.subscriptionModalEl = $('#subscriptionModal');
        this.tooManySubscriptionsEl = $('#tooManySubscriptions');
        this.tooManyRulesEl = $('#tooManyRules');

        $("#resetStats").on('click', this.onResetStatsClicked.bind(this));

        $(".openExtensionStore").on('click', function (e) {
            e.preventDefault();
            contentPage.sendMessage({type: 'openExtensionStore'});
        });

        $("#openLog").on('click', function (e) {
            e.preventDefault();
            contentPage.sendMessage({type: 'openFilteringLog'});
        });
    },

    _render: function () {

        var defaultWhitelistMode = userSettings.values[userSettings.names.DEFAULT_WHITE_LIST_MODE];

        if (environmentOptions.Prefs.mobile) {
            $('#resetStats').hide();
        }
        //Hide some functionality for content blocker safari browsers
        if (environmentOptions.isContentBlockerEnabled) {
            $('#openLog').hide();
            $('#resetStats').hide();
            $('.page-stats-switch-block').hide();
        }
        this.checkSubscriptionsCount();

        this.settings = new Settings();
        this.settings.render();

        // Initialize whitelist filter
        this.whiteListFilter = new WhiteListFilter({defaultWhiteListMode: defaultWhitelistMode});
        this.whiteListFilter.updateWhiteListFilterRules();

        // Initialize User filter
        this.userFilter = new UserFilter();
        this.userFilter.updateUserFilterRules();

        // Initialize AntiBanner filters
        this.antiBannerFilters = new AntiBannerFilters({rulesInfo: environmentOptions.isContentBlockerEnabled ? contentBlockerInfo : requestFilterInfo});
        this.antiBannerFilters.render();

        // Initialize sync tab
        this.syncSettings = new SyncSettings({syncStatusInfo:syncStatusInfo});
        this.syncSettings.renderSyncSettings();
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

    onResetStatsClicked: function (e) {
        e.preventDefault();
        contentPage.sendMessage({type: 'resetBlockedAdsCount'});
        this._onStatsReset();
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
    }
};

var userSettings;
var enabledFilters;
var environmentOptions;
var AntiBannerFiltersId;
var EventNotifierTypes;
var requestFilterInfo;
var contentBlockerInfo;
var syncStatusInfo;

/**
 * Initializes page
 */
var initPage = function (response) {

    userSettings = response.userSettings;
    enabledFilters = response.enabledFilters;
    environmentOptions = response.environmentOptions;
    requestFilterInfo = response.requestFilterInfo;
    contentBlockerInfo = response.contentBlockerInfo;
    syncStatusInfo = response.syncStatusInfo;

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
            EventNotifierTypes.REQUEST_FILTER_UPDATED,
            EventNotifierTypes.SYNC_STATUS_UPDATED
        ];

        createEventListener(events, function (event, options) {
            switch (event) {
                case EventNotifierTypes.FILTER_ENABLE_DISABLE:
                    controller.checkSubscriptionsCount();
                    controller.antiBannerFilters.onFilterStateChanged(options);
                    break;
                case EventNotifierTypes.FILTER_ADD_REMOVE:
                    controller.antiBannerFilters.onFilterStateChanged(options);
                    break;
                case EventNotifierTypes.START_DOWNLOAD_FILTER:
                    controller.antiBannerFilters.onFilterDownloadStarted(options);
                    break;
                case EventNotifierTypes.SUCCESS_DOWNLOAD_FILTER:
                case EventNotifierTypes.ERROR_DOWNLOAD_FILTER:
                    controller.antiBannerFilters.onFilterDownloadFinished(options);
                    break;
                case EventNotifierTypes.UPDATE_USER_FILTER_RULES:
                    controller.userFilter.updateUserFilterRules();
                    if (!environmentOptions.isContentBlockerEnabled) {
                        controller.antiBannerFilters.updateRulesCountInfo(options);
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
                    controller.antiBannerFilters.updateRulesCountInfo(options);
                    break;
                case EventNotifierTypes.CONTENT_BLOCKER_UPDATED:
                    controller.antiBannerFilters.updateRulesCountInfo(options);
                    break;
                case EventNotifierTypes.SYNC_STATUS_UPDATED:
                    controller.syncSettings.updateSyncSettings(options);
                    break;
            }
        });
    });
};

contentPage.sendMessage({type: 'initializeFrameScript'}, initPage);