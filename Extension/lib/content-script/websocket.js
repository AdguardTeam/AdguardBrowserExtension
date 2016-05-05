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
 * The function overrides window.WebSocket with our wrapper,
 * that will check url with filters through messaging with content-script.
 *
 * This function will be inlined as page script.
 * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/203
 *
 * WebSocket wrapper implementation is based on:
 * https://github.com/gorhill/uBO-WebSocket
 */
var overrideWebSocket = function () {

    var postMessage = window.postMessage;
    var addEventListener = window.addEventListener;

    'use strict';
    var Wrapped = window.WebSocket;
    var map = new WeakMap();

    /**
     * Finalizes websocket creation.
     * Original websocket opens connection to specified url,
     * but this wrapped will block it if the flag is false.
     *
     * @param wrapper
     * @param blockConnection block connection flag
     */
    var initConnection = function (wrapper, blockConnection) {

        var wrappedWebSocket = map.get(wrapper);
        if (blockConnection) {
            if (wrappedWebSocket.properties.onerror) {
                wrappedWebSocket.properties.onerror(new window.ErrorEvent('error'));
            }

            return;
        }

        var wrapped = null;
        try {
            wrapped = new Wrapped(wrappedWebSocket.args.url, wrappedWebSocket.args.protocols);
        } catch (ex) {
            console.error(ex);
        }

        if (wrapped === null) {
            return;
        }

        for (var p in wrappedWebSocket.properties) {
            wrapped[p] = wrappedWebSocket.properties[p];
        }
        for (var i = 0, l; i < wrappedWebSocket.listeners.length; i++) {
            l = wrappedWebSocket.listeners[i];
            wrapped.addEventListener(l.ev, l.cb, l.fl);
        }

        map.set(wrapper, wrapped);
    };

    /**
     * Dummy function
     */
    var emptyFunction = function () {};

    /**
     * Get property value from wrapped instance
     *
     * @param wrapper
     * @param prop
     * @param defaultValue
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
     * Set property value for wrapped instance
     *
     * @param wrapper
     * @param prop
     * @param value
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
     * Fake websocket constructor
     *
     * @param url
     * @param protocols
     * @constructor
     */
    var WebSocket = function (url, protocols) {
        'native';
        if (window.location.protocol === 'https:'
            && url.lastIndexOf('ws:', 0) === 0) {
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

        map.set(this, {
            args: {url: url, protocols: protocols},
            listeners: [],
            properties: {}
        });


        var that = this;
        function messageListener(event) {
            if (!(event.data.direction &&
                event.data.direction == "to-page-script@adguard" &&
                event.data.elementUrl == url &&
                event.data.documentUrl == document.URL)) {
                return;
            }

            initConnection(that, event.data.collapse);
        }

        addEventListener.call(window, "message", messageListener, false);

        // Send a message to the background page to check if the request should be blocked
        postMessage.call(window, {
            direction: 'from-page-script@adguard',
            elementUrl: url,
            documentUrl: document.URL
        }, "*");

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
};

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
        type: 'processShouldCollapse',
        elementUrl: event.data.elementUrl,
        documentUrl: event.data.documentUrl,
        requestType: "SUBDOCUMENT",
        requestId: 0
    };

    contentPage.sendMessage(message, function (response) {
        if (!response) {
            return;
        }

        event.source.postMessage({
            direction: 'to-page-script@adguard',
            elementUrl: event.data.elementUrl,
            documentUrl: event.data.documentUrl,
            collapse: response.collapse
        }, event.origin);
    });
}

window.addEventListener("message", pageMessageListener, false);