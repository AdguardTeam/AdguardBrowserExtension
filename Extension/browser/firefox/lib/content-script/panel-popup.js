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

var controller = new PopupController({
	platform: 'firefox',
	abusePanelSupported: true
});

//override
controller.afterRender = function () {
	//resize popup
	controller.resizePopupWindow();
};
controller.resizePopup = function (width, height) {
	self.port.emit('resizePanelPopup', {width: width, height: height});
};
//popup checkbox actions
controller.addWhiteListDomain = function (url) {
	self.port.emit('addWhiteListDomain', {url: url});
};
controller.removeWhiteListDomain = function (url) {
	self.port.emit('removeWhiteListDomain', {url: url});
};
controller.changeApplicationFilteringDisabled = function(disabled){
	self.port.emit('changeApplicationFilteringDisabled', {disabled: disabled});
};
//popup menu actions
controller.openSiteReportTab = function (url) {
	self.port.emit('openSiteReportTab', {url: url});
};
controller.openSettingsTab = function () {
	self.port.emit('openSettingsTab');
};
controller.openAssistantInTab = function () {
	self.port.emit('openAssistant');
};
controller.openLink = function (url) {
	self.port.emit('openTab', {url: url});
};
controller.openAbusePanel = function () {
	self.port.emit('openAbusePanel');
};
controller.openFilteringLog = function (tabId) {
	self.port.emit('openFilteringLog', tabId);
};
controller.resetBlockedAdsCount = function () {
	self.port.emit('resetBlockedAdsCount');
};
controller.translateElement = function (el, messageId, args) {
	i18n.localizeElement(el, messageId, args);
};

self.port.on('initPanelPopup', function (message) {
	//render popup
	controller.render(message.tabInfo, message.filteringInfo);
});

self.port.on('resizePanelPopup', function () {
	controller.resizePopupWindow();
});

