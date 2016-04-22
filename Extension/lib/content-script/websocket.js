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
    console.log('loading ws implementation');

    function FakeWebSocket(server, protocol) {
        console.log('WS init: ' + server + ' ' + protocol);

        this.readyState = 0; // CONNECTING

        // Send a message to the background page to check if the request should be blocked
        //var message = {
        //    type: 'processShouldCollapse',
        //    elementUrl: server,
        //    documentUrl: document.URL,
        //    requestType: "SUBDOCUMENT",
        //    requestId: 0
        //};
        //
        //console.log(message);
        //
        //contentPage.sendMessage(message, function (response) {
        //    console.log(response);
        //});

        //spyOn(this, 'send');
        var that = this;
        setTimeout(function () {
            that.readyState = 1; // OPEN
            if (that.onopen) {
                that.onopen();
            }
        }, 0);
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

        // Useful testing functions
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

    console.log('loading ws implementation done');


    //TODO: Remove debugging
    console.log('Trying to send message..');

    if (true) {
        var exampleSocket = new window.WebSocket('ws://wsp.marketgid.com:8040/ws');
        exampleSocket.send("Here's some text that the server is urgently awaiting!");
    }

    console.log('Message send');
};