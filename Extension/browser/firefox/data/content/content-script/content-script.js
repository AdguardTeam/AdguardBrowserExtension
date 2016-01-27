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
var contentPage = {

    listenerRegistered: false,
    callbacks: Object.create(null),
    callbackId: 0,

    CONTENT_TO_BACKGROUND_CHANNEL: 'content-background-channel',
    BACKGROUND_TO_CONTENT_CHANNEL: 'background-content-channel',

    sendMessage: function (message, callback) {

        if (callback) {
            var callbackId = (this.callbackId += 1);
            message.callbackId = callbackId;
            this.callbacks[callbackId] = callback;
        }

        if (!this.listenerRegistered) {

            this.listenerRegistered = true;
            
            self.port.on(this.CONTENT_TO_BACKGROUND_CHANNEL, function (response) {
                if ('callbackId' in response) {
                    var callbackId = response.callbackId;
                    var callback = this.callbacks[callbackId];
                    callback(response);
                    delete this.callbacks[callbackId];
                }
            }.bind(this));
        }

        self.port.emit(this.CONTENT_TO_BACKGROUND_CHANNEL, message);
    },

    onMessage: {

        listeners: null,

        addListener: function (listener) {

            if (!this.listeners) {

                this.listeners = [];

                self.port.on(contentPage.BACKGROUND_TO_CONTENT_CHANNEL, function (message) {
                    for (var i = 0; i < this.listeners.length; i++) {
                        var listener = this.listeners[i];
                        listener(message);
                    }
                }.bind(this));
            }

            this.listeners.push(listener);
        }
    }
};

var i18n = {

    getMessage: function (messageId, args) {
        var message = self.options.i18nMessages[messageId];
        if (!message) {
            throw 'Message ' + messageId + ' not found';
        }
        return I18nHelper.replacePlaceholders(message, args);
    }
};