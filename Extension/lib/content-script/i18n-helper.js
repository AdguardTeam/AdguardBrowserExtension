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
var I18nHelper = {

    translateElement: function (element, message) {

        try {
            while (element.lastChild) {
                element.removeChild(element.lastChild);
            }

            this.processString(message, element);
        } catch (ex) {
            // Ignore exceptions
        }
    },

    replacePlaceholders: function (text, args) {
        if (!text) {
            return "";
        }
        if (args && args.length > 0) {
            text = text.replace(/\$(\d+)/g, function (match, number) {
                return typeof args[number - 1] != "undefined" ? args[number - 1] : match;
            });
        }
        return text;
    },

    processString: function (str, element) {

        var el;

        var match1 = /^([^]*?)<(a|strong|span|i)([^>]*)>(.*?)<\/\2>([^]*)$/m.exec(str);
        var match2 = /^([^]*?)<(br|input)([^>]*)\/?>([^]*)$/m.exec(str);
        if (match1) {

            this.processString(match1[1], element);

            el = this.createElement(match1[2], match1[3]);

            this.processString(match1[4], el);
            element.appendChild(el);

            this.processString(match1[5], element);

        } else if (match2) {

            this.processString(match2[1], element);

            el = this.createElement(match2[2], match2[3]);
            element.appendChild(el);

            this.processString(match2[4], element);

        } else {
            element.appendChild(document.createTextNode(str.replace(/&nbsp;/g, '\u00A0')));
        }
    },

    createElement: function (tagName, attributes) {

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
};
