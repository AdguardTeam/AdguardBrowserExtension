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
const PopupController = function () {
};

PopupController.prototype = {

    /**
     * Renders popup using specified model object
     * @param tabInfo
     * @param options
     */
    render(tabInfo, options) {
        this.tabInfo = tabInfo;
        this.options = options || {};

        // render
        this._renderPopup(tabInfo);

        // Bind actions
        this._bindActions();

        this.afterRender();
    },

    resizePopupWindow() {
        const widget = document.querySelector('.widget-popup');
        const width = widget.offsetWidth;
        const height = widget.offsetHeight;

        popupPage.resizePopup(width, height);
    },

    afterRender() {
        // Should be overwritten
    },

    addWhiteListDomain(url) {
        popupPage.sendMessage({ type: 'addWhiteListDomainPopup', url });
    },

    removeWhiteListDomain(url) {
        popupPage.sendMessage({ type: 'removeWhiteListDomainPopup', url });
    },

    changeApplicationFilteringDisabled(disabled) {
        popupPage.sendMessage({ type: 'changeApplicationFilteringDisabled', disabled });
    },

    sendFeedback(url, topic, comment) {
        popupPage.sendMessage({
            type: 'sendFeedback', url, topic, comment,
        });
    },

    openSiteReportTab(url) {
        popupPage.sendMessage({ type: 'openSiteReportTab', url });
    },

    openAbuseTab(url) {
        popupPage.sendMessage({ type: 'openAbuseTab', url });
    },

    openSettingsTab() {
        popupPage.sendMessage({ type: 'openSettingsTab' });
    },

    openAssistantInTab() {
        popupPage.sendMessage({ type: 'openAssistant' });
    },

    openFilteringLog(tabId) {
        popupPage.sendMessage({ type: 'openFilteringLog', tabId });
    },

    resetBlockedAdsCount() {
        popupPage.sendMessage({ type: 'resetBlockedAdsCount' });
    },

    openLink(url) {
        popupPage.sendMessage({ type: 'openTab', url });
    },

    updateTotalBlocked(tabInfo) {
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

    _renderPopup(tabInfo) {
        const parent = document.querySelector('.widget-popup');
        const switcher = document.querySelector('#filtering-default-control-template > div.control-buttons');
        const containerHeader = document.querySelector('.widget-popup__header');
        while (containerHeader.firstChild) {
            containerHeader.removeChild(containerHeader.firstChild);
        }

        const footerContainer = parent.querySelector('.footer');
        while (footerContainer.firstChild) {
            footerContainer.removeChild(footerContainer.firstChild);
        }

        const stack = parent.querySelector('.tabstack');

        const containerMain = parent.querySelector('.tab-main');

        while (containerMain.firstChild) {
            containerMain.removeChild(containerMain.firstChild);
        }

        const containerBottom = parent.querySelector('.tabstack-bottom.tab-main');
        while (containerBottom.firstChild) {
            containerBottom.removeChild(containerBottom.firstChild);
        }

        const containerStats = parent.querySelector('.tab-statistics');
        while (containerStats.firstChild) {
            containerStats.removeChild(containerStats.firstChild);
        }

        stack.setAttribute('class', 'tabstack');
        parent.setAttribute('class', 'widget-popup');

        // define class
        if (tabInfo.applicationFilteringDisabled) {
            stack.classList.add('status-paused');
            parent.classList.add('status-paused');
            switcher.setAttribute('aria-checked', 'false');
        } else if (!tabInfo.applicationAvailable) {
            stack.classList.add('status-inner');
            parent.classList.add('status-checkmark');
            switcher.setAttribute('aria-hidden', 'true');
        } else if (!tabInfo.canAddRemoveRule) {
            stack.classList.add('status-error');
            parent.classList.add('status-checkmark');
        } else if (tabInfo.documentWhiteListed) {
            stack.classList.add('status-cross');
            parent.classList.add('status-cross');
            switcher.setAttribute('aria-checked', 'false');
        } else {
            stack.classList.add('status-checkmark');
            parent.classList.add('status-checkmark');
            switcher.setAttribute('aria-checked', 'true');
        }

        // Header
        this.filteringHeader = this._getTemplate('filtering-header-template');
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

        // Notification
        this.notification = this._getTemplate('notification-template');
        this.animatedNotification = this._getTemplate('animated-notification-template');

        this._renderHeader(containerHeader, tabInfo);
        this._renderNotificationBlock(stack, tabInfo, this.options);
        this._renderMain(containerMain, tabInfo);
        this._renderFilteringControls(containerMain);
        this._renderStatus(containerMain, tabInfo);
        this._renderActions(containerBottom, tabInfo);
        this._renderMessage(containerMain, tabInfo);
        this._renderStats(containerStats);
        this._renderFooter(footerContainer, tabInfo, this.options);
        this._renderAnimatedNotification(parent, tabInfo, this.options);
    },

    _getTemplate(id) {
        return document.querySelector(`#${id}`).cloneNode(true);
    },

    _appendTemplate(container, template) {
        [].slice.call(template.childNodes).forEach((c) => {
            container.appendChild(c.cloneNode(true));
        });
    },

    _renderHeader(container) {
        const template = this.filteringHeader;
        this._appendTemplate(container, template);
    },

    _renderAnimatedNotification(container, tabInfo, options) {
        const { notification } = options;
        // Do not show
        if (!notification) {
            return;
        }

        // Do not show notification if the type is not animated or there is no text
        if (notification.type !== 'animated' || !notification.text) {
            return;
        }

        if (notification.text.title) {
            const title = this.animatedNotification.querySelector('.holiday-notify__title');
            title.innerText = notification.text.title;
        }

        if (notification.text.btn) {
            const button = this.animatedNotification.querySelector('.holiday-notify__btn');
            button.innerText = notification.text.btn;
        }

        this._appendTemplate(container, this.animatedNotification);

        // Schedule notification removal
        popupPage.sendMessage({ type: 'setNotificationViewed', withDelay: true });
    },

    _renderNotificationBlock(container, tabInfo, options) {
        const { notification } = options;
        // Do not show notification
        if (!notification) {
            return;
        }

        if (notification.type !== 'simple') {
            return;
        }

        const {
            bgColor,
            textColor,
            text,
        } = notification;

        if (!text) {
            return;
        }

        const notificationTitleNode = this.notification.querySelector('.openNotificationLink');
        notificationTitleNode.innerHTML = text;
        if (bgColor && textColor) {
            const notification = this.notification.querySelector('.notice');
            notification.setAttribute('style', `background-color: ${bgColor}; color: ${textColor}`);
        }
        this._appendTemplate(container, this.notification);

        // Schedule notification removal
        popupPage.sendMessage({ type: 'setNotificationViewed', withDelay: true });
    },

    _renderMain(container, tabInfo) {
        const template = this.filteringDefaultHeader;
        if (this.options.showInfoAboutFullVersion) {
            const headerCtaLink = template.querySelector('#header-cta-link');
            headerCtaLink.style.display = 'block';
        }
        const tabBlocked = template.querySelector('.blocked-tab');
        const totalBlocked = template.querySelector('.blocked-all');
        i18n.translateElement(tabBlocked, 'popup_tab_blocked', [this._formatNumber(tabInfo.totalBlockedTab || 0)]);
        i18n.translateElement(totalBlocked, 'popup_tab_blocked_all', [this._formatNumber(tabInfo.totalBlocked || 0)]);
        const closestWidgetFilter = tabBlocked.closest('.widget-popup-filter');
        if (closestWidgetFilter) {
            if (tabInfo.totalBlocked >= 10000000) {
                closestWidgetFilter.classList.add('db');
            } else {
                closestWidgetFilter.classList.remove('db');
            }
        }

        this._appendTemplate(container, template);
    },

    _renderFilteringControls(container) {
        const template = this.filteringControlDefault;
        this._appendTemplate(container, template);
    },

    _renderStatus(container, tabInfo) {
        const template = this.filteringStatusText;

        let messageKey = '';
        if (!tabInfo.applicationAvailable) {
            messageKey = 'popup_site_filtering_state_secure_page';
        } else if (tabInfo.documentWhiteListed && !tabInfo.userWhiteListed) {
            messageKey = '';
        } else if (tabInfo.applicationFilteringDisabled) {
            messageKey = 'popup_site_filtering_state_paused';
        } else if (tabInfo.documentWhiteListed) {
            messageKey = 'popup_site_filtering_state_disabled';
        } else {
            messageKey = 'popup_site_filtering_state_enabled';
        }

        const statusElement = template.querySelector('.status');
        if (messageKey) {
            i18n.translateElement(statusElement, messageKey);
        } else {
            statusElement.classList.add('status--hide');
        }

        const currentSiteElement = template.querySelector('.current-site');
        if (tabInfo.applicationAvailable) {
            currentSiteElement.textContent = tabInfo.domainName ? tabInfo.domainName : tabInfo.url;
        } else {
            currentSiteElement.textContent = tabInfo.url;
        }

        this._appendTemplate(container, template);
    },

    _renderMessage(container, tabInfo) {
        let messageKey;
        if (!tabInfo.applicationAvailable) {
            messageKey = '';
        } else if (tabInfo.documentWhiteListed && !tabInfo.userWhiteListed) {
            messageKey = 'popup_site_exception_info';
        }

        const template = this.filteringMessageText;
        if (messageKey) {
            i18n.translateElement(template.childNodes[1], messageKey);
            this._appendTemplate(container, template);
        }
    },

    _selectRequestTypesStatsData(stats, range) {
        let result = {};

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
            default:
                break;
        }

        return result;
    },

    _selectRequestsStatsData(stats, range, type) {
        const result = [];
        switch (range) {
            case 'day':
                stats.today.forEach((d) => {
                    result.push(d[type]);
                });
                break;
            case 'week':
                stats.lastWeek.forEach((d) => {
                    result.push(d[type]);
                });
                break;
            case 'month':
                stats.lastMonth.forEach((d) => {
                    result.push(d[type]);
                });
                break;
            case 'year':
                stats.lastYear.forEach((d) => {
                    result.push(d[type]);
                });
                break;
            default:
                break;
        }
        return result.map(val => (val === undefined ? 0 : val));
    },

    DAYS_OF_WEEK: (function () {
        return this.DAYS_OF_WEEK || [
            i18n.getMessage('popup_statistics_week_days_mon'),
            i18n.getMessage('popup_statistics_week_days_tue'),
            i18n.getMessage('popup_statistics_week_days_wed'),
            i18n.getMessage('popup_statistics_week_days_thu'),
            i18n.getMessage('popup_statistics_week_days_fri'),
            i18n.getMessage('popup_statistics_week_days_sat'),
            i18n.getMessage('popup_statistics_week_days_sun'),
        ];
    })(),

    _dayOfWeekAsString(dayIndex) {
        return this.DAYS_OF_WEEK[dayIndex];
    },

    MONTHS_OF_YEAR: (function () {
        return this.MONTHS_OF_YEAR || [
            i18n.getMessage('popup_statistics_months_jan'),
            i18n.getMessage('popup_statistics_months_feb'),
            i18n.getMessage('popup_statistics_months_mar'),
            i18n.getMessage('popup_statistics_months_apr'),
            i18n.getMessage('popup_statistics_months_may'),
            i18n.getMessage('popup_statistics_months_jun'),
            i18n.getMessage('popup_statistics_months_jul'),
            i18n.getMessage('popup_statistics_months_aug'),
            i18n.getMessage('popup_statistics_months_sep'),
            i18n.getMessage('popup_statistics_months_oct'),
            i18n.getMessage('popup_statistics_months_nov'),
            i18n.getMessage('popup_statistics_months_dec'),
        ];
    })(),

    _monthsAsString(monthIndex) {
        return this.MONTHS_OF_YEAR[monthIndex];
    },

    _getCategoriesLines(statsData, range) {
        const now = new Date();
        const day = now.getDay();
        const month = now.getMonth();
        const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();

        let categories = [];
        const lines = [];
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
                        const c = (i + now.getDate()) % lastDayOfPrevMonth + 1;
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
            categories,
            lines,
        };
    },

    _renderRequestsGraphs(stats, range, type) {
        const statsData = this._selectRequestsStatsData(stats, range, type);
        const categoriesLines = this._getCategoriesLines(statsData, range);
        const { categories } = categoriesLines;
        const { lines } = categoriesLines;

        const grad1 = '<linearGradient id="grad1" x1="50%" y1="0%" x2="50%" y2="100%">'
            + '  <stop offset="0%" style="stop-color:#73BE66;stop-opacity:1" />'
            + '  <stop offset="23%" style="stop-color:#6DBE85;stop-opacity:1" />'
            + '  <stop offset="100%" style="stop-color:#65BDA8;stop-opacity:1" />'
            + '</linearGradient>';

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
                    categories,
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
                    lines,
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
                position(data, width, height, element) {
                    const chart = document.querySelector('#chart');
                    const elementRect = element.getBoundingClientRect();
                    const elementCenterPosition = elementRect.left + (elementRect.width / 2);
                    const tooltipHalfWidth = chart.querySelector('.chart__tooltip').clientWidth / 2;
                    const tooltipLeft = elementCenterPosition - tooltipHalfWidth;
                    const top = d3.mouse(element)[1] - 50;
                    return {
                        top,
                        left: tooltipLeft,
                    };
                },
                contents(d) {
                    const { value } = d[0];
                    return `<div id="tooltip" class="chart__tooltip">${value}</div>`;
                },
            },
            oninit() {
                this.svg[0][0].getElementsByTagName('defs')[0].innerHTML += grad1;
            },
        });
    },

    _renderAnalyticsBlock(stats, range) {
        const statsData = this._selectRequestTypesStatsData(stats, range);

        const analytics = document.querySelector('#analytics-blocked-types-values');

        while (analytics.firstChild) {
            analytics.removeChild(analytics.firstChild);
        }

        const { blockedGroups } = stats;

        blockedGroups.forEach((blockedGroup) => {
            const number = statsData[blockedGroup.groupId];
            if (number) {
                const blockedItem = htmlToElement(`
                <li>
                    <span class="key" tabindex="0">${blockedGroup.groupName}</span>
                    <span class="value" tabindex="0">${number}</span>
                </li>
            `);
                analytics.appendChild(blockedItem);
            }
        });
    },

    _renderStatsGraphs(stats, range, type) {
        this._renderRequestsGraphs(stats, range, type);
        this._renderAnalyticsBlock(stats, range);
    },

    _renderStatsBlock(stats) {
        const timeRange = document.querySelector('.statistics-select-time').value;
        const typeData = document.querySelector('.statistics-select-type').value;

        if (!stats) {
            const self = this;
            popupPage.sendMessage({ type: 'getStatisticsData' }, (message) => {
                self._renderStatsGraphs(message.stats, timeRange, typeData);
            });
        } else {
            this._renderStatsGraphs(stats, timeRange, typeData);
        }
    },

    _renderBlockedGroups(container, stats) {
        const TOTAL_GROUP_ID = 'total';

        const timeRange = document.querySelector('.statistics-select-time').value;
        const typeSelector = container.querySelector('.statistics-select-type');

        const statsData = this._selectRequestTypesStatsData(stats, timeRange);

        const getSelectTemplate = group => `<option value="${group.groupId}">${group.groupName}</option>`;

        const blockedGroups = stats.blockedGroups
            .filter(group => statsData[group.groupId]);

        if (blockedGroups.length === 0) {
            const [totalBlockedGroup] = stats.blockedGroups
                .filter(({ groupId }) => groupId === TOTAL_GROUP_ID);

            typeSelector.insertAdjacentHTML('beforeend', getSelectTemplate(totalBlockedGroup));
            return;
        }

        blockedGroups.forEach((group) => {
            typeSelector.insertAdjacentHTML('beforeend', getSelectTemplate(group));
        });
    },

    _renderStats(container) {
        const template = this.filteringStatisticsTemplate;
        this._appendTemplate(container, template);

        const self = this;

        popupPage.sendMessage({ type: 'getStatisticsData' }, (message) => {
            const { stats } = message;

            self._renderBlockedGroups(container, stats);
            self._renderStatsBlock(stats);
        });
    },

    _renderActions(container, tabInfo) {
        const el = document.createElement('div');
        el.classList.add('actions');

        this._appendTemplate(el, this.actionOpenAssistant);
        this._appendTemplate(el, this.actionOpenFilteringLog);
        if (tabInfo.applicationFilteringDisabled || tabInfo.documentWhiteListed) {
            // May be shown later
            this.actionOpenAssistant.style.display = 'none';
        }

        this._appendTemplate(el, this.actionOpenAbuse);
        this._appendTemplate(el, this.actionOpenSiteReport);

        if (!tabInfo.applicationAvailable) {
            const disabledActionsSelectors = ['.openAssistant', '.siteReport', '.openAbuse'];
            disabledActionsSelectors.forEach((selector) => {
                const action = el.querySelector(selector);
                action.classList.add('action_disabled');
                action.setAttribute('aria-hidden', 'true');
            });
        }

        container.appendChild(el);
    },

    _renderFooter(footerContainer, tabInfo, options) {
        const { footerDefault } = this;
        const getPremium = footerDefault.querySelector('.popup-get-premium');
        const popupFooter = footerDefault.querySelector('.popup-footer');
        // There is no footer title for edge
        const footerDefaultTitle = footerDefault.querySelector('.footer__title');
        if (popupFooter && footerDefaultTitle) {
            if (options.isEdgeBrowser) {
                popupFooter.innerHTML = `<div class="popup-footer--edge">© 2009-${new Date().getFullYear()} AdGuard Software Ltd</div>`;
                // hide mobile app icons - https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1543
                const platforms = footerDefault.querySelector('.platforms');
                if (platforms) {
                    platforms.style.display = 'none';
                }
            } else {
                footerDefaultTitle.setAttribute('title', i18n.getMessage('popup_adguard_footer_title'));
            }
        }

        // CAUTION!
        // Uncomment if condition bellow if you'd like to show
        // get premium button in the action window (extension popup)

        // if (!options.isDisableShowAdguardPromoInfo) {
        //     getPremium.style.display = 'block';
        //     popupFooter.style.display = 'none';
        // } else {
        //     getPremium.style.display = 'none';
        //     popupFooter.style.display = 'block';
        // }
        this._appendTemplate(footerContainer, footerDefault);
    },

    _bindAction(parentElement, selector, eventName, handler) {
        const elements = [].slice.call(parentElement.querySelectorAll(selector));
        if (!elements || elements.length <= 0) {
            return;
        }
        elements.forEach(element => element.addEventListener(eventName, handler));
    },

    _bindActions() {
        const parent = document.querySelector('.widget-popup');

        const self = this;
        this._bindAction(parent, '.siteReport', 'click', (e) => {
            e.preventDefault();
            if (!self.tabInfo.applicationAvailable) {
                return;
            }
            self.openSiteReportTab(self.tabInfo.url);
            popupPage.closePopup();
        });

        this._bindAction(parent, '.openSettings', 'click', (e) => {
            e.preventDefault();
            self.openSettingsTab();
            popupPage.closePopup();
        });

        this._bindAction(parent, '.openAssistant', 'click', (e) => {
            e.preventDefault();
            if (!self.tabInfo.applicationAvailable) {
                return;
            }
            self.openAssistantInTab();
            popupPage.closePopup();
        });

        this._bindAction(parent, '.openNotificationLink', 'click', (e) => {
            e.preventDefault();
            const { url } = self.options.notification;
            if (url) {
                self.openLink(`${url}&from=popup`);
                popupPage.sendMessage({ type: 'setNotificationViewed', withDelay: false });
                popupPage.closePopup();
            }
        });

        this._bindAction(parent, '.closeNotification', 'click', (e) => {
            e.preventDefault();
            const notification = parent.querySelector('#popup-notification');
            if (notification) {
                notification.style.display = 'none';
                popupPage.sendMessage({ type: 'setNotificationViewed', withDelay: false });
            }
        });

        this._bindAction(parent, '.holiday-notify__btn', 'click', (e) => {
            e.preventDefault();
            const { url } = self.options.notification;
            if (url) {
                const popupUrl = `${url}&from=popup`;
                self.openLink(popupUrl);
                popupPage.sendMessage({ type: 'setNotificationViewed', withDelay: false });
                popupPage.closePopup();
            }
        });

        this._bindAction(parent, '.holiday-notify__close', 'click', (e) => {
            e.preventDefault();
            const notification = parent.querySelector('.holiday-notify');
            if (notification) {
                notification.classList.add('holiday-notify--close');
                popupPage.sendMessage({ type: 'setNotificationViewed', withDelay: false });
            }
        });

        const handlePopupGetPremiumClose = () => {
            const getPremium = parent.querySelector('.popup-get-premium');
            const popupFooter = parent.querySelector('.popup-footer');
            if (getPremium) {
                getPremium.style.display = 'none';
                popupFooter.style.display = 'block';
                popupPage.sendMessage({
                    type: 'disableGetPremiumNotification',
                });
            }
        };
        // close popup get premium notification if user clicked close button
        this._bindAction(parent, '.popup_get_premium_close', 'click', (e) => {
            e.preventDefault();
            handlePopupGetPremiumClose();
        });
        // close popup get premium if user clicked on the link
        this._bindAction(parent, '.popup-get-premium', 'click', () => {
            handlePopupGetPremiumClose();
        });
        this._bindAction(parent, '.openFilteringLog', 'click', (e) => {
            e.preventDefault();
            self.openFilteringLog();
            popupPage.closePopup();
        });
        this._bindAction(parent, '.resetStats', 'click', (e) => {
            e.preventDefault();
            self.resetBlockedAdsCount();
            parent.querySelector('.w-popup-filter-title-blocked-all').textContent = '0';
        });
        this._bindAction(parent, '.openLink', 'click', (e) => {
            e.preventDefault();
            self.openLink(e.currentTarget.href);
            popupPage.closePopup();
        });
        this._bindAction(parent, '.openAbuse', 'click', (e) => {
            e.preventDefault();
            if (!self.tabInfo.applicationAvailable) {
                return;
            }
            self.openAbuseTab(self.tabInfo.url);
            popupPage.closePopup();
        });

        // checkbox
        this._bindAction(parent, '.changeDocumentWhiteListed', 'click', (e) => {
            e.preventDefault();
            const { tabInfo } = self;
            if (!tabInfo.applicationAvailable || tabInfo.applicationFilteringDisabled) {
                return;
            }
            if (!tabInfo.canAddRemoveRule) {
                return;
            }
            let isWhiteListed = tabInfo.documentWhiteListed;
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
        });

        function changeProtectionState(disabled) {
            const { tabInfo } = self;
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
        const changeProtectionStateDisableButtons = [].slice
            .call(document.querySelectorAll('.changeProtectionStateDisable'));
        changeProtectionStateDisableButtons.forEach((button) => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                changeProtectionState(true);
            });
        });

        // Enable filtering
        const changeProtectionStateEnableButtons = [].slice
            .call(document.querySelectorAll('.changeProtectionStateEnable'));
        changeProtectionStateEnableButtons.forEach((button) => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                changeProtectionState(false);
            });
        });

        // Tabs
        [].slice.call(parent.querySelectorAll('.tabbar .tab')).forEach((t) => {
            t.addEventListener('click', (e) => {
                e.preventDefault();

                [].slice.call(parent.querySelectorAll('.tabbar .tab')).forEach((tab) => {
                    tab.classList.remove('active');
                });
                e.target.classList.add('active');

                const attr = e.target.getAttribute('tab-switch');
                [].slice.call(parent.querySelectorAll('.tab-switch-tab')).forEach((tab) => {
                    tab.style.display = 'none';
                });
                [].slice.call(parent.querySelectorAll(`.tab-switch-tab[tab-switch="${attr}"]`)).forEach((tab) => {
                    tab.style.display = 'flex';
                });
            });
        });

        /**
         * Stats filters
         * we call _renderStatsBlock function w/o stats parameter, in order to update stats on
         * every selection of range or blockedGroup option
         */
        this._bindAction(parent, '.statistics-select-time', 'change', () => {
            self._renderStatsBlock();
        });
        this._bindAction(parent, '.statistics-select-type', 'change', () => {
            self._renderStatsBlock();
        });
    },

    /**
     * Formats number to the language-sensitive representation
     * @param {number} number
     * @returns {string}
     * @private
     */
    _formatNumber(number) {
        return number.toLocaleString();
    },
};

(function () {
    /**
     * TODO: check the following EDGE issue
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/551
     * MS Edge unexpectedly crashes on opening the popup.
     * We do not quite understand the reason for this behavior,
     * but we assume it happens due to code flow execution and changing the DOM.
     * setTimeout allows us to resolve this "race condition".
     */

    const controller = new PopupController();
    controller.afterRender = function () {
        // Add some delay for show popup size properly
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/505
        const timeout = 10;
        setTimeout(() => {
            controller.resizePopupWindow();
        }, timeout);
    };

    document.addEventListener('resizePopup', () => {
        controller.resizePopupWindow();
    });

    popupPage.sendMessage({ type: 'getTabInfoForPopup' }, (message) => {
        const onDocumentReady = () => {
            controller.render(message.frameInfo, message.options);
        };

        if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading') {
            onDocumentReady();
        } else {
            document.addEventListener('DOMContentLoaded', onDocumentReady);
        }
    });

    popupPage.onMessage.addListener((message) => {
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
