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
(function () {
	$.fn.extend({

		radioButton: function () {
			this.defaults = {
				wrapperClassName: 'clearfix'
			};

			var defaults = this.defaults;

			return $(this).each(function () {
				if ($(this).hasClass('ui-planeta')) {
					return;
				}

				var input = this;

				var div = $('<div></div>').addClass(defaults.wrapperClassName)[0];
				var radiobox = $('<span></span>').addClass('radiobox').attr('group-name', $(this).attr('name'))[0];
				$(div).append(radiobox);
				$(div).append($('<span></span>').addClass('radiobox-label').text($(this).parents('label').text()));

				var label = $(input).parents('label');
				var el = label ? label : $(input);

				el.after(div);

				var onRadioButtonChanged = function (event) {
					if ($(input).is(':checked')) {
						// Unchecking all radio buttons
						$(input).closest('.row').find('.radiobox').each(function () {
							if ($(this).attr('group-name') == $(input).attr('name')) {
								$(this).removeClass('active');
							}
						});
						$(radiobox).addClass('active');
					} else {
						$(radiobox).removeClass('active');
					}
				};
				$(input).change(onRadioButtonChanged);

				$(div).click(function (event) {
					event.preventDefault();
					$(input).click();
				});
				onRadioButtonChanged();
				$(div).css('width', el.css('width'));

				$(this).addClass('ui-planeta');
				el.hide();
			});
		},

		checkbox: function () {
			this.defaults = {
				wrapperClassName: 'clearfix',
				ignoreElementWidth: true
			};

			var defaults = this.defaults;

			return $(this).each(function () {
				if ($(this).hasClass('ui-planeta')) {
					return;
				}

				var input = this;

				var div = $('<div></div>').addClass(defaults.wrapperClassName)[0];
				var checkbox = $('<span></span>').addClass('checkbox')[0];
				$(div).append(checkbox);

				var text = $(this).parents('label').clone().children().remove().end().text();
				var label = $('<span></span>').addClass('checkbox-label').text(text);
				$(div).append(label);

				label = $(input).parents('label');
				var el = label ? label : $(input);

				el.after(div);

				var checkboxChange = function (event) {
					if ($(input).attr('checked')) {
						$(checkbox).addClass('active');
					} else {
						$(checkbox).removeClass('active');
					}
				};

				$(input).change(checkboxChange);

				$(div).click(function (event) {
					if ($(event.target).is('a')) return;

					event.preventDefault();
					if ($(input).attr('checked')) {
						$(input).attr('checked', false);
					} else {
						$(input).attr('checked', true);
					}
					$(input).change();
				});
				checkboxChange();

				if (!defaults.ignoreElementWidth) {
					$(div).css('width', el.css('width'));
				}

				$(this).addClass('ui-planeta');
				el.hide();
			});
		}
	});
})();