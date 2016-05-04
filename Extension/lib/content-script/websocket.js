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

var overrideWebSocket = function () {

    'use strict';
    var Wrapped = window.WebSocket;
    var toWrapped = new WeakMap();
    var onResponseReceived = function (wrapper, ok) {

        var bag = toWrapped.get(wrapper);
        if (!ok) {
            if (bag.properties.onerror) {
                bag.properties.onerror(new window.ErrorEvent('error'));
            }
            return;
        }
        var wrapped = null;
        try {
            wrapped = new Wrapped(bag.args.url, bag.args.protocols);
        } catch (ex) {
            console.error(ex.toString());
        }
        if (wrapped === null) {
            return;
        }
        for (var p in bag.properties) {
            wrapped[p] = bag.properties[p];
        }
        for (var i = 0, l; i < bag.listeners.length; i++) {
            l = bag.listeners[i];
            wrapped.addEventListener(l.ev, l.cb, l.fl);
        }
        toWrapped.set(wrapper, wrapped);
    };
    var noopfn = function () {
    };
    var fallthruGet = function (wrapper, prop, value) {
        var wrapped = toWrapped.get(wrapper);
        if (!wrapped) {
            return value;
        }
        if (wrapped instanceof Wrapped) {
            return wrapped[prop];
        }
        return wrapped.properties.hasOwnProperty(prop) ?
            wrapped.properties[prop] :
            value;
    };
    var fallthruSet = function (wrapper, prop, value) {
        if (value instanceof Function) {
            value = value.bind(wrapper);
        }
        var wrapped = toWrapped.get(wrapper);
        if (!wrapped) {
            return;
        }
        if (wrapped instanceof Wrapped) {
            wrapped[prop] = value;
        } else {
            wrapped.properties[prop] = value;
        }
    };
    var WebSocket = function (url, protocols) {
        'native';
        if (
            window.location.protocol === 'https:' &&
            url.lastIndexOf('ws:', 0) === 0
        ) {
            var ws = new Wrapped(url, protocols);
            if (ws) {
                ws.close();
            }
        }
        Object.defineProperties(this, {
            'binaryType': {
                get: function () {
                    return fallthruGet(this, 'binaryType', 'blob');
                },
                set: function (value) {
                    fallthruSet(this, 'binaryType', value);
                }
            },
            'bufferedAmount': {
                get: function () {
                    return fallthruGet(this, 'bufferedAmount', 0);
                },
                set: noopfn
            },
            'extensions': {
                get: function () {
                    return fallthruGet(this, 'extensions', '');
                },
                set: noopfn
            },
            'onclose': {
                get: function () {
                    return fallthruGet(this, 'onclose', null);
                },
                set: function (value) {
                    fallthruSet(this, 'onclose', value);
                }
            },
            'onerror': {
                get: function () {
                    return fallthruGet(this, 'onerror', null);
                },
                set: function (value) {
                    fallthruSet(this, 'onerror', value);
                }
            },
            'onmessage': {
                get: function () {
                    return fallthruGet(this, 'onmessage', null);
                },
                set: function (value) {
                    fallthruSet(this, 'onmessage', value);
                }
            },
            'onopen': {
                get: function () {
                    return fallthruGet(this, 'onopen', null);
                },
                set: function (value) {
                    fallthruSet(this, 'onopen', value);
                }
            },
            'protocol': {
                get: function () {
                    return fallthruGet(this, 'protocol', '');
                },
                set: noopfn
            },
            'readyState': {
                get: function () {
                    return fallthruGet(this, 'readyState', 0);
                },
                set: noopfn
            },
            'url': {
                get: function () {
                    return fallthruGet(this, 'url', '');
                },
                set: noopfn
            }
        });
        toWrapped.set(this, {
            args: {url: url, protocols: protocols},
            listeners: [],
            properties: {}
        });

        var that = this;

        function messageListener(event) {
            if (!(event.data.direction &&
                event.data.direction == "to-page-script" &&
                event.data.elementUrl == url &&
                event.data.documentUrl == document.URL)) {
                return;
            }

            onResponseReceived(that, !event.data.collapse)
        }

        window.addEventListener("message", messageListener, false);

        var message = {
            direction: 'from-page-script',
            elementUrl: url,
            documentUrl: document.URL
        };

        // Send a message to the background page to check if the request should be blocked
        window.postMessage(message, "*");

    };

    WebSocket.prototype = Object.create(window.EventTarget.prototype, {
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
                var wrapped = toWrapped.get(this);
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
                var wrapped = toWrapped.get(this);
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
                var wrapped = toWrapped.get(this);
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
    if (me && me.parentNode !== null) {
        me.parentNode.removeChild(me);
    }

};


function pageMessageListener(event) {
    if (!(event.source == window &&
        event.data.direction &&
        event.data.direction == "from-page-script" &&
        event.data.elementUrl &&
        event.data.documentUrl)) {
        return;
    }

    console.log('Received message:' + event.data);

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
            direction: 'to-page-script',
            elementUrl: event.data.elementUrl,
            documentUrl: event.data.documentUrl,
            collapse: response.collapse
        }, event.origin);
    });
}

window.addEventListener("message", pageMessageListener, false);