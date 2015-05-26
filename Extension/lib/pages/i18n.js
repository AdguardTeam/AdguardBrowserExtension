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
if (!window.ext.i18n) {

	var l10n = ext.backgroundPage.getWindow().l10n;

	ext.i18n = (function () {

		function getText(text, args) {
			if (!text) {
				return "";
			}
			if (args && args.length > 0) {
				text = text.replace(/\$(\d+)/g, function (match, number) {
					return typeof args[number - 1] != "undefined" ? args[number - 1] : match;
				});
			}
			return text;
		}

		return {
			getMessage: function (key, args) {
				return getText(l10n.get(key), args);
			}
		};
	})();
}

ext.i18n.translateElement = function (element, messageId, args) {

	function createElement(tagName, attributes) {

		var el = document.createElement(tagName);
		if (!attributes) {
			return el;
		}

		var attrs = attributes.split(/([a-z]+='[^']+')/);
		for (var i = 0; i < attrs.length; i++) {
			var attr = attrs[i].trim();
			if (!attr) {
				continue;
			}
			var index = attr.indexOf("=");
			var attrName;
			var attrValue;
			if (index > 0) {
				attrName = attr.substring(0, index);
				attrValue = attr.substring(index + 2, attr.length - 1);
			}
			if (attrName && attrValue) {
				el.setAttribute(attrName, attrValue);
			}
		}

		return el;
	}

	function processString(str, element) {

		var match1 = /^(.*?)<(a|strong|span|i)([^>]*)>(.*?)<\/\2>(.*)$/.exec(str);
		var match2 = /^(.*?)<(br|input)([^>]*)\/?>(.*)$/.exec(str);
		if (match1) {

			processString(match1[1], element);

			var e = createElement(match1[2], match1[3]);

			processString(match1[4], e);
			element.appendChild(e);

			processString(match1[5], element);

		} else if (match2) {

			processString(match2[1], element);

			var e = createElement(match2[2], match2[3]);
			element.appendChild(e);

			processString(match2[4], element);

		} else {
			element.appendChild(document.createTextNode(str.replace(/&nbsp;/g, '\u00A0')));
		}
	}

	while (element.lastChild) {
		element.removeChild(element.lastChild);
	}

	processString(ext.i18n.getMessage(messageId, args), element);
};

document.addEventListener('DOMContentLoaded', function () {
	$("[i18n]").each(function () {
		ext.i18n.translateElement(this, $(this).attr("i18n"));
	});
	$("[i18n-plhr]").each(function () {
		var $el = $(this);
		$el.attr("placeholder", ext.i18n.getMessage($el.attr("i18n-plhr")));
	});
	$("[i18n-href]").each(function () {
		var $el = $(this);
		$el.attr("href", ext.i18n.getMessage($el.attr("i18n-href")));
	});
	$("[i18n-title]").each(function () {
		var $el = $(this);
		$el.attr("title", ext.i18n.getMessage($el.attr("i18n-title")));
	});
});