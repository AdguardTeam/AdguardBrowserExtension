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
var AdguardAssistant = function ($) {

	var self = this;

	var i18n = {
		getMessage: function (id) {
			return self.localization[id];
		}
	};

	var settings = {
		iframeId: 'adguard-assistant-dialog',
		selectedElement: null,
		lastPreview: null
	};

	var constants = {
		iframe: {//maximum values for all browsers was leaved for compatibility
			baseWidth: 668,
			extendDetailedSettingsHeight: 503,
			detailedMenuHeight: 360,
			selectorMenuHeight: 213,
			topOffset: 25
		}
	};

	var utils = {
		getAllChildren: function (element) {
			var childArray = [];
			var child = element;
			while ((child = utils.getChildren(child))) {
				childArray.push(child);
			}
			return childArray;
		},

		getChildren: function (element) {
			var children = element.childNodes;
			if (children) {
				var count = 0;
				var child;
				var i;
				for (i = 0; i < children.length; i++) {
					if (children[i].nodeType == 1) {
						child = children[i];
						count++;
					}
				}
			}
			return count == 1 ? child : null;
		},

		getParentsLevel: function (element) {
			var parent = element;
			var parentArr = [];
			while ((parent = parent.parentNode) && utils.getNodeName(parent) != "BODY") {
				parentArr.push(parent);
			}
			return parentArr;
		},

		getNodeName: function (element) {
			return element && element.nodeName ? element.nodeName.toUpperCase() : "";
		}
	};

	var getMessage = function (msgId) {
		return self.localization[msgId];
	};

	/**
	 * Makes iframe draggable
	 *
	 * @param iframe
	 */
	var makeDraggable = function (iframe) {

		var iframeJ = findIframe();
		var dragHandle = findInIframe('#drag-handle');
		var $iframeDocument = $(iframe.contentDocument);

		var offset = Object.create(null);

		/**
		 * Generalized function to get position of an event (like mousedown, mousemove, etc)
		 *
		 * @param e
		 * @returns {{x: (Number|number), y: (Number|number)}}
		 */
		var getEventPosition = function (e) {
			if (!e) {
				e = window.event;
			}
			return {
				x: e.screenX,
				y: e.screenY
			};
		};

		/**
		 * Function that does actual "dragging"
		 *
		 * @param x
		 * @param y
		 */
		var drag = function (x, y) {
			var newPositionX = x;
			var newPositionY = y;
			// Don't drag it off the top or left of the screen?
			if (newPositionX < 0) {
				newPositionX = 0;
			}
			if (newPositionY < 0) {
				newPositionY = 0;
			}

			iframeJ.css('left', newPositionX + 'px');
			iframeJ.css('top', newPositionY + 'px');
		};

		var cancelIFrameSelection = function (e) {
			e.preventDefault();
			e.stopPropagation();
		};

		var onMouseMove = function (e) {
			var eventPosition = getEventPosition(e);
			drag(eventPosition.x + offset.x, eventPosition.y + offset.y);
		};

		var onMouseDown = function (e) {

			var eventPosition = getEventPosition(e);
			var dragHandleEl = dragHandle.get(0);
			var rect = iframeJ.get(0).getBoundingClientRect();

			offset.x = rect.left + dragHandleEl.offsetLeft - eventPosition.x;
			offset.y = rect.top + dragHandleEl.offsetTop - eventPosition.y;

			$iframeDocument.on('mousemove', onMouseMove);
			$iframeDocument.on('selectstart', cancelIFrameSelection);
		};

		var onMouseUp = function () {
			$iframeDocument.off('mousemove', onMouseMove);
			$iframeDocument.off('selectstart', cancelIFrameSelection);
		};

		dragHandle.on('mousedown', onMouseDown);
		$iframeDocument.on('mouseup', onMouseUp);
	};

	var getViewport = function () {
		return {
			width: window.innerWidth,
			height: window.innerHeight
		}
	};

	var getPositionsForIframe = function (offset, viewPort, height, width) {
		return {
			left: viewPort.width - width - offset,
			top: offset
		};
	};

	var createIframe = function (width, height, dfd) {
		var viewPort = getViewport();
		var positions = getPositionsForIframe(constants.iframe.topOffset, viewPort, height, width);

		var iframe = document.createElement('iframe');
		iframe.setAttribute('id', settings.iframeId);
		iframe.setAttribute('class', 'sg_ignore adg-view-important');
		iframe.setAttribute('frameBorder', '0');
		iframe.setAttribute('allowTransparency', 'true');

		iframe.style.width = width + 'px';
		iframe.style.height = height + 'px';
		iframe.style.position = 'fixed';
		iframe.style.left = positions.left + 'px';
		iframe.style.top = positions.top + 'px';

		// Wait for iframe load and then apply styles
		$(iframe).on('load', loadDefaultScriptsAndStyles.bind(null, iframe, dfd));
		document.body.appendChild(iframe);

		return iframe;
	};

	var loadDefaultScriptsAndStyles = function (iframe, dfd) {

		// Chrome doesn't inject scripts in empty iframe
		try {
			var doc = iframe.contentDocument;
			doc.open();
			doc.write("<html><head></head></html>");
			doc.close();
		} catch (ex) {
			// Ignore (does not work in FF)
		}

		contentPage.sendMessage({type: 'loadAssistant'}, function (response) {

			if (response.localization) {
				self.localization = response.localization;
			}

			var cssContent = response.cssContent;
			var cssLink = response.cssLink;

			var iframe = document.getElementById(settings.iframeId);
			var head = iframe.contentDocument.getElementsByTagName('head')[0];

			if (cssContent) {
				var style = document.createElement("style");
				style.type = "text/css";
				style.textContent = cssContent;
				head.appendChild(style);
			}
			if (cssLink) {
				var link = document.createElement("link");
				link.type = "text/css";
				link.rel = "stylesheet";
				link.href = cssLink;
				head.appendChild(link);
			}
			dfd.resolve();
		});
	};

	var findIframe = function () {
		return $('#' + settings.iframeId);
	};

	var findInIframe = function (selector) {
		return $(findIframe().get(0).contentDocument.querySelectorAll(selector));
	};

	var runCallbacks = function (iframe, beforeUnhide, afterUnhide) {
		if (beforeUnhide) {
			beforeUnhide(iframe);
		}
		makeDraggable(iframe);
		findInIframe('body').removeClass('adg-hide');
		if (afterUnhide) {
			afterUnhide(iframe);
		}
	};

	/**
	 * Shows dialog window (create iframe dynamically)
	 *
	 * @param content
	 * @param width
	 * @param height
	 * @param beforeUnhide
	 * @param afterUnhide
	 */
	var showDialog = function (content, width, height, beforeUnhide, afterUnhide) {
		var appendContent = function () {
			appendContentToIframe(iframe, content);
			runCallbacks(iframe, beforeUnhide, afterUnhide);
			checkPosition();
		};

		var existIframe = findIframe();
		if (existIframe.length > 0) {
			iframe = existIframe.get(0);
			changeCurrentIframe(width, height, iframe);
			appendContent();
			return;
		}

		var dfd = new Deferred();
		dfd.done(appendContent);
		var iframe = createIframe(width, height, dfd);
	};

	var changeCurrentIframe = function (width, height, iframe) {
		iframe.style.width = width + 'px';
		iframe.style.height = height + 'px';
	};

	var appendContentToIframe = function (iframe, content) {
		var body = iframe.contentDocument.body;
		for (var i = 0; i < body.children.length; i++) {
			body.removeChild(body.children[i]);
		}

		body.appendChild(content.get(0));
		findInIframe('body').addClass('adg-hide');
	};


	var bindClicks = function (iframe, events) {
		for (var event in events) {
			$(iframe.contentDocument.querySelectorAll(event)).on('click', events[event]);
		}
	};

	var onSelectElementClicked = function (e) {
		e.preventDefault();

		var dfd = new Deferred();
		dfd.done(function () {
			localizeMenu();
			removePreview();
			startSelector();
		});

		showSelectorMenu(dfd);
	};

	var onCancelSelectModeClicked = function (e) {
		e.preventDefault();

		removePreview();
		cancelSelectMode();
		closeAssistant();
	};

	/**
	 * Cancels select mode, removes all elements using for selecting
	 */
	var cancelSelectMode = function () {
		AdguardSelectorLib.close();
	};

	var onElementSelected = function (element) {
		settings.selectedElement = element;
		settings.elementInfo = AdguardRulesConstructorLib.getElementInfo(element);

		showHidingRuleWindow(element, settings.elementInfo.haveUrlBlockParameter, settings.elementInfo.haveClassAttribute);
	};

	var closeAssistant = function () {
		cancelSelectMode();
		findIframe().remove();
	};

	/**
	 * Starts AdguardSelector work
	 */
	var startSelector = function () {
		// Initializing AdguardSelector with default configuration
		//AdguardSelectorLib.reset();
		AdguardSelectorLib.init(onElementSelected);
	};

	var setFilterRuleInputText = function (ruleText) {
		findInIframe('#filter-rule').get(0).value = ruleText;
	};

	var localizeMenu = function () {
		var elements = findInIframe("[i18n]");
		for (var i = 0; i < elements.length; i++) {
			var message = getMessage(elements[i].getAttribute("i18n"));
			I18nHelper.translateElement(elements[i], message);
		}

		//TODO: Remove after all translations update
		findInIframe('#blockSimilar').hide();
		findInIframe('#blockByUrl').hide();
		findInIframe('#oneDomainRadio').hide();
	};

	var createAdguardDetailedMenu = function () {
		return $('<div class="main">' +
			'<div class="close adg-close"></div>' +
			'<div class="head" id="drag-handle">' +
			'	<div i18n="assistant_block_element" class="head_title" id="head_title"></div>' +
			'	<div i18n="assistant_block_element_explain" class="head_text" id="head_text"></div>' +
			'</div>' +
			'<div class="content">' +
			'	<div class="element-rule">' +
			'		<div i18n="assistant_slider_explain" class="element-rule_text"></div>' +
			'		<div class="element-rule_slider">' +
			'			<div class="adg-slide" id="slider">' +
			'				<div class="adg-slide-clue-max">MIN</div>' +
			'				<div class="adg-slide-clue-min">MAX</div>' +
			'			</div>' +
			'		</div>' +
			'		<div class="element-rule_more">' +
			'			<span class="element-rule_expand-link" id="adg-show-adv-settings">' +
			'				<span i18n="assistant_extended_settings" class="element-rule_expand-link_txt"></span>' +
			'				<span class="element-rule_expand-link_arr"></span>' +
			'			</span>' +
			'		</div>' +
			'		<div class="element-rule_form" id="adv-settings">' +
			'			<div class="element-rule_form-cont">' +
			'				<div class="element-rule_fieldset" id="one-domain-checkbox-block">' +
			'					<input class="form-ui-control" id="one-domain-checkbox" type="checkbox"/>' +
			'					<label for="one-domain-checkbox" class="form-ui">' +
			'						<span i18n="assistant_apply_rule_to_all_sites" class="form-ui-txt"></span>' +
			'					</label>' +
			'				</div>' +
			'				<div style="display: none;" class="element-rule_fieldset" id="block-by-url-checkbox-block">' +
			'					<input class="form-ui-control" id="block-by-url-checkbox" type="checkbox"/>' +
			'					<label for="block-by-url-checkbox" class="form-ui">' +
			'						<span i18n="assistant_block_by_reference" class="form-ui-txt"></span>' +
			'					</label>' +
			'				</div>' +
			'				<div style="display: none;" class="element-rule_fieldset" id="block-similar-checkbox-block">' +
			'					<input class="form-ui-control" id="block-similar-checkbox" type="checkbox"/>' +
			'					<label for="block-similar-checkbox" class="form-ui">' +
			'						<span i18n="assistant_block_similar" class="form-ui-txt"></span>' +
			'					</label>' +
			'				</div>' +
			'				<div class="element-rule_fieldset">' +
			'					<input class="form-control" id="filter-rule" type="text"/>' +
			'				</div>' +
			'			</div>' +
			'		</div>' +
			'	</div>' +
			'</div>' +
			'<div class="foot">' +
			'	<button i18n="assistant_another_element" type="button" class="btn btn-default" id="adg-cancel"></button>' +
			'	<div class="foot_action">' +
			'		<div class="foot_action_btn">' +
			'			<button i18n="assistant_preview" type="button" class="btn btn-primary" id="adg-preview"></button>' +
			'			<button i18n="assistant_block" type="button" class="btn btn-cancel" id="adg-accept"></button>' +
			'		</div>' +
			'	</div>' +
			'</div>' +
			'</div>');

	};

	var createAdguardSelectorMenu = function () {
		return $('<div class="main sg_ignore">' +
			'<div class="close adg-close" id="close-button"></div>' +
			'<div class="head" id="drag-handle">' +
			'	<div i18n="assistant_select_element" class="head_title"></div>' +
			'	<div i18n="assistant_select_element_ext" class="head_text"></div>' +
			'</div>' +
			'<div class="foot">' +
			'	<button i18n="assistant_select_element_cancel" type="button" class="btn btn-default" id="cancel-select-mode"></button>' +
			'</div>' +
			'</div>');
	};

	var showDetailedMenu = function (dfd) {
		var content = createAdguardDetailedMenu();
		showDialog(content, constants.iframe.baseWidth, constants.iframe.detailedMenuHeight, function (iframe) {
			bindClicks(iframe, {
				'#close-button': onCancelSelectModeClicked,
				'.adg-close': onCancelSelectModeClicked,
				'#one-domain-checkbox-block': onScopeChange,
				'#block-by-url-checkbox-block': onScopeChange,
				'#block-similar-checkbox-block': onScopeChange,
				'#adg-cancel': onSelectElementClicked,
				'#adg-preview': onRulePreview,
				'#adg-accept': onRuleAccept,
				'#adg-show-adv-settings': onExtendDetailedSettings
			});
			dfd.resolve();
		}, function () {
			localizeMenu();
		});
	};

	/**
	 * Shows Adguard selector menu
	 */
	var showSelectorMenu = function (dfd) {
		var content = createAdguardSelectorMenu();

		showDialog(content, constants.iframe.baseWidth, constants.iframe.selectorMenuHeight, function (iframe) {
			bindClicks(iframe, {
				'#cancel-select-mode': onCancelSelectModeClicked,
				'.adg-close': onCancelSelectModeClicked
			});
			dfd.resolve();
		}, null);
	};

	var showHidingRuleWindow = function (element, urlBlock, blockSimilar) {
		var dfd = new Deferred();
		dfd.done(function () {
			createSlider(element);

			AdguardSelectorLib.selectElement(element);

			onScopeChange();
			handleShowBlockSettings(urlBlock, blockSimilar);
		});

		showDetailedMenu(dfd);
	};

	var resizeIframe = function (width, height) {
		var iframe = findIframe().get(0);

		if (height) {
			iframe.style.height = height + "px";
		}

		if (width) {
			iframe.style.width = width + "px";
		}

		checkPosition();
	};

	var checkPosition = function () {
		var winHeight = window.innerHeight;
		var bottom = document.body.scrollTop + winHeight;

		var iframe = findIframe().get(0);
		var offsetTop = iframe.getBoundingClientRect().top + document.body.scrollTop;
		var height = iframe.offsetHeight;
		if (offsetTop + height > bottom) {
			var top = winHeight - height - constants.iframe.topOffset;
			if (top < 0) {
				top = constants.iframe.topOffset;
			}
			iframe.style.top = top + 'px';
		}
	};

	var onExtendDetailedSettings = function () {
		var hidden = !(findInIframe('#adv-settings').hasClass("open"));
		if (hidden) {
			resizeIframe(null, constants.iframe.extendDetailedSettingsHeight);
			findInIframe('#adv-settings').addClass('open');
			findInIframe('#adg-show-adv-settings').addClass('active');
		} else {
			resizeIframe(null, constants.iframe.detailedMenuHeight);
			findInIframe('#adv-settings').removeClass('open');
			findInIframe('#adg-show-adv-settings').removeClass('active');
		}
	};

	var createSlider = function (element) {
		var parents = utils.getParentsLevel(element);
		var children = utils.getAllChildren(element);
		var value = Math.abs(parents.length + 1);
		var max = parents.length + children.length + 1;
		var min = 1;
		var options = {value: value, min: min, max: max};

		if (min == max) {
			//hide slider
			findInIframe('#slider').hide();

			var el = findInIframe('.element-rule_text').get(0);
			el.removeAttribute('i18n');
			el.innerHTML = getMessage("assistant_slider_if_hide");

			return;
		}

		options.onSliderMove = function (delta) {
			var elem;
			if (delta > 0) {
				elem = parents[delta - 1];
			}
			if (delta == 0) {
				elem = element;
			}
			if (delta < 0) {
				elem = children[Math.abs(delta + 1)];
			}
			onSliderMove(elem);
		};

		SliderWidget.init(findInIframe("#slider").get(0), {
			min: options.min,
			max: options.max,
			value: options.value,
			onValueChanged: function (value) {
				var delta = options.value - value;
				options.onSliderMove(delta);
			}
		});
	};

	var handleShowBlockSettings = function (showBlockByUrl, showBlockSimilar) {
		if (showBlockByUrl) {
			findInIframe('#block-by-url-checkbox-block').show();
		} else {
			findInIframe('#block-by-url-checkbox').get(0).checked = false;
			findInIframe('#block-by-url-checkbox-block').hide();
		}
		if (showBlockSimilar) {
			findInIframe('#block-similar-checkbox-block').show();
		} else {
			findInIframe('#block-similar-checkbox').get(0).checked = false;
			findInIframe('#block-similar-checkbox-block').hide();
		}
	};

	var onSliderMove = function (element) {
		removePreview();

		settings.selectedElement = element;
		settings.elementInfo = AdguardRulesConstructorLib.getElementInfo(element);
		AdguardSelectorLib.selectElement(element);

		makeDefaultCheckboxesForDetailedMenu();
		onScopeChange();
		handleShowBlockSettings(settings.elementInfo.haveUrlBlockParameter, settings.elementInfo.haveClassAttribute);
	};

	var makeDefaultCheckboxesForDetailedMenu = function () {
		findInIframe('#block-by-url-checkbox').get(0).checked = false;
		findInIframe('#block-similar-checkbox').get(0).checked = false;
		findInIframe('#one-domain-checkbox').get(0).checked = false;
	};

	var onRulePreview = function (e) {
		if (e) {
			e.preventDefault();
		}

		if (settings.lastPreview) {
			// On finish preview and come back to selected
			removePreview();
			findInIframe('#head_title').text(getMessage("assistant_block_element"));
			findInIframe('#head_text').text(getMessage("assistant_block_element_explain"));
			findInIframe('#adg-preview').text(getMessage("assistant_preview_start"));

			AdguardSelectorLib.selectElement(settings.selectedElement);

			findInIframe('.content').show();

			return;
		}

		hideElement();

		findInIframe('#head_title').text(getMessage("assistant_preview_header"));
		findInIframe('#head_text').text(getMessage("assistant_preview_header_info"));
		findInIframe('#adg-preview').text(getMessage("assistant_preview_end"));
		findInIframe('.content').hide();
	};

	var hideElement = function () {
		AdguardSelectorLib.reset();

		var ruleText = findInIframe('#filter-rule').get(0).value;
		var selector = AdguardRulesConstructorLib.constructRuleCssSelector(ruleText);
		if (!selector) {
			return;
		}

		var style = document.createElement("style");
		style.setAttribute("type", "text/css");
		settings.lastPreview = style;

		var head = document.getElementsByTagName('head')[0];
		if (head) {
			style.appendChild(document.createTextNode(selector + " {display: none !important;}"));
			head.appendChild(style);
		}
	};

	var removePreview = function () {
		if (settings.lastPreview == null) {
			return;
		}

		var head = document.getElementsByTagName("head")[0];
		if (head) {
			head.removeChild(settings.lastPreview);
		}

		settings.lastPreview = null;
	};

	var onScopeChange = function () {

		var isBlockByUrl = findInIframe('#block-by-url-checkbox').get(0).checked;
		var isBlockSimilar = findInIframe("#block-similar-checkbox").get(0).checked;
		var isBlockOneDomain = findInIframe("#one-domain-checkbox").get(0).checked;

		handleShowBlockSettings(settings.elementInfo.haveUrlBlockParameter && !isBlockSimilar, settings.elementInfo.haveClassAttribute && !isBlockByUrl);

		var options = {
			urlMask: settings.elementInfo.urlBlockAttributeValue,
			isBlockOneDomain: isBlockOneDomain,
			ruleType: isBlockByUrl ? 'URL' : 'CSS',
			cssSelectorType: isBlockSimilar ? 'SIMILAR' : 'STRICT_FULL',
			url: document.location
		};

		var ruleText = AdguardRulesConstructorLib.constructRuleText(settings.selectedElement, options);
		setFilterRuleInputText(ruleText);
	};

	var onRuleAccept = function () {
		removePreview();
		onRulePreview();
		settings.lastPreview = null;

		var ruleText = findInIframe('#filter-rule').get(0).value;
		contentPage.sendMessage({type: 'addUserRule', ruleText: ruleText}, function () {
			closeAssistant();
		});
	};

	var windowChangeFix = function () {
		var reselectElement = function () {
			if (settings.selectedElement && !settings.lastPreview) {
				AdguardSelectorLib.selectElement(settings.selectedElement);
			}
		};

		$(window).on('resize', reselectElement);
		$(window).on('scroll', reselectElement);
	};
	windowChangeFix();

	this.init = function (options) {
		self.localization = options.localization;
		var dfd = new Deferred();
		dfd.done(function () {
			localizeMenu();
			removePreview();
			startSelector();
			//choose element for assistant
			if (options.selectedElement) {
				$(options.selectedElement).click();
			}
		});

		showSelectorMenu(dfd);
	};

	this.destroy = function () {
		removePreview();
		cancelSelectMode();
		closeAssistant();
	}
};
