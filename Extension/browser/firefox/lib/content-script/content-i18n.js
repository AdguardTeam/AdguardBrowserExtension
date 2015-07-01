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

var i18n = (function () {

    var elementId = 0;
    var elements = Object.create(null);

    return {

        messages: Object.create(null),

        addMessages: function (messages) {
            this.messages = messages;
        },

        addMessage: function (key, value) {
            if (!(key in this.messages)) {
                this.messages[key] = value;
            }
        },

        getMessage: function (key, args) {
            return I18nHelper.replacePlaceholders(this.messages[key], args);
        },

        localizeElement: function (element, messageId, args) {

            elementId += 1;

            elements[elementId] = {
                element: element,
                args: args
            };

            self.port.emit('localizeContentElement', {
                elementId: elementId,
                messageId: messageId
            });

            self.port.on('localizeContentElement', function (result) {

                var messageId = result.messageId;
                var message = result.message;
                var element = elements[result.elementId].element;
                var args = elements[result.elementId].args;

                i18n.addMessage(messageId, message);
                i18n.translateElement(element, messageId, args);
            });
        },

        translateElement: function (element, messageId, args) {
            var message = this.getMessage(messageId, args);
            I18nHelper.translateElement(element, message);
        }
    };
})();

function localizeContentFile() {

    var messageIds = [];

    $("[i18n]").each(function () {
        messageIds.push($(this).attr('i18n'));
    });
    $("[i18n-plhr]").each(function () {
        messageIds.push($(this).attr('placeholder'));
    });
    $("[i18n-href]").each(function () {
        messageIds.push($(this).attr('href'));
    });
    $("[i18n-title]").each(function () {
        messageIds.push($(this).attr('title'));
    });

    self.port.emit('localizeContentFile', {messageIds: messageIds});

    self.port.once('localizeContentFile', function (message) {

        i18n.addMessages(message.messages);

        I18nHelper.translateAll(function (messageId) {
            return i18n.getMessage(messageId);
        });
    });
}

document.addEventListener('DOMContentLoaded', localizeContentFile);