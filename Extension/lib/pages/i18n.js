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

/* global I18nHelper, i18n */

i18n.translateElement = function (element, messageId, args) {
    var message = i18n.getMessage(messageId, args);
    I18nHelper.translateElement(element, message);
};

document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[i18n]").forEach(function (el) {
        var message = i18n.getMessage(el.getAttribute("i18n"));
        I18nHelper.translateElement(el, message);
    });
    document.querySelectorAll("[i18n-plhr]").forEach(function (el) {
        el.setAttribute("placeholder", i18n.getMessage(el.getAttribute("i18n-plhr")));
    });
    document.querySelectorAll("[i18n-href]").forEach(function (el) {
        el.setAttribute("href", i18n.getMessage(el.getAttribute("i18n-href")));
    });
    document.querySelectorAll("[i18n-title]").forEach(function (el) {
        el.setAttribute("title", i18n.getMessage(el.getAttribute("i18n-title")));
    });
});