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
var CreateSlider = function () {
	var options = window.unsafeOptions
	var max = options.max - 1;
	var slider = $("#slider").slider({
		min: options.min,
		max: options.max,
		range: 'min',
		value: options.value,
		slide: function (event, ui) {
			refreshTicks(ui.value);
			var delta = options.value - ui.value;
			options.callback(delta);
		}
	});
	var refreshTicks = function (value) {
		var ticks = $(".tick");
		var i;
		for (i = 0; i < ticks.length; i++) {
			if (i + 1 < value) {
				$(ticks[i]).css('background-color', '#86BFCE');
			}
			else {
				$(ticks[i]).css('background-color', '#E6ECED');
			}
		}
	};
	var prepare = function (i) {
		var tick = $('<div>', {class: 'tick ui-widget-content'}).appendTo(slider);
		tick.css({
			left: (100 / max * i) + '%',
			width: (100 / max) + '%'
		});
	};
	//Prepare ticks
	var i;
	for (i = 0; i < max; i++) {
		prepare(i);
	}
	refreshTicks(options.value);
};

