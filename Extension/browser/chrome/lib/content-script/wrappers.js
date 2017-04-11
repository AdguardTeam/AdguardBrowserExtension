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

/* global contentPage */

/**
 * Function for injecting some helper API into page context, that is used by request wrappers.
 *
 * @param injectApi Object for exposing API (messaging and objects wrapping)
 */
var injectPageScriptAPI = function (injectApi) { // jshint ignore:line

    'use strict';

    /**
     * Sends a message to the content-script to check if request should be allowed or not.
     */
    var messageChannel = (function () {

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
        var onMessageReceived = function (event) {

            if (!event.data || !event.data.direction || event.data.direction !== "to-page-script@adguard") {
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
         * @param url                The URL to which wrapped object is willing to connect
         * @param requestType        Request type ( WEBSOCKET or WEBRTC)
         * @param wrapper            WebSocket wrapper instance
         * @param onResponseReceived Called when response is received
         */
        var sendMessage = function (url, requestType, wrapper, onResponseReceived) {

            if (currentRequestId === 0) {
                // Subscribe to response when this method is called for the first time
                addEventListener.call(window, "message", onMessageReceived, false);
            }

            var requestId = ++currentRequestId;
            requestsMap[requestId] = {
                wrapper: wrapper,
                onResponseReceived: onResponseReceived
            };

            var message = {
                requestId: requestId,
                direction: 'from-page-script@adguard',
                elementUrl: url,
                documentUrl: document.URL,
                requestType: requestType
            };

            // Send a message to the background page to check if the request should be blocked
            postMessage.call(window, message, "*");
        };

        return {
            sendMessage: sendMessage
        };

    })();

    /**
     * Defines properties in destination object
     * @param src Source object
     * @param dest Destination object
     * @param properties Properties to copy
     */
    injectApi.copyProperties = function (src, dest, properties) {
        for (var i = 0; i < properties.length; i++) {
            var prop = properties[i];
            Object.defineProperty(dest, prop, Object.getOwnPropertyDescriptor(src, prop));
        }
    };

    /**
     * Check request by sending message to content script
     * @param url URL to block
     * @param type Request type
     * @param callback Result callback
     */
    injectApi.checkRequest = function (url, type, callback) {
        messageChannel.sendMessage(url, type, this, function (wrapper, blockConnection) {
            callback(blockConnection);
        });
    };
};

/**
 * The function overrides window.WebSocket with our wrapper, that will check url with filters through messaging with content-script.
 *
 * IMPORTANT NOTE:
 * This function is first loaded as a content script. The only purpose of it is to call
 * the "toString" method and use resulting string as a text content for injected script.
 */
var overrideWebSocket = function (injectApi) { // jshint ignore:line

    'use strict';

    if (!(window.WebSocket instanceof Function)) {
        return false;
    }

    /**
     * WebSocket wrapper implementation.
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/349
     *
     * Based on:
     * https://github.com/adblockplus/adblockpluschrome/commit/457a336ee55a433217c3ffe5d363e5c6980f26f4
     */

    /**
     * As far as possible we must track everything we use that could be sabotaged by the website later in order to circumvent us.
     */
    var RealWebSocket = WebSocket;
    var closeWebSocket = Function.prototype.call.bind(RealWebSocket.prototype.close);

    function WrappedWebSocket(url, protocols) {
        // Throw correct exceptions if the constructor is used improperly.
        if (!(this instanceof WrappedWebSocket)) {
            return RealWebSocket();
        }
        if (arguments.length < 1) {
            return new RealWebSocket();
        }

        var websocket = new RealWebSocket(url, protocols);

        // This is the key point: checking if this WS should be blocked or not
        // Don't forget that the type of 'websocket.url' is String, but 'url 'parameter might have another type.
        injectApi.checkRequest(websocket.url, 'WEBSOCKET', function (blocked) {
            if (blocked) {
                closeWebSocket(websocket);
            }
        });

        return websocket;
    }

    // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/488
    WrappedWebSocket.prototype = RealWebSocket.prototype;
    window.WebSocket = WrappedWebSocket.bind();

    injectApi.copyProperties(RealWebSocket, WebSocket, ["CONNECTING", "OPEN", "CLOSING", "CLOSED", "name", "prototype"]);

    RealWebSocket.prototype.constructor = WebSocket;
};

/**
 * The function overrides window.RTCPeerConnection with our wrapper, that will check ice servers URLs with filters through messaging with content-script.
 *
 * IMPORTANT NOTE:
 * This function is first loaded as a content script. The only purpose of it is to call
 * the "toString" method and use resulting string as a text content for injected script.
 */
var overrideWebRTC = function (injectApi) { // jshint ignore:line

    'use strict';

    if (!(window.RTCPeerConnection instanceof Function) &&
        !(window.webkitRTCPeerConnection instanceof Function)) {
        return;
    }

    /**
     * RTCPeerConnection wrapper implementation.
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/588
     *
     * Based on:
     * https://github.com/adblockplus/adblockpluschrome/commit/af0585137be19011eace1cf68bf61eed2e6db974
     *
     * Chromium webRequest API doesn't allow the blocking of WebRTC connections
     * https://bugs.chromium.org/p/chromium/issues/detail?id=707683
     */

    var RealRTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
    var closeRTCPeerConnection = Function.prototype.call.bind(RealRTCPeerConnection.prototype.close);
    var RealArray = Array;

    /**
     * Check each URL of ice server in configuration for blocking.
     *
     * @param connection RTCPeerConnection
     * @param configuration Configuration for RTCPeerConnection
     * https://developer.mozilla.org/en-US/docs/Web/API/RTCConfiguration
     */
    function checkConfiguration(connection, configuration) {

        function checkWebRTCRequest(url) {
            injectApi.checkRequest(url, 'WEBRTC', function (blocked) {
                if (blocked) {
                    try {
                        closeRTCPeerConnection(connection);
                    } catch (e) {
                        // Ignore exceptions
                    }
                }
            });
        }

        if (!configuration || !configuration.iceServers) {
            return;
        }

        var iceServers = configuration.iceServers;
        for (var i = 0; i < iceServers.length; i++) {

            var iceServer = iceServers[i];
            if (!iceServer || !iceServer.urls) {
                continue;
            }

            var urls = iceServer.urls;
            // RTCPeerConnection doesn't seem to iterate through pseudo Arrays.
            if (!(urls instanceof RealArray)) {
                urls = [urls];
            }

            for (var j = 0; j < urls.length; j++) {
                var url = urls[j];
                // RTCPeerConnection also calls the url's .toString method.
                if (typeof url !== 'string') {
                    url = url.toString();
                }
                checkWebRTCRequest(url);
            }
        }
    }

    /**
     * Overrides setConfiguration method
     * https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/setConfiguration
     */
    if (RealRTCPeerConnection.prototype.setConfiguration) {

        var realSetConfiguration = Function.prototype.call.bind(RealRTCPeerConnection.prototype.setConfiguration);

        RealRTCPeerConnection.prototype.setConfiguration = function (configuration) {
            // Call the real method first, so that validates the configuration
            realSetConfiguration(this, configuration);
            checkConfiguration(this, configuration);
        };
    }

    function WrappedRTCPeerConnection(config) {

        if (!(this instanceof WrappedRTCPeerConnection)) {
            return RealRTCPeerConnection();
        }

        var connection = new RealRTCPeerConnection(config);
        checkConfiguration(connection, config);
        return connection;
    }

    WrappedRTCPeerConnection.prototype = RealRTCPeerConnection.prototype;

    var boundWrappedRTCPeerConnection = WrappedRTCPeerConnection.bind();
    injectApi.copyProperties(RealRTCPeerConnection, boundWrappedRTCPeerConnection, ["caller", "generateCertificate", "name", "prototype"]);
    RealRTCPeerConnection.prototype.constructor = boundWrappedRTCPeerConnection;

    if ("RTCPeerConnection" in window) {
        window.RTCPeerConnection = boundWrappedRTCPeerConnection;
    }
    if ("webkitRTCPeerConnection" in window) {
        window.webkitRTCPeerConnection = boundWrappedRTCPeerConnection;
    }
};

/**
 * This function is executed in the content script. It starts listening to events from the page script and passes them further to the background page.
 */
var initPageMessageListener = function () { // jshint ignore:line

    'use strict';

    /**
     * Listener for websocket wrapper messages.
     *
     * @param event
     */
    function pageMessageListener(event) {
        if (!(event.source === window &&
            event.data.direction &&
            event.data.direction === "from-page-script@adguard" &&
            event.data.elementUrl &&
            event.data.documentUrl)) {
            return;
        }

        var message = {
            type: 'checkPageScriptWrapperRequest',
            elementUrl: event.data.elementUrl,
            documentUrl: event.data.documentUrl,
            requestType: event.data.requestType,
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
                requestType: event.data.requestType,
                requestId: response.requestId,
                block: response.block
            };

            event.source.postMessage(message, event.origin);
        });
    }

    window.addEventListener("message", pageMessageListener, false);
};