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

        return {
            getMessage: function (key, args) {
                return I18nHelper.replacePlaceholders(l10n.get(key), args);
            }
        };
    })();
}

ext.i18n.translateElement = function (element, messageId, args) {
    var message = ext.i18n.getMessage(messageId, args);
    I18nHelper.translateElement(element, message);
};

document.addEventListener('DOMContentLoaded', function () {
    I18nHelper.translateAll(function (messageId) {
        return ext.i18n.getMessage(messageId);
    });
});