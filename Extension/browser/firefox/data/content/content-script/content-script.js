/* global sendFrameEvent */
/* global addFrameEventListener */
/* global I18nHelper */
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
 * contentPage object is used for messaging between a content script and a frame script.
 */
var contentPage = (function(api) {
    
    var CONTENT_TO_BACKGROUND_CHANNEL = 'content-background-channel';
    var BACKGROUND_TO_CONTENT_CHANNEL = 'background-content-channel';
    
    var listenerRegistered = false;
    var callbacks = Object.create(null);
    var callbackId = 0;
    
    /**
     * Called when response is received from the chrome process
     * 
     * @param response Response object got from the chrome process
     * @private
     */
    var onResponseReceived = function(response) {
        if ('callbackId' in response) {
            var callbackId = response.callbackId;
            var callback = callbacks[callbackId];
            callback(response);
            delete callbacks[callbackId];
        }
    };
    
    /**
     * Sends message to the chrome process
     * 
     * @param message Message to send
     * @param callback Method that will be called in response
     * @public
     */
    var sendMessage = function (message, callback) {

        if (callback) {
            var messageCallbackId = (callbackId += 1);
            message.callbackId = messageCallbackId;
            callbacks[messageCallbackId] = callback;
        }

        if (!listenerRegistered) {
            listenerRegistered = true;

            if (typeof addFrameEventListener != 'undefined') {
                addFrameEventListener(CONTENT_TO_BACKGROUND_CHANNEL, onResponseReceived);
            } else {
                // TODO: Remove, deprecated
                self.port.on(CONTENT_TO_BACKGROUND_CHANNEL, onResponseReceived);                
            }
        }
        
        if (typeof sendFrameEvent != 'undefined') {
            sendFrameEvent(CONTENT_TO_BACKGROUND_CHANNEL, message);
        } else {
            // TODO: Remove, deprecated
            self.port.emit(CONTENT_TO_BACKGROUND_CHANNEL, message);            
        }
    };
    
    var onMessage = (function(onMessage) {
        var listeners = null;
        
        /**
         * This method is getting called when we get an event from the chrome process.
         */
        var onMessageReceived = function(message) {
            for (var i = 0; i < listeners.length; i++) {
                var listener = listeners[i];
                listener(message);
            }            
        };
        
        var addListener = function (listener) {

            if (!listeners) {
                listeners = [];
                
                if (typeof addFrameEventListener != 'undefined') {
                    addFrameEventListener(BACKGROUND_TO_CONTENT_CHANNEL, onMessageReceived);
                } else {
                    // TODO: Remove, deprecated
                    self.port.on(BACKGROUND_TO_CONTENT_CHANNEL, onMessageReceived);                    
                }
            }

            listeners.push(listener);
        };
        
        /**
         * Expose onMessage API
         */
        onMessage.addListener = addListener;
        return onMessage;
    })(onMessage || {}); 

    /**
     * Expose contentPage public API
     */
    api.sendMessage = sendMessage;
    api.onMessage = onMessage;
    return api;
})(contentPage || {});

/**
 * This object is used to pass translations from the chrome process to the content.
 */
var i18n = (function(api) {
    
    var getMessage = function (messageId, args) {
        if (typeof getI18nMessage != 'undefined') {
            var message = getI18nMessage[messageId];
            if (!message) {
                throw 'Message ' + messageId + ' not found';
            }

            return I18nHelper.replacePlaceholders(message, args);
        }

        return null;
    };
    
    /**
     * Expose i18n public API
     */
    api.getMessage = getMessage;
    return api;    
})(i18n || {});