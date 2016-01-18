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
 * Adguard selector library
 */
var AdguardSelectorLib = {

    BORDER_WIDTH: 5,
    BORDER_PADDING: 2,
    BORDER_CLASS: "sg_border",

    b_top: null,
    b_left: null,
    b_right: null,
    b_bottom: null,

    PLACEHOLDER_PREFIX: 'adguard-placeholder',
    placeholder_elements: null,

    restricted_elements: null,
    prediction_helper: null,

    SUGGESTED_CLASS: "sg_suggested",
    SELECTED_CLASS: "sg_selected",
    REJECTED_CLASS: "sg_rejected",
    IGNORED_CLASS: "sg_ignore",

    selected_elements: [],
    rejected_elements: [],

    path_output_field: null,
    select_mode: 'exact',
    unbound: true,
    _onElementSelected: null,

    /**
     * Starts selector module.
     *
     * @param onElementSelected callback function
     * @param selectionRenderer optional function contains selection presentation implementation
     */
    init: function (onElementSelected, selectionRenderer) {

        this._onElementSelected = onElementSelected;
        if (selectionRenderer && typeof selectionRenderer === "function") {
            this._selectionRenderer = selectionRenderer;
        }

        this.restricted_elements = $.map(['html', 'body', 'head', 'base'], function (selector) {
            return $(selector).get(0);
        });
        this.prediction_helper = new DomPredictionHelper($, String);

        this._setupEventHandlers();
        this.unbound = false;
    },

    /**
     * Resets state of selector.
     * Clears current selection.
     */
    reset: function () {
        this._clearSelected();
        this._setPath();
    },

    /**
     * Destroys selector module.
     * Removes all selector elements and unbinds event handlers.
     */
    close: function () {
        this.unbound = true;

        this._removeBorderFromDom();
        this._deleteEventHandlers();
    },

    /**
     * Selects specified element and calls callback function.
     *
     * @param element
     */
    selectElement: function (element) {
        //TODO: Implement
        this._selectionRenderer(element);
    },


    /**
     * Adds borders to selected element.
     *
     * Default implementation of selection renderer.
     * Can be overwritten with custom implementation as a parameter of init function.
     *
     * @param element
     * @private
     */
    _selectionRenderer: function (element) {
        this._removeBorders();
        this._setupBorders();

        if (!element) {
            return;
        }

        var elem = $(element);
        var p = elem.offset();

        var top = p.top;
        var left = p.left;
        var width = elem.outerWidth();
        var height = elem.outerHeight();

        this.b_top.css('width', this._px(width + this.BORDER_PADDING * 2 + this.BORDER_WIDTH * 2)).
            css('top', this._px(top - this.BORDER_WIDTH - this.BORDER_PADDING)).
            css('left', this._px(left - this.BORDER_PADDING - this.BORDER_WIDTH));
        this.b_bottom.css('width', this._px(width + this.BORDER_PADDING * 2 + this.BORDER_WIDTH * 2 - 5)).
            css('top', this._px(top + height + this.BORDER_PADDING)).
            css('left', this._px(left - this.BORDER_PADDING - this.BORDER_WIDTH)).text(this._getTagPath(element));
        this.b_left.css('height', this._px(height + this.BORDER_PADDING * 2)).
            css('top', this._px(top - this.BORDER_PADDING)).
            css('left', this._px(left - this.BORDER_PADDING - this.BORDER_WIDTH));
        this.b_right.css('height', this._px(height + this.BORDER_PADDING * 2)).
            css('top', this._px(top - this.BORDER_PADDING)).
            css('left', this._px(left + width + this.BORDER_PADDING));

        this.b_right.get(0).target_elem = this.b_left.get(0).target_elem = this.b_top.get(0).target_elem = this.b_bottom.get(0).target_elem = element;

        this._showBorders();
    },

    _showBorders: function () {
        this.b_top.show();
        this.b_bottom.show();
        this.b_left.show();
        this.b_right.show();
    },

    _removeBorders: function () {
        if (this.b_top) {
            this.b_top.hide();
            this.b_bottom.hide();
            this.b_left.hide();
            this.b_right.hide();
        }
    },

    _setupBorders: function () {
        if (!this.b_top) {
            var width = this._px(this.BORDER_WIDTH);

            //TODO: Move to setupEventHandlers
            this.b_top = $('<div>').addClass(this.BORDER_CLASS).css('height', width).hide()
                .on("click", {'self': this}, this._sgMousedown);
            this.b_bottom = $('<div>').addClass(this.BORDER_CLASS).addClass('sg_bottom_border')
                .css('height', this._px(this.BORDER_WIDTH + 6)).hide()
                .bind("click", {'self': this}, this._sgMousedown);
            this.b_left = $('<div>').addClass(this.BORDER_CLASS).css('width', width).hide()
                .on("click", {'self': this}, this._sgMousedown);
            this.b_right = $('<div>').addClass(this.BORDER_CLASS).css('width', width).hide()
                .on("click", {'self': this}, this._sgMousedown);

            this._addBorderToDom();
        }
    },

    _addBorderToDom: function () {
        document.body.appendChild(this.b_top.get(0));
        document.body.appendChild(this.b_bottom.get(0));
        document.body.appendChild(this.b_left.get(0));
        document.body.appendChild(this.b_right.get(0));
    },

    _removeBorderFromDom: function () {
        if (this.b_top) {
            this.b_top.remove();
            this.b_bottom.remove();
            this.b_left.remove();
            this.b_right.remove();
        }
    },

    _getTagPath: function (element) {
        if (element.parentNode) {
            return element.parentNode.tagName.toLowerCase() + ' ' + element.tagName.toLowerCase();
        } else {
            return element.tagName.toLowerCase();
        }
    },

    _px: function (p) {
        return p + 'px';
    },


    _setupEventHandlers: function () {
        this._makeIFrameAndEmbededSelector();

        var sgIgnore = $("body *:not(.sg_ignore)");
        sgIgnore.on("mouseover", {'self': this}, this._sgMouseover);
        sgIgnore.on("mouseout", {'self': this}, this._sgMouseout);
        sgIgnore.on("click", {'self': this}, this._sgMousedown);
    },

    _deleteEventHandlers: function () {
        this._removePlaceholders();

        var elements = $("body *");
        elements.off("mouseover", this._sgMouseover);
        elements.off("mouseout", this._sgMouseout);
        elements.off("click", this._sgMousedown);
    },

    _makeIFrameAndEmbededSelector: function () {
        this.placeholder_elements = $('iframe:not(.sg_ignore,:hidden),embed,object');
        var elements = this.placeholder_elements;
        for (var i = 0; i < elements.length; i++) {
            var current = elements[i];
            var placeHolder = this._makePlaceholderImage(current);
            var id = this.PLACEHOLDER_PREFIX + i;

            placeHolder.setAttribute("id", id);
            $(current).replaceWith(placeHolder);
            $('#' + id).on('click', {'self': this, 'actualElement': current}, this._placeholderClick);
        }
    },

    _removePlaceholders: function () {
        if (!this.placeholder_elements) {
            return;
        }

        var elements = this.placeholder_elements;
        for (var i = 0; i < elements.length; i++) {
            var current = elements[i];
            var id = this.PLACEHOLDER_PREFIX + i;
            $('#' + id).replaceWith($(current));
        }

        this.placeholder_elements = null;
    },

    _makePlaceholderImage: function (element) {
        var jElement = $(element);

        var placeHolder = document.createElement('div');
        placeHolder.style.height = jElement.height() + 'px';
        placeHolder.style.width = jElement.width() + 'px';
        placeHolder.style.position = jElement.css('position');
        placeHolder.style.top = jElement.css('top');
        placeHolder.style.bottom = jElement.css('bottom');
        placeHolder.style.left = jElement.css('left');
        placeHolder.style.right = jElement.css('right');
        placeHolder.className += this.PLACEHOLDER_PREFIX;

        var icon = document.createElement('div');
        icon.className += this.PLACEHOLDER_PREFIX + "-icon sg_ignore";

        var domain = document.createElement('div');
        domain.textContent = this._getHost(element.src);
        domain.className += this.PLACEHOLDER_PREFIX + "-domain sg_ignore";

        icon.appendChild(domain);
        placeHolder.appendChild(icon);

        return placeHolder;
    },

    _getHost: function (url) {
        if (!url) return "";

        var a = document.createElement('a');
        a.href = url;
        return a.hostname;
    },


    _placeholderClick: function (e) {
        var gadget = e.data.self;
        var actualElement = e.data.actualElement;

        gadget._removeBorders();
        gadget._removePlaceholders();

        gadget._onElementSelected(gadget._getSelectorPath(actualElement), gadget._getSelectorSimilarPath(actualElement), actualElement);
    },

    _sgMouseover: function (e) {
        var gadget = e.data.self;
        if (gadget.unbound) {
            return true;
        }

        if (this == document.body || this == document.body.parentNode) {
            return false;
        }

        var parent = gadget._firstSelectedOrSuggestedParent(this);
        if (parent != null && parent != this) {
            gadget._selectionRenderer(parent, true);
        }
        else {
            gadget._selectionRenderer(this);
        }

        /*
         if (!$('.sg_selected', this).get(0)) {
         gadget._selectionRenderer(this);
         }*/

        return false;
    },

    _sgMouseout: function (e) {
        var gadget = e.data.self;
        if (gadget.unbound) {
            return true;
        }

        if (this == document.body || this == document.body.parentNode) {
            return false;
        }

        gadget._removeBorders();
        return false;
    },

    _sgMousedown: function (e) {
        e.preventDefault();

        var gadget = e.data.self;
        if (gadget.unbound) {
            return true;
        }

        var elem = this;
        var w_elem = $(elem);
        if (w_elem.hasClass(gadget.BORDER_CLASS)) {
            //Clicked on one of our floating borders, target the element that we are bordering.
            elem = elem.target_elem || elem;
        }

        if (elem == document.body || elem == document.body.parentNode) {
            return;
        }

        // Don't allow selection of elements that have a selected child.
        if ($('.sg_selected', this).get(0)) {
            gadget._blockClicksOn(elem);
        }

        var prediction = gadget._makePredictionPath(elem);
        gadget._setPath(prediction);

        gadget._removeBorders();
        gadget._blockClicksOn(elem);

        // Refresh the borders by triggering a new mouseover event.
        w_elem.trigger("mouseover", {'self': gadget});

        gadget._onElementSelected(gadget._getSelectorPath(elem), gadget._getSelectorSimilarPath(elem), elem);

        return false;
    },

    /**
     * Block clicks for a moment by covering this element with a div.
     *
     * @param elem
     * @returns {boolean}
     * @private
     */
    _blockClicksOn: function (elem) {
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
    },

    _clearSelected: function () {
        this.selected_elements = [];
        this.rejected_elements = [];

        $('.sg_selected').removeClass(this.SELECTED_CLASS);
        $('.sg_rejected').removeClass(this.REJECTED_CLASS);

        this._removeBorders();
        this._clearSuggested();
    },

    _firstSelectedOrSuggestedParent: function (element) {
        if ($(element).hasClass(this.SUGGESTED_CLASS) || $(element).hasClass(this.SELECTED_CLASS)) {
            return element;
        }

        while (element.parentNode && (element = element.parentNode)) {
            if ($.inArray(element, this.restricted_elements) == -1) {
                if ($(element).hasClass(this.SUGGESTED_CLASS) || $(element).hasClass(this.SELECTED_CLASS)) {
                    return element;
                }
            }
        }

        return null;
    },

    _makePredictionPath: function (elem) {
        var w_elem = $(elem);

        if (w_elem.hasClass(this.SELECTED_CLASS)) {
            w_elem.removeClass(this.SELECTED_CLASS);
            this.selected_elements.splice($.inArray(elem, this.selected_elements), 1);
        } else if (w_elem.hasClass(this.REJECTED_CLASS)) {
            w_elem.removeClass(this.REJECTED_CLASS);
            this.rejected_elements.splice($.inArray(elem, this.rejected_elements), 1);
        } else if (w_elem.hasClass(this.SUGGESTED_CLASS)) {
            w_elem.addClass(this.REJECTED_CLASS);
            this.rejected_elements.push(elem);
        } else {
            if (this.select_mode == 'exact' && this.selected_elements.length > 0) {
                $('.sg_selected').removeClass(this.SELECTED_CLASS);
                this.selected_elements = [];
            }
            //w_elem.addClass('sg_selected');
            this.selected_elements.push(elem);
        }

        var prediction = this.prediction_helper.predictCss(this.selected_elements,
            this.rejected_elements.concat(this.restricted_elements));

        if (this.select_mode == 'similar') {
            this._clearSuggested();
            this._suggestPredicted(prediction);
        }

        return prediction;
    },

    _setPath: function (prediction) {
        if (this.path_output_field != null) {
            if (prediction && prediction.length > 0) {
                this.path_output_field.value = prediction;
            }
            else {
                this.path_output_field.value = 'No valid path found.';
            }
        }

    },

    _clearSuggested: function () {
        $('.sg_suggested').removeClass(this.SUGGESTED_CLASS);

        //TODO: What is clear_button?
        if (this.clear_button) {
            this.clear_button.attr('value', 'Clear');
        }
    },

    _suggestPredicted: function (prediction) {
        if (prediction && prediction != '') {
            var count = 0;
            var self = this;
            $(prediction).each(function () {
                count += 1;
                if (!$(this).hasClass(self.SELECTED_CLASS)
                    && !$(this).hasClass(self.IGNORED_CLASS)
                    && !$(this).hasClass(self.REJECTED_CLASS)) {
                    $(this).addClass(self.SUGGESTED_CLASS);
                }
            });

            //TODO: What is clear_button?
            if (this.clear_button) {
                if (count > 0) {
                    this.clear_button.attr('value', 'Clear (' + count + ')');
                } else {
                    this.clear_button.attr('value', 'Clear');
                }
            }
        }
    },


    _getSelectorPath: function (selectedElement) {
        if (!selectedElement) {
            return;
        }

        var selector = AdguardSelectorLib.makeCssNthChildFilter(selectedElement);
        return selector ? this._makeDomainPrefix() + selector : "";
    },

    _getSelectorSimilarPath: function (selectedElement) {
        if (!selectedElement) {
            return "";
        }

        var className = selectedElement.className;
        if (!className) {
            return "";
        }

        var selector = className.trim().replace(/\s+/g, ', .');
        return selector ? this._makeDomainPrefix() + '.' + selector : "";
    },

    _makeDomainPrefix: function () {
        //TODO: ???

        var result;
        var scope = $('adguard-assistant-dialog').find('#oneDomainRadio').get(0);
        if (scope && scope.checked) {
            result = this.croppedDomain + this.domainRule;
        } else {
            result = "##";
        }

        return result;
    }
};

AdguardSelectorLib.makeCssNthChildFilter = function (element) {

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
