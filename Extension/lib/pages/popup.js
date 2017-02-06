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

/* global $, PopupController */

// http://jira.performix.ru/browse/AG-3474
var resizePopupWindowForMacOs = function ($) {
    if (adguard.utils.browser.isSafariBrowser() || adguard.utils.browser.isFirefoxBrowser() || !adguard.utils.browser.isMacOs()) {
        return;
    }
    setTimeout(function () {
        var block = $(".macoshackresize");
        block.css("padding-top", "23px");
    }, 1000);
};

// Make global for popup-script.js (Safari Code)
var controller;
var tab;

//make global for other popup scripts;
$(document).ready(function () {

    adguard.tabs.getActive(function (t) {

        tab = t;

        var tabInfo = adguard.frames.getFrameInfo(tab);

        controller = new PopupController({
            platform: adguard.prefs.platform,
            showStatsSupported: !adguard.utils.browser.isContentBlockerEnabled()
        });

        //override
        controller.afterRender = function () {
            //add some delay for show popup size properly
            setTimeout(function () {
                controller.resizePopupWindow();
            }, 10);
            resizePopupWindowForMacOs($);
        };
        controller.resizePopup = function (width, height) {
            adguard.resizePopup(width, height);
        };
        //popup checkbox actions
        controller.addWhiteListDomain = function () {
            adguard.ui.whiteListTab(tab);
            if (tabInfo.adguardDetected) {
                adguard.closePopup();
            }
        };
        controller.removeWhiteListDomain = function () {
            adguard.ui.unWhiteListTab(tab);
            if (tabInfo.adguardDetected) {
                adguard.closePopup();
            }
        };
        controller.changeApplicationFilteringDisabled = function (disabled) {
            adguard.ui.changeApplicationFilteringDisabled(disabled);
        };
        //popup menu actions
        controller.openSiteReportTab = function (url) {
            adguard.ui.openSiteReportTab(url);
            adguard.closePopup();
        };
        controller.openSettingsTab = function () {
            adguard.ui.openSettingsTab();
            adguard.closePopup();
        };
        controller.openAssistantInTab = function () {
            adguard.ui.openAssistant();
            adguard.closePopup();
        };
        controller.openLink = function (url) {
            adguard.ui.openTab(url);
            adguard.closePopup();
        };
        controller.openFilteringLog = function (tabId) {
            adguard.ui.openFilteringLog(tabId);
            adguard.closePopup();
        };
        controller.resetBlockedAdsCount = function () {
            adguard.frames.resetBlockedAdsCount();
        };
        controller.sendFeedback = function (url, topic, comment) {
            adguard.backend.sendUrlReport(url, topic, comment);
        };

        //render popup
        controller.render(tabInfo);
    });
});