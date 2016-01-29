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

var AdguardSelectorLib = (function (api) {

    // PRIVATE FIELDS
    var BORDER_WIDTH = 5;
    var BORDER_PADDING = 2;
    var BORDER_CLASS = "sg_border";

    var b_top = null;
    var b_left = null;
    var b_right = null;
    var b_bottom = null;

    var PLACEHOLDER_PREFIX = 'adguard-placeholder';
    var placeholder_elements = null;

    var restricted_elements = null;
    var prediction_helper = null;

    var SUGGESTED_CLASS = "sg_suggested";
    var SELECTED_CLASS = "sg_selected";
    var REJECTED_CLASS = "sg_rejected";
    var IGNORED_CLASS = "sg_ignore";

    var selected_elements = [];
    var rejected_elements = [];

    var path_output_field = null;
    var select_mode = 'exact';
    var unbound = true;
    var _onElementSelected = null;


    // PRIVATE METHODS

    var _clearSuggested = function () {
        $('.sg_suggested').removeClass(SUGGESTED_CLASS);
    };

    var _suggestPredicted = function (prediction) {
        if (prediction && prediction != '') {
            var count = 0;
            $(prediction).each(function () {
                count += 1;
                if (!$(this).hasClass(SELECTED_CLASS)
                    && !$(this).hasClass(IGNORED_CLASS)
                    && !$(this).hasClass(REJECTED_CLASS)) {
                    $(this).addClass(SUGGESTED_CLASS);
                }
            });
        }
    };

    var _setPath = function (prediction) {
        if (path_output_field != null) {
            if (prediction && prediction.length > 0) {
                path_output_field.value = prediction;
            }
            else {
                path_output_field.value = 'No valid path found.';
            }
        }
    };

    var _makePredictionPath = function (elem) {
        var w_elem = $(elem);

        if (w_elem.hasClass(SELECTED_CLASS)) {
            w_elem.removeClass(SELECTED_CLASS);
            selected_elements.splice($.inArray(elem, selected_elements), 1);
        } else if (w_elem.hasClass(REJECTED_CLASS)) {
            w_elem.removeClass(REJECTED_CLASS);
            rejected_elements.splice($.inArray(elem, rejected_elements), 1);
        } else if (w_elem.hasClass(SUGGESTED_CLASS)) {
            w_elem.addClass(REJECTED_CLASS);
            rejected_elements.push(elem);
        } else {
            if (select_mode == 'exact' && selected_elements.length > 0) {
                $('.sg_selected').removeClass(SELECTED_CLASS);
                selected_elements = [];
            }
            //w_elem.addClass('sg_selected');
            selected_elements.push(elem);
        }

        var prediction = prediction_helper.predictCss(selected_elements,
            rejected_elements.concat(restricted_elements));

        if (select_mode == 'similar') {
            _clearSuggested();
            _suggestPredicted(prediction);
        }

        return prediction;
    };

    var _firstSelectedOrSuggestedParent = function (element) {
        if ($(element).hasClass(SUGGESTED_CLASS) || $(element).hasClass(SELECTED_CLASS)) {
            return element;
        }

        while (element.parentNode && (element = element.parentNode)) {
            if ($.inArray(element, restricted_elements) == -1) {
                if ($(element).hasClass(SUGGESTED_CLASS) || $(element).hasClass(SELECTED_CLASS)) {
                    return element;
                }
            }
        }

        return null;
    };


    var _px = function (p) {
        return p + 'px';
    };

    var _getTagPath = function (element) {
        if (element.parentNode) {
            return element.parentNode.tagName.toLowerCase() + ' ' + element.tagName.toLowerCase();
        } else {
            return element.tagName.toLowerCase();
        }
    };

    var _removeBorderFromDom = function () {
        if (b_top) {
            b_top.remove();
            b_bottom.remove();
            b_left.remove();
            b_right.remove();
        }
    };

    var _addBorderToDom = function () {
        document.body.appendChild(b_top.get(0));
        document.body.appendChild(b_bottom.get(0));
        document.body.appendChild(b_left.get(0));
        document.body.appendChild(b_right.get(0));
    };

    var _showBorders = function () {
        b_top.show();
        b_bottom.show();
        b_left.show();
        b_right.show();
    };

    var _removeBorders = function () {
        if (b_top) {
            b_top.hide();
            b_bottom.hide();
            b_left.hide();
            b_right.hide();
        }
    };

    var _clearSelected = function () {
        selected_elements = [];
        rejected_elements = [];

        $('.sg_selected').removeClass(SELECTED_CLASS);
        $('.sg_rejected').removeClass(REJECTED_CLASS);

        _removeBorders();
        _clearSuggested();
    };

    /**
     * Adds borders to selected element.
     *
     * Default implementation of selection renderer.
     * Can be overwritten with custom implementation as a parameter of init function.
     *
     * @param element
     * @private
     */
    var _selectionRenderer = function (element) {
        _removeBorders();
        _setupBorders();

        if (!element) {
            return;
        }

        var elem = $(element);
        var p = elem.offset();

        var top = p.top;
        var left = p.left;
        var width = elem.outerWidth();
        var height = elem.outerHeight();

        b_top.css('width', _px(width + BORDER_PADDING * 2 + BORDER_WIDTH * 2)).
            css('top', _px(top - BORDER_WIDTH - BORDER_PADDING)).
            css('left', _px(left - BORDER_PADDING - BORDER_WIDTH));
        b_bottom.css('width', _px(width + BORDER_PADDING * 2 + BORDER_WIDTH * 2 - 5)).
            css('top', _px(top + height + BORDER_PADDING)).
            css('left', _px(left - BORDER_PADDING - BORDER_WIDTH)).text(_getTagPath(element));
        b_left.css('height', _px(height + BORDER_PADDING * 2)).
            css('top', _px(top - BORDER_PADDING)).
            css('left', _px(left - BORDER_PADDING - BORDER_WIDTH));
        b_right.css('height', _px(height + BORDER_PADDING * 2)).
            css('top', _px(top - BORDER_PADDING)).
            css('left', _px(left + width + BORDER_PADDING));

        b_right.get(0).target_elem = b_left.get(0).target_elem = b_top.get(0).target_elem = b_bottom.get(0).target_elem = element;

        _showBorders();
    };

    var _getHost = function (url) {
        if (!url) return "";

        var a = document.createElement('a');
        a.href = url;
        return a.hostname;
    };

    var _makePlaceholderImage = function (element) {
        var jElement = $(element);

        var placeHolder = document.createElement('div');
        placeHolder.style.height = jElement.height() + 'px';
        placeHolder.style.width = jElement.width() + 'px';
        placeHolder.style.position = jElement.css('position');
        placeHolder.style.top = jElement.css('top');
        placeHolder.style.bottom = jElement.css('bottom');
        placeHolder.style.left = jElement.css('left');
        placeHolder.style.right = jElement.css('right');
        placeHolder.className += PLACEHOLDER_PREFIX;

        var icon = document.createElement('div');
        icon.className += PLACEHOLDER_PREFIX + "-icon sg_ignore";

        var domain = document.createElement('div');
        domain.textContent = _getHost(element.src);
        domain.className += PLACEHOLDER_PREFIX + "-domain sg_ignore";

        icon.appendChild(domain);
        placeHolder.appendChild(icon);

        return placeHolder;
    };

    var _removePlaceholders = function () {
        if (!placeholder_elements) {
            return;
        }

        var elements = placeholder_elements;
        for (var i = 0; i < elements.length; i++) {
            var current = elements[i];
            var id = PLACEHOLDER_PREFIX + i;
            $('#' + id).replaceWith($(current));
        }

        placeholder_elements = null;
    };

    var _placeholderClick = function (e) {
        var element = e.data.actualElement;

        _removeBorders();
        _removePlaceholders();

        _onElementSelected(element);
    };

    var _makeIFrameAndEmbededSelector = function () {
        placeholder_elements = $('iframe:not(.sg_ignore,:hidden),embed,object');
        var elements = placeholder_elements;
        for (var i = 0; i < elements.length; i++) {
            var current = elements[i];
            var placeHolder = _makePlaceholderImage(current);
            var id = PLACEHOLDER_PREFIX + i;

            placeHolder.setAttribute("id", id);
            $(current).replaceWith(placeHolder);
            $('#' + id).on('click', {'self': this, 'actualElement': current}, _placeholderClick);
        }
    };

    var _sgMouseover = function () {
        if (unbound) {
            return true;
        }

        if (this == document.body || this == document.body.parentNode) {
            return false;
        }

        var parent = _firstSelectedOrSuggestedParent(this);
        if (parent != null && parent != this) {
            _selectionRenderer(parent, true);
        }
        else {
            _selectionRenderer(this);
        }

        return false;
    };

    var _sgMouseout = function () {
        if (unbound) {
            return true;
        }

        if (this == document.body || this == document.body.parentNode) {
            return false;
        }

        _removeBorders();
        return false;
    };

    /**
     * Block clicks for a moment by covering this element with a div.
     *
     * @param elem
     * @returns {boolean}
     * @private
     */
    var _blockClicksOn = function (elem) {
        elem = $(elem);
        var p = elem.offset();
        var block = $('<div>').css('position', 'absolute').css('z-index', '9999999').css('width', _px(elem.outerWidth())).
            css('height', _px(elem.outerHeight())).css('top', _px(p.top)).css('left', _px(p.left)).
            css('background-color', '');
        document.body.appendChild(block.get(0));

        setTimeout(function () {
            block.remove();
        }, 400);

        return false;
    };

    var _sgMousedown = function (e) {
        e.preventDefault();

        if (unbound) {
            return true;
        }

        var elem = this;
        var w_elem = $(elem);
        if (w_elem.hasClass(BORDER_CLASS)) {
            //Clicked on one of our floating borders, target the element that we are bordering.
            elem = elem.target_elem || elem;
        }

        if (elem == document.body || elem == document.body.parentNode) {
            return;
        }

        // Don't allow selection of elements that have a selected child.
        if ($('.sg_selected', this).get(0)) {
            _blockClicksOn(elem);
        }

        var prediction = _makePredictionPath(elem);
        _setPath(prediction);

        _removeBorders();
        _blockClicksOn(elem);

        // Refresh the borders by triggering a new mouseover event.
        w_elem.trigger("mouseover", {'self': this});

        _onElementSelected(elem);

        return false;
    };


    var _setupEventHandlers = function () {
        _makeIFrameAndEmbededSelector();

        var sgIgnore = $("body *:not(.sg_ignore)");
        sgIgnore.on("mouseover", {'self': this}, _sgMouseover);
        sgIgnore.on("mouseout", {'self': this}, _sgMouseout);
        sgIgnore.on("click", {'self': this}, _sgMousedown);
    };

    var _deleteEventHandlers = function () {
        _removePlaceholders();

        var elements = $("body *");
        elements.off("mouseover", _sgMouseover);
        elements.off("mouseout", _sgMouseout);
        elements.off("click", _sgMousedown);
    };

    var _setupBorders = function () {
        if (!b_top) {
            var width = _px(BORDER_WIDTH);

            b_top = $('<div>').addClass(BORDER_CLASS).css('height', width).hide()
                .on("click", {'self': this}, _sgMousedown);
            b_bottom = $('<div>').addClass(BORDER_CLASS).addClass('sg_bottom_border')
                .css('height', _px(BORDER_WIDTH + 6)).hide()
                .bind("click", {'self': this}, _sgMousedown);
            b_left = $('<div>').addClass(BORDER_CLASS).css('width', width).hide()
                .on("click", {'self': this}, _sgMousedown);
            b_right = $('<div>').addClass(BORDER_CLASS).css('width', width).hide()
                .on("click", {'self': this}, _sgMousedown);

            _addBorderToDom();
        }
    };


    // PUBLIC API

    /**
     * Starts selector module.
     *
     * @param onElementSelected callback function
     * @param selectionRenderer optional function contains selection presentation implementation
     */
    api.init = function (onElementSelected, selectionRenderer) {

        _onElementSelected = onElementSelected;
        if (selectionRenderer && typeof selectionRenderer === "function") {
            _selectionRenderer = selectionRenderer;
        }

        restricted_elements = $.map(['html', 'body', 'head', 'base'], function (selector) {
            return $(selector).get(0);
        });
        prediction_helper = new DomPredictionHelper($, String);

        _setupEventHandlers();
        unbound = false;
    };

    /**
     * Resets state of selector.
     * Clears current selection.
     */
    api.reset = function () {
        _clearSelected();
        _setPath();
    };

    /**
     * Destroys selector module.
     * Removes all selector elements and unbinds event handlers.
     */
    api.close = function () {
        unbound = true;

        _removeBorderFromDom();
        _deleteEventHandlers();
    };

    /**
     * Selects specified element.
     * Marks element as selected and holds selection on it.
     *
     * @param element
     */
    api.selectElement = function (element) {
        _selectionRenderer(element);

        unbound = true;
        _deleteEventHandlers();
    };

    return api;

})(AdguardSelectorLib || {});
