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

    function FakeWebSocket(server, protocol) {
        this.readyState = 0; // CONNECTING
        var that = this;

        function messageListener(event) {
            if (!(event.data.direction &&
                event.data.direction == "to-page-script" &&
                event.data.elementUrl == server &&
                event.data.documentUrl == document.URL)) {
                return;
            }

            setTimeout(function () {
                if (event.data.collapse == true) {
                    that.readyState = 3; // CLOSED
                    if (that.onerror) {
                        that.onerror();
                    }
                } else {
                    that.readyState = 1; // OPEN
                    if (that.onopen) {
                        that.onopen();
                    }
                }
            }, 0);

        }

        window.addEventListener("message", messageListener, false);

        var message = {
            direction: 'from-page-script',
            elementUrl: server,
            documentUrl: document.URL
        };

        // Send a message to the background page to check if the request should be blocked
        window.postMessage(message, "*");
    }

    FakeWebSocket.prototype = {
        send: function () {},
        close: function () {
            var that = this;
            setTimeout(function () {
                that.readyState = 3; // CLOSED
                if (that.onclose) that.onclose({code: 3});
            }, 0);
        },

        receiveMessage: function (msg) {
            if (this.onmessage) this.onmessage({data: msg});
        },
        causeError: function (e) {
            if (this.onerror) this.onerror(e);
        }
    };
    FakeWebSocket.CONNECTING = 0;
    FakeWebSocket.OPEN = 1;
    FakeWebSocket.CLOSED = 3;
    FakeWebSocket.orig = window.WebSocket;

    window.WebSocket = FakeWebSocket;
};