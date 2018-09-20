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

/* global i18n, popupPage */

/**
 * Controller that manages add-on popup window
 */
var PopupController = function () {
};

PopupController.prototype = {

    /**
     * Renders popup using specified model object
     * @param tabInfo
     * @param options
     */
    render: function (tabInfo, options) {
        this.tabInfo = tabInfo;
        this.options = options || {};

        // render
        this._renderPopup(tabInfo);

        // Bind actions
        this._bindActions();

        this.afterRender();
    },

    resizePopupWindow: function () {
        var widget = document.querySelector('.widget-popup');
        var width = widget.offsetWidth;
        var height = widget.offsetHeight;
        popupPage.resizePopup(width, height);
    },

    afterRender: function () {
        // Should be overwritten
    },

    addWhiteListDomain: function (url) {
        popupPage.sendMessage({ type: 'addWhiteListDomainPopup', url: url });
    },

    removeWhiteListDomain: function (url) {
        popupPage.sendMessage({ type: 'removeWhiteListDomainPopup', url: url });
    },

    changeApplicationFilteringDisabled: function (disabled) {
        popupPage.sendMessage({ type: 'changeApplicationFilteringDisabled', disabled: disabled });
    },

    sendFeedback: function (url, topic, comment) {
        popupPage.sendMessage({ type: 'sendFeedback', url: url, topic: topic, comment: comment });
    },

    openSiteReportTab: function (url) {
        popupPage.sendMessage({ type: 'openSiteReportTab', url: url });
    },

    openAbuseTab: function (url) {
        popupPage.sendMessage({ type: 'openAbuseTab', url: url });
    },

    openSettingsTab: function () {
        popupPage.sendMessage({ type: 'openSettingsTab' });
    },

    openAssistantInTab: function () {
        popupPage.sendMessage({ type: 'openAssistant' });
    },

    openFilteringLog: function (tabId) {
        popupPage.sendMessage({ type: 'openFilteringLog', tabId: tabId });
    },

    resetBlockedAdsCount: function () {
        popupPage.sendMessage({ type: 'resetBlockedAdsCount' });
    },

    openLink: function (url) {
        popupPage.sendMessage({ type: 'openTab', url: url });
    },

    updateTotalBlocked: function (tabInfo) {
        this.tabInfo = tabInfo;
        const { totalBlockedTab, totalBlocked } = tabInfo;
        if (totalBlockedTab) {
            const tabBlocked = document.querySelector('.widget-popup .blocked-tab');
            if (tabBlocked) {
                i18n.translateElement(tabBlocked, 'popup_tab_blocked', [this._formatNumber(totalBlockedTab)]);
            }
        }

        if (totalBlocked) {
            const allBlocked = document.querySelector('.widget-popup .blocked-all');
            if (allBlocked) {
                i18n.translateElement(allBlocked, 'popup_tab_blocked_all', [this._formatNumber(totalBlocked)]);
            }
        }
    },

    _renderPopup: function (tabInfo) {
        var parent = document.querySelector('.widget-popup');

        var containerHeader = document.querySelector('.widget-popup__header');
        while (containerHeader.firstChild) {
            containerHeader.removeChild(containerHeader.firstChild);
        }

        var footer = parent.querySelector('.footer');
        if (footer) {
            footer.parentNode.removeChild(footer);
        }

        var stack = parent.querySelector('.tabstack');

        var containerMain = parent.querySelector('.tab-main');
        while (containerMain.firstChild) {
            containerMain.removeChild(containerMain.firstChild);
        }

        var containerBottom = parent.querySelector('.tabstack-bottom.tab-main');
        while (containerBottom.firstChild) {
            containerBottom.removeChild(containerBottom.firstChild);
        }

        var containerStats = parent.querySelector('.tab-statistics');
        while (containerStats.firstChild) {
            containerStats.removeChild(containerStats.firstChild);
        }

        stack.setAttribute('class', 'tabstack');
        parent.setAttribute('class', 'widget-popup');

        // Hide stats for integration mode
        if (tabInfo.adguardDetected) {
            parent.querySelector('.tab-stats-button').style.display = 'none';
            parent.querySelector('.tab-actions-button').classList.add('tab--integration');
        }

        // define class
        if (tabInfo.urlFilteringDisabled) {
            stack.classList.add('status-error');
            stack.classList.add('error-sad');
        } else if (tabInfo.applicationFilteringDisabled) {
            stack.classList.add('status-paused');
            parent.classList.add('status-paused');
        } else if (!tabInfo.canAddRemoveRule) {
            stack.classList.add('status-error error-filter');
        } else if (tabInfo.documentWhiteListed) {
            stack.classList.add('status-cross');
            parent.classList.add('status-cross');
        } else {
            stack.classList.add('status-checkmark');
            parent.classList.add('status-checkmark');
        }

        // Header
        this.filteringHeader = this._getTemplate('filtering-header-template');
        this.filteringIntegrationHeader = this._getTemplate('filtering-integration-header-template');
        this.filteringDefaultHeader = this._getTemplate('filtering-default-header-template');

        // Controls
        this.filteringControlDefault = this._getTemplate('filtering-default-control-template');

        // Actions
        this.actionOpenAssistant = this._getTemplate('action-open-assistant-template');
        this.actionOpenAbuse = this._getTemplate('action-open-abuse-template');
        this.actionOpenSiteReport = this._getTemplate('action-site-report-template');
        this.actionOpenFilteringLog = this._getTemplate('action-open-filtering-log-template');

        // Status Text
        this.filteringStatusText = this._getTemplate('filtering-status-template');

        // Message text
        this.filteringMessageText = this._getTemplate('filtering-message-template');

        // Stats
        this.filteringStatisticsTemplate = this._getTemplate('filtering-statistics-template');

        // Footer
        this.footerDefault = this._getTemplate('footer-default-template');
        this.footerIntegration = this._getTemplate('footer-integration-template');

        this._renderHeader(containerHeader, tabInfo);
        this._renderMain(containerMain, tabInfo);
        this._renderFilteringControls(containerMain, tabInfo);
        this._renderStatus(containerMain, tabInfo);
        this._renderActions(containerBottom, tabInfo);
        this._renderMessage(containerMain, tabInfo);
        this._renderStats(containerStats);
        this._renderFooter(parent, tabInfo);
    },

    _getTemplate: function (id) {
        return document.querySelector('#' + id).cloneNode(true);
    },

    _appendTemplate: function (container, template) {
        template.childNodes.forEach(function (c) {
            container.appendChild(c.cloneNode(true));
        });
    },

    _renderHeader: function (container, tabInfo) {
        var template = this.filteringHeader;
        if (tabInfo.adguardDetected) {
            const pauseButton = template.querySelector('.pause.changeProtectionStateDisable');
            if (pauseButton) {
                pauseButton.style.display = 'none';
            }
            const startButton = template.querySelector('.start.changeProtectionStateEnable');
            if (startButton) {
                startButton.style.display = 'none';
            }
        }
        this._appendTemplate(container, template);
    },

    _renderMain: function (container, tabInfo) {

        var template;
        if (tabInfo.adguardDetected) {
            template = this.filteringIntegrationHeader;
            const headTitleElement = template.querySelector('.head .msg');
            if (tabInfo.adguardProductName.toLowerCase().includes('mac')) {
                headTitleElement.textContent = i18n.getMessage('popup_integrate_mode_title_mac');
            } else if (tabInfo.adguardProductName.toLowerCase().includes('win')) {
                headTitleElement.textContent = i18n.getMessage('popup_integrate_mode_title_win');
            } else {
                headTitleElement.textContent = i18n.getMessage('popup_integrate_mode_title');
            }
        } else {
            template = this.filteringDefaultHeader;
            var tabBlocked = template.querySelector('.blocked-tab');
            var totalBlocked = template.querySelector('.blocked-all');
            i18n.translateElement(tabBlocked, 'popup_tab_blocked', [this._formatNumber(tabInfo.totalBlockedTab || 0)]);
            i18n.translateElement(totalBlocked, 'popup_tab_blocked_all', [this._formatNumber(tabInfo.totalBlocked || 0)]);
            var closestWidgetFilter = tabBlocked.closest('.widget-popup-filter');
            if (closestWidgetFilter) {
                if (tabInfo.totalBlocked >= 10000000) {
                    closestWidgetFilter.classList.add('db');
                } else {
                    closestWidgetFilter.classList.remove('db');
                }
            }
        }

        this._appendTemplate(container, template);
    },

    _renderFilteringControls: function (container, tabInfo) {
        var template = this.filteringControlDefault;
        if (tabInfo.urlFilteringDisabled) {
            return;
        }
        this._appendTemplate(container, template);
    },

    _renderStatus: function (container, tabInfo) {
        var template = this.filteringStatusText;

        var text = '';
        if (tabInfo.urlFilteringDisabled) {
            text = 'popup_site_filtering_state_tab_unavailable';
        } else if (tabInfo.applicationFilteringDisabled) {
            text = 'popup_site_filtering_state_paused';
        } else {
            if (tabInfo.documentWhiteListed && !tabInfo.userWhiteListed) {
                text = 'popup_site_filtering_state_subscription_unavailable';
            } else {
                if (tabInfo.documentWhiteListed) {
                    text = 'popup_site_filtering_state_disabled';
                } else {
                    text = 'popup_site_filtering_state_enabled';
                }
            }
        }

        var statusElement = template.querySelector('.status');
        i18n.translateElement(statusElement, text);

        var currentSiteElement = template.querySelector('.current-site');
        currentSiteElement.textContent = tabInfo.domainName ? tabInfo.domainName : tabInfo.url;

        if (tabInfo.urlFilteringDisabled) {
            currentSiteElement.style.display = 'none';
        }

        this._appendTemplate(container, template);
    },

    _renderMessage: function (container, tabInfo) {
        var text;
        if (tabInfo.urlFilteringDisabled) {
            text = 'popup_site_filtering_disabled';
        } else if (tabInfo.applicationFilteringDisabled) {

        } else {
            if (tabInfo.documentWhiteListed && !tabInfo.userWhiteListed) {
                text = 'popup_site_exception_info';
            }
        }

        var template = this.filteringMessageText;
        if (text) {
            i18n.translateElement(template.childNodes[1], text);
            this._appendTemplate(container, template);
        }
    },

    _selectRequestTypesStatsData: function (stats, range) {
        var result = {};

        switch (range) {
            case 'day':
                result = stats.lastMonth[stats.lastMonth.length - 1];
                break;
            case 'week':
                for (var i = 0; i < stats.lastWeek.length; i++) {
                    var d = stats.lastWeek[i];
                    for (var type in d) {
                        if (d[type]) {
                            result[type] = (result[type] ? result[type] : 0) + d[type];
                        }
                    }
                }
                break;
            case 'month':
                result = stats.lastYear[stats.lastYear.length - 1];
                break;
            case 'year':
                for (var i = 0; i < stats.lastYear.length; i++) {
                    var d = stats.lastYear[i];
                    for (var type in d) {
                        if (d[type]) {
                            result[type] = (result[type] ? result[type] : 0) + d[type];
                        }
                    }
                }
                break;
        }

        return result;
    },

    _selectRequestsStatsData: function (stats, range, type) {
        var result = [];
        const typeSelector = stats.blockedTypes[type] ? stats.blockedTypes[type] : 'total';
        switch (range) {
            case 'day':
                stats.today.forEach(function (d) {
                    result.push(d[typeSelector]);
                });
                break;
            case 'week':
                stats.lastWeek.forEach(function (d) {
                    result.push(d[typeSelector]);
                });
                break;
            case 'month':
                stats.lastMonth.forEach(function (d) {
                    result.push(d[typeSelector]);
                });
                break;
            case 'year':
                stats.lastYear.forEach(function (d) {
                    result.push(d[typeSelector]);
                });
                break;
            default:
                break;
        }
        return result.map(val => val === undefined ? 0 : val);
    },

    DAYS_OF_WEEK: (function () {
        return this.DAYS_OF_WEEK || [
            i18n.getMessage("popup_statistics_week_days_mon"),
            i18n.getMessage("popup_statistics_week_days_tue"),
            i18n.getMessage("popup_statistics_week_days_wed"),
            i18n.getMessage("popup_statistics_week_days_thu"),
            i18n.getMessage("popup_statistics_week_days_fri"),
            i18n.getMessage("popup_statistics_week_days_sat"),
            i18n.getMessage("popup_statistics_week_days_sun")
        ];
    })(),

    _dayOfWeekAsString: function (dayIndex) {
        return this.DAYS_OF_WEEK[dayIndex];
    },

    MONTHS_OF_YEAR: (function () {
        return this.MONTHS_OF_YEAR || [
                i18n.getMessage("popup_statistics_months_jan"),
                i18n.getMessage("popup_statistics_months_feb"),
                i18n.getMessage("popup_statistics_months_mar"),
                i18n.getMessage("popup_statistics_months_apr"),
                i18n.getMessage("popup_statistics_months_may"),
                i18n.getMessage("popup_statistics_months_jun"),
                i18n.getMessage("popup_statistics_months_jul"),
                i18n.getMessage("popup_statistics_months_aug"),
                i18n.getMessage("popup_statistics_months_sep"),
                i18n.getMessage("popup_statistics_months_oct"),
                i18n.getMessage("popup_statistics_months_nov"),
                i18n.getMessage("popup_statistics_months_dec")
            ];
    })(),

    _monthsAsString: function (monthIndex) {
        return this.MONTHS_OF_YEAR[monthIndex];
    },

    _getCategoriesLines: function (statsData, range) {
        var now = new Date();
        var day = now.getDay();
        var month = now.getMonth();
        var lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();

        var categories = [];
        var lines = [];
        switch (range) {
            case 'day':
                for (let i = 1; i < 25; i += 1) {
                    if (i % 3 === 0) {
                        const hour = (i + now.getHours()) % 24;
                        categories.push(hour.toString());
                        lines.push({
                            value: i - 1,
                        });
                    } else {
                        categories.push('');
                    }
                }

                break;
            case 'week':
                for (let i = 0; i < 7; i += 1) {
                    categories.push(this._dayOfWeekAsString((day + i) % 7));
                    lines.push({
                        value: i,
                    });
                }

                break;
            case 'month':
                for (let i = 0; i < 31; i += 1) {
                    if (i % 3 === 0) {
                        var c = (i + now.getDate()) % lastDayOfPrevMonth + 1;
                        categories.push(c.toString());
                        lines.push({
                            value: i,
                        });
                    } else {
                        categories.push('');
                    }
                }

                break;
            case 'year':
                for (let i = 0; i < 13; i += 1) {
                    categories.push(this._monthsAsString((month + i) % 12));
                    categories = categories.slice(-statsData.length);
                    lines.push({
                        value: i,
                    });
                }

                break;
        }

        return {
            categories: categories,
            lines: lines,
        };
    },

    _renderRequestsGraphs: function (stats, range, type) {
        var statsData = this._selectRequestsStatsData(stats, range, type);
        var categoriesLines = this._getCategoriesLines(statsData, range);
        var categories = categoriesLines.categories;
        var lines = categoriesLines.lines;

        var grad1 =
            '<linearGradient id="grad1" x1="50%" y1="0%" x2="50%" y2="100%">'+
            '  <stop offset="0%" style="stop-color:#73BE66;stop-opacity:1" />'+
            '  <stop offset="23%" style="stop-color:#6DBE85;stop-opacity:1" />'+
            '  <stop offset="100%" style="stop-color:#65BDA8;stop-opacity:1" />'+
            '</linearGradient>';

        c3.generate({
            size: {
                height: 230,
            },
            data: {
                columns: [
                    ['data1'].concat(statsData),
                ],
                types: {
                    data1: 'area-spline',
                },
                colors: {
                    data1: 'url(#grad1)',
                },
            },
            padding: {
                left: 15,
                right: 15,
            },
            axis: {
                x: {
                    show: true,
                    type: 'category',
                    categories: categories,
                    tick: {
                        outer: false,
                        multiline: false,
                    },
                },
                y: {
                    show: false,
                },
            },
            legend: {
                show: false,
            },
            grid: {
                x: {
                    lines: lines,
                },
                focus: {
                    show: true,
                },
            },
            spline: {
                interpolation: {
                    type: 'basis',
                },
            },
            point: {
                show: false,
            },
            tooltip: {
                position: function (data, width, height, element) {
                    const chart = document.querySelector('#chart');
                    const elementRect = element.getBoundingClientRect();
                    const elementCenterPosition = elementRect.left + (elementRect.width / 2);
                    const tooltipHalfWidth = chart.querySelector('.chart__tooltip').clientWidth / 2;
                    const tooltipLeft = elementCenterPosition - tooltipHalfWidth;
                    const top = d3.mouse(element)[1] - 50;
                    return {
                        top: top,
                        left: tooltipLeft,
                    };
                },
                contents: function (d) {
                    const value = d[0].value;
                    return `<div id="tooltip" class="chart__tooltip">${value}</div>`;
                },
            },
            oninit: function () {
                this.svg[0][0].getElementsByTagName('defs')[0].innerHTML += grad1;
            },
        });
    },

    _localizeBlockedType: function (type) {
        if (!type) {
            return '';
        }

        return i18n.getMessage('popup_statistics_request_types_' + type.toLowerCase());
    },

    _buildRequestTypesColumns: function (stats, range) {
        var statsData = this._selectRequestTypesStatsData(stats, range);

        var columns = {
            x: ['x'],
            values: [i18n.getMessage("popup_statistics_type_request_types")]
        };

        for (var type in stats.blockedTypes) {
            var number = statsData[stats.blockedTypes[type]] ? statsData[stats.blockedTypes[type]] : 0;

            columns.x.push(this._localizeBlockedType(type));
            columns.values.push(number);
        }

        return columns;
    },

    _renderAnalyticsBlock: function (stats, range) {
        var statsData = this._selectRequestTypesStatsData(stats, range);

        var analytics = document.querySelector('#analytics-blocked-types-values');
        while(analytics.firstChild) {
            analytics.removeChild(analytics.firstChild);
        }

        for (var type in stats.blockedTypes) {
            var number = statsData[stats.blockedTypes[type]] ? statsData[stats.blockedTypes[type]] : 0;
            var blockedTypeItem = htmlToElement(`
                <li>
                    <span class="key">${this._localizeBlockedType(type)}</span>
                    <span class="value">${number}</span>
                </li>
            `);

            analytics.appendChild(blockedTypeItem);
        }
    },

    _renderStatsGraphs: function (stats, range, type) {
        /**
         * Blocked requests types
         */
        const requestTypes = {
            adsRequests: 'ADS',
            trackersRequests: 'TRACKERS',
            socialRequests: 'SOCIAL',
            otherRequests: 'OTHERS',
            totalRequests: 'total',
        };

        this._renderRequestsGraphs(stats, range, requestTypes[type]);
        this._renderAnalyticsBlock(stats, range);
    },

    _renderStatsBlock: function () {
        var timeRange = document.querySelector('.statistics-select-time').value;
        var typeData = document.querySelector('.statistics-select-type').value;

        var self = this;
        popupPage.sendMessage({type: 'getStatisticsData'}, function (message) {
            self._renderStatsGraphs(message.stats, timeRange, typeData);
        });
    },

    _renderStats: function (container) {
        var template = this.filteringStatisticsTemplate;
        this._appendTemplate(container, template);

        this._renderStatsBlock();
    },

    _renderActions: function (container, tabInfo) {

        if (tabInfo.urlFilteringDisabled) {
            return;
        }

        var el = document.createElement('div');
        el.classList.add('actions');

        this._appendTemplate(el, this.actionOpenAssistant);
        this._appendTemplate(el, this.actionOpenFilteringLog);
        if (tabInfo.applicationFilteringDisabled || tabInfo.documentWhiteListed) {
            // May be show later
            this.actionOpenAssistant.style.display = 'none';
        }

        this._appendTemplate(el, this.actionOpenAbuse);
        this._appendTemplate(el, this.actionOpenSiteReport);

        container.appendChild(el);
    },

    _renderFooter: function (footerContainer, tabInfo) {
        if (tabInfo.adguardDetected) {
            this._appendTemplate(footerContainer, this.footerIntegration);
        } else {
            this._appendTemplate(footerContainer, this.footerDefault);
        }
    },

    _bindAction: function (parentElement, selector, eventName, handler) {
        const elements = parentElement.querySelectorAll(selector);
        if (!elements || elements.length <= 0) {
            return;
        }
        elements.forEach(element => element.addEventListener(eventName, handler));
    },

    _bindActions: function () {
        var parent = document.querySelector('.widget-popup');

        var self = this;
        this._bindAction(parent, '.siteReport', 'click', function (e) {
            e.preventDefault();
            self.openSiteReportTab(self.tabInfo.url);
            popupPage.closePopup();
        });
        this._bindAction(parent, '.openSettings', 'click', function (e) {
            e.preventDefault();
            self.openSettingsTab();
            popupPage.closePopup();
        });
        this._bindAction(parent, '.openAssistant', 'click', function (e) {
            e.preventDefault();
            self.openAssistantInTab();
            popupPage.closePopup();
        });
        this._bindAction(parent, '.openFilteringLog', 'click', function (e) {
            e.preventDefault();
            self.openFilteringLog();
            popupPage.closePopup();
        });
        this._bindAction(parent, '.resetStats', 'click', function (e) {
            e.preventDefault();
            self.resetBlockedAdsCount();
            parent.querySelector('.w-popup-filter-title-blocked-all').textContent = '0';
        });
        this._bindAction(parent, '.openLink', 'click', function (e) {
            e.preventDefault();
            self.openLink(e.currentTarget.href);
            popupPage.closePopup();
        });
        this._bindAction(parent, '.openAbuse', 'click', function (e) {
            e.preventDefault();
            self.openAbuseTab(self.tabInfo.url);
            popupPage.closePopup();
        });

        // checkbox
        this._bindAction(parent, '.changeDocumentWhiteListed', 'click', function (e) {
            e.preventDefault();
            var tabInfo = self.tabInfo;
            if (tabInfo.urlFilteringDisabled || tabInfo.applicationFilteringDisabled) {
                return;
            }
            if (!tabInfo.canAddRemoveRule) {
                return;
            }
            var isWhiteListed = tabInfo.documentWhiteListed;
            if (isWhiteListed) {
                self.removeWhiteListDomain(tabInfo.url);
                isWhiteListed = false;
            } else {
                self.addWhiteListDomain(tabInfo.url);
                isWhiteListed = true;
            }
            tabInfo.documentWhiteListed = isWhiteListed;
            tabInfo.userWhiteListed = isWhiteListed;
            tabInfo.totalBlockedTab = 0;
            self._renderPopup(tabInfo);
            self._bindActions();
            self.resizePopupWindow();

            if (tabInfo.adguardDetected) {
                popupPage.closePopup();
            }
        });

        function changeProtectionState(disabled) {
            const tabInfo = self.tabInfo;
            if (tabInfo.applicationFilteringDisabled === disabled) {
                return;
            }
            self.changeApplicationFilteringDisabled(disabled);
            tabInfo.applicationFilteringDisabled = disabled;
            tabInfo.totalBlockedTab = 0;
            self._renderPopup(tabInfo);
            self._bindActions();
            self.resizePopupWindow();
        }

        // Disable filtering
        var changeProtectionStateDisableButtons = document.querySelectorAll('.changeProtectionStateDisable');
        changeProtectionStateDisableButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                changeProtectionState(true);
            });
        });

        // Enable filtering
        var changeProtectionStateEnableButtons = document.querySelectorAll('.changeProtectionStateEnable');
        changeProtectionStateEnableButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                changeProtectionState(false);
            });
        });

        // Tabs
        parent.querySelectorAll('.tabbar .tab').forEach(function (t) {
            t.addEventListener('click', function (e) {
                e.preventDefault();

                parent.querySelectorAll('.tabbar .tab').forEach(function (tab) {
                    tab.classList.remove('active');
                });
                e.target.classList.add('active');

                var attr = e.target.getAttribute('tab-switch');
                parent.querySelectorAll('.tab-switch-tab').forEach(function (tab) {
                    tab.style.display = 'none';
                });
                parent.querySelectorAll('.tab-switch-tab[tab-switch="' + attr + '"]').forEach(function (tab) {
                    tab.style.display = 'flex';
                });
            });
        });

        // Stats filters
        this._bindAction(parent, '.statistics-select-time', 'change', function () {
            self._renderStatsBlock();
        });
        this._bindAction(parent, '.statistics-select-type', 'change', function () {
            self._renderStatsBlock();
        });
    },

    // http://jira.performix.ru/browse/AG-3474
    resizePopupWindowForMacOs: function () {
        var options = this.options;
        if (options.isFirefoxBrowser || !options.isMacOs) {
            return;
        }
        setTimeout(function () {
            var block = document.querySelector(".macoshackresize");
            block.style["padding-top"] = "4px";
        }, 1000);
    },

    _formatNumber: function (v) {
        return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    },
};

(function () {

    /**
     * TODO: check the following EDGE issue
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/551
     * MS Edge unexpectedly crashes on opening the popup.
     * We do not quite understand the reason for this behavior, but we assume it happens due to code flow execution and changing the DOM.
     * setTimeout allows us to resolve this "race condition".
     */

    var controller = new PopupController();
    controller.afterRender = function () {
        // Add some delay for show popup size properly
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/505
        var timeout = 10;
        setTimeout(function () {
            controller.resizePopupWindow();
            controller.resizePopupWindowForMacOs();
        }, timeout);
    };

    document.addEventListener('resizePopup', function () {
        controller.resizePopupWindow();
    });

    popupPage.sendMessage({ type: 'getTabInfoForPopup' }, function (message) {
        var onDocumentReady = function () {
            controller.render(message.frameInfo, message.options);
        };

        if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading') {
            onDocumentReady();
        } else {
            document.addEventListener('DOMContentLoaded', onDocumentReady);
        }
    });

    popupPage.onMessage.addListener(function (message) {
        switch (message.type) {
            case 'updateTotalBlocked': {
                const { tabInfo } = message;
                controller.updateTotalBlocked(tabInfo);
                break;
            }
            default:
                break;
        }
    });
})();
