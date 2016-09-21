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
var {Cu, Cc, Ci} = require('chrome');

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

var self = require('sdk/self');

var WorkaroundUtils = require('./utils/workaround').WorkaroundUtils;
var UiUtils = require('./uiUtils').UiUtils;
var styleService = require('./styleSheetService');
var contentScripts = require('./contentScripts').contentScripts;

/**
 * Object that manages toolbar button rendering.
 */
var PopupButton = exports.PopupButton = {

    TOOLBAR_BUTTON_ID: 'adguard-toggle-button',
    TOOLBAR_BUTTON_CLASS: 'adguard-button-woGqijnGG4UnPRJdhIaw',
    _sdkButtonId: null,

    ICON_GRAY: {
        '16': self.data.url('content/skin/firefox-gray-16.png'),
        '32': self.data.url('content/skin/firefox-gray-32.png')
    },
    ICON_BLUE: {
        '16': self.data.url('content/skin/firefox-blue-16.png'),
        '32': self.data.url('content/skin/firefox-blue-32.png')
    },
    ICON_GREEN: {
        '16': self.data.url('content/skin/firefox-16.png'),
        '32': self.data.url('content/skin/firefox-32.png')
    },

    init: function (UI, SdkPanel, SdkButton) {

        this.UI = UI;
        this.SdkPanel = SdkPanel;
        this.SdkButton = SdkButton;

        //sdk panel doesn't loaded
        if (!this.SdkPanel) {
            return;
        }

        //sdk button doesn't loaded
        if (!this.SdkButton) {
            return;
        }

        this.initToolbarButtonAndPanel();
    },

    initToolbarButtonAndPanel: function () {

        var panel = this.SdkPanel({
            contentURL: self.data.url('content/popup.html'),
            contentScriptFile: [
                self.data.url('content/libs/jquery-1.8.3.min.js'),
                self.data.url('content/content-script/content-script.js'),
                self.data.url('content/content-script/i18n-helper.js'),
                self.data.url('content/pages/i18n.js'),
                self.data.url('content/pages/popup-controller.js'),
                self.data.url('content/pages/script.js'),
                self.data.url('content/content-script/panel-popup.js')
            ],
            contentScriptOptions: contentScripts.getContentScriptOptions(),
            contentScriptWhen: 'ready',
            onHide: function () {
                this.UI.updateCurrentTabButtonState();
                button.state('window', {checked: false});
            }.bind(this),
            onShow: function () {
                // Force resize panel popup
                contentScripts.sendMessageToWorker(panel, {type: 'resizePanelPopup'});
            }
        });

        var button = this.SdkButton({
            id: this.TOOLBAR_BUTTON_ID,
            label: 'Adguard',
            icon: this.ICON_GRAY,
            onChange: function (state) {
                if (state.checked) {
                    var tabInfo = this.UI.getCurrentTabInfo();
                    var filteringInfo = this.UI.getCurrentTabFilteringInfo();
                    contentScripts.sendMessageToWorker(panel, {type: 'initPanelPopup', tabInfo: tabInfo, filteringInfo: filteringInfo});
                    panel.show({position: button});
                }
            }.bind(this)
        });
        this.toolbarButton = button;

        var UI = this.UI;

        contentScripts.addContentScriptMessageListener(panel, function (message) {
            switch (message.type) {
                case 'addWhiteListDomain':
                    UI.whiteListCurrentTab();
                    if (UI.isCurrentTabAdguardDetected()) {
                        panel.hide();
                    }
                    break;
                case 'removeWhiteListDomain':
                    UI.unWhiteListCurrentTab();
                    if (UI.isCurrentTabAdguardDetected()) {
                        panel.hide();
                    }
                    break;
                case 'changeApplicationFilteringDisabled':
                    UI.changeApplicationFilteringDisabled(message.disabled);
                    break;
                case 'openSiteReportTab':
                    UI.openSiteReportTab(message.url);
                    panel.hide();
                    break;
                case 'openSettingsTab':
                    UI.openSettingsTab();
                    panel.hide();
                    break;
                case 'openAssistant':
                    UI.openAssistant();
                    panel.hide();
                    break;
                case 'openTab':
                    UI.openTab(message.url);
                    panel.hide();
                    break;
                case 'openAbusePanel':
                    UI.openAbusePanel();
                    panel.hide();
                    break;
                case 'openFilteringLog' :
                    //cause filtering log open in new window, we need hide panel before for properly set checked state
                    panel.hide();
                    UI.openFilteringLog(message.tabId);
                    break;
                case 'resetBlockedAdsCount':
                    UI.resetBlockedAdsCount();
                    panel.hide();
                    break;
                case 'resizePanelPopup':
                    panel.resize(message.width, message.height);
                    break;
            }
        });

        //register sheet for badge
        styleService.loadUserSheet(self.data.url('content/skin/badge.css'));
    },

    /**
     * Update button badge text
     * @param blocked - count of blocked ads
     */
    updateBadgeText: function (blocked) {
        var toolbarButton = this._getToolbarButtonEl();
        if (!toolbarButton) {
            return;
        }
        this._customizeToolbarButton(toolbarButton);
        var blockedText = WorkaroundUtils.getBlockedCountText(blocked);
        toolbarButton.setAttribute('countBlocked', blockedText);
    },

    /**
     * Update button icon
     * @param options - icon display options
     */
    updateIconState: function (options) {
        if (!this.toolbarButton) {
            return;
        }
        var icon;
        if (options.disabled) {
            icon = this.ICON_GRAY;
        } else if (options.adguardDetected) {
            icon = this.ICON_BLUE;
        } else {
            icon = this.ICON_GREEN;
        }
        this.toolbarButton.icon = icon;
    },

    /**
     * Add some css classes to button element
     * @private
     */
    _customizeToolbarButton: function (buttonEl) {

        if (buttonEl.classList.contains(this.TOOLBAR_BUTTON_CLASS)) {
            return;
        }

        var classes = this._getPopupButtonClasses();
        if (!classes) {
            return;
        }
        for (var i = 0; i < classes.length; i++) {
            buttonEl.classList.add(classes[i]);
        }
    },

    _getToolbarButtonEl: function () {
        var win = UiUtils.getMostRecentWindow();
        if (!win) {
            return null;
        }
        if (this._sdkButtonId) {
            return win && win.document.getElementById(this._sdkButtonId);
        } else {
            var sdkButton = this._findToolbarButtonElBySdkId(this.TOOLBAR_BUTTON_ID);
            if (sdkButton) {
                this._sdkButtonId = sdkButton.id;
            }
            return sdkButton;
        }
    },

    /**
     * Returns collection of classes for popup button
     * @private
     */
    _getPopupButtonClasses: function () {

        if (this.popupButtonClasses) {
            return this.popupButtonClasses;
        }

        var window = UiUtils.getMostRecentWindow();
        if (!window) {
            return;
        }

        this.popupButtonClasses = [];

        var platform = "";
        if (window.navigator.platform.indexOf("Mac") == 0) {
            platform = "mac";
        } else if (window.navigator.platform.indexOf("Linux") == 0) {
            platform = "linux";
        }

        this.popupButtonClasses.push(this.TOOLBAR_BUTTON_CLASS);
        if (platform) {
            this.popupButtonClasses.push(platform);
        }

        return this.popupButtonClasses;
    },

    _findToolbarButtonElBySdkId: function (buttonSdkId) {
        var win = UiUtils.getMostRecentWindow();
        var buttons = win.document.querySelectorAll("toolbarbutton");
        for (var i = 0; i < buttons.length; i++) {
            var button = buttons[i];
            if (button.id && button.id.indexOf(buttonSdkId) >= 0) {
                return button;
            }
        }
        return null;
    }
};
