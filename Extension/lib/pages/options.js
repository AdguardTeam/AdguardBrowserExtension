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

/* global updateDisplayAdguardPromo, contentPage, i18n, moment, ace, CheckboxUtils */

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
    },

    escapeRegExp: (function () {
        var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
        return function (str) {
            if (typeof str !== 'string') {
                throw new TypeError('Expected a string');
            }
            return str.replace(matchOperatorsRe, '\\$&');
        };
    })(),
};

var TopMenu = (function () {
    'use strict';

    var GENERAL_SETTINGS = '#general-settings';
    var ANTIBANNER = '#antibanner';
    var WHITELIST = '#whitelist';

    var prevTabId;
    var onHashUpdatedCallback;

    var toggleTab = function () {

        var tabId = document.location.hash || GENERAL_SETTINGS;
        var tab = document.querySelector(tabId);

        if (tabId.indexOf(ANTIBANNER) === 0 && !tab) {
            // AntiBanner groups and filters are loaded and rendered async
            return;
        }

        if (!tab) {
            tabId = GENERAL_SETTINGS;
            tab = document.querySelector(tabId);
        }

        var antibannerTabs = document.querySelectorAll('[data-tab="' + ANTIBANNER + '"]');

        if (prevTabId) {
            if (prevTabId.indexOf(ANTIBANNER) === 0) {
                antibannerTabs.forEach(function (el) {
                    el.classList.remove('active');
                });
            } else {
                document.querySelector('[data-tab="' + prevTabId + '"]').classList.remove('active');
            }

            document.querySelector(prevTabId).style.display = 'none';
        }

        if (tabId.indexOf(ANTIBANNER) === 0) {
            antibannerTabs.forEach(function (el) {
                el.classList.add('active');
            });
        } else {
            document.querySelector('[data-tab="' + tabId + '"]').classList.add('active');
        }

        tab.style.display = 'block';

        if (tabId === WHITELIST) {
            if (typeof onHashUpdatedCallback === 'function') {
                onHashUpdatedCallback(tabId);
            }
        }

        prevTabId = tabId;
    };

    var init = function (options) {
        onHashUpdatedCallback = options.onHashUpdated;

        window.addEventListener('hashchange', toggleTab);
        document.querySelectorAll('[data-tab]').forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                document.location.hash = el.getAttribute('data-tab');
            });
        });

        toggleTab();
    };

    return {
        init: init,
        toggleTab: toggleTab
    };

})();

var WhiteListFilter = function (options) {
    'use strict';

    var omitRenderEventsCount = 0;

    var editor = ace.edit('whiteListRules');
    editor.setShowPrintMargin(false);

    // Ace TextHighlightRules mode is edited in ace.js library file
    editor.session.setMode("ace/mode/text_highlight_rules");

    var applyChangesBtn = document.querySelector('#whiteListFilterApplyChanges');
    var changeDefaultWhiteListModeCheckbox = document.querySelector('#changeDefaultWhiteListMode');

    function loadWhiteListDomains() {
        contentPage.sendMessage({
            type: 'getWhiteListDomains'
        }, function (response) {
            editor.setValue(response.content || '');
            applyChangesBtn.style.display = 'none';
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
            applyChangesBtn.style.display = 'none';
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

    applyChangesBtn.addEventListener('click', saveWhiteListDomains);
    changeDefaultWhiteListModeCheckbox.addEventListener('change', changeDefaultWhiteListMode);

    CheckboxUtils.updateCheckbox(changeDefaultWhiteListModeCheckbox, !options.defaultWhiteListMode);

    editor.getSession().addEventListener('change', function () {
        applyChangesBtn.style.display = 'block';
    });

    return {
        updateWhiteListDomains: updateWhiteListDomains
    };
};

var UserFilter = function () {
    'use strict';

    var omitRenderEventsCount = 0;

    var editor = ace.edit('userRules');
    editor.setShowPrintMargin(false);

    // Ace TextHighlightRules mode is edited in ace.js library file
    editor.session.setMode("ace/mode/text_highlight_rules");

    var applyChangesBtn = document.querySelector('#userFilterApplyChanges');

    function loadUserRules() {
        contentPage.sendMessage({
            type: 'getUserRules'
        }, function (response) {
            editor.setValue(response.content || '');
            applyChangesBtn.style.display = 'none';
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
            applyChangesBtn.style.display = 'none';
        });
    }

    function updateUserFilterRules() {
        if (omitRenderEventsCount > 0) {
            omitRenderEventsCount--;
            return;
        }

        loadUserRules();
    }

    applyChangesBtn.addEventListener('click', saveUserRules);

    editor.getSession().addEventListener('change', function () {
        applyChangesBtn.style.display = 'block';
    });

    return {
        updateUserFilterRules: updateUserFilterRules
    };
};

var AntiBannerFilters = function (options) {
    'use strict';

    var loadedFiltersInfo = {
        filters: [],
        categories: [],
        filtersById: {},
        lastUpdateTime: 0,

        initLoadedFilters: function (filters, categories) {
            this.filters = filters;
            this.categories = categories;

            var lastUpdateTime = 0;
            var filtersById = Object.create(null);
            for (var i = 0; i < this.filters.length; i++) {
                var filter = this.filters[i];
                filtersById[filter.filterId] = filter;
                if (filter.lastUpdateTime && filter.lastUpdateTime > lastUpdateTime) {
                    lastUpdateTime = filter.lastUpdateTime;
                }
            }

            this.filtersById = filtersById;
            this.lastUpdateTime = lastUpdateTime;
        },

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

    // Bind events
    document.addEventListener('change', function (e) {
        if (e.target.getAttribute('name') === 'filterId') {
            toggleFilterState.bind(e.target)();
        } else if (e.target.getAttribute('name') === 'groupId') {
            toggleGroupState.bind(e.target)();
        }
    });

    document.querySelector('#updateAntiBannerFilters').addEventListener('click', updateAntiBannerFilters);

    window.addEventListener('hashchange', clearSearchEvent);

    updateRulesCountInfo(options.rulesInfo);

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
        return document.querySelector('#category' + groupId);
    }

    function getCategoryCheckbox(groupId) {
        var categoryElement = getCategoryElement(groupId);
        if (!categoryElement) {
            return null;
        }

        return categoryElement.querySelector('input');
    }

    function getFilterElement(filterId) {
        return document.querySelector('#filter' + filterId);
    }

    function getFilterCheckbox(filterId) {
        var filterElement = getFilterElement(filterId);
        if (!filterElement) {
            return null;
        }

        return filterElement.querySelector('input');
    }

    function updateCategoryFiltersInfo(groupId) {
        var groupFilters = getFiltersByGroupId(groupId, loadedFiltersInfo.filters);
        var enabledFiltersCount = countEnabledFilters(groupFilters);

        var element = getCategoryElement(groupId);
        var checkbox = getCategoryCheckbox(groupId);

        element.querySelector('.desc').textContent = 'Enabled filters: ' + enabledFiltersCount;
        CheckboxUtils.updateCheckbox([checkbox], enabledFiltersCount > 0);
    }

    function getFilterCategoryElement(category) {
        return htmlToElement(`
                <li id="category${category.groupId}" class="active">
                    <div class="block-type">
                        <div class="block-type__ico block-type__ico--${category.groupId}"></div>
                        <a href="#antibanner${category.groupId}">${category.groupName}</a>
                    </div>
                    <div class="opt-state">
                        <div class="preloader"></div>
                        <div class="desc"></div>
                        <input type="checkbox" name="groupId" value="${category.groupId}">
                    </div>
                </li>`);
    }

    function getFilterTemplate(filter, enabled, showDeleteButton) {
        var timeUpdated = moment(filter.timeUpdated);
        timeUpdated.locale(environmentOptions.Prefs.locale);
        var timeUpdatedText = timeUpdated.format("D/MM/YYYY HH:mm").toLowerCase();

        var tagDetails = '';
        filter.tagsDetails.forEach(function (tag) {
            tagDetails += `<div class="opt-name__tag" data-tooltip="${tag.description}">#${tag.keyword}</div>`;
        });

        var deleteButton = '';
        if (showDeleteButton) {
            deleteButton = `<a href="#" filterid="${filter.filterId}" class="remove-custom-filter-button">remove</a>`;
        }

        return `
            <li id="filter${filter.filterId}">
                <div class="opt-name">
                    <div class="title">${filter.name}</div>
                    <div class="desc">${filter.description}</div>
                    <div class="opt-name__info">
                        <div class="opt-name__info-labels">
                            <div class="opt-name__info-item">version ${filter.version}</div>
                            <div class="opt-name__info-item">updated: ${timeUpdatedText}</div>
                        </div>
                        <div class="opt-name__info-labels opt-name__info-labels--tags">
                            ${tagDetails}
                        </div>
                    </div>
                </div>
                <div class="opt-state">
                    <div class="preloader"></div>
                    ${deleteButton}
                    <a class="icon-home" target="_blank" href="${filter.homepage}"></a>
                    <input type="checkbox" name="filterId" value="${filter.filterId}" ${enabled ? 'checked="checked"' : ''}>
                </div>
            </li>`;
    }

    function getPageTitleTemplate(name) {
        return `
            <div class="page-title">
                <a href="#antibanner">
                    <img src="images/icon-back.png" class="back">
                </a>
                ${name}
            </div>`;
    }

    function getEmptyCustomFiltersTemplate(category) {
        return `
            <div id="antibanner${category.groupId}" class="settings-content tab-pane filters-list">
                ${getPageTitleTemplate(category.groupName)}
                <div class="settings-body">
                    <div class="empty-filters">
                        <div class="empty-filters__logo"></div>
                        <div class="empty-filters__desc">
                            Sorry, but you don't have any custom filters yet
                        </div>
                        <button class="button button--green empty-filters__btn">
                            Add custom filter
                        </button>
                    </div>
                </div>
            </div>`;
    }

    function getFiltersContentElement(category) {
        var otherFilters = category.filters.otherFilters;
        var recommendedFilters = category.filters.recommendedFilters;
        var filters = [].concat(recommendedFilters, otherFilters);
        var isCustomFilters = category.groupId === 0;

        if (isCustomFilters &&
            filters.length === 0) {
            return htmlToElement(getEmptyCustomFiltersTemplate(category));
        }

        var pageTitleEl = getPageTitleTemplate(category.groupName);

        var filtersList = '';

        for (var i = 0; i < filters.length; i += 1) {
            filtersList += getFilterTemplate(filters[i], loadedFiltersInfo.isEnabled(filters[i].filterId), isCustomFilters);
        }

        return htmlToElement(`
            <div id="antibanner${category.groupId}" class="settings-content tab-pane filters-list">
                ${pageTitleEl}
                <div class="settings-body">
                    <div class="filters-search">
                        <input type="text" placeholder="${i18n.getMessage('options_filters_list_search_placeholder')}" name="searchFiltersList"/>
                        <div class="icon-search">
                            <img src="images/icon-magnifying-green.png" alt="">
                        </div>
                    </div>
                    <ul class="opts-list">
                        ${filtersList}
                    </ul>
                </div>
            </div>
        `);
    }

    function renderFilterCategory(category) {
        var categoryContentElement = document.querySelector('#antibanner' + category.groupId);
        if (categoryContentElement) {
            categoryContentElement.parentNode.removeChild(categoryContentElement);
        }
        var categoryElement = document.querySelector('#category' + category.groupId);
        if (categoryElement) {
            categoryElement.parentNode.removeChild(categoryElement);
        }

        categoryElement = getFilterCategoryElement(category);
        document.querySelector('#groupsList').appendChild(categoryElement);
        updateCategoryFiltersInfo(category.groupId);

        categoryContentElement = getFiltersContentElement(category);
        document.querySelector('#antibanner').parentNode.appendChild(categoryContentElement);
    }

    function bindControls() {
        var emptyFiltersAddCustomButton = document.querySelector('.empty-filters__btn');
        if (emptyFiltersAddCustomButton) {
            emptyFiltersAddCustomButton.addEventListener('click', addCustomFilter);
        }

        document.querySelector('#addCustomFilter').addEventListener('click', addCustomFilter);
        document.querySelectorAll('.remove-custom-filter-button').forEach(function (el) {
            el.addEventListener('click', removeCustomFilter);
        });
    }

    function initFiltersSearch(category) {
        const searchInput = document.querySelector(`#antibanner${category.groupId} input[name="searchFiltersList"]`);
        let filters = document.querySelectorAll(`#antibanner${category.groupId} .opts-list li`);
        const SEARCH_DELAY_MS = 250;
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                let searchString;
                try {
                    searchString = Utils.escapeRegExp(e.target.value.trim());
                } catch (err) {
                    console.log(err.message);
                    return;
                }
                if (!searchString) {
                    return;
                }
                filters.forEach(filter => {
                    const title = filter.querySelector('.title');
                    const regexp = new RegExp(searchString, 'gi');
                    if (!regexp.test(title.textContent)) {
                        filter.style.display = 'none';
                    } else {
                        filter.style.display = 'flex';
                    }
                });
            }, SEARCH_DELAY_MS));
        }
    }

    /**
     * Function clears search results when user moves from category antibanner page to another page
     * @param {*} on hashchange event
     */
    function clearSearchEvent(event) {
        const regex = /#antibanner(\d+)/g;
        const match = regex.exec(event.oldURL);
        if (!match) {
            return;
        }
        const groupId = match[1];
        const searchInput = document.querySelector(`#antibanner${groupId} input[name="searchFiltersList"]`);
        let filters = document.querySelectorAll(`#antibanner${groupId} .opts-list li`);
        if (searchInput) {
            searchInput.value = '';
        }
        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                filter.style.display = 'flex';
            });
        }
    }

    function renderCategoriesAndFilters() {
        contentPage.sendMessage({ type: 'getFiltersMetadata' }, function (response) {
            loadedFiltersInfo.initLoadedFilters(response.filters, response.categories);
            setLastUpdatedTimeText(loadedFiltersInfo.lastUpdateTime);

            var categories = loadedFiltersInfo.categories;
            for (var j = 0; j < categories.length; j += 1) {
                var category = categories[j];
                renderFilterCategory(category);
                initFiltersSearch(category);
            }

            bindControls();
            CheckboxUtils.toggleCheckbox(document.querySelectorAll('.opt-state input[type=checkbox]'));

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

    function updateAntiBannerFilters(e) {
        e.preventDefault();
        contentPage.sendMessage({type: 'checkAntiBannerFiltersUpdate'}, function () {
            //Empty
        });
    }

    function addCustomFilter(e) {
        e.preventDefault();

        document.location.hash = 'antibanner';
        renderCustomFilterPopup();
    }

    function removeCustomFilter(e) {
        e.preventDefault();

        var filterId = e.currentTarget.getAttribute('filterId');

        contentPage.sendMessage({
            type: 'removeAntiBannerFilter',
            filterId: filterId
        });

        var filterElement = getFilterElement(filterId);
        filterElement.parentNode.removeChild(filterElement);
    }

    function renderCustomFilterPopup() {
        var POPUP_ACTIVE_CLASS = 'option-popup__step--active';

        function closePopup() {
            document.querySelector('#add-custom-filter-popup').classList.remove('option-popup--active');
        }

        function clearActiveStep() {
            document.querySelector('#add-custom-filter-step-1').classList.remove(POPUP_ACTIVE_CLASS);
            document.querySelector('#add-custom-filter-step-2').classList.remove(POPUP_ACTIVE_CLASS);
            document.querySelector('#add-custom-filter-step-3').classList.remove(POPUP_ACTIVE_CLASS);
            document.querySelector('#add-custom-filter-step-4').classList.remove(POPUP_ACTIVE_CLASS);
        }

        function renderStepOne() {
            clearActiveStep();
            document.querySelector('#add-custom-filter-step-1').classList.add(POPUP_ACTIVE_CLASS);

            document.querySelector('#custom-filter-popup-url').focus();
        }

        function renderStepTwo() {
            clearActiveStep();
            document.querySelector('#add-custom-filter-step-2').classList.add(POPUP_ACTIVE_CLASS);
        }

        function renderStepThree() {
            clearActiveStep();
            document.querySelector('#add-custom-filter-step-3').classList.add(POPUP_ACTIVE_CLASS);
        }

        function renderStepFour(filter) {
            clearActiveStep();
            document.querySelector('#add-custom-filter-step-4').classList.add(POPUP_ACTIVE_CLASS);

            document.querySelector('#custom-filter-popup-added-title').textContent = filter.name;
            document.querySelector('#custom-filter-popup-added-desc').textContent = filter.description;
            document.querySelector('#custom-filter-popup-added-version').textContent = filter.version;
            document.querySelector('#custom-filter-popup-added-rules-count').textContent = filter.rulesCount;
            document.querySelector('#custom-filter-popup-added-homepage').textContent = filter.homepage;
            document.querySelector('#custom-filter-popup-added-homepage').setAttribute("href", filter.homepage);
            document.querySelector('#custom-filter-popup-added-url').textContent = filter.customUrl;
            document.querySelector('#custom-filter-popup-added-url').setAttribute("href", filter.customUrl);

            document.querySelector('#custom-filter-popup-added-back').addEventListener('click', renderStepOne);
            document.querySelector('#custom-filter-popup-added-subscribe').removeEventListener('click', onSubscribeClicked);
            document.querySelector('#custom-filter-popup-added-subscribe').addEventListener('click', onSubscribeClicked);

            document.querySelector('#custom-filter-popup-remove').addEventListener('click', function () {
                contentPage.sendMessage({
                    type: 'removeAntiBannerFilter',
                    filterId: filter.filterId
                });
                closePopup();
            });
        }

        function onSubscribeClicked() {
            contentPage.sendMessage({type: 'addAndEnableFilter', filterId: filter.filterId});
            closePopup();
        }

        document.querySelector('#add-custom-filter-popup').classList.add('option-popup--active');
        document.querySelector('.option-popup__cross').addEventListener('click', closePopup);
        document.querySelector('.custom-filter-popup-cancel').addEventListener('click', closePopup);

        document.querySelector('.custom-filter-popup-next').addEventListener('click', function (e) {
            e.preventDefault();

            var url = document.querySelector('#custom-filter-popup-url').value;
            contentPage.sendMessage({type: 'loadCustomFilterInfo', url: url}, function (filter) {
                if (filter) {
                    renderStepFour(filter);
                } else {
                    renderStepThree();
                }
            });

            renderStepTwo();
        });

        document.querySelector('.custom-filter-popup-try-again').addEventListener('click', renderStepOne);

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

        document.querySelector('#lastUpdateTime').textContent = updateText;
    }

    function updateRulesCountInfo(info) {
        var message = i18n.getMessage("options_antibanner_info", [String(info.rulesCount || 0)]);
        document.querySelector('#filtersRulesInfo').textContent = message;
    }

    function onFilterStateChanged(filter) {
        var filterId = filter.filterId;
        var enabled = filter.enabled;
        loadedFiltersInfo.updateEnabled(filter, enabled);
        updateCategoryFiltersInfo(filter.groupId);

        CheckboxUtils.updateCheckbox([getFilterCheckbox(filterId)], enabled);
    }

    function onFilterDownloadStarted(filter) {
        getCategoryElement(filter.groupId).querySelector('.preloader').classList.add('active');
        getFilterElement(filter.filterId).querySelector('.preloader').classList.add('active');
    }

    function onFilterDownloadFinished(filter) {
        getCategoryElement(filter.groupId).querySelector('.preloader').classList.remove('active');
        getFilterElement(filter.filterId).querySelector('.preloader').classList.remove('active');
        setLastUpdatedTimeText(filter.lastUpdateTime);
    }

    return {
        render: renderCategoriesAndFilters,
        updateRulesCountInfo: updateRulesCountInfo,
        onFilterStateChanged: onFilterStateChanged,
        onFilterDownloadStarted: onFilterDownloadStarted,
        onFilterDownloadFinished: onFilterDownloadFinished
    };
};

var SyncSettings = function (options) {
    'use strict';

    var syncStatus = options.syncStatusInfo;
    var currentProvider = options.syncStatusInfo.currentProvider;

    var unauthorizedBlock = document.querySelector('#unauthorizedBlock');
    var authorizedBlock = document.querySelector('#authorizedBlock');
    var signInButton = document.querySelector('#signInButton');
    var signOutButton = document.querySelector('#signOutButton');
    var startSyncButton = document.querySelector('#startSyncButton');
    var syncNowButton = document.querySelector('#syncNowButton');
    var lastSyncTimeInfo = document.querySelector('#lastSyncTimeInfo');
    var selectProviderButton = document.querySelector('#selectProviderButton');

    var providersDropdown = document.querySelector('#selectProviderDropdown');

    bindControls();

    function bindControls() {

        selectProviderButton.addEventListener('click', function () {
            providersDropdown.style.display = 'block';
        });

        signInButton.addEventListener('click', function (e) {
            e.preventDefault();
            if (currentProvider) {
                contentPage.sendMessage({
                    type: 'authSync',
                    provider: currentProvider.name
                });
            }
        });

        signOutButton.addEventListener('click', function (e) {
            e.preventDefault();
            if (currentProvider && currentProvider.isOAuthSupported) {
                contentPage.sendMessage({
                    type: 'dropAuthSync',
                    provider: currentProvider.name
                });
            } else {
                contentPage.sendMessage({type: 'toggleSync'});
            }
        });

        startSyncButton.addEventListener('click', function (e) {
            e.preventDefault();
            contentPage.sendMessage({type: 'toggleSync'});
        });

        syncNowButton.addEventListener('click', function (e) {
            e.preventDefault();
            updateSyncState();
            contentPage.sendMessage({type: 'syncNow'});
        });

        document.querySelector('#changeDeviceNameButton').addEventListener('click', function (e) {
            e.preventDefault();
            var deviceName = document.querySelector('#deviceNameInput').value;
            contentPage.sendMessage({
                type: 'syncChangeDeviceName',
                deviceName: deviceName
            });
        });

        document.querySelector('#adguardSelectProvider').addEventListener('click', onProviderSelected('ADGUARD_SYNC'));
        document.querySelector('#dropboxSelectProvider').addEventListener('click', onProviderSelected('DROPBOX'));
        document.querySelector('#browserStorageSelectProvider').addEventListener('click', onProviderSelected('BROWSER_SYNC'));

        document.querySelector('#sync-general-settings-checkbox').addEventListener('change', onSyncOptionsChanged);
        document.querySelector('#sync-filters-checkbox').addEventListener('change', onSyncOptionsChanged);
        document.querySelector('#sync-extension-specific-checkbox').addEventListener('change', onSyncOptionsChanged);
    }

    function onSyncOptionsChanged() {
        contentPage.sendMessage({
            type: 'setSyncOptions', options: {
                syncGeneral: document.querySelector('#sync-general-settings-checkbox').hasAttribute('checked'),
                syncFilters: document.querySelector('#sync-filters-checkbox').hasAttribute('checked'),
                syncExtensionSpecific: document.querySelector('#sync-extension-specific-checkbox').hasAttribute('checked')
            }
        });
    }

    function onProviderSelected(providerName) {
        return function (e) {
            e.preventDefault();
            providersDropdown.style.display = 'none';
            contentPage.sendMessage({type: 'setSyncProvider', provider: providerName}, function () {
                document.location.reload();
            });
        };
    }

    function renderSelectProviderBlock() {
        unauthorizedBlock.style.display = 'block';
        authorizedBlock.style.display = 'none';
        signInButton.style.display = 'none';
        startSyncButton.style.display = 'none';
    }

    function renderUnauthorizedBlock() {

        unauthorizedBlock.style.display = 'block';
        authorizedBlock.style.display = 'none';

        if (currentProvider.isOAuthSupported && !currentProvider.isAuthorized) {
            signInButton.style.display = 'block';
        } else {
            signInButton.style.display = 'none';
        }

        if (!syncStatus.enabled && currentProvider.isAuthorized) {
            startSyncButton.style.display = 'block';
        } else {
            startSyncButton.style.display = 'none';
        }

        selectProviderButton.textContent = currentProvider.title;
    }

    function renderAuthorizedBlock() {

        unauthorizedBlock.style.display = 'none';
        authorizedBlock.style.display = 'block';

        document.querySelector('#providerNameInfo').textContent = currentProvider.title;

        var manageAccountButton = document.querySelector('#manageAccountButton');
        var deviceNameBlock = document.querySelector('#deviceNameBlock');

        updateSyncState();

        if (currentProvider.isOAuthSupported && currentProvider.name === 'ADGUARD_SYNC') {
            manageAccountButton.style.display = 'block';
            deviceNameBlock.style.display = 'block';
            document.querySelector('#deviceNameInput').value = currentProvider.deviceName;
        } else {
            manageAccountButton.style.display = 'none';
            deviceNameBlock.style.display = 'none';
        }

        document.querySelector('#sync-general-settings-checkbox').setAttribute('checked', syncStatus.syncOptions.syncGeneral);
        document.querySelector('#sync-filters-checkbox').setAttribute('checked', syncStatus.syncOptions.syncFilters);
        document.querySelector('#sync-extension-specific-checkbox').setAttribute('checked', syncStatus.syncOptions.syncExtensionSpecific);
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
            document.querySelector('#browserStorageSelectProvider').style.display = 'none';
        }

        if (currentProvider) {
            var activeClass = 'dropdown__item--active';

            switch (currentProvider.name) {
                case 'ADGUARD_SYNC':
                    document.querySelector('#adguardSelectProvider').classList.add(activeClass);
                    break;
                case 'DROPBOX':
                    document.querySelector('#dropboxSelectProvider').classList.add(activeClass);
                    break;
                case 'BROWSER_SYNC':
                    document.querySelector('#browserStorageSelectProvider').classList.add(activeClass);
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
            syncNowButton.setAttribute('disabled', 'disabled');
            syncNowButton.textContent = i18n.getMessage('sync_in_progress_button_text');
        } else {
            syncNowButton.removeAttribute('disabled');
            syncNowButton.textContent = i18n.getMessage('sync_now_button_text');
        }

        if (currentProvider) {
            var lastSyncTime = currentProvider.lastSyncTime;
            if (lastSyncTime) {
                lastSyncTimeInfo.textContent = new Date(parseInt(lastSyncTime)).toLocaleString();
            } else {
                lastSyncTimeInfo.textContent = i18n.getMessage('sync_last_sync_time_never_sync_text');
            }
        }
    }

    return {
        renderSyncSettings: renderSyncSettings,
        updateSyncSettings: updateSyncSettings
    };
};

var Settings = function () {
    'use strict';

    var Checkbox = function (id, property, options) {

        options = options || {};
        var negate = options.negate;
        var hidden = options.hidden;

        var element = document.querySelector(id);
        if (!hidden) {
            element.addEventListener('change', function () {
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
                element.closest('li').style.display = 'none';
                return;
            }
            var checked = userSettings.values[property];
            if (negate) {
                checked = !checked;
            }

            CheckboxUtils.updateCheckbox([element], checked);
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
        hidden: false
    }));
    checkboxes.push(new Checkbox('#showInfoAboutAdguardFullVersion', userSettings.names.DISABLE_SHOW_ADGUARD_PROMO_INFO, {
        negate: true
    }));
    checkboxes.push(new Checkbox('#showAppUpdatedNotification', userSettings.names.DISABLE_SHOW_APP_UPDATED_NOTIFICATION, {
        negate: true
    }));

    var allowAcceptableAdsCheckbox = document.querySelector("#allowAcceptableAds");
    allowAcceptableAdsCheckbox.addEventListener('change', function () {
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

        CheckboxUtils.updateCheckbox([allowAcceptableAdsCheckbox], AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID in enabledFilters);
    };

    var showPopup = function (title, text) {
        contentPage.sendMessage({type: 'showAlertMessagePopup', title: title, text: text});
    };

    var importSettingsFile = function () {
        var input = document.createElement('input');
        input.type = 'file';
        var event = document.createEvent('HTMLEvents');
        event.initEvent('click', true, false);
        input.dispatchEvent(event);

        var onFileLoaded = function (content) {
            contentPage.sendMessage({type: 'applySettingsJson', json: content});
        };

        input.addEventListener('change', function () {
            var file = e.currentTarget.files[0];
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

    document.querySelector('#importSettingsFile').addEventListener('click', function (e) {
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

        CheckboxUtils.toggleCheckbox(document.querySelectorAll(".opt-state input[type=checkbox]"));

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
        document.querySelectorAll('a.sp-table-row-info').forEach(function (a) {
            a.classList.add('question');
            a.textContent = '';
        });

        document.querySelectorAll('span.sp-table-row-info').forEach(function (element) {
            var li = element.closest('li');
            element.parentNode.removeChild(element);

            var state = li.querySelector('.opt-state');
            element.classList.add('desc');
            state.insertBefore(element, state.firstChild);
        });
    },

    _bindEvents: function () {

        this.resetStatsPopup = document.querySelector("#resetStatsPopup");
        this.tooManySubscriptionsEl = document.querySelector('#tooManySubscriptions');

        document.querySelector("#resetStats").addEventListener('click', this.onResetStatsClicked.bind(this));

        document.querySelector(".openExtensionStore").addEventListener('click', function (e) {
            e.preventDefault();
            contentPage.sendMessage({type: 'openExtensionStore'});
        });

        document.querySelector("#openLog").addEventListener('click', function (e) {
            e.preventDefault();
            contentPage.sendMessage({type: 'openFilteringLog'});
        });
    },

    _render: function () {

        var defaultWhitelistMode = userSettings.values[userSettings.names.DEFAULT_WHITE_LIST_MODE];

        if (environmentOptions.Prefs.mobile) {
            document.querySelector('#resetStats').style.display = 'none';
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
        this.antiBannerFilters = new AntiBannerFilters({rulesInfo: requestFilterInfo});
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
        this.resetStatsPopup.style.display = 'block';
        if (this.closePopupTimeoutId) {
            clearTimeout(this.closePopupTimeoutId);
        }
        this.closePopupTimeoutId = setTimeout(function () {
            this.resetStatsPopup.style.display = 'none';
        }.bind(this), 4000);
    },

    checkSubscriptionsCount: function () {
        //TODO: Fix too many subscriptions warning
        //var enabledCount = this.subscriptionModalEl.querySelectorAll('input[name="modalFilterId"][checked="checked"]').length;

        // if (enabledCount >= this.SUBSCRIPTIONS_LIMIT) {
        //     this.tooManySubscriptionsEl.show();
        // } else {
        //     this.tooManySubscriptionsEl.hide();
        // }
    }
};

var userSettings;
var enabledFilters;
var environmentOptions;
var AntiBannerFiltersId;
var EventNotifierTypes;
var requestFilterInfo;
var syncStatusInfo;

/**
 * Initializes page
 */
var initPage = function (response) {

    userSettings = response.userSettings;
    enabledFilters = response.enabledFilters;
    environmentOptions = response.environmentOptions;
    requestFilterInfo = response.requestFilterInfo;
    syncStatusInfo = response.syncStatusInfo;

    AntiBannerFiltersId = response.constants.AntiBannerFiltersId;
    EventNotifierTypes = response.constants.EventNotifierTypes;

    var onDocumentReady = function() {

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
                    controller.antiBannerFilters.updateRulesCountInfo(options);
                    break;
                case EventNotifierTypes.UPDATE_WHITELIST_FILTER_RULES:
                    controller.whiteListFilter.updateWhiteListDomains();
                    break;
                case EventNotifierTypes.REQUEST_FILTER_UPDATED:
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
    };

    if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
        onDocumentReady();
    } else {
        document.addEventListener('DOMContentLoaded', onDocumentReady);
    }
};

contentPage.sendMessage({type: 'initializeFrameScript'}, initPage);