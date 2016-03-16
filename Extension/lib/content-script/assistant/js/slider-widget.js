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
 * Slider widget
 */
var SliderWidget = (function (api, $) {

    var PLACEHOLDER_CLASS = "adg-slide ui-slider ui-slider-horizontal ui-widget ui-widget-content ui-corner-all";
    var HANDLE_CLASS = "ui-slider-handle";
    var HANDLE_FULL_CLASS = "ui-slider-handle ui-state-default ui-corner-all";
    var TICK_CLASS = "tick";
    var TICK_FULL_CLASS = "tick ui-widget-content";
    var TICK_LEFT_COLOR = "#36BA53";
    var TICK_RIGHT_COLOR = "#E0DFDB";

    var placeholder = null;

    var min = 0;
    var max = 1;
    var value = 0;

    var onValueChanged = null;


    var refresh = function () {
        var handle = $(placeholder).find("." + HANDLE_CLASS);
        handle.css('left', (value - 1) * 100 / (max - min) + "%");

        var ticks = $(placeholder).find("." + TICK_CLASS);
        for (var i = 0; i < ticks.length; i++) {
            if (i + 1 < value) {
                $(ticks[i]).css('background-color', TICK_LEFT_COLOR);
            } else {
                $(ticks[i]).css('background-color', TICK_RIGHT_COLOR);
            }
        }
    };

    var render = function () {
        $(placeholder).addClass(PLACEHOLDER_CLASS);

        var handle = $('<a>', {
            "href": "#",
            "class": HANDLE_FULL_CLASS
        });
        $(placeholder).append(handle);

        var count = max - min;
        var prepare = function (i) {
            var tick = $('<div>', {"class": TICK_FULL_CLASS}).appendTo($(placeholder));
            tick.css({
                left: (100 / count * i) + '%',
                width: (100 / count) + '%'
            });
        };

        for (var i = 0; i < count; i++) {
            prepare(i);
        }

        refresh();
    };

    var setValue = function(v) {
        value = v;

        refresh();

        onValueChanged(value);
    };

    var bindEvents = function () {
        var $placeholder = $(placeholder);
        var $handle = $(placeholder).find("." + HANDLE_CLASS);

        $(document).mouseup(function () {
            $placeholder.unbind('mousemove');
            $handle.unbind('mousemove');
        });

        //While the ui-slider-handle is being held down reference it parent.
        $handle.mousedown(function (e) {
            e.preventDefault();
            return $(this).parent().mousedown();
        });

        var $sliderOffsetLeft = $placeholder.offset().left;
        var $sliderWidth = $placeholder.width();

        var getSliderValue = function (pageX) {
            return (max - min) / $sliderWidth * (pageX - $sliderOffsetLeft) + min;
        };

        //This will prevent the slider from moving if the mouse is taken out of the
        //slider area before the mouse down has been released.
        $placeholder.hover(function () {
            $placeholder.bind('click', function (e) {
                //calculate the correct position of the slider set the value
                var value = getSliderValue(e.pageX);
                setValue(value);
            });
            $placeholder.mousedown(function () {
                $(this).bind('mousemove', function (e) {
                    //calculate the correct position of the slider set the value
                    var value = getSliderValue(e.pageX);
                    setValue(value);
                });
            }).mouseup(function () {
                $(this).unbind('mousemove');
            });
        }, function () {
            $placeholder.unbind('mousemove');
            $placeholder.unbind('click');
        });
    };

    /**
     *
     * @param placeholderElement
     * @param options
     */
    api.init = function (placeholderElement, options) {
        placeholder = placeholderElement;

        min = options.min;
        max = options.max;
        value = options.value;
        onValueChanged = options.onValueChanged;

        render();
        bindEvents();
    };

    return api;
})(SliderWidget || {}, $);