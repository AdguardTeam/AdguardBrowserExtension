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

/**
 * Controller that manages add-on popup window
 */
var PopupController = function (options) {
	if (options) {
		this.platform = options.platform;
		this.abusePanelSupported = options.abusePanelSupported;
		this.showStatsSupported = options.showStatsSupported;
	}
	//bind actions
	this._bindActions();
	this._initFeedback();
};

PopupController.prototype = {

	/**
	 * Renders popup using specified model object
	 * @param tabInfo
	 * @param filteringInfo
	 */
	render: function (tabInfo, filteringInfo) {

		this.tabInfo = tabInfo;
		this.filteringInfo = filteringInfo;

		//render
		this._renderPopup(tabInfo, filteringInfo);

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

	openAbusePanel: function () {

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
		parent.empty();

		//top block
		this.siteStatsTemplate = this._getTemplate('page-stats-template');
		this.adguardDetectedMessageTemplate = this._getTemplate('adguard-detected-message-template');
		this.siteFilteringDisabledMessageTemplate = this._getTemplate('site-filtering-disabled-message-template');
		this.siteProtectionDisabledMessageTemplate = this._getTemplate('site-protection-disabled-message-template');

		//middle block
		this.siteFilteringExceptionMessageTemplate = this._getTemplate('site-filtering-exception-message-template');
		this.siteFilteringStateTemplate = this._getTemplate('site-filtering-checkbox-template');

		//actions block
		this.assistantTemplate = this._getTemplate('open-assistant-template');
		this.abuseTemplate = this._getTemplate('open-abuse-template');
		this.siteReportTemplate = this._getTemplate('site-report-template');
		this.settingsTemplate = this._getTemplate('open-settings-template');
		this.protectionDisabledTemplate = this._getTemplate('protection-disabled-template');
		this.protectionEnabledTemplate = this._getTemplate('protection-enabled-template');

		//footer
		this.footerTemplate = this._getTemplate('popup-footer-template');
		this.footerIntegrationTemplate = this._getTemplate('popup-footer-integration-template');

		//render
		this._renderTopMessageBlock(parent, tabInfo);
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
				i18n.translateElement(template.children()[0], 'popup_ads_has_been_removed_by_adguard', [tabInfo.adguardProductName])
			} else {
				i18n.translateElement(template.children()[0], 'popup_ads_has_been_removed');
			}
		} else if (tabInfo.applicationFilteringDisabled) {
			template = this.siteProtectionDisabledMessageTemplate;
		} else if (tabInfo.urlFilteringDisabled) {
			template = this.siteFilteringDisabledMessageTemplate;
		} else if (this.showStatsSupported == null || this.showStatsSupported) {
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

		var el = $('<nav>', {class: 'widjet-popup-menu'});

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

		if (this.abusePanelSupported && !tabInfo.urlFilteringDisabled) {
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
			var tabId;
			var filteringInfo = self.filteringInfo;
			if (filteringInfo && filteringInfo.isHttp) {
				tabId = filteringInfo.tabId;
			}
			self.openFilteringLog(tabId);
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
		});

		//pause/unpause protection
		parent.on('click', '.changeProtectionState', function (e) {

			e.preventDefault();

			var tabInfo = self.tabInfo;
			var filteringInfo = self.filteringInfo;

			var disabled = !tabInfo.applicationFilteringDisabled;
			self.changeApplicationFilteringDisabled(disabled);

			tabInfo.applicationFilteringDisabled = disabled;
			self._renderPopup(tabInfo, filteringInfo);
			self.resizePopupWindow();
		});
	},

	_initFeedback: function () {

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
			if (self.platform == 'firefox') {
				self.openAbusePanel();
			} else {
				parent.addClass('hidden');
				feedbackModal.removeClass('hidden');
				self.resizePopupWindow();
			}

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
