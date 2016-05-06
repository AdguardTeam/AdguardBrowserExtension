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
     * https://github.com/gorhill/chromium-websocket-wrapper
     */
    (function(channel) {
        'use strict';
        var Wrapped = window.WebSocket;
        var map = new WeakMap();

        /**
         * Called when we got response from an extension.
         * Depending on the "blockConnection" parameter we either create a real WS or call onerror.
         *
         * @param wrapper           WebSocket wrapper object
         * @param blockConnection   True if connection should be blocked
         */
        var channelResponseReceived = function (wrapper, blockConnection) {

            var bag = map.get(wrapper);
            if (blockConnection) {
                if (bag.properties.onerror) {
                    bag.properties.onerror(new window.ErrorEvent('error'));
                }
                bag.properties.readyState = WebSocket.CLOSED;
                return;
            }

            var wrapped = null;
            try {
                wrapped = new Wrapped(bag.args.url, bag.args.protocols);
            } catch (ex) {
                console.error(ex);
            }

            if (wrapped === null) {
                return;
            }

            for (var p in bag.properties) { // jshint ignore:line
                wrapped[p] = bag.properties[p];
            }

            for (var i = 0, l; i < bag.listeners.length; i++) {
                l = bag.listeners[i];
                wrapped.addEventListener(l.ev, l.cb, l.fl);
            }

            map.set(wrapper, wrapped);
        };

        /**
         * Dummy function
         */
        var emptyFunction = function () {};

        /**
         * Gets value of the specified property from the wrapped websocket if it is already created.
         *
         * @param wrapper       Wrapper instance
         * @param prop          Property name
         * @param defaultValue  Default value to be returned if real WS does not yet exist
         * @returns {*}
         */
        var getWrappedProperty = function (wrapper, prop, defaultValue) {
            var wrapped = map.get(wrapper);
            if (!wrapped) {
                return defaultValue;
            }

            if (wrapped instanceof Wrapped) {
                return wrapped[prop];
            }

            return wrapped.properties.hasOwnProperty(prop) ?
                wrapped.properties[prop] :
                defaultValue;
        };

        /**
         * Sets value of the specified property.
         *
         * @param wrapper   Wrapper instance
         * @param prop      Property name
         * @param value     Value to set
         */
        var setWrappedProperty = function (wrapper, prop, value) {
            if (value instanceof Function) {
                value = value.bind(wrapper);
            }

            var wrapped = map.get(wrapper);
            if (!wrapped) {
                return;
            }

            if (wrapped instanceof Wrapped) {
                wrapped[prop] = value;
            } else {
                wrapped.properties[prop] = value;
            }
        };

        /**
         * Fake websocket constructor.
         * https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
         * 
         * Original websocket opens connection to a specified url. This wrapper works in a 
         * different way, it first checks if this WS connection should be blocked or not.
         *
         * @param url       The URL to which to connect
         * @param protocols Either a single protocol string or an array of protocol strings
         * @constructor
         */
        var WebSocket = function (url, protocols) {
            'native';
            if (window.location.protocol === 'https:' &&
                    url.lastIndexOf('ws:', 0) === 0) {
                // Just in case, plain text WS cannot be used on HTTPS webpages.
                // So we just trigger an exception.                     
                var ws = new Wrapped(url, protocols);
                if (ws) {
                    ws.close();
                }
            }

            Object.defineProperties(this, {
                'binaryType': {
                    get: function () {
                        return getWrappedProperty(this, 'binaryType', 'blob');
                    },
                    set: function (value) {
                        setWrappedProperty(this, 'binaryType', value);
                    }
                },
                'bufferedAmount': {
                    get: function () {
                        return getWrappedProperty(this, 'bufferedAmount', 0);
                    },
                    set: emptyFunction
                },
                'extensions': {
                    get: function () {
                        return getWrappedProperty(this, 'extensions', '');
                    },
                    set: emptyFunction
                },
                'onclose': {
                    get: function () {
                        return getWrappedProperty(this, 'onclose', null);
                    },
                    set: function (value) {
                        setWrappedProperty(this, 'onclose', value);
                    }
                },
                'onerror': {
                    get: function () {
                        return getWrappedProperty(this, 'onerror', null);
                    },
                    set: function (value) {
                        setWrappedProperty(this, 'onerror', value);
                    }
                },
                'onmessage': {
                    get: function () {
                        return getWrappedProperty(this, 'onmessage', null);
                    },
                    set: function (value) {
                        setWrappedProperty(this, 'onmessage', value);
                    }
                },
                'onopen': {
                    get: function () {
                        return getWrappedProperty(this, 'onopen', null);
                    },
                    set: function (value) {
                        setWrappedProperty(this, 'onopen', value);
                    }
                },
                'protocol': {
                    get: function () {
                        return getWrappedProperty(this, 'protocol', '');
                    },
                    set: emptyFunction
                },
                'readyState': {
                    get: function () {
                        return getWrappedProperty(this, 'readyState', 0);
                    },
                    set: emptyFunction
                },
                'url': {
                    get: function () {
                        return getWrappedProperty(this, 'url', '');
                    },
                    set: emptyFunction
                }
            });

            /**
             * Store this wrapper into a map along with a properties bag object.
             * Until we figure out what to do with this WS, we will 
             * save all properties and listeners into that bag.
             */
            map.set(this, {
                args: {
                    url: url, 
                    protocols: protocols
                },
                listeners: [],
                properties: {}
            });

            // This is the key point: checking if this WS should be blocked or not
            channel.sendMessage(url, this, channelResponseReceived);
        };

        // Safari doesn't have EventTarget
        var EventTarget = window.EventTarget || Element;
        WebSocket.prototype = Object.create(EventTarget.prototype, {
            CONNECTING: {value: 0},
            OPEN: {value: 1},
            CLOSING: {value: 2},
            CLOSED: {value: 3},
            addEventListener: {
                enumerable: true,
                value: function (ev, cb, fl) {
                    if (cb instanceof Function === false) {
                        return;
                    }
                    var wrapped = map.get(this);
                    if (!wrapped) {
                        return;
                    }
                    var cbb = cb.bind(this);
                    if (wrapped instanceof Wrapped) {
                        wrapped.addEventListener(ev, cbb, fl);
                    } else {
                        wrapped.listeners.push({ev: ev, cb: cbb, fl: fl});
                    }
                },
                writable: true
            },
            close: {
                enumerable: true,
                value: function (code, reason) {
                    'native';
                    var wrapped = map.get(this);
                    if (wrapped instanceof Wrapped) {
                        wrapped.close(code, reason);
                    }
                },
                writable: true
            },
            removeEventListener: {
                enumerable: true,
                value: function (ev, cb, fl) {
                    // TODO: Implement
                },
                writable: true
            },
            send: {
                enumerable: true,
                value: function (data) {
                    'native';
                    var wrapped = map.get(this);
                    if (wrapped instanceof Wrapped) {
                        wrapped.send(data);
                    }
                },
                writable: true
            }
        });

        WebSocket.CONNECTING = 0;
        WebSocket.OPEN = 1;
        WebSocket.CLOSING = 2;
        WebSocket.CLOSED = 3;
        window.WebSocket = WebSocket;
        
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
            requestType: "OTHER",
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