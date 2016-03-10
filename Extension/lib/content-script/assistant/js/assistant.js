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
var Adguard = function () {

	var self = this;

	var i18n = {
		getMessage: function (id) {
			return self.localization[id];
		}
	};

	var settings = {
		iframeId: 'adguard-assistant-dialog',
		path: null,
		selectedElement: null,
		lastPreview: null,
		cssRuleIndex: null,
		urlBlockAttributes: ["src", "data"],
		urlInfo: null,
		croppedDomain: null
	};

	var constants = {
		phishing: 'phishing',
		wrongRender: 'wrongRender',
		adMissing: 'adMissing',
		another: 'another',
		minComplaintMessageLength: 8,
		maxComplaintCommentLength: 500,
		iframe: {//maximum values for all browsers was leaved for compatibility
			baseWidth: 668,
			extendDetailedSettingsHeight: 503,
			detailedMenuHeight: 340,
			selectorMenuHeight: 213,
			topOffset: 25
		}
	};

	var utils = {
		getAllChilds: function (element) {
			var childArray = [];
			var child = element;
			while ((child = utils.getChildren(child))) {
				childArray.push(child);
			}
			return childArray;
		},

		getChildren: function (element) {
			var childs = element.childNodes;
			if (childs) {
				var count = 0;
				var child;
				var i;
				for (i = 0; i < childs.length; i++) {
					if (childs[i].nodeType == 1) {
						child = childs[i];
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
		},

		getUrl: function (url) {
			var pattern = "^(([^:/\\?#]+):)?(//(([^:/\\?#]*)(?::([^/\\?#]*))?))?([^\\?#]*)(\\?([^#]*))?(#(.*))?$";
			var rx = new RegExp(pattern);
			var parts = rx.exec(url);

			return {
				host: parts[4] || "",
				path: parts[7] || ""
			};
		},

		cropDomain: function (domain) {
			return domain.replace("www.", "");
		}
	};

	var getCroppedDomain = function () {
		if (!settings.croppedDomain) {
			settings.croppedDomain = utils.cropDomain(getUrlInfo().host);
		}
		return settings.croppedDomain;
	};

	var getUrlInfo = function () {
		if (!settings.urlInfo) {
			settings.urlInfo = utils.getUrl(document.location);
		}

		return settings.urlInfo;
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
		var $iframeDocument = $(iframe.get(0).contentDocument);

		var offset = Object.create(null);

		// Generalized function to get position of an event (like mousedown, mousemove, etc)
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

			iframeJ.css({
				left: newPositionX + 'px',
				top: newPositionY + 'px'
			});
		};

		var cancelIfameSelection = function (e) {
			e.preventDefault();
			e.stopPropagation();
		};

		var onMouseMove = function (e) {
			var eventPosition = getEventPosition(e);
			drag(eventPosition.x + offset.x, eventPosition.y + offset.y);
		};

		var onMouseDown = function (e) {

			var eventPosition = getEventPosition(e);
			offset.x = iframeJ.offset().left - $(window).scrollLeft() + dragHandle.position().left - eventPosition.x;
			offset.y = iframeJ.offset().top - $(window).scrollTop() + dragHandle.position().top - eventPosition.y;

			$iframeDocument.on('mousemove', onMouseMove);
			$iframeDocument.on('selectstart', cancelIfameSelection);
		};

		var onMouseUp = function () {
			$iframeDocument.off('mousemove', onMouseMove);
			$iframeDocument.off('selectstart', cancelIfameSelection);
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
		var cssStyle = {
			width: width,
			height: height,
			position: 'fixed',
			left: positions.left,
			top: positions.top
		};
		//for src
		var iframe = $('<iframe />"').attr({
			id: settings.iframeId,
			'class': 'sg_ignore adg-view-important',
			frameBorder: 0,
			allowTransparency: 'true'
		}).css(cssStyle);

		// Wait for iframe load and then apply styles
		iframe.on('load', loadDefaultScriptsAndStyles.bind(null, iframe, dfd));
		iframe.appendTo('body');

		return iframe;
	};

	var loadDefaultScriptsAndStyles = function (iframe, dfd) {

		// Chrome doesn't inject scripts in empty iframe
		try {
			var doc = iframe[0].contentDocument;
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

	var findIframe = function (iframeId) {
		if (iframeId) {
			return $('#' + iframeId);
		} else {
			return $('#' + settings.iframeId);
		}
	};

	var findInIframe = function (selector) {
		return findIframe().contents().find(selector);
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
		if (existIframe.size() > 0) {
			iframe = existIframe;
			changeCurrentIframe(width, height, existIframe);
			appendContent();
			return;
		}

		var dfd = $.Deferred();
		var iframe = createIframe(width, height, dfd);
		$.when(dfd).done(appendContent);
	};

	var changeCurrentIframe = function (width, height, existIframe) {
		existIframe.css({width: width, height: height});
	};

	var appendContentToIframe = function (iframe, content) {
		iframe.contents().find('body').children().remove();
		iframe.contents().find('body').append(content);
		findInIframe('body').addClass('adg-hide');
	};


	var bindClicks = function (iframe, events) {
		$.each(events, function (key, value) {
			iframe.contents().find(key).click(value);
		});
	};

	var onSelectElementClicked = function (e) {
		e.preventDefault();

		var loaded = showSelectorMenu();
		loaded.done(function () {
			localizeMenu();
			removePreview();
			startSelector();
		});
	};

	var makeRadioButtonsAndCheckBoxes = function () {
		findInIframe('.radiobox').radioButton();
		findInIframe('.checkbox').checkbox();
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

		var urlBlock = haveUrlBlockParameter(element);
		var blockSimilar = haveClassAttribute(element);

		showHidingRuleWindow(element, urlBlock, blockSimilar);
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
		AdguardSelectorLib.reset();
		AdguardSelectorLib.init(onElementSelected);
	};

	var haveUrlBlockParameter = function (element) {
		var value = getUrlBlockAttribute(element);
		return value && value != '';
	};

	var haveClassAttribute = function (element) {
		var className = element.className;
		return className && className.trim() != '';
	};

	var setFilterRuleInputText = function (ruleText) {
		findInIframe('#filter-rule').val(ruleText);
	};

	var localizeMenu = function () {
		$.each(findInIframe("[i18n]"), function () {
			var message = getMessage($(this).attr("i18n"));
			I18nHelper.translateElement(this, message);
		});
	};

	var createAdguardDetailedMenu = function () {
		return $('<div>', {"class": 'main'})
			.append($('<div>', {"class": 'close adg-close'}))
			.append($('<div>', {"class": 'head'})
				.append($('<div>', {id: 'head_title', "class": 'head_title', i18n: 'assistant_block_element'}))
				.append($('<div>', {id: 'head_text', "class": 'head_text', i18n: 'assistant_block_element_explain'}))
			).append($('<div>', {"class": 'content'})
				.append($('<div>', {"class": 'element-rule'})
					.append($('<div>', {"class": 'element-rule_text', i18n: 'assistant_slider_explain'}))
					.append($('<div>', {"class": 'element-rule_slider'})
						.append($('<div>', {id: 'slider', "class": 'adg-slide'})
							.append($('<div>', {"class": 'adg-slide-clue-max', i18n: 'assistant_slider_min'}))
							.append($('<div>', {"class": 'adg-slide-clue-min', i18n: 'assistant_slider_max'}))
						)
					).append($('<div>', {"class": 'element-rule_more'})
						.append($('<span>', {id: 'ExtendedSettingsText', "class": 'element-rule_expand-link'})
							.append($('<span>', {"class": 'element-rule_expand-link_txt', i18n: 'assistant_extended_settings'}))
							.append($('<span>', {"class": 'element-rule_expand-link_arr'}))
						)
					).append($('<div>', {id: 'adv-settings', "class": 'element-rule_form'})
						.append($('<div>', {"class": 'element-rule_form-cont'})
							.append($('<div>', {id: 'one-domain-p', "class": 'element-rule_fieldset'})
								.append($('<input>', {type:'checkbox', "class": 'form-ui-control'}))
								.append($('<label>', {"class": 'form-ui'})
									.append($('<span>', {"class": 'form-ui-txt', i18n: 'assistant_apply_rule_to_all_sites'}))
								)
							).append($('<div>', {id: 'block-by-url-p', "class": 'element-rule_fieldset', style: 'display: none;'})
								.append($('<input>', {type:'checkbox', "class": 'form-ui-control'}))
								.append($('<label>', {"class": 'form-ui'})
									.append($('<span>', {"class": 'form-ui-txt', i18n: 'assistant_block_by_reference'}))
								)
							).append($('<div>', {id: 'block-similar-p',"class": 'element-rule_fieldset', style: 'display: none;'})
								.append($('<input>', {type:'checkbox', "class": 'form-ui-control'}))
								.append($('<label>', {"class": 'form-ui'})
									.append($('<span>', {"class": 'form-ui-txt', i18n: 'assistant_block_similar'}))
								)
							).append($('<div>', {"class": 'element-rule_fieldset'})
								.append($('<input>', {id: 'filter-rule', type: 'text', "class": 'form-control'}))
							)
						)
					)
				)
			).append($('<div>', {"class": 'foot'})
				.append($('<button>', {id: 'adg-cancel', "class":'btn btn-default', type:'button', i18n: 'assistant_another_element'}))
				.append($('<div>', {"class": 'foot_action'})
					.append($('<div>', {"class": 'foot_action_btn'})
						.append($('<button>', {id: 'adg-preview', "class":'btn btn-primary', type:'button', i18n: 'assistant_preview'}))
						.append($('<button>', {id: 'adg-accept', "class":'btn btn-cancel', type:'button', i18n: 'assistant_block'}))
					)
				)
			);

		//return $('<div>', {class: 'adg-container'})
		//	.append($('<div>', {id: 'drag-handle', class: 'adg-head'})
		//		.append($('<div>', {class: 'adg-close'}))
		//		.append($('<div>', {class: 'adg-head-h', i18n: 'assistant_block_element'}))
		//		.append($('<div>', {class: 'adg-head-opt comment'})
		//			.append($('<span>', {i18n: 'assistant_block_element_explain'}))))
		//	.append($('<div>', {class: 'adg-content'})
		//		.append($('<div>', {class: 'adg-slide-block'})
		//			.append($('<div>', {class: 'adg-slide-text', i18n: 'assistant_slider_explain'}))
		//			.append($('<div>', {id: 'slider', class: 'adg-slide'})
		//				.append($('<div>', {class: 'adg-slide-clue-max', i18n: 'assistant_slider_min'}))
		//				.append($('<div>', {class: 'adg-slide-clue-min', i18n: 'assistant_slider_max'})))))
		//	.append($('<div>', {class: 'adg-more'})
		//		.append($('<a>', {id: 'ExtendedSettingsText', i18n: 'assistant_extended_settings'})))
		//	.append($('<div>', {id: 'adv-settings', class: 'adg-form-block', style: 'display: none;'})
		//		.append($('<span>')
		//			.append($('<strong>', {i18n: 'assistant_rule_parameters'})))
		//		.append($('<p>', {id: 'one-domain-p'})
		//			.append($('<label>', {class: 'checkbox-label', i18n: 'assistant_apply_rule_to_all_sites'})))
		//		.append($('<p>', {id: 'block-by-url-p', style: 'display: none;'})
		//			.append($('<label>', {class: 'checkbox-label', i18n: 'assistant_block_by_reference'})))
		//		.append($('<p>', {id: 'block-similar-p', style: 'display: none;'})
		//			.append($('<label>', {class: 'checkbox-label', i18n: 'assistant_block_similar'})))
		//		.append($('<p>')
		//			.append($('<input>', {id: 'filter-rule', type: 'type'}))))
		//	.append($('<div>', {class: 'adg-foot clearfix2'})
		//		.append($('<a>', {id: 'adg-accept', class: 'btn btn-blue', href: '#'}).append($('<span>', {i18n: 'assistant_block'})))
		//		.append($('<a>', {id: 'adg-cancel', class: 'btn btn-gray f-right', href: '#'}).append($('<span>', {i18n: 'assistant_another_element'})))
		//		.append($('<a>', {id: 'adg-preview', class: 'btn btn-gray f-right', href: '#'}).append($('<span>', {i18n: 'assistant_preview'}))));
	};

	var createAdguardSelectorMenu = function () {
		return $('<div>', {"class": 'main sg_ignore'})
			.append($('<div>', {id: 'close-button', "class": 'close adg-close'}))
			.append($('<div>', {id: 'drag-handle', "class": 'head'})
				.append($('<div>', {"class": 'head_title', i18n: 'assistant_select_element'}))
				.append($('<div>', {"class": 'head_text', i18n: 'assistant_select_element_ext'})))
			.append($('<div>', {"class": 'foot'})
				.append($('<button>', {id: 'cancel-select-mode', "class":'btn btn-default', type:'button', i18n: 'assistant_select_element_cancel'})));
	};

	var showDetailedMenu = function () {
		var d = $.Deferred();
		var content = createAdguardDetailedMenu();
		showDialog(content, constants.iframe.baseWidth, constants.iframe.detailedMenuHeight, function (iframe) {
			bindClicks(iframe, {
				'#close-button': onCancelSelectModeClicked,
				'.adg-close': onCancelSelectModeClicked,
				'#adv-settings': onScopeChange,
				'#adg-cancel': onSelectElementClicked,
				'#adg-preview': onRulePreview,
				'#adg-accept': onRuleAccept,
				'#ExtendedSettingsText': onExtendDetailedSettings
			});
			d.resolve('');
		}, function () {
			localizeMenu();
			makeRadioButtonsAndCheckBoxes();
		});
		return d;
	};

	/**
	 * Shows Adguard selector menu
	 */
	var showSelectorMenu = function () {
		var content = createAdguardSelectorMenu();
		var d = $.Deferred();
		showDialog(content, constants.iframe.baseWidth, constants.iframe.selectorMenuHeight, function (iframe) {
			bindClicks(iframe, {
				'#cancel-select-mode': onCancelSelectModeClicked,
				'.adg-close': onCancelSelectModeClicked
			});
			d.resolve('');
		}, null);
		return d;
	};

	var showHidingRuleWindow = function (element, urlBlock, blockSimilar) {
		var loaded = showDetailedMenu();
		loaded.done(function () {
			createSlider(element);

			AdguardSelectorLib.selectElement(element);

			onScopeChange();
			setScopeOneDomainText();
			handleShowBlockSettings(urlBlock, blockSimilar);
		});
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

		var w = $(window);
		var winHeight = w.height();
		var bottom = w.scrollTop() + winHeight;

		var iframe = findIframe();
		var offset = iframe.offset();
		var height = iframe.outerHeight();
		if (offset.top + height > bottom) {
			//replace
			var top = winHeight - height - constants.iframe.topOffset;
			if (top < 0) {
				top = constants.iframe.topOffset;
			}
			iframe.css({
				top: top
			});
		}
	};

	var onExtendDetailedSettings = function () {
		var hidden = !(findInIframe('#adv-settings').hasClass("open"));
		if (hidden) {
			resizeIframe(null, constants.iframe.extendDetailedSettingsHeight);
			findInIframe('#adv-settings').addClass('open');
			findInIframe('#ExtendedSettingsText').addClass('active');
		} else {
			resizeIframe(null, constants.iframe.detailedMenuHeight);
			findInIframe('#adv-settings').removeClass('open');
			findInIframe('#ExtendedSettingsText').removeClass('active');
		}
	};

	var setScopeOneDomainText = function () {
		var path = getCroppedDomain();
		findInIframe('#oneDomainText').text(path);
	};

	var renderSliderAndBindEvents = function (options) {

		var $document = findIframe().contents();
		var $slider = $("#slider", $document);

		$slider.slider({
			min: options.min,
			max: options.max,
			range: 'min',
			value: options.value,
			//Prevent the slider from doing anything from the start
			start: function () {
				return false;
			},
			change: function (event, ui) {
				refreshTicks(ui.value);
				var delta = options.value - ui.value;
				options.onSliderMove(delta);
			}
		});

		$(document).mouseup(function () {
			$('.slider,.ui-slider-handle', $document).unbind('mousemove');
		});

		//While the ui-slider-handle is being held down reference it parent.
		$('.ui-slider-handle', $document).mousedown(function (e) {
			e.preventDefault();
			return $(this).parent().mousedown();
		});

		var $sliderOffsetLeft = $slider.offset().left;
		var $sliderWidth = $slider.width();

		var getSliderValue = function (pageX) {
			return (options.max - options.min) / $sliderWidth * (pageX - $sliderOffsetLeft) + options.min;
		};

		//This will prevent the slider from moving if the mouse is taken out of the
		//slider area before the mouse down has been released.
		$slider.hover(function () {
			$slider.bind('click', function (e) {
				//calculate the correct position of the slider set the value
				var value = getSliderValue(e.pageX);
				$slider.slider('value', value);
			});
			$slider.mousedown(function () {
				$(this).bind('mousemove', function (e) {
					//calculate the correct position of the slider set the value
					var value = getSliderValue(e.pageX);
					$(this).slider('value', value);
				});
			}).mouseup(function () {
				$(this).unbind('mousemove');
			})
		}, function () {
			$('#slider', $document).unbind('mousemove');
			$('#slider', $document).unbind('click');
		});

		//render slider items
		var sliderItemsCount = options.max - 1;

		//update slider items color
		var refreshTicks = function (value) {
			var ticks = findInIframe(".tick");
			var i;
			for (i = 0; i < ticks.length; i++) {
				if (i + 1 < value) {
					findInIframe(ticks[i]).css('background-color', '#36BA53');
				} else {
					findInIframe(ticks[i]).css('background-color', '#E0DFDB');
				}
			}
		};

		//render slider items
		var prepare = function (i) {
			var tick = $('<div>', {"class": 'tick ui-widget-content'}).appendTo($slider);
			tick.css({
				left: (100 / sliderItemsCount * i) + '%',
				width: (100 / sliderItemsCount) + '%'
			});
		};

		for (var i = 0; i < sliderItemsCount; i++) {
			prepare(i);
		}

		refreshTicks(options.value);
	};

	var createSlider = function (element) {
		var parents = utils.getParentsLevel(element);
		var children = utils.getAllChilds(element);
		var value = Math.abs(parents.length + 1);
		var max = parents.length + children.length + 1;
		var min = 1;
		var options = {value: value, min: min, max: max};
		if (min == max) {
			//hide slider text
			findInIframe('#slider').hide();
			findInIframe('.element-rule_text').text(getMessage("assistant_slider_if_hide"));
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

		renderSliderAndBindEvents(options);
	};

	var handleShowBlockSettings = function (showBlockByUrl, showBlockSimilar) {
		if (showBlockByUrl) {
			findInIframe('#block-by-url-p').show();
		} else {
			findInIframe('#blockByUrl').attr('checked', false);
			findInIframe('#block-by-url-p').hide();
		}
		if (showBlockSimilar) {
			findInIframe('#block-similar-p').show();
		} else {
			findInIframe('#blockSimilar').attr('checked', false);
			findInIframe('#block-similar-p').hide();
		}
	};

	var onSliderMove = function (element) {
		removePreview();

		settings.selectedElement = element;
		AdguardSelectorLib.selectElement(element);

		makeDefaultCheckboxesForDetailedMenu();
		onScopeChange();
		makeRadioButtonsAndCheckBoxes();
		handleShowBlockSettings(haveUrlBlockParameter(element), haveClassAttribute(element));
	};

	//TODO: Fix advanced settings
	var makeDefaultCheckboxesForDetailedMenu = function () {
		findInIframe('#blockByUrl').attr('checked', false);
		findInIframe('#blockSimilar').attr('checked', false);
		findInIframe('#oneDomainRadio').attr('checked', false);
		findInIframe('#block-by-url-p >div >span').removeClass('active');
		findInIframe('#block-similar-p >div >span').removeClass('active');
		findInIframe('#one-domain-p >div >span').removeClass('active');
	};

	var getUrlBlockAttribute = function (element) {
		for (var i = 0; i < settings.urlBlockAttributes.length; i++) {
			var attr = settings.urlBlockAttributes[i];
			var value = element.getAttribute(attr);
			if (value) {
				return value;
			}
		}
		return null;
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

		var selector = AdguardRulesConstructorLib.makeCssNthChildFilter(settings.selectedElement);
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

		var isBlockByUrl = findInIframe('#blockByUrl').is(':checked');
		var isBlockSimilar = findInIframe('#blockSimilar').is(':checked');
		var isBlockOneDomain = findInIframe("#oneDomainRadio").is(':checked');

		handleShowBlockSettings(haveUrlBlockParameter(settings.selectedElement) && !isBlockSimilar, haveClassAttribute(settings.selectedElement) && !isBlockByUrl);

		var options = {
			isBlockByUrl: isBlockByUrl,
			urlMask: getUrlBlockAttribute(settings.selectedElement),
			isBlockSimilar : isBlockSimilar,
			isBlockOneDomain: isBlockOneDomain,
			domain: getCroppedDomain()
		};
		var ruleText = AdguardRulesConstructorLib.constructRuleText(settings.selectedElement, options);

		setFilterRuleInputText(ruleText);
	};

	var onRuleAccept = function () {
		removePreview();
		onRulePreview();
		settings.lastPreview = null;

		var ruleText = findInIframe('#filter-rule').val();
		contentPage.sendMessage({type: 'addUserRule', ruleText: ruleText}, function () {
			closeAssistant();
		});
	};

	var windowZoomFix = function () {
		$(window).resize(function () {
			if (settings.selectedElement) {
				AdguardSelectorLib.selectElement(settings.selectedElement);
			}
		});
	};
	windowZoomFix();

	this.init = function (options) {
		self.localization = options.localization;
		var loaded = showSelectorMenu();
		loaded.done(function () {
			localizeMenu();
			removePreview();
			startSelector();
			//choose element for assistant
			if (options.selectedElement) {
				$(options.selectedElement).click();
			}
		});
	};

	this.destroy = function () {
		removePreview();
		cancelSelectMode();
		closeAssistant();
	}
};
