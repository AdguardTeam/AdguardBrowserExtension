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

/* global $, i18n */

/**
 * Controller that manages add-on popup window
 */
var PopupController = function (options) {
    if (options) {
        this.platform = options.platform;
        this.showStatsSupported = options.showStatsSupported;
    }
};

PopupController.prototype = {

    /**
     * Renders popup using specified model object
     * @param tabInfo
     */
    render: function (tabInfo) {

        this.tabInfo = tabInfo;

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
        this.resizePopup(width, height);
    },

    afterRender: function () {
    },

    resizePopup: function (width, height) {
    },

    addWhiteListDomain: function (url) {
    },

    removeWhiteListDomain: function (url) {
    },

    changeApplicationFilteringDisabled: function (disabled) {

    },

    sendFeedback: function (url, topic, comment) {
    },

    openSiteReportTab: function (url) {
    },

    openSettingsTab: function () {
    },

    openAssistantInTab: function () {
    },

    openFilteringLog: function (tabId) {
    },

    resetBlockedAdsCount: function () {

    },

    openLink: function (url) {
    },

    translateElement: function (el, messageId, args) {
    },

    _renderPopup: function (tabInfo) {

        var parent = $('.widjet-popup');
        //parent.empty();
        parent.find('.footer').remove();

        var stack = parent.find('.tabstack');

        var container = parent.find('.tab-main');
        container.empty();

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

        // Footer
        this.footerDefault = this._getTemplate('footer-default-template');
        this.footerIntegration = this._getTemplate('footer-integration-template');

        this._renderHeader(container, tabInfo);
        this._renderFilteringControls(container, tabInfo);
        this._renderStatus(container, tabInfo);
        this._renderActions(container, tabInfo);
        this._renderMessage(container, tabInfo);
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
        });
        parent.on('click', '.openSettings', function (e) {
            e.preventDefault();
            self.openSettingsTab();
        });
        parent.on('click', '.openAssistant', function (e) {
            e.preventDefault();
            self.openAssistantInTab();
        });
        parent.on('click', '.openFilteringLog', function (e) {
            e.preventDefault();
            self.openFilteringLog();
        });
        parent.on('click', '.resetStats', function (e) {
            e.preventDefault();
            self.resetBlockedAdsCount();
            parent.find('.w-popup-filter-title-blocked-all').text('0');
        });
        parent.on('click', '.openLink', function (e) {
            e.preventDefault();
            self.openLink(e.currentTarget.href);
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
    }
};
