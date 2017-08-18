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

/* global $, i18n, popupPage */

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

        //render
        this._renderPopup(tabInfo);

        // Bind actions
        this._bindActions();
        this._initFeedback();

        this.afterRender();
    },

    resizePopupWindow: function () {
        var $widjet = $('body>div:not(.hidden)');
        var width = $widjet.outerWidth();
        var height = $widjet.outerHeight();
        popupPage.resizePopup(width, height);
    },

    afterRender: function () {

    },

    addWhiteListDomain: function (url) {
        popupPage.sendMessage({type: 'addWhiteListDomainPopup', url: url});
    },

    removeWhiteListDomain: function (url) {
        popupPage.sendMessage({type: 'removeWhiteListDomainPopup', url: url});
    },

    changeApplicationFilteringDisabled: function (disabled) {
        popupPage.sendMessage({type: 'changeApplicationFilteringDisabled', disabled: disabled});
    },

    sendFeedback: function (url, topic, comment) {
        popupPage.sendMessage({type: 'sendFeedback', url: url, topic: topic, comment: comment});
    },

    openSiteReportTab: function (url) {
        popupPage.sendMessage({type: 'openSiteReportTab', url: url});
    },

    openSettingsTab: function () {
        popupPage.sendMessage({type: 'openSettingsTab'});
    },

    openAssistantInTab: function () {
        popupPage.sendMessage({type: 'openAssistant'});
    },

    openFilteringLog: function (tabId) {
        popupPage.sendMessage({type: 'openFilteringLog', tabId: tabId});
    },

    resetBlockedAdsCount: function () {
        popupPage.sendMessage({type: 'resetBlockedAdsCount'});
    },

    openLink: function (url) {
        popupPage.sendMessage({type: 'openTab', url: url});
    },

    _renderPopup: function (tabInfo) {

        var parent = $('.widjet-popup');
        //parent.empty();
        parent.find('.footer').remove();

        var stack = parent.find('.tabstack');

        var containerMain = parent.find('.tab-main');
        containerMain.empty();

        var containerStats = parent.find('.tab-statistics');
        containerStats.empty();

        stack.attr('class', 'tabstack');

        // define class
        if (tabInfo.urlFilteringDisabled) {
            stack.addClass('status-error error-sad');
        } else if (tabInfo.applicationFilteringDisabled) {
            stack.addClass('status-paused');
        } else {
            if (!tabInfo.canAddRemoveRule) {
                stack.addClass('status-error error-filter');
            } else {
                if (tabInfo.documentWhiteListed) {
                    stack.addClass('status-cross');
                } else {
                    stack.addClass('status-checkmark');
                }
            }
        }

        // Header
        this.filteringIntegrationHeader = this._getTemplate('filtering-integration-header-template');
        this.filteringDefaultHeader = this._getTemplate('filtering-default-header-template');

        // Controls
        this.filteringControlDefault = this._getTemplate('filtering-default-control-template');
        this.filteringControlDisabled = this._getTemplate('filtering-disabled-control-template');
        this.filteringControlException = this._getTemplate('filtering-site-exception-control-template');

        // Actions
        this.actionOpenAssistant = this._getTemplate('action-open-assistant-template');
        this.actionOpenAbuse = this._getTemplate('action-open-abuse-template');
        this.actionOpenSiteReport = this._getTemplate('action-site-report-template');

        // Status Text
        this.filteringStatusText = this._getTemplate('filtering-status-template');
        // Message text
        this.filteringMessageText = this._getTemplate('filtering-message-template');

        // Stats
        this.filteringStatisticsTemplate = this._getTemplate('filtering-statistics-template');

        // Footer
        this.footerDefault = this._getTemplate('footer-default-template');
        this.footerIntegration = this._getTemplate('footer-integration-template');

        this._renderHeader(containerMain, tabInfo);
        this._renderFilteringControls(containerMain, tabInfo);
        this._renderStatus(containerMain, tabInfo);
        this._renderActions(containerMain, tabInfo);
        this._renderMessage(containerMain, tabInfo);
        this._renderStats(containerStats);
        this._renderFooter(parent, tabInfo);
    },

    _getTemplate: function (id) {
        return $('#' + id).children().clone();
    },

    _renderHeader: function (container, tabInfo) {

        function formatNumber(v) {
            return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        }

        var template;
        if (tabInfo.adguardDetected) {
            template = this.filteringIntegrationHeader;
            if (tabInfo.adguardProductName) {
                i18n.translateElement(template.find('.blocked-tab')[0], 'popup_ads_has_been_removed_by_adguard', [tabInfo.adguardProductName]);
            } else {
                i18n.translateElement(template.find('.blocked-tab')[0], 'popup_ads_has_been_removed');
            }
        } else {
            template = this.filteringDefaultHeader;
            var tabBlocked = template.find('.blocked-tab');
            var totalBlocked = template.find('.blocked-all');
            i18n.translateElement(tabBlocked[0], 'popup_tab_blocked', [formatNumber(tabInfo.totalBlockedTab || 0)]);
            i18n.translateElement(totalBlocked[0], 'popup_tab_blocked_all', [formatNumber(tabInfo.totalBlocked || 0)]);
            if (tabInfo.totalBlocked >= 10000000) {
                tabBlocked.closest('.widjet-popup-filter').addClass('db');
            } else {
                tabBlocked.closest('.widjet-popup-filter').removeClass('db');
            }
        }

        container.append(template);
    },

    _renderFilteringControls: function (container, tabInfo) {
        var template = this.filteringControlDefault;
        if (tabInfo.urlFilteringDisabled) {
            template = this.filteringControlDisabled;
        } else if (tabInfo.applicationFilteringDisabled) { // jshint ignore:line
            // Use default template
        } else {
            if (tabInfo.documentWhiteListed && !tabInfo.userWhiteListed) {
                template = this.filteringControlException;
            }
        }
        if (tabInfo.urlFilteringDisabled || tabInfo.applicationFilteringDisabled || tabInfo.adguardDetected) {
            template.find('.pause').hide();
        }
        if (tabInfo.adguardDetected) {
            template.find('.settings').hide();
        }
        container.append(template);
    },

    _renderStatus: function (container, tabInfo) {

        var template = this.filteringStatusText;

        var text = '';

        if (tabInfo.urlFilteringDisabled) {
            text = 'popup_site_filtering_disabled';
        } else if (tabInfo.applicationFilteringDisabled) {
            text = 'popup_enable_protection';
        } else {
            if (tabInfo.documentWhiteListed && !tabInfo.userWhiteListed) {
                text = 'popup_site_exception';
            } else {
                if (tabInfo.documentWhiteListed) {
                    text = 'context_site_filtering_on';
                } else {
                    text = 'context_site_filtering_off';
                }
            }
        }
        i18n.translateElement(template[0], text);

        container.append(template);
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
            i18n.translateElement(template[0], text);
            container.append(template);
        }
    },

    _selectStatsData: function (stats, range) {
        var result = [];

        switch (range) {
            case 'day':
                stats.today.forEach(function (d) {
                    result.push(d.total);
                });
                break;
            case 'week':
                stats.lastWeek.forEach(function (d) {
                    result.push(d.total);
                });
                break;
            case 'month':
                stats.lastMonth.forEach(function (d) {
                    result.push(d.total);
                });
                break;
            case 'year':
                stats.lastYear.forEach(function (d) {
                    result.push(d.total);
                });
                break;
        }

        return result;
    },

    _dayOfWeekAsString: function (dayIndex) {
        return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][dayIndex];
    },

    _monthsAsString: function (monthIndex) {
        return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][monthIndex];
    },

    _getCategoriesLines: function (range) {
        var now = new Date();
        var day = now.getDay();
        var month = now.getMonth();

        var categories = [];
        var lines = [];
        switch (range) {
            case 'day':
                for (var i = 0; i < 24; i++) {
                    if (i % 3 === 0) {
                        categories.push(i.toString());
                        lines.push({
                            value: i
                        });
                    } else {
                        categories.push('');
                    }
                }

                break;
            case 'week':
                for (var i = 0; i < 8; i++) {
                    categories.push(this._dayOfWeekAsString((day + i) % 7 ));
                    lines.push({
                        value: i
                    });
                }

                break;
            case 'month':
                for (var i = 0; i < 31; i++) {
                    if (i % 3 === 0) {
                        categories.push(i.toString());
                        lines.push({
                            value: i
                        })
                    } else {
                        categories.push('');
                    }
                }

                break;
            case 'year':
                for (var i = 0; i < 12; i++) {
                    categories.push(this._monthsAsString((month + i) % 12 ));
                    lines.push({
                        value: i
                    });
                }

                break;
        }

        return {
            categories: categories,
            lines: lines
        };
    },

    _renderStatsGraphs: function (stats, range) {
        var statsData = this._selectStatsData(stats, range);
        var categoriesLines = this._getCategoriesLines(range);
        var categories = categoriesLines.categories;
        var lines = categoriesLines.lines;

        var grad1 =
            '<linearGradient id="grad1" x1="50%" y1="0%" x2="50%" y2="100%">'+
            '  <stop offset="0%" style="stop-color:#73BE66;stop-opacity:1" />'+
            '  <stop offset="23%" style="stop-color:#6DBE85;stop-opacity:1" />'+
            '  <stop offset="100%" style="stop-color:#65BDA8;stop-opacity:1" />'+
            '</linearGradient>';

        var chart = c3.generate({
            data: {
                columns: [
                    ['data1'].concat(statsData)
                ],
                types: {
                    data1: 'area-spline'
                },
                colors: {
                    data1: 'url(#grad1)'
                }
            },
            axis: {
                x: {
                    show: true,
                    type: 'category',
                    categories: categories,
                    tick: {
                        outer: false
                    }
                },
                y: {
                    show: false
                }
            },
            legend: {
                show: false
            },
            grid: {
                x: {
                    lines: lines
                },
                focus: {
                    show: false
                }
            },
            spline: {
                interpolation: {
                    type: 'basis'
                }
            },
            point: {
                show: false
            },
            tooltip: {
                position: function(data, width, height, element) {
                    var top = d3.mouse(element)[1] - 50;
                    return {
                        top: top,
                        left: parseInt(element.getAttribute('x')) - 3
                    }
                },
                contents: function(d, defaultTitleFormat, defaultValueFormat, color) {
                    d = d[0].value;
                    return '<div id="tooltip" class="chart__tooltip">' + d + '</div>'
                }
            },
            oninit: function() {
                this.svg[0][0].getElementsByTagName('defs')[0].innerHTML += grad1;
            }
        });
    },

    _renderStatsBlock: function () {
        var timeRange = $('.statistics-select-time').val();

        var self = this;
        popupPage.sendMessage({type: 'getStatisticsData'}, function (message) {
            self._renderStatsGraphs(message.stats, timeRange);
        });
    },

    _renderStats: function (container) {
        var template = this.filteringStatisticsTemplate;
        container.append(template);

        this._renderStatsBlock();
    },

    _renderActions: function (container, tabInfo) {

        if (tabInfo.urlFilteringDisabled) {
            return;
        }

        var el = $('<div>', {class: 'actions'});

        el.append(this.actionOpenAssistant);
        if (tabInfo.applicationFilteringDisabled || tabInfo.documentWhiteListed) {
            // May be show later
            this.actionOpenAssistant.hide();
        }

        el.append(this.actionOpenAbuse);
        el.append(this.actionOpenSiteReport);

        container.append(el);
    },

    _renderFooter: function (footer, tabInfo) {
        if (tabInfo.adguardDetected) {
            footer.append(this.footerIntegration);
        } else {
            footer.append(this.footerDefault);
        }
    },

    _bindActions: function () {

        var parent = $('.widjet-popup');

        if (this.actionsBind === true) {
            return;
        }
        this.actionsBind = true;

        var self = this;
        parent.on('click', '.siteReport', function (e) {
            e.preventDefault();
            self.openSiteReportTab(self.tabInfo.url);
            popupPage.closePopup();
        });
        parent.on('click', '.openSettings', function (e) {
            e.preventDefault();
            self.openSettingsTab();
            popupPage.closePopup();
        });
        parent.on('click', '.openAssistant', function (e) {
            e.preventDefault();
            self.openAssistantInTab();
            popupPage.closePopup();
        });
        parent.on('click', '.openFilteringLog', function (e) {
            e.preventDefault();
            self.openFilteringLog();
            popupPage.closePopup();
        });
        parent.on('click', '.resetStats', function (e) {
            e.preventDefault();
            self.resetBlockedAdsCount();
            parent.find('.w-popup-filter-title-blocked-all').text('0');
        });
        parent.on('click', '.openLink', function (e) {
            e.preventDefault();
            self.openLink(e.currentTarget.href);
            popupPage.closePopup();
        });

        // checkbox
        parent.on('click', '.changeDocumentWhiteListed', function (e) {
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
            self._renderPopup(tabInfo);
            self.resizePopupWindow();

            if (tabInfo.adguardDetected) {
                popupPage.closePopup();
            }
        });

        function changeProtectionState(disabled) {
            var tabInfo = self.tabInfo;
            if (tabInfo.applicationFilteringDisabled == disabled) {
                return;
            }
            self.changeApplicationFilteringDisabled(disabled);
            tabInfo.applicationFilteringDisabled = disabled;
            self._renderPopup(tabInfo);
            self.resizePopupWindow();
        }

        // Disable filtering
        parent.on('click', '.changeProtectionStateDisable', function (e) {
            e.preventDefault();
            changeProtectionState(true);
        });

        // Enable filtering
        parent.on('click', '.changeProtectionStateEnable', function (e) {
            e.preventDefault();
            changeProtectionState(false);
        });

        // Tabs
        parent.on('click', '.tabbar .tab', function (e) {
            e.preventDefault();

            $('.tabbar .tab').removeClass('active');
            $(e.target).addClass('active');

            var attr = $(e.target).attr('tab-switch');

            $('.tab-switch-tab').hide();
            $('.tab-switch-tab[tab-switch="' + attr + '"]').show();

        });

        // Stats filters
        parent.on('change', '.statistics-select-time', function (e) {
            self._renderStatsBlock();
        })
    },

    _initFeedback: function () {

        if (this.feedbackBind === true) {
            return;
        }
        this.feedbackBind = true;

        var parent = $('.widjet-popup');
        var feedbackModal = $('.modal-feedback');

        var self = this;
        var feedbackErrorMessage = $('#feedbackErrorMessage');

        function sendFeedback() {
            var topic = selectorText.data('abuseOption');
            if (!topic) {
                feedbackErrorMessage.addClass('show');
                return;
            }
            var comment = selectorComment.val();
            self.sendFeedback(self.tabInfo.url, topic, comment);
            closeFeedback();
            selectorComment.val('');
        }

        function closeFeedback() {
            feedbackModal.addClass('hidden');
            parent.removeClass('hidden');
            selectorText.data('abuseOption', '');
            i18n.translateElement(selectorText[0], 'popup_feedback_empty_option');
            feedbackErrorMessage.removeClass('show');
            self.resizePopupWindow();
        }

        parent.on('click', '.openAbuse', function (e) {
            e.preventDefault();
            parent.addClass('hidden');
            feedbackModal.removeClass('hidden');
            self.resizePopupWindow();
        });

        feedbackModal.on('click', '#cancelFeedback', function (e) {
            e.preventDefault();
            closeFeedback();
        });
        feedbackModal.on('click', '#sendFeedback', function (e) {
            e.preventDefault();
            sendFeedback();
        });

        var selectorText = $('.m-feedback-inner-text');
        var selectorDropdown = $('.modal-feedback-dropdown');
        var selectorComment = $('.modal-feedback-message textarea');
        feedbackModal.on('click', '.modal-feedback-inner', function (e) {
            e.preventDefault();
            selectorDropdown.toggleClass('hidden');
            e.stopPropagation();
        });
        //clickoff
        $(document).click(function () {
            selectorDropdown.addClass('hidden');
        });
        feedbackModal.on('click', '.m-feedback-dropdown-item', function (e) {
            e.preventDefault();
            var text = $(this).text();
            selectorText.text(text);
            selectorText.data('abuseOption', $(this).attr('item-data'));
            selectorDropdown.addClass('hidden');
            feedbackErrorMessage.removeClass('show');
        });
    },

    // http://jira.performix.ru/browse/AG-3474
    resizePopupWindowForMacOs: function () {
        var options = this.options;
        if (options.isSafariBrowser || options.isFirefoxBrowser || !options.isMacOs) {
            return;
        }
        setTimeout(function () {
            var block = $(".macoshackresize");
            block.css("padding-top", "23px");
        }, 1000);
    }
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
        var timeout = controller.options.isSafariBrowser ? 150 : 10;
        setTimeout(function () {
            controller.resizePopupWindow();
            controller.resizePopupWindowForMacOs();
        }, timeout);
    };

    document.addEventListener('resizePopup', function () {
        controller.resizePopupWindow();
    });

    popupPage.sendMessage({type: 'getTabInfoForPopup'}, function (message) {
        $(document).ready(function () {
            controller.render(message.frameInfo, message.options);
        });
    });

})();
