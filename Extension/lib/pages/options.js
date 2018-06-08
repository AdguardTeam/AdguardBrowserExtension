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

    var omitRenderEventsCount = 0;

    var editor = ace.edit('whiteListRules');
    editor.setShowPrintMargin(false);

    // Ace TextHighlightRules mode is edited in ace.js library file
    editor.session.setMode("ace/mode/text_highlight_rules");

    var applyChangesBtn = $('#whiteListFilterApplyChanges');
    var changeDefaultWhiteListModeCheckbox = $('#changeDefaultWhiteListMode');

    function loadWhiteListDomains() {
        contentPage.sendMessage({
            type: 'getWhiteListDomains'
        }, function (response) {
            editor.setValue(response.content || '');
            applyChangesBtn.hide();
        });
    }

    function saveWhiteListDomains(e) {

        e.preventDefault();

        omitRenderEventsCount = 1;

        editor.setReadOnly(true);
        var text = editor.getValue();

        contentPage.sendMessage({
            type: 'saveWhiteListDomains',
            content: text
        }, function () {
            editor.setReadOnly(false);
            applyChangesBtn.hide();
        });
    }

    function updateWhiteListDomains() {
        if (omitRenderEventsCount > 0) {
            omitRenderEventsCount--;
            return;
        }
        loadWhiteListDomains();
    }

    function changeDefaultWhiteListMode(e) {
        e.preventDefault();
        contentPage.sendMessage({type: 'changeDefaultWhiteListMode', enabled: !e.currentTarget.checked}, function () {
            updateWhiteListDomains();
        });
    }

    applyChangesBtn.on('click', saveWhiteListDomains);
    changeDefaultWhiteListModeCheckbox.on('change', changeDefaultWhiteListMode);
    changeDefaultWhiteListModeCheckbox.updateCheckbox(!options.defaultWhiteListMode);

    editor.getSession().on('change', function () {
        applyChangesBtn.show();
    });

    return {
        updateWhiteListDomains: updateWhiteListDomains
    };
};

var UserFilter = function () {

    var omitRenderEventsCount = 0;

    var editor = ace.edit('userRules');
    editor.setShowPrintMargin(false);

    // Ace TextHighlightRules mode is edited in ace.js library file
    editor.session.setMode("ace/mode/text_highlight_rules");

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
        updateEnabled: function (filter, enabled) {
            var info = this.filtersById[filter.filterId];
            if (info) {
                info.enabled = enabled;
            } else {
                this.filters.push(filter);
                this.filtersById[filter.filterId] = filter;
            }
        }
    };

    var groupsList = $('#groupsList');

    function getFiltersByGroupId(groupId, filters) {
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

    function getCategoryElement(groupId) {
        return $('#category' + groupId);
    }

    function getCategoryCheckbox(groupId) {
        return getCategoryElement(groupId).find('input');
    }

    function getFilterElement(filterId) {
        return $('#filter' + filterId);
    }

    function getFilterCheckbox(filterId) {
        return getFilterElement(filterId).find('input');
    }

    function updateCategoryFiltersInfo(groupId) {
        var groupFilters = getFiltersByGroupId(groupId, loadedFiltersInfo.filters);
        var enabledFiltersCount = countEnabledFilters(groupFilters);

        var element = getCategoryElement(groupId);
        var checkbox = getCategoryCheckbox(groupId);
        element.find('.desc').text('Enabled filters: ' + enabledFiltersCount);
        checkbox.updateCheckbox(enabledFiltersCount > 0);
    }

    function getFilterCategoryTemplate(category) {
        return $('<li>', {id: 'category' + category.groupId})
            .append($('<div>', {class: 'block-type'})
                .append($('<div>', {class: 'block-type__ico block-type__ico--' + category.groupId}))
                .append($('<a>', {
                    href: '#antibanner' + category.groupId,
                    text: category.groupName
                })))
            .append($('<div>', {class: 'opt-state'})
                .append($('<div>', {class: 'preloader'}))
                .append($('<div>', {class: 'desc'}))
                .append($('<input>', {type: 'checkbox', name: 'groupId', value: category.groupId})));
    }

    function getFilterTemplate(filter, enabled, showDeleteButton) {
        var timeUpdated = moment(filter.timeUpdated);
        timeUpdated.locale(environmentOptions.Prefs.locale);
        var timeUpdatedText = timeUpdated.format("D/MM/YYYY HH:mm").toLowerCase();

        var tagDetails = $('<div>', {class: 'opt-name__info-labels opt-name__info-labels--tags'});
        filter.tagsDetails.forEach(function (tag) {
            tagDetails.append($('<div>', {class: 'opt-name__tag', 'data-tooltip': tag.description, text: '#' + tag.keyword}));
        });

        var optionsBlock = $('<div>', {class: 'opt-state'})
            .append($('<div>', {class: 'preloader'}))
            .append($('<a>', {class: 'icon-home', target: '_blank', href: filter.homepage}))
            .append($('<input>', {type: 'checkbox', name: 'filterId', value: filter.filterId, checked: enabled}));

        if (showDeleteButton) {
            optionsBlock = optionsBlock.append($('<a>', {href: '#', text: 'remove', filterId: filter.filterId, class: 'remove-custom-filter-button'}));
        }

        return $('<li>', {id: 'filter' + filter.filterId})
            .append($('<div>', {class: 'opt-name'})
                .append($('<div>', {class: 'title', text: filter.name}))
                .append($('<div>', {class: 'desc', text: filter.description}))
                .append($('<div>', {class: 'opt-name__info'})
                    .append($('<div>', {class: 'opt-name__info-labels'})
                        .append($('<div>', {class: 'opt-name__info-item', text: 'version ' + filter.version}))
                        .append($('<div>', {class: 'opt-name__info-item', text: 'updated: ' + timeUpdatedText}))
                    )
                    .append(tagDetails)
                )
            )
            .append(optionsBlock);
    }

    function getFiltersContentTemplate(category) {
        var filters = category.filters.otherFilters;
        var recommendedFilters = category.filters.recommendedFilters;
        var isCustomFilters = category.groupId === 0;

        function createPageTitleElement(name) {
            return $('<div>', {class: 'page-title'})
                .append($('<a>', {href: '#antibanner'})
                    .append($('<img>', {
                        src: 'images/icon-back.png',
                        class: 'back'
                    })))
                .append(document.createTextNode(name));
        }

        function createTabsBar(showRecommended) {
            var recommendedClass = showRecommended ? 'tab active': 'tab';
            var othersClass = showRecommended ? 'tab': 'tab active';

            var result = $('<div>', {class: 'tabs-bar'});
            if (showRecommended) {
                result = result.append($('<a>', {href: '', class: recommendedClass, text: 'Recommended', 'data-tab': 'recommended'}));
            }

            return result.append($('<a>', {href: '', class: othersClass, text: 'Other', 'data-tab': 'other'}));
        }

        function appendFilterTemplate(filter, list, showDeleteButton) {
            var enabled = loadedFiltersInfo.isEnabled(filter.filterId);
            var filterTemplate = getFilterTemplate(filter, enabled, showDeleteButton);
            list.append(filterTemplate);
        }

        var pageTitleEl = createPageTitleElement(category.groupName);

        if (isCustomFilters &&
            filters.length === 0 &&
            recommendedFilters.length === 0) {

            return $('<div>', {id: 'antibanner' + category.groupId, class: 'settings-content tab-pane filters-list'})
                .append(pageTitleEl)
                .append($('<div>', {class: 'settings-body'})
                    .append($('<div>', {class:'empty-filters'})
                        .append($('<div>', {class:'empty-filters__logo'}))
                        .append($('<div>', {class:'empty-filters__desc', text: "Sorry, but you don't have any custom filters yet"}))
                        .append($('<button>', {class:'button button--green empty-filters__btn', text: 'Add custom filter'}))));
        }

        var recommendedFiltersList = $('<ul>', {class: 'opts-list', 'data-tab': 'recommended'});
        var filtersList = $('<ul>', {class: 'opts-list', 'data-tab': 'other', style: 'display:none;'});

        var showRecommended = recommendedFilters.length > 0;
        var tabsBar = createTabsBar(showRecommended);
        if (!showRecommended) {
            recommendedFiltersList.hide();
            filtersList.show();
        }

        for (var i = 0; i < filters.length; i++) {
            appendFilterTemplate(filters[i], filtersList, isCustomFilters);
        }

        for (var j = 0; j < recommendedFilters.length; j++) {
            appendFilterTemplate(recommendedFilters[j], recommendedFiltersList, isCustomFilters);
        }

        var tabs = $('<div>', {class: 'settings-body'});
        if (!isCustomFilters) {
            tabs = tabs.append(tabsBar);
        }

        tabs = tabs.append(filtersList).append(recommendedFiltersList);

        return $('<div>', {id: 'antibanner' + category.groupId, class: 'settings-content tab-pane filters-list'})
            .append(pageTitleEl)
            .append(tabs);
    }

    function renderFilterCategory(category) {
        $('#antibanner' + category.groupId).remove();
        $('#category' + category.groupId).remove();

        var categoryTemplate = getFilterCategoryTemplate(category);
        groupsList.append(categoryTemplate);
        updateCategoryFiltersInfo(category.groupId);

        var filtersContentTemplate = getFiltersContentTemplate(category);

        $('#antibanner').parent().append(filtersContentTemplate);

        $('.empty-filters__btn, #addCustomFilter').on('click', addCustomFilter);
        $('.remove-custom-filter-button').on('click', removeCustomFilter);
    }

    function renderCategoriesAndFilters() {

        contentPage.sendMessage({type: 'getFiltersMetadata'}, function (response) {

            loadedFiltersInfo.filters = response.filters;
            loadedFiltersInfo.categories = response.categories;

            var filters = response.filters;
            var categories = response.categories;

            var lastUpdateTime = 0;
            var filtersById = Object.create(null);
            for (var i = 0; i < filters.length; i++) {
                var filter = filters[i];
                filtersById[filter.filterId] = filter;
                if (filter.lastUpdateTime && filter.lastUpdateTime > lastUpdateTime) {
                    lastUpdateTime = filter.lastUpdateTime;
                }
            }
            loadedFiltersInfo.filtersById = filtersById;
            setLastUpdatedTimeText(lastUpdateTime);

            for (var j = 0; j < categories.length; j++) {
                renderFilterCategory(categories[j]);
            }

            $('.tabs-bar .tab').click(function (e) {
                e.preventDefault();

                $('.tabs-bar .tab').removeClass('active');
                $(e.target).addClass('active');

                var attr = $(e.target).attr('data-tab');

                $('.opts-list[data-tab="recommended"]').hide();
                $('.opts-list[data-tab="other"]').hide();
                $('.opts-list[data-tab="' + attr + '"]').show();
            });

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

    function toggleGroupState() {
        var groupId = this.value - 0;

        if (this.checked) {
            contentPage.sendMessage({type: 'addAndEnableFiltersByGroupId', groupId: groupId});
        } else {
            contentPage.sendMessage({type: 'disableAntiBannerFiltersByGroupId', groupId: groupId});
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

    function addCustomFilter(e) {
        e.preventDefault();

        document.location.hash = 'antibanner';

        renderCustomFilterPopup();
    }

    function removeCustomFilter(e) {
        e.preventDefault();

        var filterId = $(e.currentTarget).attr('filterId');

        contentPage.sendMessage({
            type: 'removeAntiBannerFilter',
            filterId: filterId
        });

        getFilterElement(filterId).remove();
    }

    function renderCustomFilterPopup() {
        function closePopup() {
            $('#add-custom-filter-popup').removeClass('option-popup--active');
        }

        function renderStepOne() {
            $('.option-popup__step').removeClass('option-popup__step--active');
            $('#add-custom-filter-step-1').addClass('option-popup__step--active');

            $('#custom-filter-popup-url').focus();
        }

        function renderStepTwo() {
            $('.option-popup__step').removeClass('option-popup__step--active');
            $('#add-custom-filter-step-2').addClass('option-popup__step--active');
        }

        function renderStepThree() {
            $('.option-popup__step').removeClass('option-popup__step--active');
            $('#add-custom-filter-step-3').addClass('option-popup__step--active');
        }

        function renderStepFour(filter) {
            $('.option-popup__step').removeClass('option-popup__step--active');
            $('#add-custom-filter-step-4').addClass('option-popup__step--active');

            $('#custom-filter-popup-added-title').text(filter.name);
            $('#custom-filter-popup-added-desc').text(filter.description);
            $('#custom-filter-popup-added-version').text(filter.version);
            $('#custom-filter-popup-added-rules-count').text(filter.rulesCount);
            $('#custom-filter-popup-added-homepage').text(filter.homepage).attr("href", filter.homepage);
            $('#custom-filter-popup-added-url').text(filter.customUrl).attr("href", filter.customUrl);

            $('#custom-filter-popup-added-back').on('click', renderStepOne);
            $('#custom-filter-popup-added-subscribe').off('click');
            $('#custom-filter-popup-added-subscribe').on('click', function () {
                contentPage.sendMessage({type: 'addAndEnableFilter', filterId: filter.filterId});
                closePopup();
            });

            $('#custom-filter-popup-remove').on('click', function () {
                contentPage.sendMessage({
                    type: 'removeAntiBannerFilter',
                    filterId: filter.filterId
                });
                closePopup();
            });
        }

        $('#add-custom-filter-popup').addClass('option-popup--active');
        $('.option-popup__cross').on('click', closePopup);
        $('.custom-filter-popup-cancel').on('click', closePopup);

        $('.custom-filter-popup-next').on('click', function (e) {
            e.preventDefault();

            var url = $('#custom-filter-popup-url').val();
            contentPage.sendMessage({type: 'loadCustomFilterInfo', url: url}, function (filter) {
                if (filter) {
                    renderStepFour(filter);
                } else {
                    renderStepThree();
                }
            });

            renderStepTwo();
        });

        $('.custom-filter-popup-try-again').on('click', renderStepOne);

        renderStepOne();
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
        loadedFiltersInfo.updateEnabled(filter, enabled);
        updateCategoryFiltersInfo(filter.groupId);

        getFilterCheckbox(filterId).updateCheckbox(enabled);
    };

    var onFilterDownloadStarted = function (filter) {
        getCategoryElement(filter.groupId).find('.preloader').addClass('active');
        getFilterElement(filter.filterId).find('.preloader').addClass('active');
    };

    var onFilterDownloadFinished = function (filter) {
        getCategoryElement(filter.groupId).find('.preloader').removeClass('active');
        getFilterElement(filter.filterId).find('.preloader').removeClass('active');
        setLastUpdatedTimeText(filter.lastUpdateTime);
    };

    // Bind events
    $(document).on('change', '.filters-list [name="filterId"]', toggleFilterState);
    $(document).on('change', '#groupsList [name="groupId"]', toggleGroupState);
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

        $('#sync-general-settings-checkbox').on('change', onSyncOptionsChanged);
        $('#sync-filters-checkbox').on('change', onSyncOptionsChanged);
        $('#sync-extension-specific-checkbox').on('change', onSyncOptionsChanged);
    }

    function onSyncOptionsChanged() {
        contentPage.sendMessage({
            type: 'setSyncOptions', options: {
                syncGeneral: $('#sync-general-settings-checkbox').is(':checked'),
                syncFilters: $('#sync-filters-checkbox').is(':checked'),
                syncExtensionSpecific: $('#sync-extension-specific-checkbox').is(':checked')
            }
        });
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

        $('#sync-general-settings-checkbox').attr('checked', syncStatus.syncOptions.syncGeneral);
        $('#sync-filters-checkbox').attr('checked', syncStatus.syncOptions.syncFilters);
        $('#sync-extension-specific-checkbox').attr('checked', syncStatus.syncOptions.syncExtensionSpecific);
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

    var showPopup = function (title, text) {
        contentPage.sendMessage({type: 'showAlertMessagePopup', title: title, text: text});
    };

    var importSettingsFile = function () {
        var input = document.createElement('input');
        input.type = 'file';
        input.click();

        var onFileLoaded = function (content) {
            contentPage.sendMessage({type: 'applySettingsJson', json: content});
        };

        $(input).change(function () {
            var file = $(input).get(0).files[0];
            if (file) {
                var reader = new FileReader();
                reader.readAsText(file, "UTF-8");
                reader.onload = function (evt) {
                    onFileLoaded(evt.target.result);
                };
                reader.onerror = function (evt) {
                    showPopup(i18n.getMessage('options_popup_import_error_file_title'), i18n.getMessage('options_popup_import_error_file_description'));
                };
            }
        });
    };

    $('#importSettingsFile').on('click', function (e) {
        e.preventDefault();
        importSettingsFile();
    }.bind(this));

    return {
        render: render,
        showPopup: showPopup
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
                // Doing nothing
            }.bind(this)
        });

        //updateDisplayAdguardPromo(!userSettings.values[userSettings.names.DISABLE_SHOW_ADGUARD_PROMO_INFO]);
        //customizePopupFooter(environmentOptions.isMacOs);
    },

    onSettingsImported: function (success) {
        if (success) {
            this.settings.showPopup(i18n.getMessage('options_popup_import_success_title'), i18n.getMessage('options_popup_import_success_description'));

            var self = this;
            contentPage.sendMessage({type: 'initializeFrameScript'}, function (response) {
                userSettings = response.userSettings;
                enabledFilters = response.enabledFilters;
                requestFilterInfo = response.requestFilterInfo;

                self._render();
            });
        } else {
            this.settings.showPopup(i18n.getMessage('options_popup_import_error_title'), i18n.getMessage('options_popup_import_error_description'));
        }
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
        this.whiteListFilter.updateWhiteListDomains();

        // Initialize User filter
        this.userFilter = new UserFilter();
        this.userFilter.updateUserFilterRules();

        // Initialize AntiBanner filters
        this.antiBannerFilters = new AntiBannerFilters({rulesInfo: environmentOptions.isContentBlockerEnabled ? contentBlockerInfo : requestFilterInfo});
        this.antiBannerFilters.render();

        // Initialize sync tab
        this.syncSettings = new SyncSettings({syncStatusInfo: syncStatusInfo});
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
            EventNotifierTypes.SYNC_STATUS_UPDATED,
            EventNotifierTypes.SETTINGS_UPDATED
        ];

        createEventListener(events, function (event, options) {
            switch (event) {
                case EventNotifierTypes.FILTER_ENABLE_DISABLE:
                    controller.checkSubscriptionsCount();
                    controller.antiBannerFilters.onFilterStateChanged(options);
                    break;
                case EventNotifierTypes.FILTER_ADD_REMOVE:
                    controller.antiBannerFilters.render();
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
                    controller.whiteListFilter.updateWhiteListDomains();
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
                case EventNotifierTypes.SETTINGS_UPDATED:
                    controller.onSettingsImported(options);
                    break;
            }
        });
    });
};

contentPage.sendMessage({type: 'initializeFrameScript'}, initPage);