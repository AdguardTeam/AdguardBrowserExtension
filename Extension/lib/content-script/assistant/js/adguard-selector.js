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

    var borderTop = null;
    var borderLeft = null;
    var borderRight = null;
    var borderBottom = null;

    var PLACEHOLDER_PREFIX = 'adguard-placeholder';
    var placeholderElements = null;

    var restrictedElements = null;
    var predictionHelper = null;

    var SUGGESTED_CLASS = "sg_suggested";
    var SELECTED_CLASS = "sg_selected";
    var REJECTED_CLASS = "sg_rejected";
    var IGNORED_CLASS = "sg_ignore";

    var selectedElements = [];
    var rejectedElements = [];

    var selectMode = 'exact';
    var unbound = true;
    var onElementSelectedHandler = null;


    // PRIVATE METHODS

    var clearSuggested = function () {
        $('.sg_suggested').removeClass(SUGGESTED_CLASS);
    };

    var suggestPredicted = function (prediction) {
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

    var makePredictionPath = function (elem) {
        var w_elem = $(elem);

        if (w_elem.hasClass(SELECTED_CLASS)) {
            w_elem.removeClass(SELECTED_CLASS);
            selectedElements.splice($.inArray(elem, selectedElements), 1);
        } else if (w_elem.hasClass(REJECTED_CLASS)) {
            w_elem.removeClass(REJECTED_CLASS);
            rejectedElements.splice($.inArray(elem, rejectedElements), 1);
        } else if (w_elem.hasClass(SUGGESTED_CLASS)) {
            w_elem.addClass(REJECTED_CLASS);
            rejectedElements.push(elem);
        } else {
            if (selectMode == 'exact' && selectedElements.length > 0) {
                $('.sg_selected').removeClass(SELECTED_CLASS);
                selectedElements = [];
            }
            //w_elem.addClass('sg_selected');
            selectedElements.push(elem);
        }

        var prediction = predictionHelper.predictCss(selectedElements,
            rejectedElements.concat(restrictedElements));

        if (selectMode == 'similar') {
            clearSuggested();
            suggestPredicted(prediction);
        }

        return prediction;
    };

    var firstSelectedOrSuggestedParent = function (element) {
        if ($(element).hasClass(SUGGESTED_CLASS) || $(element).hasClass(SELECTED_CLASS)) {
            return element;
        }

        while (element.parentNode && (element = element.parentNode)) {
            if ($.inArray(element, restrictedElements) == -1) {
                if ($(element).hasClass(SUGGESTED_CLASS) || $(element).hasClass(SELECTED_CLASS)) {
                    return element;
                }
            }
        }

        return null;
    };


    var px = function (p) {
        return p + 'px';
    };

    var getTagPath = function (element) {
        if (element.parentNode) {
            return element.parentNode.tagName.toLowerCase() + ' ' + element.tagName.toLowerCase();
        } else {
            return element.tagName.toLowerCase();
        }
    };

    var removeBorderFromDom = function () {
        if (borderTop) {
            borderTop.remove();
            borderBottom.remove();
            borderLeft.remove();
            borderRight.remove();
        }
    };

    var addBorderToDom = function () {
        document.body.appendChild(borderTop.get(0));
        document.body.appendChild(borderBottom.get(0));
        document.body.appendChild(borderLeft.get(0));
        document.body.appendChild(borderRight.get(0));
    };

    var showBorders = function () {
        borderTop.show();
        borderBottom.show();
        borderLeft.show();
        borderRight.show();
    };

    var removeBorders = function () {
        if (borderTop) {
            borderTop.hide();
            borderBottom.hide();
            borderLeft.hide();
            borderRight.hide();
        }
    };

    var clearSelected = function () {
        selectedElements = [];
        rejectedElements = [];

        $('.sg_selected').removeClass(SELECTED_CLASS);
        $('.sg_rejected').removeClass(REJECTED_CLASS);

        removeBorders();
        clearSuggested();
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
    var selectionRenderer = function (element) {
        removeBorders();
        setupBorders();

        if (!element) {
            return;
        }

        var elem = $(element);
        var p = elem.offset();

        var top = p.top;
        var left = p.left;
        var width = elem.outerWidth();
        var height = elem.outerHeight();

        borderTop.css('width', px(width + BORDER_PADDING * 2 + BORDER_WIDTH * 2)).
            css('top', px(top - BORDER_WIDTH - BORDER_PADDING)).
            css('left', px(left - BORDER_PADDING - BORDER_WIDTH));
        borderBottom.css('width', px(width + BORDER_PADDING * 2 + BORDER_WIDTH * 2 - 5)).
            css('top', px(top + height + BORDER_PADDING)).
            css('left', px(left - BORDER_PADDING - BORDER_WIDTH)).text(getTagPath(element));
        borderLeft.css('height', px(height + BORDER_PADDING * 2)).
            css('top', px(top - BORDER_PADDING)).
            css('left', px(left - BORDER_PADDING - BORDER_WIDTH));
        borderRight.css('height', px(height + BORDER_PADDING * 2)).
            css('top', px(top - BORDER_PADDING)).
            css('left', px(left + width + BORDER_PADDING));

        borderRight.get(0).target_elem = borderLeft.get(0).target_elem = borderTop.get(0).target_elem = borderBottom.get(0).target_elem = element;

        showBorders();
    };

    var getHost = function (url) {
        if (!url) return "";

        var a = document.createElement('a');
        a.href = url;
        return a.hostname;
    };

    var makePlaceholderImage = function (element) {
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
        domain.textContent = getHost(element.src);
        domain.className += PLACEHOLDER_PREFIX + "-domain sg_ignore";

        icon.appendChild(domain);
        placeHolder.appendChild(icon);

        return placeHolder;
    };

    var removePlaceholders = function () {
        if (!placeholderElements) {
            return;
        }

        var elements = placeholderElements;
        for (var i = 0; i < elements.length; i++) {
            var current = elements[i];
            var id = PLACEHOLDER_PREFIX + i;
            $('#' + id).replaceWith($(current));
        }

        placeholderElements = null;
    };

    var placeholderClick = function (e) {
        var element = e.data.actualElement;

        removeBorders();
        removePlaceholders();

        onElementSelectedHandler(element);
    };

    var makeIFrameAndEmbededSelector = function () {
        placeholderElements = $('iframe:not(.sg_ignore,:hidden),embed,object');
        var elements = placeholderElements;
        for (var i = 0; i < elements.length; i++) {
            var current = elements[i];
            var placeHolder = makePlaceholderImage(current);
            var id = PLACEHOLDER_PREFIX + i;

            placeHolder.setAttribute("id", id);
            $(current).replaceWith(placeHolder);
            $('#' + id).on('click', {'self': this, 'actualElement': current}, placeholderClick);
        }
    };

    var sgMouseoverHandler = function () {
        if (unbound) {
            return true;
        }

        if (this == document.body || this == document.body.parentNode) {
            return false;
        }

        var parent = firstSelectedOrSuggestedParent(this);
        if (parent != null && parent != this) {
            selectionRenderer(parent, true);
        }
        else {
            selectionRenderer(this);
        }

        return false;
    };

    var sgMouseoutHandler = function () {
        if (unbound) {
            return true;
        }

        if (this == document.body || this == document.body.parentNode) {
            return false;
        }

        removeBorders();
        return false;
    };

    /**
     * Block clicks for a moment by covering this element with a div.
     *
     * @param elem
     * @returns {boolean}
     * @private
     */
    var blockClicksOn = function (elem) {
        elem = $(elem);
        var p = elem.offset();
        var block = $('<div>').css('position', 'absolute').css('z-index', '9999999').css('width', px(elem.outerWidth())).
            css('height', px(elem.outerHeight())).css('top', px(p.top)).css('left', px(p.left)).
            css('background-color', '');
        document.body.appendChild(block.get(0));

        setTimeout(function () {
            block.remove();
        }, 400);

        return false;
    };

    var sgMousedownHandler = function (e) {
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
            blockClicksOn(elem);
        }

        makePredictionPath(elem);

        removeBorders();
        blockClicksOn(elem);

        // Refresh the borders by triggering a new mouseover event.
        w_elem.trigger("mouseover", {'self': this});

        onElementSelectedHandler(elem);

        return false;
    };


    var setupEventHandlers = function () {
        makeIFrameAndEmbededSelector();

        var sgIgnore = $("body *:not(.sg_ignore)");
        sgIgnore.on("mouseover", {'self': this}, sgMouseoverHandler);
        sgIgnore.on("mouseout", {'self': this}, sgMouseoutHandler);
        sgIgnore.on("click", {'self': this}, sgMousedownHandler);
    };

    var deleteEventHandlers = function () {
        removePlaceholders();

        var elements = $("body *");
        elements.off("mouseover", sgMouseoverHandler);
        elements.off("mouseout", sgMouseoutHandler);
        elements.off("click", sgMousedownHandler);
    };

    var setupBorders = function () {
        if (!borderTop) {
            var width = px(BORDER_WIDTH);

            borderTop = $('<div>').addClass(BORDER_CLASS).css('height', width).hide()
                .on("click", {'self': this}, sgMousedownHandler);
            borderBottom = $('<div>').addClass(BORDER_CLASS).addClass('sg_bottom_border')
                .css('height', px(BORDER_WIDTH + 6)).hide()
                .bind("click", {'self': this}, sgMousedownHandler);
            borderLeft = $('<div>').addClass(BORDER_CLASS).css('width', width).hide()
                .on("click", {'self': this}, sgMousedownHandler);
            borderRight = $('<div>').addClass(BORDER_CLASS).css('width', width).hide()
                .on("click", {'self': this}, sgMousedownHandler);

            addBorderToDom();
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

        onElementSelectedHandler = onElementSelected;
        if (selectionRenderer && typeof selectionRenderer === "function") {
            selectionRenderer = selectionRenderer;
        }

        restrictedElements = $.map(['html', 'body', 'head', 'base'], function (selector) {
            return $(selector).get(0);
        });
        predictionHelper = new DomPredictionHelper($, String);

        setupEventHandlers();
        unbound = false;
    };

    /**
     * Resets state of selector.
     * Clears current selection.
     */
    api.reset = function () {
        clearSelected();
    };

    /**
     * Destroys selector module.
     * Removes all selector elements and unbinds event handlers.
     */
    api.close = function () {
        unbound = true;

        removeBorderFromDom();
        deleteEventHandlers();
    };

    /**
     * Selects specified element.
     * Marks element as selected and holds selection on it.
     *
     * @param element
     */
    api.selectElement = function (element) {
        selectionRenderer(element);

        unbound = true;
        deleteEventHandlers();
    };

    return api;

})(AdguardSelectorLib || {});
