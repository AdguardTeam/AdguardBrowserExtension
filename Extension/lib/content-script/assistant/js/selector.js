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
 * Adguard selector library (selectorGadget-like)
 *
 * @param onElementSelected
 */
var AdguardSelector = function (onElementSelected) {
	this.iframeId = 'adguard-assistant-dialog';
	this.border_width = 5;
	this.border_padding = 2;
	this.b_top = null;
	this.b_left = null;
	this.b_right = null;
	this.b_bottom = null;
	this.selected = [];
	this.rejected = [];
	this.sg_div = null;
	this.unbound = false;
	this.prediction_helper = new DomPredictionHelper($, String);
	this.restricted_elements = $.map(['html', 'body', 'head', 'base'], function (selector) {
		return $(selector).get(0);
	});
	this.path_output_field = null;
	this.select_mode = 'exact';
	this.onElementSelected = onElementSelected;
	this.placeHoldedElements = [];
	this.constantPlaceholderPrefix = 'adguard-placeholder';
};

/**
 * Initializes AdguardSelector.
 * Creates all necessary elements and sets up event handlers.
 */
AdguardSelector.prototype.setup = function () {
	this.setupEventHandlers();
};


//ie fix. because ie does not correct calc $.offset()
var calcOffset = function (obj) {
	var ol = ot = 0;
	if (obj.offsetParent) {
		do {
			ol += obj.offsetLeft;
			ot += obj.offsetTop;
		} while (obj = obj.offsetParent);
	}
	return {left: ol, top: ot};
};

AdguardSelector.prototype.makeBorders = function (origElem) {
	this.removeBorders();
	this.setupBorders();

	if (!origElem) return;
	var pathToShow;
	if (origElem.parentNode) {
		pathToShow = origElem.parentNode.tagName.toLowerCase() + ' ' + origElem.tagName.toLowerCase();
	} else {
		pathToShow = origElem.tagName.toLowerCase();
	}
	var elem = $(origElem);
	var p = elem.offset();

	//var top = calcOffset(orig_elem).top;
	var top = p.top;
	var left = p.left;
	var width = elem.outerWidth();
	var height = elem.outerHeight();
	//alert('top='+top+';left='+left+';width='+width+';height='+height);

	this.b_top.css('width', this.px(width + this.border_padding * 2 + this.border_width * 2)).
		css('top', this.px(top - this.border_width - this.border_padding)).
		css('left', this.px(left - this.border_padding - this.border_width));
	this.b_bottom.css('width', this.px(width + this.border_padding * 2 + this.border_width * 2 - 5)).
		css('top', this.px(top + height + this.border_padding)).
		css('left', this.px(left - this.border_padding - this.border_width)).text(pathToShow);
	this.b_left.css('height', this.px(height + this.border_padding * 2)).
		css('top', this.px(top - this.border_padding)).
		css('left', this.px(left - this.border_padding - this.border_width));
	this.b_right.css('height', this.px(height + this.border_padding * 2)).
		css('top', this.px(top - this.border_padding)).
		css('left', this.px(left + width + this.border_padding));

	this.b_right.get(0).target_elem = this.b_left.get(0).target_elem = this.b_top.get(0).target_elem = this.b_bottom.get(0).target_elem = origElem;

	/* for future
	 if (makeRed || elem.hasClass("sg_suggested") || elem.hasClass("sg_selected")) {
	 this.b_top.addClass('sg_border_red');
	 this.b_bottom.addClass('sg_border_red');
	 this.b_left.addClass('sg_border_red');
	 this.b_right.addClass('sg_border_red');
	 } else {
	 if (this.b_top.hasClass('sg_border_red')) {
	 this.b_top.removeClass('sg_border_red');
	 this.b_bottom.removeClass('sg_border_red');
	 this.b_left.removeClass('sg_border_red');
	 this.b_right.removeClass('sg_border_red');
	 }
	 }
	 */

	this.showBorders();
};

AdguardSelector.prototype.px = function (p) {
	return p + 'px';
};

AdguardSelector.prototype.reset = function (element) {
	this.b_top = null;
	this.makeBorders(element);
};

AdguardSelector.prototype.showBorders = function () {
	this.b_top.show();
	this.b_bottom.show();
	this.b_left.show();
	this.b_right.show();
};

AdguardSelector.prototype.removeBorders = function () {
	if (this.b_top) {
		this.b_top.hide();
		this.b_bottom.hide();
		this.b_left.hide();
		this.b_right.hide();
	}
};

AdguardSelector.prototype.setupBorders = function () {
	if (!this.b_top) {
		var width = this.border_width + 'px';
		this.b_top = $('<div>').addClass('sg_border').css('height', width).hide().on("click", {'self': this}, this.sgMousedown);
		this.b_bottom = $('<div>').addClass('sg_border').addClass('sg_bottom_border').css('height', this.px(this.border_width + 6)).hide().bind("click", {'self': this}, this.sgMousedown);
		this.b_left = $('<div>').addClass('sg_border').css('width', width).hide().on("click", {'self': this}, this.sgMousedown);
		this.b_right = $('<div>').addClass('sg_border').css('width', width).hide().on("click", {'self': this}, this.sgMousedown);

		this.addBorderToDom();
	}
};

AdguardSelector.prototype.addBorderToDom = function () {
	document.body.appendChild(this.b_top.get(0));
	document.body.appendChild(this.b_bottom.get(0));
	document.body.appendChild(this.b_left.get(0));
	document.body.appendChild(this.b_right.get(0));
};

AdguardSelector.prototype.removeBorderFromDom = function () {
	if (this.b_top) {
		this.b_top.remove();
		this.b_bottom.remove();
		this.b_left.remove();
		this.b_right.remove();
	}
};

AdguardSelector.prototype.sgMouseover = function (e) {
	var gadget = e.data.self;
	if (gadget.unbound) {
		return true;
	}
	if (this == document.body || this == document.body.parentNode) {
		return false;
	}
	var parent = gadget.firstSelectedOrSuggestedParent(this);
	if (parent != null && parent != this) {
		gadget.makeBorders(parent, true);
	}
	else {
		gadget.makeBorders(this);
	}
	/*
	 if (!$('.sg_selected', this).get(0)) {
	 gadget.makeBorders(this);
	 }*/
	return false;
};

AdguardSelector.prototype.firstSelectedOrSuggestedParent = function (elem) {
	var orig = elem;
	if ($(elem).hasClass('sg_suggested') || $(elem).hasClass('sg_selected')) {
		return elem;
	}
	while (elem.parentNode && (elem = elem.parentNode)) {
		if ($.inArray(elem, this.restricted_elements) == -1) {
			if ($(elem).hasClass('sg_suggested') || $(elem).hasClass('sg_selected')) {
				return elem;
			}
		}
	}
	return null;
};

AdguardSelector.prototype.sgMouseout = function (e) {
	if (e.data.self.unbound) {
		return true;
	}
	if (this == document.body || this == document.body.parentNode) {
		return false;
	}
	e.data.self.removeBorders();
	return false;
};

AdguardSelector.prototype.sgMousedown = function (e) {
	e.preventDefault();
	var gadget = e.data.self;
	if (gadget.unbound) {
		return true;
	}
	var elem = this;
	var w_elem = $(elem);

	if (w_elem.hasClass('sg_border')) {
		// They have clicked on one of our floating borders, target the element that we are bordering.
		elem = elem.target_elem || elem;
		w_elem = $(elem);
	}

	if (elem == document.body || elem == document.body.parentNode) {
		return;
	}

	// Don't allow selection of elements that have a selected child.
	if ($('.sg_selected', this).get(0)) {
		gadget.blockClicksOn(elem);
	}
	if (w_elem.hasClass('sg_selected')) {
		w_elem.removeClass('sg_selected');
		gadget.selected.splice($.inArray(elem, gadget.selected), 1);
	} else if (w_elem.hasClass("sg_rejected")) {
		w_elem.removeClass('sg_rejected');
		gadget.rejected.splice($.inArray(elem, gadget.rejected), 1);
	} else if (w_elem.hasClass("sg_suggested")) {
		w_elem.addClass('sg_rejected');
		gadget.rejected.push(elem);
	} else {
		if (gadget.select_mode == 'exact' && gadget.selected.length > 0) {
			$('.sg_selected').removeClass('sg_selected');
			gadget.selected = [];
		}
		//w_elem.addClass('sg_selected');
		gadget.selected.push(elem);
	}
	if (gadget.select_mode == 'similar') {
		gadget.clearSuggested();
		var prediction = gadget.prediction_helper.predictCss(gadget.selected, gadget.rejected.concat(gadget.restricted_elements));
		gadget.suggestPredicted(prediction);
		gadget.setPath(prediction);
	}
	else {
		var prediction = gadget.prediction_helper.predictCss(gadget.selected, gadget.rejected.concat(gadget.restricted_elements));
		gadget.setPath(prediction);
	}
	gadget.removeBorders();

	gadget.blockClicksOn(elem);

	w_elem.trigger("mouseover", {'self': gadget}); // Refresh the borders by triggering a new mouseover event.

	gadget.onElementSelected(gadget.getSelectorPath(elem), gadget.getSelectorSimilarPath(elem), elem);

	return false;
};

AdguardSelector.prototype.getSelectorPath = function (selectedElement) {
	if (!selectedElement) return;
	var domainPrefix = this.makeDomainPrefix();
	var selector = AdguardSelector.makeCssNthChildFilter(selectedElement);
	return selector ? domainPrefix + selector : "";
};

AdguardSelector.prototype.getSelectorSimilarPath = function (selectedElement) {
	if (!selectedElement) {
		return "";
	}
	var className = selectedElement.className;
	if (!className) {
		return "";
	}
	var domainPrefix = this.makeDomainPrefix();
	var selector = className.trim().replace(/\s+/g, ', .');
	return selector ? domainPrefix + '.' + selector : "";
};

AdguardSelector.prototype.setupEventHandlers = function () {
	this.makeIframeAndEmbededSelector();
	var sgIgnore = $("body *:not(.sg_ignore)");
	sgIgnore.on("mouseover", {'self': this}, this.sgMouseover);
	sgIgnore.on("mouseout", {'self': this}, this.sgMouseout);
	sgIgnore.on("click", {'self': this}, this.sgMousedown);
};

AdguardSelector.prototype.deleteEventHandlers = function () {
	this.removePlaceholders();
	var elements = $("body *");
	elements.off("mouseover", this.sgMouseover);
	elements.off("mouseout", this.sgMouseout);
	elements.off("click", this.sgMousedown);
};

AdguardSelector.prototype.makeIframeAndEmbededSelector = function () {
	this.placeHoldedElements = $('iframe:not(.sg_ignore,:hidden),embed,object');
	var elements = this.placeHoldedElements;
	for (var i = 0; i < elements.length; i++) {
		var current = elements[i];
		var placeHolder = this.makePlaceholderImage(current);
		var id = this.constantPlaceholderPrefix + i;
		placeHolder.setAttribute("id", id);
		$(current).replaceWith(placeHolder);
		$('#' + id).on('click', {'self': this, 'actualElement': current}, this.placeholderClick);
	}
};

AdguardSelector.prototype.getHost = function getHost(url) {
	if (!url) return "";
	var a = document.createElement('a');
	a.href = url;
	return a.hostname;
};

AdguardSelector.prototype.makePlaceholderImage = function (element) {
	var jElement = $(element);
	var placeHolder = document.createElement('div');
	placeHolder.style.height = jElement.height() + 'px';
	placeHolder.style.width = jElement.width() + 'px';
	placeHolder.style.position = jElement.css('position');
	placeHolder.style.top = jElement.css('top');
	placeHolder.style.bottom = jElement.css('bottom');
	placeHolder.style.left = jElement.css('left');
	placeHolder.style.right = jElement.css('right');
	placeHolder.className += "adguard-placeholder";
	var icon = document.createElement('div');
	icon.className += "adguard-placeholder-icon sg_ignore";
	var domain = document.createElement('div');
	domain.textContent = this.getHost(element.src);
	domain.className += "adguard-placeholder-domain sg_ignore";
	icon.appendChild(domain);
	placeHolder.appendChild(icon);
	return placeHolder;
};

AdguardSelector.prototype.removePlaceholders = function () {
	if (!this.placeHoldedElements) return;
	var elements = this.placeHoldedElements;
	for (var i = 0; i < elements.length; i++) {
		var current = elements[i];
		var id = this.constantPlaceholderPrefix + i;
		$('#' + id).replaceWith($(current));
	}
	this.placeHoldedElements = null;
};

AdguardSelector.prototype.placeholderClick = function (e) {
	var gadget = e.data.self;
	var actualElement = e.data.actualElement;
	gadget.removeBorders();
	gadget.removePlaceholders();
	gadget.onElementSelected(gadget.getSelectorPath(actualElement), gadget.getSelectorSimilarPath(actualElement), actualElement);
};

// Block clicks for a moment by covering this element with a div.  Eww?
AdguardSelector.prototype.blockClicksOn = function (elem) {
	elem = $(elem);
	var p = elem.offset();
	var block = $('<div>').css('position', 'absolute').css('z-index', '9999999').css('width', this.px(elem.outerWidth())).
		css('height', this.px(elem.outerHeight())).css('top', this.px(p.top)).css('left', this.px(p.left)).
		css('background-color', '');
	document.body.appendChild(block.get(0));
	setTimeout(function () {
		block.remove();
	}, 400);
	return false;
};

AdguardSelector.prototype.setMode = function (mode) {
	if (mode == 'browse') {
		this.removeEventHandlers();
	} else if (mode == 'interactive') {
		this.setupEventHandlers();
	}
	this.clearSelected();
};

AdguardSelector.prototype.suggestPredicted = function (prediction) {
	if (prediction && prediction != '') {
		var count = 0;
		$(prediction).each(function () {
			count += 1;
			if (!$(this).hasClass('sg_selected') && !$(this).hasClass('sg_ignore') && !$(this).hasClass('sg_rejected')) {
				$(this).addClass('sg_suggested');
			}
		});

		if (this.clear_button) {
			if (count > 0) {
				this.clear_button.attr('value', 'Clear (' + count + ')');
			} else {
				this.clear_button.attr('value', 'Clear');
			}
		}
	}
};

AdguardSelector.prototype.setPath = function (prediction) {
	if (this.path_output_field != null) {
		if (prediction && prediction.length > 0) {
			this.path_output_field.value = prediction;
		}
		else {
			this.path_output_field.value = 'No valid path found.';
		}
	}

};

AdguardSelector.prototype.clearSelected = function (e) {
	var self = (e && e.data && e.data.self) || this;
	self.selected = [];
	self.rejected = [];
	$('.sg_selected').removeClass('sg_selected');
	$('.sg_rejected').removeClass('sg_rejected');
	self.removeBorders();
	self.clearSuggested();
};

AdguardSelector.prototype.clearEverything = function (e) {
	var self = (e && e.data && e.data.self) || this;
	self.clearSelected();
	self.resetOutputs();
};

AdguardSelector.prototype.resetOutputs = function () {
	this.setPath();
};

AdguardSelector.prototype.clearSuggested = function () {
	$('.sg_suggested').removeClass('sg_suggested');
	if (this.clear_button) {
		this.clear_button.attr('value', 'Clear');
	}
};

AdguardSelector.prototype.removeInterface = function (e) {
	this.removeBorderFromDom();
};

AdguardSelector.prototype.unbind = function (e) {
	var self = (e && e.data && e.data.self) || this;
	self.unbound = true;
	self.removeInterface();
	self.clearSelected();
	self.deleteEventHandlers();
};

AdguardSelector.prototype.closeSelector = function () {
	var self = this;
	self.unbound = true;
	self.removeInterface();
	self.deleteEventHandlers();
};

AdguardSelector.makeCssNthChildFilter = function (element) {

	var path = [];
	var el = element;
	while (el.parentNode) {
		var nodeName = el && el.nodeName ? el.nodeName.toUpperCase() : "";
		if (nodeName == "BODY") {
			break;
		}
		if (el.id) {
			var id = el.id.split(':').join('\\:');//case of colon in id. Need to escape
			if (el.id.indexOf('.') > -1) {
				path.unshift('[id="' + id + '"]');
			} else {
				path.unshift('#' + id);
			}
			break;
		} else {
			var c = 1;
			for (var e = el; e.previousSibling; e = e.previousSibling) {
				if (e.previousSibling.nodeType === 1) {
					c++;
				}
			}

			var cldCount = 0;
			for (var i = 0; el.parentNode && i < el.parentNode.childNodes.length; i++) {
				cldCount += el.parentNode.childNodes[i].nodeType == 1 ? 1 : 0;
			}

			var ch;
			if (cldCount == 0 || cldCount == 1) {
				ch = "";
			} else if (c == 1) {
				ch = ":first-child";
			} else if (c == cldCount) {
				ch = ":last-child";
			} else {
				ch = ":nth-child(" + c + ")";
			}

			var className = el.className;
			if (className) {
				if (className.indexOf('.') > 0) {
					className = '[class="' + className + '"]';
				} else {
					className = className.trim().replace(/ +(?= )/g, ''); //delete more than one space between classes;
					className = '.' + className.replace(/\s/g, ".");
				}
			} else {
				className = '';
			}
			path.unshift(el.tagName + className + ch);

			el = el.parentNode;
		}
	}
	return path.join(" > ");
};

AdguardSelector.prototype.makeDomainPrefix = function () {
	var result;
	var scope = $(this.iframeId).find('#oneDomainRadio').get(0);
	if (scope && scope.checked) {
		result = this.croppedDomain + this.domainRule;
	} else {
		result = "##";
	}
	return result;
};