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
/*global contentPage*/

/**
 * The function overrides window.WebSocket with our wrapper, that will check url with filters through messaging with content-script.
 * 
 * IMPORTANT NOTE: 
 * This function is first loaded as a content script. The only purpose of it is to call 
 * the "toString" method and use resulting string as a text content for injected script.
 */
var overrideWebSocket = function () { // jshint ignore:line

    /**
     * Sends a message to the content-script to check if WebSocket should be allowed or not.
     */
    var messageChannel = (function() {
        'use strict';

        // Save original postMessage and addEventListener functions to prevent webpage from tampering both. 
        var postMessage = window.postMessage;
        var addEventListener = window.addEventListener;

        // Current request ID (incremented every time we send a new message)    
        var currentRequestId = 0;
        var requestsMap = {};

        /**
         * Handles messages sent from the content script back to the page script.
         * 
         * @param event Event with necessary data
         */
        var onMessageReceived = function(event) {
            
            if (!event.data || !event.data.direction || event.data.direction != "to-page-script@adguard") {
                return;
            }
            
            var requestData = requestsMap[event.data.requestId];
            if (requestData) {
                var wrapper = requestData.wrapper;
                requestData.onResponseReceived(wrapper, event.data.block);
                delete requestsMap[event.data.requestId];
            }
        };
        
        /** 
         * @param url                The URL to which WS is willing to connect
         * @param wrapper            WebSocket wrapper instance
         * @param onResponseReceived Called when response is received
         */
        var sendMessage = function(url, wrapper, onResponseReceived) {
            
            if (currentRequestId === 0) {
                // Subscribe to response when this method is called for the first time
                addEventListener.call(window, "message", onMessageReceived, false);
            }
            
            var requestId = ++currentRequestId;
            var requestData = {
                wrapper: wrapper,
                onResponseReceived: onResponseReceived
            };            
            requestsMap[requestId] = requestData;
            
            var message = {
                requestId: requestId,
                direction: 'from-page-script@adguard',
                elementUrl: url,
                documentUrl: document.URL
            };
            
            // Send a message to the background page to check if the request should be blocked
            postMessage.call(window, message, "*");
        };

        return {
            sendMessage: sendMessage
        };
    })();

    /**
     * WebSocket wrapper implementation.
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/349
     *
     * Based on:
     * https://github.com/adblockplus/adblockpluschrome/commit/457a336ee55a433217c3ffe5d363e5c6980f26f4
     */
    (function(channel) {
        // As far as possible we must track everything we use that could be
        // sabotaged by the website later in order to circumvent us.
        var RealWebSocket = WebSocket;
        var closeWebSocket = Function.prototype.call.bind(RealWebSocket.prototype.close);

        function checkRequest(url, callback) {
            // This is the key point: checking if this WS should be blocked or not
            channel.sendMessage(url, this, function (wrapper, blockConnection) {
                callback(blockConnection);
            });
        }

        function WrappedWebSocket(url, protocols) {
            // Throw correct exceptions if the constructor is used improperly.
            if (!(this instanceof WrappedWebSocket)) return RealWebSocket();
            if (arguments.length < 1) return new RealWebSocket();

            var websocket = new RealWebSocket(url, protocols);

            checkRequest(websocket.url, function(blocked) {
                if (blocked)
                    closeWebSocket(websocket);
            });

            return websocket;
        }

        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/488
        WrappedWebSocket.prototype = RealWebSocket.prototype;
        WebSocket = WrappedWebSocket.bind();

        Object.defineProperties(WebSocket, {
            CONNECTING: {value: RealWebSocket.CONNECTING, enumerable: true},
            OPEN: {value: RealWebSocket.OPEN, enumerable: true},
            CLOSING: {value: RealWebSocket.CLOSING, enumerable: true},
            CLOSED: {value: RealWebSocket.CLOSED, enumerable: true},
            prototype: {value: RealWebSocket.prototype}
        });

        RealWebSocket.prototype.constructor = WebSocket;

        var me = document.currentScript;		
        if ( me && me.parentNode !== null ) {		
            me.parentNode.removeChild(me);		
        }
    })(messageChannel);
};

/**
 * This function is executed in the content script. It starts listening to events from the page script and passes them further to the background page.
 */
var initPageMessageListener = function() { // jshint ignore:line

    /**
     * Listener for websocket wrapper messages.
     *
     * @param event
     */
    function pageMessageListener(event) {
        if (!(event.source == window &&
            event.data.direction &&
            event.data.direction == "from-page-script@adguard" &&
            event.data.elementUrl &&
            event.data.documentUrl)) {
            return;
        }

        var message = {
            type: 'checkWebSocketRequest',
            elementUrl: event.data.elementUrl,
            documentUrl: event.data.documentUrl,
            requestId: event.data.requestId
        };

        contentPage.sendMessage(message, function (response) {
            if (!response) {
                return;
            }
            
            var message = {
                direction: 'to-page-script@adguard',
                elementUrl: event.data.elementUrl,
                documentUrl: event.data.documentUrl,
                requestId: response.requestId,
                block: response.block
            };
            
            event.source.postMessage(message, event.origin);
        });
    }

    window.addEventListener("message", pageMessageListener, false);    
};