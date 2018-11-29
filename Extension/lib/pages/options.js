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

    importFromFileIntoEditor: function importFromFileIntoEditor(editor) {
        return function (event) {
            const fileInput = event.target;
            const reader = new FileReader();
            reader.onload = function (e) {
                const oldRules = editor.getValue();
                const newRules = oldRules + '\n' + e.target.result;
                editor.setValue(newRules);
                fileInput.value = '';
            };
            reader.onerror = function () {
                console.log('Error load user rules');
                fileInput.value = '';
            };
            const file = fileInput.files[0];
            if (file) {
                reader.readAsText(file, 'utf-8');
            }
        };
    },

    hoursToMs: function (hours) {
        return hours * 60 * 60 * 1000;
    },
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
        toggleTab: toggleTab,
    };
})();

const Saver = function (options) {
    this.indicatorElement = options.indicatorElement;
    this.editor = options.editor;
    this.saveEventType = options.saveEventType;
    this.omitRenderEventsCount = 0;

    const states = {
        CLEAR: 1 << 0,
        DIRTY: 1 << 1,
        SAVING: 1 << 2,
        SAVED: 1 << 3,
    };

    const indicatorText = {
        [states.CLEAR]: '',
        [states.DIRTY]: i18n.getMessage('options_editor_indicator_editing'),
        [states.SAVING]: i18n.getMessage('options_editor_indicator_saving'),
        [states.SAVED]: i18n.getMessage('options_editor_indicator_saved'),
    };

    this.isSaving = function () {
        return (this.currentState & states.SAVING) === states.SAVING;
    };

    this.isDirty = function () {
        return (this.currentState & states.DIRTY) === states.DIRTY;
    };

    this.updateIndicator = function (state) {
        this.indicatorElement.textContent = indicatorText[state];
        switch (state) {
            case states.DIRTY:
            case states.CLEAR:
            case states.SAVING:
                this.indicatorElement.classList.remove('filter-rules__label--saved');
                break;
            case states.SAVED:
                this.indicatorElement.classList.add('filter-rules__label--saved');
                break;
            default:
                break;
        }
    };

    let timeout;

    const setState = (state, skipManageState = false) => {
        this.currentState |= state;
        switch (state) {
            case states.DIRTY:
                this.currentState &= ~states.CLEAR;
                break;
            case states.CLEAR:
                this.currentState &= ~states.DIRTY;
                break;
            case states.SAVING:
                this.currentState &= ~states.SAVED;
                break;
            case states.SAVED:
                this.currentState &= ~states.SAVING;
                break;
            default:
                break;
        }

        if (!skipManageState) {
            this.manageState();
        }
    };

    this.manageState = function () {
        const EDIT_TIMEOUT_MS = 1000;
        const HIDE_INDICATOR_TIMEOUT_MS = 1500;

        if (timeout) {
            clearTimeout(timeout);
        }

        const self = this;

        const isDirty = this.isDirty();
        const isSaving = this.isSaving();

        if (isDirty && !isSaving) {
            this.updateIndicator(states.DIRTY);
            timeout = setTimeout(() => {
                self.saveRules();
                setState(states.CLEAR, true);
                setState(states.SAVING);
            }, EDIT_TIMEOUT_MS);
            return;
        }

        if (isDirty && isSaving) {
            this.updateIndicator(states.DIRTY);
            timeout = setTimeout(() => {
                setState(states.CLEAR);
                self.saveRules();
            }, EDIT_TIMEOUT_MS);
            return;
        }

        if (!isDirty && !isSaving && (this.omitRenderEventsCount === 1)) {
            this.updateIndicator(states.SAVED);
            timeout = setTimeout(() => {
                self.updateIndicator(states.CLEAR);
            }, HIDE_INDICATOR_TIMEOUT_MS);
            return;
        }

        if (!isDirty && isSaving) {
            this.updateIndicator(states.SAVING);
        }
    };

    this.saveRules = function () {
        this.omitRenderEventsCount += 1;
        const text = this.editor.getValue();
        contentPage.sendMessage({
            type: this.saveEventType,
            content: text,
        }, () => {});
    };

    const setDirty = () => {
        setState(states.DIRTY);
    };

    const setSaved = () => {
        if (this.omitRenderEventsCount > 0) {
            setState(states.SAVED);
            this.omitRenderEventsCount -= 1;
            return true;
        }
        return false;
    };

    return {
        setDirty: setDirty,
        setSaved: setSaved,
    };
};

var WhiteListFilter = function (options) {
    'use strict';

    const editor = ace.edit('whiteListRules');
    editor.setShowPrintMargin(false);

    editor.$blockScrolling = Infinity;
    const AdguardMode = ace.require('ace/mode/adguard').Mode;
    editor.session.setMode(new AdguardMode());
    editor.setOption('wrap', true);

    const saveIndicatorElement = document.querySelector('#whiteListRulesSaveIndicator');
    const saver = new Saver({
        editor: editor,
        saveEventType: 'saveWhiteListDomains',
        indicatorElement: saveIndicatorElement,
    });

    const importWhiteListInput = document.querySelector('#importWhiteListInput');
    const importWhiteListBtn = document.querySelector('#whiteListFiltersImport');
    const exportWhiteListBtn = document.querySelector('#whiteListFiltersExport');
    const changeDefaultWhiteListModeCheckbox = document.querySelector('#changeDefaultWhiteListMode');

    let hasContent = false;
    function loadWhiteListDomains() {
        contentPage.sendMessage({
            type: 'getWhiteListDomains',
        }, function (response) {
            hasContent = !!response.content;
            editor.setValue(response.content || '');
        });
    }

    function updateWhiteListDomains() {
        const omitRenderEvent = saver.setSaved();
        if (omitRenderEvent) {
            return;
        }
        loadWhiteListDomains();
    }

    const session = editor.getSession();
    let initialChangeFired = false;
    session.addEventListener('change', () => {
        if (!initialChangeFired && hasContent) {
            initialChangeFired = true;
            return;
        }
        saver.setDirty();
    });

    function changeDefaultWhiteListMode(e) {
        e.preventDefault();

        contentPage.sendMessage({ type: 'changeDefaultWhiteListMode', enabled: !e.currentTarget.checked }, function () {
            updateWhiteListDomains();
        });
    }

    changeDefaultWhiteListModeCheckbox.addEventListener('change', changeDefaultWhiteListMode);

    importWhiteListBtn.addEventListener('click', (e) => {
        e.preventDefault();
        importWhiteListInput.click();
    });

    exportWhiteListBtn.addEventListener('click', (event) => {
        event.preventDefault();
        contentPage.sendMessage({ type: 'openExportRulesTab', whitelist: true });
    });

    importWhiteListInput.addEventListener('change', Utils.importFromFileIntoEditor(editor));

    CheckboxUtils.updateCheckbox(changeDefaultWhiteListModeCheckbox, !options.defaultWhiteListMode);

    return {
        updateWhiteListDomains: updateWhiteListDomains,
    };
};

const UserFilter = function () {
    'use strict';

    const editor = ace.edit('userRules');
    editor.setShowPrintMargin(false);

    editor.$blockScrolling = Infinity;
    const AdguardMode = ace.require('ace/mode/adguard').Mode;
    editor.session.setMode(new AdguardMode());
    editor.setOption('wrap', true);

    const saveIndicatorElement = document.querySelector('#userRulesSaveIndicator');
    const saver = new Saver({
        editor: editor,
        saveEventType: 'saveUserRules',
        indicatorElement: saveIndicatorElement,
    });

    let hasContent = false;
    function loadUserRules() {
        contentPage.sendMessage({
            type: 'getUserRules',
        }, function (response) {
            hasContent = !!response.content;
            editor.setValue(response.content || '');
        });
    }

    function updateUserFilterRules() {
        const omitRenderEvent = saver.setSaved();
        if (omitRenderEvent) {
            return;
        }
        loadUserRules();
    }

    const session = editor.getSession();

    let initialChangeFired = false;
    session.addEventListener('change', () => {
        if (!initialChangeFired && hasContent) {
            initialChangeFired = true;
            return;
        }
        saver.setDirty();
    });

    const importUserFiltersInput = document.querySelector('#importUserFilterInput');
    const importUserFiltersBtn = document.querySelector('#userFiltersImport');
    const exportUserFiltersBtn = document.querySelector('#userFiltersExport');

    importUserFiltersBtn.addEventListener('click', function (event) {
        event.preventDefault();
        importUserFiltersInput.click();
    });

    importUserFiltersInput.addEventListener('change', Utils.importFromFileIntoEditor(editor));

    exportUserFiltersBtn.addEventListener('click', function (event) {
        event.preventDefault();
        contentPage.sendMessage({ type: 'openExportRulesTab', whitelist: false });
    });

    return {
        updateUserFilterRules: updateUserFilterRules,
    };
};

var AntiBannerFilters = function (options) {
    'use strict';

    var loadedFiltersInfo = {
        filters: [],
        categories: [],
        filtersById: {},
        categoriesById: {},
        lastUpdateTime: 0,

        initLoadedFilters: function (filters, categories) {
            this.filters = filters;
            this.categories = categories;

            const categoriesById = Object.create(null);
            for (let i = 0; i < this.categories.length; i += 1) {
                const category = this.categories[i];
                categoriesById[category.groupId] = category;
            }
            this.categoriesById = categoriesById;

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

        isCategoryEnabled: function (categoryId) {
            const category = this.categoriesById[categoryId];
            return category && category.enabled;
        },

        updateCategoryEnabled: function (category, enabled) {
            const categoryInfo = this.categoriesById[category.groupId];
            if (categoryInfo) {
                categoryInfo.enabled = enabled;
            } else {
                this.categories.push(category);
                this.categoriesById[category.groupId] = category;
            }
        },

        updateEnabled: function (filter, enabled) {
            var info = this.filtersById[filter.filterId];
            if (info) {
                info.enabled = enabled;
            } else {
                this.filters.push(filter);
                this.filtersById[filter.filterId] = filter;
            }
        },
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

    function generateFiltersNamesDescription(filters) {
        const namesDisplayCount = 3;
        const enabledFiltersNames = filters
            .filter(filter => filter.enabled)
            .map(filter => filter.name);

        let enabledFiltersNamesString;
        const length = enabledFiltersNames.length;
        switch (true) {
            case (length > namesDisplayCount): {
                const displayNamesString = enabledFiltersNames.slice(0, namesDisplayCount).join(', ');
                enabledFiltersNamesString = `${i18n.getMessage(
                    'options_filters_enabled_and_more_divider',
                    [displayNamesString, length - namesDisplayCount]
                )}`;
                break;
            }
            case (length > 1): {
                const lastName = enabledFiltersNames.slice(length - 1);
                const firstNames = enabledFiltersNames.slice(0, length - 1);
                enabledFiltersNamesString = `${i18n.getMessage(
                    'options_filters_enabled_and_divider',
                    [firstNames.join(', '), lastName]
                )}`;
                break;
            }
            case (length === 1): {
                enabledFiltersNamesString = enabledFiltersNames[0];
                break;
            }
            default:
                break;
        }
        enabledFiltersNamesString = length > 0 ?
            `${i18n.getMessage('options_filters_enabled')} ${enabledFiltersNamesString}` :
            `${i18n.getMessage('options_filters_no_enabled')}`;
        return enabledFiltersNamesString;
    }

    function updateCategoryFiltersInfo(groupId) {
        var groupFilters = getFiltersByGroupId(groupId, loadedFiltersInfo.filters);
        var enabledFiltersCount = countEnabledFilters(groupFilters);
        var filtersNamesDescription = generateFiltersNamesDescription(groupFilters);
        var groupFiltersCount = groupFilters.length;

        var element = getCategoryElement(groupId);
        var checkbox = getCategoryCheckbox(groupId);

        if (groupFiltersCount > 0) {
            element.querySelector('.desc').textContent = filtersNamesDescription;
        }

        const isCategoryEnabled = loadedFiltersInfo.isCategoryEnabled(groupId);
        const isCheckboxChecked = typeof isCategoryEnabled === 'undefined' ? enabledFiltersCount > 0 : isCategoryEnabled;
        CheckboxUtils.updateCheckbox([checkbox], isCheckboxChecked);
    }

    function getFilterCategoryElement(category) {
        return htmlToElement(`
                <li id="category${category.groupId}" class="active">
                    <a href="#antibanner${category.groupId}" class="block-type">
                        <div class="block-type__ico block-type__ico--${category.groupId}"></div>
                        <div class="block-type__desc">
                            <div class="block-type__desc-title">${category.groupName}</div>
                            <div class="desc desc--filters"></div>
                        </div>
                    </a>
                    <div class="opt-state">
                        <div class="preloader"></div>
                        <div class="toggler-wr">
                            <input type="checkbox" name="groupId" value="${category.groupId}">
                        </div>
                    </div>
                </li>`);
    }

    function getFilterTemplate(filter, enabled, showDeleteButton) {
        var timeUpdated = moment(filter.timeUpdated);
        timeUpdated.locale(environmentOptions.Prefs.locale);
        var timeUpdatedText = timeUpdated.format('D/MM/YYYY HH:mm').toLowerCase();

        var tagDetails = '';
        filter.tagsDetails.forEach(function (tag) {
            tagDetails += `<div class="opt-name__tag" data-tooltip="${tag.description}">#${tag.keyword}</div>`;
        });

        var deleteButton = '';
        if (showDeleteButton) {
            deleteButton = `<a href="#" filterid="${filter.filterId}" class="remove-custom-filter-button" i18n="remove_custom_filter">delete filter</a>`;
        }

        return `
            <li id="filter${filter.filterId}">
                <div class="opt-name">
                    <div class="title-wr">
                        <div class="title">
                            ${filter.name || filter.subscriptionUrl}
                            ${deleteButton}
                        </div>
                    </div>
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
                    <a class="icon-home" target="_blank" href="${filter.homepage || filter.subscriptionUrl}"></a>
                    <div class="toggler-wr">
                        <input type="checkbox" name="filterId" value="${filter.filterId}" ${enabled ? 'checked="checked"' : ''}>
                    </div>
                </div>
            </li>`;
    }

    function getPageTitleTemplate(name) {
        return `
            <div class="page-title">
                <a href="#antibanner">
                    <img src="images/arrow-left.svg" class="back">
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
        var filters = category.filters;
        var isCustomFilters = category.groupId === 0;

        if (isCustomFilters &&
            filters.length === 0) {
            return htmlToElement(getEmptyCustomFiltersTemplate(category));
        }

        const renderOptions = () => {
            if (isCustomFilters) {
                return `<div class="settings-actions">
                            <a href="#" class="add-custom-filter-button button button--green button--link" i18n="options_add_custom_filter">Add custom filter</a>
                        </div>`;
            }
            return '';
        };

        var pageTitleEl = getPageTitleTemplate(category.groupName);

        var filtersList = '';

        for (var i = 0; i < filters.length; i += 1) {
            filtersList += getFilterTemplate(filters[i], loadedFiltersInfo.isEnabled(filters[i].filterId), isCustomFilters);
        }

        return htmlToElement(`
            <div id="antibanner${category.groupId}" class="settings-content tab-pane filters-list ${isCustomFilters ? 'filters-list--custom' : ''}">
                ${pageTitleEl}
                <div class="settings-body">
                    <div class="filters-search">
                        <input type="text" placeholder="${i18n.getMessage('options_filters_list_search_placeholder')}" name="searchFiltersList"/>
                        <div class="icon-search">
                            <img src="images/magnifying-green.svg" alt="">
                        </div>
                    </div>
                    <ul class="opts-list">
                        ${filtersList}
                    </ul>
                </div>
                ${renderOptions()}
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

        document.querySelectorAll('.add-custom-filter-button').forEach((el) => {
            el.addEventListener('click', addCustomFilter);
        });

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
                    filters.forEach(filter => {
                        filter.style.display = 'flex';
                    });
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
            contentPage.sendMessage({ type: 'addAndEnableFilter', filterId: filterId });
        } else {
            contentPage.sendMessage({ type: 'disableAntiBannerFilter', filterId: filterId });
        }
    }

    function toggleGroupState() {
        var groupId = this.value - 0;
        if (this.checked) {
            contentPage.sendMessage({ type: 'enableFiltersGroup', groupId: groupId });
        } else {
            contentPage.sendMessage({ type: 'disableFiltersGroup', groupId: groupId });
        }
    }

    function updateAntiBannerFilters(e) {
        e.preventDefault();
        contentPage.sendMessage({ type: 'checkAntiBannerFiltersUpdate' }, function () {
            // Empty
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
            filterId: filterId,
        });

        var filterElement = getFilterElement(filterId);
        filterElement.parentNode.removeChild(filterElement);
    }

    let customFilterInitialized = false;
    let onSubscribeClicked;
    let onSubscriptionCancel;
    let onPopupCloseClicked;
    let onSubscribeBackClicked;
    function renderCustomFilterPopup(abpOptions = {}) {
        const { isAbpSubscription, title, url } = abpOptions;
        const POPUP_ACTIVE_CLASS = 'option-popup__step--active';

        function closePopup() {
            document.querySelector('#add-custom-filter-popup').classList.remove('option-popup--active');
        }

        function clearActiveStep() {
            document.querySelector('#add-custom-filter-step-1').classList.remove(POPUP_ACTIVE_CLASS);
            document.querySelector('#add-custom-filter-step-2').classList.remove(POPUP_ACTIVE_CLASS);
            document.querySelector('#add-custom-filter-step-3').classList.remove(POPUP_ACTIVE_CLASS);
            document.querySelector('#add-custom-filter-step-4').classList.remove(POPUP_ACTIVE_CLASS);
            document.querySelector('#custom-filter-popup-close').style.display = 'block';
        }

        function fillLoadedFilterDetails(filter) {
            document.querySelector('#custom-filter-popup-added-title').textContent = filter.name;
            document.querySelector('#custom-filter-popup-added-desc').textContent = filter.description;
            document.querySelector('#custom-filter-popup-added-version').textContent = filter.version;
            document.querySelector('#custom-filter-popup-added-rules-count').textContent = filter.rulesCount;
            document.querySelector('#custom-filter-popup-added-homepage').textContent = filter.homepage;
            document.querySelector('#custom-filter-popup-added-homepage').setAttribute('href', filter.homepage);
            document.querySelector('#custom-filter-popup-added-url').textContent = filter.customUrl;
            document.querySelector('#custom-filter-popup-added-url').setAttribute('href', filter.customUrl);
        }

        function addAndEnableFilter(filterId) {
            contentPage.sendMessage({
                type: 'addAndEnableFilter',
                filterId,
            });
            closePopup();
        }

        function removeAntiBannerFilter(filterId) {
            contentPage.sendMessage({
                type: 'removeAntiBannerFilter',
                filterId,
            });
        }

        function renderStepOne() {
            clearActiveStep();
            document.querySelector('#add-custom-filter-step-1').classList.add(POPUP_ACTIVE_CLASS);

            document.querySelector('#custom-filter-popup-url').focus();

            if (onPopupCloseClicked) {
                document.querySelector('#custom-filter-popup-close').removeEventListener('click', onPopupCloseClicked);
            }

            onPopupCloseClicked = () => closePopup();
            document.querySelector('#custom-filter-popup-close').addEventListener('click', onPopupCloseClicked);
            document.querySelector('#custom-filter-popup-cancel').addEventListener('click', onPopupCloseClicked);
        }

        function renderStepTwo() {
            clearActiveStep();
            document.querySelector('#add-custom-filter-step-2').classList.add(POPUP_ACTIVE_CLASS);
            document.querySelector('#custom-filter-popup-close').style.display = 'none';
        }

        function renderStepThree() {
            clearActiveStep();
            document.querySelector('#add-custom-filter-step-3').classList.add(POPUP_ACTIVE_CLASS);
        }

        function renderStepFour(filter, isAbpSubscription) {
            clearActiveStep();
            document.querySelector('#add-custom-filter-step-4').classList.add(POPUP_ACTIVE_CLASS);

            fillLoadedFilterDetails(filter);

            if (onSubscribeClicked) {
                document.querySelector('#custom-filter-popup-added-subscribe').removeEventListener('click', onSubscribeClicked);
            }

            onSubscribeClicked = () => addAndEnableFilter(filter.filterId);
            document.querySelector('#custom-filter-popup-added-subscribe').addEventListener('click', onSubscribeClicked);

            if (onSubscriptionCancel) {
                document.querySelector('#custom-filter-popup-remove').removeEventListener('click', onSubscriptionCancel);
            }

            onSubscriptionCancel = () => {
                removeAntiBannerFilter(filter.filterId);
                closePopup();
            };

            document.querySelector('#custom-filter-popup-remove').addEventListener('click', onSubscriptionCancel);

            const backButton = document.querySelector('#custom-filter-popup-added-back');

            if (isAbpSubscription) {
                backButton.style.display = 'none';
            } else {
                backButton.style.display = '';
                if (onSubscribeBackClicked) {
                    backButton.removeEventListener('click', onSubscribeBackClicked);
                }
                onSubscribeBackClicked = () => {
                    removeAntiBannerFilter(filter.filterId);
                    renderStepOne();
                };
                backButton.addEventListener('click', onSubscribeBackClicked);
            }


            if (onPopupCloseClicked) {
                document.querySelector('#custom-filter-popup-close').removeEventListener('click', onPopupCloseClicked);
            }
            onPopupCloseClicked = () => {
                removeAntiBannerFilter(filter.filterId);
                closePopup();
            };
            document.querySelector('#custom-filter-popup-close').addEventListener('click', onPopupCloseClicked);
        }

        function bindEvents() {
            // step one events
            document.querySelector('.custom-filter-popup-next').addEventListener('click', function (e) {
                e.preventDefault();

                const url = document.querySelector('#custom-filter-popup-url').value;

                contentPage.sendMessage({ type: 'loadCustomFilterInfo', url: url }, function (filter) {
                    if (filter) {
                        renderStepFour(filter);
                    } else {
                        renderStepThree();
                    }
                });

                renderStepTwo();
            });

            // render step 3 events
            document.querySelector('.custom-filter-popup-try-again').addEventListener('click', renderStepOne);
        }

        if (!customFilterInitialized) {
            bindEvents();
            customFilterInitialized = true;
        }

        document.querySelector('#add-custom-filter-popup').classList.add('option-popup--active');

        if (isAbpSubscription) {
            contentPage.sendMessage({ type: 'loadCustomFilterInfo', url, title }, function (filter) {
                if (filter) {
                    renderStepFour(filter, isAbpSubscription);
                } else {
                    renderStepThree();
                }
            });
            renderStepTwo();
        } else {
            renderStepOne();
        }
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
        var message = i18n.getMessage('options_antibanner_info', [String(info.rulesCount || 0)]);
        document.querySelector('#filtersRulesInfo').textContent = message;
    }

    function onFilterStateChanged(filter) {
        var filterId = filter.filterId;
        var enabled = filter.enabled;
        loadedFiltersInfo.updateEnabled(filter, enabled);
        updateCategoryFiltersInfo(filter.groupId);
        CheckboxUtils.updateCheckbox([getFilterCheckbox(filterId)], enabled);
    }

    function onCategoryStateChanged(category) {
        loadedFiltersInfo.updateCategoryEnabled(category, category.enabled);
        updateCategoryFiltersInfo(category.groupId);
    }

    function onFilterDownloadStarted(filter) {
        getCategoryElement(filter.groupId).querySelector('.preloader').classList.add('active');
        const filterElement = getFilterElement(filter.filterId);
        if (filterElement) {
            filterElement.querySelector('.preloader').classList.add('active');
        }
        document.querySelector('.settings-actions--update-filters a').classList.add('active');
    }

    function onFilterDownloadFinished(filter) {
        getCategoryElement(filter.groupId).querySelector('.preloader').classList.remove('active');
        const filterElement = getFilterElement(filter.filterId);
        if (filterElement) {
            filterElement.querySelector('.preloader').classList.remove('active');
        }
        document.querySelector('.settings-actions--update-filters a').classList.remove('active');
        setLastUpdatedTimeText(filter.lastUpdateTime);
    }

    return {
        render: renderCategoriesAndFilters,
        updateRulesCountInfo: updateRulesCountInfo,
        onFilterStateChanged: onFilterStateChanged,
        onCategoryStateChanged: onCategoryStateChanged,
        onFilterDownloadStarted: onFilterDownloadStarted,
        onFilterDownloadFinished: onFilterDownloadFinished,
        renderCustomFilterPopup: renderCustomFilterPopup,
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
        negate: true,
    }));
    checkboxes.push(new Checkbox('#showAppUpdatedNotification', userSettings.names.DISABLE_SHOW_APP_UPDATED_NOTIFICATION, {
        negate: true
    }));
    checkboxes.push(new Checkbox('#integrationModeCheckbox', userSettings.names.DISABLE_INTEGRATION_MODE, {negate: true}));

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

    function setFiltersUpdatePeriod(updatePeriodString) {
        contentPage.sendMessage({
            type: 'setFiltersUpdatePeriod',
            updatePeriod: parseInt(updatePeriodString, 10),
        }, function () {
            // TODO Have I do something on successful set filters update interval?
        });
    }

    const filtersUpdatePeriodSelect = document.querySelector('#filtersUpdatePeriodSelect');
    if (filtersUpdatePeriodSelect) {
        filtersUpdatePeriodSelect.addEventListener('change', function (e) {
            setFiltersUpdatePeriod(e.currentTarget.value);
            if (filtersUpdatePeriodSelect.value === '0') {
                filtersUpdatePeriodSelect.parentNode.classList.remove('active');
            } else {
                filtersUpdatePeriodSelect.parentNode.classList.add('active');
            }
        });
    }

    const selectOptions = [
        { name: i18n.getMessage('options_select_update_period_default'), value: Utils.hoursToMs(48) },
        { name: i18n.getMessage('options_select_update_period_24h'), value: Utils.hoursToMs(24) },
        { name: i18n.getMessage('options_select_update_period_12h'), value: Utils.hoursToMs(12) },
        { name: i18n.getMessage('options_select_update_period_6h'), value: Utils.hoursToMs(6) },
        { name: i18n.getMessage('options_select_update_period_1h'), value: Utils.hoursToMs(1) },
        { name: i18n.getMessage('options_select_update_period_disabled'), value: 0 },
    ];

    function renderSelectOptions(updatePeriod) {
        const filtersUpdatePeriodSelect = document.querySelector('#filtersUpdatePeriodSelect');

        if (!filtersUpdatePeriodSelect) {
            return;
        }

        if (updatePeriod === 0) {
            filtersUpdatePeriodSelect.parentNode.classList.remove('active')
        } else {
            filtersUpdatePeriodSelect.parentNode.classList.add('active');
        }

        const optionsSelectHtml = selectOptions.map(selectOption => {
            const { name, value } = selectOption;
            return `<option value="${value}">${name}</option>`;
        }).join('\n');

        filtersUpdatePeriodSelect.insertAdjacentHTML('afterbegin', optionsSelectHtml);
        filtersUpdatePeriodSelect.value = updatePeriod;
    }

    var render = function () {
        for (var i = 0; i < checkboxes.length; i++) {
            checkboxes[i].render();
        }

        CheckboxUtils.updateCheckbox([allowAcceptableAdsCheckbox], AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID in enabledFilters);

        const updatePeriod = userSettings.values[userSettings.names.FILTERS_UPDATE_PERIOD];
        renderSelectOptions(updatePeriod);
    };

    var showPopup = function (title, text) {
        contentPage.sendMessage({
            type: 'showAlertMessagePopup',
            title: title,
            text: text,
        });
    };

    return {
        render: render,
        showPopup: showPopup,
    };
};

var PageController = function () {
};

PageController.prototype = {

    SUBSCRIPTIONS_LIMIT: 9,

    init: function () {

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
            this.settings.showPopup(i18n.getMessage('options_popup_import_success_title'));

            var self = this;
            contentPage.sendMessage({ type: 'initializeFrameScript' }, function (response) {
                userSettings = response.userSettings;
                enabledFilters = response.enabledFilters;
                requestFilterInfo = response.requestFilterInfo;

                self._render();
            });
        } else {
            this.settings.showPopup(i18n.getMessage('options_popup_import_error_title'), i18n.getMessage('options_popup_import_error_description'));
        }
    },

    _bindEvents: function () {
        this.resetStatsPopup = document.querySelector('#resetStatsPopup');
        // TODO remove if not necessary
        this.tooManySubscriptionsEl = document.querySelector('#tooManySubscriptions');

        document.querySelector('#resetStats').addEventListener('click', this.onResetStatsClicked.bind(this));

        document.querySelector('.openExtensionStore').addEventListener('click', function (e) {
            e.preventDefault();
            contentPage.sendMessage({ type: 'openExtensionStore' });
        });

        document.querySelector('#openLog').addEventListener('click', function (e) {
            e.preventDefault();
            contentPage.sendMessage({ type: 'openFilteringLog' });
        });

        const importSettingsBtn = document.querySelector('#importSettingsFile');

        if (importSettingsBtn) {
            importSettingsBtn.addEventListener('click', this.importSettingsFile.bind(this));
        }
    },

    _render: function () {
        const defaultWhitelistMode = userSettings.values[userSettings.names.DEFAULT_WHITE_LIST_MODE];

        if (environmentOptions.Prefs.mobile) {
            document.querySelector('#resetStats').style.display = 'none';
        }

        this.checkSubscriptionsCount();

        this.settings = new Settings();
        this.settings.render();

        // Initialize whitelist filter
        this.whiteListFilter = new WhiteListFilter({ defaultWhiteListMode: defaultWhitelistMode });
        this.whiteListFilter.updateWhiteListDomains();

        // Initialize User filter
        this.userFilter = new UserFilter();
        this.userFilter.updateUserFilterRules();

        // Initialize AntiBanner filters
        this.antiBannerFilters = new AntiBannerFilters({ rulesInfo: requestFilterInfo });
        this.antiBannerFilters.render();

        // Initialize sync tab
        this.syncSettings = new SyncSettings({ syncStatusInfo: syncStatusInfo });
        this.syncSettings.renderSyncSettings();

        const versionPlaceholder = document.querySelector('#about-version-placeholder');
        if (versionPlaceholder) {
            versionPlaceholder.textContent = `${i18n.getMessage('options_about_version')} ${environmentOptions.appVersion}`;
        }

        updateDisplayAdguardPromo(!userSettings.values[userSettings.names.DISABLE_SHOW_ADGUARD_PROMO_INFO]);
    },

    allowAcceptableAdsChange: function () {
        if (this.checked) {
            contentPage.sendMessage({
                type: 'addAndEnableFilter',
                filterId: AntiBannerFiltersId.SEARCH_AND_SELF_PROMO_FILTER_ID,
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

    importSettingsFile: function () {
        const input = document.createElement('input');
        input.type = 'file';
        input.click();

        const onFileLoaded = function (content) {
            contentPage.sendMessage({ type: 'applySettingsJson', json: content });
        };

        input.addEventListener('change', function (e) {
            const file = e.currentTarget.files[0];
            if (file) {
                const reader = new FileReader();
                reader.readAsText(file, 'UTF-8');
                reader.onload = function (evt) {
                    onFileLoaded(evt.target.result);
                };
                reader.onerror = function () {
                    showPopup(i18n.getMessage('options_popup_import_error_file_title'), i18n.getMessage('options_popup_import_error_file_description'));
                };
            }
        });
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
    },
    addAbpSubscription: function (options) {
        const { url, title } = options;
        this.antiBannerFilters.renderCustomFilterPopup({ isAbpSubscription: true, url, title });
    },
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

    var onDocumentReady = function () {
        var controller = new PageController();
        controller.init();

        var events = [
            EventNotifierTypes.FILTER_ENABLE_DISABLE,
            EventNotifierTypes.FILTER_GROUP_ENABLE_DISABLE,
            EventNotifierTypes.FILTER_ADD_REMOVE,
            EventNotifierTypes.START_DOWNLOAD_FILTER,
            EventNotifierTypes.SUCCESS_DOWNLOAD_FILTER,
            EventNotifierTypes.ERROR_DOWNLOAD_FILTER,
            EventNotifierTypes.UPDATE_USER_FILTER_RULES,
            EventNotifierTypes.UPDATE_WHITELIST_FILTER_RULES,
            EventNotifierTypes.REQUEST_FILTER_UPDATED,
            EventNotifierTypes.SYNC_STATUS_UPDATED,
            EventNotifierTypes.SETTINGS_UPDATED,
            EventNotifierTypes.ADD_ABP_SUBSCRIPTION,
        ];

        createEventListener(events, function (event, options) {
            switch (event) {
                case EventNotifierTypes.FILTER_ENABLE_DISABLE:
                    controller.checkSubscriptionsCount();
                    controller.antiBannerFilters.onFilterStateChanged(options);
                    break;
                case EventNotifierTypes.FILTER_GROUP_ENABLE_DISABLE:
                    controller.antiBannerFilters.onCategoryStateChanged(options);
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
                    controller.antiBannerFilters.updateRulesCountInfo(options);
                    break;
                case EventNotifierTypes.UPDATE_WHITELIST_FILTER_RULES:
                    controller.whiteListFilter.updateWhiteListDomains();
                    break;
                case EventNotifierTypes.REQUEST_FILTER_UPDATED:
                    controller.antiBannerFilters.updateRulesCountInfo(options);
                    controller.userFilter.updateUserFilterRules();
                    break;
                case EventNotifierTypes.SYNC_STATUS_UPDATED:
                    controller.syncSettings.updateSyncSettings(options);
                    break;
                case EventNotifierTypes.SETTINGS_UPDATED:
                    controller.onSettingsImported(options);
                    break;
                case EventNotifierTypes.ADD_ABP_SUBSCRIPTION:
                    controller.addAbpSubscription(options);
                    break;
                default:
                    break;
            }
        });
    };

    if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading') {
        onDocumentReady();
    } else {
        document.addEventListener('DOMContentLoaded', onDocumentReady);
    }
};

contentPage.sendMessage({ type: 'initializeFrameScript' }, initPage);
