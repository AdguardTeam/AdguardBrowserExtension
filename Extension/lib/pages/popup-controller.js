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

    _renderPopup: function (tabInfo) {

        var parent = $('.widjet-popup');
        parent.empty();

        // top block
        this.notificationTemplate = this._getTemplate('notification-template');
        this.siteStatsTemplate = this._getTemplate('page-stats-template');
        this.adguardDetectedMessageTemplate = this._getTemplate('adguard-detected-message-template');
        this.siteFilteringDisabledMessageTemplate = this._getTemplate('site-filtering-disabled-message-template');
        this.siteProtectionDisabledMessageTemplate = this._getTemplate('site-protection-disabled-message-template');

        // middle block
        this.siteFilteringExceptionMessageTemplate = this._getTemplate('site-filtering-exception-message-template');
        this.siteFilteringStateTemplate = this._getTemplate('site-filtering-checkbox-template');

        // actions block
        this.assistantTemplate = this._getTemplate('open-assistant-template');
        this.abuseTemplate = this._getTemplate('open-abuse-template');
        this.siteReportTemplate = this._getTemplate('site-report-template');
        this.settingsTemplate = this._getTemplate('open-settings-template');
        this.protectionDisabledTemplate = this._getTemplate('protection-disabled-template');
        this.protectionEnabledTemplate = this._getTemplate('protection-enabled-template');

        // footer
        this.footerTemplate = this._getTemplate('popup-footer-template');
        this.footerIntegrationTemplate = this._getTemplate('popup-footer-integration-template');

        // render
        this._renderTopMessageBlock(parent, tabInfo);
        this._renderNotificationBlock(parent, this.options);
        this._renderSiteExceptionBlock(parent, tabInfo);
        this._renderFilteringCheckboxBlock(parent, tabInfo);
        this._renderActionsBlock(parent, tabInfo);
        this._renderFooter(parent, tabInfo);
    },

    _getTemplate: function (id) {
        return $('#' + id).children().clone();
    },

    _renderTopMessageBlock: function (parent, tabInfo) {

        function formatNumber(v) {
            return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        }

        var template;
        if (tabInfo.adguardDetected) {
            template = this.adguardDetectedMessageTemplate;
            if (tabInfo.adguardProductName) {
                i18n.translateElement(template.children()[0], 'popup_ads_has_been_removed_by_adguard', [tabInfo.adguardProductName]);
            } else {
                i18n.translateElement(template.children()[0], 'popup_ads_has_been_removed');
            }
        } else if (tabInfo.applicationFilteringDisabled) {
            template = this.siteProtectionDisabledMessageTemplate;
        } else if (tabInfo.urlFilteringDisabled) {
            template = this.siteFilteringDisabledMessageTemplate;
        } else if (this.options.showStatsSupported) {
            template = this.siteStatsTemplate;
            var titleBlocked = template.find('.w-popup-filter-title-blocked');
            i18n.translateElement(titleBlocked[0], 'popup_tab_blocked', [formatNumber(tabInfo.totalBlockedTab || 0)]);
            i18n.translateElement(template.find('.w-popup-filter-title-blocked-all')[0], 'popup_tab_blocked_all', [formatNumber(tabInfo.totalBlocked || 0)]);
            if (tabInfo.totalBlocked >= 10000000) {
                titleBlocked.closest('.widjet-popup-filter').addClass('db');
            } else {
                titleBlocked.closest('.widjet-popup-filter').removeClass('db');
            }
        }
        parent.append(template);
    },

    _renderNotificationBlock: function (parent, options) {
        // Do not show notification if there is no notification
        if (!options.notification) {
            return;
        }

        // Do not show notification if there is no localisation for it
        const {
            id,
            bgColor,
            textColor,
            text,
        } = options.notification;

        if (!text) {
            return;
        }

        const notificationTitleNode = this.notificationTemplate.find('.w-popup-filter-title').eq(0);
        notificationTitleNode.html(text);
        this.notificationTemplate.css({ background: bgColor, color: textColor });
        const cross = this.notificationTemplate.find('#cross-wr').eq(0);
        cross.attr('stroke', textColor);
        parent.append(this.notificationTemplate);

        // Schedule notification removal
        popupPage.sendMessage({ type: 'setNotificationViewed', withDelay: true });
    },

    _renderSiteExceptionBlock: function (parent, tabInfo) {
        if (tabInfo.urlFilteringDisabled || tabInfo.applicationFilteringDisabled) {
            return;
        }

        var template;
        if (tabInfo.documentWhiteListed && !tabInfo.userWhiteListed) {
            template = this.siteFilteringExceptionMessageTemplate;
        }

        if (template) {
            parent.append(template);
        }
    },

    _renderFilteringCheckboxBlock: function (parent, tabInfo) {

        if (tabInfo.urlFilteringDisabled || tabInfo.applicationFilteringDisabled) {
            return;
        }

        var template = this.siteFilteringStateTemplate;
        var checkbox = template.find('#siteFilteringDisabledCheckbox');
        if (tabInfo.canAddRemoveRule) {
            if (tabInfo.documentWhiteListed) {
                checkbox.removeAttr('checked');
            } else {
                checkbox.attr('checked', 'checked');
            }
            checkbox.toggleCheckbox();
            parent.append(template);
        }
    },

    _renderActionsBlock: function (parent, tabInfo) {

        var el = $('<nav>', { class: 'widjet-popup-menu' });

        if (!tabInfo.adguardDetected && !tabInfo.urlFilteringDisabled) {
            if (tabInfo.applicationFilteringDisabled) {
                el.append(this.protectionDisabledTemplate);
            } else {
                el.append(this.protectionEnabledTemplate);
            }
        }

        if (!tabInfo.urlFilteringDisabled) {
            el.append(this.assistantTemplate);
            if (tabInfo.applicationFilteringDisabled || tabInfo.documentWhiteListed) {
                //may be show later
                this.assistantTemplate.hide();
            }
        }

        if (!tabInfo.urlFilteringDisabled) {
            el.append(this.abuseTemplate);
        }

        if (!tabInfo.urlFilteringDisabled && !tabInfo.applicationFilteringDisabled) {
            el.append(this.siteReportTemplate);
        }

        if (!tabInfo.adguardDetected) {
            el.append(this.settingsTemplate);
        }

        parent.append(el);
    },

    _renderFooter: function (parent, tabInfo) {
        if (tabInfo.adguardDetected) {
            parent.append(this.footerIntegrationTemplate);
        } else {
            parent.append(this.footerTemplate);
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
        parent.on('click', '.openNotificationLink', function (e) {
            e.preventDefault();
            const { url } = self.options.notification;
            if (url) {
                self.openLink(url);
                popupPage.sendMessage({ type: 'setNotificationViewed', withDelay: false });
                popupPage.closePopup();
            }
        });
        parent.on('click', '.closeNotification', function (e) {
            e.preventDefault();
            var notification = parent.find('#popup-notification');
            if (notification) {
                notification.hide();
                popupPage.sendMessage({ type: 'setNotificationViewed', withDelay: false });
            }
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
        parent.on('click', '.openAbuse', function (e) {
            e.preventDefault();
            self.openAbuseTab(self.tabInfo.url);
            popupPage.closePopup();
        });

        //checkbox
        parent.on('change', '#siteFilteringDisabledCheckbox', function () {
            var tabInfo = self.tabInfo;
            var isWhiteListed = !this.checked;
            if (isWhiteListed) {
                self.addWhiteListDomain(tabInfo.url);
            } else {
                self.removeWhiteListDomain(tabInfo.url);
            }
            tabInfo.documentWhiteListed = isWhiteListed;
            tabInfo.userWhiteListed = isWhiteListed;
            if (isWhiteListed) {
                self.assistantTemplate.hide();
            } else {
                self.assistantTemplate.show();
            }
            self.resizePopupWindow();

            if (tabInfo.adguardDetected) {
                popupPage.closePopup();
            }
        });

        //pause/unpause protection
        parent.on('click', '.changeProtectionState', function (e) {

            e.preventDefault();

            var tabInfo = self.tabInfo;

            var disabled = !tabInfo.applicationFilteringDisabled;
            self.changeApplicationFilteringDisabled(disabled);

            tabInfo.applicationFilteringDisabled = disabled;
            self._renderPopup(tabInfo);
            self.resizePopupWindow();
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

    popupPage.sendMessage({ type: 'getTabInfoForPopup' }, function (message) {
        $(document).ready(function () {
            controller.render(message.frameInfo, message.options);
        });
    });
})();
