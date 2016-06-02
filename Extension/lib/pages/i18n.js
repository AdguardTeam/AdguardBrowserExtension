/* global I18nHelper, $ */
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

i18n.translateElement = function (element, messageId, args) {
    var message = i18n.getMessage(messageId, args);
    I18nHelper.translateElement(element, message);
};

i18n.localizeDocument = function () {
    $("[i18n]").each(function () {
        var $el = $(this);
        var message = i18n.getMessage($el.attr("i18n"));
        I18nHelper.translateElement(this, message);
    });
    $("[i18n-plhr]").each(function () {
        var $el = $(this);
        $el.attr("placeholder", i18n.getMessage($el.attr("i18n-plhr")));
    });
    $("[i18n-href]").each(function () {
        var $el = $(this);
        $el.attr("href", i18n.getMessage($el.attr("i18n-href")));
    });
    $("[i18n-title]").each(function () {
        var $el = $(this);
        $el.attr("title", i18n.getMessage($el.attr("i18n-title")));
    });
};

$(document).ready(i18n.localizeDocument);